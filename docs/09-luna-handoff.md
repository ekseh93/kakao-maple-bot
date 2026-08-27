# Luna 구현 인계서

문서 버전: 1.0  
인계 대상: Luna model, medium reasoning  
인계 범위: 구현·자동 테스트, 배포 전

## 1. 임무

이 저장소의 상류 문서를 계약으로 삼아 Kakao Maple Bot MVP를 구현합니다. Android 공기계의 MessengerBot R v40 릴레이와 TypeScript AWS Lambda + API Gateway HTTP API 백엔드를 만들고, 자동 테스트와 로컬 검증까지 완료합니다.

## 2. 시작 전 필독

1. /README.md
2. /AGENTS.md
3. /docs/01-product-requirements.md
4. /docs/02-requirements.md
5. /docs/03-architecture.md
6. /docs/04-command-specification.md
7. /docs/05-api-data-policy.md
8. /docs/06-security-operations.md
9. /docs/07-test-strategy.md
10. /docs/08-roadmap.md
11. /docs/decisions/*

충돌 우선순위:

1. AGENTS.md 안전·승인 규칙
2. 요구사항 MUST
3. 명령어 공개 계약
4. 아키텍처와 로드맵

해석이 갈리면 외부 상태를 바꾸지 않는 보수적 선택을 하고 ADR에 기록합니다.

## 3. 구현 범위

### 반드시 구현

- Phase 0 저장소 기반
- Phase 1 순수 명령
- Phase 2 Lambda HTTP 경계
- Phase 3 Nexon 연동
- Phase 4 phone-relay 스크립트
- Phase 5 선택형 KIS 주식 어댑터와 mock 테스트
- README의 로컬 개발 절차 갱신
- 테스트 전략의 구성 가능한 T-001~T-020

### 구현하지 않음

- AWS 실제 배포
- GitHub Actions의 배포 권한·secret 등록
- 실제 Nexon/KIS 키 생성 또는 추측
- 공기계·Kakao 계정 직접 설정
- Maple.GG·Maplescouter HTTP 호출
- 실제 주문·계좌 API
- 광고, 자동 초대, 자동 친구 추가, 선제 알림
- 라이선스 선택

## 4. 기술 기본값

- TypeScript strict
- pnpm
- AWS Lambda Node.js handler
- 순수 AWS CloudFormation template
- Vitest
- ESLint + Prettier
- 런타임 응답 스키마 검증 라이브러리는 작고 Lambda Node.js 호환인 것을 선택
- 런타임 의존성은 필요 최소한
- phone-relay는 MessengerBot R v40에서 컴파일 가능한 단일 파일

버전은 구현 당일 공식 문서와 npm 최신 안정판을 확인해 고정합니다. 무료 한도나 요금제를 단정하지 말고 배포 전 재확인 항목으로 남깁니다.

## 5. 권장 디렉터리

    apps/
      lambda/
      phone-relay/
    packages/
      core/
      providers/
    tests/
      fixtures/
    docs/

더 단순한 구성이 빌드·테스트에 유리하면 ADR을 남기고 조정할 수 있습니다.

## 6. 작업 순서

1. git status와 문서 계약 확인
2. Phase 0 구성과 CI 검사
3. core 명령과 계산 fixture
4. Lambda 인증·권한·오류 경계
5. Nexon adapter와 contract fixtures
6. phone relay
7. KIS optional adapter
8. 전체 검사와 README 갱신
9. 변경 요약, 테스트 증거, 남은 수동 단계 보고

각 Phase가 끝날 때 관련 요구사항 ID와 테스트 결과를 확인합니다. 실패한 검사를 남겨둔 채 다음 Phase를 완료로 표시하지 않습니다.

## 7. 설계상 중요한 금지선

- Maplescouter 약관은 자동화 접근과 백엔드 사용을 명시적으로 금지합니다. 코드, 테스트, fixture 어디에도 이 사이트를 fetch하는 구현을 넣지 않습니다.
- Maple.GG도 링크만 생성하고 fetch하지 않습니다.
- 캐릭터 정보는 Nexon Open API로 직접 조회합니다.
- 심볼 계산은 근거 확인 전 추정식을 코드에 넣지 않습니다. 공식 자료와 level table fixture를 먼저 확정합니다.
- 주식은 읽기 전용 현재가만 허용합니다.
- 메시지 원문·방 이름·보낸이 이름을 로그에 남기지 않습니다.
- 실제 AWS 배포·키 등록·공기계 설정은 사용자의 별도 승인이 없으면 중단 지점입니다.

## 8. 예상 환경 변수

값은 예제 파일에서 비워 둡니다.

- BOT_SHARED_SECRET
- BOT_ENABLED
- ALLOWED_ROOMS
- ADMIN_SENDERS
- NEXON_API_KEY
- KIS_APP_KEY
- KIS_APP_SECRET
- KIS_BASE_URL
- STOCK_ENABLED

방·관리자 식별자의 실제 값은 사용자에게 받기 전 임의로 만들지 않습니다.

## 9. 완료 보고 형식

- 구현된 Phase와 요구사항 ID
- 생성·변경 파일
- 실행한 검사 명령과 실제 결과
- 실제 외부 API를 사용했는지 여부
- 수행하지 않은 배포·공기계 단계
- 알려진 위험과 다음 승인 필요 항목

“배포됨”, “공기계에서 작동함”, “API 정상”은 실제 관측 없이 주장하지 않습니다.

## 10. 인계 상태

상류 요구사항과 설계 문서가 구현 시작에 충분한 상태입니다.

LUNA HANDOFF: READY
