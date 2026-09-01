import type { PcQuote, PcQuoteRequest } from '@kakao-maple-bot/core';
export type { PcQuote, PcQuoteRequest } from '@kakao-maple-bot/core';

export type Character = {
  name: string;
  world?: string;
  level?: number;
  job?: string;
  guild?: string;
  combatPower?: number;
  hexaCoreCount?: number;
  hexaCoreLevelTotal?: number;
  hexaCores?: Array<{ type: string; name: string; level: number }>;
  fetchedAt: string;
};
export type NexonClient = {
  findCharacter(name: string, signal: AbortSignal): Promise<Character | null>;
  findExperienceHistory?(name: string, signal: AbortSignal): Promise<ExperienceHistory | null>;
  findDojang?(name: string, signal: AbortSignal): Promise<DojangCharacter | null>;
  findUnion?(name: string, signal: AbortSignal): Promise<UnionCharacter | null>;
  findUnionChampion?(name: string, signal: AbortSignal): Promise<UnionChampion | null>;
  findEquipment?(name: string, signal: AbortSignal): Promise<EquipmentCharacter | null>;
  findNotice?(signal: AbortSignal): Promise<NoticeList>;
  findNoticeAlerts?(keywords: string[], signal: AbortSignal): Promise<NoticeList>;
  findEvents?(signal: AbortSignal): Promise<EventList>;
  findSunday?(signal: AbortSignal): Promise<EventItem | null>;
  findRoyalStyles?(signal: AbortSignal): Promise<RoyalStyleList>;
  findWonderBerry?(signal: AbortSignal): Promise<WonderBerryList>;
  findBoutiqueGift?(signal: AbortSignal): Promise<BoutiqueGiftList>;
  findWhiteJadeBossRingBox?(signal: AbortSignal): Promise<BossRingBoxList>;
  findLunaCrystalSweet?(
    kind: '일반' | '스페셜',
    signal: AbortSignal,
  ): Promise<LunaCrystalSweetList>;
  findLunaCrystalDream?(
    kind: '일반' | '스페셜',
    signal: AbortSignal,
  ): Promise<LunaCrystalSweetList>;
  findWeather?(region: string, signal: AbortSignal): Promise<WeatherSnapshot | null>;
};
export type ExperienceSnapshot = {
  date: string;
  level: number;
  experience: number;
  experienceRate: number;
};
export type ExperienceHistory = { name: string; snapshots: ExperienceSnapshot[] };
export type DojangCharacter = {
  name: string;
  floor: number;
  timeSeconds: number;
  recordDate?: string;
  fetchedAt: string;
};
export type UnionCharacter = {
  name: string;
  level?: number;
  grade?: string;
  artifactLevel?: number;
  artifactPoint?: number;
  fetchedAt: string;
};
export type UnionChampionAbility = { name: string; value: string };
export type UnionChampionEntry = {
  name: string;
  grade?: string;
  className?: string;
  slot?: number;
  abilities: UnionChampionAbility[];
};
export type UnionChampion = {
  name: string;
  champions: UnionChampionEntry[];
  fetchedAt: string;
};
export type EquipmentItem = {
  part: string;
  name: string;
  starforce: number;
  potentialOptions: string[];
  additionalPotentialOptions: string[];
};
export type EquipmentCharacter = {
  name: string;
  combatPower?: number;
  items: EquipmentItem[];
  fetchedAt: string;
};
export type NoticeItem = { title: string; url: string; date?: string };
export type NoticeList = { notices: NoticeItem[]; fetchedAt: string };
export type InvenTopPost = { title: string; url?: string; postedAt?: string };
export type InvenTopPostList = {
  posts: InvenTopPost[];
  boardUrl: string;
  fetchedAt: string;
};
export type InvenClient = {
  findTopPosts(signal: AbortSignal): Promise<InvenTopPostList>;
  findMabbakDorosiPosts?(signal: AbortSignal): Promise<InvenTopPostList>;
  findHotDeals?(signal: AbortSignal): Promise<InvenTopPostList>;
  findArcaLiveHotDeals?(signal: AbortSignal): Promise<InvenTopPostList>;
  findFmKoreaHotDeals?(signal: AbortSignal): Promise<InvenTopPostList>;
  findGraphicsCardPosts?(signal: AbortSignal): Promise<InvenTopPostList>;
  findMonitorPosts?(signal: AbortSignal): Promise<InvenTopPostList>;
  findJapanTravelPosts?(signal: AbortSignal): Promise<InvenTopPostList>;
  findJapanRestaurantPosts?(signal: AbortSignal): Promise<InvenTopPostList>;
};
export type WebtoonItem = {
  titleId: number;
  title: string;
  author: string;
  weekday: string;
  url: string;
};
export type WebtoonList = { items: WebtoonItem[]; fetchedAt: string };
export type WebtoonClient = {
  findCurrentWebtoons(signal: AbortSignal): Promise<WebtoonList>;
};
export type WebNovelSource = '카페' | '문피아' | '노벨피아';
export type WebNovelItem = { title: string; source: WebNovelSource; url: string };
export type WebNovelList = { items: WebNovelItem[]; fetchedAt: string };
export type WebNovelClient = {
  findWebNovels(signal: AbortSignal): Promise<WebNovelList>;
};
export type MangaItem = { title: string; url: string };
export type MangaList = { items: MangaItem[]; sourceUrl: string; fetchedAt: string };
export type MangaClient = { findJapaneseManga(signal: AbortSignal): Promise<MangaList> };
export type RetailProduct = {
  id?: string;
  name: string;
  price?: number;
  currency?: string;
  soldOut?: boolean;
  pickupAvailable?: boolean;
  brand?: string;
};
export type FuelPrice = { productName: string; price: number; diff?: number; tradeDate?: string };
export type FuelStation = {
  name: string;
  brandName?: string;
  price: number;
  address?: string;
  roadAddress?: string;
};
export type McpRetailClient = {
  searchDaisoProducts(query: string, signal: AbortSignal): Promise<RetailProduct[]>;
  findNationalFuelPrices(signal: AbortSignal): Promise<FuelPrice[]>;
  findLowestFuelStations(areaCode: string | undefined, signal: AbortSignal): Promise<FuelStation[]>;
};
export type ExchangeRate = { usdKrw: number; jpyKrw: number; updatedAt?: string };
export type ExchangeRateClient = {
  findUsdAndJpyRates(signal: AbortSignal): Promise<ExchangeRate>;
};
export type NaverBlogPost = { title: string; url: string; publishedAt?: string };
export type NaverBlogClient = {
  findLatestWeeklyNewProduct(signal: AbortSignal): Promise<NaverBlogPost | null>;
};
export type EventItem = {
  title: string;
  url: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
};
export type EventList = { events: EventItem[]; fetchedAt: string };
export type RoyalStyleItem = { name: string; probability: number; category?: string };
export type RoyalStyleList = { items: RoyalStyleItem[]; sourceUrl: string; fetchedAt: string };
export type WonderBerryList = { items: RoyalStyleItem[]; sourceUrl: string; fetchedAt: string };
export type BoutiqueGiftList = {
  normalItems: RoyalStyleItem[];
  feverItems: RoyalStyleItem[];
  sourceUrl: string;
  fetchedAt: string;
};
export type BossRingBoxList = {
  items: RoyalStyleItem[];
  levelProbabilities: Array<{ level: number; probability: number }>;
  sourceUrl: string;
  fetchedAt: string;
};
export type LunaCrystalSweetList = {
  kind: '일반' | '스페셜';
  items: RoyalStyleItem[];
  sourceUrl: string;
  fetchedAt: string;
};
export type WeatherSnapshot = {
  query: string;
  location: string;
  country?: string;
  temperatureC: number;
  humidityPercent: number;
  weatherCode: number;
  pm25?: number;
  pm10?: number;
  fetchedAt: string;
};
export type StockQuote = {
  code: string;
  name?: string;
  price: number;
  currency: 'KRW' | 'USD' | 'JPY';
  market: 'KRX' | 'US' | 'JP';
  change?: number;
  changeRate?: number;
  volume?: number;
  fetchedAt: string;
  dataType: 'daily' | 'realtime';
};

