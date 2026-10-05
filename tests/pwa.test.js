// 「加到主畫面」設定測試（Node）：manifest 欄位、圖示檔存在且尺寸正確且不透明、index.html 有對應的 link／meta。
// 不透明很重要：iPhone 會把圖示的透明區域顯示成黑色。執行：node tests/pwa.test.js
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m) } else { fail++; console.log('  ✗ FAIL:', m) } };

function pngInfo(file) {
  const d = fs.readFileSync(file);
  if (d.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  const w = d.readUInt32BE(16), h = d.readUInt32BE(20), colorType = d[25];
  return { w, h, colorType, hasAlphaChannel: colorType === 4 || colorType === 6, hasTRNS: d.includes(Buffer.from('tRNS')) };
}

console.log('A. manifest');
const mf = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
ok(mf.short_name === '諾貝爾A' && mf.short_name.length <= 12, 'short_name 為「諾貝爾A」且不超過 12 字（iPhone 主畫面標籤長度）');
ok(typeof mf.name === 'string' && mf.name.length > 0, '有完整名稱 name');
ok(mf.display === 'standalone', 'display = standalone（使用者決定以 App 模式開啟）');
ok(mf.start_url === './' && mf.scope === './' && mf.id === './', 'start_url／scope／id 為相對路徑 ./（GitHub Pages 子路徑 /3of3/ 下才正確）');
ok(/^#[0-9a-fA-F]{6}$/.test(mf.theme_color) && /^#[0-9a-fA-F]{6}$/.test(mf.background_color), '顏色為 6 碼十六進位');
ok(mf.lang === 'zh-Hant', 'lang = zh-Hant');
const sizes = (mf.icons || []).map(i => i.sizes + ':' + i.purpose).join();
ok(/192x192:any/.test(sizes) && /512x512:any/.test(sizes) && /512x512:maskable/.test(sizes), '含 192／512 一般圖示與 512 maskable 圖示（' + sizes + '）');

console.log('B. 圖示檔');
const files = new Set((mf.icons || []).map(i => i.src)); files.add('icons/apple-touch-icon.png');
for (const f of files) {
  const full = path.join(root, f), exists = fs.existsSync(full);
  ok(exists, f + ' 存在');
  if (!exists) continue;
  const info = pngInfo(full);
  ok(!!info, f + ' 是有效的 PNG');
  if (!info) continue;
  const decl = (mf.icons || []).find(i => i.src === f);
  const want = decl ? decl.sizes : '180x180';
  ok(info.w + 'x' + info.h === want, f + ' 實際尺寸 ' + info.w + 'x' + info.h + ' 與宣告 ' + want + ' 相符');
  ok(!info.hasAlphaChannel && !info.hasTRNS, f + ' 不透明（沒有 alpha 通道，iPhone 不會把背景顯示成黑色）');
}

console.log('C. index.html');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const head = html.slice(0, html.indexOf('</head>'));
ok(/<link rel="manifest" href="manifest\.webmanifest">/.test(head), '有 manifest 連結（相對路徑）');
ok(/<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/.test(head), '有 apple-touch-icon');
ok(/<meta name="apple-mobile-web-app-title" content="諾貝爾A">/.test(head), 'iOS 主畫面名稱「諾貝爾A」');
ok(/<meta name="apple-mobile-web-app-capable" content="yes">/.test(head) && /<meta name="mobile-web-app-capable" content="yes">/.test(head), '有 App 模式 meta（iOS 與 Android）');
ok(!/href="\/(manifest|icons)/.test(head), '沒有以 / 開頭的絕對路徑（會指到網域根目錄而 404）');
ok(!/serviceWorker/.test(html), '沒有 service worker（不做離線快取，避免卡在舊版）');
ok(/id="appRefreshBtn"/.test(html), '標頭有重新整理鈕（App 模式沒有瀏覽器重新整理）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
