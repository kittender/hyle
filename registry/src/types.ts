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
}

export interface DepResolutionResult {
  name: string;
  version: string;
  confidence: number;
  command?: string;
}
