#!/usr/bin/env node

/**
 * Build script: Convert /web/docs/*.md to public/docs-data.json
 * Single source of truth: markdown files → JSON data
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

// Configure marked with highlight.js
marked.use({
  useNewRenderer: true,
  renderer: {
    code({ text, lang }) {
      try {
        if (lang && hljs.getLanguage(lang)) {
          const highlighted = hljs.highlight(text, { language: lang }).value;
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>\n`;
        }
        return `<pre><code>${text}</code></pre>\n`;
      } catch (e) {
        return `<pre><code>${text}</code></pre>\n`;
      }
    }
  }
});
const outputFile = path.join(publicDir, 'docs-data.json');

// Map section IDs to markdown files
const sectionMap = {
  quickstart: {
    label: 'Quickstart',
    file: 'guides/PUBLISHING_QUICKSTART.md',
    extractSection: 'step-by-step'
  },
  installation: {
    label: 'Installation',
    file: 'reference/CLI_COMMANDS.md',
    extractSection: 'installation'
  },
  configuration: {
    label: 'Configuration',
    file: 'reference/CONFIG.md',
    extractSection: null
  },
  cli: {
    label: 'CLI Reference',
    file: 'reference/CLI_COMMANDS.md',
    extractSection: null
  },
  'best-practices': {
    label: 'Best Practices',
    file: 'guides/PUBLISHING_QUICKSTART.md',
    extractSection: 'best-practices'
  },
  publishing: {
    label: 'Publishing',
    file: 'guides/PUBLISHING.md',
    extractSection: null
  },
  philosophy: {
    label: 'Philosophy',
    file: 'CONCEPTS.md',
    extractSection: 'core-concepts'
  }
};

// Extract section from markdown by heading
function extractSection(content, sectionId) {
  if (!sectionId) return content;

  const lines = content.split('\n');
  const result = [];
  let capturing = false;
  let foundSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for heading matching section ID (case-insensitive, spaces to hyphens)
    if (line.match(/^#+\s/) && !foundSection) {
      const headingText = line.replace(/^#+\s+/, '').toLowerCase().replace(/\s+/g, '-');
      if (headingText.includes(sectionId.replace(/-/g, '').toLowerCase())) {
        foundSection = true;
        capturing = true;
        result.push(line);
        continue;
      }
    }

    // Stop capturing at next same-level heading
    if (capturing && foundSection && line.match(/^#+\s/) && !line.match(/^###/)) {
      // Hit a new top-level section, stop
      break;
    }

    if (capturing) {
      result.push(line);
    }
  }

  return result.length > 0 ? result.join('\n') : content;
}

// Read and process markdown files
function buildDocsData() {
  const sections = [];

  for (const [id, config] of Object.entries(sectionMap)) {
    const filePath = path.join(docsRoot, config.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠ File not found: ${filePath}`);
      continue;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');

      // Extract section if specified
      if (config.extractSection) {
        content = extractSection(content, config.extractSection);
      }

      // Convert markdown to HTML
      const html = marked(content);

      sections.push({
        id,
        label: config.label,
        content: html
      });

      console.log(`✓ ${id}: ${config.file}`);
    } catch (err) {
      console.error(`✗ Error processing ${config.file}:`, err.message);
    }
  }

  return { sections };
}

// Write JSON file
function writeDocsData() {
  const data = buildDocsData();

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log(`\n✓ Generated: ${outputFile} (${data.sections.length} sections)`);
}

// Run
try {
  writeDocsData();
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
