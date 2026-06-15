import { marked, Renderer } from 'marked';
import * as hljs_module from 'highlight.js';

const hljs = hljs_module.default;

const renderer = new Renderer();
const originalCode = renderer.code;

renderer.code = function(code, language, isEscaped) {
  console.log(`code renderer called with language: "${language}"`);
  const highlighted = language && hljs.getLanguage(language) 
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;
  
  return `<pre><code class="hljs language-${language || ''}">${highlighted}</code></pre>\n`;
};

marked.use({ renderer });

const testMd = `# Test\n\n\`\`\`bash\ncd /tmp\nls -la\n\`\`\``;
const html = marked(testMd);
console.log("Generated HTML:");
console.log(html.substring(0, 400));
