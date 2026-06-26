import type { IDatabase } from "../db";
import type { BlueprintResponse } from "../types";
import { toBlueprintResponse } from "./serialize";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** GET /stats/overview — hero counters for the landing page. */
export function handleOverview(db: IDatabase): Response {
  return json(db.getOverviewStats());
}

/** Translate a period keyword to an ISO lower bound (null = all time). */
function periodSince(period: string | null): string | null {
  const now = Date.now();
  const days: Record<string, number> = { month: 30, half: 182, year: 365 };
  if (!period || period === "all") return null;
  const d = days[period];
  if (!d) return null;
  return new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
}

/** GET /stats/most-pulled?period=month|half|year|all&limit=N */
export function handleMostPulled(
  period: string | null,
  limit: number,
  db: IDatabase,
  baseUrl: string
): Response {
  const since = periodSince(period);
  const ranked = db.getMostPulled(since, limit);
  const results: BlueprintResponse[] = ranked.map(({ record, pull_count }) => ({
    ...toBlueprintResponse(record, db, baseUrl),
    pull_count,
  }));
  return json(results);
}

/** GET /stats/team-picks — curated featured blueprints. */
export function handleTeamPicks(db: IDatabase, baseUrl: string): Response {
  const records = db.getFeatured();
  const results: BlueprintResponse[] = records.map((r) =>
    toBlueprintResponse(r, db, baseUrl)
  );
  return json(results);
}

/** GET /stats/activity?author=<u>&limit=N — global or per-author activity feed. */
export function handleActivity(
  author: string | null,
  limit: number,
  db: IDatabase
): Response {
  return json(db.getActivity(author || undefined, limit));
}
