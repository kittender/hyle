import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

export const DOC_SECTIONS = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'installation', label: 'Installation' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'cli', label: 'CLI Reference' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'philosophy', label: 'Philosophy' },
];

export const CLI_GROUPS = [
  { label: 'Initialization', cmds: [
    ['hyle init', 'Initialize a substrate interactively'],
    ['hyle init <name>', 'Initialize from a named registry substrate'],
    ['hyle init --yes', 'Initialize blank without prompts'],
    ['hyle init --force', 'Re-initialize, overwriting existing substrate'],
  ]},
  { label: 'Work Sessions', cmds: [
    ['hyle prompt "<text>"', 'Start a work session'],
    ['hyle prompt "<text>" --scope <id>', 'With a named scope (data access perimeter)'],
    ['hyle prompt "<text>" --agent <label>', 'With a declared agent identity'],
    ['hyle prompt "<text>" --dry-run', 'Preview what the Epitomator would inject'],
    ['hyle done', 'Close the active instance manually'],
  ]},
  { label: 'Substrate Lifecycle', cmds: [
    ['hyle substrate list', 'List local substrate library'],
    ['hyle substrate pull <name>', 'Clone from registry'],
    ['hyle substrate commit <name>', 'Promote .hyle/ to local library'],
    ['hyle substrate publish <name>', 'Publish local substrate to registry'],
    ['hyle substrate tag <version>', 'Freeze weights + create reproducibility snapshot'],
    ['hyle substrate diff <v1> <v2>', 'What changed between two tags'],
    ['hyle substrate test', 'Run substrate.test.yml regression suite'],
  ]},
  { label: 'Index Management', cmds: [
    ['hyle index update', 'Sync index from filesystem'],
    ['hyle index verify', 'Check index vs filesystem consistency'],
    ['hyle index rollback [timestamp]', 'Restore a prior index snapshot'],
    ['hyle index approve <path>', 'Approve a quarantined document'],
    ['hyle index lineage <path>', 'Show provenance chain of a synthesis'],
  ]},
  { label: 'Scopes', cmds: [
    ['hyle scope list', 'List all scopes with document counts'],
    ['hyle scope show <id>', 'Documents accessible in this scope'],
    ['hyle scope add <id> <path>', 'Assign a document to a scope'],
    ['hyle scope check <id>', 'Validate: no forbidden data_category leakage'],
    ['hyle scope check <id> --strict', 'Exit non-zero on violation (CI/CD)'],
  ]},
  { label: 'Governance & Topology', cmds: [
    ['hyle governance show', 'List all active ethics constraints'],
    ['hyle governance check "<prompt>"', 'Detect conflicts before execution'],
    ['hyle topology show', 'ASCII delegation graph'],
    ['hyle topology check', 'Validate consistency + update topology_hash'],
    ['hyle topology trace <agent> <doc>', 'Can this agent access this document?'],
  ]},
  { label: 'Audit & Status', cmds: [
    ['hyle status', 'Overview: tokens + substrate + budget'],
    ['hyle audit verify', 'Verify audit.log hash-chain integrity'],
    ['hyle security log', 'Display security.log'],
    ['hyle analyze', 'Quantitative + qualitative maintenance report'],
  ]},
];

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs.html',
  styleUrl: './docs.css',
})
export class DocsComponent implements OnInit {
  sections = DOC_SECTIONS;
  cliGroups = CLI_GROUPS;
  active = signal('quickstart');

  @ViewChild('contentEl') contentEl?: ElementRef;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.active.set(params['section']);
      }
    });
  }

  setActive(id: string) {
    this.active.set(id);
    if (this.contentEl) {
      this.contentEl.nativeElement.scrollTop = 0;
    }
  }
}
