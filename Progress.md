# 3of3 Kindergarten Web App Progress & Lessons Learned

## 📌 專案進度摘要（交接用，2026-10-07 更新）

> **新對話接手時請先讀本節與 `TODO.md`**，再視需要讀 `SPECIFICATION.md`（規格正本，v2.5.0，第 5.9～5.12 節為最近新增）與 `tests/README.md`（測試說明）。下方「Critical Technical Lessons Learned」第 1～21 條與其後的條列是**歷史紀錄，依時間排列**：其中第 1、2、19 條已過時（見各條註記）；2026-10-05 起每個項目都有「根因／做法／教訓／未驗證項目」，改相關功能前請先找對應條目。

### 一、目前狀態（一句話）
**線上穩定，沒有待部署或待推送的項目。** 後端 GAS 現行部署 **@125「中翻英後台」**（另有不可刪的 `@HEAD`，共 2 個部署）；前端 GitHub Pages 與 `main` 同步（工作區乾淨，GitHub Actions 通過）。**所有已上線功能皆已通過自動化測試，且都已由使用者在實機驗證。**
- **英文對照已實測（2026-10-06）**：使用者實際操作後台「🌐 英文對照」，回報沒有問題；發現「不同地方重複使用的相同內容，會得到不同的翻譯」。**原因已釐清**：不是逐字相同（例：「社-2-3 …遵守生活規範**和**活動規則」與「…規範**與**活動規則」，同為「主題活動：課程目標」），TextMap 以中文完全相同才共用，所以成兩筆、各翻各的。
- **2026-10-06 使用者實機驗證通過（皆為僅前端）**：① 後台英文對照「相似文字提示」（commit 1f4596a；中文差 1～2 字的列分組、「套用到相似列」）；② 前台「歷史焦點」（commit 9e37dd1；只列最近一季已結束、非停用、不在輪播的焦點活動；一季＝`SPOTLIGHT_HISTORY_MONTHS`＝3 個月）；③ 後台活動／相簿／歌曲列表搜尋與分頁（commit 007d5db；活動、歌曲的「最新建立」＝試算表列順序倒過來，相簿＝建立或更新日期新到舊；每頁筆數記在 `localStorage`）。細節見 `SPECIFICATION.md` 5.12、2.x 與 6.（後台）。
- **失敗通知已設定（2026-10-06，使用者確認）**：GAS 觸發條件中，備份 `weeklyBackup`（每週日 03:00）的「錯誤通知設定」＝**立即通知我**；預熱 `warmAppDataCache`（每 5 分鐘，錯誤率約 0.43%）**刻意維持「每天通知我」**（每 5 分鐘一次，偶發失敗很正常，立即通知會變成雜訊）。
- **2026-10-07 使用者實機驗證通過（皆為僅前端）**：① 後台焦點活動「🔁 再次上架」（commit 98c355c；帶入內容與圖片、新編號、不重新上傳、開始日＝今天、結束日留空、未填結束日儲存前提醒、結束日早於開始日擋下）；② 後台焦點活動列表搜尋與分頁（commit 1d42dfd；關鍵字、狀態、輪播狀態、排序最新建立／輪播順序；▲▼ 已移除，只留「第 N 順位」下拉＝真實輪播順位；「最新建立」由編號 `SP-`＋時間戳記推算）；③ 英文對照頁分頁改用共用分頁元件（commit 555192d；預設每頁 10 筆，可選 20／50／全部，記在 `localStorage`）。細節見 `SPECIFICATION.md`。
- **需要使用者決定**：兒童照片公開範圍（是否加班級通行碼）、管理員密碼是否改存雜湊（詳見 `TODO.md`）。

### 二、系統概覽
- **架構**：靜態前端（GitHub Pages，`https://avaltech-ai.github.io/3of3/`）＋ Google Apps Script Web App（唯一 `/exec` 端點）＋ Google Sheets（資料庫）＋ Google Drive（相片、文件、音訊）。**已無 Netlify**。
- **原始碼**：前端只改 `build_index.js`（單一檔案），再執行 `node build_index.js` 產生 `index.html`（**禁止手改 `index.html`**；CI 會檢查兩者一致）；後端為 `Code.js`；`logo_b64.txt` 是建置唯一依賴的資源檔；其他靜態檔：`manifest.webmanifest`、`icons/`（由 `logo-hires.png` 經 `tools/make_icons.py` 產生）、`diag.html`（手機連線診斷頁）。
- **GitHub**：`avaltech-ai/3of3`（**公開 repo**，任何密碼、金鑰、token 都不得進 repo）。本機以 `gh auth setup-git` 管理憑證，remote 網址不含 token。
- **環境**：Mac 沒有 Homebrew、沒有完整 Xcode（無法開 iOS 模擬器）；Node 在 `~/.nvm/versions/node/v24.18.0/bin`（指令前要 `export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"`）；`clasp` 已登入。管理員密碼存在試算表 `Settings!ADMIN_PASSWORD`，**不在任何文件或程式碼中**。
- **規模參考**：`getAppData` 約 67KB（2026-10-07 實測 68,960 位元組；`CacheService` 單筆上限 100KB；**菜單會隨學期成長，這是最大的長期風險**，所以英文對照另走 `getTextMap`）；相簿 12 本、照片約 2,700 張；現場列出一本 470 張相簿要 2～27 秒，因此相簿照片清單必須快取（已做）。
- **快取與預熱**：`app_data_v4`（10 分鐘）、`albph_<id>`（相簿照片清單，1 小時）、`text_map_v1_*`（英文對照，分段，10 分鐘）；`warmAppDataCache` 每 5 分鐘由觸發器重建（選單「⚡ 啟用網頁快取預熱」建立，**已啟用**）。公開 `doGet` 在快取命中時**完全不碰試算表**。

### 三、功能總覽（皆已上線；括號為驗證狀態）
- **資安與穩定性**（2026-10-05）：短效 token 登入與鎖定、`doGet` 只放唯讀動作、前端全站輸出跳脫（XSS 偵測 A～E 為 0）、寫入互斥鎖＋冪等性、每週日 03:00 自動備份、`getAlbumPhotos` 只允許已登記的相簿資料夾。
- **手機連線問題修復**（iPhone 連不上資料庫與相簿照片，根因四層，詳見條列）：快取不再被每次請求清掉、`getAppData` 命中快取不碰試算表、前端讀取逾時 30 秒＋自動重試、相簿清單瘦身與快取、預熱觸發器。（使用者實機驗證）
- **前台功能**：相簿封面每天固定一張；名稱對照表 NameMap；**自由文字英文 TextMap**（活動、每日菜單、主題活動、焦點活動、相簿標題、常用文件；機器草稿不公開，老師確認後才上線；英文介面才載入）；活動「細項」小標籤；「NEW」標籤（近 7 天新增或更新）；載入等待提示（已等待 N 秒、重試次數、縮圖進度）；相簿縮圖 480 像素；「大字」開關；列印本週菜單；**行事曆訂閱 `.ics`**（iPhone 與 Google 行事曆皆驗證可用）；唱跳音符連續自動播放（換歌用同一個播放器 `loadVideoById`，iPhone 驗證）與播放器全螢幕鈕；加到手機主畫面（PWA、`display: standalone`、名稱「諾貝爾A」、App 模式的 ↻ 與回前景自動同步）；側邊欄對齊修正與 iPad 觸控展開鈕。（以上皆經使用者實機驗證；英文對照後台已實際使用，見第一節）
- **後台**：新增「🌐 英文對照」頁籤——網頁編輯 NameMap 與 TextMap（搜尋、篩選、分頁、批次儲存、連續產生草稿、採用、刪除未使用、手動新增、新文字紅點）。（自動化測試通過；**使用者已於 2026-10-06 實機操作，無問題**；相似文字提示見第一節）

### 四、測試與驗證工具（`tests/`）
**每次改動前後都要跑**：`bash tests/ci.sh`（語法、`index.html` 與建置一致、內嵌 script 語法、13 套 Node 測試；GitHub Actions 在每次推送與 PR 自動執行同一支腳本）。
| 檔案 | 類型 | 內容 | 項數 |
| :-- | :-- | :-- | :-: |
| `auth` / `idempotency` / `covers` / `namemap` | Node | 登入 token、冪等、封面候選、名稱對照 | 44 / 21 / 48 / 43 |
| `warmcache` / `albumphotos` | Node | 快取預熱、相簿照片快取與限制資料夾 | 10 / 21 |
| `pwa` / `ics` | Node | 主畫面設定與圖示不透明、行事曆訂閱 | 30 / 36 |
| `textmap` / `mapadmin` / `mapsimilar` / `spothistory` / `adminlist` | Node | 自由文字英文對照後端、後台英文對照後端動作、相似文字分組、歷史焦點篩選、後台列表搜尋分頁（含焦點活動） | 65 / 60 / 30 / 21 / 82 |
| `xss_harness.js` | 瀏覽器 | 全欄位下毒 XSS 偵測（A～E 必須 0；L 不得雙重跳脫） | — |
| `songs_selection` / `songs_player` | 瀏覽器 | 歌曲選取連動、連續播放與全螢幕 | 14 / 16 |
| `covers_frontend` / `namemap_frontend` | 瀏覽器 | 封面輪替、名稱對照前台 | 15 / 25 |
| `new_badge` / `event_minor` / `small_improvements` | 瀏覽器 | NEW 標籤、活動細項、縮圖／大字／列印 | 17 / 11 / 28 |
| `standalone` / `sidebar`（視窗需 ≥ 768） | 瀏覽器 | App 模式、側邊欄對齊與觸控展開 | 13 / 18 |
| `wait_hint` / `retry_frontend` / `albumphotos_frontend` / `subscribe` | 瀏覽器 | 等待提示、讀取重試、相簿瘦身回應、訂閱視窗 | 15 / 3 情境 / — / 15 |
| `textmap_frontend` / `mapadmin_frontend` / `mapsimilar_frontend` / `spothistory_frontend` / `adminlist_frontend` / `spotlight_adminlist` / `spotlight_relist` | 瀏覽器 | 英文顯示 `tx()`、後台英文對照介面、相似文字介面、歷史焦點介面、後台列表搜尋分頁介面、焦點列表搜尋分頁、再次上架 | 40 / 76 / 34 / 49 / 69 / 38 / 36 |
| `i18n_audit.js`、`safari-checklist.md`、`diag.html` | 稽核／手動 | 英文漏翻譯稽核、實機驗收清單、手機連線診斷 | — |
- **測試品質做法**：每個新測試都做 2～12 種「故意破壞程式」（變異測試）確認抓得到，曾因此抓出恆真斷言與多個測試盲點。
- **瀏覽器測試的陷阱**：① 載入測試檔要加 `?v=時間戳` 與 `cache:'no-store'`（瀏覽器會快取）；② `xss_harness` 會執行頁面上每個 `on*` 處理器，新增會導向／重新載入／開列印／改偏好的按鈕要在其「安全閥」換成假函式（已有 `appRefresh`、`print`、`toggleBigText`），且跑完要重新整理再跑其他測試；③ 測試期間要擋住背景更新（`handleDataLoaded`）；④ 一次 `javascript_tool` 執行上限約 45 秒，長測試要拆開；⑤ `sidebar.js` 需視窗寬度 ≥ 768；⑥ 瀏覽器會吃掉 `<input>` 裡的換行，測清理邏輯要直接呼叫函式。

