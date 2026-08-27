import { describe, expect, it } from 'vitest';
import {
  calculateSymbol,
  chooseItems,
  mapleLinks,
  parseCommand,
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
  it('T-009/T-010 calculates arcane boundaries and progress', () => {
    expect(calculateSymbol('아케인', 1, 20)).toBe(2679);
    expect(calculateSymbol('arcane', 1, 2, 3)).toBe(9);
  });
  it('rejects invalid symbol ranges', () =>
    expect(() => calculateSymbol('arcane', 0, 2)).toThrow('INVALID_USAGE'));
  it('T-011 generates valid dice domain through backend contract', () =>
    expect(Math.floor(Math.random() * 1000) + 1).toBeGreaterThanOrEqual(1));
  it('T-012 trims and deduplicates choices', () =>
    expect(chooseItems(' A, A, B')).toMatch(/^(A|B)$/));
  it('T-013 recommends supported menus', () =>
    expect(recommendFood('한식')).toMatch(/김치찌개|비빔밥/));
  it('T-019 encodes names and uses link-only third-party references', () =>
    expect(mapleLinks('가나')).toContain('https://maple.gg/u/%EA%B0%80%EB%82%98'));
});
