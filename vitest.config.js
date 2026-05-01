// Vitest configuration — testes automatizados das funções críticas do Xandroid.
// Para rodar:
//   npm test          → modo watch (re-roda ao salvar)
//   npm run test:run  → roda 1× e sai (CI/automação)
//   npm run test:ui   → interface gráfica no navegador
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.{test,spec}.{js,mjs}'],
  },
});
