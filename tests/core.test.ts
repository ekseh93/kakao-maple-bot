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
  formatNetflixRecommendation,
  formatAnimeRecommendation,
  formatBossRewards,
  formatBossRewardSummaries,
  formatBossLevelBoost,
  formatMekaBerry,
  formatMepoEfficiency,
  formatMaxLevelSymbolEffects,
  formatFortune,
  formatBoutiqueGiftDraw,
  formatRoyalDraw,
  formatLunaCrystalSweetDraw,
  formatLunaCrystalDreamDraw,
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
  it('parses the Naver webtoon recommendation command', () =>
    expect(parseCommand('!웹툰')).toEqual({ name: 'webtoon', args: [] }));
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
  it('parses the Mabbak Dorosi author-search command', () =>
    expect(parseCommand('!마빡도로시')).toEqual({ name: 'mabbakDorosi', args: [] }));
  it('parses the weekly new product command', () =>
    expect(parseCommand('!금주의신상')).toEqual({ name: 'weeklyNewProduct', args: [] }));
  it('parses the Discord link command', () =>
    expect(parseCommand('!디코')).toEqual({ name: 'discord', args: [] }));
  it('parses and formats the Grandis and Black Mage boss table', () => {
    expect(parseCommand('!보스')).toEqual({ name: 'boss', args: [] });
    const output = formatBossRewards();
    expect(output).toContain('[그란디스·검은 마법사 보스 결정 가격]');
    expect(output).toContain('이지');
    expect(output).toContain('익스트림');
    expect(output).toContain('검은 마법사');
    expect(output).toContain('8,740,000,000');
    expect(output).toContain('출처: https://matsu1207.tistory.com/757');
    expect(() => formatBossRewards(['닉네임'])).toThrow('INVALID_USAGE');
  });
  it('parses and formats the boss reward summary from Swoo to Velona', () => {
    expect(parseCommand('!보스보상')).toEqual({ name: 'bossRewards', args: [] });
    const output = formatBossRewardSummaries();
    expect(output).toContain('[보스 주요 보상]');
    expect(output).toContain('스우');
    expect(output).toContain('검은 마법사');
    expect(output).toContain('벨로나');
    expect(output).toContain('앱솔랩스 방어구/무기 상자');
    expect(output).toContain('출처: https://matsu1207.tistory.com/937');
    expect(() => formatBossRewardSummaries(['스우'])).toThrow('INVALID_USAGE');
  });
  it('parses and formats boss levels and level-difference damage', () => {
    expect(parseCommand('!보스렙뻥')).toEqual({ name: 'bossLevelBoost', args: [] });
    const output = formatBossLevelBoost();
    expect(output).toContain('[보스 레벨 및 레벨 차이 보정]');
    expect(output).toContain('검은 마법사(하드)');
    expect(output).toContain('1·4페이즈 265 / 2·3페이즈 275');
    expect(output).toContain('벨로나');
    expect(output).toContain('+5 이상');
    expect(output).toContain('105.3%');
    expect(output).toContain('출처: https://matsu1207.tistory.com/772');
    expect(() => formatBossLevelBoost(['하드'])).toThrow('INVALID_USAGE');
  });
  it('parses and formats Meka Berry rates for levels 280 through 299', () => {
    expect(parseCommand('!메카베리 280')).toEqual({ name: 'mekaBerry', args: ['280'] });
    expect(formatMekaBerry(['280'])).toContain('메카베리             │ 9.705%');
    expect(formatMekaBerry(['280'])).toContain('크림슨 메카베리      │ 15.097%');
    expect(formatMekaBerry(['299'])).toContain('0.467%');
    expect(() => formatMekaBerry(['279'])).toThrow('INVALID_USAGE');
    expect(() => formatMekaBerry([])).toThrow('INVALID_USAGE');
  });
  it('parses and formats meso-point experience efficiency in descending order', () => {
    expect(parseCommand('!메포효율')).toEqual({ name: 'mepoEfficiency', args: [] });
    const output = formatMepoEfficiency();
    expect(output).toContain('[메포 대비 경험치 효율]');
    expect(output.indexOf('선데이몬파')).toBeLessThan(output.indexOf('하이마운틴'));
    expect(output.indexOf('하이마운틴')).toBeLessThan(output.indexOf('메카베리'));
    expect(output).toContain('17.8070');
    expect(output).toContain('출처: https://www.inven.co.kr/board/maple/2304/48140');
    expect(() => formatMepoEfficiency(['284'])).toThrow('INVALID_USAGE');
  });
  it('parses and formats max-level Authentic Symbol effects', () => {
    expect(parseCommand('!심볼만렙')).toEqual({ name: 'symbolMax', args: [] });
    const output = formatMaxLevelSymbolEffects();
    expect(output).toContain('[어센틱 심볼 만렙 효과]');
    expect(output).toContain('세르니움');
    expect(output).toContain('선택받은 세렌 공격 시 데미지 +20%');
    expect(output).toContain('아르테리아');
    expect(output).toContain('벨로나 공격 시 데미지 +20%');
    expect(output).toContain('기어드락');
    expect(output).toContain('출처: https://matsu1207.tistory.com/1052');
    expect(() => formatMaxLevelSymbolEffects(['11'])).toThrow('INVALID_USAGE');
  });
  it('parses aliases and unknown commands as help', () => {
    expect(parseCommand(' !도움말 ')?.name).toBe('help');
    expect(parseCommand('!unknown')?.name).toBe('help');
    expect(parseCommand('!정보 테스트')).toEqual({ name: 'character', args: ['테스트'] });
    expect(parseCommand('!유챔 테스트')).toEqual({ name: 'unionChampion', args: ['테스트'] });
  });
  it('parses the Wonder Berry command', () =>
    expect(parseCommand('!원더베리')).toEqual({ name: 'wonderBerry', args: [] }));
  it('labels rare Wonder Berry results and omits metadata', () => {
    const output = formatWonderBerryDraw(
      [{ name: '원더 블랙 펫', probability: 100, category: '희귀' }],
      'https://example.com/probability',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(output).toContain('[블랙] 원더 블랙 펫');
    expect(output).not.toContain('https://example.com/probability');
    expect(output).not.toContain('기준: Nexon 공식 확률 페이지');
    expect(output).not.toContain('실제 구매가 아닌');
  });
  it('formats nine normal Boutique Gift draws and one Fever Time draw', () => {
    const output = formatBoutiqueGiftDraw(
      [{ name: '부티크 티켓 1개', probability: 100 }],
      [{ name: '부티크 티켓 10개', probability: 100 }],
      () => 0,
    );
    expect(output).toContain('[부티크 기프트 10개 열기]');
    expect(output).toContain('9. 부티크 티켓 1개');
    expect(output).toContain('10. [피버 타임] 부티크 티켓 10개');
    expect(output).not.toContain('기준: Nexon 공식 확률 페이지');
    expect(output).not.toContain('실제 아이템을 지급하지 않는');
    expect(output).not.toContain('https://example.com/boutique');
  });
  it('labels only Royal special-label items and Luna petit pets', () => {
    const royal = formatRoyalDraw(
      [
        { name: '테스트 일반 아이템', probability: 50 },
        { name: '테스트 스페셜 라벨', probability: 50 },
      ],
      'https://example.com/royal',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0.75,
    );
    expect(royal).toContain('[스페셜 라벨] 테스트 스페셜 라벨');
    expect(royal).not.toContain('[라벨]');
    expect(royal).not.toContain('[스페셜 라벨] 테스트 일반 아이템');
    const luna = formatLunaCrystalSweetDraw(
      '일반',
      [
        { name: '루나 쁘띠펫 테스트', probability: 50, category: '루나 쁘띠 펫' },
        { name: '루나 스윗펫 테스트', probability: 50, category: '루나 스윗 펫' },
      ],
      'https://example.com/luna',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0.75,
    );
    expect(luna).toContain('[스윗] 루나 스윗펫 테스트');
    expect(luna).not.toContain('[쁘티]');
    expect(luna).not.toContain('기준: Nexon');
    expect(luna).not.toContain('https://example.com/luna');
  });
  it('labels Luna Dream and petit pets from official categories', () => {
    const dream = formatLunaCrystalDreamDraw(
      '일반',
      [{ name: '테스트 펫', probability: 100, category: '루나 드림 펫' }],
      'https://example.com/luna-dream',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    const petit = formatLunaCrystalDreamDraw(
      '일반',
      [{ name: '테스트 펫', probability: 100, category: '루나 쁘띠 펫' }],
      'https://example.com/luna-dream',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(dream).toContain('[뒤진펫] 테스트 펫');
    expect(petit).toContain('[쁘띠] 테스트 펫');
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
  it('T-012 trims and deduplicates comma or space-separated choices', () => {
    expect(chooseItems(' A, A, B')).toMatch(/^(A|B)$/);
    expect(chooseItems(' A A B')).toMatch(/^(A|B)$/);
  });
  it('T-013 recommends one item with expanded food categories and a boosted farming option', () => {
    const probabilities = foodProbabilities();
    const normal = probabilities.find((item) => item.name === '김치찌개')!;
    const farming = probabilities.find((item) => item.name === '재획')!;
    const output = formatFoodRecommendation([], () => 0);
    expect(output).toContain('[오늘 뭐먹지]');
    expect(output).toContain('추천:');
    expect(output).not.toContain('전체 요리 확률');
    expect(output.split('\n')).toHaveLength(2);
    expect(farming.weight / normal.weight).toBeCloseTo(11, 3);
    expect(probabilities.map((item) => item.name)).toEqual(
      expect.arrayContaining(['감자튀김', '마카롱', '두부김치']),
    );
  });
  it('recommends a Japan prefecture and city without external calls', () => {
    expect(formatJapanTravelRecommendation([], () => 0)).toContain('현/도: 홋카이도');
    expect(formatJapanTravelRecommendation([], () => 0)).toContain('도시: 삿포로');
    expect(formatJapanTravelRecommendation([], () => 0.999999)).toContain('현/도: 오키나와현');
    expect(() => formatJapanTravelRecommendation(['도쿄'])).toThrow('INVALID_USAGE');
  });
  it('recommends a Netflix title and an anime category without external calls', () => {
    expect(formatNetflixRecommendation(() => 0)).toContain('오징어 게임');
    const anime = formatAnimeRecommendation(() => 0);
    expect(anime).toContain('[일본 애니메이션 랜덤 추천]');
    expect(anime).toContain('분류: 완결');
  });
  it('formats a date-stable entertainment fortune for a birth year', () => {
    const now = new Date('2026-08-27T03:00:00.000Z');
    const first = formatFortune(['00년생'], now);
    expect(first).toContain('[오늘의 운세]');
    expect(first).toContain('출생연도: 2000년생');
    expect(first).toBe(formatFortune(['00년생'], now));
    expect(formatFortune(['93'], now)).toContain('출생연도: 1993년생');
    expect(formatFortune(['93년생'], now)).toContain('출생연도: 1993년생');
    expect(formatFortune(['2000'], now)).toContain('출생연도: 2000년생');
  });
  it('rejects the retired food category argument', () =>
    expect(() => formatFoodRecommendation(['한식'])).toThrow('INVALID_USAGE'));
});
