// 首頁焦點輪播：Drive 影片改顯示「縮圖＋▶」（2026-10-23）。
// Drive 預覽視窗沒有自動播放，首頁那一格又設成不能點，原本只是一片預覽框。現在 Drive 影片在首頁顯示 Drive 產生的影片封面，
// 中間疊一個 ▶，點了開彈窗（彈窗仍用 Drive 預覽，家長按播放）。YouTube／直接 mp4／圖片的行為不變。
// 這裡直接從 index.html 取出 renderSpotlightMedia 等函式，用假的 DOM 元素執行。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function grab(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); const j = html.indexOf('\n    }\n', i); return html.slice(i, j + 6); }

function mkEl(id) {
  const cls = new Set();
  const el = { id, src: '', alt: '', onerror: null, style: {}, textContent: '', paused: false,
    classList: { add: (...a) => a.forEach(c => cls.add(c)), remove: (...a) => a.forEach(c => cls.delete(c)), contains: c => cls.has(c), toggle: (c, f) => { if (f === undefined ? !cls.has(c) : f) cls.add(c); else cls.delete(c); } },
    has: c => cls.has(c), pause() { this.paused = true; }, play() { return Promise.resolve(); } };
  return el;
}
function setup() {
  const ids = ['spotlightImg', 'spotlightVideoBox', 'spotlightIframe', 'spotlightHtml5Video', 'spotlightMediaHint', 'spotlightPlayBadge', 'spotlightMediaFrame'];
  const els = {}; ids.forEach(i => { els[i] = mkEl(i); });
  els.spotlightMediaFrame.classList.add('bg-rose-50');
  const body = ['safeUrl', 'detectMediaKind', 'getEmbedVideoInfo', 'drivePosterUrl', 'renderSpotlightMedia'].map(grab).join('\n');
  const f = new Function('document', 't', 'esc', body + '\nreturn { renderSpotlightMedia, drivePosterUrl, getEmbedVideoInfo };');
  const api = f({ getElementById: id => els[id] || null }, k => k, s => s);
  return { els, api };
}
const render = (sp, ctx) => { ctx = ctx || setup(); ctx.api.renderSpotlightMedia(sp); return ctx; };
const FID = '1AbC_dEf-GhIjKlMnOpQrStUvWxYz012';

console.log('A. Drive 影片：首頁顯示影片封面＋▶，不嵌入預覽框');
[['/file/d/ 連結', 'https://drive.google.com/file/d/' + FID + '/view?usp=sharing'], ['預覽網址', 'https://drive.google.com/file/d/' + FID + '/preview'], ['縮圖網址（id=）', 'https://drive.google.com/thumbnail?id=' + FID + '&sz=w1600'], ['uc?id= 連結', 'https://drive.google.com/uc?export=download&id=' + FID]].forEach(([n, u]) => {
  const c = render({ imageUrl: u, mediaType: 'video' }), e = c.els;
  ok(e.spotlightImg.src === 'https://drive.google.com/thumbnail?id=' + FID + '&sz=w1600' && !e.spotlightImg.has('hidden') && !e.spotlightImg.has('invisible'), n + '：縮圖欄顯示影片封面（thumbnail?id=…&sz=w1600）');
  ok(!e.spotlightPlayBadge.has('hidden'), n + '：▶ 圖示顯示');
  ok(e.spotlightVideoBox.has('hidden') && e.spotlightIframe.src === '' && e.spotlightHtml5Video.has('hidden'), n + '：沒有嵌入 Drive 預覽框（iframe 清空、影片盒隱藏）');
  ok(e.spotlightMediaFrame.has('bg-slate-800') && !e.spotlightMediaFrame.has('bg-rose-50'), n + '：底色改深色（封面載入前、失敗時不是一片粉紅空白）');
  ok(e.spotlightMediaHint.textContent === '▶ ' + 'ui.spotlightPlayMedia' || /ui\.spotlightPlayMedia/.test(e.spotlightMediaHint.textContent), n + '：左下角提示用「播放」文字');
});
(function () {
  const c = render({ imageUrl: 'https://drive.google.com/file/d/' + FID + '/view', mediaType: 'video' });
  c.els.spotlightImg.onerror();
  ok(typeof c.els.spotlightImg.onerror === 'function' && c.els.spotlightImg.has('invisible') && !c.els.spotlightPlayBadge.has('hidden') && c.els.spotlightMediaFrame.has('bg-slate-800'), '封面載入失敗（影片還在處理中）：隱藏破圖，保留深色底與 ▶');
})();

