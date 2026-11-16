// 無障礙「高」三項修正（2026-11-16 檢查報告第 4～6 項；使用者說「繼續」）：
// ④ 一般文字對比不足（WCAG 1.4.3，需 4.5:1）；⑤ 欄位沒有程式可讀的名稱（1.3.1／4.1.2）；⑥ 提示訊息不會被報讀軟體唸出、消失太快、錯誤訊息太技術（4.1.3／2.2.1／3.3.1）。
// 執行：node tests/a11yhigh.test.js（已納入 tests/ci.sh）
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'build_index.js'), 'utf8');
const cfg = require('../tailwind.config.js').theme.extend.colors;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function fn(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); return html.slice(i, html.indexOf('\n    }\n', i) + 6); }
const lum = h => { h = h.replace('#', ''); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(parseInt(h.slice(0, 2), 16)) + 0.7152 * f(parseInt(h.slice(2, 4), 16)) + 0.0722 * f(parseInt(h.slice(4, 6), 16)); };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const W = '#FFFFFF';

console.log('A. 調色盤：實際量測的組合都 ≥ 4.5:1');
{
  const c = (name, fg, bg, min) => { const r = cr(fg, bg); ok(r >= (min || 4.5), name + '：' + fg + ' 對 ' + bg + ' = ' + r.toFixed(2)); };
  c('rose-500 文字在白底', cfg.rose[500], W);
  c('rose-500 文字在 rose-50', cfg.rose[500], '#FFF1F2');
  c('rose-500 文字在淺灰底', cfg.rose[500], '#F9FBFC');
  c('「Happy Life」白字在 rose-500', W, cfg.rose[500]);
  c('rose-600 文字在 rose-100（Week 標籤）', cfg.rose[600], '#FFE4E6');
  c('rose-600 文字在 rose-50（學期標籤）', cfg.rose[600], '#FFF1F2');
  c('teal-600 文字在白底（週六日期、重設）', cfg.teal[600], W);
  c('teal-600 文字在淺灰底', cfg.teal[600], '#F9FBFC');
  c('白字在 teal-600 按鈕', W, cfg.teal[600]);
  c('emerald-600 文字在白底（Line@）', cfg.emerald[600], W);
  c('白字在 sky-500（銜接計畫）', W, cfg.sky[500]);
  c('白字在 sky-600（列印按鈕）', W, cfg.sky[600]);
  c('fuchsia-600 文字在 fuchsia-50（全選目前歌曲）', cfg.fuchsia[600], '#FDF4FF');
  c('peach-600 文字在白底（展開完整內容、手機導覽）', cfg.peach[600], W);
  c('peach-600 文字在 rose-50（今天按鈕）', cfg.peach[600], '#FFF1F2');
  c('peach-600 文字在淺桃色底', cfg.peach[600], '#FFF7EE');
  c('白字在 peach-600（今日卡「明天」「焦點活動」標籤）', W, cfg.peach[600]);
  c('slate-500 文字在白底（文件更新日期）', '#64748B', W);
  c('slate-600 文字在 slate-100（「6s 輪播」）', '#475569', '#F1F5F9');
  ok(cfg.peach[500] === '#FF7A85' && cfg.peach[700] === '#B03040', '品牌色 peach-500、peach-700 沒動');
}

