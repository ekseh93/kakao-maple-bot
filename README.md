# Kakao Maple Bot

공기계의 카카오톡 계정을 입구로 사용해 메이플스토리 정보, 심볼 계산, 랜덤 게임, 메뉴 추천, 국내 주식 시세를 제공하는 개인용 챗봇 프로젝트입니다.

> 현재 단계: 상류 설계 완료, 구현 전

## 핵심 결정

- 카카오 디벨로퍼스/OpenBuilder가 아니라 Android 공기계 + MessengerBot R v40을 사용합니다.
- 공기계 스크립트는 메시지를 HTTPS 백엔드에 전달하고 답변을 카카오톡에 보내는 얇은 릴레이로 제한합니다.
- 백엔드는 TypeScript 기반 Cloudflare Workers를 기본안으로 합니다.
- 메이플 캐릭터 데이터는 Nexon Open API에서 직접 가져옵니다.
- Maple.GG와 Maplescouter는 크롤링하거나 비공개 API를 재사용하지 않고 사용자용 링크만 제공합니다.
- 심볼 계산식은 프로젝트가 직접 구현하고, 근거와 데이터 기준일을 함께 관리합니다.
- 국내 주식은 한국투자 Open API를 선택형 공급자로 사용하며 투자 권유 기능은 만들지 않습니다.
- 실제 현금 비용이 들지 않는 개인 취업 포트폴리오 범위로 설계합니다.

## 목표 기능

| 영역 | MVP 명령 예시 | 데이터 출처 |
|---|---|---|
| 메이플 캐릭터 | !캐릭터 닉네임 | Nexon Open API |
| 심볼 계산 | !심볼 아케인 1 20 | 자체 계산식 |
| 외부 상세보기 | !메이플링크 닉네임 | Maple.GG / Maplescouter 링크 |
| 랜덤 게임 | !주사위, !골라 A,B,C | 자체 로직 |
| 메뉴 추천 | !뭐먹지 한식 | 저장소 내 정적 데이터 |
| 국내 주식 | !주식 005930 | 한국투자 Open API |

전체 명령 계약은 [명령어 명세](docs/04-command-specification.md)에 있습니다.

## 구조

    KakaoTalk
        ↕ Android notification/reply
    MessengerBot R v40 on spare phone
        ↕ HTTPS + shared secret
    Cloudflare Worker
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
11. [아키텍처 결정 기록](docs/decisions/README.md)

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

## 라이선스

아직 라이선스를 부여하지 않았습니다. 별도 라이선스가 추가되기 전까지 복제·배포·상업적 이용 권한을 허용하지 않는 개인 비상업 포트폴리오입니다.

