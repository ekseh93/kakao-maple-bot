export type CommandName =
  | 'help'
  | 'rps'
  | 'choice'
  | 'food'
  | 'symbol'
  | 'hexa'
  | 'dojang'
  | 'union'
  | 'equipment'
  | 'notice'
  | 'event'
  | 'sunday'
  | 'fragment'
  | 'experience'
  | 'character'
  | 'stock'
  | 'status';
export type ParsedCommand = { name: CommandName; args: string[] };

export const HELP = `[봇 도움말]\n!캐릭터 닉네임 (또는 !정보 닉네임)\n!헥사 닉네임\n!무릉 닉네임\n!유니온 닉네임\n!장비 닉네임\n!공지\n!이벤트\n!썬데이\n!조각\n!경험치 닉네임 (또는 /경험치 닉네임)\n!심볼 여로 1 20 (또는 !심볼계산)\n!심볼 기어드락 1 11\n!가위 / !바위 / !보\n!골라 짜장,짬뽕\n!뭐먹지 한식\n!주식 005930\n!상태 (관리자 전용)`;

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
  헥사: 'hexa',
  무릉: 'dojang',
  유니온: 'union',
  장비: 'equipment',
  공지: 'notice',
  이벤트: 'event',
  썬데이: 'sunday',
  조각: 'fragment',
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
  전체: ['김치찌개', '돈카츠', '비빔밥', '파스타', '떡볶이'],
  한식: ['김치찌개', '비빔밥'],
  중식: ['짜장면', '짬뽕'],
  일식: ['돈카츠', '초밥'],
  양식: ['파스타', '오므라이스'],
  분식: ['떡볶이', '김밥'],
  야식: ['치킨', '족발'],
  가벼운: ['샐러드', '샌드위치'],
};

export function choose<T>(items: T[], random = Math.random): T {
  if (items.length === 0) throw new Error('INVALID_USAGE');
  return items[Math.floor(random() * items.length)] as T;
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
