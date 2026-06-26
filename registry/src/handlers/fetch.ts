import type { IDatabase } from "../db";
import type { IStorage } from "../storage";
import type { BlueprintResponse } from "../types";
import { toBlueprintResponse } from "./serialize";

export async function handleFetch(
  author: string,
  name: string,
  version: string | undefined,
  db: IDatabase,
  storage: IStorage,
  baseUrl: string
): Promise<Response> {
  let record;

  if (version) {
    record = db.getVersion(author, name, version);
  } else {
    record = db.getLatestStable(author, name);
  }

  if (!record) {
    return new Response(JSON.stringify({ error: "Blueprint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response: BlueprintResponse = toBlueprintResponse(record, db, baseUrl);

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleFetchBundle(
  author: string,
  name: string,
  version: string | undefined,
  db: IDatabase,
  storage: IStorage
): Promise<Response> {
  let record;

  if (version) {
    record = db.getVersion(author, name, version);
  } else {
    record = db.getLatestStable(author, name);
  }

  if (!record) {
    return new Response(JSON.stringify({ error: "Bundle not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Increment install count
  db.incrementInstallCount(author, name);

  const bundleData = await storage.retrieveBundle(record.bundle_path);

  return new Response(bundleData, {
    status: 200,
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${author}-${name}-${record.version}.tar.gz"`,
    },
  });
}
