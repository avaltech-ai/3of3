// 自由文字英文對照表（TextMap）後端測試：掃描、同步（不覆蓋）、機器草稿（不公開）、採用草稿、回傳與大型快取、doGet 唯讀動作。
// 以模擬的 Sheets／LanguageApp 執行，不碰真實資料。執行：node tests/textmap.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkSheet(rows) {
  const sh = { rows: rows.map(r => r.slice()) };
  const width = () => sh.rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cell = (r, c) => ((sh.rows[r - 1] || [])[c - 1] === undefined ? '' : sh.rows[r - 1][c - 1]);
  sh.getLastRow = () => sh.rows.length;
  sh.getLastColumn = () => width();
  sh.getDataRange = () => ({ getValues: () => sh.rows.map(r => { const c = r.slice(); while (c.length < width()) c.push(''); return c; }) });
  sh.getRange = (r, c, nr, nc) => {
    const R = nr || 1, C = nc || 1;
    const self = {
      getValues: () => { const out = []; for (let i = 0; i < R; i++) { const row = []; for (let j = 0; j < C; j++) row.push(cell(r + i, c + j)); out.push(row); } return out; },
      setValue(v) { return self.setValues([[v]]); },
      setValues(vals) { for (let i = 0; i < vals.length; i++) { while (sh.rows.length < r + i) sh.rows.push([]); const row = sh.rows[r - 1 + i]; for (let j = 0; j < vals[i].length; j++) { while (row.length < c + j) row.push(''); row[c - 1 + j] = vals[i][j]; } } return self; },
      setNumberFormat() { return self; }, setFontWeight() { return self; }, setBackground() { return self; }
    };
    return self;
  };
  sh.appendRow = row => { sh.rows.push(row.slice()); };
  return sh;
}

function env(sheets, opts) {
  opts = opts || {};
  const book = {}; Object.keys(sheets || {}).forEach(k => { book[k] = mkSheet(sheets[k]); });
  const store = {}; let ensureCalls = 0, translateCalls = 0; const translated = [];
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = String(v); }, remove: k => { delete store[k]; },
    putAll: (o) => { Object.keys(o).forEach(k => { store[k] = String(o[k]); }); }, removeAll: ks => ks.forEach(k => delete store[k]) };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    LanguageApp: { translate: (text, from, to) => { translateCalls++; translated.push([text, from, to]); if (opts.translate) return opts.translate(text); return 'EN(' + text + ')'; } },
    Utilities: {}, DriveApp: {}, HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {},
    ContentService: { MimeType: { JSON: 'JSON', ICAL: 'ICAL' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this; } }) },
    SpreadsheetApp: { getUi: () => { throw new Error('no UI'); } }
  };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const ss = { getSheetByName: n => book[n] || null, insertSheet: n => { book[n] = mkSheet([]); return book[n]; } };
  ctx.getSpreadsheet = () => ss; ctx.ensureAlbumSheetsExist = () => { ensureCalls++; };
  ctx.getAppData = () => ({ success: true, data: opts.data || {} });
  return { ctx, ss, book, store, ensureCalls: () => ensureCalls, translateCalls: () => translateCalls, translated };
}
const DATA = () => ({
  events: [{ id: 'E1', title: '八月壽星慶生', description: '八月份壽星慶祝活動\n請家長準時接送', timeLocation: '17:00 開始', theme: '快樂上學趣', calendarPrompt: '' },
           { id: 'E2', title: '八月壽星慶生', description: '', timeLocation: '1899-12-30', theme: '快樂上學趣' }],
  menus: [{ date: '2026-10-01', morningSnack: '紅藜雙色饅頭、米漿', fruit: '當季水果', lunchStaple: '糙白米飯', lunchMain: '青椒炒雞柳', lunchSide1: '木須炒蛋', lunchSide2: '', lunchSoup: '玉米濃湯', afternoonSnack: '滑蛋雞肉粥', note: '本園未使用不合格油品' },
          { date: '2026-10-02', morningSnack: '紅藜雙色饅頭、米漿', fruit: '當季水果', lunchStaple: '糙白米飯', lunchMain: '香煎魚排', note: '' }],
  themes: [{ id: 'T1', themeName: '書本大探索', name: '書本大探索', themeConcept: '喜歡閱讀', concept: '喜歡閱讀', goals: [{ activity: '聆聽《公主的願望》', course: '語-1-5 理解圖畫書' }], semester: '115 學年上學期' }],
  spotlights: [{ title: '牙齒塗氟日', subtitle: '日期：2026/10/23 (五) 08:30 起全園分班檢查', tags: '', bulletPoints: '【衛教宣導】正確刷牙示範\n\n【注意事項】請攜帶「健保卡」' },
               { title: '幸福廚房', subtitle: '2026/10/07（三）11:40', bulletPoints: '' }],
  albums: [{ id: 'a', title: '2026.09 諾貝爾 A 大肌肉活動' }, { id: 'b', title: 'English Only Album' }],
  docs: [{ id: 'd', fileName: '牙齒塗氟同意書.pdf', description: '請家長填寫後交回' }]
});

