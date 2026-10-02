# 桃子腳非營利幼兒園 - 諾貝爾 A 班 專屬生活網 (Google Apps Script Web App)

專為**新北市桃子腳非營利幼兒園 諾貝爾 A 班**量身打造之班級生活與行事曆系統，採用 SPA 單頁架構與 Mobile-First 觸控友善設計，結合三之三生命教育暖色調美學。

---

## 🌐 網頁與資料庫連結

* **🌟 GitHub Pages 專屬網址（推薦使用）**：
  👉 [https://chieh-ai.github.io/3of3/](https://chieh-ai.github.io/3of3/)
* **📦 GitHub 專案原始碼倉庫**：
  👉 [https://github.com/chieh-ai/3of3](https://github.com/chieh-ai/3of3)
* **⚡ Google Apps Script Web App 備用網址**：
  👉 [https://script.google.com/macros/s/AKfycbxngSEbmXLW2_M7FNVxBLpbp-X1w1Z8ZX_33Kpj-ZekpGwS19Ao262HmLKkTbl3156A8g/exec](https://script.google.com/macros/s/AKfycbxngSEbmXLW2_M7FNVxBLpbp-X1w1Z8ZX_33Kpj-ZekpGwS19Ao262HmLKkTbl3156A8g/exec)
* **GAS 專案編輯器**：
  👉 [https://script.google.com/d/1vCAafbDcotTym_8F8w0lmhONdcOfr2CB7fBy77Fp533PQ0w9kDJVVYsE/edit](https://script.google.com/d/1vCAafbDcotTym_8F8w0lmhONdcOfr2CB7fBy77Fp533PQ0w9kDJVVYsE/edit)
* **Google 試算表資料庫**：
  👉 [https://docs.google.com/spreadsheets/d/1lFRlvwQgo_B38YmtFD9BHqyGvuGstOK7etu3RO_BqQU/edit](https://docs.google.com/spreadsheets/d/1lFRlvwQgo_B38YmtFD9BHqyGvuGstOK7etu3RO_BqQU/edit)
* **Google Drive 活動相簿（Albums）**：
  👉 [https://drive.google.com/drive/folders/1iRFAr3FZMqV-okmktipdwamjAR7WWp6d](https://drive.google.com/drive/folders/1iRFAr3FZMqV-okmktipdwamjAR7WWp6d)
* **Google Drive 常用文件（Docs）**：
  👉 [https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR](https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR)
* **Google Drive Spotlight 活動圖片（Acticity）**：
  👉 [https://drive.google.com/drive/folders/1EKWV3ASXIttVtud1f_pfl672MkEfwa8b2](https://drive.google.com/drive/folders/1EKWV3ASXIttVtud1f_pfl672MkEfwa8b2)

---

## 🔑 預設管理員密碼

* **初始預設密碼**：`nobel-a-2026`
* 可於網頁後台之「⚙️ 密碼與設定」隨時變更，變更後自動同步寫入試算表 `Settings` 頁面。

---

## 🌟 核心功能特點

1. **可編輯行事曆（週日為每週第一天）**：
   * 週日～週六 7 欄網格排版，支援月份切換、返回今天。
   * 特殊活動點點標記，諾貝爾 A 班專屬活動（如幸福廚房）高亮標示。
   * 支援三大檢視模式：`[單日點選]`、`[查看本週]`、`[本月總覽]`。
2. **行程活動與每日菜單連動區段**：
   * 點擊行事曆任一日期，即時帶出當日排定活動（附主題名稱與注意事項）與營養菜單（早點、當季水果、午餐主副菜五菜一湯、午點、檢核合格章）。
3. **Spotlight 近期重點活動區**：
   * 展現牙齒塗氟日等大活動攻略圖、注意事項（健保卡攜帶提醒），點擊可開啟高解析燈箱攻略。
4. **活動影像相簿（Albums）**：
   * 串聯 Google Drive Albums 資料夾。
   * 後台支援選取多張照片批次上傳，自動建立「`YYYY-MM-DD_活動主題`」子資料夾。
   * 前台縮圖網格、大圖全螢幕燈箱與一鍵下載。
5. **常用資訊與檔案下載（Docs）**：
   * 串聯 Google Drive Docs 資料夾。
   * 條列用藥委託單、行事曆 PDF 等，提供直接下載與預覽。
6. **獨立管理後台（Admin Dashboard）**：
   * 密碼防護，支援活動增修刪、菜單單日編輯、相簿建立上傳、文件發佈與系統設定。

---

## 🚀 首次使用授權指引（Google OAuth 驗證）

由於 Google Apps Script 涉及存取您的 Google 試算表與 Google Drive 雲端資料夾：

1. 開啟 [Google 試算表](https://docs.google.com/spreadsheets/d/1lFRlvwQgo_B38YmtFD9BHqyGvuGstOK7etu3RO_BqQU/edit)
2. 重新整理後，上方功能表會出現「🌟 諾貝爾A班專屬功能」
3. 點選「🚀 一鍵初始化／重設資料庫」
4. 此時 Google 會彈出「需要授權」視窗：
   * 點選「繼續」或您的 Google 帳號
   * 點選「進階 (Advanced)」
   * 點選「前往 桃子腳幼兒園諾貝爾A班 (不安全)」
   * 點選「允許 (Allow)」
5. 授權完成後，系統會自動在試算表建立 5 個工作表（Events、Menus、Spotlight、Docs、Settings）並填入 10 月菜單與行事曆示範資料。
6. 隨後即可點選 [Web App 網址](https://script.google.com/macros/s/AKfycbxngSEbmXLW2_M7FNVxBLpbp-X1w1Z8ZX_33Kpj-ZekpGwS19Ao262HmLKkTbl3156A8g/exec) 開始使用！
