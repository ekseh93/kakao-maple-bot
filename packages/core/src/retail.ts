export type RetailProductView = {
  name: string;
  price?: number;
  soldOut?: boolean;
  pickupAvailable?: boolean;
  brand?: string;
};
export type RetailStoreView = {
  name: string;
  address?: string;
  distanceKm?: number;
  service: string;
};
export type RetailInventoryView = {
  storeName: string;
  address?: string;
  available?: boolean;
  quantity?: number;
};
export type CinemaTheaterView = RetailStoreView;
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
export type NearbyPlaceView = {
  name: string;
  category?: string;
  address?: string;
  roadAddress?: string;
  phone?: string;
};
export type DaisoProductDetailView = {
  name: string;
  price?: number;
  currency?: string;
  brand?: string;
  soldOut?: boolean;
  isNew?: boolean;
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

export function formatComparedProducts(
  query: string,
  products: readonly RetailProductView[],
): string {
  return [
    `[통합 상품 비교: ${query}]`,
    ...products
      .slice(0, 10)
      .map(
        (item, index) =>
          `${index + 1}. ${item.brand ? `[${item.brand}] ` : ''}${item.name}\n   가격: ${won(item.price)}`,
      ),
    '※ 이름이 비슷한 상품을 비교한 참고 결과이며 동일 상품을 보장하지 않습니다.',
  ].join('\n');
}

export function formatStores(
  brand: string,
  location: string,
  stores: readonly RetailStoreView[],
): string {
  return [
    `[${brand} 매장 검색: ${location}]`,
    ...stores
      .slice(0, 5)
      .map(
        (item, index) =>
          `${index + 1}. ${item.name}\n   주소: ${item.address ?? '주소 확인 필요'}${item.distanceKm !== undefined ? `\n   거리: ${item.distanceKm}km` : ''}`,
      ),
    '※ 매장 위치는 외부 조회 시점 기준 참고용입니다.',
  ].join('\n');
}

export function formatDaisoInventory(
  query: string,
  location: string,
  inventory: readonly RetailInventoryView[],
): string {
  return [
    `[다이소 재고 확인: ${query}]`,
    `지역: ${location}`,
    ...inventory
      .slice(0, 5)
      .map(
        (item, index) =>
          `${index + 1}. ${item.storeName}\n   재고: ${item.available === undefined ? '확인 필요' : item.available ? '있음' : '없음'}${item.quantity !== undefined ? ` (${item.quantity}개)` : ''}${item.address ? `\n   주소: ${item.address}` : ''}`,
      ),
    '※ 재고는 실시간 변동으로 실제 매장과 다를 수 있습니다.',
  ].join('\n');
}

export function formatCinemaTheaters(
  location: string,
  theaters: readonly CinemaTheaterView[],
): string {
  return [
    `[영화관 검색: ${location}]`,
    ...theaters
      .slice(0, 9)
      .map(
        (item, index) =>
          `${index + 1}. [${item.service}] ${item.name}\n   주소: ${item.address ?? '주소 확인 필요'}${item.distanceKm !== undefined ? `\n   거리: ${item.distanceKm}km` : ''}`,
      ),
    '※ 극장 정보는 외부 조회 시점 기준이며 상영시간·좌석은 별도 확인이 필요합니다.',
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

export function formatLowestFuelStations(stations: readonly FuelStationView[]): string {
  return [
    '[전국 최저가 주유소 TOP 3]',
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

export function formatNearbyPlaces(
  location: string,
  category: string | undefined,
  places: readonly NearbyPlaceView[],
): string {
  return [
    `[주변 장소: ${location}${category ? ` / ${category}` : ''}]`,
    ...places
      .slice(0, 5)
      .map(
        (item, index) =>
          `${index + 1}. ${item.name}${item.category ? ` (${item.category})` : ''}\n   주소: ${item.roadAddress ?? item.address ?? '주소 확인 필요'}${item.phone ? `\n   전화: ${item.phone}` : ''}`,
      ),
    '※ 장소 정보는 외부 조회 시점 기준 참고용입니다.',
  ].join('\n');
}

export function formatDaisoProductDetail(
  productId: string,
  product: DaisoProductDetailView | null,
): string {
  if (!product) return '정보를 찾지 못했습니다. 입력을 확인해 주세요.';
  return [
    `[다이소 상품 상세: ${productId}]`,
    `상품명: ${product.name}`,
    ...(product.brand ? [`브랜드: ${product.brand}`] : []),
    ...(product.price !== undefined
      ? [
          `가격: ${product.price.toLocaleString('ko-KR')}${product.currency === 'KRW' || !product.currency ? '원' : ` ${product.currency}`}`,
        ]
      : []),
    `상태: ${product.soldOut ? '품절' : '판매중'}`,
    ...(product.isNew !== undefined ? [`신상품: ${product.isNew ? '예' : '아니오'}`] : []),
    '※ 상품 정보는 외부 조회 시점 기준 참고용입니다.',
  ].join('\n');
}
