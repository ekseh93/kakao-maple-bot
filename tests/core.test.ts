import { describe, expect, it } from 'vitest';
import {
  calculateSymbol,
  calculateSymbolCost,
  chooseItems,
  drawRoyalStyles,
  parseRoyalOptions,
  validateRegion,
  parseCommand,
  playRps,
  formatFoodRecommendation,
  foodProbabilities,
  formatWonderBerryDraw,
  formatJapanTravelRecommendation,
  formatFortune,
  formatBoutiqueGiftDraw,
  formatMasterpieceDraw,
  formatRoyalDraw,
  formatLunaCrystalSweetDraw,
  drawLottoNumbers,
  formatLotto,
} from '@kakao-maple-bot/core';

describe('core commands (FR-001..008, T-001, T-009..013, T-019)', () => {
  it('T-001 ignores ordinary chat', () => expect(parseCommand('안녕하세요')).toBeNull());
  it('accepts slash experience history commands', () =>
    expect(parseCommand('/경험치 테스트')).toEqual({ name: 'experience', args: ['테스트'] }));
  it('accepts both Sunday Maple command spellings', () => {
    expect(parseCommand('!썬데이')).toEqual({ name: 'sunday', args: [] });
    expect(parseCommand('!선데이')).toEqual({ name: 'sunday', args: [] });
  });
  it('parses and formats the Korean and Japanese lotto command', () => {
    expect(parseCommand('!로또')).toEqual({ name: 'lotto', args: [] });
    let randomValue = 0;
    const random = () => (randomValue++ % 100) / 100;
    const numbers = drawLottoNumbers(45, 6, random);
    expect(numbers).toHaveLength(6);
    expect(new Set(numbers).size).toBe(6);
    expect(numbers.every((number) => number >= 1 && number <= 45)).toBe(true);
    randomValue = 0;
    const output = formatLotto(random);
    expect(output).toContain('한국 로또 6/45: 01, 02, 03, 04, 05, 06');
    expect(output).toContain('일본 로또7: 05, 06, 07, 08, 09, 10, 11');
    expect(output).toContain('실제 복권 구매');
  });

  it('parses the Inven hot-post command', () =>
    expect(parseCommand('!인벤')).toEqual({ name: 'inven', args: [] }));
  it('parses aliases and unknown commands as help', () => {
    expect(parseCommand(' !도움말 ')?.name).toBe('help');
    expect(parseCommand('!unknown')?.name).toBe('help');
    expect(parseCommand('!정보 테스트')).toEqual({ name: 'character', args: ['테스트'] });
    expect(parseCommand('!유챔 테스트')).toEqual({ name: 'unionChampion', args: ['테스트'] });
  });
  it('parses the Wonder Berry command', () =>
    expect(parseCommand('!원더베리')).toEqual({ name: 'wonderBerry', args: [] }));
  it('labels Wonder Black results and omits the source URL', () => {
    const output = formatWonderBerryDraw(
      [{ name: '원더 블랙 펫', probability: 100 }],
      'https://example.com/probability',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(output).toContain('[원더 블랙] 원더 블랙 펫');
    expect(output).not.toContain('https://example.com/probability');
  });
  it('formats nine normal Boutique Gift draws and one Fever Time draw', () => {
    const output = formatBoutiqueGiftDraw(
      [{ name: '부티크 티켓 1개', probability: 100 }],
      [{ name: '부티크 티켓 10개', probability: 100 }],
      'https://example.com/boutique',
      '2026-08-27T00:00:00.000Z',
      () => 0,
    );
    expect(output).toContain('[부티크 기프트 10개 열기]');
    expect(output).toContain('9. 부티크 티켓 1개');
    expect(output).toContain('10. [피버 타임] 부티크 티켓 10개');
  });
  it('formats one official Red and Black Masterpiece result', () => {
    const output = formatMasterpieceDraw(
      [{ name: '마스터 어밴든 세트 선택권', probability: 7.3539 }],
      [{ name: '마스터 어밴든 헤어 쿠폰', probability: 5.8135 }],
      'https://example.com/red',
      'https://example.com/black',
      '2026-08-27T00:00:00.000Z',
      () => 0,
    );
    expect(output).toContain('[마스터피스 레드·블랙 시뮬레이션]');
    expect(output).toContain('레드: [마라벨] 마스터 어밴든 세트 선택권 (7.3539%)');
    expect(output).toContain('블랙: [마라벨] 마스터 어밴든 헤어 쿠폰 (5.8135%)');
  });
  it('adds the requested labels to Royal and Luna results', () => {
    const royal = formatRoyalDraw(
      [{ name: '로얄 테스트', probability: 100 }],
      'https://example.com/royal',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(royal).toContain('[라벨] 로얄 테스트');
    const luna = formatLunaCrystalSweetDraw(
      '일반',
      [{ name: '루나 쁘띠펫 테스트', probability: 100 }],
      'https://example.com/luna',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(luna).toContain('[쁘띠] 루나 쁘띠펫 테스트');
  });
  it('uses the shared count and result options for Wonder Berry', () =>
    expect(parseRoyalOptions(['25', 'false'])).toEqual({ count: 25, showResults: false }));
  it('parses the simplified Luna Crystal Sweet command', () =>
    expect(parseCommand('!루나스윗')).toEqual({
      name: 'lunaSweet',
      args: [],
    }));
  it('parses the simplified Luna Crystal Dream command', () =>
    expect(parseCommand('!루나드림')).toEqual({
      name: 'lunaDream',
      args: [],
    }));
  it('validates global weather region input', () => {
    expect(validateRegion('New York')).toBe('New York');
    expect(() => validateRegion('')).toThrow('INVALID_USAGE');
  });
  it('draws ten royal items using weighted probabilities', () => {
    const draws = drawRoyalStyles(
      [
        { name: 'A', probability: 90 },
        { name: 'B', probability: 10 },
      ],
      10,
      () => 0.95,
    );
    expect(draws).toHaveLength(10);
    expect(draws.every((item) => item.name === 'B')).toBe(true);
  });
  it('parses Royal Style count and result visibility options', () => {
    expect(parseRoyalOptions(['25', 'false'])).toEqual({ count: 25, showResults: false });
    expect(() => parseRoyalOptions(['26'])).toThrow('INVALID_USAGE');
    expect(() => parseRoyalOptions(['5', 'maybe'])).toThrow('INVALID_USAGE');
  });
  it('keeps help examples aligned with registered commands', () =>
    expect(parseCommand('!도움말')).toBeTruthy());
  it('T-009/T-010 calculates named arcane/authentic regions and progress', () => {
    expect(calculateSymbol('여로', 1, 20)).toBe(2679);
    expect(calculateSymbol('기어드락', 1, 11)).toBe(4565);
    expect(calculateSymbol('츄츄', 1, 2, 3)).toBe(9);
  });
  it('includes region-specific symbol upgrade meso costs', () => {
    expect(calculateSymbolCost('여로', 1, 2)).toBe(970000);
    expect(calculateSymbolCost('세르니움', 1, 2)).toBe(36500000);
    expect(calculateSymbolCost('기어드락', 1, 2)).toBe(139700000);
  });
  it('rejects invalid symbol ranges', () =>
    expect(() => calculateSymbol('arcane', 0, 2)).toThrow('INVALID_USAGE'));
  it('supports rock-paper-scissors and taunts after a win', () => {
    expect(playRps('가위', () => 0.66)).toContain('졌다');
    expect(playRps('가위', () => 0.66)).toContain('내가 이겼지롱');
    expect(playRps('가위', () => 0.8)).toContain('이겼다');
  });
  it('removes the retired maple link command', () =>
    expect(parseCommand('!메이플링크 닉네임')?.name).toBe('help'));
  it('supports article-inspired aliases without adding a new provider call', () => {
    expect(parseCommand('!정보 닉네임')).toEqual({ name: 'character', args: ['닉네임'] });
    expect(parseCommand('!심볼계산 기어드락 1 11')).toEqual({
      name: 'symbol',
      args: ['기어드락', '1', '11'],
    });
  });
  it('T-012 trims and deduplicates choices', () =>
    expect(chooseItems(' A, A, B')).toMatch(/^(A|B)$/));
  it('T-013 recommends the complete food list with a boosted farming option', () => {
    const probabilities = foodProbabilities();
    const normal = probabilities.find((item) => item.name === '김치찌개')!;
    const farming = probabilities.find((item) => item.name === '재획')!;
    expect(formatFoodRecommendation([], () => 0)).toContain('전체 요리 확률');
    expect(formatFoodRecommendation([], () => 0)).toContain('재획:');
    expect(farming.weight / normal.weight).toBeCloseTo(1.5, 3);
  });
  it('recommends a Japan prefecture and city without external calls', () => {
    expect(formatJapanTravelRecommendation([], () => 0)).toContain('현/도: 도쿄도');
    expect(formatJapanTravelRecommendation([], () => 0)).toContain('도시: 도쿄');
    expect(() => formatJapanTravelRecommendation(['도쿄'])).toThrow('INVALID_USAGE');
  });
  it('formats a date-stable entertainment fortune for a birth year', () => {
    const now = new Date('2026-08-27T03:00:00.000Z');
    const first = formatFortune(['00년생'], now);
    expect(first).toContain('[오늘의 운세]');
    expect(first).toContain('출생연도: 2000년생');
    expect(first).toBe(formatFortune(['00년생'], now));
    expect(() => formatFortune(['2000'])).toThrow('INVALID_USAGE');
  });
  it('rejects the retired food category argument', () =>
    expect(() => formatFoodRecommendation(['한식'])).toThrow('INVALID_USAGE'));
});
