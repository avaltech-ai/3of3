// 「桃子腳幼兒園 完整 Google Drive 照片連結」彈窗的月份清單（瀏覽器測試，2026-10-22）：每個月份一筆、由新到舊、最新標籤、
// 連結是標準資料夾網址（不帶 /u/0/ 帳號索引，否則家長用別的 Google 帳號開會被導到錯的帳號）、新分頁開啟。
(function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const $ = id => document.getElementById(id);
  const rows = () => Array.from($('fullDriveMonthlyLinksList').querySelectorAll('a'));
  const saved = fullDriveSortOrder;
  fullDriveSortOrder = 'desc'; renderFullDriveMonthlyLinks();
  const labels = () => rows().map(r => (r.textContent.match(/20\d\d\.\d\d/) || [''])[0]);
  ok(labels().join() === '2026.10,2026.09,2026.08', '由新到舊：2026.10、2026.09、2026.08');
  ok(/最新/.test(rows()[0].textContent) && rows().slice(1).every(r => !/最新/.test(r.textContent)), '只有第一筆（最新）有「最新」標籤');
  ok(rows()[0].getAttribute('href') === 'https://drive.google.com/drive/folders/10zgzXcBtUGOJXn230xZA9wdRs45LHH1H', '2026.10：標準資料夾網址（原始連結的 /u/0/ 已去掉）');
  ok(rows().every(r => /^https:\/\/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]{20,}$/.test(r.getAttribute('href')) && r.target === '_blank' && /noopener/.test(r.rel)), '每一筆都是 https 的標準資料夾網址，新分頁開啟、noopener');
  ok(new Set(rows().map(r => r.getAttribute('href'))).size === rows().length, '沒有重複的網址');
  fullDriveSortOrder = 'asc'; renderFullDriveMonthlyLinks();
  ok(labels().join() === '2026.08,2026.09,2026.10' && rows().every(r => !/最新/.test(r.textContent)), '由舊到新：順序相反、沒有「最新」標籤');
  fullDriveSortOrder = saved; renderFullDriveMonthlyLinks();
  console.log(res.join('\n')); return res.join('\n');
})();
