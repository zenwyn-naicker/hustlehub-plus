const js = require('@eslint/js');
const globals = require('globals');
const security = require('eslint-plugin-security');

module.exports = [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/evidence/**', 'artifacts/**'] },
  js.configs.recommended,
  {
    files: ['scripts/init-mongo.js'],
    languageOptions: { globals: { Mongo: 'readonly', sleep: 'readonly', print: 'readonly' } }
  },
  {
    files: ['backend/**/*.js', 'scripts/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['client/**/*.js', 'client/**/*.jsx'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    // The existing classic JSX transform requires React; ESLint 10 tracks component references.
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
      'no-restricted-syntax': ['error', {
        selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
        message: 'Render untrusted values as text, never raw HTML.'
      }],
      'no-eval': 'error',
      'no-implied-eval': 'error'
    }
  }
];
