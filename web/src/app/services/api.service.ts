import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
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
  star_count?: number;
  avg_rating?: number;
  scan_result?: any;
  badges?: any[];
  tree?: any;
  id?: string;
  tag?: string;
  date?: string;
  notes?: string;
}

export interface AuthorProfile {
  author: string;
  substrate_count: number;
  total_versions: number;
  substrates: SubstrateResponse[];
  bio?: string;
  avatar_url?: string;
  website?: string;
  star_count_total?: number;
}

export interface DiffResponse {
  v1: string;
  v2: string;
  left: string;
  right: string;
}

export interface StarResponse {
  count: number;
  viewer_starred: boolean;
}

export interface Review {
  id?: string;
  username: string;
  rating: number;
  body?: string;
  created_at?: string;
}

export interface ToggleStarResponse {
  starred: boolean;
  count: number;
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
    return this.http.get<SubstrateResponse[]>(url).pipe(
      catchError(err => {
        console.error('Search failed:', err);
        return of([]);
      })
    );
  }

  getSubstrate(author: string, name: string, version?: string): Observable<SubstrateResponse> {
    const versionPart = version ? `@${version}` : '';
    const url = `${this.baseUrl}/substrates/${author}/${name}${versionPart}`;
    return this.http.get<SubstrateResponse>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch substrate:', err);
        throw err;
      })
    );
  }

  getVersions(author: string, name: string): Observable<SubstrateResponse[]> {
    const url = `${this.baseUrl}/substrates/${author}/${name}/versions`;
    return this.http.get<SubstrateResponse[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch versions:', err);
        return of([]);
      })
    );
  }

  getTrending(limit: number = 20): Observable<SubstrateResponse[]> {
    const url = `${this.baseUrl}/trending?limit=${limit}`;
    return this.http.get<SubstrateResponse[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch trending:', err);
        return of([]);
      })
    );
  }

  getTags(): Observable<string[]> {
    const url = `${this.baseUrl}/tags`;
    return this.http.get<string[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch tags:', err);
        return of([]);
      })
    );
  }

  getAuthor(author: string): Observable<AuthorProfile> {
    const url = `${this.baseUrl}/authors/${author}`;
    return this.http.get<AuthorProfile>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch author profile:', err);
        throw err;
      })
    );
  }

  getDiff(author: string, name: string, v1: string, base: string): Observable<DiffResponse> {
    const url = `${this.baseUrl}/substrates/${author}/${name}@${v1}/diff?base=${base}`;
    return this.http.get<DiffResponse>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch diff:', err);
        throw err;
      })
    );
  }

  getStars(author: string, name: string): Observable<StarResponse> {
    const url = `${this.baseUrl}/substrates/${author}/${name}/stars`;
    return this.http.get<StarResponse>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch stars:', err);
        return of({ count: 0, viewer_starred: false });
      })
    );
  }

  toggleStar(author: string, name: string): Observable<ToggleStarResponse> {
    const url = `${this.baseUrl}/substrates/${author}/${name}/star`;
    return this.http.post<ToggleStarResponse>(url, {}).pipe(
      catchError(err => {
        console.error('Failed to toggle star:', err);
        throw err;
      })
    );
  }

  getReviews(author: string, name: string): Observable<Review[]> {
    const url = `${this.baseUrl}/substrates/${author}/${name}/reviews`;
    return this.http.get<Review[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch reviews:', err);
        return of([]);
      })
    );
  }

  submitReview(author: string, name: string, rating: number, body?: string): Observable<Review> {
    const url = `${this.baseUrl}/substrates/${author}/${name}/reviews`;
    return this.http.post<Review>(url, { rating, body }).pipe(
      catchError(err => {
        console.error('Failed to submit review:', err);
        throw err;
      })
    );
  }
}
