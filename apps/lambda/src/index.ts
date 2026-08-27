import {
  chooseItems,
  formatSymbol,
  HELP,
  parseCommand,
  playRps,
  recommendFood,
  validateCharacterName,
} from '@kakao-maple-bot/core';
import {
  createNexonClient,
  createStockClient,
  type Character,
  type HexaCharacter,
  type NexonClient,
  type StockClient,
  type StockQuote,
} from '@kakao-maple-bot/providers';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export interface Env {
  BOT_SHARED_SECRET?: string;
  BOT_ENABLED?: string;
  ALLOWED_ROOMS?: string;
  ADMIN_SENDERS?: string;
  NEXON_API_KEY?: string;
  KIS_APP_KEY?: string;
  KIS_APP_SECRET?: string;
  KIS_BASE_URL?: string;
  STOCK_ENABLED?: string;
}
export type Message = {
  eventId: string;
  roomId: string;
  senderId: string;
  message: string;
  sentAt?: string;
};
type Dependencies = {
  nexon?: NexonClient;
  stock?: StockClient;
  now?: () => Date;
  seen?: Set<string>;
};
const seen = new Map<string, number>();
const roomRequests = new Map<string, number[]>();
const senderRequests = new Map<string, number[]>();
let globalRequests: number[] = [];
const characterCache = new Map<string, { value: Character; expiresAt: number }>();
const hexaCache = new Map<string, { value: HexaCharacter; expiresAt: number }>();
const stockCache = new Map<string, { value: StockQuote; expiresAt: number }>();

const errorText: Record<string, string> = {
  INVALID_USAGE: '사용법을 확인해 주세요.',
  NOT_FOUND: '정보를 찾지 못했습니다. 입력을 확인해 주세요.',
  NOT_CONFIGURED: '아직 운영자가 설정하지 않은 기능입니다.',
  PROVIDER_TIMEOUT: '외부 조회가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
  PROVIDER_UNAVAILABLE: '외부 서비스 오류로 지금은 조회할 수 없습니다.',
  RATE_LIMITED: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  BOT_PAUSED: '봇 점검 중입니다.',
  PROVIDER_SCHEMA: '외부 응답을 확인할 수 없습니다.',
};

function allowed(value: string | undefined, configured: string | undefined): boolean {
  return new Set(
    (configured ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  ).has(value ?? '');
}
function safeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index++)
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return difference === 0;
}
function timeoutSignal(ms = 3000): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
function errorMessage(error: unknown, requestId: string): string {
  const raw = error instanceof Error ? error.message : 'INTERNAL';
  const key = raw.startsWith('PROVIDER_UNAVAILABLE') ? 'PROVIDER_UNAVAILABLE' : raw;
  return errorText[key] ?? `처리 중 오류가 발생했습니다. 요청 ID: ${requestId}`;
}

export function createAuditLog(input: {
  requestId: string;
  command: string;
  outcome: string;
  latencyMs: number;
  provider?: string;
  cacheStatus: string;
}) {
  return {
    requestId: input.requestId,
    command: input.command,
    outcome: input.outcome,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    ...(input.provider ? { provider: input.provider } : {}),
    cacheStatus: input.cacheStatus,
    appVersion: '0.1.0',
  };
}

