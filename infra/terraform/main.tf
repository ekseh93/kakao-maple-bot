data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  tags = {
    Project   = var.project_name
    ManagedBy = "terraform"
  }
}

resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "bot" {
  function_name    = var.project_name
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  role             = aws_iam_role.lambda.arn
  handler          = "bundle.handler"
  runtime          = "nodejs22.x"
  timeout          = 5
  memory_size      = 256

  environment {
    variables = {
      BOT_SHARED_SECRET = var.bot_shared_secret
      BOT_ENABLED       = tostring(var.bot_enabled)
      ALLOWED_ROOMS     = var.allowed_rooms
      STOCK_ENABLED     = tostring(var.stock_enabled)
      NOTICE_ALERT_ENABLED = tostring(var.notice_alert_enabled)
      NOTICE_ALERT_KEYWORDS = var.notice_alert_keywords
      NEXON_API_KEY     = var.nexon_api_key
      KRX_AUTH_KEY      = var.krx_auth_key
      TIINGO_TOKEN      = var.tiingo_token
    }
  }

  tags = local.tags

  depends_on = [aws_iam_role_policy_attachment.lambda_logs]
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  tags          = local.tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.bot.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "messages" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /v1/messages"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
  tags        = local.tags
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bot.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
