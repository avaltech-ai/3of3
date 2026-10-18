# 3of3 Kindergarten Web App Progress & Lessons Learned

## 📌 專案進度摘要（交接用，2026-10-18 更新；使用者於本日結束對話，下一個對話由使用者重啟）

> **新對話接手時請先讀本節與 `TODO.md`**，再視需要讀 `SPECIFICATION.md`（規格正本；2.3 手機底部導覽、2.4 第 1 項首頁小卡與手機月曆、2b 學期任務、2c 幼小銜接、3.11～3.12 新工作表為最近新增）與 `tests/README.md`（測試說明）。下方「Critical Technical Lessons Learned」第 1～21 條與其後的條列是**歷史紀錄，依時間排列**：其中第 1、2、19 條已過時（見各條註記）；2026-10-05 起每個項目都有「根因／做法／教訓／未驗證項目」，改相關功能前請先找對應條目。

### 一、目前狀態（一句話）
**線上穩定；2026-10-13～10-18 的項目已全部上線並由使用者實機驗證通過。** 後端 GAS 現行部署 **@138「手機導覽列」**（另有不可刪的 `@HEAD`，共 2 個部署；**下次發布新版本編號是 139**）；前端 GitHub Pages 與 `main` 同步（最新 `a0ddf8d`，Pages 與 CI 皆成功）。工作目錄乾淨、本機與 `origin/main` 一致。

**2026-10-13～10-18 新增（皆已上線、已驗證）**
- **常用文件管理移到後台**（前台只剩下載；後台內嵌表單＋搜尋分頁列表）。
- **學期任務頁**（🎯，主題活動之後）：班級小任務／家長配合事項圖示卡片、學期切換、選填總覽圖；後台逐筆管理＋整批複製上學期。工作表 `SemesterTasks`，總覽圖在 `ThemeSemesters.tasksOverviewImage`。後端 @136。
- **幼小銜接頁**（🎒，學期任務之後）：「銜接計畫」能力類別卡片（在園／在家／一起）、家長勾選（只存在家長裝置的 localStorage）、進度條、列印含勾選／空白版（A4 直式，不附回條）；「為什麼重要」文章重點卡片、孩子心聲泡泡、金句、閱讀原文（未來親子，文／劉慈惠）。工作表 `TransitionPlan`、`TransitionArticles`；後台逐筆管理＋整學年複製。後端 @137。
- **首頁「今天／明天」小卡**（最上方；晚上 6 點後或放假日「下一個上課日」在前；活動與行事曆提示、午餐點心、🥐🎂；「展開完整內容」在卡片內展開）。
- **後台待辦提醒**（菜單 14 天內缺上課日、英文對照新文字、焦點 3 天內下架／沒有播映中、每月 20 日起下個月行事曆是空的）。
- **手機底部導覽列**（4 格＋更多；後台「密碼與設定」可改，存在 `Settings!MOBILE_NAV_TABS`，預設 班級日常／影像記錄／主題活動／唱跳音符）；**手機已移除 ☰**。後端 @138。
- **手機月曆**：預設「查看本週」，模式鈕與格子連動（單日／本週只顯示一週、本月總覽整月、一週模式 ‹ › 一次移一週）。
- **修正**：「今天」按鈕與月曆開啟日原本寫死 2026/10/23；手機標頭、焦點列、月曆模式鈕在窄螢幕＋大字下的換行／重疊／截斷（已用 320～430px × 標準／大字 12 種組合實測）。
- 測試修正（背景任務）：`tests/event_minor.js` 隔離 TextMap 後恢復正常（`1a3aa66`）。

**一眼看完的狀態（2026-10-05～10-11 完成並已驗證）**
- 資安與穩定性、手機連線修復、PWA 加到主畫面、行事曆訂閱、備份／預熱觸發器失敗通知（備份立即通知、預熱每天通知）。
- 英文：名稱對照 NameMap、自由文字 TextMap、後台「🌐 英文對照」網頁編輯、相似文字提示。
- 焦點活動：前台「歷史焦點」、後台列表搜尋與分頁、「🔁 再次上架」、播放順位只屬於播映中、預設篩選「播映中」。
- 後台列表統一的搜尋與分頁；各後台表單「新增／編輯／複製」模式；列表純圖示按鈕。
- 唱跳音符「🔒 不開放下載」與批次設定（34 首已全部設為不開放）；相簿支援影片；學期主題架構圖。
- 裸 GAS `/exec` 網址只顯示導向頁。

**2026-10-18 後續（僅前端，`ecc1a7e` 已上線；使用者實機測試正常）**：**後台頁籤分組（兩層）**——11 個子頁籤依更新頻率分 4 組（日常更新／影音與文件／學期課程／系統），上層組別、下層只顯示該組子頁籤；點組別回到上次停留的子頁籤；英文對照紅點同步到「系統」組別。實測 320／360／375／390／414／430／1100px × 標準／大字：組別與子頁籤無截斷、無重疊；`tests/admin_groups.js`（29）、`restore_tab.js`（20）、`admin_first_open.js`（9）、`sidebar.js`（18）、`mobile_nav.js`（42）通過。**既有問題（未處理）**：320px＋大字時後台列表的分頁按鈕列／表格讓頁面多出約 5px 橫向捲動（改動前就有）。

**2026-10-18 後續（僅前端，待使用者實機驗證）**：**載入骨架畫面**：只在手機裡沒有快取資料（第一次開啟）時，資料到之前顯示灰色骨架，不再先出現「菜單尚未公布」、空白月曆等容易誤會的內容；第一次開啟就連線失敗時改顯示「暫時連不上雲端資料＋🔄 重新載入」面板（不再跳「可能是舊資料」提示）。範圍：首頁小卡＋焦點＋月曆、影像記錄、唱跳音符、主題活動、學期任務、幼小銜接、常用文件（相簿照片格與縮圖底色使用者決定不做）。實測：清空快取後約 2 秒由骨架換成內容；320～430px＋1100px × 標準／大字共 14 種，骨架與失敗面板無橫向捲動、無超出、無截斷。`tests/skeleton.js`（27，2 種變異皆抓到）；`today_card`（33）、`restore_tab`（20）、`admin_first_open`（9）、`wait_hint`（15）、`retry_frontend`（3 種情境）、`standalone`（13）、`calendar_icons`（24）、`small_improvements`（28）、`admin_groups`（29）、`sidebar`（18）、`mobile_nav`（42）通過。**順手修正**：`today_card.js` 有一項寫死「提醒卡下一個就是子頁籤」，上一輪頁籤分組後會失敗（上一輪漏跑這支），已改為檢查組別列與子頁籤列。`index.html` 增加約 18KB（骨架標記）。

