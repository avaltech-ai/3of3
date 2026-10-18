// 節慶主題的日期邏輯測試：從建置好的 index.html 取出 FESTIVAL-START～FESTIVAL-END 之間的純函式直接執行。
// 執行：node tests/festival.test.js（已納入 tests/ci.sh）
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = html.indexOf('/* FESTIVAL-START */');
const b = html.indexOf('/* FESTIVAL-END */');
if (a < 0 || b < 0 || b < a) { console.log('FAIL: 在 index.html 找不到節慶函式'); process.exit(1); }
const api = new Function(html.slice(a, b) + '\nreturn { FESTIVALS, FESTIVAL_LUNAR, festAdd, festivalsOfYear, festivalOn, festivalDayOf };')();

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } }
const on = d => { const f = api.festivalOn(d); return f ? f.key + (f.phase ? ':' + f.phase : '') : null; };

console.log('A. 農曆節日表（香港天文台公農曆對照表，2026-10-18 核對）');
const HKO = {
  2026: ['2026-02-17', '2026-03-03', '2026-06-19', '2026-09-25'], 2027: ['2027-02-06', '2027-02-20', '2027-06-09', '2027-09-15'],
  2028: ['2028-01-26', '2028-02-09', '2028-05-28', '2028-10-03'], 2029: ['2029-02-13', '2029-02-27', '2029-06-16', '2029-09-22'],
  2030: ['2030-02-03', '2030-02-17', '2030-06-05', '2030-09-12'], 2031: ['2031-01-23', '2031-02-06', '2031-06-24', '2031-10-01'],
  2032: ['2032-02-11', '2032-02-25', '2032-06-12', '2032-09-19'], 2033: ['2033-01-31', '2033-02-14', '2033-06-01', '2033-09-08'],
  2034: ['2034-02-19', '2034-03-05', '2034-06-20', '2034-09-27'], 2035: ['2035-02-08', '2035-02-22', '2035-06-10', '2035-09-16']
};
ok(JSON.stringify(api.FESTIVAL_LUNAR) === JSON.stringify(HKO), '2026～2035 年的春節、元宵、端午、中秋與天文台資料完全相同');
ok(api.FESTIVAL_LUNAR[2027][0] === '2027-02-06' && api.FESTIVAL_LUNAR[2030][0] === '2030-02-03', '行政院行事曆：2027 春節 2/6、2030 春節 2/3（瀏覽器內建農曆會算成 2/7、2/2）');
ok(Object.keys(HKO).every(y => api.festAdd(HKO[y][0], 14) === HKO[y][1]), '每年元宵＝春節＋14 天');
ok(Object.keys(HKO).every(y => /-0[56]-/.test(HKO[y][2]) && /-(09|10)-/.test(HKO[y][3])), '端午在 5～6 月、中秋在 9～10 月');

console.log('B. 顯示期間：節日前 3 天到當天');
ok(on('2026-10-27') === null && on('2026-10-28') === 'halloween' && on('2026-10-31') === 'halloween' && on('2026-11-01') === null, '萬聖節：10/28～10/31');
ok(on('2026-12-21') === null && on('2026-12-22') === 'xmas' && on('2026-12-25') === 'xmas' && on('2026-12-26') === null, '聖誕節：12/22～12/25，12/26 回到冬天');
ok(on('2027-03-31') === null && on('2027-04-01') === 'children' && on('2027-04-04') === 'children' && on('2027-04-05') === null, '兒童節：4/1～4/4');
ok(on('2026-05-06') === null && on('2026-05-07') === 'mother' && on('2026-05-10') === 'mother' && on('2026-05-11') === null, '母親節 2026：5/10（5 月第二個星期日），5/7～5/10');
ok(api.festivalsOfYear(2027).find(x => x.key === 'mother').end === '2027-05-09' && api.festivalsOfYear(2028).find(x => x.key === 'mother').end === '2028-05-14', '母親節 2027＝5/9、2028＝5/14');
ok(on('2026-08-04') === null && on('2026-08-05') === 'father' && on('2026-08-08') === 'father', '父親節：8/5～8/8');
ok(on('2026-06-15') === null && on('2026-06-16') === 'dragon' && on('2026-06-19') === 'dragon' && on('2026-06-20') === null, '端午 2026：6/16～6/19');
ok(on('2026-09-21') === null && on('2026-09-22') === 'moon' && on('2026-09-25') === 'moon', '中秋 2026：9/22～9/25');
ok(on('2026-09-26') === 'teacher' && on('2026-09-28') === 'teacher' && on('2026-09-29') === null, '教師節：到 9/28；2026 年 9/25 與中秋重疊時算中秋，9/26 起才是教師節');

