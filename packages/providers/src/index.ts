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
  findEquipment?(name: string, signal: AbortSignal): Promise<EquipmentCharacter | null>;
  findNotice?(signal: AbortSignal): Promise<NoticeList>;
  findEvents?(signal: AbortSignal): Promise<EventList>;
  findRoyalStyles?(signal: AbortSignal): Promise<RoyalStyleList>;
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
export type EventItem = {
  title: string;
  url: string;
  startDate?: string;
  endDate?: string;
};
export type EventList = { events: EventItem[]; fetchedAt: string };
export type RoyalStyleItem = { name: string; probability: number };
export type RoyalStyleList = { items: RoyalStyleItem[]; sourceUrl: string; fetchedAt: string };
export type StockQuote = {
  code: string;
  name?: string;
  price: number;
  change: number;
  changeRate: number;
  volume?: number;
  fetchedAt: string;
  marketClosed?: boolean;
};
export type StockClient = { quote(code: string, signal: AbortSignal): Promise<StockQuote> };
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

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

function parseRoyalStylePage(html: string, sourceUrl: string): RoyalStyleList {
  const table = html.match(/<table\b[\s\S]*?획득확률[\s\S]*?<\/table>/i)?.[0];
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
    async findRoyalStyles(signal) {
      const sourceUrl = 'https://maplestory.nexon.com/Guide/CashShop/Probability';
      const response = await fetchWithRetry(fetcher, sourceUrl, { signal });
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      return parseRoyalStylePage(await response.text(), sourceUrl);
    },
  };
}

export function createStockClient(
  appKey: string | undefined,
  appSecret: string | undefined,
  baseUrl = 'https://openapi.koreainvestment.com:9443',
  fetcher: typeof fetch = fetch,
): StockClient {
  return {
    async quote(code, signal) {
      if (!appKey || !appSecret) throw new Error('NOT_CONFIGURED');
      const tokenKey = `${baseUrl}:${appKey}`;
      const cachedToken = tokenCache.get(tokenKey);
      let accessToken =
        cachedToken && cachedToken.expiresAt > Date.now() + 300_000 ? cachedToken.token : undefined;
      if (!accessToken) {
        const token = await fetchWithRetry(fetcher, `${baseUrl}/oauth2/tokenP`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            appkey: appKey,
            appsecret: appSecret,
          }),
          signal,
        });
        if (!token.ok) throw new Error('PROVIDER_UNAVAILABLE');
        const tokenData = (await token.json()) as { access_token?: string; expires_in?: number };
        if (!tokenData.access_token) throw new Error('PROVIDER_SCHEMA');
        const lifetime =
          Number.isFinite(tokenData.expires_in) && tokenData.expires_in !== undefined
            ? tokenData.expires_in
            : 900;
        accessToken = tokenData.access_token;
        tokenCache.set(tokenKey, { token: accessToken, expiresAt: Date.now() + lifetime * 1000 });
      }
      const response = await fetchWithRetry(
        fetcher,
        `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${code}`,
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
            appkey: appKey,
            appsecret: appSecret,
            tr_id: 'FHKST01010100',
          },
          signal,
        },
      );
      if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
      const body = (await response.json()) as { output?: Record<string, string> };
      const output = body.output;
      if (!output?.stck_prpr) throw new Error('PROVIDER_SCHEMA');
      const price = finiteNumber(output.stck_prpr);
      const change = finiteNumber(output.prdy_vrss);
      const changeRate = finiteNumber(output.prdy_ctrt);
      const volume = finiteNumber(output.acml_vol);
      return {
        code,
        name: output.hts_kor_isnm,
        price,
        change,
        changeRate,
        volume,
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}
