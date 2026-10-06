// 後台「英文對照」相似文字分組（純函式）測試：從建置好的 index.html 取出 mapSimGroups 等函式直接執行。
// 執行：node tests/mapsimilar.test.js（已納入 tests/ci.sh）
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = html.indexOf('const MAP_SIM_MIN_LEN');
const b = html.indexOf('// 目前種類的相似組');
if (a < 0 || b < 0 || b < a) { console.log('FAIL: 在 index.html 找不到相似文字函式'); process.exit(1); }
const src = html.slice(a, b);
const api = new Function(src + '\nreturn { mapSimKey, mapSimWithin, mapSimMaxDiff, mapSimGroups };')();

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } }
function grouped(list) { const g = api.mapSimGroups(list); return function (x, y) { return g.of[x] !== undefined && g.of[x] === g.of[y]; }; }

console.log('A. 使用者實際遇到的例子');
const A = '社-2-3 調整自己的行動，遵守生活規範和活動規則';
const B = '社-2-3 調整自己的行動，遵守生活規範與活動規則';
let g = api.mapSimGroups([A, B]);
ok(g.groupCount === 1 && g.rowCount === 2 && g.of[A] === g.of[B] && g.members[g.of[A]].join('|') === A + '|' + B, '「和」與「與」只差一個字 → 同一組，成員依原順序');
ok(g.of[A] === 0, '組別編號從 0 開始');

console.log('B. 該分在同一組的');
ok(grouped(['社-2-3 調整自己的行動，遵守生活規範和活動規則', '社-2-3 調整自己的行動,遵守生活規範和活動規則'])(
  '社-2-3 調整自己的行動，遵守生活規範和活動規則', '社-2-3 調整自己的行動,遵守生活規範和活動規則'), '只差標點（全形逗號 vs 半形逗號）→ 同一組');
ok(grouped(['認識生活周遭的自然環境與資源', '認識生活周遭的自然環境及資源'])('認識生活周遭的自然環境與資源', '認識生活周遭的自然環境及資源'), '14 字以上差 1 字（與／及）→ 同一組');
ok(grouped(['能分享自己的想法並傾聽別人的意見', '能分享自己的想法並傾聽他人意見'])('能分享自己的想法並傾聽別人的意見', '能分享自己的想法並傾聽他人意見'), '差 2 字（別人的→他人）→ 同一組');
ok(grouped(['喜歡親近大自然的花草樹木', '喜歡親近大自然的花草樹'])('喜歡親近大自然的花草樹木', '喜歡親近大自然的花草樹'), '多一個字（長度差 1）→ 同一組');
ok(grouped(['愛護 環境，不亂丟垃圾', '愛護環境　不亂丟垃圾'])('愛護 環境，不亂丟垃圾', '愛護環境　不亂丟垃圾'), '只差空白與標點（去掉後完全相同）→ 同一組');

ok(grouped(['愛護環境，不亂丟、垃圾！！', '愛護環境不亂丟垃圾'])('愛護環境，不亂丟、垃圾！！', '愛護環境不亂丟垃圾'), '標點很多但去掉後完全相同（長度差 4）→ 同一組（比對前先去標點，而不是直接算含標點的距離）');

console.log('C. 不該分在同一組的');
ok(!grouped(['喜歡親近大自然的花草樹木', '喜歡親近大自然的花朵樹林'])('喜歡親近大自然的花草樹木', '喜歡親近大自然的花朵樹林'), '10 字、同長度、差 2 字（門檻 1）→ 不同組');
ok(!grouped(['社-2-3 調整自己的行動，遵守生活規範和活動規則', '社-2-4 調整自己的行動，遵守生活規範和活動規則'])(
  '社-2-3 調整自己的行動，遵守生活規範和活動規則', '社-2-4 調整自己的行動，遵守生活規範和活動規則'), '只差編號數字（社-2-3 vs 社-2-4）→ 不同組（編號不同就是不同的課程目標）');
ok(!grouped(['能分享自己的想法並傾聽別人的意見', '能表達自己的需求並說明原因理由'])('能分享自己的想法並傾聽別人的意見', '能表達自己的需求並說明原因理由'), '內容不同 → 不同組');
ok(!grouped(['喜歡親近大自然的花草樹木', '喜歡親近大自然的花草'])('喜歡親近大自然的花草樹木', '喜歡親近大自然的花草'), '10 字以內差 2 字（長度差 2、門檻 1）→ 不同組');
ok(!grouped(['喜歡親近大自然的花草樹木', '喜歡親近大自然的花'])('喜歡親近大自然的花草樹木', '喜歡親近大自然的花'), '長度相差 3 → 不同組');
ok(!grouped(['調整自己的行動遵守生活規範和活動規則', '調整自己的行為遵守生活規則與活動規定'])('調整自己的行動遵守生活規範和活動規則', '調整自己的行為遵守生活規則與活動規定'), '差 4 字 → 不同組');
g = api.mapSimGroups(['大班', '中班', '白飯', '白飯。', '早點時間']);
ok(g.groupCount === 0, '去掉標點後少於 8 個字的（班級、短菜名）一律不分組');
g = api.mapSimGroups([A]);
ok(g.groupCount === 0 && g.rowCount === 0, '只有一筆 → 不成組');
g = api.mapSimGroups([]);
ok(g.groupCount === 0 && Object.keys(g.of).length === 0, '空清單不出錯');
g = api.mapSimGroups(undefined);
ok(g.groupCount === 0, 'undefined 不出錯');
g = api.mapSimGroups([A, A]);
ok(g.groupCount === 1 && g.members[0].length === 2, '（防呆）同一字串重複出現視為同組（正常資料中中文不會重複）');

