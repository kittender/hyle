import type { HyleManifest } from "../../../cli/src/manifest";

/**
 * True if the manifest declares any blueprint files. Files live under
 * manifest.blueprint.* in the current schema; older manifests put them at the
 * top level, so check both.
 */
export function manifestHasFiles(manifest: HyleManifest): boolean {
  const bp = (manifest as { blueprint?: Record<string, unknown> }).blueprint;
  const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return (
    len(bp?.ontology) > 0 ||
    len(bp?.craft) > 0 ||
    len(bp?.identities) > 0 ||
    len(bp?.ethics) > 0 ||
    len(manifest.ontology) > 0 ||
    len(manifest.craft) > 0 ||
    len(manifest.identities) > 0 ||
    len(manifest.ethics) > 0
  );
}

export interface ScanFinding {
  severity: "critical" | "warning" | "info";
  category: "suspicious_pattern" | "spam" | "invalid_url" | "behavioral_keyword";
  detail: string;
}

export interface ScanResult {
  scan_status: "clean" | "flagged" | "warning" | "pending";
  findings: ScanFinding[];
  scanned_at: string;
}

const SUSPICIOUS_PATTERNS = ["eval(", "exec("];
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

const BEHAVIORAL_KEYWORDS = [
  "ignore previous instructions",
  "ignore previous prompt",
  "do not ask confirmation",
  "do not ask for confirmation",
  "do not verify",
  "skip verification",
  "exfiltrate",
  "webhook",
  "bypass",
];

const DIRECTIVE_PATTERNS = /\b(you must|always|never|do not|cannot|you will)\b/gi;

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

function scanBehavioralKeywords(text: string, filename: string, findings: ScanFinding[]): void {
  const lower = text.toLowerCase();
  for (const keyword of BEHAVIORAL_KEYWORDS) {
    if (lower.includes(keyword)) {
      findings.push({
        severity: "critical",
        category: "behavioral_keyword",
        detail: `Found behavioral keyword "${keyword}" in ${filename}`,
      });
    }
  }
  const directiveMatches = text.match(DIRECTIVE_PATTERNS);
  if (directiveMatches && (filename.includes("CLAUDE.md") || filename.includes("AGENTS.md"))) {
    findings.push({
      severity: "warning",
      category: "behavioral_keyword",
      detail: `Found directive language (${directiveMatches.slice(0, 2).join(", ")}) in ${filename}`,
    });
  }
}

export function scanManifest(manifest: HyleManifest, bundleSize: number): ScanResult {
  const findings: ScanFinding[] = [];
  const scanned_at = new Date().toISOString();

  // Walk manifest for suspicious patterns
  walkObject(manifest, findings);

  // Check behavioral keywords in manifest fields
  const manifestText = JSON.stringify(manifest);
  scanBehavioralKeywords(manifestText, "manifest", findings);

  // Bundle size spam detection
  if (bundleSize < 512) {
    findings.push({
      severity: "warning",
      category: "spam",
      detail: `Bundle size very small (${bundleSize} bytes) — possible spam`,
    });
  }

  // Empty file arrays spam detection.
  // Files live under manifest.blueprint.* (current schema); fall back to
  // top-level for older manifests.
  const hasFiles = manifestHasFiles(manifest);

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

export function scanBundleFiles(bundleData: Uint8Array): ScanFinding[] {
  const findings: ScanFinding[] = [];

  try {
    const bundleStr = Buffer.from(bundleData).toString("utf-8", 0, Math.min(500000, bundleData.length));

    for (const keyword of BEHAVIORAL_KEYWORDS) {
      if (bundleStr.toLowerCase().includes(keyword)) {
        findings.push({
          severity: "critical",
          category: "behavioral_keyword",
          detail: `Found behavioral keyword "${keyword}" in bundle files`,
        });
      }
    }

    const directiveMatches = bundleStr.match(DIRECTIVE_PATTERNS);
    if (directiveMatches && (bundleStr.includes("CLAUDE.md") || bundleStr.includes("AGENTS.md"))) {
      findings.push({
        severity: "warning",
        category: "behavioral_keyword",
        detail: `Found directive language in instruction files (${directiveMatches.slice(0, 2).join(", ")})`,
      });
    }
  } catch (e) {
    findings.push({
      severity: "info",
      category: "suspicious_pattern",
      detail: `Bundle behavioral scan: ${(e as Error).message}`,
    });
  }

  return findings;
}
