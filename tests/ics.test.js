// 行事曆訂閱（.ics）測試：篩選、全天事件日期、逸出、摺行、髒資料、doGet 唯讀動作。執行：node tests/ics.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.js'), 'utf8');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m) } else { fail++; console.log('  ✗ FAIL:', m) } };

function env(cached) {
  let ssCalls = 0, ensureCalls = 0;
  const store = {}; if (cached !== undefined) store['app_data_v4'] = JSON.stringify(cached);
  const cache = { get: k => k in store ? store[k] : null, put: (k, v) => { store[k] = v }, remove: k => { delete store[k] } };
  const ctx = { console: { log() {}, warn() {}, error() {} }, CacheService: { getScriptCache: () => cache },
    ContentService: { MimeType: { ICAL: 'text/calendar', JSON: 'application/json' }, createTextOutput: t => ({ text: t, setMimeType(m) { this.mime = m; return this } }) },
    PropertiesService: {}, Utilities: {}, LockService: {}, SpreadsheetApp: {}, DriveApp: {}, HtmlService: {}, UrlFetchApp: {}, Session: {}, ScriptApp: {} };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  ctx.getSpreadsheet = () => { ssCalls++; return null; };
  ctx.ensureAlbumSheetsExist = () => { ensureCalls++; };
  return { ctx, ssCalls: () => ssCalls, ensureCalls: () => ensureCalls };
}
const NOW = new Date('2026-10-05T08:00:00Z');
const unfold = ics => ics.replace(/\r\n[ \t]/g, '');
const events = ics => unfold(ics).split('\r\n').reduce((acc, l) => { if (l === 'BEGIN:VEVENT') acc.push({}); else if (acc.length && l !== 'END:VEVENT' && l.indexOf(':') > 0) { const i = l.indexOf(':'); acc[acc.length - 1][l.slice(0, i)] = l.slice(i + 1); } return acc; }, []);
const E = (o) => Object.assign({ id: 'EV-X', date: '2026-10-07', endDate: '', title: '活動', target: '全園活動', timeLocation: '', description: '', categoryMinor: '' }, o);
const { ctx } = env();

console.log('A. 篩選（諾貝爾 A、全園、親職；其他班專屬不含）');
const relevant = t => ctx.icsIsRelevantEvent_({ target: t });
ok(relevant('全園活動') && relevant('全園適用'), '全園活動／全園適用 → 含');
ok(relevant('諾貝爾 A, 全園活動,') && relevant('諾貝爾 C, 諾貝爾 B, 諾貝爾 A') && relevant('諾貝爾 C , 諾貝爾 B, 諾貝爾 A'), '含「諾貝爾 A」的組合（含多餘空白與結尾逗號）→ 含');
ok(relevant('諾貝爾A班') && relevant('諾A') && relevant('親職活動'), '「諾貝爾A班」「諾A」「親職活動」→ 含');
ok(relevant('') && relevant('   ') && relevant(undefined), '對象為空 → 視為全園（與前台一致）');
ok(!relevant('米羅 A, 米羅 B, 雨果') && !relevant('雨奧, 奧斯卡, 諾奧') && !relevant('諾貝爾 B, 諾貝爾 C'), '只屬於其他班（米羅／雨果、雨奧／奧斯卡／諾奧、諾貝爾 B／C）→ 不含');
ok(!relevant('諾貝爾 AB'.replace('AB', 'B')), '「諾貝爾 B」不會被誤判成諾貝爾 A');

console.log('B. 全天事件日期');
let ev = events(ctx.buildIcs_([E({ date: '2026-10-07' })], NOW))[0];
ok(ev['DTSTART;VALUE=DATE'] === '20261007' && ev['DTEND;VALUE=DATE'] === '20261008', '單日：DTEND 為隔天（結束日不含）');
ev = events(ctx.buildIcs_([E({ date: '2026-10-09', endDate: '2026-10-11' })], NOW))[0];
ok(ev['DTEND;VALUE=DATE'] === '20261012', '連假 10/9～10/11：DTEND = 10/12');
ev = events(ctx.buildIcs_([E({ date: '2026-12-31', endDate: '2026-12-31' })], NOW))[0];
ok(ev['DTEND;VALUE=DATE'] === '20270101', '跨年：12/31 的 DTEND = 隔年 1/1');
ev = events(ctx.buildIcs_([E({ date: '2026-02-27', endDate: '2026-03-01' })], NOW))[0];
ok(ev['DTEND;VALUE=DATE'] === '20260302', '跨月（非閏年二月）：2/27～3/1 → DTEND 3/2');
ev = events(ctx.buildIcs_([E({ date: '2026-10-07', endDate: '2026-10-01' })], NOW))[0];
ok(ev['DTEND;VALUE=DATE'] === '20261008', '結束日早於開始日（資料錯誤）→ 當單日');
ev = events(ctx.buildIcs_([E({ date: '2026-10-07T00:00:00.000Z' })], NOW))[0];
ok(ev && ev['DTSTART;VALUE=DATE'] === '20261007', '日期帶時間字串也能解析');

