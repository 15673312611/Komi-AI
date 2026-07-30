import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  ...pluginVue.configs['flat/essential'],
  
  // Spread, not wrapped in an object: vueTsEslintConfig() returns an ARRAY of
  // flat configs. Spreading it into `{}` produced numeric keys ("0", "1", …)
  // and ESLint refused the whole config with `Unexpected key "0" found`, so
  // linting has been failing outright rather than reporting anything.
  ...vueTsEslintConfig(),

  {
    name: 'app/ts-rule-overrides',
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Replaces the old `ban-types` entry here, which typescript-eslint v8
      // split into these successor rules. It was configured to allow bare
      // `Object`/`Function`; these two are the rules that would flag them.
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
    }
  },
  
  {
    // Published images are built once in CI and configured per deployment at
    // container start, so import.meta.env.VITE_* is undefined at runtime for
    // every self-hosted install. Config must come from window.APP_CONFIG via
    // the resolvers in src/config/api.ts (or webclient/widget-env.ts, which
    // keeps its own fallbacks). Only those resolvers may read the env directly.
    name: 'app/no-build-time-env',
    files: ['src/**/*.{ts,mts,tsx,vue}'],
    ignores: ['src/config/api.ts', 'src/webclient/widget-env.ts', 'src/sw.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // VITE_* only. Vite's own built-ins (BASE_URL, MODE, DEV, PROD) are
          // build-time by definition and stay allowed.
          selector:
            'MemberExpression[object.object.type="MetaProperty"][object.property.name="env"][property.name=/^VITE_/]',
          message:
            'Do not read import.meta.env.VITE_* directly — it is undefined in the published image. Use the runtime resolvers in @/config/api (getApiUrl, resolveUploadUrl, getGoogleFontsApiKey, …).',
        },
      ],
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },
  
  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  skipFormatting,
]
