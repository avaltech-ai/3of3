// 載入等待提示測試（瀏覽器）：在載入 index.html 的頁面 Console 執行（用法見 tests/README.md），約 20 秒。
// 涵蓋：3 秒後才出現「已等待 N 秒」、重試次數、stop 後清除、callBackend 回報嘗試次數、
//       相簿視窗的等待提示與第一批縮圖真實進度（前 18 張 eager、其餘 lazy）、英文字典。
(async function () {
  const res = []; const ok = (c, m) => res.push((c ? '✓ ' : '✗ FAIL: ') + m);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(4000); // 等頁面自己的雲端載入結束

  // A. startWaitHint
  const box = document.createElement('div'); document.body.appendChild(box);
  const h = startWaitHint(box);
  const el = () => box.querySelector('.wait-hint');
  await wait(1200); ok(el().style.display === 'none', '前 3 秒不顯示提示（避免閃一下）');
  await wait(2400); ok(el().style.display !== 'none' && /已等待 3 秒/.test(el().textContent), '超過 3 秒顯示「已等待 3 秒」（實際：' + el().textContent + '）');
  h.attempt(2, 3); ok(/重試/.test(el().textContent) && /2\/3/.test(el().textContent), '第 2 次嘗試顯示重試 2/3（實際：' + el().textContent + '）');
  h.stop(); ok(el().textContent === '' && el().style.display === 'none', 'stop 後清除並隱藏');
  const box2 = document.createElement('span'); document.body.appendChild(box2);
  const h2 = startWaitHint(box2, { inline: true }); ok(box2.querySelector('.wait-hint').tagName === 'SPAN', 'inline 模式建立 span'); h2.stop();
  startWaitHint(box).stop(); startWaitHint(box).stop();
  ok(box.querySelectorAll('.wait-hint').length === 1, '重複建立不會長出多個提示元素'); box2.remove();
  box.remove();
  const nul = startWaitHint(null); nul.attempt(1, 1); nul.stop(); ok(true, '容器不存在時不丟例外');

  // B. callBackend 回報嘗試次數
  const realFetch = window.fetch; const seen = []; let i = 0;
  window.fetch = function () { i++; if (i < 3) return Promise.reject(new TypeError('Load failed')); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: {} }) }); };
  let okCount = 0;
  callBackend('getAppData', {}, () => okCount++, () => {}, { onAttempt: (n, m) => seen.push(n + '/' + m) });
  await wait(5000);
  ok(seen.join() === '1/3,2/3,3/3' && okCount === 1, 'onAttempt 依序回報 1/3,2/3,3/3，最後成功（實際：' + seen.join() + '）');

  // C. 相簿視窗：等待提示＋第一批縮圖進度
  const ids = Array.from({ length: 30 }, (_, k) => '1ABCDEFGHIJKLMNOPQRSTUVWXYZ' + String(k).padStart(2, '0'));
  window.fetch = function (u) {
    if (String(u).includes('getAlbumPhotos')) return new Promise(r => setTimeout(() => r({ ok: true, status: 200, json: () => Promise.resolve({ success: true, folderName: 'x', photos: ids.map(id => ({ id, name: id + '.jpg', size: 1 })) }) }), 4500));
    return realFetch.apply(this, arguments);
  };
  openAlbumPhotos('1gRFbxu4MSAUl-YxW8o7AqVs222aCrezE', 'test');
  await wait(3800);
  const lt = document.getElementById('albumLoadingText');
  ok(lt && /已等待 3 秒/.test(lt.textContent), '相簿載入中 3 秒後顯示等待提示（實際：' + (lt && lt.textContent) + '）');
  await wait(1800);
  const imgs = [...document.querySelectorAll('#albumPhotosGrid img')];
  ok(imgs.length === 30, '清單回來後顯示 30 張縮圖');
  ok(imgs.slice(0, 18).every(x => x.getAttribute('loading') === 'eager') && imgs.slice(18).every(x => x.getAttribute('loading') === 'lazy'), '前 18 張 eager、其餘 lazy');
  const pb = document.getElementById('albumThumbProgress');
  ok(pb && /縮圖載入 \d+ \/ 18/.test(document.getElementById('albumThumbProgressText').textContent), '顯示第一批縮圖進度（實際：' + document.getElementById('albumThumbProgressText').textContent + '）');
  await wait(9000);
  const done = /縮圖載入 18 \/ 18/.test(document.getElementById('albumThumbProgressText').textContent) || pb.classList.contains('hidden');
  ok(done, '第一批縮圖處理完（含載入失敗的）後進度到 18/18 並收起');
  closeAlbumModal(); window.fetch = realFetch;
  ok(pb.classList.contains('hidden'), '關閉視窗後進度條收起');

  // D. 英文
  const lang = state.lang; state.lang = 'en';
  ok(t('ui.waitElapsed', { s: 5 }) === 'Waiting 5s' && /retrying \(2\/3\)/.test(t('ui.waitRetry', { n: 2, max: 3 })) && /thumbnails 3 \/ 18/.test(t('ui.thumbProgress', { i: 3, n: 18 })), '英文字典正確');
  state.lang = lang;
  console.log(res.join('\n')); return res;
})();
