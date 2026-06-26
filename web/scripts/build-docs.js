#!/usr/bin/env node

/**
 * Build script: convert every Markdown file under /web/docs into public/docs-data.json.
 * Single source of truth: the docs tree → JSON consumed by the in-app docs viewer.
 * Each .md becomes one navigable section, grouped by its top-level folder.
 */

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import * as highlightjs_module from 'highlight.js';
import { fileURLToPath } from 'url';

const hljs = highlightjs_module.default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsRoot = path.join(__dirname, '..', 'docs');
const publicDir = path.join(__dirname, '..', 'public');
const outputFile = path.join(publicDir, 'docs-data.json');

// Configure marked with highlight.js
marked.use({
  useNewRenderer: true,
  renderer: {
    code({ text, lang }) {
      // Mermaid blocks are rendered client-side by the docs viewer.
      // Emit the raw source in a <pre.mermaid> container for mermaid.run() to pick up.
      if (lang === 'mermaid') {
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre class="mermaid">${escaped}</pre>\n`;
      }
      try {
        if (lang && hljs.getLanguage(lang)) {
          const highlighted = hljs.highlight(text, { language: lang }).value;
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>\n`;
        }
      } catch (e) {
        /* fall through to plain */
      }
      return `<pre><code>${text}</code></pre>\n`;
    },
  },
});

// Folder → display group. Order here drives sidebar order; unknown folders append.
const GROUP_ORDER = ['Overview', 'Guides', 'Reference', 'Operations', 'Security'];
const FOLDER_LABELS = {
  '': 'Overview',
  guides: 'Guides',
  reference: 'Reference',
  operations: 'Operations',
  security: 'Security',
};

// slug "reference/CLI_COMMANDS" — stable id, also used by ?section= deep links.
function toSlug(relPath) {
  return relPath.replace(/\.md$/i, '');
}

function groupFor(relPath) {
  const top = relPath.includes(path.sep) ? relPath.split(path.sep)[0] : '';
  return FOLDER_LABELS[top] || top.charAt(0).toUpperCase() + top.slice(1);
}

// Label = first H1, else prettified filename.
function labelFor(content, relPath) {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return path.basename(relPath, '.md').replace(/[_-]/g, ' ');
}

// Rewrite relative links to other docs (foo/bar.md#anchor) into in-app ?section= links.
function rewriteLinks(html, fromSlug) {
  const fromDir = path.posix.dirname(fromSlug);
  return html.replace(/href="([^"]+\.md)(#[^"]*)?"/gi, (match, target, anchor = '') => {
    if (/^[a-z]+:\/\//i.test(target)) return match; // absolute URL
    let resolved = target.startsWith('/')
      ? target.slice(1)
      : path.posix.normalize(path.posix.join(fromDir, target));
    if (resolved.startsWith('..')) return match; // points outside docs tree (e.g. ../../../README.md)
    return `href="?section=${toSlug(resolved)}"${anchor}`;
  });
}

function walk(dir, base = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...walk(path.join(dir, entry.name), rel));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(rel);
    }
  }
  return files;
}

function buildDocsData() {
  const sections = [];

  for (const rel of walk(docsRoot)) {
    const slug = toSlug(rel).split(path.sep).join('/');
    try {
      const raw = fs.readFileSync(path.join(docsRoot, rel), 'utf8');
      const html = rewriteLinks(marked(raw), slug);
      sections.push({
        id: slug,
        label: labelFor(raw, rel),
        group: groupFor(rel),
        content: html,
      });
      console.log(`✓ ${slug}`);
    } catch (err) {
      console.error(`✗ ${rel}:`, err.message);
    }
  }

  // Sort by group order, then by label within a group.
  sections.sort((a, b) => {
    const ga = GROUP_ORDER.indexOf(a.group);
    const gb = GROUP_ORDER.indexOf(b.group);
    const oa = ga === -1 ? GROUP_ORDER.length : ga;
    const ob = gb === -1 ? GROUP_ORDER.length : gb;
    return oa - ob || a.group.localeCompare(b.group) || a.label.localeCompare(b.label);
  });

  return { sections };
}

const data = buildDocsData();
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
console.log(`\n✓ Generated ${outputFile} (${data.sections.length} sections)`);
