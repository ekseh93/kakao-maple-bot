import { describe, expect, it, vi } from 'vitest';
import { createNexonClient, createStockClient } from '@kakao-maple-bot/providers';

describe('provider contracts (FR-003, FR-009, T-006..008, T-014..015)', () => {
  it('maps Nexon character stats and HEXA summary without third-party access', async () => {
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ final_stat: [{ stat_name: '전투력', stat_value: '12345678' }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            character_hexa_core_equipment: [
              { hexa_core_type: '마스터리', hexa_core_name: '테스트 코어', hexa_core_level: 30 },
              { hexa_core_type: '강화', hexa_core_name: '강화 코어', hexa_core_level: 15 },
            ],
          }),
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findCharacter(
      '테스트',
      new AbortController().signal,
    );
    expect(result?.level).toBe(280);
    expect(result?.combatPower).toBe(12345678);
    expect(result?.hexaCoreCount).toBe(2);
    expect(result?.hexaCoreLevelTotal).toBe(45);
    expect(result?.hexaCores).toEqual([
      { type: '마스터리', name: '테스트 코어', level: 30 },
      { type: '강화', name: '강화 코어', level: 15 },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(fetcher.mock.calls.every(([url]) => String(url).includes('open.api.nexon.com'))).toBe(
      true,
    );
  });
  it('maps the official HEXA core response', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            date: '2026-08-27T00:00:00+09:00',
            character_hexa_core_equipment: [
              {
                hexa_core_name: '테스트 마스터리',
                hexa_core_level: 30,
                hexa_core_type: '마스터리',
                linked_skill: [{ hexa_skill_id: '테스트 스킬' }],
              },
            ],
          }),
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findHexa?.(
      '테스트',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      name: '테스트',
      cores: [{ name: '테스트 마스터리', level: 30 }],
    });
  });
  it('maps the official Dojang record response', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            date: '2026-08-27T00:00:00+09:00',
            dojang_best_floor: 80,
            dojang_best_time: 1234,
            date_dojang_record: '2026-08-26T00:00:00+09:00',
          }),
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findDojang?.(
      '테스트',
      new AbortController().signal,
    );
    expect(result).toMatchObject({ name: '테스트', floor: 80, timeSeconds: 1234 });
  });
  it('maps the official Union summary response', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            date: '2026-08-27T00:00:00+09:00',
            union_level: 8500,
            union_grade: '그랜드 마스터 유니온 2',
            union_artifact_level: 40,
            union_artifact_point: 1200,
          }),
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findUnion?.(
      '테스트',
      new AbortController().signal,
    );
    expect(result).toMatchObject({ name: '테스트', level: 8500, artifactPoint: 1200 });
  });
  it('maps the official equipment response', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            date: '2026-08-27T00:00:00+09:00',
            item_equipment: [
              {
                item_equipment_part: '모자',
                item_name: '테스트 모자',
                starforce: '22',
                potential_option_grade: '레전드리',
                additional_potential_option_grade: '에픽',
              },
            ],
          }),
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findEquipment?.(
      '테스트',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      name: '테스트',
      items: [
        {
          part: '모자',
          name: '테스트 모자',
          starforce: 22,
          potentialGrade: '레전드리',
          additionalPotentialGrade: '에픽',
        },
      ],
    });
  });
  it('maps only the first three official notices and keeps official links', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          notice: [
            {
              title: '첫 공지',
              url: 'https://maplestory.nexon.com/News/Notice/1',
              date: '2026-08-27',
            },
            { title: '둘째 공지', url: 'https://maplestory.nexon.com/News/Notice/2' },
            { title: '셋째 공지', url: 'https://www.maplestory.nexon.com/News/Notice/3' },
            { title: '제외 공지', url: 'https://maplestory.nexon.com/News/Notice/4' },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await createNexonClient('fixture-key', fetcher).findNotice?.(
      new AbortController().signal,
    );
    expect(result?.notices).toHaveLength(3);
    expect(result?.notices[0]).toMatchObject({ title: '첫 공지', date: '2026-08-27' });
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://open.api.nexon.com/maplestory/v1/notice');
  });
  it('maps the official ongoing event list', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          event_notice: [
            {
              title: '테스트 이벤트',
              url: 'https://maplestory.nexon.com/News/Event/1',
              date_event_start: '2026-08-01',
              date_event_end: '2026-08-31',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await createNexonClient('fixture-key', fetcher).findEvents?.(
      new AbortController().signal,
    );
    expect(result?.events).toMatchObject([
      { title: '테스트 이벤트', startDate: '2026-08-01', endDate: '2026-08-31' },
    ]);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'https://open.api.nexon.com/maplestory/v1/notice-event',
    );
  });
  it('maps the official Royal Style probability table', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td rowspan="2">로얄스타일</td><td><span>테스트 라벨</span></td><td>3.0%</td></tr><tr><td>일반 아이템</td><td>5.0%</td></tr></table>',
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    );
    const result = await createNexonClient(undefined, fetcher).findRoyalStyles?.(
      new AbortController().signal,
    );
    expect(result?.items).toEqual([
      { name: '테스트 라벨', probability: 3 },
      { name: '일반 아이템', probability: 5 },
    ]);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'https://maplestory.nexon.com/Guide/CashShop/Probability',
    );
  });
  it('maps the latest official Wonder Berry probability table', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        '<h3>&lt;old&gt;</h3><table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>노멀</td><td>오래된 아이템</td><td>50%</td></tr></table><h3>&lt;latest&gt;</h3><table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>희귀</td><td>최신 펫</td><td>3.32%</td></tr><tr><td>노멀</td><td>원더 쿠키</td><td>15.02%</td></tr></table>',
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    );
    const result = await createNexonClient(undefined, fetcher).findWonderBerry?.(
      new AbortController().signal,
    );
    expect(result?.items).toEqual([
      { name: '최신 펫', probability: 3.32 },
      { name: '원더 쿠키', probability: 15.02 },
    ]);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'https://maplestory.nexon.com/Guide/CashShop/Probability/WispsWonderBerry',
    );
  });
  it('maps the selected official Luna Crystal Sweet probability table', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>루나 스윗 펫</td><td>테스트 펫</td><td>9.6%</td></tr></table>',
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    );
    const result = await createNexonClient(undefined, fetcher).findLunaCrystalSweet?.(
      '스페셜',
      new AbortController().signal,
    );
    expect(result).toMatchObject({ kind: '스페셜', items: [{ name: '테스트 펫', probability: 9.6 }] });
    expect(fetcher.mock.calls[0]?.[0]).toContain('SpecialLunaCrystalSweet');
  });
  it('maps the selected official Luna Crystal Dream probability table', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>루나 드림 펫</td><td>테스트 드림 펫</td><td>8.4%</td></tr></table>',
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    );
    const result = await createNexonClient(undefined, fetcher).findLunaCrystalDream?.(
      '스페셜',
      new AbortController().signal,
    );
    expect(result).toMatchObject({ kind: '스페셜', items: [{ name: '테스트 드림 펫', probability: 8.4 }] });
    expect(fetcher.mock.calls[0]?.[0]).toContain('SpecialLunaCrystalDream');
  });
  it('maps eight official experience history snapshots', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      );
    for (let index = 0; index < 8; index += 1) {
      fetcher.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            character_level: 280,
            character_exp: 1000 + index,
            character_exp_rate: `${50 - index}.25`,
          }),
          { status: 200 },
        ),
      );
    }
    const result = await createNexonClient('fixture-key', fetcher).findExperienceHistory?.(
      '테스트',
      new AbortController().signal,
    );
    expect(result?.snapshots).toHaveLength(8);
    expect(result?.snapshots[0]).toMatchObject({ level: 280, experienceRate: 50.25 });
    expect(fetcher.mock.calls[1]?.[0]).toContain('character/basic?ocid=ocid-fixture&date=');
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
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ final_stat: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ character_hexa_core_equipment: [] }), { status: 200 }),
      );
    await expect(
      createNexonClient('fixture-key', retryFetcher).findCharacter(
        '재시도',
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ name: '재시도' });
    expect(retryFetcher).toHaveBeenCalledTimes(5);
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
