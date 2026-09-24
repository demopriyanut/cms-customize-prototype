// Builds the page file + file list used to publish dist-artifact/ as a claude.ai Artifact.
// Run through `npm run build:artifact` (it builds with VITE_ROUTER=memory first).
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const out = new URL('../dist-artifact/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const walk = dir => readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p] })
const files = walk(out).map(p => relative(out, p).replaceAll('\\', '/')).filter(p => !p.endsWith('.html') && p !== 'artifact-files.json')
const js = files.find(p => /^assets\/index-.*\.js$/.test(p))
const css = files.find(p => /^assets\/index-.*\.css$/.test(p))
if (!js || !css) throw new Error('build output not found — run vite build first')

// Artifact pages are wrapped in their own <html>/<head>/<body>, so the page carries only title, styles, root and script
writeFileSync(join(out, 'cms-customize-prototype.html'), `<title>CMS ปรับแต่ง Prototype</title>
<link rel="stylesheet" href="fa/css/all.min.css">
<link rel="stylesheet" href="${css}">
<div id="root"></div>
<script type="module" src="${js}"></script>
`)
writeFileSync(join(out, 'artifact-files.json'), JSON.stringify(files.map(path => ({ path })), null, 0))
console.log(`dist-artifact ready · page: cms-customize-prototype.html · ${files.length} supporting files (see artifact-files.json)`)
