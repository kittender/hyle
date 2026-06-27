import { Component, Input, Output, EventEmitter, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-star-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="star-button"
      [class.starred]="starred()"
      (click)="onStar()"
      [disabled]="loading()"
      [title]="!isLoggedIn() ? 'Login to star' : ''">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <span class="count">{{ count() }}</span>
    </button>
  `,
  styles: [`
    .star-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(196,152,42,0.08);
      border: 1px solid rgba(196,152,42,0.2);
      border-radius: 6px;
      color: rgba(196,152,42,0.6);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .star-button:hover:not(:disabled) {
      background: rgba(196,152,42,0.15);
      color: rgba(196,152,42,1);
    }

    .star-button.starred {
      background: rgba(196,152,42,0.2);
      color: #c49a2a;
    }

    .star-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    svg {
      width: 1em;
      height: 1em;
    }

    .count {
      font-weight: 500;
    }
  `]
})
export class StarButtonComponent implements OnInit {
  @Input() author!: string;
  @Input() name!: string;
  @Output() starsChanged = new EventEmitter<number>();

  starred = signal(false);
  count = signal(0);
  loading = signal(false);
  private destroyRef = inject(DestroyRef);

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadStarStatus();
  }

  loadStarStatus() {
    this.apiService.getStars(this.author, this.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.count.set(data.count);
          this.starred.set(data.viewer_starred);
        }
      });
  }

  onStar() {
    if (!this.isLoggedIn()) {
      // Would redirect to login
      return;
    }

    this.loading.set(true);
    this.apiService.toggleStar(this.author, this.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (data) => {
        this.starred.set(data.starred);
        this.count.set(data.count);
        this.starsChanged.emit(data.count);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  isLoggedIn(): boolean {
    return !!this.authService.user();
  }
}
