export type RetailProductView = {
  name: string;
  price?: number;
  soldOut?: boolean;
  pickupAvailable?: boolean;
  brand?: string;
};
export type FuelPriceView = {
  productName: string;
  price: number;
  diff?: number;
  tradeDate?: string;
};
export type FuelStationView = {
  name: string;
  brandName?: string;
  price: number;
  address?: string;
  roadAddress?: string;
};

const won = (value: number | undefined): string =>
  value === undefined ? '가격 확인 필요' : `${value.toLocaleString('ko-KR')}원`;

export function formatDaisoProducts(query: string, products: readonly RetailProductView[]): string {
  return [
    `[다이소 상품 검색: ${query}]`,
    ...products.slice(0, 5).map((item, index) => {
      const flags = [
        item.soldOut ? '품절' : '판매중',
        item.pickupAvailable ? '픽업 가능' : '픽업 확인 필요',
      ];
      return `${index + 1}. ${item.name}\n   가격: ${won(item.price)} / ${flags.join(', ')}`;
    }),
    '※ 상품·가격·픽업 정보는 외부 조회 시점 기준 참고용입니다.',
  ].join('\n');
}

export function formatNationalFuelPrices(prices: readonly FuelPriceView[]): string {
  const tradeDate = prices.find((item) => item.tradeDate)?.tradeDate;
  return [
    '[전국 평균 유가]',
    ...(tradeDate
      ? [`기준일: ${tradeDate.slice(0, 4)}-${tradeDate.slice(4, 6)}-${tradeDate.slice(6, 8)}`]
      : []),
    ...prices.map(
      (item) =>
        `${item.productName}: ${item.price.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}원${item.diff !== undefined ? ` (${item.diff >= 0 ? '+' : ''}${item.diff.toFixed(2)})` : ''}`,
    ),
    '※ 한국석유공사 오피넷 전국 평균 기준 참고용 정보입니다.',
  ].join('\n');
}

export function formatLowestFuelStations(
  region: string | undefined,
  stations: readonly FuelStationView[],
): string {
  return [
    `[${region ?? '전국'} 최저가 주유소 TOP 3]`,
    '유종: 휘발유',
    ...stations
      .slice(0, 3)
      .map(
        (item, index) =>
          `${index + 1}위. ${item.name}${item.brandName ? ` (${item.brandName})` : ''}\n   가격: ${item.price.toLocaleString('ko-KR')}원/L\n   주소: ${item.roadAddress ?? item.address ?? '주소 확인 필요'}`,
      ),
    '※ 한국석유공사 오피넷 조회 시점 기준 참고용 정보입니다.',
  ].join('\n');
}
