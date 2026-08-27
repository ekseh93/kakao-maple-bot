# Kakao Maple Bot

공기계의 카카오톡 계정을 입구로 사용해 메이플스토리 정보, 심볼 계산, 랜덤 게임, 메뉴 추천, 국내 주식 시세를 제공하는 개인용 챗봇 프로젝트입니다.

> 현재 단계: Phase 0~6 로컬 구현·검증 및 AWS Lambda/API Gateway 배포 완료 (공기계 E2E 검증 전)

## 핵심 결정

- 카카오 디벨로퍼스/OpenBuilder가 아니라 Android 공기계 + MessengerBot R v40을 사용합니다.
- 공기계 스크립트는 메시지를 HTTPS 백엔드에 전달하고 답변을 카카오톡에 보내는 얇은 릴레이로 제한합니다.
- 백엔드는 TypeScript 기반 AWS Lambda + API Gateway HTTP API를 사용합니다.
- 메이플 캐릭터 데이터는 Nexon Open API에서 직접 가져옵니다.
- Maple.GG와 Maplescouter는 크롤링하거나 비공개 API를 재사용하지 않고 사용자용 링크만 제공합니다.
- 심볼 계산식은 프로젝트가 직접 구현하고, 근거와 데이터 기준일을 함께 관리합니다.
- 국내 주식은 한국투자 Open API를 선택형 공급자로 사용하며 투자 권유 기능은 만들지 않습니다.
- 실제 현금 비용이 들지 않는 개인 취업 포트폴리오 범위로 설계합니다.

## 목표 기능

| 영역          | MVP 명령 예시                         | 데이터 출처                  |
| ------------- | ------------------------------------- | ---------------------------- |
| 메이플 캐릭터 | !캐릭터 닉네임                        | Nexon Open API               |
| HEXA 코어     | !헥사 닉네임                          | Nexon Open API               |
| 무릉 최고기록 | !무릉 닉네임                          | Nexon Open API               |
| 유니온 요약   | !유니온 닉네임                        | Nexon Open API               |
| 장비 요약     | !장비 닉네임                          | Nexon Open API               |
| 공지 목록     | !공지                                 | Nexon Open API               |
| 심볼 계산     | !심볼 여로 1 20 / !심볼 기어드락 1 11 | 공식 성장표 기반 자체 계산식 |
| 외부 상세보기 | 캐릭터 조회 응답의 링크               | Maple.GG 링크만 생성         |
| 랜덤 게임     | !가위, !바위, !보, !골라 A,B,C        | 자체 로직                    |
| 메뉴 추천     | !뭐먹지 한식                          | 저장소 내 정적 데이터        |
| 국내 주식     | !주식 005930                          | 한국투자 Open API            |

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
        ├─ Stock adapter ─ Korea Investment Open API
        ├─ calculators / random / food
        └─ cache, timeout, audit-safe logs

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
17. [변경 기록](docs/14-change-log.md)

## 구현 원칙

- 명령어가 아닌 메시지에는 반응하지 않습니다.
- 비밀키, 카카오 대화 원문, 개인 식별 정보는 저장하거나 Git에 올리지 않습니다.
- 외부 API별 타임아웃·오류 격리·캐시를 둡니다.
- 계산 결과에는 기준일과 참고용임을 표시합니다.
- 카카오 개인 계정 자동화는 비공식 방식이며 계정 제한 가능성이 있습니다. 운영자가 이 위험을 인지하고 제한된 방에서만 사용해야 합니다.
- 배포, API 키 등록, 공기계 설치는 별도 승인과 실제 계정 준비 후 수행합니다.

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

구현된 범위는 Phase 0 기반, Phase 1 순수 명령, Phase 2 인증·방 권한·kill switch·중복 이벤트 TTL·방 rate limit, Phase 3 Nexon 어댑터와 링크 전용 외부 상세보기, Phase 4 MessengerBot R 릴레이 스크립트와 운영 문서, Phase 5 읽기 전용 KIS 현재가 어댑터, Phase 6 로컬 안전성 보완입니다. 공급자 테스트는 fetch mock으로 수행하며 실제 키·계정·외부 배포는 사용하지 않았습니다.

GitHub secret 등록, Nexon/KIS 키 발급, 공기계 설치·컴파일·카카오 E2E는 별도 승인과 준비가 필요한 후속 단계입니다. Maple.GG와 Maplescouter에는 링크 생성 외 HTTP 요청을 하지 않습니다.

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

현재 전환은 코드·문서·로컬 검증까지 완료했으며, Lambda/API Gateway 리소스는 도쿄 리전(`ap-northeast-1`)에 배포했습니다. `BOT_ENABLED=true`와 허용 방 설정은 적용되어 있고, `/health`가 `200`으로 응답하는 것을 확인했습니다. 운영 secret 등록과 카카오 비공개 시험방 E2E는 아직 수행하지 않았습니다.

배포 확인 URL: `https://zbzdl5d4tk.execute-api.ap-northeast-1.amazonaws.com/health` (확인 결과 `200`, `{"status":"ok"}`)

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

배포 스크립트와 지금까지의 오류·해결 과정은 [트러블슈팅 기록](docs/13-troubleshooting.md)에 분리해 정리했습니다.

AWS 인프라를 코드로 먼저 검토하고 싶다면 [Terraform 설계](infra/terraform/README.md)를 사용할 수 있습니다. Terraform 구성은 CloudFormation과 같은 Lambda/API Gateway 구조를 선언하지만, Lambda ZIP을 직접 업로드하므로 artifact S3 버킷을 별도로 만들 필요가 없습니다. `terraform plan`까지는 검토 단계이며 `terraform apply`는 별도 승인이 있을 때만 실행합니다.

## 라이선스

아직 라이선스를 부여하지 않았습니다. 별도 라이선스가 추가되기 전까지 복제·배포·상업적 이용 권한을 허용하지 않는 개인 비상업 포트폴리오입니다.
