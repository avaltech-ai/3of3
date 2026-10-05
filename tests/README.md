# 測試說明

## 1. 後端認證與備份測試（Node，約 1 秒）
```bash
node tests/auth.test.js
```
以模擬的 Cache／Properties／Drive 驗證登入 token、鎖定、變更密碼、備份間隔保護。修改 `Code.js` 的認證或備份邏輯後必跑，全部 ✓ 才可部署。

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

## 新增畫面時的跳脫規則（build_index.js）
- 放進 HTML 文字或屬性值：`esc(值)`
- 放進 `onclick="fn('…')"` 的 JS 字串：`jsq(值)`
- 放進 `href`／`src`：`escUrl(值)`（只允許 http(s)、相對路徑、blob:、data:image/）
- 用 `textContent`／`.value` 賦值是安全的，不需跳脫
