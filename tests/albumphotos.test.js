// 相簿照片清單快取測試：只回 {id,name,size}、命中快取不碰 Drive、寫入時清除、過大不快取、預熱限量。
// 執行：node tests/albumphotos.test.js
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','Code.js'),'utf8');
let pass=0, fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)} else {fail++;console.log('  ✗ FAIL:',m)} };

function env(photoCounts){ // photoCounts: {folderId: 張數}
  const store={}; let driveCalls=0;
  const cache={get:k=>k in store?store[k]:null,put:(k,v)=>{store[k]=v},remove:k=>{delete store[k]},removeAll:ks=>ks.forEach(k=>delete store[k])};
  const mkFile=(i)=>({getId:()=>'F'+String(i).padStart(30,'0'),getName:()=>'IMG_'+i+'.jpg',getSize:()=>1234567,getMimeType:()=>i%50===49?'video/mp4':'image/jpeg'});
  const ctx={console:{log(){},warn(){},error(){}},CacheService:{getScriptCache:()=>cache},
    DriveApp:{getFolderById:id=>{driveCalls++; if(!(id in photoCounts)) throw new Error('Invalid folder'); let i=0;const n=photoCounts[id];
      return {getName:()=>'相簿'+id.slice(0,4),getFiles:()=>({hasNext:()=>i<n,next:()=>mkFile(i++)})};}},
    PropertiesService:{},Utilities:{},LockService:{},SpreadsheetApp:{},ContentService:{},HtmlService:{},UrlFetchApp:{},Session:{},ScriptApp:{}};
  vm.createContext(ctx); vm.runInContext(src,ctx);
  return {ctx,store,drive:()=>driveCalls};
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
ok(r.success===false && Object.keys(e.store).length===0,'格式不合的 ID：回錯誤、不污染快取');
r=e.ctx.getAlbumPhotos(A); ok(r.success===false && !e.store['albph_'+A],'讀取失敗的結果不被快取');

console.log('E. 預熱限量');
e=env({[A]:10,[B]:10,[C]:10,[D]:10});
e.store['app_data_v4']=JSON.stringify({success:true,data:{albums:[{id:A},{id:B},{id:C},{id:D}]}});
let built=e.ctx.warmAlbumPhotos_(2);
ok(built===2 && e.drive()===2,'單次最多補建 2 本（實際：'+built+'）');
built=e.ctx.warmAlbumPhotos_(2); ok(built===2,'下一次補建剩下 2 本');
built=e.ctx.warmAlbumPhotos_(2); ok(built===0 && e.drive()===4,'都已快取就不再讀 Drive');

console.log('\n結果：'+pass+' 通過，'+fail+' 失敗'); process.exit(fail?1:0);
