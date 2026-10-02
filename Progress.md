# 3of3 Kindergarten Web App Progress & Lessons Learned

## Current Project Status
- **Architecture**: A serverless frontend deployed on GitHub/Netlify (from `avaltech-ai/3of3.git`), connecting directly to a Google Apps Script (GAS) backend for all data needs.
- **Frontend Framework**: Vanilla HTML/JS styled with TailwindCSS (via CDN). Single-page application logic defined in `build_index.js`, which generates `index.html`.
- **Backend API**: Google Apps Script deployed as a Web App (access: "Anyone"). Handles GET and POST requests.
- **Latest Features Implemented**:
  - Rebranded from "3&3 Foundation" to an informal parent-run site.
  - Custom UI/UX for Spotlight Carousel (autoplay, muted video support, dynamic status tags, responsive design).
  - Admin backend login and file upload structure in place.

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
