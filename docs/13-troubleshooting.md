# 트러블슈팅 기록

이 문서는 AWS 전환 과정에서 실제로 관찰한 오류와 해결 결과를 구현 변경과 분리해 기록합니다. 날짜는 2026-08-27 기준입니다.

## 구현 변경

### 1. Cloudflare Worker에서 AWS Lambda로 전환

- 변경: `apps/worker`를 `apps/lambda`로 변경하고 Lambda handler를 추가했습니다.
- 이유: AWS 서버리스·IAM·API Gateway 경험을 포트폴리오에 남기기 위해서입니다.
- 제한: Maple.GG와 Maplescouter에는 계속 링크만 생성하며 자동 HTTP 접근을 하지 않습니다.

### 2. SAM 템플릿에서 순수 CloudFormation으로 전환

- 변경: `AWS::Serverless::Function`과 `CodeUri`를 제거했습니다.
- 추가: Lambda, IAM execution role, API Gateway HTTP API, routes, stage, invoke permission을 명시했습니다.
- 이유: SAM CLI 없이 AWS CLI와 CloudFormation만으로 패키징·업로드·배포할 수 있게 하기 위해서입니다.

### 3. AWS CLI 배포 흐름 추가

- `pnpm lambda:dry-run`: TypeScript 빌드와 esbuild ESM 번들
- `pnpm lambda:package`: `bundle.js`와 ESM `package.json`을 Lambda ZIP으로 생성
- `pnpm lambda:deploy`: 현재 AWS 주체 확인 → S3 업로드 → CloudFormation deploy
- 안전장치: `DEPLOY_CONFIRMATION=I_APPROVE_AWS_DEPLOYMENT`가 없으면 중단하고, root 계정은 `ALLOW_ROOT_DEPLOY=true` 없이는 거부합니다.

## 오류와 해결

### 1. `sam` 용어를 찾을 수 없음

증상:

```text
sam : 'sam' 용어가 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다.
```

원인: AWS SAM CLI가 설치되지 않았거나 PATH에 등록되지 않았습니다.

해결: SAM CLI 설치를 필수로 만들지 않고, AWS CLI + 순수 CloudFormation 방식으로 전환했습니다. `aws cloudformation validate-template`는 SAM CLI 없이 통과했습니다.

### 2. esbuild 번들 handler가 함수로 노출되지 않음

원인: ESM 프로젝트에서 esbuild 기본 CommonJS 출력과 Node.js ESM 해석이 충돌했습니다.

해결: `--format=esm`을 지정하고 Lambda ZIP에 `package.json`의 `{"type":"module"}`을 포함했습니다. 번들 `/health` 실행 결과는 상태 코드 200입니다.

### 3. root 계정으로 AWS CLI가 인증됨

관찰 결과 `arn:aws:iam::<account>:root`였습니다.

해결: 배포 스크립트가 root 계정 배포를 기본 거부하도록 했습니다. IAM 사용자 또는 역할로 전환한 뒤 배포해야 합니다. root 예외 플래그를 임의로 활성화하지 않습니다.

### 4. SAM CLI 검증 불가

SAM CLI가 설치되지 않아 `sam validate`는 실행할 수 없었습니다. 대신 AWS CLI로 다음 정적 검증을 실행했고 통과했습니다.

```powershell
aws cloudformation validate-template --template-body file://apps/lambda/template.yaml --region ap-northeast-1
```

### 5. Terraform plan에서 AWS 자격 증명을 찾지 못함

증상:

```text
Error: No valid credential sources found
```

원인: AWS CLI의 로그인 세션이 만료되었거나 Terraform이 사용할 AWS 프로필이 지정되지 않았습니다.

해결: `aws sso login --profile <profile>` 또는 `aws login`으로 재인증하고, 필요한 경우 `$env:AWS_PROFILE`을 지정합니다. 자격 증명을 저장소 파일이나 `terraform.tfvars`에 커밋하지 않습니다. 이 오류가 발생한 상태에서는 Terraform `plan`과 `apply`를 실행하지 않습니다.

### 6. IAM Identity Center 사용자·권한 세트 준비

Terraform 배포용 프로젝트 전용 사용자를 IAM Identity Center에 만들고, `KakaoMapleDeveloper` 권한 세트를 계정에 할당했습니다. 권한 세트 정책은 `kakao-maple-bot-*` 이름으로 제한된 Lambda와 IAM 역할, API Gateway 관리 권한만 포함합니다.

CLI에서는 다음 순서로 해당 사용자의 AWS access portal 인증을 완료합니다.

```powershell
aws configure sso
aws sso login --profile kakao-maple
$env:AWS_PROFILE = "kakao-maple"
aws sts get-caller-identity
```

`get-caller-identity` 결과가 root ARN이면 Terraform을 실행하지 않고 SSO 프로필을 다시 선택합니다. 브라우저에서 사용자의 초기 비밀번호 설정과 MFA 정책이 요구될 수 있습니다.

### 7. 리전이 다른 값으로 설정되는 문제

이 프로젝트는 도쿄 리전(`ap-northeast-1`)만 허용합니다. Terraform의 `aws_region` 변수에 다른 값을 넣으면 validation 단계에서 중단되며, AWS CLI 배포 스크립트도 CloudFormation·S3·STS 요청에 도쿄 리전을 강제합니다. 사용자의 거주 지역과 비용 관리 범위를 문서화하기 위한 정책입니다.

## 현재 미수행 항목

- 실제 Lambda/API Gateway 리소스 생성·갱신
- S3 artifact 버킷 업로드
- API 키·GitHub secret 등록
- 공기계와 카카오 비공개 시험방 E2E

위 항목은 승인과 준비가 된 뒤에도 관측한 결과만 기록합니다.
