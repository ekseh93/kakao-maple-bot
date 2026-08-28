import {
  chooseItems,
  formatRoyalDraw,
  formatWonderBerryDraw,
  formatBoutiqueGiftDraw,
  formatWhiteJadeBossRingBoxDraw,
  formatBlackAccessoryBoxDraw,
  formatLunaCrystalSweetDraw,
  formatLunaCrystalDreamDraw,
  formatSymbol,
  FORMATTED_HELP,
  parseCommand,
  parseRoyalOptions,
  playRps,
  formatFoodRecommendation,
  formatJapanTravelRecommendation,
  formatNetflixRecommendation,
  formatHotDealSections,
  type HotDealSection,
  formatAnimeRecommendation,
  formatMangaRecommendation,
  formatBossRewards,
  formatBossRewardSummaries,
  formatBossLevelBoost,
  formatBossForceBoost,
  formatMekaBerry,
  formatSauna,
  formatEpicDungeon,
  formatMepoEfficiency,
  formatMaxLevelSymbolEffects,
  formatFortune,
  formatLotto,
  formatDaisoProducts,
  formatNationalFuelPrices,
  formatLowestFuelStations,
  formatExchangeRates,
  formatUsageStats,
  validateCharacterName,
  validateRegion,
} from '@kakao-maple-bot/core';
import {
  createNexonClient,
  createInvenClient,
  createNaverWebtoonClient,
  createRidiMangaClient,
  createNaverBlogClient,
  createStockClient,
  createTmdbNetflixClient,
  createMcpRetailClient,
  createExchangeRateClient,
  createWebNovelClient,
  type Character,
  type DojangCharacter,
  type EquipmentCharacter,
  type EventList,
  type ExperienceHistory,
  type NexonClient,
  type StockClient,
  type NetflixClient,
  type StockQuote,
  type FuelStation,
  type UnionCharacter,
  type UnionChampion,
  type NoticeList,
  type InvenTopPostList,
  type InvenClient,
  type WebtoonClient,
  type WebtoonList,
  type WebNovelClient,
  type WebNovelList,
  type MangaClient,
  type MangaList,
  type NaverBlogClient,
  type NaverBlogPost,
  type RoyalStyleList,
  type WonderBerryList,
  type BoutiqueGiftList,
  type BossRingBoxList,
  type WeatherSnapshot,
  type LunaCrystalSweetList,
  type McpRetailClient,
  type FuelPrice,
  type ExchangeRate,
  type ExchangeRateClient,
} from '@kakao-maple-bot/providers';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { createDynamoUsageStatsStore, type UsageStatsStore } from './usage-stats.js';

export interface Env {
  BOT_SHARED_SECRET?: string;
  BOT_ENABLED?: string;
  ALLOWED_ROOMS?: string;
  ADMIN_SENDERS?: string;
  NEXON_API_KEY?: string;
  KRX_AUTH_KEY?: string;
  TIINGO_TOKEN?: string;
  STOCK_ENABLED?: string;
  TMDB_READ_ACCESS_TOKEN?: string;
  TMDB_REGION?: string;
  NOTICE_ALERT_ENABLED?: string;
  NOTICE_ALERT_KEYWORDS?: string;
  USAGE_STATS_TABLE_NAME?: string;
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
  webtoon?: WebtoonClient;
  webNovel?: WebNovelClient;
  manga?: MangaClient;
  naverBlog?: NaverBlogClient;
  stock?: StockClient;
  netflix?: NetflixClient;
  retail?: McpRetailClient;
  exchange?: ExchangeRateClient;
  usageStats?: UsageStatsStore;
  now?: () => Date;
  seen?: Set<string>;
};
const seen = new Map<string, number>();
const roomRequests = new Map<string, number[]>();
const senderRequests = new Map<string, number[]>();
let globalRequests: number[] = [];
const characterCache = new Map<string, { value: Character; expiresAt: number }>();
const dojangCache = new Map<string, { value: DojangCharacter; expiresAt: number }>();
const unionCache = new Map<string, { value: UnionCharacter; expiresAt: number }>();
const unionChampionCache = new Map<string, { value: UnionChampion; expiresAt: number }>();
const equipmentCache = new Map<string, { value: EquipmentCharacter; expiresAt: number }>();
const experienceCache = new Map<string, { value: ExperienceHistory; expiresAt: number }>();
let noticeCache: { value: NoticeList; expiresAt: number } | undefined;
let invenCache: { value: InvenTopPostList; expiresAt: number } | undefined;
let mabbakDorosiCache: { value: InvenTopPostList; expiresAt: number } | undefined;
type ResilientPostCache = {
  value: InvenTopPostList;
  expiresAt: number;
  staleUntil: number;
};
let hotDealsCache: ResilientPostCache | undefined;
let arcaLiveHotDealsCache: ResilientPostCache | undefined;
let fmKoreaHotDealsCache: ResilientPostCache | undefined;
let graphicsCardCache: ResilientPostCache | undefined;
let monitorCache: ResilientPostCache | undefined;
let japanTravelPostsCache: ResilientPostCache | undefined;
let japanRestaurantPostsCache: ResilientPostCache | undefined;
let webtoonCache: { value: WebtoonList; expiresAt: number } | undefined;
let webNovelCache: { value: WebNovelList; expiresAt: number } | undefined;
let mangaCache: { value: MangaList; expiresAt: number } | undefined;
let netflixCache:
  { value: Array<{ title: string; country?: string }>; expiresAt: number } | undefined;
