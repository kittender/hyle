import type { JwtPayload } from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let padded = str.replace(/-/g, "+").replace(/_/g, "/");
  while (padded.length % 4) padded += "=";
  return new Uint8Array(atob(padded).split("").map(c => c.charCodeAt(0)));
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signatureBytes = base64UrlDecode(signature);
  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(message));
}

export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const headerEncoded = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadEncoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const message = `${headerEncoded}.${payloadEncoded}`;
  const signature = await hmacSign(message, secret);
  return `${message}.${signature}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const message = `${headerEncoded}.${payloadEncoded}`;
    const isValid = await hmacVerify(message, signatureEncoded, secret);

    if (!isValid) return null;

    const payloadJson = decoder.decode(base64UrlDecode(payloadEncoded));
    const payload = JSON.parse(payloadJson) as JwtPayload;

    if (payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export function createJwtPayload(sub: number, username: string, expiresInDays: number = 30): JwtPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub,
    username,
    iat: now,
    exp: now + expiresInDays * 24 * 60 * 60,
  };
}
