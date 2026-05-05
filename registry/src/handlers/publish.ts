import { createHash } from "node:crypto";
import { dump } from "js-yaml";
import type { HyleManifest } from "../../../cli/src/manifest";
import type { IDatabase } from "../db";
import type { IStorage } from "../storage";
import type { IAuth } from "../auth";
import { scanManifest } from "../scan";

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
  let author: string;

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

  // Rate limiting: check max publishes per hour
  const RATE_LIMIT_WINDOW_S = 3600;
  const MAX_PUBLISHES_PER_WINDOW = parseInt(process.env.HYLE_RATE_LIMIT ?? "10");
  const recentCount = db.countRecentPublishes(manifest.author, RATE_LIMIT_WINDOW_S);
  if (recentCount >= MAX_PUBLISHES_PER_WINDOW) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded: max ${MAX_PUBLISHES_PER_WINDOW} publishes per hour`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "3600",
        },
      }
    );
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

  // Spam detection: flag if bundle is tiny and has no files
  let isSpam = false;
  if (bundleData.length < 512) {
    const hasFiles =
      (manifest.ontology?.length ?? 0) > 0 ||
      (manifest.craft?.length ?? 0) > 0 ||
      (manifest.identities?.length ?? 0) > 0 ||
      (manifest.ethics?.length ?? 0) > 0;
    if (!hasFiles) {
      isSpam = true;
    }
  }

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
    isStable && !isSpam
  );

  // Run security scan asynchronously
  queueMicrotask(() => {
    const scanResult = scanManifest(manifest, bundleData.length);
    db.insertScan(record.id, scanResult);
    if (scanResult.scan_status === "flagged") {
      const topFinding = scanResult.findings.find((f) => f.severity === "critical");
      const reason = topFinding?.detail ?? "Security scan flagged";
      db.flagSubstrate(record.id, reason);
    }
  });

  // Record publish for rate limiting
  db.recordPublish(manifest.author);

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
        scan_status: "pending",
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
}
