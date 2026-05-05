import type { IDatabase } from "../db";

export function handleTags(db: IDatabase): Response {
  const tags = db.getAllTags();

  return new Response(JSON.stringify(tags), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
