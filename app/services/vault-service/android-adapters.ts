import { Application } from '@nativescript/core'

import { createVaultService, type FileEntry, type FileSystemAdapter, type PermissionAdapter, type StorageAdapter } from './vault-service'

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

export const androidFileSystem: FileSystemAdapter = {
  listFiles(vaultUri: string): FileEntry[] {
    const context = Application.android.context
    const contentResolver = context.getContentResolver()
    const treeUri = android.net.Uri.parse(vaultUri)
    const treeDocId = android.provider.DocumentsContract.getTreeDocumentId(treeUri)
    const childrenUri = android.provider.DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, treeDocId)

    // Java null interop: these params accept null at runtime but TS types don't allow it
    const noFilter = null as unknown as string
    const noArgs = null as unknown as androidNative.Array<string>

    const cursor = contentResolver.query(
      childrenUri,
      [
        android.provider.DocumentsContract.Document.COLUMN_DOCUMENT_ID,
        android.provider.DocumentsContract.Document.COLUMN_DISPLAY_NAME,
        android.provider.DocumentsContract.Document.COLUMN_LAST_MODIFIED,
        android.provider.DocumentsContract.Document.COLUMN_MIME_TYPE,
      ],
      noFilter,
      noArgs,
      noFilter,
    )

    const entries: FileEntry[] = []
    if (!cursor) return entries

    try {
      while (cursor.moveToNext()) {
        const docId = cursor.getString(0)
        const name = cursor.getString(1)
        const lastModified = cursor.getLong(2)
        const mimeType = cursor.getString(3)

        if (mimeType === 'vnd.android.document/directory') continue

        const docUri = android.provider.DocumentsContract.buildDocumentUriUsingTree(treeUri, docId)
        entries.push({
          name,
          uri: docUri.toString(),
          lastModified,
          readText() {
            const stream = contentResolver.openInputStream(docUri)
            if (!stream) return ''
            try {
              const reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(stream, java.nio.charset.StandardCharsets.UTF_8),
              )
              const sb = new java.lang.StringBuilder()
              let line: string | null = reader.readLine()
              while (line !== null) {
                sb.append(line).append('\n')
                line = reader.readLine()
              }
              return sb.toString()
            }
            finally {
              stream.close()
            }
          },
        })
      }
    }
    finally {
      cursor.close()
    }

    return entries
  },
}

export const vaultService = createVaultService({
  storage: androidStorage,
  permission: androidPermission,
  fileSystem: androidFileSystem,
})
