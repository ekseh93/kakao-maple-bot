export type PcQuoteRequest = {
  budgetKrw: number;
  /** Upper bound for the requested budget band (e.g. 100만원 => 1,999,999원). */
  budgetMaxKrw?: number;
  usage: 'gaming' | 'work' | 'video' | 'office';
  monitorIncluded: boolean;
};

export type PcQuoteItem = {
  category: string;
  name: string;
  priceKrw: number;
  url?: string;
};

export type PcQuote = {
  label: string;
  totalKrw: number;
  items: PcQuoteItem[];
  compatibility: '정상' | '확인 필요';
  source: string;
  fetchedAt: string;
};

const usageAliases: Record<string, PcQuoteRequest['usage']> = {
  게이밍: 'gaming',
  게임: 'gaming',
  gaming: 'gaming',
  작업용: 'work',
  작업: 'work',
  전문가용: 'work',
  work: 'work',
  영상편집: 'video',
  영상: 'video',
  '3d': 'video',
  video: 'video',
  사무용: 'office',
  사무: 'office',
  office: 'office',
};

function invalid(): never {
  throw new Error('INVALID_USAGE');
}

function parseBudget(value: string): { minKrw: number; maxKrw: number } | undefined {
  const normalized = value.replace(/,/g, '').toLocaleLowerCase();
  const match = normalized.match(/^(\d+(?:\.\d+)?)(억|만원|만|원)(?:대)?$/);
  if (!match) return undefined;
  const amount = Number(match[1]);
  const multiplier = match[2] === '억' ? 100_000_000 : match[2] === '원' ? 1 : 10_000;
  const budget = amount * multiplier;
  if (!Number.isSafeInteger(budget) || budget < 100_000) return undefined;
  const isWholeManwonBand = (match[2] === '만원' || match[2] === '만') && Number.isInteger(amount);
  return {
    minKrw: budget,
    maxKrw: isWholeManwonBand ? budget + 999_999 : budget,
  };
}

export function parsePcQuoteArgs(args: string[]): PcQuoteRequest {
  if (args.length === 0) throw new Error('PC_QUOTE_HELP');
  const budget = parseBudget(args[0] ?? '');
  if (budget === undefined) invalid();
  const monitorIncluded = args.some((arg) => /모니터/.test(arg));
  const usageToken = args.find((arg) => usageAliases[arg.toLocaleLowerCase()]);
  const usage = usageToken ? usageAliases[usageToken.toLocaleLowerCase()] : undefined;
  if (!usage) invalid();
  return { budgetKrw: budget.minKrw, budgetMaxKrw: budget.maxKrw, usage, monitorIncluded };
}

function formatKrw(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('INVALID_PROVIDER_RESPONSE');
  return `${value.toLocaleString('ko-KR')}원`;
}

export function formatPcQuoteHelp(): string {
  return [
    '[PC 견적 사용법]',
    '!다나와견적 100만원 게이밍',
    '!다나와견적 150만원 영상편집',
    '!다나와견적 200만원 작업용',
    '!다나와견적 80만원 사무용',
    '!다나와견적 100만원 게이밍 모니터포함',
    '예산은 원·만원·억 단위를 지원합니다.',
    '실시간 가격은 조회 시각과 출처를 함께 표시합니다.',
  ].join('\n');
}

export function formatPcQuotes(request: PcQuoteRequest, quotes: PcQuote[]): string {
  if (quotes.length === 0) return '[PC 견적]\n조건에 맞는 견적을 찾지 못했습니다.';
  const usageLabel = { gaming: '게이밍', work: '작업용', video: '영상편집', office: '사무용' }[
    request.usage
  ];
  const lines = [
    `[${usageLabel} ${formatKrw(request.budgetKrw)} 견적${request.monitorIncluded ? '·모니터 포함' : ''}]`,
  ];
  quotes.slice(0, 3).forEach((quote, index) => {
    lines.push(
      '',
      `${index + 1}안 · ${quote.label}`,
      `합계: ${formatKrw(quote.totalKrw)}`,
      `호환성: ${quote.compatibility}`,
    );
    quote.items
      .slice(0, 10)
      .forEach((item) =>
        lines.push(`${item.category}: ${item.name} (${formatKrw(item.priceKrw)})`),
      );
    lines.push(`출처: ${quote.source} · ${quote.fetchedAt}`);
    const links = quote.items
      .map((item) => item.url)
      .filter((url): url is string => Boolean(url))
      .slice(0, 2);
    if (links.length > 0) lines.push(...links.map((url) => `링크: ${url}`));
  });
  lines.push('', '※ 가격은 실시간으로 변동될 수 있습니다. 구매 전 판매처에서 다시 확인하세요.');
  return lines.join('\n');
}
