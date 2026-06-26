import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { API_BASE_URL } from '../app.config';

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
  manifest: any; // HyleManifest from CLI
  bundle_url: string;
  created_at: string;
  star_count?: number;
  avg_rating?: number;
  install_count?: number;
  license?: string;
  language?: string;
  long_description?: string;
  fork_count?: number;
  is_team_pick?: boolean;
  pull_count?: number;
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
  blueprint_count: number;
  total_versions: number;
  blueprints: BlueprintResponse[];
  bio?: string;
  avatar_url?: string;
  website?: string;
  socials?: Record<string, string>;
  star_count_total?: number;
}

export interface OverviewStats {
  total_blueprints: number;
  total_stars: number;
  total_authors: number;
}

export interface ActivityEvent {
  id: number;
  type: 'push' | 'pull' | 'verified' | 'community';
  blueprint_author: string;
  blueprint_name: string;
  version?: string;
  note?: string;
  actor_username?: string;
  created_at: string;
}

export interface FileContent {
  path: string;
  content: string;
  language: string;
}

export type PullPeriod = 'month' | 'half' | 'year' | 'all';

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
  sort?: 'recent' | 'name' | 'stars' | 'pulls';
  offset?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private baseUrl: string,
  ) {}

  search(params: SearchParams): Observable<BlueprintResponse[]> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set('q', params.q);
    if (params.author) queryParams.set('author', params.author);
    if (params.tags) queryParams.set('tags', params.tags);
    if (params.sort) queryParams.set('sort', params.sort);
    if (params.offset !== undefined) queryParams.set('offset', String(params.offset));
    if (params.limit !== undefined) queryParams.set('limit', String(params.limit));

    const url = `${this.baseUrl}/blueprints?${queryParams.toString()}`;
    return this.http.get<BlueprintResponse[]>(url).pipe(
      catchError(err => {
        console.error('Search failed:', err);
        return of([]);
      })
    );
  }

  getBlueprint(author: string, name: string, version?: string): Observable<BlueprintResponse> {
    const versionPart = version ? `@${version}` : '';
    const url = `${this.baseUrl}/blueprints/${author}/${name}${versionPart}`;
    return this.http.get<BlueprintResponse>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch blueprint:', err);
        throw err;
      })
    );
  }

  getVersions(author: string, name: string): Observable<BlueprintResponse[]> {
    const url = `${this.baseUrl}/blueprints/${author}/${name}/versions`;
    return this.http.get<BlueprintResponse[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch versions:', err);
        return of([]);
      })
    );
  }

  getTrending(limit: number = 20): Observable<BlueprintResponse[]> {
    const url = `${this.baseUrl}/trending?limit=${limit}`;
    return this.http.get<BlueprintResponse[]>(url).pipe(
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

  getOverviewStats(): Observable<OverviewStats> {
    const url = `${this.baseUrl}/stats/overview`;
    return this.http.get<OverviewStats>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch overview stats:', err);
        return of({ total_blueprints: 0, total_stars: 0, total_authors: 0 });
      })
    );
  }

  getMostPulled(period: PullPeriod = 'month', limit: number = 4): Observable<BlueprintResponse[]> {
    const url = `${this.baseUrl}/stats/most-pulled?period=${period}&limit=${limit}`;
    return this.http.get<BlueprintResponse[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch most-pulled:', err);
        return of([]);
      })
    );
  }

  getTeamPicks(): Observable<BlueprintResponse[]> {
    const url = `${this.baseUrl}/stats/team-picks`;
    return this.http.get<BlueprintResponse[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch team picks:', err);
        return of([]);
      })
    );
  }

  getActivity(author?: string, limit: number = 20): Observable<ActivityEvent[]> {
    const params = new URLSearchParams();
    if (author) params.set('author', author);
    params.set('limit', String(limit));
    const url = `${this.baseUrl}/stats/activity?${params.toString()}`;
    return this.http.get<ActivityEvent[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch activity:', err);
        return of([]);
      })
    );
  }

  getUserStars(username: string): Observable<BlueprintResponse[]> {
    const url = `${this.baseUrl}/users/${username}/stars`;
    return this.http.get<BlueprintResponse[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch user stars:', err);
        return of([]);
      })
    );
  }

  getFileContent(author: string, name: string, path: string, version?: string): Observable<FileContent> {
    const versionPart = version ? `@${version}` : '';
    const url = `${this.baseUrl}/blueprints/${author}/${name}${versionPart}/files?path=${encodeURIComponent(path)}`;
    return this.http.get<FileContent>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch file content:', err);
        return of({ path, content: '', language: 'plain' });
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
    const url = `${this.baseUrl}/blueprints/${author}/${name}@${v1}/diff?base=${base}`;
    return this.http.get<DiffResponse>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch diff:', err);
        throw err;
      })
    );
  }

  getStars(author: string, name: string): Observable<StarResponse> {
    const url = `${this.baseUrl}/blueprints/${author}/${name}/stars`;
    return this.http.get<StarResponse>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch stars:', err);
        return of({ count: 0, viewer_starred: false });
      })
    );
  }

  toggleStar(author: string, name: string): Observable<ToggleStarResponse> {
    const url = `${this.baseUrl}/blueprints/${author}/${name}/star`;
    return this.http.post<ToggleStarResponse>(url, {}).pipe(
      catchError(err => {
        console.error('Failed to toggle star:', err);
        throw err;
      })
    );
  }

  getReviews(author: string, name: string): Observable<Review[]> {
    const url = `${this.baseUrl}/blueprints/${author}/${name}/reviews`;
    return this.http.get<Review[]>(url).pipe(
      catchError(err => {
        console.error('Failed to fetch reviews:', err);
        return of([]);
      })
    );
  }

  submitReview(author: string, name: string, rating: number, body?: string): Observable<Review> {
    const url = `${this.baseUrl}/blueprints/${author}/${name}/reviews`;
    return this.http.post<Review>(url, { rating, body }).pipe(
      catchError(err => {
        console.error('Failed to submit review:', err);
        throw err;
      })
    );
  }
}
