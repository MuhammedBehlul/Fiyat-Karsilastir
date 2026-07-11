/** Koşullu className birleştirici (clsx bağımlılığı yerine). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