**2026-10-18 後續（僅前端，待使用者實機驗證）**：**「上次來之後有什麼新的」導覽列紅點**（使用者選：只有導覽列紅點、所有類別都算但菜單不算、只算新增、關掉重開才重算）：家長手機記下上次看到的內容編號，下次開啟時新的項目在側邊欄／底部導覽／「更多」對應頁面顯示紅點，**離開該頁時消失**（停在該頁時保留，這點是我依合理預設決定）；活動只算今天以後、焦點只算播映中；每台手機第一次開啟不提示。實測：320～430px × 標準／大字共 12 種，底部導覽紅點位置正確、沒有橫向捲動、文字沒有被截斷；電腦版側邊欄紅點正常。`tests/new_since.js`（31，3 種變異皆抓到）；`mobile_nav`（42）、`restore_tab`（20）、`sidebar`（18）、`today_card`（33）、`skeleton`（27）、`standalone`（13）、`small_improvements`（28）、`admin_groups`（29）、`calendar_icons`（24）通過。**測試注意**：在同一個頁面連跑多支測試後，`sidebar.js` 可能因 `window.innerWidth` 讀不到而失敗；重新載入頁面再跑即通過（改動前的版本也一樣）。

**2026-10-18 後續（僅前端，待使用者實機驗證）**：**季節主題色**（使用者選：依月份自動、四季照建議、色票照建議；節慶主題列入下階段）：只換頁面底色、頁首彩色細線、Logo 左下角小圖示（🌸🍉🍁⛄），主色桃粉色不變。小圖示原本放右下角，截圖發現離「諾貝爾」只有約 4px 太擠，改放左下角。實測 320～430px＋1100px × 標準／大字共 14 種：沒有橫向捲動、小圖示在畫面內且不和標頭文字重疊、班名列高度不變。`tests/season_theme.js`（22，2 種變異皆抓到）；`sidebar`（18）、`mobile_nav`（42）、`today_card`（33）、`small_improvements`（28）、`standalone`（13）、`skeleton`（27）、`new_since`（31）、`restore_tab`（20）通過。

**2026-10-18 後續（僅前端，待使用者實機驗證）**：**節慶主題**（使用者拍板：9 個節慶；農曆新年＝小年夜前 7 天～元宵，其餘＝節日前 3 天到當天；四個位置都放、每個節慶都放滿；不要祝福語、不要後台開關；比較 (a) 向量圖與 (b) AI 生成圖〔Canva 產生萬聖節、聖誕節樣張〕後選 (a)）。**做法與決定**：見 `SPECIFICATION.md` 2.2f。我自己決定的細節（使用者未特別指定）：① 頁首掛飾改放在固定頁首的**正下方**、跟著頁面捲動（樣張是放在頁首裡，但頁首固定在畫面頂端，放在裡面會讓頁首一直多佔 40px）；② 標題卡淡圖只有影像記錄、唱跳音符、常用文件三頁有（其他頁沒有彩色標題卡）；③ 今天小卡節日當天加了「🥮 中秋節」這種只寫名稱的標籤（解釋插圖，不是祝福語）；④ 父親節小圖示 👔。**農曆日期教訓**：Node／瀏覽器內建的農曆換算（ICU 78）把 2027 春節算成 2/7、2030 春節算成 2/2，與行政院行事曆（2/6、2/3）不符，改用香港天文台公農曆對照表算出 2026～2035 的表並寫進測試。**實測**：320～430px＋1100px × 標準／大字（聖誕、中秋、元宵、兒童節），沒有橫向捲動、今天小卡插圖不壓字也不截斷、三頁標題卡不溢出；320～375px＋大字時部分月曆格內容溢出，**加不加節慶圖示都一樣（原本就有，未處理）**。截圖確認中秋、聖誕手機版與萬聖節電腦版掛飾無縫重複。`festival.test.js`（27，4 種變異皆抓到）、`festival_theme.js`（30，2 種變異皆抓到）；`sidebar`（18）、`calendar_icons`（24）、`today_card`（33）、`season_theme`（22）、`skeleton`（27）、`new_since`（31）、`mobile_nav`（42）、`small_improvements`（28）、`standalone`（13）、`restore_tab`（20）、`admin_groups`（29）、`admin_first_open`（9）通過。**測試注意**：瀏覽器窗格在背景時 `document.hidden` 是 true，截圖時窗格切到前景會觸發「回到前景就依今天重設季節／節慶」，模擬節慶日期截圖前要先固定 `applyFestival`。

**2026-10-18 後續（僅前端，待使用者實機驗證）**：**幼小銜接「四週打卡表」＋「單週打卡表」**（使用者拍板：固定一份習慣、印空白格、附小獎勵欄、A4 橫式；列印途中使用者另外要求加做單週版，內容比照四週，只是打卡格改一週 7 天）。習慣共 5 項、寫死在 `TR_HABITS`（不跟工作表連動，要換項目請改程式）；其中「假日運動」那列週一～五灰底。用真正的列印樣式量過：四週版 137.8 mm、單週版 162.7 mm 高，都在一頁 A4 橫式內；打卡格四週版 7.7×14 mm、單週版 31×20 mm。`habit_sheet.js`（35，7 種變異皆抓到）；工具列在 320～430／1100px × 標準／大字沒有超出、截斷或重疊。**順手修正兩支測試的既有問題**：`transition_frontend.js`、`tasks_frontend.js` 各有一項「沒有英文對照就退回中文」斷言，會把**線上現有的英文對照表**併進測試，老師補了「語文能力」等英文之後就失敗（改動前就失敗，不是這次造成）；改成只用測試自己的對照。`transition_frontend`（74）、`tasks_frontend`（70）、`mobile_nav`（42）、`skeleton`（27）、`new_since`（31）、`season_theme`（22）、`festival_theme`（30）通過。

