// Render Design Component artboards to static HTML (one file per theme) for screenshots.
// Usage: node scripts/render-artboards.mjs <outDir> design/project/*.dc.html
import fs from 'node:fs'; import path from 'node:path';
const [out, ...files] = process.argv.slice(2);
const get = (o, p) => p.split('.').reduce((a,k)=> a==null?undefined:a[k], o);
function render(tpl, scope) {
  let res = ''; let i = 0;
  while (true) {
    const s = tpl.indexOf('<sc-for', i);
    if (s < 0) { res += tpl.slice(i); break; }
    res += tpl.slice(i, s);
    const headEnd = tpl.indexOf('>', s);
    const head = tpl.slice(s, headEnd+1);
    let depth = 1, j = headEnd+1;
    while (depth) { const o = tpl.indexOf('<sc-for', j), c = tpl.indexOf('</sc-for>', j);
      if (o >= 0 && o < c) { depth++; j = o+7; } else { depth--; j = c+9; } }
    const inner = tpl.slice(headEnd+1, j-9);
    const list = get(scope, head.match(/list="\{\{\s*([\w.$]+)\s*\}\}"/)[1]) || [];
    const as = head.match(/as="(\w+)"/)[1];
    list.forEach((it, idx) => { res += render(inner, { ...scope, [as]: it, $index: idx }); });
    i = j;
  }
  return res.replace(/\s on[A-Z]\w*="\{\{[^}]+\}\}"/g, '').replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
}
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const script = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  let tpl = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  const helmet = tpl.match(/<helmet>([\s\S]*?)<\/helmet>/)[1]; tpl = tpl.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  for (const mode of ['dark','light']) {
    class DCLogic { constructor(){ this.props={}; this.state=null; } setState(){} }
    const C = new Function('DCLogic', script + '\nreturn Component;')(DCLogic);
    const c = new C(); c.props = { theme: mode };
    const html = `<!doctype html><html><head><meta charset="utf-8">${helmet}</head><body>${render(tpl, c.renderVals())}</body></html>`;
    fs.writeFileSync(path.join(out, path.basename(f, '.dc.html') + '.' + mode + '.html'), html);
  }
}
