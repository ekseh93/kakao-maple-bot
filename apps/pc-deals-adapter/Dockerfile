FROM node:22-slim

WORKDIR /app
COPY server.mjs ./server.mjs

# Pin the upstream MCP package so an image rebuild is reproducible.
RUN npm install --global kr-pc-deals-mcp@1.0.7

ENV PORT=8787
ENV MCP_COMMAND=kr-pc-deals-mcp
EXPOSE 8787

CMD ["node", "server.mjs"]
