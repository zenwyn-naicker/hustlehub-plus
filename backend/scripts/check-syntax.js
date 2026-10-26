/*Code Attribution: */
/**************************************************************************************************************
 * Author: Node.js Contributors
 * Date: 2026
 * Title: Node.js
 * Type: [Source Code]
 * Available at: <https://github.com/nodejs/node> [Accessed 28 August 2026]
 **************************************************************************************************************/

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function check(dir) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Walk only the fixed backend source root; no request data enters this build script.
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'certs', 'evidence'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (file.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
      if (result.status !== 0) process.exit(result.status || 1);
    }
  }
}
check('.');
console.log('Backend JavaScript syntax checks passed (no transpilation required).');
