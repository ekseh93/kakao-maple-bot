import { calculateDailyFortune } from './fortune-mcp-adapter.js';
export { formatExchangeRates, type ExchangeRateView } from './exchange.js';
export {
  formatDaisoProducts,
  formatNationalFuelPrices,
  formatLowestFuelStations,
} from './retail.js';

export type CommandName =
  | 'help'
  | 'rps'
  | 'choice'
  | 'food'
  | 'japanTravel'
  | 'boss'
  | 'bossRewards'
  | 'bossLevelBoost'
  | 'bossForceBoost'
  | 'mekaBerry'
  | 'netflix'
  | 'anime'
  | 'fortune'
  | 'lotto'
  | 'symbol'
  | 'dojang'
  | 'union'
  | 'unionChampion'
  | 'equipment'
  | 'notice'
  | 'inven'
  | 'hotDeals'
  | 'graphicsCard'
  | 'monitor'
  | 'japanTravelPosts'
  | 'japanRestaurantPosts'
  | 'manga'
  | 'mabbakDorosi'
  | 'mepoEfficiency'
  | 'weeklyNewProduct'
  | 'discord'
  | 'symbolMax'
  | 'webtoon'
  | 'webNovel'
  | 'boutiqueGift'
  | 'event'
  | 'sunday'
  | 'royal'
  | 'wonderBerry'
  | 'lunaSweet'
  | 'lunaDream'
  | 'weather'
  | 'experience'
  | 'character'
  | 'stock'
  | 'daiso'
  | 'fuel'
  | 'fuelStations'
  | 'exchangeRate'
  | 'usageStats'
  | 'status';
export type ParsedCommand = { name: CommandName; args: string[] };

const helpRows = {
  maple: [
    ['!정보 <닉네임>', '캐릭터 조회'],
    ['!무릉 <닉네임>', '무릉 기록'],
    ['!유니온 <닉네임>', '유니온 요약'],
    ['!유챔 <닉네임>', '유니온 챔피언'],
    ['!장비 <닉네임>', '장비 요약'],
    ['!경험치 <닉네임>', '경험치 이력'],
    ['!메카베리 <레벨>', '메카베리/크림슨 경험치'],
    ['!메포효율', '메포 대비 BM 경치 효율표'],
    ['!심볼 <지역> 1 11', '심볼 계산'],
    ['!심볼만렙', '어센틱 심볼 만렙 효과'],
    ['!보스', '보스 결정 가격표'],
    ['!보스보상', '스우~벨로나 보상표'],
    ['!보스렙뻥', '보스 레벨 보정표'],
    ['!보스포뻥', '어센틱 보스 포스표'],
    ['!공지', '공식 공지'],
    ['!이벤트', '진행 이벤트'],
    ['!썬데이 / !선데이', '썬데이 메이플'],
    ['!인벤', '인벤 10추글'],
    ['!마빡도로시', '최신 글 3개'],
    ['!디코', '디스코드 링크'],
  ],
  miniGames: [
    ['!부티크', '부티크 기프트'],
    ['!로얄', '로얄스타일'],
    ['!원더베리', '위습의 원더베리'],
    ['!루나스윗', '루나 크리스탈 스윗'],
    ['!루나드림', '루나 크리스탈 드림'],
    ['!가위 / !바위 / !보', '가위바위보'],
  ],
  other: [
    ['!날씨 <지역>', '현재 날씨'],
    ['!주식 <이름>', '주식 시세'],
    ['!환율', '달러·엔화 환율'],
    ['!기름 / !유가', '전국 평균 유가'],
    ['!주유소', '전국 최저가 주유소 TOP 3'],
    ['!<메뉴A>vs<메뉴B>', '메뉴 선택'],
    ['!뭐먹지 !ㅁㅁㅈ', '메뉴 추천'],
    ['!운세 <생년월일> <성별> <양력/음력>', '예: 931201 남성 양력'],
    ['!로또', '한·일 번호 추천'],
    ['!넷플', '넷플릭스 추천'],
    ['!애니', '일본 애니 추천'],
    ['!만화', '리디 일본 만화 목록 랜덤 추천'],
    ['!웹툰', '네이버 웹툰 추천'],
    ['!웹소설', '웹소설 랜덤 추천'],
    ['!일본여행', '여행지 추천'],
    ['!일본여행기', '디시인사이드 일본여행 최신 글 5개'],
    ['!일본음식점', '디시인사이드 일본 음식점 최신 글 5개'],
    ['!핫딜', '3개 커뮤니티 핫딜 각 5개'],
    ['!글카', '퀘이사존 그래픽카드 최신 글 5개'],
    ['!모니터', '디시인사이드 모니터 최신 글 10개'],
    ['!금주의신상', '금주의 신상'],
    ['!다이소 <상품>', '다이소 상품 검색'],
    ['!통계', '명령어 누적 호출 수'],
    ['!상태', '관리자 전용'],
  ],
} as const;

function formatHelpSection(title: string, rows: readonly (readonly [string, string])[]): string[] {
  return [
    `【${title}】`,
    '────────────',
    ...rows.flatMap(([command, description]) => [
      ...(command === '!상태' ? [''] : []),
      `• ${command}`,
      `  └ ${description}`,
    ]),
  ];
}

export const FORMATTED_HELP = [
  '[봇 도움말]',
  ...formatHelpSection('메이플스토리', helpRows.maple),
  '',
  ...formatHelpSection('미니 게임', helpRows.miniGames),
  '',
  ...formatHelpSection('기타 기능', helpRows.other),
].join('\n');

// Kept as a compatibility export for consumers that imported the old help constant.
export const HELP = FORMATTED_HELP;

const aliases: Record<string, CommandName> = {
  도움말: 'help',
  캐릭터: 'character',
  정보: 'character',
  메이플: 'character',
  캐릭: 'character',
  심볼: 'symbol',
  심볼계산: 'symbol',
  보스: 'boss',
  보스보상: 'bossRewards',
  보스렙뻥: 'bossLevelBoost',
  보스포뻥: 'bossForceBoost',
  메카베리: 'mekaBerry',
  무릉: 'dojang',
  유니온: 'union',
  유챔: 'unionChampion',
  장비: 'equipment',
  공지: 'notice',
  인벤: 'inven',
  핫딜: 'hotDeals',
  글카: 'graphicsCard',
  모니터: 'monitor',
  일본여행기: 'japanTravelPosts',
  일본음식점: 'japanRestaurantPosts',
  마빡도로시: 'mabbakDorosi',
  메포효율: 'mepoEfficiency',
  금주의신상: 'weeklyNewProduct',
  디코: 'discord',
  심볼만렙: 'symbolMax',
  웹툰: 'webtoon',
  웹소설: 'webNovel',
  부티크: 'boutiqueGift',
  이벤트: 'event',
  썬데이: 'sunday',
  선데이: 'sunday',
  로얄: 'royal',
  원더베리: 'wonderBerry',
  루나스윗: 'lunaSweet',
  루나드림: 'lunaDream',
  날씨: 'weather',
  경험치: 'experience',
  가위: 'rps',
  바위: 'rps',
  보: 'rps',
  가위바위보: 'rps',
  뭐먹지: 'food',
  ㅁㅁㅈ: 'food',
  메뉴: 'food',
  뭐먹을까: 'food',
  일본여행: 'japanTravel',
  넷플: 'netflix',
  넷플릭스: 'netflix',
  애니: 'anime',
  만화: 'manga',
  운세: 'fortune',
  로또: 'lotto',
  주식: 'stock',
  다이소: 'daiso',
  기름: 'fuel',
  유가: 'fuel',
  주유소: 'fuelStations',
  환율: 'exchangeRate',
  통계: 'usageStats',
  상태: 'status',
};

export function formatUsageStats(total: number): string {
  if (!Number.isSafeInteger(total) || total < 0) throw new Error('INVALID_USAGE');
  return `[봇 사용 통계]\n현재까지 명령어 호출: ${total.toLocaleString('ko-KR')}회`;
}

