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

## 實機驗收與診斷
- `tests/safari-checklist.md`：iPad／iPhone Safari 實機驗收清單（18 項）。
- `diag.html`（網站根目錄，`…/3of3/diag.html`）：手機連線診斷頁，逐一呼叫 `getAlbums`／`getAppData` 並顯示狀態碼、耗時、錯誤名稱；**只按一次按鈕**。
- `tests/new_badge.js`：NEW 標籤（判斷邏輯含台北時區邊界、三種卡片渲染、惡意日期字串，17 項）。

## 自動化檢查（CI）
- `bash tests/ci.sh`：語法檢查（`Code.js`、`index.html` 內嵌 script）、重新建置並確認 `index.html` 與已提交版本一致（防止手改或忘了建置）、執行 6 套 Node 測試。任何一步失敗即以非 0 結束。
- GitHub Actions（`.github/workflows/ci.yml`）在每次推送到 `main` 與每個 PR 自動執行同一支腳本；結果看 GitHub 倉庫的 Actions 分頁，或 `gh run list`。
- 不含瀏覽器端測試（`tests/*.js` 需貼到 Console 執行），這些仍需手動跑。
- 本機改動後、推送前先跑一次 `bash tests/ci.sh`，可避免推上去才發現失敗。
- `node tests/pwa.test.js`：加到主畫面設定（manifest 欄位、圖示存在且尺寸正確且不透明、`index.html` 的 link／meta，30 項；已納入 `tests/ci.sh`）。
- `tests/standalone.js`（瀏覽器）：App 模式的重新整理鈕與回到前景自動同步（13 項）。
- **提醒**：瀏覽器可能快取 `tests/*.js`；改了測試檔後，載入時請用 `fetch('/tests/xxx.js?v='+Date.now(), {cache:'no-store'})`。XSS 偵測器會執行每個 `on*` 處理器，新增會導向或重新載入頁面的按鈕時，要在 `xss_harness.js` 的「安全閥」區塊把對應函式換成假函式。
- **更換 logo 時**：把新的透明背景 PNG 放成 `logo-hires.png`，執行 `python3 tools/make_icons.py` 重新產生 `icons/`，再跑 `node tests/pwa.test.js`。
- `tests/event_minor.js`（瀏覽器）：活動細項小標籤（每日詳情與全月總覽、空值、舊欄位名稱、惡意字串、英文名稱對照，共 11 項）。
- `tests/small_improvements.js`（瀏覽器）：縮圖 w480、大字開關、列印本週菜單（欄位、週末規則、跳脫、無菜單提示、英文、列印樣式，共 28 項）。
- `tests/sidebar.js`（瀏覽器，**視窗寬度需 ≥ 768**）：側邊欄對齊（切換頁籤後再量）與觸控裝置的展開／收合邏輯（18 項）。
- `node tests/ics.test.js`：行事曆訂閱 `.ics`（篩選、全天事件日期含跨月跨年、逸出、位元組摺行、髒資料、`doGet` 唯讀動作與失敗備援，36 項；已納入 `tests/ci.sh`）。
- `tests/subscribe.js`（瀏覽器）：訂閱按鈕與說明視窗（網址、`webcal://`、複製與備援、關閉、字典，15 項）。
- `node tests/textmap.test.js`：自由文字英文 TextMap 後端（掃描、同步不覆蓋、機器草稿只寫 draft、採用草稿、回傳與大型分段快取、`doGet` 唯讀動作，65 項；已納入 `tests/ci.sh`）。
- `tests/textmap_frontend.js`（瀏覽器）：`tx()` 查表與各顯示位置（活動、菜單、列印、焦點活動、相簿、文件、主題）、退回中文、跳脫、載入與快取（40 項）。
- `node tests/mapadmin.test.js`：後台英文對照編輯後端（token 驗證、列表、批次儲存、只刪未使用、同步、草稿上限、採用、統計、`doPost` 路由與冪等，60 項；已納入 `tests/ci.sh`）。
- `node tests/spotlightorder.test.js`：焦點活動播放順位（順位只屬於播映中、即時算出連續 1～N、到期補位、排程中開播排最後、移動順位與夾範圍、整理後的清單、已整理好不重複寫回、預設篩選；後端 `updateSpotlightsOrder`／`saveSpotlight` 可清空順位、空白不變成 1，33 項；已納入 `tests/ci.sh`）。
- `tests/spotlight_adminlist.js`（瀏覽器）：後台焦點活動列表（預設只顯示播映中且依輪播順序、清除篩選回到預設、順位下拉只給播映中並為 1～N、其他顯示未排／已取消順位、到期自動補位、排程中開播排最後、改順位寫回播映中 1～N 其餘清空、儲存與刪除後整理、登入後第一次畫列表自動整理、搜尋、跳脫，46 項；約 10 秒）。
- `tests/spotlight_relist.js`（瀏覽器）：後台焦點活動「再次上架」（按鈕、帶入內容與圖片、新編號、起始日＝今天、結束日留空、不上傳、原本那筆不變、結束日未填提醒、結束日早於開始日擋下、編輯與新增不受影響、跳脫，36 項；約 6 秒）。
- `node tests/songnodl.test.js`：唱跳音符「不開放下載」後端（公開資料剝除檔案欄位含快取、`adminSongList` 需 token、`saveSong` 的私人資料夾搬移與搬回、每次確認的自我修復、讀回驗證與失敗診斷、批次 `adminSongSetAccess`、試算表選單同步、換檔案舊檔處理、安全網不清空檔案資訊與沿用旗標、`uploadSong` 直接建在私人資料夾與失敗取消、`doPost` 路由與 `doGet` 不提供，84 項；已納入 `tests/ci.sh`）。
- `tests/song_batch.js`（瀏覽器）：批次設定（每列／表頭勾選、全選目前篩選結果跨頁、不在篩選範圍內的提示、確認視窗、每 5 首分批與進度、執行中鎖定、結果摘要與失敗原因、即時反映本機、停止、登入逾時、連線中斷、設為開放、跳脫，36 項）。
- `tests/song_nodownload.js`（瀏覽器）：前台只有開放的歌曲有下載圖示、後台勾選框與「🔒 不開放下載」標籤、編輯與儲存不清空檔案資訊、送出 noDownload、上傳、警告、登出清除完整資料、取完整歌單失敗、跳脫，31 項。
- `node tests/bareget.test.js`：直接開 GAS `/exec`（沒有 action）只回導向頁（含正式網址、`target="_top"` 連結、不開試算表、不建立工作表、不提供舊版前端；有 action 的唯讀 API 照舊、寫入類動作仍被拒；`.claspignore` 不再放行 `index.html`，21 項；已納入 `tests/ci.sh`）。
- `node tests/adminlist.test.js`：後台列表搜尋、篩選、排序、分頁純函式（頁碼夾回、全部顯示、多關鍵字 AND、類別大項／細項、對象空白與全形逗號、排序與同日順序、相簿編號數值比較、歌曲反轉、焦點活動輪播狀態與編號時間，82 項；已納入 `tests/ci.sh`）。
- `tests/adminlist_frontend.js`（瀏覽器）：活動／相簿／歌曲三個後台列表的搜尋與分頁介面（預設 10 筆、最新在最上、圖示按鈕且無文字、20／50／全部與記住選擇、搜尋類別對象排序、清除、符合筆數、無符合與無資料、刪除後頁碼夾回、跳脫、互不影響，69 項；約 15 秒）。
- `node tests/spothistory.test.js`：歷史焦點篩選邏輯（一季＝3 個月與月底／跨年、門檻當天、停用、未開始、無結束日、輪播中不重複、排序、日期推進後消失，21 項；已納入 `tests/ci.sh`）。
- `tests/themeoverview.test.js`（Node，已進 CI，21 項）：學期主題架構圖後端（Drive 連結／ID 解析與惡意字元過濾、學期→圖檔對照、`ThemeSemesters.overviewImage` 欄位自動補上與不重複、`getThemesData`／`getAppData` 帶出）。已做 10 種變異測試全數抓到。
- `tests/admin_first_open.js`（瀏覽器，9 項；約 5 秒）：後台活動列表「第一次點進來是空的」的修正（資料到達時使用者在首頁、進入後台頁籤時重畫、依目前子面板重畫、沒登入不呼叫、沒登入時資料到達不出錯）。已做 4 種變異測試全數抓到。
- `tests/restore_tab.js`（瀏覽器，20 項；約 5 秒）：重新整理後停在原頁（切換時記錄頁籤與後台子面板、各頁籤與子面板還原、未知／惡意值逐一忽略、沒有記錄從首頁開始、`sessionStorage` 被拒絕不出錯、`initApp` 有呼叫 `restoreSavedTab()`）。已做 6 種變異測試全數抓到。
- `tests/new_since.js`（瀏覽器，31 項；約 4 秒；需手機裡已有快取資料、從中文介面開始）：「上次來之後有什麼新的」紅點（純函式：活動只算今天以後、焦點只記播映中、銜接文章前綴、起點沒有的類別不提示；第一次開啟不提示；新開啟時新活動／相簿／歌曲／銜接文章的側邊欄、底部導覽、「更多」按鈕與面板紅點；補登過去活動不算；同一次開啟再載入維持；離開頁面才消失、重新整理不復活；中途同步到新項目再出現；重開後沒有新內容就沒有紅點；排程中焦點開播後算新；記錄壞掉與儲存空間被拒不出錯；新增菜單與修改相簿不算；中英文字）。結束後還原紅點記錄。變異測試（離開頁面不標記看過、過去活動也算、不使用一次開啟的固定起點）分別抓到 4、3、3 項失敗。
- `tests/skeleton.js`（瀏覽器，27 項；約 4 秒；需手機裡已有快取資料，先正常開一次網站）：載入骨架與「第一次開啟就連線失敗」（`<head>` 及早加 class、7 個頁面載入中都顯示骨架且資料區塊隱藏、唱跳音符底部播放列隱藏、只用 motion-safe 閃動、螢幕閱讀器文字、資料到了顯示內容、連線失敗與後端回傳失敗都換成失敗面板且不跳舊資料提示、錯誤原因只當文字、重新載入先回骨架再成功、已有資料時失敗照舊只跳提示、中英文字）。測試期間替換 `callBackend`／`showToast`／`loadAppData`。變異測試（失敗一律跳提示、載入中不隱藏資料區塊）分別抓到 6、8 項失敗。
- `tests/admin_groups.js`（瀏覽器，29 項；約 4 秒；需從中文介面開始）：後台兩層頁籤（4 組依序、11 個子頁籤各屬一組且 `data-group` 與畫面順序一致、切到每個子頁籤時只顯示同組子頁籤與該面板、點組別回到上次停留的子頁籤、未知組別不動作、待辦提醒「前往」與重新整理還原會切到正確組別、英文對照紅點同步到「系統」組別、組別中英文字）。測試期間替換 `mapAdminOpen`／`refreshAlbumsNow`（不打後端）。變異測試（組別判斷一律回「日常」）抓到 14 項失敗。
- `tests/action_icons.js`（瀏覽器，32 項；約 6 秒）：六個列表的列上操作按鈕都是同一款純圖示（無文字／表情符號、統一樣式與尺寸、有 title 與 aria-label、同一功能在所有頁面用同一個向量圖、五種功能各不相同、順序固定刪除最後、點下去呼叫對應處理函式、標題含單雙引號不弄壞屬性、平常中性灰滑過才變色、表單主要按鈕仍保留文字）。已做 9 種變異測試全數抓到（其中一種「刪除圖示與編輯完全相同」一開始因變異做得不夠徹底而漏網，改過後已抓到）。
- `tests/form_mode_spotlight.js`（24）、`form_mode_theme.js`（24）、`form_mode_doc.js`（21）、`form_mode_menu.js`（28）、`form_mode_song.js`（20）（瀏覽器；各約 6 秒）：其他後台表單的新增／編輯／複製模式（做法同下一條，各表單的差異見 `SPECIFICATION.md` 2.4 活動管理）。**菜單**以日期為識別（沒有菜單＝新增、已有＝編輯、複製到其他日期、換日期防呆、覆蓋前確認）；**歌曲**沒有另存／複製（音樂檔不能共用）。已對這 5 個表單做 27 種變異測試全數抓到。測試期間替換 `confirm`／`alert`／`callBackend`／`showToast`／`loadAppData` 並還原 `localStorage`。
- `tests/event_form_mode.js`（瀏覽器，44 項；約 6 秒）：後台活動表單的新增／編輯／複製模式（橫幅與顏色、按鈕、更新前的差異確認與「沒有變更」、另存為新活動不動原活動、複製清空日期且存成新的一筆、未儲存內容的切換防呆、列表標示編輯中與複製鈕、惡意標題、儲存提示）。測試期間替換 `confirm`／`callBackend`／`showToast`／`loadAppData` 並還原 `localStorage`。已做 16 種變異測試全數抓到。
- `tests/theme_overview.js`（瀏覽器，32 項；約 6 秒）：架構圖卡片顯示在該學期最早一週之後（篩選單一學期／全部學期／兩個學期都有／只有一週）、沒有設定或 ID 不合法不顯示、縮圖、沒有多餘連結與說明文字、點圖放大、惡意學期名稱（含引號跳出屬性）、英文、舊版後端相容、`handleDataLoaded` 帶入。已做 10 種變異測試全數抓到。
- `tests/albumcount.test.js`（Node，已進 CI，25 項）：`recountAlbum`（需 token、只處理已登記相簿、照片與影片分開計數、補 `videoCount` 欄、不改 `updatedAt`／封面、只清該相簿清單快取、Drive 失敗不改試算表）與 `getAlbums` 帶出 `videoCount`（含新登記相簿掃描）。已做 12 種變異測試全數抓到。
- `tests/album_video.js`（瀏覽器）：相簿影片前端（混排清單、▶ 標記與 🎬 備援、數量徽章、檢視器改用 Drive 播放器並隱藏相片／幻燈片鈕、備用連結、切換與關閉時停止、自動播放跳過影片、不合法 ID／惡意檔名、舊版後端相容、英文，46 項（含管理員「重新整理」先清快取再背景逐本重算、失敗不卡住、登入逾時停止、進度與完成提示、連按只啟動一輪、一般使用者不清不算、自動載入不清、封面與後台表格的影片數量）；約 20 秒）。已做 27 種變異測試全數抓到（並因此抓到「幻燈片鈕的樣式被整段重設而洗掉隱藏」的真實 bug）。**不測實際播放**，需實機驗證。
- `tests/albumphotos.test.js` 另有 52 項後端測試（含影片混排、相機檔名依編號排序（含 `IMG_E`、混入亂碼檔名整本改用建立時間）、建立時間排序、時間相同比檔名、舊格式快取失效、`clearAlbumListCache` 需 token／只清相簿清單／不在 doGet），已做 16 種變異測試全數抓到。
- `tests/calendar_icons.js`（瀏覽器）：月曆格子圖示 🍱🥐🎂（有活動沒菜單、有菜單沒活動、兩者都有、週末、只靠大項或細項判定、菜單備註規則，並用假資料實際畫出 11 月月曆檢查格子，24 項；約 5 秒）。已做 6 種變異測試全數抓到（含還原成原本「綁在菜單底下」的 bug）。
- `tests/spotlight_home_nav.js`（瀏覽器）：首頁焦點輪播鍵盤與滑動（頭尾繞回、輸入框／組合鍵／有彈窗／不在首頁／卡片不在畫面內／只有一張、滑動門檻與方向與起手位置、換張重新倒數、焦點放大彈窗內的 ← → 與滑動、中英文提示，42 項；約 5 秒）。已做 10 種變異測試，9 種被抓到，1 種（只有一張的保護）是等價變異（原函式本來就會提前返回）。
- `tests/photoviewer_swipe.js`（瀏覽器）：照片檢視器手機滑動（方向、頭尾繞回、門檻、斜向／多指／按鈕上起手不算、關閉時無作用、自動播放重新倒數、鍵盤與按鈕不受影響、只有一張，22 項；約 5 秒）。已做 6 種變異測試（方向反、多指保護、按鈕保護、關閉檢查、斜向保護、未綁定）全數抓到。
- `tests/spothistory_nav.js`（瀏覽器）：歷史焦點詳情上一則／下一則（按鈕、位置提示、到頭停用不繞回、順序、搜尋範圍、鍵盤 ← →、手機滑動門檻與方向、影片區不攔截、切換時影片停止、英文介面、資料更新後這則消失，38 項；約 7 秒）。已做 7 種變異測試（滑動方向反、繞回、輸入框保護、影片區保護、組合鍵保護、搜尋範圍、滑動門檻）全數抓到。
- `tests/spothistory_frontend.js`（瀏覽器）：歷史焦點介面（按鈕位置、開關、列表分段與排序、卡片內容、搜尋、詳情與返回、影片、英文介面、空狀態、ESC／點背景、跳脫、首頁輪播不受影響，49 項；約 5 秒）。
- `node tests/mapsimilar.test.js`：後台「相似文字」分組純函式（和／與、標點、編號數字不同不分組、短文字、串接、`__proto__`、與標準編輯距離隨機對照 4000 組，30 項；從 `index.html` 取出函式執行；已納入 `tests/ci.sh`）。
- `tests/mapsimilar_frontend.js`（瀏覽器）：相似文字介面（標示、篩選與同組相鄰、只看這組、套用英文的確認與取消、只填入畫面不呼叫後端、儲存、NameMap 無此功能、跳脫，34 項；約 5 秒）。
- `tests/mapadmin_frontend.js`（瀏覽器）：後台英文對照介面（載入、篩選搜尋分頁、修改追蹤、批次儲存與分段、連續草稿與停止、採用、刪除、手動新增、種類切換、跳脫，76 項（含與其他列表一致的分頁 15 項）；約 25 秒）。
- `tests/docs_admin.js`（瀏覽器）：常用文件管理全在後台（前台沒有任何管理按鈕、後台表單＋列表、搜尋／類別／分頁、編輯／複製／刪除／新增、進入頁籤即有列表、空清單與無結果、跳脫，24 項；約 5 秒）。
- `node tests/semestertasks.test.js`（已納入 `tests/ci.sh`）：學期任務後端（解析與排序、驗證、儲存／刪除／整學期複製／設定總覽圖、欄位自動補齊、接線與權限，62 項）。
- `tests/tasks_frontend.js`（瀏覽器；**需從中文介面開始，已內建切換**）：學期任務前台（側邊欄位置、兩類別卡片、學期切換、總覽圖、英文、空狀態、跳脫）與後台（列表篩選分頁、新增／編輯／複製、刪除、整學期複製（含來源／目標預設值）、總覽圖設定，70 項；約 5 秒）。
- `node tests/transition.test.js`（已納入 `tests/ci.sh`）：幼小銜接後端（計畫與文章解析、驗證、儲存／刪除／整學年複製、危險連結過濾、欄位自動補齊、接線與權限，47 項）。
- `tests/transition_frontend.js`（瀏覽器；**會先切回中文介面**）：幼小銜接前台（側邊欄位置、計畫與文章分頁、類別卡片、篩選、勾選與進度、列印含勾選／空白版、學年度切換、文章重點／泡泡／金句／原文連結、英文、跳脫）與後台（計畫項目列表與表單、刪除、整學年複製、文章表單，74 項；約 8 秒，**不要和其他測試放在同一次執行**以免超過 45 秒上限）。
- `tests/today_card.js`（瀏覽器；會先切回中文介面）：首頁「今天／明天」小卡（位置、白天／晚上 6 點／週五晚上／週末的排序與「下一個上課日」、行事曆提示、午餐與點心、菜單尚未公布、幸福廚房圖示、看詳細內容、英文、跳脫）、後台待辦提醒（四種提醒、前往按鈕、沒事時的綠框）、「今天」按鈕回到真正的今天、手機標題不換行，20 項。
- `node tests/mobilenav.test.js`（已納入 `tests/ci.sh`）：手機底部導覽列設定後端（`MOBILE_NAV_TABS` 解析、`saveMobileNav` 驗證與寫入／新增列、接線與權限，18 項）。
- `tests/mobile_nav.js`（瀏覽器；會先切回中文介面，並暫時假裝 `window.innerWidth`）：底部導覽列（預設項目、亮起、切頁、「更多」面板與關閉、後台設定的項目與不合法時退回預設、後台設定卡儲存與重複檢查、英文）與手機月曆「模式鈕與格子連動」（預設查看本週、單日／本週只顯示一週、本月總覽整月、點日期切單日、週模式 ‹ › 移一週與跨月、今天、電腦不變、模式鈕不超出），41 項。
