import { describe, expect, it, vi } from 'vitest';
import {
  createAuditLog,
  handleMessage,
  handler as lambdaHandler,
  httpHandler,
} from '../apps/lambda/src/index';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const env = {
  BOT_SHARED_SECRET: 'test',
  BOT_ENABLED: 'true',
  ALLOWED_ROOMS: 'room-a',
  STOCK_ENABLED: 'false',
};
const message = (body: string, eventId = crypto.randomUUID()) => ({
  eventId,
  roomId: 'room-a',
  senderId: 'sender',
  message: body,
});

describe('Lambda boundary (FR-010..012, T-002..005, T-016..020)', () => {
  it('T-002 ignores unapproved rooms without provider calls', async () => {
    const nexon = { findCharacter: vi.fn() };
    const result = await handleMessage({ ...message('!캐릭터 테스트'), roomId: 'other' }, env, {
      nexon,
    });
    expect(result.reply).toBeNull();
    expect(nexon.findCharacter).not.toHaveBeenCalled();
  });
  it('formats a static Japan travel recommendation', async () => {
    const result = await handleMessage(
      { ...message('!일본여행'), roomId: 'japan-travel-room' },
      { ...env, ALLOWED_ROOMS: 'japan-travel-room' },
    );
    expect(result.reply).toContain('[일본여행 추천]');
    expect(result.reply).toContain('현/도:');
    expect(result.reply).toContain('도시:');
  });

  it('formats today fortune for a birth year', async () => {
    const result = await handleMessage(
      { ...message('!운세 2000-01-01 남자 양력'), roomId: 'fortune-room' },
      { ...env, ALLOWED_ROOMS: 'fortune-room' },
    );
    expect(result.reply).toContain('[오늘의 운세]');
    expect(result.reply).toContain('생년월일: 2000-01-01 (남자 / 양력)');
  });

  it('formats Inven 10-recommendation titles and board link', async () => {
    const inven = {
      findTopPosts: vi.fn().mockResolvedValue({
        posts: [{ title: '첫 글' }, { title: '둘째 글' }],
        boardUrl: 'https://www.inven.co.kr/board/maple/5974?my=chu',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage({ ...message('!인벤'), roomId: 'room-a' }, env, { inven });
    expect(result.reply).toContain('[메이플 인벤 10추글]');
    expect(result.reply).toContain('1. 첫 글');
    expect(result.reply).toContain('10추 게시판: https://www.inven.co.kr/board/maple/5974?my=chu');
  });
  it('formats the three newest Mabbak Dorosi posts and links', async () => {
    const inven = {
      findTopPosts: vi.fn(),
      findMabbakDorosiPosts: vi.fn().mockResolvedValue({
        posts: [
          { title: '첫 글', url: 'https://www.inven.co.kr/board/maple/2304/101' },
          { title: '둘째 글', url: 'https://www.inven.co.kr/board/maple/2304/102' },
          { title: '셋째 글', url: 'https://www.inven.co.kr/board/maple/2304/103' },
        ],
        boardUrl: 'https://www.inven.co.kr/board/maple/2304',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage({ ...message('!마빡도로시'), roomId: 'room-a' }, env, {
      inven,
    });
    expect(result.reply).toContain('[마빡도로시 최신 글]');
    expect(result.reply).toContain('1. 첫 글');
    expect(result.reply).toContain('https://www.inven.co.kr/board/maple/2304/101');
    expect(inven.findMabbakDorosiPosts).toHaveBeenCalledTimes(1);
  });
  it('recommends a random current Naver webtoon', async () => {
    const webtoon = {
      findCurrentWebtoons: vi.fn().mockResolvedValue({
        items: [
          {
            titleId: 1,
            title: '연재 작품',
            author: '작가',
            weekday: '월',
            url: 'https://comic.naver.com/webtoon/list?titleId=1',
          },
        ],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!웹툰'), roomId: 'webtoon-room' },
      { ...env, ALLOWED_ROOMS: 'webtoon-room' },
      { webtoon },
    );
    expect(result.reply).toContain('[네이버 웹툰 랜덤 추천]');
    expect(result.reply).toContain('작품: 연재 작품');
    expect(result.reply).toContain('연재 요일: 월요일');
    expect(result.reply).toContain('https://comic.naver.com/webtoon/list?titleId=1');
  });
  it('recommends a random web novel with its source label', async () => {
    const webNovel = {
      findWebNovels: vi.fn().mockResolvedValue({
        items: [
          {
            title: '문피아 작품',
            source: '문피아',
            url: 'https://www.munpia.com/novel/2',
          },
        ],
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!웹소설'), roomId: 'web-novel-room' },
      { ...env, ALLOWED_ROOMS: 'web-novel-room' },
      { webNovel },
    );
    expect(result.reply).toContain('[웹소설 랜덤 추천]');
    expect(result.reply).toContain('작품: [문피아] 문피아 작품');
    expect(result.reply).toContain('https://www.munpia.com/novel/2');
  });
  it('T-001 does not spend command rate budget on ordinary chat', async () => {
    const roomEnv = { ...env, ALLOWED_ROOMS: 'chat-room' };
    const ordinary = await handleMessage(
      { ...message('안녕하세요'), roomId: 'chat-room' },
      roomEnv,
    );
    const command = await handleMessage({ ...message('!가위'), roomId: 'chat-room' }, roomEnv);
    expect(ordinary.reply).toBeNull();
    expect(command.reply).toContain('[가위바위보]');
  });
  it('ignores unknown commands without returning help', async () =>
    expect((await handleMessage(message('!없는명령'), env)).reply).toBeNull());
  it('T-004 rejects an oversized command before any provider work', async () => {
    const nexon = { findCharacter: vi.fn() };
    const result = await handleMessage(message(`!캐릭터 ${'가'.repeat(301)}`), env, { nexon });
    expect(result.reply).toContain('사용법');
    expect(nexon.findCharacter).not.toHaveBeenCalled();
  });
  it('T-018 creates only non-identifying structured audit fields', () => {
    const log = createAuditLog({
      requestId: 'request-1',
      command: 'character',
      outcome: 'success',
      latencyMs: 12.4,
      provider: 'nexon',
      cacheStatus: 'miss',
      now: new Date('2026-08-28T00:00:00.000Z'),
    });
    expect(log).toEqual({
      event: 'anonymous-command-usage',
      date: '2026-08-28',
      requestId: 'request-1',
      command: 'character',
      outcome: 'success',
      latencyMs: 12,
      provider: 'nexon',
      cacheStatus: 'miss',
      appVersion: '0.1.0',
    });
    expect(JSON.stringify(log)).not.toMatch(/message|room|sender|secret|token/i);
  });
  it('emits only anonymous audit fields for an authenticated command', async () => {
    const originalLog = console.log;
    const lines: string[] = [];
    console.log = (value?: unknown) => lines.push(String(value));
    try {
      const response = await httpHandler(
        new Request('https://example.test/v1/messages', {
          method: 'POST',
          body: JSON.stringify({
            eventId: 'audit-event',
            roomId: 'audit-room',
            senderId: 'private-sender-name',
            message: '!도움말',
          }),
          headers: { authorization: 'Bearer test', 'content-type': 'application/json' },
        }),
        { ...env, ALLOWED_ROOMS: 'audit-room' },
      );
      expect(response.status).toBe(200);
      const audit = JSON.parse(lines.at(-1) ?? '{}') as Record<string, unknown>;
      expect(audit.event).toBe('anonymous-command-usage');
      expect(audit.command).toBe('help');
      expect(audit.outcome).toBe('success');
      expect(audit).not.toHaveProperty('roomId');
      expect(audit).not.toHaveProperty('senderId');
      expect(audit).not.toHaveProperty('message');
      expect(JSON.stringify(audit)).not.toContain('audit-room');
      expect(JSON.stringify(audit)).not.toContain('private-sender-name');
    } finally {
      console.log = originalLog;
    }
  });
  it('T-016 deduplicates the same event', async () => {
    const id = crypto.randomUUID();
    expect((await handleMessage(message('!가위', id), env)).reply).toContain('[가위바위보]');
    expect((await handleMessage(message('!가위', id), env)).reply).toBeNull();
  });
  it('T-016 permits an event id again after the two-minute TTL', async () => {
    const ttlEnv = { ...env, ALLOWED_ROOMS: 'ttl-room' };
    const id = crypto.randomUUID();
    const first = await handleMessage({ ...message('!가위', id), roomId: 'ttl-room' }, ttlEnv, {
      now: () => new Date(0),
    });
    const second = await handleMessage({ ...message('!가위', id), roomId: 'ttl-room' }, ttlEnv, {
      now: () => new Date(120001),
    });
    expect(first.reply).toContain('[가위바위보]');
    expect(second.reply).toContain('[가위바위보]');
  });
  it('T-017 blocks the sixth request in a ten-second room window', async () => {
    const rateEnv = { ...env, ALLOWED_ROOMS: 'rate-room' };
    const results = [];
    for (let index = 0; index < 6; index++)
      results.push(
        await handleMessage(
          { ...message('!가위', crypto.randomUUID()), roomId: 'rate-room' },
          rateEnv,
          { now: () => new Date(index) },
        ),
      );
    expect(results[5]?.reply).toContain('요청이 많습니다');
  });
  it('T-017 blocks a sender after ten commands in one minute', async () => {
    const limitEnv = { ...env, ALLOWED_ROOMS: 'sender-room' };
    const results = [];
    for (let index = 0; index < 11; index++)
      results.push(
        await handleMessage(
          {
            ...message('!가위', crypto.randomUUID()),
            roomId: 'sender-room',
            senderId: 'limited-sender',
          },
          limitEnv,
          { now: () => new Date(index * 100) },
        ),
      );
    expect(results[10]?.reply).toContain('요청이 많습니다');
  });
  it('T-015 returns not configured for stock', async () =>
    expect((await handleMessage(message('!주식 005930'), env)).reply).toContain('설정하지 않은'));
  it('T-014 formats a configured stock quote with timestamp and disclaimer', async () => {
    const stockEnv = { ...env, ALLOWED_ROOMS: 'quote-room', STOCK_ENABLED: 'true' };
    const stock = {
      quote: vi.fn().mockResolvedValue({
        code: '005930',
        name: '삼성전자',
        price: 70000,
        currency: 'KRW',
        market: 'KRX',
        change: 100,
        changeRate: 0.14,
        volume: 123,
        fetchedAt: '2026-08-26T15:30:00+09:00',
        dataType: 'daily',
      }),
    };
    const result = await handleMessage(
      { ...message('!주식 005930'), roomId: 'quote-room' },
      stockEnv,
      { stock },
    );
    expect(result.reply).toContain('삼성전자 (005930)');
    expect(stock.quote).toHaveBeenCalledWith('005930', expect.any(AbortSignal));
    expect(result.reply).not.toContain('조회:');
    expect(result.reply).not.toContain('투자 권유가 아닙니다');
  });
  it('formats stock candidates by market', async () => {
    const stockEnv = { ...env, ALLOWED_ROOMS: 'stock-markets-room', STOCK_ENABLED: 'true' };
    const stock = {
      quote: vi.fn(),
      quoteCandidates: vi.fn().mockResolvedValue([
        {
          code: '3659.T',
          name: 'NEXON Co., Ltd.',
          price: 3000,
          currency: 'JPY',
          market: 'JP',
          fetchedAt: '2026-08-27T00:00:00.000Z',
          dataType: 'daily',
        },
      ]),
    };
    const result = await handleMessage(
      { ...message('!주식 넥슨'), roomId: 'stock-markets-room' },
      stockEnv,
      { stock, now: () => new Date(Date.now() + 300_000) },
    );
    expect(result.reply).toContain('[일본시장]');
    expect(result.reply).toContain('NEXON Co., Ltd. (3659.T)');
    expect(result.reply).toContain('현재가: 3,000엔');
    await handleMessage(
      { ...message('!테스트정리'), roomId: 'stock-markets-room' },
      { ...env, BOT_ENABLED: 'false' },
      { now: () => new Date(Date.now() + 600_000) },
    );
  });
  it('FR-014 hides admin status from non-admin senders', async () => {
    const statusEnv = { ...env, ALLOWED_ROOMS: 'status-room', ADMIN_SENDERS: 'admin-only' };
    const result = await handleMessage(
      { ...message('!상태'), roomId: 'status-room', senderId: 'ordinary' },
      statusEnv,
    );
    expect(result.reply).toBeNull();
  });
  it('FR-014 exposes only boolean configuration status to admins', async () => {
    const statusEnv = {
      ...env,
      ALLOWED_ROOMS: 'status-admin-room',
      ADMIN_SENDERS: 'admin-only',
      NEXON_API_KEY: 'configured-key',
      BOT_SHARED_SECRET: 'super-secret-value',
    };
    const result = await handleMessage(
      { ...message('!상태'), roomId: 'status-admin-room', senderId: 'admin-only' },
      statusEnv,
    );
    expect(result.reply).toContain('Nexon configured: 예');
    expect(result.reply).not.toContain('configured-key');
    expect(result.reply).not.toContain('super-secret-value');
    expect(result.reply).not.toContain('status-admin-room');
  });
  it('T-020 kill switch stops before parsing or provider calls', async () => {
    const nexon = { findCharacter: vi.fn() };
    const result = await handleMessage(
      message('!캐릭터 테스트'),
      { ...env, BOT_ENABLED: 'false' },
      { nexon },
    );
    expect(result.reply).toBeNull();
    expect(nexon.findCharacter).not.toHaveBeenCalled();
  });
  it('FR-013 caches successful character reads for five minutes', async () => {
    const nexon = {
      findCharacter: vi
        .fn()
        .mockResolvedValue({ name: '캐시', fetchedAt: '2026-08-26T00:00:00.000Z' }),
    };
    const cacheEnv = { ...env, ALLOWED_ROOMS: 'cache-room' };
    const first = await handleMessage(
      { ...message('!캐릭터 캐시'), roomId: 'cache-room' },
      cacheEnv,
      { nexon, now: () => new Date(1000) },
    );
    const second = await handleMessage(
      { ...message('!캐릭터 캐시'), roomId: 'cache-room' },
      cacheEnv,
      { nexon, now: () => new Date(2000) },
    );
    expect(first.cache).toBe('miss');
    expect(second.cache).toBe('hit');
    expect(nexon.findCharacter).toHaveBeenCalledTimes(1);
  });
  it('FR-013 caches stock reads for fifteen seconds', async () => {
    const stock = {
      quote: vi.fn().mockResolvedValue({
        code: '123456',
        price: 70000,
        currency: 'KRW',
        market: 'KRX',
        change: 100,
        changeRate: 0.14,
        fetchedAt: '2026-08-26T00:00:00.000Z',
        dataType: 'daily',
      }),
    };
    const stockEnv = { ...env, ALLOWED_ROOMS: 'stock-cache-room', STOCK_ENABLED: 'true' };
    const first = await handleMessage(
      { ...message('!주식 123456'), roomId: 'stock-cache-room' },
      stockEnv,
      { stock, now: () => new Date(3000) },
    );
    const second = await handleMessage(
      { ...message('!주식 123456'), roomId: 'stock-cache-room' },
      stockEnv,
      { stock, now: () => new Date(4000) },
    );
    expect(first.cache).toBe('miss');
    expect(second.cache).toBe('hit');
    expect(stock.quote).toHaveBeenCalledTimes(1);
  });
  it('T-006/T-007 handles character success and not found', async () => {
    const nexon = {
      findCharacter: vi
        .fn()
        .mockResolvedValueOnce({
          name: '테스트',
          world: '스카니아',
          level: 280,
          job: '비숍',
          combatPower: 12345678,
          hexaCoreCount: 2,
          hexaCoreLevelTotal: 45,
          hexaCores: [{ type: '마스터리', name: '테스트 코어', level: 30 }],
          fetchedAt: '2026-08-26T00:00:00.000Z',
        })
        .mockResolvedValueOnce(null),
    };
    const characterEnv = { ...env, ALLOWED_ROOMS: 'character-room' };
    const success = await handleMessage(
      { ...message('!캐릭터 정상'), roomId: 'character-room' },
      characterEnv,
      { nexon },
    );
    expect(success.reply).toContain('Lv. 280');
    expect(success.reply).toContain('전투력: 12,345,678');
    expect(success.reply).toContain('HEXA: 코어 2개 / 총 레벨 45');
    expect(success.reply).toContain('HEXA 코어 목록:\n▸ 마스터리: 테스트 코어 Lv.30');
    expect(success.reply).toContain('https://maple.gg/u/%ED%85%8C%EC%8A%A4%ED%8A%B8');
    expect(
      (
        await handleMessage(
          { ...message('!캐릭터 없음'), roomId: 'character-room' },
          characterEnv,
          { nexon },
        )
      ).reply,
    ).toContain('찾지 못했습니다');
  });
  it('handles Dojang lookup with formatted time', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findDojang: vi.fn().mockResolvedValue({
        name: '무릉캐릭터',
        floor: 80,
        timeSeconds: 1234,
        recordDate: '2026-08-26T00:00:00.000Z',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!무릉 무릉캐릭터'), roomId: 'dojang-room', senderId: 'dojang-sender' },
      { ...env, ALLOWED_ROOMS: 'dojang-room' },
      { nexon },
    );
    expect(result.reply).toContain('80층 / 20분 34초');
  });
  it('handles Union lookup with a concise summary', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findUnion: vi.fn().mockResolvedValue({
        name: '유니온캐릭터',
        level: 8500,
        grade: '그랜드 마스터 유니온 2',
        artifactLevel: 40,
        artifactPoint: 1200,
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!유니온 유니온캐릭터'), roomId: 'union-room', senderId: 'union-sender' },
      { ...env, ALLOWED_ROOMS: 'union-room' },
      { nexon },
    );
    expect(result.reply).toContain('유니온 레벨: 8,500');
    expect(result.reply).toContain('아티팩트 포인트: 1,200');
  });
  it('handles Union Champion lookup with abilities', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findUnionChampion: vi.fn().mockResolvedValue({
        name: '유챔캐릭터',
        champions: [
          {
            name: '메르세데스',
            grade: 'S',
            className: '궁수',
            slot: 1,
            abilities: [
              {
                name: '챔피언 휘장',
                value:
                  '올스탯 20, 최대 HP/MP 1000 증가, 공격력/마력 10 증가, 보스 몬스터 공격 시 데미지 5% 증가, 크리티컬 데미지 3.00% 증가, 방어율 무시 5% 증가',
              },
            ],
          },
        ],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      {
        ...message('!유챔 유챔캐릭터'),
        roomId: 'union-champion-room',
        senderId: 'union-champion-sender',
      },
      { ...env, ALLOWED_ROOMS: 'union-champion-room' },
      { nexon },
    );
    expect(result.reply).toContain('[유니온 챔피언 능력치]');
    expect(result.reply).toContain('메르세데스 (S 궁수)');
    expect(result.reply).toContain('[휘장 효과 합계]');
    expect(result.reply).toContain('- 올스탯: 20');
    expect(result.reply).toContain('- 최대 HP/MP: 1,000');
    expect(result.reply).toContain('- 공격력/마력: 10');
    expect(result.reply).toContain('- 보스 몬스터 공격 시 데미지: 5.00%');
    expect(result.reply).toContain('- 크리티컬 데미지: 3.00%');
    expect(result.reply).toContain('- 방어율 무시: 5.00%');
    expect(result.reply).not.toContain('챔피언 휘장:');
    expect(nexon.findUnionChampion).toHaveBeenCalledWith('유챔캐릭터', expect.anything());
  });
  it('handles equipment lookup with a readable template', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findEquipment: vi.fn().mockResolvedValue({
        name: '장비캐릭터',
        items: [
          {
            part: '모자',
            name: '테스트 모자',
            starforce: 22,
            potentialGrade: '레전드리',
            additionalPotentialGrade: '에픽',
          },
        ],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!장비 장비캐릭터'), roomId: 'equipment-room', senderId: 'equipment-sender' },
      { ...env, ALLOWED_ROOMS: 'equipment-room' },
      { nexon },
    );
    expect(result.reply).toContain('캐릭터: 장비캐릭터');
    expect(result.reply).toContain('▸ 모자\n  테스트 모자');
    expect(result.reply).toContain('⭐ 스타포스 22');
    expect(result.reply).toContain('잠재 레전드리 | 에디 에픽');
  });
  it('handles slash experience history with daily change', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findExperienceHistory: vi.fn().mockResolvedValue({
        name: '경험치캐릭터',
        snapshots: [
          { date: '2026-08-27', level: 280, experience: 2000, experienceRate: 12.5 },
          { date: '2026-08-26', level: 280, experience: 1900, experienceRate: 11.5 },
          { date: '2026-08-25', level: 280, experience: 1800, experienceRate: 10.5 },
          { date: '2026-08-24', level: 280, experience: 1700, experienceRate: 9.5 },
          { date: '2026-08-23', level: 280, experience: 1600, experienceRate: 8.5 },
          { date: '2026-08-22', level: 280, experience: 1500, experienceRate: 7.5 },
          { date: '2026-08-21', level: 280, experience: 1400, experienceRate: 6.5 },
          { date: '2026-08-20', level: 280, experience: 1300, experienceRate: 5.5 },
        ],
      }),
    };
    const result = await handleMessage(
      { ...message('/경험치 경험치캐릭터'), roomId: 'experience-room' },
      { ...env, ALLOWED_ROOMS: 'experience-room' },
      { nexon },
    );
    expect(result.reply).toContain('[경험치 히스토리]');
    expect(result.reply).toContain(
      '캐릭터: 경험치캐릭터 (현재 레벨: Lv.280 / 현재 경험치: 12.50%)',
    );
    expect(result.reply!.indexOf('2026-08-20')).toBeLessThan(result.reply!.indexOf('2026-08-27'));
    expect(result.reply).toContain('2026-08-27');
    expect(result.reply).toContain('Lv.280 / 12.50% / 전날 대비 +1.00%');
    expect(result.reply).not.toContain('2,000 EXP');
    expect(result.reply).not.toContain('기준: Nexon Open API');
    expect(result.reply).toContain('7일 변화: +7.00%');
    expect(result.reply).toContain('일평균: 1.00%');
    expect(result.reply).toContain('1업(100%)까지 예상: 87.50일');
  });
  it('handles notice lookup with official links and a bounded list', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findNotice: vi.fn().mockResolvedValue({
        notices: [
          {
            title: '메이플스토리 공지',
            url: 'https://maplestory.nexon.com/News/Notice/1',
            date: '2026-08-27T00:00:00.000Z',
          },
        ],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!공지'), roomId: 'notice-room', senderId: 'notice-sender' },
      { ...env, ALLOWED_ROOMS: 'notice-room' },
      { nexon },
    );
    expect(result.reply).toContain('[메이플스토리 공지]');
    expect(result.reply).toContain('https://maplestory.nexon.com/News/Notice/1');
  });
  it('handles latest event lookup with dates and only the official board link', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findEvents: vi.fn().mockResolvedValue({
        events: [
          {
            title: '첫 번째 이벤트',
            url: 'https://maplestory.nexon.com/News/Event/1',
            startDate: '2026-08-01T00:00:00.000Z',
            endDate: '2026-08-31T00:00:00.000Z',
          },
          { title: '두 번째 이벤트', url: 'https://maplestory.nexon.com/News/Event/2' },
          { title: '세 번째 이벤트', url: 'https://maplestory.nexon.com/News/Event/3' },
          { title: '네 번째 이벤트', url: 'https://maplestory.nexon.com/News/Event/4' },
          { title: '다섯 번째 이벤트', url: 'https://maplestory.nexon.com/News/Event/5' },
          { title: '여섯 번째 이벤트', url: 'https://maplestory.nexon.com/News/Event/6' },
        ],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!이벤트'), roomId: 'event-room', senderId: 'event-sender' },
      { ...env, ALLOWED_ROOMS: 'event-room' },
      { nexon },
    );
    expect(result.reply).toContain('[메이플스토리 최신 이벤트]');
    expect(result.reply).toContain('최신 5개');
    expect(result.reply).toContain('다섯 번째 이벤트');
    expect(result.reply).toContain('2026-08-01~2026-08-31');
    expect(result.reply).toContain('https://maplestory.nexon.com/News/Event');
    expect(result.reply).not.toContain('https://maplestory.nexon.com/News/Event/1');
    expect(result.reply).not.toContain('여섯 번째 이벤트');
  });
  it('handles the latest Sunday Maple event', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findEvents: vi.fn().mockResolvedValue({
        events: [
          {
            title: '썬데이 메이플 8월 30일',
            url: 'https://maplestory.nexon.com/News/Event/30',
            startDate: '2026-08-30T00:00:00.000Z',
            endDate: '2026-08-30T23:59:59.000Z',
          },
        ],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!썬데이'), roomId: 'sunday-room', senderId: 'sunday-sender' },
      { ...env, ALLOWED_ROOMS: 'sunday-room' },
      { nexon },
    );
    expect(result.reply).toContain('[썬데이 메이플]');
    expect(result.reply).toContain('썬데이 메이플 8월 30일');
    expect(result.reply).toContain('기간: 2026-08-30~2026-08-30');
    expect(result.reply).toContain('https://maplestory.nexon.com/News/Event/30');
  });
  it('handles ten weighted Royal Style draws', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findRoyalStyles: vi.fn().mockResolvedValue({
        items: [
          { name: '테스트 스페셜 라벨', probability: 3 },
          { name: '테스트 일반 아이템', probability: 97 },
        ],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!로얄'), roomId: 'royal-room', senderId: 'royal-sender' },
      { ...env, ALLOWED_ROOMS: 'royal-room' },
      { nexon },
    );
    expect(result.reply).toContain('[로얄스타일 10회 뽑기]');
    expect(result.reply?.match(/^\d+\./gm) ?? []).toHaveLength(10);
    expect(result.reply).not.toContain('기준: Nexon 공식 확률 페이지');
    expect(result.reply).not.toContain('실제 구매가 아닌');
    expect(result.reply).not.toContain('https://maplestory.nexon.com/Guide/CashShop/Probability');
  });
  it('supports a custom Royal Style count and hides detailed results', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findRoyalStyles: vi.fn().mockResolvedValue({
        items: [{ name: '테스트 아이템', probability: 100 }],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('/로얄 25 false'), roomId: 'royal-count-room', senderId: 'royal-count-sender' },
      { ...env, ALLOWED_ROOMS: 'royal-count-room' },
      { nexon },
    );
    expect(result.reply).toContain('[로얄스타일 25회 뽑기]');
    expect(result.reply).toContain('상세 결과: 숨김');
    expect(result.reply?.match(/^\d+\./gm) ?? []).toHaveLength(0);
  });
  it('handles ten weighted Wonder Berry draws', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findWonderBerry: vi.fn().mockResolvedValue({
        items: [
          { name: '테스트 원더 블랙 펫', probability: 3.32, category: '희귀' },
          { name: '테스트 원더 쿠키', probability: 15.02, category: '노멀' },
        ],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability/WispsWonderBerry',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!원더베리'), roomId: 'wonder-room', senderId: 'wonder-sender' },
      { ...env, ALLOWED_ROOMS: 'wonder-room' },
      { nexon, now: () => new Date(Date.now() + 10 * 60_000) },
    );
    expect(result.reply).toContain('[위습의 원더베리 10회 뽑기]');
    expect(result.reply?.match(/^\d+\./gm) ?? []).toHaveLength(10);
    expect(result.reply).not.toContain('기준: Nexon 공식 확률 페이지');
    expect(result.reply).not.toContain('실제 구매가 아닌');
    expect(result.reply).not.toContain('https://maplestory.nexon.com/Guide/CashShop/Probability');
  });
  it('handles ten Boutique Gift openings with Fever Time on the tenth', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findBoutiqueGift: vi.fn().mockResolvedValue({
        normalItems: [{ name: '티켓 1개', probability: 100 }],
        feverItems: [{ name: '티켓 10개', probability: 100 }],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability/BoutiqueGift',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!부티크'), roomId: 'boutique-room', senderId: 'boutique-sender' },
      { ...env, ALLOWED_ROOMS: 'boutique-room' },
      { nexon },
    );
    expect(result.reply).toContain('[부티크 기프트 10개 열기]');
    expect(result.reply?.match(/^\d+\./gm) ?? []).toHaveLength(10);
    expect(result.reply).toContain('10. [피버 타임] 티켓 10개');
    expect(result.reply).not.toContain(
      'https://maplestory.nexon.com/Guide/CashShop/Probability/BoutiqueGift',
    );
  });
  it('supports a custom Wonder Berry count and hides detailed results', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findWonderBerry: vi.fn().mockResolvedValue({
        items: [{ name: '테스트 원더 아이템', probability: 100 }],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability/WispsWonderBerry',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      {
        ...message('/원더베리 25 false'),
        roomId: 'wonder-count-room',
        senderId: 'wonder-count-sender',
      },
      { ...env, ALLOWED_ROOMS: 'wonder-count-room' },
      { nexon, now: () => new Date(Date.now() + 20 * 60_000) },
    );
    expect(result.reply).toContain('[위습의 원더베리 25회 뽑기]');
    expect(result.reply).toContain('상세 결과: 숨김');
    expect(result.reply?.match(/^\d+\./gm) ?? []).toHaveLength(0);
  });
  it('handles a default Luna Crystal Sweet draw', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findLunaCrystalSweet: vi.fn().mockResolvedValue({
        kind: '일반',
        items: [{ name: '테스트 루나 펫', probability: 100 }],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability/LunaCrystalSweet',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!루나스윗'), roomId: 'luna-room', senderId: 'luna-sender' },
      { ...env, ALLOWED_ROOMS: 'luna-room' },
      { nexon },
    );
    expect(result.reply).toContain('[루나 크리스탈 스윗 합성]');
    expect(result.reply).toContain('재료: 원더 블랙 + 원더 블랙');
    expect(result.reply?.match(/^\d+\./gm) ?? []).toHaveLength(5);
    expect(result.reply).toContain('[스윗] 테스트 루나 펫');
    expect(result.reply).not.toContain('기준: Nexon');
    expect(result.reply).not.toContain('https://maplestory.nexon.com/Guide/CashShop/Probability');
    expect(nexon.findLunaCrystalSweet).toHaveBeenCalledWith('일반', expect.anything());
  });
  it('handles a default Luna Crystal Dream draw', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findLunaCrystalDream: vi.fn().mockResolvedValue({
        kind: '일반',
        items: [{ name: '테스트 드림 펫', probability: 100 }],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability/LunaCrystalDream',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!루나드림'), roomId: 'dream-room', senderId: 'dream-sender' },
      { ...env, ALLOWED_ROOMS: 'dream-room' },
      { nexon },
    );
    expect(result.reply).toContain('[루나 크리스탈 드림 합성]');
    expect(result.reply).toContain('재료: 원더 스윗 + 원더 블랙');
    expect(result.reply?.match(/^\d+\./gm) ?? []).toHaveLength(5);
    expect(result.reply).toContain('[뒤진펫] 테스트 드림 펫');
    expect(result.reply).not.toContain('기준: Nexon');
    expect(result.reply).not.toContain('https://maplestory.nexon.com/Guide/CashShop/Probability');
    expect(nexon.findLunaCrystalDream).toHaveBeenCalledWith('일반', expect.anything());
  });
  it('handles global weather lookup', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findWeather: vi.fn().mockResolvedValue({
        query: '도쿄',
        location: '도쿄',
        country: '일본',
        temperatureC: 28.4,
        humidityPercent: 72,
        weatherCode: 1,
        pm25: 8.2,
        pm10: 14.6,
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!날씨 도쿄'), roomId: 'weather-room', senderId: 'weather-sender' },
      { ...env, ALLOWED_ROOMS: 'weather-room' },
      { nexon },
    );
    expect(result.reply).toContain('[현재 날씨] 도쿄, 일본');
    expect(result.reply).toContain('기온: 28.4°C');
    expect(result.reply).toContain('습도: 72%');
    expect(result.reply).toContain('PM2.5: 8.2');
    expect(result.reply).not.toContain('조회:');
    expect(result.reply).not.toContain('Open-Meteo 모델 기반');
  });
  it('handles the local Korean and Japanese lotto command', async () => {
    const result = await handleMessage(
      { ...message('!로또'), roomId: 'lotto-room', senderId: 'lotto-sender' },
      { ...env, ALLOWED_ROOMS: 'lotto-room' },
    );
    expect(result.reply).toContain('[로또 랜덤 뽑기]');
    expect(result.reply).toMatch(/한국 로또 6\/45: (?:\d{2}, ){5}\d{2}/);
    expect(result.reply).toMatch(/일본 로또7: (?:\d{2}, ){6}\d{2}/);
    expect(result.cache).toBe('bypass');
  });
  it('serves a recent successful public-post result while the source is temporarily blocked', async () => {
    const successful = {
      findHotDeals: vi.fn().mockResolvedValue({
        posts: [{ title: '최근 핫딜', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/1' }],
        boardUrl: 'https://quasarzone.com/bbs/qb_saleinfo',
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
    };
    const first = await handleMessage(
      { ...message('!핫딜'), roomId: 'stale-hotdeal-room' },
      { ...env, ALLOWED_ROOMS: 'stale-hotdeal-room' },
      { inven: successful },
    );
    expect(first.cache).toBe('miss');

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 6 * 60_000);
    const blocked = {
      findHotDeals: vi.fn().mockRejectedValue(new Error('PROVIDER_UNAVAILABLE')),
    };
    const second = await handleMessage(
      { ...message('!핫딜'), roomId: 'stale-hotdeal-room-2' },
      { ...env, ALLOWED_ROOMS: 'stale-hotdeal-room-2' },
      { inven: blocked },
    );
    vi.useRealTimers();

    expect(second.cache).toBe('stale');
    expect(second.reply).toContain('최근 핫딜');
    expect(second.reply).toContain('최근 정상 조회 결과');
    expect(blocked.findHotDeals).toHaveBeenCalledOnce();
  });
  it('shows only three Japan-travel titles and the board link', async () => {
    const inven = {
      findJapanTravelPosts: vi.fn().mockResolvedValue({
        posts: [
          { title: '여행기 A', url: 'https://gall.dcinside.com/mgallery/board/view/?no=1' },
          { title: '여행기 B', url: 'https://gall.dcinside.com/mgallery/board/view/?no=2' },
          { title: '여행기 C', url: 'https://gall.dcinside.com/mgallery/board/view/?no=3' },
          { title: '여행기 D', url: 'https://gall.dcinside.com/mgallery/board/view/?no=4' },
        ],
        boardUrl:
          'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=10&page=1',
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!일본여행기'), roomId: 'japan-travel-posts-room' },
      { ...env, ALLOWED_ROOMS: 'japan-travel-posts-room' },
      { inven },
    );

    expect(result.reply).toContain('1. 여행기 A');
    expect(result.reply).toContain('2. 여행기 B');
    expect(result.reply).toContain('3. 여행기 C');
    expect(result.reply).not.toContain('여행기 D');
    expect(result.reply).not.toContain('https://gall.dcinside.com/mgallery/board/view/?no=1');
    expect(result.reply).toContain(
      'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=10&page=1',
    );
  });
  it('shows only three Japan-restaurant titles and the board link', async () => {
    const inven = {
      findJapanRestaurantPosts: vi.fn().mockResolvedValue({
        posts: [
          { title: '맛집 A', url: 'https://gall.dcinside.com/mgallery/board/view/?no=11' },
          { title: '맛집 B', url: 'https://gall.dcinside.com/mgallery/board/view/?no=12' },
          { title: '맛집 C', url: 'https://gall.dcinside.com/mgallery/board/view/?no=13' },
          { title: '맛집 D', url: 'https://gall.dcinside.com/mgallery/board/view/?no=14' },
        ],
        boardUrl:
          'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=100&page=1',
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!일본음식점'), roomId: 'japan-restaurant-posts-room' },
      { ...env, ALLOWED_ROOMS: 'japan-restaurant-posts-room' },
      { inven },
    );

    expect(result.reply).toContain('1. 맛집 A');
    expect(result.reply).toContain('2. 맛집 B');
    expect(result.reply).toContain('3. 맛집 C');
    expect(result.reply).not.toContain('맛집 D');
    expect(result.reply).not.toContain('https://gall.dcinside.com/mgallery/board/view/?no=11');
    expect(result.reply).toContain(
      'https://gall.dcinside.com/mgallery/board/lists/?id=nokanto&sort_type=N&search_head=100&page=1',
    );
  });
  it('shows only five monitor titles and the board link', async () => {
    const inven = {
      findMonitorPosts: vi.fn().mockResolvedValue({
        posts: [
          { title: '모니터 A', url: 'https://gall.dcinside.com/mgallery/board/view/?no=21' },
          { title: '모니터 B', url: 'https://gall.dcinside.com/mgallery/board/view/?no=22' },
          { title: '모니터 C', url: 'https://gall.dcinside.com/mgallery/board/view/?no=23' },
          { title: '모니터 D', url: 'https://gall.dcinside.com/mgallery/board/view/?no=24' },
          { title: '모니터 E', url: 'https://gall.dcinside.com/mgallery/board/view/?no=25' },
          { title: '모니터 F', url: 'https://gall.dcinside.com/mgallery/board/view/?no=26' },
        ],
        boardUrl:
          'https://gall.dcinside.com/mgallery/board/lists/?id=mnt&sort_type=N&search_head=70&page=1',
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!모니터'), roomId: 'monitor-posts-room' },
      { ...env, ALLOWED_ROOMS: 'monitor-posts-room' },
      { inven },
    );

    expect(result.reply).toContain('1. 모니터 A');
    expect(result.reply).toContain('5. 모니터 E');
    expect(result.reply).not.toContain('모니터 F');
    expect(result.reply).not.toContain('https://gall.dcinside.com/mgallery/board/view/?no=21');
    expect(result.reply).toContain(
      'https://gall.dcinside.com/mgallery/board/lists/?id=mnt&sort_type=N&search_head=70&page=1',
    );
  });
  it('T-008 maps provider failures without leaking details', async () => {
    const nexon = {
      findCharacter: vi.fn().mockRejectedValue(new Error('PROVIDER_UNAVAILABLE secret-key')),
    };
    const reply = (
      await handleMessage(
        { ...message('!캐릭터 장애'), roomId: 'failure-room' },
        { ...env, ALLOWED_ROOMS: 'failure-room' },
        { nexon },
      )
    ).reply;
    expect(reply).toContain('외부 서비스 오류');
    expect(reply).not.toContain('secret-key');
  });
  it('T-008 maps an AbortError to a timeout response', async () => {
    const nexon = {
      findCharacter: vi
        .fn()
        .mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })),
    };
    const reply = (
      await handleMessage(
        { ...message('!캐릭터 지연'), roomId: 'timeout-room' },
        { ...env, ALLOWED_ROOMS: 'timeout-room' },
        { nexon },
      )
    ).reply;
    expect(reply).toContain('지연되고 있습니다');
  });
  it('NFR-PERF-003 caps provider-derived replies at 1000 characters', async () => {
    const nexon = {
      findCharacter: vi.fn().mockResolvedValue({
        name: '가'.repeat(500),
        world: '나'.repeat(500),
        fetchedAt: '2026-08-26T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!캐릭터 길이'), roomId: 'length-room' },
      { ...env, ALLOWED_ROOMS: 'length-room' },
      { nexon },
    );
    expect(result.reply?.length).toBeLessThanOrEqual(1000);
  });
  it('queries the retail MCP facade without an LLM', async () => {
    const retail = {
      searchDaisoProducts: vi
        .fn()
        .mockResolvedValue([{ id: 'p1', name: '수납박스', price: 5000, pickupAvailable: true }]),
      findNationalFuelPrices: vi
        .fn()
        .mockResolvedValue([{ productName: '휘발유', price: 1800.5, tradeDate: '20260828' }]),
      findLowestFuelStations: vi.fn().mockResolvedValue([
        {
          name: '행운에너지',
          brandName: 'SK에너지',
          price: 1755,
          roadAddress: '경북 칠곡군 약목면 칠곡대로 504',
        },
      ]),
    };
    const exchange = {
      findUsdAndJpyRates: vi.fn().mockResolvedValue({
        usdKrw: 1384.6,
        jpyKrw: 8.7,
        updatedAt: '2026-08-28 00:00 UTC',
      }),
    };
    const retailEnv = { ...env, ALLOWED_ROOMS: 'retail-room' };
    const product = await handleMessage(
      { ...message('!다이소 수납박스'), roomId: 'retail-room' },
      retailEnv,
      { retail },
    );
    const fuel = await handleMessage(
      { ...message('!유가'), roomId: 'fuel-room' },
      { ...env, ALLOWED_ROOMS: 'fuel-room' },
      { retail },
    );
    expect(product.reply).toContain('[다이소 상품 검색: 수납박스]');
    expect(fuel.reply).toContain('[전국 평균 유가]');
    expect(fuel.reply).toContain('휘발유: 1,800.50원');
    const stations = await handleMessage(
      { ...message('!주유소 대구'), roomId: 'fuel-station-room' },
      { ...env, ALLOWED_ROOMS: 'fuel-station-room' },
      { retail },
    );
    expect(stations.reply).toContain('[대구 최저가 주유소 TOP 3]');
    expect(stations.reply).toContain('행운에너지');
    const invalidStations = await handleMessage(
      { ...message('!주유소'), roomId: 'fuel-invalid-room', senderId: 'fuel-invalid-sender' },
      { ...env, ALLOWED_ROOMS: 'fuel-invalid-room' },
      { retail },
    );
    expect(invalidStations.reply).toBe('사용법을 확인해 주세요.');
    const exchangeResult = await handleMessage(
      { ...message('!환율'), roomId: 'exchange-room', senderId: 'exchange-sender' },
      { ...env, ALLOWED_ROOMS: 'exchange-room' },
      { exchange },
    );
    expect(exchangeResult.reply).toContain('[환율]');
    expect(exchangeResult.reply).toContain('달러(USD): 1달러 = 1,384.60원');
    expect(exchangeResult.reply).toContain('엔화(JPY): 100엔 = 870.00원');
  });
});

describe('HTTP boundary', () => {
  it('T-003/T-004 protects and validates the endpoint', async () => {
    const handler = { fetch: httpHandler };
    expect(
      (
        await handler.fetch(
          new Request('https://example.test/v1/messages', {
            method: 'POST',
            body: '{}',
            headers: { authorization: 'Bearer bad' },
          }),
          env,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await handler.fetch(
          new Request('https://example.test/v1/messages', {
            method: 'POST',
            body: '{',
            headers: { authorization: 'Bearer test' },
          }),
          env,
        )
      ).status,
    ).toBe(400);
  });
  it('rejects missing or malformed JSON fields after authentication', async () => {
    const handler = { fetch: httpHandler };
    const response = await handler.fetch(
      new Request('https://example.test/v1/messages', {
        method: 'POST',
        body: JSON.stringify({ message: '!주사위' }),
        headers: { authorization: 'Bearer test' },
      }),
      env,
    );
    expect(response.status).toBe(400);
  });
  it('health is secret-free', async () => {
    const handler = { fetch: httpHandler };
    const response = await handler.fetch(new Request('https://example.test/health'), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
  it('protects and disables notice alerts by default', async () => {
    const handler = { fetch: httpHandler };
    const unauthorized = await handler.fetch(
      new Request('https://example.test/v1/notice-alerts'),
      env,
    );
    expect(unauthorized.status).toBe(401);
    const disabled = await handler.fetch(
      new Request('https://example.test/v1/notice-alerts', {
        headers: { authorization: 'Bearer test' },
      }),
      env,
    );
    expect(disabled.status).toBe(200);
    expect(await disabled.json()).toEqual({ notices: [] });
  });
  it('adapts an API Gateway v2 health event to the Lambda handler', async () => {
    const result = await lambdaHandler({
      version: '2.0',
      routeKey: 'GET /health',
      rawPath: '/health',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {
          method: 'GET',
          path: '/health',
          protocol: 'HTTP/1.1',
          sourceIp: '127.0.0.1',
          userAgent: 'test',
        },
        accountId: 'local',
        domainName: 'local',
        domainPrefix: 'local',
        requestId: 'request-1',
        routeKey: 'GET /health',
        stage: '$default',
        time: '26/Aug/2026:00:00:00 +0000',
        timeEpoch: 0,
      },
      isBase64Encoded: false,
      stageVariables: undefined,
      body: undefined,
      cookies: undefined,
      queryStringParameters: undefined,
      pathParameters: undefined,
    } as unknown as APIGatewayProxyEventV2);
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ status: 'ok' });
  });
  it('rejects oversized HTTP payloads with 413', async () => {
    const handler = { fetch: httpHandler };
    const response = await handler.fetch(
      new Request('https://example.test/v1/messages', {
        method: 'POST',
        body: '{}',
        headers: { authorization: 'Bearer test', 'content-length': '20000' },
      }),
      env,
    );
    expect(response.status).toBe(413);
  });
  it('rejects oversized HTTP payloads even without a content-length header', async () => {
    const handler = { fetch: httpHandler };
    const response = await handler.fetch(
      new Request('https://example.test/v1/messages', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'large',
          roomId: 'room-a',
          senderId: 'sender',
          message: '가'.repeat(10000),
        }),
        headers: { authorization: 'Bearer test' },
      }),
      env,
    );
    expect(response.status).toBe(413);
  });
  it('combines the three hot-deal sources into mobile sections', async () => {
    const inven = {
      findHotDeals: vi.fn().mockResolvedValue({
        posts: [{ title: '퀘이사존 핫딜' }],
        boardUrl: 'https://quasarzone.com/bbs/qb_saleinfo',
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
      findArcaLiveHotDeals: vi.fn().mockResolvedValue({
        posts: [{ title: '아카라이브 핫딜' }],
        boardUrl: 'https://arca.live/b/hotdeal',
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
      findFmKoreaHotDeals: vi.fn().mockResolvedValue({
        posts: [{ title: '에펨코리아 핫딜' }],
        boardUrl: 'https://www.fmkorea.com/hotdeal',
        fetchedAt: '2026-08-28T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!핫딜'), roomId: 'multi-hotdeal-room' },
      { ...env, ALLOWED_ROOMS: 'multi-hotdeal-room' },
      { inven, now: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    );

    expect(result.reply).toContain('【퀘이사존】');
    expect(result.reply).toContain('【아카라이브】');
    expect(result.reply).toContain('【에펨코리아】');
    expect(result.reply).toContain('0. 퀘이사존 핫딜');
    expect(result.reply).toContain('1. 아카라이브 핫딜');
    expect(result.reply).toContain('1. 에펨코리아 핫딜');
    expect(inven.findHotDeals).toHaveBeenCalledOnce();
    expect(inven.findArcaLiveHotDeals).toHaveBeenCalledOnce();
    expect(inven.findFmKoreaHotDeals).toHaveBeenCalledOnce();
  });
});
