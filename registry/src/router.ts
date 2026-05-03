import type { IDatabase } from "./db";
import type { IStorage } from "./storage";
import type { IAuth } from "./auth";
import { handleFetch, handleFetchBundle } from "./handlers/fetch";
import { handleSearch } from "./handlers/search";
import { handleVersions } from "./handlers/versions";
import { handlePublish } from "./handlers/publish";
import { handleDeps } from "./handlers/deps";

const SUBSTRATE_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)(?:@([a-z0-9\.\-]+))?(?:\/bundle)?$/;
const VERSIONS_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)\/versions$/;
const BUNDLES_RE = /^\/bundles\/(.+\.tar\.gz)$/;

export async function route(
  req: Request,
  db: IDatabase,
  storage: IStorage,
  auth: IAuth,
  baseUrl: string
): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname === "/substrates" && req.method === "GET") {
    const q = url.searchParams.get("q");
    const tags = url.searchParams.get("tags");
    const author = url.searchParams.get("author");
    const limit = url.searchParams.get("limit");

    return handleSearch(
      {
        q: q || undefined,
        tags: tags || undefined,
        author: author || undefined,
        limit: limit ? parseInt(limit) : 20,
      },
      db,
      baseUrl
    );
  }

  if (pathname === "/substrates" && req.method === "POST") {
    return await handlePublish(req, db, storage, auth);
  }

  if (pathname === "/deps" && req.method === "GET") {
    const url_param = url.searchParams.get("url");
    const os = url.searchParams.get("os");
    return handleDeps(url_param, os);
  }

  const substrateMa = pathname.match(SUBSTRATE_RE);
  if (substrateMa && req.method === "GET") {
    const author = substrateMa[1];
    const name = substrateMa[2];
    const version = substrateMa[3];
    const isBundle = pathname.includes("/bundle");

    if (isBundle) {
      return await handleFetchBundle(author, name, version, db, storage);
    } else {
      return await handleFetch(author, name, version, db, storage, baseUrl);
    }
  }

  const versionsMatch = pathname.match(VERSIONS_RE);
  if (versionsMatch && req.method === "GET") {
    const author = versionsMatch[1];
    const name = versionsMatch[2];
    return handleVersions(author, name, db, baseUrl);
  }

  const bundlesMatch = pathname.match(BUNDLES_RE);
  if (bundlesMatch && req.method === "GET") {
    const bundleKey = bundlesMatch[1];
    try {
      const bundleData = await storage.retrieveBundle(bundleKey);
      return new Response(bundleData, {
        status: 200,
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": `attachment; filename="${bundleKey}"`,
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Bundle not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
