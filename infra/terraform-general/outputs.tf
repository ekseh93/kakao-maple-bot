output "api_url" {
  description = "HTTP API base URL for the separate general bot."
  value       = module.general_bot.api_url
}

output "lambda_function_name" {
  value = module.general_bot.lambda_function_name
}

output "aws_account_id" {
  value = module.general_bot.aws_account_id
}

output "usage_stats_table_name" {
  value = module.general_bot.usage_stats_table_name
}