export function parseCommand(message: string): ParsedCommand | null {
  const value = message.trim();
  if ((!value.startsWith('!') && !value.startsWith('/')) || value.length > 300) return null;
  const choiceMatch = value.match(/^!(.+?)\s*vs\s*(.+)$/i);
  if (choiceMatch) {
    const left = choiceMatch[1]?.trim() ?? '';
    const right = choiceMatch[2]?.trim() ?? '';
    if (left && right) return { name: 'choice', args: [left, right] };
  }
  const [raw, ...args] = value.slice(1).split(/\s+/);
  const normalizedRaw = raw?.toLocaleLowerCase() ?? '';
  const name = aliases[normalizedRaw];
  if (!name) return null;
  if (name === 'help' && !value.startsWith('!')) return null;
  return name === 'rps' ? { name, args: [raw ?? '', ...args] } : { name, args };
}

export function validateCharacterName(value: string | undefined): string {
  const name = value?.trim() ?? '';
  if (!/^[^\u0000-\u001f\s]{2,12}$/.test(name)) throw new Error('INVALID_USAGE');
  return name;
}

export function validateRegion(value: string | undefined): string {
  const region = value?.trim() ?? '';
  if (!region || region.length > 80 || /[\u0000-\u001f]/.test(region))
    throw new Error('INVALID_USAGE');
  return region;
}

export const symbolGrowth = {
  arcane: {
    effectiveDate: '2026-08-26',
    verifiedDate: '2026-08-26',
    source: 'https://maplestory.nexon.com/Guide/N23GameInformation/Articles/396',
    levels: [12, 15, 20, 27, 36, 47, 60, 75, 92, 111, 132, 155, 180, 207, 236, 267, 300, 335, 372],
  },
  authentic: {
    effectiveDate: '2026-08-26',
    verifiedDate: '2026-08-26',
    source: 'https://maplestory.nexon.com/Guide/N23GameInformation/Articles/396',
    levels: [29, 76, 141, 224, 325, 444, 581, 736, 909, 1100],
  },
} as const;

const arcaneUpgradeCosts = [
  [
    970000, 1230000, 1660000, 2260000, 3060000, 4040000, 5220000, 6600000, 8180000, 9990000,
    12010000, 14260000, 16740000, 19450000, 22420000, 25630000, 29100000, 32830000, 36820000,
  ],
  [
    1210000, 1530000, 2060000, 2800000, 3780000, 4980000, 6420000, 8100000, 10020000, 12210000,
    14650000, 17360000, 20340000, 23590000, 27140000, 30970000, 35100000, 39530000, 44260000,
  ],
  [
    1450000, 1830000, 2460000, 3340000, 4500000, 5920000, 7620000, 9600000, 11860000, 14430000,
    17290000, 20460000, 23940000, 27730000, 31860000, 36310000, 41100000, 46230000, 51700000,
  ],
  [
    1690000, 2130000, 2860000, 3880000, 5220000, 6860000, 8820000, 11100000, 13700000, 16650000,
    19930000, 23560000, 27540000, 31870000, 36580000, 41650000, 47100000, 52930000, 59140000,
  ],
  [
    1930000, 2430000, 3260000, 4420000, 5940000, 7800000, 10020000, 12600000, 15540000, 18870000,
    22570000, 26660000, 31140000, 36010000, 41300000, 46990000, 53100000, 59630000, 66580000,
  ],
  [
    2170000, 2730000, 3660000, 4960000, 6660000, 8740000, 11220000, 14100000, 17380000, 21090000,
    25210000, 29760000, 34740000, 40150000, 46020000, 52330000, 59100000, 66330000, 74020000,
  ],
] as const;
const authenticUpgradeCosts = [
  [
    36500000, 91200000, 160700000, 241900000, 331500000, 426200000, 522900000, 618200000, 709000000,
    792000000,
  ],
  [
    41700000, 104800000, 186100000, 282200000, 390000000, 506100000, 627400000, 750700000,
    872600000, 990000000,
  ],
  [
    46900000, 118500000, 211500000, 322500000, 448500000, 586000000, 732000000, 883200000,
    1036200000, 1188000000,
  ],
  [
    52200000, 132200000, 236800000, 362800000, 507000000, 666000000, 836600000, 1015600000,
    1199800000, 1386000000,
  ],
  [
    57400000, 145900000, 262200000, 403200000, 565500000, 745900000, 941200000, 1148100000,
    1363500000, 1584000000,
  ],
  [
    62600000, 159600000, 287600000, 443500000, 624000000, 825800000, 1045800000, 1280600000,
    1527100000, 1782000000,
  ],
] as const;
const grandAuthenticUpgradeCosts = [
  [
    113600000, 293300000, 535800000, 837700000, 1196000000, 1607200000, 2068300000, 2576000000,
    3126900000, 3718000000,
  ],
  [
    139700000, 361700000, 662700000, 1039300000, 1488500000, 2006800000, 2591200000, 3238400000,
    3945000000, 4708000000,
  ],
] as const;

const symbolRegions = {
  소멸의여로: 'arcane',
  여로: 'arcane',
  츄츄: 'arcane',
  츄츄아일랜드: 'arcane',
  레헬른: 'arcane',
  아르카나: 'arcane',
  모라스: 'arcane',
  에스페라: 'arcane',
  세르니움: 'authentic',
  아르크스: 'authentic',
  오디움: 'authentic',
  도원경: 'authentic',
  아르테리아: 'authentic',
  카르시온: 'authentic',
  탈라하트: 'authentic',
  기어드락: 'authentic',
} as const;

export type RpsMove = '가위' | '바위' | '보';

export function playRps(move: string, random = Math.random): string {
  const user = move.trim() as RpsMove;
  if (!['가위', '바위', '보'].includes(user)) throw new Error('INVALID_USAGE');
  const bot = ['가위', '바위', '보'][Math.floor(random() * 3)] as RpsMove;
  const win =
    (user === '가위' && bot === '보') ||
    (user === '바위' && bot === '가위') ||
    (user === '보' && bot === '바위');
  const draw = user === bot;
  const result = draw ? '비겼다' : win ? '이겼다' : '졌다';
  const taunt = win
    ? ' 잘했어! 다음엔 내가 이길 거야~'
    : draw
      ? ' 다음 판엔 승부를 보자!'
      : ' 내가 이겼지롱~ 😝';
  return `[가위바위보]\n당신: ${user}\n봇: ${bot}\n결과: ${result}!${taunt}`;
}

export function calculateSymbol(
  kind: string,
  current: number,
  target: number,
  progress = 0,
): number {
  const normalized =
    symbolRegions[kind.trim() as keyof typeof symbolRegions] ??
    (kind.toLocaleLowerCase() === '아케인' || kind.toLocaleLowerCase() === 'arcane'
      ? 'arcane'
      : kind.toLocaleLowerCase() === '어센틱' || kind.toLocaleLowerCase() === 'authentic'
        ? 'authentic'
        : kind.toLocaleLowerCase());
  const data = symbolGrowth[normalized as keyof typeof symbolGrowth];
  const max = normalized === 'arcane' ? 20 : 11;
  if (
    !data ||
    !Number.isInteger(current) ||
    !Number.isInteger(target) ||
    current < 1 ||
    target > max ||
    target <= current
  )
    throw new Error('INVALID_USAGE');
  const next = data.levels[current - 1];
  if (progress < 0 || progress >= (next ?? 0)) throw new Error('INVALID_USAGE');
  return (
    data.levels.slice(current - 1, target - 1).reduce((sum, value) => sum + value, 0) - progress
  );
}

