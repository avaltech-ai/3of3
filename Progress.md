# 3of3 Kindergarten Web App Progress & Lessons Learned

## Current Project Status
- **Architecture**: A serverless frontend deployed on GitHub Pages (from `avaltech-ai/3of3.git`; Netlify project removed 2026-10-05), connecting directly to a Google Apps Script (GAS) backend for all data needs.
- **Frontend Framework**: Vanilla HTML/JS styled with TailwindCSS (via CDN). Single-page application logic defined in `build_index.js`, which generates `index.html`.
- **Backend API**: Google Apps Script deployed as a Web App (access: "Anyone"). Handles GET and POST requests.
- **Latest Features Implemented**:
  - Header & Branding overhaul: 3&3 logo, official kindergarten badges, "Happy Life" capsule tag, and top-right admin login/logout controls.
  - Complete Weekly Themes (主題活動) system with dual date pickers, dynamic semester selector, Google Drive thumbnail CDN rendering, and newest-first sorting (`sortThemesDesc`).
  - Songs & Music Player (唱跳音符) duration fix and YouTube API batch duration sync (`batchUpdateSongDurations`).
  - Navigation hierarchy realignment placing "主題活動" between "班級日常" and "影像記錄", with pixel-aligned sidebar header.
  - iPad and tablet viewport optimization with compact 136px pinned sidebar and 48px collapsed rail.
  - Footer contact information restyling with prominent rose-600 telephone and fax numbers.
  - Bilingual UI Language Toggle (繁體中文 `zh-TW` & English `en`):
    - Client-side dictionary system (`I18N`) supporting complete UI bilingual translation for all views: Navigation, Header, Spotlight, Calendar (Day/Week/Month), Themes, Albums, Songs, Docs, Admin, Footer, and Toast notifications.
    - Sidebar toggle button at bottom of shared sidebar (`#desktopSidebar` / mobile drawer): displays `🌐 English` / `🌐 繁體中文` when expanded, and `🌐` when collapsed.
    - 0-lag instant in-memory translation via `applyTranslations()` + auto-remember preference in `localStorage.getItem('nobel_a_lang')`.
    - Dynamic views (calendar week/month views, filter tags, category pills, counts, and empty states) seamlessly update upon language change.
  - Current GAS Backend deployed at version `@106`.

## Critical Technical Lessons Learned (Do Not Repeat)

### 1. Google Apps Script POST Requests & CORS
**Problem**: Netlify serverless functions (`/api/gas`) and direct `fetch()` POST requests from browsers fail due to Google's strict bot-protection and CORS policies. Google responds with a 302 redirect to a login page or a 404 page, breaking the API.
**Solution**: 
- **Hidden Iframe Submission**: Always submit POST requests via a hidden `<form target="iframeId">`. This entirely bypasses CORS restrictions.
- **GAS HTML Response**: The `doPost` function in GAS **must** return an `HtmlService` page containing `<script>window.top.postMessage(result, "*");</script>` and set `setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`.
- **Message Reception**: The frontend listens for the `message` event to receive the API response from the iframe.

### 2. GAS Deployment Corruption (`clasp deploy -i`)
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
