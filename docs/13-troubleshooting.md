# 트러블슈팅 기록

이 문서는 오류 목록이 아니라 **관측 → 진단 → 수정 → 검증 → 재발 방지**의 판단 근거를 남깁니다. 저장소·AWS·사용자 기기에서 확인한 결과를 구분하며, 존재하지 않는 과거 Issue나 PR 링크를 사후에 만들지 않습니다.

## 대표 사례 빠르게 보기

| 사례                                                               | 기술적으로 보여주는 내용                                      | 미확인 범위              |
| ------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------ |
| [다나와 조회 무응답](#2026-09-01-다나와-조회-무응답)               | 분산 timeout budget, 예외가 무응답으로 보이는 failure mapping | 수정 후 Android 재확인   |
| [HTTP 200이지만 답장 없음](#12-http-200인데-reply가-비어-있음)     | API 성공과 device E2E 분리, room contract 진단                | 단말별 환경 차이         |
| [두 번째 방 무응답](#13-방-하나는-되지만-다른-오픈채팅방은-무응답) | allow-list와 runtime payload 불일치, 실제 식별자 검증         | Android 재시작·알림 권한 |
| [AWS SSO 만료](#10-sso-세션-만료)                                  | 자격증명 수명주기와 배포 중단 원칙                            | 재인증 전 plan/apply     |

## 새 기록 템플릿

새 장애는 아래 형식을 복사합니다. 확인하지 않은 항목은 `미관측` 또는 `해당 없음`으로 남기며 추측으로 채우지 않습니다.

```markdown
## YYYY-MM-DD 짧은 제목

### 증상과 영향

### 안전하게 비식별화한 재현 절차·증거

### 진단 과정과 기각한 가설

### 근본 원인

### 수정과 설계 판단

### 검증

- Repository:
- AWS-observed:
- Android/KakaoTalk:

### 재발 방지와 잔여 위험

### 추적 링크

- Issue: 해당 없음
- PR: 해당 없음
- Commit: 해당 없음
- Deployment: 해당 없음
```

새 작업은 [Issue・PR・리뷰 운영](21-development-workflow.md)에 따라 Issue와 PR을 연결합니다. 단, 비밀값·실제 방 이름·사용자 식별정보·대화 원문·비식별화되지 않은 화면은 기록하지 않습니다.

## 2026-09-01 PR #9 `verify` 연속 실패

### 증상과 영향

[PR #9](https://github.com/ekseh93/kakao-maple-bot/pull/9)의 push와 pull request 이벤트에서 실행된 `checks/verify`가 모두 `pnpm format:check` 단계에서 중단됐습니다. 이후 test·build 단계는 실행되지 않아 merge 조건을 충족할 수 없었습니다.

### 재현 증거와 진단

[실패한 GitHub Actions run](https://github.com/ekseh93/kakao-maple-bot/actions/runs/33514180736)은 다음 4개 파일을 동일하게 지목했습니다.

- `apps/lambda/src/index.ts`
- `packages/core/src/index.ts`
- `packages/core/src/pc-deals.ts`
- `packages/providers/src/index.ts`

처음에는 Windows 작업 트리의 CRLF 경고로 추정했지만, Prettier 적용 전후 diff를 확인한 결과 긴 문자열·객체·조건식의 실제 포맷 불일치도 있었습니다. 따라서 줄바꿈 문제만으로 단정한 초기 가설을 기각했습니다.

### 근본 원인과 수정

기준 branch에 PC/Danawa 기능이 추가될 때 위 4개 TypeScript 파일이 저장소의 Prettier 결과와 일치하지 않았고, 이 PR이 해당 기준선 문제를 처음 원격 CI에서 다시 드러냈습니다. 동작은 변경하지 않고 동일 Prettier 버전으로 4개 파일을 포맷했습니다.

### 검증과 잔여 범위

- Repository local: 포맷 후 전체 `format:check`, policy, audit, lint, typecheck, 186 tests, build, Lambda dry-run 재실행
- GitHub Actions: 수정 commit push 후 재실행 결과를 PR에 기록
- AWS-observed: 해당 없음—runtime 동작 변경 없음
- Android/KakaoTalk: 해당 없음—relay 동작 변경 없음

추적: [Issue #8](https://github.com/ekseh93/kakao-maple-bot/issues/8) · [PR #9](https://github.com/ekseh93/kakao-maple-bot/pull/9)

### 두 번째 실패: secret scan 자기 참조

포맷 수정 후 실행은 test·build·Lambda dry-run까지 통과했지만 마지막 secret scan에서 실패했습니다. 로그를 확인하니 실제 secret이 아니라 `.github/workflows/checks.yml` 안에 검사 규칙으로 작성된 `Bearer` 정규식 자체를 `git grep`이 다시 탐지했습니다.

workflow만 제외해 다시 검사하자 공개용 phone relay의 안전한 `REPLACE_WITH_SECRET` placeholder도 탐지되었습니다. 제외 경로를 계속 늘리지 않고 `scripts/secret-check.mjs`로 검사를 분리했습니다. 이 검사는 Git 추적 파일만 읽고, 알려진 placeholder를 허용하며, 문제가 있더라도 실제 값 대신 파일·줄·규칙 이름만 출력합니다.

- Repository local: 전체 자동 검사와 `pnpm secret:check`의 placeholder·자기 참조 처리 확인
- GitHub Actions: 수정 commit push 후 세 번째 실행 결과를 PR에 기록
- 실제 secret 발견: 없음

## 2026-09-01 다나와 조회 무응답

### 증상

카카오톡에서 `!다나와최저가 rtx5070` 또는 `!다나와최저가 5070`을 입력해도 응답이 없었습니다. 같은 시점에 `!도움말`은 정상 응답했습니다.

### 원인과 조치

ECS Adapter와 MCP 조회 자체는 정상이나, Lambda provider 제한 3초와 MessengerBot R 릴레이 HTTP 제한 4.5초가 첫 외부 가격 조회 지연보다 짧았습니다. 예외 응답을 릴레이가 조용히 무시해 사용자에게 먹통처럼 보였습니다. 다나와 도구 호출 제한을 8초로 분리하고, 메시지 릴레이 제한을 15초로 늘렸습니다. 공지·상태 polling 제한은 4.5초를 유지합니다.

### 검증

- ECS `/health` HTTP 200 확인
- ECS `/v1/tool`에서 `rtx5070`, `5070` 최저가 응답 확인
- Lambda `/v1/messages`에서 두 명령어의 `[다나와 최저가]` 응답 확인
- 이후 공기계 MessengerBot R 재컴파일·재실행 후 카카오톡에서 재확인이 필요합니다.

## 2026-09-01 명령어별 도움말·다나와·날씨 개선

### 증상

- `!견적 300만원`, `!운세 931201 남성`, `!메카베리 300`처럼 인자가 부족하거나 잘못된 경우 모두 `사용법을 확인해 주세요.`만 출력되었습니다.
- `!명령어 도움말` 형식과 다나와 명령어 전체 안내가 없었습니다.
- 날씨 조회 때 같은 도시도 매번 지오코딩 요청이 발생했습니다.

### 원인과 조치

- Lambda의 `INVALID_USAGE` 오류를 `CommandName`별 사용법·예시 맵으로 연결했습니다. 이제 `!명령어 도움말`과 `!명령어 help`도 같은 안내를 반환합니다.
- `!다나와 도움말`을 추가해 `!다나와견적`, `!다나와부품`, `!다나와최저가`, `!다나와가격비교`, `!다나와가격이력`, `!다나와부품상세`, `!다나와호환성`을 한 번에 안내합니다.
- 날씨 HTML 크롤링을 추가하지 않고 Open-Meteo의 전 세계 Geocoding·Forecast·Air Quality API를 유지했습니다. Lambda warm 실행에서는 지오코딩 좌표를 1시간 캐시해 반복 조회의 요청 수와 지연을 줄였습니다.

### 검증·배포 기록

- 자동 테스트 186개, TypeScript 빌드, Lambda 패키징을 통과했습니다.
- 실제 API에서 `!다나와 도움말`, `!날씨 도쿄`, 명령어별 도움말 응답을 확인했습니다.
- Lambda Version 11을 배포했고 GitHub 커밋 `390db29`에 문서·다나와·날씨 개선을 기록했습니다.

### 운영 기록 규칙

- 이후 기능 배포마다 `docs/14-change-log.md`에 변경 내용과 검증 결과를 추가합니다.
- 장애나 사용자 문의가 있으면 이 문서에 증상·원인·조치·미확인 범위를 기록합니다.
- Git 커밋 메시지는 `type: short reason` 형식으로 작성하고, 배포 답변에는 커밋 이유를 한 줄로 함께 남깁니다.

이 문서는 AWS 전환·공기계 연동 과정에서 실제로 관찰한 오류와 해결 결과를 구현 변경과 분리해 기록합니다. 비밀값·카카오톡 대화 원문·개인 식별 정보는 기록하지 않습니다. 날짜는 2026-08-28 기준입니다.

## 구현 변경

### 1. Cloudflare Worker에서 AWS Lambda로 전환

- 변경: `apps/worker`를 `apps/lambda`로 변경하고 Lambda handler를 추가했습니다.
- 이유: AWS 서버리스·IAM·API Gateway 경험을 포트폴리오에 남기기 위해서입니다.
- 제한: Maple.GG와 Maplescouter에는 계속 링크만 생성하며 자동 HTTP 접근을 하지 않습니다.

### 2. SAM 템플릿에서 순수 CloudFormation으로 전환

- 변경: `AWS::Serverless::Function`과 `CodeUri`를 제거했습니다.
- 추가: Lambda, IAM execution role, API Gateway HTTP API, routes, stage, invoke permission을 명시했습니다.
- 이유: SAM CLI 없이 AWS CLI와 CloudFormation만으로 패키징·업로드·배포할 수 있게 하기 위해서입니다.

### 3. AWS CLI 배포 흐름 추가

- `pnpm lambda:dry-run`: TypeScript 빌드와 esbuild ESM 번들
- `pnpm lambda:package`: `bundle.js`와 ESM `package.json`을 Lambda ZIP으로 생성
- `pnpm lambda:deploy`: 현재 AWS 주체 확인 → S3 업로드 → CloudFormation deploy
- 안전장치: `DEPLOY_CONFIRMATION=I_APPROVE_AWS_DEPLOYMENT`가 없으면 중단하고, root 계정은 `ALLOW_ROOT_DEPLOY=true` 없이는 거부합니다.

## 오류와 해결

### 0. Codex 터미널에서 `node`를 찾지 못함

증상:

```text
'node' is not recognized as an internal or external command
```

원인: 데스크톱 작업 터미널의 PATH에 저장소가 사용하는 번들 Node.js 실행 경로가 포함되지 않았습니다.

해결: Codex 작업공간 의존성 정보를 읽어 제공된 Node.js와 pnpm 디렉터리를 현재 PowerShell 세션의 PATH 앞에 추가한 뒤 동일한 테스트·타입 검사를 다시 실행했습니다. 시스템 전역 Node.js 설치나 저장소 설정은 변경하지 않았습니다.

### 1. `sam` 용어를 찾을 수 없음

증상:

```text
sam : 'sam' 용어가 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다.
```

원인: AWS SAM CLI가 설치되지 않았거나 PATH에 등록되지 않았습니다.

해결: SAM CLI 설치를 필수로 만들지 않고, AWS CLI + 순수 CloudFormation 방식으로 전환했습니다. `aws cloudformation validate-template`는 SAM CLI 없이 통과했습니다.

### 2. esbuild 번들 handler가 함수로 노출되지 않음

원인: ESM 프로젝트에서 esbuild 기본 CommonJS 출력과 Node.js ESM 해석이 충돌했습니다.

해결: `--format=esm`을 지정하고 Lambda ZIP에 `package.json`의 `{"type":"module"}`을 포함했습니다. 번들 `/health` 실행 결과는 상태 코드 200입니다.

### 3. root 계정으로 AWS CLI가 인증됨

관찰 결과 `arn:aws:iam::<account>:root`였습니다.

해결: 배포 스크립트가 root 계정 배포를 기본 거부하도록 했습니다. IAM 사용자 또는 역할로 전환한 뒤 배포해야 합니다. root 예외 플래그를 임의로 활성화하지 않습니다.

### 4. SAM CLI 검증 불가

SAM CLI가 설치되지 않아 `sam validate`는 실행할 수 없었습니다. 대신 AWS CLI로 다음 정적 검증을 실행했고 통과했습니다.

```powershell
aws cloudformation validate-template --template-body file://apps/lambda/template.yaml --region ap-northeast-1
```

### 5. Terraform plan에서 AWS 자격 증명을 찾지 못함

증상:

```text
Error: No valid credential sources found
```

원인: AWS CLI의 로그인 세션이 만료되었거나 Terraform이 사용할 AWS 프로필이 지정되지 않았습니다.

해결: `aws sso login --profile <profile>` 또는 `aws login`으로 재인증하고, 필요한 경우 `$env:AWS_PROFILE`을 지정합니다. 자격 증명을 저장소 파일이나 `terraform.tfvars`에 커밋하지 않습니다. 이 오류가 발생한 상태에서는 Terraform `plan`과 `apply`를 실행하지 않습니다.

### 6. IAM Identity Center 사용자·권한 세트 준비

Terraform 배포용 프로젝트 전용 사용자를 IAM Identity Center에 만들고, `KakaoMapleDeveloper` 권한 세트를 계정에 할당했습니다. 권한 세트 정책은 `kakao-maple-bot-*` 이름으로 제한된 Lambda와 IAM 역할, API Gateway 관리 권한만 포함합니다.

CLI에서는 다음 순서로 해당 사용자의 AWS access portal 인증을 완료합니다.

```powershell
aws configure sso
aws sso login --profile kakao-maple
$env:AWS_PROFILE = "kakao-maple"
aws sts get-caller-identity
```

`get-caller-identity` 결과가 root ARN이면 Terraform을 실행하지 않고 SSO 프로필을 다시 선택합니다. 브라우저에서 사용자의 초기 비밀번호 설정과 MFA 정책이 요구될 수 있습니다.

### 7. 리전이 다른 값으로 설정되는 문제

이 프로젝트는 도쿄 리전(`ap-northeast-1`)만 허용합니다. Terraform의 `aws_region` 변수에 다른 값을 넣으면 validation 단계에서 중단되며, AWS CLI 배포 스크립트도 CloudFormation·S3·STS 요청에 도쿄 리전을 강제합니다. 사용자의 거주 지역과 비용 관리 범위를 문서화하기 위한 정책입니다.

### 8. Terraform이 `Too many command line arguments`를 반환

증상:

```text
Error: Too many command line arguments
```

원인: Terraform 프로젝트 디렉터리가 아닌 `System32`, 저장소 루트 또는 잘못된 경로에서 실행했거나, `-var-file` 인자를 현재 셸에서 파일명과 분리해 해석한 경우입니다.

해결:

```powershell
Set-Location "C:\path\to\채팅 봇\infra\terraform"
terraform plan -var-file="terraform.tfvars"
```

또는 저장소 루트에서 전역 `-chdir`를 사용합니다.

```powershell
terraform -chdir="C:\path\to\채팅 봇\infra\terraform" plan -var-file="terraform.tfvars"
```

`terraform.tfvars`는 `.gitignore` 대상이며, `terraform.tfvars.example`를 복사해 로컬에서만 작성합니다.

### 9. AWS SSO 프로필 이름 불일치

증상:

```text
The config profile (kakao-maple) could not be found
```

원인: `aws configure sso`에서 저장한 프로필과 `aws sso login --profile`에 입력한 프로필 이름이 달랐습니다.

해결: 설정 완료 화면에 표시된 정확한 프로필 이름을 사용합니다. 이 프로젝트의 예시는 `kakao-maple-bot`입니다.

```powershell
aws sso login --profile kakao-maple-bot
aws sts get-caller-identity --profile kakao-maple-bot
```

SSO 결과가 `assumed-role/AWSReservedSSO_...`이면 역할 기반 인증이 된 상태입니다. root ARN은 배포용 인증으로 사용하지 않습니다.

### 10. SSO 세션 만료

증상:

```text
failed to refresh cached credentials
The SSO session has expired or is invalid
```

해결: 새 배포마다 같은 프로필로 `aws sso login`을 다시 실행하고, `get-caller-identity`가 도쿄 계정의 권한 역할을 반환하는지 확인합니다. SSO 만료는 이미 배포된 Lambda를 자동으로 중지시키는 것이 아니라, 로컬 CLI의 다음 AWS 작업을 막는 인증 문제입니다.

### 11. MessengerBot R 컴파일 오류

관찰된 오류:

- `Trailing comma is not legal in an ECMA-262 object initializer`
- `invalid object initializer`
- `missing } after function body`
- `BotManager is not defined`

원인: MessengerBot R 레거시 엔진에서 객체 마지막 trailing comma·Markdown 코드 펜스·누락된 중괄호를 그대로 붙여 넣었거나, API2 전용 `BotManager` 코드를 레거시 `response(room, msg, ...)` 스크립트에 섞었습니다.

해결: 저장소의 `apps/phone-relay/bot.js`는 레거시 콜백 전용 순수 JavaScript로 유지하고, Markdown 코드 펜스 표시는 제거한 뒤 파일 전체를 복사합니다. 마지막 객체 속성 뒤 쉼표를 넣지 않고 `node --check apps/phone-relay/bot.js` 또는 MessengerBot R 컴파일로 확인합니다. API2 코드는 별도 호환 스크립트로 취급하며 레거시 파일에 함께 붙이지 않습니다.

### 12. HTTP 200인데 reply가 비어 있음

증상:

```text
HTTP 200이지만 응답 내용이 없습니다.
```

원인: 릴레이가 보낸 `roomId`가 Lambda의 `ALLOWED_ROOMS`와 일치하지 않았습니다. 특히 레거시 오픈채팅 콜백에서 `room`이 실제 방 이름이 아니라 발신자 이름처럼 전달되는 사례가 있었습니다.

해결: 한 개 방을 사용하는 경우 릴레이의 비공개 설정에 `fixedRoomName`을 실제 동의한 방 이름으로 넣고, Terraform의 `allowed_rooms`와 동일하게 맞춥니다. 저장소 공개 파일에는 방 이름을 넣지 않습니다. `!방테스트`는 진단용이며, `isGroupChat=false`만으로 오픈채팅 여부를 판정하지 않습니다.

배포 smoke test에서 AWS CLI의 Lambda 환경변수 JSON을 PowerShell 파이프로 읽어 한글 허용 방을 재사용하면, 콘솔 인코딩에 따라 방 이름이 손상되어 같은 증상이 날 수 있습니다. 이번 `!보스수익` 배포에서는 Git에서 제외된 `terraform.tfvars`를 명시적으로 UTF-8로 읽고 값을 출력하지 않은 채 요청에 사용해 실제 reply를 확인했습니다. 진단 과정에서도 허용 방과 secret 원문은 콘솔·문서에 출력하지 않습니다.

### 13. 방 하나는 되지만 다른 오픈채팅방은 무응답

원인: MessengerBot R 레거시 콜백의 `room` 값과 카카오톡 오픈채팅 표시명이 환경별로 다를 수 있습니다. `Api.replyRoom`도 앱 버전·권한에 따라 안정적인 방 식별자를 보장하지 않습니다.

해결: 현재 레거시 경로는 동의된 단일 방을 `fixedRoomName`으로 고정하는 제한적 호환 방식입니다. 여러 오픈채팅방을 안정적으로 운영하려면 실제 `channelId`를 제공하는 API2 호환 환경과 별도 어댑터가 필요합니다. 방 이름을 무작정 늘리거나 발신자 닉네임을 허용 목록에 넣는 방식은 사용하지 않습니다.

### 14. 공개 게시판 명령의 외부 응답 오류

`!핫딜`, `!모니터`, `!일본여행기`, `!일본음식점`, `!만화` 등은 외부 사이트의 구조 변경·429·403·일시 장애에 영향을 받습니다. 정상 결과는 캐시하고, 허용된 stale fallback이 있으면 마지막 정상 결과를 표시하며, 없으면 표준 외부 서비스 오류를 반환합니다. `!핫딜`은 퀘이사존·아카라이브·에펨코리아를 사이트별 파서로 조회하고, 한 사이트의 실패가 다른 사이트 결과를 막지 않도록 분리합니다. 참고한 [user-hotdeal-bot](https://github.com/krepe90/user-hotdeal-bot)의 게시판별 크롤러 구조와 1페이지 조회 원칙을 현재 TypeScript/Lambda 계약에 맞게 재구성했으며, 원본 코드를 복사하지 않았습니다. Cloudflare 챌린지 페이지를 게시글 HTML로 오인하지 않으며, User-Agent 로테이션·프록시·IP 변경 등 차단 우회는 사용하지 않습니다. Maple.GG와 Maplescouter에는 자동 HTTP 요청을 하지 않고 링크만 생성합니다.

## QA·사용자 문의 기록

### QA-2026-09-01: 가격대별 PC 견적 추천 요청

- **문의 요지:** 사용자가 채팅방에서 “가격대별 컴퓨터 견적 추천” 기능을 요청했습니다.
- **기대:** 다나와 PC의 가격대별 추천 견적과 비슷하게, 링크만이 아니라 부품 목록과 예상 합계를 카카오톡에서 바로 보고 싶어 했습니다.
- **제약:** 외부 가격 사이트를 API 없이 실시간으로 조회하면 이용약관·차단·요청량 문제가 생길 수 있습니다.
- **반영:** `!견적 <예산> <용도> [모니터포함]`, 최대 3개 후보, 부품별 가격·총액·호환성·출처·조회 시각, 별도 `PcQuoteClient`/HTTP Adapter를 추가했습니다.
- **검증:** mock provider 자동 테스트는 통과했습니다. 실제 가격 Adapter 운영 배포와 카카오톡 E2E는 호스팅·정책 검토 후 진행합니다.
- **개인정보:** 첨부 이미지의 방 이름·프로필·참여자 식별정보·대화 원문은 저장소에 복사하지 않았습니다.

#### English translation (intent-level)

“Please add computer build recommendations by price range.” The follow-up discussion asks for a Danawa-PC-style result to be brought into the chat, notes that live API access may not be available, and asks whether the bot could output the information directly rather than only pointing to an external page. The replacement screenshot confirms this intent; cropped message content is still recorded as a meaning-preserving translation rather than a verbatim transcript.

#### 日本語訳（意図の要約）

「価格帯別のPC構成おすすめを追加してください。」という要望です。その後の会話では、ダナワPCのような結果をチャットに表示したいこと、リアルタイムAPIが使えない場合があること、外部ページへのリンクだけでなく情報自体をボットが出力できるかが話されています。差し替え画像でこの意図を再確認しましたが、一部が切れているため逐語訳ではなく意図を保った要約訳です。

## 현재 관측 상태

- Terraform을 통한 도쿄 리전 Lambda/API Gateway 구성 변경 및 no-op plan 결과를 확인했습니다.
- 인증된 API smoke test에서 `/health` HTTP 200과 `!도움말` reply 필드를 확인했습니다.
- 사용자는 공기계 MessengerBot R과 카카오톡에서 봇을 사용 중이라고 보고했습니다. 이 문서는 사용자 보고를 Codex의 직접 기기 관측과 구분합니다.

## 공개 전 보안 점검 결과

- 현재 파일의 phone relay는 secret·실제 방 이름을 placeholder로만 보관합니다.
- 실제 공유 secret이 과거 Git 커밋에 포함된 사실을 확인했습니다.
- 운영 secret을 새 값으로 회전하고 도쿄 Lambda 환경변수를 갱신했습니다. plan은 Lambda 1개 인플레이스 변경, 생성·삭제 0개였습니다.
- `codex/aws-tokyo-region`의 도달 가능한 전체 Git 이력을 placeholder로 재작성하고 `--force-with-lease`로 GitHub 원격 브랜치를 갱신했습니다. `main` 브랜치는 변경하지 않았습니다.
- 원격 `main`과 작업 브랜치의 도달 가능한 이력에 긴 secret이 없는 것을 재검사했습니다. Git 호스팅 서비스의 내부 백업·캐시까지 즉시 삭제된다고 주장하지 않습니다.
- 기존 커밋 SHA가 바뀌었으므로 이전 clone은 새 브랜치를 다시 fetch하거나 재복제해야 합니다.
- 공기계는 새 secret으로 `sharedSecret`을 교체하고 컴파일·런타임을 다시 확인해야 합니다. Codex는 기기 화면을 직접 관측하지 않았습니다.

## 현재 미수행 항목

- API 키·GitHub secret 등록
- 공기계 MessengerBot R 컴파일과 카카오톡 E2E의 Codex 독립 재현
- 공기계 MessengerBot R에 회전된 secret 입력 및 재컴파일

위 항목은 승인과 준비가 된 뒤에도 관측한 결과만 기록합니다.
