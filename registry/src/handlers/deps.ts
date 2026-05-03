import type { DepResolutionResult } from "../types";

export function handleDeps(url: string | null, os: string | null): Response {
  if (!url || !os) {
    return new Response(JSON.stringify({ error: "Missing url or os query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!["macos", "linux", "windows"].includes(os)) {
    return new Response(JSON.stringify({ error: "Invalid os (must be macos, linux, or windows)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result: DepResolutionResult = {
    name: "unknown",
    version: "0.0.0",
    confidence: 0,
    command: undefined,
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