export function calculateSymbolCost(kind: string, current: number, target: number): number {
  const key = kind.trim() as keyof typeof symbolRegions;
  const family = symbolRegions[key];
  const normalizedKind = kind.trim().toLocaleLowerCase();
  const isArcane =
    family === 'arcane' || normalizedKind === '아케인' || normalizedKind === 'arcane';
  const isGrand = key === '탈라하트' || key === '기어드락';
  const region = isGrand
    ? key === '기어드락'
      ? 1
      : 0
    : isArcane
      ? Math.max(
          0,
          Math.min(
            5,
            Math.floor(
              [
                '여로',
                '소멸의여로',
                '츄츄',
                '츄츄아일랜드',
                '레헬른',
                '아르카나',
                '모라스',
                '에스페라',
              ].indexOf(key) / 2,
            ),
          ),
        )
      : ['세르니움', '아르크스', '오디움', '도원경', '아르테리아', '카르시온'].indexOf(key);
  const table = isGrand
    ? grandAuthenticUpgradeCosts
    : isArcane
      ? arcaneUpgradeCosts
      : authenticUpgradeCosts;
  const row = table[region];
  const max = isArcane ? 20 : 11;
  if (
    !Number.isInteger(current) ||
    !Number.isInteger(target) ||
    current < 1 ||
    target <= current ||
    target > max ||
    region < 0 ||
    !row
  )
    throw new Error('INVALID_USAGE');
  return row.slice(current - 1, target - 1).reduce((sum, value) => sum + value, 0);
}

const menus: Record<string, string[]> = {
  전체: [
    '김치찌개',
    '비빔밥',
    '삼겹살',
    '제육볶음',
    '불고기',
    '닭갈비',
    '국밥',
    '냉면',
    '짜장면',
    '짬뽕',
    '탕수육',
    '마라탕',
    '볶음밥',
    '돈카츠',
    '초밥',
    '라멘',
    '우동',
    '규동',
    '파스타',
    '오므라이스',
    '피자',
    '햄버거',
    '리조또',
    '떡볶이',
    '김밥',
    '순대',
    '어묵',
    '라볶이',
    '치킨',
    '족발',
    '보쌈',
    '곱창',
    '닭발',
    '샐러드',
    '샌드위치',
    '포케',
    '죽',
    '감자튀김',
    '치즈볼',
    '콘치즈',
    '계란찜',
    '김치전',
    '해물파전',
    '오징어튀김',
    '붕어빵',
    '호떡',
    '아이스크림',
    '케이크',
    '마카롱',
    '팥빙수',
    '떡',
    '과일',
    '오돌뼈',
    '막창',
    '닭똥집',
    '두부김치',
    '골뱅이무침',
    '오징어숙회',
    '육회',
  ],
  한식: ['김치찌개', '비빔밥', '삼겹살', '제육볶음', '불고기', '닭갈비', '국밥', '냉면'],
  중식: ['짜장면', '짬뽕', '탕수육', '마라탕', '볶음밥'],
  일식: ['돈카츠', '초밥', '라멘', '우동', '규동'],
  양식: ['파스타', '오므라이스', '피자', '햄버거', '리조또'],
  분식: ['떡볶이', '김밥', '순대', '어묵', '라볶이'],
  야식: ['치킨', '족발', '보쌈', '곱창', '닭발'],
  가벼운: ['샐러드', '샌드위치', '포케', '죽'],
  사이드: ['감자튀김', '치즈볼', '콘치즈', '계란찜', '김치전', '해물파전', '오징어튀김'],
  디저트: ['붕어빵', '호떡', '아이스크림', '케이크', '마카롱', '팥빙수', '떡', '과일'],
  술안주: ['오돌뼈', '막창', '닭똥집', '두부김치', '골뱅이무침', '오징어숙회', '육회'],
};

const foodBoostWeight = 11;

export type FoodProbability = { name: string; probability: number; weight: number };

function allFoodItems(): string[] {
  return [...new Set(Object.values(menus).flat())].concat('재획');
}

export function foodProbabilities(): FoodProbability[] {
  const items = allFoodItems();
  const total = items.reduce((sum, name) => sum + (name === '재획' ? foodBoostWeight : 1), 0);
  return items.map((name) => {
    const weight = name === '재획' ? foodBoostWeight : 1;
    return { name, weight, probability: (weight / total) * 100 };
  });
}

export function formatFoodRecommendation(args: string[] = [], random = Math.random): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  const probabilities = foodProbabilities();
  const total = probabilities.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  const selected =
    probabilities.find((item) => {
      cursor -= item.weight;
      return cursor < 0;
    }) ?? probabilities[probabilities.length - 1]!;
  return ['[오늘 뭐먹지]', `추천: ${selected.name}`].join('\n');
}

const japanTravelPlaces = [
  { prefecture: '홋카이도', city: '삿포로', highlight: '미식·자연·계절 축제' },
  { prefecture: '아오모리현', city: '아오모리', highlight: '사과·온천·축제' },
  { prefecture: '이와테현', city: '모리오카', highlight: '전통 거리·산리쿠 해안·면 요리' },
  { prefecture: '미야기현', city: '센다이', highlight: '규탄·마쓰시마·도심 산책' },
  { prefecture: '아키타현', city: '아키타', highlight: '온천·전통 축제·향토 음식' },
  { prefecture: '야마가타현', city: '야마가타', highlight: '긴잔온천·산사·체리' },
  { prefecture: '후쿠시마현', city: '아이즈와카마쓰', highlight: '성곽·호수·과일 여행' },
  { prefecture: '이바라키현', city: '미토', highlight: '정원·해안·꽃 명소' },
  { prefecture: '도치기현', city: '닛코', highlight: '세계유산·호수·온천' },
  { prefecture: '군마현', city: '쿠사쓰', highlight: '온천·산책·료칸' },
  { prefecture: '사이타마현', city: '가와고에', highlight: '에도풍 거리·카페·당일치기' },
  { prefecture: '지바현', city: '나리타', highlight: '사찰·해산물·근교 여행' },
  { prefecture: '도쿄도', city: '도쿄', highlight: '도심 관광·쇼핑·전시' },
  { prefecture: '가나가와현', city: '하코네', highlight: '온천·료칸·후지산 풍경' },
  { prefecture: '니가타현', city: '니가타', highlight: '쌀·사케·동해 풍경' },
  { prefecture: '도야마현', city: '도야마', highlight: '알펜루트·초밥·산악 풍경' },
  { prefecture: '이시카와현', city: '가나자와', highlight: '정원·전통 공예·해산물' },
  { prefecture: '후쿠이현', city: '후쿠이', highlight: '공룡 박물관·절벽·게 요리' },
  { prefecture: '야마나시현', city: '가와구치코', highlight: '후지산·호수·과일' },
  { prefecture: '나가노현', city: '마쓰모토', highlight: '성곽·산악 풍경·온천' },
  { prefecture: '기후현', city: '다카야마', highlight: '전통 거리·시라카와고·온천' },
  { prefecture: '시즈오카현', city: '시즈오카', highlight: '차·후지산·해안 풍경' },
  { prefecture: '아이치현', city: '나고야', highlight: '성·미소 음식·제조업 문화' },
  { prefecture: '미에현', city: '이세', highlight: '이세신궁·해산물·닌자 문화' },
  { prefecture: '시가현', city: '오쓰', highlight: '비와호·사찰·호숫가 산책' },
  { prefecture: '교토부', city: '교토', highlight: '사찰·전통 거리·문화재' },
  { prefecture: '오사카부', city: '오사카', highlight: '먹거리·도톤보리·근교 여행' },
  { prefecture: '효고현', city: '고베', highlight: '항구 야경·온천·카페' },
  { prefecture: '나라현', city: '나라', highlight: '사슴공원·고찰·역사 산책' },
  { prefecture: '와카야마현', city: '시라하마', highlight: '온천·해변·쿠마노 고도' },
  { prefecture: '돗토리현', city: '돗토리', highlight: '사구·해산물·온천' },
  { prefecture: '시마네현', city: '마쓰에', highlight: '성곽·신사·호수 풍경' },
  { prefecture: '오카야마현', city: '오카야마', highlight: '정원·복숭아·근교 섬 여행' },
  { prefecture: '히로시마현', city: '히로시마', highlight: '평화공원·미야지마·미식' },
  { prefecture: '야마구치현', city: '하기', highlight: '성하마을·온천·해안 풍경' },
  { prefecture: '도쿠시마현', city: '도쿠시마', highlight: '아와오도리·협곡·소용돌이' },
  { prefecture: '가가와현', city: '다카마쓰', highlight: '사누키 우동·정원·섬 여행' },
  { prefecture: '에히메현', city: '마쓰야마', highlight: '도고온천·성곽·귤' },
  { prefecture: '고치현', city: '고치', highlight: '카츠오 타타키·성곽·강 풍경' },
  { prefecture: '후쿠오카현', city: '후쿠오카', highlight: '라멘·온천·짧은 도심 여행' },
  { prefecture: '사가현', city: '사가', highlight: '온천·도자기·갯벌 풍경' },
  { prefecture: '나가사키현', city: '나가사키', highlight: '항구 야경·역사·짬뽕' },
  { prefecture: '구마모토현', city: '구마모토', highlight: '성곽·화산·말고기 요리' },
  { prefecture: '오이타현', city: '벳푸', highlight: '온천·지옥순례·료칸' },
  { prefecture: '미야자키현', city: '미야자키', highlight: '야자수 해안·신화·치킨난반' },
  { prefecture: '가고시마현', city: '가고시마', highlight: '사쿠라지마·온천·흑돼지' },
  { prefecture: '오키나와현', city: '나하', highlight: '해변·섬 풍경·류큐 문화' },
] as const;

