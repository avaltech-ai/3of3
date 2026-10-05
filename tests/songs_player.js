// 連續播放測試（瀏覽器）：在載入 index.html 的頁面 Console 貼上執行（用法見 tests/README.md）。
// 以假的 YouTube 播放器驗證：換歌用同一個播放器的 loadVideoById（iPhone 才能自動接著播），而不是銷毀重建。
(async()=>{
  await new Promise(r=>setTimeout(r,4000));
  const log=[]; let created=0, destroyed=0, instance=null;
  class FakePlayer{ constructor(id,opts){ created++; instance=this; this.opts=opts; this.vid=opts.videoId; this.loaded=[]; this.ready=false;
      setTimeout(()=>{ this.ready=true; opts.events.onReady({target:this}); },10); }
    playVideo(){} getDuration(){return 137} seekTo(){} destroy(){ destroyed++; }
    loadVideoById(v){ this.loaded.push(v); this.vid=v; } }
  window.YT={Player:FakePlayer,PlayerState:{ENDED:0,PLAYING:1}};
  const res=[]; const ok=(c,m)=>{res.push((c?'✓ ':'✗ FAIL: ')+m)};
  const mk=(i)=>({id:'S'+i,title:'歌'+i,youtubeUrl:'https://www.youtube.com/watch?v=aaaaaaaaaa'+i,category:'',duration:''});
  songPlayerQueue=[mk(1),mk(2),mk(3)]; songRepeatList=false; songShuffle=false;
  openSongPlayerFromQueue(0); await new Promise(r=>setTimeout(r,100));
  ok(created===1 && instance.vid==='aaaaaaaaaa1','第一首：建立 1 個播放器');
  instance.opts.events.onStateChange({data:0,target:instance}); // 第一首播完
  await new Promise(r=>setTimeout(r,50));
  ok(created===1 && destroyed===0,'播完換下一首：沒有銷毀、沒有重建（created='+created+', destroyed='+destroyed+'）');
  ok(instance.loaded.join()==='aaaaaaaaaa2','改用同一個播放器 loadVideoById 載入第二首');
  ok(songPlayerQueueIndex===1 && document.getElementById('songPlayerTitle').textContent==='歌2','畫面標題與佇列位置同步更新為第二首');
  playNextSongInQueue(); await new Promise(r=>setTimeout(r,50));
  ok(instance.loaded.join()==='aaaaaaaaaa2,aaaaaaaaaa3' && created===1,'按「下一首」也用 loadVideoById');
  playPrevSongInQueue(); await new Promise(r=>setTimeout(r,50));
  ok(instance.loaded.slice(-1)[0]==='aaaaaaaaaa2' && created===1,'按「上一首」也用 loadVideoById');
  closeSongPlayer(); ok(destroyed===1,'關閉視窗：銷毀播放器');
  songPlayerQueue=[mk(1),mk(2)]; openSongPlayerFromQueue(0); await new Promise(r=>setTimeout(r,100));
  ok(created===2,'重新開啟：建立新的播放器');
  // 播放器尚未就緒時換歌：不可呼叫 loadVideoById（退回重建）
  closeSongPlayer(); created=0; destroyed=0;
  songPlayerQueue=[mk(1),mk(2)]; openSongPlayerFromQueue(0); // 未等 onReady
  await new Promise(r=>setTimeout(r,0));
  openSongPlayerFromQueue(1); await new Promise(r=>setTimeout(r,100));
  ok(instance.vid==='aaaaaaaaaa2','尚未就緒時快速換歌：最後播放的是第二首（退回重建，不丟失）');
  closeSongPlayer();
  console.log(res.join('\n')); return res;
})();
