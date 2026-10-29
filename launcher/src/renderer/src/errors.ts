/**
 * Readable text of an error from the main process. Electron puts
 * "Error invoking remote method '<channel>': Error: " in front of the real message.
 */
export function errorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '');
}
