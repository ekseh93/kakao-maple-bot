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
  it('T-005 returns bounded help for unknown commands', async () =>
    expect((await handleMessage(message('!없는명령'), env)).reply).toContain('[봇 도움말]'));
  it('T-004 rejects an oversized command before any provider work', async () => {
    const nexon = { findCharacter: vi.fn() };
    const result = await handleMessage(message(`!캐릭터 ${'가'.repeat(301)}`), env, { nexon });
    expect(result.reply).toContain('사용법');
    expect(nexon.findCharacter).not.toHaveBeenCalled();
  });
  it('returns the configured manual Elysium fragment price', async () => {
    const result = await handleMessage(
      { ...message('!조각'), roomId: 'fragment-room', senderId: 'fragment-sender' },
      {
        ...env,
        ALLOWED_ROOMS: 'fragment-room',
        SOL_ERDA_FRAGMENT_PRICE: '850000',
        SOL_ERDA_FRAGMENT_PRICE_UPDATED_AT: '2026-08-27',
      },
    );
    expect(result.reply).toContain('850,000메소/개');
    expect(result.reply).toContain('수동 입력값');
  });
  it('T-018 creates only non-identifying structured audit fields', () => {
    const log = createAuditLog({
      requestId: 'request-1',
      command: 'character',
      outcome: 'success',
      latencyMs: 12.4,
      provider: 'nexon',
      cacheStatus: 'miss',
    });
    expect(log).toEqual({
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
        change: 100,
        changeRate: 0.14,
        volume: 123,
        fetchedAt: '2026-08-26T15:30:00+09:00',
      }),
    };
    const result = await handleMessage(
      { ...message('!주식 005930'), roomId: 'quote-room' },
      stockEnv,
      { stock },
    );
    expect(result.reply).toContain('삼성전자 (005930)');
    expect(result.reply).toContain('조회: 2026-08-26T15:30:00+09:00');
    expect(result.reply).toContain('투자 권유가 아닙니다');
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
        change: 100,
        changeRate: 0.14,
        fetchedAt: '2026-08-26T00:00:00.000Z',
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
  it('handles HEXA core lookup with a readable template', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findHexa: vi.fn().mockResolvedValue({
        name: '헥사캐릭터',
        cores: [{ name: '마스터리', level: 30, type: '마스터리', linkedSkills: ['스킬'] }],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!헥사 헥사캐릭터'), roomId: 'hexa-room', senderId: 'hexa-sender' },
      { ...env, ALLOWED_ROOMS: 'hexa-room' },
      { nexon },
    );
    expect(result.reply).toContain('캐릭터: 헥사캐릭터');
    expect(result.reply).toContain('▸ 마스터리\n  코어: 마스터리');
    expect(result.reply).toContain('레벨: Lv.30');
    expect(result.reply).toContain('연결 스킬: 스킬');
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
    expect(result.reply).toContain('2026-08-27');
    expect(result.reply).toContain('7일 변화: +7.00%');
    expect(result.reply).toContain('일평균: 1.00%');
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
  it('handles ongoing event lookup with dates and official links', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findEvents: vi.fn().mockResolvedValue({
        events: [
          {
            title: '진행 이벤트',
            url: 'https://maplestory.nexon.com/News/Event/1',
            startDate: '2026-08-01T00:00:00.000Z',
            endDate: '2026-08-31T00:00:00.000Z',
          },
        ],
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!이벤트'), roomId: 'event-room', senderId: 'event-sender' },
      { ...env, ALLOWED_ROOMS: 'event-room' },
      { nexon },
    );
    expect(result.reply).toContain('[메이플스토리 진행 중 이벤트]');
    expect(result.reply).toContain('2026-08-01~2026-08-31');
    expect(result.reply).toContain('https://maplestory.nexon.com/News/Event/1');
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
    expect((result.reply?.match(/^\d+\./gm) ?? [])).toHaveLength(10);
    expect(result.reply).toContain('실제 구매가 아닌');
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
    expect((result.reply?.match(/^\d+\./gm) ?? [])).toHaveLength(0);
  });
  it('handles ten weighted Wonder Berry draws', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findWonderBerry: vi.fn().mockResolvedValue({
        items: [
          { name: '테스트 원더 블랙 펫', probability: 3.32 },
          { name: '테스트 원더 쿠키', probability: 15.02 },
        ],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability/WispsWonderBerry',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('!원더베리'), roomId: 'wonder-room', senderId: 'wonder-sender' },
      { ...env, ALLOWED_ROOMS: 'wonder-room' },
      { nexon },
    );
    expect(result.reply).toContain('[위습의 원더베리 10회 뽑기]');
    expect((result.reply?.match(/^\d+\./gm) ?? [])).toHaveLength(10);
    expect(result.reply).toContain('실제 구매가 아닌');
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
      { ...message('/원더베리 25 false'), roomId: 'wonder-count-room', senderId: 'wonder-count-sender' },
      { ...env, ALLOWED_ROOMS: 'wonder-count-room' },
      { nexon },
    );
    expect(result.reply).toContain('[위습의 원더베리 25회 뽑기]');
    expect(result.reply).toContain('상세 결과: 숨김');
    expect((result.reply?.match(/^\d+\./gm) ?? [])).toHaveLength(0);
  });
  it('handles normal and special Luna Crystal Sweet draws', async () => {
    const nexon = {
      findCharacter: vi.fn(),
      findLunaCrystalSweet: vi.fn().mockResolvedValue({
        kind: '스페셜',
        items: [{ name: '테스트 루나 펫', probability: 100 }],
        sourceUrl: 'https://maplestory.nexon.com/Guide/CashShop/Probability/SpecialLunaCrystalSweet',
        fetchedAt: '2026-08-27T00:00:00.000Z',
      }),
    };
    const result = await handleMessage(
      { ...message('/루나스윗 스페셜 25 true'), roomId: 'luna-room', senderId: 'luna-sender' },
      { ...env, ALLOWED_ROOMS: 'luna-room' },
      { nexon },
    );
    expect(result.reply).toContain('[스페셜 루나 크리스탈 스윗 25회 뽑기]');
    expect((result.reply?.match(/^\d+\./gm) ?? [])).toHaveLength(25);
    expect(nexon.findLunaCrystalSweet).toHaveBeenCalledWith('스페셜', expect.anything());
  });
  it('handles normal and special Luna Crystal Dream draws', async () => {
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
      { ...message('/루나드림 일반 25 true'), roomId: 'dream-room', senderId: 'dream-sender' },
      { ...env, ALLOWED_ROOMS: 'dream-room' },
      { nexon },
    );
    expect(result.reply).toContain('[일반 루나 크리스탈 드림 25회 뽑기]');
    expect((result.reply?.match(/^\d+\./gm) ?? [])).toHaveLength(25);
    expect(nexon.findLunaCrystalDream).toHaveBeenCalledWith('일반', expect.anything());
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
});
