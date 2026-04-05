import { marked } from "marked";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const DIR = import.meta.dir;

const style = `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace; background: #FAFAFA; color: #0A0A0A; max-width: 860px; margin: 0 auto; padding: 40px 24px; line-height: 1.7; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; }
  h2 { font-size: 18px; font-weight: 700; margin: 28px 0 12px; border-bottom: 2px solid #0A0A0A; padding-bottom: 4px; }
  h3 { font-size: 15px; font-weight: 700; margin: 20px 0 8px; }
  h4 { font-size: 14px; font-weight: 700; margin: 16px 0 6px; }
  p { font-size: 14px; margin: 8px 0; }
  li { font-size: 14px; margin: 4px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  a { color: #1E3EA0; text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote { border-left: 3px solid #1E3EA0; padding: 8px 16px; margin: 12px 0; background: #f0f4ff; font-size: 13px; }
  code { background: #e8e8e8; padding: 2px 6px; font-size: 12px; border-radius: 0; }
  pre { background: #1a1a1a; color: #e0e0e0; padding: 16px; overflow-x: auto; margin: 12px 0; font-size: 13px; line-height: 1.5; }
  pre code { background: none; padding: 0; color: inherit; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
  th { font-weight: 700; background: #f5f5f5; }
  hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  .nav { margin-bottom: 24px; font-size: 13px; }
  .nav a { margin-right: 16px; }
  img { max-width: 100%; }
</style>
`;

const files = await readdir(DIR);
const mdFiles = files.filter(f => f.endsWith(".md") && f !== "INDEX.md");

console.log(`Converting ${mdFiles.length} markdown files to HTML...`);

for (const file of mdFiles) {
  const md = await readFile(join(DIR, file), "utf-8");
  const html = await marked(md);
  const name = file.replace(".md", "");

  const page = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — Contexter</title>
${style}
</head>
<body>
<div class="nav">
  <a href="https://cdn.contexter.cc/public/artem/index.html">← Индекс</a>
  <a href="https://cdn.contexter.cc/public/artem/cofounder-briefing-artem.html">Briefing</a>
</div>
${html}
</body>
</html>`;

  await writeFile(join(DIR, `${name}.html`), page);
  console.log(`  ✓ ${name}.html`);
}

console.log(`\nDone. ${mdFiles.length} HTML files created.`);
