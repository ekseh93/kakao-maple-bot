# Kakao Maple Bot

공기계의 카카오톡 계정을 입구로 사용해 메이플스토리 정보, 심볼 계산, 랜덤 게임, 메뉴 추천, 한국·미국·일본 주식 시세를 제공하는 개인용 챗봇 프로젝트입니다.

[English README](README.en.md) · [日本語 README](README.ja.md)

> 현재 단계: Phase 0~6 구현·자동 검증·도쿄 AWS 배포 완료. 공기계 MessengerBot R 운영은 사용자 제공 확인 기준이며, Codex가 기기 E2E를 직접 관측한 것은 아닙니다.

## 핵심 결정

- 카카오 디벨로퍼스/OpenBuilder가 아니라 Android 공기계 + MessengerBot R v40을 사용합니다.
- 공기계 스크립트는 메시지를 HTTPS 백엔드에 전달하고 답변을 카카오톡에 보내는 얇은 릴레이로 제한합니다.
- 백엔드는 TypeScript 기반 AWS Lambda + API Gateway HTTP API를 사용합니다.
- 메이플 캐릭터 데이터는 Nexon Open API에서 직접 가져옵니다.
- Maple.GG와 Maplescouter는 크롤링하거나 비공개 API를 재사용하지 않고 사용자용 링크만 제공합니다.
- 심볼 계산식은 프로젝트가 직접 구현하고, 근거와 데이터 기준일을 함께 관리합니다.
- 국내·일본 주식은 Yahoo Finance 공개 조회, 미국 주식은 Tiingo를 선택형 공급자로 사용하며 투자 권유 기능은 만들지 않습니다. Yahoo Finance 경로는 공식 인증 API가 아니므로 응답 형식 변경이나 일시 차단 가능성이 있습니다.
- 실제 현금 비용이 들지 않는 개인 취업 포트폴리오 범위로 설계합니다.

## 목표 기능