**可接著做（使用者評估中，未點名前不要動工；見 `TODO.md`）**：（原清單已全部完成）；320px＋大字時月曆表頭「週日、週一…」會直排成兩字（原本就有，未處理）。

**需要使用者決定（皆不阻塞線上運作）**：① 兒童照片與影片公開範圍（班級通行碼；只在前端擋沒有真正保護力）；② 管理員密碼改存雜湊（要先設計忘記密碼的救援流程）。低優先：相簿排除封面設定、後台介面英文化（不建議）。

**新對話接手提醒**：① 先讀本節與 `TODO.md`；② 新功能依使用者偏好**先討論設計與決定點，拍板後才動工**，交付必附手動部署步驟；③ **後端有改時順序固定：測試 → `clasp push`（使用者同意後；並用 `clasp pull` 到暫存資料夾 `cmp` 驗證）→ 請使用者到 GAS「管理部署作業 → 編輯 → 新版本 → 部署」（絕不選新增部署）→ 驗證後端（部署仍 2 個、錯誤 token 被拒、GET 為未知動作、`getAppData` 帶新欄位；發布後約 3 分鐘內可能仍是舊快取）→ 才推送前端**；④ 權限／隱私類功能上線前，要用匿名連線（`curl`）實測並讀回實際狀態；⑤ 不要用 `clasp version`（會建立新版本）；⑥ **`git push` 已固定用 `avaltech-ai`**（本 repo `.git/config` 的 credential helper；全機 `gh` 啟用帳號維持 `chieh-ai`，不必切換；重新 clone 需重設，見下方 2026-10-17 條目）；⑦ **手機版面的修改要用 320／360／375／390／414／430px × 標準／大字一起量**（文字截斷、重疊、橫向捲動），見 `~/.agents/institution/maintenance/lessons.md` 2026-10-18；⑧ 瀏覽器測試多數需從中文介面開始（新測試已內建切換）、單次執行上限約 45 秒；`getAppData` 目前約 77KB（快取上限 100KB，持續注意）。