type BossRewardRow = {
  name: string;
  easy: number | null;
  normal: number | null;
  hard: number | null;
  extreme: number | null;
};

// Snapshot of the four difficulty columns in the referenced decision-price table.
// A dash in the source is represented as null and displayed as '-'.
const grandisBossRewards: BossRewardRow[] = [
  { name: '검은 마법사', easy: null, normal: null, hard: 665_000_000, extreme: 8_740_000_000 },
  { name: '세렌', easy: null, normal: 239_000_000, hard: 356_000_000, extreme: 2_835_000_000 },
  {
    name: '칼로스',
    easy: 280_000_000,
    normal: 505_000_000,
    hard: 1_273_000_000,
    extreme: 4_104_000_000,
  },
  {
    name: '카링',
    easy: 377_000_000,
    normal: 678_000_000,
    hard: 1_739_000_000,
    extreme: 5_387_000_000,
  },
  { name: '림보', easy: null, normal: 1_026_000_000, hard: 2_385_000_000, extreme: null },
  { name: '발드릭스', easy: null, normal: 1_368_000_000, hard: 3_078_000_000, extreme: null },
  {
    name: '최초의 대적자',
    easy: 308_000_000,
    normal: 560_000_000,
    hard: 1_435_000_000,
    extreme: 4_712_000_000,
  },
  { name: '찬란한 흉성', easy: null, normal: 625_000_000, hard: 2_678_000_000, extreme: null },
  { name: '유피테르', easy: null, normal: 1_615_000_000, hard: 4_845_000_000, extreme: null },
  { name: '벨로나', easy: 440_000_000, normal: 850_000_000, hard: 2_950_000_000, extreme: null },
];

type MekaBerryRate = { level: number; meka: number; crimson: number };

const mekaBerryRates: MekaBerryRate[] = [
  { level: 280, meka: 9.705, crimson: 15.097 },
  { level: 281, meka: 8.943, crimson: 13.912 },
  { level: 282, meka: 8.228, crimson: 12.799 },
  { level: 283, meka: 7.58, crimson: 11.792 },
  { level: 284, meka: 6.973, crimson: 10.846 },
  { level: 285, meka: 5.174, crimson: 6.036 },
  { level: 286, meka: 4.758, crimson: 5.551 },
  { level: 287, meka: 4.382, crimson: 5.112 },
  { level: 288, meka: 4.035, crimson: 4.708 },
  { level: 289, meka: 3.71, crimson: 4.328 },
  { level: 290, meka: 2.236, crimson: 2.408 },
  { level: 291, meka: 2.055, crimson: 2.213 },
  { level: 292, meka: 1.892, crimson: 2.037 },
  { level: 293, meka: 1.741, crimson: 1.875 },
  { level: 294, meka: 1.6, crimson: 1.724 },
  { level: 295, meka: 0.89, crimson: 0.959 },
  { level: 296, meka: 0.819, crimson: 0.882 },
  { level: 297, meka: 0.754, crimson: 0.812 },
  { level: 298, meka: 0.692, crimson: 0.746 },
  { level: 299, meka: 0.467, crimson: 0.503 },
];

export function formatMekaBerry(args: string[] = []): string {
  if (args.length !== 1 || !/^(?:28|29)[0-9]$/.test(args[0]!)) throw new Error('INVALID_USAGE');
  const level = Number(args[0]);
  const rate = mekaBerryRates.find((item) => item.level === level);
  if (!rate) throw new Error('INVALID_USAGE');
  return [
    '[메카베리 경험치]',
    `레벨: ${rate.level}`,
    `메카베리 1개당 상승: ${rate.meka.toFixed(3)}%`,
    `크림슨 메카베리 1개당 상승: ${rate.crimson.toFixed(3)}%`,
  ].join('\n');
}

const maxLevelSymbolEffects = [
  { symbol: '세르니움', effects: ['선택받은 세렌 공격 시 데미지 +20%', '추가 경험치 획득 +10%'] },
  { symbol: '아르크스', effects: ['감시자 칼로스 공격 시 데미지 +20%', '추가 경험치 획득 +10%'] },
  { symbol: '오디움', effects: ['최초의 대적자 공격 시 데미지 +20%', '추가 경험치 획득 +10%'] },
  { symbol: '도원경', effects: ['카링 공격 시 데미지 +20%', '추가 경험치 획득 +10%'] },
  {
    symbol: '아르테리아',
    effects: [
      '찬란한 흉성 공격 시 데미지 +20%',
      '벨로나 공격 시 데미지 +20%',
      '추가 경험치 획득 +10%',
    ],
  },
  { symbol: '카르시온', effects: ['림보 공격 시 데미지 +20%', '추가 경험치 획득 +10%'] },
  { symbol: '탈라하트', effects: ['발드릭스 공격 시 데미지 +20%'] },
  { symbol: '기어드락', effects: ['유피테르 공격 시 데미지 +20%'] },
] as const;

export function formatMaxLevelSymbolEffects(args: string[] = []): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  return [
    '[어센틱 심볼 만렙 효과]',
    '기준: 심볼 11레벨',
    '────────────',
    ...maxLevelSymbolEffects.flatMap((item) => [
      `• ${item.symbol}`,
      ...item.effects.map((effect) => `  └ ${effect}`),
      '',
    ]),
  ].join('\n');
}

type MesoPointEfficiency = {
  content: string;
  efficiency: number;
  experience: string;
  meso: string;
};

const mesoPointEfficiencies: MesoPointEfficiency[] = [
  { content: '선데이몬파', efficiency: 17.807, experience: '5.34%', meso: '3,000' },
  {
    content: '하이마운틴',
    efficiency: 12.5465,
    experience: '4.4372% (7.4323%)',
    meso: '7,500 (-3,419.2)',
  },
  {
    content: '앵글러컴퍼니',
    efficiency: 10.1142,
    experience: '6.656% (11.14%)',
    meso: '10,000 (-3,419.2)',
  },
  {
    content: '악몽선경',
    efficiency: 9.7731,
    experience: '8.8748% (14.8653%)',
    meso: '12,500 (-3,419.2)',
  },
  { content: '일요일몬파', efficiency: 8.7403, experience: '2.62%', meso: '3,000' },
  { content: '메카베리', efficiency: 6.9727, experience: '6.97%', meso: '10,000' },
  { content: '몬파', efficiency: 6.927, experience: '2.03%', meso: '3,000' },
  { content: '블루베리', efficiency: 6.3244, experience: '4.43%', meso: '7,000' },
];

