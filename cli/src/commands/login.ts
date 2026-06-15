import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface AuthConfig {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  username?: string;
  email?: string;
  oidc_issuer?: string;
  provider?: string;
  // Backward compat
  token?: string;
}

async function pollForToken(deviceCode: string, registryUrl: string): Promise<string | null> {
  const maxAttempts = 120; // 2 minutes with 1-second polling
  const pollInterval = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${registryUrl}/auth/github/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deviceCode }),
      });

      if (response.ok) {
        const data = await response.json() as { token?: string };
        if (data.token) return data.token;
      }
    } catch (error) {
      // Continue polling
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return null;
}

async function getDeviceCode(registryUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`${registryUrl}/auth/github?cli=1`, {
      method: "GET",
      redirect: "manual",
    });

    if (response.status === 302) {
      const location = response.headers.get("location");
      if (location) {
        const url = new URL(location);
        const deviceCode = url.searchParams.get("state");
        return deviceCode;
      }
    }
  } catch (error) {
    console.error("Failed to get device code:", error);
  }

  return null;
}

function getConfigPath(): string {
  const hyleDir = join(homedir(), ".hyle");
  if (!existsSync(hyleDir)) {
    mkdirSync(hyleDir, { recursive: true });
  }
  return join(hyleDir, "auth.json");
}

function saveToken(
  accessToken: string,
  options?: { refreshToken?: string; expiresIn?: number; username?: string; email?: string; issuer?: string; provider?: string }
): void {
  const configPath = getConfigPath();
  const expiresAt = options?.expiresIn ? Date.now() + options.expiresIn * 1000 : undefined;
  const config: AuthConfig = {
    access_token: accessToken,
    refresh_token: options?.refreshToken,
    expires_at: expiresAt,
    username: options?.username,
    email: options?.email,
    oidc_issuer: options?.issuer,
    provider: options?.provider,
  };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✓ Authenticated successfully");
  if (options?.username) console.log(`  Username: ${options.username}`);
}

export function getStoredToken(): string | null {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf-8")) as AuthConfig;
      // Backward compat: check for old 'token' field
      return config.access_token || config.token || null;
    }
  } catch (error) {
    // Return null if config doesn't exist or is invalid
  }
  return null;
}

export function getStoredAuth(): AuthConfig | null {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf-8")) as AuthConfig;
    }
  } catch {
    // Return null if config doesn't exist or is invalid
  }
  return null;
}

export async function runLogin(options: { registryUrl?: string } = {}): Promise<void> {
  const registryUrl = options.registryUrl || process.env.HYLE_REGISTRY || "https://registry.hyle.dev";

  console.log("Opening browser for authentication...");
  console.log(`Visit: ${registryUrl}/auth/github?cli=1`);

  try {
    // In a real implementation, this would open the browser
    // For now, we'll prompt the user to open it manually
    const deviceCode = await getDeviceCode(registryUrl);

    if (!deviceCode) {
      console.error("✗ Failed to initiate OAuth flow");
      process.exit(1);
    }

    console.log(`\nAuthorization code: ${deviceCode}`);
    console.log("Waiting for authorization...");

    const token = await pollForToken(deviceCode, registryUrl);

    if (!token) {
      console.error("✗ Authentication timed out or was cancelled");
      process.exit(1);
    }

    // Try to get user info from the token (optional)
    try {
      const userResponse = await fetch(`${registryUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const user = (await userResponse.json()) as { username?: string; email?: string };
        saveToken(token, { username: user.username, email: user.email, provider: "github", issuer: "https://github.com" });
      } else {
        saveToken(token, { provider: "github", issuer: "https://github.com" });
      }
    } catch {
      saveToken(token, { provider: "github", issuer: "https://github.com" });
    }
  } catch (error) {
    console.error("✗ Login failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export function logout(): void {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf-8")) as AuthConfig;
      config.access_token = undefined;
      config.refresh_token = undefined;
      config.token = undefined;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    console.log("✓ Logged out successfully");
  } catch (error) {
    console.error("✗ Logout failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
