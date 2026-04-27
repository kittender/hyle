import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Print } from '../../models/print.model';
import { PrintCardComponent } from '../../components/print-card/print-card';
import { QuickstartPanelComponent } from '../../components/quickstart-panel/quickstart-panel';
import { CopyButtonComponent } from '../../components/copy-button/copy-button';

const PULL_FILTERS = [
  { id: 'month', label: 'This month', key: 'month' as const },
  { id: 'half', label: 'Last 6 months', key: 'half' as const },
  { id: 'year', label: 'This year', key: 'year' as const },
  { id: 'all', label: 'All time', key: 'all' as const },
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, PrintCardComponent, QuickstartPanelComponent, CopyButtonComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent {
  query = '';
  pullFilter = signal<string>('month');
  pullFilters = PULL_FILTERS;

  featured: Print[];
  teamPicks: Print[];

  readonly totalStars: number;
  readonly totalPrints: number;

  readonly ANATOMY = [
    { folder: 'ontology', color: '#8b6914', desc: 'The "what" — specifications, goals, features, examples, and data. AI instruction files (CLAUDE.md, .cursorrules, Copilot instructions), specs, PDFs, domain docs, data models, and diagrams.' },
    { folder: 'identities', color: '#1a4d2e', desc: 'The "who" — agentic personas and model behaviour specs. Agent definitions, role descriptions, and delegation boundaries. e.g. AGENTS.md, .claude/agents/*.md, .cursor/agents/*.md.' },
    { folder: 'craft', color: '#5a7a3a', desc: 'The "how" — architecture, technical design, practices, and tooling recipes. e.g. SKILLS.md, ARCHITECTURE.md, MCP configs, .cursor/rules/*.md, package.json, pom.xml.' },
    { folder: 'ethics', color: '#c4982a', desc: 'The limits — behaviour constraints, compliance requirements, security concerns, and privacy design. e.g. Cedar policies, TruLens configs, Ragas eval setups, guardrails.' },
  ];

  constructor(
    private router: Router,
    public dataService: DataService,
  ) {
    this.featured = dataService.PRINTS.slice(0, 4);
    this.teamPicks = dataService.getTeamPickPrints();
    this.totalStars = dataService.PRINTS.reduce((a, p) => a + p.stars, 0);
    this.totalPrints = dataService.PRINTS.length;
  }

  get mostPulled(): Print[] {
    const key = this.pullFilter();
    const filter = PULL_FILTERS.find(f => f.id === key);
    if (!filter) return [];
    return [...this.dataService.PRINTS]
      .filter(p => p.pulls)
      .sort((a, b) => ((b.pulls as any)[filter.key] || 0) - ((a.pulls as any)[filter.key] || 0))
      .slice(0, 4);
  }

  getMostPulledCount(p: Print): number {
    const key = this.pullFilter();
    const filter = PULL_FILTERS.find(f => f.id === key);
    if (!filter || !p.pulls) return 0;
    return (p.pulls as any)[filter.key] || 0;
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
    this.router.navigate(['/print', id]);
  }

  setPullFilter(id: string) {
    this.pullFilter.set(id);
  }
}