export function formatMepoEfficiency(args: string[] = []): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  return [
    '[메포 대비 경험치 효율]',
    '기준: 284레벨 / 효율 높은 순',
    '────────────',
    ...mesoPointEfficiencies.flatMap((item, index) => [
      `${index + 1}. ${item.content}`,
      `   효율(1%/1만): ${item.efficiency.toFixed(4)}`,
      `   추가 경험치: ${item.experience}`,
      `   사용 메포: ${item.meso}`,
      '',
    ]),
  ].join('\n');
}

function formatMeso(value: number | null): string {
  return value === null ? '-' : value.toLocaleString('ko-KR');
}

export function formatBossRewards(args: string[] = []): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  const lines = [
    '[그란디스·검은 마법사 보스 결정 가격]',
    '단위: 메소',
    '────────────',
    ...grandisBossRewards.flatMap((boss) => [
      `• ${boss.name}`,
      `  └ 이지: ${formatMeso(boss.easy)}`,
      `  └ 노말: ${formatMeso(boss.normal)}`,
      `  └ 하드: ${formatMeso(boss.hard)}`,
      `  └ 익스트림: ${formatMeso(boss.extreme)}`,
      '',
    ]),
    '※ -는 원문 표에 해당 난이도 값이 없는 항목입니다.',
    '출처: https://matsu1207.tistory.com/757',
  ];
  return lines.join('\n');
}

type BossRewardSummary = { name: string; common: string; additional: string };

const bossRewardSummaries: BossRewardSummary[] = [
  {
    name: '스우',
    common: '특수형 에너지 코어(S)급 · 스우의 소울 조각(노멀·하드)',
    additional:
      '녹옥·홍옥·백옥 보스 반지 상자 · 앱솔랩스 방어구/무기 상자(하드 이상) · 루즈 컨트롤 머신 마크 · 스우 로이드 · 컴플리트 언더컨트롤 · 섬멸병기 스우로이드 · 섬멸병기 스우의 소울 조각',
  },
  {
    name: '데미안',
    common: '뒤틀린 낙인의 영혼석 · 루인 포스실드 · 데미안의 소울 조각',
    additional:
      '녹옥·홍옥 보스 반지 상자 · 마력이 깃든 안대 · 데미안로이드 · 앱솔랩스 방어구/무기 상자',
  },
  { name: '가디언 엔젤 슬라임', common: '가디언 엔젤 링', additional: '녹옥·흑옥 보스 반지 상자' },
  {
    name: '루시드',
    common: '나비날개 물방울석·트와일라이트 마크(노멀 이상) · 루시드의 소울 조각',
    additional:
      '녹옥·홍옥 보스 반지 상자 · 몽환의 벨트 · 루시드로이드 · 아케인셰이드 방어구/무기 상자',
  },
  {
    name: '윌',
    common: '코브웹 물방울석·트와일라이트 마크(노멀 이상) · 윌의 소울 조각',
    additional:
      '녹옥·홍옥 보스 반지 상자 · 저주받은 마도서 선택 상자 · 거울세계의 코어 젬스톤 · 아케인셰이드 방어구/무기 상자',
  },
  {
    name: '더스크',
    common: '에스텔라 이어링',
    additional: '녹옥·흑옥 보스 반지 상자 · 거대한 공포 · 아케인셰이드 방어구/무기 상자',
  },
  {
    name: '진 힐라',
    common: '데이브레이크 펜던트 · 아케인셰이드 방어구/무기 상자 · 진 힐라의 소울 조각',
    additional: '홍옥·흑옥 보스 반지 상자 · 고통의 근원',
  },
  {
    name: '듄켈',
    common: '에스텔라 이어링 · 듄켈의 소울 조각',
    additional: '녹옥·흑옥 보스 반지 상자 · 커맨더 포스 이어링 · 아케인셰이드 방어구/무기 상자',
  },
  {
    name: '검은 마법사',
    common: '백옥 보스 반지 상자 · 창세의 뱃지 · 아케인셰이드 방어구/무기 상자',
    additional: '익셉셔널 해머(벨트)',
  },
  {
    name: '선택받은 세렌',
    common: '데이브레이크 펜던트(노멀 이상) · 미트라의 코어 젬스톤(하드 이상)',
    additional:
      '흑옥·백옥 보스 반지 상자 · 미트라의 분노 선택 상자 · 익셉셔널 해머(얼굴장식) · 에리온의 조각 · 영롱한 달빛 포션(익스트림)',
  },
  {
    name: '감시자 칼로스',
    common: '니키로이드·생명의 연마석(노멀 이상) · 칼로스의 소울 조각',
    additional:
      '백옥·생명의 보스 반지 상자 · 남겨진 칼로스의 의지 · 의지의 에테르넬 방어구 상자 · 익셉셔널 해머(눈장식) · 에리온의 조각 · 영롱한 달빛 포션(익스트림)',
  },
  {
    name: '카링',
    common: '카링로이드(노멀 이상) · 신념의 연마석(하드·익스트림) · 카링의 소울 조각',
    additional:
      '백옥·생명의 보스 반지 상자 · 뒤엉킨 흉수의 고리 · 혼돈의 칠흑 장신구 상자 · 생명의 연마석 · 흉수의 에테르넬 방어구 상자 · 익셉셔널 해머(귀고리) · 에리온의 조각 · 영롱한 달빛 포션(익스트림)',
  },
  {
    name: '림보',
    common:
      '림보로이드 · 생명의 보스 반지 상자 · 신념의 연마석 · 혼돈의 칠흑 장신구 상자 · 림보의 소울 조각',
    additional: '왜곡된 욕망의 결정 · 근원의 속삭임 · 욕망의 에테르넬 방어구 상자 · 에리온의 조각',
  },
  {
    name: '발드릭스',
    common:
      '발드릭스로이드 · 생명의 보스 반지 상자 · 신념의 연마석 · 혼돈의 칠흑 장신구 상자 · 발드릭스의 소울 조각',
    additional: '영원한 충성의 흔적 · 죽음의 맹세 · 맹세의 에테르넬 방어구 상자 · 에리온의 조각',
  },
  {
    name: '최초의 대적자',
    common: '대적자 로이드·생명의 연마석(노멀 이상) · 최초의 대적자 소울 조각',
    additional:
      '백옥·생명의 보스 반지 상자 · 이어진 고대의 결의 · 불멸의 유산 · 고대의 에테르넬 상자 · 익셉셔널 해머(훈장) · 에리온의 조각 · 영롱한 달빛 포션(익스트림)',
  },
  {
    name: '찬란한 흉성',
    common: '흉성로이드 · 혼돈의 칠흑 장신구 상자 · 찬란한 흉성 소울 조각',
    additional:
      '백옥·생명의 보스 반지 상자 · 황홀한 환상의 단편 · 생명의 연마석 · 황홀한 악몽 · 환상의 에테르넬 방어구 상자 · 에리온의 조각 · 신념의 연마석',
  },
  {
    name: '유피테르',
    common:
      '유피테르로이드 · 생명의 보스 반지 상자 · 신념의 연마석 · 혼돈의 칠흑 장신구 상자 · 유피테르의 소울 조각',
    additional: '뒤틀린 갈망의 편린 · 에리온의 조각 · 오만의 원죄 · 갈망의 에테르넬 방어구 상자',
  },
  {
    name: '벨로나',
    common: '벨로나로이드 · 벨로나의 소울 조각',
    additional:
      '백옥·생명의 보스 반지 상자 · 저주받은 원혼의 잔재 · 혼돈의 칠흑 장신구 상자 · 생명의 연마석 · 굶주리는 핏빛 원혼 · 광기의 에테르넬 방어구 상자 · 에리온의 조각 · 신념의 연마석',
  },
];