console.log('A. 文字正規化與判斷');
let e = env({}); const c = e.ctx;
ok(c.normalizeText_('  白飯 \u3000 糙米  ') === '白飯 糙米', '連續空白（含全形空白）合併、去頭尾');
ok(eq(Array.from(c.textUnits_('第一行\r\n\n  第二行  \n')), ['第一行', '第二行']), '多行文字拆成行、去空行、正規化');
ok(eq(Array.from(c.textUnits_(null)), []) && eq(Array.from(c.textUnits_(undefined)), []) && eq(Array.from(c.textUnits_('')), []), 'null／undefined／空字串 → 沒有條目');
ok(c.textIsDateLike_('2026/10/07（三）11:40') && c.textIsDateLike_('08:30') && c.textIsDateLike_('2026-10-07') && c.textIsDateLike_('週三 10:00'), '只含日期時間星期 → 不需翻譯');
ok(!c.textIsDateLike_('17:00 開始') && !c.textIsDateLike_('日期：2026/10/23 (五) 08:30 起全園分班檢查'), '含其他中文字 → 仍需翻譯');
ok(c.textNeedsTranslation_('白飯') && !c.textNeedsTranslation_('English Only') && !c.textNeedsTranslation_('') && !c.textNeedsTranslation_('12:30'), '需要翻譯＝含中文且不只是日期時間');

console.log('B. 掃描 collectTextSources_');
const col = c.collectTextSources_(DATA());
const has = z => Object.prototype.hasOwnProperty.call(col.units, z);
ok(has('八月壽星慶生') && has('八月份壽星慶祝活動') && has('請家長準時接送'), '活動標題、說明（多行以行為單位）');
ok(has('17:00 開始') && !has('1899-12-30'), '時間地點收錄；被誤轉成日期的值略過');
ok(has('紅藜雙色饅頭、米漿') && has('糙白米飯') && has('玉米濃湯') && has('本園未使用不合格油品'), '每日菜單各欄位');
ok(has('書本大探索') && has('喜歡閱讀') && has('聆聽《公主的願望》') && has('語-1-5 理解圖畫書'), '主題活動名稱、概念與活動／課程目標');
ok(has('【衛教宣導】正確刷牙示範') && has('【注意事項】請攜帶「健保卡」') && has('日期：2026/10/23 (五) 08:30 起全園分班檢查'), '焦點活動：重點以行為單位、含文字的副標題');
ok(!has('2026/10/07（三）11:40'), '只含日期時間的副標題不收錄');
ok(has('2026.09 諾貝爾 A 大肌肉活動') && !has('English Only Album') && has('牙齒塗氟同意書.pdf') && has('請家長填寫後交回'), '相簿標題、文件名稱與說明；純英文不收錄');
ok(eq(col.units['八月壽星慶生'].labels, ['活動：標題']) && eq(col.units['當季水果'].labels, ['每日菜單：水果']) && col.units['書本大探索'].labels.length === 1, '重複出現的文字只收一次；出處標籤不重複');
ok(col.order.filter(z => z === '八月壽星慶生').length === 1 && col.order.filter(z => z === '當季水果').length === 1, '兩天都有的「當季水果」只出現一次');
ok(eq(c.collectTextSources_(null).order, []) && eq(c.collectTextSources_({ events: [null, { title: '甲' }], themes: [null, { goals: [null, { activity: '乙' }] }] }).order, ['甲', '乙']), '資料為 null／含 null 列也不拋錯');
ok(!c.collectTextSources_({ events: [{ title: '__proto__' }] }).order.length, '__proto__ 不收錄（避免汙染）');