let weeklyNewProductCache: { value: NaverBlogPost | null; expiresAt: number } | undefined;
let eventCache: { value: EventList; expiresAt: number } | undefined;
let sundayCache: { value: EventList; expiresAt: number } | undefined;
let royalCache: { value: RoyalStyleList; expiresAt: number } | undefined;
let wonderBerryCache: { value: WonderBerryList; expiresAt: number; provider?: object } | undefined;
let boutiqueGiftCache: { value: BoutiqueGiftList; expiresAt: number } | undefined;
let whiteJadeBossRingBoxCache: { value: BossRingBoxList; expiresAt: number } | undefined;
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
const retailCache = new Map<string, { value: unknown; expiresAt: number }>();
const dcInsideCacheTtlMs = 5 * 60_000;
const publicPostStaleTtlMs = 6 * 60 * 60_000;
let fuelCache: { value: FuelPrice[]; expiresAt: number } | undefined;
const lowestFuelStationsCache = new Map<
  string,
  { value: FuelStation[]; expiresAt: number; region?: string }
>();
let exchangeRateCache: { value: ExchangeRate; expiresAt: number } | undefined;

const errorText: Record<string, string> = {
  INVALID_USAGE: '사용법을 확인해 주세요.',
  NOT_FOUND: '정보를 찾지 못했습니다. 입력을 확인해 주세요.',
  NOT_CONFIGURED: '아직 운영자가 설정하지 않은 기능입니다.',
  PROVIDER_TIMEOUT: '외부 조회가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
  PROVIDER_UNAVAILABLE: '외부 서비스 오류로 지금은 조회할 수 없습니다.',
  RATE_LIMITED: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  BOT_PAUSED: '봇 점검 중입니다.',
  PROVIDER_SCHEMA: '외부 응답을 확인할 수 없습니다.',
  USAGE_STATS_UNAVAILABLE: '사용 통계를 잠시 조회할 수 없습니다.',
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

function stalePostReply(
  cache: ResilientPostCache | undefined,
  now: number,
  format: (value: InvenTopPostList) => string,
): string | null {
  if (!cache || cache.staleUntil <= now) return null;
  return `${format(cache.value)}\n※ 원문 일시 접근 제한으로 최근 정상 조회 결과를 표시합니다.`;
}

type HotDealCacheKey = 'quasarzone' | 'arcalive' | 'fmkorea';

function getHotDealCache(key: HotDealCacheKey): ResilientPostCache | undefined {
  if (key === 'quasarzone') return hotDealsCache;
  if (key === 'arcalive') return arcaLiveHotDealsCache;
  return fmKoreaHotDealsCache;
}

function setHotDealCache(key: HotDealCacheKey, value: ResilientPostCache): void {
  if (key === 'quasarzone') hotDealsCache = value;
  else if (key === 'arcalive') arcaLiveHotDealsCache = value;
  else fmKoreaHotDealsCache = value;
}

export function createAuditLog(input: {
  requestId: string;
  command: string;
  outcome: string;
  latencyMs: number;
  provider?: string;
  cacheStatus: string;
  now?: Date;
}) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(input.now ?? new Date());
  return {
    event: 'anonymous-command-usage',
    date,
    requestId: input.requestId,
    command: input.command,
    outcome: input.outcome,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    ...(input.provider ? { provider: input.provider } : {}),
    cacheStatus: input.cacheStatus,
    appVersion: '0.1.0',
  };
}

function auditOutcome(reply: string | null, cache: string): 'success' | 'error' | 'bypass' {
  if (!reply && cache === 'bypass') return 'bypass';
  if (!reply) return 'error';
  if (Object.values(errorText).some((text) => reply === text) || reply.startsWith('처리 중 오류'))
    return 'error';
  return 'success';
}

function writeAnonymousCommandAudit(
  message: string,
  result: { reply: string | null; requestId: string; cache: string },
  startedAt: number,
): void {
  if (!message.trim().startsWith('!') || result.reply === null) return;
  const command = parseCommand(message)?.name;
  if (!command) return;
  try {
    // Deliberately emit only aggregate-safe fields. Never add room, sender, or message here.
    console.log(
      JSON.stringify(
        createAuditLog({
          requestId: result.requestId,
          command,
          outcome: auditOutcome(result.reply, result.cache),
          latencyMs: Date.now() - startedAt,
          cacheStatus: result.cache,
        }),
      ),
    );
  } catch {
    // Observability must never change the command response.
  }
}

