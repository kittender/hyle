import type { IDatabase } from "../db";
import type { RegistryRecord, BlueprintResponse } from "../types";
import { computeAllBadges } from "./badges";

/**
 * Build the public BlueprintResponse for a stored record. Author-supplied
 * presentation metadata (license, language, long_description, fork_count) is
 * carried verbatim inside the manifest JSON, so it round-trips through publish
 * without any change to the blueprints table.
 */
export function toBlueprintResponse(
  record: RegistryRecord,
  db: IDatabase,
  baseUrl: string
): BlueprintResponse {
  const manifest = JSON.parse(record.manifest_json);
  const bundleUrl = `${baseUrl}/bundles/${record.bundle_path}`;
  const star_count = db.getStarCount(record.author, record.name);
  const avg_rating = db.getAvgRating(record.author, record.name);
  const install_count = db.getInstallCount(record.author, record.name);
  const scan_result = db.getScan(record.id);
  const badges = computeAllBadges(record.author, record.name, db, scan_result);
  const fork_count =
    typeof manifest.fork_count === "number"
      ? manifest.fork_count
      : Array.isArray(manifest.forks)
        ? manifest.forks.length
        : 0;

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
    install_count,
    license: manifest.license,
    language: manifest.language,
    long_description: manifest.long_description,
    fork_count,
    is_team_pick: db.isFeatured(record.author, record.name),
    scan_result,
    badges,
  };
}
