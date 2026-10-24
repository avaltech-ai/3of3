// getAppData 快取壓縮與公開資料瘦身測試（2026-10-24）。
// 背景：公開資料 getAppData 已到 85.7 KB，雲端快取單筆上限 100 KB，只剩約 14 KB；超過後快取靜默失敗、每次載入要重讀整份試算表（7～12 秒）。
// 做法：A. 存進快取前先 gzip＋base64（前綴 gz1:），實測 85.7 KB → 約 35 KB；讀取時兩種格式都認得（舊的純 JSON 也行）。
//       B. 公開資料不再重複放同一份內容：主題的 name／concept／results（與 themeName／themeConcept／photos 相同）、活動的「行事曆提示」（與 calendarPrompt 相同）。
// 執行：node tests/appdatacache.test.js
const fs = require('fs'), vm = require('vm'), zlib = require('zlib');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

// 模擬 Apps Script 的 Utilities：位元組陣列是「有號」的（-128～127），與真正的 getBytes() 一致，確保程式不依賴無號數
const signed = buf => Array.from(buf, b => (b > 127 ? b - 256 : b));
const unsigned = arr => Buffer.from(arr.map(b => b & 255));
function mkBlob(data, type) {
  const bytes = typeof data === 'string' ? signed(Buffer.from(data, 'utf8')) : data.slice();
  return { getBytes: () => bytes, getContentType: () => type || 'application/octet-stream', getDataAsString: () => unsigned(bytes).toString('utf8') };
}
const UtilitiesFull = {
  newBlob: (d, t) => mkBlob(d, t),
  gzip: blob => mkBlob(signed(zlib.gzipSync(unsigned(blob.getBytes()))), 'application/x-gzip'),
  ungzip: blob => mkBlob(signed(zlib.gunzipSync(unsigned(blob.getBytes()))), 'application/octet-stream'),
  base64Encode: bytes => unsigned(bytes).toString('base64'),
  base64Decode: s => signed(Buffer.from(String(s), 'base64'))
};

function env(opts) {
  opts = opts || {};
  const store = {}; let ssCalls = 0;
  const cache = { get: k => (k in store ? store[k] : null), put: (k, v) => { if (String(v).length > 100000) throw new Error('Argument too large: value'); store[k] = v; }, remove: k => { delete store[k]; }, removeAll: ks => ks.forEach(k => delete store[k]), putAll(o) { Object.keys(o).forEach(k => cache.put(k, o[k])); } };
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => cache }, PropertiesService: {}, Utilities: opts.noGzip ? { formatDate() { return ''; } } : UtilitiesFull, LockService: {}, SpreadsheetApp: {}, DriveApp: {}, ContentService: {}, HtmlService: {}, ScriptApp: {} };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet_ = () => { ssCalls++; return null; };
  return { ctx, store, ssCalls: () => ssCalls };
}

// 接近正式資料的樣子：中文、重複的欄位名稱、隨機的 Drive 檔案編號
const rid = () => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'; let s = '1'; for (let i = 0; i < 32; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
function sampleData(scale) {
  const albums = [], events = [];
  for (let i = 0; i < 20 * scale; i++) albums.push({ id: rid(), category: '學習區', title: '2026.10 諾貝爾 A 學習區活動 ' + i, folderName: '2026.10 諾貝爾 A 學習區活動', photoCount: 337, coverUrl: 'https://drive.google.com/thumbnail?id=' + rid() + '&sz=w600', coverCandidates: Array.from({ length: 12 }, rid), folderUrl: 'https://drive.google.com/drive/folders/' + rid() });
  for (let i = 0; i < 35 * scale; i++) events.push({ id: 'EV-' + i, date: '2026-10-' + (10 + i % 20), title: '幸福廚房手作生活體驗 第 ' + i + ' 場', description: '幸福廚房手作生活體驗，請家長協助準備圍裙與毛巾，活動當天請準時到園。', target: '諾貝爾 A、米羅 A', calendarPrompt: '幸福廚房' });
  return { success: true, data: { albums, events, note: '諾貝爾 A 班 🍄' } };
}

