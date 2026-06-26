import type { IDatabase } from "../db";
import type { AuthorProfile, BlueprintResponse } from "../types";
import { toBlueprintResponse } from "./serialize";

export function handleAuthor(
  author: string,
  db: IDatabase,
  baseUrl: string
): Response {
  const records = db.getAuthorBlueprints(author);

  if (records.length === 0) {
    return new Response(JSON.stringify({ error: "Author not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch user profile data
  const user = db.getUserByUsername(author);

  const blueprints: BlueprintResponse[] = records.map((record) =>
    toBlueprintResponse(record, db, baseUrl)
  );

  // Deduplicate by name to get blueprint count
  const uniqueNames = new Set(records.map(r => r.name));
  const total_versions = records.length;

  // Calculate total star count across all blueprints by this author
  let star_count_total = 0;
  for (const record of records) {
    star_count_total += db.getStarCount(record.author, record.name);
  }

  const profile: AuthorProfile = {
    author,
    blueprint_count: uniqueNames.size,
    total_versions,
    blueprints,
    bio: user?.bio,
    avatar_url: user?.avatar_url,
    website: user?.website,
    socials: user?.socials,
    star_count_total,
  };

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
