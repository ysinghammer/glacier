import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import globals from 'globals';
import tsESLint from 'typescript-eslint';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import {importX} from 'eslint-plugin-import-x';
import boundaries from 'eslint-plugin-boundaries';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath, { gitignoreResolution: true }),
  {
    ignores: ["applications/*/src/generated/**/*"]
  },
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
    extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript],
    settings: {
      'import/resolver': {
        typescript: true,
        node: true
      }
    },
    rules: {
      'import-x/order': [
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
        // Legacy packages structure
        { type: 'tests', pattern: 'packages/*/tests/**/*', mode: 'full' },
        { type: 'source', pattern: 'packages/*/src/*/**/*', mode: 'full' },
        { type: 'index', pattern: 'packages/*/src/index.ts', mode: 'full' },
        
        // glacier-backend-core Clean Architecture layers
        // Shared kernel (allowed everywhere)
        { type: 'shared-domain', pattern: 'applications/glacier-backend-core/src/shared/kernel/domain/**/*', mode: 'full' },
        { type: 'shared-application', pattern: 'applications/glacier-backend-core/src/shared/kernel/application/**/*', mode: 'full' },
        
        // Framework layer (Prisma and other framework code)
        { type: 'framework', pattern: 'applications/glacier-backend-core/src/framework/**/*', mode: 'full' },
        
        // Bounded context layers (per context) - using capture groups
        { type: 'domain', pattern: 'applications/glacier-backend-core/src/contexts/*/domain/**/*', mode: 'full', capture: ['context'] },
        { type: 'application', pattern: 'applications/glacier-backend-core/src/contexts/*/application/**/*', mode: 'full', capture: ['context'] },
        { type: 'infrastructure', pattern: 'applications/glacier-backend-core/src/contexts/*/infrastructure/**/*', mode: 'full', capture: ['context'] },
        { type: 'presentation', pattern: 'applications/glacier-backend-core/src/contexts/*/presentation/**/*', mode: 'full', capture: ['context'] },
        
        // Context root modules
        { type: 'context-module', pattern: 'applications/glacier-backend-core/src/contexts/*/*.module.ts', mode: 'full', capture: ['context'] },
        
        // Application root
        { type: 'app-root', pattern: 'applications/glacier-backend-core/src/Application.*', mode: 'full' }
      ]
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Legacy packages rules - tests cannot import from source
            {
              from: 'tests',
              disallow: 'source',
              message: 'Tests should only use the public API of a package.'
            },
            
            // ===== DOMAIN LAYER RULES (Core of Clean Architecture) =====
            // Domain can only import from domain (same context) and shared-domain
            {
              from: 'domain',
              allow: ['domain', 'shared-domain'],
              message: 'Domain layer must have no external dependencies. It can only import from shared domain kernel or other domain entities within the same context.'
            },
            
            // ===== APPLICATION LAYER RULES =====
            // Application can import from application, domain (same context), and shared kernel
            {
              from: 'application',
              allow: ['application', 'domain', 'shared-domain', 'shared-application'],
              message: 'Application layer can only import from domain layer, shared kernel, and other application layer components within the same context.'
            },
            
            // ===== INFRASTRUCTURE LAYER RULES =====
            // Infrastructure implements domain ports, can import domain and framework
            {
              from: 'infrastructure',
              allow: ['infrastructure', 'domain', 'shared-domain', 'framework'],
              message: 'Infrastructure layer can import from domain layer (to implement ports), shared kernel, and framework code.'
            },
            
            // ===== PRESENTATION LAYER RULES =====
            // Presentation can import from application, domain (for types), and framework
            {
              from: 'presentation',
              allow: ['presentation', 'application', 'domain', 'shared-domain', 'shared-application', 'framework'],
              message: 'Presentation layer can import from application layer, domain layer (for types), shared kernel, and framework code.'
            },
            
            // ===== SHARED KERNEL RULES =====
            // Shared domain can only import from shared domain (no dependencies)
            {
              from: 'shared-domain',
              allow: 'shared-domain',
              message: 'Shared domain kernel must have no external dependencies.'
            },
            
            // Shared application can import from shared domain
            {
              from: 'shared-application',
              allow: ['shared-application', 'shared-domain'],
              message: 'Shared application kernel can only import from shared domain kernel.'
            },
            
            // ===== FRAMEWORK LAYER RULES =====
            // Framework can import from framework and shared domain
            {
              from: 'framework',
              allow: ['framework', 'shared-domain'],
              message: 'Framework layer can import from itself and shared kernel for configuration.'
            },
            
            // ===== CONTEXT MODULE RULES =====
            // Context modules can import from any layer within their context
            {
              from: 'context-module',
              allow: ['domain', 'application', 'infrastructure', 'presentation', 'shared-domain', 'shared-application', 'framework'],
              message: 'Context module can import from any layer within its context to wire dependencies.'
            },
            
            // ===== APPLICATION ROOT RULES =====
            // Application root can import from anywhere to bootstrap
            {
              from: 'app-root',
              allow: '*',
              message: 'Application bootstrap can import from anywhere to wire the application.'
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
