import type { IDatabase } from "./db";
import type { IStorage } from "./storage";
import type { IAuth } from "./auth";
import { handleFetch, handleFetchBundle } from "./handlers/fetch";
import { handleSearch } from "./handlers/search";
import { handleVersions } from "./handlers/versions";
import { handlePublish } from "./handlers/publish";
import { handleDeps } from "./handlers/deps";
import { handleTags } from "./handlers/tags";
import { handleTrending } from "./handlers/trending";
import { handleAuthor } from "./handlers/author";
import { handleDiff } from "./handlers/diff";
import { handleChecksums } from "./handlers/checksums";
import { handleSecurityReport } from "./handlers/security";
import { handleGithubOAuth, handleGithubCallback, handleGetMe, handleUpdateMe, handleGetNotificationPrefs, handleUpdateNotificationPrefs } from "./handlers/auth";
import { handleToggleStar, handleGetStars } from "./handlers/stars";
import { handleSubmitReview, handleGetReviews } from "./handlers/reviews";

const SUBSTRATE_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)(?:@([a-z0-9\.\-]+))?(?:\/bundle)?$/;
const VERSIONS_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)\/versions$/;
const CHECKSUMS_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)@([a-z0-9\.\-]+)\/checksums$/;
const SECURITY_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)@([a-z0-9\.\-]+)\/security-report$/;
const DIFF_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)@([a-z0-9\.\-]+)\/diff$/;
const STAR_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)\/star$/;
const STARS_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)\/stars$/;
const REVIEWS_POST_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)\/reviews$/;
const REVIEWS_GET_RE = /^\/substrates\/([a-z0-9-]+)\/([a-z0-9-]+)\/reviews$/;
const AUTHOR_RE = /^\/authors\/([a-z0-9-]+)$/;
const BUNDLES_RE = /^\/bundles\/(.+\.tar\.gz)$/;

export async function route(
  req: Request,
  db: IDatabase,
  storage: IStorage,
  auth: IAuth,
  baseUrl: string,
  jwtSecret: string = ""
): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname === "/auth/github" && req.method === "GET") {
    return await handleGithubOAuth(req, db);
  }

  if (pathname === "/auth/github/callback" && req.method === "GET") {
    return await handleGithubCallback(req, db);
  }

  if (pathname === "/auth/me" && req.method === "GET") {
    return await handleGetMe(req, db, jwtSecret);
  }

  if (pathname === "/auth/me" && req.method === "PATCH") {
    return await handleUpdateMe(req, db, jwtSecret);
  }

  if (pathname === "/auth/me/notifications" && req.method === "GET") {
    return await handleGetNotificationPrefs(req, db, jwtSecret);
  }

  if (pathname === "/auth/me/notifications" && req.method === "PATCH") {
    return await handleUpdateNotificationPrefs(req, db, jwtSecret);
  }

  if (pathname === "/tags" && req.method === "GET") {
    return handleTags(db);
  }

  if (pathname === "/trending" && req.method === "GET") {
    const limit = url.searchParams.get("limit");
    return handleTrending(limit ? parseInt(limit) : 20, db, baseUrl);
  }

  const starMatch = pathname.match(STAR_RE);
  if (starMatch && req.method === "POST") {
    const author = starMatch[1];
    const name = starMatch[2];
    return await handleToggleStar(author, name, req, db, jwtSecret);
  }

  const starsMatch = pathname.match(STARS_RE);
  if (starsMatch && req.method === "GET") {
    const author = starsMatch[1];
    const name = starsMatch[2];
    return await handleGetStars(author, name, req, db, jwtSecret);
  }

  const reviewsPostMatch = pathname.match(REVIEWS_POST_RE);
  if (reviewsPostMatch && req.method === "POST") {
    const author = reviewsPostMatch[1];
    const name = reviewsPostMatch[2];
    return await handleSubmitReview(author, name, req, db, jwtSecret);
  }

  const reviewsGetMatch = pathname.match(REVIEWS_GET_RE);
  if (reviewsGetMatch && req.method === "GET") {
    const author = reviewsGetMatch[1];
    const name = reviewsGetMatch[2];
    return handleGetReviews(author, name, db);
  }

  const authorMatch = pathname.match(AUTHOR_RE);
  if (authorMatch && req.method === "GET") {
    const author = authorMatch[1];
    return handleAuthor(author, db, baseUrl);
  }

  if (pathname === "/substrates" && req.method === "GET") {
    const q = url.searchParams.get("q");
    const tags = url.searchParams.get("tags");
    const author = url.searchParams.get("author");
    const limit = url.searchParams.get("limit");
    const sort = url.searchParams.get("sort") as "recent" | "name" | null;
    const offset = url.searchParams.get("offset");

    return handleSearch(
      {
        q: q || undefined,
        tags: tags || undefined,
        author: author || undefined,
        limit: limit ? parseInt(limit) : 20,
        sort: sort || "recent",
        offset: offset ? parseInt(offset) : 0,
      },
      db,
      baseUrl
    );
  }

  if (pathname === "/substrates" && req.method === "POST") {
    return await handlePublish(req, db, storage, auth, jwtSecret);
  }

  if (pathname === "/deps" && req.method === "GET") {
    const url_param = url.searchParams.get("url");
    const os = url.searchParams.get("os");
    return handleDeps(url_param, os);
  }

  const checksumsMatch = pathname.match(CHECKSUMS_RE);
  if (checksumsMatch && req.method === "GET") {
    const author = checksumsMatch[1];
    const name = checksumsMatch[2];
    const version = checksumsMatch[3];
    return handleChecksums(author, name, version, db);
  }

  const securityMatch = pathname.match(SECURITY_RE);
  if (securityMatch && req.method === "GET") {
    const author = securityMatch[1];
    const name = securityMatch[2];
    const version = securityMatch[3];
    return handleSecurityReport(author, name, version, db);
  }

  const diffMatch = pathname.match(DIFF_RE);
  if (diffMatch && req.method === "GET") {
    const author = diffMatch[1];
    const name = diffMatch[2];
    const v1 = diffMatch[3];
    const base = url.searchParams.get("base");

    if (!base) {
      return new Response(JSON.stringify({ error: "base query param required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return handleDiff(author, name, v1, base, db);
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
