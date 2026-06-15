import { verifyJwt, verifyOidcToken } from "./jwt";
import type { JwtPayload, OidcPayload, OidcProvider, Jwks, JwksKey } from "./types";

export interface IAuth {
  verifyToken(token: string): Promise<JwtPayload | OidcPayload | null>;
}

export class JwtAuth implements IAuth {
  private jwtSecret: string;

  constructor(jwtSecret: string) {
    this.jwtSecret = jwtSecret;
  }

  async verifyToken(token: string): Promise<JwtPayload | null> {
    return verifyJwt(token, this.jwtSecret);
  }
}

export class OidcValidator implements IAuth {
  private issuer: string;
  private jwksUri: string;
  private jwksCache: Map<string, JwksKey> | null = null;
  private jwtsCacheExpiry: number = 0;

  constructor(issuer: string, jwksUri: string) {
    this.issuer = issuer;
    this.jwksUri = jwksUri;
  }

  async getJwks(): Promise<Map<string, JwksKey>> {
    const now = Date.now();
    if (this.jwksCache && this.jwtsCacheExpiry > now) {
      return this.jwksCache;
    }

    try {
      const response = await fetch(this.jwksUri);
      if (!response.ok) throw new Error(`Failed to fetch JWKS: ${response.status}`);

      const data = (await response.json()) as Jwks;
      const keyMap = new Map<string, JwksKey>();

      for (const key of data.keys) {
        const kid = key.kid || "default";
        keyMap.set(kid, key);
      }

      // Cache for 24 hours
      this.jwksCache = keyMap;
      this.jwtsCacheExpiry = now + 24 * 60 * 60 * 1000;

      return keyMap;
    } catch (error) {
      console.error("Failed to fetch OIDC JWKS:", error);
      throw error;
    }
  }

  async verifyToken(token: string, audience?: string): Promise<OidcPayload | null> {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const header = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(
            atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")).split(""),
            c => c.charCodeAt(0)
          )
        )
      ) as { kid?: string };

      const jwks = await this.getJwks();
      const kid = header.kid || "default";
      const jwk = jwks.get(kid);

      if (!jwk) {
        console.warn(`JWKS key not found for kid: ${kid}`);
        return null;
      }

      return verifyOidcToken(token, jwk, this.issuer, audience);
    } catch {
      return null;
    }
  }
}

export async function verifyJwtToken(token: string, jwtSecret: string): Promise<JwtPayload | null> {
  return verifyJwt(token, jwtSecret);
}

export function createAuthFromEnv(): IAuth {
  const jwtSecret = process.env.JWT_SECRET || "default-secret";
  return new JwtAuth(jwtSecret);
}
