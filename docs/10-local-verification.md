# 로컬 검증 기록

기준일: 2026-08-26  
범위: 로컬 자동 검증과 별도 승인된 AWS smoke test 기록. 실제 공기계 E2E는 사용자 관측과 Codex 관측을 구분합니다.

## 관측된 결과

다음 명령을 현재 작업 트리에서 실행했고 모두 통과했습니다.

```text
pnpm typecheck
pnpm test       # 37 tests passed
pnpm lint
pnpm build
pnpm format:check
pnpm policy:check
pnpm phone:check
pnpm audit       # no known vulnerabilities found
git diff --check
```

AWS Lambda TypeScript 번들은 `pnpm lambda:dry-run`으로 로컬 빌드하고, `pnpm lambda:package`로 Lambda용 ZIP을 생성합니다. 과거 로컬 검증 이후 도쿄 AWS Lambda/API Gateway에 대한 `/health` 및 인증 API smoke test는 별도로 관측했습니다. 이 문서의 자동 검증 결과와 실제 공기계 E2E 결과를 섞지 않습니다.

동일 검사는 `pnpm lambda:dry-run`과 `pnpm lambda:package`로 재현할 수 있습니다. CloudFormation 템플릿은 AWS CLI의 `aws cloudformation validate-template`로 정적 검증할 수 있습니다.

## 로컬에서 확인한 범위

- 느낌표 명령 파싱 및 일반 대화 무응답
- 허용 방·관리자 권한·kill switch
- 방·발신자·전체 rate limit
- 중복 이벤트 2분 TTL
- 캐릭터·주식 캐시와 공급자 재시도
- Nexon/KRX/Tiingo mock 응답 및 malformed schema 격리
- 인증, JSON, 필수 필드, 16 KiB 본문 경계
- 비식별 audit log 필드
- Maple.GG·Maplescouter 링크 전용 정책 검사
- MessengerBot R 릴레이 JavaScript 구문

## 별도 관측 기록

- 도쿄 리전 API Gateway `/health`: HTTP 200 및 `{"status":"ok"}` 응답을 확인했습니다.
- 인증된 `/v1/messages` smoke test에서 `!도움말`에 대한 HTTP 200과 reply 필드를 확인했습니다.
- 사용자는 공기계 MessengerBot R과 카카오톡에서 정상 사용 중이라고 보고했습니다. 이는 사용자 제공 운영 확인이며 Codex가 공기계 화면을 직접 관측한 결과가 아닙니다.

## 아직 관측하지 않은 범위

- 실제 Nexon/KRX/Tiingo API 키를 사용한 공급자 응답
- GitHub secret 등록 또는 CI 실행 결과
- MessengerBot R 앱 컴파일 및 Android 공기계 E2E의 독립 재현
- 24시간 soak test, 재부팅·네트워크 단절 복구

위 항목은 별도 사용자 승인과 계정·기기 준비 후에만 수행합니다.
