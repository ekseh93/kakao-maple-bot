# 로컬 검증 기록

기준일: 2026-08-26  
범위: 실제 외부 계정·배포·공기계 없이 수행한 로컬 검증

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

AWS Lambda TypeScript 번들은 `pnpm lambda:dry-run`으로 로컬 빌드하고, `pnpm lambda:package`로 Lambda용 ZIP을 생성합니다. 실제 AWS 배포는 실행하지 않았습니다.

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

## 아직 관측하지 않은 범위

- 실제 Nexon/KRX/Tiingo API 키를 사용한 공급자 응답
- AWS 계정·Lambda/API Gateway 배포 및 운영 URL
- GitHub secret 등록 또는 CI 실행 결과
- MessengerBot R 앱 컴파일 및 Android 공기계 E2E
- 24시간 soak test, 재부팅·네트워크 단절 복구

위 항목은 별도 사용자 승인과 계정·기기 준비 후에만 수행합니다.
