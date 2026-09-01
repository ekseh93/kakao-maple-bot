import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';

const port = Number(process.env.PORT ?? 8787);
const sharedSecret = process.env.PC_DEALS_SHARED_SECRET ?? '';
const mcpCommand = process.env.MCP_COMMAND ?? 'npx';
const mcpArgs = process.env.MCP_ARGS ? JSON.parse(process.env.MCP_ARGS) : ['-y', 'kr-pc-deals-mcp'];
const cache = new Map();
let requestQueue = Promise.resolve();

function authorized(request) {
  const value = request.headers.authorization ?? '';
  const expected = `Bearer ${sharedSecret}`;
  if (!sharedSecret || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function parseItems(text) {
  const items = [];
  const pattern = /(?:^|\n)\s*\d+\.\s+(.+?)\n\s+가격:\s*([\d,]+)원\n\s+링크:\s*(\S+)/g;
  for (const match of text.matchAll(pattern)) {
    const priceKrw = Number(match[2].replace(/,/g, ''));
    if (Number.isSafeInteger(priceKrw) && priceKrw > 0)
      items.push({ name: match[1].trim(), priceKrw, url: match[3] });
  }
  return items;
}

class McpBridge {
  constructor() {
    this.child = spawn(mcpCommand, mcpArgs, { stdio: ['pipe', 'pipe', 'inherit'] });
    this.pending = new Map();
    this.nextId = 1;
    let buffer = '';
    this.child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      for (;;) {
        const newline = buffer.indexOf('\n');
        if (newline < 0) break;
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        try {
          const message = JSON.parse(line);
          const pending = this.pending.get(message.id);
          if (!pending) continue;
          this.pending.delete(message.id);
          if (message.error) pending.reject(new Error(message.error.message ?? 'MCP_ERROR'));
          else pending.resolve(message.result);
        } catch {
          // Ignore non-JSON diagnostics written to stdout by a misbehaving provider.
        }
      }
    });
    this.child.on('exit', () => {
      for (const pending of this.pending.values()) pending.reject(new Error('MCP_EXITED'));
      this.pending.clear();
    });
    this.ready = this.call('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'kakao-maple-bot-pc-adapter', version: '1.0.0' },
    }).then(() => this.notify('notifications/initialized', {}));
  }

  notify(method, params) {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
  }

  call(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('MCP_TIMEOUT'));
      }, 8_000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });
  }

  async list(category) {
    await this.ready;
    const result = await this.call('tools/call', {
      name: 'list_by_category',
      arguments: { category, sortBy: 'price', limit: 10 },
    });
    const text = result?.content?.find((item) => item.type === 'text')?.text;
    if (typeof text !== 'string') throw new Error('MCP_SCHEMA');
    return parseItems(text);
  }

  async tool(name, args) {
    await this.ready;
    const result = await this.call('tools/call', { name, arguments: args });
    const text = result?.content?.find((item) => item.type === 'text')?.text;
    if (typeof text !== 'string') throw new Error('MCP_SCHEMA');
    return text;
  }
}

const bridge = new McpBridge();
const toolNames = {
  parts: 'search_parts',
  lowest: 'find_lowest_price',
  compare: 'compare_prices',
  history: 'get_price_history',
  detail: 'get_product_detail',
  compatibility: 'build_check_compatibility',
};

async function runTool(operation, args) {
  const query = args.join(' ').trim();
  if (!query) throw new Error('INVALID_USAGE');
  const tool = toolNames[operation];
  if (!tool) throw new Error('INVALID_USAGE');
  if (operation === 'history') {
    const last = args.at(-1);
    const months = ['1', '3', '6', '12'].includes((last ?? '').replace('개월', ''))
      ? (last ?? '').replace('개월', '')
      : '3';
    const productCode = args.slice(-1)[0]?.endsWith('개월') ? args.slice(0, -1).join(' ') : query;
    return bridge.tool(tool, { productCode, period: months });
  }
  if (operation === 'compatibility')
    return bridge.tool(tool, {});
  if (operation === 'detail') return bridge.tool(tool, { productCode: query, source: 'danawa' });
  if (operation === 'parts') return bridge.tool(tool, { query, source: 'all', limit: 5 });
  return bridge.tool(tool, { query });
}
const categories = [
  ['CPU', 'cpu', 0.18],
  ['그래픽카드', 'gpu', 0.38],
  ['메인보드', 'motherboard', 0.12],
  ['RAM', 'ram', 0.1],
  ['SSD', 'ssd', 0.08],
  ['파워', 'psu', 0.08],
  ['케이스', 'case', 0.06],
  ['쿨러', 'cooler', 0.05],
  ['모니터', 'monitor', 0.15],
];