console.log('B. 文字顏色改動');
{
  ok(/today-label text-xs font-black px-2\.5 py-0\.5 rounded-full ' \+ \(primary \? 'bg-peach-600 text-white'/.test(html), '今日卡標籤（「明天」等）改用 peach-600 底');
  ok(/<span class="bg-peach-600 text-white text-xs font-extrabold px-2\.5 sm:px-3 py-1 rounded-full shadow-sm flex items-center/.test(html), '「焦點活動」標籤改用 peach-600 底');
  ok(!/id="spotlightDurationBadge"[^>]*text-slate-400/.test(html) && /id="spotlightDurationBadge" class="[^"]*text-slate-600 bg-slate-100/.test(html), '「6s 輪播」改成 slate-600');
  const d = fn('renderDocsList');
  ok(!/text-\[0\.6875rem\] text-slate-400/.test(d) && (d.match(/text-\[0\.6875rem\] text-slate-500/g) || []).length >= 2, '文件頁「更新日期」改成 slate-500（單檔卡與多檔卡）');
  ok(!/<p class="text-xs text-slate-400[^"]*"[^>]*>[^<]*點擊可立即下載/.test(html) && !/text-xs text-slate-400[^"]*">[^<]*(點擊可立即|下載或直接預覽)/.test(html), '「點擊可立即下載或直接預覽」不再是 slate-400');
  const bad = (html.match(/class="[^"]*\btext-(xs|sm|\[0\.6875rem\]|\[0\.625rem\])\b[^"]*"/g) || []).filter(x => /(^|[ "])text-slate-400\b/.test(x) && !/(hover|group-hover|placeholder):text-slate-400/.test(x));
  ok(bad.length <= 40, '「文字大小＋text-slate-400」的 class 已大幅減少（剩 ' + bad.length + ' 處，多為圖示或停用狀態）');
}

console.log('C. 欄位都有名稱');
{
  const labels = html.match(/<label(?![^>]*\bfor=)[^>]*>(?:(?!<\/label>)[\s\S])*<\/label>\s*(?:<[^>]*>\s*){0,3}?<(?:input|select|textarea)\b[^>]*\bid="[^"]+"/g) || [];
  const unlinked = labels.filter(x => !/<(input|select|textarea)\b/.test(x.slice(0, x.lastIndexOf('<'))) && !/<label\b[^]*<label\b/.test(x.slice(5)));
  ok(unlinked.length === 0, '「標籤＋緊接著的欄位」都已用 for 綁定（未綁定 ' + unlinked.length + ' 組）');
  const withFor = (html.match(/<label for="[^"]+"/g) || []).length;
  ok(withFor >= 60, '用 for 綁定欄位的標籤共 ' + withFor + ' 個');
  const fors = new Set((html.match(/<label[^>]*\bfor="([^"]+)"/g) || []).map(x => /for="([^"]+)"/.exec(x)[1]));
  const bare = [];
  (html.match(/<(input|select|textarea)\b[^>]*>/g) || []).forEach(tag => {
    if (/type="(hidden|file)"/.test(tag) || /aria-label=|aria-labelledby=/.test(tag)) return;
    const id = (/\bid="([^"$]+)"/.exec(tag) || [])[1];
    if (id && fors.has(id)) return;
    bare.push(tag.slice(0, 80));
  });
  const names = bare.map(t => ((/\bid="([^"]+)"/.exec(t) || [])[1]) || t.slice(0, 40));
  // 不在表單裡直接綁標籤的：包在 <label> 裡的核取方塊、執行時由 ensureControlNames 補名稱的（有 placeholder 的文字欄位）
  const needRuntime = bare.filter(t => /placeholder=/.test(t));
  const wrapped = bare.filter(t => /type="checkbox"/.test(t));
  const other = bare.filter(t => !/placeholder=/.test(t) && !/type="checkbox"/.test(t));
  ok(other.length === 0, '沒有名稱的欄位（排除 placeholder 欄位與包在標籤裡的核取方塊）：' + (other.map(t => t.slice(0, 60)).join('｜') || '無'));
  ok(wrapped.every(t => { const i = html.indexOf(t); return /<label[^>]*>(?:(?!<\/label>)[\s\S])*$/.test(html.slice(Math.max(0, i - 400), i)); }), '核取方塊都包在 <label> 裡（點文字即可勾選、報讀軟體唸得出名稱）：' + wrapped.length + ' 個');
  const en = fn('ensureControlNames');
  ok(/getAttribute\('placeholder'\)/.test(en) && /setAttribute\('aria-label'/.test(en) && /data-auto-name/.test(en), 'ensureControlNames：沒有名稱的欄位用 placeholder 當名稱（切換語言後會跟著更新）');
  const run = new Function('els', fn('ensureControlNames').replace('function ensureControlNames(root)', 'function ensureControlNames(root)') + '\nreturn ensureControlNames({ querySelectorAll: () => els });');
  const mk = (o) => Object.assign({ type: 'text', labels: [], attrs: {}, getAttribute(k) { return k === 'type' ? this.type : (k in this.attrs ? this.attrs[k] : null); }, setAttribute(k, v) { this.attrs[k] = v; }, hasAttribute(k) { return k in this.attrs; } }, o);
  const a = mk({ attrs: { placeholder: '搜尋歌名' } }), b = mk({ attrs: { placeholder: 'x', 'aria-label': '已有名稱' } }), c2 = mk({ labels: [{}], attrs: { placeholder: 'y' } }), d = mk({ type: 'hidden', attrs: { placeholder: 'z' } }), e = mk({ attrs: { placeholder: '英文', 'data-auto-name': '1', 'aria-label': 'Chinese' } });
  run([a, b, c2, d, e]);
  ok(a.attrs['aria-label'] === '搜尋歌名' && a.attrs['data-auto-name'] === '1', '只有 placeholder 的欄位：補上 aria-label');
  ok(b.attrs['aria-label'] === '已有名稱', '已經有名稱的：不動');
  ok(!('aria-label' in c2.attrs), '有 <label> 的欄位：不動');
  ok(!('aria-label' in d.attrs), 'hidden 欄位：不動');
  ok(e.attrs['aria-label'] === '英文', '之前自動補的名稱：placeholder 變了就跟著更新（切換語言）');
  ok(/ensureControlNames\(document\.body\)/.test(html) && /new MutationObserver\(/.test(fn('startControlNames')), '頁面載入與內容變動時都會執行（動態產生的欄位也會補上）');
  ok(/id="themeSemesterFilter"[^>]*aria-label="篩選學期"/.test(html) && /id="trYearFilter"[^>]*aria-label="選擇學年度"/.test(html), '學期篩選、學年度選單有名稱');
  ok(/class="goal-activity[^"]*"[^>]*aria-label="活動目標"/.test(html) || /aria-label="活動目標"/.test(html), '主題表單的「活動目標」「課程目標」欄位有名稱');
  ok(/checkbox\.setAttribute\('aria-label', \(state\.lang === 'en' \? 'Select song: ' : '選取歌曲：'\) \+ \(song\.title \|\| ''\)\)/.test(html), '歌曲勾選框：名稱含歌名（「選取歌曲：小星星」）');
  ok(/<select aria-label="焦點活動播放順位" class="sp-order-select/.test(html), '焦點活動順位選單有名稱');
}

console.log('D. 提示訊息');
{
  ok(/id="toast"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/.test(html), '提示框有 role=status、aria-live=polite（報讀軟體會唸出）');
  const st = fn('showToast');
  ok(/isErrorToastIcon\(icon\)/.test(st) && /setAttribute\('role', isErr \? 'alert' : 'status'\)/.test(st) && /setAttribute\('aria-live', isErr \? 'assertive' : 'polite'\)/.test(st), '錯誤／警告類：role=alert、assertive（立刻唸）');
  ok(/isErr \? 6000 : 4000/.test(st) && !/}, 3000\);/.test(st), '顯示時間：一般 4 秒、錯誤 6 秒（原本 3 秒）');
  const ic = new Function(fn('isErrorToastIcon') + '\nreturn isErrorToastIcon;')();
  ok(ic('❌') && ic('⚠️') && ic('🔒') && !ic('✅') && !ic('🎉') && !ic('ℹ️'), 'isErrorToastIcon：❌ ⚠️ 🔒 算錯誤；✅ 🎉 ℹ️ 不算');
  const fe = new Function(fn('friendlyErr') + '\nreturn friendlyErr;')();
  ok(fe('找不到該日期菜單') === '找不到該日期菜單', '後端的中文說明原樣顯示');
  ok(fe('') === '未知錯誤，請稍後再試' && fe(undefined) === '未知錯誤，請稍後再試', '沒有錯誤內容：「未知錯誤，請稍後再試」');
  const tech = '儲存文件失敗: TypeError: Cannot read properties of undefined (reading \'getRange\') at saveDoc (Code:4120:9)';
  ok(/^系統發生問題，請稍後再試；若持續發生請截圖給管理員/.test(fe(tech)) && fe(tech).indexOf('getRange') < 0, '含程式錯誤內容的訊息：改成白話說明，不顯示技術字串');
  ok(/^系統發生問題/.test(fe('Exception: Service invoked too many times for one day')), '「Exception: …」類：白話說明');
  ok(fe(new Error('連線逾時')) === '連線逾時', '傳入 Error 物件：取 message');
  const left = (html.match(/\(\(res && res\.error\) \|\| '未知錯誤'\)/g) || []).length;
  ok(left === 0, '「儲存失敗／刪除失敗／複製失敗」等提示都改用 friendlyErr（舊寫法剩 ' + left + ' 處）');
  ok((html.match(/friendlyErr\(/g) || []).length >= 14, 'friendlyErr 已套用 ' + (html.match(/friendlyErr\(/g) || []).length + ' 處');
}

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