| 영역                        | MVP 명령 예시                         | 데이터 출처                                           |
| --------------------------- | ------------------------------------- | ----------------------------------------------------- |
| 메이플 캐릭터               | !정보 닉네임                          | Nexon Open API                                        |
| 로얄스타일 미니게임         | `/로얄 [개수] [결과확인옵션]`         | Nexon 공식 확률 페이지                                |
| 위습의 원더베리 미니게임    | `/원더베리 [개수] [결과확인옵션]`     | Nexon 공식 확률 페이지                                |
| 부티크 기프트 미니게임      | `!부티크`                             | Nexon 공식 확률 페이지                                |
| 루나 크리스탈 스윗 미니게임 | `!루나스윗`                           | Nexon 공식 확률 페이지                                |
| 루나 크리스탈 드림 미니게임 | `!루나드림`                           | Nexon 공식 확률 페이지                                |
| 전 세계 현재 날씨           | `!날씨 지역명`                        | Open-Meteo + OpenStreetMap Nominatim                  |
| 무릉 최고기록               | !무릉 닉네임                          | Nexon Open API                                        |
| 유니온 요약                 | !유니온 닉네임                        | Nexon Open API                                        |
| 유니온 챔피언 능력치        | !유챔 닉네임                          | Nexon Open API                                        |
| 장비 요약                   | !장비 닉네임                          | Nexon Open API                                        |
| 공지 목록                   | !공지                                 | Nexon Open API                                        |
| 공지 키워드 자동 알림       | 새 공지 자동 전송                     | Nexon Open API + MessengerBot R 폴링                  |
| 최신 이벤트 게시글          | !이벤트                               | 메이플스토리 공식 이벤트 게시판 최신 5개              |
| 썬데이 메이플               | !썬데이 / !선데이                     | Nexon 진행 중 이벤트와 공식 이미지 링크               |
| 인벤 10추글                 | !인벤                                 | 메이플 인벤 공개 10추 게시판                          |
| 커뮤니티 핫딜 모음          | !핫딜                                 | 퀘이사존 최신 6개(0번부터·시각 포함) + 나머지 각 5개  |
| 퀘이사존 그래픽카드         | !글카                                 | 그래픽카드 게시판 최신 글 5개                         |
| 디시인사이드 모니터         | !모니터                               | 모니터 갤러리 최신 글 5개                             |
| 디시인사이드 일본여행       | !일본여행기                           | 일본여행 갤러리 최신 글 3개                           |
| 디시인사이드 일본 음식점    | !일본음식점                           | 일본 음식점 최신 글 3개                               |
| 마빡도로시 최신 글          | !마빡도로시                           | 인벤 닉네임 검색 결과 최신 3개                        |
| 네이버 웹툰 랜덤 추천       | !웹툰                                 | 네이버 웹툰 공식 요일별 목록                          |
| 웹소설 랜덤 추천            | !웹소설                               | 카카오페이지·문피아·노벨피아 후보 통합                |
| 금주의 신상 최신 글         | !금주의신상                           | 돈찐 네이버 블로그 RSS의 최신 금주의 신상 글          |
| 디스코드 링크               | !디코                                 | 길드·라운지 디스코드 링크                             |
| 일본여행 추천               | !일본여행                             | 일본 47개 도도부현 정적 여행지 목록                   |
| 넷플릭스 추천               | !넷플                                 | TMDB Netflix 제공작, 미설정 시 정적 목록              |
| 일본 애니메이션 추천        | !애니                                 | 완결·방영중·극장판 정적 추천 목록                     |
| 일본 만화 추천              | !만화                                 | 리디 일본 만화 목록 랜덤 추천                         |
| 오늘의 운세                 | !운세 931201 남성 양력                | fortuneteller 참고형 로컬 운세 어댑터, 외부 호출 없음 |
| 한·일 로또 랜덤 번호        | !로또                                 | 저장소 내 난수 로직                                   |
| 경험치 히스토리             | !경험치 닉네임 / /경험치 닉네임       | Nexon Open API, 전날 대비·1업 예상                    |
| 심볼 계산                   | !심볼 여로 1 20 / !심볼 기어드락 1 11 | 성장치·지역별 강화 메소 표 기반 자체 계산식           |
| 심볼 만렙 효과              | !심볼만렙                             | 어센틱 심볼 11레벨 추가 능력치 표                     |
| 그란디스·검은 마법사 보스표 | !보스                                 | 참고 페이지의 난이도별 결정 가격 스냅샷               |
| 보스 주요 보상              | !보스보상                             | 스우부터 벨로나까지 보스 보상 표                      |
| 보스 레벨 보정              | !보스렙뻥                             | 검은 마법사(하드)부터 벨로나까지 레벨 표              |
| 보스 포스 보정              | !보스포뻥                             | 어센틱 보스별 100%·125% 포스 요구량 표                |
| 메카베리 경험치             | !메카베리 레벨                        | 메카베리·크림슨 메카베리 1개당 상승률 표              |
| 메포 효율                   | !메포효율                             | 284레벨 기준 메포 대비 경험치 효율표                  |
| 외부 상세보기               | 캐릭터 조회 응답의 링크               | Maple.GG 링크만 생성                                  |
| 랜덤 게임                   | !가위, !바위, !보, !골라 A B C        | 자체 로직                                             |
| 메뉴 추천                   | !뭐먹지                               | 요리·사이드·디저트·술안주 정적 목록, 재획 11배        |
| 주식                        | !주식 이름                            | Yahoo Finance(한국·일본) + Tiingo(미국)               |
| 다이소 상품 검색            | !다이소 상품                          | 다이소 MCP OpenAPI facade                             |
| 전국 평균 유가              | !기름 / !유가                         | 한국석유공사 오피넷 전국 평균                         |
| 지역 최저가 주유소          | !주유소 <지역>                        | 한국석유공사 오피넷 지역 최저가 3곳                   |
| 달러·엔화 환율              | !환율                                 | 무료 공개 환율 조회                                   |
| 익명 누적 호출 수           | !통계                                 | DynamoDB 단일 집계 항목                               |

전체 명령 계약은 [명령어 명세](docs/04-command-specification.md)에 있습니다.

## 구조

    KakaoTalk
        ↕ Android notification/reply
    MessengerBot R v40 on spare phone
        ↕ HTTPS + shared secret
    API Gateway HTTP API
        ↓
    AWS Lambda
        ├─ command router
        ├─ Maple adapter ─ Nexon Open API
        ├─ Stock adapter ─ Yahoo Finance / Tiingo
        ├─ calculators / random / food
        ├─ cache, timeout, audit-safe logs
        └─ anonymous total counter ─ DynamoDB (Tokyo)

## 문서