### 五、標準作業流程（SOP）
1. 修改 `build_index.js`／`Code.js` → `node build_index.js`。**含中文的批次修改請寫成帶 `# -*- coding: utf-8 -*-` 的 `.py` 檔再執行**（曾因 heredoc 經 stdin 傳入而遇到編碼錯誤）。**build 腳本是 template literal**：`\\n`、`\\d`、`\\/` 的反斜線要寫兩次、字串裡不要用 `\\'`（撇號會消失）、不要出現未跳脫的 `${` 與反引號——`tests/ci.sh` 的內嵌 script 語法檢查會抓到。
2. 驗證：`bash tests/ci.sh` ＋瀏覽器測試（含 XSS 偵測）。
3. 提交：`git add -A && git commit`（訊息結尾加 `Co-Authored-By` 行）。
4. **部署順序：後端先、前端後**（前端相容新舊格式時可顛倒，但仍建議照順序）：
   - 後端：`clasp push` → GAS 編輯器「部署 → 管理部署作業 → 鉛筆 → 版本選**新版本** → 部署」。**絕不能選「新增部署」，也不要用 `clasp deploy -i`**；發布後 `clasp deployments` 確認仍是 2 個。
   - 前端：`git push origin main`，GitHub Pages 約 1～2 分鐘重建，`gh api repos/avaltech-ai/3of3/pages/builds/latest` 確認；`gh run list` 看 CI。
   - **查版本別用 `clasp version`**（不帶參數會**建立新版本**，2026-10-07 誤建了版本 126：未部署、無影響，但編號已被佔用，下次發布新版本會是 127 以後）；用 `clasp deployments` 看部署、`clasp versions`（複數）列版本。比對 GAS 伺服器內容與本機：把 `.clasp.json`、`appsscript.json` 複製到暫存資料夾 `clasp pull` 再 `cmp`（不要在專案資料夾直接 pull，會覆蓋本機）。
5. 部署後驗證：`curl` 唯讀檢查 `?action=getAppData`、`?action=listSheetNames`（必須回「未知動作」）與該次新增的動作；管理員動作用**錯誤 token**確認被拒絕（回「登入已逾時或無效」，**這不會累計鎖定次數**；但**不要**用錯誤的登入密碼打 `verifyPassword`）。**不要加 `-X POST`**。發布後約 1 分鐘內 Google 可能讓部分請求仍由舊版處理，等一下再連測。
6. 瀏覽器驗證時網址加 `?fresh=…` 繞過 GitHub Pages 約 10 分鐘的頁面快取。

### 六、試算表維運（選單「🌟 諾貝爾A班專屬功能」）
- 💾 立即備份試算表（另有每週日 03:00 自動備份）；🔓 解除後台登入鎖定（連錯 5 次鎖 15 分鐘）；🖼️ 重建相簿封面候選；⚡ 啟用網頁快取預熱（每 5 分鐘，**已啟用**）；🔄 清除快取並強制重新整理。
- 🔤 同步名稱對照表（NameMap）；🌐 同步英文翻譯／🤖 產生英文草稿／✅ 採用全部英文草稿（TextMap；**建議改用後台「🌐 英文對照」網頁操作**，兩種方式並存）。
- 🚀 一鍵初始化／重設資料庫（**危險**，二次確認，不要輕易使用）。
- `Settings` 可選列 `SHOW_MACHINE_TRANSLATION` = `TRUE`：`en` 空白時改顯示機器草稿（預設關閉，不建議）。
- **不可更改工作表名稱與第一列欄位名稱**；直接改試算表，前台最多約 10 分鐘生效（或選單「清除快取」）。

### 七、待辦與待決定（皆不阻塞線上運作；詳見 `TODO.md`）
- **使用者處理**：（目前無）
- **使用者決定**：兒童照片公開範圍（只在前端擋沒有真正保護力，要擋得住需後端驗證＋Drive 權限調整，先決定政策）；管理員密碼改存雜湊（就不能直接在試算表改密碼）。
- **低優先**：相簿排除封面設定（某些相簿不想出現在封面）；後台介面文字英文化（約 220 筆，後台使用者是中文教師，不建議主動做）。
- 已明確**不做**：LINE 通知（舊 Notify 已停用）、離線模式／service worker（容易卡在舊版）。歌曲標題不翻譯。

### 八、已知限制與風險
- token、冪等快取、登入鎖定、各種快取都存在 `CacheService`，Google 極少數情況會提前清除：結果是老師被要求重新登入或某次載入較慢，不影響資料。
- `getAppData` 會隨學期成長（菜單、活動）而逼近 100KB 快取上限：若超過，快取會靜默失敗並回到每次讀整份試算表（7～12 秒）。**若載入又變慢，先查這個**；解法是比照 `getTextMap` 做分段快取或拆分資料。
- TextMap 以**中文原文完全比對**：老師改了中文，舊翻譯不再套用，需重新同步與翻譯；Google 翻譯有每日額度與品質限制，機器草稿一律不公開。
- 行事曆訂閱：Apple 數小時、Google 常見 12～24 小時才更新（訂閱機制本身的限制）；活動一律全天事件。
- 相簿候選在 Drive 內直接刪除照片後不會自動更新（封面載入失敗會退回固定封面，按選單重建）。
- 前端仍有近百處 `innerHTML`（有跳脫工具與偵測器把關）；新程式請優先用 `textContent` 或 `esc()`／`jsq()`／`escUrl()`。
- `doGet` 是公開匿名入口，**只能放唯讀動作**；任何會寫入、清快取、初始化的動作都不得放進去；全域函式等同公開 API，**每個都要先驗證 token**（管理員動作）。
- **直接開 GAS `/exec` 網址（不帶 action）會看到存在 GAS 專案裡的舊版 `index.html`**：`.claspignore` 讓 `clasp push` 也會推 `index.html`，而 @125 釘在版本 125，所以那份停在 2026-10-06 的前端（與 GitHub Pages 不同）。正式前端是 `https://avaltech-ai.github.io/3of3/`，家長應只用這個網址；若要避免有人誤開舊版，見 `TODO.md`「待決定：裸 /exec 網址」。
- App 模式（standalone）沒有重新整理鈕，已用標頭 ↻ 與回前景自動同步補上；之後新增會導向頁面的按鈕要留意。

### 九、與使用者協作的偏好
繁體中文；結論先行；**新功能先討論設計與決定點、由使用者拍板再動工**；建議傾向全盤採納（所以建議要務實可實作並標明取捨與工作量）；**交付必附手動部署步驟**；GAS 重新部署要沿用同一個部署以保住 `/exec` 網址；使用者非工程背景，說明用後果與類比，但檔名、指令、路徑要精確可複製；**需要實機才能驗證的，要明講「未驗證」並請使用者實測**；使用者說「結束／不要再自行啟動」時，不得再開新工作。另：聊天視窗貼的圖片不會存成檔案，需要檔案時請使用者放進專案資料夾。

### 十、關鍵檔案地圖
`Code.js`（後端）｜`build_index.js`（前端單一來源）｜`index.html`（產物）｜`manifest.webmanifest`、`icons/`、`logo-hires.png`、`tools/make_icons.py`（主畫面）｜`diag.html`（連線診斷）｜`tests/`（測試與 `ci.sh`、`README.md`、`safari-checklist.md`）｜`.github/workflows/ci.yml`｜`TODO.md`（待辦與優先順序）｜`SPECIFICATION.md`（規格正本）｜`README.md`。制度與跨專案教訓在 `~/.agents/institution/`（專案專屬記憶在 `~/.claude/projects/-Users-chiehwu-AI-Vibe-3of3/memory/`）。

---

## Critical Technical Lessons Learned (Do Not Repeat)

### 1. Google Apps Script POST Requests & CORS
> ⚠️ **已過時**：現行做法是 `fetch` + `text/plain`（見第 20 條），iframe 僅為備援；且 `doPost` 已加互斥鎖、冪等與 token 驗證（見第 21 條之後）。
**Problem**: Netlify serverless functions (`/api/gas`) and direct `fetch()` POST requests from browsers fail due to Google's strict bot-protection and CORS policies. Google responds with a 302 redirect to a login page or a 404 page, breaking the API.
**Solution**: 
- **Hidden Iframe Submission**: Always submit POST requests via a hidden `<form target="iframeId">`. This entirely bypasses CORS restrictions.
- **GAS HTML Response**: The `doPost` function in GAS **must** return an `HtmlService` page containing `<script>window.top.postMessage(result, "*");</script>` and set `setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`.
- **Message Reception**: The frontend listens for the `message` event to receive the API response from the iframe.

### 2. GAS Deployment Corruption (`clasp deploy -i`)
> ⚠️ **已更新**：目前一律用「管理部署作業 → 編輯 → 新版本」發布並沿用同一個部署；**不要選「新增部署」**（會留下帶舊漏洞的永久舊網址，曾因此累積 19 個部署）。
**Problem**: Running `clasp deploy -i [Deployment_ID]` on a deployment originally created via the GAS UI can silently corrupt its execution context. POST requests will inexplicably return a "404 Not Found" Google Drive error page instead of executing `doPost()`.
**Solution**:
- Avoid using `clasp deploy -i` for the main Web App deployment if it exhibits weird behavior. Use the GAS Web UI to click "New Deployment", then update the URL in the frontend code.

