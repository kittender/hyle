import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

type DiffClass = 'same' | 'changed' | 'removed' | 'added' | 'empty';

interface DiffLine {
  lineNum: number | null;
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
      </div>
      <div class="diff-body">
        <div class="diff-side">
          @for (line of leftLines; track $index) {
            <div class="diff-line" [class]="'diff-' + line.cls">
              <span class="diff-ln">{{ line.lineNum !== null ? line.lineNum : '' }}</span>
              <span>{{ line.text }}</span>
            </div>
          }
        </div>
        <div class="diff-side">
          @for (line of rightLines; track $index) {
            <div class="diff-line" [class]="'diff-' + line.cls">
              <span class="diff-ln">{{ line.lineNum !== null ? line.lineNum : '' }}</span>
              <span>{{ line.text }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DiffViewComponent implements OnChanges {
  @Input() left = '';
  @Input() right = '';
  @Input() leftLabel = '';
  @Input() rightLabel = '';

  leftLines: DiffLine[] = [];
  rightLines: DiffLine[] = [];

  ngOnChanges() {
    this.computeDiff();
  }

  private computeDiff() {
    const lLines = (this.left || '').split('\n');
    const rLines = (this.right || '').split('\n');
    const maxLen = Math.max(lLines.length, rLines.length);

    this.leftLines = [];
    this.rightLines = [];

    for (let i = 0; i < maxLen; i++) {
      const l = lLines[i];
      const r = rLines[i];
      const cls = this.classify(l, r);

      this.leftLines.push({
        lineNum: l !== undefined ? i + 1 : null,
        text: l || '',
        cls: cls === 'added' ? 'empty' : cls,
      });
      this.rightLines.push({
        lineNum: r !== undefined ? i + 1 : null,
        text: r || '',
        cls: cls === 'removed' ? 'empty' : cls,
      });
    }
  }

  private classify(l: string | undefined, r: string | undefined): DiffClass {
    if (l === r) return 'same';
    if (l === undefined) return 'added';
    if (r === undefined) return 'removed';
    return 'changed';
  }
}
