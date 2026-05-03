import { createHash } from "node:crypto";
import { dump } from "js-yaml";
import type { HyleManifest } from "../../../cli/src/manifest";
import type { IDatabase } from "../db";
import type { IStorage } from "../storage";
import type { IAuth } from "../auth";

export async function handlePublish(
  req: Request,
  db: IDatabase,
  storage: IStorage,
  auth: IAuth
): Promise<Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  if (!auth.verifyToken(token)) {
    return new Response(JSON.stringify({ error: "Invalid API token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let manifest: HyleManifest;
  let bundleData: Uint8Array;

  try {
    const formData = await req.formData();

    const manifestFile = formData.get("manifest");
    if (!manifestFile || !(manifestFile instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing manifest file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bundleFile = formData.get("bundle");
    if (!bundleFile || !(bundleFile instanceof File)) {
      return new Response(JSON.stringify({ error: "Missing bundle file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const manifestText = await manifestFile.text();
    manifest = JSON.parse(manifestText);

    bundleData = new Uint8Array(await bundleFile.arrayBuffer());
  } catch (e) {
    return new Response(JSON.stringify({ error: `Invalid request: ${(e as Error).message}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!manifest.name || !manifest.author || !manifest.version) {
    return new Response(JSON.stringify({ error: "Manifest missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const exists = db.exists(manifest.author, manifest.name, manifest.version);
  if (exists) {
    return new Response(
      JSON.stringify({ error: `Version ${manifest.author}/${manifest.name}@${manifest.version} already exists` }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const checksum = createHash("sha256").update(bundleData).digest("hex");
  const bundleKey = `${manifest.author}/${manifest.name}/${manifest.version}.tar.gz`;
  const manifestJson = JSON.stringify(manifest);

  await storage.storeBundle(bundleKey, bundleData);

  const isStable = !manifest.version.includes("-snapshot");
  const record = db.insertSubstrate(
    manifest.author,
    manifest.name,
    manifest.version,
    manifestJson,
    bundleKey,
    checksum,
    manifest.description,
    manifest.tags || [],
    isStable
  );

  return new Response(
    JSON.stringify({
      success: true,
      record: {
        id: record.id,
        author: record.author,
        name: record.name,
        version: record.version,
        checksum: record.checksum,
        created_at: record.created_at,
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
}
