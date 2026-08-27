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

## 2026-08-27 명령어 및 심볼 계산 개편

- `!메이플링크`를 제거했습니다. 캐릭터 응답에 필요한 Maple.GG 링크만 유지하고, 외부 사이트 자동 접근은 하지 않습니다.
- `!주사위`를 제거하고 `!가위`, `!바위`, `!보`를 추가했습니다. 사용자의 승패에 따라 결과와 가벼운 멘트를 출력합니다.
- `!심볼`은 지역명을 받도록 변경했습니다.
  - 아케인: 여로, 츄츄, 레헬른, 아르카나, 모라스, 에스페라
  - 어센틱: 세르니움, 아르크스, 오디움, 도원경, 아르테리아, 카르시온
  - 그랜드 어센틱: 탈라하트, 기어드락
- 지역별로 심볼 종류를 구분하되, 레벨업 필요 성장치는 공식 아케인/어센틱 성장 테이블을 계열별로 공통 적용합니다. 최신 지역 기어드락은 공식 업데이트의 그랜드 어센틱심볼 명칭을 반영했습니다.
- 근거: [메이플스토리 아케인포스/어센틱포스 가이드](https://maplestory.nexon.com/Guide/N23GameInformation/Articles/396), [기어드락 업데이트 안내](https://gi.maplestory.nexon.com/Update/797)

## 2026-08-27 HEXA 코어 조회 추가

- `!헥사 <닉네임>`으로 Nexon Open API `character/hexamatrix`의 장착 HEXA 코어 요약을 제공합니다.
- 코어명·레벨·종류·연결 스킬만 반환하며, 응답은 1,000자로 제한합니다.
- API fixture를 이용한 provider·Lambda 테스트를 추가했습니다.
