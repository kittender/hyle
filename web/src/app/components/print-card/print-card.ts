import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Print } from '../../models/print.model';

@Component({
  selector: 'app-print-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="print-card" style="padding: 18px 20px; position: relative;" (click)="navigate()">
      @if (print.verified || print.community) {
        <div style="position: absolute; top: 14px; right: 16px;">
          @if (print.verified) {
            <span style="font-size:10px; font-weight:700; padding:2px 7px; background:rgba(20,83,45,0.12); border:1px solid rgba(34,197,94,0.3); border-radius:20px; color:#166534; letter-spacing:0.05em; white-space:nowrap;">Verified</span>
          }
          @if (print.community) {
            <span style="font-size:10px; font-weight:700; padding:2px 7px; background:rgba(120,53,15,0.10); border:1px solid rgba(196,152,42,0.35); border-radius:20px; color:#92400e; letter-spacing:0.05em; white-space:nowrap;">Community</span>
          }
        </div>
      }
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
        <div style="flex:1; min-width:0;" [style.padding-right]="(print.verified || print.community) ? '72px' : '0'">
          <div style="font-family:var(--mono); font-size:13px; font-weight:500; color:var(--text); margin-bottom:4px; display:flex; align-items:center; gap:5px; overflow:hidden;">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              <span style="color:var(--muted)">{{ print.author }}/</span>{{ print.name }}
            </span>
            @if (print.verified) {
              <span title="Verified print" style="display:inline-flex; align-items:center; flex-shrink:0;">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" fill="#166534"/><path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            }
            @if (print.community) {
              <span title="Community favourite" style="display:inline-flex; align-items:center; flex-shrink:0;">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" fill="#92400e"/><path d="M8 4l1.1 2.2 2.4.35-1.75 1.7.41 2.4L8 9.5l-2.16 1.15.41-2.4L4.5 6.55l2.4-.35L8 4z" fill="#fde68a"/></svg>
              </span>
            }
          </div>
          <p style="font-size:13px; color:var(--muted); margin:0 0 10px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            {{ print.description }}
          </p>
          <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
            <span style="display:inline-flex; align-items:center; gap:5px; font-size:12px; color:var(--muted);">
              <span style="width:9px; height:9px; border-radius:50%; background:var(--text); display:inline-block; opacity:0.7;"></span>
              {{ print.language }}
            </span>
            <span style="display:flex; align-items:center; gap:4px; font-size:12px; color:var(--muted);">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
              {{ print.stars.toLocaleString() }}
            </span>
            <span style="font-size:12px; color:var(--muted);">{{ print.license }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PrintCardComponent {
  @Input() print!: Print;

  constructor(private router: Router) {}

  navigate() {
    this.router.navigate(['/print', this.print.id]);
  }
}
