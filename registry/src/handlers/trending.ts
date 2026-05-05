import type { IDatabase } from "../db";
import type { SubstrateResponse } from "../types";

export function handleTrending(
  limit: number,
  db: IDatabase,
  baseUrl: string
): Response {
  const records = db.getTrending(limit);

  const results: SubstrateResponse[] = records.map((record) => {
    const manifest = JSON.parse(record.manifest_json);
    const bundleUrl = `${baseUrl}/bundles/${record.bundle_path}`;

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
    };
  });

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