### 3. Template Literal Regex Escaping in Node.js
**Problem**: When writing Regex inside a Node.js template literal (e.g. `` const html = `<script> /\\d{4}/ </script>` ``), single backslashes are consumed by the template literal evaluator, resulting in `/d{4}/` in the output HTML. This causes an "Invalid regular expression" SyntaxError in the browser.
**Solution**:
- Always double-escape backslashes when generating regex dynamically via template literals: `\\\\d{4}`.

### 4. Browser Autoplay Policies
**Problem**: Browsers (Chrome, Safari, iOS) strictly block unmuted autoplaying media upon page load.
**Solution**:
- **Homepage Banners**: Must use `autoplay muted loop playsinline` (or `&mute=1` for YouTube). Use `pointer-events-none` on background iframes to prevent users from accidentally triggering YouTube's hover controls.
- **Modals**: Unmuted autoplay is permitted inside a modal *if* the modal was triggered by a user click event. However, YouTube iframe URLs do not support setting a specific volume (e.g., 30%). For custom volume control, use native `<video>` tags.


### 5. Multi-Tab Leaking & Background Refresh Interference
**Problem**: In single-page architectures with multiple views/tabs (`home`, `albums`, `docs`, `admin`), background data synchronization functions (such as `handleDataLoaded` and `renderFallbackLocalData`) must never blindly manipulate DOM visibility for a specific tab (e.g. `document.getElementById('tabContent-home').classList.remove('hidden')`). When an admin saved a menu or event, `loadAppData()` ran, forcibly unhiding `tabContent-home`. Since `home` appeared above `admin` in the DOM, both sections rendered simultaneously, cluttering the admin screen.
**Solution**:
- Always check `state.currentTab` when toggling section visibility upon data arrival.
- Ensure all other tabs have `classList.add('hidden')` and only `state.currentTab` has `classList.remove('hidden')`.
- Track `state.currentAdminSubtab` so the administrator remains on the exact editing panel (events, menu, spotlight, settings) without page jumps or unrequested content loads.
- Only run mock fallback data (`renderFallbackLocalData()`) during the initial application boot if data is completely empty, preventing state overrides during live saves.

### 6. Node.js Build Script Template String Interpolation
**Problem**: In `build_index.js`, the entire HTML template is wrapped in backticks (`` const htmlContent = `...` ``). Any client-side `${variable}` or backticks will be evaluated by Node.js during the build phase unless escaped, leading to syntax errors during `node build_index.js`.
**Solution**:
- Always use standard string concatenation (e.g. `'tabContent-' + tab`) for client-side scripts inside Node build strings, or thoroughly escape as `\${variable}`.


### 7. Frontend & Backend Document Management Integration
- **Feature**: Allows administrators to edit or delete existing documents directly from the public-facing "常用文件" (Docs) tab once authenticated in the admin backend.
- **Frontend Capabilities**:
  - Automatically detects administrator login status via `state.adminPassword` and `sessionStorage`.
  - In "常用文件" tab, renders a top admin action bar with an "➕ 新增常用文件" button.
  - Dynamically injects "✏️ 編輯" and "🗑️ 刪除" buttons on each document item.
  - Modal provides editing of file title, category (`保健用藥`, `學期行事曆`, `餐飲菜單`, `親師手冊`, `一般文件`), description, external/Drive download URL, and optional direct file re-upload to Google Drive.
- **Backend API (`Code.js`)**:
  - Implemented `saveDoc(docData, password)` to locate matching IDs in the `Docs` sheet or append new entries, updating `updatedAt` timestamp and metadata while preserving Drive file linkages.

  - Implemented duplicate upload prevention: When editing an existing document with a file link, if the administrator clicks to re-select the exact same file (filename match), the system will safely skip the Google Drive upload and perform a metadata-only save to preserve the original file link and save storage space.

### 8. Document Edit Duplication Bug Fix
**Problem**: When a user uploaded a new document using the frontend modal, the GAS `uploadDocument` function incorrectly generated a *new* document ID (e.g., `DOC-timestamp`) instead of using the frontend-provided ID. However, it still returned the new Drive file ID to the frontend, leading the frontend to assign `DOC-fileId` as the document ID in its local state. When the user subsequently edited this newly created document, the frontend passed `DOC-fileId` to the `saveDoc` API. The backend could not find `DOC-fileId` in the spreadsheet (since it saved `DOC-timestamp`), resulting in a duplicate row being appended instead of updating the existing one.
**Solution**:
- Modified `uploadDocument` in `Code.js` to reuse `docMeta.id`.
- Replaced the direct `sheet.appendRow` call in `uploadDocument` with a call to the existing `saveDoc()` function, ensuring it correctly updates an existing row if `docMeta.id` is found, or appends a new one if not.
- Fixed the frontend ID assignment (`res.docId || id || ...`) to ensure local state IDs remain strictly synchronized with the backend sheet IDs.

### 9. Sidebar Redesign (Accordion / Pinnable Navigation)
- **Feature**: Transformed the top desktop navigation menu into a fixed left-side accordion (drawer) sidebar.
- **Layout Mechanics**: 
  - Placed the sidebar inside a layout shell alongside a hidden layout spacer `sidebarWrapper`.
  - The actual sidebar `desktopSidebar` is `fixed` and floats above the content.
  - Hovering expands the floating sidebar from `w-16` to `w-56` overlapping the main content smoothly.
  - Clicking the "📌" pin button expands the structural `sidebarWrapper` to `w-56`, effectively pushing the main content to the right without overlapping.
- **Mobile Responsive**: 
  - Retained the highly intuitive bottom navigation bar (`fixed bottom-3`) for mobile and tablet devices (`md:hidden`).
  - Removed the duplicate top-right "管理後台" shortcut on mobile since it is already accessible via the bottom nav.
- **Header & Layout Cleanup**: Removed the scrolling ticker and live clock from the top gradient bar. Shrunk the top bar to a clean decorative strip (`h-1.5`) and perfectly aligned the left sidebar's top edge to eliminate the weird protruding gap. Also cleaned up backend settings UI and parsing logic for the ticker.
- **Sidebar Alignment**: Aligned the sidebar header ("🍄 選單導覽") perfectly with the left padding and icon width of the navigation items below it.
### 10. Privacy and Copy Adjustments
- **UI Copy**: Renamed "活動相簿" (Event Albums) to "影像紀錄" (Image Records) in both desktop sidebar and mobile bottom nav.
- **Privacy/Admin Control**: Hid the "瀏覽雲端 Docs 資料夾" (Browse Cloud Docs Folder) button from normal users in the "常用文件" section. This button is now exclusively visible to logged-in administrators.
### 11. Dynamic File Categories
- **Backend (GAS)**: Updated `Code.js` to automatically create a `DocCategories` sheet inside the database if it doesn't exist. The `getAppData` endpoint now returns these categories dynamically. Deployed new GAS version (@40).
- **Frontend**: Removed hardcoded HTML options for document categories. Implemented `renderDocCategoriesUI()` to dynamically populate category filter buttons and `<select>` options in both upload and edit modals using `state.docCategories`.
### 12. Layout Alignment and Album Privacy
- **CSS Layout Bug Fix**: Addressed a layout issue where the "常用文件" (Docs) blue card appeared indented vertically and horizontally compared to the "影像紀錄" (Albums) green card. This was caused by Tailwind's `space-y-6` CSS rule applying a 1.5rem top margin to the blue card even when the admin bar above it was set to `class="hidden"` (because Tailwind's selector targets the `[hidden]` attribute, not the class). Fixed by explicitly using `style="display: none;"` for the admin bar toggle instead of `classList.add('hidden')`.
- **Album Privacy**: Hid the "開啟 Google Drive 相簿" button for normal users and removed the text "相簿同步存放於 Google Drive 雲端硬碟。".
- **Bug Fix**: Fixed a JS syntax error (unescaped quotes) generated during the dynamic document categories patch that caused the frontend to freeze on the loading screen.
- **Text Updates**: Changed header titles to "影像記錄" and "常用文件".
- **Typography**: Increased the root HTML font size from 16px to 17.5px. Converted all hardcoded arbitrary pixel text sizes (e.g. `text-[10px]`) to `rem` equivalents so that the entire UI (text, margins, paddings) scales up proportionally by ~9.3% without breaking layout constraints.
- **Data Loading UX**: Prevented the "flash of old/dummy data" issue. The frontend now correctly displays the loading spinner until the Google Apps Script backend responds with the latest Google Sheets data, and only falls back to local data if the API connection fails.
- **Dynamic Content Administration**: Hooked up the "適用對象" (EventTargets) and "活動類別" (EventCategories) drop-downs to Google Sheets. The backend API automatically populates these lists on the frontend, allowing admins to adjust event options dynamically from the spreadsheet.
- **UI Bug Fix**: Aligned the calendar event dots (badges) and background block colors with the legend definitions. "幸福廚房" now correctly displays a yellow dot (`bg-sun-400`), and full-school events display purple dots (`bg-berry-500`).
- **Admin UI Enhancement**: Replaced the single-select dropdowns (`<select>`) for "適用對象" (target) and "活動類別" (category) with multi-select checkboxes. Handled the data serialization (comma-separated strings) to ensure compatibility with Google Sheets and the frontend rendering logic.
- **Category Split**: Split "活動類別" into "活動類別大項" (Category Major) and "活動類別細項" (Category Minor) in both the frontend UI and Google Sheets schema. The `saveEvent` Google Apps Script function was rewritten to be robust against column order changes and dynamically inject the `categoryMinor` header if missing.
- **Reverted UI to Dropdowns**: Changed the event category selection back from checkboxes to single-select dropdowns (`<select>`) based on user feedback.
- **Automated Column Migration**: Added a Google Apps Script migration logic that automatically renames the `category` column to `categoryMajor` in the `Events` sheet, and seamlessly inserts a `categoryMinor` column directly adjacent to it, moving all subsequent columns correctly.
- **Spotlight Carousel Direct Reordering**: Added direct carousel reordering controls directly on the "現有焦點活動列表" (Spotlight list in Admin). Users can now directly click `▲` (move up), `▼` (move down), or change the dropdown to swap/reorder any activity in the carousel instantly. Includes real-time UI/localStorage updates and automated batch sync to Google Sheets (`updateSpotlightsOrder`).
- **Priority Format Hardening**: Guarded against Google Sheets auto-formatting priority numbers as date serials by enforcing integer format (`0`) and normalizing priority values both on the backend and frontend.
- **Spotlight Modal Button Stabilization**: Fixed the issue where left/right navigation triangle buttons jumped vertically when switching between images of different aspect ratios. Locked `modalSpotlightMediaWrapper` with a fixed, stable responsive height (`h-[52vh] sm:h-[62vh] min-h-[340px] max-h-[620px]`) and `object-contain`, keeping the `◀` and `▶` button anchors completely stationary in the viewport across all picture switches.

