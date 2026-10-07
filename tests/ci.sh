#!/bin/bash
# 本機與 GitHub Actions 共用的檢查：語法、建置一致、Node 測試。任何一步失敗就以非 0 結束。
# 本機執行：bash tests/ci.sh   （Mac 的 /bin/bash 是 3.2，本檔不使用新版語法）
# 不包含瀏覽器端測試（tests/*.js 需貼到 Console 執行，見 tests/README.md）。
set -u
cd "$(dirname "$0")/.."
fail=0
step() { printf '\n=== %s ===\n' "$1"; }

step "1. Code.js 語法"
node --check Code.js || fail=1

step "2. 重新建置 index.html，並確認與已提交的版本一致（禁止手改 index.html）"
cp index.html /tmp/index.committed.html
node build_index.js || fail=1
if cmp -s index.html /tmp/index.committed.html; then
  echo "index.html 與建置結果一致"
else
  echo "FAIL: index.html 與 build_index.js 的建置結果不同——請執行 node build_index.js 並提交 index.html"
  fail=1
fi

step "3. index.html 內嵌 script 語法"
node -e "
const h=require('fs').readFileSync('index.html','utf8');
let n=0,bad=0;
[...h.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].forEach((m,i)=>{n++;try{new Function(m[1])}catch(e){bad++;console.log('script',i,'語法錯誤:',e.message)}});
console.log('檢查 '+n+' 段內嵌 script，錯誤 '+bad);
process.exit(bad||n===0?1:0)" || fail=1

for t in auth idempotency covers namemap warmcache albumphotos pwa ics textmap mapadmin mapsimilar spothistory adminlist bareget; do
  step "Node 測試：$t"
  node "tests/$t.test.js" || fail=1
done

echo
if [ "$fail" = "0" ]; then echo "全部通過"; else echo "有項目失敗"; fi
exit $fail