const weatherSearchAliases: Record<string, string> = {
  서울: 'Seoul',
  부산: 'Busan',
  대구: 'Daegu',
  인천: 'Incheon',
  광주: 'Gwangju',
  대전: 'Daejeon',
  울산: 'Ulsan',
  제주: 'Jeju City',
  도쿄: 'Tokyo',
  오사카: 'Osaka',
  홋카이도: 'Sapporo',
  아오모리: 'Aomori',
  이와테: 'Morioka',
  미야기: 'Sendai',
  아키타: 'Akita',
  야마가타: 'Yamagata',
  후쿠시마: 'Fukushima',
  이바라키: 'Mito',
  도치기: 'Utsunomiya',
  군마: 'Maebashi',
  사이타마: 'Saitama',
  치바: 'Chiba',
  가나가와: 'Yokohama',
  니가타: 'Niigata',
  도야마: 'Toyama',
  이시카와: 'Kanazawa',
  후쿠이: 'Fukui',
  야마나시: 'Kofu',
  나가노: 'Nagano',
  기후: 'Gifu',
  시즈오카: 'Shizuoka',
  아이치: 'Nagoya',
  미에: 'Tsu',
  시가: 'Otsu',
  교토: 'Kyoto',
  효고: 'Kobe',
  나라: 'Nara',
  와카야마: 'Wakayama',
  돗토리: 'Tottori',
  시마네: 'Matsue',
  오카야마: 'Okayama',
  히로시마: 'Hiroshima',
  야마구치: 'Yamaguchi',
  도쿠시마: 'Tokushima',
  가가와: 'Takamatsu',
  에히메: 'Matsuyama',
  고치: 'Kochi',
  후쿠오카: 'Fukuoka',
  사가: 'Saga',
  나가사키: 'Nagasaki',
  구마모토: 'Kumamoto',
  오이타: 'Oita',
  미야자키: 'Miyazaki',
  가고시마: 'Kagoshima',
  오키나와: 'Naha',
};
export type StockClient = {
  quote(query: string, signal: AbortSignal): Promise<StockQuote>;
  quoteCandidates?(query: string, signal: AbortSignal): Promise<StockQuote[]>;
};
export type NetflixTitle = { title: string; mediaType: 'movie' | 'tv'; country?: string };
export type NetflixClient = { findTitles(signal: AbortSignal): Promise<NetflixTitle[]> };

