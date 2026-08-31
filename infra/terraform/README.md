# Terraform AWS 설계

이 디렉터리는 도쿄 리전(`ap-northeast-1`)의 AWS Lambda + API Gateway HTTP API를 Terraform으로 설계한 대안입니다. 기본값은 `BOT_ENABLED=false`, 허용 방 비어 있음, 주식 기능 비활성화이며 `terraform apply` 전에는 AWS 리소스를 만들지 않습니다.

## 로컬 검증

저장소 루트에서 먼저 Lambda ZIP을 생성합니다.

```powershell
pnpm lambda:package
Set-Location infra/terraform
terraform fmt -check
terraform init
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

`terraform init`은 provider 플러그인을 다운로드할 수 있고, `plan`은 AWS provider가 현재 계정에 읽기 요청을 할 수 있습니다. 실제 리소스 생성은 `terraform apply`를 명시적으로 실행할 때만 발생합니다.

## 배포 전 준비

1. root가 아닌 IAM Identity Center 또는 IAM 역할 프로필로 로그인합니다.
2. `terraform.tfvars.example`을 복사해 `terraform.tfvars`를 만들고 실제 값을 넣습니다.
3. secret은 Git에 커밋하지 않습니다. `terraform.tfvars`와 `.terraform/`, state 파일은 `.gitignore` 대상입니다.
4. `terraform plan`의 생성·변경 목록과 예상 비용을 검토합니다.
5. 별도 승인 후에만 `terraform apply`를 실행합니다.

이 설계는 Lambda ZIP을 `filename`으로 직접 업로드하므로 별도 artifact S3 버킷이 필요하지 않습니다. Terraform state의 원격 저장소·잠금은 운영 단계에서 별도로 설계해야 하며, 현재 구성은 로컬 state 초안입니다.
