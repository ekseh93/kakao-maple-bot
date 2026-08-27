# 시스템 아키텍처

문서 버전: 1.0

## 1. 컨텍스트

    [채팅 참여자]
          |
          v
    [KakaoTalk 채팅방]
          |
          v
    [Android 공기계]
    MessengerBot R v40
          |
          | HTTPS POST /v1/messages
          v
    [API Gateway HTTP API]
          |
          v
    [AWS Lambda]
       |        |        |
       v        v        v
    Nexon API  KRX/Tiingo API  프로젝트 자체 데이터/계산
       |
       +---- 답변 문자열 ----> 공기계 ----> KakaoTalk

## 2. 구성요소

### Phone Relay

책임:

- KakaoTalk 알림에서 방, 발신자, 메시지를 받습니다.
- 접두사와 길이를 1차 검사합니다.
- 허용된 백엔드로 HTTPS 요청을 보냅니다.
- 백엔드의 단일 답변 문자열을 원래 방에 한 번 전송합니다.
- 백엔드 실패 시 짧은 공통 오류만 표시합니다.

하지 않는 일:

- Nexon·주식 API 키 보관
- 계산식·메뉴 데이터·명령별 비즈니스 로직
- 대화 저장, 자동 친구 추가, 선제 메시지

### HTTP Boundary

엔드포인트:

- POST /v1/messages: 명령 처리
- GET /health: 비밀 없는 생존 확인

요청 개념 모델:

    {
      "eventId": "phone-generated-id",
      "roomId": "configured-room-alias",
      "senderId": "configured-sender-alias",
      "message": "!정보 캐릭터명",
      "sentAt": "ISO-8601"
    }

응답 개념 모델:

    {
      "reply": "text or null",
      "requestId": "opaque-id",
      "cache": "hit | miss | bypass"
    }

실제 방 이름과 발신자명을 전송해야 하는 MessengerBot 제약이 있으면 서버 진입 즉시 정규화·해시하고 로그에는 남기지 않습니다.

### Command Router

- 입력 정규화
- 명령·별칭 판별
- 사용 권한·기능 플래그 확인
- 입력 스키마 검증
- 명령 핸들러 호출
- 사용자용 오류 매핑

명령 핸들러는 Kakao SDK나 Android 객체에 의존하지 않습니다.

### Provider Adapters

NexonAdapter:

- 캐릭터명 → OCID
- 기본 정보, 종합 스탯, 심볼 장착 정보
- 응답 스키마 검증과 사용자 오류 변환

StockAdapter:

- 국내는 KRX AUTH_KEY로 종목기본정보·일별매매정보 조회
- 미국은 Tiingo 토큰으로 종목 검색·일별 가격 조회
- 주문 API와 계좌 관련 엔드포인트는 구현하지 않음

외부 공급자마다 별도의 타임아웃, 캐시 키, 오류 타입을 둡니다.

### Calculators and Static Data

- Arcane/Authentic symbol growth calculator
- rock-paper-scissors and choice randomizer
- food catalog

계산식은 순수 함수로 만들고 공급자 호출과 분리합니다. 계산식·정적 데이터에는 source URL, effective date, verified date를 포함합니다.

## 3. 배포 단위

    repository
    ├─ apps/lambda          TypeScript AWS Lambda handler
    ├─ apps/phone-relay     MessengerBot R compatible JavaScript
    ├─ packages/core        command/domain/calculation logic
    ├─ packages/providers   external API adapters
    ├─ tests                contract and integration fixtures
    └─ docs                 architecture and operations

MVP에서 과도한 모노레포 도구는 피하되 도메인 로직이 Lambda 런타임과 분리되도록 구성합니다.

## 4. 캐시와 상태

| 데이터              |           권장 TTL | 저장 위치              | 비고                  |
| ------------------- | -----------------: | ---------------------- | --------------------- |
| 캐릭터 OCID         |         6시간 이하 | Cache API/KV           | OCID 변경 가능성 고려 |
| 캐릭터 기본·스탯    |                5분 | Cache API              | Nexon 갱신 시차 표시  |
| 심볼 장착           |                5분 | Cache API              | 캐릭터 조회와 키 분리 |
| 주식 시세           |             5~15초 | 메모리/Cache API       | 일별 기준 표시        |
| KRX/Tiingo 인증정보 | 공급자 정책에 따름 | encrypted secret/cache | 로그 금지             |
| 중복 이벤트 ID      |                2분 | KV 또는 경량 저장      | TTL 필수              |
| 메뉴 목록           |          빌드 시점 | 코드/JSON              | 기준 버전 기록        |

KV가 무료 한도나 복잡도를 높이면 MVP 중복 제거는 공기계 측 짧은 LRU로 시작하고 ADR에 기록합니다.

## 5. 오류 모델

내부 오류:

- ValidationError
- UnauthorizedRoomError
- ProviderTimeoutError
- ProviderRateLimitError
- ProviderSchemaError
- FeatureNotConfiguredError
- InternalError

사용자 답변은 내부 세부 정보를 숨기고 다음 범주만 보여줍니다.

- 사용법 오류
- 찾을 수 없음
- 잠시 후 재시도
- 기능 미설정
- 운영 중지

## 6. 장애 격리

- 외부 API 호출에 AbortSignal 타임아웃을 사용합니다.
- 캐릭터 기본·스탯·심볼 조회는 독립 호출 후 부분 성공을 허용합니다.
- 주식 공급자 장애가 랜덤·심볼·메뉴 명령을 막지 않습니다.
- 재시도는 네트워크 오류와 5xx에만 제한합니다.
- 회로 차단기는 실제 장애 패턴이 확인된 뒤 도입합니다.

## 7. 관측성

구조화 로그 필드:

- requestId
- command
- outcome
- latencyMs
- provider
- providerStatusClass
- cacheStatus
- appVersion

금지 로그:

- message 원문
- room/sender 표시명
- API 키·토큰·Authorization
- 캐릭터 조회 결과 전체
- 외부 응답 원문

## 8. 확장 지점

새 명령은 Command 인터페이스에 등록합니다. 새 외부 데이터원은 Provider 인터페이스와 명시적 데이터 정책 검토를 거칩니다. 공기계 앱을 Iris로 바꾸더라도 HTTP 계약과 도메인 로직은 유지합니다.
