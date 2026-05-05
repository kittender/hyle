import type { IDatabase } from "../db";
import type { ChecksumsResponse } from "../types";

export function handleChecksums(
  author: string,
  name: string,
  version: string,
  db: IDatabase
): Response {
  const record = db.getVersion(author, name, version);
  if (!record) {
    return new Response(JSON.stringify({ error: "Substrate not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response: ChecksumsResponse = {
    author: record.author,
    name: record.name,
    version: record.version,
    sha256: record.checksum,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
