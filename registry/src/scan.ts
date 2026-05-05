import type { HyleManifest } from "../../../cli/src/manifest";

export interface ScanFinding {
  severity: "critical" | "warning" | "info";
  category: "suspicious_pattern" | "spam" | "invalid_url";
  detail: string;
}

export interface ScanResult {
  scan_status: "clean" | "flagged" | "warning" | "pending";
  findings: ScanFinding[];
  scanned_at: string;
}

const SUSPICIOUS_PATTERNS = ["eval(", "exec("];
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

function walkObject(obj: unknown, findings: ScanFinding[]): void {
  if (typeof obj === "string") {
    const lower = obj.toLowerCase();
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (lower.includes(pattern)) {
        findings.push({
          severity: "critical",
          category: "suspicious_pattern",
          detail: `Found "${pattern}" pattern in string: "${obj.substring(0, 50)}${obj.length > 50 ? "..." : ""}"`,
        });
      }
    }
    if (obj.includes("file://")) {
      findings.push({
        severity: "critical",
        category: "invalid_url",
        detail: `Found file:// URL: "${obj}"`,
      });
    }
    if (obj.includes("http://") && !obj.includes("https://")) {
      findings.push({
        severity: "warning",
        category: "invalid_url",
        detail: `Found non-HTTPS URL: "${obj}"`,
      });
    }
    if (IP_REGEX.test(obj)) {
      findings.push({
        severity: "warning",
        category: "invalid_url",
        detail: `Found IP-literal URL: "${obj}"`,
      });
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      walkObject(item, findings);
    }
  } else if (obj !== null && typeof obj === "object") {
    for (const value of Object.values(obj)) {
      walkObject(value, findings);
    }
  }
}

export function scanManifest(manifest: HyleManifest, bundleSize: number): ScanResult {
  const findings: ScanFinding[] = [];
  const scanned_at = new Date().toISOString();

  // Walk manifest for suspicious patterns
  walkObject(manifest, findings);

  // Bundle size spam detection
  if (bundleSize < 512) {
    findings.push({
      severity: "warning",
      category: "spam",
      detail: `Bundle size very small (${bundleSize} bytes) — possible spam`,
    });
  }

  // Empty file arrays spam detection
  const hasFiles =
    (manifest.ontology?.length ?? 0) > 0 ||
    (manifest.craft?.length ?? 0) > 0 ||
    (manifest.identities?.length ?? 0) > 0 ||
    (manifest.ethics?.length ?? 0) > 0;

  if (!hasFiles && bundleSize < 512) {
    findings.push({
      severity: "info",
      category: "spam",
      detail: "No file arrays specified and minimal bundle size",
    });
  }

  // Determine scan_status
  let scan_status: "clean" | "flagged" | "warning" = "clean";
  if (findings.some((f) => f.severity === "critical")) {
    scan_status = "flagged";
  } else if (findings.some((f) => f.severity === "warning")) {
    scan_status = "warning";
  }

  return { scan_status, findings, scanned_at };
}
