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

