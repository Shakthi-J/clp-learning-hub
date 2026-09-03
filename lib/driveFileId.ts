/**
 * Accepts either a bare Drive file id or any of the URL shapes people copy out
 * of the browser, so an author can paste whatever they have.
 *
 * Kept free of server-only imports: the authoring form parses as you type.
 */
export function parseDriveFileId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,   // .../file/d/<id>/view
    /[?&]id=([a-zA-Z0-9_-]+)/,       // .../open?id=<id>
    /\/d\/([a-zA-Z0-9_-]+)/,         // shortened /d/<id>
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return /^[a-zA-Z0-9_-]{10,}$/.test(value) ? value : null;
}
