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
  findHexa?(name: string, signal: AbortSignal): Promise<HexaCharacter | null>;
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
  findMasterpiece?(signal: AbortSignal): Promise<MasterpieceList>;
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
export type HexaCore = {
  name: string;
  level: number;
  type: string;
  linkedSkills: string[];
};
export type HexaCharacter = { name: string; cores: HexaCore[]; fetchedAt: string };
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
  potentialGrade?: string;
  additionalPotentialGrade?: string;
};
export type EquipmentCharacter = { name: string; items: EquipmentItem[]; fetchedAt: string };
export type NoticeItem = { title: string; url: string; date?: string };
export type NoticeList = { notices: NoticeItem[]; fetchedAt: string };
export type InvenTopPost = { title: string };
export type InvenTopPostList = {
  posts: InvenTopPost[];
  boardUrl: string;
  fetchedAt: string;
};
export type InvenClient = {
  findTopPosts(signal: AbortSignal): Promise<InvenTopPostList>;
};
export type EventItem = {
  title: string;
  url: string;
  startDate?: string;
  endDate?: string;
};
export type EventList = { events: EventItem[]; fetchedAt: string };
export type RoyalStyleItem = { name: string; probability: number };
export type RoyalStyleList = { items: RoyalStyleItem[]; sourceUrl: string; fetchedAt: string };
export type WonderBerryList = { items: RoyalStyleItem[]; sourceUrl: string; fetchedAt: string };
export type BoutiqueGiftList = {
  normalItems: RoyalStyleItem[];
  feverItems: RoyalStyleItem[];
  sourceUrl: string;
  fetchedAt: string;
};
export type MasterpieceList = {
  redItems: RoyalStyleItem[];
  blackItems: RoyalStyleItem[];
  redSourceUrl: string;
  blackSourceUrl: string;
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
export type StockClient = {
  quote(query: string, signal: AbortSignal): Promise<StockQuote>;
  quoteCandidates?(query: string, signal: AbortSignal): Promise<StockQuote[]>;
};

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

function parseInvenTopPosts(html: string, boardUrl: string): InvenTopPostList {
  const posts: InvenTopPost[] = [];
  const subjectPattern = /<a\b[^>]*class=["'][^"']*subject-link[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(subjectPattern)) {
    const title = decodeHtml(match[1] ?? '')
      .replace(/^\[[^\]]+\]\s*/, '')
      .trim();
    if (!title || posts.some((post) => post.title === title)) continue;
    posts.push({ title });
    if (posts.length === 5) break;
  }
  if (posts.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { posts, boardUrl, fetchedAt: new Date().toISOString() };
}

function parseProbabilityPage(
  html: string,
  sourceUrl: string,
  tablePosition: 'first' | 'last' = 'first',
): RoyalStyleList {
  const tables = html.match(/<table\b[\s\S]*?획득확률[\s\S]*?<\/table>/gi) ?? [];
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
    const probability = Number(probabilityMatch[1]);
    if (!name || !Number.isFinite(probability) || probability <= 0 || probability > 100)
      throw new Error('PROVIDER_SCHEMA');
    items.push({ name, probability });
  }
  if (items.length === 0) throw new Error('PROVIDER_SCHEMA');
  return { items, sourceUrl, fetchedAt: new Date().toISOString() };
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
        if (!response.ok)
          throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
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
    async findHexa(name, signal) {
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const ocid = await findOcid(name, signal);
      if (!ocid) return null;
      const base = 'https://open.api.nexon.com/maplestory/v1';
      const response = await fetchWithRetry(
        fetcher,
        `${base}/character/hexamatrix?ocid=${encodeURIComponent(ocid)}`,
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        date?: string | null;
        character_hexa_core_equipment?: Array<{
          hexa_core_name?: string;
          hexa_core_level?: number;
          hexa_core_type?: string;
          linked_skill?: Array<{ hexa_skill_id?: string }>;
        }> | null;
      };
      if (
        body.character_hexa_core_equipment !== null &&
        !Array.isArray(body.character_hexa_core_equipment)
      )
        throw new Error('PROVIDER_SCHEMA');
      const cores = (body.character_hexa_core_equipment ?? []).map((core) => {
        if (
          typeof core.hexa_core_name !== 'string' ||
          typeof core.hexa_core_level !== 'number' ||
          !Number.isInteger(core.hexa_core_level) ||
          typeof core.hexa_core_type !== 'string' ||
          !Array.isArray(core.linked_skill)
        )
          throw new Error('PROVIDER_SCHEMA');
        const linkedSkills = core.linked_skill.map((skill) => skill.hexa_skill_id);
        if (linkedSkills.some((skill) => typeof skill !== 'string'))
          throw new Error('PROVIDER_SCHEMA');
        return {
          name: core.hexa_core_name,
          level: core.hexa_core_level,
          type: core.hexa_core_type,
          linkedSkills: linkedSkills as string[],
        };
      });
      return { name, cores, fetchedAt: body.date ?? new Date().toISOString() };
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
          potential_option_grade?: string | null;
          additional_potential_option_grade?: string | null;
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
        const potentialGrade = optionalString(item.potential_option_grade);
        const additionalPotentialGrade = optionalString(item.additional_potential_option_grade);
        return {
          part: item.item_equipment_part,
          name: item.item_name,
          starforce: Number(item.starforce),
          ...(potentialGrade ? { potentialGrade } : {}),
          ...(additionalPotentialGrade ? { additionalPotentialGrade } : {}),
        };
      });
      return { name, items, fetchedAt: body.date ?? new Date().toISOString() };
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
      if (!apiKey) throw new Error('NOT_CONFIGURED');
      const response = await fetchWithRetry(
        fetcher,
        'https://open.api.nexon.com/maplestory/v1/notice-event',
        { headers: { 'x-nxopen-api-key': apiKey }, signal },
      );
      if (!response.ok)
        throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as {
        event_notice?: Array<{
          title?: string;
          url?: string;
          date_event_start?: string;
          date_event_end?: string;
        }> | null;
      };
      if (!Array.isArray(body.event_notice)) throw new Error('PROVIDER_SCHEMA');
      const events = body.event_notice.map((event) => {
        if (typeof event.title !== 'string' || typeof event.url !== 'string')
          throw new Error('PROVIDER_SCHEMA');
        if (!/^https:\/\/(www\.)?maplestory\.nexon\.com\//.test(event.url))
          throw new Error('PROVIDER_SCHEMA');
        const startDate = optionalString(event.date_event_start);
        const endDate = optionalString(event.date_event_end);
        return {
          title: event.title,
          url: event.url,
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        };
      });
      return { events, fetchedAt: new Date().toISOString() };
    },
    async findSunday(signal) {
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
      for (const notice of body.notice) {
        if (typeof notice.title !== 'string' || typeof notice.url !== 'string')
          throw new Error('PROVIDER_SCHEMA');
        if (!/^https:\/\/(www\.)?maplestory\.nexon\.com\//.test(notice.url))
          throw new Error('PROVIDER_SCHEMA');
        if (notice.title.includes('썬데이') || notice.title.includes('선데이')) {
          const date = optionalString(notice.date);
          return {
            title: notice.title,
            url: notice.url,
            ...(date ? { startDate: date } : {}),
          };
        }
      }
      return null;
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
      return parseProbabilityPage(await response.text(), sourceUrl, 'last');
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
    async findMasterpiece(signal) {
      const redSourceUrl = 'https://maplestory.nexon.com/Guide/CashShop/Probability/MasterpieceRed';
      const blackSourceUrl =
        'https://maplestory.nexon.com/Guide/CashShop/Probability/MasterpieceBlack';
      const [redResponse, blackResponse] = await Promise.all([
        fetchWithRetry(fetcher, redSourceUrl, { signal }),
        fetchWithRetry(fetcher, blackSourceUrl, { signal }),
      ]);
      if (!redResponse.ok || !blackResponse.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const [redHtml, blackHtml] = await Promise.all([redResponse.text(), blackResponse.text()]);
      return {
        redItems: parseProbabilityPage(redHtml, redSourceUrl).items,
        blackItems: parseProbabilityPage(blackHtml, blackSourceUrl).items,
        redSourceUrl,
        blackSourceUrl,
        fetchedAt: new Date().toISOString(),
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
        ...parseProbabilityPage(await response.text(), sourceUrl),
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
        ...parseProbabilityPage(await response.text(), sourceUrl),
      };
    },
    async findWeather(region, signal) {
      const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geocodeUrl.search = new URLSearchParams({
        name: region,
        count: '1',
        language: 'ko',
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
      if (!Array.isArray(geocodeBody.results)) throw new Error('PROVIDER_SCHEMA');
      const place = geocodeBody.results[0];
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

function marketNumber(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('PROVIDER_SCHEMA');
  const normalized = String(value).replace(/,/g, '').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error('PROVIDER_SCHEMA');
  return parsed;
}

function tokyoTradingDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' })
    .format(new Date())
    .replaceAll('-', '');
}

const yahooSearchAliases: Record<string, string> = {
  넥슨: 'NEXON',
  닌텐도: 'Nintendo',
  소니: 'Sony',
  도요타: 'Toyota',
};

const yahooPublicHeaders = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; KakaoMapleBot/1.0)',
};

export function createInvenClient(fetcher: typeof fetch = fetch): InvenClient {
  const boardUrl = 'https://www.inven.co.kr/board/maple/5974?my=chu';
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
  };
}

export function createStockClient(
  krxAuthKey: string | undefined,
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

  const quote = async (query: string, signal: AbortSignal): Promise<StockQuote> => {
    const input = query.trim();
    if (!input || input.length > 80) throw new Error('INVALID_USAGE');
    if (/^[\d]{6}$|[가-힣]/.test(input)) {
      if (!krxAuthKey) throw new Error('NOT_CONFIGURED');
      const headers = { AUTH_KEY: krxAuthKey };
      const masterResponse = await request(
        'https://openapi.krx.co.kr/svc/apis/sto/stk_isu_base_info',
        headers,
        signal,
      );
      const masterBody = (await masterResponse.json()) as {
        OutBlock_1?: Array<Record<string, unknown>>;
      };
      if (!Array.isArray(masterBody.OutBlock_1)) throw new Error('PROVIDER_SCHEMA');
      const master = masterBody.OutBlock_1.find((item) => {
        const code = String(item.ISU_SRT_CD ?? '').replace(/\s/g, '');
        const name = String(item.ISU_ABBRV ?? '').trim();
        return code === input || name === input;
      });
      if (!master) throw new Error('NOT_FOUND');
      const code = String(master.ISU_SRT_CD ?? '').replace(/\s/g, '');
      const name = String(master.ISU_ABBRV ?? '').trim();
      if (!/^\d{6}$/.test(code) || !name) throw new Error('PROVIDER_SCHEMA');
      const dailyResponse = await request(
        `https://openapi.krx.co.kr/svc/apis/sto/stk_bydd_trd?basDd=${tokyoTradingDate()}`,
        headers,
        signal,
      );
      const dailyBody = (await dailyResponse.json()) as {
        OutBlock_1?: Array<Record<string, unknown>>;
      };
      if (!Array.isArray(dailyBody.OutBlock_1)) throw new Error('PROVIDER_SCHEMA');
      const daily = dailyBody.OutBlock_1.find(
        (item) => String(item.ISU_SRT_CD ?? '').replace(/\s/g, '') === code,
      );
      if (!daily) throw new Error('NOT_FOUND');
      return {
        code,
        name,
        price: marketNumber(daily.TDD_CLSPRC),
        change: marketNumber(daily.CMPPREVDD_PRC),
        changeRate: marketNumber(daily.FLUC_RT),
        volume: marketNumber(daily.ACC_TRDVOL),
        currency: 'KRW',
        market: 'KRX',
        dataType: 'daily',
        fetchedAt: new Date().toISOString(),
      };
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
      if (candidates.length === 0) throw firstProviderError ?? new Error('NOT_FOUND');
      return candidates;
    },
  };
}
