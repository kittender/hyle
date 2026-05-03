import type { HyleManifest } from "./manifest";

export interface SubstrateInfo {
  author: string;
  name: string;
  version: string;
  description?: string;
  tags: string[];
  checksum: string;
  manifest: HyleManifest;
  bundle_url: string;
  created_at: string;
}

export interface RegistryClient {
  publish(bundle: Uint8Array, manifest: HyleManifest, isStable: boolean): Promise<PublishResult>;
  fetchLatest(author: string, name: string): Promise<SubstrateInfo>;
  fetchVersion(author: string, name: string, version: string): Promise<SubstrateInfo>;
  fetchBundle(author: string, name: string, version?: string): Promise<Uint8Array>;
  search(query: string, tags?: string[]): Promise<SubstrateInfo[]>;
  versions(author: string, name: string): Promise<SubstrateInfo[]>;
}

export interface PublishResult {
  success: boolean;
  record: {
    id: number;
    author: string;
    name: string;
    version: string;
    checksum: string;
    created_at: string;
  };
}

export class HttpRegistryClient implements RegistryClient {
  private baseUrl: string;
  private authToken?: string;
  private fetcher: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(
    baseUrl: string,
    authToken?: string,
    fetcher: (url: string, init?: RequestInit) => Promise<Response> = globalThis.fetch
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.authToken = authToken;
    this.fetcher = fetcher;
  }

  async publish(bundle: Uint8Array, manifest: HyleManifest, isStable: boolean): Promise<PublishResult> {
    const formData = new FormData();
    formData.append("manifest", new Blob([JSON.stringify(manifest)], { type: "application/json" }));
    formData.append("bundle", new Blob([Buffer.from(bundle)], { type: "application/gzip" }));

    const headers: HeadersInit = {};
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await this.fetcher(`${this.baseUrl}/substrates`, {
      method: "POST",
      headers,
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Publish failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as PublishResult;
  }

  async fetchLatest(author: string, name: string): Promise<SubstrateInfo> {
    return this.fetchVersion(author, name, "latest");
  }

  async fetchVersion(author: string, name: string, version: string): Promise<SubstrateInfo> {
    const versionSuffix = version === "latest" ? "" : `@${version}`;
    const url = `${this.baseUrl}/substrates/${author}/${name}${versionSuffix}`;

    const response = await this.fetcher(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as SubstrateInfo;
  }

  async fetchBundle(author: string, name: string, version?: string): Promise<Uint8Array> {
    const versionSuffix = version ? `@${version}` : "";
    const url = `${this.baseUrl}/substrates/${author}/${name}${versionSuffix}/bundle`;

    const response = await this.fetcher(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Bundle fetch failed: ${response.status} ${response.statusText}`);
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  async search(query: string, tags?: string[]): Promise<SubstrateInfo[]> {
    const url = new URL(`${this.baseUrl}/substrates`);
    if (query) url.searchParams.set("q", query);
    if (tags && tags.length > 0) url.searchParams.set("tags", tags.join(","));

    const response = await this.fetcher(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as SubstrateInfo[];
  }

  async versions(author: string, name: string): Promise<SubstrateInfo[]> {
    const url = `${this.baseUrl}/substrates/${author}/${name}/versions`;

    const response = await this.fetcher(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Versions fetch failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as SubstrateInfo[];
  }
}
