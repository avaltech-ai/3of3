# 測試說明

## 1. 後端認證與備份測試（Node，約 1 秒）
```bash
node tests/auth.test.js
```
以模擬的 Cache／Properties／Drive 驗證登入 token、鎖定、變更密碼、備份間隔保護。修改 `Code.js` 的認證或備份邏輯後必跑，全部 ✓ 才可部署。

## 1b. 後端冪等性測試（Node，約 1 秒）
```bash
node tests/idempotency.test.js
```
驗證同一個 `idempotencyKey` 只執行一次、失敗不快取、無效 token 不洩漏、格式不合法的編號被忽略、期限與大小限制。修改 `Code.js` 的 `doPost` 後必跑。

## 1c. 相簿封面候選後端測試（Node，約 1 秒）
```bash
node tests/covers.test.js
```
驗證封面候選的取樣（均勻、決定性、與輸入順序無關）、解析（惡意或壞掉的儲存格內容被過濾）、試算表欄位處理（只寫單格、不動其他欄位）、重建功能（單一相簿失敗不中斷其他）、上傳最後區塊自動建立候選（失敗不影響上傳）、`getAlbums` 回傳（共 48 項）。修改 `Code.js` 的相簿相關程式後必跑。

## 1d. 名稱對照表後端測試（Node，約 1 秒）
```bash
node tests/namemap.test.js
```
驗證名稱正規化、英文草稿規則、掃描（含字典多空白、資料用了字典沒有的名稱）、同步（冪等、**絕不覆蓋老師填的英文**）、回傳給前台的內容過濾與上限（共 43 項）。修改 `Code.js` 的名稱對照相關程式後必跑。

## 2. 前端 XSS 偵測器（瀏覽器內執行）
`tests/xss_harness.js` 會把**真實資料的每個文字欄位**換成攻擊字串，驅動所有畫面渲染，再檢查：
是否有被注入的元素、事件屬性（onclick 等）是否能被跳出而執行任意程式、網址是否為 `javascript:`。
所有網路寫入、`confirm`／`alert`／`window.open` 在測試中都被替換成無害的假函式，不會碰到真實資料。

| 類型 | 攻擊字串 | 測的情境 |
| :-- | :-- | :-- |
| A | `"'><img src=x onerror=…>` | 破壞 HTML 結構、屬性 |
| B | `");__x("…");//` | 跳出雙引號 JS 字串 |
| C | `');__x('…');//` | 跳出單引號 JS 字串（`onclick="f('…')"`） |
| D | `javascript:…` | 網址欄位（href/src） |
| E | `&quot;);__x(&quot;…&quot;);//` | 以 `&quot;` 包起來的 JS 字串（`onclick="f(&quot;…&quot;)"`） |
| L | `L&<>"'x` | **正常**特殊字元：必須原樣顯示、不得被雙重跳脫 |

執行方式（在專案資料夾啟動本機伺服器後，於瀏覽器主控台或自動化工具中執行）：
```bash
python3 -m http.server 8765
```
```js
// 開啟 http://localhost:8765/index.html，等雲端資料載入完成後：
window.__raw = JSON.parse(localStorage.getItem('nobel_a_cached_app_data'));
(0, eval)(await (await fetch('/tests/xss_harness.js')).text());
for (const p of ['A','B','C','D','E','L']) console.log(p, await window.__xssRun(p, window.__raw));
```
通過標準：A～E 的 `vulnCount` 全為 0；L 的 `extra.doubleEscaped` 為 `false` 且 `literalOccurrences` > 0；`renderErrors` 為空。
新增畫面或欄位後必跑；**建議每類重複跑 2 輪**（曾因偵測時序漏報一次）。

## 3. 唱跳音符選取連動測試（瀏覽器內執行）
`tests/songs_selection.js` 驗證底部「已選取 N 首」、播放按鈕提示、實際播放內容三者一致：只計算、只播放**目前篩選範圍內**有勾選的歌；在其他篩選下勾選而被隱藏的歌會保留（切回去仍打勾），但不計入也不播放。涵蓋類別篩選、搜尋、重設、全選目前歌曲、點歌曲開始播放、英文介面（共 14 項）。測試期間播放器與提示訊息被替換成假函式。
```js
// 開啟 http://localhost:8765/index.html，等歌曲載入後：
(0, eval)(await (await fetch('/tests/songs_selection.js')).text());
console.log(await window.__songSelectionTest());   // allPass 應為 true
```
修改 `renderSongsList`、`updateSongsBottomBarUI`、`playSelectedSongs`、`openSongPlayer`、篩選相關函式後必跑。

