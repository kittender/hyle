import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Print } from '../../models/print.model';
import { FileTreeComponent } from '../../components/file-tree/file-tree';
import { FileViewerComponent } from '../../components/file-viewer/file-viewer';
import { DiffViewComponent } from '../../components/diff-view/diff-view';
import { QuickstartPanelComponent } from '../../components/quickstart-panel/quickstart-panel';
import { CopyButtonComponent } from '../../components/copy-button/copy-button';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, FileTreeComponent, FileViewerComponent, DiffViewComponent, QuickstartPanelComponent, CopyButtonComponent],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class DetailComponent implements OnInit {
  print = signal<Print | undefined>(undefined);
  versions = signal<any[]>([]);
  tab = signal<string>('readme');
  selectedFile = signal<string | null>(null);
  diffV1 = signal('');
  diffV2 = signal('');
  diffContent = signal<{ left: string; right: string } | null>(null);
  releasesView = signal<'list' | 'grid'>('list');
  loading = signal(false);
  error = signal<string | null>(null);
  author = signal('');
  name = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dataService: DataService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const author = params.get('author') || '';
      const name = params.get('name') || '';
      this.author.set(author);
      this.name.set(name);

      this.loading.set(true);
      this.error.set(null);

      this.dataService.getSubstrate$(author, name).subscribe({
        next: (print) => {
          this.print.set(print);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load substrate');
          this.loading.set(false);
        }
      });

      this.dataService.getVersions$(author, name).subscribe({
        next: (versions) => {
          this.versions.set(versions);
          if (versions.length > 1) {
            this.diffV1.set(versions[0].tag);
            this.diffV2.set(versions[1].tag);
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

  private loadDiff() {
    if (!this.diffV1() || !this.diffV2()) return;
    this.dataService.getDiff$(this.author(), this.name(), this.diffV1(), this.diffV2())
      .subscribe({
        next: (diff) => {
          this.diffContent.set({ left: diff.left, right: diff.right });
        },
        error: () => {} // Silently fail diff loading
      });
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

  get diffRight(): string {
    return this.diffContent()?.right || '';
  }
}
