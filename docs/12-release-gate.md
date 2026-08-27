# 출시 승인 게이트

이 문서는 로컬 자동 검증 이후에만 사용하는 수동 절차입니다. 승인되지 않은 외부 상태 변경은 수행하지 않습니다.

## 사전 승인

- [ ] 사용자가 AWS Lambda/API Gateway 배포를 명시적으로 승인
- [ ] 사용자가 GitHub secret·CI 배포 권한 등록을 명시적으로 승인
- [ ] Nexon/KIS API 키가 운영자 계정에서 발급·보관됨
- [ ] 실제 사용 약관과 무료 한도·요금 정책을 재확인
- [ ] 제한된 동의 기반 카카오 시험방과 공기계가 준비됨

## 실행 순서

1. secret scan·policy check·audit·typecheck·test·build를 재실행합니다.
2. `pnpm lambda:dry-run`과 `pnpm lambda:package`로 배포 ZIP을 확인합니다.
3. `aws cloudformation validate-template --template-body file://apps/lambda/template.yaml`로 템플릿을 확인합니다.
4. 승인된 경우에만 `LAMBDA_ARTIFACT_BUCKET`, `DEPLOY_CONFIRMATION`을 설정하고 AWS CLI/CloudFormation 배포를 실행합니다.
5. `/health`와 인증된 `/v1/messages`를 실제 URL에서 확인합니다.
6. 공기계에서 릴레이를 컴파일하고 비공개 시험방에서 명령 1회 응답을 확인합니다.
7. 네트워크 단절·재부팅·중복 이벤트·kill switch를 확인합니다.
8. 관측한 결과만 `docs/10-local-verification.md`에 별도 날짜로 추가합니다.

## 금지 범위

Maple.GG와 Maplescouter는 계속 링크 전용입니다. 주문·계좌 API, 광고·초대·선제 알림, 대화 원문 저장은 출시 게이트에서도 허용하지 않습니다.
