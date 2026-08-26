# 구현 로드맵

문서 버전: 1.0

## Phase 0 — 저장소 기반

산출물:

- pnpm TypeScript workspace
- strict tsconfig, formatter, lint, Vitest
- Worker와 phone-relay 폴더
- CI 검사 전용 워크플로
- .env.example과 .gitignore

완료 조건:

- 빈 Worker health 테스트
- typecheck, lint, test, build 통과
- secret scan 구성

## Phase 1 — 순수 명령

범위:

- !도움말
- !주사위
- !골라
- !뭐먹지
- !심볼

완료 조건:

- 외부 API 없이 core 명령 테스트
- 심볼 공식 근거·fixture 검토
- 출력 1,000자 제한

## Phase 2 — Worker 경계

범위:

- POST /v1/messages
- shared secret
- 허용 방
- kill switch
- 입력 제한
- 구조화 비식별 로그
- timeout and error mapping

완료 조건:

- 인증·권한·rate limit 통합 테스트
- T-001~T-005, T-016~T-020 통과

## Phase 3 — Nexon 연동

범위:

- OCID
- 기본 정보
- 종합 스탯
- 장착 심볼 선택
- 캐시와 부분 성공
- Maple.GG/Maplescouter 링크

완료 조건:

- 공식 API fixture 계약 테스트
- 키 미설정·미존재·429·timeout
- 제3자 사이트 네트워크 호출이 코드에 없음

## Phase 4 — 공기계 릴레이

범위:

- MessengerBot R v40 호환 단일 bot.js
- 접두사 필터
- 인증 요청
- 답변 한 번 전송
- 로컬 구성 분리

완료 조건:

- 앱에서 컴파일
- 비공개 시험방 로컬 명령 E2E
- 재부팅·네트워크 단절·중복 시험

## Phase 5 — 선택형 주식

범위:

- 한국투자 OAuth 토큰
- 국내주식 현재가
- 짧은 TTL 캐시
- 조회 시각과 비권유 문구

완료 조건:

- 주문·계좌 권한 코드가 없음
- mock 계약 테스트
- 실제 키 시험은 사용자 승인 후 수행

## Phase 6 — 운영 안정화

범위:

- 24시간 soak test
- 운영 런북 실제 검증
- 응답 길이·캐시·rate limit 조정
- 최신 약관 재검토

출시 판단:

- 개인·동의된 제한 방에서만 사용
- 계정 위험을 수용하지 않으면 공식 Kakao 채널 방식으로 재설계

## 후속 후보

우선순위 순:

1. 방별 기능 설정
2. 메이플 이벤트·보스 일정
3. 캐릭터 즐겨찾기
4. 유니온·장비 요약
5. 공식 허가를 받은 환산 연동

후속 기능도 선제 메시지, 개인정보 저장, 외부 사이트 자동화는 기본 금지입니다.

