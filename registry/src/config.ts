// Composition-root config. Parse env once at boot, inject everything downstream.
// No layer below this reads process.env directly.

export type AuthMode = "none" | "github" | "oauth2";

export interface RegistryConfig {
  port: number;
  dbPath: string;
  bundlesPath: string;
  /** Public URL this registry is reachable at. */
  baseUrl: string;
  /** Web UI origin allowed by CORS. "*" permitted only in none/dev mode. */
  webOrigin: string;
  /** Where the web UI lives, for post-login redirects. */
  webUrl: string;
  auth: AuthConfig;
  rateLimit: number;
}

export type AuthConfig =
  | { mode: "none" }
  | {
      mode: "github" | "oauth2";
      jwtSecret: string;
      clientId: string;
      clientSecret: string;
      // Generic OAuth2/OIDC endpoints. github mode fills these with GitHub defaults.
      authorizeUrl: string;
      tokenUrl: string;
      userinfoUrl: string;
      // Mapping from provider userinfo JSON → our user fields.
      idField: string;
      loginField: string;
      emailField: string;
      avatarField: string;
    };

// Read first defined env var from a list of names (new name first, then aliases).
function env(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

function isLoopback(urlStr: string): boolean {
  try {
    const h = new URL(urlStr).hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0";
  } catch {
    return false;
  }
}

const GITHUB_DEFAULTS = {
  authorizeUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  userinfoUrl: "https://api.github.com/user",
  idField: "id",
  loginField: "login",
  emailField: "email",
  avatarField: "avatar_url",
};

export function loadRegistryConfig(): RegistryConfig {
  const port = parseInt(env("PORT") ?? "3000");
  const baseUrl = env("HYLE_REGISTRY_URL", "BASE_URL") ?? `http://localhost:${port}`;
  const webUrl = env("HYLE_WEB_URL", "FRONTEND_URL") ?? "http://localhost:4200";

  // CORS: explicit origin wins; else default to web URL; "*" only tolerated for loopback.
  const webOrigin = env("HYLE_WEB_ORIGIN") ?? webUrl;

  const mode = (env("HYLE_AUTH_PROVIDER") ?? "none") as AuthMode;

  let auth: AuthConfig;
  if (mode === "none") {
    // Refuse "none" when reachable off-box — convenience default must not leak to prod.
    if (!isLoopback(baseUrl) && env("HYLE_ALLOW_INSECURE") !== "1") {
      throw new Error(
        `HYLE_AUTH_PROVIDER=none with non-loopback HYLE_REGISTRY_URL="${baseUrl}". ` +
          `Set a real provider, or HYLE_ALLOW_INSECURE=1 to override (NOT for production).`,
      );
    }
    auth = { mode: "none" };
  } else {
    const jwtSecret = env("JWT_SECRET");
    if (!jwtSecret || jwtSecret === "default-secret") {
      throw new Error(
        "JWT_SECRET is required (and must not be 'default-secret') when auth is enabled. " +
          "Generate with: openssl rand -hex 32",
      );
    }
    const clientId = env("HYLE_AUTH_CLIENT_ID", "GITHUB_CLIENT_ID");
    const clientSecret = env("HYLE_AUTH_CLIENT_SECRET", "GITHUB_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new Error(
        `HYLE_AUTH_PROVIDER=${mode} requires HYLE_AUTH_CLIENT_ID and HYLE_AUTH_CLIENT_SECRET.`,
      );
    }
    const d = mode === "github" ? GITHUB_DEFAULTS : null;
    auth = {
      mode,
      jwtSecret,
      clientId,
      clientSecret,
      authorizeUrl: env("HYLE_AUTH_AUTHORIZE_URL") ?? d?.authorizeUrl ?? required("HYLE_AUTH_AUTHORIZE_URL"),
      tokenUrl: env("HYLE_AUTH_TOKEN_URL") ?? d?.tokenUrl ?? required("HYLE_AUTH_TOKEN_URL"),
      userinfoUrl: env("HYLE_AUTH_USERINFO_URL") ?? d?.userinfoUrl ?? required("HYLE_AUTH_USERINFO_URL"),
      idField: env("HYLE_AUTH_ID_FIELD") ?? d?.idField ?? "sub",
      loginField: env("HYLE_AUTH_LOGIN_FIELD") ?? d?.loginField ?? "preferred_username",
      emailField: env("HYLE_AUTH_EMAIL_FIELD") ?? d?.emailField ?? "email",
      avatarField: env("HYLE_AUTH_AVATAR_FIELD") ?? d?.avatarField ?? "picture",
    };
  }

  return {
    port,
    dbPath: env("DB_PATH") ?? "./hyle-registry.db",
    bundlesPath: env("BUNDLES_PATH") ?? "./bundles",
    baseUrl,
    webOrigin,
    webUrl,
    auth,
    rateLimit: parseInt(env("HYLE_RATE_LIMIT") ?? "10"),
  };
}

function required(name: string): never {
  throw new Error(`${name} is required for HYLE_AUTH_PROVIDER=oauth2`);
}
