// 學期「主題架構圖」後端測試：ThemeSemesters.overviewImage 欄（Drive 連結或檔案 ID）→ getThemesData().overviews → getAppData 的 themeOverviews。
// 執行：node tests/themeoverview.test.js
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const ID = '1QMSKstvzHuprCzZTj0MSwDGIuuY-ELHi';

function env(semRows, themeRows) { // semRows、themeRows：含標題列的 2D 陣列
  const sems = semRows.map(r => r.slice()), themes = themeRows.map(r => r.slice());
  const chain = { setFontWeight() { return chain; }, setBackground() { return chain; } };
  const mkSheet = rows => ({
    getDataRange: () => ({ getValues: () => rows.map(r => r.slice()) }),
    getLastColumn: () => rows.reduce((m, r) => Math.max(m, r.length), 0),
    getLastRow: () => rows.length, appendRow: r => { rows.push(r.slice()); }, setFrozenRows() {},
    getRange: (r, c, nr, nc) => ({
      getValues: () => { const out = []; for (let i = 0; i < (nr || 1); i++) { const row = []; for (let j = 0; j < (nc || 1); j++) { const v = (rows[r - 1 + i] || [])[c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); } return out; },
      setValue: v => { while (rows.length < r) rows.push([]); const row = rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; return chain; },
      setValues: vs => { vs.forEach((vr, i) => vr.forEach((v, j) => { while (rows.length < r + i) rows.push([]); const row = rows[r - 1 + i]; while (row.length < c + j) row.push(''); row[c - 1 + j] = v; })); return chain; }
    })
  });
  const semSheet = mkSheet(sems), themeSheet = mkSheet(themes);
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => ({ get: () => null, put() {}, remove() {} }) }, PropertiesService: {}, Utilities: {}, LockService: {}, SpreadsheetApp: {}, ContentService: {}, HtmlService: {}, UrlFetchApp: {}, DriveApp: {}, Session: {}, ScriptApp: {} };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet = () => ({ getSheetByName: n => n === 'ThemeSemesters' ? semSheet : (n === 'Themes' ? themeSheet : null) });
  return { ctx, sems, themes };
}
const THEME_H = ['id', 'semester', 'week', 'startDate', 'endDate', 'themeName', 'themeConcept', 'goals', 'photos', 'updatedAt'];

console.log('A. 從儲存格取出 Drive 檔案 ID');
let e = env([['semesterName']], [THEME_H]); const f = e.ctx.driveFileIdFromCell_;
ok(f(ID) === ID, '直接貼檔案 ID');
ok(f('https://drive.google.com/file/d/' + ID + '/view?usp=sharing') === ID, '貼「共用連結」（/file/d/<id>/view?usp=sharing）');
ok(f('https://drive.google.com/file/d/' + ID + '/view') === ID && f('https://drive.google.com/file/d/' + ID) === ID, '連結結尾是 /view 或沒有結尾');
ok(f('https://drive.google.com/open?id=' + ID) === ID && f('https://drive.google.com/uc?export=view&id=' + ID) === ID && f('https://drive.google.com/uc?id=' + ID + '&export=download') === ID, 'open?id= 與 uc?id= 兩種連結');
ok(f('  ' + ID + '  ') === ID, '前後有空白：trim');
ok(f('') === '' && f(null) === '' && f(undefined) === '' && f(12345) === '', '空白、null、數字：空字串');
ok(f('短字串') === '' && f('abc') === '' && f('hello world this is not an id!!') === '', '不像 ID 的文字：空字串');
ok(f('https://example.com/page?x=1') === '', '不是 Drive 連結：空字串');
ok(f('"><script>alert(1)</script>') === '' && f('1abc"onerror="x') === '', '含惡意字元：空字串（前端會用 ID 組網址）');
ok(f('https://drive.google.com/file/d/' + ID + '"><img src=x>/view') === '', '連結中夾帶惡意字元：不採用');

console.log('B. 學期 → 圖檔對照');
let r = e.ctx.parseThemeOverviews_([{ semesterName: '115 學年上學期', overviewImage: 'https://drive.google.com/file/d/' + ID + '/view' }, { semesterName: '115 學年下學期', overviewImage: '' }, { semesterName: '  114 學年下學期  ', overviewImage: ID }, { semesterName: '', overviewImage: ID }, { semesterName: '壞的', overviewImage: 'not an id' }]);
ok(JSON.stringify(r) === JSON.stringify({ '115 學年上學期': ID, '114 學年下學期': ID }), '只留有學期名稱且圖檔有效的列（空白、格式不合、沒有學期名稱的略過；名稱 trim）');
ok(JSON.stringify(e.ctx.parseThemeOverviews_([])) === '{}' && JSON.stringify(e.ctx.parseThemeOverviews_(null)) === '{}' && JSON.stringify(e.ctx.parseThemeOverviews_([{ semesterName: 'x' }])) === '{}', '沒有資料：空物件，不出錯');

console.log('C. 欄位標題自動補上');
e = env([['semesterName'], ['115 學年上學期'], ['115 學年下學期']], [THEME_H]); e.ctx.ensureThemeSheetsExist();
ok(e.sems[0].join() === 'semesterName,overviewImage' && e.sems[1][0] === '115 學年上學期' && e.sems[2].length === 1, 'ThemeSemesters 只有一欄：在右邊補上 overviewImage 標題，原有資料不動');
e.ctx.ensureThemeSheetsExist(); ok(e.sems[0].length === 2, '再執行一次：不會重複新增欄位');
e = env([['semesterName', 'overviewImage'], ['115 學年上學期', ID]], [THEME_H]); e.ctx.ensureThemeSheetsExist(); ok(e.sems[0].length === 2 && e.sems[1][1] === ID, '已有 overviewImage 欄：沿用，已貼的連結不動');
e = env([['overviewImage', 'semesterName'], [ID, 'x']], [THEME_H]); e.ctx.ensureThemeSheetsExist(); ok(e.sems[0].length === 2, '欄位順序不同也認得（以標題名稱判斷）');

console.log('D. getThemesData / getAppData');
e = env([['semesterName', 'overviewImage'], ['115 學年上學期', 'https://drive.google.com/file/d/' + ID + '/view?usp=sharing'], ['115 學年下學期', '']], [THEME_H, ['T1', '115 學年上學期', '第一週', '2026-08-03', '2026-08-07', '我的班級新生活', '', '[]', '[]', '2026-08-01']]);
let td = e.ctx.getThemesData();
ok(td.semesters.join() === '115 學年上學期,115 學年下學期' && td.themes.length === 1, '原有的學期清單與主題不受影響（學期仍是字串清單）');
ok(JSON.stringify(td.overviews) === JSON.stringify({ '115 學年上學期': ID }), 'getThemesData().overviews：只有 115 學年上學期，值是純 ID（不是連結）');
e = env([['semesterName'], ['115 學年上學期']], [THEME_H]); td = e.ctx.getThemesData(); ok(JSON.stringify(td.overviews) === '{}' && td.semesters.length === 1, '尚未設定任何圖：overviews 為空物件');
ok(/themeOverviews:\s*themeOverviews/.test(src) && /themeOverviews = themeData\.overviews \|\| \{\}/.test(src), 'getAppData 的回應含 themeOverviews（讀不到時退回空物件）');
const gi = src.indexOf('function saveTheme('); ok(src.slice(gi, gi + 6000).indexOf('overviewImage') === -1, '儲存主題（saveTheme）不碰 overviewImage（不會被後台儲存覆蓋）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
