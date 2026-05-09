import { Application } from '@nativescript/core'

import { createVaultService, type PermissionAdapter, type StorageAdapter } from './vault-service'

const PREFS_NAME = 'md_editor_prefs'
const FOLDER_PICKER_REQUEST_CODE = 0xABCD

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
    let pending = false

    return new Promise<string | null>((resolve) => {
      if (pending) {
        resolve(null)
        return
      }
      pending = true

      const intent = new android.content.Intent(
        android.content.Intent.ACTION_OPEN_DOCUMENT_TREE,
      )
      intent.addFlags(
        android.content.Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        | android.content.Intent.FLAG_GRANT_PREFIX_URI_PERMISSION,
      )

      function onResult(args: { requestCode: number; resultCode: number; intent: android.content.Intent }) {
        if (args.requestCode !== FOLDER_PICKER_REQUEST_CODE) return
        Application.android.off('activityResult', onResult)
        pending = false

        if (args.resultCode !== android.app.Activity.RESULT_OK || !args.intent) {
          resolve(null)
          return
        }

        const uri = args.intent.getData()
        if (!uri) {
          resolve(null)
          return
        }

        const grantedFlags = args.intent.getFlags()
        const flags
          = grantedFlags
          & (android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
          | android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION)

        try {
          Application.android.context
            .getContentResolver()
            .takePersistableUriPermission(uri, flags)
        }
        catch {
          resolve(null)
          return
        }

        resolve(uri.toString())
      }

      Application.android.on('activityResult', onResult)

      const activity = Application.android.foregroundActivity
      if (!activity) {
        Application.android.off('activityResult', onResult)
        pending = false
        resolve(null)
        return
      }

      try {
        activity.startActivityForResult(intent, FOLDER_PICKER_REQUEST_CODE)
      }
      catch {
        Application.android.off('activityResult', onResult)
        pending = false
        resolve(null)
      }
    })
  },
}

export const vaultService = createVaultService({
  storage: androidStorage,
  permission: androidPermission,
})
