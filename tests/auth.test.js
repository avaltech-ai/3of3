// 後端認證測試（token、鎖定、變更密碼、備份間隔保護）。以模擬的 Cache/Properties/Drive 執行，不碰真實資料。
// 執行：node tests/auth.test.js    （修改 Code.js 的認證或備份邏輯後必跑，全部 ✓ 才可部署）
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','Code.js'),'utf8');
let pass=0, fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)} else {fail++;console.log('  ✗ FAIL:',m)} };

function env(realPassword='CorrectHorse-99') {
  let now=1_000_000_000_000; const cacheStore={}, props={};
  const cache={ get:k=>{const e=cacheStore[k]; if(!e) return null; if(e.exp<=now){delete cacheStore[k];return null} return e.v},
                put:(k,v,ttl)=>{cacheStore[k]={v:String(v),exp:now+ttl*1000}}, remove:k=>{delete cacheStore[k]} };
  let uuid=0; const settingsRows=[['key','value'],['ADMIN_PASSWORD',realPassword],['CLASS_NAME','x']];
  const sheet={ getDataRange:()=>({getValues:()=>settingsRows.map(r=>r.slice())}),
                getRange:(r,c)=>({setValue:v=>{settingsRows[r-1][c-1]=v}}) };
  const ctx={console:{log(){},warn(){},error(){}},
    CacheService:{getScriptCache:()=>cache},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v}})},
    Utilities:{getUuid:()=>'aaaaaaaa-bbbb-cccc-dddd-'+String(++uuid).padStart(12,'0')},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
    SpreadsheetApp:{getUi:()=>{throw new Error('no UI')}}, DriveApp:{}, ContentService:{createTextOutput:t=>({text:t,setMimeType(){return this}}),MimeType:{JSON:'J'}},
    HtmlService:{createHtmlOutput:()=>({setXFrameOptionsMode(){return this}}),XFrameOptionsMode:{ALLOWALL:1}}, UrlFetchApp:{}, Session:{}, ScriptApp:{}};
  ctx.Date = class extends Date { static now(){ return now; } };
  vm.createContext(ctx); vm.runInContext(src,ctx);
  ctx.getSpreadsheet=()=>({getSheetByName:()=>sheet});
  ctx.clearAppDataCache=()=>{};
  return {ctx, adv:ms=>{now+=ms}, settingsRows, cacheStore, props};
}

console.log('A. 登入與 token');
let e=env(); let r=e.ctx.verifyPassword('CorrectHorse-99');
ok(r.success===true && typeof r.token==='string' && r.token.length>=32,'正確密碼 → 取得 token');
ok(e.ctx.checkPassword(r.token)===true,'token 通過寫入端點驗證');
ok(e.ctx.checkPassword('CorrectHorse-99')===false,'直接把密碼當憑證 → 拒絕（不能拿寫入端點/checkPassword 猜密碼）');
ok(e.ctx.checkPassword('')===false && e.ctx.checkPassword(null)===false && e.ctx.checkPassword('x'.repeat(64))===false,'空值／亂猜的 token → 拒絕');
let w=e.ctx.saveEvent({}, 'bad-token');
ok(w.success===false && w.authExpired===true,'寫入端點驗證失敗 → 回傳 authExpired（前端據此回登入畫面）');
w=e.ctx.deleteDoc('DOC-1','CorrectHorse-99');
ok(w.authExpired===true,'寫入端點帶「密碼」也拒絕');