console.log('A. 寫入快取：壓縮、讀回一致');
let e = env(); const data = sampleData(1); const rawLen = JSON.stringify(data).length;
ok(typeof e.ctx.appDataCachePut_ === 'function' && typeof e.ctx.appDataCacheGet_ === 'function', '有 appDataCachePut_ 與 appDataCacheGet_');
if (typeof e.ctx.appDataCachePut_ === 'function') {
  const put = e.ctx.appDataCachePut_(data);
  const stored = e.store['app_data_v4'];
  ok(put === true && typeof stored === 'string' && stored.indexOf('gz1:') === 0, '存進快取的是壓縮格式（前綴 gz1:）');
  ok(stored.length < rawLen * 0.8, '壓縮後比原本小（原本 ' + rawLen + ' 字元 → ' + stored.length + '）');
  ok(JSON.stringify(e.ctx.appDataCacheGet_()) === JSON.stringify(data), '讀回的內容與寫入的完全相同（含中文與 Emoji）');
  const big = sampleData(6); const bigRaw = JSON.stringify(big).length;
  e = env(); e.ctx.appDataCachePut_(big);
  ok(bigRaw > 100000 && e.store['app_data_v4'] && e.store['app_data_v4'].length <= 90000, '原始資料超過 100 KB（' + bigRaw + '）時，壓縮後仍放得進快取（' + (e.store['app_data_v4'] || '').length + ' 字元）');
  ok(JSON.stringify(e.ctx.appDataCacheGet_()) === JSON.stringify(big), '大資料讀回一致');
}

console.log('B. 壓縮後仍太大：不寫入、不拋錯、不留舊的');
e = env();
if (typeof e.ctx.appDataCachePut_ === 'function') {
  e.store['app_data_v4'] = 'gz1:OLD';
  let noise = ''; for (let i = 0; i < 400000; i++) noise += Math.floor(Math.random() * 36).toString(36);
  let threw = false, r; try { r = e.ctx.appDataCachePut_({ success: true, data: { noise: noise } }); } catch (x) { threw = true; }
  ok(!threw && r === false, '回傳 false，不拋錯（快取只是加速，失敗不能影響回應）');
  ok(!('app_data_v4' in e.store), '舊的快取被移除（不會留著過期內容）');
}

console.log('C. 讀取：舊的純 JSON、壞掉的、沒有的');
e = env();
if (typeof e.ctx.appDataCacheGet_ === 'function') {
  ok(e.ctx.appDataCacheGet_() === null, '沒有快取：回傳 null');
  e.store['app_data_v4'] = '{"success":true,"data":"OLD"}';
  ok(e.ctx.appDataCacheGet_().data === 'OLD', '舊格式（純 JSON，部署前存的）仍可讀');
  e.store['app_data_v4'] = 'gz1:@@@不是base64@@@';
  ok(e.ctx.appDataCacheGet_() === null, '壓縮內容壞掉：當作沒有快取（不拋錯），會重建');
  e.store['app_data_v4'] = 'gz1:' + Buffer.from('not gzip data').toString('base64');
  ok(e.ctx.appDataCacheGet_() === null, '不是 gzip 的內容：當作沒有快取');
  e.store['app_data_v4'] = '{壞掉的 json';
  ok(e.ctx.appDataCacheGet_() === null, '壞掉的純 JSON：當作沒有快取');
}

console.log('D. 沒有壓縮功能的環境：退回純 JSON');
e = env({ noGzip: true });
if (typeof e.ctx.appDataCachePut_ === 'function') {
  const small = { success: true, data: { a: '中文' } };
  ok(e.ctx.appDataCachePut_(small) === true && e.store['app_data_v4'] === JSON.stringify(small), '沒有 Utilities.gzip：照舊存純 JSON');
  ok(JSON.stringify(e.ctx.appDataCacheGet_()) === JSON.stringify(small), '純 JSON 讀得回來');
}

