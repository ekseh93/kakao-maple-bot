export type CommandName =
  'help' | 'rps' | 'choice' | 'food' | 'symbol' | 'character' | 'stock' | 'status';
export type ParsedCommand = { name: CommandName; args: string[] };

export const HELP = `[봇 도움말]\n!캐릭터 닉네임\n!심볼 여로 1 20\n!심볼 기어드락 1 11\n!가위 / !바위 / !보\n!골라 짜장,짬뽕\n!뭐먹지 한식\n!주식 005930\n!상태 (관리자 전용)`;

const aliases: Record<string, CommandName> = {
  도움말: 'help',
  명령어: 'help',
  help: 'help',
  캐릭터: 'character',
  메이플: 'character',
  캐릭: 'character',
  심볼: 'symbol',
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
  if (!value.startsWith('!') || value.length > 300) return null;
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
    levels: [29, 44, 67, 95, 131, 174, 224, 281, 345, 416],
  },
} as const;

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
  return `[${label} ${symbolType}심볼 계산]\nLv.${current} → Lv.${target}\n남은 성장치: ${amount.toLocaleString('ko-KR')}개\n현재 성장치 반영: ${progress}개\n계산 기준: 2026-08-27\n메소 비용은 MVP 계산에서 제외됩니다.`;
}
