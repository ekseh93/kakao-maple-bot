export type PcDealsOperation = 'parts' | 'lowest' | 'compare' | 'history' | 'detail' | 'compatibility';

export type PcDealsRequest = { operation: PcDealsOperation; args: string[] };

export function formatPcDealsHelp(): string {
  return ['[다나와 PC 명령어]', '!다나와 도움말', '!다나와견적 <예산> <용도> [모니터포함]', '!다나와부품 <검색어>', '!다나와최저가 <검색어>', '!다나와가격비교 <검색어>', '!다나와가격이력 <제품코드> [1|3|6|12]', '!다나와부품상세 <제품코드>', '!다나와호환성 <부품 목록>'].join('\n');
}

export function formatPcDeals(operation: PcDealsOperation, text: string): string {
  const title = { parts: '부품 검색', lowest: '최저가', compare: '가격 비교', history: '가격 이력', detail: '부품 상세', compatibility: '호환성 검사' }[operation];
  return `[다나와 ${title}]\n${text.trim() || '조회 결과가 없습니다.'}`;
}