console.log('D. 串接、多組與順序');
const c1 = '能分享自己的想法並傾聽別人的意見', c2 = '能分享自己的想法並傾聽別人的意見喔', c3 = '能分享自己的想法並傾聽別人的意見喔！了';
g = api.mapSimGroups(['其他完全不同的長句子內容文字', c1, A, c2, B, c3]);
ok(g.groupCount === 2 && g.rowCount === 5, '兩組共 5 筆（A/B 一組；c1/c2/c3 一組），無關的句子不在任何組');
ok(g.of[c1] === g.of[c2] && g.of[c2] === g.of[c3], 'c1～c3 串接成同一組（c1 與 c3 本身差 2 字、c2 居中）');
ok(g.of[c1] === 0 && g.of[A] === 1, '組別編號依第一筆出現的順序（c1 先於 A）');
ok(g.members[1].join('|') === A + '|' + B, '組內成員依原順序');
ok(g.of['其他完全不同的長句子內容文字'] === undefined, '不在任何組的文字查不到組別');

console.log('E. 安全與效能');
g = api.mapSimGroups(['__proto__', '__proto__ 這是一段測試文字內容', '__proto__ 這是一段測試文字內容。']);
ok(g.groupCount === 1 && g.of['__proto__'] === undefined && Object.getPrototypeOf(g.of) === null, '特殊字串 __proto__ 不會汙染物件（of 是無原型物件）');
const big = []; for (let i = 0; i < 2000; i++) big.push('主題' + (i % 7) + '的活動內容說明第' + i + '週的課程重點與目標' + String.fromCharCode(0x4e00 + (i * 37) % 2000));
const t0 = Date.now(); api.mapSimGroups(big); const dt = Date.now() - t0;
ok(dt < 3000, '2000 筆比對在 3 秒內完成（實測 ' + dt + ' 毫秒）');
ok(api.mapSimWithin('abcdefgh', 'abcdefgh', 0) && api.mapSimWithin('abcdefgh', 'abcdxfgh', 1) && !api.mapSimWithin('abcdefgh', 'abxdxfgh', 1) && api.mapSimWithin('abcdefgh', 'abxdxfgh', 2), '編輯距離上限判斷（0／1／2）');
ok(api.mapSimMaxDiff(8) === 1 && api.mapSimMaxDiff(13) === 1 && api.mapSimMaxDiff(14) === 2 && api.mapSimMaxDiff(60) === 2, '門檻：8～13 字最多差 1 字，14 字以上最多差 2 字');

// 與完整的編輯距離（標準 DP）對照：隨機短字串，上限 0／1／2，結果必須完全一致
function refDist(x, y) { const d = []; for (let i = 0; i <= x.length; i++) { d[i] = [i]; } for (let j = 1; j <= y.length; j++) d[0][j] = j; for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); return d[x.length][y.length]; }
let seed = 12345; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
let mism = 0, trials = 0;
for (let t = 0; t < 4000; t++) {
  const mk = () => { let r = ''; const L = 3 + rnd(6); for (let i = 0; i < L; i++) r += 'abc'[rnd(3)]; return r; };
  const x = mk(), y = mk(); const max = rnd(3);
  trials++; if (api.mapSimWithin(x, y, max) !== (refDist(x, y) <= max)) mism++;
}
ok(mism === 0, '隨機字串 ' + trials + ' 組：mapSimWithin 與標準編輯距離判斷完全一致（不一致 ' + mism + ' 組）');
// 串接：c1~c2、c2~c3 但 c1、c3 彼此也只差 2 字；另測「A~B、C~D、B~C」要串成一組
const q1 = '甲乙丙丁戊己庚辛壬癸子丑寅卯', q2 = '甲乙丙丁戊己庚辛壬癸子丑寅辰', q3 = '甲乙丙丁戊己庚辛壬癸子醜寅辰', q4 = '甲乙丙丁戊己庚辛壬癸子醜亥辰';
g = api.mapSimGroups([q1, q4, q2, q3]);
ok(g.groupCount === 1 && g.rowCount === 4, '需要透過中間項才連得起來的 4 筆（q1~q2~q3~q4）合成同一組');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
