# 3of3 Kindergarten Web App Progress & Lessons Learned

## 📌 專案進度摘要（交接用，2026-10-05 更新）

> **新對話接手時請先讀本節**，再視需要讀 `SPECIFICATION.md`（規格正本）與 `tests/README.md`（測試說明）。下方「Critical Technical Lessons Learned」第 1～21 條是歷史紀錄，**其中第 1、2、19 條已過時**（見各條註記）；第 21 條之後的條列為 2026-10-05 起的新增項目。

### 一、目前狀態（一句話）
**線上穩定，沒有待部署項目。** 後端 GAS 現行部署 **@122「限制資料夾 ID」**（另有不可刪的 `@HEAD`，共 2 個部署）；前端 GitHub Pages 為最新 commit。`NameMap` 的 13 個英文名稱已由使用者填寫完成（2026-10-05）；暫緩項目見 `TODO.md`，Safari 實機驗收見 `tests/safari-checklist.md`。**使用者需在試算表選單按一次「⚡ 啟用網頁快取預熱」**（已按過）。

### 二、系統概覽
- **架構**：靜態前端（GitHub Pages，`https://avaltech-ai.github.io/3of3/`）＋ Google Apps Script Web App（唯一 `/exec` 端點）＋ Google Sheets（資料庫）＋ Google Drive（相片、文件、音訊）。**已無 Netlify**。
- **原始碼**：前端只改 `build_index.js`（單一檔案），再執行 `node build_index.js` 產生 `index.html`（**禁止手改 `index.html`**）；後端為 `Code.js`；`logo_b64.txt` 是建置唯一依賴的資源檔。
- **GitHub**：`avaltech-ai/3of3`（**公開 repo**，任何密碼、金鑰、token 都不得進 repo）。本機以 `gh auth setup-git` 管理憑證（帳號 `avaltech-ai`），remote 網址不含 token。
- **環境**：Mac 沒有 Homebrew；Node 在 `~/.nvm/versions/node/v24.18.0/bin`（指令前要 `export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"`）；`clasp` 已登入。管理員密碼存在試算表 `Settings!ADMIN_PASSWORD`，**不在任何文件或程式碼中**。
- **規模參考**：`getAppData` 回應 61.8KB（`CacheService` 單筆上限 100KB，餘裕約 38KB）；相簿 12 本、照片約 2,686 張；現場列出一本 470 張相簿約 6.5～7.4 秒（所以任何「載入時現場掃 Drive」的做法都不可行）。

### 三、已完成項目（2026-10-05 一輪）
- **資安**：撤銷外洩的 GitHub token；封死 `doGet`／`doPost` 的免密碼危險路徑（`setupInitialDatabase` 等）；移除預設密碼後門並換密碼；移除 17 個仍帶舊漏洞的舊 GAS 部署；登入改**短效 token**（閒置 2 小時、絕對 8 小時、`sessionStorage`）＋錯 5 次鎖 15 分鐘；`checkPassword` 只認 token；變更密碼需 ≥10 字元並使所有 token 失效；前端全站輸出跳脫（`esc()`／`jsq()`／`escUrl()`，修補前實測 HTML 注入類 61 處可被攻破、現為 0）。
- **穩定性**：寫入互斥鎖（`LockService`，20 秒）；冪等性（`idempotencyKey`，防逾時重送與相簿上傳區塊重試造成重複寫入）；每週日 03:00 自動備份試算表到 Drive「桃子腳幼兒園/Backup」（保留 8 份、私人資料夾）；修好整個前端 script 無法執行的語法錯誤（`\n` 在模板字串內需寫成 `\\n`）；不再自動灌入示範資料；移除前端與相簿的假示範資料與網路圖庫連結。
- **功能與介面**：側邊欄對齊（釘選寬度 152px）；唱跳音符手機版面重排；選取數量／播放內容改為只看目前篩選範圍；焦點活動標籤中英文都不再含「Spotlight」；**公開頁面介面文字全面接上語系字典**（63 處漏翻譯 → 6 處刻意保留）；**相簿封面每天固定一張**（`Albums.coverCandidates`，每本最多 12 張候選，前台依日期＋相簿編號挑選，載入失敗退回固定封面）；**名稱對照表 `NameMap`**（試算表維護的類別、學期、活動對象的英文顯示；英文欄空白則顯示中文）。
- **效能評估（量測後決定不做）**：Tailwind 預先編譯（桌面量測現場編譯成本很小）；`innerHTML` 全面改 `textContent`（已有跳脫工具與偵測器把關）。已做的低風險改善：Tailwind 改用固定版本網址 `cdn.tailwindcss.com/3.4.17`（**該 CDN 無 CORS 標頭，不可加 SRI，否則整站失去樣式**）。

### 四、測試與驗證工具（`tests/`，每次改動前後都要跑）
| 檔案 | 類型 | 內容 | 結果 |
| :-- | :-- | :-- | :-- |
| `auth.test.js` | Node | 登入 token、鎖定、變更密碼、備份間隔保護 | 44 通過 |
| `idempotency.test.js` | Node | 冪等去重 | 21 通過 |
| `covers.test.js` | Node | 相簿封面候選（取樣、解析、重建、上傳整合） | 48 通過 |
| `namemap.test.js` | Node | 名稱對照表（正規化、掃描、同步、回傳過濾） | 43 通過 |
| `xss_harness.js` | 瀏覽器 | 全欄位下毒的 XSS 偵測器（A～E 攻擊類型＋L 正常字元不得雙重跳脫） | A～E 全 0 |
| `songs_selection.js` | 瀏覽器 | 歌曲選取數量／播放內容連動（14 項） | 全過 |
| `covers_frontend.js` | 瀏覽器 | 封面每日輪替與備援（15 項） | 全過 |
| `namemap_frontend.js` | 瀏覽器 | 名稱對照前台顯示、搜尋、安全（25 項） | 全過 |
| `i18n_audit.js` | 瀏覽器 | 英文介面漏翻譯稽核 | 公開頁面剩 6 處（刻意保留） |