### 13. Songs & Music Player System (唱跳音符)
- **Duration Parsing Bug & Fix**: Google Sheets automatically converted `mm:ss` (e.g. `03:45`) into date/time serial formats (e.g., `1899-12-30T00:03:45.000Z`), causing frontend song card durations to incorrectly display `00:01` or NaN. Resolved by enforcing explicit text formatting (`@`) on the duration column in Google Sheets, sanitizing ISO string parsing in `Code.js`, and adding duration format validation on the frontend.
- **YouTube API Batch Duration Sync**: Implemented `batchUpdateSongDurations(adminPassword)` in GAS backend. When invoked, it extracts video IDs from YouTube URLs in the `Songs` sheet, queries YouTube Data API v3 (`videos.list?part=contentDetails`), parses ISO 8601 durations (`PT#M#S`), and batch writes clean `mm:ss` durations back to the spreadsheet.
- **Player UI Simplification**: Streamlined the floating music player capsule with modern play/pause status toggles, persistent modal playback modes, and fluid responsive layouts.

### 14. Weekly Themes System Architecture (主題活動)
- **Database Schema**: Established `Themes` and `ThemeSemesters` sheets in the backend. Added CRUD endpoints in `Code.js` (`saveTheme`, `deleteTheme`) and integrated theme data loading into `getAppData`.
- **Payload Schema Synchronization**: Resolved backend-frontend payload parameter mismatches (standardized parameter name to `data` and aligned field mappings for `semester`, `week`, `title`, `startDate`, `endDate`, `description`, `images`, and `updatedAt`).
- **Dynamic Semester Dropdown**: Replaced hardcoded/free-text semester input in the theme editing modal with a dynamic `<select>` dropdown automatically populated from the `ThemeSemesters` sheet.
- **HTML5 Start & End Date Pickers**: Replaced ambiguous single-string date inputs with dual HTML5 date pickers (`startDate` and `endDate`), improving input validation and calendar consistency.
- **Google Drive Direct Thumbnail Rendering**: Optimized Drive image display by converting Drive sharing links and file IDs directly into Google's high-speed image CDN format (`https://lh3.googleusercontent.com/d/{id}`). Removed distracting hyperlinking on thumbnail images to keep cards focused on visual presentation.
- **Reverse Chronological Sorting (`sortThemesDesc`)**: Implemented automatic sorting logic across both frontend grid views and backend admin tables. Themes are sorted newest-first by start date and week, ensuring the latest kindergarten activities are immediately visible at the top.

### 15. Menu Navigation Hierarchy & Sidebar Reordering
- **Menu Sequence Realignment**: Moved the "主題活動" (Weekly Themes) navigation item to sit logically between "班級日常" (Daily) and "影像記錄" (Albums).
- **Sidebar Header Alignment**: Adjusted the "選單導覽" label font size, weight, and icon dimensions in the left sidebar to achieve 100% pixel-perfect horizontal and vertical alignment with navigation links below it.

### 16. Header, Branding & Admin Status Redesign
- **Official Branding**: Embedded high-resolution vector 3&3 logo (`logo_b64.txt`) in the top navigation header alongside "三之三生命教育基金會" and "新北市桃子腳非營利幼兒園" badges.
- **Brand Tagline**: Updated the red header pill to display "Happy Life" with rounded-full pill styling.
- **Admin Status Realignment**: Relocated the "管理員已登入" indicator badge and "登出" action button back to their intuitive location at the top-right corner of the website navigation bar.
- **Admin Login Modal Cleanup**: Stripped out verbose helper text and default password reminders (`#adminLoginCard`) to provide a clean, secure, and professional authentication interface.

### 17. Footer Contact Information Restyling
- **Copy Cleanliness**: Removed redundant "桃子腳幼兒園" text label and bullet separators from the footer.
- **Prominent Contact Details**: Restyled telephone and fax numbers with high-contrast, prominent rose typography (`text-rose-600 font-bold text-sm tracking-wide`): `TEL：02-2668-8249｜FAX：02-2668-8245`, ensuring parents can quickly spot contact details across all device sizes.

### 18. Sidebar Width & iPad Viewport Optimization
- **Problem**: On iPad and 768px–1024px tablet viewports, the desktop sidebar left margin occupied excessive whitespace (~192px–256px), severely squeezing right-side activity cards and tables.
- **Solution**:
  - Reduced the expanded/pinned sidebar width to `136px` (`w-[136px]`).
  - Reduced the collapsed icon-only rail width to `48px` (`w-12`).
  - Reclaimed 60px–120px of active viewport width for the main content area, providing ample breathing room for cards, forms, and photo galleries on iPad in both portrait and landscape modes.

### 19. Current Deployment Version & Environments
> ⚠️ **已過時**：現行部署版本與環境請見本檔最上方「專案進度摘要」。
- **Frontend**: Source maintained in `build_index.js`, compiling to `index.html`. Tracked on GitHub (`avaltech-ai/3of3.git` on branch `main`).
- **Google Apps Script Backend**: Version deployed at `@109` (`AKfycbx5JGeiSH2J1vkOu4rh9NPwFBWNSkn5PkHfY5o25t-K4WcOK8b3VQjXi-TqUOzS8TvdJg`).

### 20. Document Deletion & Database Synchronization Architecture Upgrade (檔案文件後台刪除同步異動修復)
- **問題根因分析 (Root Cause Analysis)**:
  1. **跨網域 iframe 通訊在 Safari 被阻擋**：先前外部環境（GitHub Pages）的 POST 請求一律依賴「隱藏 iframe + form 提交 + postMessage」機制。在 macOS / iPadOS / iOS 的 Safari 嚴格安全性策略（ITP）下，跨網域 iframe 提交經常被靜默攔截或 sandbox 隔離，導致 postMessage 回呼逾時或未被接收。
  2. **前台樂觀更新 (Optimistic UI) 偽成功假象**：`handleDeleteDocDirect` 在發送 API 請求前就先將文件自本地 state 和 localStorage 移除，且在後端報錯或網路異常時依然顯示「已自前台清單中移除」，使使用者誤以為已刪除成功，但 Google Sheets 後端實際上從未收到或成功執行異動。
  3. **前台身分驗證漏洞**：`doAdminLogin` 過去存在 `|| pwd.length > 0` 的測試容錯邏輯，若輸入非官方密碼仍可於前台登入，但後端 API 執行 `deleteDoc` 時會因 `checkPassword` 不符而拒絕寫入。
  4. **管理員密碼記憶同步問題**：`handleDeleteDocDirect` 呼叫後端時直接讀取 `state.adminPassword`，未有完整從 `sessionStorage`/`localStorage` 自動補齊的防呆回退。
- **解決方案與架構升級 (Solution & Upgrades)**:
  1. **引入標準 `fetch` POST 高速通訊管道 (`gasPostViaFetch`)**：使用標準 `fetch` 搭配 `Content-Type: text/plain;charset=utf-8`，完美繞過 CORS preflight 限制並自動遵循 Google 302 重新導向至 `script.googleusercontent.com`，原生取得包含 `Access-Control-Allow-Origin: *` 的 JSON 回應（平均回應僅需 1~2 秒），並保留 iframe form POST 作為次級容錯備援。
  2. **嚴格狀態回滾與精確錯誤回饋**：重構 `handleDeleteDocDirect`，刪除前保存 `prevDocs` 鏡像，必須待後端資料庫回傳 `success: true` 後才永久自本地清單與快取移除；若失敗則立刻還原畫面並明確彈出紅字錯誤原因（如「管理員密碼錯誤」或具體錯誤代碼）。
  3. **後端 `deleteDoc` 識別強化**：`Code.js` 升級 `deleteDoc` 邏輯，自動 trim 前後空白字元，並同時支援以文件編號 (`id`)、雲端硬碟檔案 ID (`driveFileId`) 或檔案名稱 (`fileName`) 比對刪除，防止因各欄位格式差異造成找不到記錄。
  4. **嚴格身分鑑權機制**：移除前台任意字串登入漏洞，新增通用 `getAdminPassword()` 輔助函式，確保所有管理端異動操作皆帶有合法憑證。
  5. **資料庫歷史資料清理**：已直接執行清理作業，將使用者先前欲刪除的 `DOC-02`（全園活動規劃暨親職活動行事曆）與 `DOC-04`（諾貝爾A班作息與入園須知手冊）自 Google 試算表 `Docs` 工作表正式移除，資料庫與前台畫面完全對齊一致。
  6. **端對端完整迴歸驗證**：已執行即時新增 `DOC-TEST-ROUNDTRIP` 並立即呼叫刪除的雙向測試，確認 Google 試算表即時異動率達 100%。

### 21. 安全性修補與穩健性強化（2026-10-05 / 10-11 測試驗證後續）
- **P0 安全性**：
  - 撤銷外洩的 GitHub PAT，git remote 改為不含 token（`gh auth setup-git` 管理憑證）。
  - `doGet` 僅保留唯讀動作（getAppData/getAlbums/getAlbumPhotos/getActivityImages）；移除免密碼的 `setupInitialDatabase`、`clearCache`、`listSheetNames`、`syncSongDurations`、`batchUpdateSongDurations`。`doPost` 同步移除 `setupInitialDatabase`，`batchUpdateSongDurations` 加密碼檢查。
  - `setupInitialDatabase` 改為私有 `setupInitialDatabase_`，僅能經試算表選單 `menuResetDatabase`（含二次確認）觸發；`ensureDatabaseInitialized` 不再自動灌入示範資料。
  - `checkPassword` 不再有內建預設密碼退路；前端 `doAdminLogin` 移除所有寫死預設密碼的放行分支。管理員密碼已更換，repo 為公開，**密碼不得寫入任何文件或程式碼**。
