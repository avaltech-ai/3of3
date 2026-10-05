// 讀取自動重試測試（瀏覽器）：在載入 index.html 的頁面 Console 貼上執行（用法見 tests/README.md）。
// 預期：① 失敗 2 次後成功 → fetch 3 次、成功 1 次、錯誤 0 次；② 3 次都失敗 → 錯誤只通知 1 次；③ 一次成功 → 只 fetch 1 次。
(async()=>{
  const realFetch=window.fetch; const results=[];
  const run=(name,seq)=>new Promise(res=>{
    const urls=[]; let i=0;
    window.fetch=function(u){ urls.push(u); const s=seq[i++];
      if(s==='404') return Promise.resolve({ok:false,status:404,json:()=>Promise.reject(new SyntaxError('x'))});
      if(s==='net') return Promise.reject(new TypeError('Load failed'));
      if(s==='html') return Promise.resolve({ok:true,status:200,json:()=>Promise.reject(new SyntaxError('Unexpected token <'))});
      return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({success:true,data:{ok:1}})}); };
    let okCount=0, errCount=0;
    callBackend('getAppData',{},()=>okCount++,()=>errCount++);
    setTimeout(()=>{results.push({name,fetchCalls:urls.length,okCount,errCount});res();},9000);
  });
  await run('兩次失敗後成功',['404','net','ok']);
  await run('三次都失敗',['404','net','html']);
  await run('一次成功',['ok']);
  window.fetch=realFetch; console.log(JSON.stringify(results,null,1)); return results;
})();
