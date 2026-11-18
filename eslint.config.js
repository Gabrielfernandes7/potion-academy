// ESLint (config plana). Só regras que apontam erro de verdade; o estilo fica com o Prettier.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'public/**', 'docs/**', 'scripts/**', 'silhuetas.png'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'vite.config.ts'],
    rules: {
      // o código usa `_` para argumentos que não precisa
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
