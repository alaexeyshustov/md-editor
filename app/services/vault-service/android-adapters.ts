import { Application } from '@nativescript/core'

import { createVaultService, type PermissionAdapter, type StorageAdapter } from './vault-service'

const PREFS_NAME = 'md_editor_prefs'
const SAF_REQUEST_CODE = 42

export const androidStorage: StorageAdapter = {
  get(key) {
    const context = Application.android.context
    const prefs = context.getSharedPreferences(PREFS_NAME, 0)
    const value = prefs.getString(key, '')
    return value || null
  },
  set(key, value) {
    const context = Application.android.context
    const prefs = context.getSharedPreferences(PREFS_NAME, 0)
    prefs.edit().putString(key, value).apply()
  },
}

export const androidPermission: PermissionAdapter = {
  requestFolderPicker() {
    return new Promise<string | null>((resolve) => {
      const intent = new android.content.Intent(
        android.content.Intent.ACTION_OPEN_DOCUMENT_TREE,
      )

      function onResult(args: { requestCode: number; resultCode: number; intent: android.content.Intent }) {
        if (args.requestCode !== SAF_REQUEST_CODE) return
        Application.android.off('activityResult', onResult)

        if (args.resultCode !== android.app.Activity.RESULT_OK || !args.intent) {
          resolve(null)
          return
        }

        const uri = args.intent.getData()
        const flags
          = android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
          | android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
        Application.android.context
          .getContentResolver()
          .takePersistableUriPermission(uri, flags)

        resolve(uri.toString())
      }

      Application.android.on('activityResult', onResult)
      Application.android.foregroundActivity.startActivityForResult(intent, SAF_REQUEST_CODE)
    })
  },
}

export const vaultService = createVaultService({
  storage: androidStorage,
  permission: androidPermission,
})
