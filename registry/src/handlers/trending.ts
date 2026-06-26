import type { IDatabase } from "../db";
import type { BlueprintResponse } from "../types";
import { toBlueprintResponse } from "./serialize";

export function handleTrending(
  limit: number,
  db: IDatabase,
  baseUrl: string
): Response {
  const records = db.getTrending(limit);

  const results: BlueprintResponse[] = records.map((record) =>
    toBlueprintResponse(record, db, baseUrl)
  );

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
