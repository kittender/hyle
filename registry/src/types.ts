import type { HyleManifest } from "../../../cli/src/manifest";

export interface RegistryRecord {
  id: number;
  author: string;
  name: string;
  version: string;
  description?: string;
  tags: string[];
  is_stable: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  checksum: string;
  bundle_path: string;
  manifest_json: string;
  created_at: string;
}

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

export interface Badge {
  type: "security_scanned" | "security_warning" | "security_flagged" | "new_author";
  label: string;
  variant: "success" | "warning" | "danger" | "info";
}

export interface SubstrateResponse {
  author: string;
  name: string;
  version: string;
  description?: string;
  tags: string[];
  is_stable: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  checksum: string;
  manifest: HyleManifest;
  bundle_url: string;
  created_at: string;
  scan_result?: ScanResult;
  badges?: Badge[];
}

export interface SecurityReport {
  substrate: { author: string; name: string; version: string };
  scan_result: ScanResult;
  badges: Badge[];
  checksum: string;
}

export interface ChecksumsResponse {
  author: string;
  name: string;
  version: string;
  sha256: string;
}

export interface PublishRequest {
  manifest: HyleManifest;
  bundle: Uint8Array;
}

export interface SearchQuery {
  q?: string;
  tags?: string;
  author?: string;
  limit?: number;
  sort?: 'recent' | 'name';
  offset?: number;
}

export interface AuthorProfile {
  author: string;
  substrate_count: number;
  total_versions: number;
  substrates: SubstrateResponse[];
}

export interface DiffResponse {
  v1: string;
  v2: string;
  left: string;
  right: string;
}

export interface DepResolutionResult {
  name: string;
  version: string;
  confidence: number;
  command?: string;
}
