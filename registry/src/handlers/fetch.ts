import type { IDatabase } from "../db";
import type { IStorage } from "../storage";
import type { SubstrateResponse } from "../types";

export async function handleFetch(
  author: string,
  name: string,
  version: string | undefined,
  db: IDatabase,
  storage: IStorage,
  baseUrl: string
): Promise<Response> {
  let record;

  if (version) {
    record = db.getVersion(author, name, version);
  } else {
    record = db.getLatestStable(author, name);
  }

  if (!record) {
    return new Response(JSON.stringify({ error: "Substrate not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const manifest = JSON.parse(record.manifest_json);
  const bundleUrl = `${baseUrl}/bundles/${record.bundle_path}`;
  const star_count = db.getStarCount(record.author, record.name);
  const avg_rating = db.getAvgRating(record.author, record.name);

  const response: SubstrateResponse = {
    author: record.author,
    name: record.name,
    version: record.version,
    description: record.description,
    tags: record.tags,
    is_stable: record.is_stable,
    is_flagged: record.is_flagged,
    flag_reason: record.flag_reason,
    checksum: record.checksum,
    manifest,
    bundle_url: bundleUrl,
    created_at: record.created_at,
    star_count,
    avg_rating,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleFetchBundle(
  author: string,
  name: string,
  version: string | undefined,
  db: IDatabase,
  storage: IStorage
): Promise<Response> {
  let record;

  if (version) {
    record = db.getVersion(author, name, version);
  } else {
    record = db.getLatestStable(author, name);
  }

  if (!record) {
    return new Response(JSON.stringify({ error: "Bundle not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Increment install count
  db.incrementInstallCount(author, name);

  const bundleData = await storage.retrieveBundle(record.bundle_path);

  return new Response(bundleData, {
    status: 200,
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${author}-${name}-${record.version}.tar.gz"`,
    },
  });
}
