variable "aws_region" {
  description = "AWS region for the general bot service."
  type        = string
  default     = "ap-northeast-1"

  validation {
    condition     = var.aws_region == "ap-northeast-1"
    error_message = "This project only supports the Tokyo region ap-northeast-1."
  }
}

variable "project_name" {
  description = "Stable prefix for the separate general bot service."
  type        = string
  default     = "kakao-general-bot"
}

variable "lambda_zip_path" {
  description = "Path to the ZIP created by pnpm lambda:package."
  type        = string
  default     = "../../apps/lambda/dist/lambda.zip"
}

variable "bot_shared_secret" {
  description = "Bearer secret for the second phone relay. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "bot_enabled" {
  description = "Enable the separate general bot after a private room is ready."
  type        = bool
  default     = false
}

variable "allowed_rooms" {
  description = "Comma-separated allowlist for the second bot."
  type        = string
  default     = ""
}

variable "admin_senders" {
  description = "Comma-separated sender display names allowed to use !상태."
  type        = string
  default     = ""
}

variable "stock_enabled" {
  description = "Enable read-only stock lookup for the general bot."
  type        = bool
  default     = false
}

variable "notice_alert_enabled" {
  description = "Unused for the general-only service."
  type        = bool
  default     = false
}

variable "notice_alert_keywords" {
  description = "Retained for shared module compatibility."
  type        = string
  default     = ""
}

variable "nexon_api_key" {
  description = "Unused by the general-only service."
  type        = string
  sensitive   = true
  default     = ""
}

variable "krx_auth_key" {
  description = "Optional KRX key for read-only stock lookup."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tiingo_token" {
  description = "Optional Tiingo token for read-only stock lookup."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tmdb_read_access_token" {
  description = "Optional TMDB token for Netflix recommendations."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tmdb_region" {
  description = "ISO country code used for Netflix filtering."
  type        = string
  default     = "KR"

  validation {
    condition     = length(var.tmdb_region) == 2 && var.tmdb_region == upper(var.tmdb_region)
    error_message = "tmdb_region must be a two-letter uppercase ISO country code."
  }
}

variable "usage_stats_table_name" {
  description = "Separate anonymous aggregate counter table."
  type        = string
  default     = "kakao-general-bot-usage-stats"
}
