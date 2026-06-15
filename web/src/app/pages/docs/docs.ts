import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocsService, DocSection } from '../../services/docs.service';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs.html',
  styleUrl: './docs.css',
})
export class DocsComponent implements OnInit {
  sections = signal<DocSection[]>([]);
  active = signal('quickstart');
  currentContent = signal<SafeHtml>('');

  @ViewChild('contentEl') contentEl?: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private docsService: DocsService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    // Load docs data
    this.docsService.getDocs().subscribe(data => {
      this.sections.set(data.sections);
      this.loadSection(this.active());
    });

    // Watch for section changes from URL
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.setActive(params['section']);
      }
    });
  }

  setActive(id: string) {
    this.active.set(id);
    this.loadSection(id);
    if (this.contentEl) {
      this.contentEl.nativeElement.scrollTop = 0;
    }
  }

  private loadSection(id: string) {
    this.docsService.getSection(id).subscribe(section => {
      if (section) {
        this.currentContent.set(this.sanitizer.bypassSecurityTrustHtml(section.content));
      }
    });
  }
}