export async function handleMessage(
  message: Message,
  env: Env,
  deps: Dependencies = {},
): Promise<{ reply: string | null; requestId: string; cache: 'hit' | 'miss' | 'bypass' }> {
  const requestId = crypto.randomUUID();
  const now = (deps.now ?? (() => new Date()))().getTime();
  for (const [id, created] of seen) if (now - created > 120_000) seen.delete(id);
  for (const [room, times] of roomRequests) {
    const active = times.filter((time) => now - time < 10_000);
    if (active.length) roomRequests.set(room, active);
    else roomRequests.delete(room);
  }
  for (const [sender, times] of senderRequests) {
    const active = times.filter((time) => now - time < 60_000);
    if (active.length) senderRequests.set(sender, active);
    else senderRequests.delete(sender);
  }
  for (const [name, entry] of characterCache)
    if (entry.expiresAt <= now) characterCache.delete(name);
  for (const [code, entry] of stockCache) if (entry.expiresAt <= now) stockCache.delete(code);
  if (!message.eventId || seen.has(message.eventId))
    return { reply: null, requestId, cache: 'bypass' };
  seen.set(message.eventId, now);
  deps.seen?.add(message.eventId);
  if (env.BOT_ENABLED === 'false') return { reply: null, requestId, cache: 'bypass' };
  if (!allowed(message.roomId, env.ALLOWED_ROOMS))
    return { reply: null, requestId, cache: 'bypass' };
  if (message.message.trim().length > 300)
    return {
      reply: errorText.INVALID_USAGE ?? '사용법을 확인해 주세요.',
      requestId,
      cache: 'bypass',
    };
  const parsed = parseCommand(message.message);
  if (!parsed) return { reply: null, requestId, cache: 'bypass' };
  const recent = (roomRequests.get(message.roomId) ?? []).filter((time) => now - time < 10_000);
  const senderRecent = (senderRequests.get(message.senderId) ?? []).filter(
    (time) => now - time < 60_000,
  );
  globalRequests = globalRequests.filter((time) => now - time < 60_000);
  if (recent.length >= 5 || senderRecent.length >= 10 || globalRequests.length >= 60)
    return { reply: errorText.RATE_LIMITED ?? '요청이 많습니다.', requestId, cache: 'bypass' };
  roomRequests.set(message.roomId, [...recent, now]);
  senderRequests.set(message.senderId, [...senderRecent, now]);
  globalRequests = [...globalRequests, now];
  try {
    switch (parsed.name) {
      case 'help':
        return { reply: HELP, requestId, cache: 'bypass' };
      case 'status':
        if (!allowed(message.senderId, env.ADMIN_SENDERS))
          return { reply: null, requestId, cache: 'bypass' };
        return {
          reply: `[봇 상태]\n전체 활성: ${env.BOT_ENABLED !== 'false' ? '예' : '아니오'}\nNexon configured: ${env.NEXON_API_KEY ? '예' : '아니오'}\n주식 configured: ${env.STOCK_ENABLED === 'true' && Boolean(env.KIS_APP_KEY && env.KIS_APP_SECRET) ? '예' : '아니오'}`,
          requestId,
          cache: 'bypass',
        };
      case 'rps':
        return {
          reply: playRps(
            parsed.args[0] === '가위바위보' ? (parsed.args[1] ?? '') : (parsed.args[0] ?? ''),
          ),
          requestId,
          cache: 'bypass',
        };
      case 'choice':
        return {
          reply: `제가 고른 건: ${chooseItems(parsed.args.join(' '))}`,
          requestId,
          cache: 'bypass',
        };
      case 'food':
        return {
          reply: `오늘의 ${parsed.args[0] ?? '전체'} 메뉴: ${recommendFood(parsed.args[0])}`,
          requestId,
          cache: 'bypass',
        };
      case 'symbol': {
        const [kind, current, target, progress] = parsed.args;
        return {
          reply: formatSymbol(
            kind ?? '',
            Number(current),
            Number(target),
            progress ? Number(progress) : 0,
          ),
          requestId,
          cache: 'bypass',
        };
      }
      case 'character': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = characterCache.get(name);
        if (cached && cached.expiresAt > now)
          return { reply: formatCharacter(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        const character = await client.findCharacter(name, timeoutSignal());
        if (!character) throw new Error('NOT_FOUND');
        characterCache.set(name, { value: character, expiresAt: now + 5 * 60_000 });
        return { reply: formatCharacter(character), requestId, cache: 'miss' };
      }
      case 'hexa': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = hexaCache.get(name);
        if (cached && cached.expiresAt > now)
          return { reply: formatHexa(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findHexa) throw new Error('NOT_CONFIGURED');
        const hexa = await client.findHexa(name, timeoutSignal());
        if (!hexa) throw new Error('NOT_FOUND');
        hexaCache.set(name, { value: hexa, expiresAt: now + 5 * 60_000 });
        return { reply: formatHexa(hexa), requestId, cache: 'miss' };
      }
      case 'stock': {
        if (env.STOCK_ENABLED !== 'true') throw new Error('NOT_CONFIGURED');
        const code = parsed.args[0] ?? '';
        if (!/^\d{6}$/.test(code)) throw new Error('INVALID_USAGE');
        const cached = stockCache.get(code);
        if (cached && cached.expiresAt > now)
          return { reply: formatStock(cached.value), requestId, cache: 'hit' };
        const client =
          deps.stock ?? createStockClient(env.KIS_APP_KEY, env.KIS_APP_SECRET, env.KIS_BASE_URL);
        const quote = await client.quote(code, timeoutSignal());
        stockCache.set(code, { value: quote, expiresAt: now + 15_000 });
        return { reply: formatStock(quote), requestId, cache: 'miss' };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      return {
        reply: errorText.PROVIDER_TIMEOUT ?? '잠시 후 다시 시도해 주세요.',
        requestId,
        cache: 'miss',
      };
    return { reply: errorMessage(error, requestId), requestId, cache: 'miss' };
  }
}

function formatCharacter(c: Character): string {
  return [
    `[메이플 캐릭터]`,
    `${c.name}${c.world ? ` @ ${c.world}` : ''}`,
    c.level !== undefined || c.job ? `Lv. ${c.level ?? '-'} / ${c.job ?? '-'}` : '',
    c.guild ? `길드: ${c.guild}` : '',
    c.combatPower !== undefined ? `전투력: ${c.combatPower.toLocaleString('ko-KR')}` : '',
    `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`,
    `상세: https://maple.gg/u/${encodeURIComponent(c.name)}`,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1000);
}
function formatHexa(c: HexaCharacter): string {
  const lines = c.cores.map((core) => {
    const skills = core.linkedSkills.length ? ` / ${core.linkedSkills.join(', ')}` : '';
    return `- ${core.name} Lv.${core.level} (${core.type})${skills}`;
  });
  return [
    `[HEXA 코어]`,
    `${c.name}`,
    `코어 수: ${c.cores.length}`,
    ...lines,
    `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`,
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatStock(q: StockQuote): string {
  return [
    `[국내 주식 시세]`,
    `${q.name ?? '종목'} (${q.code})`,
    `현재가: ${q.price.toLocaleString('ko-KR')}원`,
    `전일 대비: ${q.change >= 0 ? '+' : ''}${q.change.toLocaleString('ko-KR')}원 (${q.changeRate.toFixed(2)}%)`,
    q.volume !== undefined ? `거래량: ${q.volume.toLocaleString('ko-KR')}` : '',
    `조회: ${q.fetchedAt}`,
    '참고용 정보이며 투자 권유가 아닙니다.',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1000);
}

export async function httpHandler(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET' && new URL(request.url).pathname === '/health')
    return Response.json({ status: 'ok' });
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/v1/messages')
    return new Response('Not found', { status: 404 });
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 16_384) return new Response('Payload too large', { status: 413 });
  if (
    !env.BOT_SHARED_SECRET ||
    !safeEqual(request.headers.get('authorization') ?? '', `Bearer ${env.BOT_SHARED_SECRET}`)
  )
    return new Response('Unauthorized', { status: 401 });
  let body: Message;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384)
      return new Response('Payload too large', { status: 413 });
    body = JSON.parse(rawBody) as Message;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (
    !body ||
    typeof body.message !== 'string' ||
    typeof body.eventId !== 'string' ||
    typeof body.roomId !== 'string' ||
    typeof body.senderId !== 'string'
  )
    return new Response('Invalid request', { status: 400 });
  const result = await handleMessage(body, env);
  return Response.json(result);
}

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> {
  const body = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : (event.body ?? '');
  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers ?? {}))
    if (value) headers.set(key, value);
  const request = new Request(`https://lambda.local${event.rawPath || '/'}`, {
    method: event.requestContext.http.method,
    headers,
    body: event.requestContext.http.method === 'GET' ? undefined : body,
  });
  const response = await httpHandler(request, process.env as Env);
  return {
    statusCode: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'text/plain; charset=UTF-8',
    },
    body: await response.text(),
  };
}