console.log('C. 農曆新年：小年夜前 7 天～元宵；元宵前 3 天換 🏮');
ok(on('2026-02-07') === null && on('2026-02-08') === 'lny' && on('2026-02-17') === 'lny', '2026：春節 2/17，2/8 開始（春節前 9 天＝小年夜前 7 天）');
ok(on('2026-02-27') === 'lny' && on('2026-02-28') === 'lny:lantern' && on('2026-03-03') === 'lny:lantern' && on('2026-03-04') === null, '2026：2/28 起元宵階段，3/3 元宵後結束');
ok(on('2031-01-14') === 'lny' && on('2031-01-13') === null, '2031：春節 1/23，1/14 開始');

console.log('D. 節日當天（月曆圖示、今天小卡插圖）');
const d = x => { const r = api.festivalDayOf(x); return r ? r.key + r.icon : null; };
ok(d('2026-02-17') === 'lny🧧' && d('2026-03-03') === 'lny🏮', '春節當天 🧧、元宵當天 🏮');
ok(d('2026-10-31') === 'halloween🎃' && d('2026-10-30') === null && d('2026-12-25') === 'xmas🎄', '只有節日當天，前 3 天不算');
ok(d('2026-09-25') === 'moon🥮' && d('2026-09-28') === 'teacher🍎' && d('2026-05-10') === 'mother💐' && d('2026-08-08') === 'father👔' && d('2026-06-19') === 'dragon🐲' && d('2027-04-04') === 'children🎈', '其他節日當天的圖示');

console.log('E. 沒有農曆資料的年份、不合理日期');
ok(on('2036-01-27') === null && on('2036-12-25') === 'xmas' && on('2036-05-11') === 'mother', '2036 年（表外）：農曆節慶不顯示，國曆節慶照常');
let threw = false; try { api.festivalOn('abc'); api.festivalDayOf(''); } catch (e) { threw = true; }
ok(!threw, '不合理的日期字串：不出錯');

console.log('F. 每個節慶都有圖片與樣式');
const keys = Object.keys(api.FESTIVALS);
ok(keys.length === 9, '9 個節慶');
ok(keys.every(k => fs.existsSync(path.join(root, 'festival', k + '-garland.svg')) && fs.existsSync(path.join(root, 'festival', k + '-sticker.svg'))), '每個節慶都有掛飾與插圖 SVG');
ok(keys.every(k => html.indexOf('html[data-festival="' + k + '"] {') !== -1 && html.indexOf('html[data-festival="' + k + '"] #seasonBadge::after') !== -1), '每個節慶都有底色／色條／圖片與小圖示的樣式');
const lastSeason = Math.max(html.lastIndexOf('html[data-season="winter"] {'), html.lastIndexOf('html[data-season="winter"] #seasonBadge::after'));
ok(lastSeason > 0 && keys.every(k => html.indexOf('html[data-festival="' + k + '"] {') > lastSeason), '節慶樣式寫在季節樣式之後（權重相同，後面的才會蓋過季節）');
ok(keys.every(k => { const s = fs.readFileSync(path.join(root, 'festival', k + '-sticker.svg'), 'utf8'); return /^<svg[^>]+viewBox="0 0 100 100"/.test(s) && !/<script|on\w+=|href="http/i.test(s); }), '插圖 SVG：100×100、沒有程式碼或外部連結');
ok(keys.every(k => { const s = fs.readFileSync(path.join(root, 'festival', k + '-garland.svg'), 'utf8'); return /viewBox="0 0 400 64"/.test(s) && /M0 6 Q200 46 400 6|M0 4 Q200 44 400 4/.test(s) && !/<script|on\w+=|href="http/i.test(s); }), '掛飾 SVG：400×64、兩端同高（可左右無縫重複）、沒有程式碼或外部連結');

console.log('\n結果：' + pass + ' 通過，' + fail + ' 失敗');
process.exit(fail ? 1 : 0);
