module "general_bot" {
  source = "../terraform"

  aws_region             = var.aws_region
  project_name           = var.project_name
  lambda_zip_path        = var.lambda_zip_path
  bot_shared_secret      = var.bot_shared_secret
  bot_enabled            = var.bot_enabled
  maple_commands_enabled = false
  allowed_rooms          = var.allowed_rooms
  admin_senders          = var.admin_senders
  stock_enabled          = var.stock_enabled
  notice_alert_enabled   = false
  notice_alert_keywords  = var.notice_alert_keywords
  nexon_api_key          = var.nexon_api_key
  krx_auth_key           = var.krx_auth_key
  tiingo_token           = var.tiingo_token
  tmdb_read_access_token = var.tmdb_read_access_token
  tmdb_region            = var.tmdb_region
  usage_stats_table_name = var.usage_stats_table_name
}
