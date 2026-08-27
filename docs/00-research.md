# 조사 기록과 사례

기준일: 2026-08-26

## 조사 결론

사용자가 선택한 “공기계 + 별도 카카오 계정” 방식에는 카카오 디벨로퍼스의 챗봇 템플릿이 필수되지 않습니다. 해당 템플릿은 공식 채널형 챗봇에 가깝고, 일반 카카오 계정이 채팅방에서 사람처럼 답장하게 하는 방식과는 다릅니다.

공기계형 구현은 MessengerBot R 또는 Iris 같은 비공식 Android 도구를 사용합니다. 구현 가능성은 충분하지만 카카오가 공식 허용한 일반 계정 봇 방식이 아니므로 계정·메시지 전송 제한 위험을 제품 요구사항으로 받아들여야 합니다.

## 참고 사례

### MessengerBot R v40 릴레이형 사례

- [AVD-KakaoBot](https://github.com/Kminer2053/AVD-KakaoBot)은 MessengerBot R v40, 공기계 스크립트, 백엔드 연동, GitHub 비밀정보 분리 구조를 공개합니다.
- [KBotDocs 개발 준비](https://kbotdocs.dev/learn/js/basic/2-ready-for-dev)는 Android 설치와 기본 개발 절차를 설명합니다.
- 시사점: 공기계에는 단일 스크립트만 두고 계산과 API 연동은 서버로 분리하는 편이 유지보수에 유리합니다.

### 브리지·프레임워크 사례

- [remote-kakao/core](https://github.com/remote-kakao/core)는 MessengerBot과 Node.js를 연결하는 비공식 브리지 사례입니다.
- [Iris](https://github.com/dolidolih/Iris)는 Android의 DB 관찰·메시지 브로커·답장 전송 구조를 보여줍니다.
- 시사점: 기능이 커질수록 서버형 구조가 편하지만, DB 직접 관찰이나 프로토콜 의존도를 높이면 카카오 업데이트와 정책 변화에 더 취약해집니다. MVP는 MessengerBot R 알림 기반 릴레이를 우선합니다.

### 메이플 커뮤니티 서비스 사례

- [Maple.GG](https://maple.gg/)는 캐릭터 검색, 통계, 가이드와 링크 중심 UX의 기준점입니다.
- [Maplescouter](https://maplescouter.com/ko/result?manual=true)는 환산, 보스컷, 심볼 효율 등 계산 기능의 범위를 보여줍니다.
- [Nexon Open API MapleStory](https://openapi.nexon.com/game/maplestory/)는 캐릭터 기본·스탯·장비·심볼 등 공식 데이터 경로를 제공합니다.
- 시사점: “짧은 요약 + 원본 서비스 상세 링크”가 카카오 텍스트 UI에 적합합니다. 다른 서비스의 계산 결과를 백엔드처럼 호출하지 않고 공식 API와 자체 계산식을 조합해야 합니다.

## 정책·약관 조사

### KakaoTalk

[KakaoTalk 비정상 이용 운영정책](https://talksafety.kakao.com/en/policy/stability/abnormalusage)은 카카오가 허용하지 않은 프로그램, 비정상 API 호출, 자동화 도구 배포 등에 따른 이용 제한 가능성을 안내합니다.

설계 대응:

- 봇 전용 계정을 사용하더라도 계정 제한 가능성을 0으로 표현하지 않습니다.
- 불특정 다수에게 선제 발송하지 않습니다.
- 초대·친구 추가·광고·대량 발송 기능을 만들지 않습니다.
- 명시적 접두사 명령에만 답하고 방별 비활성화 기능을 둡니다.
- 메시지 속도 제한과 긴급 중지 스위치를 둡니다.

### Maplescouter

[Maplescouter 이용약관](https://maplescouter.com/ko/agreement)은 2026-07-11 시행 약관에서 봇·스크립트·크롤러·헤드리스 브라우저·MCP 등의 자동 접근, 계산 기능을 다른 서비스의 백엔드로 사용하는 행위, 엔드포인트·토큰 추출, 접근제어 우회를 금지합니다.

설계 대응: 자동 호출과 결과 재표시를 금지하고, 사이트 링크만 제공합니다. 공식 서면 허락이 저장소에 추가되기 전에는 예외가 없습니다.

### Maple.GG

[Maple.GG 이용약관](https://maple.gg/about/agreement)은 서비스에서 얻은 정보를 사전 승낙 없이 복제·출판하거나 제3자에게 제공하는 행위를 제한합니다.

설계 대응: 페이지 크롤링·내용 복제 없이 캐릭터 상세 페이지 링크만 만듭니다.

## 기술 선택

| 후보 | 장점 | 단점 | 결정 |
|---|---|---|---|
| Kakao OpenBuilder | 공식, 템플릿 카드 | 일반 계정 공기계 봇과 목적이 다름 | 미채택 |
| MessengerBot R v40 | 공기계·알림 기반, 시작이 단순 | 비공식, Android/Kakao 변경 영향 | MVP 채택 |
| Iris | 확장성과 서버 연동 사례 | 더 높은 침투성·운영 복잡도 | 보류 |
| AWS Lambda + API Gateway HTTP API | AWS 서버리스·IAM·관측성 포트폴리오 | Free Tier 초과 과금·구성 복잡도 | 백엔드 기본안 |
| Nexon Open API | 공식 메이플 데이터 | 키·호출 제한·지연 | 채택 |
| 한국투자 Open API | 국내 주식 공식 API | 별도 앱키와 토큰 관리 | 선택 기능 |

## 조사 한계

- 커뮤니티 봇의 실제 이용 규모나 운영 기간은 운영자가 공개한 수치 외에 독립 검증이 어렵습니다.
- 외부 약관과 API 필드는 변경될 수 있으므로 구현 시점과 정기 점검 시점에 다시 확인합니다.
- 이 문서는 법률 자문이 아니며, 실제 공개 운영 전에는 각 서비스의 최신 약관을 운영자가 재확인합니다.