console.log('C. 髒資料');
ok(events(ctx.buildIcs_([E({ date: '' }), E({ date: 'abc' }), E({ date: '2026-13-45' }), E({ date: null }), null, undefined], NOW)).length === 0, '無效日期／null 事件 → 略過，不丟例外');
ev = events(ctx.buildIcs_([E({ timeLocation: '1899-12-30' })], NOW))[0];
ok(!/1899/.test(ev.DESCRIPTION || ''), '「時間地點」被試算表誤轉成 1899-12-30 → 不顯示');
ev = events(ctx.buildIcs_([E({ timeLocation: '17:00 開始' })], NOW))[0];
ok(/時間地點：17:00 開始/.test(ev.DESCRIPTION), '正常的時間地點放進備註');
ev = events(ctx.buildIcs_([E({ title: '' })], NOW))[0];
ok(ev.SUMMARY === '活動', '沒有標題 → 「活動」');
const many = Array.from({ length: 600 }, (_, i) => E({ id: 'E' + i }));
ok(events(ctx.buildIcs_(many, NOW)).length === 500, '上限 500 筆');

console.log('D. 逸出與備註');
ev = events(ctx.buildIcs_([E({ title: '幸福廚房, 手作;日\\測試', description: '第一行\n第二行', target: '諾貝爾 A, 全園活動,', categoryMinor: '幸福廚房' })], NOW))[0];
ok(ev.SUMMARY === '幸福廚房\\, 手作\\;日\\\\測試', '標題逸出（逗號、分號、反斜線）：' + ev.SUMMARY);
ok(ev.DESCRIPTION === '第一行\\n第二行\\n適用對象：諾貝爾 A、全園活動\\n類別：幸福廚房', '備註含說明、適用對象（整理多餘逗號）、類別：' + ev.DESCRIPTION);
ok(ev.CATEGORIES === '幸福廚房', '有 CATEGORIES');
ok(ev.TRANSP === 'TRANSPARENT', '標記為「有空」（不佔用家長行事曆的忙碌時段）');

console.log('E. 格式');
const ics = ctx.buildIcs_([E({ id: 'EV-01' }), E({ id: 'EV 02,x' })], NOW);
ok(ics.indexOf('BEGIN:VCALENDAR\r\n') === 0 && /END:VCALENDAR\r\n$/.test(ics), '以 CRLF 換行，BEGIN／END:VCALENDAR 完整');
ok(!/[^\r]\n/.test(ics), '沒有單獨的 LF');
ok(/VERSION:2\.0/.test(ics) && /X-WR-CALNAME:/.test(ics) && /REFRESH-INTERVAL;VALUE=DURATION:PT6H/.test(ics), '有版本、名稱、重新整理間隔');
ok(/DTSTAMP:20261005T080000Z/.test(ics), 'DTSTAMP 為 UTC 格式');
const longTitle = '很長的活動名稱'.repeat(30);
const folded = ctx.buildIcs_([E({ title: longTitle, description: '說明'.repeat(60) })], NOW);
const byteLen = s => Buffer.byteLength(s, 'utf8');
ok(folded.split('\r\n').every(l => byteLen(l) <= 75), '所有行 ≤ 75 位元組（含多位元組中文）：最長 ' + Math.max(...folded.split('\r\n').map(byteLen)));
ok(events(folded)[0].SUMMARY === longTitle, '摺行後還原內容與原文完全相同（沒有拆壞中文字）');
const uids = events(ics).map(e => e.UID);
ok(uids[0] === 'EV-01@3of3.avaltech-ai.github.io' && /^[A-Za-z0-9_.-]+@3of3\.avaltech-ai\.github\.io$/.test(uids[1]) && uids[0] !== uids[1], 'UID 穩定且只含安全字元（' + uids.join(' / ') + '）');
ok(ctx.buildIcs_([E()], NOW) === ctx.buildIcs_([E()], NOW), '同樣輸入同樣輸出（決定性）');
const noId = events(ctx.buildIcs_([E({ id: '', title: 'A' }), E({ id: '', title: 'B' })], NOW)).map(e => e.UID);
ok(noId[0] !== noId[1], '沒有 id 的活動：UID 由日期＋標題雜湊產生且不重複');

console.log('F. doGet 唯讀動作');
const good = { success: true, data: { events: [E({ id: 'EV-1' }), E({ id: 'EV-2', target: '米羅 A' })] } };
let t = env(good); let out = t.ctx.doGet({ parameter: { action: 'getCalendarIcs' } });
ok(out.mime === 'text/calendar' && /BEGIN:VCALENDAR/.test(out.text), '回傳 text/calendar（不是 JSON）');
ok(events(out.text).length === 1, '經由 getAppData 資料並套用篩選（2 筆中只含 1 筆）');
ok(t.ssCalls() === 0 && t.ensureCalls() === 0, '快取命中：完全不開試算表、不做工作表檢查（試算表 ' + t.ssCalls() + '／檢查 ' + t.ensureCalls() + '）');
t = env(); t.ctx.getAppData = () => { throw new Error('boom'); };
out = t.ctx.doGet({ parameter: { action: 'getCalendarIcs' } });
ok(out.mime === 'text/calendar' && /BEGIN:VCALENDAR/.test(out.text) && events(out.text).length === 0, '取資料失敗：回傳空的有效行事曆（訂閱端不會出現錯誤頁）');
t = env(); t.ctx.getAppData = () => ({ success: false, error: 'x' });
out = t.ctx.doGet({ parameter: { action: 'getCalendarIcs' } });
ok(/END:VCALENDAR/.test(out.text) && events(out.text).length === 0, 'getAppData 回報失敗：同樣回傳空行事曆');
t = env(good); out = t.ctx.doGet({ parameter: { action: 'getCalendarIcs', foo: 'bar' } });
ok(out.mime === 'text/calendar', '多餘參數不影響');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗'); process.exit(fail ? 1 : 0);