function select(items, target) {
  return (
    items
      .filter((item) => item.priceKrw <= target * 1.4)
      .sort((a, b) => Math.abs(a.priceKrw - target) - Math.abs(b.priceKrw - target))[0] ?? items[0]
  );
}

function cheapest(items) {
  return items
    .filter((item) => Number.isSafeInteger(item.priceKrw) && item.priceKrw > 0)
    .sort((a, b) => a.priceKrw - b.priceKrw)[0];
}

async function buildQuotes(request) {
  const selectedCategories = request.monitorIncluded
    ? categories
    : categories.filter(([label]) => label !== '모니터');
  const fetched = await Promise.all(
    selectedCategories.map(async ([label, category]) => [label, await bridge.list(category)]),
  );
  const variants = [0, 1, 2].map((variant) => {
    const selections = fetched.map(([label, values], index) => {
      const [, , weight] = selectedCategories[index];
      const target = (request.budgetMaxKrw ?? request.budgetKrw) * weight;
      const candidates = values.slice(variant, variant + 3);
      const baseline = cheapest(values);
      const preferred = select(candidates.length ? candidates : values, target);
      return baseline && preferred
        ? { label, baseline, preferred }
        : undefined;
    });
    if (selections.some((selection) => !selection)) return undefined;

    const chosen = selections.map((selection) => ({
      category: selection.label,
      ...selection.baseline,
    }));
    let totalKrw = chosen.reduce((sum, item) => sum + item.priceKrw, 0);
    for (const [index, selection] of selections.entries()) {
      const current = chosen[index];
      const upgrade = selection.preferred;
      const delta = upgrade.priceKrw - current.priceKrw;
      if (delta > 0 && totalKrw + delta <= (request.budgetMaxKrw ?? request.budgetKrw)) {
        chosen[index] = { category: selection.label, ...upgrade };
        totalKrw += delta;
      }
    }
    if (totalKrw > (request.budgetMaxKrw ?? request.budgetKrw)) return undefined;
    return {
      label: ['균형형', '가성비형', '여유형'][variant],
      totalKrw,
      items: chosen,
      compatibility: '확인 필요',
      source: '다나와/컴퓨존 MCP',
      fetchedAt: new Date().toISOString(),
    };
  });
  return variants.filter((quote) => quote && quote.items.length >= 5);
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 20_000) throw new Error('PAYLOAD_TOO_LARGE');
  }
  return JSON.parse(body);
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health')
    return json(response, 200, { ok: true });
  if (request.method !== 'POST' || !['/v1/quote', '/v1/tool'].includes(request.url))
    return json(response, 404, { error: 'NOT_FOUND' });
  if (!authorized(request)) return json(response, 401, { error: 'UNAUTHORIZED' });
  try {
    const body = await readBody(request);
    if (request.url === '/v1/tool') {
      if (!['parts', 'lowest', 'compare', 'history', 'detail', 'compatibility'].includes(body.operation) || !Array.isArray(body.args))
        return json(response, 400, { error: 'INVALID_USAGE' });
      return json(response, 200, { text: await runTool(body.operation, body.args) });
    }
    if (
      !Number.isSafeInteger(body.budgetKrw) ||
      (body.budgetMaxKrw !== undefined &&
        (!Number.isSafeInteger(body.budgetMaxKrw) || body.budgetMaxKrw < body.budgetKrw)) ||
      body.budgetKrw < 100_000 ||
      !['gaming', 'work', 'video', 'office'].includes(body.usage)
    )
      return json(response, 400, { error: 'INVALID_USAGE' });
    const key = JSON.stringify({
      budgetKrw: body.budgetKrw,
      budgetMaxKrw: body.budgetMaxKrw ?? body.budgetKrw,
      usage: body.usage,
      monitorIncluded: Boolean(body.monitorIncluded),
    });
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return json(response, 200, cached.value);
    const task = requestQueue.then(() => buildQuotes(JSON.parse(key)));
    requestQueue = task.catch(() => undefined);
    const value = await task;
    cache.set(key, { value, expiresAt: Date.now() + 10 * 60_000 });
    return json(response, 200, value);
  } catch (error) {
    const code = error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 502;
    return json(response, code, {
      error: error instanceof Error ? error.message : 'ADAPTER_ERROR',
    });
  }
});

server.listen(port, () => console.error(`PC deals adapter listening on ${port}`));
process.on('SIGTERM', () => {
  bridge.child.kill();
  server.close();
});
