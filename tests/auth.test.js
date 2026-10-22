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
                getRange:(r,c)=>({setValue:v=>{settingsRows[r-1][c-1]=v},setNumberFormat(){return this}}) };
  const ctx={console:{log(){},warn(){},error(){}},
    CacheService:{getScriptCache:()=>cache},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v},deleteProperty:k=>{delete props[k]}})},
    Utilities:{getUuid:()=>'aaaaaaaa-bbbb-cccc-dddd-'+String(++uuid).padStart(12,'0'),computeDigest:(alg,v)=>Array.from(require('crypto').createHash('sha256').update(String(v)).digest()),DigestAlgorithm:{SHA_256:'SHA_256'},base64Encode:b=>Buffer.from(b).toString('base64')},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
    SpreadsheetApp:{getUi:()=>{throw new Error('no UI')}}, DriveApp:{}, ContentService:{createTextOutput:t=>({text:t,setMimeType(){return this}}),MimeType:{JSON:'J'}},
    HtmlService:{createHtmlOutput:()=>({setXFrameOptionsMode(){return this}}),XFrameOptionsMode:{ALLOWALL:1}}, UrlFetchApp:{}, Session:{getActiveUser:()=>({getEmail:()=>'owner@example.test'}),getEffectiveUser:()=>({getEmail:()=>'owner@example.test'})}, ScriptApp:{}};
  ctx.Date = class extends Date { static now(){ return now; } };
  vm.createContext(ctx); vm.runInContext(src,ctx);
  ctx.getSpreadsheet_=()=>({getSheetByName:()=>sheet});
  ctx.clearAppDataCache_=()=>{};
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
e=env(); e.ctx.getSpreadsheet_=()=>{throw new Error('boom')}; ok(e.ctx.verifyPassword('CorrectHorse-99').success===false,'讀取設定失敗 → 拒絕（不放行）');
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

