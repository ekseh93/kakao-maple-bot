type CalculatorUnit = 'scalar' | 'percent' | 'count';
type CalculatorValue = { amount: number; unit: CalculatorUnit };
type Operator = '+' | '-' | '*' | '/';
type Token =
  | { type: 'value'; value: CalculatorValue }
  | { type: 'operator'; value: Operator }
  | { type: 'leftParen' }
  | { type: 'rightParen' };

const MAX_EXPRESSION_LENGTH = 280;
const MAX_TOKEN_COUNT = 100;
const MAX_ABSOLUTE_RESULT = 1_000_000_000_000_000;

function invalid(): never {
  throw new Error('INVALID_USAGE');
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < expression.length) {
    const rest = expression.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }

    const numberMatch = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (numberMatch) {
      const amount = Number(numberMatch[0]);
      if (!Number.isFinite(amount)) invalid();
      index += numberMatch[0].length;
      let unit: CalculatorUnit = 'scalar';
      if (expression.startsWith('퍼', index)) {
        unit = 'percent';
        index += 1;
      } else if (expression.startsWith('%', index)) {
        unit = 'percent';
        index += 1;
      } else if (expression.startsWith('개', index)) {
        unit = 'count';
        index += 1;
      }
      tokens.push({ type: 'value', value: { amount, unit } });
    } else {
      const character = expression[index]!;
      if (character === '(') tokens.push({ type: 'leftParen' });
      else if (character === ')') tokens.push({ type: 'rightParen' });
      else if (character === '+' || character === '-') {
        tokens.push({ type: 'operator', value: character });
      } else if (character === '*' || character === 'x' || character === 'X' || character === '×') {
        tokens.push({ type: 'operator', value: '*' });
      } else if (character === '/' || character === '÷') {
        tokens.push({ type: 'operator', value: '/' });
      } else invalid();
      index += 1;
    }

    if (tokens.length > MAX_TOKEN_COUNT) invalid();
  }
  return tokens;
}

function assertResult(value: CalculatorValue): CalculatorValue {
  if (!Number.isFinite(value.amount) || Math.abs(value.amount) > MAX_ABSOLUTE_RESULT) invalid();
  return value;
}

function addOrSubtract(
  left: CalculatorValue,
  right: CalculatorValue,
  operator: '+' | '-',
): CalculatorValue {
  if (left.unit !== right.unit) invalid();
  return assertResult({
    amount: operator === '+' ? left.amount + right.amount : left.amount - right.amount,
    unit: left.unit,
  });
}

function multiply(left: CalculatorValue, right: CalculatorValue): CalculatorValue {
  let unit: CalculatorUnit;
  if (left.unit === 'scalar') unit = right.unit;
  else if (right.unit === 'scalar') unit = left.unit;
  else if (
    (left.unit === 'percent' && right.unit === 'count') ||
    (left.unit === 'count' && right.unit === 'percent')
  ) {
    unit = 'percent';
  } else invalid();
  return assertResult({ amount: left.amount * right.amount, unit });
}

function divide(left: CalculatorValue, right: CalculatorValue): CalculatorValue {
  if (right.amount === 0) invalid();
  let unit: CalculatorUnit;
  if (right.unit === 'scalar') unit = left.unit;
  else if (left.unit === right.unit) unit = 'scalar';
  else if (left.unit === 'percent' && right.unit === 'count') unit = 'percent';
  else invalid();
  return assertResult({ amount: left.amount / right.amount, unit });
}

function calculate(tokens: Token[]): CalculatorValue {
  let index = 0;

  const parsePrimary = (): CalculatorValue => {
    const token = tokens[index];
    if (!token) invalid();
    if (token.type === 'value') {
      index += 1;
      return token.value;
    }
    if (token.type === 'leftParen') {
      index += 1;
      const value = parseAddSubtract();
      if (tokens[index]?.type !== 'rightParen') invalid();
      index += 1;
      return value;
    }
    invalid();
  };

  const parseUnary = (): CalculatorValue => {
    const token = tokens[index];
    if (token?.type === 'operator' && (token.value === '+' || token.value === '-')) {
      index += 1;
      const value = parseUnary();
      return token.value === '-' ? { ...value, amount: -value.amount } : value;
    }
    return parsePrimary();
  };

  const parseMultiplyDivide = (): CalculatorValue => {
    let left = parseUnary();
    while (true) {
      const token = tokens[index];
      if (token?.type !== 'operator' || (token.value !== '*' && token.value !== '/')) break;
      index += 1;
      const right = parseUnary();
      left = token.value === '*' ? multiply(left, right) : divide(left, right);
    }
    return left;
  };

  const parseAddSubtract = (): CalculatorValue => {
    let left = parseMultiplyDivide();
    while (true) {
      const token = tokens[index];
      if (token?.type !== 'operator' || (token.value !== '+' && token.value !== '-')) break;
      index += 1;
      left = addOrSubtract(left, parseMultiplyDivide(), token.value);
    }
    return left;
  };

  const result = parseAddSubtract();
  if (index !== tokens.length) invalid();
  return assertResult(result);
}

