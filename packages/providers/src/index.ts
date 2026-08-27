export type Character = {
  name: string;
  world?: string;
  level?: number;
  job?: string;
  guild?: string;
  combatPower?: number;
  fetchedAt: string;
};
export type NexonClient = {
  findCharacter(name: string, signal: AbortSignal): Promise<Character | null>;
  findHexa?(name: string, signal: AbortSignal): Promise<HexaCharacter | null>;
};
export type HexaCore = {
  name: string;
  level: number;
  type: string;
  linkedSkills: string[];
};
export type HexaCharacter = { name: string; cores: HexaCore[]; fetchedAt: string };
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
      return {
        name: characterName ?? name,
        world,
        level,
        job,
        guild,
        fetchedAt: new Date().toISOString(),
      };
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