console.log('C. 同步 syncTextMap_（不覆蓋）');
e = env({}, { data: DATA() });
let r = e.ctx.syncTextMap_();
let sh = e.book.TextMap;
ok(sh && eq(sh.rows[0], ['zh', 'en', 'draft', 'used_in', 'note']), '自動建立 TextMap 工作表與表頭');
ok(r.added === col.order.length && sh.rows.length === col.order.length + 1, '新增 ' + r.added + ' 筆，每個文字一列');
ok(sh.rows.slice(1).every(row => row[1] === '' && row[2] === ''), '新列的 en 與 draft 都留空（前台暫時顯示中文）');
const rowIdx = z => sh.rows.findIndex(row => row[0] === z);
sh.rows[rowIdx('當季水果')][1] = 'Seasonal fruit'; sh.rows[rowIdx('糙白米飯')][2] = 'Brown rice';
const snap = JSON.stringify(sh.rows.map(row => [row[1], row[2]]));
r = e.ctx.syncTextMap_();
ok(r.added === 0 && JSON.stringify(sh.rows.map(row => [row[1], row[2]])) === snap, '再次同步：沒有新增、所有 en 與 draft 完全不變（冪等）');
ok(sh.rows[rowIdx('當季水果')][3].indexOf('每日菜單：水果') >= 0, '出處欄更新');
const d2 = DATA(); d2.menus = d2.menus.slice(1); e.ctx.getAppData = () => ({ success: true, data: d2 });
r = e.ctx.syncTextMap_();
ok(sh.rows[rowIdx('玉米濃湯')][3] === '（目前沒有使用）' && sh.rows[rowIdx('當季水果')][1] === 'Seasonal fruit', '資料移除的文字：列保留（en 不刪）、出處標示目前沒有使用');
d2.events[0].title = '新的活動名稱'; r = e.ctx.syncTextMap_();
ok(r.added === 1 && rowIdx('新的活動名稱') > 0 && rowIdx('八月壽星慶生') > 0, '改了中文原文：新原文新增一列，舊列保留（舊翻譯自動不再套用）');
e.ctx.getAppData = () => ({ success: true, data: { events: [{ title: '=SUM(1,2)我的活動' }, { title: '+1 號活動' }] } });
const e3 = env({}, { data: { events: [{ title: '=SUM(1,2)我的活動' }, { title: '+1 號活動' }] } }); e3.ctx.syncTextMap_();
ok(e3.book.TextMap.rows.slice(1).every(row => !/^[=+\-@]/.test(row[0])), '以 = + - @ 開頭的內容加上前置符號，不會被當成公式');
const e4 = env({}); e4.ctx.getAppData = () => ({ success: false, error: 'x' });
let threw = false; try { e4.ctx.syncTextMap_(); } catch (x) { threw = true; }
ok(threw && !e4.book.TextMap, '讀不到資料：拋錯，且不建立或改動任何工作表');
const big = { events: Array.from({ length: 3100 }, (_, i) => ({ title: '活動' + i })) };
const e5 = env({}, { data: big }); r = e5.ctx.syncTextMap_();
ok(r.capped === true && e5.book.TextMap.rows.length === 3001, '超過 3000 列上限：停止新增並提醒');
let fresh = false; const e6 = env({}, { data: DATA() }); e6.ctx.getAppData = () => { fresh = vm.runInContext('APP_DATA_FORCE_REFRESH_', e6.ctx); return { success: true, data: DATA() }; };
e6.ctx.syncTextMap_(); ok(fresh === true, '同步時強制讀最新資料（不使用 10 分鐘快取）');
const e7 = env({}, { data: DATA() }); e7.ctx.syncTextMap_(); e7.book.TextMap.rows = e7.book.TextMap.rows.map(rw => [rw[1], rw[0], rw[2], rw[3], rw[4]]);
let swapOk = true; try { e7.ctx.syncTextMap_(); } catch (x) { swapOk = false; } ok(swapOk, '老師調換欄位順序（表頭不動）也不會拋錯');

