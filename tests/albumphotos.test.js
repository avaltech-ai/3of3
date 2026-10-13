// 相簿照片清單快取測試：只回 {id,name,size}（影片多 v:1）、照片與影片混排並依建立時間排序（相同再比檔名）、命中快取不碰 Drive、舊格式快取失效、寫入時清除、過大不快取、預熱限量。
// 執行：node tests/albumphotos.test.js
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','Code.js'),'utf8');
let pass=0, fail=0; const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)} else {fail++;console.log('  ✗ FAIL:',m)} };

const TIMING={}; // 測試可覆寫：name(i)、mime(i)、time(i)（毫秒；Error＝讀取失敗）
function env(photoCounts, registered, sheetRows){ // photoCounts: {folderId: 張數}；registered：登記在 getAppData 快取的相簿 ID（預設＝photoCounts 的所有 ID）；sheetRows：Albums 工作表 id 欄
  const store={}; let driveCalls=0;
  if(registered===undefined) registered=Object.keys(photoCounts);
  if(sheetRows===undefined) sheetRows=Object.keys(photoCounts); // 預設：getAppData 快取與 Albums 工作表都登記了這些相簿
  const cache={get:k=>k in store?store[k]:null,put:(k,v)=>{store[k]=v},remove:k=>{delete store[k]},removeAll:ks=>ks.forEach(k=>delete store[k])};
  const mkFile=(i)=>({getId:()=>'F'+String(i).padStart(30,'0'),getName:()=>(TIMING.name?TIMING.name(i):'IMG_'+i+'.jpg'),getSize:()=>1234567,getMimeType:()=>(TIMING.mime?TIMING.mime(i):(i%50===49?'video/mp4':'image/jpeg')),getDateCreated:()=>{ const t=TIMING.time?TIMING.time(i):1700000000000+i*1000; if(t===Error) throw new Error('no time'); return new Date(t);}});
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
ok(r.success && r.photos.length===100,'照片與影片都列出（100 個檔案含 2 部影片 → 100 項）');
ok(r.photos.filter(x=>x.v===1).length===2 && r.photos.filter(x=>x.v===undefined).length===98,'影片多一個 v:1，照片沒有（98 張＋2 部影片）');
ok(Object.keys(r.photos[0]).sort().join()==='id,name,size','照片只含 id／name／size（沒有長網址）');
ok(Object.keys(r.photos.find(x=>x.v)).sort().join()==='id,name,size,v','影片只多 v（沒有長網址）');
ok(r.photos.every(x=>!('_t' in x)) && r.v===2,'建立時間只用來排序、不放進回應；回應帶版本 v:2');

console.log('B. 快取命中不碰 Drive');
e.ctx.getAlbumPhotos(A); e.ctx.getAlbumPhotos(A);
ok(e.drive()===1,'同一本相簿讀三次，只呼叫 Drive 1 次（實際：'+e.drive()+'）');
ok(e.ctx.getAlbumPhotos(A).photos.length===100,'命中快取的內容與第一次相同');

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

console.log('G. 排序：建立時間由舊到新，相同再比檔名');
const mk=(arr)=>{ TIMING.name=i=>arr[i].n; TIMING.time=i=>arr[i].t; TIMING.mime=i=>arr[i].m||'image/jpeg'; const e=env({[A]:arr.length}); const r=e.ctx.getAlbumPhotos(A); Object.keys(TIMING).forEach(k=>delete TIMING[k]); return r.photos.map(x=>x.name).join(','); };
ok(mk([{n:'c.jpg',t:3000},{n:'a.jpg',t:1000},{n:'b.mov',t:2000,m:'video/quicktime'}])==='a.jpg,b.mov,c.jpg','照片與影片混排：依建立時間（a→b.mov→c）');
ok(mk([{n:'b.jpg',t:5},{n:'a.jpg',t:5},{n:'c.mp4',t:5,m:'video/mp4'}])==='a.jpg,b.jpg,c.mp4','時間相同：依檔名');
ok(mk([{n:'IMG_10.jpg',t:5},{n:'IMG_2.jpg',t:5},{n:'IMG_1.jpg',t:5}])==='IMG_1.jpg,IMG_2.jpg,IMG_10.jpg','時間相同：檔名中的數字依大小（2 在 10 前）');
ok(mk([{n:'B.jpg',t:5},{n:'a.jpg',t:5}])==='a.jpg,B.jpg','時間相同：檔名不分大小寫');
ok(mk([{n:'late.mp4',t:9000,m:'video/mp4'},{n:'p1.jpg',t:1000},{n:'p2.jpg',t:2000}])==='p1.jpg,p2.jpg,late.mp4','後來補放的影片排在較早放的照片後面');
ok(mk([{n:'x.jpg',t:2000},{n:'y.jpg',t:Error},{n:'a.jpg',t:Error}])==='a.jpg,y.jpg,x.jpg','讀不到建立時間：視為最早、仍依檔名，不出錯');
ok(mk([{n:'a.pdf',t:1,m:'application/pdf'},{n:'b.jpg',t:2},{n:'c.txt',t:3,m:'text/plain'},{n:'d.mp4',t:4,m:'video/mp4'}])==='b.jpg,d.mp4','其他檔案（PDF、文字）不列入');
ok(mk([])==='','空相簿：回傳空清單');
const same=[{n:'same.jpg',t:5},{n:'same.jpg',t:5}]; TIMING.name=i=>same[i].n; TIMING.time=i=>same[i].t;
{ const ee=env({[A]:2}); const r1=ee.ctx.getAlbumPhotos(A).photos.map(x=>x.id).join(); const ee2=env({[A]:2}); const r2=ee2.ctx.getAlbumPhotos(A).photos.map(x=>x.id).join(); ok(r1===r2 && r1.indexOf('F')===0,'時間與檔名都相同：依 id 排，結果穩定'); }
Object.keys(TIMING).forEach(k=>delete TIMING[k]);

console.log('G2. 手機相機檔名：整本都是 IMG_數字 時依拍攝編號排序（不看上傳時間）');
ok(mk([{n:'IMG_1544.jpg',t:1000},{n:'IMG_1532.jpg',t:5000},{n:'IMG_1599.jpg',t:3000}])==='IMG_1532.jpg,IMG_1544.jpg,IMG_1599.jpg','IMG 檔名：依數字（上傳時間相反也一樣）');
ok(mk([{n:'IMG_1534.jpeg',t:9},{n:'IMG_1533.MOV',t:99,m:'video/quicktime'},{n:'IMG_1532.jpeg',t:5}])==='IMG_1532.jpeg,IMG_1533.MOV,IMG_1534.jpeg','照片與影片共用編號：混排依拍攝順序（影片上傳較晚也不會排到最後）');
ok(mk([{n:'IMG_1235.jpg',t:1},{n:'IMG_E1234.jpg',t:2},{n:'IMG_1234.jpg',t:3}])==='IMG_1234.jpg,IMG_E1234.jpg,IMG_1235.jpg','iPhone 編輯過的 IMG_E1234：緊接在原圖 IMG_1234 之後');
ok(mk([{n:'IMG_10.HEIC',t:2},{n:'img_9.jpg',t:1}])==='img_9.jpg,IMG_10.HEIC','大小寫與 .HEIC 副檔名都算相機檔名');
ok(mk([{n:'IMG_1.jpg',t:5}])==='IMG_1.jpg','只有一個相機檔：正常');
ok(mk([{n:'IMG_1544.jpg',t:1000},{n:'09CD6EE0-BFB2-4F01.jpg',t:2000},{n:'IMG_1532.jpg',t:3000}])==='IMG_1544.jpg,09CD6EE0-BFB2-4F01.jpg,IMG_1532.jpg','混了亂碼檔名：整本改依建立時間（不是每個檔各自判斷）');
ok(mk([{n:'IMG_1544 copy.jpg',t:1000},{n:'IMG_1532.jpg',t:2000},{n:'IMG_1500.jpg',t:3000}])==='IMG_1544 copy.jpg,IMG_1532.jpg,IMG_1500.jpg','有一個不符合 IMG_數字 格式：整本依建立時間');
ok(mk([{n:'DSC_0002.jpg',t:2000},{n:'DSC_0001.jpg',t:1000}])==='DSC_0001.jpg,DSC_0002.jpg','其他相機命名（DSC_）：依建立時間');

console.log('G3. 管理員清除相簿清單快取（clearAlbumListCache）');
{
  const ee=env({[A]:5,[B]:5,[C]:5}); ee.ctx.getAlbumPhotos(A); ee.ctx.getAlbumPhotos(B);
  ee.store['app_data_v4']='APPDATA'; ee.store['text_map_v1_0']='TEXTMAP';
  ee.ctx.checkPassword=t=>t==='good-token';
  let r=ee.ctx.clearAlbumListCache('bad-token');
  ok(r.success===false && r.authExpired===true && !!ee.store['albph_'+A] && !!ee.store['albph_'+B],'沒有有效 token：拒絕，相簿快取不動');
  r=ee.ctx.clearAlbumListCache(undefined); ok(r.success===false && !!ee.store['albph_'+A],'沒帶 token：拒絕');
  r=ee.ctx.clearAlbumListCache('good-token');
  ok(r.success===true && r.cleared===2 && !ee.store['albph_'+A] && !ee.store['albph_'+B] && !ee.store['albph_keys'],'有效 token：清掉 2 本相簿的快取與索引（回報 cleared=2）');
  ok(ee.store['app_data_v4']==='APPDATA' && ee.store['text_map_v1_0']==='TEXTMAP','只清相簿清單：getAppData 與英文對照快取不受影響');
  const d0=ee.drive(); ee.ctx.getAlbumPhotos(A); ok(ee.drive()===d0+1,'清除後下一次讀取才重新向 Drive 列出');
  r=ee.ctx.clearAlbumListCache('good-token'); ok(r.success===true,'沒有任何快取時也不出錯');
  ok(/action === 'clearAlbumListCache'/.test(src) && /clearAlbumListCache\(postData\.password\)/.test(src),'doPost 已註冊此動作且傳入 token（寫入類動作不開放給 doGet）');
  const gi=src.indexOf('function doGet('), pi=src.indexOf('function doPost(');
  ok(gi>=0 && pi>gi && src.slice(gi,pi).indexOf('clearAlbumListCache')===-1 && src.slice(pi,pi+20000).indexOf('clearAlbumListCache')>0,'未放進公開的 doGet（只在 doPost 內，驗證 token）');
}

console.log('H. 舊格式快取失效');
e=env({[A]:5}); e.store['albph_'+A]=JSON.stringify({success:true,folderName:'舊',photos:[{id:'OLDOLDOLDOLDOLD',name:'old.jpg',size:1}]});
r=e.ctx.getAlbumPhotos(A);
ok(r.v===2 && r.photos.length===5 && e.drive()===1,'快取裡是舊格式（沒有 v）：略過、重新向 Drive 讀取（Drive 呼叫：'+e.drive()+'）');
e.ctx.getAlbumPhotos(A); ok(e.drive()===1,'重建後的新格式快取：命中，不再讀 Drive');
e=env({[A]:5}); e.store['albph_'+A]='not json'; r=e.ctx.getAlbumPhotos(A); ok(r.success===true && r.v===2,'快取內容損毀：略過、重建');

console.log('\n結果：'+pass+' 通過，'+fail+' 失敗'); process.exit(fail?1:0);
