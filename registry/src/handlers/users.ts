import type { IDatabase } from "../db";
import type { BlueprintResponse } from "../types";
import { toBlueprintResponse } from "./serialize";

/**
 * GET /users/:username/stars — blueprints a user has starred, returned as full
 * BlueprintResponse objects (latest stable version of each). Powers the
 * "Starred" tab on the profile page.
 */
export function handleUserStars(
  username: string,
  db: IDatabase,
  baseUrl: string
): Response {
  const user = db.getUserByUsername(username);
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const starred = db.getStarsByUser(user.id);
  const results: BlueprintResponse[] = [];
  for (const { author, name } of starred) {
    const record = db.getLatestStable(author, name);
    if (record) {
      results.push(toBlueprintResponse(record, db, baseUrl));
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
