export interface ClipboardService {
  setText(text: string): void
}

let _service: ClipboardService | null = null

export function configureClipboardService(service: ClipboardService): void {
  _service = service
}

export function useClipboardService(): ClipboardService {
  if (!_service) throw new Error('ClipboardService not configured')
  return _service
}
