import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/.ns-vite-build/**', '**/dist/**', '**/node_modules/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
]
