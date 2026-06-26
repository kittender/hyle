import type { IDatabase } from "../db";
import type { SearchQuery, BlueprintResponse } from "../types";
import { toBlueprintResponse } from "./serialize";

export function handleSearch(
  query: SearchQuery,
  db: IDatabase,
  baseUrl: string
): Response {
  const records = db.search(query);

  const results: BlueprintResponse[] = records.map((record) =>
    toBlueprintResponse(record, db, baseUrl)
  );

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
