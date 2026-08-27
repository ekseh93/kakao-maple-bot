# 요구사항 추적성

기준일: 2026-08-26  
범위: 로컬 자동 검증 기준

## 기능 요구사항

| 요구사항      | 구현 위치                              | 검증                      | 상태      |
| ------------- | -------------------------------------- | ------------------------- | --------- |
| FR-001~FR-002 | `packages/core`, Lambda router         | T-001, T-005              | 로컬 통과 |
| FR-003~FR-004 | `packages/providers`, Lambda formatter | T-006~T-008, T-019        | mock 통과 |
| FR-005        | `packages/core` symbol calculator      | T-009~T-010               | 로컬 통과 |
| FR-006~FR-008 | `packages/core`, Lambda router         | T-011~T-013               | 로컬 통과 |
| FR-009        | KRX/Tiingo adapter                     | T-014~T-015               | mock 통과 |
| FR-010~FR-012 | Lambda HTTP boundary                   | T-002, T-016~T-017, T-020 | 로컬 통과 |
| FR-013        | Lambda/provider cache                  | cache contract tests      | 로컬 통과 |
| FR-014        | Lambda `!상태`                         | admin authorization test  | 로컬 통과 |
| FR-015        | 방별 최소 허용 목록                    | configuration boundary    | 후속 후보 |

## 비기능 요구사항

- `NFR-PERF-003`: provider-derived reply 1,000자 상한 테스트 통과
- `NFR-REL-002`: 네트워크 오류·5xx 1회 재시도, 429 비재시도 테스트 통과
- `NFR-REL-003`: 이벤트 ID 2분 TTL 테스트 통과
- `NFR-SEC-001`: Bearer 인증과 일정 시간 비교 테스트 경계 적용
- `NFR-SEC-002~004`: HTTPS endpoint 계약, secret-free health, 비식별 audit log 테스트 통과
- `NFR-SEC-006`: CI policy check와 dependency lockfile 사용
- `NFR-MNT-001~003`: core/provider/Lambda 분리 및 strict TypeScript

## 테스트 매트릭스 해석

현재 로컬에서는 T-001~T-020에 해당하는 구성 가능한 동작을 mock·통합 경계로 검증했습니다. 실제 API 응답, AWS 운영 URL, GitHub Actions 실행, Android/MessengerBot R 컴파일, 공기계 E2E와 24시간 soak test는 관측하지 않았습니다.

외부 검증 단계는 사용자 승인, 실제 secret 주입, 제한된 시험방 준비가 끝난 뒤 별도 기록으로 추가합니다.