- **前端 bug**：`6e7b134` 在 template literal 內寫 `\n` 導致 build 後字串斷行、整段 script 無法執行（需寫 `\\n`，見第 3 條教訓）。已修復。
- **刪除與快取**：後端回「找不到該文件編號」視為已刪除並重新同步；雲端同步失敗時顯示「可能是舊資料」提示；移除前端內建的示範活動／菜單／焦點活動／文件／相簿備援資料。
- **P1 穩健性**：
  - `doPost` 加入 `LockService` 互斥鎖（等待上限 20 秒，小於前端逾時 25 秒），登入驗證不佔鎖。
  - 每週日 03:00 自動備份試算表到 Drive `桃子腳幼兒園 / Backup`，保留最近 8 份，備份資料夾強制私人（詳見 SPEC 5.5）。
  - 修正 `Code.js` 中 `ACTIVITY_FOLDER_ID` 常數的 `I`/`l` 誤植（線上以 Settings 值為準，原值僅為備用）。
- **已知未處理**：`localStorage` 仍明文保存管理員密碼（建議改 session token＋`sessionStorage`）；前端 `innerHTML` 缺統一跳脫；逾時重送可能重複寫入（建議 requestId 去重）；Tailwind CDN Play 版無 SRI。
- **部署與 repo 清理（2026-10-05）**：
  - GAS 專案原有 19 個部署（每次「新增部署」都會留下一個永久有效、停在舊程式碼的 /exec 網址，其中 9 個仍洩漏工作表清單且帶舊漏洞）。已用 `clasp undeploy` 移除 17 個舊部署，僅保留現行 @113 與 @HEAD。**日後發布一律「管理部署作業 → 編輯 → 新版本」，不要選「新增部署」**，發布後以 `clasp deployments` 確認數量。
  - Netlify 專案已移除；刪除 `netlify/`、`netlify.toml`、`fix_regex.js`、`patch*.js`、`temp_*.js`（一次性腳本，已在 git 歷史可還原）。刪除後重建的 `index.html` 與刪除前雜湊值一致，確認建置只依賴 `logo_b64.txt`。