console.log('B. 其他類型照舊');
(function () {
  let c = render({ imageUrl: 'https://youtu.be/u1BcT53syxo', mediaType: 'video' }), e = c.els;
  ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/u1BcT53syxo\?.*autoplay=1&mute=1/.test(e.spotlightIframe.src) && !e.spotlightVideoBox.has('hidden') && e.spotlightImg.has('hidden') && e.spotlightPlayBadge.has('hidden'), 'YouTube：照舊嵌入並自動靜音播放，沒有 ▶ 圖示');
  c = render({ imageUrl: 'https://example.test/clip.mp4', mediaType: 'video' }); e = c.els;
  ok(e.spotlightHtml5Video.src === 'https://example.test/clip.mp4' && !e.spotlightHtml5Video.has('hidden') && e.spotlightPlayBadge.has('hidden') && e.spotlightIframe.src === '', '直接 mp4 網址：照舊用 video 標籤，沒有 ▶ 圖示');
  c = render({ imageUrl: 'https://drive.google.com/thumbnail?id=' + FID + '&sz=w1600', mediaType: 'image' }); e = c.els;
  ok(e.spotlightImg.src === 'https://drive.google.com/thumbnail?id=' + FID + '&sz=w1600' && e.spotlightPlayBadge.has('hidden') && e.spotlightMediaFrame.has('bg-rose-50') && !e.spotlightMediaFrame.has('bg-slate-800'), '圖片類型：照舊顯示圖片，沒有 ▶，底色維持原樣');
  ok(/spotlightEnlarge/.test(e.spotlightMediaHint.textContent), '圖片類型：左下角提示仍是「放大查看」');
})();

console.log('C. 輪播切換不留殘影（影片 → 其他 → 影片）');
(function () {
  const c = setup(); const e = c.els;
  c.api.renderSpotlightMedia({ imageUrl: 'https://drive.google.com/file/d/' + FID + '/view', mediaType: 'video' }); e.spotlightImg.onerror();
  c.api.renderSpotlightMedia({ imageUrl: 'https://drive.google.com/thumbnail?id=ZZZ&sz=w1600', mediaType: 'image' });
  ok(!e.spotlightImg.has('invisible') && e.spotlightImg.onerror === null && e.spotlightPlayBadge.has('hidden') && e.spotlightMediaFrame.has('bg-rose-50') && !e.spotlightMediaFrame.has('bg-slate-800'), '切到圖片：解除隱藏、清掉 onerror、收起 ▶、底色還原');
  c.api.renderSpotlightMedia({ imageUrl: 'https://drive.google.com/file/d/' + FID + '/view', mediaType: 'video' }); e.spotlightImg.onerror();
  c.api.renderSpotlightMedia({ imageUrl: 'https://youtu.be/u1BcT53syxo', mediaType: 'video' });
  ok(e.spotlightImg.has('hidden') && e.spotlightPlayBadge.has('hidden') && e.spotlightMediaFrame.has('bg-rose-50') && e.spotlightImg.onerror === null && !e.spotlightVideoBox.has('hidden'), '切到 YouTube：封面與 ▶ 收起、底色還原、影片盒顯示');
  c.api.renderSpotlightMedia({ imageUrl: 'https://drive.google.com/file/d/' + FID + '/view', mediaType: 'video' });
  ok(!e.spotlightImg.has('invisible') && !e.spotlightImg.has('hidden') && e.spotlightVideoBox.has('hidden') && e.spotlightIframe.src === '', '再切回 Drive 影片：封面重新顯示（先前的隱藏不會殘留）');
})();

console.log('D. 安全：只用通過檢查的 Drive 檔案編號組縮圖網址');
(function () {
  const c = setup(), P = c.api.drivePosterUrl;
  ok(P('https://drive.google.com/file/d/' + FID + '/preview') === 'https://drive.google.com/thumbnail?id=' + FID + '&sz=w1600', 'drivePosterUrl：Drive 預覽網址 → 縮圖網址');
  ['', 'https://youtube.com/embed/abc', 'https://evil.example/file/d/' + FID + '/preview', 'https://drive.google.com/file/d/' + FID + '/preview?x=1', 'https://drive.google.com/file/d/a"onerror="alert(1)/preview', 'https://drive.google.com/file/d/<script>/preview', 'https://drive.google.com/file/d//preview', 'https://drive.google.com/file/d/a b/preview', null, undefined, 42].forEach(u => ok(P(u) === '', 'drivePosterUrl 拒絕：' + JSON.stringify(u)));
  const e = render({ imageUrl: 'https://drive.google.com/file/d/a"onerror="alert(1)/view', mediaType: 'video' }).els;
  ok(e.spotlightImg.src.indexOf('"') < 0 && e.spotlightPlayBadge.has('hidden'), '編號含引號的網址：不組縮圖網址，不顯示 ▶（沿用原本的處理）');
})();

console.log('E. 版面（HTML）');
ok(/<img id="spotlightImg"[^>]*onclick="openSpotlightModal\(\)"/.test(html), '縮圖本身可點，開彈窗');
ok(/id="spotlightPlayBadge"[^>]*pointer-events-none/.test(html) && /id="spotlightPlayBadge"[^>]*\bhidden\b/.test(html) && /id="spotlightPlayBadge"[\s\S]{0,400}▶/.test(html), '▶ 圖示：預設隱藏、不攔截點擊（點到縮圖）、內容是 ▶');
ok(/id="spotlightMediaFrame"[^>]*aspect-\[16\/10\]/.test(html), '縮圖外框有 id（切換底色用），比例不變 16:10');
const modal = html.slice(html.indexOf('function renderSpotlightModalMedia') > 0 ? html.indexOf('function renderSpotlightModalMedia') : 0);
ok(/modalSpotlightIframe/.test(html) && /drive\.google\.com\/file\/d\/' \+ driveId \+ '\/preview/.test(html), '彈窗仍用 Drive 預覽（家長按播放鈕）');
ok(html.indexOf('drive.google.com/thumbnail?id=\' + ') > 0, '（健全性）頁面仍有縮圖網址組合');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
