// 前台 safeUrl／escUrl（所有 href／src 都經過它）的測試（紅隊檢查 M-1，2026-10-23）：
// 瀏覽器解析網址時會吞掉 Tab、換行與開頭的控制字元，「java<Tab>script:」會變回 javascript:。
// 這裡直接從 index.html 取出函式，用 WHATWG URL（瀏覽器同一套解析規則）確認輸出的協定只會是 http／https／blob／相對路徑。
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
function grab(name) { const i = html.indexOf('    function ' + name + '('); if (i < 0) throw new Error('找不到 ' + name); const j = html.indexOf('\n    }\n', i); return html.slice(i, j + 6); }
eval(grab('esc')); eval(grab('safeUrl')); eval('function escUrl(u) { return esc(safeUrl(u)); }');
const BASE = 'https://avaltech-ai.github.io/3of3/';
const proto = s => { try { return new URL(s, BASE).protocol; } catch (e) { return '(無效)'; } };
const SAFE = ['https:', 'http:', 'blob:'];

console.log('A. 各種繞過寫法：輸出的網址解析後都不能是 javascript:／vbscript:／data:text');
const attacks = ['javascript:alert(1)', ' javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)', 'java\rscript:alert(1)', 'java\r\n\tscript:alert(1)', '\u0000javascript:alert(1)', '\u0001javascript:alert(1)', '\u001fjavascript:alert(1)', '\u007fjavascript:alert(1)', 'jav\u0009ascript:alert(1)', '\tjavascript:alert(1)', '\njavascript:alert(1)', 'java script:alert(1)', 'vbscript:msgbox(1)', 'vb\tscript:x', 'data:text/html,<script>alert(1)</script>', 'da\tta:text/html,x', 'data:image/svg+xml,<svg onload=alert(1)>', 'file:///etc/passwd', 'livescript:x', 'mhtml:x', 'jar:https://x.test!/a'];
attacks.forEach(a => {
  const out = safeUrl(a); const p = proto(out);
  const isImgData = /^data:image\//i.test(out);
  ok(out === '' || SAFE.indexOf(p) >= 0 || (isImgData && p === 'data:'), JSON.stringify(a).slice(0, 40).padEnd(42) + ' → ' + JSON.stringify(out).slice(0, 40) + '（解析：' + p + '）');
});
ok(['javascript:', 'vbscript:'].every(x => attacks.every(a => proto(safeUrl(a)) !== x)), '所有攻擊字串：沒有任何一個能解析成 javascript: 或 vbscript:');

console.log('B. 正常網址不受影響');
const goods = ['https://drive.google.com/drive/folders/1Wo6-HKTLyaxFCcvJ5A4SGaffLFLipPvE', 'http://example.test/a?b=c&d=e#f', 'HTTPS://EXAMPLE.TEST/A', 'blob:https://avaltech-ai.github.io/abc-123', 'data:image/png;base64,iVBORw0KGgo=', 'spotlight-fluoride.jpg', 'festival/mother-sticker.svg', '/3of3/icons/icon-192.png', '#section', '?x=1', 'https://x.test/路徑/中文?名稱=值'];
goods.forEach(g => ok(safeUrl(g) === g, '原樣放行：' + g.slice(0, 60)));
ok(safeUrl('  https://x.test/a  ') === 'https://x.test/a' && safeUrl('') === '' && safeUrl(null) === '' && safeUrl(undefined) === '' && safeUrl(5) === '5', '前後空白去掉；空白、null、undefined 回空字串');
ok(escUrl('https://x.test/a?b="c"&d=<e>') === 'https://x.test/a?b=&quot;c&quot;&amp;d=&lt;e&gt;', 'escUrl：放進屬性前會跳脫引號與角括號');
ok(escUrl('java\tscript:alert(1)') === '' && escUrl('javascript:alert(1)') === '', 'escUrl：危險網址回空字串');

console.log('C. 焦點活動的影片網址（getEmbedVideoInfo）：原生影片檔只收安全網址');
eval(grab('getEmbedVideoInfo'));
ok(getEmbedVideoInfo('https://x.test/a.mp4').src === 'https://x.test/a.mp4' && getEmbedVideoInfo('videos/a.webm').type === 'video', '正常的影片檔網址（https、相對路徑）：照常');
['javascript:alert(1)//a.mp4', 'java\tscript:alert(1)//a.mp4', 'data:text/html,<script>x</script>.mp4', 'vbscript:x.mp4', 'file:///etc/a.mp4'].forEach(a => ok(getEmbedVideoInfo(a).type === 'none' && getEmbedVideoInfo(a).src === '', '網址裡含 .mp4 的危險協定：不當成影片，src 為空（' + JSON.stringify(a).slice(0, 36) + '）'));
ok(getEmbedVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ').src.indexOf('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ') === 0 && getEmbedVideoInfo('https://drive.google.com/file/d/ABC123/view').src === 'https://drive.google.com/file/d/ABC123/preview', 'YouTube 與 Drive 影片：照常（固定的主機名稱）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
