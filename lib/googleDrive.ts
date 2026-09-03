import "server-only";
import { createSign } from "node:crypto";

export { parseDriveFileId } from "./driveFileId";

/**
 * Minimal Google Drive access for lesson video.
 *
 * The videos live in a Drive folder shared with one service account and with
 * nobody else - no "anyone with the link". Drive therefore refuses every
 * request that does not carry this service account's token, and the only code
 * holding that token is the server. A learner never sees a Drive URL.
 *
 * Written against the REST endpoints directly rather than pulling in the
 * googleapis package, which is large and does far more than this needs.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function credentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Vercel and .env files cannot hold real newlines, so the key is stored with
  // literal \n sequences and unescaped here.
  const key = process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join("\n");
  if (!email || !key) return null;
  return { email, key };
}

/** True when Drive hosting has been configured for this deployment. */
export function driveConfigured() {
  return credentials() !== null;
}

// Tokens last an hour. Caching in module scope means a warm serverless instance
// signs a new JWT once an hour rather than on every video request.
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const creds = credentials();
  if (!creds) throw new Error("Google Drive credentials are not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: creds.email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = base64url(signer.sign(creds.key));

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

/**
 * Fetches a Drive file, passing the browser's Range header through so the
 * player can seek instead of downloading the whole video to jump forward.
 */
export async function fetchDriveFile(fileId: string, range: string | null) {
  const token = await accessToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (range) headers.Range = range;

  return fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers }
  );
}
