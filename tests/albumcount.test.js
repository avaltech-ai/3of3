// 相簿「照片數／影片數」重算測試：recountAlbum（管理員專用，逐本重算並寫回 Albums 工作表）與 getAlbums 帶出 videoCount。
// 執行：node tests/albumcount.test.js
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };

const A = 'AAAAAAAAAAAAAAAAAAAA', B = 'BBBBBBBBBBBBBBBBBBBB', C = 'CCCCCCCCCCCCCCCCCCCC';
const HDR = ['id', 'category', 'title', 'folderName', 'photoCount', 'coverUrl', 'folderUrl', 'updatedAt', 'coverCandidates'];

function env(rows0, folders) { // rows：Albums 工作表（含標題列）；folders：{資料夾id: [mime,...] 或 Error}
  const rows = rows0.map(r => r.slice()); // 深拷貝：共用的 HDR 不能被測試改寫
  const store = {}; let driveCalls = 0;
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = v; }, remove: k => { delete store[k]; }, removeAll: ks => ks.forEach(k => delete store[k]) };
  const chain = { setFontWeight() { return chain; }, setBackground() { return chain; } };
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
    getLastColumn: () => rows.reduce((m, r) => Math.max(m, r.length), 0),
    getLastRow: () => rows.length,
    appendRow: r => { rows.push(r.slice()); },
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const row = []; for (let j = 0; j < (nc || 1); j++) row.push((rows[r - 1 + i] || [])[c - 1 + j] === undefined ? '' : rows[r - 1 + i][c - 1 + j]); out.push(row); } return out; },
      setValue: v => { while (rows.length < r) rows.push([]); const row = rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; return chain; }
    })
  };
  const mkFile = (mime, i) => ({ getMimeType: () => mime, getId: () => 'FILE' + i });
  const mkIter = list => { let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] }; };
  const ctx = {
    console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => cache },
    DriveApp: { getFolderById: id => {
      driveCalls++;
      if (id === ALBUMS_ROOT) return { getFolders: () => mkIter(Object.keys(folders).map(fid => ({ getName: () => 'F' + fid.slice(0, 3), getId: () => fid, getUrl: () => 'https://drive.google.com/drive/folders/' + fid, getDateCreated: () => new Date('2026-04-21T00:00:00Z'), getFiles: () => mkIter((folders[fid] || []).map(mkFile)) }))) };
      const f = folders[id]; if (f === undefined || f === Error) throw new Error('Drive 錯誤');
      return { getFiles: () => mkIter(f.map(mkFile)) };
    } },
    PropertiesService: {}, Utilities: {}, LockService: {}, SpreadsheetApp: {}, ContentService: {}, HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {}
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ALBUMS_ROOT = vm.runInContext('ALBUMS_FOLDER_ID', ctx);
  ctx.getSpreadsheet_ = () => ({ getSheetByName: n => n === 'Albums' ? sheet : null });
  ctx.checkPassword = t => t === 'good-token';
  return { ctx, rows, store, drive: () => driveCalls };
}
const row = (id, photos, extra) => [id, '戶外踏訪', '標題' + id.slice(0, 1), '資料夾' + id.slice(0, 1), photos, 'cover', 'url', '2026-04-21', '[]'].concat(extra || []);
const IMG = 'image/jpeg', VID = 'video/quicktime';

console.log('A. 權限與輸入檢查');
let e = env([HDR, row(A, 45)], { [A]: [IMG, IMG, VID] });
let r = e.ctx.recountAlbum(A, 'bad');
ok(r.success === false && r.authExpired === true && e.drive() === 0 && e.rows[1][4] === 45, '無效 token：拒絕，沒讀 Drive、試算表不動');
r = e.ctx.recountAlbum(A, undefined); ok(r.success === false && r.authExpired === true, '沒帶 token：拒絕');
r = e.ctx.recountAlbum('bad id!!', 'good-token'); ok(r.success === false && e.drive() === 0, '格式不合的相簿編號：拒絕，不讀 Drive');
r = e.ctx.recountAlbum(B, 'good-token'); ok(r.success === false && /尚未登記/.test(r.error) && e.drive() === 0, '沒有登記在 Albums 的資料夾：拒絕，完全沒讀 Drive');

