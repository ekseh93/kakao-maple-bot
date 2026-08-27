import { describe, expect, it, vi } from 'vitest';
import {
  createInvenClient,
  createNexonClient,
  createStockClient,
} from '@kakao-maple-bot/providers';

describe('provider contracts (FR-003, FR-009, T-006..008, T-014..015)', () => {
  it('maps the first five Inven 10-recommendation post titles', async () => {
    const html = `
      <div class="board-list"><a class="subject-link"><span class="category">[수다]</span> 첫 번째 글 </a>
      <a class="subject-link"><span class="category">[정보]</span> 두 번째 글 </a>
      <a class="subject-link"><span class="category">[수다]</span> 세 번째 글 </a>
      <a class="subject-link"><span class="category">[인방]</span> 네 번째 글 </a>
      <a class="subject-link"><span class="category">[정보]</span> 다섯 번째 글 </a>
      <a class="subject-link">여섯 번째 글</a></div>`;
    const fetcher = vi.fn().mockResolvedValue(new Response(html, { status: 200 }));
    const result = await createInvenClient(fetcher).findTopPosts(new AbortController().signal);
    expect(result.posts.map((post) => post.title)).toEqual([
      '첫 번째 글',
      '두 번째 글',
      '세 번째 글',
      '네 번째 글',
      '다섯 번째 글',
    ]);
    expect(result.boardUrl).toBe('https://www.inven.co.kr/board/maple/5974?my=chu');
  });
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
  it('filters official notice alerts by title keyword', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          notice: [
            {
              title: '8/27 채널 점검 안내',
              url: 'https://maplestory.nexon.com/News/Notice/1',
              date: '2026-08-27',
            },
            {
              title: '일반 안내',
              url: 'https://maplestory.nexon.com/News/Notice/2',
              date: '2026-08-27',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await createNexonClient('fixture-key', fetcher).findNoticeAlerts?.(
      ['채널 점검', '클라이언트'],
      new AbortController().signal,
    );
    expect(result?.notices).toEqual([
      {
        title: '8/27 채널 점검 안내',
        url: 'https://maplestory.nexon.com/News/Notice/1',
        date: '2026-08-27',
      },
    ]);
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
  it('maps the official Union Champion response', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            date: '2026-08-27T00:00:00+09:00',
            union_champion: [
              {
                champion_name: '메르세데스',
                champion_grade: 'S',
                champion_slot: 1,
                champion_class: '궁수',
                champion_badge_info: [
                  { stat: '경험치 획득량 +15%' },
                  { stat: '재사용 대기시간 감소 -5%' },
                ],
              },
            ],
          }),
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findUnionChampion?.(
      '테스트',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      name: '테스트',
      champions: [{ name: '메르세데스', grade: 'S', className: '궁수' }],
    });
    expect(result?.champions[0]?.abilities).toContainEqual({
      name: '챔피언 휘장',
      value: '경험치 획득량 +15%',
    });
    expect(fetcher.mock.calls[1]?.[0]).toContain('/user/union-champion?ocid=ocid-fixture');
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
  it('finds the latest Sunday Maple notice from the official notice API', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          notice: [
            {
              title: '썬데이 메이플 8월 30일',
              url: 'https://maplestory.nexon.com/News/Notice/30',
              date: '2026-08-27',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await createNexonClient('fixture-key', fetcher).findSunday?.(
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      title: '썬데이 메이플 8월 30일',
      startDate: '2026-08-27',
    });
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://open.api.nexon.com/maplestory/v1/notice');
  });
  it('falls back to the official closed event list when the notice API has no Sunday result', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ notice: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          '<a href="/News/Event/Closed/1375?search=%EC%8D%AC%EB%8D%B0%EC%9D%B4"><em class="event_listMt">썬데이 메이플</em></a><dd class="date"><p>2026.08.23 (일)</p>',
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findSunday?.(
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      title: '썬데이 메이플',
      url: 'https://maplestory.nexon.com/News/Event/Closed/1375?search=%EC%8D%AC%EB%8D%B0%EC%9D%B4',
      startDate: '2026-08-23',
      endDate: '2026-08-23',
    });
    expect(fetcher.mock.calls[1]?.[0]).toBe(
      'https://maplestory.nexon.com/News/Event/Closed?search=%EC%8D%AC%EB%8D%B0%EC%9D%B4',
    );
  });
  it('maps the official Royal Style probability table', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
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
    const fetcher = vi
      .fn()
      .mockResolvedValue(
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
  it('maps normal and Fever Time Boutique Gift probability tables', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>일반</td><td>티켓 1개</td><td>90%</td></tr><tr><td>일반</td><td>티켓 10개</td><td>10%</td></tr></table><table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>피버</td><td>티켓 10개</td><td>100%</td></tr></table>',
          { status: 200, headers: { 'content-type': 'text/html' } },
        ),
      );
    const result = await createNexonClient(undefined, fetcher).findBoutiqueGift?.(
      new AbortController().signal,
    );
    expect(result?.normalItems).toEqual([
      { name: '티켓 1개', probability: 90 },
      { name: '티켓 10개', probability: 10 },
    ]);
    expect(result?.feverItems).toEqual([{ name: '티켓 10개', probability: 100 }]);
    expect(fetcher.mock.calls[0]?.[0]).toContain('BoutiqueGift');
  });
  it('maps official Red and Black Masterpiece probability tables', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>레드라벨</td><td>레드 테스트</td><td>7.3539%</td></tr></table>',
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>블랙라벨</td><td>블랙 테스트</td><td>5.8135%</td></tr></table>',
          { status: 200 },
        ),
      );
    const result = await createNexonClient(undefined, fetcher).findMasterpiece?.(
      new AbortController().signal,
    );
    expect(result?.redItems).toEqual([{ name: '레드 테스트', probability: 7.3539 }]);
    expect(result?.blackItems).toEqual([{ name: '블랙 테스트', probability: 5.8135 }]);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://maplestory.nexon.com/Guide/CashShop/Probability/MasterpieceRed',
      'https://maplestory.nexon.com/Guide/CashShop/Probability/MasterpieceBlack',
    ]);
  });
  it('maps the selected official Luna Crystal Sweet probability table', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>루나 스윗 펫</td><td>테스트 펫</td><td>9.6%</td></tr></table>',
          { status: 200, headers: { 'content-type': 'text/html' } },
        ),
      );
    const result = await createNexonClient(undefined, fetcher).findLunaCrystalSweet?.(
      '스페셜',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      kind: '스페셜',
      items: [{ name: '테스트 펫', probability: 9.6 }],
    });
    expect(fetcher.mock.calls[0]?.[0]).toContain('SpecialLunaCrystalSweet');
  });
  it('maps the selected official Luna Crystal Dream probability table', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<table><tr><th>구분</th><th>아이템명</th><th>획득확률</th></tr><tr><td>루나 드림 펫</td><td>테스트 드림 펫</td><td>8.4%</td></tr></table>',
          { status: 200, headers: { 'content-type': 'text/html' } },
        ),
      );
    const result = await createNexonClient(undefined, fetcher).findLunaCrystalDream?.(
      '스페셜',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      kind: '스페셜',
      items: [{ name: '테스트 드림 펫', probability: 8.4 }],
    });
    expect(fetcher.mock.calls[0]?.[0]).toContain('SpecialLunaCrystalDream');
  });
  it('maps global weather, geocoding, and air quality fixtures', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [{ name: '도쿄', latitude: 35.68, longitude: 139.69, country: '일본' }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: { temperature_2m: 28.4, relative_humidity_2m: 72, weather_code: 1 },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ current: { pm2_5: 8.2, pm10: 14.6 } }), { status: 200 }),
      );
    const result = await createNexonClient(undefined, fetcher).findWeather?.(
      '도쿄',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      location: '도쿄',
      country: '일본',
      temperatureC: 28.4,
      humidityPercent: 72,
      pm25: 8.2,
      pm10: 14.6,
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
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
  it('maps a Yahoo Finance Korean name lookup and daily quote fixture', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            quotes: [
              {
                symbol: '000660.KS',
                shortname: 'SK hynix',
                longname: 'SK hynix Inc.',
                quoteType: 'EQUITY',
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            chart: {
              result: [
                {
                  meta: { regularMarketPrice: 250000, previousClose: 248000 },
                  indicators: { quote: [{ close: [248000, 250000] }] },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );
    const result = await createStockClient(undefined, undefined, fetcher).quote(
      'SK하이닉스',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      code: '000660.KS',
      name: 'SK hynix Inc.',
      price: 250000,
      change: 2000,
      changeRate: expect.closeTo(0.80645, 4),
      market: 'KRX',
      currency: 'KRW',
      dataType: 'daily',
    });
    expect(fetcher.mock.calls[0]?.[0]).toContain(
      'query1.finance.yahoo.com/v1/finance/search?q=SK%ED%95%98%EC%9D%B4%EB%8B%89%EC%8A%A4',
    );
    expect(fetcher.mock.calls[1]?.[0]).toContain('/v8/finance/chart/000660.KS');
  });
  it('maps a Tiingo name search and daily price fixture', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { ticker: 'AAPL', name: 'Apple Inc.', assetType: 'Stock', isActive: true },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ date: '2026-08-27T00:00:00Z', close: 200, volume: 123 }]), {
          status: 200,
        }),
      );
    const result = await createStockClient(undefined, 'tiingo-token', fetcher).quote(
      'Apple',
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      code: 'AAPL',
      name: 'Apple Inc.',
      price: 200,
      market: 'US',
      currency: 'USD',
      dataType: 'daily',
    });
    expect(fetcher.mock.calls[0]?.[0]).toContain('/tiingo/utilities/search/Apple');
    expect(fetcher.mock.calls[1]?.[0]).toContain('/tiingo/daily/AAPL/prices');
  });
  it('maps a Yahoo Finance Japanese market candidate', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            quotes: [{ symbol: '3659.T', longname: 'NEXON Co., Ltd.', quoteType: 'EQUITY' }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            chart: {
              result: [
                {
                  meta: { regularMarketPrice: 3000, previousClose: 2950 },
                  indicators: { quote: [{ close: [2950, 3000] }] },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );
    const result = await createStockClient(undefined, undefined, fetcher).quoteCandidates?.(
      '넥슨',
      new AbortController().signal,
    );
    expect(result).toMatchObject([
      { code: '3659.T', name: 'NEXON Co., Ltd.', price: 3000, market: 'JP', currency: 'JPY' },
    ]);
    expect(fetcher.mock.calls[0]?.[0]).toContain(
      'query1.finance.yahoo.com/v1/finance/search?q=NEXON',
    );
    expect(fetcher.mock.calls[1]?.[0]).toContain('/v8/finance/chart/3659.T');
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
  it('does not call Nexon providers when credentials are absent', async () => {
    const fetcher = vi.fn();
    await expect(
      createNexonClient(undefined, fetcher).findCharacter('테스트', new AbortController().signal),
    ).rejects.toThrow('NOT_CONFIGURED');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects malformed KRX numeric quote fields', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ OutBlock_1: [{ ISU_SRT_CD: '005930', ISU_ABBRV: '삼성전자' }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            OutBlock_1: [
              {
                ISU_SRT_CD: '005930',
                TDD_CLSPRC: 'not-a-number',
                CMPPREVDD_PRC: '0',
                FLUC_RT: '0',
                ACC_TRDVOL: '0',
              },
            ],
          }),
          { status: 200 },
        ),
      );
    await expect(
      createStockClient('app', undefined, fetcher).quote('005930', new AbortController().signal),
    ).rejects.toThrow('PROVIDER_SCHEMA');
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
