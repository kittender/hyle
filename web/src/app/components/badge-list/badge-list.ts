import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Badge {
  type: string;
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="badge-list">
      <span *ngFor="let badge of badges" [class]="'badge badge--' + badge.variant" [title]="badge.label">
        {{ badge.label }}
      </span>
    </div>
  `,
  styles: [`
    .badge-list {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .badge--success {
      background: rgba(34,197,94,0.2);
      color: #22c55e;
      border: 1px solid rgba(34,197,94,0.3);
    }

    .badge--warning {
      background: rgba(251,146,60,0.2);
      color: #fb923c;
      border: 1px solid rgba(251,146,60,0.3);
    }

    .badge--danger {
      background: rgba(239,68,68,0.2);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.3);
    }

    .badge--info {
      background: rgba(59,130,246,0.2);
      color: #3b82f6;
      border: 1px solid rgba(59,130,246,0.3);
    }
  `]
})
export class BadgeListComponent {
  @Input() badges: Badge[] = [];
}