1. [조사 기록과 사례](docs/00-research.md)
2. [제품 요구사항](docs/01-product-requirements.md)
3. [기능·비기능 요구사항](docs/02-requirements.md)
4. [시스템 아키텍처](docs/03-architecture.md)
5. [명령어 명세](docs/04-command-specification.md)
6. [API·데이터·저작권 정책](docs/05-api-data-policy.md)
7. [보안·운영 설계](docs/06-security-operations.md)
8. [테스트 전략과 완료 조건](docs/07-test-strategy.md)
9. [구현 로드맵](docs/08-roadmap.md)
10. [Luna 구현 인계서](docs/09-luna-handoff.md)
11. [로컬 검증 기록](docs/10-local-verification.md)
12. [요구사항 추적성](docs/11-traceability.md)
13. [아키텍처 결정 기록](docs/decisions/README.md)
14. [출시 승인 게이트](docs/12-release-gate.md)
15. [트러블슈팅 기록](docs/13-troubleshooting.md)
16. [Terraform AWS 설계](infra/terraform/README.md)
17. [포트폴리오 인증·공개 범위](docs/17-portfolio-evidence.md)
18. [변경 기록](docs/14-change-log.md)
19. [공기계 E2E 체크리스트](docs/16-phone-e2e-checklist.md)
20. [익명 명령어 사용 통계](docs/portfolio/command-usage.md)

## 구현 원칙

- 명령어가 아닌 메시지에는 반응하지 않습니다.
- 비밀키, 카카오 대화 원문, 개인 식별 정보는 저장하거나 Git에 올리지 않습니다.
- 외부 API별 타임아웃·오류 격리·캐시를 둡니다.
- 공개 게시판은 정상 결과를 캐시하고 일시 장애 시 최근 정상 결과를 임시 사용하며, 접근제어 우회는 하지 않습니다. `!핫딜`은 사이트별 파서를 사용해 세 커뮤니티 결과를 한 응답으로 묶고, 한 사이트가 실패해도 나머지 결과를 표시합니다.
- 계산 결과에는 기준일과 참고용임을 표시합니다.
- 카카오 개인 계정 자동화는 비공식 방식이며 계정 제한 가능성이 있습니다. 운영자가 이 위험을 인지하고 제한된 방에서만 사용해야 합니다.
- 배포, API 키 등록, 공기계 설치는 별도 승인과 실제 계정 준비 후 수행합니다.
- 포트폴리오용 인증 이미지에는 명령어·봇 응답 영역만 남기고, 대화 상대·방 식별자·아바타·시각·URL 등은 모자이크 또는 비공개 처리합니다.
- 명령어 사용 통계는 도쿄 기준 날짜·내부 명령어·결과·응답시간만 집계하며, 원문·방·발신자 정보는 저장하지 않습니다. 포트폴리오 샘플은 가상 데이터로만 생성합니다.
- `!통계`는 허용된 명령 요청이 처리될 때마다 익명 누적 횟수를 1 증가시켜 현재 총 호출 수만 보여줍니다. DynamoDB에는 `TOTAL` 단일 항목의 숫자와 갱신 시각만 저장합니다.

## 구현 시작

구현 담당자는 먼저 [Luna 구현 인계서](docs/09-luna-handoff.md)를 끝까지 읽고 Phase 1부터 진행합니다. 인계 상태는 다음과 같습니다.

LUNA HANDOFF: READY

## 로컬 개발

Node.js 22와 pnpm 11을 준비한 뒤 다음 명령을 실행합니다. 의존성 설치 시 실제 API 키는 필요하지 않습니다.

```powershell
pnpm install --ignore-scripts
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm lambda:dry-run
pnpm format:check
pnpm policy:check
pnpm phone:check
pnpm audit
```

Lambda 로컬 검증은 비밀을 저장소에 넣지 않고 환경 변수 또는 로컬 설정으로 주입합니다. 예시는 `.env.example`을 참고하세요. 기본 허용 방은 비어 있어 명시적으로 설정하지 않으면 모든 메시지를 무시합니다.

구현된 범위는 Phase 0 기반, Phase 1 순수 명령, Phase 2 인증·방 권한·kill switch·중복 이벤트 TTL·방 rate limit, Phase 3 Nexon 어댑터와 링크 전용 외부 상세보기, Phase 4 MessengerBot R 릴레이 스크립트와 운영 문서, Phase 5 읽기 전용 Yahoo Finance/Tiingo 주식 어댑터와 인벤 공개 게시판 어댑터, Phase 6 로컬 안전성 보완입니다. 공급자 테스트는 fetch mock으로 수행하며, 승인된 도쿄 AWS Lambda 배포와 API smoke test만 별도로 수행했습니다.

