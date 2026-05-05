import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../app.config';

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
  manifest: any; // HyleManifest from CLI
  bundle_url: string;
  created_at: string;
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

export interface SearchParams {
  q?: string;
  author?: string;
  tags?: string;
  sort?: 'recent' | 'name';
  offset?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private baseUrl: string,
  ) {}

  search(params: SearchParams): Observable<SubstrateResponse[]> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set('q', params.q);
    if (params.author) queryParams.set('author', params.author);
    if (params.tags) queryParams.set('tags', params.tags);
    if (params.sort) queryParams.set('sort', params.sort);
    if (params.offset !== undefined) queryParams.set('offset', String(params.offset));
    if (params.limit !== undefined) queryParams.set('limit', String(params.limit));

    const url = `${this.baseUrl}/substrates?${queryParams.toString()}`;
    return this.http.get<SubstrateResponse[]>(url);
  }

  getSubstrate(author: string, name: string, version?: string): Observable<SubstrateResponse> {
    const versionPart = version ? `@${version}` : '';
    const url = `${this.baseUrl}/substrates/${author}/${name}${versionPart}`;
    return this.http.get<SubstrateResponse>(url);
  }

  getVersions(author: string, name: string): Observable<SubstrateResponse[]> {
    const url = `${this.baseUrl}/substrates/${author}/${name}/versions`;
    return this.http.get<SubstrateResponse[]>(url);
  }

  getTrending(limit: number = 20): Observable<SubstrateResponse[]> {
    const url = `${this.baseUrl}/trending?limit=${limit}`;
    return this.http.get<SubstrateResponse[]>(url);
  }

  getTags(): Observable<string[]> {
    const url = `${this.baseUrl}/tags`;
    return this.http.get<string[]>(url);
  }

  getAuthor(author: string): Observable<AuthorProfile> {
    const url = `${this.baseUrl}/authors/${author}`;
    return this.http.get<AuthorProfile>(url);
  }

  getDiff(author: string, name: string, v1: string, base: string): Observable<DiffResponse> {
    const url = `${this.baseUrl}/substrates/${author}/${name}@${v1}/diff?base=${base}`;
    return this.http.get<DiffResponse>(url);
  }
}
