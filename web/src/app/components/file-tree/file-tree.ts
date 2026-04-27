import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintTree } from '../../models/print.model';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-tree">
      @for (entry of getEntries(tree); track entry.key) {
        <ng-container *ngTemplateOutlet="treeNode; context: { name: entry.key, node: entry.value, path: entry.key }"></ng-container>
      }
    </div>

    <ng-template #treeNode let-name="name" let-node="node" let-path="path">
      @if (isDir(node)) {
        <div>
          <button class="tree-folder" (click)="toggleFolder(path)">
            <span [style.color]="getFolderColor(name, path)" style="display:flex;">
              @if (isOpen(path)) {
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M.513 1.513A1.75 1.75 0 011.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 00.2.1H13a1.75 1.75 0 011.75 1.75v.5H.75v-.5A1.75 1.75 0 011.75 3zM0 7.25C0 6.284.784 5.5 1.75 5.5h12.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0114.25 14.5H1.75A1.75 1.75 0 010 12.75z"/></svg>
              } @else {
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1z"/></svg>
              }
            </span>
            <span [style.font-weight]="isRootFolder(name) ? 500 : 400"
                  [style.color]="isRootFolder(name) ? 'var(--text)' : 'var(--muted-text)'">
              {{ name }}
            </span>
            <span style="margin-left:auto; color:var(--muted); opacity:0.6; display:flex;">
              @if (isOpen(path)) {
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z"/></svg>
              } @else {
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/></svg>
              }
            </span>
          </button>
          @if (isOpen(path)) {
            <div style="margin-left:12px; border-left:1px solid var(--border);">
              @for (child of getEntries(node); track child.key) {
                <ng-container *ngTemplateOutlet="treeNode; context: { name: child.key, node: child.value, path: path + '/' + child.key }"></ng-container>
              }
            </div>
          }
        </div>
      } @else {
        <button class="tree-file" [class.active]="selectedFile === path" (click)="selectFile(path)">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="color:var(--muted); flex-shrink:0;"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25zm1.75-.25a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25V6h-2.75A1.75 1.75 0 019 4.25V1.5zm6.75.062V4.25c0 .138.112.25.25.25h2.688z"/></svg>
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ name }}</span>
        </button>
      }
    </ng-template>
  `,
})
export class FileTreeComponent {
  @Input() tree: PrintTree = {};
  @Input() selectedFile: string | null = null;
  @Output() fileSelected = new EventEmitter<string>();

  private openFolders = signal<Record<string, boolean>>({
    ontology: true,
    identities: false,
    craft: false,
    ethics: false,
  });

  private readonly ROOT_FOLDERS = ['ontology', 'identities', 'craft', 'ethics'];
  private readonly FOLDER_COLORS: Record<string, string> = {
    ontology: '#8b6914',
    identities: '#1a4d2e',
    craft: '#5a7a3a',
    ethics: '#c4982a',
  };

  getEntries(node: PrintTree): { key: string; value: PrintTree | null }[] {
    return Object.entries(node).map(([key, value]) => ({ key, value: value as PrintTree | null }));
  }

  isDir(node: PrintTree | null): node is PrintTree {
    return node !== null && typeof node === 'object';
  }

  isRootFolder(name: string): boolean {
    return this.ROOT_FOLDERS.includes(name);
  }

  getFolderColor(name: string, path: string): string {
    const root = path.split('/')[0];
    return this.FOLDER_COLORS[root] || 'var(--muted)';
  }

  isOpen(path: string): boolean {
    const state = this.openFolders();
    return state[path] !== false;
  }

  toggleFolder(path: string) {
    const state = this.openFolders();
    this.openFolders.set({ ...state, [path]: !this.isOpen(path) });
  }

  selectFile(path: string) {
    this.fileSelected.emit(path);
  }
}