console.log('B. 錯誤次數鎖定');
e=env();
for(let i=1;i<=4;i++){ r=e.ctx.verifyPassword('wrong'+i); ok(r.success===false && !r.locked, `第 ${i} 次錯誤：未鎖定，提示剩餘次數（${r.error}）`); }
r=e.ctx.verifyPassword('wrong5'); ok(r.locked===true,'第 5 次錯誤 → 鎖定');
r=e.ctx.verifyPassword('CorrectHorse-99'); ok(r.success===false && r.locked===true,'鎖定期間即使密碼正確也拒絕');
e.adv(14*60*1000); r=e.ctx.verifyPassword('CorrectHorse-99'); ok(r.success===false && r.locked===true,'14 分鐘後仍鎖定（鎖定期間的嘗試不延長鎖定）');
e.adv(2*60*1000); r=e.ctx.verifyPassword('CorrectHorse-99'); ok(r.success===true,'滿 15 分鐘後可再登入');
r=e.ctx.verifyPassword('wrong'); r=e.ctx.verifyPassword('wrong'); e.ctx.verifyPassword('CorrectHorse-99');
for(let i=0;i<4;i++) e.ctx.verifyPassword('x'); ok(e.ctx.verifyPassword('x').locked===true,'登入成功後失敗計數歸零（再錯 5 次才鎖）');

console.log('C. token 期限');
e=env(); let tok=e.ctx.verifyPassword('CorrectHorse-99').token;
e.adv(100*60*1000); ok(e.ctx.checkPassword(tok)===true,'閒置 100 分鐘仍有效，且使用後延長');
e.adv(100*60*1000); ok(e.ctx.checkPassword(tok)===true,'再過 100 分鐘（因上次使用已延長）仍有效');
e.adv(130*60*1000); ok(e.ctx.checkPassword(tok)===false,'閒置超過 2 小時 → 失效');
e=env(); tok=e.ctx.verifyPassword('CorrectHorse-99').token;
let diedAtHour=null; for(let h=1;h<=20;h++){ e.adv(60*60*1000); if(!e.ctx.checkPassword(tok)){ diedAtHour=h; break; } }
ok(diedAtHour!==null && diedAtHour>=8 && diedAtHour<=9,'持續活躍也會在 8 小時絕對上限後失效（實際：第 '+diedAtHour+' 小時）');
e=env(); tok=e.ctx.verifyPassword('CorrectHorse-99').token;
let still=true; for(let h=1;h<=7;h++){ e.adv(60*60*1000); still = still && e.ctx.checkPassword(tok); }
ok(still===true,'持續活躍 7 小時內不會被踢出');

console.log('D. 登出');
e=env(); tok=e.ctx.verifyPassword('CorrectHorse-99').token;
e.ctx.adminLogout(tok); ok(e.ctx.checkPassword(tok)===false,'登出後 token 立即失效');
ok(e.ctx.adminCheckSession(tok).authExpired===true,'adminCheckSession：失效 → authExpired');
tok=e.ctx.verifyPassword('CorrectHorse-99').token; ok(e.ctx.adminCheckSession(tok).success===true,'adminCheckSession：有效 → success');

console.log('E. 變更密碼');
e=env(); tok=e.ctx.verifyPassword('CorrectHorse-99').token; let tok2=e.ctx.verifyPassword('CorrectHorse-99').token;
r=e.ctx.updateSettings({ADMIN_PASSWORD:'short'}, tok); ok(r.success===false && /10/.test(r.error),'新密碼少於 10 字元 → 拒絕');
ok(e.settingsRows[1][1]==='CorrectHorse-99','被拒絕時密碼沒被改動');
r=e.ctx.updateSettings({ADMIN_PASSWORD:'   '}, tok); ok(r.success===true && e.settingsRows[1][1]==='CorrectHorse-99' && !r.passwordChanged,'空白密碼不會覆蓋現有密碼');
r=e.ctx.updateSettings({ADMIN_PASSWORD:'Brand-New-Pass-2026'}, 'bad'); ok(r.authExpired===true && e.settingsRows[1][1]==='CorrectHorse-99','無效 token 無法改密碼');
r=e.ctx.updateSettings({ADMIN_PASSWORD:'Brand-New-Pass-2026'}, tok);
ok(r.success===true && r.passwordChanged===true && e.settingsRows[1][1]==='Brand-New-Pass-2026','正確改密碼成功');
ok(e.ctx.checkPassword(tok)===false && e.ctx.checkPassword(tok2)===false,'改密碼後所有舊 token（含其他裝置）立即失效');
ok(e.ctx.verifyPassword('CorrectHorse-99').success===false,'舊密碼不能再登入');
ok(e.ctx.verifyPassword('Brand-New-Pass-2026').success===true,'新密碼可登入');

