import js from '@eslint/js';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**'] },
  { ignores: ['**/*.ts'] },
  js.configs.recommended,
  { files: ['**/*.{ts,js}'], rules: { 'no-undef': 'off' } },
];
