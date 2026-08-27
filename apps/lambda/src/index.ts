import {
  chooseItems,
  formatRoyalDraw,
  formatWonderBerryDraw,
  formatBoutiqueGiftDraw,
  formatLunaCrystalSweetDraw,
  formatLunaCrystalDreamDraw,
  formatSymbol,
  HELP,
  parseCommand,
  parseRoyalOptions,
  playRps,
  formatFoodRecommendation,
  formatJapanTravelRecommendation,
  formatFortune,
  validateCharacterName,
  validateRegion,
} from '@kakao-maple-bot/core';
import {
  createNexonClient,
  createInvenClient,
  createStockClient,
  type Character,
  type DojangCharacter,
  type EquipmentCharacter,
  type EventList,
  type ExperienceHistory,
  type HexaCharacter,
  type NexonClient,
  type StockClient,
  type StockQuote,
  type UnionCharacter,
  type UnionChampion,
  type NoticeList,
  type InvenTopPostList,
  type InvenClient,
  type RoyalStyleList,
  type WonderBerryList,
  type BoutiqueGiftList,
  type WeatherSnapshot,
  type LunaCrystalSweetList,
} from '@kakao-maple-bot/providers';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export interface Env {
  BOT_SHARED_SECRET?: string;
  BOT_ENABLED?: string;
  ALLOWED_ROOMS?: string;
  ADMIN_SENDERS?: string;
  NEXON_API_KEY?: string;
  KRX_AUTH_KEY?: string;
  TIINGO_TOKEN?: string;
  STOCK_ENABLED?: string;
  NOTICE_ALERT_ENABLED?: string;
  NOTICE_ALERT_KEYWORDS?: string;
}
export type Message = {
  eventId: string;
  roomId: string;
  senderId: string;
  message: string;
  sentAt?: string;
};
const defaultNoticeAlertKeywords = ['채널 점검', '마이너버전', '클라이언트'];
type Dependencies = {
  nexon?: NexonClient;
  inven?: InvenClient;
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
const dojangCache = new Map<string, { value: DojangCharacter; expiresAt: number }>();
const unionCache = new Map<string, { value: UnionCharacter; expiresAt: number }>();
const unionChampionCache = new Map<string, { value: UnionChampion; expiresAt: number }>();
const equipmentCache = new Map<string, { value: EquipmentCharacter; expiresAt: number }>();
const experienceCache = new Map<string, { value: ExperienceHistory; expiresAt: number }>();
let noticeCache: { value: NoticeList; expiresAt: number } | undefined;
let invenCache: { value: InvenTopPostList; expiresAt: number } | undefined;
let eventCache: { value: EventList; expiresAt: number } | undefined;
let royalCache: { value: RoyalStyleList; expiresAt: number } | undefined;
let wonderBerryCache: { value: WonderBerryList; expiresAt: number } | undefined;
let boutiqueGiftCache: { value: BoutiqueGiftList; expiresAt: number } | undefined;
const lunaSweetCache = new Map<
  '일반' | '스페셜',
  { value: LunaCrystalSweetList; expiresAt: number }
>();
const lunaDreamCache = new Map<
  '일반' | '스페셜',
  { value: LunaCrystalSweetList; expiresAt: number }
>();
const stockCache = new Map<string, { value: StockQuote; expiresAt: number }>();
const stockCandidatesCache = new Map<string, { value: StockQuote[]; expiresAt: number }>();
const weatherCache = new Map<string, { value: WeatherSnapshot; expiresAt: number }>();

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
  for (const [name, entry] of unionChampionCache)
    if (entry.expiresAt <= now) unionChampionCache.delete(name);
  for (const [name, entry] of experienceCache)
    if (entry.expiresAt <= now) experienceCache.delete(name);
  for (const [code, entry] of stockCache) if (entry.expiresAt <= now) stockCache.delete(code);
  for (const [query, entry] of stockCandidatesCache)
    if (entry.expiresAt <= now) stockCandidatesCache.delete(query);
  if (noticeCache && noticeCache.expiresAt <= now) noticeCache = undefined;
  if (invenCache && invenCache.expiresAt <= now) invenCache = undefined;
  if (eventCache && eventCache.expiresAt <= now) eventCache = undefined;
  if (royalCache && royalCache.expiresAt <= now) royalCache = undefined;
  if (wonderBerryCache && wonderBerryCache.expiresAt <= now) wonderBerryCache = undefined;
  if (boutiqueGiftCache && boutiqueGiftCache.expiresAt <= now) boutiqueGiftCache = undefined;
  for (const [kind, entry] of lunaSweetCache)
    if (entry.expiresAt <= now) lunaSweetCache.delete(kind);
  for (const [kind, entry] of lunaDreamCache)
    if (entry.expiresAt <= now) lunaDreamCache.delete(kind);
  for (const [region, entry] of weatherCache)
    if (entry.expiresAt <= now) weatherCache.delete(region);
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
          reply: `[봇 상태]\n전체 활성: ${env.BOT_ENABLED !== 'false' ? '예' : '아니오'}\nNexon configured: ${env.NEXON_API_KEY ? '예' : '아니오'}\n주식 configured: ${env.STOCK_ENABLED === 'true' && Boolean(env.KRX_AUTH_KEY || env.TIINGO_TOKEN) ? '예' : '아니오'}`,
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
          reply: formatFoodRecommendation(parsed.args),
          requestId,
          cache: 'bypass',
        };
      case 'japanTravel':
        return {
          reply: formatJapanTravelRecommendation(parsed.args),
          requestId,
          cache: 'bypass',
        };
      case 'fortune':
        return {
          reply: formatFortune(parsed.args),
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
      case 'dojang': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = dojangCache.get(name);
        if (cached && cached.expiresAt > now)
          return { reply: formatDojang(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findDojang) throw new Error('NOT_CONFIGURED');
        const dojang = await client.findDojang(name, timeoutSignal());
        if (!dojang) throw new Error('NOT_FOUND');
        dojangCache.set(name, { value: dojang, expiresAt: now + 5 * 60_000 });
        return { reply: formatDojang(dojang), requestId, cache: 'miss' };
      }
      case 'union': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = unionCache.get(name);
        if (cached && cached.expiresAt > now)
          return { reply: formatUnion(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findUnion) throw new Error('NOT_CONFIGURED');
        const union = await client.findUnion(name, timeoutSignal());
        if (!union) throw new Error('NOT_FOUND');
        unionCache.set(name, { value: union, expiresAt: now + 5 * 60_000 });
        return { reply: formatUnion(union), requestId, cache: 'miss' };
      }
      case 'unionChampion': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = unionChampionCache.get(name);
        if (cached && cached.expiresAt > now)
          return { reply: formatUnionChampion(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findUnionChampion) throw new Error('NOT_CONFIGURED');
        const unionChampion = await client.findUnionChampion(name, timeoutSignal());
        if (!unionChampion) throw new Error('NOT_FOUND');
        unionChampionCache.set(name, { value: unionChampion, expiresAt: now + 5 * 60_000 });
        return { reply: formatUnionChampion(unionChampion), requestId, cache: 'miss' };
      }
      case 'equipment': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = equipmentCache.get(name);
        if (cached && cached.expiresAt > now)
          return { reply: formatEquipment(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findEquipment) throw new Error('NOT_CONFIGURED');
        const equipment = await client.findEquipment(name, timeoutSignal());
        if (!equipment) throw new Error('NOT_FOUND');
        equipmentCache.set(name, { value: equipment, expiresAt: now + 5 * 60_000 });
        return { reply: formatEquipment(equipment), requestId, cache: 'miss' };
      }
      case 'notice': {
        if (noticeCache && noticeCache.expiresAt > now)
          return { reply: formatNotice(noticeCache.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findNotice) throw new Error('NOT_CONFIGURED');
        const notices = await client.findNotice(timeoutSignal());
        noticeCache = { value: notices, expiresAt: now + 5 * 60_000 };
        return { reply: formatNotice(notices), requestId, cache: 'miss' };
      }
      case 'inven': {
        if (invenCache && invenCache.expiresAt > now)
          return { reply: formatInven(invenCache.value), requestId, cache: 'hit' };
        const inven = deps.inven ?? createInvenClient();
        const posts = await inven.findTopPosts(timeoutSignal());
        invenCache = { value: posts, expiresAt: now + 60_000 };
        return { reply: formatInven(posts), requestId, cache: 'miss' };
      }
      case 'event': {
        if (eventCache && eventCache.expiresAt > now)
          return { reply: formatEvents(eventCache.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findEvents) throw new Error('NOT_CONFIGURED');
        const events = await client.findEvents(timeoutSignal());
        eventCache = { value: events, expiresAt: now + 5 * 60_000 };
        return { reply: formatEvents(events), requestId, cache: 'miss' };
      }
      case 'sunday': {
        if (eventCache && eventCache.expiresAt > now) {
          const reply = formatSunday(eventCache.value);
          if (reply) return { reply, requestId, cache: 'hit' };
          eventCache = undefined;
        }
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (client.findSunday) {
          const sunday = await client.findSunday(timeoutSignal());
          if (!sunday) throw new Error('NOT_FOUND');
          eventCache = {
            value: { events: [sunday], fetchedAt: new Date().toISOString() },
            expiresAt: now + 5 * 60_000,
          };
          return { reply: formatSunday(eventCache.value)!, requestId, cache: 'miss' };
        }
        if (!client.findEvents) throw new Error('NOT_CONFIGURED');
        const events = await client.findEvents(timeoutSignal());
        eventCache = { value: events, expiresAt: now + 5 * 60_000 };
        const reply = formatSunday(events);
        if (!reply) throw new Error('NOT_FOUND');
        return { reply, requestId, cache: 'miss' };
      }
      case 'royal': {
        const options = parseRoyalOptions(parsed.args);
        if (royalCache && royalCache.expiresAt > now)
          return {
            reply: formatRoyalDraw(
              royalCache.value.items,
              royalCache.value.sourceUrl,
              royalCache.value.fetchedAt,
              options.count,
              options.showResults,
            ),
            requestId,
            cache: 'hit',
          };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findRoyalStyles) throw new Error('NOT_CONFIGURED');
        const royal = await client.findRoyalStyles(timeoutSignal());
        royalCache = { value: royal, expiresAt: now + 5 * 60_000 };
        return {
          reply: formatRoyalDraw(
            royal.items,
            royal.sourceUrl,
            royal.fetchedAt,
            options.count,
            options.showResults,
          ),
          requestId,
          cache: 'miss',
        };
      }
      case 'wonderBerry': {
        const options = parseRoyalOptions(parsed.args);
        if (wonderBerryCache && wonderBerryCache.expiresAt > now)
          return {
            reply: formatWonderBerryDraw(
              wonderBerryCache.value.items,
              wonderBerryCache.value.sourceUrl,
              wonderBerryCache.value.fetchedAt,
              options.count,
              options.showResults,
            ),
            requestId,
            cache: 'hit',
          };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findWonderBerry) throw new Error('NOT_CONFIGURED');
        const wonderBerry = await client.findWonderBerry(timeoutSignal());
        wonderBerryCache = { value: wonderBerry, expiresAt: now + 5 * 60_000 };
        return {
          reply: formatWonderBerryDraw(
            wonderBerry.items,
            wonderBerry.sourceUrl,
            wonderBerry.fetchedAt,
            options.count,
            options.showResults,
          ),
          requestId,
          cache: 'miss',
        };
      }
      case 'boutiqueGift': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (boutiqueGiftCache && boutiqueGiftCache.expiresAt > now)
          return {
            reply: formatBoutiqueGiftDraw(
              boutiqueGiftCache.value.normalItems,
              boutiqueGiftCache.value.feverItems,
              boutiqueGiftCache.value.sourceUrl,
              boutiqueGiftCache.value.fetchedAt,
            ),
            requestId,
            cache: 'hit',
          };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findBoutiqueGift) throw new Error('NOT_CONFIGURED');
        const boutiqueGift = await client.findBoutiqueGift(timeoutSignal());
        boutiqueGiftCache = { value: boutiqueGift, expiresAt: now + 5 * 60_000 };
        return {
          reply: formatBoutiqueGiftDraw(
            boutiqueGift.normalItems,
            boutiqueGift.feverItems,
            boutiqueGift.sourceUrl,
            boutiqueGift.fetchedAt,
          ),
          requestId,
          cache: 'miss',
        };
      }
      case 'lunaSweet': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        const kind = '스페셜' as const;
        const options = { count: 1, showResults: true };
        const cached = lunaSweetCache.get(kind);
        if (cached && cached.expiresAt > now)
          return {
            reply: formatLunaCrystalSweetDraw(
              kind,
              cached.value.items,
              cached.value.sourceUrl,
              cached.value.fetchedAt,
              options.count,
              options.showResults,
            ),
            requestId,
            cache: 'hit',
          };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findLunaCrystalSweet) throw new Error('NOT_CONFIGURED');
        const luna = await client.findLunaCrystalSweet(kind, timeoutSignal());
        lunaSweetCache.set(kind, { value: luna, expiresAt: now + 5 * 60_000 });
        return {
          reply: formatLunaCrystalSweetDraw(
            kind,
            luna.items,
            luna.sourceUrl,
            luna.fetchedAt,
            options.count,
            options.showResults,
          ),
          requestId,
          cache: 'miss',
        };
      }
      case 'lunaDream': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        const kind = '일반' as const;
        const options = { count: 1, showResults: true };
        const cached = lunaDreamCache.get(kind);
        if (cached && cached.expiresAt > now)
          return {
            reply: formatLunaCrystalDreamDraw(
              kind,
              cached.value.items,
              cached.value.sourceUrl,
              cached.value.fetchedAt,
              options.count,
              options.showResults,
            ),
            requestId,
            cache: 'hit',
          };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findLunaCrystalDream) throw new Error('NOT_CONFIGURED');
        const luna = await client.findLunaCrystalDream(kind, timeoutSignal());
        lunaDreamCache.set(kind, { value: luna, expiresAt: now + 5 * 60_000 });
        return {
          reply: formatLunaCrystalDreamDraw(
            kind,
            luna.items,
            luna.sourceUrl,
            luna.fetchedAt,
            options.count,
            options.showResults,
          ),
          requestId,
          cache: 'miss',
        };
      }
      case 'weather': {
        if (parsed.args.length === 0) throw new Error('INVALID_USAGE');
        const region = validateRegion(parsed.args.join(' '));
        const cacheKey = region.toLocaleLowerCase();
        const cached = weatherCache.get(cacheKey);
        if (cached && cached.expiresAt > now)
          return { reply: formatWeather(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findWeather) throw new Error('NOT_CONFIGURED');
        const weather = await client.findWeather(region, timeoutSignal());
        if (!weather) throw new Error('NOT_FOUND');
        weatherCache.set(cacheKey, { value: weather, expiresAt: now + 5 * 60_000 });
        return { reply: formatWeather(weather), requestId, cache: 'miss' };
      }
      case 'experience': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = experienceCache.get(name);
        if (cached && cached.expiresAt > now)
          return { reply: formatExperience(cached.value), requestId, cache: 'hit' };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findExperienceHistory) throw new Error('NOT_CONFIGURED');
        const history = await client.findExperienceHistory(name, timeoutSignal());
        if (!history) throw new Error('NOT_FOUND');
        experienceCache.set(name, { value: history, expiresAt: now + 5 * 60_000 });
        return { reply: formatExperience(history), requestId, cache: 'miss' };
      }
      case 'stock': {
        if (env.STOCK_ENABLED !== 'true') throw new Error('NOT_CONFIGURED');
        const query = parsed.args.join(' ').trim();
        if (!query || parsed.args.length > 4) throw new Error('INVALID_USAGE');
        const cacheKey = query.toLocaleLowerCase();
        const candidatesCached = stockCandidatesCache.get(cacheKey);
        const client = deps.stock ?? createStockClient(env.KRX_AUTH_KEY, env.TIINGO_TOKEN);
        if (client.quoteCandidates) {
          if (candidatesCached && candidatesCached.expiresAt > now)
            return {
              reply: formatStockCandidates(candidatesCached.value),
              requestId,
              cache: 'hit',
            };
          const candidates = await client.quoteCandidates(query, timeoutSignal());
          stockCandidatesCache.set(cacheKey, { value: candidates, expiresAt: now + 15_000 });
          return { reply: formatStockCandidates(candidates), requestId, cache: 'miss' };
        }
        const cached = stockCache.get(cacheKey);
        if (cached && cached.expiresAt > now)
          return { reply: formatStock(cached.value), requestId, cache: 'hit' };
        const quote = await client.quote(query, timeoutSignal());
        stockCache.set(cacheKey, { value: quote, expiresAt: now + 15_000 });
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
    c.hexaCoreCount !== undefined
      ? `HEXA: 코어 ${c.hexaCoreCount}개 / 총 레벨 ${c.hexaCoreLevelTotal ?? 0}`
      : '',
    ...(c.hexaCores && c.hexaCores.length > 0
      ? [
          'HEXA 코어 목록:',
          ...c.hexaCores.map((core) => `▸ ${core.type}: ${core.name} Lv.${core.level}`),
        ]
      : []),
    `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`,
    `상세: https://maple.gg/u/${encodeURIComponent(c.name)}`,
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1000);
}
function formatHexa(c: HexaCharacter): string {
  const lines = [
    '[HEXA 코어]',
    `캐릭터: ${c.name}`,
    `장착 코어: ${c.cores.length}개`,
    '────────────',
  ];
  for (const core of c.cores) {
    lines.push(
      `▸ ${core.type}`,
      `  코어: ${core.name}`,
      `  레벨: Lv.${core.level}`,
      `  연결 스킬: ${core.linkedSkills.length ? core.linkedSkills.join(', ') : '없음'}`,
    );
  }
  lines.push('────────────', `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`);
  const full = lines.join('\n');
  if (full.length <= 1000) return full;
  const footer = `\n… ${c.cores.length}개 중 일부만 표시 (응답 제한)`;
  return full.slice(0, 1000 - footer.length).trimEnd() + footer;
}
function formatDojang(c: DojangCharacter): string {
  const minutes = Math.floor(c.timeSeconds / 60);
  const seconds = c.timeSeconds % 60;
  return [
    '[무릉도장 최고 기록]',
    `${c.name}: ${c.floor}층 / ${minutes}분 ${seconds}초`,
    c.recordDate ? `기록일: ${c.recordDate.slice(0, 10)}` : '',
    `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`,
  ]
    .filter(Boolean)
    .join('\n');
}
function formatUnion(c: UnionCharacter): string {
  return [
    '[유니온 정보]',
    c.name,
    c.level !== undefined ? `유니온 레벨: ${c.level.toLocaleString('ko-KR')}` : '',
    c.grade ? `유니온 등급: ${c.grade}` : '',
    c.artifactLevel !== undefined ? `아티팩트 레벨: ${c.artifactLevel}` : '',
    c.artifactPoint !== undefined
      ? `아티팩트 포인트: ${c.artifactPoint.toLocaleString('ko-KR')}`
      : '',
    `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`,
  ]
    .filter(Boolean)
    .join('\n');
}
function formatUnionChampion(c: UnionChampion): string {
  const lines = [
    '[유니온 챔피언 능력치]',
    `캐릭터: ${c.name}`,
    `챔피언 수: ${c.champions.length}명`,
    '────────────',
  ];
  for (const champion of c.champions) {
    const detail = [champion.grade, champion.className].filter(Boolean).join(' ');
    lines.push(`▸ ${champion.name}${detail ? ` (${detail})` : ''}`);
    for (const ability of champion.abilities) lines.push(`  - ${ability.name}: ${ability.value}`);
  }
  lines.push('────────────', `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`);
  const full = lines.join('\n');
  if (full.length <= 1000) return full;
  const footer = `\n… ${c.champions.length}명 중 일부만 표시 (응답 제한)`;
  return full.slice(0, 1000 - footer.length).trimEnd() + footer;
}
function formatEquipment(c: EquipmentCharacter): string {
  const lines = [
    '[장비 요약]',
    `캐릭터: ${c.name}`,
    `장착 장비: ${c.items.length}개`,
    '────────────',
  ];
  for (const item of c.items) {
    lines.push(`▸ ${item.part}`, `  ${item.name}`, `  ⭐ 스타포스 ${item.starforce}`);
    const potentials = [
      item.potentialGrade ? `잠재 ${item.potentialGrade}` : '',
      item.additionalPotentialGrade ? `에디 ${item.additionalPotentialGrade}` : '',
    ].filter(Boolean);
    if (potentials.length > 0) lines.push(`  ${potentials.join(' | ')}`);
  }
  lines.push('────────────', `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`);
  const full = lines.join('\n');
  if (full.length <= 1000) return full;
  const footer = `\n… ${c.items.length}개 중 일부만 표시 (응답 제한)`;
  return full.slice(0, 1000 - footer.length).trimEnd() + footer;
}
function formatNotice(c: NoticeList): string {
  return [
    '[메이플스토리 공지]',
    ...c.notices.map(
      (notice) =>
        `- ${notice.title}${notice.date ? ` (${notice.date.slice(0, 10)})` : ''}\n  ${notice.url}`,
    ),
    `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`,
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatInven(c: InvenTopPostList): string {
  return [
    '[메이플 인벤 10추글]',
    ...c.posts.map((post, index) => `${index + 1}. ${post.title}`),
    '',
    `10추 게시판: ${c.boardUrl}`,
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatExperience(c: ExperienceHistory): string {
  const lines = ['[경험치 히스토리]', `캐릭터: ${c.name}`, '최근 8일 (당일 포함)', '────────────'];
  for (const snapshot of c.snapshots) {
    lines.push(
      `▸ ${snapshot.date}`,
      `  Lv.${snapshot.level} / ${snapshot.experienceRate.toFixed(2)}% (${snapshot.experience.toLocaleString('ko-KR')} EXP)`,
    );
  }
  const oldest = c.snapshots.at(-1);
  const current = c.snapshots[0];
  if (oldest && current && oldest.level === current.level) {
    const weekly = current.experienceRate - oldest.experienceRate;
    lines.push(
      '────────────',
      `7일 변화: ${weekly >= 0 ? '+' : ''}${weekly.toFixed(2)}%`,
      `일평균: ${(weekly / 7).toFixed(2)}%`,
    );
  } else {
    lines.push('────────────', '7일 변화: 레벨업 포함으로 비율 단순 비교 불가');
  }
  lines.push('기준: Nexon Open API');
  const full = lines.join('\n');
  if (full.length <= 1000) return full;
  return full.slice(0, 980).trimEnd() + '\n… 응답 제한';
}
function formatEvents(c: EventList): string {
  const lines = c.events.map((event) => {
    const period =
      event.startDate || event.endDate
        ? ` (${event.startDate?.slice(0, 10) ?? '?'}~${event.endDate?.slice(0, 10) ?? '?'})`
        : '';
    return `- ${event.title}${period}\n  ${event.url}`;
  });
  const header = `[메이플스토리 진행 중 이벤트]\n전체 ${c.events.length}건`;
  const footer = `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`;
  const output = [header, ...lines, footer].join('\n');
  if (output.length <= 1000) return output;
  let result = `${header}\n`;
  let included = 0;
  for (const line of lines) {
    if ((result + line + '\n').length + footer.length + 20 > 1000) break;
    result += `${line}\n`;
    included += 1;
  }
  return `${result}${footer}\n(응답 제한으로 ${c.events.length - included}건은 생략)`;
}
function formatSunday(c: EventList): string | null {
  const event = c.events.find(
    (item) => item.title.includes('썬데이') || item.title.includes('선데이'),
  );
  if (!event) return null;
  return [
    '[썬데이 메이플]',
    event.title,
    event.startDate || event.endDate
      ? `기간: ${(event.startDate ?? '?').slice(0, 10)}~${(event.endDate ?? '?').slice(0, 10)}`
      : '',
    event.url,
  ]
    .filter(Boolean)
    .join('\n');
}
function weatherDescription(code: number): string {
  if (code === 0) return '맑음';
  if ([1, 2].includes(code)) return '구름 조금';
  if (code === 3) return '흐림';
  if ([45, 48].includes(code)) return '안개';
  if ([51, 53, 55, 56, 57].includes(code)) return '이슬비';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '비';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '눈';
  if ([95, 96, 99].includes(code)) return '뇌우';
  return '현재 상태 확인 필요';
}
function formatWeather(weather: WeatherSnapshot): string {
  return [
    `[현재 날씨] ${weather.location}${weather.country ? `, ${weather.country}` : ''}`,
    `상태: ${weatherDescription(weather.weatherCode)}`,
    `기온: ${weather.temperatureC.toFixed(1)}°C`,
    `습도: ${weather.humidityPercent.toFixed(0)}%`,
    `미세먼지 PM10: ${weather.pm10 !== undefined ? `${weather.pm10.toFixed(1)} μg/m³` : '정보 없음'}`,
    `초미세먼지 PM2.5: ${weather.pm25 !== undefined ? `${weather.pm25.toFixed(1)} μg/m³` : '정보 없음'}`,
    `조회: ${weather.fetchedAt}`,
    '※ 전 세계 지역 검색 및 Open-Meteo 모델 기반 참고 정보입니다.',
  ].join('\n');
}
function formatStock(q: StockQuote): string {
  const price = q.price.toLocaleString(q.currency === 'KRW' ? 'ko-KR' : 'en-US', {
    minimumFractionDigits: q.currency === 'USD' ? 2 : 0,
    maximumFractionDigits: 2,
  });
  const unit = q.currency === 'KRW' ? '원' : q.currency === 'JPY' ? '엔' : 'USD';
  const change =
    q.change !== undefined && q.changeRate !== undefined
      ? `전일 대비: ${q.change >= 0 ? '+' : ''}${q.change.toLocaleString('ko-KR')}${unit} (${q.changeRate.toFixed(2)}%)`
      : '';
  return [
    `[주식 시세]`,
    `${q.name ?? '종목'} (${q.code})`,
    `시장: ${q.market}`,
    `현재가: ${price}${q.currency === 'KRW' ? '원' : q.currency === 'JPY' ? '엔' : ' USD'}`,
    change,
    q.volume !== undefined ? `거래량: ${q.volume.toLocaleString('ko-KR')}` : '',
    `기준: ${q.dataType === 'daily' ? '일별 종가' : '실시간'} (제공자 시각 기준)`,
    `조회: ${q.fetchedAt}`,
    '참고용 정보이며 투자 권유가 아닙니다.',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1000);
}
function formatStockCandidates(quotes: StockQuote[]): string {
  const lines = ['[주식 시세 검색 결과]', `후보 ${quotes.length}개`];
  for (const quote of quotes) {
    const market =
      quote.market === 'KRX' ? '한국시장(KRX)' : quote.market === 'JP' ? '일본시장' : '미국시장';
    lines.push('', `[${market}]`, formatStock(quote));
  }
  return lines.join('\n').slice(0, 1000);
}

export async function httpHandler(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/health')
    return Response.json({ status: 'ok' });
  if (request.method === 'GET' && url.pathname === '/v1/notice-alerts') {
    if (
      !env.BOT_SHARED_SECRET ||
      !safeEqual(request.headers.get('authorization') ?? '', `Bearer ${env.BOT_SHARED_SECRET}`)
    )
      return new Response('Unauthorized', { status: 401 });
    if (env.NOTICE_ALERT_ENABLED !== 'true') return Response.json({ notices: [] });
    const keywords = (env.NOTICE_ALERT_KEYWORDS ?? defaultNoticeAlertKeywords.join(','))
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 10);
    const client = createNexonClient(env.NEXON_API_KEY);
    if (!client.findNoticeAlerts) return Response.json({ notices: [] });
    const result = await client.findNoticeAlerts(keywords, timeoutSignal());
    const known = new Set(
      (url.searchParams.get('known') ?? '')
        .split('|')
        .filter((item) => /^https:\/\/(www\.)?maplestory\.nexon\.com\//.test(item)),
    );
    return Response.json({
      notices: result.notices.filter((notice) => !known.has(notice.url)),
      allUrls: result.notices.map((notice) => notice.url),
      fetchedAt: result.fetchedAt,
    });
  }
  if (request.method !== 'POST' || url.pathname !== '/v1/messages')
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
