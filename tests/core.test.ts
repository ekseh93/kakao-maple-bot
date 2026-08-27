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
} from '@kakao-maple-bot/core';

describe('core commands (FR-001..008, T-001, T-009..013, T-019)', () => {
  it('T-001 ignores ordinary chat', () => expect(parseCommand('안녕하세요')).toBeNull());
  it('accepts slash experience history commands', () =>
    expect(parseCommand('/경험치 테스트')).toEqual({ name: 'experience', args: ['테스트'] }));
  it('accepts both Sunday Maple command spellings', () => {
    expect(parseCommand('!썬데이')).toEqual({ name: 'sunday', args: [] });
    expect(parseCommand('!선데이')).toEqual({ name: 'sunday', args: [] });
  });
  it('parses aliases and unknown commands as help', () => {
    expect(parseCommand(' !도움말 ')?.name).toBe('help');
    expect(parseCommand('!unknown')?.name).toBe('help');
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
  it('rejects the retired food category argument', () =>
    expect(() => formatFoodRecommendation(['한식'])).toThrow('INVALID_USAGE'));
});
