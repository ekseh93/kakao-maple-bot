export type ExchangeRateView = {
  usdKrw: number;
  jpyKrw: number;
  updatedAt?: string;
};

const numberFormat = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatExchangeRates(rates: ExchangeRateView): string {
  return [
    '[환율]',
    `달러(USD): 1달러 = ${numberFormat.format(rates.usdKrw)}원`,
    `엔화(JPY): 100엔 = ${numberFormat.format(rates.jpyKrw * 100)}원`,
    ...(rates.updatedAt ? [`기준 시각: ${rates.updatedAt}`] : []),
  ].join('\n');
}
