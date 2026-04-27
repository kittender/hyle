import { Injectable, signal, computed } from '@angular/core';
import { AuthUser } from '../models/print.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'hyle-auth';

  private _user = signal<AuthUser | null>(this.loadFromStorage());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(user: AuthUser): void {
    this._user.set(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
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
