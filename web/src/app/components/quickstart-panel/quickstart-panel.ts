import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface QsCmd {
  label: string;
  cmd: string;
}

@Component({
  selector: 'app-quickstart-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quickstart-panel" [class.compact]="compact">
      <div class="qs-title">{{ printId ? 'Get started' : 'Quickstart' }}</div>
      @for (c of cmds; track c.cmd; let i = $index) {
        <div class="qs-cmd">
          <span class="qs-label">{{ c.label }}</span>
          <div class="qs-row">
            <code class="qs-code">{{ c.cmd }}</code>
            <button class="copy-btn" (click)="copy(c.cmd, i)" [title]="copiedIdx() === i ? 'Copied!' : 'Copy'">
              @if (copiedIdx() === i) {
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
              } @else {
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25z"/></svg>
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class QuickstartPanelComponent {
  @Input() printId: string | null = null;
  @Input() compact = false;

  copiedIdx = signal<number | null>(null);

  get cmds(): QsCmd[] {
    if (this.printId) {
      return [
        { label: 'Pull this print', cmd: `hyle pull ${this.printId}` },
        { label: 'Start a session', cmd: 'hyle prompt "scaffold a new feature"' },
      ];
    }
    return [
      { label: 'Install (macOS detected)', cmd: 'brew install hyle' },
      { label: 'Or via npm', cmd: 'npm install --global hyle' },
      { label: 'Pull a print', cmd: 'hyle pull hyle-org/starter' },
      { label: 'Start working', cmd: 'hyle prompt "generate a REST API"' },
    ];
  }

  copy(text: string, i: number) {
    navigator.clipboard.writeText(text).catch(() => {});
    this.copiedIdx.set(i);
    setTimeout(() => this.copiedIdx.set(null), 1600);
  }
}