- **登入改用短效 token（2026-10-05）**：密碼只在登入時送出一次，後端發 token（閒置 2 小時／絕對 8 小時），之後所有寫入只帶 token，且只存 `sessionStorage`；舊版 `localStorage` 明文密碼自動清除。連錯 5 次鎖 15 分鐘；`checkPassword` 改為只認 token（原本是公開函式，可被當成猜密碼測試器）；變更密碼需 ≥10 字元並使所有 token 失效；`setupWeeklyBackupTrigger` 也遵守備份間隔。新增 `tests/auth.test.js`（44 項）。**部署順序：先發布後端新版本，再立刻推送前端**（兩者之間舊前端無法寫入）。
- **前端 XSS 防護（2026-10-05）**：修補前以「全欄位下毒」偵測器實測，僅 A 類就有 61 處可被攻破（月曆、每日詳情、週月視圖、菜單、相簿、主題、文件、焦點活動、管理後台所有清單與表單下拉選單，另有 `javascript:` 網址與 `onclick` 內 JS 字串跳出）。新增 `esc()`／`jsq()`／`escUrl()`／`safeUrl()` 並套用到所有不可信資料；A～E 類各跑 2 輪皆 0，正常特殊字元（`&`、`<`、引號）原樣顯示、無雙重跳脫。新增 `tests/xss_harness.js` 與 `tests/README.md`。教訓：`songEsc` 只做 HTML 跳脫，不會擋 `javascript:`；偵測器需用舊版做「對照測試」確認抓得到、並重複執行（曾漏報一次）。
- **冪等性／逾時重送去重（2026-10-05）**：發現 `fetch` 逾時降級 iframe 重送時，兩者是互不相識的獨立請求（fetch 無任何編號、iframe 另產生新 requestId），相簿上傳區塊自動重試與使用者重試也都是全新請求，回應遺失時會重複寫入。改為前端每次操作產生 `idempotencyKey`，同一次操作的所有重送共用；後端在互斥鎖內去重並只記錄成功結果（10 分鐘）。相簿上傳區塊以位置固定編號；登入逾時不再白白重試 3 次。新增 `tests/idempotency.test.js`（21 項，並以 3 種故意破壞驗證測試有效）。**部署順序：先發布後端，再推前端**（舊前端不帶編號，行為不變，所以順序顛倒也不會壞）。
- **Tailwind 載入評估與固定版本（2026-10-05）**：桌面量測（各 6 次）顯示 Tailwind「現場編譯」成本很小（首次繪製中位數約 146ms vs 130ms；最長卡頓兩者相同約 85～90ms，屬網站自身啟動成本），因此不做預先編譯。真正的成本在網路：腳本在 `<head>` 內同步載入，未固定的網址每次都先 302 轉址到 `/3.4.17` 且轉址只快取 4 小時。改為直接使用 `cdn.tailwindcss.com/3.4.17`（內容與原本逐位元組相同、快取一年），回應時間中位數約 75ms → 26ms（省一次網路來回；行動網路未量測）並避免版本被悄悄升級。**SRI 不可行**：該 CDN 無 CORS 標頭，加 `integrity` 會讓腳本被擋。評估後不做 `innerHTML`→`textContent` 的全面改寫（已有跳脫工具與偵測器把關）。教訓：量測網路時不可加隨機查詢字串（會讓 CDN 邊緣快取失效而嚴重失真）。
- **介面微調（2026-10-05）**：(1)「焦點活動」標籤中文介面移除英文字樣（英文介面維持 SPOTLIGHT HIGHLIGHT），避免中英切換時重複描述。(2) 側邊欄：實測標題列圖示左緣 11.9px、各項目 14.3px（差 2.4px），圖釘與文字僅 4px 空隙；改為標題列與各項目共用同一對齊線、圖釘變成列內獨立欄位、釘選寬度 136→152px（中文文字與圖釘實際空隙約 15px，中英文標籤皆完整顯示）。(3) 唱跳音符手機版面（<640px）：勾選框浮於縮圖、下載鈕移至文字區第一列、手機隱藏時長標籤、縮圖 w-28→w-24、歌名最多 3 行，文字區寬度約 128→183px；≥640px 版面不變，並以 820px 視窗驗證。XSS 偵測 A～E／L 兩輪皆 0。教訓：根字級實為 19px（非文件寫的 17.5px），元件寬度用 px、文字用 rem，兩者不會一起縮放，調版面一律以實測數字為準。
- **焦點活動標籤（補充）**：英文介面同步移除 SPOTLIGHT 字樣，`cal.spotlightTag` 現為中文「焦點活動」／英文「HIGHLIGHT」。管理後台一併改為中文「🌟 焦點活動管理」、英文「🌟 Highlights」，兩處後台說明文字也移除 Spotlight；網站畫面文字與屬性（中英文）已無 Spotlight 字樣（程式內部函式名、檔名 `spotlight-fluoride.jpg`、資料表 `Spotlight` 不變）。
- **唱跳音符選取連動修正（2026-10-05）**：底部「已選取 N 首」原本算全部勾選過的歌（含被篩選隱藏的，例如顯示 15 首但畫面只有 6 首），而實際播放卻只播目前篩選內勾選的歌（甚至在畫面無勾選時去播看不見的歌），數字與播放內容不一致。改為計數、按鈕提示、播放三者都只看目前篩選範圍（`getVisibleSelectedSongs`），其他篩選下的勾選保留但不計入、不播放，並以提示文字說明。新增 `tests/songs_selection.js`（14 項），在修改前版本實測 8 項失敗以證明測試有效。
- **介面文字語系補齊（2026-10-05）**：新增 `tests/i18n_audit.js` 在英文介面下稽核，找出公開頁面 **63 處**仍為中文的介面標籤（放大查看、播放影音、即將到來、活動結束、5s 輪播、N 張、（共 N 張）、點擊放大、播放器按鈕與提示、相片檢視器、歌曲卡片的 title／aria-label、載入中提示、logo 替代文字等）。於字典新增 `ui` 區塊（約 70 個中英文鍵）、靜態文字接上 `data-i18n`、動態文字改用 `t()`；`applyTranslations` 新增 `data-i18n-alt`／`data-i18n-aria` 並讓焦點活動、播放佇列、檢視器按鈕即時換語言；`t()` 的參數內插改用函式取代，避免 `$` 字元被誤解；順手修正相片檢視器的「Auto Play／Stop」在中文介面下是英文。複查後公開頁面剩 6 處皆為刻意保留（語言切換鈕、焦點活動資料）。管理後台約 220 筆維持中文（後台使用者為中文教師）。**試算表資料（活動名稱、歌名、類別、班級名稱等）不由程式翻譯**；相簿／文件類別等由試算表維護的名稱若要英文化，需另做「名稱對照表」。教訓：測試資料會污染頁面狀態，`xss_harness` 跑完要重新整理再跑其他測試；稽核的「剔除資料」步驟會漏掉剛好與資料相同的介面字，需搭配原始碼掃描交叉檢查。
- **移除相簿假照片（2026-10-05）**：相簿照片載入失敗**或相簿本身是空的**時，程式會顯示 3 張網路圖庫（unsplash）的假照片（「塗氟檢查01.jpg」等），等於把圖庫照片當成班級相簿；相簿沒有封面時前台與後台也會顯示圖庫的小孩照片。已刪除 `renderFallbackPhotos`：成功就照實顯示（空相簿顯示「此相簿目前無照片檔案」），失敗顯示「無法載入相簿照片，請檢查網路後再試」（中英文），無封面改用內建中性 SVG 佔位圖（`ALBUM_COVER_PLACEHOLDER`，不依賴外部網站）。程式中已無任何 unsplash 連結。
- **相簿封面每天輪替（2026-10-05）**：需求討論時實測：現場列出一本 470 張的相簿要 6.5～7.4 秒（12 本合計 2,686 張），不可能在載入網頁時現場挑；隨機照片的縮圖首次請求約 0.75 秒、個別 1.1～1.8 秒（Google 縮圖是第一次被請求時才現場產生），暖機後約 0.5 秒；`getAppData` 55.4KB（快取上限 100KB），相簿只佔 4.9KB。決議：每天固定一張、接受隱私、每本 12 張候選、提供一鍵補建。實作：`Albums` 新增 `coverCandidates` 欄（JSON，最多 12 個 Drive 檔案 ID，依檔名排序後等距取樣，格式嚴格驗證）；上傳最後一個區塊沿用原本整理照片總數的同一次資料夾走訪順便建立（不增加 Drive 讀取，失敗不影響上傳）；新增試算表選單「🖼️ 重建相簿封面候選」；前端 `pickDailyCoverUrl`（FNV-1a 雜湊「日期＋相簿編號」）每天固定、隔天輪替，候選為空／惡意／載入失敗退回固定封面 `coverUrl`，後台維持固定封面。新增 `tests/covers.test.js`（48 項，6 種變異測試皆被抓到）、`tests/covers_frontend.js`（15 項，含真實網路失敗）。發現但未更動的既有行為：上傳最後一個區塊會把 `coverUrl` 設為該區塊第一張新照片（現僅作備援）。
- **名稱對照表 NameMap（2026-10-05）**：試算表維護的名稱（相簿／文件／歌曲類別、學期、活動對象）原本在英文介面仍是中文。新增 `NameMap` 工作表（zh／en／used_in／note）、`getAppData` 回傳 `nameMap`、試算表選單「🔤 同步名稱對照表」（掃描 7 個字典與資料列、新增列才預填英文草稿、絕不覆蓋已填的英文、回報資料問題）；前端 `tn()` 查表（英文介面且有對照才換，否則中文）、內部篩選仍用中文、搜尋同時比對中英文。決議：全部字典都做、只顯示英文、班級名稱先留空。實查發現：活動大項／細項前台完全沒有顯示（僅後台與日曆圖示判斷）；字典 `諾貝爾 A ` 多一個空白；活動資料用了字典沒有的「雨果」（字典是「兩果」），皆由同步功能回報。新增 `tests/namemap.test.js`（43 項，8 種變異皆被抓到）、`tests/namemap_frontend.js`（25 項，3 種變異中 1 種最初未被抓到、改良測試後抓到）。教訓：前端測試若不擋住 `handleDataLoaded`，背景雲端更新會把測試用的資料／畫面洗掉造成誤判；變異測試能抓出「恆真」的斷言。
- **iPhone 連不上資料庫／相簿照片載入失敗（2026-10-05，已解決，後端 @118→@121）**：現象是手機一直跳「雲端資料同步失敗」，相簿顯示「無法載入相簿照片」，電腦與模擬手機正常。以 `diag.html`（手機連線診斷頁）取得實機數據：`getAppData` 多次逾時或回 HTTP 404 網頁。逐層查出四個原因並修正：① `ensureAlbumSheetsExist()` 結尾無條件清快取，而 `doGet` 每次請求都呼叫它，導致 5 分鐘快取永遠不命中（每次 7～12 秒）→ 只在真的建立／遷移時才清；② `doGet` 在處理 `getAppData` 前先開試算表做工作表檢查，開試算表偶爾卡 20～90 秒 → `getAppData` 改為快取命中時完全不碰試算表；③ 前端 GET 逾時只有 10 秒，且回應不是 JSON（如 404 頁）時不呼叫失敗回呼而靜默卡住 → 逾時改 30 秒、HTTP 錯誤與非 JSON 都算失敗、自動重試（`getAppData` 3 次、其他 2 次）；④ `getAlbumPhotos` 無快取，470 張相簿現場列 Drive 要 27 秒、回應 227KB → 只回 `{id,name,size}`（約 51KB）、快取 1 小時（寫入時清除、過大不快取）、前端由 id 組網址（id 格式不合者略過）。另新增快取預熱：`warmAppDataCache` 每 5 分鐘重建 `getAppData` 快取（存活 10 分鐘）並補建 2 本相簿照片清單，由選單「⚡ 啟用網頁快取預熱」建立觸發器。結果：`getAppData` 20 次 1.1～1.7 秒、470 張相簿 10 次 2.0～3.5 秒。新增測試：`warmcache.test.js`（10 項）、`albumphotos.test.js`（12 項，5 種變異）、`retry_frontend.js`、`albumphotos_frontend.js`。教訓：① 診斷手機問題先做「在手機上跑的診斷頁」取得實機數據，不要猜；② 公開 `doGet` 路徑上任何會碰試算表的前置檢查都是延遲風險，快取命中必須完全不碰試算表；③ 快取清除呼叫要放在「真的改了東西」之後，不可放在每次請求都會經過的函式尾端；④ 前端 `fetch(...).then(r=>r.json())` 要先檢查 `r.ok`，且錯誤要能走到失敗回呼；⑤ 後端回應格式變更時，前端先上線（相容新舊格式），後端後發布。部署後偶有舊版實例短暫回舊格式（一次 227KB），屬正常，前端兩種格式都吃。
- **iPhone 連續播放（2026-10-05）**：手機上播完一首會切到下一首，但不會自動開始播、要再按播放。原因：換歌時把 YouTube 播放器銷毀再重建，且發生在「播完」事件而非使用者點擊，iOS Safari 不允許沒有手勢的自動播放。修法：播放器就緒後換歌（播完、按下一首／上一首）改用同一個播放器的 `loadVideoById`；尚未就緒或失敗時退回銷毀重建。新增 `tests/songs_player.js`（9 項；關閉重用後確認會失敗）。**需在實體 iPhone 驗證**（未驗證：實機是否真的自動接著播；鎖定螢幕／切換 App 時 iOS 會暫停網頁播放，屬 iOS 限制）。
- **播放器「下載」鈕改為「全螢幕」（2026-10-05，使用者決定）**：播放器右下角的下載鈕換成全螢幕鈕（對播放器 iframe 呼叫 `requestFullscreen`）；瀏覽器不支援對網頁元素全螢幕時（iPhone Safari）自動隱藏，影片內建的 YouTube 全螢幕鈕仍可用。換歌沿用同一個播放器，所以全螢幕中播完會自動接下一首並保持全螢幕；關閉播放器時先離開全螢幕。**下載音樂檔仍可在歌曲清單每張卡片上使用**（只是播放器視窗內不再有）。`tests/songs_player.js` 擴充為 16 項。**未驗證：iPad／電腦實機的全螢幕是否保持到下一首**（假播放器只能證明程式邏輯）。
- **載入等待提示（2026-10-05，使用者決定）**：讀取超過 3 秒才出現「已等待 N 秒」，重試時附「網路較慢，正在重試（2/3）」，相簿視窗等 8 秒以上再加「大型相簿第一次開啟會比較久」。套用於：首頁載入（背景同步徽章與手動重新整理的轉圈）、相簿列表、相簿照片視窗、後台 Activity 資料夾選取。**誠實原則：伺服器處理期間沒有任何進度資訊，所以不做假百分比**，只顯示已等多久與第幾次嘗試。相簿清單回來後，第一批縮圖（前 18 張，改為 `eager`）顯示真實進度條「縮圖載入 i / 18」（`load` 與 `error` 都算處理完、25 秒後收起；其餘縮圖維持 `lazy`，沒有固定總數所以不計入）。實作：`startWaitHint(container, opts)`、`callBackend` 第 5 參數 `hooks.onAttempt(n, max)`。順手把相簿縮圖網格由逐張 `innerHTML +=`（每張都重建整個網格，470 張時 O(n²)）改為一次組好再寫入。新增 `tests/wait_hint.js`（15 項，3 種破壞皆被抓到）。
- **iPhone 實機驗證（2026-10-05，使用者回報）**：雲端資料載入、相簿照片、連續播放（換歌）、全螢幕鈕、載入等待提示皆已在 iPhone 驗證沒問題。Safari 驗收清單 `tests/safari-checklist.md` 其餘項目（iPad、後台登入等）尚未做。
- **`getAlbumPhotos` 限制只能列出已登記的相簿（2026-10-05，後端 @122）**：原本公開入口接受任意 Drive 資料夾 ID，等於能請本帳號代為列出任何有權限的資料夾（需知道 ID，風險低但屬資訊外洩）。現在先查 `getAppData` 快取的相簿清單（命中時不碰試算表）、查不到再讀 `Albums` 工作表（涵蓋剛新增的相簿），都沒有或讀取出錯一律拒絕（fail closed），回「找不到相簿」且不洩漏細節；通過檢查的結果才會進快取。`tests/albumphotos.test.js` 擴充為 21 項（5 種破壞皆被抓到）。注意：相簿的 `id` 就是 Drive 資料夾 ID，後台若手動把 `Albums.id` 改成別的值，該相簿的照片會列不出來。
- **「NEW」標籤（P2，2026-10-05，僅前端，使用者決定）**：相簿卡片、常用文件卡片、主題活動卡片在 `updatedAt` 落在「今天起往前 7 個日曆日（台北時區）」內時，標題旁顯示紅色小圓角 NEW（中英文都是 NEW，提示文字有中英文）。判斷依據是各表的 `updatedAt`＝**最後修改時間，不是建立時間**：老師修改舊資料也會重新標示；未來日期、無法解析、空值一律不標。因為資料剛整批上傳（相簿 10/3、主題 10/4、文件 10/2～10/3），**上線頭一週幾乎全部都會是 NEW，10/12 之後恢復正常**。活動（`Events`）沒有建立時間欄位，未納入。實作：`isNewItem(updatedAt, now)`、`newBadgeHtml()`、`NEW_BADGE_DAYS = 7`。新增 `tests/new_badge.js`（17 項，4 種破壞皆被抓到）。踩到的老雷：template literal 內正規表示式的反斜線要寫成 `\\d`（第 3 條教訓），測試抓到。
- **自動化測試 CI（P4，2026-10-05）**：新增 `tests/ci.sh`（本機與 CI 共用：`Code.js` 語法、重新建置並確認 `index.html` 與已提交版本一致、`index.html` 內嵌 script 語法、6 套 Node 測試）與 `.github/workflows/ci.yml`（`push` 到 `main` 與 PR 時執行，Node 24，`permissions: contents: read`，不含任何密碼或金鑰）。不含瀏覽器端測試。**推送前建議先跑 `bash tests/ci.sh`**。故意破壞（手改 `index.html`、弄壞預熱旗標、語法錯誤）皆以非 0 結束。
- **P3（加到手機主畫面）暫停**：使用者決定名稱「諾貝爾A」，並要等提供高解析 logo 再做（現有 `3-3-LOGO.jpg` 僅 112×112）。
- **加到手機主畫面 PWA（P3，2026-10-05，僅前端，使用者決定）**：新增 `manifest.webmanifest`（`name` 桃子腳幼兒園 諾貝爾 A 班、`short_name`「諾貝爾A」、`display: standalone`、`start_url`／`scope`／`id` 皆為 `./`、`theme_color` 與 `background_color` `#ffffff`）、`icons/`（`apple-touch-icon.png` 180、`icon-192.png`、`icon-512.png`、`icon-maskable-512.png`；**白底、不透明**，因為 iPhone 會把透明區域顯示成黑色；maskable 版 logo 只占 62% 以符合 Android 安全區）與 `index.html` 的 `<link rel="manifest">`、`apple-touch-icon`、iOS／Android App 模式 `<meta>`。圖示由高解析 logo `logo-hires.png`（900×900 透明 PNG，使用者提供）經 `python3 tools/make_icons.py` 產生（純標準函式庫，換 logo 時重跑即可）。**不做 service worker／離線快取**（避免卡在舊版）。使用者選擇 standalone：此模式（尤其 iPhone）**沒有網址列與重新整理鈕**，所以另加：① 標頭的「↻」重新整理鈕（只在 App 模式顯示；手機用絕對定位貼在標頭右上角、不佔版面，否則 390px 寬時標題會被擠成兩行；md 以上才排進版面）→ `location.reload()`；② 回到前景且離開超過 5 分鐘時自動 `loadAppData(true)`（只在 App 模式；管理員已登入或有彈窗開著時不同步，避免打斷操作）；③ 同步失敗提示在 App 模式改為「請點右上角 ↻」。新增 `tests/pwa.test.js`（30 項，Node，已納入 CI；4 種破壞皆被抓到）與 `tests/standalone.js`（13 項，瀏覽器，4 種破壞皆被抓到）。**教訓**：XSS 偵測器會執行頁面上每個 `on*` 處理器，新增會 `location.reload()` 的按鈕必須在偵測器裡替換成假函式（已在 `xss_harness.js` 加 `window.appRefresh` 假函式）；瀏覽器可能快取 `tests/*.js`，載入測試檔時加 `?v=時間戳` 與 `cache:'no-store'`。**未驗證**：實體 iPhone／Android 的「加入主畫面」圖示、名稱、開啟後的樣子與 ↻ 鈕位置。
- **PWA 實機驗證（2026-10-05，使用者回報）**：加到主畫面與 App 模式測試沒問題（上一條「未驗證」項目已完成）。
- **活動「細項」小標籤（2026-10-05，僅前端，使用者採納建議）**：先前活動大項／細項在前台完全不顯示（只在後台與日曆圖示判斷用）。現在**只顯示細項**（例如慶生活動、親師座談、幸福廚房），以小圓角標籤放在活動標題旁：每日詳情卡片與全月總覽；週檢視為求精簡不加。大項不顯示（「全園活動」「班級主題」與適用對象標籤資訊重複）。細項為空或只有空白不顯示；相容舊欄位名稱 `活動類別 (細項)`；英文介面經 `tn()` 走名稱對照表（`EventCategoriesMinor` 字典已在同步範圍內，查不到顯示中文）；細項內容經 `esc()` 跳脫。實作：`eventMinorBadgeHtml(ev)`。新增 `tests/event_minor.js`（11 項，4 種破壞皆被抓到）。XSS 偵測 L 類「字面出現次數」由 417 增為 424，是因為新標籤多顯示了細項欄位的正常特殊字元（未雙重跳脫）。
- **三項小改善（2026-10-05，僅前端，使用者決定）**：
  1. **相簿縮圖 480**：`THUMB_WIDTH = 'w480'` 取代 `getPhotoDisplayUrl(…, false)` 與 `expandAlbumPhotos` 的 `w800`（相簿格狀縮圖與主題相片）。實測 8 張代表性相片平均每張：w800=181KB、w600=116KB、w480≈80KB、w400=60KB；手機每格約 160 CSS 像素、iPhone 3 倍螢幕約需 480 像素。第一批 18 張縮圖由約 3.3MB 降到約 1.4MB。大圖檢視（w2048）與封面（w600）不變。
  2. **「大字」開關**：`html.big-text { font-size: 22px }`（標準 19px），按鈕 `#bigTextToggleBtn` 在側邊欄語言切換之上（手機在漢堡選單）；偏好 `localStorage['nobel_a_big_text']`；`<head>` 內有一小段 script 開頁前先套用，避免閃一下標準字級；`aria-pressed` 與底色顯示狀態。在 390px 寬逐一檢查 5 個分頁與週／月檢視，**無橫向捲動**。大字模式暴露的版面問題一併修正：主題卡片標題與日期範圍不再被 `truncate` 截斷（改換行）、相簿標題改 `line-clamp-2`。
  3. **列印本週菜單**：週檢視標題列新增「🖨️ 列印本週菜單」。`printWeekMenu()` 依選定日期所在的週（週日起）組出 `#printMenuArea`（必須是 `<body>` 的直接子元素），`@media print` 隱藏其餘所有內容，`@page { size: A4 landscape; margin: 12mm }`。欄位：日期、早點、水果、午餐（主食、主菜、副菜、湯，空欄略過）、午點、備註；週一～週五一定列出（沒資料顯示「—」），週末只在有菜單資料時才列；整週沒有菜單提示「本週尚無菜單資料可列印」且不列印；附既有的菜單註記 `cal.menuNote`；全部內容經 `esc()`。週檢視標題列改為可換行（否則手機上按鈕把標題擠成直排）。**教訓**：XSS 偵測器會執行每個 `on*` 處理器，新增會開列印視窗或改偏好的按鈕要在 `xss_harness.js` 換成假函式（已加 `window.print`、`toggleBigText`）；template literal 內的英文單引號 `\'` 會被吃掉造成語法錯誤，字串避免使用撇號（`tests/ci.sh` 的內嵌 script 語法檢查會抓到）。新增 `tests/small_improvements.js`（28 項，5 種破壞皆被抓到）。**未驗證**：實體 iPhone／App 模式下列印或存成 PDF 的實際行為（桌面瀏覽器以 `window.print` 假函式與列印區渲染結果驗證）。