export async function handleMessage(
  message: Message,
  env: Env,
  deps: Dependencies = {},
): Promise<{
  reply: string | null;
  requestId: string;
  cache: 'hit' | 'miss' | 'stale' | 'bypass';
}> {
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
  if (mabbakDorosiCache && mabbakDorosiCache.expiresAt <= now) mabbakDorosiCache = undefined;
  if (hotDealsCache && hotDealsCache.staleUntil <= now) hotDealsCache = undefined;
  if (graphicsCardCache && graphicsCardCache.staleUntil <= now) graphicsCardCache = undefined;
  if (monitorCache && monitorCache.staleUntil <= now) monitorCache = undefined;
  if (japanTravelPostsCache && japanTravelPostsCache.staleUntil <= now)
    japanTravelPostsCache = undefined;
  if (japanRestaurantPostsCache && japanRestaurantPostsCache.staleUntil <= now)
    japanRestaurantPostsCache = undefined;
  if (webtoonCache && webtoonCache.expiresAt <= now) webtoonCache = undefined;
  if (webNovelCache && webNovelCache.expiresAt <= now) webNovelCache = undefined;
  if (weeklyNewProductCache && weeklyNewProductCache.expiresAt <= now)
    weeklyNewProductCache = undefined;
  if (eventCache && eventCache.expiresAt <= now) eventCache = undefined;
  if (royalCache && royalCache.expiresAt <= now) royalCache = undefined;
  if (wonderBerryCache && wonderBerryCache.expiresAt <= now) wonderBerryCache = undefined;
  if (boutiqueGiftCache && boutiqueGiftCache.expiresAt <= now) boutiqueGiftCache = undefined;
  if (whiteJadeBossRingBoxCache && whiteJadeBossRingBoxCache.expiresAt <= now)
    whiteJadeBossRingBoxCache = undefined;
  for (const [kind, entry] of lunaSweetCache)
    if (entry.expiresAt <= now) lunaSweetCache.delete(kind);
  for (const [kind, entry] of lunaDreamCache)
    if (entry.expiresAt <= now) lunaDreamCache.delete(kind);
  for (const [region, entry] of weatherCache)
    if (entry.expiresAt <= now) weatherCache.delete(region);
  for (const [key, entry] of retailCache) if (entry.expiresAt <= now) retailCache.delete(key);
  if (fuelCache && fuelCache.expiresAt <= now) fuelCache = undefined;
  for (const [key, entry] of lowestFuelStationsCache)
    if (entry.expiresAt <= now) lowestFuelStationsCache.delete(key);
  if (exchangeRateCache && exchangeRateCache.expiresAt <= now) exchangeRateCache = undefined;
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
  let usageTotal: number | undefined;
  let usageStatsFailed = false;
  if (deps.usageStats) {
    try {
      usageTotal = await deps.usageStats.increment();
    } catch {
      usageStatsFailed = true;
    }
  }
  try {
    switch (parsed.name) {
      case 'help':
        return {
          reply: FORMATTED_HELP,
          requestId,
          cache: 'bypass',
        };
      case 'status':
        if (!allowed(message.senderId, env.ADMIN_SENDERS))
          return { reply: null, requestId, cache: 'bypass' };
        return {
          reply: `[봇 상태]\n전체 활성: ${env.BOT_ENABLED !== 'false' ? '예' : '아니오'}\nNexon configured: ${env.NEXON_API_KEY ? '예' : '아니오'}\n주식 configured: ${env.STOCK_ENABLED === 'true' ? '예' : '아니오'}`,
          requestId,
          cache: 'bypass',
        };
      case 'usageStats':
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (usageTotal === undefined)
          throw new Error(usageStatsFailed ? 'USAGE_STATS_UNAVAILABLE' : 'NOT_CONFIGURED');
        return { reply: formatUsageStats(usageTotal), requestId, cache: 'bypass' };
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
          reply: `${chooseItems(parsed.args.join(' '))} 승리!`,
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
      case 'boss':
        return { reply: formatBossRewards(parsed.args), requestId, cache: 'bypass' };
      case 'seedRing': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (whiteJadeBossRingBoxCache && whiteJadeBossRingBoxCache.expiresAt > now)
          return {
            reply: formatWhiteJadeBossRingBoxDraw(whiteJadeBossRingBoxCache.value.items),
            requestId,
            cache: 'hit',
          };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findWhiteJadeBossRingBox) throw new Error('NOT_CONFIGURED');
        const box = await client.findWhiteJadeBossRingBox(timeoutSignal());
        whiteJadeBossRingBoxCache = { value: box, expiresAt: now + 5 * 60_000 };
        return {
          reply: formatWhiteJadeBossRingBoxDraw(box.items),
          requestId,
          cache: 'miss',
        };
      }
      case 'blackAccessoryBox':
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        return { reply: formatBlackAccessoryBoxDraw(), requestId, cache: 'bypass' };
      case 'bossRewards':
        return { reply: formatBossRewardSummaries(parsed.args), requestId, cache: 'bypass' };
      case 'bossLevelBoost':
        return { reply: formatBossLevelBoost(parsed.args), requestId, cache: 'bypass' };
      case 'bossForceBoost':
        return { reply: formatBossForceBoost(parsed.args), requestId, cache: 'bypass' };
      case 'mekaBerry':
        return { reply: formatMekaBerry(parsed.args), requestId, cache: 'bypass' };
      case 'sauna':
        return { reply: formatSauna(parsed.args), requestId, cache: 'bypass' };
      case 'mepoEfficiency':
        return { reply: formatMepoEfficiency(parsed.args), requestId, cache: 'bypass' };
      case 'symbolMax':
        return {
          reply: formatMaxLevelSymbolEffects(parsed.args),
          requestId,
          cache: 'bypass',
        };
      case 'netflix':
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (env.TMDB_READ_ACCESS_TOKEN) {
          if (netflixCache && netflixCache.expiresAt > now)
            return {
              reply: formatNetflixRecommendation(Math.random, netflixCache.value),
              requestId,
              cache: 'hit',
            };
          const client =
            deps.netflix ?? createTmdbNetflixClient(env.TMDB_READ_ACCESS_TOKEN, env.TMDB_REGION);
          let titles;
          try {
            titles = await client.findTitles(timeoutSignal());
          } catch {
            return { reply: formatNetflixRecommendation(), requestId, cache: 'bypass' };
          }
          netflixCache = {
            value: titles.map((item) => ({
              title: item.title,
              ...(item.country ? { country: item.country } : {}),
            })),
            expiresAt: now + 15 * 60_000,
          };
          return {
            reply: formatNetflixRecommendation(Math.random, netflixCache.value),
            requestId,
            cache: 'miss',
          };
        }
        return { reply: formatNetflixRecommendation(), requestId, cache: 'bypass' };
      case 'anime':
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        return { reply: formatAnimeRecommendation(), requestId, cache: 'bypass' };
      case 'manga': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (mangaCache && mangaCache.expiresAt > now)
          return {
            reply: formatMangaRecommendation(mangaCache.value.items, Math.random),
            requestId,
            cache: 'hit',
          };
        const client = deps.manga ?? createRidiMangaClient();
        const manga = await client.findJapaneseManga(timeoutSignal());
        mangaCache = { value: manga, expiresAt: now + 10 * 60_000 };
        return {
          reply: formatMangaRecommendation(manga.items, Math.random),
          requestId,
          cache: 'miss',
        };
      }
      case 'fortune':
        return {
          reply: formatFortune(parsed.args),
          requestId,
          cache: 'bypass',
        };
      case 'lotto':
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        return {
          reply: formatLotto(),
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
      case 'hotDeals': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        const client = deps.inven ?? createInvenClient();
        const sourceConfigs: Array<{
          key: HotDealCacheKey;
          source: string;
          boardUrl: string;
          fetch?: (signal: AbortSignal) => Promise<InvenTopPostList>;
        }> = [
          {
            key: 'quasarzone',
            source: '퀘이사존',
            boardUrl: 'https://quasarzone.com/bbs/qb_saleinfo',
            fetch: client.findHotDeals,
          },
          {
            key: 'arcalive',
            source: '아카라이브',
            boardUrl: 'https://arca.live/b/hotdeal',
            fetch: client.findArcaLiveHotDeals,
          },
          {
            key: 'fmkorea',
            source: '에펨코리아',
            boardUrl: 'https://www.fmkorea.com/hotdeal',
            fetch: client.findFmKoreaHotDeals,
          },
        ];
        let cacheHit = true;
        let hasStale = false;
        let firstError: unknown;
        const sections: HotDealSection[] = [];

        const results = await Promise.all(
          sourceConfigs.map(async (config) => {
            const cached = getHotDealCache(config.key);
            if (cached && cached.expiresAt > now)
              return { config, result: cached.value, state: 'fresh' as const };
            cacheHit = false;
            try {
              if (!config.fetch) throw new Error('NOT_CONFIGURED');
              const result = await config.fetch(timeoutSignal());
              setHotDealCache(config.key, {
                value: result,
                expiresAt: now + dcInsideCacheTtlMs,
                staleUntil: now + publicPostStaleTtlMs,
              });
              return { config, result, state: 'fresh' as const };
            } catch (error) {
              firstError ??= error;
              const stale = getHotDealCache(config.key);
              if (stale && stale.staleUntil > now) {
                hasStale = true;
                return { config, result: stale.value, state: 'stale' as const };
              }
              return {
                config,
                result: {
                  posts: [],
                  boardUrl: config.boardUrl,
                  fetchedAt: new Date(now).toISOString(),
                },
                state: 'unavailable' as const,
              };
            }
          }),
        );

        for (const { config, result, state } of results) {
          sections.push({
            source: config.source,
            posts: result.posts,
            boardUrl: result.boardUrl,
            state,
          });
        }
        if (sections.every((section) => section.posts.length === 0))
          throw firstError ?? new Error('PROVIDER_UNAVAILABLE');
        return {
          reply: formatHotDealSections(sections),
          requestId,
          cache: hasStale ? 'stale' : cacheHit ? 'hit' : 'miss',
        };
      }
      case 'graphicsCard': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (graphicsCardCache && graphicsCardCache.expiresAt > now)
          return {
            reply: formatGraphicsCardPosts(graphicsCardCache.value),
            requestId,
            cache: 'hit',
          };
        const client = deps.inven ?? createInvenClient();
        if (!client.findGraphicsCardPosts) throw new Error('NOT_CONFIGURED');
        try {
          const posts = await client.findGraphicsCardPosts(timeoutSignal());
          graphicsCardCache = {
            value: posts,
            expiresAt: now + dcInsideCacheTtlMs,
            staleUntil: now + publicPostStaleTtlMs,
          };
          return { reply: formatGraphicsCardPosts(posts), requestId, cache: 'miss' };
        } catch (error) {
          const stale = stalePostReply(graphicsCardCache, now, formatGraphicsCardPosts);
          if (stale) return { reply: stale, requestId, cache: 'stale' };
          throw error;
        }
      }
      case 'monitor': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (monitorCache && monitorCache.expiresAt > now)
          return {
            reply: formatMonitorPosts(monitorCache.value),
            requestId,
            cache: 'hit',
          };
        const client = deps.inven ?? createInvenClient();
        if (!client.findMonitorPosts) throw new Error('NOT_CONFIGURED');
        try {
          const posts = await client.findMonitorPosts(timeoutSignal());
          monitorCache = {
            value: posts,
            expiresAt: now + dcInsideCacheTtlMs,
            staleUntil: now + publicPostStaleTtlMs,
          };
          return { reply: formatMonitorPosts(posts), requestId, cache: 'miss' };
        } catch (error) {
          const stale = stalePostReply(monitorCache, now, formatMonitorPosts);
          if (stale) return { reply: stale, requestId, cache: 'stale' };
          throw error;
        }
      }
      case 'japanTravelPosts': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (japanTravelPostsCache && japanTravelPostsCache.expiresAt > now)
          return {
            reply: formatJapanTravelPosts(japanTravelPostsCache.value),
            requestId,
            cache: 'hit',
          };
        const client = deps.inven ?? createInvenClient();
        if (!client.findJapanTravelPosts) throw new Error('NOT_CONFIGURED');
        try {
          const posts = await client.findJapanTravelPosts(timeoutSignal());
          japanTravelPostsCache = {
            value: posts,
            expiresAt: now + dcInsideCacheTtlMs,
            staleUntil: now + publicPostStaleTtlMs,
          };
          return { reply: formatJapanTravelPosts(posts), requestId, cache: 'miss' };
        } catch (error) {
          const stale = stalePostReply(japanTravelPostsCache, now, formatJapanTravelPosts);
          if (stale) return { reply: stale, requestId, cache: 'stale' };
          throw error;
        }
      }
      case 'japanRestaurantPosts': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (japanRestaurantPostsCache && japanRestaurantPostsCache.expiresAt > now)
          return {
            reply: formatJapanRestaurantPosts(japanRestaurantPostsCache.value),
            requestId,
            cache: 'hit',
          };
        const client = deps.inven ?? createInvenClient();
        if (!client.findJapanRestaurantPosts) throw new Error('NOT_CONFIGURED');
        try {
          const posts = await client.findJapanRestaurantPosts(timeoutSignal());
          japanRestaurantPostsCache = {
            value: posts,
            expiresAt: now + dcInsideCacheTtlMs,
            staleUntil: now + publicPostStaleTtlMs,
          };
          return { reply: formatJapanRestaurantPosts(posts), requestId, cache: 'miss' };
        } catch (error) {
          const stale = stalePostReply(japanRestaurantPostsCache, now, formatJapanRestaurantPosts);
          if (stale) return { reply: stale, requestId, cache: 'stale' };
          throw error;
        }
      }
      case 'mabbakDorosi': {
        if (mabbakDorosiCache && mabbakDorosiCache.expiresAt > now)
          return { reply: formatMabbakDorosi(mabbakDorosiCache.value), requestId, cache: 'hit' };
        const inven = deps.inven ?? createInvenClient();
        if (!inven.findMabbakDorosiPosts) throw new Error('NOT_CONFIGURED');
        const posts = await inven.findMabbakDorosiPosts(timeoutSignal());
        mabbakDorosiCache = { value: posts, expiresAt: now + 60_000 };
        return { reply: formatMabbakDorosi(posts), requestId, cache: 'miss' };
      }
      case 'webtoon': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        const client = deps.webtoon ?? createNaverWebtoonClient();
        if (webtoonCache && webtoonCache.expiresAt > now) {
          return {
            reply: formatWebtoon(webtoonCache.value, Math.random),
            requestId,
            cache: 'hit',
          };
        }
        const webtoons = await client.findCurrentWebtoons(timeoutSignal());
        webtoonCache = { value: webtoons, expiresAt: now + 10 * 60_000 };
        return { reply: formatWebtoon(webtoons, Math.random), requestId, cache: 'miss' };
      }
      case 'webNovel': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        const client = deps.webNovel ?? createWebNovelClient();
        if (webNovelCache && webNovelCache.expiresAt > now) {
          return {
            reply: formatWebNovel(webNovelCache.value, Math.random),
            requestId,
            cache: 'hit',
          };
        }
        const novels = await client.findWebNovels(timeoutSignal());
        webNovelCache = { value: novels, expiresAt: now + 10 * 60_000 };
        return { reply: formatWebNovel(novels, Math.random), requestId, cache: 'miss' };
      }
      case 'weeklyNewProduct': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (weeklyNewProductCache && weeklyNewProductCache.expiresAt > now)
          return {
            reply: formatWeeklyNewProduct(weeklyNewProductCache.value),
            requestId,
            cache: 'hit',
          };
        const client = deps.naverBlog ?? createNaverBlogClient();
        const post = await client.findLatestWeeklyNewProduct(timeoutSignal());
        weeklyNewProductCache = { value: post, expiresAt: now + 10 * 60_000 };
        return { reply: formatWeeklyNewProduct(post), requestId, cache: 'miss' };
      }
      case 'discord':
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        return {
          reply:
            '[디스코드 안내]\n길드디코: https://discord.gg/Kzc9BKKfJ\n라운지디코: https://discord.gg/Vq2QfH77V',
          requestId,
          cache: 'bypass',
        };
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
        if (sundayCache && sundayCache.expiresAt > now) {
          const reply = formatSunday(sundayCache.value);
          if (reply) return { reply, requestId, cache: 'hit' };
          sundayCache = undefined;
        }
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (client.findSunday) {
          const sunday = await client.findSunday(timeoutSignal());
          if (!sunday) throw new Error('NOT_FOUND');
          sundayCache = {
            value: { events: [sunday], fetchedAt: new Date().toISOString() },
            expiresAt: now + 5 * 60_000,
          };
          return { reply: formatSunday(sundayCache.value)!, requestId, cache: 'miss' };
        }
        if (!client.findEvents) throw new Error('NOT_CONFIGURED');
        const events = await client.findEvents(timeoutSignal());
        sundayCache = { value: events, expiresAt: now + 5 * 60_000 };
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
        if (
          wonderBerryCache &&
          wonderBerryCache.expiresAt > now &&
          (!deps.nexon || wonderBerryCache.provider === deps.nexon)
        )
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
        wonderBerryCache = {
          value: wonderBerry,
          expiresAt: now + 5 * 60_000,
          ...(deps.nexon ? { provider: deps.nexon } : {}),
        };
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
            ),
            requestId,
            cache: 'hit',
          };
        const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
        if (!client.findBoutiqueGift) throw new Error('NOT_CONFIGURED');
        const boutiqueGift = await client.findBoutiqueGift(timeoutSignal());
        boutiqueGiftCache = { value: boutiqueGift, expiresAt: now + 5 * 60_000 };
        return {
          reply: formatBoutiqueGiftDraw(boutiqueGift.normalItems, boutiqueGift.feverItems),
          requestId,
          cache: 'miss',
        };
      }
      case 'lunaSweet': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        const kind = '일반' as const;
        const options = { count: 5, showResults: true };
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
        const options = { count: 5, showResults: true };
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
      case 'epicDungeon': {
        const name = validateCharacterName(parsed.args[0]);
        const cached = experienceCache.get(name);
        const history =
          cached && cached.expiresAt > now
            ? cached.value
            : await (async () => {
                const client = deps.nexon ?? createNexonClient(env.NEXON_API_KEY);
                if (!client.findExperienceHistory) throw new Error('NOT_CONFIGURED');
                const value = await client.findExperienceHistory(name, timeoutSignal());
                if (!value) throw new Error('NOT_FOUND');
                experienceCache.set(name, { value, expiresAt: now + 5 * 60_000 });
                return value;
              })();
        const current = history.snapshots[0];
        if (!current) throw new Error('NOT_FOUND');
        return {
          reply: formatEpicDungeon(history.name, current.level, current.experienceRate),
          requestId,
          cache: cached && cached.expiresAt > now ? 'hit' : 'miss',
        };
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
      case 'daiso': {
        if (parsed.args.length < 1) throw new Error('INVALID_USAGE');
        const query = parsed.args.join(' ');
        const key = `daiso:${query.toLocaleLowerCase()}`;
        const cached = retailCache.get(key);
        if (cached && cached.expiresAt > now)
          return {
            reply: formatDaisoProducts(
              query,
              cached.value as Parameters<typeof formatDaisoProducts>[1],
            ),
            requestId,
            cache: 'hit',
          };
        const client = deps.retail ?? createMcpRetailClient();
        const products = await client.searchDaisoProducts(query, timeoutSignal());
        retailCache.set(key, { value: products, expiresAt: now + 60_000 });
        return { reply: formatDaisoProducts(query, products), requestId, cache: 'miss' };
      }
      case 'fuel': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (fuelCache && fuelCache.expiresAt > now)
          return { reply: formatNationalFuelPrices(fuelCache.value), requestId, cache: 'hit' };
        const client = deps.retail ?? createMcpRetailClient();
        const prices = await client.findNationalFuelPrices(timeoutSignal());
        fuelCache = { value: prices, expiresAt: now + 10 * 60_000 };
        return { reply: formatNationalFuelPrices(prices), requestId, cache: 'miss' };
      }
      case 'fuelStations': {
        if (parsed.args.length !== 1 || !parsed.args[0]?.trim()) throw new Error('INVALID_USAGE');
        const requestedRegion = parsed.args[0].trim();
        const regionCodes: Record<string, { label?: string; code?: string }> = {
          전국: {},
          서울: { label: '서울', code: '01' },
          부산: { label: '부산', code: '02' },
          대구: { label: '대구', code: '03' },
          인천: { label: '인천', code: '04' },
          광주: { label: '광주', code: '05' },
          대전: { label: '대전', code: '06' },
          울산: { label: '울산', code: '07' },
          경기: { label: '경기', code: '08' },
          강원: { label: '강원', code: '09' },
          충북: { label: '충북', code: '10' },
          충남: { label: '충남', code: '11' },
          전북: { label: '전북', code: '12' },
          전남: { label: '전남', code: '13' },
          경북: { label: '경북', code: '14' },
          경남: { label: '경남', code: '15' },
          제주: { label: '제주', code: '16' },
          세종: { label: '세종', code: '17' },
        };
        const selected = regionCodes[requestedRegion];
        if (!selected) throw new Error('INVALID_USAGE');
        const cacheKey = selected.code ?? 'nationwide';
        const cached = lowestFuelStationsCache.get(cacheKey);
        if (cached && cached.expiresAt > now)
          return {
            reply: formatLowestFuelStations(cached.region, cached.value),
            requestId,
            cache: 'hit',
          };
        const client = deps.retail ?? createMcpRetailClient();
        const stations = await client.findLowestFuelStations(selected.code, timeoutSignal());
        lowestFuelStationsCache.set(cacheKey, {
          value: stations,
          region: selected.label,
          expiresAt: now + 10 * 60_000,
        });
        return {
          reply: formatLowestFuelStations(selected.label, stations),
          requestId,
          cache: 'miss',
        };
      }
      case 'exchangeRate': {
        if (parsed.args.length > 0) throw new Error('INVALID_USAGE');
        if (exchangeRateCache && exchangeRateCache.expiresAt > now)
          return { reply: formatExchangeRates(exchangeRateCache.value), requestId, cache: 'hit' };
        const client = deps.exchange ?? createExchangeRateClient();
        const rates = await client.findUsdAndJpyRates(timeoutSignal());
        exchangeRateCache = { value: rates, expiresAt: now + 60_000 };
        return { reply: formatExchangeRates(rates), requestId, cache: 'miss' };
      }
      default:
        return { reply: null, requestId, cache: 'bypass' };
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
  const totals = {
    allStat: 0,
    hpMp: 0,
    attackMagic: 0,
    bossDamage: 0,
    criticalDamage: 0,
    ignoreDefense: 0,
  };
  const addTotal = (key: keyof typeof totals, value: string, pattern: RegExp) => {
    const match = value.match(pattern);
    if (match) totals[key] += Number(match[1]);
  };
  for (const champion of c.champions) {
    for (const ability of champion.abilities) {
      addTotal('allStat', ability.value, /올스탯\s*([\d.]+)/);
      addTotal('hpMp', ability.value, /최대\s*HP\/MP\s*([\d.]+)/);
      addTotal('attackMagic', ability.value, /공격력\/마력\s*([\d.]+)/);
      addTotal('bossDamage', ability.value, /보스 몬스터 공격 시 데미지\s*([\d.]+)%/);
      addTotal('criticalDamage', ability.value, /크리티컬 데미지\s*([\d.]+)%/);
      addTotal('ignoreDefense', ability.value, /방어율 무시\s*([\d.]+)%/);
    }
  }
  const lines = [
    '[유니온 챔피언 능력치]',
    `캐릭터: ${c.name}`,
    `챔피언 수: ${c.champions.length}명`,
    '────────────',
  ];
  for (const champion of c.champions) {
    const detail = [champion.grade, champion.className].filter(Boolean).join(' ');
    lines.push(`▸ ${champion.name}${detail ? ` (${detail})` : ''}`);
  }
  lines.push(
    '────────────',
    '[휘장 효과 합계]',
    `- 올스탯: ${totals.allStat.toLocaleString('ko-KR')}`,
    `- 최대 HP/MP: ${totals.hpMp.toLocaleString('ko-KR')}`,
    `- 공격력/마력: ${totals.attackMagic.toLocaleString('ko-KR')}`,
    `- 보스 몬스터 공격 시 데미지: ${totals.bossDamage.toFixed(2)}%`,
    `- 크리티컬 데미지: ${totals.criticalDamage.toFixed(2)}%`,
    `- 방어율 무시: ${totals.ignoreDefense.toFixed(2)}%`,
    '────────────',
    `기준: Nexon Open API ${c.fetchedAt.slice(0, 10)}`,
  );
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
function formatGraphicsCardPosts(c: InvenTopPostList): string {
  return [
    '[퀘이사존 그래픽카드 최신 글]',
    ...c.posts
      .slice(0, 5)
      .map((post, index) => `${index + 1}. ${post.title}\n   ${post.url ?? ''}`),
    '',
    `게시판: ${c.boardUrl}`,
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatMonitorPosts(c: InvenTopPostList): string {
  return [
    '[디시인사이드 모니터 최신 글]',
    ...c.posts.slice(0, 5).map((post, index) => `${index + 1}. ${post.title}`),
    '',
    `게시판: ${c.boardUrl}`,
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatJapanTravelPosts(c: InvenTopPostList): string {
  return [
    '[디시인사이드 일본여행 최신 글]',
    ...c.posts.slice(0, 3).map((post, index) => `${index + 1}. ${post.title}`),
    '',
    `게시판: ${c.boardUrl}`,
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatJapanRestaurantPosts(c: InvenTopPostList): string {
  return [
    '[디시인사이드 일본 음식점 최신 글]',
    ...c.posts.slice(0, 3).map((post, index) => `${index + 1}. ${post.title}`),
    '',
    `게시판: ${c.boardUrl}`,
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatMabbakDorosi(c: InvenTopPostList): string {
  return [
    '[마빡도로시 최신 글]',
    ...c.posts.slice(0, 3).map((post, index) => `${index + 1}. ${post.title}\n   ${post.url}`),
  ]
    .join('\n')
    .slice(0, 1000);
}
function formatWebtoon(c: WebtoonList, random: () => number): string {
  const item = c.items[Math.floor(random() * c.items.length)];
  if (!item) throw new Error('NOT_FOUND');
  return [
    '[네이버 웹툰 랜덤 추천]',
    `작품: ${item.title}`,
    `작가: ${item.author}`,
    `연재 요일: ${item.weekday}요일`,
    item.url,
  ].join('\n');
}
function formatWebNovel(c: WebNovelList, random: () => number): string {
  const item = c.items[Math.floor(random() * c.items.length)];
  if (!item) throw new Error('NOT_FOUND');
  return ['[웹소설 랜덤 추천]', `작품: [${item.source}] ${item.title}`, item.url].join('\n');
}
function formatWeeklyNewProduct(post: NaverBlogPost | null): string {
  if (!post) throw new Error('NOT_FOUND');
  return ['[금주의 신상]', `제목: ${post.title}`, `게시글: ${post.url}`].join('\n');
}
function formatExperience(c: ExperienceHistory): string {
  const current = c.snapshots[0];
  const orderedSnapshots = [...c.snapshots].reverse();
  const currentLevel = current ? `Lv.${current.level}` : '-';
  const currentRate = current ? `${current.experienceRate.toFixed(2)}%` : '-';
  const lines = [
    '[경험치 히스토리]',
    `캐릭터: ${c.name} (현재 레벨: ${currentLevel} / 현재 경험치: ${currentRate})`,
    '최근 8일 (오래된 기록 → 최신 기록)',
    '────────────',
  ];
  for (const [index, snapshot] of orderedSnapshots.entries()) {
    const previous = orderedSnapshots[index - 1];
    const dailyChange =
      previous && previous.level === snapshot.level
        ? ` / 전날 대비 ${formatSignedPercent(snapshot.experienceRate - previous.experienceRate)}`
        : '';
    lines.push(
      `▸ ${snapshot.date}`,
      `  Lv.${snapshot.level} / ${snapshot.experienceRate.toFixed(2)}%${dailyChange}`,
    );
  }
  const oldest = orderedSnapshots[0];
  if (oldest && current && oldest.level === current.level) {
    const weekly = current.experienceRate - oldest.experienceRate;
    const dailyAverage = weekly / 7;
    const remaining = Math.max(0, 100 - current.experienceRate);
    const daysToLevelUp = dailyAverage > 0 ? remaining / dailyAverage : null;
    lines.push(
      '────────────',
      `7일 변화: ${formatSignedPercent(weekly)}`,
      `일평균: ${dailyAverage.toFixed(2)}%`,
      `1업(100%)까지 예상: ${daysToLevelUp === null ? '계산 불가' : `${daysToLevelUp.toFixed(2)}일`}`,
    );
  } else {
    lines.push('────────────', '7일 변화: 레벨업 포함으로 비율 단순 비교 불가');
  }
  const full = lines.join('\n');
  if (full.length <= 1000) return full;
  return full.slice(0, 980).trimEnd() + '\n… 응답 제한';
}
function formatSignedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
function formatEvents(c: EventList): string {
  const events = c.events.slice(0, 5);
  const lines = events.map((event, index) => {
    const period =
      event.startDate || event.endDate
        ? ` (${event.startDate?.slice(0, 10) ?? '?'}~${event.endDate?.slice(0, 10) ?? '?'})`
        : '';
    return `${index + 1}. ${event.title}${period}`;
  });
  const header = `[메이플스토리 최신 이벤트]\n최신 ${events.length}개`;
  const footer = '공식 이벤트 게시판: https://maplestory.nexon.com/News/Event';
  const output = [header, ...lines, footer].join('\n');
  if (output.length <= 1000) return output;
  let result = `${header}\n`;
  let included = 0;
  for (const line of lines) {
    if ((result + line + '\n').length + footer.length + 20 > 1000) break;
    result += `${line}\n`;
    included += 1;
  }
  return `${result}${footer}\n(응답 제한으로 ${events.length - included}건은 생략)`;
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
    event.imageUrl ? `이미지: ${event.imageUrl}` : '',
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
  if (request.method === 'GET' && url.pathname === '/v1/sunday-alert') {
    if (
      !env.BOT_SHARED_SECRET ||
      !safeEqual(request.headers.get('authorization') ?? '', `Bearer ${env.BOT_SHARED_SECRET}`)
    )
      return new Response('Unauthorized', { status: 401 });
    if (env.NOTICE_ALERT_ENABLED !== 'true') return Response.json({ event: null });
    const client = createNexonClient(env.NEXON_API_KEY);
    if (!client.findSunday) return Response.json({ event: null });
    const event = await client.findSunday(timeoutSignal());
    return Response.json({ event });
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
  const startedAt = Date.now();
  const result = await handleMessage(body, env, {
    usageStats: createDynamoUsageStatsStore(env.USAGE_STATS_TABLE_NAME, 'ap-northeast-1'),
  });
  writeAnonymousCommandAudit(body.message, result, startedAt);
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
