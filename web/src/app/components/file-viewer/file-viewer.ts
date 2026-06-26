import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { CopyButtonComponent } from '../copy-button/copy-button';

declare const Prism: any;

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule, CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          <app-copy-button [text]="displayContent"></app-copy-button>
        </div>
        <div class="code-wrap">
          <div class="line-numbers" aria-hidden="true">
            @for (line of lines; track $index) {
              <div>{{ $index + 1 }}</div>
            }
          </div>
          <pre class="code-content"><code #codeEl [class]="'language-' + displayLang">{{ displayContent }}</code></pre>
        </div>
      </div>
    }
  `,
})
export class FileViewerComponent implements OnChanges, AfterViewChecked {
  @Input() filePath: string | null = null;
  @Input() content: string | null = null;
  @Input() lang: string = 'plain';
  @Input() author = '';
  @Input() name = '';
  @Input() version?: string;
  @ViewChild('codeEl') codeEl?: ElementRef;

  displayContent = '';
  displayLang = 'plain';
  lines: string[] = [];
  pathParts: { text: string }[] = [];
  private needsHighlight = false;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && this.content !== null) {
      // Content provided directly (e.g. manifest preview).
      this.displayContent = this.content;
      this.displayLang = this.lang;
      this.lines = this.displayContent.split('\n');
      this.pathParts = [{ text: 'manifest.yaml' }];
      this.needsHighlight = true;
      this.cdr.markForCheck();
    } else if (changes['filePath'] && this.filePath && this.author && this.name) {
      // Fetch the real file content from the registry bundle.
      const path = this.filePath;
      this.pathParts = path.split('/').map(t => ({ text: t }));
      this.apiService.getFileContent(this.author, this.name, path, this.version).subscribe(file => {
        this.displayContent = file.content || `# ${path}\n# (empty or unavailable)`;
        this.displayLang = file.language || 'plain';
        this.lines = this.displayContent.split('\n');
        this.needsHighlight = true;
        this.cdr.markForCheck();
      });
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
