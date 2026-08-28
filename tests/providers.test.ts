import { describe, expect, it, vi } from 'vitest';
import {
  createInvenClient,
  createNaverWebtoonClient,
  createWebNovelClient,
  createNexonClient,
  createNaverBlogClient,
  createRidiMangaClient,
  createExchangeRateClient,
  createStockClient,
  createTmdbNetflixClient,
} from '@kakao-maple-bot/providers';

describe('provider contracts (FR-003, FR-009, T-006..008, T-014..015)', () => {
  it('converts USD-base public rates into KRW rates for USD and JPY', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          result: 'success',
          time_last_update_utc: 'Thu, 27 Aug 2026 00:02:31 +0000',
          rates: { JPY: 159.234947, KRW: 1384.607983 },
        }),
        { status: 200 },
      ),
    );
    const result = await createExchangeRateClient(fetcher).findUsdAndJpyRates(
      new AbortController().signal,
    );
    expect(result.usdKrw).toBe(1384.607983);
    expect(result.jpyKrw).toBeCloseTo(8.695, 2);
    expect(result.updatedAt).toContain('27 Aug 2026');
  });
  it('queries TMDB movie and TV catalogs with Netflix provider filters', async () => {
    const fetcher = vi.fn().mockImplementation((url: string) => {
      const isMovie = url.includes('/discover/movie');
      return Promise.resolve(
        new Response(
          JSON.stringify({ results: [isMovie ? { title: '영화 제목' } : { name: '드라마 제목' }] }),
          { status: 200 },
        ),
      );
    });
    const result = await createTmdbNetflixClient('tmdb-token', 'JP', fetcher).findTitles(
      new AbortController().signal,
    );
    expect(result).toEqual([
      { title: '영화 제목', mediaType: 'movie' },
      { title: '드라마 제목', mediaType: 'tv' },
    ]);
    expect(fetcher.mock.calls[0]?.[0]).toContain('watch_region=JP');
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer tmdb-token',
    });
  });

  it('does not call TMDB when the read token is absent', async () => {
    const fetcher = vi.fn();
    await expect(
      createTmdbNetflixClient(undefined, 'KR', fetcher).findTitles(new AbortController().signal),
    ).rejects.toThrow('NOT_CONFIGURED');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('maps current Naver weekday webtoons and excludes finished/resting titles', async () => {
    const fetcher = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            titleList: [
              { titleId: 1, titleName: '연재 작품', author: '작가', finish: false, rest: false },
              { titleId: 2, titleName: '완결 작품', author: '작가', finish: true, rest: false },
              { titleId: 3, titleName: '휴재 작품', author: '작가', finish: false, rest: true },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const result = await createNaverWebtoonClient(fetcher).findCurrentWebtoons(
      new AbortController().signal,
    );
    expect(result.items).toHaveLength(7);
    expect(result.items[0]).toMatchObject({
      title: '연재 작품',
      weekday: '월',
      url: 'https://comic.naver.com/webtoon/list?titleId=1',
    });
    expect(fetcher).toHaveBeenCalledTimes(7);
  });

  it('maps web novel candidates from KakaoPage, Munpia, and Novelpia', async () => {
    const fetcher = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes('kakao')
        ? '<a href="/content/1"><span>카카오 소설</span></a>'
        : url.includes('munpia')
          ? '<a href="/novel/2">문피아 소설</a>'
          : '<a href="/novel/3">노벨피아 소설</a>';
      return Promise.resolve(new Response(body, { status: 200 }));
    });
    const result = await createWebNovelClient(fetcher).findWebNovels(new AbortController().signal);
    expect(result.items).toEqual([
      { title: '카카오 소설', source: '카페', url: 'https://page.kakao.com/content/1' },
      { title: '문피아 소설', source: '문피아', url: 'https://www.munpia.com/novel/2' },
      { title: '노벨피아 소설', source: '노벨피아', url: 'https://novelpia.com/novel/3' },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('maps Ridi Japanese manga links', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<a href="/books/123"><span>리디 만화 A</span></a>' +
            '<a href="/books/456?utm_source=test">리디 만화 B</a>',
          { status: 200 },
        ),
      );
    const result = await createRidiMangaClient(fetcher).findJapaneseManga(
      new AbortController().signal,
    );
    expect(result.items).toEqual([
      { title: '리디 만화 A', url: 'https://ridibooks.com/books/123' },
      { title: '리디 만화 B', url: 'https://ridibooks.com/books/456' },
    ]);
    expect(result.sourceUrl).toBe('https://ridibooks.com/comics/ebook');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('maps the latest Quasar Zone hot-deal titles and links', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<li><a href="/bbs/qb_saleinfo/views/1?_method=GET&sort=num"><h3>[쿠팡] 상품 A</h3></a><span class="date">08.28</span></li>' +
            '<li><a href="/bbs/qb_saleinfo/views/2">상품 B</a><span class="date">08.28</span></li>' +
            '<li><a href="/bbs/qb_saleinfo/views/3">상품 C</a><span class="date">08.28</span></li>' +
            '<li><a href="/bbs/qb_saleinfo/views/4">상품 D</a><span class="date">08.28</span></li>' +
            '<li><a href="/bbs/qb_saleinfo/views/5">상품 E</a><span class="date">08.28</span></li>' +
            '<li><a href="/bbs/qb_saleinfo/views/6">상품 F</a><span class="date">08:30</span></li>',
          { status: 200 },
        ),
      );
    const result = await createInvenClient(fetcher).findHotDeals?.(new AbortController().signal);
    expect(result?.posts).toEqual([
      {
        title: '[쿠팡] 상품 A',
        url: 'https://quasarzone.com/bbs/qb_saleinfo/views/1',
        postedAt: '08.28',
      },
      { title: '상품 B', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/2', postedAt: '08.28' },
      { title: '상품 C', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/3', postedAt: '08.28' },
      { title: '상품 D', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/4', postedAt: '08.28' },
      { title: '상품 E', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/5', postedAt: '08.28' },
      { title: '상품 F', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/6', postedAt: '08:30' },
    ]);
  });

  it('tries the sorted Quasar Zone hot-deal board after a board-level block', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 403 }))
      .mockResolvedValueOnce(
        new Response('<a href="/bbs/qb_saleinfo/views/9">정렬된 핫딜</a>', { status: 200 }),
      );

    const result = await createInvenClient(fetcher).findHotDeals?.(new AbortController().signal);

    expect(result?.posts).toEqual([
      { title: '정렬된 핫딜', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/9' },
    ]);
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'https://quasarzone.com/bbs/qb_saleinfo?sort=num%2C+reply',
      expect.anything(),
    );
    expect(result?.boardUrl).toBe('https://quasarzone.com/bbs/qb_saleinfo');
  });

  it('treats a Quasar Zone challenge page as unavailable', async () => {
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Response('Enable JavaScript and cookies to continue _cf_chl_opt turnstile.render', {
          status: 200,
        }),
    );

    await expect(
      createInvenClient(fetcher).findHotDeals?.(new AbortController().signal),
    ).rejects.toThrow('PROVIDER_UNAVAILABLE');
  });

  it('maps five Arca Live hot-deal titles and links', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<a href="/b/hotdeal/101"><span>아카라이브 상품 A</span></a>' +
            '<a href="/b/hotdeal/102">아카라이브 상품 B</a>' +
            '<a href="/b/hotdeal/103">아카라이브 상품 C</a>' +
            '<a href="/b/hotdeal/104">아카라이브 상품 D</a>' +
            '<a href="/b/hotdeal/105">아카라이브 상품 E</a>' +
            '<a href="/b/hotdeal/106">아카라이브 상품 F</a>',
          { status: 200 },
        ),
      );

    const result = await createInvenClient(fetcher).findArcaLiveHotDeals?.(
      new AbortController().signal,
    );

    expect(result?.posts).toEqual([
      { title: '아카라이브 상품 A', url: 'https://arca.live/b/hotdeal/101' },
      { title: '아카라이브 상품 B', url: 'https://arca.live/b/hotdeal/102' },
      { title: '아카라이브 상품 C', url: 'https://arca.live/b/hotdeal/103' },
      { title: '아카라이브 상품 D', url: 'https://arca.live/b/hotdeal/104' },
      { title: '아카라이브 상품 E', url: 'https://arca.live/b/hotdeal/105' },
    ]);
  });

  it('maps five FMKorea hot-deal titles and removes notice rows', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<td class="title"><a href="/index.php?mid=hotdeal&amp;document_srl=1">통합공지</a></td>' +
            '<td class="title"><a href="/index.php?mid=hotdeal&amp;document_srl=201">펨코 상품 A&nbsp; [2]</a></td>' +
            '<td class="title"><a href="/index.php?mid=hotdeal&amp;document_srl=202">펨코 상품 B</a></td>' +
            '<td class="title"><a href="/index.php?mid=hotdeal&amp;document_srl=203">펨코 상품 C</a></td>' +
            '<td class="title"><a href="/index.php?mid=hotdeal&amp;document_srl=204">펨코 상품 D</a></td>' +
            '<td class="title"><a href="/index.php?mid=hotdeal&amp;document_srl=205">펨코 상품 E</a></td>' +
            '<td class="title"><a href="/index.php?mid=hotdeal&amp;document_srl=206">펨코 상품 F</a></td>',
          { status: 200 },
        ),
      );

    const result = await createInvenClient(fetcher).findFmKoreaHotDeals?.(
      new AbortController().signal,
    );

    expect(result?.posts).toEqual([
      { title: '펨코 상품 A [2]', url: 'https://www.fmkorea.com/201' },
      { title: '펨코 상품 B', url: 'https://www.fmkorea.com/202' },
      { title: '펨코 상품 C', url: 'https://www.fmkorea.com/203' },
      { title: '펨코 상품 D', url: 'https://www.fmkorea.com/204' },
      { title: '펨코 상품 E', url: 'https://www.fmkorea.com/205' },
    ]);
  });

  it('maps five Quasar Zone graphics-card titles and links', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<a href="/bbs/qb_tsy/views/10">타세요 게시판 특별 규정(22.08.22)</a>' +
            '<a href="/bbs/qb_tsy/views/11"><h3>그래픽카드 글 A</h3></a>' +
            '<a href="/bbs/qb_tsy/views/12">그래픽카드 글 B</a>',
          { status: 200 },
        ),
      );
    const result = await createInvenClient(fetcher).findGraphicsCardPosts?.(
      new AbortController().signal,
    );
    expect(result?.posts).toEqual([
      { title: '그래픽카드 글 A', url: 'https://quasarzone.com/bbs/qb_tsy/views/11' },
      { title: '그래픽카드 글 B', url: 'https://quasarzone.com/bbs/qb_tsy/views/12' },
    ]);
  });

  it('maps five DCInside monitor titles and links', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<a href="/mgallery/board/view/?id=mnt&no=101"><em>모니터 글 A</em></a>' +
            '<a href="/mgallery/board/view/?id=mnt&no=102">모니터 글 B</a>' +
            '<a href="/mgallery/board/view/?id=mnt&no=103">모니터 글 C</a>' +
            '<a href="/mgallery/board/view/?id=mnt&no=104">모니터 글 D</a>' +
            '<a href="/mgallery/board/view/?id=mnt&no=105">모니터 글 E</a>' +
            '<a href="/mgallery/board/view/?id=mnt&no=106">모니터 글 F</a>',
          { status: 200 },
        ),
      );
    const result = await createInvenClient(fetcher).findMonitorPosts?.(
      new AbortController().signal,
    );
    expect(result?.posts).toEqual([
      {
        title: '모니터 글 A',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=mnt&no=101',
      },
      {
        title: '모니터 글 B',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=mnt&no=102',
      },
      {
        title: '모니터 글 C',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=mnt&no=103',
      },
      {
        title: '모니터 글 D',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=mnt&no=104',
      },
      {
        title: '모니터 글 E',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=mnt&no=105',
      },
    ]);
    expect(result?.boardUrl).toBe(
      'https://gall.dcinside.com/mgallery/board/lists/?id=mnt&sort_type=N&search_head=70&page=1',
    );
  });

  it('maps three DCInside Japan-travel titles and links', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<a href="/mgallery/board/view/?id=nokanto&no=201"><em>여행기 A</em></a>' +
            '<a href="/mgallery/board/view/?id=nokanto&no=202">여행기 B</a>' +
            '<a href="/mgallery/board/view/?id=nokanto&no=203">여행기 C</a>' +
            '<a href="/mgallery/board/view/?id=nokanto&no=204">여행기 D</a>',
          { status: 200 },
        ),
      );
    const result = await createInvenClient(fetcher).findJapanTravelPosts?.(
      new AbortController().signal,
    );
    expect(result?.posts).toEqual([
      {
        title: '여행기 A',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=nokanto&no=201',
      },
      {
        title: '여행기 B',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=nokanto&no=202',
      },
      {
        title: '여행기 C',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=nokanto&no=203',
      },
    ]);
    expect(result?.boardUrl).toBe(
      'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=10&page=1',
    );
  });
  it('falls back to the mobile DCInside page on a temporary server failure', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(
        new Response('<a href="/mgallery/board/view/?id=nokanto&no=401">모바일 여행기</a>', {
          status: 200,
        }),
      );
    const result = await createInvenClient(fetcher).findJapanTravelPosts?.(
      new AbortController().signal,
    );
    expect(result?.posts[0]).toEqual({
      title: '모바일 여행기',
      url: 'https://gall.dcinside.com/mgallery/board/view/?id=nokanto&no=401',
    });
  });
  it('does not retry a DCInside access block on another endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 403 }));
    await expect(
      createInvenClient(fetcher).findJapanTravelPosts?.(new AbortController().signal),
    ).rejects.toThrow('PROVIDER_UNAVAILABLE');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('maps three DCInside Japan-restaurant titles and links', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<a href="/mgallery/board/view/?id=nokanto&no=301"><em>맛집 A</em></a>' +
            '<a href="/mgallery/board/view/?id=nokanto&no=302">맛집 B</a>' +
            '<a href="/mgallery/board/view/?id=nokanto&no=303">맛집 C</a>' +
            '<a href="/mgallery/board/view/?id=nokanto&no=304">맛집 D</a>',
          { status: 200 },
        ),
      );
    const result = await createInvenClient(fetcher).findJapanRestaurantPosts?.(
      new AbortController().signal,
    );
    expect(result?.posts).toEqual([
      {
        title: '맛집 A',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=nokanto&no=301',
      },
      {
        title: '맛집 B',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=nokanto&no=302',
      },
      {
        title: '맛집 C',
        url: 'https://gall.dcinside.com/mgallery/board/view/?id=nokanto&no=303',
      },
    ]);
    expect(result?.boardUrl).toBe(
      'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=100&page=1',
    );
  });
  it('uses representative Japanese prefecture cities for weather geocoding', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [{ name: 'Mito', latitude: 36.34, longitude: 140.45, country: 'Japan' }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: { temperature_2m: 25, relative_humidity_2m: 70, weather_code: 1 },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ current: { pm2_5: 5, pm10: 10 } }), { status: 200 }),
      );
    await createNexonClient(undefined, fetcher).findWeather?.(
      '이바라키',
      new AbortController().signal,
    );
    expect(String(fetcher.mock.calls[0]?.[0])).toContain('name=Mito');
  });
  it('falls back to a Korean-aware geocoder for unknown Korean global locations', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              name: '뉴욕',
              lat: '40.7128',
              lon: '-74.0060',
              address: { country: '미국' },
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: { temperature_2m: 20, relative_humidity_2m: 60, weather_code: 1 },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ current: { pm2_5: 4, pm10: 8 } }), { status: 200 }),
      );
    const result = await createNexonClient(undefined, fetcher).findWeather?.(
      '뉴욕',
      new AbortController().signal,
    );
    expect(result).toMatchObject({ location: '뉴욕', country: '미국' });
    expect(String(fetcher.mock.calls[1]?.[0])).toContain('q=%EB%89%B4%EC%9A%95');
  });
  it('finds the newest weekly new product post from the Naver Blog RSS feed', async () => {
    const xml = `
      <item><title><![CDATA[일반 글]]></title><link><![CDATA[https://blog.naver.com/don_jjin/1]]></link></item>
      <item><title><![CDATA[[금주의 신상] 최신 신제품 정보]]></title><link><![CDATA[https://blog.naver.com/don_jjin/2]]></link><pubDate>Thu, 27 Aug 2026 22:00:00 +0900</pubDate></item>
      <item><title><![CDATA[[금주의 신상] 오래된 신제품 정보]]></title><link><![CDATA[https://blog.naver.com/don_jjin/3]]></link></item>`;
    const fetcher = vi.fn().mockResolvedValue(new Response(xml, { status: 200 }));
    const result = await createNaverBlogClient(fetcher).findLatestWeeklyNewProduct(
      new AbortController().signal,
    );
    expect(result).toEqual({
      title: '[금주의 신상] 최신 신제품 정보',
      url: 'https://blog.naver.com/don_jjin/2',
      publishedAt: 'Thu, 27 Aug 2026 22:00:00 +0900',
    });
  });

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
  it('maps the three newest Mabbak Dorosi posts with article links', async () => {
    const html = `
      <tr class="notice all"><a class="subject-link" href="/board/maple/2304/90">공지 하나</a></tr>
      <tr class="notice all"><a class="subject-link" href="/board/maple/2304/91">공지 둘</a></tr>
      <tr><a class="subject-link" href="/board/maple/2304/101">첫 글</a></tr>
      <tr><a class="subject-link" href="/board/maple/2304/102">둘째 글</a></tr>
      <tr><a class="subject-link" href="/board/maple/2304/103">셋째 글</a></tr>
      <tr><a class="subject-link" href="/board/maple/2304/104">넷째 글</a></tr>`;
    const fetcher = vi.fn().mockResolvedValue(new Response(html, { status: 200 }));
    const result = await createInvenClient(fetcher).findMabbakDorosiPosts!(
      new AbortController().signal,
    );
    expect(result.posts).toHaveLength(3);
    expect(result.posts[0]).toEqual({
      title: '첫 글',
      url: 'https://www.inven.co.kr/board/maple/2304/101',
    });
    expect(result.posts[2]?.url).toBe('https://www.inven.co.kr/board/maple/2304/103');
    expect(result.posts.map((post) => post.title)).not.toContain('공지 하나');
    expect(result.posts.map((post) => post.title)).not.toContain('공지 둘');
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
  it('maps the five latest events from the official event board', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<dt><a href="/News/Event/1">첫 번째 이벤트</a></dt>' +
            '<dd><a href="/News/Event/1">2026.08.01 ~ 2026.08.31</a></dd>' +
            '<dt><a href="/News/Event/2">두 번째 이벤트</a></dt>' +
            '<dd><a href="/News/Event/2">2026.08.02 ~ 2026.08.30</a></dd>' +
            '<dt><a href="/News/Event/3">세 번째 이벤트</a></dt>' +
            '<dd><a href="/News/Event/3">2026.08.03 ~ 2026.08.29</a></dd>' +
            '<dt><a href="/News/Event/4">네 번째 이벤트</a></dt>' +
            '<dd><a href="/News/Event/4">2026.08.04 ~ 2026.08.28</a></dd>' +
            '<dt><a href="/News/Event/5">다섯 번째 이벤트</a></dt>' +
            '<dd><a href="/News/Event/5">2026.08.05 ~ 2026.08.27</a></dd>' +
            '<dt><a href="/News/Event/6">여섯 번째 이벤트</a></dt>' +
            '<dd><a href="/News/Event/6">2026.08.06 ~ 2026.08.26</a></dd>',
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findEvents?.(
      new AbortController().signal,
    );
    expect(result?.events).toHaveLength(5);
    expect(result?.events[0]).toMatchObject({
      title: '첫 번째 이벤트',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });
    expect(result?.events[4]?.title).toBe('다섯 번째 이벤트');
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://maplestory.nexon.com/News/Event');
  });
  it('finds the current Sunday Maple event and its official image', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          '<li><a href="/News/Event/1376"><img src="https://file.nexon.com/NxFile/download/FileDownloader.aspx?oidFile=card" /></a>' +
            '<dl><dt><a href="/News/Event/1376">썬데이 메이플</a></dt>' +
            '<dd><a href="/News/Event/1376">2026.08.30 (일) ~ 2026.08.30 (일)</a></dd></dl></li>',
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          '<div class="new_board_con"><img src="https://lwi.nexon.com/maplestory/2026/0820_board/sunday.png" /></div></div>',
          { status: 200 },
        ),
      );
    const result = await createNexonClient('fixture-key', fetcher).findSunday?.(
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      title: '썬데이 메이플',
      url: 'https://maplestory.nexon.com/News/Event/1376',
      startDate: '2026-08-30',
      endDate: '2026-08-30',
      imageUrl: 'https://lwi.nexon.com/maplestory/2026/0820_board/sunday.png',
    });
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
      'https://maplestory.nexon.com/News/Event/Ongoing',
      'https://maplestory.nexon.com/News/Event/1376',
    ]);
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
      { name: '최신 펫', probability: 3.32, category: '희귀' },
      { name: '원더 쿠키', probability: 15.02, category: '노멀' },
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
  it('maps the official White Jade boss ring box probability table', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<table><tr><th>아이템 명</th><th>획득확률</th></tr><tr><td>리스트레인트 링</td><td>14.28571%</td></tr><tr><td>컨티뉴어스 링</td><td>14.28571%</td></tr></table>',
          { status: 200, headers: { 'content-type': 'text/html' } },
        ),
      );
    const result = await createNexonClient(undefined, fetcher).findWhiteJadeBossRingBox?.(
      new AbortController().signal,
    );
    expect(result?.items).toEqual([
      { name: '리스트레인트 링', probability: 14.28571 },
      { name: '컨티뉴어스 링', probability: 14.28571 },
    ]);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'https://maplestory.nexon.com/Guide/OtherProbability/bossRingBox/ringBoxWhiteJade',
    );
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
  it('skips a not-yet-published current-day experience snapshot', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ocid: 'ocid-fixture' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { name: 'OPENAPI00004' } }), { status: 400 }),
      );
    for (let index = 0; index < 7; index += 1) {
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
    expect(result?.snapshots).toHaveLength(7);
    expect(fetcher).toHaveBeenCalledTimes(9);
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
      'query1.finance.yahoo.com/v1/finance/search?q=SK%20hynix',
    );
    expect(fetcher.mock.calls[1]?.[0]).toContain('/v8/finance/chart/000660.KS');
  });
  it('uses the Yahoo Korean route for a Samsung Electronics name', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            quotes: [
              {
                symbol: '005930.KS',
                longname: 'Samsung Electronics Co., Ltd.',
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
                  meta: { regularMarketPrice: 70000, previousClose: 69000 },
                  indicators: { quote: [{ close: [69000, 70000] }] },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );
    const result = await createStockClient(undefined, undefined, fetcher).quote(
      '삼성전자',
      new AbortController().signal,
    );
    expect(result).toMatchObject({ code: '005930.KS', market: 'KRX', currency: 'KRW' });
    expect(fetcher.mock.calls[0]?.[0]).toContain('q=Samsung%20Electronics');
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
  it('maps a Korean US-stock name to a Yahoo Finance US candidate', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ quotes: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            quotes: [{ symbol: 'AAPL', longname: 'Apple Inc.', quoteType: 'EQUITY' }],
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
                  meta: { regularMarketPrice: 200, previousClose: 198 },
                  indicators: { quote: [{ close: [198, 200] }] },
                },
              ],
            },
          }),
          { status: 200 },
        ),
      );
    const result = await createStockClient(undefined, undefined, fetcher).quoteCandidates?.(
      '애플',
      new AbortController().signal,
    );
    expect(result).toMatchObject([
      { code: 'AAPL', name: 'Apple Inc.', price: 200, market: 'US', currency: 'USD' },
    ]);
    expect(fetcher.mock.calls[1]?.[0]).toContain(
      'query1.finance.yahoo.com/v1/finance/search?q=Apple',
    );
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