export function formatBossRewardSummaries(args: string[] = []): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  return [
    '[보스 주요 보상]',
    '범위: 스우부터 벨로나까지',
    '────────────',
    ...bossRewardSummaries.flatMap((boss) => [
      `• ${boss.name}`,
      '  공통 보상',
      ...boss.common.split(' · ').map((reward) => `  └ ${reward}`),
      '  추가 보상',
      ...boss.additional.split(' · ').map((reward) => `  └ ${reward}`),
      '',
    ]),
    '※ 일부 보상은 원문 표의 난이도 조건(노멀 이상·하드 이상·익스트림)을 함께 표시했습니다.',
    '출처: https://matsu1207.tistory.com/937',
  ].join('\n');
}

type BossLevelRow = { boss: string; levels: string };

const bossLevelRows: BossLevelRow[] = [
  { boss: '검은 마법사(하드)', levels: '1·4페이즈 265 / 2·3페이즈 275' },
  { boss: '검은 마법사(익스트림)', levels: '1페이즈 275 / 2·3·4페이즈 280' },
  { boss: '세렌 1페이즈', levels: '노멀 270 / 하드 275 / 익스트림 275' },
  { boss: '세렌 2페이즈', levels: '노멀 270 / 하드 275 / 익스트림 280' },
  { boss: '칼로스 1페이즈', levels: '이지 270 / 노멀 275 / 하드 285 / 익스트림 285' },
  { boss: '칼로스 2페이즈', levels: '이지 270 / 노멀 280 / 하드 285 / 익스트림 285' },
  { boss: '카링', levels: '이지 275 / 노멀 285 / 하드 285 / 익스트림 285' },
  { boss: '림보', levels: '노멀 285 / 하드 285' },
  { boss: '발드릭스', levels: '노멀 290 / 하드 290' },
  { boss: '최초의 대적자', levels: '이지 270 / 노멀 280 / 하드 285 / 익스트림 290' },
  { boss: '찬란한 흉성', levels: '노멀 280 / 하드 280' },
  { boss: '유피테르', levels: '노멀 295 / 하드 295' },
  { boss: '벨로나', levels: '이지 280 / 노멀 280 / 하드 280' },
];

const bossLevelDamageRows = [
  ['캐릭터-보스 레벨 차이', '보스에게 주는 데미지'],
  ['+5 이상', '120%'],
  ['+4', '118%'],
  ['+3', '116%'],
  ['+2', '114%'],
  ['+1', '112%'],
  ['0', '110%'],
  ['-1', '105.3%'],
  ['-2', '100.7%'],
  ['-3', '96.2%'],
  ['-4', '91.8%'],
  ['-5 ~ -40', '87.5% ~ 0%'],
] as const;

export function formatBossLevelBoost(args: string[] = []): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  return [
    '[보스 레벨 및 레벨 차이 보정]',
    '범위: 검은 마법사(하드)부터 벨로나까지',
    '────────────',
    ...bossLevelRows.flatMap((row) => [
      `• ${row.boss}`,
      ...row.levels.split(' / ').map((level) => `  └ ${level}`),
      '',
    ]),
    '',
    '[레벨 차이에 따른 보스 데미지 보정]',
    '────────────',
    ...bossLevelDamageRows
      .slice(1)
      .flatMap(([difference, damage]) => [
        `• 레벨 차이 ${difference}`,
        `  └ 보스 데미지: ${damage}`,
      ]),
    '출처: https://matsu1207.tistory.com/772',
  ].join('\n');
}

type BossForceRow = { boss: string; phaseOrDifficulty: string; normal: number; bonus: number };

const authenticBossForceRows: BossForceRow[] = [
  { boss: '세렌', phaseOrDifficulty: '1페이즈', normal: 150, bonus: 200 },
  { boss: '세렌', phaseOrDifficulty: '2페이즈', normal: 200, bonus: 250 },
  { boss: '칼로스', phaseOrDifficulty: '이지', normal: 200, bonus: 250 },
  { boss: '칼로스', phaseOrDifficulty: '노멀(2페이즈)', normal: 250, bonus: 300 },
  { boss: '칼로스', phaseOrDifficulty: '하드', normal: 330, bonus: 380 },
  { boss: '칼로스', phaseOrDifficulty: '익스트림', normal: 440, bonus: 490 },
  { boss: '카링', phaseOrDifficulty: '이지', normal: 230, bonus: 280 },
  { boss: '카링', phaseOrDifficulty: '노멀', normal: 330, bonus: 380 },
  { boss: '카링', phaseOrDifficulty: '하드', normal: 350, bonus: 400 },
  { boss: '카링', phaseOrDifficulty: '익스트림', normal: 480, bonus: 530 },
  { boss: '최초의 대적자', phaseOrDifficulty: '이지', normal: 220, bonus: 270 },
  { boss: '최초의 대적자', phaseOrDifficulty: '노멀', normal: 320, bonus: 370 },
  { boss: '최초의 대적자', phaseOrDifficulty: '하드', normal: 340, bonus: 390 },
  { boss: '최초의 대적자', phaseOrDifficulty: '익스트림', normal: 460, bonus: 510 },
  { boss: '찬란한 흉성', phaseOrDifficulty: '노멀', normal: 400, bonus: 450 },
  { boss: '찬란한 흉성', phaseOrDifficulty: '하드', normal: 550, bonus: 600 },
  { boss: '림보', phaseOrDifficulty: '노멀·하드', normal: 500, bonus: 550 },
  { boss: '발드릭스', phaseOrDifficulty: '노멀·하드', normal: 700, bonus: 750 },
  { boss: '유피테르', phaseOrDifficulty: '노멀·하드', normal: 810, bonus: 860 },
];

export function formatBossForceBoost(args: string[] = []): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  return [
    '[어센틱 보스 포스 보정]',
    '────────────',
    ...authenticBossForceRows.flatMap((row) => [
      `• ${row.boss} (${row.phaseOrDifficulty})`,
      `  └ 100% 피해 포스: ${row.normal}`,
      `  └ 125% 피해 포스: ${row.bonus}`,
      '',
    ]),
    '※ 어센틱 포스 +50 달성 시 125% 피해가 적용됩니다.',
    '출처: https://matsu1207.tistory.com/771?category=1218857',
  ].join('\n');
}

const netflixTitles = [
  '오징어 게임',
  '기묘한 이야기',
  '더 글로리',
  '브리저튼',
  '웬즈데이',
  '종이의 집',
  '나르코스',
  '블랙 미러',
  '퀸스 갬빗',
  'D.P.',
  '스위트홈',
  '킹덤',
  '지옥',
  '이상한 변호사 우영우',
  '마스크걸',
  '더 에이트 쇼',
  '사냥개들',
  '살인자ㅇ난감',
] as const;
const netflixCountryByTitle: Record<string, string> = {
  '오징어 게임': 'KR',
  '더 글로리': 'KR',
  스위트홈: 'KR',
  킹덤: 'KR',
  지옥: 'KR',
  '이상한 변호사 우영우': 'KR',
  마스크걸: 'KR',
  '더 에이트 쇼': 'KR',
  사냥개들: 'KR',
  살인자ㅇ난감: 'KR',
  '기묘한 이야기': 'US',
  브리저튼: 'US',
  웬즈데이: 'US',
  '종이의 집': 'ES',
  나르코스: 'US',
  '블랙 미러': 'GB',
  '퀸스 갬빗': 'US',
  'D.P.': 'KR',
};

