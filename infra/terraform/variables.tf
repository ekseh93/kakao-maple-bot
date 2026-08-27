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

variable "admin_senders" {
  description = "Comma-separated sender display names allowed to use !상태."
  type        = string
  default     = ""
}

variable "stock_enabled" {
  description = "Enable read-only KRX and Tiingo stock lookup."
  type        = bool
  default     = false
}

variable "notice_alert_enabled" {
  description = "Enable proactive Nexon notice keyword alerts through the phone relay."
  type        = bool
  default     = false
}

variable "notice_alert_keywords" {
  description = "Comma-separated Nexon notice title keywords for proactive alerts."
  type        = string
  default     = "채널 점검,마이너버전,클라이언트"
}

variable "nexon_api_key" {
  description = "Nexon Open API key. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "krx_auth_key" {
  description = "KRX Open API auth key. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tiingo_token" {
  description = "Tiingo API token. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tmdb_read_access_token" {
  description = "TMDB API Read Access Token. Keep this outside Git."
  type        = string
  sensitive   = true
  default     = ""
}

variable "tmdb_region" {
  description = "ISO 3166-1 region used for Netflix availability filtering."
  type        = string
  default     = "KR"

  validation {
    condition     = length(var.tmdb_region) == 2 && var.tmdb_region == upper(var.tmdb_region)
    error_message = "tmdb_region must be a two-letter uppercase ISO country code, such as KR or JP."
  }
}
