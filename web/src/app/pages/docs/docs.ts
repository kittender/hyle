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
  { label: 'Core', cmds: [
    ['hyle init', 'Interactive setup, generates hyle.yaml'],
    ['hyle pull <name>', 'Pull blueprint: show diff, verify checksum, check+install deps'],
    ['hyle pull <name>@<version>', 'Pull specific version (checksum-pinned)'],
    ['hyle pull <name> --dry-run', 'Preview diff without applying'],
    ['hyle snapshot', 'Patch bump, unstable — for WIP sharing, no SLA'],
    ['hyle push', 'Minor bump, listed as stable'],
    ['hyle push --new <name>', 'Create a blueprint in your registry'],
    ['hyle release', 'Major bump, listed as stable'],
    ['hyle fork <name>@<version> <new-name>', 'Fork any blueprint and make it your own'],
    ['hyle search <query>', 'Search the blueprint registry'],
    ['hyle config get <key>', 'Read a config value'],
    ['hyle config set <key> <value>', 'Write a config value'],
  ]},
  { label: 'Blueprint Scanning', cmds: [
    ['hyle ontology [path]', 'Scan and add ontology files to hyle.yaml'],
    ['hyle craft [path]', 'Scan and add craft files to hyle.yaml'],
    ['hyle identities [path]', 'Scan and add identity files to hyle.yaml'],
    ['hyle ethics [path]', 'Scan and add ethics files to hyle.yaml'],
  ]},
  { label: 'Optional Extensions (hyle install watcher)', cmds: [
    ['hyle watch', 'Live terminal UI: token consumption, cost estimate'],
    ['hyle watch --audit', '+ hash-chained audit log (GDPR Article 30 trail)'],
    ['hyle watch --split <threshold>', '+ context-split prompt at token threshold'],
    ['hyle audit verify', 'Verify audit log hash-chain integrity'],
    ['hyle index', 'Generate hyle.json metadata index across all domains'],
    ['hyle index --dry-run', 'Preview index without writing'],
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
