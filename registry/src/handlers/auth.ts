import type { IDatabase } from "../db";
import { signJwt, verifyJwt, createJwtPayload } from "../jwt";
import type { User, OidcProvider } from "../types";

interface GitHubUser {
  id: number;
  login: string;
  email?: string;
  avatar_url?: string;
}

export async function handleGithubOAuth(request: Request, db: IDatabase): Promise<Response> {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri") || `${url.origin}/auth/github/callback`;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const cliMode = url.searchParams.get("cli") === "1";

  if (!clientId) {
    return new Response("GitHub OAuth not configured", { status: 500 });
  }

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "user:email");
  githubAuthUrl.searchParams.set("state", cliMode ? "cli" : "web");

  return new Response(null, {
    status: 302,
    headers: { Location: githubAuthUrl.toString() },
  });
}

export async function handleGithubCallback(request: Request, db: IDatabase): Promise<Response> {
  const url = new URL(request.url);
  let code = url.searchParams.get("code");
  let state = url.searchParams.get("state");

  // Handle POST with JSON body (secure method)
  if (request.method === "POST") {
    try {
      const body = await request.json() as { code?: string; state?: string };
      code = body.code || code;
      state = body.state || state;
    } catch {
      // If body is not JSON, fall back to query params
    }
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;

  if (!clientId || !clientSecret || !jwtSecret) {
    return new Response("OAuth misconfigured", { status: 500 });
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      return new Response(`OAuth error: ${tokenData.error}`, { status: 401 });
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${tokenData.access_token}` },
    });

    const githubUser = (await userResponse.json()) as GitHubUser;

    const user = db.upsertUser(
      githubUser.id.toString(),
      githubUser.login,
      githubUser.email,
      githubUser.avatar_url
    );

    const jwtPayload = createJwtPayload(user.id, user.username);
    const token = await signJwt(jwtPayload, jwtSecret);

    if (state === "cli") {
      // For CLI: return JSON response (POST) or plain text (GET legacy)
      if (request.method === "POST") {
        return new Response(JSON.stringify({ token }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const redirectUri = url.searchParams.get("redirect_uri");
      if (!redirectUri) {
        return new Response(`token=${token}`, { status: 200 });
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `${redirectUri}?token=${token}` },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    return new Response(null, {
      status: 302,
      headers: { Location: `${frontendUrl}/auth/callback?token=${token}` },
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response("OAuth processing failed", { status: 500 });
  }
}

export async function handleGetMe(request: Request, db: IDatabase, jwtSecret: string): Promise<Response> {
  const token = extractToken(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await verifyJwt(token, jwtSecret);
  if (!payload) {
    return new Response("Invalid token", { status: 401 });
  }

  const user = db.getUser(payload.sub);
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleUpdateMe(request: Request, db: IDatabase, jwtSecret: string): Promise<Response> {
  const token = extractToken(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await verifyJwt(token, jwtSecret);
  if (!payload) {
    return new Response("Invalid token", { status: 401 });
  }

  try {
    const body = (await request.json()) as { bio?: string; website?: string };
    const updated = db.updateUser(payload.sub, body.bio, body.website);

    if (!updated) {
      return new Response("User not found", { status: 404 });
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }
}

export async function handleGetNotificationPrefs(request: Request, db: IDatabase, jwtSecret: string): Promise<Response> {
  const token = extractToken(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await verifyJwt(token, jwtSecret);
  if (!payload) {
    return new Response("Invalid token", { status: 401 });
  }

  const prefs = db.getNotificationPrefs(payload.sub) || {
    email_on_star: false,
    email_on_review: false,
    email_on_new_version: false,
  };

  return new Response(JSON.stringify(prefs), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleUpdateNotificationPrefs(request: Request, db: IDatabase, jwtSecret: string): Promise<Response> {
  const token = extractToken(request);
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await verifyJwt(token, jwtSecret);
  if (!payload) {
    return new Response("Invalid token", { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      email_on_star?: boolean;
      email_on_review?: boolean;
      email_on_new_version?: boolean;
    };

    db.upsertNotificationPrefs(
      payload.sub,
      body.email_on_star ?? false,
      body.email_on_review ?? false,
      body.email_on_new_version ?? false
    );

    const prefs = db.getNotificationPrefs(payload.sub);
    return new Response(JSON.stringify(prefs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export function handleOidcDiscovery(request: Request): Response {
  const url = new URL(request.url);
  const issuer = `${url.protocol}//${url.host}`;
  const config: OidcProvider = {
    issuer,
    authorization_endpoint: `${issuer}/auth/github`,
    token_endpoint: `${issuer}/auth/github/callback`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    scopes_supported: ["read:user", "user:email"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
  };

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
