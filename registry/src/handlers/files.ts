import { gunzipSync } from "node:zlib";
import { Readable } from "node:stream";
import * as tar from "tar";
import type { IDatabase } from "../db";
import type { IStorage } from "../storage";
import type { FileContentResponse } from "../types";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Reject absolute paths, traversal, and other unsafe path shapes. */
function isUnsafePath(p: string): boolean {
  if (!p) return true;
  if (p.includes("\x00") || p.includes("\\") || p.startsWith("~")) return true;
  if (p.startsWith("/")) return true;
  if (p.startsWith("..") || p.includes("/..")) return true;
  return false;
}

const LANG_BY_EXT: Record<string, string> = {
  java: "java", py: "python", ts: "typescript", tsx: "typescript",
  js: "javascript", jsx: "javascript", go: "go", rs: "rust",
  yaml: "yaml", yml: "yaml", md: "markdown", mdx: "markdown",
  json: "json", toml: "toml", adoc: "markup", prisma: "css",
  sh: "bash", sql: "sql", html: "markup", css: "css",
};

function detectLang(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return LANG_BY_EXT[ext] || "plain";
}

/** Read the requested file's text out of a gzipped tar bundle. */
function extractFile(bundle: Uint8Array, target: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let decompressed: Buffer;
    try {
      decompressed = gunzipSync(Buffer.from(bundle));
    } catch (e) {
      return reject(e);
    }

    const parser = new (tar as any).Parser();
    let found = false;

    parser.on("entry", (entry: any) => {
      const name = entry.path.replace(/^\.\//, "");
      if (!found && name === target) {
        found = true;
        const chunks: Buffer[] = [];
        entry.on("data", (c: Buffer) => chunks.push(c));
        entry.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      } else {
        entry.resume();
      }
    });
    parser.on("end", () => {
      if (!found) resolve(null);
    });
    parser.on("error", reject);

    Readable.from(decompressed).pipe(parser);
  });
}

/**
 * GET /blueprints/:author/:name/files?path=<relpath> (optionally @version)
 * Returns the text content of a single file inside the published bundle.
 */
export async function handleFileContent(
  author: string,
  name: string,
  version: string | undefined,
  path: string | null,
  db: IDatabase,
  storage: IStorage
): Promise<Response> {
  if (!path) return json({ error: "path query param required" }, 400);
  if (isUnsafePath(path)) return json({ error: "Invalid path" }, 400);

  const record = version
    ? db.getVersion(author, name, version)
    : db.getLatestStable(author, name);
  if (!record) return json({ error: "Blueprint not found" }, 404);

  let bundle: Uint8Array;
  try {
    bundle = await storage.retrieveBundle(record.bundle_path);
  } catch {
    return json({ error: "Bundle not found" }, 404);
  }

  let content: string | null;
  try {
    content = await extractFile(bundle, path);
  } catch (e) {
    return json({ error: `Failed to read bundle: ${(e as Error).message}` }, 500);
  }

  if (content === null) return json({ error: "File not found in bundle" }, 404);

  const response: FileContentResponse = {
    path,
    content,
    language: detectLang(path),
  };
  return json(response);
}
