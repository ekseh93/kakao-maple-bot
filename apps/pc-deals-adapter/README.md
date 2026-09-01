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
adapter exposes `GET /health`, an authenticated `POST /v1/quote` endpoint, and
an authenticated `POST /v1/tool` endpoint for Danawa-prefixed lookup commands.
The tool endpoint accepts `{ "operation": "parts|lowest|compare|history|detail|compatibility", "args": [] }`.

## Container run

```powershell
docker build -t kakao-pc-deals-adapter apps/pc-deals-adapter
docker run --rm -p 8787:8787 `
  -e PC_DEALS_SHARED_SECRET='use-a-local-secret-only' `
  kakao-pc-deals-adapter
```

The image pins `kr-pc-deals-mcp@1.0.7`. Do not publish it with a real secret
embedded in the image or command history.

This is a personal, non-commercial integration. Respect Danawa/Compuzone
terms, request limits, and the upstream repository's license and disclaimer.
Do not commit the shared secret or scraped product data.
