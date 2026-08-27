export type CommandName =
  | 'help'
  | 'rps'
  | 'choice'
  | 'food'
  | 'japanTravel'
  | 'fortune'
  | 'lotto'
  | 'symbol'
  | 'dojang'
  | 'union'
  | 'unionChampion'
  | 'equipment'
  | 'notice'
  | 'inven'
  | 'webtoon'
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
  | 'status';
export type ParsedCommand = { name: CommandName; args: string[] };

export const HELP = `[봇 도움말]\n【메이플스토리】\n!정보 닉네임 — 캐릭터 조회\n!무릉 닉네임 — 무릉 기록\n!유니온 닉네임 — 유니온 요약\n!유챔 닉네임 — 유니온 챔피언\n!장비 닉네임 — 장비 요약\n!경험치 닉네임 — 경험치 이력\n!심볼 기어드락 1 11 — 심볼 계산\n!공지 — 공식 공지\n!이벤트 — 진행 이벤트\n!썬데이 / !선데이 — 썬데이 메이플\n!인벤 — 인벤 10추글\n!웹툰 — 네이버 웹툰 추천\n!부티크 — 부티크 기프트\n!로얄 — 로얄스타일\n!원더베리 — 위습의 원더베리\n!루나스윗 — 루나 크리스탈\n!루나드림 — 루나 크리스탈\n\n【기타 기능】\n!날씨 지역명 — 날씨 조회\n!가위 / !바위 / !보 — 가위바위보\n!골라 짜장,짬뽕 — 메뉴 선택\n!뭐먹지 — 메뉴 추천\n!일본여행 — 여행지 추천\n!운세 00년생 — 오늘의 운세\n!로또 — 한·일 번호 추천\n!주식 이름 — 주식 시세\n!상태 — 관리자 전용`;

const aliases: Record<string, CommandName> = {
  도움말: 'help',
  명령어: 'help',
  help: 'help',
  캐릭터: 'character',
  정보: 'character',
  메이플: 'character',
  캐릭: 'character',
  심볼: 'symbol',
  심볼계산: 'symbol',
  무릉: 'dojang',
  유니온: 'union',
  유챔: 'unionChampion',
  장비: 'equipment',
  공지: 'notice',
  인벤: 'inven',
  웹툰: 'webtoon',
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
  골라: 'choice',
  선택: 'choice',
  뭐먹지: 'food',
  메뉴: 'food',
  뭐먹을까: 'food',
  일본여행: 'japanTravel',
  운세: 'fortune',
  로또: 'lotto',
  주식: 'stock',
  상태: 'status',
};

export function parseCommand(message: string): ParsedCommand | null {
  const value = message.trim();
  if ((!value.startsWith('!') && !value.startsWith('/')) || value.length > 300) return null;
  const [raw, ...args] = value.slice(1).split(/\s+/);
  const normalizedRaw = raw?.toLocaleLowerCase() ?? '';
  const name = aliases[normalizedRaw];
  if (!name) return { name: 'help', args: [] };
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
  ],
  한식: ['김치찌개', '비빔밥', '삼겹살', '제육볶음', '불고기', '닭갈비', '국밥', '냉면'],
  중식: ['짜장면', '짬뽕', '탕수육', '마라탕', '볶음밥'],
  일식: ['돈카츠', '초밥', '라멘', '우동', '규동'],
  양식: ['파스타', '오므라이스', '피자', '햄버거', '리조또'],
  분식: ['떡볶이', '김밥', '순대', '어묵', '라볶이'],
  야식: ['치킨', '족발', '보쌈', '곱창', '닭발'],
  가벼운: ['샐러드', '샌드위치', '포케', '죽'],
};

const foodBoostWeight = 1.5;

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
  return [
    '[오늘 뭐먹지]',
    `추천: ${selected.name}`,
    '전체 요리 확률:',
    ...probabilities.map((item) => `- ${item.name}: ${item.probability.toFixed(2)}%`),
    '※ 재획은 다른 음식보다 50% 높은 가중치로 계산했습니다.',
  ].join('\n');
}