#### 近期完成項目明細（依時間；含根因、驗證與注意事項）
- **修正：手機月曆模式鈕文字被截成「單…」（2026-10-18，僅前端，我上一輪造成；`cea2a99` 已上線，使用者實機測試正常）**：使用者實機截圖顯示三個鈕只剩「單…／查…／本…」。**根因**：我只在 320px＋大字測過；使用者手機比 360px 寬（圖示仍顯示）又開了大字，圖示＋4 個字放不下就被截斷。另發現同情況下年月標題「2026 年 10 月」會碰到 ›（‹ › 以 rem 為單位，大字時跟著變大）。**做法**：手機上模式鈕不顯示圖示；年月、‹ ›、「今天」在手機上固定大小。**實測**：320／360／375／390／414／430px × 標準／大字共 12 種：模式鈕全名、標題不碰箭頭、焦點列不重疊、沒有橫向捲動（只有學校名稱在 360px 以下＋大字時依設計以「…」結尾）。`mobile_nav.js` 42 項通過。**教訓**：手機版面的修改，要用 320～430px 至少 5 種寬度 × 標準／大字一起量（量「文字是否被截斷 scrollWidth > clientWidth」與「元素是否重疊」），不能只量最窄的一種。
- **移除手機 ☰、焦點列重疊、月曆模式鈕與格子連動（2026-10-18，僅前端，`4562b2f`＋`cea2a99` 已上線；使用者實機測試正常）**：使用者實機回饋兩點：① 有了底部導覽列還需要 ☰ 嗎（同意移除）；② 月曆預設顯示一週，但按鈕選的是「單日點選」（拍板「按鈕與格子連動」）。另修正我上一輪造成的問題：大字＋窄螢幕時「歷史焦點」與「3 / 4」重疊（改為空間不夠時換行）。**根因（②）**：格子收合與三個模式鈕是兩套開關。**做法**：見 `SPECIFICATION.md` 2.3、2.4 第 1 項。**實測**：使用者的截圖約為 320px 寬（推測 iPhone 放大顯示），在 320px 標準與大字下：沒有橫向捲動、模式鈕全名、標題列與「今天」一行、焦點列不重疊；393px、1100px 亦檢查。**測試**：`mobile_nav.js` 改為 41 項（模式連動、週移動、跨月、今天、電腦不變），2 種變異皆抓到；`today_card.js`（33）、`calendar_icons.js`（24）、`small_improvements.js`（28）、`restore_tab.js`（20）通過；中英文模式鈕文字正確。**已知未處理（原本就有）**：320px＋大字時月曆的「週日／週一…」表頭會直排成兩字。
- **手機底部導覽列（後台可設定）＋手機月曆預設只看一週（2026-10-18，後端 @138 已發布並驗證、前端已上線；使用者實機測試正常）**：使用者要做的兩項。**後端驗證**：部署仍 2 個；錯誤 token 被拒；GET 為未知動作；`getAppData` 的 `settings.mobileNavTabs` 為 `[]`（尚未設定 → 前端用預設；發布後約 3 分鐘內仍是舊快取，沒有這個欄位）。**決定（使用者拍板）**：預設 4 格＝班級日常、影像記錄、主題活動、唱跳音符（其餘頁面、大字、English、管理後台在「更多」）；**後台可以自己改**（因此要動後端：`Settings!MOBILE_NAV_TABS`、`saveMobileNav`）；月曆＝只顯示本週那一列＋展開整個月。細節見 `SPECIFICATION.md` 2.3、2.4 第 1 項。**順手修正**：手機上「單日點選／查看本週／本月總覽」被擠成兩行（原本就有）。**測試**：後端 `mobilenav.test.js`（18 項）、瀏覽器 `mobile_nav.js`（34 項，2 種變異皆抓到）、XSS A／C／E 皆 0（假資料下毒時導覽列退回預設）、`today_card.js`（33）、`restore_tab.js`（20）、`calendar_icons.js`（24）、`standalone.js`（13）、`small_improvements.js`（28）、`sidebar.js`（18，視窗 1100）皆通過。393px 實測：月曆格子從約 1,150px 縮到 154px、沒有橫向捲動；1100px：底部導覽隱藏、月曆整月。**部署順序**：後端先（版本 138），前端後；前端在後端發布前也能運作（用預設項目），只是後台儲存會失敗。**未驗證**：真實手機（特別是 iPhone 底部安全區與 App 模式）。
- **小卡改為「在卡片內展開」＋標頭不換行（2026-10-18，僅前端，`4d11069` 已上線；使用者實機驗證沒問題）**：使用者實機回饋（iPhone App 模式截圖）：「明天」與「今天」的「看詳細內容」都跳到同一個地方，容易誤會；另「新北市桃子腳非營利幼兒園」的「園」被擠到第二行。**決定（使用者拍板）**：改成在卡片內展開；標頭要修。**做法**：見 `SPECIFICATION.md` 2.4 第 1 項；沒有更多內容時不顯示展開鈕；App 模式在手機上替 ↻ 鈕讓出位置。**測試**：`today_card.js` 增為 33 項（展開／收合、不改月曆選取、完整菜單、說明保留換行、各自展開、重畫保持、週末無按鈕、摘要隱藏），2 種變異皆抓到；`standalone.js`（13）仍通過；320px＋大字＋↻ 鈕實測：兩行標題各一行、以「…」結尾、沒有重疊與橫向捲動；375／393px 時全名完整顯示。
- **首頁「今天／明天」小卡、後台待辦提醒、手機版面與日期修正（2026-10-18，僅前端，`336ce3f` 已上線；使用者實機驗證沒問題）**：使用者請我以老師與家長角度檢視網站後，同意先做三項。**根因／動機**：手機上「當日活動與行程」在約 2,150px 處（要滑將近 3 個螢幕）；手機班名被擠成兩行、焦點活動的「歷史焦點」「3 / 4」被擠成兩行；線上菜單只填到 10/30。**決定（使用者拍板）**：小卡＝活動與行事曆提示、午餐與點心、特別日子圖示（不放即將到來的焦點活動）；晚上 6 點後＋跳過週末顯示下一個上課日；待辦提醒四項全做（菜單、英文對照、焦點下架、下個月行事曆）。**順手修正（使用者事後知情）**：「今天」按鈕一律跳到 2026/10/23、2027 年起月曆會開在 2026/10/23（示範資料時期留下的寫死日期）。細節見 `SPECIFICATION.md` 2.4 第 1、6 項。**測試**：`adminlist.test.js`（113 項，新增日期與提醒 19 項）、瀏覽器 `today_card.js`（20 項，4 種變異皆抓到）、XSS A～E 皆 0（小卡另以「把下毒的活動與菜單放在今天／明天」驗證）、`calendar_icons.js`（24）、`restore_tab.js`（20）仍通過。手機 375px 實測：班名一行、焦點列不換行、沒有橫向捲動、小卡在 176px 處。**已知既有問題（與本次無關）**：`tests/event_minor.js` 的「英文介面：細項顯示對照表的英文」在本次修改前的版本也失敗，原因未查。使用者已實機驗證（2026-10-18）。
- **新增「幼小銜接」頁面（2026-10-17，後端 @137 已發布並驗證、前端 `cd75f45` 已上線，Pages 與 CI 成功；使用者已貼入初始內容並實機驗證，沒有問題；使用者確認圖三表格沒有下一頁、文章摘要先不調整）**：使用者要在「學期任務」與「影像記錄」之間新增頁面，放「幼小銜接計畫」（園方對大班的安排＋家長參與）與「幼小銜接文章」，一年更新一次，要活潑、家長可以互動參與。**決定（使用者拍板）**：① 網頁勾選（只存在家長自己的裝置，不上傳）＋列印 PDF；② 列印版**不附回條**；③ 文章放自己寫的摘要＋短引言＋原文連結（著作權）；④ 試算表＋後台逐筆管理。**做法**：新工作表 `TransitionPlan`、`TransitionArticles`（見 `SPECIFICATION.md` 2c、3.12）；前台兩個分頁（計畫：能力類別卡片、在園／在家／一起標籤、篩選、勾選與進度、列印含勾選／空白版；文章：重點卡片、對話泡泡、金句、閱讀原文）；後台「🎒 幼小銜接」（計畫項目表單＋列表＋整學年複製、文章表單＋列表）。列印改為與菜單共用「只輸出列印區」規則，幼小銜接列印時暫時改直式。原文網址由使用者提供，已確認標題與出處一致。**測試**：後端 `transition.test.js`（47 項，6 種變異皆抓到）、瀏覽器 `transition_frontend.js`（74 項，6 種變異皆抓到）、`adminlist.test.js`（94 項）、XSS A～E 皆 0、英文稽核公開頁無漏翻介面文字、菜單列印測試（`small_improvements.js` 28 項）仍通過。**初始內容**：`tools/transition_plan_115.tsv`（36 項，貼進 `TransitionPlan` 的 A2）、`tools/transition_article_115.md`（後台逐欄貼上）。使用者實機測試沒有問題（2026-10-18）。
- **新增「學期任務」頁面（2026-10-14，後端 @136 已發布並驗證、前端 `4752057` 已上線，Pages 與 CI 成功；使用者已貼入初始內容 15 筆並實機驗證，沒有問題；其後僅前端小修（`7fa0c1d`）：「整批複製」來源只列有任務的學期、目標預設為還沒有任務的最新學期，已上線並由使用者驗證）**：使用者要在「主題活動」與「影像記錄」之間新增頁面，放「班級小任務」與「家長配合事項」兩類條列內容，每學期更新一次，要活潑溫暖不要只有文字。**決定（使用者拍板）**：① 只做網站圖示卡片＋每學期一張選填總覽圖（不只上傳圖，英文與「大字」才有效）；② 後台逐筆新增（與其他頁一致）；③ 保留歷史學期、前台可切換、預設最新。**做法**：新工作表 `SemesterTasks`（欄位見 `SPECIFICATION.md` 3.11）；前台兩個彩色類別區塊＋圖示卡片；後台頁籤「🎯 學期任務」＝內嵌表單（新增／編輯／複製）＋列表（搜尋、學期、類別、分頁）＋「整批複製上學期」＋「學期總覽圖」；總覽圖存 `ThemeSemesters.tasksOverviewImage`。英文：標題與說明納入 TextMap。**測試**：後端 `semestertasks.test.js`（62 項，7 種變異皆抓到）、瀏覽器 `tasks_frontend.js`（67 項，6 種變異皆抓到）、XSS A～E 皆 0、英文稽核公開頁 0 漏翻。**過程教訓**：一次加兩個欄位標題時，第二次用的是舊的欄數，會把第一個標題蓋掉（被既有的 `themeoverview.test.js` 抓到，已修）；瀏覽器測試的中文斷言必須從中文介面開始（瀏覽器記住上次語言，英文稽核跑完會留下英文）。**部署（已完成）**：`clasp push` → 使用者在 GAS 管理部署作業發布 136 → 後端驗證（部署仍 2 個；錯誤 token 四個新動作皆被拒；GET 為未知動作；`getAppData` 帶 `semesterTasks`、約 65KB）→ 前端推送。**待做**：初始內容見 `tools/semester_tasks_115_上.tsv`（貼進 `SemesterTasks` 工作表 A2）。**未驗證**：實機（手機、iPad）版面。**注意**：下一個後端版本編號是 **139**；`git push` 曾多次回 403（`gh` 全機啟用帳號常是 `chieh-ai`，沒有本 repo 權限）；**2026-10-17 起本專案的 `.git/config` 已設定專用登入**：`credential.https://github.com.helper` 先清空、再用 `gh auth token --user avaltech-ai` 取 token，所以本 repo 一律以 `avaltech-ai`（repo 擁有者）推送，**不需要再切換帳號**，也不影響其他專案（全機啟用帳號維持 `chieh-ai`）。若改 repo 或重新 clone，這個設定不會跟著走（`.git/config` 不在版本控制裡），需重設。
- **常用文件的管理功能全部移到後台（2026-10-13，僅前端，commit `6a124ef` 已上線，Pages 與 CI 成功；使用者實機驗證沒問題）**：使用者反映前台「常用文件」頁有新增／編輯／複製／刪除，其他頁面都在後台，操作邏輯不一致。**做法（使用者拍板方案 A）**：後台頁籤「文件檔案上傳」改名「📂 常用文件管理」，合併成一個內嵌表單（沿用新增／編輯／複製模式橫幅、差異確認、防呆）＋文件列表（搜尋、類別、分頁、純圖示編輯／複製／刪除，與焦點活動等頁面一致）；舊的獨立「上傳文件」表單移除（新增時直接在表單選取檔案上傳）；「開啟 Docs 雲端資料夾」鈕也移到後台。**前台**常用文件頁移除管理列與所有管理按鈕，管理員登入後看到的和訪客相同，只有下載。後端不動、不需發布。測試：`tests/docs_admin.js`（24 項，4 種變異測試皆抓到）、`adminlist.test.js` 新增 `adminDocsView`（共 89 項）、`form_mode_doc.js`／`action_icons.js`／`xss_harness.js` 已改成測後台列表（XSS A～E 皆 0）。使用者已實機驗證表單展開、列表操作與前台只剩下載，沒有問題。
- **英文對照已實測（2026-10-06）**：使用者實際操作後台「🌐 英文對照」，回報沒有問題；發現「不同地方重複使用的相同內容，會得到不同的翻譯」。**原因已釐清**：不是逐字相同（例：「社-2-3 …遵守生活規範**和**活動規則」與「…規範**與**活動規則」，同為「主題活動：課程目標」），TextMap 以中文完全相同才共用，所以成兩筆、各翻各的。
- **2026-10-06 使用者實機驗證通過（皆為僅前端）**：① 後台英文對照「相似文字提示」（commit 1f4596a；中文差 1～2 字的列分組、「套用到相似列」）；② 前台「歷史焦點」（commit 9e37dd1；只列最近一季已結束、非停用、不在輪播的焦點活動；一季＝`SPOTLIGHT_HISTORY_MONTHS`＝3 個月）；③ 後台活動／相簿／歌曲列表搜尋與分頁（commit 007d5db；活動、歌曲的「最新建立」＝試算表列順序倒過來，相簿＝建立或更新日期新到舊；每頁筆數記在 `localStorage`）。細節見 `SPECIFICATION.md` 5.12、2.x 與 6.（後台）。
- **失敗通知已設定（2026-10-06，使用者確認）**：GAS 觸發條件中，備份 `weeklyBackup`（每週日 03:00）的「錯誤通知設定」＝**立即通知我**；預熱 `warmAppDataCache`（每 5 分鐘，錯誤率約 0.43%）**刻意維持「每天通知我」**（每 5 分鐘一次，偶發失敗很正常，立即通知會變成雜訊）。
- **2026-10-07 使用者實機驗證通過（皆為僅前端）**：① 後台焦點活動「🔁 再次上架」（commit 98c355c；帶入內容與圖片、新編號、不重新上傳、開始日＝今天、結束日留空、未填結束日儲存前提醒、結束日早於開始日擋下）；② 後台焦點活動列表搜尋與分頁（commit 1d42dfd；關鍵字、狀態、輪播狀態、排序最新建立／輪播順序；▲▼ 已移除，只留「第 N 順位」下拉＝真實輪播順位；「最新建立」由編號 `SP-`＋時間戳記推算）；③ 英文對照頁分頁改用共用分頁元件（commit 555192d；預設每頁 10 筆，可選 20／50／全部，記在 `localStorage`）。細節見 `SPECIFICATION.md`。
- **裸 `/exec` 網址改為導向正式網站（2026-10-07，後端 @128 已發布並驗證；使用者選方案 ②）**：`doGet` 沒有 `action` 時只回導向頁（`buildFrontendRedirectPage_()`：說明＋「前往諾貝爾 A 班網站」按鈕＋嘗試自動跳轉；不開試算表、不檢查／建立工作表、不寫入），不再提供存在 GAS 內的舊版前端；`.claspignore` 不再放行 `index.html`（GAS 專案只剩 `Code.js`、`appsscript.json`，已用 `clasp pull` 驗證）。有 `action` 的唯讀 API 完全不變。**發布後驗證（curl）**：裸 `/exec` 與帶無關參數（`?x=1`）都回導向頁（約 11KB 的 Google 外框，內含導向文字）；`getAppData`（68,960 位元組）、`getTextMap`、`getCalendarIcs`、`getAlbums` 正常；`listSheetNames` 回「未知動作」；部署仍為 2 個；前端仍指向同一個 `/exec`。發布後約 1 分鐘內裸網址曾仍回舊頁（Google 傳播延遲），之後穩定。測試：`tests/bareget.test.js`（Node，21，已進 CI）。回復：管理部署作業把版本改回 127（程式同 125）。**導向頁外觀已由使用者目視確認沒問題。**
- **唱跳音符「不開放下載」與批次設定（2026-10-07，後端 @130＋前端；使用者實機驗證通過，我另以匿名連線獨立驗證）**：後台歌曲表單勾選「🔒 不開放下載」，或列表勾選後批次設為不開放／開放（全選目前篩選結果、每 5 首分批、進度、失敗原因）。鎖定時前台無下載圖示、**公開資料不含檔案名稱／網址／ID**，音樂檔設為私人並搬到雲端硬碟根目錄私人資料夾「唱跳音符_不開放下載」（「唱跳音符」資料夾本身公開，檔案會繼承公開權限，只改權限沒用）；取消則搬回並公開。**驗證結果**：34 首全部標為不開放後，公開資料 0 首帶下載網址；用鎖定前存下的下載網址匿名測試，原本能下載的檔案現在回傳 Google 登入頁（HTML，不再是音訊）；「唱跳音符」公開資料夾頁面只剩 3 個 ID（原 36）。**過程教訓**：@129 第一版只在儲存當下搬檔、且 Drive 失敗時只給一則容易漏看的警告，結果旗標有存、檔案仍公開（Drive 錯誤：存取遭拒）；@130 改為每步各自嘗試、讀回實際狀態驗證、失敗附診斷、每次儲存自我修復、並提供批次與試算表選單補救。**注意**：在試算表直接改 `noDownload` 為 TRUE 不會動 Drive（用批次或選單「🔒 同步『不開放下載』歌曲的音樂檔權限」補齊）；私人資料夾建在部署擁有者的雲端硬碟根目錄。細節見 `SPECIFICATION.md` 3.6。
- **相簿支援影片（2026-10-13，後端 @132～@134＋前端；已上線，使用者已驗證）**：使用者需要在相簿放活動影片（Drive 已有 iPhone `.MOV`）。決定：照片與影片**同一份清單混排、不另開影片區**；影片由老師直接放進 Drive 資料夾（網站上傳不變，仍只收照片）；排序＝**檔案建立時間由舊到新，相同再依檔名**（後端排好才回傳）。前端：影片縮圖 ▶、數量「（共 N 張・M 部影片）」、檢視器用 Drive 內建播放器（`/preview` iframe）加備用連結、自動播放跳過影片。測試：後端 36 項、前端 `album_video.js` 30 項。**實測回報（2026-10-13）**：後端 @132 已發布並驗證；使用者回報相簿沒解析出影片，確認是**快取**（直接放進 Drive 的檔案不會清快取，最長 1 小時才出現）；另發現依上傳時間排序在網站上傳的相簿裡是亂的（`1544、1582、1532…`）。**修訂（後端 @133＋前端 `64f029f`，已上線並驗證後端；錯誤 token 被拒、經 GET 為未知動作；直接放進 Drive 的 19 部影片已能解析）**：① 排序改混合規則——整本都是 `IMG_數字` 相機檔名就依編號（＝拍攝順序，照片與影片混排正確），否則依建立時間；② 管理員按「重新整理」先呼叫 `clearAlbumListCache` 清相簿清單快取（不直接縮短 TTL：會讓預熱觸發器負擔逼近每天 90 分鐘上限）。**使用者已驗證（清快取後）相簿順序依 `IMG_` 編號、影片被解析（19 部）、縮圖與 ▶ 正常。仍待回報**：真實手機上 iPhone `.MOV`（HEVC）按播放能否播放（我無法在開發環境確認）。**iPhone `.MOV` 已由使用者實測可播放（第一次畫質較差、第二次起正常，是 Drive 播放器行為）。封面影片數量（使用者選方案 A，後端 @134＋前端 `8267dbf`，已上線；後端驗證：錯誤 token 被拒、經 GET 為未知動作、每本相簿都帶 `videoCount`；使用者實測通過：封面顯示「📷 45 張・🎬 19 部」）**。**操作注意**：影片數要靠**網頁管理員按「🔄 重新整理」**才會重算；試算表選單的「🔄 清除快取並強制重新整理」只清快取、**不會重算**（使用者第一次就是用選單，所以封面沒變）。`Albums` 新增 `videoCount` 欄；封面「📷 45 張・🎬 19 部」；管理員按「重新整理」→ 清快取 → 重讀 → 背景逐本呼叫 `recountAlbum` 重算照片數與影片數（會順便校正直接放進 Drive 的照片張數）。測試 `albumcount.test.js`（25，進 CI）、`album_video.js`（46）。詳見 `SPECIFICATION.md` 3.5。詳見 `SPECIFICATION.md` 3.5。
- **月曆 🥐 幸福廚房日、🎂 當月慶生日圖示修正（2026-10-13，僅前端；使用者已實機確認沒問題）**：使用者回報 11 月月曆沒有這兩個圖示。**根因**：圖示只在「當天有每日菜單」時才會畫（`dayMenu &&`），而菜單只填到 10 月（線上 20 筆），活動表其實已有 11、12 月的幸福廚房與壽星慶生。**修法**：🥐、🎂 改只看當天活動與菜單備註，不依賴菜單；🍱 維持有菜單且非週末才有；週末活動也顯示 🥐🎂。測試 `tests/calendar_icons.js`（24）。注意：這是資料先於菜單填寫的常態，之後新增類似的「標記」也不要綁在菜單上。
- **後台活動表單「新增／編輯／複製」模式（2026-10-13，僅前端；已推廣到焦點活動、主題、文件、菜單、歌曲表單，使用者實測沒問題）**：使用者反映編輯舊活動時容易不小心覆蓋原內容。表單有綠／橘／藍模式橫幅；編輯模式有「更新原活動」與「另存為新活動」；列表新增「複製」（清空日期）；更新前列出將修改的欄位並確認、沒有變更就不送出；未儲存內容的切換防呆。**活動表單已由使用者實機驗證沒問題，並要求推廣到其他後台表單**。**已推廣（待使用者實機驗證）**：焦點活動（含既有「再次上架」）、主題活動、常用文件、每日菜單（以日期為識別，另有「複製到其他日期」與覆蓋確認）、歌曲（只有橫幅＋差異確認＋防呆，**刻意不提供另存／複製**：音樂檔不能被兩首歌共用）。**未套用**：相簿（編輯與新增是兩個流程）、英文對照頁。詳見 `SPECIFICATION.md` 2.4 活動管理。
- **重新整理頁面時停在原本的頁面（2026-10-13，僅前端，commit `bfb8428`；使用者實測沒問題）**：使用者反映重新整理會跳回首頁。**做法**：`switchTab` 每次切換都把目前頁籤記在 `sessionStorage`（`nobel_a_current_tab`），`switchAdminSubtab` 記後台子面板（`nobel_a_admin_subtab`）；`initApp()` 在載入資料前呼叫 `restoreSavedTab()` 還原。**只認白名單**（`VALID_TABS`、`VALID_ADMIN_SUBTABS`），其餘值（含惡意字串）一律忽略並從首頁開始；`sessionStorage` 被瀏覽器拒絕時不出錯。**行為**：重新整理與 App 模式的 ↻（`appRefresh()`＝`location.reload()`）都會停在原頁；**關掉分頁／App 後重開會從首頁開始**（刻意用 `sessionStorage` 而非 `localStorage`，避免每次打開都停在上次離開的後台頁）；未登入時停在後台會看到登入畫面。相簿裡打開的某本相簿、檢視器、焦點活動詳情等**不還原**（只還原頁籤與後台子面板）。測試 `tests/restore_tab.js`（20 項），六種變異測試全數抓到（其中一次發現測試本身被迴圈最後一個值蓋掉而漏抓，已修）。iPhone App 模式的 ↻ 未被單獨回報，視為通過。
- **修正：第一次點進後台，活動列表是空的（2026-10-13，僅前端；使用者實測沒問題）**：**根因**：重新整理頁面時，若有登入憑證，`initApp()` 會立刻呼叫 `showAdminDashboard()` → 用「還沒載入的空資料」畫一次活動列表（顯示「目前沒有活動紀錄」）；雲端資料之後才到，但 `handleDataLoaded()` 只在「目前頁籤是後台」時才重畫，使用者當時在首頁就被略過；之後點進後台頁籤，`switchTab('admin')` 也不重畫，所以停在舊的空清單，要換子面板再換回來才會重畫。**修法**：① 資料載入後，已登入就一律重畫活動列表；② 進入後台頁籤時（已登入）依目前子面板（`switchAdminSubtab`）重畫。沒登入不呼叫。測試 `tests/admin_first_open.js`（9 項）。教訓：**用「目前頁籤」當條件決定是否重畫，會漏掉「資料先到、使用者後到」的情況**——任何列表在使用者進入頁籤時都該重畫一次。
- **列上操作按鈕統一為純圖示（2026-10-13，僅前端；使用者實測沒問題）**：使用者反映各頁按鈕混用文字、表情符號、圖示，很混亂。六個列表（行事曆活動、相簿、歌曲、焦點活動、主題活動、常用文件）的編輯／複製／預覽／再次上架／刪除改成同一款純圖示方鈕（眼睛、鉛筆、兩張重疊、循環箭頭、垃圾桶；平常中性灰、滑過才變色；文字放在滑鼠提示與 aria-label）。表單上的主要按鈕維持文字（使用者同意）。詳見 `SPECIFICATION.md` 2.4。以後新增列表一律用 `actBtnHtml`／`actBtnEl`。
- **主題活動「學期主題架構圖」（2026-10-13，後端 @135＋前端 `3297707`，已上線；使用者已在 `ThemeSemesters.overviewImage` 貼好連結，後端已讀到 `themeOverviews`，線上頁面卡片已出現在列表最後；待使用者實機確認版面與手機放大清晰度）**：使用者的 `Theme` 資料夾內有《書的奇幻旅程》整學期架構圖（`書的奇幻旅程.png`，2048×1296，約 5MB；檔案 ID `1QMSKstvzHuprCzZTj0MSwDGIuuY-ELHi`，已確認可公開讀取）。顯示位置依使用者更正：**該學期最早一週（第一週，列表最下面）貼文之後**，不是最上面。做法：`ThemeSemesters` 新增 `overviewImage` 欄，老師貼 Drive 連結或檔案 ID；前台獨立卡片（只有標題與預覽圖，使用者要求拿掉「開啟原圖」連結與說明文字）＋點圖放大。詳見 `SPECIFICATION.md` 3.7。
- **歷史焦點「上一則／下一則」與照片檢視器手機滑動（2026-10-11，僅前端；**使用者已實機驗證手機滑動手感，沒問題**）**：歷史焦點詳情圖片區左右有 ◀▶（◀＝較新、▶＝較舊，順序同列表），「返回列表」旁顯示「n / 總數」，範圍是目前搜尋結果，到頭停用不繞回，另支援鍵盤 ← → 與手機左右滑動。**照片檢視器**原本有按鈕與鍵盤 ← →，本次補上手機左右滑動（沿用原本頭尾繞回）。兩者共用 `bindSwipeNav()`。**左右切換按鈕樣式統一**：首頁焦點輪播、焦點放大彈窗、歷史焦點詳情的 ◀ ▶ 三角形，改為與照片檢視器相同的深色半透明圓形＋❮ ❯（日曆上個月／下個月鈕字形也由 ‹ › 改為 ❮ ❯；後台分頁、歌曲播放器維持原樣）。**首頁焦點輪播與焦點放大彈窗也補上鍵盤 ← → 與手機滑動**（2026-10-11，**使用者已實機驗證，沒問題**；只在首頁、沒有彈窗、卡片在畫面內時回應；測試 `tests/spotlight_home_nav.js` 42 項）。測試 `tests/spothistory_nav.js`（38）、`tests/photoviewer_swipe.js`（22），各做過變異測試。手機滑動手感已由使用者實測通過。細節見 `SPECIFICATION.md` 5.12。
- **焦點活動「播放順位只屬於播映中」與預設篩選（2026-10-11，後端 @131＋前端；使用者實機驗證通過，我另以公開資料獨立驗證）**：順位只給播映中的活動（啟用且在期間內），由前端依儲存的順位即時算出連續的 1～N，下拉選項只有 1～N；排程中／已下架／停用沒有順位下拉（顯示「未排順位」「已取消順位」）。到期或停用後面自動補位；排程中開播排最後。寫回試算表時播映中存 1～N、其餘清空（後端 `updateSpotlightsOrder`、`saveSpotlight` 空白＝清空，不再變成 1）；改順位、新增、編輯、刪除、再次上架後，以及管理員登入後每次載入資料後第一次畫列表前自動整理（有變動才寫）。後台焦點列表預設篩選「播映中」、排序「輪播順序」，清除篩選回到預設。**驗證結果**：管理員打開後台後，試算表自動整理成播映中 4 筆為 1～4、已下架 4 筆順位清空（原本是有空號的 1～8）。注意：日期自然到期而沒人開後台時，試算表舊數字要等管理員下次開後台才清，但畫面與前台輪播已以目前播映中為準。細節見 `SPECIFICATION.md`。

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
- **後台列表搜尋與分頁**（活動、相簿、歌曲、焦點活動、英文對照；2026-10-06～10-11）：關鍵字＋類別／對象／狀態／輪播狀態等篩選，預設每頁 10 筆可選 20／50／全部（圖示按鈕、記住選擇），共用元件在 `build_index.js` 的 `adminList*`；焦點活動預設「播映中」＋「輪播順序」。
- **焦點活動**：前台「歷史焦點」（最近一季、不含停用、不重複輪播中的）；後台「🔁 再次上架」（沿用內容與圖片，不重新上傳）；**播放順位只屬於播映中**（即時算出連續 1～N，到期補位、排程中開播排最後、其餘清空）。
- **唱跳音符不開放下載與批次設定**：旗標 `Songs!noDownload`；公開資料剝除檔名／網址／ID；Drive 檔案搬到私人資料夾並讀回驗證；後台批次（全選目前篩選結果、每 5 首分批）；試算表選單「🔒 同步『不開放下載』歌曲的音樂檔權限」。**在試算表直接改 `noDownload` 不會動 Drive**。
- **裸 `/exec` 導向頁**：`doGet` 沒有 `action` 時回導向正式網站的小頁面。

