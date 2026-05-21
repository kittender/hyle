import { Component, Input, OnChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { diffLines } from 'diff';

type DiffClass = 'same' | 'removed' | 'added';

interface DiffLine {
  lineNum: number;
  text: string;
  cls: DiffClass;
}

@Component({
  selector: 'app-diff-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diff-view">
      <div class="diff-header">
        <div class="diff-label removed-label">{{ leftLabel }}</div>
        <div class="diff-label added-label">{{ rightLabel }}</div>
        <button class="copy-diff-btn" (click)="copyDiff()">Copy diff</button>
      </div>
      <div class="diff-body">
        <div class="diff-side">
          @for (line of leftLines(); track $index) {
            <div class="diff-line" [class]="'diff-' + line.cls">
              <span class="diff-ln">{{ line.lineNum }}</span>
              <span class="diff-content">{{ line.text }}</span>
            </div>
          }
        </div>
        <div class="diff-side">
          @for (line of rightLines(); track $index) {
            <div class="diff-line" [class]="'diff-' + line.cls">
              <span class="diff-ln">{{ line.lineNum }}</span>
              <span class="diff-content">{{ line.text }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffViewComponent implements OnChanges {
  @Input() left = '';
  @Input() right = '';
  @Input() leftLabel = '';
  @Input() rightLabel = '';

  leftLines = signal<DiffLine[]>([]);
  rightLines = signal<DiffLine[]>([]);

  ngOnChanges() {
    this.computeDiff();
  }

  private computeDiff() {
    const changes = diffLines(this.left || '', this.right || '');
    const leftLines: DiffLine[] = [];
    const rightLines: DiffLine[] = [];
    let leftLineNum = 1;
    let rightLineNum = 1;

    changes.forEach(change => {
      const lines = change.value.split('\n').filter((_, i, arr) => i < arr.length - 1);

      if (change.removed) {
        lines.forEach(text => {
          leftLines.push({ lineNum: leftLineNum++, text, cls: 'removed' });
        });
      } else if (change.added) {
        lines.forEach(text => {
          rightLines.push({ lineNum: rightLineNum++, text, cls: 'added' });
        });
      } else {
        lines.forEach(text => {
          leftLines.push({ lineNum: leftLineNum++, text, cls: 'same' });
          rightLines.push({ lineNum: rightLineNum++, text, cls: 'same' });
        });
      }
    });

    this.leftLines.set(leftLines);
    this.rightLines.set(rightLines);
  }

  copyDiff() {
    const leftText = this.leftLines().map(l => l.text).join('\n');
    const rightText = this.rightLines().map(l => l.text).join('\n');
    const unified = `--- ${this.leftLabel}\n+++ ${this.rightLabel}\n` +
      this.leftLines().filter(l => l.cls !== 'same').map(l => `-${l.text}`).join('\n') + '\n' +
      this.rightLines().filter(l => l.cls !== 'same').map(l => `+${l.text}`).join('\n');
    navigator.clipboard.writeText(unified);
  }
}