- **側邊欄對齊與 iPad 展開（2026-10-06，使用者回報，僅前端）**：
  1. **對齊 bug**：`switchTab()` 切換頁籤時會用 JS 重寫每個頁籤按鈕的 `className`，其中寫的是 `px-2 py-2`，而 HTML 標記與底部的「大字」「語言切換」按鈕是 `px-1.5 py-1.5`——頁籤按鈕一旦被切換過，圖示與文字就比其他項目右移約 2.4px、列高也不同（47.5 vs 43px）。早先「側邊欄對齊」那次只改了標記、漏了這兩行 JS。已改為 `px-1.5 py-1.5`；實測所有項目圖示左緣 14.3px、文字左緣 47.5px，與標題列圖示一致。**教訓**：UI 的 class 若在標記與 JS 兩處各寫一份，改一處必漏另一處；用「切換過頁籤之後」再量一次對齊。
  2. **iPad 無法展開（可用性 bug，非程式錯誤）**：側邊欄原本只靠 `onmouseenter` 展開，iPad 沒有 hover，使用者只能去點蘑菇圖示右側看不見的圖釘邊緣。現在在**沒有 hover 的裝置且寬度 ≥ 768**（`@media (hover: none) and (min-width: 768px)`）才顯示明確的展開鈕「»」（展開後變「«」並顯示「收合選單」），同時讓圖釘常顯；點選單以外的地方或選了頁籤會自動收合，已釘選時不收合；手機（< 768）維持漢堡選單。滑鼠裝置完全不顯示該鈕、行為不變。新增 `tests/sidebar.js`（18 項，視窗需 ≥ 768；4 種破壞皆被抓到）。**未驗證**：實體 iPad 上（`hover: none` 的媒體查詢實際是否成立、點擊展開鈕與點外面收合的手感），桌面瀏覽器無法模擬 `hover: none`，只驗證了邏輯與樣式規則。
- **iPad 實機驗證（2026-10-06，使用者回報）**：側邊欄對齊與觸控展開鈕驗證沒問題（上一條「未驗證」項目已完成）。
- **行事曆訂閱 .ics（P1，2026-10-06，使用者決定範圍與內容）**：
  - **後端**（`Code.js`）：`doGet` 新增**唯讀**動作 `getCalendarIcs`，回傳 `text/calendar`（`ContentService.MimeType.ICAL`），資料取自 `getAppData()`（快取命中時完全不碰試算表，且與 `getAppData` 一樣略過工作表檢查）；取資料失敗時回傳空的有效行事曆（訂閱端不會出現錯誤頁）。核心是純函式 `buildIcs_(events, now)`：只含與諾貝爾 A 班家長相關的活動（`icsIsRelevantEvent_`：對象含「全園」「親職」「諾貝爾 A」「諾 A」，對象為空視為全園；其他班專屬活動不含，29 筆中約排除 6 筆）；**一律全天事件**（`DTSTART;VALUE=DATE`、`DTEND` 為結束日隔天，連假／跨月／跨年皆驗證），因為 `timeLocation` 是自由文字（「17:00 開始」「連假三日」，甚至有試算表誤轉的 `1899-12-30`，後者會被濾掉）；`SUMMARY` 只放活動名稱，`DESCRIPTION` 放時間地點、說明、適用對象、類別；`TRANSP:TRANSPARENT`（不佔用家長的忙碌時段）；RFC 5545 逸出（反斜線、分號、逗號、換行）與**以 UTF-8 位元組摺行**（每行 ≤ 75 位元組，不拆壞中文字）；UID 穩定且僅含安全字元；上限 500 筆；`REFRESH-INTERVAL` 與 `X-PUBLISHED-TTL` 為 6 小時。
  - **前端**：行事曆工具列下方「📆 訂閱行事曆」按鈕 → `#calendarSubscribeModal`（id 以 Modal 結尾，回到前景自動同步會視為使用者忙碌）：Apple 連結 `webcal://script.google.com/macros/s/…/exec?action=getCalendarIcs`、Google 行事曆「透過網址」步驟與複製鈕（`navigator.clipboard`，失敗退回 `execCommand`，再失敗提示手動複製）、說明「全天事件、Apple 數小時內同步、Google 可能 12～24 小時」。中英文字典齊全。
  - **測試**：`tests/ics.test.js`（Node，36 項，7 種破壞皆被抓到，已納入 CI）、`tests/subscribe.js`（瀏覽器，15 項，3 種破壞皆被抓到）。
  - **部署**：後端先（`clasp push`→管理部署作業→新版本），確認 `?action=getCalendarIcs` 回 `text/calendar` 後才推前端（否則按鈕指向的網址在後端尚未發布時會回 JSON「未知動作」）。
  - **未驗證**：Apple 行事曆（`webcal://` 經 GAS 302 轉址）與 Google 行事曆（「透過網址」）實際能否訂閱、Content-Type 是否被接受、更新延遲；需使用者在實體手機／電腦實測。
