import type { IDatabase } from "../db";
import type { SubstrateResponse } from "../types";
import { computeAllBadges } from "./badges";

export function handleVersions(
  author: string,
  name: string,
  db: IDatabase,
  baseUrl: string
): Response {
  const records = db.getVersions(author, name);

  if (records.length === 0) {
    return new Response(JSON.stringify({ error: "Substrate not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: SubstrateResponse[] = records.map((record) => {
    const manifest = JSON.parse(record.manifest_json);
    const bundleUrl = `${baseUrl}/bundles/${record.bundle_path}`;
    const star_count = db.getStarCount(record.author, record.name);
    const avg_rating = db.getAvgRating(record.author, record.name);
    const scan_result = db.getScan(record.id);
    const badges = computeAllBadges(record.author, record.name, db, scan_result);

    return {
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
      scan_result,
      badges,
    };
  });

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