## 4. 語系稽核（瀏覽器內執行）
`tests/i18n_audit.js` 在**英文介面**下驅動所有畫面（含焦點活動三種狀態、各種彈窗、管理後台），掃描所有文字節點與屬性（title／placeholder／alt／aria-label），先剔除「試算表資料」（活動名稱、歌名等使用者輸入的內容本來就不翻譯），剩下含中文的就是**漏翻譯的介面標籤**。
```js
// 開啟 http://localhost:8765/index.html，等資料載入完成後：
window.__raw = JSON.parse(localStorage.getItem('nobel_a_cached_app_data'));
(0, eval)(await (await fetch('/tests/i18n_audit.js')).text());
const rep = await window.__i18nAudit(window.__raw);   // rep.items = 仍是中文的介面文字（含出現位置）
```
判讀時要排除「刻意保留」的項目：語言切換鈕上的「繁體中文」、切換鈕的中英並列提示、焦點活動的內容文字。管理後台約 220 筆尚未翻譯（刻意：後台使用者為中文教師）。新增畫面或文字後，公開頁面的漏翻譯應維持在 0（刻意保留者除外）。

> 注意：`xss_harness.js` 會把「被下毒的測試資料」載入頁面。**執行完請重新整理頁面，再跑其他測試**（否則歌曲選取測試等會因資料被污染而誤判失敗）。`songs_selection.js` 需從中文介面開始執行。

## 5. 相簿封面每日輪替前端測試（瀏覽器內執行）
`tests/covers_frontend.js` 驗證每天固定一張（決定性、每天輪替、分佈不偏斜、不同相簿不同）、備援（無候選、惡意候選、圖片載入失敗自動退回固定封面，含真實網路失敗）、實際渲染（重新渲染封面不變）、後台維持固定封面。
```js
// 開啟 http://localhost:8765/index.html，等相簿載入後：
(0, eval)(await (await fetch('/tests/covers_frontend.js')).text());
console.log(await window.__coverFrontendTest());   // allPass 應為 true
```
注意：測試用的候選 ID 是假的，渲染後必須「立即同步讀取」圖片網址（否則瀏覽器收到錯誤、備援先動作，會誤判）；測試中已處理。

## 6. 名稱對照表前端測試（瀏覽器內執行）
`tests/namemap_frontend.js` 驗證 `tn()`／`nameEn()` 的翻譯與備援（查不到顯示中文）、對照表過濾（空值、非字串、`__proto__` 等）、各顯示點（相簿、文件、歌曲含播放視窗、學期、活動對象）、**篩選仍以中文原名運作**、搜尋同時比對中英文、切換語言即時更新、惡意英文內容被跳脫（共 25 項）。
```js
(0, eval)(await (await fetch('/tests/namemap_frontend.js')).text());
console.log(await window.__nameMapFrontendTest());   // allPass 應為 true
```
> 測試必須從中文介面開始、並在頁面資料載入完成後執行。測試會暫時擋住「背景雲端資料更新」（`handleDataLoaded`），否則更新完成時會把測試用的對照或畫面清掉而誤判。`covers_frontend.js` 同樣處理。

## 新增畫面時的跳脫規則（build_index.js）
- 放進 HTML 文字或屬性值：`esc(值)`
- 放進 `onclick="fn('…')"` 的 JS 字串：`jsq(值)`
- 放進 `href`／`src`：`escUrl(值)`（只允許 http(s)、相對路徑、blob:、data:image/）
- 用 `textContent`／`.value` 賦值是安全的，不需跳脫

## 瀏覽器測試補充（2026-10-05，貼到載入 index.html 的頁面 Console 執行）
- `tests/retry_frontend.js`：讀取失敗自動重試（3 種情境，約 30 秒）。
- `tests/albumphotos_frontend.js`：相簿照片瘦身回應（由 id 組網址、不合法 id 被略過）。
- `tests/songs_player.js`：連續播放用同一個播放器 `loadVideoById` 換歌（不銷毀重建）。
- 另有 Node：`node tests/warmcache.test.js`（快取預熱，10 項）、`node tests/albumphotos.test.js`（相簿照片快取，12 項）。
- `tests/wait_hint.js`：載入等待提示與縮圖進度（約 20 秒，15 項）。
