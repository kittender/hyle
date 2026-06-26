import { Component, OnInit, signal, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, PullPeriod } from '../../services/api.service';
import { Print, blueprintToprint } from '../../models/print.model';
import { PrintCardComponent } from '../../components/print-card/print-card';
import { QuickstartPanelComponent } from '../../components/quickstart-panel/quickstart-panel';
import { CopyButtonComponent } from '../../components/copy-button/copy-button';

const PULL_FILTERS = [
  { id: 'month', label: 'This month', key: 'month' as PullPeriod },
  { id: 'half', label: 'Last 6 months', key: 'half' as PullPeriod },
  { id: 'year', label: 'This year', key: 'year' as PullPeriod },
  { id: 'all', label: 'All time', key: 'all' as PullPeriod },
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, PrintCardComponent, QuickstartPanelComponent, CopyButtonComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  query = '';
  pullFilter = signal<string>('month');
  pullFilters = PULL_FILTERS;

  featured = signal<Print[]>([]);
  teamPicks = signal<Print[]>([]);
  mostPulled = signal<Print[]>([]);

  totalStars = signal(0);
  totalPrints = signal(0);

  private destroyRef = inject(DestroyRef);

  readonly ANATOMY = [
    { folder: 'ontology', color: '#8b6914', desc: 'The "what" — specifications, goals, features, examples, and data. AI instruction files (CLAUDE.md, .cursorrules, Copilot instructions), specs, PDFs, domain docs, data models, and diagrams.' },
    { folder: 'identities', color: '#1a4d2e', desc: 'The "who" — agentic personas and model behaviour specs. Agent definitions, role descriptions, and delegation boundaries. e.g. AGENTS.md, .claude/agents/*.md, .cursor/agents/*.md.' },
    { folder: 'craft', color: '#5a7a3a', desc: 'The "how" — architecture, technical design, practices, and tooling recipes. e.g. SKILLS.md, ARCHITECTURE.md, MCP configs, .cursor/rules/*.md, package.json, pom.xml.' },
    { folder: 'ethics', color: '#c4982a', desc: 'The limits — behaviour constraints, compliance requirements, security concerns, and privacy design. e.g. Cedar policies, TruLens configs, Ragas eval setups, guardrails.' },
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
  ) {}

  ngOnInit() {
    // Featured = top blueprints by stars.
    this.apiService.search({ sort: 'stars', limit: 4 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(results => {
        this.featured.set(results.map(blueprintToprint));
      });

    // Curated team picks.
    this.apiService.getTeamPicks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(results => {
        this.teamPicks.set(results.map(blueprintToprint));
      });

    // Hero stats.
    this.apiService.getOverviewStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(stats => {
        this.totalPrints.set(stats.total_blueprints);
        this.totalStars.set(stats.total_stars);
      });

    this.loadMostPulled();
  }

  private loadMostPulled() {
    const filter = PULL_FILTERS.find(f => f.id === this.pullFilter());
    const period: PullPeriod = filter ? filter.key : 'month';
    this.apiService.getMostPulled(period, 4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(results => {
        this.mostPulled.set(results.map(r => {
          const print = blueprintToprint(r);
          // Surface the period-scoped pull count for display.
          print.pulls = { ...(print.pulls || {}), all: r.pull_count ?? r.install_count ?? 0 };
          return print;
        }));
      });
  }

  getMostPulledCount(p: Print): number {
    return p.pulls?.all ?? 0;
  }

  handleSearch(e: Event) {
    e.preventDefault();
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query.trim() } });
    } else {
      this.router.navigate(['/search']);
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  navigateToDoc(anchor: string) {
    this.router.navigate(['/docs'], { queryParams: { section: anchor } });
  }

  navigateToPrint(id: string) {
    const [author, name] = id.split('/');
    this.router.navigate(['/print', author, name]);
  }

  setPullFilter(id: string) {
    this.pullFilter.set(id);
    this.loadMostPulled();
  }
}