const animeCatalog = {
  완결: [
    '카우보이 비밥',
    '어떤 마술의 금서목록',
    '슈타인즈 게이트',
    '하이큐!!',
    '고블린 슬레이어',
    '세토의 신부',
    '꼭두각시 서커스',
    '시원찮은 그녀를 위한 육성방법',
  ],
  방영중: [
    'Re: 제로부터 시작하는 이세계 생활 4기',
    '원피스',
    '무직전생 Ⅲ ~이세계에 갔으면 최선을 다한다~',
    '전생했더니 슬라임이었던 건에 대하여 4기',
    '공각기동대 THE GHOST IN THE SHELL',
    '유녀전기 2기',
    '그랑블루 3기',
    '블리치 천년혈전 편',
  ],
  극장판: [
    '스즈메의 문단속',
    '너의 이름은.',
    '날씨의 아이',
    '더 퍼스트 슬램덩크',
    '극장판 귀멸의 칼날: 무한열차편',
    '센과 치히로의 행방불명',
    '하울의 움직이는 성',
    '목소리의 형태',
  ],
} as const;

export function formatNetflixRecommendation(
  random = Math.random,
  titles: readonly (string | { title: string; country?: string })[] = netflixTitles,
): string {
  const selected = choose([...titles], random);
  const title = typeof selected === 'string' ? selected : selected.title;
  const country = typeof selected === 'string' ? netflixCountryByTitle[selected] : selected.country;
  return [
    '[넷플릭스 랜덤 추천]',
    `작품: ${country ? `[${countryName(country)}] ` : ''}${title}`,
  ].join('\n');
}

function countryName(code: string): string {
  const names: Record<string, string> = {
    KR: '한국',
    JP: '일본',
    US: '미국',
    GB: '영국',
    CN: '중국',
    FR: '프랑스',
    DE: '독일',
    ES: '스페인',
    IT: '이탈리아',
    IN: '인도',
  };
  return names[code] ?? code;
}

export function formatHotDeals(
  posts: readonly { title: string; url?: string; postedAt?: string }[],
  boardUrl: string,
): string {
  if (posts.length === 0) throw new Error('NOT_FOUND');
  return [
    '[퀘이사존 최신 핫딜]',
    ...posts.slice(0, 5).map((post, index) => `${index + 1}. ${post.title}`),
    '',
    `게시판: ${boardUrl}`,
  ]
    .join('\n')
    .slice(0, 1000);
}

export type HotDealSection = {
  source: string;
  posts: readonly { title: string; url?: string; postedAt?: string }[];
  boardUrl: string;
  state?: 'fresh' | 'stale' | 'unavailable';
};

export function formatHotDealSections(sections: readonly HotDealSection[]): string {
  if (sections.length === 0 || sections.every((section) => section.posts.length === 0))
    throw new Error('NOT_FOUND');
  const lines = ['[커뮤니티 핫딜 모음]', ''];
  for (const section of sections) {
    lines.push(`【${section.source}】`);
    if (section.posts.length === 0) {
      lines.push('현재 조회할 수 없습니다.');
    } else {
      const isQuasarZone = section.source === '퀘이사존';
      const limit = isQuasarZone ? 6 : 5;
      const numberingStart = isQuasarZone ? 0 : 1;
      section.posts.slice(0, limit).forEach((post, index) => {
        const title = post.title.length > 46 ? `${post.title.slice(0, 43)}...` : post.title;
        const postedAt = isQuasarZone && post.postedAt ? ` (${post.postedAt})` : '';
        lines.push(`${numberingStart + index}. ${title}${postedAt}`);
      });
      if (section.state === 'stale') lines.push('※ 최근 정상 조회 결과');
    }
    lines.push(`게시판: ${section.boardUrl}`, '');
  }
  return lines.join('\n').trim().slice(0, 1000);
}

export function formatAnimeRecommendation(random = Math.random): string {
  const categories = Object.keys(animeCatalog) as Array<keyof typeof animeCatalog>;
  const category = choose(categories, random);
  return [
    '[일본 애니메이션 랜덤 추천]',
    `분류: ${category}`,
    `작품: ${choose([...animeCatalog[category]], random)}`,
  ].join('\n');
}

export function formatMangaRecommendation(
  items: readonly { title: string; url: string }[],
  random = Math.random,
): string {
  const item = items[Math.floor(random() * items.length)];
  if (!item) throw new Error('NOT_FOUND');
  return ['[일본 만화 랜덤 추천]', `작품: ${item.title}`].join('\n');
}

