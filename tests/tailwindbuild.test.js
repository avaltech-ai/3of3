// Tailwind 樣式改成「建置時產生、放進 index.html」後的檢查（2026-10-23，紅隊檢查 L-3）。
// 以前網頁載入 cdn.tailwindcss.com 的腳本，在手機上即時產生樣式；現在由 build_index.js 用固定版本的 tailwindcss 產生。
// 這裡確認：① 沒有外部 Tailwind 腳本、樣式只有一份且位置正確；② 自訂顏色／字型／斷點等關鍵規則在；
// ③ 頁面用到的 class 都找得到樣式（有打錯的會被抓到）；④ 同一個元素上沒有「同一類、改同一個屬性」的兩個類別
// （例如 rounded-xl 與 rounded-none：誰生效取決於樣式表的排列順序，CDN 與建置版的順序不同，所以不能這樣寫）。
// 需要先 npm ci（用到 tailwindcss 帶進來的 postcss 與 postcss-selector-parser）。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'build_index.js'), 'utf8');
let postcss, selParser;
try { postcss = require('postcss'); selParser = require('postcss-selector-parser'); }
catch (e) { console.log('FAIL: 找不到 postcss——請先執行 npm ci'); process.exit(1); }
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

console.log('A. 沒有外部 Tailwind 腳本；建置出來的樣式只有一份、位置正確');
const styles = [...html.matchAll(/<style id="tailwind-build">([\s\S]*?)<\/style>/g)];
ok(styles.length === 1, '剛好一個 <style id="tailwind-build">（' + styles.length + '）');
ok(html.indexOf('cdn.tailwindcss.com') < 0 && !/tailwind\s*\.\s*config/.test(html), '頁面沒有 cdn.tailwindcss.com，也沒有 tailwind.config');
ok(!/<script[^>]*\ssrc=/.test(html), '頁面沒有任何外部 <script src=…>');
const twPos = html.indexOf('<style id="tailwind-build">'), headEnd = html.indexOf('</head>'), ownStyle = html.indexOf('<style>');
ok(twPos > ownStyle && twPos < headEnd && html.slice(twPos, headEnd).indexOf('<style>') < 0 && html.slice(twPos, headEnd).indexOf('<script') < 0, '位置：在頁面自己的 <style> 之後、</head> 之前（與原本 CDN 把樣式附加在 head 最後面相同，優先順序不變）');
ok(src.indexOf("--content', contentFile") > 0 && src.indexOf("'--minify'") < 0, 'build_index.js 以 tailwindcss CLI 掃描剛產生的網頁內容，不使用 --minify');
const css = styles.length ? styles[0][1] : '';
ok(css.indexOf('hsla(') < 0, '顏色沒有被轉成 hsla（--minify 會造成 1～2 的取整誤差，與 CDN 版不同）');
ok(css.length > 30000 && css.length < 300000, 'CSS 大小合理（' + Math.round(css.length / 1024) + ' KB）');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8'));
ok(pkg.devDependencies && pkg.devDependencies.tailwindcss === '3.4.17' && !pkg.dependencies, 'package.json：tailwindcss 固定 3.4.17，且只放在 devDependencies（建置用，不會送到網站）');
ok(lock.packages['node_modules/tailwindcss'].version === '3.4.17' && /^sha512-/.test(lock.packages['node_modules/tailwindcss'].integrity), 'package-lock.json 鎖定 3.4.17 並有完整性雜湊');
ok(Object.values(lock.packages).filter(p => p.resolved).every(p => /^https:\/\/registry\.npmjs\.org\//.test(p.resolved) && /^sha512-/.test(p.integrity || '')), '鎖定檔裡每個套件都來自 registry.npmjs.org 且有 sha512 雜湊');

console.log('B. 關鍵規則（自訂顏色、字型、斷點、前置重設）');
const root = postcss.parse(css);
const nz = v => String(v).replace(/\s+/g, '').replace(/["']/g, '').replace(/(^|[^\d])0\./g, '$1.');
function rulesFor(sel, ctx) { const out = []; root.walkRules(r => { if (r.selectors.map(nz).indexOf(nz(sel)) < 0) return; let c = '', p = r.parent; while (p && p.type !== 'root') { if (p.type === 'atrule') c = p.name + ' ' + p.params + ';' + c; p = p.parent; } if (ctx === undefined || nz(c).indexOf(nz(ctx)) >= 0) out.push(r); }); return out; }
const decl = (r, prop) => { let v = null; r.walkDecls(prop, d => { v = d.value; }); return v; };
ok(rulesFor('.hidden').length === 1 && decl(rulesFor('.hidden')[0], 'display') === 'none', '.hidden → display:none');
ok(decl(rulesFor('.bg-peach-500')[0], 'background-color') && /rgb\(255 122 133/.test(decl(rulesFor('.bg-peach-500')[0], 'background-color')), '自訂顏色 peach-500（#FF7A85）');
const cfg = require('../tailwind.config.js').theme.extend;
ok(cfg.colors.warmbg === '#FDFBF7' && cfg.colors.peach[500] === '#FF7A85' && cfg.colors.mint[500] === '#10B981' && cfg.colors.sun[500] === '#F59E0B' && cfg.colors.berry[500] === '#8B5CF6', 'tailwind.config.js 的自訂顏色（peach、mint、sun、berry、warmbg）與原本網頁裡的設定相同');
ok(/Zen Maru Gothic/.test(decl(rulesFor('html')[0], 'font-family')) && /Noto Sans TC/.test(decl(rulesFor('html')[0], 'font-family')), '字型：html 預設字型是 Zen Maru Gothic、Noto Sans TC');
ok(rulesFor('.md\\:block', 'min-width:768px').length === 1 && rulesFor('.sm\\:flex', 'min-width:640px').length >= 1, '斷點：md（768px）與 sm（640px）');
ok(rulesFor('.motion-safe\\:animate-pulse', 'prefers-reduced-motion:no-preference').length === 1, 'motion-safe 變體');
ok(rulesFor('.min-h-\\[340px\\]').length === 1 && nz(decl(rulesFor('.min-h-\\[340px\\]')[0], 'min-height')) === '340px', '任意值 min-h-[340px]');
ok(rulesFor('.rounded-xl').length === 1 && nz(decl(rulesFor('.rounded-xl')[0], 'border-radius')) === '.75rem', 'rounded-xl = 0.75rem');
const topRules = root.nodes.filter(n => n.type === 'rule');
const firstBox = topRules.findIndex(n => decl(n, 'box-sizing') === 'border-box');
ok(firstBox >= 0 && firstBox <= 6 && topRules.findIndex(n => n.selectors.indexOf('.hidden') >= 0) > firstBox, '前置重設（preflight：box-sizing 等）在最前面、早於所有工具類別');
ok(rulesFor('[hidden]:where(:not([hidden=until-found]))').length === 1, 'preflight 的 [hidden] 規則');
const ar = []; root.walkAtRules('keyframes', a => ar.push(a.params)); ok(ar.indexOf('pulse') >= 0 && ar.indexOf('spin') >= 0, '動畫 keyframes：pulse、spin');

console.log('C. 頁面用到的 class 都找得到樣式');
function classNames(sel) { const out = []; selParser(s => s.walkClasses(c => out.push(c.value))).processSync(sel); return out; }
const known = new Set(); root.walkRules(r => r.selectors.forEach(s => classNames(s).forEach(c => known.add(c))));
const ownCss = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(x => x[1]).join('\n');
const own = new Set((ownCss.match(/\.[A-Za-z_][\w-]*/g) || []).map(x => x.slice(1)));
// 只給 JavaScript 當標記用（沒有樣式）的 class
const HOOKS = new Set(['sidebar-text', 'sidebar-pin-btn', 'no-scrollbar', 'tab-btn', 'group/btn', 'group/nav', 'custom-scrollbar', 'cal-view-btn', 'tr-view-btn', 'doc-cat-btn', 'admin-group-btn', 'admin-subtab-btn', 'admin-panel', 'tr-print-card', 'event-minor', 'new-badge', 'tr-admin-ops', 'task-admin-ops', 'doc-admin-ops', 'admin-song-lock', 'song-batch-cb', 'sp-no-rank', 'sp-order-select', 'theme-overview', 'tr-point', 'tr-quote', 'task-overview', 'task-card', 'goal-activity', 'goal-course']);
// 原本就沒有作用的類別（Tailwind 3.4.17 沒有這些名稱：shadow-xs、shadow-2xs、drop-shadow-2xs、backdrop-blur-xs 是 Tailwind 4 才有；border-3 與 text-peach-700 不在預設／自訂的值裡）。
// CDN 版同樣不會產生，所以畫面一直沒有這些效果；列在這裡是為了「不再增加新的」，要修的話另外討論（會改變畫面）。
const NOOP = new Set(['shadow-xs', 'shadow-2xs', 'drop-shadow-2xs', 'backdrop-blur-xs', 'border-3', 'text-peach-700']);
const staticAttrs = new Set(); let mm; const reAttr = /\sclass="([^"]*)"/g;
while ((mm = reAttr.exec(html))) { const v = mm[1]; if (/['`$+]/.test(v)) continue; staticAttrs.add(v); }
const unknown = new Map();
staticAttrs.forEach(a => a.split(/\s+/).filter(Boolean).forEach(t => { if (!known.has(t) && !own.has(t) && !HOOKS.has(t) && !NOOP.has(t)) unknown.set(t, (unknown.get(t) || 0) + 1); }));
ok(staticAttrs.size > 800 && known.size > 800, '（健全性）掃到 ' + staticAttrs.size + ' 組靜態 class、樣式表有 ' + known.size + ' 個 class');
ok(unknown.size === 0, '每個 class 都有樣式、是頁面自己的 CSS、或是已登記的標記／無作用類別。沒有對應的：' + ([...unknown.keys()].join('、') || '無'));
const noopUsed = [...NOOP].filter(t => !known.has(t)); ok(noopUsed.length === NOOP.size, '「無作用」清單裡的類別確實都沒有被產生樣式（有一天產生了就該從清單拿掉）');
const known2 = [...NOOP].filter(t => known.has(t)); ok(known2.length === 0, '無作用清單沒有過期的項目：' + (known2.join('、') || '無'));

console.log('D. 同一個元素上不能有「同一類、改同一個屬性」的兩個類別（排列順序不可靠）');
const props = new Map();   // class → Set(內容|變體|屬性)
root.walkRules(r => {
  let ctx = '', p = r.parent; while (p && p.type !== 'root') { if (p.type === 'atrule') ctx = p.name + ' ' + p.params + ';' + ctx; p = p.parent; }
  r.selectors.forEach(sel => {
    let simple = null;
    selParser(s => { s.each(seq => { const nodes = seq.nodes; if (nodes.length >= 1 && nodes[0].type === 'class' && nodes.slice(1).every(n => n.type === 'pseudo')) simple = { cls: nodes[0].value, pseudo: nodes.slice(1).map(n => n.toString()).join('') }; }); }).processSync(sel);
    if (!simple || /\s|>|~|\+/.test(sel.replace(/\\./g, ''))) return;
    r.walkDecls(d => { if (d.prop.startsWith('--tw')) return; if (!props.has(simple.cls)) props.set(simple.cls, new Set()); props.get(simple.cls).add(ctx + '|' + simple.pseudo + '|' + d.prop); });
  });
});
const fam = t => { t = t.replace(/^(?:[a-z0-9\-\[\]=&@]+:)*/, '').replace(/^-/, ''); const parts = t.split(/[-\/\[]/); return (/^(translate|scale|space|divide|gap|skew|inset|border|rounded|p|m|overflow|object|scroll)$/.test(parts[0]) && /^(x|y|t|b|l|r|s|e|tl|tr|bl|br)$/.test(parts[1] || '')) ? parts[0] + '-' + parts[1] : parts[0]; };
function conflicts(tokens) {
  const by = new Map(); const out = [];
  tokens.filter(t => props.has(t)).forEach(t => props.get(t).forEach(k => { if (!by.has(k)) by.set(k, []); by.get(k).push(t); }));
  by.forEach((ts, k) => { const u = [...new Set(ts)]; if (u.length > 1 && new Set(u.map(fam)).size < u.length) out.push(k.split('|')[2] + '：' + u.join(' 與 ')); });
  return out;
}
const bad = [];
staticAttrs.forEach(a => { const c = conflicts(a.split(/\s+/).filter(Boolean)); if (c.length) bad.push(a.slice(0, 80) + ' → ' + c.join('；')); });
const literals = new Set(); const reLit = /'([^'\n]{8,300})'|"([^"\n]{8,300})"/g;
while ((mm = reLit.exec(html))) { const v = mm[1] || mm[2]; if (!/^[\w\-\/\[\]\.:%#!(),=&@ ]+$/.test(v) || v.indexOf(' ') < 0) continue; literals.add(v); }
let litChecked = 0;
literals.forEach(v => { const toks = v.split(/\s+/).filter(Boolean); if (toks.length < 2 || !toks.every(t => known.has(t) || own.has(t) || HOOKS.has(t) || NOOP.has(t))) return; litChecked++; const c = conflicts(toks); if (c.length) bad.push('（JS 字串）' + v.slice(0, 80) + ' → ' + c.join('；')); });
ok(litChecked > 100, '（健全性）檢查了 ' + staticAttrs.size + ' 組 HTML class 與 ' + litChecked + ' 組 JS 字串裡的 class');
ok(bad.length === 0, '沒有衝突的類別組合。有衝突的：' + (bad.join(' ／ ') || '無'));
// 檢查器本身要抓得到（用已知會衝突的組合）
ok(conflicts(['rounded-xl', 'rounded-none']).length === 1 && conflicts(['bg-white/80', 'bg-amber-50/70']).length === 1 && conflicts(['w-8', 'w-full']).length === 1 && conflicts(['sm:w-11', 'sm:w-14']).length === 1, '（檢查器自測）rounded-xl＋rounded-none、bg-white/80＋bg-amber-50/70、w-8＋w-full、sm:w-11＋sm:w-14 都會被抓到');
ok(conflicts(['-translate-x-1/2', 'translate-y-3']).length === 0 && conflicts(['hidden', 'flex']).length === 0 && conflicts(['transition-all', 'duration-300']).length === 0 && conflicts(['p-4', 'sm:p-2']).length === 0 && conflicts(['py-2', 'pt-1']).length === 0, '（檢查器自測）不同方向、不同變體、不同類別（排列順序固定的）不會誤報');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