GitHub secret 등록, Nexon/KRX/Tiingo 키 발급, 공기계 설치·컴파일·카카오 E2E는 별도 승인과 준비가 필요한 후속 단계입니다. Maple.GG와 Maplescouter에는 링크 생성 외 HTTP 요청을 하지 않습니다.

## Cloudflare에서 AWS로 변경한 이유

### 변경 전

- Cloudflare Workers + Wrangler 기반 HTTP Worker
- Cloudflare 계정과 Worker secret을 이용한 배포
- 빠른 엣지 실행과 단순한 운영을 우선

### 변경 후

- Amazon API Gateway HTTP API + AWS Lambda
- AWS Lambda 환경 변수·secret 관리와 CloudWatch 관측성
- 순수 CloudFormation 템플릿과 AWS CLI 스크립트로 재현 가능한 AWS 인프라
- `packages/core`와 `packages/providers`는 플랫폼 독립적으로 재사용

### 왜 AWS로 바꾸었는가

이 프로젝트를 AWS 서버리스 운영·IAM·Lambda·API Gateway 경험을 보여주는 취업 포트폴리오로 발전시키기 위해서입니다. AWS 공식 문서상 HTTP API는 Lambda와 직접 통합할 수 있고, API Gateway HTTP API에는 신규 계정 기준 월 100만 호출 Free Tier가 최대 12개월 제공되지만, Free Tier가 무조건 무비용을 보장하지는 않으므로 Budget과 사용량 감시를 전제로 합니다. [AWS HTTP API 문서](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html) · [AWS API Gateway 요금](https://aws.amazon.com/api-gateway/pricing/)

현재 전환은 코드·문서·로컬 검증까지 완료했으며, Lambda/API Gateway 리소스는 도쿄 리전(`ap-northeast-1`)에 배포했습니다. `BOT_ENABLED=true`와 허용 방 설정은 사용자의 운영 환경에서 적용되었고, `/health`가 `200`으로 응답하는 것을 확인했습니다. 운영 secret은 저장소가 아닌 런타임·공기계 비공개 설정으로 관리합니다.

배포 확인 URL: `https://zbzdl5d4tk.execute-api.ap-northeast-1.amazonaws.com/health` (확인 결과 `200`, `{"status":"ok"}`)

배포 API smoke test에서 `!도움말`, `!공지`, `!이벤트` 응답과 인증된 `!도움말` reply 필드를 확인했습니다. `!장비` 템플릿은 로컬 Lambda 경계 테스트로 확인하고 배포했으며, 공지·이벤트 응답에는 공식 넥슨 링크가 포함됩니다. 공기계 MessengerBot R과 카카오톡에서 실제 사용 중이라는 상태는 사용자가 확인한 운영 결과이며, 본 저장소 문서에서는 Codex의 직접 관측 결과와 구분합니다.

### AWS CLI 인증 준비

IAM Identity Center access portal에서 프로젝트 전용 사용자의 초기 비밀번호를 설정한 뒤, 로컬에서 SSO 프로필을 구성합니다. 프로필 이름은 예시이며 실제 구성값에 맞춰 사용합니다.

```powershell
aws configure sso
aws sso login --profile kakao-maple
$env:AWS_PROFILE = 'kakao-maple'
aws sts get-caller-identity
```

출력 ARN이 root가 아니라 IAM Identity Center 권한 역할인지 확인한 뒤에만 Terraform `plan` 또는 배포를 진행합니다. 자격 증명과 secret은 저장소에 기록하지 않습니다.

## 리전 정책: 도쿄만 사용

이 프로젝트의 AWS 리전은 도쿄(`ap-northeast-1`)로 고정합니다. 사용자가 도쿄에 거주하고 있고, 다른 리전을 선택하면 리전별 요금·데이터 전송 비용을 별도로 확인해야 하므로 비용 관리 범위를 단일 리전으로 제한합니다. Terraform은 다른 리전 입력을 거부하고, AWS CLI CloudFormation 배포 스크립트도 모든 요청에 도쿄 리전을 명시합니다.

## SAM CLI 없이 AWS CLI로 배포하는 이유와 방법

SAM CLI는 편의 도구일 뿐 Lambda 런타임에 필요한 구성요소는 아닙니다. Windows에서 SAM CLI 설치가 막히거나 별도 설치 도구를 최소화하려면 AWS CLI와 CloudFormation만 사용할 수 있도록 구성했습니다. 따라서 `apps/lambda/template.yaml`은 SAM 전용 `AWS::Serverless::*`가 아닌 순수 CloudFormation 리소스를 사용합니다.

배포 전에는 Lambda 번들을 ZIP으로 만들고, 사용자가 준비한 기존 S3 버킷에 업로드한 뒤 CloudFormation stack을 생성·갱신합니다.

```powershell
$env:LAMBDA_ARTIFACT_BUCKET = 'your-existing-artifact-bucket'
$env:DEPLOY_CONFIRMATION = 'I_APPROVE_AWS_DEPLOYMENT'
$env:STACK_NAME = 'kakao-maple-bot'
pnpm lambda:package
pnpm lambda:deploy
```

`lambda:deploy`는 `aws sts get-caller-identity`로 현재 주체를 확인하고, root 계정이면 기본적으로 중단합니다. `ALLOW_ROOT_DEPLOY=true` 없이는 root 배포를 허용하지 않습니다. API 키와 shared secret은 환경 변수로만 주입하며 저장소에 기록하지 않습니다. S3 버킷은 자동 생성하지 않으므로 비용·보존 정책을 확인한 기존 버킷을 명시해야 합니다.

배포 스크립트와 지금까지의 오류·해결 과정은 [트러블슈팅 기록](docs/13-troubleshooting.md)에 분리해 정리했습니다. 운영 secret은 회전했고, `codex/aws-tokyo-region`의 도달 가능한 Git 이력에서도 기존 secret을 제거했습니다. 새 secret은 공기계의 비공개 릴레이 복사본에 입력해야 합니다.

AWS 인프라를 코드로 먼저 검토하고 싶다면 [Terraform 설계](infra/terraform/README.md)를 사용할 수 있습니다. Terraform 구성은 CloudFormation과 같은 Lambda/API Gateway 구조를 선언하지만, Lambda ZIP을 직접 업로드하므로 artifact S3 버킷을 별도로 만들 필요가 없습니다. `terraform plan`까지는 검토 단계이며 `terraform apply`는 별도 승인이 있을 때만 실행합니다.

## TMDB `!넷플` 설정

TMDB 계정의 API 설정에서 API Read Access Token을 발급한 뒤 `TMDB_READ_ACCESS_TOKEN` 환경변수로만 주입합니다. 저장소 파일, 공기계 스크립트, 채팅 메시지에는 토큰을 넣지 않습니다. `discover/movie`와 `discover/tv`에서 Netflix 제공자(`8`) 및 `watch_region`을 사용하며 결과는 15분 캐시합니다. 토큰이 없거나 조회에 실패하면 정적 추천으로 대체합니다.

기본 지역은 한국(`KR`)입니다. 일본 Netflix 기준으로 조회하려면 `TMDB_REGION=JP`를 설정합니다. TMDB 결과는 지역과 시점에 따라 달라질 수 있으므로 실제 재생 가능 여부는 Netflix 앱에서 확인해야 합니다.

TMDB 비상업용 사용 조건에 따라 앱의 소개·크레딧 영역에 `This product uses the TMDB API but is not endorsed or certified by TMDB.` 문구와 공식 TMDB 링크를 표시해야 합니다. TMDB API는 Netflix 스트리밍을 제공하지 않으며, 이 봇은 작품명 메타데이터만 사용합니다.

## 포트폴리오 인증 자료

운영 화면을 포트폴리오에 사용할 때는 원본 채팅 캡처를 그대로 공개하지 않습니다. 명령어와 봇 응답 영역만 남긴 개인정보 비식별화 파생 이미지를 제공합니다.

- [개인정보 비식별화 인증 이미지](docs/assets/kakao-bot-evidence-redacted.png)
- 이미지의 메시지 내용은 기능 사용 흐름을 보여주는 시각 자료이며, 데이터 출처나 배포 상태의 1차 증거가 아닙니다.
- 원본 이미지·실제 방 이름·카카오 식별자·공유 secret·API 키·실제 채팅 로그는 저장소에 포함하지 않습니다.
- AWS smoke test, 자동 테스트, 사용자 제공 공기계 사용 확인은 각각 별도의 증거로 구분합니다.

## 라이선스

아직 라이선스를 부여하지 않았습니다. 별도 라이선스가 추가되기 전까지 복제·배포·상업적 이용 권한을 허용하지 않는 개인 비상업 포트폴리오입니다.
