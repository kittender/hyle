import type { HyleManifest } from "./manifest";

export interface BlueprintInfo {
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
	publish(
		bundle: Uint8Array,
		manifest: HyleManifest,
		isStable: boolean,
	): Promise<PublishResult>;
	fetchLatest(author: string, name: string): Promise<BlueprintInfo>;
	fetchVersion(
		author: string,
		name: string,
		version: string,
	): Promise<BlueprintInfo>;
	fetchBundle(
		author: string,
		name: string,
		version?: string,
	): Promise<Uint8Array>;
	search(query: string, tags?: string[]): Promise<BlueprintInfo[]>;
	versions(author: string, name: string): Promise<BlueprintInfo[]>;
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
		fetcher: (
			url: string,
			init?: RequestInit,
		) => Promise<Response> = globalThis.fetch,
	) {
		this.baseUrl = baseUrl.replace(/\/$/, "");
		this.authToken = authToken;
		this.fetcher = fetcher;
	}

	async publish(
		bundle: Uint8Array,
		manifest: HyleManifest,
		isStable: boolean,
	): Promise<PublishResult> {
		const formData = new FormData();
		formData.append(
			"manifest",
			new Blob([JSON.stringify(manifest)], { type: "application/json" }),
		);
		formData.append(
			"bundle",
			new Blob([Buffer.from(bundle)], { type: "application/gzip" }),
		);

		const headers: HeadersInit = {};
		if (this.authToken) {
			headers.Authorization = `Bearer ${this.authToken}`;
		}

		const response = await this.fetcher(`${this.baseUrl}/blueprints`, {
			method: "POST",
			headers,
			body: formData,
			signal: AbortSignal.timeout(30000),
		});

		if (!response.ok) {
			throw new Error(
				`Publish failed: ${response.status} ${response.statusText}`,
			);
		}

		return (await response.json()) as PublishResult;
	}

	async fetchLatest(author: string, name: string): Promise<BlueprintInfo> {
		return this.fetchVersion(author, name, "latest");
	}

	async fetchVersion(
		author: string,
		name: string,
		version: string,
	): Promise<BlueprintInfo> {
		const versionSuffix = version === "latest" ? "" : `@${version}`;
		const url = `${this.baseUrl}/blueprints/${author}/${name}${versionSuffix}`;

		const response = await this.fetcher(url, {
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) {
			throw new Error(
				`Fetch failed: ${response.status} ${response.statusText}`,
			);
		}

		return (await response.json()) as BlueprintInfo;
	}

	async fetchBundle(
		author: string,
		name: string,
		version?: string,
	): Promise<Uint8Array> {
		const versionSuffix = version ? `@${version}` : "";
		const url = `${this.baseUrl}/blueprints/${author}/${name}${versionSuffix}/bundle`;

		const response = await this.fetcher(url, {
			signal: AbortSignal.timeout(30000),
		});

		if (!response.ok) {
			throw new Error(
				`Bundle fetch failed: ${response.status} ${response.statusText}`,
			);
		}

		return new Uint8Array(await response.arrayBuffer());
	}

	async search(query: string, tags?: string[]): Promise<BlueprintInfo[]> {
		const url = new URL(`${this.baseUrl}/blueprints`);
		if (query) url.searchParams.set("q", query);
		if (tags && tags.length > 0) url.searchParams.set("tags", tags.join(","));

		const response = await this.fetcher(url.toString(), {
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) {
			throw new Error(
				`Search failed: ${response.status} ${response.statusText}`,
			);
		}

		return (await response.json()) as BlueprintInfo[];
	}

	async versions(author: string, name: string): Promise<BlueprintInfo[]> {
		const url = `${this.baseUrl}/blueprints/${author}/${name}/versions`;

		const response = await this.fetcher(url, {
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) {
			throw new Error(
				`Versions fetch failed: ${response.status} ${response.statusText}`,
			);
		}

		return (await response.json()) as BlueprintInfo[];
	}
}
