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
  formatBossForceBoost,
  formatMekaBerry,
  formatSauna,
  formatEpicDungeon,
  formatMepoEfficiency,
  formatMaxLevelSymbolEffects,
  formatFortune,
  formatBoutiqueGiftDraw,
  formatWhiteJadeBossRingBoxDraw,
  formatBlackAccessoryBoxDraw,
  formatRoyalDraw,
  formatLunaCrystalSweetDraw,
  formatLunaCrystalDreamDraw,
  drawLottoNumbers,
  formatLotto,
  formatHotDeals,
  formatHotDealSections,
  formatUsageStats,
  FORMATTED_HELP,
} from '@kakao-maple-bot/core';

describe('core commands (FR-001..008, T-001, T-009..013, T-019)', () => {
  it('keeps help commands grouped and aligned in two sections', () => {
    expect(FORMATTED_HELP).toContain('【메이플스토리】');
    expect(FORMATTED_HELP).toContain('【미니 게임】');
    expect(FORMATTED_HELP).toContain('【기타 기능】');
    expect(FORMATTED_HELP).toContain('!보스포뻥');
    expect(FORMATTED_HELP).toContain('!주식 <이름>');
    expect(FORMATTED_HELP).toContain('• !마빡도로시');
    expect(FORMATTED_HELP).toContain('• !가위 / !바위 / !보');
    expect(FORMATTED_HELP).toContain('• !사우나 <레벨 또는 닉네임>');
    expect(FORMATTED_HELP).toContain('• !시드링');
    expect(FORMATTED_HELP).toContain('• !칠흑깡');
    expect(FORMATTED_HELP).toContain('  └ 현재 장비·전투력·잠재 합계');
    expect(FORMATTED_HELP).toContain('  └ 백옥 상자 5회·링/레벨 최종확률');
    expect(FORMATTED_HELP).toContain('• !주유소 <지역>');
    expect(FORMATTED_HELP).toContain('• !일본여행기');
    expect(FORMATTED_HELP).toContain('디시인사이드 일본여행 최신 글 3개');
    expect(FORMATTED_HELP).toContain('디시인사이드 모니터 최신 글 5개');
    expect(FORMATTED_HELP).toContain('• !주유소');
    expect(FORMATTED_HELP).toContain('  └ 예: 931201 남성 양력');
    expect(FORMATTED_HELP).toContain('• !정보 <닉네임>');
    expect(FORMATTED_HELP).toContain('  └ 캐릭터 조회');
    expect(FORMATTED_HELP.indexOf('• !날씨 <지역>')).toBeLessThan(
      FORMATTED_HELP.indexOf('• !주식 <이름>'),
    );
    expect(FORMATTED_HELP.indexOf('• !주식 <이름>')).toBeLessThan(
      FORMATTED_HELP.indexOf('• !환율'),
    );
    expect(FORMATTED_HELP.indexOf('• !다이소 <상품>')).toBeLessThan(
      FORMATTED_HELP.indexOf('• !상태'),
    );
    expect(FORMATTED_HELP).toContain('• !통계');
  });
  it('formats the anonymous total command count', () => {
    expect(formatUsageStats(1234)).toBe('[봇 사용 통계]\n현재까지 명령어 호출: 1,234회');
  });
  it('keeps only the Quasar Zone hot-deal board link', () => {
    const output = formatHotDeals(
      [{ title: '상품 A', url: 'https://quasarzone.com/bbs/qb_saleinfo/views/1' }],
      'https://quasarzone.com/bbs/qb_saleinfo',
    );
    expect(output).toContain('1. 상품 A');
    expect(output).toContain('게시판: https://quasarzone.com/bbs/qb_saleinfo');
    expect(output).not.toContain('/views/1');
  });
  it('formats three hot-deal sources as compact mobile sections', () => {
    const output = formatHotDealSections([
      {
        source: '퀘이사존',
        posts: [{ title: '퀘이사존 상품 A', postedAt: '08.28' }],
        boardUrl: 'https://quasarzone.com/bbs/qb_saleinfo',
      },
      {
        source: '아카라이브',
        posts: [{ title: '아카라이브 상품 A' }],
        boardUrl: 'https://arca.live/b/hotdeal',
      },
      {
        source: '에펨코리아',
        posts: [{ title: '에펨코리아 상품 A' }],
        boardUrl: 'https://www.fmkorea.com/hotdeal',
      },
    ]);
    expect(output).toContain('【퀘이사존】');
    expect(output).toContain('【아카라이브】');
    expect(output).toContain('【에펨코리아】');
    expect(output).toContain('0. 퀘이사존 상품 A (08.28)');
    expect(output).not.toContain('/views/');
  });
  it('T-001 ignores ordinary chat', () => expect(parseCommand('안녕하세요')).toBeNull());
  it('parses the usage statistics command', () =>
    expect(parseCommand('!통계')).toEqual({ name: 'usageStats', args: [] }));
  it('accepts slash experience history commands', () =>
    expect(parseCommand('/경험치 테스트')).toEqual({ name: 'experience', args: ['테스트'] }));
  it('accepts both Sunday Maple command spellings', () => {
    expect(parseCommand('!썬데이')).toEqual({ name: 'sunday', args: [] });
    expect(parseCommand('!선데이')).toEqual({ name: 'sunday', args: [] });
  });
  it('parses the Naver webtoon recommendation command', () =>
    expect(parseCommand('!웹툰')).toEqual({ name: 'webtoon', args: [] }));
  it('parses the web novel recommendation command', () =>
    expect(parseCommand('!웹소설')).toEqual({ name: 'webNovel', args: [] }));
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
    expect(output).toContain('단위: 억 메소');
    expect(output).toContain('• 검은 마법사\n  └ 하드: 6.65억\n  └ 익스트림: 87.4억');
    expect(output).toContain('• 세렌\n  └ 노말: 2.39억\n  └ 하드: 3.56억\n  └ 익스트림: 28.35억');
    expect(output).not.toContain('└ 이지: -');
    expect(output).not.toContain('└ 노말: -');
    expect(output).not.toContain('8,740,000,000');
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
    expect(output).toContain('1·4페이즈 265');
    expect(output).toContain('2·3페이즈 275');
    expect(output).toContain('벨로나');
    expect(output).toContain('+5 이상');
    expect(output).toContain('105.3%');
    expect(output).toContain('출처: https://matsu1207.tistory.com/772');
    expect(() => formatBossLevelBoost(['하드'])).toThrow('INVALID_USAGE');
  });
  it('parses and formats authentic boss force requirements', () => {
    expect(parseCommand('!보스포뻥')).toEqual({ name: 'bossForceBoost', args: [] });
    const output = formatBossForceBoost();
    expect(output).toContain('[어센틱 보스 포스 보정]');
    expect(output).toContain('세렌');
    expect(output).toContain('최초의 대적자');
    expect(output).toContain('유피테르');
    expect(output).toContain('810');
    expect(output).toContain('860');
    expect(output).toContain('어센틱 포스 +50');
    expect(output).toContain('출처: https://matsu1207.tistory.com/771?category=1218857');
    expect(() => formatBossForceBoost(['세렌'])).toThrow('INVALID_USAGE');
  });
  it('parses and formats Meka Berry rates for levels 280 through 299', () => {
    expect(parseCommand('!메카베리 280')).toEqual({ name: 'mekaBerry', args: ['280'] });
    expect(formatMekaBerry(['280'])).toContain('메카베리 1개당 상승: 9.705%');
    expect(formatMekaBerry(['280'])).toContain('크림슨 메카베리 1개당 상승: 15.097%');
    expect(formatMekaBerry(['299'])).toContain('0.467%');
    expect(() => formatMekaBerry(['279'])).toThrow('INVALID_USAGE');
    expect(() => formatMekaBerry([])).toThrow('INVALID_USAGE');
  });
  it('parses and formats VIP Sauna one-hour rates for levels 200 through 299', () => {
    expect(parseCommand('!사우나 295')).toEqual({ name: 'sauna', args: ['295'] });
    expect(formatSauna(['295'])).toContain('1시간: 0.059%');
    expect(formatSauna(['295'])).toContain('레벨업: 약 1,695시간');
    expect(formatSauna(['295'])).toContain(
      '[*단, API 최신 기록 시점에 따라 실제 경험치와 약간 차이 날 수 있습니다]',
    );
    expect(formatSauna(['280'])).toContain('1시간: 0.931%');
    expect(() => formatSauna(['199'])).toThrow('INVALID_USAGE');
    expect(() => formatSauna([])).toThrow('INVALID_USAGE');
    expect(
      formatSauna(['비쓰킷'], { name: '비쓰킷', level: 295, experienceRate: 97.75 }),
    ).toContain('레벨업: 약 39시간');
  });
  it('parses and formats Epic Dungeon Nightmare Sanctuary level-up estimates', () => {
    expect(parseCommand('!악몽 비쓰킷')).toEqual({
      name: 'nightmare',
      args: ['비쓰킷'],
    });
    const output = formatEpicDungeon('비쓰킷', 295, 97.75);
    expect(output).toContain('현재 레벨: Lv.295');
    expect(output).toContain('현재 경험치: 97.75%');
    expect(output).toContain('악몽선경 1판 경험치: 0.1745%');
    expect(output).toContain('레벨업까지: 약 13판');
    expect(() => formatEpicDungeon('비쓰킷', 279, 50)).toThrow('INVALID_USAGE');
    expect(() => formatEpicDungeon('비쓰킷', 295, 100)).toThrow('INVALID_USAGE');
    expect(parseCommand('!앵글 비쓰킷')).toEqual({ name: 'angler', args: ['비쓰킷'] });
    expect(formatEpicDungeon('비쓰킷', 295, 97.75, 'angler')).toContain(
      '앵글러 컴퍼니 1판 경험치: 0.1309%',
    );
    expect(parseCommand('!마운틴 비쓰킷')).toEqual({ name: 'mountain', args: ['비쓰킷'] });
    expect(formatEpicDungeon('비쓰킷', 295, 97.75, 'mountain')).toContain(
      '하이마운틴 1판 경험치: 0.0873%',
    );
  });
  it('parses and formats meso-point experience efficiency in descending order', () => {
    expect(parseCommand('!메포효율')).toEqual({ name: 'mepoEfficiency', args: [] });
    const output = formatMepoEfficiency();
    expect(output).toContain('[메포 대비 경험치 효율]');
    expect(output.indexOf('선데이몬파')).toBeLessThan(output.indexOf('하이마운틴'));
    expect(output.indexOf('하이마운틴')).toBeLessThan(output.indexOf('메카베리'));
    expect(output).toContain('17.8070');
    expect(output).toContain('효율(1%/1만): 17.8070');
    expect(output).not.toContain('┌──');
    expect(output).not.toContain('출처: https://www.inven.co.kr/board/maple/2304/48140');
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
    expect(output).not.toContain('출처: https://matsu1207.tistory.com/1052');
    expect(() => formatMaxLevelSymbolEffects(['11'])).toThrow('INVALID_USAGE');
  });
  it('parses aliases and ignores unknown commands', () => {
    expect(parseCommand(' !도움말 ')?.name).toBe('help');
    expect(parseCommand('/도움말')).toBeNull();
    expect(parseCommand('!명령어')).toBeNull();
    expect(parseCommand('!unknown')).toBeNull();
    expect(parseCommand('!정보 테스트')).toEqual({ name: 'character', args: ['테스트'] });
    expect(parseCommand('!유챔 테스트')).toEqual({ name: 'unionChampion', args: ['테스트'] });
    expect(parseCommand('!ㅁㅁㅈ')).toEqual({ name: 'food', args: [] });
    expect(parseCommand('!치킨vs짬뽕')).toEqual({ name: 'choice', args: ['치킨', '짬뽕'] });
    expect(parseCommand('!치킨 vs 짬뽕')).toEqual({ name: 'choice', args: ['치킨', '짬뽕'] });
    expect(parseCommand('!골라 치킨 짬뽕')).toBeNull();
  });
  it('parses the Wonder Berry command', () =>
    expect(parseCommand('!원더베리')).toEqual({ name: 'wonderBerry', args: [] }));
  it('parses and formats the White Jade boss ring box command', () => {
    expect(parseCommand('!시드링')).toEqual({ name: 'seedRing', args: [] });
    const output = formatWhiteJadeBossRingBoxDraw(
      [
        { name: '리스트레인트 링', probability: 14.28571 },
        { name: '컨티뉴어스 링', probability: 14.28571 },
      ],
      5,
      () => 0,
    );
    expect(output).toContain('[백옥의 보스 반지 상자 5회 뽑기]');
    expect(output.match(/^\d+\./gm) ?? []).toHaveLength(5);
    expect(output).not.toContain('기준: Nexon');
    expect(output).not.toContain('실제 구매가 아닌');
    expect(output).toContain('리스트레인트 링 3레벨 (총 확률 9.29%)');
    expect(output).not.toMatch(/^\d+\. 3 \(/m);
  });
  it('formats the Black Accessory Box draw and its special Loose Control message', () => {
    expect(parseCommand('!칠흑깡')).toEqual({ name: 'blackAccessoryBox', args: [] });
    expect(parseCommand('!칠흑')).toBeNull();
    expect(formatBlackAccessoryBoxDraw(() => 0)).toBe(
      '축하합니다! ***루즈 컨트롤 머신 마크*** 나왔습니다\n쟌넨-, 떠도 이게뜨네 ㅋ',
    );
    expect(formatBlackAccessoryBoxDraw(() => 0.99)).toBe(
      '축하합니다! ***고통의 근원*** 나왔습니다\n올ㅋ 이게뜨네 ㅋ',
    );
    expect(formatBlackAccessoryBoxDraw(() => 0.3)).toContain('***마력이 깃든 안대***');
    expect(formatBlackAccessoryBoxDraw(() => 0.7)).toContain('***커맨더 포스 이어링***');
  });
  it('labels rare Wonder Berry results and omits metadata', () => {
    const output = formatWonderBerryDraw(
      [{ name: '원더 블랙 펫', probability: 100, category: '희귀' }],
      'https://example.com/probability',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(output).toContain('[원더블랙] 원더 블랙 펫');
    expect(output).not.toContain('https://example.com/probability');
    expect(output).not.toContain('기준: Nexon 공식 확률 페이지');
    expect(output).not.toContain('실제 구매가 아닌');
  });
  it('labels every 3.3% Wonder Berry result as Wonder Black', () => {
    const output = formatWonderBerryDraw(
      [{ name: '곰곰 사원', probability: 3.3 }],
      'https://example.com/probability',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(output).toContain('[원더블랙] 곰곰 사원');
  });
  it('labels official Wonder Black names even without category metadata', () => {
    const output = formatWonderBerryDraw(
      [
        { name: '토토 사원', probability: 5 },
        { name: '펭펭 사원', probability: 5 },
      ],
      'https://example.com/probability',
      '2026-08-27T00:00:00.000Z',
      2,
      true,
      () => 0,
    );
    expect(output).toContain('[원더블랙] 토토 사원');
    const secondOutput = formatWonderBerryDraw(
      [{ name: '펭펭 사원', probability: 5 }],
      'https://example.com/probability',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(secondOutput).toContain('[원더블랙] 펭펭 사원');
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
      () => 0,
    );
    expect(luna).toContain('[쁘띠] 루나 쁘띠펫 테스트');
    const sweetLuna = formatLunaCrystalSweetDraw(
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
    expect(sweetLuna).toContain('[스윗] 루나 스윗펫 테스트');
    const probabilityPetit = formatLunaCrystalSweetDraw(
      '일반',
      [{ name: '확률 쁘띠 펫', probability: 3.9 }],
      'https://example.com/luna',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(probabilityPetit).toContain('[쁘띠] 확률 쁘띠 펫');
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
  it('labels Luna Dream probabilities with the requested prefixes', () => {
    const dream = formatLunaCrystalDreamDraw(
      '일반',
      [{ name: '테스트 드림라벨', probability: 8.4 }],
      'https://example.com/luna-dream',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    const petit = formatLunaCrystalDreamDraw(
      '일반',
      [{ name: '테스트 쁘띠', probability: 6.8 }],
      'https://example.com/luna-dream',
      '2026-08-27T00:00:00.000Z',
      1,
      true,
      () => 0,
    );
    expect(dream).toContain('[뒤진라벨] 테스트 드림라벨');
    expect(petit).toContain('[쁘띠] 테스트 쁘띠');
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
    expect(parseCommand('!메이플링크 닉네임')).toBeNull());
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
    const first = formatFortune(['2000-01-01', '남자', '양력'], now);
    expect(first).toContain('[오늘의 운세]');
    expect(first).toContain('생년월일: 2000-01-01 (남자 / 양력)');
    expect(first).toBe(formatFortune(['2000-01-01', '남자', '양력'], now));
    expect(formatFortune(['1993-08-15', '여자', '음력'], now)).toContain('출생시간: 미입력');
    expect(formatFortune(['931201', '남성', '양력'], now)).toContain(
      '생년월일: 1993-12-01 (남자 / 양력)',
    );
  });
  it('rejects the retired food category argument', () =>
    expect(() => formatFoodRecommendation(['한식'])).toThrow('INVALID_USAGE'));
});
