import type { HyleManifest } from "../../../cli/src/manifest";

export interface User {
  id: number;
  github_id: string;
  username: string;
  email?: string;
  email_verified: boolean;
  avatar_url?: string;
  bio?: string;
  website?: string;
  created_at: string;
  last_login?: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}

export interface OidcPayload {
  sub: string;
  iss: string;
  aud?: string;
  iat: number;
  exp: number;
  email?: string;
  username?: string;
  name?: string;
}

export interface OidcProvider {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
}

export interface JwksKey {
  kty: string;
  use?: string;
  kid?: string;
  n?: string;
  e?: string;
  alg?: string;
}

export interface Jwks {
  keys: JwksKey[];
}

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
  type: "security_scanned" | "security_warning" | "security_flagged" | "verified" | "community" | "popular";
  label: string;
  variant: "success" | "warning" | "danger" | "info";
}

export interface BlueprintResponse {
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
  star_count?: number;
  avg_rating?: number;
}

export interface SecurityReport {
  blueprint: { author: string; name: string; version: string };
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
  blueprint_count: number;
  total_versions: number;
  blueprints: BlueprintResponse[];
  bio?: string;
  avatar_url?: string;
  website?: string;
  star_count_total?: number;
}

export interface BreakingChange {
  severity: "breaking" | "warning";
  category:
    | "model_change"
    | "dependency_removed"
    | "dependency_downgrade"
    | "files_removed"
    | "provider_change"
    | "extends_changed";
  detail: string;
}

export interface Review {
  id: number;
  username: string;
  avatar_url?: string;
  rating: number;
  body?: string;
  created_at: string;
}

export interface StarResponse {
  starred: boolean;
  count: number;
}

export interface NotificationPrefs {
  email_on_star: boolean;
  email_on_review: boolean;
  email_on_new_version: boolean;
}

export interface DiffResponse {
  v1: string;
  v2: string;
  left: string;
  right: string;
  breaking_changes?: BreakingChange[];
}

export interface DepResolutionResult {
  name: string;
  version: string;
  confidence: number;
  command?: string;
}
