export const VAULT_URI_KEY = 'vault_uri'
export const META_FILENAME = '.md-editor-meta.json'
export const DATE_FORMAT = 'YYYY-MM-DD'

export function generateHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
