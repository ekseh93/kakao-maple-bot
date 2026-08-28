output "api_url" {
  description = "HTTP API base URL."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "lambda_function_name" {
  value = aws_lambda_function.bot.function_name
}

output "aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "usage_stats_table_name" {
  value = aws_dynamodb_table.usage_stats.name
}
