export interface IAuth {
  verifyToken(token: string): boolean;
}

export class ApiKeyAuth implements IAuth {
  private validTokens: Set<string>;
  private allowInsecure: boolean;

  constructor(tokens: string[] = [], allowInsecure: boolean = false) {
    this.validTokens = new Set(tokens);
    this.allowInsecure = allowInsecure;
  }

  verifyToken(token: string): boolean {
    if (this.allowInsecure) return true;
    return this.validTokens.has(token);
  }
}

export function createAuthFromEnv(): IAuth {
  const allowInsecure = process.env.HYLE_ALLOW_INSECURE === "1";
  const apiKey = process.env.HYLE_API_KEY;
  const tokens = apiKey ? [apiKey] : [];

  return new ApiKeyAuth(tokens, allowInsecure);
}
