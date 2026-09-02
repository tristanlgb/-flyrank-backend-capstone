import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'coverage/**', '**/dist/**', 'tmp/**', 'week-05-scraper/output/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
    rules: { 'no-console': 'off', 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }
  }
];
