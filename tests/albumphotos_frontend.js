// 相簿照片「瘦身回應」前端測試（瀏覽器）：在載入 index.html 的頁面 Console 貼上執行（用法見 tests/README.md）。
// 預期：listLen=2（不合法的 id 被略過）、imgs 兩張都是 drive.google.com/thumbnail、evilEls=0。
(async()=>{
  await new Promise(r=>setTimeout(r,4000)); // 等頁面自己的雲端載入結束
  const realFetch=window.fetch;
  window.fetch=function(u){ if(String(u).includes('getAlbumPhotos')) return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve({success:true,folderName:'x',photos:[
    {id:'1pwpc97juAOf1eHbCnefX3v5nSA3Oj5cf',name:'a.jpg',size:10},
    {id:'1ABCDEFGHIJKLMNOP_qrstuvwxyz-0123',name:'<img src=x onerror=alert(1)>.jpg',size:11},
    {id:'"><script>alert(1)</script>',name:'evil',size:1},
    {id:'short',name:'bad',size:1}]})}); return realFetch.apply(this,arguments); };
  openAlbumPhotos('1gRFbxu4MSAUl-YxW8o7AqVs222aCrezE','test');
  await new Promise(r=>setTimeout(r,1500)); window.fetch=realFetch;
  const imgs=[...document.querySelectorAll('#albumPhotosGrid img')].map(i=>i.getAttribute('src'));
  const out={listLen:currentAlbumPhotosList.length, imgs, evilEls:document.querySelectorAll('#albumPhotosGrid script, #albumPhotosGrid [onerror]').length};
  console.log(JSON.stringify(out,null,1)); return out;
})();
