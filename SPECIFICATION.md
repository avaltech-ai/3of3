# 桃子腳幼兒園諾貝爾 A 班 - 系統需求規格書與維護架構指南
**Project Requirements Specification & System Architecture Guide**

> **版本**：v2.4.0 (2026 學年度最新穩定版)  
> **發布日期**：2026-10-05  
> **系統名稱**：新北市桃子腳非營利幼兒園 - 諾貝爾 A 班班級資訊網 (Nobel A Class Portal)  
> **維護單位**：三之三生命教育基金會 / 資訊工程團隊  
> **原始碼存放庫**：GitHub (`avaltech-ai/3of3.git` on `main`)  
> **正式網址**：`https://avaltech-ai.github.io/3of3/`

---

## 目錄 (Table of Contents)

1. [系統整體架構與技術棧 (System Architecture & Tech Stack)](#章節一系統整體架構與技術棧)
   - 1.1 系統架構拓撲圖 (ASCII / SVG 架構圖)
   - 1.2 技術選型與環境職責
   - 1.3 跨網域通訊協議與資料管道 (Fetch POST + 302 Echo Redirect)
   - 1.4 雙語系 (i18n) 多語動態切換引擎
2. [前端頁面架構與模組設計規格 (UI/UX Modules & Layout Specifications)](#章節二前端頁面架構與模組設計規格)
   - 2.1 響應式佈局規格 (Desktop / iPad / Mobile)
   - 2.2 頂部導覽列 (Header & Brand Bar)
   - 2.3 側邊導覽欄 (Sidebar Rail vs Pinned) 與手機導覽
   - 2.4 六大核心業務功能模組
   - 2.5 頁尾資訊區塊 (Footer)
3. [Google Sheets 資料庫完整架構與欄位規範 (Complete Spreadsheet Schema)](#章節三google-sheets-資料庫完整架構與欄位規範)
   - 3.1 `Events`（行事曆活動與作息）
   - 3.2 `Menus`（每日餐飲菜單）
   - 3.3 `Spotlight`（焦點活動輪播）
   - 3.4 `Docs` & `DocCategories`（常用文件與分類）
   - 3.5 `Albums` & `AlbumCategories`（活動相簿與分類）
   - 3.6 `Songs` & `SongCategories`（唱跳歌曲與分類）
   - 3.7 `Themes` & `ThemeSemesters`（主題活動與學期）
   - 3.8 `EventTargets`, `EventCategories`, `EventCategoriesMinor`（行事曆選項字典）
   - 3.9 `Settings`（全域系統參數）
4. [歷史踩坑回顧與常見崩潰問題彙整 (Historical Bugs & Root Causes)](#章節四歷史踩坑回顧與常見崩潰問題彙整)
   - 4.1 Google Sheets 日期/時間序號自動轉換破壞資料 (Duration / Priority)
   - 4.2 Safari / iOS 阻擋跨網域隱藏 iframe 表單通訊
   - 4.3 前台樂觀更新 (Optimistic UI) 導致的偽刪除假象
   - 4.4 前端身分驗證漏洞 (`|| pwd.length > 0`) 導致的鑑權飄移
   - 4.5 Tailwind CSS `space-y-*` 與 `class="hidden"` 造成的邊距塌陷
   - 4.6 圖片切換導致彈窗導覽箭頭上下跳動位移
   - 4.7 iPadOS 平板視窗下側邊欄過寬擠壓主內容區
5. [系統防崩潰與穩健性維護指南 (System Hardening & Crash Prevention Guide)](#章節五系統防崩潰與穩健性維護指南)
   - 5.1 資料庫日常維護黃金法則
   - 5.2 前後端 API 增修與欄位擴充標準作業程序 (SOP)
   - 5.3 完整建置與發布部署流程
   - 5.4 故障排除與健康檢查清單 (Troubleshooting Checklist)

---

<div id="章節一系統整體架構與技術棧"></div>

## 章節一、系統整體架構與技術棧

### 1.1 系統架構拓撲圖 (System Topology)

本系統採用「無伺服器 (Serverless) + 靜態託管 (Static Hosting) + 雲端表格資料庫 (Google Sheets as Database)」的輕量高可用現代化 Web 架構。

```
+---------------------------------------------------------------------------------------------------+
|                                        使用者端 (Client Devices)                                   |
|   [桌面電腦 (Desktop)]             [iPad / 平板電腦 (768px-1024px)]            [智慧型手機 (Mobile 390px)]  |
|   Chrome / Edge / Safari            Safari / Chrome (專用側欄壓縮)              Safari / Chrome (抽屜底欄) |
+-------------------------------------------------+-------------------------------------------------+
                                                  | HTTPS
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 靜態前端託管 (Frontend Hosting)                                    |
|                                     GitHub Pages                                                  |
|                                                                                                   |
|  - 原始碼核心: build_index.js  ---> 編譯輸出: index.html (單一獨立發布檔案，大小約 440KB)                 |
|  - Tailwind CSS 3.4 CDN + Lucide Icons + 自訂向量 SVG 圖標集                                      |
|  - 輕量化狀態管理引擎 (Vanilla JS State Object) + 雙語系字典 (i18n Engine)                           |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
              +-----------------------------------+-----------------------------------+
              | GET (快取加速 / action=getAppData)                                    | POST (鑑權寫入/刪除)
              v                                                                       v
+---------------------------------------------------+   +-------------------------------------------+
| Google Apps Script Web App API 端點 (API Gateway)  |   | 高速 POST 通訊管道 (gasPostViaFetch)        |
| URL: https://script.google.com/macros/s/.../exec  |   | 標頭: Content-Type: text/plain;charset=utf-8 |
|                                                   |   | (無 CORS preflight 限制，繞過 Safari ITP)  |
| - 支援 action 路由分發:                           |   +---------------------+---------------------+
|   getAppData / getAlbums / saveEvent / deleteDoc  |                         |
|   uploadSong / saveTheme / batchUpdateSongDurations|                         | HTTP 302 Redirect
| - 伺服端 5 分鐘記憶體快取 (CacheService: app_data_v4) |                         v
| - 互斥寫入鎖 (LockService，doPost 全部寫入動作) |   +-------------------------------------------+
+-------------------------+-------------------------+   | Google UserContent CDN (Echo Endpoint)    |
                          |                             | script.googleusercontent.com/macros/echo  |
                          |                             | 標頭: Access-Control-Allow-Origin: *      |
                          |                             | 回傳: 原生 JSON (成功/失敗狀態碼與原因)     |
                          |                             +---------------------+---------------------+
                          |                                                   |
                          +-------------------------+-------------------------+
                                                    | 讀寫同步
                                                    v
+---------------------------------------------------------------------------------------------------+
|                                雲端資料庫與檔案儲存核心 (Cloud Storage & DB)                         |
|                                                                                                   |
|  [Google Sheets: 3of3 試算表]                   [Google Drive 雲端資料夾群]                         |
|  - Events (活動行事曆)                           - Albums Folder (影像相簿相片，支援多層級年/月目錄)   |
|  - Menus (每日營養餐點)                           - Docs Folder (常用 PDF/Word/Excel 公告文件)        |
|  - Spotlight (焦點輪播推薦)                      - Activity Folder (活動宣傳高清輪播圖檔)            |
|  - Docs / DocCategories (常用文件清單與類別)      - Direct Image CDN (lh3.googleusercontent.com/d/{id})|
|  - Albums / AlbumCategories (相簿記錄與分類)                                                      |
|  - Songs / SongCategories (兒歌律動與分類)      [外部第三方服務]                                    |
|  - Themes / ThemeSemesters (主題課程與學期)       - YouTube Data API v3 (歌曲時長自動解析)            |
|  - Settings (管理員密碼、班級校名、走馬燈公告)                                                    |
+---------------------------------------------------------------------------------------------------+
```

### 1.2 技術選型與環境職責

| 環節 / 元件 | 技術選型 | 職責與用途 | 備註與限制 |
| :--- | :--- | :--- | :--- |
| **前端建置核心** | Node.js (`build_index.js`) | 單一檔案原始碼架構維護，負責將邏輯、樣式、SVG、雙語字典打包產出為靜態 `index.html`。 | **禁止直接手工修改 `index.html`**，所有改動必須在 `build_index.js` 進行並執行 `node build_index.js`（建置只依賴 `logo_b64.txt`）。部署前須驗證內嵌 script 語法（`node --check`）。 |
| **樣式與排版** | Tailwind CSS (CDN Play) | 現代化實用型 CSS 框架，負責全站 Flexbox / Grid 響應式佈局、色彩調色盤與動畫。 | 預設字型縮放使用 root `17.5px`，任意數值邊距需使用 rem 避免破碎。 |
| **應用程式狀態** | Vanilla JS `state` 物件 | 單一真實來源 (Single Source of Truth)，儲存活動、菜單、文件、相簿、歌曲、管理員密碼與語系。 | 掛載於 `window.state` 方便偵錯，具備 `localStorage` 離線容錯機制。 |
| **後端 API** | Google Apps Script (GAS) | 託管於 Google 雲端，負責 `doGet` (資料查詢) 與 `doPost` (新增、更新、刪除、鑑權驗證)。 | 使用 `@google/clasp` 進行本地與雲端雙向同步。 |
| **資料庫核心** | Google Sheets | 作為全站關聯與扁平資料儲存庫，共 15 個工作表，支援即時試算表線上編輯與 API 即時讀寫。 | 所有標題列第一列為欄位 Key，嚴禁隨意變更欄位拼寫或合併第一列儲存格。 |
| **檔案物件儲存** | Google Drive | 儲存相片、公告文件、音訊檔案，提供即時共用連結與縮圖 CDN 服務。 | 資料夾 ID 統一於 `Settings` 試算表設定，權限須開為「知道連結的人均可檢視」。 |

### 1.3 跨網域通訊協議與資料管道 (Direct Fetch POST Protocol)

```
[前端 (GitHub Pages)]                                           [Google Apps Script]
        |                                                                 |
        |--- 1. POST /exec (Content-Type: text/plain;charset=utf-8) ------>|
        |    (Payload: { action: "deleteDoc", id: "DOC-01", ... })        |
        |                                                                 | 2. LockService 取得互斥鎖
        |                                                                 | 3. checkPassword(token) 驗證
        |                                                                 | 4. 執行試算表 row 刪除/寫入
        |                                                                 | 5. clearAppDataCache() 清快取
        |<-- 6. HTTP 302 Redirect (Location: .../macros/echo?...) --------|
        |                                                                 |
[前端 (瀏覽器原生跟隨 302)]                                       [Google Echo CDN]
        |                                                                 |
        |--- 7. GET /macros/echo?user_content_key=... ------------------->|
        |                                                                 |
        |<-- 8. HTTP 200 OK (Access-Control-Allow-Origin: *) -------------|
        |    Body: {"success": true, "message": "文件已成功移除！"}        |
```

- **為何使用 `text/plain`**：
  若使用 `application/json`，現代瀏覽器會強制發送 `OPTIONS` 預檢請求 (Preflight Request)，而 Google Apps Script 的預檢請求無法自訂回應標頭，會直接噴出 CORS Error。使用 `text/plain` 被瀏覽器視為 Simple Request，完全免除預檢，可直接提交並獲得正常 302 導向。
- **雙通道路由機制 (`gasPostViaFetch` & `gasPostViaIframe`)**：
  前端以 `gasPostViaFetch` 為第一優先通道（超時設定 25 秒），若遇極端網路中斷或受限環境，自動降級調用 `gasPostViaIframe` 隱藏表單提交作為雙保險。

### 1.4 雙語系 (i18n) 多語動態切換引擎

- **支援語系**：繁體中文 (`zh-TW`，預設) 與 英文 (`en`)。
- **儲存位置**：`localStorage.getItem('nobel_a_lang') || 'zh'`。
- **DOM 屬性標記**：
  - `data-i18n="nav.home"`：綁定純文字或富文字標籤。
  - `data-i18n-placeholder="admin.pwdPlaceholder"`：綁定輸入框提示文字。
  - `data-i18n-title="common.edit"`：綁定按鈕懸浮提示。
- **動態切換原理**：呼叫 `switchLanguage(lang)` 時，遍歷所有包含 `data-i18n*` 屬性的 DOM 節點進行即時抽換，並主動觸發各子分頁之渲染函式（如 `renderDocsList()`, `renderCalendar()`, `renderThemes()`），達成 0 延遲免重整語言熱切換。

---

<div id="章節二前端頁面架構與模組設計規格"></div>

## 章節二、前端頁面架構與模組設計規格

### 2.1 響應式佈局規格 (Responsive Design Breakpoints)

本系統針對三大核心硬體環境進行專門優化：

```
+---------------------------------------------------------------------------------------------------+
| 1. 桌面端 (Desktop >= 1024px)                                                                      |
|    - 左側收合式導覽欄: 未釘選時 48px Rail (圖示模式)，懸浮自動展開至 136px，釘選後固定 136px。          |
|    - 右側主工作區: 佔據剩餘所有寬度，內距 px-6 py-6，支援多欄網格排版。                                  |
+---------------------------------------------------------------------------------------------------+
| 2. 平板端 (iPad / Tablet 768px ~ 1023px)                                                          |
|    - 經由專利側欄瘦身優化: 預設收合為 48px，釘選寬度僅佔 136px（保留給右側至少 632px~888px 檢視區）。   |
|    - 卡片網格: 自動切換為雙欄 (grid-cols-2) 排版，彈窗鎖定最大寬度 max-w-xl。                          |
+---------------------------------------------------------------------------------------------------+
| 3. 行動手機端 (Mobile < 768px，以 iPhone 390px 基準測試)                                            |
|    - 左側導覽列隱藏為負邊距 (-translate-x-full)，支援漢堡選單滑出抽屜式導覽 (Drawer)。                    |
|    - 底部固定懸浮快速導覽列 (Bottom Navigation Bar，高 60px)，提供「日常/主題/相簿/文件/更多」快速切換。|
|    - 卡片網格: 自動退化為單欄垂直瀑布流 (grid-cols-1)，觸控目標按鈕高度維持 >= 44px (符合 WCAG A11y)。  |
+---------------------------------------------------------------------------------------------------+
```

### 2.2 頂部導覽列 (Header & Brand Bar)

- **裝飾條**：頂部 `h-1.5` 漸層色條（`bg-gradient-to-r from-peach-400 via-sun-300 to-teal-400`），簡約美觀不佔空間。
- **品牌 Logo**：左側包含三之三生命教育基金會官方向量 SVG 高清 Logo (`logo_b64.txt`)，並列展示「新北市桃子腳非營利幼兒園」標籤。
- **班級徽章**：`諾貝爾 A 班` 標題旁附帶圓角膠囊標籤 **`Happy Life`** (`bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full`)。
- **右側控制群**：
  1. 繁中 / EN 切換膠囊按鈕 (`btnLangToggle`)。
  2. 管理員狀態晶片：未登入隱藏；已登入時呈現綠色呼吸燈、`管理員已登入` 字樣與 `🚪 登出` 按鈕。

### 2.3 側邊導覽欄 (Sidebar Rail vs Pinned)

- **收合模式 (Collapsed Rail)**：寬度 `w-12` (48px)，僅顯示圖示，置中對齊，滑鼠懸停顯示 Tooltip。
- **展開/釘選模式 (Expanded / Pinned)**：寬度 `w-[136px]`，顯示微縮圖示與完整繁中/英文標籤。
- **頂部對齊**：首項「🍄 選單導覽」文字與圖示經過像素級對齊，消除懸浮突兀感。

### 2.4 六大核心業務功能模組

#### 1. 班級日常 (Home / Daily Routine)
- **月曆檢視 (Month View)**：6 週完整網格，自動標記當日橘色圈選，日期格右上角顯示精簡活動小圓點（黃點：幸福廚房，紫點：全園，綠點：親職）。
- **週曆檢視 (Week View)**：切換週排程，以橫條展示全週活動進度。
- **單日活動詳情 (Daily Events)**：點選日期動態展示該日行程卡片，包含適用對象標籤、時間地點、活動說明與主題連結。
- **今日營養餐點 (Daily Nutrition Menu)**：早點、午餐（主食、主菜、雙副菜、例湯、當季水果）、午點，清楚標註六大類營養素檢核。
- **焦點活動輪播 (Spotlight Carousel)**：支援多筆活動自動定時輪播、獨立停留秒數、相片/影片燈箱展示、預約排程自動上下架（由 `startDate` 與 `endDate` 自動判定）。

#### 2. 主題活動 (Weekly Themes)
- **課程架構卡片**：展示每週班級教學主題（如「我的班級新生活」、「書的奇幻旅程」）。
- **學習指標 (Goals)**：包含活動內容與對應之幼兒園教保活動課程大綱（如「社-2-3 調整自己的行動」、「情-1-1 察覺情緒」）。
- **學期過濾器**：可依「115 學年上學期」、「115 學年下學期」快速篩選。
- **逆序排序 (`sortThemesDesc`)**：強制以「週次與起始日期」由新到舊倒序排列，最新活動永遠置頂。
- **Google Drive CDN 縮圖**：圖片自動轉化為 `https://lh3.googleusercontent.com/d/{id}` 高速串流載入，點擊可開啟全螢幕相片輪播燈箱。

#### 3. 影像記錄 (Photo Albums)
- **相簿卡片網格**：展示活動封面圖、相簿名稱、相片數量徽章、更新日期。
- **分類過濾標籤**：動態自 `AlbumCategories` 載入（班級主題、全園活動、親職活動、幸福廚房、健康檢查等）。
- **相簿相片燈箱 (Lightbox Modal)**：點擊相簿立即動態呼叫 `getAlbumPhotos(albumId)`，非同步載入該 Google Drive 相簿內的所有高解析度相片，支援鍵盤左右鍵 (`◀`, `▶`) 與手勢滑動切換。

#### 4. 常用文件 (Downloadable Docs)
- **動態檔案圖標引擎 (`getDocFileIconHtml`)**：
  根據副檔名或推導 MIME Type 動態繪製向量 SVG 圖標：
  - `PDF`：經典磚紅色折角文件 + 顯眼白字徽章。
  - `WORD / DOCX`：深藍色文件圖標。
  - `EXCEL / XLSX`：翠綠色試算表圖標。
  - `PPT / PPTX`：亮橘色簡報圖標。
  - `TXT`：鐵灰色文字檔案圖標。
- **分類標籤過濾**：動態自 `DocCategories` 讀取分類（全部文件、保健用藥、學期行事曆、餐飲菜單、親師手冊等）。
- **下載與預覽**：提供一鍵下載按鈕與 Drive 線上預覽。
- **管理員專屬控制列**：登入後浮現「上傳新文件」、「編輯文件資訊」與「刪除」按鈕。

#### 5. 唱跳音符 (Songs & Floating Music Player)
- **雙播放模式支援**：
  - **YouTube 串流**：輸入 YouTube 網址，系統自動萃取 11 碼 Video ID 並嵌入無干擾播放器。
  - **Google Drive 音訊串流**：上傳 MP3 音訊檔案至雲端硬碟，透過 Drive 串流 API 進行即時播放。
- **常駐懸浮音樂膠囊 (Floating Player Capsule)**：在全站任意頁面切換時，底部播放器維持持續播放不中斷，提供播放/暫停、時間進度條、曲目切換與全螢幕視覺動效。
- **YouTube API 自動同步時長**：後端排程或管理後台點選「同步時長」，由 YouTube Data API v3 自動批次解析填回標準 `mm:ss` 時長格式。

#### 6. 系統管理後台 (Admin CMS Dashboard)
- **密碼鑑權防護**：登入時才送出一次管理員密碼（存放於 `Settings`），後端驗證通過後發給短效 token，之後所有寫入只帶 token（詳見 5.6）。
- **子分頁導覽**：
  1. `活動管理 (Events)`：新增/編輯/刪除行事曆活動。
  2. `焦點活動 (Spotlight)`：管理輪播順序（支援 ▲ / ▼ 即時上下移動並同步至試算表）、設定停留秒數與有效期間。
  3. `相簿建立 (UploadPhoto)`：建立新相簿資料夾並支援分塊批次上傳多張相片至 Google Drive。
  4. `文件上傳 (UploadDoc)`：上傳 PDF/Word 檔案至 Google Drive Docs 資料夾並發布至常用清單。
  5. `音樂管理 (Songs)`：新增曲目、上傳 MP3、輸入 YouTube 連結、批次同步 YouTube 時長。
  6. `主題課程 (Themes)`：管理主題活動、週次日期選擇器、指標條列編輯、相片連結。
  7. `全域設定 (Settings)`：變更管理員密碼、園所名稱、班級名稱、走馬燈公告與雲端資料夾 ID。

### 2.5 頁尾資訊區塊 (Footer)

- **字型與色調**：採用高對比明亮玫瑰紅字型 (`text-rose-600 font-bold text-sm tracking-wide`)。
- **聯絡電話與傳真**：明確標註 **`TEL：02-2668-8249｜FAX：02-2668-8245`**，去除不必要的裝飾子句。
- **教育理念標語**：附註「用愛陪伴孩子成長的每一步」心靈標語。

---

<div id="章節三google-sheets-資料庫完整架構與欄位規範"></div>

## 章節三、Google Sheets 資料庫完整架構與欄位規範

試算表 ID：`1lFRlvwQgo_B38YmtFD9BHqyGvuGstOK7etu3RO_BqQU`  
**重要規範**：
1. **工作表名稱大小寫敏感**，切勿自行更改工作表名稱。
2. **第一列固定為欄位識別碼 (Header Keys)**，不得變更英文大小寫、不可新增前置空白、不可合併儲存格。
3. **日期一律採用 ISO-8601 標準文字格式**：`YYYY-MM-DD`（如 `2026-10-23`）。

---

### 3.1 工作表：`Events`（行事曆活動與作息）

| 欄位順序 | 欄位鍵值 (Header) | 中文名稱 | 資料型態 | 必填 | 允許值 / 格式範例 | 說明與限制 |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| A | `id` | 活動編號 | String | 是 | `EV-01`, `1791108732047` | 唯一主鍵。新增時若為空，系統自動產生時間戳記編號。 |
| B | `date` | 開始日期 | Date/String | 是 | `2026-10-23` | **格式強制為 `YYYY-MM-DD`**。切勿填寫 `10/23` 或純數字。 |
| C | `endDate` | 結束日期 | Date/String | 否 | `2026-10-25` | 連假或跨日活動填寫；單日活動留空即可。 |
| D | `title` | 活動主題名稱 | String | 是 | `牙齒塗氟日 口腔保健檢查` | 顯示於月曆上的標題，長度建議在 30 字元以內。 |
| E | `target` | 適用對象 | String | 是 | `諾貝爾A班, 全園活動` | 對應 `EventTargets` 工作表；多項請用英文逗號隔開。 |
| F | `categoryMajor` | 活動類別 (大項) | String | 是 | `重要活動` | 對應 `EventCategories`（重要活動、班級主題、全園活動、節慶放假、園務消毒）。 |
| G | `categoryMinor` | 活動類別 (細項) | String | 否 | `健康檢查` | 對應 `EventCategoriesMinor`（幸福廚房、慶生活動、親職講座等）。 |
| H | `calendarPrompt`| 月曆即時縮寫 | String | 否 | `牙齒塗氟` | 月曆格子右側微型標籤（最多 4~5 個中文字），留空則取 title 前 4 字。 |
| I | `timeLocation`  | 時間與地點說明 | String | 否 | `08:30 (五) 諾貝爾教室` | 於活動詳細展開彈窗中呈現。 |
| J | `description`   | 活動詳細內文 | String | 否 | `請家長務必備妥健保卡...` | 支援多行文字換行。 |
| K | `theme`         | 所屬主題單元 | String | 否 | `快樂上學趣` | 標記此活動隸屬於哪一個教學主題大綱。 |

---

### 3.2 工作表：`Menus`（每日餐飲菜單）

| 欄位順序 | 欄位鍵值 (Header) | 中文名稱 | 資料型態 | 必填 | 允許值 / 格式範例 | 說明與限制 |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| A | `date` | 供餐日期 | Date/String | 是 | `2026-10-01` | 主鍵，一律為 `YYYY-MM-DD`。每日限填一列。 |
| B | `morningSnack` | 早點心品項 | String | 是 | `紅藜雙色饅頭、米漿` | 早晨入園點心餐點。 |
| C | `fruit` | 當季新鮮水果 | String | 否 | `當季水果（香蕉）` | 午餐搭配之水果品項。 |
| D | `lunchStaple` | 午餐主食 | String | 是 | `糙白米飯`, `日式炒烏龍` | 飯、麵、粥或五穀根莖雜糧。 |
| E | `lunchMain` | 午餐主菜 | String | 是 | `青椒炒雞柳`, `糖醋里肌` | 豆魚蛋肉類蛋白質主菜。 |
| F | `lunchSide1` | 午餐副菜一 | String | 否 | `木須炒蛋`, `玉米炒蛋` | 副菜一。 |
| G | `lunchSide2` | 午餐副菜二 | String | 否 | `有機蔬菜`, `開陽白菜` | 副菜二（通常為有機蔬菜）。 |
| H | `lunchSoup` | 午餐營養例湯 | String | 否 | `玉米濃湯`, `青菜豆腐湯` | 湯品。 |
| I | `afternoonSnack`| 下午點心品項 | String | 是 | `滑蛋雞肉粥`, `綠豆薏仁湯` | 幼兒午睡起床後之點心。 |
| J | `nutrients` | 營養素成分檢核 | String | 否 | `全穀雜糧類,豆魚蛋肉類,蔬菜類` | 以逗號分隔，系統用於呈現在營養金字塔標章。 |
| K | `note` | 營養師備註 | String | 否 | `本園未使用主管機關不合格油品`| 特殊說明或慶祝活動點心備註。 |

---

### 3.3 工作表：`Spotlight`（焦點活動輪播推薦）

| 欄位順序 | 欄位鍵值 (Header) | 中文名稱 | 資料型態 | 必填 | 允許值 / 格式範例 | 說明與限制 |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| A | `id` | 焦點活動編號 | String | 是 | `SP-01`, `SP-02` | 唯一識別代碼。 |
| B | `title` | 輪播標題 | String | 是 | `桃子腳幼兒園 牙齒塗氟日攻略` | 主標題（粗體大字）。 |
| C | `subtitle` | 副標題/日期時間 | String | 否 | `日期：2026/10/23 (五) 08:30` | 輔助說明。 |
| D | `imageUrl` | 宣傳海報圖片網址| String | 是 | `https://images.unsplash.com/...` | 支援網路 URL、Google Drive 直連網址或 CDN 連結。 |
| E | `mediaType` | 媒體類型 | String | 是 | `image` 或 `video` | 目前建議設為 `image`。 |
| F | `tags` | 焦點標籤 | String | 否 | `口腔衛教,牙齒塗氟,重要提醒` | 多標籤請用英文逗號隔開。 |
| G | `bulletPoints` | 重點摘要條列 | String | 否 | `【注意事項】請務必攜帶健保卡` | 支援多行文字換行，前台會自動排版為圓點清單。 |
| H | `startDate` | 自動上架起始日 | Date/String | 是 | `2026-10-01` | 到期日前後系統自動判定是否於前台輪播展示。 |
| I | `endDate` | 自動下架截止日 | Date/String | 是 | `2026-10-31` | 超過此日期系統自動略過展示，無須手動刪除。 |
| J | `duration` | 輪播停留秒數 | Number | 是 | `5`, `6`, `8` | 建議介於 `3` 到 `10` 秒。 |
| K | `priority` | 輪播排序權重 | Number | 是 | `1`, `2`, `3` | **格式強制設定為純文字或整數**，數字越小越優先播放。 |
| L | `status` | 啟用狀態 | String | 是 | `啟用` 或 `停用` | 設為 `停用` 則前台不論日期均不播放。 |

---

### 3.4 工作表：`Docs` & `DocCategories`（常用文件與分類）

#### 工作表 `Docs`
| 欄位順序 | 欄位鍵值 (Header) | 中文名稱 | 資料型態 | 必填 | 允許值 / 格式範例 | 說明與限制 |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| A | `id` | 文件識別編號 | String | 是 | `DOC-01`, `DOC-02` | 唯一識別代碼。 |
| B | `fileName` | 檔案顯示完整名稱| String | 是 | `幼兒用藥委託單.pdf` | 必須包含或標註副檔名以利圖標推導。 |
| C | `category` | 文件歸納類別 | String | 是 | `保健用藥`, `餐飲菜單` | 必須對應 `DocCategories` 工作表中的類別名稱。 |
| D | `description` | 文件說明指引 | String | 否 | `請家長下載列印填妥後交給老師` | 簡短說明。 |
| E | `driveFileId` | Drive 檔案 ID | String | 否 | `1ytnx3kP-6XEcZnqzzxVxPeOCJL8jXFoB` | Google Drive 檔案專屬代碼。 |
| F | `downloadUrl` | 下載/預覽完整網址| String | 是 | `https://drive.google.com/uc?export=download&id=...` | 點擊卡片下載按鈕所跳轉之目的地 URL。 |
| G | `updatedAt` | 最後更新日期 | String | 是 | `2026-10-02` | `YYYY-MM-DD` 格式。 |
| H | `fileExtension`| 檔案副檔名標籤 | String | 否 | `pdf`, `docx`, `xlsx`, `pptx` | 若留空，系統會自動由 `fileName` 或 Drive MIME 推導。 |

#### 工作表 `DocCategories`
- 欄位 A1：`categoryName`
- 預設值：`全部文件`, `保健用藥`, `學期行事曆`, `餐飲菜單`, `親師手冊`。使用者可於此處直接新增列擴充文件類別。

---

### 3.5 工作表：`Albums` & `AlbumCategories`（活動相簿與分類）

#### 工作表 `Albums`
| 欄位順序 | 欄位鍵值 (Header) | 中文名稱 | 資料型態 | 必填 | 允許值 / 格式範例 | 說明與限制 |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| A | `id` | 相簿編號 | String | 是 | `demo_alb_01`, `1791108732` | 唯一代碼。 |
| B | `category` | 相簿活動類別 | String | 是 | `健康檢查`, `幸福廚房` | 對應 `AlbumCategories` 工作表。 |
| C | `title` | 相簿主題標題 | String | 是 | `牙齒塗氟日口腔檢查` | 相簿卡片主標題。 |
| D | `folderName` | Drive 資料夾名稱 | String | 是 | `牙齒塗氟日口腔檢查` | 位於 Google Drive 相簿根目錄下的資料夾名稱。 |
| E | `photoCount` | 照片總張數 | Number | 否 | `18`, `24` | 顯示於相簿封面右上角之照片計數徽章。 |
| F | `coverUrl` | 相簿封面圖片網址| String | 否 | `https://images.unsplash.com/...` | 封面圖 URL，若無則自動取資料夾首張相片。 |
| G | `folderUrl` | Drive 資料夾連結| String | 是 | `https://drive.google.com/drive/folders/...` | 點擊開啟外部相簿之連結。 |
| H | `updatedAt` | 建立或更新日期 | String | 是 | `2026-10-23` | `YYYY-MM-DD` 格式。 |

#### 工作表 `AlbumCategories`
- 欄位 A1：`categoryName`
- 預設值：`班級主題`, `全園活動`, `親職活動`, `節慶活動`, `幸福廚房`, `健康檢查`, `戶外踏訪`, `日常生活`。

---

### 3.6 工作表：`Songs` & `SongCategories`（唱跳歌曲與分類）

#### 工作表 `Songs`
| 欄位順序 | 欄位鍵值 (Header) | 中文名稱 | 資料型態 | 必填 | 允許值 / 格式範例 | 說明與限制 |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| A | `id` | 歌曲編號 | String | 是 | `SONG-01`, `1791108732` | 唯一識別代碼。 |
| B | `category` | 歌曲類別 | String | 是 | `兒歌`, `律動舞蹈` | 對應 `SongCategories`。 |
| C | `title` | 歌曲名稱 | String | 是 | `寶貝寶貝 (親親我的寶貝)` | 曲目標題。 |
| D | `youtubeUrl` | YouTube 影片網址| String | 否 | `https://www.youtube.com/watch?v=...` | 可填完整 YouTube 網址或短網址。 |
| E | `youtubeId` | YouTube 11 碼 ID | String | 否 | `dQw4w9WgXcQ` | 若有填寫 URL，系統會自動萃取產生。 |
| F | `duration` | 播放時長 | String | 否 | `03:25`, `02:18` | **注意：儲存格格式必須強制設為純文字 (`@`)**，否則會被 Google 轉為日期。 |
| G | `fileName` | 雲端音訊檔案名稱| String | 否 | `baby_song.mp3` | 若採用 MP3 上傳模式時填寫。 |
| H | `fileSize` | 檔案大小 | String | 否 | `4.2 MB` | 音訊檔案容量。 |
| I | `driveFileId` | Drive 音訊檔案 ID| String | 否 | `1abc...` | 用於串流播放之 Google Drive 檔案代碼。 |
| J | `downloadUrl` | 下載/串流連結 | String | 否 | `https://drive.google.com/...` | 播放位址。 |
| K | `updatedAt` | 更新日期 | String | 是 | `2026-10-04` | `YYYY-MM-DD` 格式。 |

---

### 3.7 工作表：`Themes` & `ThemeSemesters`（主題活動與學期）

#### 工作表 `Themes`
| 欄位順序 | 欄位鍵值 (Header) | 中文名稱 | 資料型態 | 必填 | 允許值 / 格式範例 | 說明與限制 |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| A | `id` | 主題編號 | String | 是 | `1791108732047` | 唯一識別代碼。 |
| B | `semester` | 開課學期 | String | 是 | `115 學年上學期` | 必須對應 `ThemeSemesters` 工作表。 |
| C | `week` | 週次編號 | String | 是 | `第五週`, `第十週` | 課程進度週次。 |
| D | `startDate` | 週次起始日期 | Date/String | 是 | `2026-08-31` | `YYYY-MM-DD` 格式。 |
| E | `endDate` | 週次結束日期 | Date/String | 是 | `2026-09-04` | `YYYY-MM-DD` 格式。 |
| F | `themeName` | 主題名稱 | String | 是 | `書的奇幻旅程` | 該階段教學核心主題。 |
| G | `themeConcept` | 探索核心概念 | String | 是 | `書本大探索`, `我的心情會說話` | 概念名稱。 |
| H | `goals` | 學習指標清單 | JSON/String | 是 | `[{"activity":"...","course":"..."}]` | 結構化 JSON 陣列，儲存活動名稱與教保指標代號。 |
| I | `photos` | 活動相片連結陣列| JSON/String | 否 | `["https://drive.google.com/file/..."]` | 結構化 JSON 陣列，可容納多張 Google Drive 相片網址。 |
| J | `updatedAt` | 更新日期 | String | 是 | `2026-10-04` | `YYYY-MM-DD` 格式。 |

#### 工作表 `ThemeSemesters`
- 欄位 A1：`semesterName`
- 預設值：`115 學年上學期`, `115 學年下學期`。

---

### 3.8 工作表：選項字典輔助表

1. **`EventTargets`（活動適用對象）**：
   - 欄位：`targetName`, `displayName`
   - 範例：`全園活動` (`🏫 全園活動`)、`親職活動` (`👨‍👩‍👧 親職活動`)、`諾貝爾 A` (`❤️ 諾貝爾 A`)、`米羅 A` (`💛 米羅 A`)。
2. **`EventCategories`（活動類別大項）**：
   - 欄位：`categoryName`
   - 預設項目：`重要活動`, `班級主題`, `親職講座`, `全園活動`, `節慶放假`, `園務消毒`。
3. **`EventCategoriesMinor`（活動類別細項）**：
   - 欄位：`categoryName`
   - 預設項目：`幸福廚房`, `親師座談`, `慶生活動`, `戶外踏訪`, `高峰活動`, `歲末活動`, `闖關活動`, `健康檢查`。

---

### 3.9 工作表：`Settings`（全域系統參數表）

| 鍵值 (Key) | 預設值 (Value) | 說明 (Description) |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | （空白，需手動填入） | 系統管理員後台登入密碼。**嚴禁寫入文件或程式碼**（repo 為公開）；留空則無人可登入後台。經後台變更時至少 10 字元，且變更後所有登入立即失效。 |
| `CLASS_NAME` | `諾貝爾 A 班` | 班級全稱。 |
| `KINDERGARTEN_NAME` | `桃子腳幼兒園` | 幼兒園正式名稱。 |
| `ALBUMS_FOLDER_ID` | `1iRFAr3FZMqV-okmktipdwamjAR7WWp6d` | Google Drive 相簿根目錄資料夾 ID。 |
| `DOCS_FOLDER_ID` | `1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR` | Google Drive 常用文件根目錄資料夾 ID。 |
| `ACTIVITY_FOLDER_ID` | `1EKWV3ASXltVtud1f_pfI672MkEfwa8b2` | Google Drive Spotlight 活動海報資料夾 ID。 |
| `ACTIVITY_FOLDER_URL`| (自動推導或自訂) | 前台開啟活動雲端資料夾之外鏈。 |
| `TICKER_MESSAGE` | `🌟 歡迎來到諾貝爾 A 班！...` | 歷史跑馬燈訊息（保留擴充）。 |

---

<div id="章節四歷史踩坑回顧與常見崩潰問題彙整"></div>

## 章節四、歷史踩坑回顧與常見崩潰問題彙整

在過去的多輪版本反覆修改與除錯歷程中，曾多次遭遇嚴重的系統異常或前端功能癱瘓，以下為所有關鍵問題的根因 (Root Cause) 與徹底解法：

### 4.1 Google Sheets 日期/時間序號自動轉換破壞資料 (Duration / Priority)
- **問題症狀**：
  1. 歌曲播放時長在試算表中輸入 `03:45`，前台卻顯示為 `NaN:NaN`、`00:01` 或破裂的時間字串。
  2. 焦點活動的輪播權重輸入數字 `1`、`2`，重新整理後前台 priority 變成 `46298` 等天文數字，導致輪播順序大亂。
- **根本原因**：
  Google Sheets 擁有強大的型態自動猜測機制。當儲存格填入 `03:45` 時，Google Sheets 自動判定為「1899年12月30日的凌晨3點45分」之 Date 物件；當填入純數字 `1` 時，若格式不慎被套為日期，會變成 Epoch 時間序號。後端 GAS 以 `getValues()` 取出時取得的是 JavaScript `Date` 物件而非字串或數字。
- **終極解法**：
  1. 試算表端：選取 `duration` 欄位，在試算表格式設定中強制點選「格式」->「數字」->「純文字 (`@`)」。
  2. 後端防禦：在 [`Code.js`](file:///Users/chiehwu/3of3/Code.js) 的 `getSheetDataAsObjects` 中加入型態反向解析邏輯：
     ```javascript
     if (val instanceof Date) {
       if (header === 'priority') {
         const epoch = new Date(1899, 11, 30);
         val = Math.round((val.getTime() - epoch.getTime()) / 86400000) || 1;
       } else if (header === 'duration') {
         val = String(val.getMinutes()).padStart(2, '0') + ':' + String(val.getSeconds()).padStart(2, '0');
       }
     }
     ```

### 4.2 Safari / iOS 阻擋跨網域隱藏 iframe 表單通訊
- **問題症狀**：
  使用者在 macOS 或 iPad / iPhone 的 Safari 瀏覽器中點擊文件刪除、新增活動，前台看似無錯誤，但 Google Sheets 後端完全沒有任何資料變更。
- **根本原因**：
  先前外部環境呼叫 POST 一律依賴 `gasPostViaIframe`（建立隱藏 `<iframe>`、`<form target="frame">` 提交，並依賴 Google Apps Script 回傳的 HTML 執行 `window.top.postMessage`）。Safari 的 ITP (Intelligent Tracking Prevention) 與跨網域沙盒策略會直接阻擋向 Google Apps Script 提交的跨域 iframe 表單，或屏蔽第三層巢狀 iframe 向外發出的 postMessage，造成通訊在 Safari 靜默超時中斷。
- **終極解法**：
  全面改用現代標準 `fetch()` 搭配 `Content-Type: text/plain;charset=utf-8`。因為是純文字 Simple Request，完全避開 CORS OPTIONS 預檢，Google Apps Script 收到後會回傳 302 導向至 `script.googleusercontent.com`，瀏覽器原生自動跟隨並接收帶有 `Access-Control-Allow-Origin: *` 的標準 JSON 回應。

### 4.3 前台樂觀更新 (Optimistic UI) 導致的偽刪除假象
- **問題症狀**：
  使用者點擊刪除文件，畫面上文件卡片立刻消失，甚至跳出通知，但一重整網頁或檢查 Google Sheets，發現該筆資料依然原封不動存在於試算表中。
- **根本原因**：
  舊版程式碼在尚未收到後端 API 確認成功前，便先行執行 `state.docs = state.docs.filter(...)` 與 `localStorage.setItem(...)`。更嚴重的是，在 `callBackend` 失敗回呼或發生錯誤時，竟然仍提示「已自前台清單中移除」，嚴重掩蓋了連線失敗或密碼被拒絕的事實。
- **終極解法**：
  實作嚴格的**交易狀態快照與回滾機制**。刪除前保存 `prevDocs = [...state.docs]`，必須等後端確認回傳 `{ success: true }` 後才更新本地快取；一旦後端報錯，立即回滾畫面並以顯眼紅字彈窗顯示具體錯誤訊息（如「密碼錯誤」或「連線逾時」）。

### 4.4 前端身分驗證漏洞 (`|| pwd.length > 0`) 導致的鑑權飄移
- **問題症狀**：
  使用者輸入任意密碼都能登入管理員後台，但一執行任何寫入、修改或刪除操作，後端卻全部靜默失敗。
- **根本原因**：
  在過去的本地端離線除錯階段，開發者在 `doAdminLogin` 函式中寫入了寬鬆容錯邏輯：
  `else if (pwd === '<寫死的預設密碼>' || pwd.length > 0)`。
  這導致即使使用者輸入了錯誤的密碼，前台依然放行登入並儲存了錯誤的密碼字串。後續所有寫入 API 帶入該錯誤密碼，後端 `checkPassword` 驗證失敗而拒絕寫入。
- **終極解法**：
  全面移除 `|| pwd.length > 0` 寬鬆檢查，強制要求必須經過後端 `verifyPassword` 成功回傳或完全符合官方預設密碼，並提供統一的 `getAdminPassword()` 輔助函式確保所有 API 呼叫均取得有效憑證。

### 4.5 Tailwind CSS `space-y-*` 與 `class="hidden"` 造成的邊距塌陷
- **問題症狀**：
  管理員控制列在訪客模式下雖然設定了 `class="hidden"`，但下方的內容卡片依然被往下拉開一大段空白（顯得上下留白不均勻或縮進）。
- **根本原因**：
  Tailwind CSS 的 `space-y-6` 實作方式是透過子元素兄弟選取器：`> :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }`。當使用 JavaScript `classList.add('hidden')` 時，元素擁有了 `display: none`，但 DOM 上**並不存在 `[hidden]` 屬性**！Tailwind 仍然會將其計入兄弟元素並在下一個元素強制加上 `margin-top: 1.5rem`。
- **終極解法**：
  在隱藏元素時，必須同時調用 `setAttribute('hidden', '')` 或直接設定行內樣式 `style.display = 'none'`。

### 4.6 圖片切換導致彈窗導覽箭頭上下跳動位移
- **問題症狀**：
  在 Spotlight 焦點活動或相簿燈箱中，按左右箭頭切換上一張/下一張相片時，若相片長寬比不同（一張橫向、一張直向），彈窗高度不斷變動，導致左右導覽箭頭在螢幕上忽高忽低劇烈跳動，使用者極難連續點擊。
- **根本原因**：
  外層包裝容器未設定固定高度或受圖片固有高度 (natural height) 驅動伸縮。
- **終極解法**：
  為圖片容器鎖定響應式視窗高度：`h-[52vh] sm:h-[62vh] min-h-[340px] max-h-[620px]`，圖片本身設定 `w-full h-full object-contain`，將左右箭頭以絕對定位 (`absolute top-1/2 -translate-y-1/2`) 固定在視窗中線，達成 100% 穩定的點擊體驗。

### 4.7 iPadOS 平板視窗下側邊欄過寬擠壓主內容區
- **問題症狀**：
  在 iPad (768px - 1024px) 直向或橫向瀏覽時，左側展開的選單欄佔據過多空白（留白過多），導致右側月曆格子與相簿卡片被嚴重壓縮擠壓。
- **終極解法**：
  重構側邊欄寬度體系：
  - 收合 Rail 寬度由 64px 縮減至 **48px (`w-12`)**。
  - 釘選展開寬度由 200px 縮減至 **136px (`w-[136px]`)**。
  - 成功釋出 60px~120px 珍貴視窗寬度給右側主工作區，卡片與表格在 iPad 上呈現完美比例。

---

<div id="章節五系統防崩潰與穩健性維護指南"></div>

## 章節五、系統防崩潰與穩健性維護指南

### 5.1 資料庫日常維護黃金法則 (Spreadsheet Rules)

1. **嚴禁更動首列英文欄位名稱**：
   Google Sheets 工作表的第一列（Header Row）是後端程式碼映射物件屬性的依據。一旦將 `fileName` 改成 `檔案名稱`，後端將讀不到資料並導致前端空白。
2. **日期欄位嚴禁手動縮寫**：
   日期必須維持 `YYYY-MM-DD`（如 `2026-10-05`）。切勿輸入 `10/5`、`今天` 或 `星期一`。
3. **純數字與時長欄位設定為文字格式**：
   輸入 `priority`（權重）或 `duration`（時長如 `03:20`）前，請先將該欄儲存格格式設定為「純文字」，避免 Google Sheets 自動轉型為日期時間序號。
4. **刪除資料請整列刪除**：
   若要在試算表手動移除一筆資料，請選取該列號（如按右鍵點選「刪除列」），**切勿僅按 Delete 清空內容**（留有空白列可能影響計數）。

### 5.2 前後端 API 增修與欄位擴充標準作業程序 (SOP)

當未來需要為現有表格（如 `Events`）新增一個新欄位（例如 `instructor` 講師）時，必須遵循以下標準作業程序：

```
+---------------------------------------------------------------------------------------------------+
| 步驟 1: 更新 Google Sheets 試算表結構                                                              |
|         在目標工作表最後一欄追加欄位標題 (如 L1 填入 instructor)，並設定儲存格格式為文字。        |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 步驟 2: 更新後端 Code.js 映射邏輯                                                                 |
|         - 在 saveEvent 函式的 fieldMap 物件中加入: instructor: eventData.instructor || ''        |
|         - 檢查 getSheetDataAsObjects 是否能正常遍歷新欄位。                                       |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 步驟 3: 本地推送並更新 Google Apps Script 部署版本                                                 |
|         執行: npx @google/clasp push                                                              |
|         執行: npx @google/clasp deploy -i <DEPLOYMENT_ID> -d "支援活動講師欄位"                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 步驟 4: 更新前端 build_index.js 表單與渲染函式                                                     |
|         - 在活動詳情卡片與編輯彈窗加入 instructor 輸入框。                                         |
|         - 在 I18N_DICT 字典中補上 zh 與 en 翻譯字串。                                              |
|         - 執行: node build_index.js 編譯產生新的 index.html。                                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 步驟 5: 執行迴歸測試與 Git Commit 推播                                                            |
|         - 本地測試新增、編輯、讀取、刪除無異常。                                                   |
|         - 執行: git add . && git commit -m "feat: 新增活動講師欄位" && git push origin main        |
+---------------------------------------------------------------------------------------------------+
```

### 5.3 完整建置與發布部署流程

本專案的所有更新部署指令如下：

```bash
# 1. 編輯 build_index.js 或 Code.js 完成程式修改

# 2. 編譯靜態前端頁面
node build_index.js

# 3. 同步推播後端程式碼至 Google Apps Script
npx @google/clasp push

# 4. 重新發布 Google Apps Script Web App 線上版本 (更新既有部署 ID)
npx @google/clasp deploy -i AKfycbx5JGeiSH2J1vkOu4rh9NPwFBWNSkn5PkHfY5o25t-K4WcOK8b3VQjXi-TqUOzS8TvdJg -d "版本更新描述"

# 5. 推播前端至 GitHub Pages
git add Code.js build_index.js index.html Progress.md SPECIFICATION.md
git commit -m "feat/fix: 更新項目描述"
git push origin main
```

### 5.4 故障排除與健康檢查清單 (Troubleshooting Checklist)

當線上網站發生非預期錯誤或資料未更新時，請依下列清單逐項排除：

| 檢核項目 | 異常現象 | 檢查方式與指令 | 解決方案 |
| :--- | :--- | :--- | :--- |
| **API 連線健康度** | 前台一直轉圈，無法載入資料 | 瀏覽器直接開啟：<br>`https://script.google.com/macros/s/AKfycbx5JGeiSH2J1vkOu4rh9NPwFBWNSkn5PkHfY5o25t-K4WcOK8b3VQjXi-TqUOzS8TvdJg/exec?action=getAppData` | 若出現錯誤訊息，檢查試算表是否被刪除或權限未開；若成功回傳 JSON 表示後端正常。 |
| **快取未即時清除** | 試算表修改了，前台過 5 分鐘才更新 | 呼叫 GAS 後端之 `clearAppDataCache()` | 於後端管理功能點擊「清除快取」，或等待 5 分鐘快取自動過期。 |
| **管理員權限遭拒** | 修改活動顯示「管理員密碼錯誤」 | 檢查 `Settings` 表中 `ADMIN_PASSWORD` 欄位值 | 確認輸入的密碼是否與試算表設定一致（密碼不得寫在文件中）。 |
| **檔案刪除失敗** | 文件前台點刪除但試算表未移除 | 檢查瀏覽器 Console 是否有網路阻擋 | 確認是否已更新至包含 `gasPostViaFetch` 之最新部署版本（@109 以上）。 |
| **後台登入被鎖定** | 顯示「嘗試次數過多…請 15 分鐘後再試」 | 連續輸錯 5 次所致 | 等 15 分鐘，或在試算表選單選「🔓 解除後台登入鎖定」。 |
| **操作時被登出** | 顯示「登入已逾時或無效，請重新登入」 | token 閒置逾 2 小時、超過 8 小時、已登出，或密碼剛被變更 | 以密碼重新登入即可，不影響資料。 |
| **相簿照片無法載入** | 點擊相簿彈窗顯示「目前尚無相片」 | 檢查相簿對應之 Google Drive 資料夾權限 | 資料夾權限必須設為「知道連結的使用者均可檢視」。 |

### 5.5 備份與還原 (Backup & Restore)

- **自動備份**：`weeklyBackup()` 由時間觸發器每週日 03:00（Asia/Taipei）執行，將整份試算表複製到 Drive 資料夾 `桃子腳幼兒園 / Backup`（ID 見 `Code.js` 的 `BACKUP_FOLDER_ID`），檔名 `3of3_backup_YYYY-MM-DD_HHmm`。
- **保留份數**：最近 8 份；更舊的移到垃圾桶（30 天內可還原），只處理檔名符合規則的檔案。複製失敗時不會清理任何舊備份。
- **私人資料夾**：備份內含 `ADMIN_PASSWORD`，程式每次備份都會強制把該資料夾設為私人，**嚴禁分享為「知道連結即可檢視」**。
- **手動備份**：試算表選單「🌟 諾貝爾A班專屬功能 → 💾 立即備份試算表」。
- **首次設定**：在 GAS 編輯器選擇函式 `setupWeeklyBackupTrigger` 並執行一次（需授權），會建立觸發器並立刻備份一次。
- **還原**：開啟備份檔 → 複製需要的工作表回正式試算表；或整份取代時，將備份檔的 ID 更新到 `Code.js` 的 `SPREADSHEET_ID` 並重新部署。
- **寫入互斥**：`doPost` 對所有寫入動作取得 Script Lock（最長等待 20 秒，須小於前端 25 秒逾時），忙碌時回傳「系統目前忙碌」；`verifyPassword` 不佔鎖。

### 5.6 管理員認證機制 (Authentication)

- **登入**：前端送出密碼 → 後端 `verifyPassword` 比對 `Settings.ADMIN_PASSWORD` → 成功回傳隨機 token（存在伺服器端 `CacheService`）。**密碼不會被存在瀏覽器**。
- **之後所有寫入**：沿用 payload 的 `password` 欄位，但內容是 token；後端 `checkPassword(token)` 只認 token，直接傳密碼一律拒絕（因此無法透過寫入端點或公開函式猜密碼）。
- **期限**：閒置 2 小時失效（每次使用延長）；不論是否活躍，最長 8 小時必須重新登入。token 只存 `sessionStorage`，關閉分頁即消失；舊版遺留在 `localStorage` 的明文密碼會在載入時自動清除。
- **鎖定**：連續輸錯 5 次，鎖定登入 15 分鐘（鎖定期間連正確密碼也不接受，且不再累計）。需提前解除時：試算表選單「🌟 諾貝爾A班專屬功能 → 🔓 解除後台登入鎖定」。取捨：任何人都能故意輸錯 5 次造成短暫鎖定，換取無法暴力猜密碼。
- **逾時處理**：後端回傳 `authExpired: true` 時，前端先讓原本的 callback 還原畫面，再統一回到登入畫面並提示重新登入。
- **變更密碼**：後台變更成功後，所有裝置的 token 立即失效（`AUTH_EPOCH`），需以新密碼重新登入。
- **已知限制**：token 存在 `CacheService`，Google 在極少數情況可能提前清除快取，管理員會被要求重新登入（不影響資料）。`Settings` 內的密碼仍為明文（有試算表編輯權限者可見）。
- **測試**：`node tests/auth.test.js`（模擬環境，44 項），修改認證、鎖定、備份相關程式後須全數通過才可部署。

### 5.7 前端輸出跳脫（XSS 防護）

- **原則**：試算表與使用者輸入的任何字串，都視為不可信。放進 HTML 前必須經過 `build_index.js` 的三個工具：`esc()`（HTML 文字／屬性）、`jsq()`（`onclick="fn('…')"` 內的 JS 字串，先 JS 跳脫再 HTML 跳脫）、`escUrl()`（`href`／`src`，只允許 http(s)、相對路徑、blob:、data:image/，`javascript:` 一律清空）。`textContent`／`.value` 賦值本身安全。
- **為何要三種**：只做 HTML 跳脫不足以防禦——放在事件屬性裡的資料會先被瀏覽器解碼 `&quot;`，再被當成 JavaScript 執行；網址欄位則需要擋掉 `javascript:` 協定。
- **新增畫面或欄位時**：所有插值都要套用上述工具，並執行 `tests/xss_harness.js`（說明見 `tests/README.md`），A～E 類須全為 0、L 類不得雙重跳脫，才可部署。
- **已知限制**：這是「輸出端」防護。若有人取得試算表編輯權限，仍可改動內容（但無法執行程式）；`innerHTML` 仍被大量使用，新程式請優先使用 `textContent` 或上述工具。

### 5.8 冪等性：防止逾時重送造成重複寫入 (Idempotency)

- **問題**：前端 `fetch` 逾時（25 秒）或失敗後會自動降級用 iframe 重送，相簿上傳區塊也會自動重試 3 次；若第一次其實已成功、只是回應遺失，沒有保護就會重複寫入（重複的活動、文件、相片）。
- **做法**：前端 `callBackend` 對每個寫入動作產生唯一的 `idempotencyKey`（`newIdempotencyKey()`），**同一次操作的所有重送共用同一個編號**；相簿上傳以「區塊位置」固定編號，連使用者按「重試」也沿用。後端 `doPost` 在互斥鎖**之內**檢查：編號已處理過就直接回傳上次結果（帶 `duplicate: true`），不再執行。
- **規則**：只記錄**成功**的結果（失敗的操作重試仍會重新執行）；保留 10 分鐘；結果超過 90KB 不快取；編號格式需符合 `[A-Za-z0-9_-]{16,80}`，否則忽略；登入／登出／檢查登入狀態不去重。必須 token 驗證通過才查詢快取，避免用猜的編號取得別人的操作結果。沒帶編號（舊版前端）行為與以前相同。
- **新增寫入動作時**：不需要額外處理，`callBackend` 會自動附上編號；若自己做重試迴圈，請在迴圈外產生一次編號並傳入 payload。
- **測試**：`node tests/idempotency.test.js`（21 項，含變異測試驗證）。
- **已知限制**：快取存在 `CacheService`，極少數情況可能提前被清除，此時重送會被當成新操作（回到沒有保護的狀況，不會更糟）；若第一次請求執行超過 20 秒，重送會收到「系統忙碌」而非上次結果。

---

*本文件為桃子腳幼兒園諾貝爾 A 班專案之官方最高指引規格書，後續所有功能擴充或維護作業均須嚴格遵照本規範執行。*
