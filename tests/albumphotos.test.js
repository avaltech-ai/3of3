// 相簿照片清單快取測試：只回 {id,name,size}、命中快取不碰 Drive、寫入時清除、過大不快取、預熱限量。
// 執行：node tests/albumphotos.test.js
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','Code.js'),'utf8');
let pass=0, fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)} else {fail++;console.log('  ✗ FAIL:',m)} };

function env(photoCounts, registered, sheetRows){ // photoCounts: {folderId: 張數}；registered：登記在 getAppData 快取的相簿 ID（預設＝photoCounts 的所有 ID）；sheetRows：Albums 工作表 id 欄
  const store={}; let driveCalls=0;
  if(registered===undefined) registered=Object.keys(photoCounts);
  if(sheetRows===undefined) sheetRows=Object.keys(photoCounts); // 預設：getAppData 快取與 Albums 工作表都登記了這些相簿
  const cache={get:k=>k in store?store[k]:null,put:(k,v)=>{store[k]=v},remove:k=>{delete store[k]},removeAll:ks=>ks.forEach(k=>delete store[k])};
  const mkFile=(i)=>({getId:()=>'F'+String(i).padStart(30,'0'),getName:()=>'IMG_'+i+'.jpg',getSize:()=>1234567,getMimeType:()=>i%50===49?'video/mp4':'image/jpeg'});
  const ctx={console:{log(){},warn(){},error(){}},CacheService:{getScriptCache:()=>cache},
    DriveApp:{getFolderById:id=>{driveCalls++; if(!(id in photoCounts)) throw new Error('Invalid folder'); let i=0;const n=photoCounts[id];
      return {getName:()=>'相簿'+id.slice(0,4),getFiles:()=>({hasNext:()=>i<n,next:()=>mkFile(i++)})};}},
    PropertiesService:{},Utilities:{},LockService:{},SpreadsheetApp:{},ContentService:{},HtmlService:{},UrlFetchApp:{},Session:{},ScriptApp:{}};
  vm.createContext(ctx); vm.runInContext(src,ctx);
  if(registered) store['app_data_v4']=JSON.stringify({success:true,data:{albums:registered.map(id=>({id}))}});
  let sheetReads=0;
  ctx.getSpreadsheet=()=>({getSheetByName:n=>{ if(sheetRows===Error) throw new Error('boom'); if(n!=='Albums'||!sheetRows) return null; sheetReads++; return {getDataRange:()=>({getValues:()=>[['id','title']].concat(sheetRows.map(i=>[i,'x']))})}; }});
  return {ctx,store,drive:()=>driveCalls,sheetReads:()=>sheetReads};
}
const A='AAAAAAAAAAAAAAAAAAAA', B='BBBBBBBBBBBBBBBBBBBB', C='CCCCCCCCCCCCCCCCCCCC', D='DDDDDDDDDDDDDDDDDDDD';

console.log('A. 回傳內容縮小');
let e=env({[A]:100}); let r=e.ctx.getAlbumPhotos(A);
ok(r.success && r.photos.length===98,'只列出圖片（100 個檔案含 2 部影片 → 98 張）');
ok(Object.keys(r.photos[0]).sort().join()==='id,name,size','每張只含 id／name／size（沒有長網址）');

console.log('B. 快取命中不碰 Drive');
e.ctx.getAlbumPhotos(A); e.ctx.getAlbumPhotos(A);
ok(e.drive()===1,'同一本相簿讀三次，只呼叫 Drive 1 次（實際：'+e.drive()+'）');
ok(e.ctx.getAlbumPhotos(A).photos.length===98,'命中快取的內容與第一次相同');

console.log('C. 寫入（清快取）後重新讀取');
e.ctx.clearAppDataCache(); e.ctx.getAlbumPhotos(A);
ok(e.drive()===2,'clearAppDataCache 之後重新向 Drive 讀取（實際：'+e.drive()+'）');

console.log('D. 大型相簿與邊界');
e=env({[B]:600}); r=e.ctx.getAlbumPhotos(B); const len=JSON.stringify(r).length;
ok(len<=90000 && !!e.store['albph_'+B],'600 張約 '+len+' 字元，放得進快取（上限 90000）');
e=env({[B]:3000}); r=e.ctx.getAlbumPhotos(B);
ok(r.success && !e.store['albph_'+B],'超過上限的巨大相簿：照常回傳、但不快取（不會因快取失敗而壞掉）');
e=env({}); r=e.ctx.getAlbumPhotos('bad id!!');
ok(r.success===false && Object.keys(e.store).filter(k=>k.indexOf('albph_')===0).length===0,'格式不合的 ID：回錯誤、不污染快取');
r=e.ctx.getAlbumPhotos(A); ok(r.success===false && !e.store['albph_'+A],'讀取失敗的結果不被快取');

console.log('E. 預熱限量');
e=env({[A]:10,[B]:10,[C]:10,[D]:10});
e.store['app_data_v4']=JSON.stringify({success:true,data:{albums:[{id:A},{id:B},{id:C},{id:D}]}});
let built=e.ctx.warmAlbumPhotos_(2);
ok(built===2 && e.drive()===2,'單次最多補建 2 本（實際：'+built+'）');
built=e.ctx.warmAlbumPhotos_(2); ok(built===2,'下一次補建剩下 2 本');
built=e.ctx.warmAlbumPhotos_(2); ok(built===0 && e.drive()===4,'都已快取就不再讀 Drive');

console.log('F. 只允許已登記的相簿（公開入口不得列出任意 Drive 資料夾）');
e=env({[A]:5},[],[]); r=e.ctx.getAlbumPhotos(A);
ok(r.success===false && r.photos.length===0 && e.drive()===0,'未登記的資料夾 ID（Drive 上確實存在）：拒絕且完全沒讀 Drive（Drive 呼叫：'+e.drive()+'）');
ok(!e.store['albph_'+A] && !/Invalid|folder/i.test(r.error||''),'拒絕訊息不洩漏細節、結果不進快取（'+r.error+'）');
e=env({[A]:5},[A],[A]); ok(e.ctx.getAlbumPhotos(A).success===true && e.sheetReads()===0,'登記在 getAppData 快取：允許，且不讀試算表');
e=env({[A]:5},null,[A]); ok(e.ctx.getAlbumPhotos(A).success===true && e.sheetReads()===1,'沒有快取、但登記在 Albums 工作表：允許（剛新增的相簿）');
e=env({[A]:5},[B],[A]); ok(e.ctx.getAlbumPhotos(A).success===true,'快取清單過期（沒有這本）但工作表有：允許');
e=env({[A]:5},[B],[B]); ok(e.ctx.getAlbumPhotos(A).success===false,'快取與工作表都沒有：拒絕');
e=env({[A]:5},null,Error); ok(e.ctx.getAlbumPhotos(A).success===false && e.drive()===0,'讀工作表出錯：一律拒絕（fail closed）');
const rows=[A]; e=env({[A]:5},[A],rows); e.ctx.getAlbumPhotos(A); rows.length=0; e.ctx.clearAppDataCache();
ok(e.ctx.getAlbumPhotos(A).success===false,'相簿被刪除並清快取後：不再能列出');
e=env({[A]:5},[A]); ok(e.ctx.getAlbumPhotos(' '+A+' ').success===true,'ID 前後有空白：照常處理（trim）');

console.log('\n結果：'+pass+' 通過，'+fail+' 失敗'); process.exit(fail?1:0);
