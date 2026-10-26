/*Code Attribution: */
/**************************************************************************************************************
 * Author: Vite Contributors
 * Date: 2026
 * Title: Vite
 * Type: [Source Code]
 * Available at: <https://github.com/vitejs/vite> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Vitest Contributors
 * Date: 2026
 * Title: Vitest
 * Type: [Source Code]
 * Available at: <https://github.com/vitest-dev/vitest> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: jsdom Contributors
 * Date: 2026
 * Title: jsdom
 * Type: [Source Code]
 * Available at: <https://github.com/jsdom/jsdom> [Accessed 15 September 2026]
 **************************************************************************************************************/

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'https://localhost:3443',
        secure: false
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    clearMocks: true
  }
});
