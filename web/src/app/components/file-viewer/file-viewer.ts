import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { CopyButtonComponent } from '../copy-button/copy-button';

declare const Prism: any;

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule, CopyButtonComponent],
  template: `
    @if (!filePath) {
      <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--muted); font-size:13px;">
        Select a file to view its contents
      </div>
    } @else {
      <div class="file-viewer">
        <div class="file-viewer-header">
          <span style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted);">
            @for (part of pathParts; track part.text; let i = $index; let last = $last) {
              <span style="display:flex; align-items:center; gap:6px;">
                @if (i > 0) {
                  <span style="opacity:0.4;">/</span>
                }
                <span [style.color]="last ? 'var(--text)' : 'var(--muted)'" style="font-family:var(--mono);">{{ part.text }}</span>
              </span>
            }
          </span>
          <app-copy-button [text]="content"></app-copy-button>
        </div>
        <div class="code-wrap">
          <div class="line-numbers" aria-hidden="true">
            @for (line of lines; track $index) {
              <div>{{ $index + 1 }}</div>
            }
          </div>
          <pre class="code-content"><code #codeEl [class]="'language-' + lang">{{ content }}</code></pre>
        </div>
      </div>
    }
  `,
})
export class FileViewerComponent implements OnChanges, AfterViewChecked {
  @Input() filePath: string | null = null;
  @ViewChild('codeEl') codeEl?: ElementRef;

  content = '';
  lang = 'plain';
  lines: string[] = [];
  pathParts: { text: string }[] = [];
  private needsHighlight = false;

  constructor(private dataService: DataService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filePath'] && this.filePath) {
      this.content = this.dataService.getFileContent(this.filePath);
      this.lang = this.dataService.getLang(this.filePath);
      this.lines = this.content.split('\n');
      this.pathParts = this.filePath.split('/').map(t => ({ text: t }));
      this.needsHighlight = true;
    }
  }

  ngAfterViewChecked() {
    if (this.needsHighlight && this.codeEl) {
      this.needsHighlight = false;
      try {
        if (typeof Prism !== 'undefined') {
          Prism.highlightElement(this.codeEl.nativeElement);
        }
      } catch {
        // Prism not available
      }
    }
  }
}