console.log('B. 重算並寫回');
e = env([HDR, row(A, 45), row(B, 7)], { [A]: [IMG, IMG, IMG, VID, VID, 'application/pdf'], [B]: [IMG] });
e.store['albph_' + A] = 'OLD'; e.store['albph_' + B] = 'OLDB'; e.store['app_data_v4'] = 'APPDATA';
r = e.ctx.recountAlbum(A, 'good-token');
ok(r.success && r.photoCount === 3 && r.videoCount === 2 && r.changed === true, '3 張照片＋2 部影片（PDF 不算）：回報 3／2、有變動');
ok(e.rows[0].length === 10 && e.rows[0][9] === 'videoCount', 'Albums 沒有 videoCount 欄：在最右邊補上標題');
ok(e.rows[1][4] === 3 && e.rows[1][9] === 2, 'photoCount 改成 3、videoCount 寫入 2');
ok(e.rows[1][7] === '2026-04-21' && e.rows[1][5] === 'cover' && e.rows[1][8] === '[]', 'updatedAt（NEW 標籤依據）、封面、候選不被改動');
ok(e.rows[2][4] === 7 && e.rows[2][9] === undefined, '其他相簿的資料不動');
ok(!e.store['albph_' + A] && e.store['albph_' + B] === 'OLDB' && e.store['app_data_v4'] === 'APPDATA', '只清這本相簿的清單快取；其他相簿與 getAppData 快取不動');
r = e.ctx.recountAlbum(A, 'good-token'); ok(r.success && r.changed === false && e.rows[0].length === 10, '再算一次結果相同：changed=false、欄位標題不會重複新增');
r = e.ctx.recountAlbum(B, 'good-token'); ok(r.photoCount === 1 && r.videoCount === 0 && e.rows[2][9] === 0 && e.rows[2][4] === 1, '沒有影片的相簿：videoCount 寫 0');
r = e.ctx.recountAlbum(' ' + A + ' ', 'good-token'); ok(r.success === true, '編號前後有空白：照常處理（trim）');

console.log('C. 欄位位置與錯誤');
e = env([['id', 'category', 'title', 'folderName', 'photoCount', 'videoCount', 'coverUrl'], [A, 'c', 't', 'f', 10, 99, 'cv']], { [A]: [VID] });
r = e.ctx.recountAlbum(A, 'good-token'); ok(r.success && e.rows[0].length === 7 && e.rows[1][5] === 1 && e.rows[1][4] === 0 && e.rows[1][6] === 'cv', 'videoCount 欄已存在於中間：沿用該欄、不新增、不覆蓋旁邊的欄位');
e = env([HDR, row(A, 45)], { [A]: Error }); r = e.ctx.recountAlbum(A, 'good-token');
ok(r.success === false && e.rows[1][4] === 45 && e.rows[0].length === 9, 'Drive 讀取失敗：回報失敗，試算表不動（沒有新增欄位）');
e = env([['id', 'title'], [A, 't']], { [A]: [IMG] }); r = e.ctx.recountAlbum(A, 'good-token'); ok(r.success === false && /photoCount/.test(r.error), '缺少 photoCount 欄位：回報清楚的錯誤');
ok(/action === 'recountAlbum'/.test(src) && /recountAlbum\(postData\.albumId \|\| postData\.id, postData\.password\)/.test(src), 'doPost 已註冊且傳入 token');
const gi = src.indexOf('function doGet('), pi = src.indexOf('function doPost(');
ok(gi >= 0 && pi > gi && src.slice(gi, pi).indexOf('recountAlbum') === -1 && src.slice(pi, pi + 30000).indexOf('recountAlbum') > 0, '未放進公開的 doGet（寫入類動作只在 doPost）');

console.log('D. getAlbums 帶出 videoCount');
e = env([HDR.concat(['videoCount']), row(A, 45, [19]), row(B, 12)], { [A]: [IMG], [B]: [IMG] });
let res = e.ctx.getAlbums(); const byId = id => res.albums.find(a => a.id === id);
ok(res.success && byId(A).photoCount === 45 && byId(A).videoCount === 19, '已登記相簿：photoCount 45、videoCount 19（來自試算表，不讀 Drive 檔案）');
ok(byId(B).videoCount === 0, '試算表沒有 videoCount 值：0');
e = env([HDR, row(A, 45)], { [A]: [IMG] }); res = e.ctx.getAlbums(); ok(res.success && res.albums[0].videoCount === 0, '試算表完全沒有 videoCount 欄：0，不出錯');
e = env([HDR.concat(['videoCount']), row(C, 3, [2])], {}); res = e.ctx.getAlbums(); ok(res.albums.length === 1 && res.albums[0].videoCount === 2, '只存在試算表的相簿（不在 Drive）：videoCount 照樣帶出');
e = env([HDR], { [B]: [IMG, IMG, VID, VID, VID] }); res = e.ctx.getAlbums();
ok(res.albums[0].photoCount === 2 && res.albums[0].videoCount === 3, '新登記的相簿（尚未在試算表）：掃描時同時數出照片 2、影片 3');
ok(e.rows.length === 2 && e.rows[0][e.rows[0].indexOf('videoCount')] === 'videoCount' && e.rows[1][e.rows[0].indexOf('videoCount')] === 3 && e.rows[1][4] === 2, '並寫入試算表（photoCount 2、videoCount 3）');
e = env([HDR], { [B]: [IMG] }); res = e.ctx.getAlbums(); ok(e.rows[0].indexOf('videoCount') === -1, '新相簿沒有影片：不為了 0 去新增欄位');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
