import { dump } from "js-yaml";
import type { IDatabase } from "../db";
import type { DiffResponse } from "../types";
import type { HyleManifest } from "../../../cli/src/manifest";

export function handleDiff(
  author: string,
  name: string,
  v1: string,
  baseV: string,
  db: IDatabase
): Response {
  const record1 = db.getVersion(author, name, v1);
  const recordBase = db.getVersion(author, name, baseV);

  if (!record1 || !recordBase) {
    return new Response(
      JSON.stringify({
        error: "One or both versions not found",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const manifest1 = JSON.parse(record1.manifest_json) as HyleManifest;
    const manifestBase = JSON.parse(recordBase.manifest_json) as HyleManifest;

    const leftYaml = dump(manifestBase, { lineWidth: -1 });
    const rightYaml = dump(manifest1, { lineWidth: -1 });

    const response: DiffResponse = {
      v1,
      v2: baseV,
      left: leftYaml,
      right: rightYaml,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to parse manifests",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