- **行事曆訂閱 後端部署驗證（2026-10-06，@123）**：`?action=getCalendarIcs` 回 `text/calendar; charset=utf-8`（先 302 轉址再 200，約 1.6～4 秒）、23 筆活動（與預期的諾貝爾 A／全園／親職一致，不含別班專屬）、最長行 75 位元組、無單獨 LF、UID 不重複、DTEND 皆晚於 DTSTART、備註無 `1899`；`listSheetNames` 仍回「未知動作」；部署數量仍為 2。
- **行事曆訂閱 iPhone 實機驗證（2026-10-06，使用者回報截圖）**：iPhone 以 `webcal://` 成功訂閱 GAS 轉址網址；行事曆 App 顯示「桃子腳幼兒園 諾貝爾 A 班」行事曆，活動為全天事件，標題僅活動名稱（例：十月份幸福廚房，2026/10/7 整日），備註含時間地點、說明、適用對象（iOS 會自動把備註中的時間標成可點連結，無害）。**Google 行事曆（電腦「透過網址」）尚未驗證。**
- **行事曆訂閱 Google 行事曆實機驗證（2026-10-06，使用者回報截圖）**：電腦版 Google 行事曆「透過網址」訂閱成功，活動以全天事件顯示（含中秋節教師節連假、雙十節連假、光復節連假等跨日長條），事件詳情顯示說明、適用對象、類別。**Apple（iPhone）與 Google 行事曆皆已驗證可用**，P1 全部完成。
- **自由文字英文 TextMap（2026-10-06，使用者決定：架構、範圍、草稿策略）**：
  - **架構**：新增 `TextMap` 工作表（`zh`｜`en`｜`draft`｜`used_in`｜`note`），以**中文原文**為索引（不綁資料列編號）：菜單重複的菜名只翻一次；老師改了中文原文，舊翻譯自動不再套用（舊列保留）；不動現有 7 張工作表與後台儲存邏輯。多行欄位（焦點活動重點、活動說明）以「行」為單位。只含日期時間星期的字串（如 `2026/10/07（三）11:40`）、純英文、空值不收錄。範圍（使用者決定）：活動（標題、說明、時間地點、學期主題、日曆提示）、每日菜單（早點、水果、午餐各項、午點、備註）、主題活動（名稱、概念、活動目標、課程目標）、焦點活動（標題、副標題、標籤、重點）、相簿標題、常用文件（名稱、說明）；**歌曲標題不翻**。
  - **草稿策略（使用者決定）**：機器翻譯（Apps Script 內建 `LanguageApp.translate('zh-TW'→'en')`，免金鑰）只寫 `draft` 欄，**不公開**；老師核對後把英文填進 `en` 欄（或選單「採用全部英文草稿」把 `en` 空白者一次採用）才上線。Settings 可選用 `SHOW_MACHINE_TRANSLATION = TRUE`：`en` 空白時改顯示機器草稿（預設關閉）。
  - **後端**（`Code.js`）：`collectTextSources_`、`syncTextMap_`（只新增、**絕不覆蓋 `en`／`draft`**、更新出處、`=+-@` 開頭加前置符號防公式、上限 3000 列）、`draftTextMap_`（每次最多 80 筆、單次 4 分鐘、額度用盡即停）、`adoptTextDrafts_`、`getTextMap`（公開唯讀，`doGet?action=getTextMap`，略過工作表檢查）、**大型分段快取**（`cachePutLarge_`／`cacheGetLarge_`／`cacheRemoveLarge_`：每段 24000 字元，因 CacheService 單筆上限 100KB 而中文每字 3 位元組；少一段視為沒有快取）。`clearAppDataCache()` 一併清除；預熱觸發器一併重建。**不放進 `getAppData`**（目前 64KB，菜單會隨學期成長，直接加英文會逼近 100KB 快取上限）。試算表選單新增三項：「🌐 同步英文翻譯」「🤖 產生英文草稿」「✅ 採用全部英文草稿」。
  - **前端**：`tx(s)`（英文介面才查表；查不到顯示中文；多行逐行；中文介面原樣；`hasOwnProperty` 防原型鏈）；`loadTextMap()` 只在英文介面請求（先以 localStorage 上次的對照立即顯示，背景更新，內容有變才重新渲染）；套用於每日詳情、週／月檢視、列印菜單、焦點活動（含放大視窗）、相簿卡片與視窗標題（英文介面可用英文搜尋）、常用文件、主題活動；所有輸出仍經 `esc()`。
  - **測試**：`tests/textmap.test.js`（Node，65 項，12 種破壞皆被抓到，已納入 CI）、`tests/textmap_frontend.js`（瀏覽器，40 項，6 種破壞皆被抓到）。XSS 偵測 A～E 全 0。
  - **老師操作流程**（試算表選單「🌟 諾貝爾A班專屬功能」）：① 🌐 同步英文翻譯（掃描所有自由文字，新增尚未收錄的）→ ② 🤖 產生英文草稿（可多按幾次，每次最多 80 筆）→ ③ 到 `TextMap` 工作表核對 `draft` 欄，必要時直接改寫 → ④ 把確認的英文填進 `en` 欄，或按 ✅ 採用全部英文草稿 → ⑤ 前台最多 10 分鐘內生效（或選「清除快取」）。之後新增活動或菜單時，重做 ①②③④ 即可（已翻過的不會重翻）。
  - **部署**：後端先（`clasp push`→新版本）、前端後；前端在後端未發布時請求 `getTextMap` 只會得到失敗回應並被忽略（維持中文），所以順序顛倒也不會壞。
  - **未驗證**：LanguageApp 實際翻譯品質與額度、試算表選單實際操作、英文介面在實機的顯示；需使用者按選單並在英文介面確認。
- **TextMap 上線（2026-10-06）**：後端 @124（`getTextMap` 回 `{"success":true,"map":{},"count":0}`，因為還沒有任何翻譯）＋前端 `tx()` 已上線；未動其他功能（`getAppData`、行事曆訂閱、`listSheetNames` 皆正常）。
- **後台「英文對照」網頁編輯（2026-10-06，使用者提議、決定「先做 TextMap、批次儲存、加新文字提示，NameMap 隨後」；因為兩張表欄位幾乎相同，實作為同一組動作與同一個介面，一併支援 NameMap）**：
  - **後端**（`Code.js`，全部需管理員 token，每個全域函式都先驗證）：`adminMapList`、`adminMapSave`、`adminMapDelete`、`adminMapSync`、`adminTextDraft`、`adminTextAdopt`、`adminMapStatus`，由 `doPost` 的 `mapList`／`mapSave`／`mapDelete`／`mapSync`／`textDraft`／`textAdopt`／`mapStatus` 路由（沿用互斥鎖與冪等性）。`MAP_KINDS_` 設定同時涵蓋 `text`（TextMap）與 `name`（NameMap）。**儲存是整個 `en` 欄一次寫回**（不逐格寫入，避免逾時），只動 `en`、不碰 zh／draft／出處／備註；不存在的中文＋有英文 → 新增列（出處「（手動新增）」）；英文清理控制字元與換行、`=+-@` 開頭加前置符號、長度上限（TextMap 600、NameMap 100）；單次最多 500 筆。**刪除只能刪「目前沒有使用」的列**（使用中的略過）、由下往上刪、單次最多 100 列。**草稿單次最多 20 筆**（網頁連續呼叫，避免 POST 逾時）。`adminMapStatus` 提供統計與「尚未收錄的新文字」數。快取：TextMap 寫入清除 `text_map_v1`，NameMap 寫入清除 `getAppData` 快取。
  - **前端**：後台新增「🌐 英文對照」頁籤（面板 `#adminPanel-translations`），兩個子頁「內容（活動、菜單等）」「名稱（類別、班級）」；表格以 DOM／`textContent` 渲染（不用 `innerHTML`，惡意內容一律純文字）；每頁 50 列；修改只在「💾 儲存變更」時批次送出（超過 500 筆分段、失敗時修改保留在畫面上、登入逾時交由統一流程）；「🤖 產生草稿」連續呼叫並顯示進度、可停止、額度用盡或一批完全沒進展即停止；切換子頁、重新開啟頁籤時若有未儲存修改則保留；頁籤紅點顯示「有 N 筆新文字尚未加入」（登入後進後台時背景取得）。GAS 內嵌模式的 `runner` 對應也已補上。
  - **測試**：`tests/mapadmin.test.js`（Node，60 項，12 種破壞皆被抓到，已納入 CI）、`tests/mapadmin_frontend.js`（瀏覽器，61 項，9 種破壞皆被抓到）。XSS 偵測 A～E 全 0。在 390px 寬檢查無橫向捲動。
  - **部署**：後端 @125 先發布，再推前端（前端在後端未發布前進入該頁籤只會顯示「載入失敗」）。
  - **未驗證**：實際在後台操作（登入後開啟頁籤、儲存、產生草稿、採用）、`LanguageApp` 實際翻譯品質與額度。
- **後端 @125 部署驗證（2026-10-06）**：部署數量仍為 2；7 個後台英文對照動作（`mapList`／`mapSave`／`mapDelete`／`mapSync`／`textDraft`／`textAdopt`／`mapStatus`）以錯誤 token 連測 3 輪共 21 次，全部回「登入已逾時或無效」（皆被拒絕）；`getTextMap`、`getAppData`、`getCalendarIcs`（`text/calendar`）正常，`listSheetNames` 與以 GET 呼叫管理員動作皆回「未知動作」。發布後前幾分鐘 Google 讓部分請求仍由 @124 處理（`mapStatus` 曾回「未知 POST 動作」），等約 1 分鐘後全部一致。
