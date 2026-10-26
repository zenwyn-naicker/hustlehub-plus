/*Code Attribution: */
/**************************************************************************************************************
 * Author: Vitest Contributors
 * Date: 2026
 * Title: Vitest
 * Type: [Source Code]
 * Available at: <https://github.com/vitest-dev/vitest> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Testing Library Contributors
 * Date: 2026
 * Title: React Testing Library
 * Type: [Source Code]
 * Available at: <https://github.com/testing-library/react-testing-library> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Testing Library Contributors
 * Date: 2026
 * Title: jest-dom
 * Type: [Source Code]
 * Available at: <https://github.com/testing-library/jest-dom> [Accessed 15 September 2026]
 **************************************************************************************************************/

import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
