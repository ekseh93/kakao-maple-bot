# PC deals HTTP adapter

This small Node process bridges the Kakao bot's `POST /v1/quote` contract to the
stdio MCP server published at `kr-pc-deals-mcp`. It is intentionally separate
from the Lambda and phone relay because the MCP provider performs live
third-party price lookups.

## Local run

```powershell
$env:PC_DEALS_SHARED_SECRET = 'use-a-local-secret-only'
node apps/pc-deals-adapter/server.mjs
```

The process starts `npx -y kr-pc-deals-mcp` by default. Set `MCP_COMMAND` and
JSON-encoded `MCP_ARGS` when running from a pinned local installation. The
adapter exposes `GET /health` and an authenticated `POST /v1/quote` endpoint.

This is a personal, non-commercial integration. Respect Danawa/Compuzone
terms, request limits, and the upstream repository's license and disclaimer.
Do not commit the shared secret or scraped product data.
