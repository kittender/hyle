import type { IDatabase } from "../db";
import type { AuthorProfile, SubstrateResponse } from "../types";
import { computeAllBadges } from "./badges";

export function handleAuthor(
  author: string,
  db: IDatabase,
  baseUrl: string
): Response {
  const records = db.getAuthorSubstrates(author);

  if (records.length === 0) {
    return new Response(JSON.stringify({ error: "Author not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch user profile data
  const user = db.getUserByUsername(author);

  const substrates: SubstrateResponse[] = records.map((record) => {
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

  // Deduplicate by name to get substrate count
  const uniqueNames = new Set(records.map(r => r.name));
  const total_versions = records.length;

  // Calculate total star count across all substrates by this author
  let star_count_total = 0;
  for (const record of records) {
    star_count_total += db.getStarCount(record.author, record.name);
  }

  const profile: AuthorProfile = {
    author,
    substrate_count: uniqueNames.size,
    total_versions,
    substrates,
    bio: user?.bio,
    avatar_url: user?.avatar_url,
    website: user?.website,
    star_count_total,
  };

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
