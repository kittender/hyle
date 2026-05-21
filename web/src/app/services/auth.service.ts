import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthUser } from '../models/print.model';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'hyle-auth';
  private readonly TOKEN_KEY = 'hyle-token';

  private _user = signal<AuthUser | null>(this.loadFromStorage());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor(private http: HttpClient) {
    // Restore token from storage
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token && !this._user()) {
      this.verifyToken(token).subscribe({
        next: (response: any) => {
          this.setUser(response, token);
        },
        error: () => {
          this.clearToken();
        },
      });
    }
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private setUser(userData: Partial<AuthUser>, token: string): void {
    const user: AuthUser = {
      id: userData.id,
      name: userData.name || '',
      username: userData.username || '',
      email: userData.email || '',
      avatar: userData.avatar,
      token,
    };
    this._user.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  login(user: AuthUser): void {
    this._user.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    if (user.token) {
      localStorage.setItem(this.TOKEN_KEY, user.token);
    }
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  loginWithGitHub(): void {
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : window.location.origin.replace(/:\d+$/, '');
    window.location.href = `${baseUrl}/auth/github?redirect_uri=${encodeURIComponent(
      window.location.origin + '/auth/callback'
    )}`;
  }

  handleCallback(token: string): void {
    this.verifyToken(token).subscribe({
      next: (response: any) => {
        this.setUser(response, token);
      },
      error: (error) => {
        console.error('Token verification failed:', error);
        this.logout();
      },
    });
  }

  private verifyToken(token: string): Observable<any> {
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : window.location.origin.replace(/:\d+$/, '');
    return this.http.get(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  mockLogin(email: string): void {
    const user: AuthUser = {
      name: 'Andrej Kirskyn',
      username: 'andrej-kirskyn',
      email,
      avatar: null,
    };
    this.login(user);
  }
}
