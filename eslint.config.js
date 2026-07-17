import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

// Flat config (ESLint 9). The official React-team plugins (react-hooks,
// jsx-a11y) are the rules this project cares about most — see CLAUDE.md.
// eslint-config-prettier comes last to switch off every stylistic rule that
// would fight Prettier, so formatting is Prettier's job and lint is about bugs.
export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // New JSX transform: React need not be in scope. prop-types is not used
      // in this codebase.
      'react/prop-types': 'off',
    },
  },

  // Test and Node-side config files run under Node with Vitest globals.
  {
    files: [
      '**/*.test.{js,jsx}',
      'src/test/**',
      '*.config.js',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },

  prettier,
]
