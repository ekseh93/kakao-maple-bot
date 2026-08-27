export type CommandName =
  'help' | 'dice' | 'choice' | 'food' | 'symbol' | 'mapleLink' | 'character' | 'stock' | 'status';
export type ParsedCommand = { name: CommandName; args: string[] };

export const HELP = `[봇 도움말]\n!캐릭터 닉네임\n!메이플링크 닉네임\n!심볼 아케인 1 20\n!주사위 100\n!골라 짜장,짬뽕\n!뭐먹지 한식\n!주식 005930\n!상태 (관리자 전용)`;

const aliases: Record<string, CommandName> = {
  도움말: 'help',
  명령어: 'help',
  help: 'help',
  캐릭터: 'character',
  메이플: 'character',
  캐릭: 'character',
  메이플링크: 'mapleLink',
  심볼: 'symbol',
  주사위: 'dice',
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
  const name = aliases[raw?.toLocaleLowerCase() ?? ''];
  return name ? { name, args } : { name: 'help', args: [] };
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

export function calculateSymbol(
  kind: string,
  current: number,
  target: number,
  progress = 0,
): number {
  const normalized =
    kind.toLocaleLowerCase() === '아케인'
      ? 'arcane'
      : kind.toLocaleLowerCase() === '어센틱'
        ? 'authentic'
        : kind.toLocaleLowerCase();
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

export function mapleLinks(name: string): string {
  const encoded = encodeURIComponent(validateCharacterName(name));
  return `[외부 상세보기]\nMaple.GG: https://maple.gg/u/${encoded}\n환산주스탯: https://maplescouter.com/ko\n외부 사이트에서 직접 검색해 확인하세요.`;
}

export function formatSymbol(kind: string, current: number, target: number, progress = 0): string {
  const amount = calculateSymbol(kind, current, target, progress);
  const label = ['arcane', '아케인'].includes(kind.toLocaleLowerCase()) ? '아케인' : '어센틱';
  return `[${label}심볼 계산]\nLv.${current} → Lv.${target}\n남은 성장치: ${amount.toLocaleString('ko-KR')}개\n현재 성장치 반영: ${progress}개\n계산 기준: 2026-08-26\n메소 비용은 MVP 계산에서 제외됩니다.`;
}
