# API·데이터·저작권 정책

문서 버전: 1.0

## 1. 공급자 허용표

| 공급자 | 허용 용도 | 금지 용도 | 상태 |
|---|---|---|---|
| Nexon Open API | 공식 키로 캐릭터 데이터 조회 | 키 공유, 한도 우회, 약관 위반 저장 | MVP |
| 한국투자 Open API | 국내 현재가 정보 조회 | 주문, 계좌 접근, 자동매매 | 선택 |
| Maple.GG | 사용자에게 공개 페이지 링크 제공 | 크롤링, 콘텐츠 복제, 결과 재배포 | 링크 전용 |
| Maplescouter | 사용자에게 공식 사이트 링크 제공 | 자동 접근, 백엔드 사용, 엔드포인트 추출 | 링크 전용 |
| 메뉴 데이터 | 프로젝트가 작성한 일반 메뉴명 | 리뷰·사진 무단 복제 | MVP |

## 2. Nexon Open API

기본 URL과 정확한 엔드포인트는 구현 시 최신 공식 문서에서 확인합니다.

예상 사용 범위:

- 캐릭터 식별자
- 캐릭터 기본 정보
- 종합 능력치
- 장착 심볼

필수 구현 규칙:

- x-nxopen-api-key는 Worker secret으로만 주입합니다.
- 오류 본문을 사용자에게 그대로 전달하지 않습니다.
- OCID가 변경될 수 있다는 공식 안내를 고려해 영구 식별자로 취급하지 않습니다.
- API 데이터의 갱신 시차와 조회 기준일을 답변에 표시합니다.
- 공식 문서가 요구하는 데이터 갱신·보관 정책을 구현 전에 다시 확인합니다.
- fixture는 실제 사용자 전체 응답이 아니라 최소화·비식별화한 샘플을 사용합니다.

공식 문서: [Nexon Open API MapleStory](https://openapi.nexon.com/game/maplestory/)

## 3. 한국투자 Open API

MVP는 국내주식 현재가 시세 읽기만 허용합니다.

예상 사용:

- OAuth client credentials 접근 토큰
- 국내주식 현재가 시세
- 종목코드, 현재가, 전일 대비, 등락률, 거래량, 종목명

금지:

- 주문 엔드포인트
- 계좌번호·잔고·보유 종목
- 자동매매와 매매 신호
- 앱키를 공기계에 저장

공식 예제: [Korea Investment Open Trading API](https://github.com/koreainvestment/open-trading-api)

가격은 지연·장 상태·공급자 사정에 따라 실제 체결가와 다를 수 있습니다. 모든 답변에 조회 시각과 비권유 문구를 붙입니다.

## 4. Maple.GG

허용:

- 사용자 입력 캐릭터명을 URL 인코딩해 공개 프로필 링크 생성
- 사이트명과 링크 표시

금지:

- HTML/API 자동 요청
- 캐릭터 정보·이미지·통계를 복제해 답변
- 사이트가 얻은 정보를 봇 데이터베이스에 저장

근거: [Maple.GG 이용약관](https://maple.gg/about/agreement)

## 5. Maplescouter

허용:

- 공식 홈 또는 캐릭터 검색 진입 링크 표시
- “외부 사이트에서 직접 확인” 안내

금지:

- 봇·스크립트·크롤러·스크래퍼·헤드리스 브라우저·MCP 접근
- 계산·환산 기능을 봇의 백엔드 또는 데이터 소스로 사용
- API 키·토큰·엔드포인트 추출
- Origin·Referer 위조나 접근제어 우회

근거: [Maplescouter 이용약관](https://maplescouter.com/ko/agreement), 2026-07-11 시행

예외 조건: 운영자의 서면 허락과 사용 범위가 저장소 문서에 첨부되고 새 ADR이 승인된 경우에만 재검토합니다.

## 6. 자체 계산 데이터

각 계산 데이터 파일은 다음 메타데이터를 가져야 합니다.

    {
      "id": "arcane-symbol-growth",
      "game": "kms",
      "effectiveDate": "YYYY-MM-DD",
      "verifiedDate": "YYYY-MM-DD",
      "sources": ["official URL"],
      "verifiedBy": "manual review reference"
    }

검증 절차:

1. Nexon 공식 가이드·패치노트에서 규칙 확인
2. 게임 내 또는 독립된 공개 표본과 대조
3. 경계 레벨 golden fixture 작성
4. 계산 함수와 데이터 버전을 함께 릴리스
5. 패치 후 주기적으로 재검증

공식 가이드 예: [아케인포스/어센틱포스](https://maplestory.nexon.com/Guide/N23GameInformation/Articles/396)

## 7. 데이터 보존

| 데이터 | 보존 |
|---|---|
| 메시지 원문 | 저장하지 않음 |
| 방·발신자 표시명 | 저장하지 않음 |
| 이벤트 중복 키 | 최대 2분 |
| 캐릭터 API 캐시 | 최대 문서화된 TTL |
| 주식 API 캐시 | 초 단위 TTL |
| 운영 로그 | 식별 정보 없는 집계, 최대 14일 권장 |
| API 비밀 | 플랫폼 secret, 회전 시까지 |

## 8. 출처 표기

- 봇 답변: 짧은 공급자명과 조회 시각
- README/문서: 직접 링크와 조사 기준일
- 코드 데이터: source/effective/verified 메타데이터
- 제3자 로고·스크린샷은 명시적 허가 없이는 저장소에 포함하지 않음

## 9. 정기 검토

출시 전과 이후 월 1회 다음을 확인합니다.

- KakaoTalk 운영정책
- Nexon Open API 공지·필드·호출 제한
- 한국투자 API 인증·시세 정책
- Maple.GG·Maplescouter 이용약관
- 메이플 계산식과 최대 레벨

변경이 기능에 영향을 주면 해당 기능을 기본 중지하고 문서·테스트·ADR을 먼저 갱신합니다.