console.log('I. 受信任裝置：攻擊者不能再用「故意輸錯」把老師鎖在外面（紅隊檢查 M-2）');
{
  const PW='CorrectHorse-99'; const DAY=86400000;
  let e=env(); const first=e.ctx.verifyPassword(PW);
  ok(first.success && typeof first.deviceKey==='string' && first.deviceKey.length>=32 && first.deviceKey!==first.token,'登入成功：回傳裝置金鑰（和 token 不同，至少 32 字元）');
  ok(e.props.TRUSTED_DEVICES && e.props.TRUSTED_DEVICES.indexOf(first.deviceKey)===-1,'裝置金鑰在伺服器端只存雜湊（Script Properties 裡找不到原文）');
  const dk=first.deviceKey;
  for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);   // 攻擊者從別處連錯 5 次（沒有裝置金鑰）
  r=e.ctx.verifyPassword(PW); ok(r.success===false && r.locked===true && !r.token,'沒有裝置金鑰的人：鎖定中，連正確密碼也拒絕（暴力猜測仍然無效）');
  r=e.ctx.verifyPassword(PW,'x'.repeat(64)); ok(r.success===false && r.locked===true,'帶一個猜的／亂寫的裝置金鑰：仍然鎖定');
  r=e.ctx.verifyPassword(PW,dk); ok(r.success===true && typeof r.token==='string' && e.ctx.checkPassword(r.token)===true,'老師的常用裝置（有裝置金鑰）＋正確密碼：鎖定期間照常登入，token 有效');
  ok(r.deviceKey===dk,'受信任裝置登入後：沿用同一把裝置金鑰（不重發）');
  r=e.ctx.verifyPassword(PW); ok(r.success===false && r.locked===true,'老師登入成功不會替攻擊者解鎖：沒有裝置金鑰的人仍然鎖定');
  e.adv(14*60000); r=e.ctx.verifyPassword(PW); ok(r.locked===true,'14 分鐘後沒有裝置金鑰的人仍鎖定（老師登入沒有延長或縮短鎖定）');
  e.adv(2*60000); r=e.ctx.verifyPassword(PW); ok(r.success===true,'滿 15 分鐘：沒有裝置金鑰的人也能登入（照原本規則）');

  e=env(); const k2=e.ctx.verifyPassword(PW).deviceKey;
  for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);
  r=e.ctx.verifyPassword('wrong-again',k2); ok(r.success===false && r.locked!==true && /不正確/.test(r.error) && !/再錯|鎖定/.test(r.error),'受信任裝置輸錯密碼：回「密碼不正確」，不是鎖定、也不提示剩餘次數（但仍會累計次數）');
  for(let i=0;i<20;i++) e.ctx.verifyPassword('w'+i,k2);
  r=e.ctx.verifyPassword(PW,k2); ok(r.success===false && r.locked===true,'受信任裝置也有上限：累計錯誤超過 20 次後連它也鎖定（裝置金鑰外洩也不能無限猜密碼）');

  e=env(); const k3=e.ctx.verifyPassword(PW).deviceKey; e.adv(89*DAY);
  for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);
  r=e.ctx.verifyPassword(PW,k3); ok(r.success===true,'第 89 天：裝置金鑰仍有效');
  e.adv(60*DAY); for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);
  r=e.ctx.verifyPassword(PW,k3); ok(r.success===true,'每次登入都會延長 90 天（滑動期限）：再過 60 天仍有效');
  e.adv(91*DAY); for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);
  r=e.ctx.verifyPassword(PW,k3); ok(r.success===false && r.locked===true,'超過 90 天沒用：裝置金鑰過期，不再受信任');

  e=env(); const keys=[]; for(let i=0;i<11;i++){ keys.push(e.ctx.verifyPassword(PW).deviceKey); e.adv(1000); }
  ok(new Set(keys).size===11,'每台新裝置各拿到不同的金鑰');
  for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);
  ok(e.ctx.verifyPassword(PW,keys[0]).locked===true && e.ctx.verifyPassword(PW,keys[10]).success===true,'最多記住 10 台：第 11 台登入後，最舊的那台被擠掉');

  e=env(); const k4=e.ctx.verifyPassword(PW).deviceKey; let tok=e.ctx.verifyPassword(PW,k4).token;
  const up=e.ctx.updateSettings({ADMIN_PASSWORD:'Brand-New-Pass-2026'},tok);
  ok(up.success && up.passwordChanged===true && !e.props.TRUSTED_DEVICES,'變更密碼：所有受信任裝置一併清除');
  for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);
  r=e.ctx.verifyPassword('Brand-New-Pass-2026',k4); ok(r.success===false && r.locked===true,'變更密碼之後：舊的裝置金鑰失效（被盜的金鑰不能留到換密碼後）');
  e.adv(16*60000); r=e.ctx.verifyPassword('Brand-New-Pass-2026'); ok(r.success===true && typeof r.deviceKey==='string' && r.deviceKey!==k4,'用新密碼登入：發新的裝置金鑰');

  e=env(); for(let i=0;i<5;i++) e.ctx.verifyPassword('guess'+i);
  [undefined,null,'',123,{},[],'short','x'.repeat(500),true].forEach(v=>{ let rr,t=false; try{ rr=e.ctx.verifyPassword(PW,v); }catch(x){t=true;} ok(!t && rr.success===false && rr.locked===true,'不合法的裝置金鑰（'+JSON.stringify(v===undefined?'undefined':v).slice(0,20)+'）：當成沒有，不拋錯，仍鎖定'); });
  e=env(); r=e.ctx.verifyPassword('guess'); ok(r.success===false && /再錯 4 次/.test(r.error),'沒有裝置金鑰的人：錯誤次數提示照舊（再錯 4 次將鎖定）');
  e=env(); const kk=e.ctx.verifyPassword(PW).deviceKey; ok(e.ctx.verifyPassword('bad',kk).success===false && Number(e.cacheStore.login_fails&&e.cacheStore.login_fails.v)===1,'受信任裝置輸錯一次：也會累計（不是免死金牌）');
  const post=(ctx,body)=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(body)}}).text);
  e=env(); const pk=post(e.ctx,{action:'verifyPassword',password:PW}).deviceKey; for(let i=0;i<5;i++) post(e.ctx,{action:'verifyPassword',password:'g'+i});
  ok(post(e.ctx,{action:'verifyPassword',password:PW}).locked===true && post(e.ctx,{action:'verifyPassword',password:PW,deviceKey:pk}).success===true,'doPost verifyPassword：帶 deviceKey 才能在鎖定期間登入');
  const lg=e.ctx.verifyPassword(PW,pk); e.ctx.adminLogout(lg.token); ok(e.ctx.verifyPassword(PW,pk).success===true,'登出不會讓裝置金鑰失效（下次還是常用裝置）');
}

console.log('J. 密碼以公式字元開頭（= + - @）：登入與變更密碼都不受公式防護影響（紅隊檢查 M-3）');
{
  const post=(ctx,body)=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(body)}}).text);
  ['+Strong-Pass-2026','=Strong-Pass-2026','-Strong-Pass-2026','@Strong-Pass-2026'].forEach(pw=>{
    const ee=env(pw); const lg=post(ee.ctx,{action:'verifyPassword',password:pw});
    ok(lg.success===true && lg.token,'doPost 登入：密碼 '+pw[0]+'… 開頭仍可登入（密碼欄位不被加撇號）');
    const up=post(ee.ctx,{action:'updateSettings',password:lg.token,settings:{ADMIN_PASSWORD:'+Brand-New-Pass-2026'}});
    ok(up.success && ee.settingsRows[1][1]==='+Brand-New-Pass-2026','新密碼 +… 開頭：原樣存進 Settings（沒有多出撇號）');
    ok(post(ee.ctx,{action:'verifyPassword',password:'+Brand-New-Pass-2026'}).success===true,'用新密碼（+ 開頭）登入成功');
    const co=post(ee.ctx,{action:'checkSession',password:lg.token}); ok(co.authExpired===true,'換密碼後舊 token 失效（token 欄位照常比對，不被加撇號）');
  });
}

console.log('\n結果：'+pass+' 通過，'+fail+' 失敗'); process.exit(fail?1:0);
