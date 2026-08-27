# ADR-005: AWS Lambda + API Gateway HTTP API 전환

상태: Accepted  
일자: 2026-08-26  
대체: 초기 Cloudflare Worker 구현

## 배경

Cloudflare Worker는 단순한 엣지 실행에는 적합하지만, 이 프로젝트를 AWS 서버리스·IAM·Lambda·API Gateway 운영 경험을 보여주는 취업 포트폴리오로 발전시키려는 방향과 맞지 않았습니다.

## 결정

- 백엔드는 AWS Lambda Node.js 22 handler로 구현합니다.
- 공개 HTTP 경계는 API Gateway HTTP API Lambda proxy integration을 사용합니다.
- 인프라는 순수 CloudFormation template으로 관리하고 AWS CLI로 배포합니다.
- Terraform은 AWS CLI/CloudFormation과 병행 검토할 수 있는 선언형 설계 대안으로 제공합니다.
- `packages/core`와 `packages/providers`는 플랫폼 독립적으로 유지합니다.
- 실제 배포·secret 등록·계정 변경은 별도 승인을 유지합니다.

## 결과

- AWS 서버리스·IAM·CloudWatch·API Gateway를 포트폴리오에서 설명할 수 있습니다.
- Lambda cold start와 AWS 서비스별 Free Tier·요금 관리가 필요합니다.
- 현재 전환은 로컬 코드·템플릿·테스트까지만 반영했으며 실제 AWS 리소스는 만들지 않았습니다.
- SAM CLI는 필수가 아니며, esbuild 번들·ZIP·S3 업로드·CloudFormation 실행을 AWS CLI 스크립트로 분리했습니다.
- Terraform 대안은 Lambda ZIP 직접 업로드 방식으로 별도 artifact S3 버킷 없이 먼저 `plan`할 수 있습니다.
- AWS Free Tier는 사용량·기간 제한이 있으므로 0원 운영을 보장하지 않으며 Budget과 사용량 확인이 필요합니다.
