// 快取預熱測試：預熱必須「略過」現有快取重建，且不影響一般請求；觸發器建立需冪等。
// 執行：node tests/warmcache.test.js
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','Code.js'),'utf8');
let pass=0, fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)} else {fail++;console.log('  ✗ FAIL:',m)} };

function env(){
  const store={}; let ssCalls=0; const triggers=[]; let created=0;
  const cache={get:k=>k in store?store[k]:null,put:(k,v)=>{store[k]=v},remove:k=>{delete store[k]}};
  const ctx={console:{log(){},warn(){},error(){}},CacheService:{getScriptCache:()=>cache},
    PropertiesService:{}, Utilities:{}, LockService:{}, SpreadsheetApp:{}, DriveApp:{}, ContentService:{}, HtmlService:{}, UrlFetchApp:{}, Session:{},
    ScriptApp:{getProjectTriggers:()=>triggers,
      newTrigger:fn=>({timeBased:()=>({everyMinutes:()=>({create:()=>{created++;triggers.push({getHandlerFunction:()=>fn})}})})})}};
  vm.createContext(ctx); vm.runInContext(src,ctx);
  ctx.getSpreadsheet=()=>{ssCalls++;return null}; // 取不到試算表 → getAppData 回 success:false，但可由呼叫次數看出「有沒有重建」
  return {ctx,store,ssCalls:()=>ssCalls,created:()=>created};
}

console.log('A. 一般請求命中快取、預熱略過快取');
let e=env(); e.store['app_data_v4']='{"success":true,"data":"OLD"}';
let r=e.ctx.getAppData();
ok(r.data==='OLD' && e.ssCalls()===0,'一般 getAppData：命中快取，沒有讀試算表');
e.ctx.warmAppDataCache();
ok(e.ssCalls()>=1,'warmAppDataCache：略過現有快取、實際走重建流程（有讀試算表）');
r=e.ctx.getAppData(); const calls=e.ssCalls();
r=e.ctx.getAppData();
ok(r.data==='OLD' && e.ssCalls()===calls,'預熱結束後旗標還原：一般請求又回到命中快取');

console.log('B. 預熱出錯不外洩、旗標仍還原');
e=env(); e.store['app_data_v4']='{"success":true,"data":"OLD"}';
e.ctx.getSpreadsheet=()=>{throw new Error('boom')};
let threw=false; try{ e.ctx.warmAppDataCache(); }catch(x){ threw=true; }
ok(!threw,'預熱遇到例外不會拋出');
ok(e.ctx.getAppData().data==='OLD','例外之後旗標已還原，一般請求仍命中快取');

console.log('C. 觸發器冪等');
e=env(); e.ctx.setupWarmCacheTrigger(); e.ctx.setupWarmCacheTrigger(); e.ctx.setupWarmCacheTrigger();
ok(e.created()===1,'連按三次只建立 1 個觸發器（實際：'+e.created()+'）');

console.log('D. 快取時間');
ok(/APP_DATA_CACHE_TTL_SEC\s*=\s*600/.test(src) && /put\('app_data_v4',\s*JSON\.stringify\(result\),\s*APP_DATA_CACHE_TTL_SEC\)/.test(src),'快取存活 10 分鐘（大於預熱間隔 5 分鐘）');

console.log('\n結果：'+pass+' 通過，'+fail+' 失敗'); process.exit(fail?1:0);
