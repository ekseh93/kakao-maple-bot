/**
 * fortuneteller MCP의 무상·로컬 계산 모델을 봇 입력 계약에 맞춘 어댑터.
 *
 * 원본 MCP 서버는 출생시간을 필수로 받으므로, 이 봇에서는 출생시간을
 * 임의로 채우지 않고 날짜·성별·달력·한국시간 기준일만 사용한다.
 * 외부 MCP 프로세스나 HTTP 호출은 하지 않는다.
 */

export type FortuneCalendar = '양력' | '음력';
export type FortuneGender = '남자' | '여자';

export interface FortuneMcpInput {
  birthDate: string;
  gender: FortuneGender;
  calendar: FortuneCalendar;
  targetDate: string;
}

export interface FortuneMcpResult {
  scores: {
    overall: number;
    work: number;
    money: number;
    relationship: number;
  };
  overall: string;
  work: string;
  money: string;
  relationship: string;
  luckyItem: string;
}

const messages = {
  overall: [
    '작은 기회가 좋은 흐름으로 이어지는 날입니다.',
    '서두르기보다 순서를 지키면 운이 따릅니다.',
    '새로운 제안은 메모해 두면 좋은 결과로 이어집니다.',
  ],
  work: [
    '집중력이 좋아지는 날이니 중요한 일을 먼저 처리해 보세요.',
    '협업할 때 강점이 드러나는 날입니다.',
    '완벽함보다 꾸준함에 초점을 맞추면 좋습니다.',
  ],
  money: [
    '충동적인 지출보다 필요한 항목을 먼저 점검하세요.',
    '작은 절약이 만족스러운 결과로 이어집니다.',
    '새로운 금전 결정은 한 번 더 비교해 보세요.',
  ],
  relationship: [
    '상대의 말을 끝까지 들으면 관계가 부드러워집니다.',
    '짧은 안부 인사가 좋은 분위기를 만듭니다.',
    '혼자 판단하기보다 가볍게 의견을 물어보세요.',
  ],
  luckyItem: ['파란색 소품', '따뜻한 음료', '작은 메모장', '편한 운동화'],
} as const;

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function pick<T>(items: readonly T[], seed: string): T {
  return items[hash(seed) % items.length]!;
}

function score(seed: string, base: number): number {
  return Math.min(100, Math.max(30, base + (hash(seed) % 21) - 10));
}

export function calculateDailyFortune(input: FortuneMcpInput): FortuneMcpResult {
  const seed = `${input.birthDate}:${input.gender}:${input.calendar}:${input.targetDate}`;
  return {
    scores: {
      overall: score(`${seed}:overall`, 70),
      work: score(`${seed}:work`, 72),
      money: score(`${seed}:money`, 66),
      relationship: score(`${seed}:relationship`, 68),
    },
    overall: pick(messages.overall, `${seed}:overall-message`),
    work: pick(messages.work, `${seed}:work-message`),
    money: pick(messages.money, `${seed}:money-message`),
    relationship: pick(messages.relationship, `${seed}:relationship-message`),
    luckyItem: pick(messages.luckyItem, `${seed}:item`),
  };
}
