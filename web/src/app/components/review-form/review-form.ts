import { Component, Input, Output, EventEmitter, OnInit, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, Review } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-section">
      <h3>Reviews ({{ reviews().length }})</h3>

      <div *ngIf="isLoggedIn()" class="review-form">
        <div class="form-group">
          <label>Rating</label>
          <div class="rating-input">
            <button
              *ngFor="let r of [1,2,3,4,5]"
              class="star-input"
              [class.selected]="r <= (hoverRating() || rating())"
              (click)="rating.set(r)"
              (mouseenter)="hoverRating.set(r)"
              (mouseleave)="hoverRating.set(0)">
              ★
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Comment (optional)</label>
          <textarea
            [(ngModel)]="reviewText"
            placeholder="Share your thoughts..."
            rows="3"
            [disabled]="submitting()"></textarea>
        </div>

        <button
          class="submit-btn"
          (click)="submitReview()"
          [disabled]="submitting() || rating() === 0">
          {{ submitting() ? 'Submitting...' : 'Submit Review' }}
        </button>
      </div>

      <div *ngIf="!isLoggedIn()" class="login-prompt">
        <p>Sign in to leave a review</p>
      </div>

      <div class="reviews-list">
        <div *ngFor="let review of reviews()" class="review-item">
          <div class="review-header">
            <div class="rating">
              <span *ngFor="let i of [1,2,3,4,5]" class="star" [class.filled]="i <= review.rating">★</span>
            </div>
            <span class="username">{{ review.username }}</span>
            <span class="date">{{ review.created_at | date:'short' }}</span>
          </div>
          <p class="review-body">{{ review.body }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .review-section {
      margin-top: 2rem;
      border-top: 1px solid rgba(196,152,42,0.1);
      padding-top: 2rem;
    }

    h3 {
      margin-bottom: 1.5rem;
      font-size: 1.125rem;
    }

    .review-form {
      background: rgba(196,152,42,0.05);
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .rating-input {
      display: flex;
      gap: 0.5rem;
    }

    .star-input {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.5rem;
      background: rgba(196,152,42,0.1);
      border: 1px solid rgba(196,152,42,0.2);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      color: rgba(196,152,42,0.6);
    }

    .star-input:hover {
      background: rgba(196,152,42,0.2);
      color: #c49a2a;
    }

    .star-input.selected {
      background: rgba(196,152,42,0.3);
      color: #c49a2a;
      border-color: rgba(196,152,42,0.4);
    }

    textarea {
      width: 100%;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(196,152,42,0.2);
      border-radius: 4px;
      color: inherit;
      font-family: inherit;
      font-size: 0.875rem;
      resize: vertical;
    }

    textarea:focus {
      outline: none;
      border-color: rgba(196,152,42,0.4);
      background: rgba(255,255,255,0.08);
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      background: rgba(196,152,42,0.15);
      border: 1px solid rgba(196,152,42,0.3);
      border-radius: 6px;
      color: #c49a2a;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
      background: rgba(196,152,42,0.25);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .login-prompt {
      background: rgba(196,152,42,0.05);
      padding: 1rem;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 2rem;
      color: rgba(196,152,42,0.7);
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-item {
      padding: 1rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(196,152,42,0.1);
      border-radius: 6px;
    }

    .review-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .rating {
      display: flex;
      gap: 0.25rem;
      color: #c49a2a;
    }

    .star {
      opacity: 0.3;
    }

    .star.filled {
      opacity: 1;
    }

    .username {
      font-weight: 600;
    }

    .date {
      color: rgba(255,255,255,0.5);
      font-size: 0.8rem;
    }

    .review-body {
      margin: 0;
      color: rgba(255,255,255,0.8);
      line-height: 1.5;
    }
  `]
})
export class ReviewFormComponent implements OnInit {
  @Input() author!: string;
  @Input() name!: string;
  @Output() reviewSubmitted = new EventEmitter<Review>();

  reviews = signal<Review[]>([]);
  rating = signal(0);
  hoverRating = signal(0);
  reviewText = '';
  submitting = signal(false);
  private destroyRef = inject(DestroyRef);

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.apiService.getReviews(this.author, this.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.reviews.set(data);
        }
      });
  }

  submitReview() {
    if (this.rating() === 0) return;

    this.submitting.set(true);
    this.apiService.submitReview(this.author, this.name, this.rating(), this.reviewText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (review) => {
        this.reviews.set([review, ...this.reviews()]);
        this.rating.set(0);
        this.reviewText = '';
        this.submitting.set(false);
        this.reviewSubmitted.emit(review);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  isLoggedIn(): boolean {
    return !!this.authService.user();
  }
}
