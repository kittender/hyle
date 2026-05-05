import type { IDatabase } from "../db";
import type { AuthorProfile, SubstrateResponse } from "../types";

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

  const substrates: SubstrateResponse[] = records.map((record) => {
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

  // Deduplicate by name to get substrate count
  const uniqueNames = new Set(records.map(r => r.name));
  const total_versions = records.length;

  const profile: AuthorProfile = {
    author,
    substrate_count: uniqueNames.size,
    total_versions,
    substrates,
  };

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