export function formatFortune(args: string[] = [], now = new Date()): string {
  const birthDateInput = args[0] ?? '';
  const currentYear = Number(
    new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(now),
  );
  const shortYear = Number(birthDateInput.slice(0, 2));
  const birthDateText = /^\d{6}$/.test(birthDateInput)
    ? `${shortYear <= currentYear % 100 ? 2000 + shortYear : 1900 + shortYear}-${birthDateInput.slice(2, 4)}-${birthDateInput.slice(4, 6)}`
    : birthDateInput;
  const normalizedGender =
    args[1] === '남' || args[1] === '남성'
      ? '남자'
      : args[1] === '여' || args[1] === '여성'
        ? '여자'
        : args[1];
  if (
    args.length !== 3 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(birthDateText) ||
    !/^(?:남자|여자)$/.test(normalizedGender ?? '') ||
    !/^(?:양력|음력)$/.test(args[2]!)
  )
    throw new Error('INVALID_USAGE');
  const birthDate = new Date(`${birthDateText}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime()) || birthDate.toISOString().slice(0, 10) !== birthDateText)
    throw new Error('INVALID_USAGE');
  const birthYear = Number(birthDateText.slice(0, 4));
  if (birthYear < 1900 || birthYear > currentYear) throw new Error('INVALID_USAGE');
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
  const result = calculateDailyFortune({
    birthDate: birthDateText,
    gender: normalizedGender as '남자' | '여자',
    calendar: args[2] as '양력' | '음력',
    targetDate: date,
  });
  return [
    '[오늘의 운세]',
    `생년월일: ${birthDateText} (${normalizedGender} / ${args[2]})`,
    '출생시간: 미입력',
    `기준일: ${date}`,
    `총운: ${result.scores.overall}점 / ${result.overall}`,
    `일·공부운: ${result.scores.work}점 / ${result.work}`,
    `금전운: ${result.scores.money}점 / ${result.money}`,
    `대인운: ${result.scores.relationship}점 / ${result.relationship}`,
    `행운 아이템: ${result.luckyItem}`,
    '※ 출생시간 미입력 기준 오락용 콘텐츠이며 실제 예측이나 투자·의료·법률 조언이 아닙니다.',
  ].join('\n');
}

export function drawLottoNumbers(max: number, count: number, random = Math.random): number[] {
  if (!Number.isInteger(max) || !Number.isInteger(count) || max < 1 || count < 1 || count > max)
    throw new Error('INVALID_USAGE');
  const numbers = new Set<number>();
  while (numbers.size < count) numbers.add(Math.floor(random() * max) + 1);
  return [...numbers].sort((a, b) => a - b);
}

export function formatLotto(random = Math.random): string {
  const korean = drawLottoNumbers(45, 6, random);
  const japanese = drawLottoNumbers(37, 7, random);
  return [
    '[로또 랜덤 뽑기]',
    `한국 로또 6/45: ${korean.map((number) => String(number).padStart(2, '0')).join(', ')}`,
    `일본 로또7: ${japanese.map((number) => String(number).padStart(2, '0')).join(', ')}`,
    '※ 실제 복권 구매·당첨을 보장하지 않는 랜덤 번호 추천입니다.',
  ].join('\n');
}

export function formatJapanTravelRecommendation(args: string[] = [], random = Math.random): string {
  if (args.length > 0) throw new Error('INVALID_USAGE');
  const place = choose([...japanTravelPlaces], random);
  return [
    '[일본여행 추천]',
    `현/도: ${place.prefecture}`,
    `도시: ${place.city}`,
    `추천 포인트: ${place.highlight}`,
    '※ 교통·영업시간·기상은 출발 전에 다시 확인해 주세요.',
  ].join('\n');
}

export function choose<T>(items: T[], random = Math.random): T {
  if (items.length === 0) throw new Error('INVALID_USAGE');
  return items[Math.floor(random() * items.length)] as T;
}

export type RoyalStyleItem = { name: string; probability: number; category?: string };

export function drawRoyalStyles(
  items: RoyalStyleItem[],
  count = 1,
  random = Math.random,
): RoyalStyleItem[] {
  if (items.length === 0 || !Number.isInteger(count) || count < 1 || count > 25)
    throw new Error('INVALID_USAGE');
  const total = items.reduce((sum, item) => sum + item.probability, 0);
  if (!Number.isFinite(total) || total <= 0) throw new Error('PROVIDER_SCHEMA');
  return Array.from({ length: count }, () => {
    let cursor = random() * total;
    for (const item of items) {
      cursor -= item.probability;
      if (cursor < 0) return item;
    }
    return items[items.length - 1]!;
  });
}

export type RoyalDrawOptions = { count: number; showResults: boolean };

export function parseRoyalOptions(args: string[]): RoyalDrawOptions {
  if (args.length > 2) throw new Error('INVALID_USAGE');
  const count = args[0] === undefined || args[0] === '' ? 10 : Number(args[0]);
  if (!Number.isSafeInteger(count) || count < 1 || count > 25) throw new Error('INVALID_USAGE');
  const showResults = args[1] === undefined ? true : args[1].toLocaleLowerCase() === 'true';
  if (args[1] !== undefined && !['true', 'false'].includes(args[1].toLocaleLowerCase()))
    throw new Error('INVALID_USAGE');
  return { count, showResults };
}

export function formatRoyalDraw(
  items: RoyalStyleItem[],
  sourceUrl: string,
  fetchedAt: string,
  count = 10,
  showResults = true,
  random = Math.random,
): string {
  return formatWeightedDraw(
    `[로얄스타일 ${count}회 뽑기]`,
    items,
    sourceUrl,
    fetchedAt,
    count,
    showResults,
    random,
    false,
    (item) =>
      item.name.includes('스페셜 라벨')
        ? item.name.startsWith('[스페셜 라벨]')
          ? item.name
          : `[스페셜 라벨] ${item.name}`
        : item.name,
    false,
  );
}

export function formatWonderBerryDraw(
  items: RoyalStyleItem[],
  sourceUrl: string,
  fetchedAt: string,
  count = 10,
  showResults = true,
  random = Math.random,
): string {
  const wonderBlackNames = new Set(['토토 사원', '곰곰 사원', '펭펭 사원']);
  return formatWeightedDraw(
    `[위습의 원더베리 ${count}회 뽑기]`,
    items,
    sourceUrl,
    fetchedAt,
    count,
    showResults,
    random,
    false,
    (item) =>
      item.category?.includes('희귀') ||
      item.probability <= 3.3 ||
      wonderBlackNames.has(item.name.trim())
        ? `[원더블랙] ${item.name}`
        : item.name,
    false,
  );
}

export function formatBoutiqueGiftDraw(
  normalItems: RoyalStyleItem[],
  feverItems: RoyalStyleItem[],
  random = Math.random,
): string {
  const normalDraws = drawRoyalStyles(normalItems, 9, random);
  const feverDraw = drawRoyalStyles(feverItems, 1, random)[0]!;
  return [
    '[부티크 기프트 10개 열기]',
    ...normalDraws.map(
      (item, index) => `${index + 1}. ${item.name} (${item.probability.toFixed(2)}%)`,
    ),
    `10. [피버 타임] ${feverDraw.name} (${feverDraw.probability.toFixed(2)}%)`,
  ].join('\n');
}

export function formatLunaCrystalSweetDraw(
  kind: '일반' | '스페셜',
  items: RoyalStyleItem[],
  sourceUrl: string,
  fetchedAt: string,
  count = 1,
  showResults = true,
  random = Math.random,
): string {
  return formatWeightedDraw(
    `[루나 크리스탈 스윗 합성]\n재료: 원더 블랙 + 원더 블랙`,
    items,
    sourceUrl,
    fetchedAt,
    count,
    showResults,
    random,
    false,
    (item) =>
      Math.abs(item.probability - 3.9) < 0.001 ||
      item.category?.includes('쁘띠') ||
      item.name.includes('쁘띠')
        ? `[쁘띠] ${item.name}`
        : `[스윗] ${item.name}`,
    false,
  );
}

export function formatLunaCrystalDreamDraw(
  kind: '일반' | '스페셜',
  items: RoyalStyleItem[],
  sourceUrl: string,
  fetchedAt: string,
  count = 1,
  showResults = true,
  random = Math.random,
): string {
  return formatWeightedDraw(
    `[루나 크리스탈 드림 합성]\n재료: 원더 스윗 + 원더 블랙`,
    items,
    sourceUrl,
    fetchedAt,
    count,
    showResults,
    random,
    false,
    (item) => {
      if (Math.abs(item.probability - 8.4) < 0.001) return `[뒤진라벨] ${item.name}`;
      if (Math.abs(item.probability - 6.8) < 0.001) return `[쁘띠] ${item.name}`;
      if (item.category?.includes('쁘띠') || item.name.includes('쁘띠'))
        return `[쁘띠] ${item.name}`;
      if (item.category?.includes('드림') || item.name.includes('드림'))
        return `[뒤진펫] ${item.name}`;
      return item.name;
    },
    false,
  );
}

function formatWeightedDraw(
  title: string,
  items: RoyalStyleItem[],
  sourceUrl: string,
  fetchedAt: string,
  count = 10,
  showResults = true,
  random = Math.random,
  includeSourceUrl = true,
  label: (item: RoyalStyleItem) => string = (item) => item.name,
  includeMetadata = true,
): string {
  const draws = drawRoyalStyles(items, count, random);
  return [
    title,
    ...(showResults
      ? draws.map((item, index) => `${index + 1}. ${label(item)} (${item.probability.toFixed(1)}%)`)
      : [`상세 결과: 숨김`, `총 뽑기: ${count}개`]),
    ...(includeMetadata
      ? [
          `기준: Nexon 공식 확률 페이지 (${fetchedAt.slice(0, 10)})`,
          ...(includeSourceUrl ? [sourceUrl] : []),
          '※ 실제 구매가 아닌 확률 기반 미니게임입니다.',
        ]
      : []),
  ].join('\n');
}

export function chooseItems(input: string): string {
  const items = [
    ...new Set(
      input
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
  if (items.length < 2 || items.length > 20 || items.some((item) => item.length > 30))
    throw new Error('INVALID_USAGE');
  return choose(items);
}

export function recommendFood(category?: string): string {
  const key = category?.trim() || '전체';
  if (!menus[key]) throw new Error('INVALID_USAGE');
  return choose(menus[key]);
}

export function formatSymbol(kind: string, current: number, target: number, progress = 0): string {
  const amount = calculateSymbol(kind, current, target, progress);
  const meso = calculateSymbolCost(kind, current, target);
  const key = kind.trim() as keyof typeof symbolRegions;
  const family =
    symbolRegions[key] ??
    (['arcane', '아케인'].includes(kind.toLocaleLowerCase()) ? 'arcane' : 'authentic');
  const label = key in symbolRegions ? kind.trim() : family === 'arcane' ? '아케인' : '어센틱';
  const symbolType = ['탈라하트', '기어드락'].includes(label)
    ? '그랜드 어센틱'
    : family === 'arcane'
      ? '아케인'
      : '어센틱';
  return `[${label} ${symbolType}심볼 계산]\nLv.${current} → Lv.${target}\n남은 성장치: ${amount.toLocaleString('ko-KR')}개\n현재 성장치 반영: ${progress}개\n레벨업 메소: ${meso.toLocaleString('ko-KR')}메소\n계산 기준: 2026-08-27`;
}
