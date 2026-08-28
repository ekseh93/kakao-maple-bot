# Kakao Maple Bot

[한국어 README](README.md) · [日本語 README](README.ja.md)

A personal, non-commercial portfolio chatbot that uses a spare Android phone running MessengerBot R as a KakaoTalk gateway. The backend provides MapleStory data, symbol calculations, probability-based mini-games, recommendations, weather, exchange rates, fuel prices, and read-only stock quotes.

> Status: Phase 0–6 implementation, automated verification, and Tokyo-region AWS deployment are complete. Spare-phone operation is reported by the user; Codex has not independently observed the Android device end to end.

## Architecture

```text
KakaoTalk
    ↕ Android notification/reply
MessengerBot R v40 on a spare phone
    ↕ HTTPS + shared secret
API Gateway HTTP API
    ↓
AWS Lambda
    ├─ command router
    ├─ Maple adapter ─ Nexon Open API
    ├─ stock adapter ─ Yahoo Finance / Tiingo
    ├─ calculators / random / food
    └─ cache, timeout, audit-safe logs
```

The phone script is intentionally thin. Command rules, calculations, caching, provider calls, and secret-backed authentication stay in the TypeScript Lambda backend.

## Command groups

### MapleStory

`!정보 <nickname>`, `!무릉 <nickname>`, `!유니온 <nickname>`, `!유챔 <nickname>`, `!장비 <nickname>`, `!경험치 <nickname>`, `!심볼 <area> <start> <target>`, `!심볼만렙`, `!보스`, `!보스보상`, `!보스렙뻥`, `!보스포뻥`, `!메카베리 <level>`, `!메포효율`, `!공지`, `!이벤트`, `!썬데이`, `!선데이`, `!인벤`, `!마빡도로시`, and `!디코`.

Maple character data uses the Nexon Open API. Maple.GG and Maplescouter are link-only destinations; the bot does not crawl or automatically access them.

### Mini-games

`!부티크`, `!로얄`, `!원더베리`, `!루나스윗`, `!루나드림`, `!가위`, `!바위`, and `!보`.

Probability-based commands are simulations only. They do not purchase or grant cash items.

### General features

`!날씨 <location>`, `!주식 <name>`, `!환율`, `!기름`, `!유가`, `!주유소 <region>`, `!골라 <items>`, `!뭐먹지`, `!ㅁㅁㅈ`, `!운세 <birth date> <gender> <calendar>`, `!로또`, `!넷플`, `!애니`, `!만화`, `!웹툰`, `!웹소설`, `!일본여행`, `!일본여행기`, `!일본음식점`, `!핫딜`, `!글카`, `!모니터`, `!금주의신상`, `!다이소 <product>`, `!통계`, and `!상태`.

`!핫딜` shows six Quasar Zone titles numbered from 0 with the listed time, plus up to five titles each from Arca Live and FMKorea in compact mobile-friendly sections.

The Lambda emits anonymous command-usage audit records only. A local script aggregates daily totals and a separate deterministic synthetic report is available for portfolio use; raw chat data is never committed.

`!통계` reads an anonymous aggregate counter stored as one encrypted, on-demand DynamoDB item in Tokyo. It does not store room names, sender names, or message text. The counter starts when the DynamoDB resource is deployed; earlier CloudWatch records are not retroactively imported.

`!주식` is informational only and does not place orders or access accounts. `!운세` is a deterministic entertainment feature based on date, gender, calendar type, and Korea Standard Time; it does not call an LLM or a remote fortune MCP server.

## Data and safety policy

- AWS is fixed to Tokyo, `ap-northeast-1`, for a single-region cost boundary.
- The project is designed for a personal, zero-cash-cost portfolio scope. Free Tier does not guarantee a zero bill; budgets and usage monitoring are still required.
- The usage counter uses DynamoDB on-demand billing. It has no fixed monthly table fee, but read/write request charges can apply after free allowances.
- API keys, shared secrets, Kakao identifiers, room names, and chat logs are never committed.
- Public-board providers use timeouts, caching, error isolation, and permitted stale fallback. The bot does not use proxy rotation, IP changes, or other access-control bypasses.
- The phone relay contains only a placeholder. Replace `sharedSecret` and the consented room placeholder in the private phone copy only.
- The public repository does not include the user's original chat screenshot.

## Local development

Node.js 22 and pnpm 11 are expected.

```powershell
pnpm install --ignore-scripts
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm lambda:dry-run
pnpm format:check
pnpm policy:check
pnpm phone:check
pnpm audit
```

The current verification result is 149 passing tests, with typecheck, lint, format, policy, phone syntax, Lambda dry-run, and audit checks passing.

## AWS deployment

The project uses AWS Lambda + API Gateway HTTP API with pure CloudFormation and Terraform designs. SAM CLI is not required. Terraform `plan` is a review step; `apply` and deployment require explicit approval and valid IAM Identity Center credentials.

All AWS requests must target `ap-northeast-1`. Use an assumed IAM Identity Center role rather than a root ARN. Keep `terraform.tfvars`, API keys, and shared secrets outside Git.

The previously observed `/health` and authenticated message smoke tests are documented separately. No claim is made here about an unobserved device state or a new deployment.

## Portfolio evidence

- [Privacy-redacted Korean evidence image](docs/assets/kakao-bot-evidence-redacted.png)
- [English translated portfolio image](docs/assets/kakao-bot-evidence-en.png)
- [Japanese translated portfolio image](docs/assets/kakao-bot-evidence-ja.png)
- [Evidence and publication scope](docs/17-portfolio-evidence.md)
- [Troubleshooting record](docs/13-troubleshooting.md)

The English and Japanese images are privacy-safe translation/simplification variants for presentation. They preserve the chatbot command-and-response concept but are not authoritative OCR copies of the original chat log.

## Documentation

See the [Korean documentation index](README.md#문서) for product requirements, architecture, command contracts, API policy, security operations, tests, release gates, troubleshooting, and the phone E2E checklist.

## License

No license has been granted. Until a separate license is added, this remains a personal, non-commercial portfolio repository.
