import type { NativeScriptConfig } from '@nativescript/core'

export default {
  id: 'com.alekseyshustov.mdeditor',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
  },
  bundler: 'vite',
  bundlerConfigPath: 'vite.config.ts',
} satisfies NativeScriptConfig

