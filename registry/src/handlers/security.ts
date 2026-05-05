import type { IDatabase } from "../db";
import type { Badge, SecurityReport, ScanResult } from "../types";

function computeBadges(scan: ScanResult): Badge[] {
  const badges: Badge[] = [];

  if (scan.scan_status === "pending") {
    return badges;
  }

  if (scan.scan_status === "clean") {
    badges.push({
      type: "security_scanned",
      label: "Security Scanned",
      variant: "success",
    });
  } else if (scan.scan_status === "warning") {
    badges.push({
      type: "security_warning",
      label: "Security Warning",
      variant: "warning",
    });
  } else if (scan.scan_status === "flagged") {
    badges.push({
      type: "security_flagged",
      label: "Security Flagged",
      variant: "danger",
    });
  }

  return badges;
}

export function handleSecurityReport(
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

  let scan = db.getScan(record.id);
  if (!scan) {
    scan = {
      scan_status: "pending",
      findings: [],
      scanned_at: "",
    };
  }

  const badges = computeBadges(scan);

  const report: SecurityReport = {
    substrate: {
      author: record.author,
      name: record.name,
      version: record.version,
    },
    scan_result: scan,
    badges,
    checksum: record.checksum,
  };

  return new Response(JSON.stringify(report), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
