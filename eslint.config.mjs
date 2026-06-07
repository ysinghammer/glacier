import js from '@eslint/js';
import globals from 'globals';
import tsESLint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser }
  },
  tsESLint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    }
  },
  comments.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
    settings: {
      'import/resolver': {
        typescript: true,
        node: true
      }
    },
    rules: {
      'import/enforce-node-protocol-usage': ['error', 'always'],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'index',
            ['internal', 'sibling', 'parent'],
            'type',
            'unknown'
          ],
          'newlines-between': 'always'
        }
      ]
    }
  },
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'tests', pattern: 'packages/*/tests/**/*', mode: 'full' },
        { type: 'source', pattern: 'packages/*/src/*/**/*', mode: 'full' },
        { type: 'index', pattern: 'packages/*/src/index.ts', mode: 'full' }
      ]
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['tests'],
              disallow: ['source'],
              message: 'Tests should only use the public API of a package.'
            }
          ]
        }
      ]
    }
  },
  {
    rules: {
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@eslint-community/eslint-comments/require-description': 'error',
      '@typescript-eslint/no-unsafe-function-type': 0,
      '@typescript-eslint/no-extraneous-class': 0,
      '@typescript-eslint/no-unnecessary-type-parameters': 0,
      '@typescript-eslint/no-unnecessary-condition': 0
    }
  },
  eslintPluginPrettier
]);
