import { Component, OnInit, signal } from '@angular/core';
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
  print: Print | undefined;
  tab = signal<string>('readme');
  selectedFile = signal<string | null>(null);
  diffV1 = '';
  diffV2 = '';
  releasesView = signal<'list' | 'grid'>('list');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dataService: DataService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const author = params.get('author') || '';
      const name = params.get('name') || '';
      const id = `${author}/${name}`;
      this.print = this.dataService.getPrintById(id);
      if (this.print && this.print.versions.length > 0) {
        this.diffV1 = this.print.versions[this.print.versions.length - 1].tag;
        this.diffV2 = this.print.versions[0].tag;
      }
      this.tab.set('readme');
      this.selectedFile.set(null);
    });
  }

  setTab(t: string) {
    this.tab.set(t);
  }

  setTabAndDiffV2(v2: string) {
    this.diffV2 = v2;
    this.setTab('diff');
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
    this.router.navigate(['/search'], { queryParams: { q: this.print?.author || '' } });
  }

  get diffLeft(): string {
    return this.dataService.DIFF_EXAMPLE.left;
  }

  get diffRight(): string {
    return this.dataService.DIFF_EXAMPLE.right;
  }
}