console.log('E. getAppData 與其他讀快取的地方都認得壓縮格式');
e = env();
if (typeof e.ctx.appDataCachePut_ === 'function') {
  e.ctx.appDataCachePut_({ success: true, data: { albums: [{ id: 'ALBUM_ID_12345' }], x: '壓縮的' } });
  const r = e.ctx.getAppData();
  ok(r.data.x === '壓縮的' && e.ssCalls() === 0, 'getAppData：命中壓縮快取，完全沒開試算表');
  ok(e.ctx.isRegisteredAlbumId_('ALBUM_ID_12345') === true && e.ctx.isRegisteredAlbumId_('OTHER_ID_99999') === false, 'isRegisteredAlbumId_：從壓縮快取判斷相簿是否已登記');
}
const wi = src.indexOf('function warmAlbumPhotos_('), we = src.indexOf('\n}\n', wi);
ok(/appDataCacheGet_\(\)/.test(src.slice(wi, we)) && src.slice(wi, we).indexOf("cache.get('app_data_v4')") < 0, 'warmAlbumPhotos_：改用 appDataCacheGet_（不再直接讀 JSON）');
ok(!/get\('app_data_v4'\)/.test(src) && (src.match(/\.get\(APP_DATA_CACHE_KEY\)/g) || []).length === 1, '整份程式只有 appDataCacheGet_ 一處直接讀這個快取（其餘都經過它，格式才會一致）');
ok(/appDataCachePut_\(result\)/.test(src) && !/put\('app_data_v4',\s*JSON\.stringify/.test(src), 'getAppData 重建後用 appDataCachePut_ 寫入');
ok(/APP_DATA_CACHE_TTL_SEC\s*=\s*600/.test(src), '快取存活時間仍是 10 分鐘（大於預熱間隔 5 分鐘）');

console.log('F. 清除快取仍有效');
e = env();
if (typeof e.ctx.appDataCachePut_ === 'function') { e.ctx.appDataCachePut_({ success: true, data: {} }); e.ctx.clearAppDataCache_(); ok(!('app_data_v4' in e.store), 'clearAppDataCache_ 移除壓縮的快取'); }

console.log('G. 公開資料不再重複放同一份內容');
e = env();
const ev = e.ctx.eventsPublicView_ ? e.ctx.eventsPublicView_([
  { id: 'A', calendarPrompt: '牙齒塗氟', '行事曆提示': '牙齒塗氟', title: 't' },
  { id: 'B', calendarPrompt: '', '行事曆提示': '舊欄位的提示', title: 't' },
  { id: 'C', calendarPrompt: '新欄位優先', '行事曆提示': '舊欄位不同', title: 't' },
  { id: 'D', title: '沒有提示欄位' }
]) : null;
ok(!!ev && ev.every(x => !('行事曆提示' in x)), '活動：公開資料沒有「行事曆提示」這個重複欄位');
ok(!!ev && ev[0].calendarPrompt === '牙齒塗氟' && ev[1].calendarPrompt === '舊欄位的提示' && ev[2].calendarPrompt === '新欄位優先', 'calendarPrompt 有值就用它；空白時由舊欄位補上（不遺失只填舊欄位的提示）');
ok(!!ev && !('calendarPrompt' in ev[3]) || (ev && ev[3].calendarPrompt === ''), '兩個欄位都沒有：不憑空多出內容');
const th = e.ctx.normalizeThemeRow_ ? e.ctx.normalizeThemeRow_({ id: 'T1', semester: ' 115 上 ', week: '第一週', startDate: '2026-10-05', endDate: '2026-10-09', themeName: ' 我的家 ', themeConcept: '概念', goals: '[{"activity":"a","course":"c"}]', photos: '["https://drive.google.com/file/d/X/view"]' }) : null;
ok(!!th && !('name' in th) && !('concept' in th) && !('results' in th), '主題：公開資料沒有 name、concept、results 這三個重複欄位');
ok(!!th && th.themeName === '我的家' && th.themeConcept === '概念' && th.photos.length === 1 && th.goals[0].activity === 'a' && th.dateRange === '2026-10-05 ~ 2026-10-09' && th.semester === '115 上', '主題：themeName、themeConcept、photos、goals、dateRange 都照常');
ok(/theme\.themeName \|\| theme\.name/.test(fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8')) && /theme\.photos \|\| theme\.results/.test(fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8')), '前台本來就是「新欄位優先、舊欄位備援」，少了舊欄位不影響顯示');
ok(/const events = eventsPublicView_\(getSheetDataAsObjects_\(ss\.getSheetByName\('Events'\)\)\);/.test(src), 'getAppData 讀出活動後會經過 eventsPublicView_（不是只有定義這個函式）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
