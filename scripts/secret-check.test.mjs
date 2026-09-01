import assert from 'node:assert/strict';
import test from 'node:test';

import { findSecretLikeValues } from './secret-check-core.mjs';

const environmentKey = ['NEXON', 'API', 'KEY'].join('_');
const credential = ['portfolio', 'fixture', 'credential'].join('-');

test('detects compact, spaced, and quoted environment assignments', () => {
  const inputs = [
    `${environmentKey}=${credential}`,
    `${environmentKey} = ${credential}`,
    `${environmentKey}="${credential}"`,
    `${environmentKey} = '${credential}'`,
  ];

  for (const input of inputs) {
    assert.deepEqual(findSecretLikeValues(input), [
      { label: 'sensitive environment assignment', line: 1 },
    ]);
  }
});

test('allows documented placeholders', () => {
  assert.deepEqual(findSecretLikeValues(`${environmentKey}="REPLACE_WITH_SECRET"`), []);
  assert.deepEqual(findSecretLikeValues("sharedSecret: 'YOUR_SHARED_SECRET'"), []);
});

test('allows empty examples and non-literal configuration references', () => {
  assert.deepEqual(findSecretLikeValues(`${environmentKey}=\nNEXT_VALUE=safe`), []);
  assert.deepEqual(findSecretLikeValues(`${environmentKey} = var.nexon_api_key`), []);
  assert.deepEqual(findSecretLikeValues(`${environmentKey}=process.env.NEXON_API_KEY`), []);
});

test('reports locations without returning credential values', () => {
  const findings = findSecretLikeValues(`safe=true\n${environmentKey}='${credential}'`);
  assert.deepEqual(findings, [{ label: 'sensitive environment assignment', line: 2 }]);
  assert.equal(JSON.stringify(findings).includes(credential), false);
});