- **Node 測試**：`node tests/xxx.test.js`。**瀏覽器測試**用法見 `tests/README.md`（`python3 -m http.server 8765` 後在頁面內執行）。
- **測試品質做法**：重要測試都用「故意破壞程式」（變異測試）驗證抓得到；曾因此抓出一個恆為真的斷言。
- **瀏覽器測試的陷阱**：① `xss_harness` 跑完會把「被下毒的資料」留在頁面，**要重新整理再跑其他測試**；② 測試期間必須擋住背景雲端更新（`handleDataLoaded`），否則更新完成時會把測試資料／畫面洗掉造成誤判（`covers_frontend`、`namemap_frontend` 已處理）；③ 封面測試用假的候選 ID，渲染後要「立即同步讀取」；④ `songs_selection` 需從中文介面開始。

### 五、標準作業流程（SOP）
1. 修改 `build_index.js`／`Code.js` → `node build_index.js` 重新建置。
2. 驗證：`node --check`（Code.js 與抽出的內嵌 script）＋相關 Node 測試＋瀏覽器測試（含 XSS 偵測、必要時 i18n 稽核）。
3. 提交：`git add -A && git commit`（commit 訊息結尾加 `Co-Authored-By` 行）。
4. **部署順序：後端先、前端後**（除非該次標示可顛倒）：
   - 後端：`clasp push` → GAS 編輯器「部署 → 管理部署作業 → 鉛筆 → 版本選**新版本** → 部署」。**絕不能選「新增部署」**（會留下帶舊漏洞、永久有效的舊 `/exec` 網址；發布後用 `clasp deployments` 確認仍是 2 個）。
   - 前端：`git push origin main`，GitHub Pages 約 1～2 分鐘重建，用 `gh api repos/avaltech-ai/3of3/pages/builds/latest` 確認。
5. 部署後驗證：`curl` 唯讀檢查 `?action=getAppData`（success、各資料筆數、新欄位）與 `?action=listSheetNames`（必須回「未知動作」）。**不要加 `-X POST`**（`-L` 轉址後仍用 POST 會拿到 HTML）；**不要送錯誤密碼**（會累計鎖定次數）。
6. 瀏覽器驗證時要繞過 GitHub Pages 約 10 分鐘的頁面快取（網址加 `?fresh=…`）。

### 六、試算表維運（選單「🌟 諾貝爾A班專屬功能」）
- 💾 立即備份試算表（另有每週日 03:00 自動備份，觸發器已建立）
- 🔓 解除後台登入鎖定（連錯 5 次會鎖 15 分鐘）
- 🖼️ 重建相簿封面候選（既有相簿、或在 Drive 內直接增刪照片後要按；新上傳相簿會自動建立）
- 🔤 同步名稱對照表（字典新增名稱後按；**絕不覆蓋已填的英文**；`note` 欄會提醒資料問題）
- 🚀 一鍵初始化／重設資料庫（**危險**：會清空 Events 等表，已加二次確認，不要輕易使用）
- 注意：直接在試算表改資料，前台最多 5 分鐘後生效（`getAppData` 快取）；**不可更改工作表名稱與第一列欄位名稱**。

### 七、待辦與待決定（皆不阻塞線上運作）
**需要使用者處理**
1. ~~`NameMap` 的 `en` 欄 13 個空白~~ **已完成**（使用者於 2026-10-05 填寫）。
2. ~~確認班名~~ **已確認為「雨果」**（2026-10-05；線上字典與活動資料已一致，程式預設已移除「兩果」）。
3. 在實體 iPad／iPhone Safari 上做最後驗收（桌面瀏覽器模擬無法取代，過去重大 bug 多為 Safari 特有）。

**可選的後續項目（目前不建議主動做）**
- 管理後台約 220 筆介面文字維持中文（後台使用者為中文教師）；若要英文化是另一批較大的工作。
- `Settings` 的管理員密碼目前為明文（改存雜湊的取捨：就不能再直接在試算表改密碼）。
- 某本相簿（例如「健康檢查」）若不想隨機出現封面，需新增排除設定。
- 活動標題、歌名、相簿標題、文件名稱等自由文字的英文版（需在各資料表新增英文欄位，工作量大）。
- 活動大項／細項前台目前沒有顯示（只在後台與日曆圖示判斷用）。

### 八、已知限制與風險
- token、冪等快取、登入鎖定都存在 `CacheService`，Google 極少數情況會提前清除：結果是老師被要求重新登入，不影響資料。
- 相簿候選在 Drive 內直接刪除照片後不會自動更新：封面載入失敗會退回固定封面，按選單重建即可。
- 前端仍有近百處 `innerHTML`（已有跳脫工具與偵測器把關）；新程式請優先用 `textContent` 或 `esc()`／`jsq()`／`escUrl()`。
- 既有行為：每次上傳的最後一個區塊會把固定封面 `coverUrl` 設為該區塊第一張新照片（現僅作備援）。
- `doGet` 是公開匿名入口，**只能放唯讀動作**；任何寫入、清快取、初始化都不得放進去。

### 九、與使用者協作的偏好（沿用）
繁體中文；結論先行；新功能先討論設計與決定點、由使用者拍板再動工；建議傾向全盤採納（所以建議要務實可實作並標明取捨）；**交付必附手動部署步驟**；GAS 重新部署要沿用同一個部署以保住 `/exec` 網址；使用者非工程背景，說明用後果與類比，但檔名、指令、路徑要精確可複製。

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

