import { describe, expect, it, vi } from 'vitest';
import { createNexonClient, createStockClient } from '@kakao-maple-bot/providers';

describe('provider contracts (FR-003, FR-009, T-006..008, T-014..015)', () => {
  it('maps minimal Nexon fixtures and never requires a third-party site', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            character_name: '테스트',
            world_name: '스카니아',
            character_level: 280,
            character_class: '비숍',
          }),
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findCharacter(
      '테스트',
      new AbortController().signal,
    );
    expect(result?.level).toBe(280);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([url]) => String(url).includes('open.api.nexon.com'))).toBe(
      true,
    );
  });
  it('maps KIS quote fixture without order or account endpoints', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'fixture-token' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: {
              hts_kor_isnm: '테스트',
              stck_prpr: '70000',
              prdy_vrss: '100',
              prdy_ctrt: '0.14',
              acml_vol: '123',
            },
          }),
          { status: 200 },
        ),
      );
    const result = await createStockClient('app', 'secret', 'https://kis.test', fetcher).quote(
      '005930',
      new AbortController().signal,
    );
    expect(result).toMatchObject({ code: '005930', price: 70000, change: 100, changeRate: 0.14 });
    expect(fetcher.mock.calls[1]?.[0]).toContain(
      '/uapi/domestic-stock/v1/quotations/inquire-price',
    );
    expect(fetcher.mock.calls[1]?.[0]).not.toMatch(/order|account/i);
  });
  it('retries one Nexon 5xx but does not retry a 429', async () => {
    const retryFetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ character_name: '재시도' }), { status: 200 }),
      );
    await expect(
      createNexonClient('fixture-key', retryFetcher).findCharacter(
        '재시도',
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ name: '재시도' });
    expect(retryFetcher).toHaveBeenCalledTimes(3);
    const rateLimited = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    await expect(
      createNexonClient('fixture-key', rateLimited).findCharacter(
        '제한',
        new AbortController().signal,
      ),
    ).rejects.toThrow('RATE_LIMITED');
    expect(rateLimited).toHaveBeenCalledTimes(1);
  });
  it('does not call providers when credentials are absent', async () => {
    const fetcher = vi.fn();
    await expect(
      createNexonClient(undefined, fetcher).findCharacter('테스트', new AbortController().signal),
    ).rejects.toThrow('NOT_CONFIGURED');
    await expect(
      createStockClient(undefined, undefined, undefined, fetcher).quote(
        '005930',
        new AbortController().signal,
      ),
    ).rejects.toThrow('NOT_CONFIGURED');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects malformed numeric quote fields', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'fixture-token' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: { stck_prpr: 'not-a-number', prdy_vrss: '0', prdy_ctrt: '0', acml_vol: '0' },
          }),
          { status: 200 },
        ),
      );
    await expect(
      createStockClient('app', 'secret', 'https://kis.test', fetcher).quote(
        '005930',
        new AbortController().signal,
      ),
    ).rejects.toThrow('PROVIDER_SCHEMA');
  });
  it('reuses a valid KIS token for subsequent quotes', async () => {
    const fetcher = vi.fn((input: RequestInfo | URL) =>
      Promise.resolve(
        String(input).endsWith('/oauth2/tokenP')
          ? new Response(JSON.stringify({ access_token: 'cached-token', expires_in: 3600 }), {
              status: 200,
            })
          : new Response(
              JSON.stringify({
                output: {
                  hts_kor_isnm: '테스트',
                  stck_prpr: '70000',
                  prdy_vrss: '100',
                  prdy_ctrt: '0.14',
                  acml_vol: '123',
                },
              }),
              { status: 200 },
            ),
      ),
    );
    const client = createStockClient('cache-app', 'secret', 'https://kis-cache.test', fetcher);
    await client.quote('005930', new AbortController().signal);
    await client.quote('000660', new AbortController().signal);
    expect(
      fetcher.mock.calls.filter(([url]) => String(url).endsWith('/oauth2/tokenP')),
    ).toHaveLength(1);
  });
  it('rejects malformed Nexon identifiers and names', async () => {
    const badOcid = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ocid: 123 }), { status: 200 }));
    await expect(
      createNexonClient('fixture-key', badOcid).findCharacter('오류', new AbortController().signal),
    ).rejects.toThrow('PROVIDER_SCHEMA');
    const badName = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ character_name: { value: '오류' } }), { status: 200 }),
      );
    await expect(
      createNexonClient('fixture-key', badName).findCharacter('오류', new AbortController().signal),
    ).rejects.toThrow('PROVIDER_SCHEMA');
  });
  it('rejects type changes in optional Nexon fields', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ character_name: '오류', character_level: '280' }), {
          status: 200,
        }),
      );
    await expect(
      createNexonClient('fixture-key', fetcher).findCharacter('오류', new AbortController().signal),
    ).rejects.toThrow('PROVIDER_SCHEMA');
  });
});