console.log('D. 機器草稿 draftTextMap_（只寫 draft、不公開）');
e = env({}, { data: DATA() }); e.ctx.syncTextMap_(); sh = e.book.TextMap;
const ridx = z => sh.rows.findIndex(row => row[0] === z);
sh.rows[ridx('當季水果')][1] = '老師填的英文'; sh.rows[ridx('糙白米飯')][2] = '既有草稿';
let dr = e.ctx.draftTextMap_(1000);
const total = sh.rows.length - 1;
ok(dr.drafted === total - 2 && e.translateCalls() === total - 2, '只翻譯「en 與 draft 都空白」的列（' + dr.drafted + ' 筆；跳過 en 已填與已有草稿的）');
ok(sh.rows[ridx('當季水果')][1] === '老師填的英文' && sh.rows[ridx('當季水果')][2] === '' && sh.rows[ridx('糙白米飯')][2] === '既有草稿', 'en 欄與既有草稿完全不動');
ok(sh.rows.slice(1).every(row => row[1] === '' || row[0] === '當季水果'), '所有草稿都沒有寫進 en 欄（不會自動公開）');
ok(e.translated.every(t => t[1] === 'zh-TW' && t[2] === 'en'), '翻譯方向：zh-TW → en');
ok(sh.rows[ridx('玉米濃湯')][2] === 'EN(玉米濃湯)', '草稿內容寫入 draft 欄');
e = env({}, { data: DATA() }); e.ctx.syncTextMap_(); sh = e.book.TextMap;
dr = e.ctx.draftTextMap_(5);
ok(dr.drafted === 5 && dr.remaining === sh.rows.length - 1 - 5, '每次最多 limit 筆，回報剩餘（' + dr.remaining + '）');
dr = e.ctx.draftTextMap_(100000);
ok(dr.drafted === e.translated.length - 5 && e.translated.length <= 80 + 5, '單次上限 80 筆（即使要求更多）');
e = env({}, { data: { events: [{ title: '甲' }, { title: '乙' }, { title: '丙' }] }, translate: z => z === '乙' ? '' : (z === '丙' ? '=HYPERLINK("x")' : 'A\u0007\u0000B  C') }); e.ctx.syncTextMap_(); sh = e.book.TextMap;
dr = e.ctx.draftTextMap_(10);
const g = z => sh.rows.find(row => row[0] === z)[2];
ok(g('甲') === 'A B C' && g('乙') === '' && /^'=/.test(g('丙')) && dr.errors === 1, '草稿清理控制字元與多餘空白；空結果略過並計為失敗；公式開頭加前置符號');
let calls = 0; e = env({}, { data: { events: [{ title: '甲' }, { title: '乙' }, { title: '丙' }] }, translate: z => { calls++; if (calls === 2) throw new Error('Service invoked too many times: language'); return 'x'; } }); e.ctx.syncTextMap_();
dr = e.ctx.draftTextMap_(10);
ok(dr.stoppedByQuota === true && dr.drafted === 1 && calls === 2, '遇到每日額度用盡：立刻停止，已完成的保留');
e = env({}, { data: { events: [{ title: '甲' }, { title: '乙' }] }, translate: z => { if (z === '甲') throw new Error('network'); return 'ok'; } }); e.ctx.syncTextMap_(); dr = e.ctx.draftTextMap_(10);
ok(dr.errors === 1 && dr.drafted === 1 && !dr.stoppedByQuota, '一般翻譯錯誤：略過該筆、繼續其他');
e = env({}, { data: DATA() }); e.ctx.syncTextMap_(); e.book.TextMap.rows.forEach(rw => { if (rw[0] === '玉米濃湯') rw[3] = '（目前沒有使用）'; });
e.ctx.draftTextMap_(1000); ok(!e.translated.some(t => t[0] === '玉米濃湯'), '目前沒有使用的文字不翻譯（不浪費額度）');
let uiThrew = false; try { e.ctx.menuDraftTextMap(); } catch (x) { uiThrew = true; } ok(uiThrew, '選單函式在沒有試算表介面時無法執行（只能由擁有者從試算表按）');

console.log('E. 採用草稿 adoptTextDrafts_');
e = env({}, { data: DATA() }); e.ctx.syncTextMap_(); sh = e.book.TextMap;
const ri = z => sh.rows.findIndex(row => row[0] === z);
sh.rows[ri('當季水果')][1] = '老師版'; sh.rows[ri('當季水果')][2] = '機器版'; sh.rows[ri('玉米濃湯')][2] = 'Corn soup'; sh.rows[ri('糙白米飯')][2] = '  ';
const n = e.ctx.adoptTextDrafts_();
ok(n === 1 && sh.rows[ri('玉米濃湯')][1] === 'Corn soup', '把「en 空白、draft 有內容」的草稿複製到 en（' + n + ' 筆）');
ok(sh.rows[ri('當季水果')][1] === '老師版' && sh.rows[ri('糙白米飯')][1] === '', 'en 已有內容的不覆蓋；draft 只有空白的不採用');
ok(e.ctx.adoptTextDrafts_() === 0, '再按一次：沒有可採用的（冪等）');
let uiThrew2 = false; try { e.ctx.menuAdoptTextDrafts(); } catch (x) { uiThrew2 = true; } ok(uiThrew2, '選單函式只能在試算表介面執行');

console.log('F. 回傳給前台 getTextMapForApp_ / getTextMap');
const mapSheet = [['zh', 'en', 'draft', 'used_in', 'note'], ['白飯', 'Rice', '機器飯', '', ''], ['香蕉', '', 'Banana', '', ''], ['牛奶', '', '', '', ''], ['', 'orphan', '', '', ''], ['長', 'x'.repeat(900), '', '', ''], ['控\u0001制', 'AB\u0002C', '', '', ''], ['白飯', 'Dup', '', '', ''], ['__proto__', 'polluted', '', '', ''], ['  多   空白 ', 'Spaces', '', '', '']];
e = env({ TextMap: mapSheet });
let out = e.ctx.getTextMapForApp_(e.ss, false);
ok(out['白飯'] === 'Rice' && !('香蕉' in out) && !('牛奶' in out) && !('' in out), '預設只回傳 en 有填的列；draft 不公開');
ok(out['多 空白'] === 'Spaces', '中文原文以正規化後的為準');
ok(out['長'].length === 600 && out['控制'] === undefined && out['控\u0001制'] === 'ABC', '英文過長截斷到 600；控制字元移除');
ok(out['白飯'] === 'Rice' && vm.runInContext('({}).polluted', e.ctx) === undefined && !Object.prototype.hasOwnProperty.call(out, '__proto__'), '重複列只取第一列；__proto__ 不會汙染');
out = e.ctx.getTextMapForApp_(e.ss, true);
ok(out['香蕉'] === 'Banana' && out['白飯'] === 'Rice' && !('牛奶' in out), '開啟顯示機器翻譯：en 空白時改用 draft，en 有填的仍優先');
e = env({}); ok(eq(e.ctx.getTextMapForApp_(e.ss, false), {}), '沒有 TextMap 工作表 → 空物件');
e = env({ TextMap: [['別的', '欄位'], ['a', 'b']] }); ok(eq(e.ctx.getTextMapForApp_(e.ss, false), {}), '欄位名稱不對 → 空物件');

console.log('G. getTextMap 與快取');
e = env({ TextMap: mapSheet, Settings: [['key', 'value'], ['ADMIN_PASSWORD', 'x']] });
let res = e.ctx.getTextMap();
ok(res.success === true && res.map['白飯'] === 'Rice' && !('香蕉' in res.map) && res.count === Object.keys(res.map).length, 'getTextMap：預設不含草稿');
const e8 = env({ TextMap: mapSheet, Settings: [['key', 'value'], ['SHOW_MACHINE_TRANSLATION', 'TRUE']] });
ok(e8.ctx.getTextMap().map['香蕉'] === 'Banana', 'Settings 的 SHOW_MACHINE_TRANSLATION = TRUE → 顯示機器草稿');
const e9 = env({ TextMap: mapSheet, Settings: [['key', 'value'], ['SHOW_MACHINE_TRANSLATION', 'false']] });
ok(!('香蕉' in e9.ctx.getTextMap().map), 'SHOW_MACHINE_TRANSLATION = false → 不顯示');
let ssReads = 0; const origGet = e.ss.getSheetByName; e.ss.getSheetByName = n => { ssReads++; return origGet(n); };
e.ctx.getTextMap(); ok(ssReads === 0, '第二次呼叫命中快取：完全不讀試算表');
e.ctx.clearAppDataCache(); ssReads = 0; e.ctx.getTextMap(); ok(ssReads > 0, 'clearAppDataCache（任何寫入）會一併清除英文對照快取');
const bigRows = [['zh', 'en', 'draft']].concat(Array.from({ length: 1500 }, (_, i) => ['這是第' + i + '句很長的中文原文內容用來撐大回應', 'This is the long English sentence number ' + i + ' used to enlarge the payload', '']));
const eb = env({ TextMap: bigRows }); const big1 = eb.ctx.getTextMap();
const chunkKeys = Object.keys(eb.store).filter(k => /^text_map_v1_\d+$/.test(k));
ok(big1.count === 1500 && chunkKeys.length >= 2, '大型對照表：分段快取（' + chunkKeys.length + ' 段），每段 ≤ 24000 字元');
ok(chunkKeys.every(k => eb.store[k].length <= 24000 && Buffer.byteLength(eb.store[k], 'utf8') < 100000), '每一段都在 CacheService 100KB 位元組上限內');
eb.book.TextMap = null; eb.ss.getSheetByName = () => null;
const big2 = eb.ctx.getTextMap(); ok(big2.count === 1500 && eq(big2.map, big1.map), '從分段快取還原，內容與原本完全相同');
delete eb.store[chunkKeys[1]]; const big3 = eb.ctx.getTextMap(); ok(big3.count === 0, '少一段快取視為沒有快取（重新讀取，不會回傳殘缺資料）');
e = env({ TextMap: mapSheet }); e.ctx.getTextMap(); e.ctx.clearTextMapCache_(); ok(Object.keys(e.store).filter(k => k.indexOf('text_map_v1') === 0).length === 0, 'clearTextMapCache_ 清除所有分段');
e = env({}); e.ctx.getSpreadsheet = () => { throw new Error('boom'); }; res = e.ctx.getTextMap();
ok(res.success === false && eq(res.map, {}), '讀取失敗：回傳 success:false 與空對照（前台退回中文）');

console.log('H. doGet 唯讀動作');
e = env({ TextMap: mapSheet }); let o = e.ctx.doGet({ parameter: { action: 'getTextMap' } });
ok(o.mime === 'JSON' && JSON.parse(o.text).map['白飯'] === 'Rice', 'doGet?action=getTextMap 回傳 JSON');
ok(e.ensureCalls() === 0, '不做工作表檢查（與 getAppData 同樣不拖慢）');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
