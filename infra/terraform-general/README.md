# General Chat Bot Terraform service

This is a separate AWS Lambda + API Gateway service for the non-Maple commands. It reuses the tested Lambda implementation with `MAPLE_COMMANDS_ENABLED=false`, its own resource names, Terraform state, usage table, and API endpoint.

The service includes the existing general-purpose commands such as arithmetic and meso splitting, food recommendations, rock-paper-scissors, menu choice, fortune, lotto, travel/media recommendations, weather, stock, exchange rates, fuel, Daiso, usage statistics, and admin status. MapleStory commands are ignored, and the help response lists only the general commands.

## Local preparation

From the repository root:

```powershell
pnpm lambda:package
Set-Location infra/terraform-general
Copy-Item terraform.tfvars.example terraform.tfvars
# Set a new room name and a second-service secret in the ignored terraform.tfvars.
terraform init
terraform fmt -recursive
terraform validate
terraform plan -var-file=terraform.tfvars
```

Apply only after confirming the room name, secret, and plan:

```powershell
terraform apply -var-file=terraform.tfvars
```

The state and `terraform.tfvars` remain local and are ignored by Git. Use a dedicated phone secret for this service; do not reuse or publish the Maple bot secret.
