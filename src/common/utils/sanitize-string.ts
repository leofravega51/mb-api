type SanitizeOptions = { type?: 'lower' | 'trim' };

export function sanitizeString(value: string, options?: SanitizeOptions): string {
  let result = value?.trim() ?? '';
  if (options?.type === 'lower') {
    result = result.toLowerCase();
  }
  return result;
}