### 四、測試與驗證工具（`tests/`）
**每次改動前後都要跑**：`bash tests/ci.sh`（語法、`index.html` 與建置一致、內嵌 script 語法、16 套 Node 測試；GitHub Actions 在每次推送與 PR 自動執行同一支腳本）。
| 檔案 | 類型 | 內容 | 項數 |
| :-- | :-- | :-- | :-: |
| `auth` / `idempotency` / `covers` / `namemap` | Node | 登入 token、冪等、封面候選、名稱對照 | 44 / 21 / 48 / 43 |
| `warmcache` / `albumphotos` | Node | 快取預熱、相簿照片快取與限制資料夾 | 10 / 21 |
| `pwa` / `ics` | Node | 主畫面設定與圖示不透明、行事曆訂閱 | 30 / 36 |
| `textmap` / `mapadmin` / `mapsimilar` / `spothistory` / `adminlist` / `bareget` / `songnodl` | Node | 自由文字英文對照後端、後台英文對照後端動作、相似文字分組、歷史焦點篩選、後台列表搜尋分頁（含焦點活動） | 65 / 60 / 30 / 21 / 82 / 21 / 84 / 33（`spotlightorder`） |
| `xss_harness.js` | 瀏覽器 | 全欄位下毒 XSS 偵測（A～E 必須 0；L 不得雙重跳脫） | — |
| `songs_selection` / `songs_player` | 瀏覽器 | 歌曲選取連動、連續播放與全螢幕 | 14 / 16 |
| `covers_frontend` / `namemap_frontend` | 瀏覽器 | 封面輪替、名稱對照前台 | 15 / 25 |
| `new_badge` / `event_minor` / `small_improvements` | 瀏覽器 | NEW 標籤、活動細項、縮圖／大字／列印 | 17 / 11 / 28 |
| `standalone` / `sidebar`（視窗需 ≥ 768） | 瀏覽器 | App 模式、側邊欄對齊與觸控展開 | 13 / 18 |
| `wait_hint` / `retry_frontend` / `albumphotos_frontend` / `subscribe` | 瀏覽器 | 等待提示、讀取重試、相簿瘦身回應、訂閱視窗 | 15 / 3 情境 / — / 15 |
| `textmap_frontend` / `mapadmin_frontend` / `mapsimilar_frontend` / `spothistory_frontend` / `adminlist_frontend` / `spotlight_adminlist` / `spotlight_relist` / `song_nodownload` | 瀏覽器 | 英文顯示 `tx()`、後台英文對照介面、相似文字介面、歷史焦點介面、後台列表搜尋分頁介面、焦點列表搜尋分頁、再次上架 | 40 / 76 / 34 / 49 / 69 / 38 / 36 / 31 + 36（`song_batch`） |
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
- **直接開 GAS `/exec` 網址（不帶 action）只會看到導向頁**（2026-10-07 起，後端 @128），不再有 GAS 內的舊版前端；正式前端是 `https://avaltech-ai.github.io/3of3/`。GAS 的 HtmlService 頁面在沙箱 iframe 內，自動跳轉可能被瀏覽器擋下，所以頁面同時有可點的 `target="_top"` 按鈕。
- **不開放下載的檔案位置**：鎖定的音樂檔放在**部署擁有者**雲端硬碟根目錄的「唱跳音符_不開放下載」資料夾（「唱跳音符」資料夾本身是公開的，檔案在裡面會繼承公開權限，所以必須搬走），老師開公開資料夾會看不到這些檔案（刻意）；若日後更換部署擁有者，需一併處理。@129 第一版曾因 Drive 回報「存取遭拒：DriveApp」而沒鎖住（只藏了前台圖示），@130 改為逐步嘗試＋讀回驗證後成功；**當時 Drive 拒絕的確切原因未查明**（可能是設為私人那一步被拒、但搬資料夾本身可行）。若再出現失敗，批次結果與儲存警告會附擁有者、執行者、所在資料夾與目前狀態，據此判斷。
- **焦點活動順位的舊值清理**：日期自然到期而沒人開後台時，試算表 `Spotlight!priority` 的舊數字不會自動清除，要等管理員下次開後台（登入後第一次畫焦點列表）才自動整理；畫面與前台輪播一律以「目前播映中」即時算出，所以不影響顯示。
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