const japanTravelPlaces = [
  { prefecture: '도쿄도', city: '도쿄', highlight: '도심 관광·쇼핑·전시' },
  { prefecture: '오사카부', city: '오사카', highlight: '먹거리·도톤보리·근교 여행' },
  { prefecture: '교토부', city: '교토', highlight: '사찰·전통 거리·문화재' },
  { prefecture: '홋카이도', city: '삿포로', highlight: '미식·자연·계절 축제' },
  { prefecture: '후쿠오카현', city: '후쿠오카', highlight: '라멘·온천·짧은 도심 여행' },
  { prefecture: '오키나와현', city: '나하', highlight: '해변·섬 풍경·류큐 문화' },
  { prefecture: '나라현', city: '나라', highlight: '사슴공원·고찰·역사 산책' },
  { prefecture: '효고현', city: '고베', highlight: '항구 야경·온천·카페' },
  { prefecture: '히로시마현', city: '히로시마', highlight: '평화공원·미야지마·미식' },
  { prefecture: '나가노현', city: '마쓰모토', highlight: '성곽·산악 풍경·온천' },
  { prefecture: '이시카와현', city: '가나자와', highlight: '정원·전통 공예·해산물' },
  { prefecture: '가나가와현', city: '하코네', highlight: '온천·료칸·후지산 풍경' },
] as const;

const fortuneMessages = {
  overall: [
    '작은 기회가 좋은 흐름으로 이어지는 날입니다.',
    '서두르기보다 순서를 지키면 운이 따릅니다.',
    '새로운 제안은 메모해 두면 좋은 결과로 이어집니다.',
    '익숙한 일에서도 의외의 행운을 발견할 수 있습니다.',
  ],
  work: [
    '미뤄 둔 일을 하나 정리하면 집중력이 올라갑니다.',
    '혼자 판단하기보다 주변 의견을 들으면 실수가 줄어듭니다.',
    '짧고 명확하게 말할수록 협업운이 좋아집니다.',
    '오전에 중요한 일을 먼저 처리해 보세요.',
  ],
  money: [
    '충동구매를 한 번 미루면 금전운이 안정됩니다.',
    '작은 절약이 생각보다 큰 도움이 됩니다.',
    '오늘은 수익보다 지출 점검에 유리한 날입니다.',
    '계획에 없는 결제는 내일 다시 확인하세요.',
  ],
  relationship: [
    '먼저 건넨 짧은 인사가 분위기를 바꿉니다.',
    '상대의 말을 끝까지 들으면 좋은 대화가 됩니다.',
    '고마운 사람에게 안부를 전해 보세요.',
    '가볍게 웃을 수 있는 대화가 행운을 부릅니다.',
  ],
  luckyItem: ['파란색 소품', '따뜻한 음료', '작은 메모장', '편한 운동화'],
} as const;

function fortuneIndex(seed: string, length: number): number {
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  return hash % length;
}

export function formatFortune(args: string[] = [], now = new Date()): string {
  if (args.length !== 1 || !/^(?:\d{2}|\d{4})년생$/.test(args[0]!))
    throw new Error('INVALID_USAGE');
  const birthText = args[0]!.slice(0, -2);
  const birthYear = Number(birthText.length === 2 ? `20${birthText}` : birthText);
  const currentYear = Number(
    new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(now),
  );
  if (birthYear < 1900 || birthYear > currentYear) throw new Error('INVALID_USAGE');
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
  const seed = `${date}:${birthYear}`;
  return [
    '[오늘의 운세]',
    `출생연도: ${birthYear}년생`,
    `기준일: ${date}`,
    `총운: ${fortuneMessages.overall[fortuneIndex(seed + ':overall', fortuneMessages.overall.length)]}`,
    `일/공부운: ${fortuneMessages.work[fortuneIndex(seed + ':work', fortuneMessages.work.length)]}`,
    `금전운: ${fortuneMessages.money[fortuneIndex(seed + ':money', fortuneMessages.money.length)]}`,
    `대인운: ${fortuneMessages.relationship[fortuneIndex(seed + ':relationship', fortuneMessages.relationship.length)]}`,
    `행운 아이템: ${fortuneMessages.luckyItem[fortuneIndex(seed + ':item', fortuneMessages.luckyItem.length)]}`,
    '※ 생년월일 기반 오락용 콘텐츠이며 실제 예측이나 투자·의료·법률 조언이 아닙니다.',
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
  return formatWeightedDraw(
    `[위습의 원더베리 ${count}회 뽑기]`,
    items,
    sourceUrl,
    fetchedAt,
    count,
    showResults,
    random,
    false,
    (item) => (item.name.includes('원더 블랙') ? `[원더 블랙] ${item.name}` : item.name),
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
      item.category?.includes('쁘띠') || item.name.includes('쁘띠')
        ? `[쁘티] ${item.name}`
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
    (item) =>
      item.category?.includes('쁘띠') || item.name.includes('쁘띠')
        ? `[쁘띠] ${item.name}`
        : item.category?.includes('드림') || item.name.includes('드림')
          ? `[뒤진펫] ${item.name}`
          : item.name,
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
        .split(',')
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
