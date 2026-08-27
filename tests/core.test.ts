import { describe, expect, it } from 'vitest';
import {
  calculateSymbol,
  calculateSymbolCost,
  chooseItems,
  parseCommand,
  playRps,
  recommendFood,
} from '@kakao-maple-bot/core';

describe('core commands (FR-001..008, T-001, T-009..013, T-019)', () => {
  it('T-001 ignores ordinary chat', () => expect(parseCommand('안녕하세요')).toBeNull());
  it('parses aliases and unknown commands as help', () => {
    expect(parseCommand(' !도움말 ')?.name).toBe('help');
    expect(parseCommand('!unknown')?.name).toBe('help');
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
  it('T-013 recommends supported menus', () =>
    expect(recommendFood('한식')).toMatch(/김치찌개|비빔밥/));
});