function finiteNumber(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error('PROVIDER_SCHEMA');
  return parsed;
}
function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new Error('PROVIDER_SCHEMA');
  return value;
}
function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('PROVIDER_SCHEMA');
  return value;
}
function tokyoDateDaysAgo(daysAgo: number): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(
    Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)),
  );
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function fetchWithRetry(
  fetcher: typeof fetch,
  input: string,
  init: RequestInit,
): Promise<Response> {
  try {
    const first = await fetcher(input, init);
    if (first.status < 500) return first;
    return await fetcher(input, init);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    return await fetcher(input, init);
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLatestSundayEventPage(html: string): EventItem | null {
  const pattern =
    /<li>[\s\S]*?<a\s+href="(\/News\/Event\/\d+(?:\?[^\"]*)?)"[^>]*>[\s\S]*?<img\s+src="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<dt>\s*<a\s+href="[^\"]+"[^>]*>([\s\S]*?)<\/a>\s*<\/dt>[\s\S]*?<dd>\s*<a\s+href="[^\"]+"[^>]*>([\s\S]*?)<\/a>\s*<\/dd>[\s\S]*?<\/li>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[3] ?? '');
    if (!title.includes('썬데이') && !title.includes('선데이')) continue;
    const dateText = decodeHtml(match[4] ?? '');
    const dates = [...dateText.matchAll(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/g)].map(
      (date) => `${date[1]}-${date[2]}-${date[3]}`,
    );
    if (!dates[0]) throw new Error('PROVIDER_SCHEMA');
    const imageUrl = optionalString(match[2]);
    if (imageUrl && !/^https:\/\/(?:lwi|file|ssl)\.nexon\.com\//i.test(imageUrl))
      throw new Error('PROVIDER_SCHEMA');
    return {
      title,
      url: `https://maplestory.nexon.com${match[1]}`,
      startDate: dates[0],
      ...(dates[1] ? { endDate: dates[1] } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    };
  }
  return null;
}

function parseSundayImage(html: string): string | undefined {
  const content = html.match(/<div\s+class="new_board_con"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)?.[1];
  if (!content) return undefined;
  const imageUrl = content.match(/<img\s+[^>]*src="([^"]+)"/i)?.[1];
  if (!imageUrl || !/^https:\/\/(?:lwi|file|ssl)\.nexon\.com\//i.test(imageUrl)) return undefined;
  return imageUrl;
}

function parseLatestEventPage(html: string, limit = 5): EventList['events'] {
  const events: EventList['events'] = [];
  const pattern =
    /<dt>\s*<a\s+href=["'](\/News\/Event\/\d+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/dt>\s*<dd>\s*<a\s+href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>\s*<\/dd>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[2] ?? '');
    const dateText = decodeHtml(match[3] ?? '');
    if (!title || events.some((event) => event.title === title)) continue;
    const dates = [...dateText.matchAll(/(\d{4})[.\-/](\d{2})[.\-/](\d{2})/g)].map(
      (date) => `${date[1]}-${date[2]}-${date[3]}`,
    );
    events.push({
      title,
      url: `https://maplestory.nexon.com${match[1]}`,
      ...(dates[0] ? { startDate: dates[0] } : {}),
      ...(dates[1] ? { endDate: dates[1] } : {}),
    });
    if (events.length === limit) break;
  }
  if (events.length === 0) throw new Error('PROVIDER_SCHEMA');
  return events;
}

function parseInvenTopPosts(
  html: string,
  boardUrl: string,
  limit = 5,
  excludeNoticeRows = false,
): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const subjectPattern = /<a\b[^>]*class=["'][^"']*subject-link[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(subjectPattern)) {
    if (excludeNoticeRows) {
      const matchIndex = match.index ?? 0;
      const rowStart = html.lastIndexOf('<tr', matchIndex);
      const rowEnd = html.indexOf('</tr>', matchIndex);
      const row = rowStart >= 0 && rowEnd >= rowStart ? html.slice(rowStart, rowEnd + 5) : '';
      if (/<tr\b[^>]*class=["'][^"']*\bnotice\b/i.test(row)) continue;
    }
    const title = decodeHtml(match[1] ?? '')
      .replace(/^\[[^\]]+\]\s*/, '')
      .trim();
    if (!title || posts.some((post) => post.title === title)) continue;
    const href = match[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
    const url = href
      ? href.startsWith('http')
        ? href
        : `https://www.inven.co.kr${href.startsWith('/') ? href : `/${href}`}`
      : undefined;
    posts.push({ title, ...(url ? { url } : {}) });
    if (posts.length === limit) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

function parseQuasarZoneHotDeals(html: string, boardUrl: string): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const pattern =
    /<a\b[^>]*href=["']([^"']*\/bbs\/qb_saleinfo\/views\/\d+(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[2] ?? '')
      .replace(/<[^>]*>/g, '')
      .trim();
    if (!title || posts.some((post) => post.title === title)) continue;
    const path = (match[1] ?? '').match(/\/bbs\/qb_saleinfo\/views\/\d+/)?.[0];
    if (!path) continue;
    const postedAt = extractQuasarPostedAt(html, match.index ?? 0);
    posts.push({ title, url: `https://quasarzone.com${path}`, ...(postedAt ? { postedAt } : {}) });
    if (posts.length === 6) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

function extractQuasarPostedAt(html: string, anchorIndex: number): string | undefined {
  const rowStarts = [
    html.lastIndexOf('<li', anchorIndex),
    html.lastIndexOf('<tr', anchorIndex),
  ].filter((index) => index >= 0);
  const rowStart = rowStarts.length > 0 ? Math.max(...rowStarts) : Math.max(0, anchorIndex - 1200);
  const rowEnds = ['</li>', '</tr>']
    .map((closingTag) => html.indexOf(closingTag, anchorIndex))
    .filter((index) => index >= 0);
  const rowEnd = rowEnds.length > 0 ? Math.min(...rowEnds) + 5 : anchorIndex + 3000;
  const row = html.slice(rowStart, rowEnd);

  const dateElement = row.match(
    /<(?:time|span|div|p|td)\b[^>]*(?:class|data-time|datetime)=["'][^"']*(?:date|time|datetime)[^"']*["'][^>]*>([\s\S]*?)<\/(?:time|span|div|p|td)>/i,
  );
  const datetime = row.match(/\bdatetime=["']([^"']+)["']/i)?.[1];
  const candidate = decodeHtml(dateElement?.[1] ?? datetime ?? '');
  const match = candidate.match(
    /\b(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}(?:\s+\d{1,2}:\d{2})?|\d{1,2}[./-]\d{1,2}(?:\s+\d{1,2}:\d{2})?|\d{1,2}:\d{2})\b/,
  );
  return match?.[0];
}

function parseArcaLiveHotDeals(html: string, boardUrl: string): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const pattern = /<a\b[^>]*href=["'](\/b\/hotdeal\/\d+(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[2] ?? '');
    if (
      !title ||
      /^(핫딜|전체|검색|로그인|회원가입|더보기|공지)$/i.test(title) ||
      posts.some((post) => post.title === title)
    )
      continue;
    const path = (match[1] ?? '').match(/\/b\/hotdeal\/\d+/)?.[0];
    if (!path) continue;
    posts.push({ title, url: `https://arca.live${path}` });
    if (posts.length === 5) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

function parseFmKoreaHotDeals(html: string, boardUrl: string): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const pattern =
    /<td\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']*document_srl=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[2] ?? '');
    if (
      !title ||
      /(?:통합)?공지|금지|규정|이용안내/i.test(title) ||
      posts.some((post) => post.title === title)
    )
      continue;
    const documentId = (match[1] ?? '').match(/document_srl=(\d+)/i)?.[1];
    if (!documentId) continue;
    posts.push({ title, url: `https://www.fmkorea.com/${documentId}` });
    if (posts.length === 5) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

function isQuasarZoneChallengePage(html: string): boolean {
  return /(?:Enable JavaScript and cookies to continue|퀘이사존에 접속하려면 보안검사를 완료하세요|_cf_chl_opt|turnstile\.render)/i.test(
    html,
  );
}

async function fetchQuasarZoneHotDealsHtml(
  fetcher: typeof fetch,
  boardUrl: string,
  signal: AbortSignal,
): Promise<string> {
  const headers = {
    Accept: 'text/html,application/xhtml+xml',
    'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
  };
  const requestUrls = [boardUrl, `${boardUrl}?sort=num%2C+reply`];

  for (const requestUrl of requestUrls) {
    const response = await fetchWithRetry(fetcher, requestUrl, { headers, signal });
    if (response.status === 403 || response.status === 429) continue;
    if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
    const html = await response.text();
    if (isQuasarZoneChallengePage(html)) continue;
    return html;
  }

  throw new Error('PROVIDER_UNAVAILABLE');
}

function parseQuasarZonePosts(html: string, boardUrl: string, limit: number): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const pattern = /<a\b[^>]*href=["'](\/bbs\/qb_tsy\/views\/\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[2] ?? '')
      .replace(/<[^>]*>/g, '')
      .trim();
    if (
      !title ||
      /(?:게시판\s*)?특별\s*규정/i.test(title) ||
      /^\s*\[?공지\]?\s*$/i.test(title) ||
      posts.some((post) => post.title === title)
    )
      continue;
    posts.push({ title, url: `https://quasarzone.com${match[1]}` });
    if (posts.length === limit) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

function parseDcinsideMonitorPosts(html: string, boardUrl: string, limit = 5): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const pattern =
    /<a\b[^>]*href=["']([^"']*\/mgallery\/board\/view\/[^"']*?[?&]id=mnt[&]no=\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[2] ?? '').trim();
    const href = match[1] ?? '';
    if (!title || posts.some((post) => post.title === title)) continue;
    posts.push({
      title,
      url: href.startsWith('http') ? href : `https://gall.dcinside.com${href}`,
    });
    if (posts.length === limit) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

function parseDcinsideBoardPosts(
  html: string,
  boardUrl: string,
  galleryId: string,
  limit: number,
): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const pattern = new RegExp(
    `<a\\b[^>]*href=["']([^"']*\\/mgallery\\/board\\/view\\/[^"']*?[?&]id=${galleryId}[&]no=\\d+)["'][^>]*>([\\s\\S]*?)<\\/a>`,
    'gi',
  );
  for (const match of html.matchAll(pattern)) {
    const title = decodeHtml(match[2] ?? '').trim();
    const href = match[1] ?? '';
    if (!title || posts.some((post) => post.title === title)) continue;
    posts.push({
      title,
      url: href.startsWith('http') ? href : `https://gall.dcinside.com${href}`,
    });
    if (posts.length === limit) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

async function fetchDcinsideHtml(
  fetcher: typeof fetch,
  primaryUrl: string,
  mobileUrl: string,
  signal: AbortSignal,
): Promise<string> {
  const headers = {
    Accept: 'text/html,application/xhtml+xml',
    'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
  };
  for (const url of [primaryUrl, mobileUrl]) {
    const response = await fetchWithRetry(fetcher, url, { headers, signal });
    if (response.ok) return response.text();
    if (response.status === 403 || response.status === 429) throw new Error('PROVIDER_UNAVAILABLE');
  }
  throw new Error('PROVIDER_UNAVAILABLE');
}

function parseLatestWeeklyNewProduct(xml: string): NaverBlogPost | null {
  const itemPattern = /<item\b[\s\S]*?<\/item>/gi;
  for (const match of xml.matchAll(itemPattern)) {
    const item = match[0];
    const titleMatch = item.match(
      /<title>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*<\/title>/i,
    );
    const linkMatch = item.match(/<link>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))\s*<\/link>/i);
    const dateMatch = item.match(/<pubDate>\s*([^<]+?)\s*<\/pubDate>/i);
    const title = decodeHtml(titleMatch?.[1] ?? titleMatch?.[2] ?? '');
    const url = decodeHtml(linkMatch?.[1] ?? linkMatch?.[2] ?? '');
    if (!title.includes('[금주의 신상]')) continue;
    if (!url || !/^https:\/\/blog\.naver\.com\/don_jjin\/\d+/.test(url))
      throw new Error('PROVIDER_SCHEMA');
    return { title, url, ...(dateMatch?.[1] ? { publishedAt: dateMatch[1].trim() } : {}) };
  }
  return null;
}

function parseProbabilityPage(
  html: string,
  sourceUrl: string,
  tablePosition: 'first' | 'last' = 'first',
  includeCategory = false,
): RoyalStyleList {
  const tables = (html.match(/<table\b[\s\S]*?<\/table>/gi) ?? []).filter((table) =>
    /획득확률/.test(table),
  );
  const table = tablePosition === 'last' ? tables.at(-1) : tables[0];
  if (!table) throw new Error('PROVIDER_SCHEMA');
  const items: RoyalStyleItem[] = [];
  for (const row of table.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]!);
    if (cells.length < 2) continue;
    const probabilityText = decodeHtml(cells[cells.length - 1]!);
    const probabilityMatch = probabilityText.match(/^(\d+(?:\.\d+)?)%$/);
    if (!probabilityMatch) continue;
    const name = decodeHtml(cells[cells.length - 2]!);
    const category =
      includeCategory && cells.length >= 3 ? decodeHtml(cells[cells.length - 3]!) : undefined;
    const probability = Number(probabilityMatch[1]);
    if (!name || !Number.isFinite(probability) || probability <= 0 || probability > 100)
      throw new Error('PROVIDER_SCHEMA');
    items.push({ name, probability, ...(category ? { category } : {}) });
  }
  if (items.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { items, sourceUrl, fetchedAt: new Date().toISOString() };
}

function parseRingLevelProbabilities(html: string): Array<{ level: number; probability: number }> {
  const table = (html.match(/<table\b[\s\S]*?<\/table>/gi) ?? []).find((value) =>
    /반지\s*레벨/.test(value),
  );
  if (!table) throw new Error('PROVIDER_SCHEMA');
  const levels: Array<{ level: number; probability: number }> = [];
  for (const row of table.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) =>
      decodeHtml(match[1]!),
    );
    if (cells.length < 2) continue;
    const level = Number(cells[0]);
    const probabilityMatch = cells[1]!.match(/^(\d+(?:\.\d+)?)%$/);
    const probability = probabilityMatch ? Number(probabilityMatch[1]) : NaN;
    if (!Number.isInteger(level) || !Number.isFinite(probability) || probability <= 0) {
      throw new Error('PROVIDER_SCHEMA');
    }
    levels.push({ level, probability });
  }
  if (levels.length === 0) throw new Error('PROVIDER_SCHEMA');
  return levels;
}

export function createNexonClient(
  apiKey: string | undefined,
  fetcher: typeof fetch = fetch,
): NexonClient {
  const findOcid = async (name: string, signal: AbortSignal): Promise<string | null> => {
    if (!apiKey) throw new Error('NOT_CONFIGURED');
    const base = 'https://open.api.nexon.com/maplestory/v1';
    const id = await fetchWithRetry(
      fetcher,
      `${base}/id?character_name=${encodeURIComponent(name)}`,
      { headers: { 'x-nxopen-api-key': apiKey }, signal },
    );
    if (id.status === 404) return null;
    if (!id.ok) throw new Error(id.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
    const body = (await id.json()) as { ocid?: string };
    if (typeof body.ocid !== 'string' || !body.ocid) throw new Error('PROVIDER_SCHEMA');
    return body.ocid;
  };
  return {
    async findCharacter(name, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const base = 'https://open.api.nexon.com/maplestory/v1';
      const headers = { 'x-nxopen-api-key': apiKey };
      const ocid = await findOcid(name, signal);
      if (!ocid) return null;
      const basic = await fetchWithRetry(
        fetcher,
        `${base}/character/basic?ocid=${encodeURIComponent(ocid)}`,
        {
          headers,
          signal,
        },
      );
      if (!basic.ok)
        throw new Error(basic.status >= 500 ? 'PROVIDER_UNAVAILABLE' : 'PROVIDER_SCHEMA');
      const data = (await basic.json()) as Record<string, unknown>;
      const characterName = optionalString(data.character_name);
      const world = optionalString(data.world_name);
      const level = optionalNumber(data.character_level);
      const job = optionalString(data.character_class);
      const guild = optionalString(data.character_guild_name);
      const stat = await fetchWithRetry(
        fetcher,
        `${base}/character/stat?ocid=${encodeURIComponent(ocid)}`,
        { headers, signal },
      );
      if (!stat.ok) throw new Error(stat.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const statBody = (await stat.json()) as {
        final_stat?: Array<{ stat_name?: string; stat_value?: string }>;
      };
      if (!Array.isArray(statBody.final_stat)) throw new Error('PROVIDER_SCHEMA');
      const combatPowerValue = statBody.final_stat.find(
        (entry) => entry.stat_name === '전투력',
      )?.stat_value;
      const combatPower =
        combatPowerValue === undefined ? undefined : finiteNumber(combatPowerValue);
      const hexa = await fetchWithRetry(
        fetcher,
        `${base}/character/hexamatrix?ocid=${encodeURIComponent(ocid)}`,
        { headers, signal },
      );
      if (!hexa.ok) throw new Error(hexa.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const hexaBody = (await hexa.json()) as {
        character_hexa_core_equipment?: Array<{
          hexa_core_type?: string;
          hexa_core_name?: string;
          hexa_core_level?: number;
        }> | null;
      };
      if (
        hexaBody.character_hexa_core_equipment !== null &&
        !Array.isArray(hexaBody.character_hexa_core_equipment)
      )
        throw new Error('PROVIDER_SCHEMA');
      const hexaCores = hexaBody.character_hexa_core_equipment ?? [];
      if (
        hexaCores.some(
          (core) =>
            typeof core.hexa_core_type !== 'string' ||
            typeof core.hexa_core_name !== 'string' ||
            !Number.isInteger(core.hexa_core_level),
        )
      )
        throw new Error('PROVIDER_SCHEMA');
      return {
        name: characterName ?? name,
        world,
        level,
        job,
        guild,
        ...(combatPower !== undefined ? { combatPower } : {}),
        hexaCoreCount: hexaCores.length,
        hexaCoreLevelTotal: hexaCores.reduce((sum, core) => sum + (core.hexa_core_level ?? 0), 0),
        hexaCores: hexaCores.map((core) => ({
          type: core.hexa_core_type!,
          name: core.hexa_core_name!,
          level: core.hexa_core_level!,
        })),
        fetchedAt: new Date().toISOString(),
      };
    },
    async findExperienceHistory(name, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const ocid = await findOcid(name, signal);
      if (!ocid) return null;
      const base = 'https://open.api.nexon.com/maplestory/v1';
      const snapshots: ExperienceSnapshot[] = [];
      for (let daysAgo = 0; daysAgo <= 7; daysAgo += 1) {
        const date = tokyoDateDaysAgo(daysAgo);
        const response = await fetchWithRetry(
          fetcher,
          `${base}/character/basic?ocid=${encodeURIComponent(ocid)}&date=${date}`,
          { headers: { 'x-nxopen-api-key': apiKey }, signal },
        );
        if (!response.ok) {
          if ([400, 404].includes(response.status)) continue;
          throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
        }
        const body = (await response.json()) as {
          character_level?: number;
          character_exp?: number;
          character_exp_rate?: string;
        };
        if (
          typeof body.character_level !== 'number' ||
          !Number.isInteger(body.character_level) ||
          typeof body.character_exp !== 'number' ||
          !Number.isInteger(body.character_exp) ||
          typeof body.character_exp_rate !== 'string'
        )
          throw new Error('PROVIDER_SCHEMA');
        const level = body.character_level;
        const experience = body.character_exp;
        const experienceRate = finiteNumber(body.character_exp_rate);
        if (experienceRate < 0 || experienceRate > 100) throw new Error('PROVIDER_SCHEMA');
        snapshots.push({
          date,
          level,
          experience,
          experienceRate,
        });
      }
      return { name, snapshots };
    },
    async findDojang(name, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const ocid = await findOcid(name, signal);
      if (!ocid) return null;
      const base = 'https://open.api.nexon.com/maplestory/v1';
      const response = await fetchWithRetry(
        fetcher,
        `${base}/character/dojang?ocid=${encodeURIComponent(ocid)}`,
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        date?: string | null;
        dojang_best_floor?: number | null;
        dojang_best_time?: number | null;
        date_dojang_record?: string | null;
      };
      if (
        typeof body.dojang_best_floor !== 'number' ||
        !Number.isInteger(body.dojang_best_floor) ||
        typeof body.dojang_best_time !== 'number' ||
        !Number.isInteger(body.dojang_best_time)
      )
        throw new Error('PROVIDER_SCHEMA');
      if (
        body.date_dojang_record !== undefined &&
        body.date_dojang_record !== null &&
        typeof body.date_dojang_record !== 'string'
      )
        throw new Error('PROVIDER_SCHEMA');
      return {
        name,
        floor: body.dojang_best_floor,
        timeSeconds: body.dojang_best_time,
        recordDate: body.date_dojang_record ?? undefined,
        fetchedAt: body.date ?? new Date().toISOString(),
      };
    },
    async findUnion(name, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const ocid = await findOcid(name, signal);
      if (!ocid) return null;
      const base = 'https://open.api.nexon.com/maplestory/v1';
      const response = await fetchWithRetry(
        fetcher,
        `${base}/user/union?ocid=${encodeURIComponent(ocid)}`,
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        date?: string | null;
        union_level?: number | null;
        union_grade?: string | null;
        union_artifact_level?: number | null;
        union_artifact_point?: number | null;
      };
      const numericFields = [
        body.union_level,
        body.union_artifact_level,
        body.union_artifact_point,
      ];
      if (
        numericFields.some(
          (value) =>
            value !== undefined && value !== null && (!Number.isInteger(value) || value < 0),
        )
      )
        throw new Error('PROVIDER_SCHEMA');
      if (
        body.union_grade !== undefined &&
        body.union_grade !== null &&
        typeof body.union_grade !== 'string'
      )
        throw new Error('PROVIDER_SCHEMA');
      return {
        name,
        level: body.union_level ?? undefined,
        grade: body.union_grade ?? undefined,
        artifactLevel: body.union_artifact_level ?? undefined,
        artifactPoint: body.union_artifact_point ?? undefined,
        fetchedAt: body.date ?? new Date().toISOString(),
      };
    },
    async findUnionChampion(name, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const ocid = await findOcid(name, signal);
      if (!ocid) return null;
      const base = 'https://open.api.nexon.com/maplestory/v1';
      const response = await fetchWithRetry(
        fetcher,
        `${base}/user/union-champion?ocid=${encodeURIComponent(ocid)}`,
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        date?: string | null;
        union_champion?: Array<{
          champion_name?: string | null;
          champion_grade?: string | null;
          champion_slot?: number | null;
          champion_class?: string | null;
          champion_badge_info?: Array<{ stat?: string | null }> | null;
        }> | null;
      };
      if (!Array.isArray(body.union_champion)) throw new Error('PROVIDER_SCHEMA');
      const champions = body.union_champion.map((champion) => {
        if (
          typeof champion.champion_name !== 'string' ||
          !Array.isArray(champion.champion_badge_info)
        )
          throw new Error('PROVIDER_SCHEMA');
        if (
          (champion.champion_grade !== undefined &&
            champion.champion_grade !== null &&
            typeof champion.champion_grade !== 'string') ||
          (champion.champion_slot !== undefined &&
            champion.champion_slot !== null &&
            (!Number.isInteger(champion.champion_slot) || champion.champion_slot < 0)) ||
          (champion.champion_class !== undefined &&
            champion.champion_class !== null &&
            typeof champion.champion_class !== 'string')
        )
          throw new Error('PROVIDER_SCHEMA');
        const abilities = champion.champion_badge_info.map((badge) => {
          if (typeof badge.stat !== 'string') throw new Error('PROVIDER_SCHEMA');
          return { name: '챔피언 휘장', value: badge.stat };
        });
        return {
          name: champion.champion_name,
          ...(champion.champion_grade ? { grade: champion.champion_grade } : {}),
          ...(champion.champion_class ? { className: champion.champion_class } : {}),
          ...(champion.champion_slot !== undefined && champion.champion_slot !== null
            ? { slot: champion.champion_slot }
            : {}),
          abilities,
        };
      });
      return { name, champions, fetchedAt: body.date ?? new Date().toISOString() };
    },
    async findEquipment(name, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const ocid = await findOcid(name, signal);
      if (!ocid) return null;
      const base = 'https://open.api.nexon.com/maplestory/v1';
      const response = await fetchWithRetry(
        fetcher,
        `${base}/character/item-equipment?ocid=${encodeURIComponent(ocid)}`,
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        date?: string | null;
        item_equipment?: Array<{
          item_equipment_part?: string;
          item_name?: string;
          starforce?: string;
          potential_option_1?: string | null;
          potential_option_2?: string | null;
          potential_option_3?: string | null;
          additional_potential_option_1?: string | null;
          additional_potential_option_2?: string | null;
          additional_potential_option_3?: string | null;
        }> | null;
      };
      if (!Array.isArray(body.item_equipment)) throw new Error('PROVIDER_SCHEMA');
      const items = body.item_equipment.map((item) => {
        if (
          typeof item.item_equipment_part !== 'string' ||
          typeof item.item_name !== 'string' ||
          typeof item.starforce !== 'string' ||
          !/^\d+$/.test(item.starforce)
        )
          throw new Error('PROVIDER_SCHEMA');
        const potentialOptions = [
          item.potential_option_1,
          item.potential_option_2,
          item.potential_option_3,
        ].filter((value): value is string => typeof value === 'string' && value.trim() !== '');
        const additionalPotentialOptions = [
          item.additional_potential_option_1,
          item.additional_potential_option_2,
          item.additional_potential_option_3,
        ].filter((value): value is string => typeof value === 'string' && value.trim() !== '');
        return {
          part: item.item_equipment_part,
          name: item.item_name,
          starforce: Number(item.starforce),
          potentialOptions,
          additionalPotentialOptions,
        };
      });
      const stat = await fetchWithRetry(
        fetcher,
        `${base}/character/stat?ocid=${encodeURIComponent(ocid)}`,
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!stat.ok) throw new Error(stat.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const statBody = (await stat.json()) as {
        final_stat?: Array<{ stat_name?: string; stat_value?: string }>;
      };
      if (!Array.isArray(statBody.final_stat)) throw new Error('PROVIDER_SCHEMA');
      const combatPowerValue = statBody.final_stat.find(
        (entry) => entry.stat_name === '전투력',
      )?.stat_value;
      const combatPower =
        combatPowerValue === undefined ? undefined : finiteNumber(combatPowerValue);
      return {
        name,
        ...(combatPower !== undefined ? { combatPower } : {}),
        items,
        fetchedAt: body.date ?? new Date().toISOString(),
      };
    },
    async findNotice(signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const response = await fetchWithRetry(
        fetcher,
        'https://open.api.nexon.com/maplestory/v1/notice',
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        notice?: Array<{ title?: string; url?: string; date?: string }> | null;
      };
      if (!Array.isArray(body.notice)) throw new Error('PROVIDER_SCHEMA');
      const notices = body.notice.slice(0, 3).map((notice) => {
        if (typeof notice.title !== 'string' || typeof notice.url !== 'string')
          throw new Error('PROVIDER_SCHEMA');
        if (!/^https:\/\/(www\.)?maplestory\.nexon\.com\//.test(notice.url))
          throw new Error('PROVIDER_SCHEMA');
        const date = optionalString(notice.date);
        return { title: notice.title, url: notice.url, ...(date ? { date } : {}) };
      });
      return { notices, fetchedAt: new Date().toISOString() };
    },
    async findNoticeAlerts(keywords, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const normalizedKeywords = keywords.map((keyword) => keyword.trim()).filter(Boolean);
      if (normalizedKeywords.length === 0) throw new Error('INVALID_USAGE');
      const response = await fetchWithRetry(
        fetcher,
        'https://open.api.nexon.com/maplestory/v1/notice',
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        notice?: Array<{ title?: string; url?: string; date?: string }> | null;
      };
      if (!Array.isArray(body.notice)) throw new Error('PROVIDER_SCHEMA');
      const notices = body.notice
        .filter((notice) => typeof notice.title === 'string' && typeof notice.url === 'string')
        .filter((notice) => normalizedKeywords.some((keyword) => notice.title!.includes(keyword)))
        .map((notice) => {
          if (!/^https:\/\/(www\.)?maplestory\.nexon\.com\//.test(notice.url!))
            throw new Error('PROVIDER_SCHEMA');
          const date = optionalString(notice.date);
          return { title: notice.title!, url: notice.url!, ...(date ? { date } : {}) };
        });
      return { notices, fetchedAt: new Date().toISOString() };
    },
    async findEvents(signal) {
      const sourceUrl = 'https://maplestory.nexon.com/News/Event';
      const response = await fetchWithRetry(fetcher, sourceUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      return {
        events: parseLatestEventPage(await response.text(), 5),
        fetchedAt: new Date().toISOString(),
      };
    },
    async findSunday(signal) {
      const sourceUrl = 'https://maplestory.nexon.com/News/Event/Ongoing';
      const response = await fetchWithRetry(fetcher, sourceUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const event = parseLatestSundayEventPage(await response.text());
      if (!event) return null;
      const detailResponse = await fetchWithRetry(fetcher, event.url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
        signal,
      });
      if (!detailResponse.ok) return event;
      const imageUrl = parseSundayImage(await detailResponse.text());
      return imageUrl ? { ...event, imageUrl } : event;
    },
    async findRoyalStyles(signal) {
      const sourceUrl = 'https://maplestory.nexon.com/Guide/CashShop/Probability';
      const response = await fetchWithRetry(fetcher, sourceUrl, { signal });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseProbabilityPage(await response.text(), sourceUrl);
    },
    async findWonderBerry(signal) {
      const sourceUrl = 'https://maplestory.nexon.com/Guide/CashShop/Probability/WispsWonderBerry';
      const response = await fetchWithRetry(fetcher, sourceUrl, { signal });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseProbabilityPage(await response.text(), sourceUrl, 'last', true);
    },
    async findBoutiqueGift(signal) {
      const sourceUrl = 'https://maplestory.nexon.com/Guide/CashShop/Probability/BoutiqueGift';
      const response = await fetchWithRetry(fetcher, sourceUrl, { signal });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const html = await response.text();
      return {
        normalItems: parseProbabilityPage(html, sourceUrl, 'first').items,
        feverItems: parseProbabilityPage(html, sourceUrl, 'last').items,
        sourceUrl,
        fetchedAt: new Date().toISOString(),
      };
    },
    async findWhiteJadeBossRingBox(signal) {
      const sourceUrl =
        'https://maplestory.nexon.com/Guide/OtherProbability/bossRingBox/ringBoxWhiteJade';
      const response = await fetchWithRetry(fetcher, sourceUrl, { signal });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const html = await response.text();
      return {
        ...parseProbabilityPage(html, sourceUrl, 'first'),
        levelProbabilities: parseRingLevelProbabilities(html),
      };
    },
    async findLunaCrystalSweet(kind, signal) {
      const sourceUrl =
        kind === '스페셜'
          ? 'https://maplestory.nexon.com/Guide/CashShop/Probability/SpecialLunaCrystalSweet'
          : 'https://maplestory.nexon.com/Guide/CashShop/Probability/LunaCrystalSweet';
      const response = await fetchWithRetry(fetcher, sourceUrl, { signal });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return {
        kind,
        ...parseProbabilityPage(await response.text(), sourceUrl, 'first', true),
      };
    },
    async findLunaCrystalDream(kind, signal) {
      const sourceUrl =
        kind === '스페셜'
          ? 'https://maplestory.nexon.com/Guide/CashShop/Probability/SpecialLunaCrystalDream'
          : 'https://maplestory.nexon.com/Guide/CashShop/Probability/LunaCrystalDream';
      const response = await fetchWithRetry(fetcher, sourceUrl, { signal });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return {
        kind,
        ...parseProbabilityPage(await response.text(), sourceUrl, 'first', true),
      };
    },
    async findWeather(region, signal) {
      const searchRegion = weatherSearchAliases[region.trim()] ?? region;
      const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geocodeUrl.search = new URLSearchParams({
        name: searchRegion,
        count: '1',
        language: 'en',
        format: 'json',
      }).toString();
      const geocodeResponse = await fetchWithRetry(fetcher, geocodeUrl.toString(), { signal });
      if (!geocodeResponse.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const geocodeBody = (await geocodeResponse.json()) as {
        results?: Array<{
          name?: string;
          latitude?: number;
          longitude?: number;
          country?: string;
        }> | null;
      };
      let place = Array.isArray(geocodeBody.results) ? geocodeBody.results[0] : undefined;
      if (!place) {
        const fallbackUrl = new URL('https://nominatim.openstreetmap.org/search');
        fallbackUrl.search = new URLSearchParams({
          q: region,
          format: 'jsonv2',
          limit: '1',
          'accept-language': 'ko',
        }).toString();
        const fallbackResponse = await fetchWithRetry(fetcher, fallbackUrl.toString(), {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'KakaoMapleBot/1.0 (weather lookup)',
          },
          signal,
        });
        if (!fallbackResponse.ok) throw new Error('PROVIDER_UNAVAILABLE');
        const fallbackBody = (await fallbackResponse.json()) as Array<{
          name?: string;
          display_name?: string;
          lat?: string;
          lon?: string;
          address?: { country?: string };
        }>;
        const fallbackPlace = fallbackBody[0];
        if (fallbackPlace) {
          const latitude = Number(fallbackPlace.lat);
          const longitude = Number(fallbackPlace.lon);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
            throw new Error('PROVIDER_SCHEMA');
          place = {
            name: fallbackPlace.name ?? fallbackPlace.display_name ?? region,
            latitude,
            longitude,
            ...(fallbackPlace.address?.country ? { country: fallbackPlace.address.country } : {}),
          };
        }
      }
      if (!place) return null;
      if (
        typeof place.name !== 'string' ||
        typeof place.latitude !== 'number' ||
        !Number.isFinite(place.latitude) ||
        typeof place.longitude !== 'number' ||
        !Number.isFinite(place.longitude)
      )
        throw new Error('PROVIDER_SCHEMA');
      const query = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: 'temperature_2m,relative_humidity_2m,weather_code',
        timezone: 'auto',
      });
      const airQuery = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: 'pm2_5,pm10',
        timezone: 'auto',
      });
      const [weatherResponse, airResponse] = await Promise.all([
        fetchWithRetry(fetcher, `https://api.open-meteo.com/v1/forecast?${query}`, { signal }),
        fetchWithRetry(
          fetcher,
          `https://air-quality-api.open-meteo.com/v1/air-quality?${airQuery}`,
          {
            signal,
          },
        ),
      ]);
      if (!weatherResponse.ok || !airResponse.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const weatherBody = (await weatherResponse.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          weather_code?: number;
        };
      };
      const airBody = (await airResponse.json()) as {
        current?: { pm2_5?: number | null; pm10?: number | null };
      };
      const current = weatherBody.current;
      if (
        !current ||
        typeof current.temperature_2m !== 'number' ||
        !Number.isFinite(current.temperature_2m) ||
        typeof current.relative_humidity_2m !== 'number' ||
        !Number.isFinite(current.relative_humidity_2m) ||
        typeof current.weather_code !== 'number' ||
        !Number.isInteger(current.weather_code)
      )
        throw new Error('PROVIDER_SCHEMA');
      const pm25 = optionalNumber(airBody.current?.pm2_5);
      const pm10 = optionalNumber(airBody.current?.pm10);
      return {
        query: region,
        location: place.name,
        ...(place.country ? { country: place.country } : {}),
        temperatureC: current.temperature_2m,
        humidityPercent: current.relative_humidity_2m,
        weatherCode: current.weather_code,
        ...(pm25 !== undefined ? { pm25 } : {}),
        ...(pm10 !== undefined ? { pm10 } : {}),
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}

const yahooSearchAliases: Record<string, string> = {
  삼성전자: 'Samsung Electronics',
  SK하이닉스: 'SK hynix',
  네이버: 'NAVER',
  카카오: 'Kakao',
  애플: 'Apple',
  마이크로소프트: 'Microsoft',
  엔비디아: 'NVIDIA',
  테슬라: 'Tesla',
  아마존: 'Amazon',
  구글: 'Alphabet',
  알파벳: 'Alphabet',
  메타: 'Meta Platforms',
  넷플릭스: 'Netflix',
  코카콜라: 'Coca-Cola',
  맥도날드: "McDonald's",
  월마트: 'Walmart',
  버크셔해서웨이: 'Berkshire Hathaway',
  AMD: 'Advanced Micro Devices',
  인텔: 'Intel',
  넥슨: 'NEXON',
  닌텐도: 'Nintendo',
  소니: 'Sony',
  도요타: 'Toyota',
  혼다: 'Honda',
  소프트뱅크: 'SoftBank Group',
  유니클로: 'Fast Retailing',
  라쿠텐: 'Rakuten',
  키엔스: 'Keyence',
  미쓰비시: 'Mitsubishi',
};
const yahooKoreanAliases = new Set(['삼성전자', 'SK하이닉스', '네이버', '카카오']);

const yahooPublicHeaders = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
};

export function createInvenClient(fetcher: typeof fetch = fetch): InvenClient {
  const boardUrl = 'https://www.inven.co.kr/board/maple/5974?my=chu';
  const mabbakDorosiUrl =
    'https://www.inven.co.kr/board/maple/2304?name=nicname&keyword=%EB%A7%88%EB%B9%A1%EB%8F%84%EB%A1%9C%EC%8B%9C&eq=1&iskin=';
  return {
    async findTopPosts(signal) {
      const response = await fetchWithRetry(fetcher, boardUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseInvenTopPosts(await response.text(), boardUrl);
    },
    async findMabbakDorosiPosts(signal) {
      const response = await fetchWithRetry(fetcher, mabbakDorosiUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const result = parseInvenTopPosts(await response.text(), mabbakDorosiUrl, 3, true);
      if (result.posts.some((post) => !post.url)) throw new Error('PROVIDER_SCHEMA');
      return result;
    },
    async findHotDeals(signal) {
      const boardUrl = 'https://quasarzone.com/bbs/qb_saleinfo';
      return parseQuasarZoneHotDeals(
        await fetchQuasarZoneHotDealsHtml(fetcher, boardUrl, signal),
        boardUrl,
      );
    },
    async findArcaLiveHotDeals(signal) {
      const boardUrl = 'https://arca.live/b/hotdeal';
      const response = await fetchWithRetry(fetcher, boardUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseArcaLiveHotDeals(await response.text(), boardUrl);
    },
    async findFmKoreaHotDeals(signal) {
      const boardUrl = 'https://www.fmkorea.com/hotdeal';
      const response = await fetchWithRetry(fetcher, boardUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseFmKoreaHotDeals(await response.text(), boardUrl);
    },
    async findGraphicsCardPosts(signal) {
      const boardUrl = 'https://quasarzone.com/bbs/qb_tsy';
      const response = await fetchWithRetry(fetcher, boardUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseQuasarZonePosts(await response.text(), boardUrl, 5);
    },
    async findMonitorPosts(signal) {
      const boardUrl =
        'https://gall.dcinside.com/mgallery/board/lists/?id=mnt&sort_type=N&search_head=70&page=1';
      const html = await fetchDcinsideHtml(
        fetcher,
        boardUrl,
        'https://m.dcinside.com/board/mnt',
        signal,
      );
      return parseDcinsideMonitorPosts(html, boardUrl, 5);
    },
    async findJapanTravelPosts(signal) {
      const boardUrl =
        'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=10&page=1';
      const html = await fetchDcinsideHtml(
        fetcher,
        boardUrl,
        'https://m.dcinside.com/board/nokanto',
        signal,
      );
      return parseDcinsideBoardPosts(html, boardUrl, 'nokanto', 3);
    },
    async findJapanRestaurantPosts(signal) {
      const boardUrl =
        'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=100&page=1';
      const html = await fetchDcinsideHtml(
        fetcher,
        boardUrl,
        'https://m.dcinside.com/board/nokanto',
        signal,
      );
      return parseDcinsideBoardPosts(html, boardUrl, 'nokanto', 3);
    },
  };
}

export function createStockClient(
  _krxAuthKey: string | undefined,
  tiingoToken: string | undefined,
  fetcher: typeof fetch = fetch,
): StockClient {
  const request = async (url: string, headers: Record<string, string>, signal: AbortSignal) => {
    const response = await fetchWithRetry(fetcher, url, { headers, signal });
    if (!response.ok)
      throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
    return response;
  };

  const quoteJapan = async (input: string, signal: AbortSignal): Promise<StockQuote | null> => {
    const searchInput = yahooSearchAliases[input] ?? input;
    const searchResponse = await request(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchInput)}&quotesCount=20&newsCount=0`,
      yahooPublicHeaders,
      signal,
    );
    const searchBody = (await searchResponse.json()) as {
      quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchange?: string;
        quoteType?: string;
      }>;
    };
    if (!Array.isArray(searchBody.quotes)) throw new Error('PROVIDER_SCHEMA');
    const match = searchBody.quotes.find(
      (item) =>
        typeof item.symbol === 'string' &&
        /\.T$/i.test(item.symbol) &&
        ['EQUITY', 'ETF'].includes(item.quoteType ?? ''),
    );
    if (!match?.symbol) return null;
    const chartResponse = await request(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(match.symbol)}?range=5d&interval=1d&events=history`,
      yahooPublicHeaders,
      signal,
    );
    const chartBody = (await chartResponse.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            currency?: string;
          };
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
          timestamp?: number[];
        }> | null;
      };
    };
    const result = chartBody.chart?.result?.[0];
    const meta = result?.meta;
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const latestClose = [...closes].reverse().find((value) => typeof value === 'number');
    const price = meta?.regularMarketPrice ?? latestClose;
    if (typeof price !== 'number' || !Number.isFinite(price)) throw new Error('PROVIDER_SCHEMA');
    const previous = meta?.previousClose ?? meta?.chartPreviousClose;
    const change =
      typeof previous === 'number' && Number.isFinite(previous) ? price - previous : undefined;
    return {
      code: match.symbol,
      name: match.longname ?? match.shortname ?? match.symbol,
      price,
      currency: 'JPY',
      market: 'JP',
      ...(change !== undefined ? { change, changeRate: (change / previous!) * 100 } : {}),
      dataType: 'daily',
      fetchedAt: new Date().toISOString(),
    };
  };

  const quoteYahooMarket = async (
    input: string,
    market: 'KRX' | 'US',
    signal: AbortSignal,
  ): Promise<StockQuote | null> => {
    const searchInput = yahooSearchAliases[input] ?? input;
    const searchResponse = await request(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchInput)}&quotesCount=20&newsCount=0`,
      yahooPublicHeaders,
      signal,
    );
    const searchBody = (await searchResponse.json()) as {
      quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        quoteType?: string;
      }>;
    };
    if (!Array.isArray(searchBody.quotes)) throw new Error('PROVIDER_SCHEMA');
    const match = searchBody.quotes.find((item) => {
      if (typeof item.symbol !== 'string' || !['EQUITY', 'ETF'].includes(item.quoteType ?? ''))
        return false;
      return market === 'KRX'
        ? /\.(KS|KQ)$/i.test(item.symbol)
        : !/\.(KS|KQ|T)$/i.test(item.symbol);
    });
    if (!match?.symbol) return null;
    const chartResponse = await request(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(match.symbol)}?range=5d&interval=1d&events=history`,
      yahooPublicHeaders,
      signal,
    );
    const chartBody = (await chartResponse.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
          };
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }> | null;
      };
    };
    const result = chartBody.chart?.result?.[0];
    const meta = result?.meta;
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const latestClose = [...closes].reverse().find((value) => typeof value === 'number');
    const price = meta?.regularMarketPrice ?? latestClose;
    if (typeof price !== 'number' || !Number.isFinite(price)) throw new Error('PROVIDER_SCHEMA');
    const previous = meta?.previousClose ?? meta?.chartPreviousClose;
    const change =
      typeof previous === 'number' && Number.isFinite(previous) ? price - previous : undefined;
    return {
      code: match.symbol,
      name: match.longname ?? match.shortname ?? match.symbol,
      price,
      currency: market === 'KRX' ? 'KRW' : 'USD',
      market,
      ...(change !== undefined ? { change, changeRate: (change / previous!) * 100 } : {}),
      dataType: 'daily',
      fetchedAt: new Date().toISOString(),
    };
  };

  const quote = async (query: string, signal: AbortSignal): Promise<StockQuote> => {
    const input = query.trim();
    if (!input || input.length > 80) throw new Error('INVALID_USAGE');
    if (/^[\d]{6}$/.test(input) || yahooKoreanAliases.has(input)) {
      const korean = await quoteYahooMarket(input, 'KRX', signal);
      if (!korean) throw new Error('NOT_FOUND');
      return korean;
    }
    if (!tiingoToken) throw new Error('NOT_CONFIGURED');
    const tiingoHeaders = { Authorization: `Token ${tiingoToken}` };
    const searchResponse = await request(
      `https://api.tiingo.com/tiingo/utilities/search/${encodeURIComponent(input)}`,
      tiingoHeaders,
      signal,
    );
    const matches = (await searchResponse.json()) as Array<{
      ticker?: string;
      name?: string;
      assetType?: string;
      isActive?: boolean;
    }>;
    if (!Array.isArray(matches)) throw new Error('PROVIDER_SCHEMA');
    const match = matches.find(
      (item) =>
        typeof item.ticker === 'string' &&
        typeof item.name === 'string' &&
        item.isActive !== false &&
        ['Stock', 'ETF', 'Mutual Fund'].includes(item.assetType ?? ''),
    );
    if (!match?.ticker || !match.name) throw new Error('NOT_FOUND');
    const priceResponse = await request(
      `https://api.tiingo.com/tiingo/daily/${encodeURIComponent(match.ticker)}/prices`,
      tiingoHeaders,
      signal,
    );
    const prices = (await priceResponse.json()) as Array<{
      date?: string;
      close?: number;
      volume?: number;
    }>;
    const latest = prices.at(-1);
    if (!latest || typeof latest.close !== 'number' || !Number.isFinite(latest.close))
      throw new Error('PROVIDER_SCHEMA');
    return {
      code: match.ticker,
      name: match.name,
      price: latest.close,
      ...(typeof latest.volume === 'number' ? { volume: latest.volume } : {}),
      currency: 'USD',
      market: 'US',
      dataType: 'daily',
      fetchedAt: latest.date ?? new Date().toISOString(),
    };
  };

  return {
    quote,
    async quoteCandidates(query, signal) {
      const input = query.trim();
      if (!input || input.length > 80) throw new Error('INVALID_USAGE');
      const candidates: StockQuote[] = [];
      let firstProviderError: unknown;
      try {
        candidates.push(await quote(input, signal));
      } catch (error) {
        firstProviderError = error;
      }
      try {
        const japan = await quoteJapan(input, signal);
        if (japan) candidates.push(japan);
      } catch (error) {
        if (!firstProviderError) firstProviderError = error;
      }
      try {
        const us = await quoteYahooMarket(input, 'US', signal);
        if (us) candidates.push(us);
      } catch (error) {
        if (!firstProviderError) firstProviderError = error;
      }
      if (candidates.length === 0) throw firstProviderError ?? new Error('NOT_FOUND');
      return candidates;
    },
  };
}

export function createTmdbNetflixClient(
  readAccessToken: string | undefined,
  region = 'KR',
  fetcher: typeof fetch = fetch,
): NetflixClient {
  return {
    async findTitles(signal) {
      if (!readAccessToken) throw new Error('NOT_CONFIGURED');
      const params = new URLSearchParams({
        language: 'ko-KR',
        watch_region: region,
        with_watch_providers: '8',
        with_watch_monetization_types: 'flatrate',
        sort_by: 'popularity.desc',
        page: '1',
      });
      const results: NetflixTitle[] = [];
      for (const mediaType of ['movie', 'tv'] as const) {
        const response = await fetchWithRetry(
          fetcher,
          `https://api.themoviedb.org/3/discover/${mediaType}?${params.toString()}`,
          {
            headers: { Accept: 'application/json', Authorization: `Bearer ${readAccessToken}` },
            signal,
          },
        );
        if (!response.ok)
          throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
        const body = (await response.json()) as {
          results?: Array<{
            title?: unknown;
            name?: unknown;
            origin_country?: unknown;
            original_language?: unknown;
          }>;
        };
        if (!Array.isArray(body.results)) throw new Error('PROVIDER_SCHEMA');
        for (const item of body.results) {
          const title = mediaType === 'movie' ? item.title : item.name;
          if (typeof title !== 'string' || title.trim() === '') throw new Error('PROVIDER_SCHEMA');
          const originCountry = Array.isArray(item.origin_country)
            ? item.origin_country.find((value): value is string => typeof value === 'string')
            : undefined;
          const languageCountry: Record<string, string> = {
            ko: 'KR',
            ja: 'JP',
            zh: 'CN',
            fr: 'FR',
            de: 'DE',
            es: 'ES',
            it: 'IT',
            hi: 'IN',
          };
          const country =
            originCountry ??
            (typeof item.original_language === 'string'
              ? languageCountry[item.original_language]
              : undefined);
          results.push({ title, mediaType, ...(country ? { country } : {}) });
        }
      }
      if (results.length === 0) throw new Error('NOT_FOUND');
      return results;
    },
  };
}

export function createRidiMangaClient(fetcher: typeof fetch = fetch): MangaClient {
  return {
    async findJapaneseManga(signal) {
      const sourceUrl = 'https://ridibooks.com/comics/ebook';
      const response = await fetchWithRetry(fetcher, sourceUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const html = await response.text();
      const items: MangaItem[] = [];
      const pattern = /<a\b[^>]*href=["'](\/books\/\d+)(?:[?#][^"']*)?["'][^>]*>([\s\S]*?)<\/a>/gi;
      for (const match of html.matchAll(pattern)) {
        const title = decodeHtml(match[2] ?? '').trim();
        const href = match[1] ?? '';
        if (!title || items.some((item) => item.title === title)) continue;
        items.push({ title, url: `https://ridibooks.com${href}` });
      }
      if (items.length === 0) throw new Error('PROVIDER_SCHEMA');
      return { items, sourceUrl, fetchedAt: new Date().toISOString() };
    },
  };
}

const webNovelSources: readonly {
  source: WebNovelSource;
  url: string;
  pathPattern: RegExp;
}[] = [
  { source: '카페', url: 'https://page.kakao.com/menu/10011/', pathPattern: /^\/content\// },
  { source: '문피아', url: 'https://www.munpia.com/', pathPattern: /^\/novel\// },
  { source: '노벨피아', url: 'https://novelpia.com/', pathPattern: /^\/novel\// },
];

function parseWebNovelLinks(
  html: string,
  source: (typeof webNovelSources)[number],
): WebNovelItem[] {
  const items: WebNovelItem[] = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const href = match[1] ?? '';
    let url: URL;
    try {
      url = new URL(href, source.url);
    } catch {
      continue;
    }
    if (url.host !== new URL(source.url).host || !source.pathPattern.test(url.pathname)) continue;
    const title = decodeHtml(match[2] ?? '');
    if (
      !title ||
      title.length > 120 ||
      /^(홈|웹툰|웹소설|추천|랭킹|검색|로그인|회원가입|더보기|이용약관|공지사항)$/i.test(title) ||
      items.some((item) => item.title === title)
    )
      continue;
    items.push({ title, source: source.source, url: url.toString() });
  }
  return items;
}

export function createWebNovelClient(fetcher: typeof fetch = fetch): WebNovelClient {
  return {
    async findWebNovels(signal) {
      const results = await Promise.allSettled(
        webNovelSources.map(async (source) => {
          const response = await fetchWithRetry(fetcher, source.url, {
            headers: {
              Accept: 'text/html,application/xhtml+xml',
              'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
            },
            signal,
          });
          if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
          return parseWebNovelLinks(await response.text(), source);
        }),
      );
      const items = results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
      );
      if (items.length === 0) throw new Error('PROVIDER_SCHEMA');
      return { items, fetchedAt: new Date().toISOString() };
    },
  };
}

export function createNaverWebtoonClient(fetcher: typeof fetch = fetch): WebtoonClient {
  const weekdays = [
    ['mon', '월'],
    ['tue', '화'],
    ['wed', '수'],
    ['thu', '목'],
    ['fri', '금'],
    ['sat', '토'],
    ['sun', '일'],
  ] as const;
  return {
    async findCurrentWebtoons(signal) {
      const lists = await Promise.all(
        weekdays.map(async ([english, korean]) => {
          const url = `https://comic.naver.com/api/webtoon/titlelist/weekday?week=${english}`;
          const response = await fetchWithRetry(fetcher, url, {
            headers: { Accept: 'application/json' },
            signal,
          });
          if (!response.ok)
            throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
          const body = (await response.json()) as {
            titleList?: Array<{
              titleId?: number;
              titleName?: string;
              author?: string;
              finish?: boolean;
              rest?: boolean;
            }>;
          };
          if (!Array.isArray(body.titleList)) throw new Error('PROVIDER_SCHEMA');
          return body.titleList
            .filter(
              (item) =>
                item.finish !== true &&
                item.rest !== true &&
                typeof item.titleId === 'number' &&
                typeof item.titleName === 'string' &&
                typeof item.author === 'string',
            )
            .map((item) => ({
              titleId: item.titleId!,
              title: item.titleName!,
              author: item.author!,
              weekday: korean,
              url: `https://comic.naver.com/webtoon/list?titleId=${item.titleId}`,
            }));
        }),
      );
      const items = lists.flat();
      if (items.length === 0) throw new Error('NOT_FOUND');
      return { items, fetchedAt: new Date().toISOString() };
    },
  };
}

export function createNaverBlogClient(fetcher: typeof fetch = fetch): NaverBlogClient {
  const rssUrl = 'https://rss.blog.naver.com/don_jjin.xml';
  return {
    async findLatestWeeklyNewProduct(signal) {
      const response = await fetchWithRetry(fetcher, rssUrl, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseLatestWeeklyNewProduct(await response.text());
    },
  };
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' ? (value as JsonRecord) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function firstArray(data: JsonRecord, keys: string[]): JsonRecord[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value))
      return value.map(asRecord).filter((item): item is JsonRecord => item !== null);
  }
  return [];
}

function productFromRecord(item: JsonRecord): RetailProduct | null {
  const name = asString(item.name) ?? asString(item.productName) ?? asString(item.title);
  if (!name) return null;
  const id = asString(item.id) ?? asString(item.productId) ?? asString(item.itemCode);
  const price = asNumber(item.price) ?? asNumber(item.salePrice);
  return {
    name,
    ...(id ? { id } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(asString(item.currency) ? { currency: asString(item.currency) } : {}),
    ...(typeof item.soldOut === 'boolean' ? { soldOut: item.soldOut } : {}),
    ...(typeof item.pickupAvailable === 'boolean' ? { pickupAvailable: item.pickupAvailable } : {}),
    ...(asString(item.brand) ? { brand: asString(item.brand) } : {}),
  };
}

export function createMcpRetailClient(
  fetcher: typeof fetch = fetch,
  baseUrl = 'https://mcp.aka.page',
): McpRetailClient {
  async function call(
    action: string,
    params: Record<string, string>,
    signal: AbortSignal,
  ): Promise<JsonRecord> {
    const search = new URLSearchParams({ action, ...params });
    const response = await fetchWithRetry(
      fetcher,
      `${baseUrl}/api/actions/query?${search.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      },
    );
    if (!response.ok)
      throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
    const body = asRecord(await response.json());
    if (!body || body.success !== true) throw new Error('PROVIDER_SCHEMA');
    const data = asRecord(body.data);
    if (!data) throw new Error('PROVIDER_SCHEMA');
    return data;
  }

  return {
    async searchDaisoProducts(query, signal) {
      const data = await call('daisoSearchProducts', { q: query, pageSize: '5' }, signal);
      const products = firstArray(data, ['products', 'items'])
        .map(productFromRecord)
        .filter((item): item is RetailProduct => item !== null);
      if (products.length === 0) throw new Error('NOT_FOUND');
      return products;
    },
    async findNationalFuelPrices(signal) {
      const response = await fetchWithRetry(fetcher, `${baseUrl}/api/opinet/average`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = asRecord(await response.json());
      const data = body ? asRecord(body.data) : null;
      const prices = data ? firstArray(data, ['prices', 'items']) : [];
      const result = prices.flatMap((item) => {
        const productName = asString(item.productName) ?? asString(item.name);
        const price = asNumber(item.price);
        if (!productName || price === undefined) return [];
        const diff = asNumber(item.diff);
        return [
          {
            productName,
            price,
            ...(diff !== undefined ? { diff } : {}),
            ...(asString(item.tradeDate) ? { tradeDate: asString(item.tradeDate) } : {}),
          },
        ];
      });
      if (body?.success !== true || result.length === 0) throw new Error('PROVIDER_SCHEMA');
      return result;
    },
    async findLowestFuelStations(areaCode, signal) {
      const search = new URLSearchParams({ fuelCode: 'B027', count: '3' });
      if (areaCode) search.set('areaCode', areaCode);
      const response = await fetchWithRetry(
        fetcher,
        `${baseUrl}/api/opinet/lowest?${search.toString()}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
          },
          signal,
        },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = asRecord(await response.json());
      const data = body ? asRecord(body.data) : null;
      const stations = data ? firstArray(data, ['stations', 'items']) : [];
      const result = stations.flatMap((item) => {
        const name = asString(item.name) ?? asString(item.stationName);
        const price = asNumber(item.price);
        if (!name || price === undefined) return [];
        const brandName = asString(item.brandName) ?? asString(item.brand);
        const address = asString(item.address);
        const roadAddress = asString(item.roadAddress);
        return [
          {
            name,
            price,
            ...(brandName ? { brandName } : {}),
            ...(address ? { address } : {}),
            ...(roadAddress ? { roadAddress } : {}),
          },
        ];
      });
      if (body?.success !== true || result.length === 0) throw new Error('PROVIDER_SCHEMA');
      return result.sort((left, right) => left.price - right.price).slice(0, 3);
    },
  };
}

export function createExchangeRateClient(
  fetcher: typeof fetch = fetch,
  baseUrl = 'https://open.er-api.com/v6/latest/USD',
): ExchangeRateClient {
  return {
    async findUsdAndJpyRates(signal) {
      const response = await fetchWithRetry(fetcher, baseUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
        },
        signal,
      });
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = asRecord(await response.json());
      const rates = body ? asRecord(body.rates) : null;
      const usdKrw = rates ? asNumber(rates.KRW) : undefined;
      const usdJpy = rates ? asNumber(rates.JPY) : undefined;
      if (body?.result !== 'success' || usdKrw === undefined || usdJpy === undefined || usdJpy <= 0)
        throw new Error('PROVIDER_SCHEMA');
      return {
        usdKrw,
        jpyKrw: usdKrw / usdJpy,
        ...(asString(body.time_last_update_utc)
          ? { updatedAt: asString(body.time_last_update_utc) }
          : {}),
      };
    },
  };
}

export type PcQuoteClient = {
  findQuotes(request: PcQuoteRequest, signal: AbortSignal): Promise<PcQuote[]>;
};

export function createPcQuoteClient(
  endpoint: string | undefined,
  sharedSecret: string | undefined,
  fetcher: typeof fetch = fetch,
): PcQuoteClient {
  return {
    async findQuotes(request, signal) {
      if (!endpoint || !sharedSecret) throw new Error('NOT_CONFIGURED');
      const response = await fetcher(`${endpoint.replace(/\/$/, '')}/v1/quote`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sharedSecret}`,
        },
        body: JSON.stringify(request),
        signal,
      });
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = await response.json();
      if (!Array.isArray(body)) throw new Error('PROVIDER_SCHEMA');
      return body.map((value) => {
        const item = asRecord(value);
        const items = item ? item.items : undefined;
        const totalKrw = item?.totalKrw;
        if (
          !item ||
          typeof item.label !== 'string' ||
          typeof totalKrw !== 'number' ||
          !Number.isSafeInteger(totalKrw) ||
          !Array.isArray(items)
        )
          throw new Error('PROVIDER_SCHEMA');
        return {
          label: item.label,
          totalKrw,
          compatibility:
            item.compatibility === '확인 필요' ? ('확인 필요' as const) : ('정상' as const),
          source: typeof item.source === 'string' ? item.source : 'PC 가격 공급자',
          fetchedAt: typeof item.fetchedAt === 'string' ? item.fetchedAt : '조회 시각 미상',
          items: items.map((rawItem) => {
            const component = asRecord(rawItem);
            const priceKrw = component?.priceKrw;
            if (
              !component ||
              typeof component.category !== 'string' ||
              typeof component.name !== 'string' ||
              typeof priceKrw !== 'number' ||
              !Number.isSafeInteger(priceKrw)
            )
              throw new Error('PROVIDER_SCHEMA');
            return {
              category: component.category,
              name: component.name,
              priceKrw,
              ...(typeof component.url === 'string' ? { url: component.url } : {}),
            };
          }),
        };
      });
    },
  };
}
