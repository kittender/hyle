import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface AuthConfig {
  token?: string;
  username?: string;
  email?: string;
}

async function pollForToken(deviceCode: string, registryUrl: string): Promise<string | null> {
  const maxAttempts = 120; // 2 minutes with 1-second polling
  const pollInterval = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${registryUrl}/auth/github/callback?code=${deviceCode}`, {
        method: "GET",
      });

      if (response.ok) {
        const text = await response.text();
        const match = text.match(/token=([^\s&]+)/);
        if (match) return match[1];
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

function saveToken(token: string, username?: string, email?: string): void {
  const configPath = getConfigPath();
  const config: AuthConfig = { token, username, email };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✓ Authenticated successfully");
  if (username) console.log(`  Username: ${username}`);
}

export function getStoredToken(): string | null {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf-8")) as AuthConfig;
      return config.token || null;
    }
  } catch (error) {
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
        saveToken(token, user.username, user.email);
      } else {
        saveToken(token);
      }
    } catch {
      saveToken(token);
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
      config.token = undefined;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    console.log("✓ Logged out successfully");
  } catch (error) {
    console.error("✗ Logout failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
