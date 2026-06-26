import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocsService, DocGroup } from '../../services/docs.service';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs.html',
  styleUrl: './docs.css',
})
export class DocsComponent implements OnInit {
  groups = signal<DocGroup[]>([]);
  active = signal('');
  currentContent = signal<SafeHtml>('');

  @ViewChild('contentEl') contentEl?: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private docsService: DocsService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.docsService.getGroups().subscribe(groups => {
      this.groups.set(groups);
      // Default to the requested section, else the first available one.
      const requested = this.route.snapshot.queryParams['section'];
      const first = groups[0]?.sections[0]?.id;
      if (!this.active()) this.setActive(requested || first || '');
    });

    // Watch for section changes from URL (in-app doc links use ?section=).
    this.route.queryParams.subscribe(params => {
      if (params['section']) this.setActive(params['section']);
    });
  }

  setActive(id: string) {
    if (!id) return;
    this.active.set(id);
    this.loadSection(id);
    if (this.contentEl) this.contentEl.nativeElement.scrollTop = 0;
  }

  private loadSection(id: string) {
    this.docsService.getSection(id).subscribe(section => {
      if (section) {
        this.currentContent.set(this.sanitizer.bypassSecurityTrustHtml(section.content));
        this.renderDiagrams();
      }
    });
  }

  // Render any <pre.mermaid> blocks in the freshly-injected content.
  // Mermaid is lazy-loaded so it only ships to users who open the docs page.
  private renderDiagrams() {
    // Defer until the new innerHTML has been committed to the DOM.
    setTimeout(async () => {
      const root: HTMLElement | undefined = this.contentEl?.nativeElement;
      if (!root) return;
      const nodes = root.querySelectorAll<HTMLElement>('pre.mermaid');
      if (!nodes.length) return;
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' });
      try {
        await mermaid.run({ nodes });
      } catch (err) {
        console.error('Mermaid render failed:', err);
      }
    });
  }
}