function formatNumber(value: number): string {
  const normalized = Math.abs(value) < 0.00000000005 ? 0 : Number(value.toFixed(10));
  return normalized.toLocaleString('ko-KR', {
    maximumFractionDigits: 10,
    useGrouping: true,
  });
}

function formatValue(value: CalculatorValue): string {
  const suffix = value.unit === 'percent' ? '퍼' : value.unit === 'count' ? '개' : '';
  return `${formatNumber(value.amount)}${suffix}`;
}

function normalizeDisplay(expression: string): string {
  return expression
    .replace(/%/g, '퍼')
    .replace(/[xX*]/g, '×')
    .replace(/\//g, '÷')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatMeso(amount: number): string {
  const exact = `${amount.toLocaleString('ko-KR')} 메소`;
  if (amount < 100_000_000) return exact;
  const eok = (amount / 100_000_000).toFixed(2).replace(/\.?0+$/, '');
  return `${exact} (${eok}억)`;
}

function parseMesoPrice(value: string): number | undefined {
  const normalized = value.replace(/,/g, '');
  const eokMatch = normalized.match(/^([0-9]+(?:\.[0-9]+)?)억$/);
  const amount = eokMatch ? Number(eokMatch[1]) * 100_000_000 : Number(normalized);
  if (!Number.isSafeInteger(amount) || amount <= 0) return undefined;
  return amount;
}

function formatFeeSplit(expression: string): string | undefined {
  const match = expression.match(
    /^\s*([0-9][0-9,]*(?:\.[0-9]+)?(?:억)?)\s+(\d+)(?:인|명)\s+(3|5)\s*(?:%|퍼)\s*$/,
  );
  if (!match) return undefined;
  const price = parseMesoPrice(match[1]!);
  const partySize = Number(match[2]);
  const feePercent = Number(match[3]);
  if (price === undefined || !Number.isInteger(partySize) || partySize < 1 || partySize > 100) {
    invalid();
  }
  const fee = Math.floor((price * feePercent) / 100);
  const afterFee = price - fee;
  const perPerson = Math.floor(afterFee / partySize);
  const remainder = afterFee - perPerson * partySize;
  return [
    '[수수료·n빵 계산]',
    `원금: ${formatMeso(price)}`,
    `수수료: ${feePercent}% = ${formatMeso(fee)}`,
    `수수료 제외: ${formatMeso(afterFee)}`,
    `${partySize}인 분배: ${formatMeso(perPerson)}`,
    ...(remainder > 0 ? [`분배 잔액: ${remainder.toLocaleString('ko-KR')} 메소`] : []),
  ].join('\n');
}

export function formatCalculator(args: string[] = []): string {
  if (args.length === 0) {
    return [
      '[일반 계산기 사용법]',
      '!계산기 12 x 11',
      '!계산기 12퍼 x 11개',
      '!계산기 2,530,000,000 2인 3%',
      '!계산기 25.3억 2명 5퍼',
      '수수료는 3% 또는 5%, 인원은 n인 또는 n명으로 입력합니다.',
      '지원: +, -, x, ×, *, /, ÷, 괄호',
    ].join('\n');
  }
  const expression = args.join(' ').trim();
  if (!expression || expression.length > MAX_EXPRESSION_LENGTH) invalid();
  const feeSplit = formatFeeSplit(expression);
  if (feeSplit) return feeSplit;
  const tokens = tokenize(expression);
  if (tokens.length === 0) invalid();
  const result = calculate(tokens);
  return ['[일반 계산기]', `${normalizeDisplay(expression)} = ${formatValue(result)}`].join('\n');
}