console.log('F. 其他');
e=env(''); ok(e.ctx.verifyPassword('').success===false && e.ctx.verifyPassword('anything').success===false,'試算表沒設密碼 → 任何人都不能登入');
e=env(); e.ctx.getSpreadsheet=()=>{throw new Error('boom')}; ok(e.ctx.verifyPassword('CorrectHorse-99').success===false,'讀取設定失敗 → 拒絕（不放行）');
e=env(); r=e.ctx.verifyPassword('CorrectHorse-99'); let threw=false; try{e.ctx.menuResetLoginLock()}catch(x){threw=true} ok(threw,'menuResetLoginLock 在沒有試算表 UI 的網頁環境下無法執行');
for(let i=0;i<5;i++) e.ctx.verifyPassword('x'); ok(e.ctx.verifyPassword('CorrectHorse-99').locked===true,'（前置）已鎖定'); try{e.ctx.menuResetLoginLock()}catch(x){} ok(e.ctx.verifyPassword('CorrectHorse-99').locked===true,'網頁端無法呼叫解除鎖定（鎖定仍在）');

console.log('G. doPost 整合');
e=env(); const post=(a,x={})=>JSON.parse(e.ctx.doPost({postData:{contents:JSON.stringify(Object.assign({action:a},x))}}).text);
let lg=post('verifyPassword',{password:'CorrectHorse-99'}); ok(lg.success&&lg.token,'doPost verifyPassword 回傳 token');
ok(post('checkSession',{password:lg.token}).success===true,'doPost checkSession 有效');
e.ctx.saveEvent=(d,p)=>e.ctx.checkPassword(p)?{success:true}:e.ctx.authFail_();
ok(post('saveEvent',{data:{},password:lg.token}).success===true,'doPost 以 token 寫入成功');
ok(post('saveEvent',{data:{},password:'CorrectHorse-99'}).authExpired===true,'doPost 以密碼寫入被拒');
post('logout',{password:lg.token}); ok(post('saveEvent',{data:{},password:lg.token}).authExpired===true,'doPost logout 後 token 不可再寫入');
ok(post('batchUpdateSongDurations',{durationsMap:{},password:'CorrectHorse-99'}).authExpired===true,'批次更新時長：帶密碼被拒');

console.log('H. setupWeeklyBackupTrigger 不得被用來連續備份');
e=env(); let backups=0, triggers=0;
e.ctx.backupSpreadsheet_=()=>{backups++; e.props.LAST_BACKUP_AT=String(e.ctx.Date.now()); return {name:'n'}};
e.ctx.ScriptApp={getProjectTriggers:()=>[],deleteTrigger(){},WeekDay:{SUNDAY:1},newTrigger:()=>({timeBased:()=>({onWeekDay:()=>({atHour:()=>({create:()=>{triggers++}})})})})};
vm.runInContext('globalThis.__d=Date', e.ctx);
// LAST_BACKUP_AT 使用真實 Date.now()，測試直接設定屬性
e.props.LAST_BACKUP_AT=String(e.ctx.Date.now()-1000);
e.ctx.setupWeeklyBackupTrigger(); ok(backups===0 && triggers===1,'近期已備份：setup 不再重複備份，但仍建立觸發器');
e.props.LAST_BACKUP_AT=String(e.ctx.Date.now()-10*86400000);
e.ctx.setupWeeklyBackupTrigger(); ok(backups===1,'超過間隔：setup 會備份一次');

console.log('\n結果：'+pass+' 通過，'+fail+' 失敗'); process.exit(fail?1:0);
