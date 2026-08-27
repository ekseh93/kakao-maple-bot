variable "aws_region" {
  description = "AWS region for the stack. This project is Tokyo-only."
  type        = string
  default     = "ap-northeast-1"

  validation {
    condition     = var.aws_region == "ap-northeast-1"
    error_message = "This project only supports the Tokyo region ap-northeast-1."
  }
}

variable "project_name" {
  description = "Stable prefix for AWS resource names."
  type        = string
  default     = "kakao-maple-bot"
}

variable "lambda_zip_path" {
  description = "Path to the ZIP created by pnpm lambda:package."
  type        = string
  default     = "../../apps/lambda/dist/lambda.zip"
}

variable "bot_shared_secret" {
  description = "Bearer secret for the phone relay. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "bot_enabled" {
  description = "Enable command processing after a private test room is ready."
  type        = bool
  default     = false
}

variable "allowed_rooms" {
  description = "Comma-separated allowlist of room IDs."
  type        = string
  default     = ""
}

variable "stock_enabled" {
  description = "Enable read-only KIS stock lookup."
  type        = bool
  default     = false
}

variable "nexon_api_key" {
  description = "Nexon Open API key. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "kis_app_key" {
  description = "KIS app key. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "kis_app_secret" {
  description = "KIS app secret. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}
