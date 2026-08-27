# 변경 기록

이 문서는 Kakao Maple Bot 저장소에 반영한 주요 변경을 구현 문서와 별도로 추적합니다.

## 2026-08-27

### AWS 전환

- Cloudflare Worker 구조를 AWS Lambda + API Gateway HTTP API 구조로 전환했습니다.
- SAM CLI 의존성을 제거하고 AWS CLI + 순수 CloudFormation 및 Terraform 설계를 제공했습니다.
- Lambda ESM 번들, ZIP 패키징, 로컬 health smoke test를 추가했습니다.
- Maple.GG와 Maplescouter는 자동 HTTP 접근 없이 outbound link만 유지했습니다.

### Terraform

- `infra/terraform`에 Lambda, API Gateway HTTP API, IAM 실행 역할 구성을 추가했습니다.
- Lambda ZIP을 직접 업로드하는 로컬 state 초안으로 구성했습니다.
- `plan`은 검토 단계로 유지하고 `apply`는 별도 승인 후에만 실행하도록 문서화했습니다.

### 도쿄 리전 고정

- 프로젝트 AWS 리전을 도쿄 `ap-northeast-1`로 통일했습니다.
- 이유: 사용자가 도쿄에 거주하며, 다른 리전을 사용하면 리전별 요금과 데이터 전송 비용을 별도로 관리해야 하므로 비용 관리 범위를 도쿄 단일 리전으로 제한하기 위함입니다.
- Terraform은 다른 리전 입력을 validation 오류로 거부합니다.
- AWS CLI 배포 스크립트는 STS, S3, CloudFormation 요청에 도쿄 리전을 명시합니다.

### 인증 준비

- IAM Identity Center의 프로젝트 전용 사용자와 `KakaoMapleDeveloper` 권한 세트를 준비했습니다.
- 권한 세트는 `kakao-maple-bot-*` 이름의 Lambda와 IAM 역할, API Gateway 관리 범위로 제한했습니다.
- Lambda/API Gateway 리소스는 도쿄 리전에 생성했으며, 운영 secret 등록은 수행하지 않았습니다.

### 검증

- Vitest 43개 통과
- TypeScript, ESLint, Prettier, 정책 검사 통과
- Terraform `validate` 및 도쿄 리전 기준 `plan` 통과
- Lambda `/health` smoke test 상태 코드 200 확인

### 배포 확인

- Terraform apply 결과: 4개 추가, 0개 변경, 0개 삭제
- 기존 부분 생성분까지 포함한 최종 리소스: 9개
- API Gateway `/health`: `200`, `{"status":"ok"}`
- 카카오 릴레이와 운영 명령 처리는 `BOT_ENABLED=false`로 비활성 상태
