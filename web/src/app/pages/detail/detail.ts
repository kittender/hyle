import { Component, OnInit, signal, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiService, BlueprintResponse, DiffResponse } from '../../services/api.service';
import { FileTreeComponent } from '../../components/file-tree/file-tree';
import { FileViewerComponent } from '../../components/file-viewer/file-viewer';
import { DiffViewComponent } from '../../components/diff-view/diff-view';
import { QuickstartPanelComponent } from '../../components/quickstart-panel/quickstart-panel';
import { CopyButtonComponent } from '../../components/copy-button/copy-button';
import { StarButtonComponent } from '../../components/star-button/star-button';
import { ReviewFormComponent } from '../../components/review-form/review-form';
import { BadgeListComponent } from '../../components/badge-list/badge-list';
import { buildTreeFromManifest } from '../../models/print.model';
import { marked } from 'marked';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, FileTreeComponent, FileViewerComponent, DiffViewComponent, QuickstartPanelComponent, CopyButtonComponent, StarButtonComponent, ReviewFormComponent, BadgeListComponent],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailComponent implements OnInit {
  print = signal<BlueprintResponse | undefined>(undefined);
  versions = signal<BlueprintResponse[]>([]);
  tab = signal<string>('readme');
  selectedFile = signal<string | null>(null);
  diffV1 = signal('');
  diffV2 = signal('');
  diffContent = signal<DiffResponse | null>(null);
  releasesView = signal<'list' | 'grid'>('list');
  loading = signal(false);
  error = signal<string | null>(null);
  author = signal('');
  name = signal('');

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const author = params.get('author') || '';
        const name = params.get('name') || '';
        this.author.set(author);
        this.name.set(name);

        this.loading.set(true);
        this.error.set(null);

        this.apiService.getBlueprint(author, name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (print) => {
              // Build the file tree from the manifest's blueprint path arrays.
              print.tree = buildTreeFromManifest(print.manifest);
              this.print.set(print);
              this.loading.set(false);
            },
            error: (err) => {
              this.error.set('Failed to load blueprint');
              this.loading.set(false);
            }
          });

        this.apiService.getVersions(author, name)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (versions) => {
              this.versions.set(versions);
              if (versions.length > 1) {
                // Set diffV1 to latest, diffV2 to previous
                this.diffV1.set(versions[0].version);
                this.diffV2.set(versions[1].version);
                this.loadDiff();
              }
            },
            error: () => {} // Silently fail version loading
          });

        this.tab.set('readme');
        this.selectedFile.set(null);
      });
  }

  setTab(t: string) {
    this.tab.set(t);
  }

  setTabAndDiffV2(v2: string) {
    this.diffV2.set(v2);
    this.loadDiff();
    this.setTab('diff');
  }

  onDiffV1Change(v1: string) {
    this.diffV1.set(v1);
    this.loadDiff();
  }

  onDiffV2Change(v2: string) {
    this.diffV2.set(v2);
    this.loadDiff();
  }

  private loadDiff() {
    if (!this.diffV1() || !this.diffV2()) return;
    this.apiService.getDiff(this.author(), this.name(), this.diffV1(), this.diffV2())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (diff) => {
          this.diffContent.set(diff);
        },
        error: () => {} // Silently fail diff loading
      });
  }

  getReadmeHtml(): SafeHtml {
    const text = this.print()?.description || '';
    const html = marked(text);
    return this.sanitizer.bypassSecurityTrustHtml(html as string);
  }

  onFileSelected(path: string) {
    this.selectedFile.set(path);
  }

  goToSearch() {
    this.router.navigate(['/search']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goToAuthor() {
    this.router.navigate(['/search'], { queryParams: { author: this.author() } });
  }

  get diffLeft(): string {
    return this.diffContent()?.left || '';
  }

  get diffLeftLabel(): string {
    return `hyle.yaml @ ${this.diffV2()}`;
  }

  get diffRight(): string {
    return this.diffContent()?.right || '';
  }

  get diffRightLabel(): string {
    return `hyle.yaml @ ${this.diffV1()}`;
  }

  onStarsChanged(count: number) {
    // Could update UI here if needed
  }

  onReviewSubmitted(review: any) {
    // Could update UI here if needed
  }
}
