// Validate Design Component artboards: every {{hole}} resolves, loops are non-empty, tags balance, theme toggle works.
// Usage: node scripts/check-artboards.mjs design/project/*.dc.html
import fs from 'node:fs';
const files = process.argv.slice(2);
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const script = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  const props = JSON.parse(src.match(/data-props='([^']*)'/)[1].replace(/&amp;/g,'&'));
  const tpl = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  for (const mode of ['dark','light']) {
    class DCLogic { constructor(){ this.props = {}; this.state = null; } setState(s){ this.state = {...(this.state||{}), ...s}; } }
    const C = new Function('DCLogic', script + '\nreturn Component;')(DCLogic);
    const c = new C(); c.props = { theme: mode };
    const v = c.renderVals();
    // resolve holes: top-level names and loop aliases
    const loops = {}; for (const m of tpl.matchAll(/<sc-for list="\{\{([\w.]+)\}\}" as="(\w+)"/g)) (loops[m[2]] ||= []).push(m[1]);
    const get = (obj, path) => path.split('.').reduce((o,k)=> o==null?undefined:o[k], obj);
    const missing = new Set();
    for (const m of tpl.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)) {
      const path = m[1]; const [head, ...rest] = path.split('.');
      let val;
      if (loops[head]) {
        const ok = loops[head].some(lp => {
          let arr; const [h2,...r2] = lp.split('.');
          if (loops[h2]) { const outer = get(v, loops[h2][0]); arr = outer && outer[0] ? get(outer[0], r2.join('.')) : undefined; } else arr = get(v, lp);
          return Array.isArray(arr) && arr.length && arr.every(it => rest.length ? get(it, rest.join('.')) !== undefined : true);
        });
        val = ok ? 1 : undefined;
      } else val = get(v, path);
      if (val === undefined) missing.add(path);
    }
    if (typeof v.toggle === 'function') { v.toggle(); if (c.state.mode === mode) missing.add('toggle no-op'); }
    // tag balance
    const stack = []; const voids = new Set(['meta','link','img','input','br','hr']);
    for (const m of tpl.replace(/<style>[\s\S]*?<\/style>/,'').matchAll(/<(\/?)([a-zA-Z][\w-]*)[^>]*?(\/?)>/g)) {
      const [ , close, tag ] = m; if (voids.has(tag) && !close) continue;
      if (close) { if (stack.pop() !== tag) { missing.add('unbalanced </'+tag+'>'); break; } } else stack.push(tag);
    }
    if (stack.length) missing.add('unclosed: '+stack.slice(-3).join(','));
    const status = missing.size ? 'FAIL '+[...missing].join('; ') : 'ok';
    if (missing.size) bad++;
    console.log(f.split('/').pop().padEnd(30), mode.padEnd(6), status);
  }
}
process.exit(bad ? 1 : 0);
