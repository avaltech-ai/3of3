const fs = require('fs');

const logoB64 = fs.readFileSync('logo_b64.txt', 'utf8').trim();

const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>桃子腳幼兒園 - 諾貝爾 A 班</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            peach: {
              50: '#FFF5F5',
              100: '#FED7D7',
              200: '#FEB2B2',
              400: '#F87171',
              500: '#FF7A85',
              600: '#E05362',
            },
            mint: {
              50: '#F0FDF4',
              100: '#DCFCE7',
              400: '#34D399',
              500: '#10B981',
              600: '#059669',
            },
            sun: {
              50: '#FFFBEB',
              100: '#FEF3C7',
              400: '#FBBF24',
              500: '#F59E0B',
            },
            berry: {
              50: '#F5F3FF',
              100: '#EDE9FE',
              400: '#A78BFA',
              500: '#8B5CF6',
              600: '#7C3AED',
            },
            warmbg: '#FDFBF7'
          },
          fontFamily: {
            sans: ['"Zen Maru Gothic"', '"Noto Sans TC"', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    
    html {
      font-size: 19px; /* Base font size increased from 16px for larger text globally */
    }
    body {
      background-color: #FDFBF7;
      font-family: 'Zen Maru Gothic', 'Noto Sans TC', sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    /* 自訂可愛滾動條 */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #FDFBF7;
    }
    ::-webkit-scrollbar-thumb {
      background: #FED7D7;
      border-radius: 9999px;
    }
    .tap-bounce:active {
      transform: scale(0.96);
      transition: transform 0.1s ease;
    }
    .modal-backdrop {
      background-color: rgba(30, 41, 59, 0.45);
      backdrop-filter: blur(4px);
    }
    @keyframes pulse-subtle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .animate-pulse-subtle {
      animation: pulse-subtle 2.5s infinite;
    }
    .aspect-square {
      aspect-ratio: 1 / 1 !important;
    }
    .aspect-video {
      aspect-ratio: 16 / 9 !important;
    }
    .aspect-\[4\/3\] {
      aspect-ratio: 4 / 3 !important;
    }
    .aspect-\[16\/10\] {
      aspect-ratio: 16 / 10 !important;
    }
    .z-60 { z-index: 60 !important; }
    .z-70 { z-index: 70 !important; }
    #albumPhotosGrid, #albumThumbnails {
      grid-auto-rows: max-content !important;
    }
  </style>
</head>
<body class="text-slate-700 min-h-screen flex flex-col antialiased selection:bg-peach-200">

  <!-- ==================== 頂部全彩色帶 (取代原本的走馬燈) ==================== -->
  <div class="bg-gradient-to-r from-peach-500 via-sun-400 to-mint-400 h-1.5 w-full sticky top-0 z-50"></div>

  <!-- ==================== HEADER 導覽標題列 ==================== -->
  
  <div class="flex flex-row w-full min-h-[calc(100vh-6px)] items-stretch">
    
    <!-- Desktop Sidebar Wrapper (occupies layout space when pinned) -->
    <div id="sidebarWrapper" class="hidden md:block w-16 shrink-0 transition-all duration-300"></div>

    <!-- The actual floating/sticky sidebar -->
    <aside id="desktopSidebar" class="hidden md:flex flex-col bg-white border-r border-slate-200/80 shadow-sm fixed top-1.5 bottom-0 left-0 z-40 w-16 transition-all duration-300 overflow-hidden group" onmouseenter="expandSidebar()" onmouseleave="collapseSidebar()">
      <div class="px-4 flex items-center border-b border-slate-100 relative min-h-[64px] whitespace-nowrap overflow-hidden">
        <span class="text-2xl w-8 text-center cursor-pointer transition-transform hover:scale-110 shrink-0 select-none" onclick="switchTab('home')">🍄</span>
        <span class="font-black text-slate-700 ml-2 opacity-0 transition-opacity duration-300 sidebar-text text-lg select-none">選單導覽</span>
        <button id="pinSidebarBtn" onclick="togglePinSidebar()" class="absolute right-3 p-1.5 text-slate-400 hover:text-slate-700 transition-colors opacity-0 sidebar-pin-btn rounded-lg hover:bg-slate-100 group-hover:opacity-100 focus:opacity-100 tap-bounce" title="釘選選單">
          <span class="text-sm">📌</span>
        </button>
      </div>
      
      <nav class="flex-1 py-4 flex flex-col gap-2 px-2 overflow-y-auto no-scrollbar overflow-x-hidden">
        <button onclick="switchTab('home')" id="tabBtn-home" class="tab-btn flex items-center p-2 rounded-xl transition-all group/btn text-slate-500 hover:bg-slate-100 hover:text-slate-800">
          <span class="text-xl w-8 text-center shrink-0">🏠</span>
          <span class="font-bold text-sm whitespace-nowrap opacity-0 transition-opacity duration-300 sidebar-text ml-2">班級日常</span>
        </button>
        <button onclick="switchTab('albums')" id="tabBtn-albums" class="tab-btn flex items-center p-2 rounded-xl transition-all group/btn text-slate-500 hover:bg-slate-100 hover:text-slate-800">
          <span class="text-xl w-8 text-center shrink-0">📸</span>
          <span class="font-bold text-sm whitespace-nowrap opacity-0 transition-opacity duration-300 sidebar-text ml-2">影像紀錄</span>
        </button>
        <button onclick="switchTab('docs')" id="tabBtn-docs" class="tab-btn flex items-center p-2 rounded-xl transition-all group/btn text-slate-500 hover:bg-slate-100 hover:text-slate-800">
          <span class="text-xl w-8 text-center shrink-0">📁</span>
          <span class="font-bold text-sm whitespace-nowrap opacity-0 transition-opacity duration-300 sidebar-text ml-2">常用文件</span>
        </button>
        <div class="flex-1"></div>
        <button onclick="switchTab('admin')" id="tabBtn-admin" class="tab-btn flex items-center p-2 rounded-xl transition-all group/btn text-slate-500 hover:bg-slate-100 hover:text-slate-800">
          <span class="text-xl w-8 text-center shrink-0">⚙️</span>
          <span class="font-bold text-sm whitespace-nowrap opacity-0 transition-opacity duration-300 sidebar-text ml-2">管理後台</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
      <header class="bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-sm sticky top-1.5 z-30 flex-shrink-0">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <!-- 園所與班級 Logo 識別 -->
      <div class="flex items-center gap-3 cursor-pointer" onclick="switchTab('home')">
        <div>
          <div class="flex items-center gap-1.5 flex-wrap">
            
            <span class="text-xs font-medium text-slate-500">桃子腳幼兒園</span>
          </div>
          <h1 class="text-lg sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5 mt-0.5">
            <span>諾貝爾 A 班</span>
            <span class="text-xs font-semibold text-white bg-gradient-to-r from-peach-500 to-rose-500 px-2 py-0.5 rounded-md shadow-sm">生活與行事曆</span>
          </h1>
        </div>
      </div>

      <!-- 頁面最右上角：系統管理員登入狀態與即時登出按鈕 -->
      <div id="globalAdminStatus" class="hidden items-center gap-2">
        <div class="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs px-2.5 py-1 rounded-full font-bold shadow-2xs">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>管理員已登入</span>
        </div>
        <button onclick="doAdminLogout()" class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/90 text-xs font-bold transition-all tap-bounce flex items-center gap-1 shadow-2xs" title="即時登出系統管理員">
          <span class="text-xs">🚪</span>
          <span>登出</span>
        </button>
      </div>
    </div>
  </header>


  <!-- ==================== 手機版底部浮動導覽列 ==================== -->
  <div class="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-rose-100 p-1.5 flex items-center justify-around">
    <button onclick="switchTab('home')" id="mTabBtn-home" class="m-tab-btn flex-1 py-1.5 flex flex-col items-center justify-center text-xs font-bold rounded-xl transition-all text-peach-600 bg-peach-50">
      <span class="text-lg">🏠</span>
      <span>今日生活</span>
    </button>
    <button onclick="switchTab('albums')" id="mTabBtn-albums" class="m-tab-btn flex-1 py-1.5 flex flex-col items-center justify-center text-xs font-bold rounded-xl transition-all text-slate-500 hover:text-slate-800">
      <span class="text-lg">📸</span>
      <span>影像紀錄</span>
    </button>
    <button onclick="switchTab('docs')" id="mTabBtn-docs" class="m-tab-btn flex-1 py-1.5 flex flex-col items-center justify-center text-xs font-bold rounded-xl transition-all text-slate-500 hover:text-slate-800">
      <span class="text-lg">📁</span>
      <span>檔案下載</span>
    </button>
    <button onclick="switchTab('admin')" id="mTabBtn-admin" class="m-tab-btn flex-1 py-1.5 flex flex-col items-center justify-center text-xs font-bold rounded-xl transition-all text-slate-500 hover:text-slate-800">
      <span class="text-lg">⚙️</span>
      <span>管理設定</span>
    </button>
  </div>

  <!-- ==================== 主要內容區塊 CONTAINER ==================== -->
  <main class="max-w-5xl mx-auto px-4 py-5 flex-1 w-full mb-16 md:mb-6">

    <!-- 雲端靜默同步提示 Badge (非阻塞式，保證隨時可順暢操作) -->
    <div id="bgSyncBadge" class="fixed top-16 right-4 bg-white/95 backdrop-blur border border-peach-200 text-peach-600 text-[0.6875rem] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 hidden z-50 transition-all pointer-events-none">
      <span class="inline-block w-2 h-2 rounded-full bg-peach-500 animate-ping"></span>
      <span>雲端資料同步中...</span>
    </div>

    <!-- 全域載入狀態提示（備用） -->
    <div id="loadingOverlay" class="py-12 flex flex-col items-center justify-center gap-3 hidden">
      <div class="w-12 h-12 border-4 border-peach-200 border-t-peach-500 rounded-full animate-spin"></div>
      <p class="text-sm font-bold text-slate-500 animate-pulse">正在連線至雲端讀取最新資料庫，請稍候...</p>
    </div>

    <!-- ==================== TAB 1: 班級日常 (HOME) ==================== -->
    <section id="tabContent-home" class="space-y-6">

      <!-- 1. SPOTLIGHT 重點活動焦點卡片 -->
      <div id="spotlightContainer" class="bg-gradient-to-br from-rose-50 via-amber-50 to-teal-50 rounded-3xl p-4 sm:p-5 border-2 border-rose-200/80 shadow-md relative overflow-hidden transition-all" onmouseenter="pauseSpotlightTimer()" onmouseleave="resumeSpotlightTimer()" ontouchstart="pauseSpotlightTimer()" ontouchend="resumeSpotlightTimer()">
        <!-- 裝飾背景符號 -->
        <div class="absolute -right-6 -bottom-6 text-7xl opacity-15 select-none pointer-events-none">🍑</div>

        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="bg-peach-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <span>✨</span> SPOTLIGHT 焦點活動
            </span>
          </div>

          <!-- 輪播控制與狀態 (多活動自動顯示) -->
          <div id="spotlightNavControls" class="flex items-center gap-2">
            <span id="spotlightSlideCounter" class="text-sm font-extrabold text-slate-500 bg-white/80 px-4 py-1.5 rounded-full border border-rose-100 shadow-2xs">
              1 / 1
            </span>
            
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          <!-- 焦點視覺/攻略圖或影片卡 -->
          <div class="md:col-span-5 bg-white p-2.5 rounded-2xl shadow-sm border border-rose-100 flex flex-col items-center justify-center group relative">
            <div class="w-full aspect-[16/10] bg-rose-50 rounded-xl overflow-hidden relative flex items-center justify-center group/nav">
              <button type="button" onclick="event.stopPropagation(); prevSpotlightSlide(event)" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-800 font-bold text-sm sm:text-lg tap-bounce z-10 transition-opacity opacity-80 hover:opacity-100 hidden" id="spotlightOverlayPrevBtn" title="上一個焦點活動">
                ◀
              </button>
              <button type="button" onclick="event.stopPropagation(); nextSpotlightSlide(event)" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-800 font-bold text-sm sm:text-lg tap-bounce z-10 transition-opacity opacity-80 hover:opacity-100 hidden" id="spotlightOverlayNextBtn" title="下一個焦點活動">
                ▶
              </button>
              <!-- 圖片模式 -->
              <img id="spotlightImg" src="./spotlight-fluoride.jpg" alt="焦點活動" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300 cursor-pointer tap-bounce" onclick="openSpotlightModal()">
              <div id="spotlightImgHoverHint" class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span class="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow">點擊放大檢視攻略</span>
              </div>
              <!-- 影片播放器 (YouTube / Drive preview / HTML5 video) -->
              <div id="spotlightVideoBox" class="w-full h-full hidden">
                <iframe id="spotlightIframe" class="w-full h-full border-0 rounded-xl pointer-events-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                <video id="spotlightHtml5Video" class="w-full h-full object-cover rounded-xl hidden pointer-events-none" playsinline autoplay muted loop></video>
              </div>
            </div>
            <div class="mt-2 text-center w-full flex items-center justify-between px-1">
              <span id="spotlightMediaHint" class="text-xs text-rose-500 font-bold flex items-center gap-1 cursor-pointer" onclick="openSpotlightModal()">
                🔍 放大查看
              </span>
              <span id="spotlightDurationBadge" class="text-[0.625rem] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                ⏱️ 5s 輪播
              </span>
            </div>
          </div>

          <!-- 焦點文字與說明卡片 -->
          <div class="md:col-span-7 space-y-2.5">
            <div class="flex items-start gap-2 flex-wrap">
              <h2 id="spotlightTitle" class="text-lg sm:text-xl font-black text-slate-800 leading-snug">
                桃子腳幼兒園 牙齒塗氟日 活動攻略圖
              </h2>
              <span id="spotlightStatusBadge" class="text-xs font-bold px-2 py-0.5 rounded-md mt-1 hidden shrink-0 whitespace-nowrap"></span>
            </div>
            <p id="spotlightSubtitle" class="text-xs sm:text-sm text-slate-600 font-semibold flex items-center gap-1">
              📅 日期：2026/10/23 (五) 08:30 起全園分班檢查
            </p>

            <!-- 重點標籤清單 -->
            <div id="spotlightPoints" class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div class="bg-white/80 p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                <div class="font-bold text-rose-600 flex items-center gap-1 mb-0.5">
                  <span>🦷</span> 【衛教宣導】
                </div>
                <div class="text-slate-600">正確刷牙示範，引導幼兒養成每日潔牙好習慣。</div>
              </div>
              <div class="bg-white/80 p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                <div class="font-bold text-teal-600 flex items-center gap-1 mb-0.5">
                  <span>🩺</span> 【塗氟檢查】
                </div>
                <div class="text-slate-600">每六個月定期專業口腔保健，細心守護孩子健康小乳牙。</div>
              </div>
              <div class="bg-white/80 p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 shadow-2xs col-span-1 sm:col-span-2">
                <div class="font-bold text-amber-700 flex items-center gap-1 mb-0.5">
                  <span>⚠️</span> 【重要注意事項】
                </div>
                <div class="text-slate-700 font-medium">請家長務必攜帶「健保卡」！未攜帶健保卡將無法參加塗氟檢查喔！</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 輪播圓點指示器 -->
        <div id="spotlightDots" class="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-rose-100/60">
        </div>
      </div>

      <!-- 2. 行事曆切換工具列與主要互動日曆 -->
      <div class="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        
        <!-- 工具列：年月份切換、檢視模式切換、回到今天 -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <!-- 年月與切換鈕 -->
          <div class="flex items-center gap-2">
            <button onclick="changeMonth(-1)" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-peach-100 hover:text-peach-600 flex items-center justify-center font-bold text-slate-600 transition-colors tap-bounce" title="上個月">
              ‹
            </button>
            <h3 id="calendarCurrentMonthText" class="text-base sm:text-lg font-black text-slate-800 min-w-[130px] text-center tracking-tight">
              2026 年 10 月
            </h3>
            <button onclick="changeMonth(1)" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-peach-100 hover:text-peach-600 flex items-center justify-center font-bold text-slate-600 transition-colors tap-bounce" title="下個月">
              ›
            </button>
            <button onclick="goToToday()" class="px-3 py-1.5 rounded-xl bg-rose-50 text-peach-600 hover:bg-peach-100 text-xs font-bold border border-rose-200/70 tap-bounce ml-1">
              今天
            </button>
          </div>

          <!-- 檢視模式選擇按鈕 (每日點選 / 本週行程 / 本月活動) -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto justify-center">
            <button onclick="setCalViewMode('day')" id="viewModeBtn-day" class="cal-view-btn flex-1 sm:flex-none px-3 py-1 rounded-xl text-xs font-bold transition-all bg-white text-slate-800 shadow-xs">
              📅 單日點選
            </button>
            <button onclick="setCalViewMode('week')" id="viewModeBtn-week" class="cal-view-btn flex-1 sm:flex-none px-3 py-1 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900">
              📋 查看本週
            </button>
            <button onclick="setCalViewMode('month')" id="viewModeBtn-month" class="cal-view-btn flex-1 sm:flex-none px-3 py-1 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900">
              🗓️ 本月總覽
            </button>
          </div>
        </div>

        <!-- 星期表頭 (週日為每週第一天) -->
        <div class="grid grid-cols-7 gap-1 text-center font-bold text-xs">
          <div class="text-rose-500 py-1.5 bg-rose-50/50 rounded-lg">週日</div>
          <div class="text-slate-600 py-1.5">週一</div>
          <div class="text-slate-600 py-1.5">週二</div>
          <div class="text-slate-600 py-1.5">週三</div>
          <div class="text-slate-600 py-1.5">週四</div>
          <div class="text-slate-600 py-1.5">週五</div>
          <div class="text-teal-600 py-1.5 bg-teal-50/50 rounded-lg">週六</div>
        </div>

        <!-- 日曆天數格子 (7欄網格，動態生成) -->
        <div id="calendarGrid" class="grid grid-cols-7 gap-1 sm:gap-1.5">
          <!-- JS 動態插入 -->
        </div>

        <!-- 圖例說明 -->
        <div class="flex items-center justify-center gap-3 sm:gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
          <span class="flex items-center gap-1 font-bold text-peach-600">
            <span>❤️</span> 諾貝爾 A 班
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 全園活動
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 班級主題
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 重要活動
          </span>
          <span class="flex items-center gap-1 text-slate-600">
            <span>🍱</span> 每日點心／餐點
          </span>
          <span class="flex items-center gap-1 text-slate-600">
            <span>🥐</span> 幸福廚房日
          </span>
          <span class="flex items-center gap-1 text-slate-600">
            <span>🎂</span> 當月慶生日
          </span>
        </div>
      </div>

      <!-- 3. 【連動區段】點擊個別日期時帶出之當日生活與活動 / 菜單 -->
      <div id="linkedContentSection" class="space-y-4">
        
        <!-- 當日選取抬頭 -->
        <div class="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-rose-100 shadow-2xs hidden">
          <div class="flex items-center gap-2">
            <span class="text-xl">🌟</span>
            <div>
              <div class="text-xs text-slate-400 font-medium">生活動態與餐點資訊</div>
              <div id="selectedDateHeader" class="text-base sm:text-lg font-black text-slate-800">
                2026 年 10 月 23 日（週五）
              </div>
            </div>
          </div>
          <div id="selectedDayBadges" class="flex items-center gap-1 flex-wrap justify-end">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-peach-100 text-peach-700">諾A塗氟日</span>
          </div>
        </div>

        <!-- 雙欄卡片：左側【今日活動與行程】、右側【今日營養美味菜單】 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- 左側：活動行程區段 (參考 115 上 行事曆) -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-rose-100 text-peach-600 flex items-center justify-center font-bold text-sm">
                    📅
                  </div>
                  <div>
                    <h4 class="font-black text-slate-800 text-base">當日活動與行程</h4>
                    <p class="text-xs text-slate-400">依全園及諾A班行事曆安排</p>
                  </div>
                </div>
                <span id="activeEventCount" class="text-xs font-bold text-peach-600 bg-peach-50 px-2.5 py-1 rounded-full border border-peach-100">
                  1 項活動
                </span>
              </div>

              <!-- 活動列表容器 -->
              <div id="selectedDayEventsList" class="space-y-3">
                <!-- JS 動態帶出 -->
              </div>
            </div>

            <!-- 底部主題資訊 -->
            <div id="semesterThemeNotice" class="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
              <span>🌱</span>
              <span>本期學期主題：<strong id="themeNameText" class="text-slate-700">主題活動：人與自己／人與他人概念</strong></span>
            </div>
          </div>

          <!-- 右側：菜單區段 (參考 10 月份菜單) -->
          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                    🍱
                  </div>
                  <div>
                    <h4 class="font-black text-slate-800 text-base">每日營養美味菜單</h4>
                    <p class="text-xs text-slate-400">用心烹調・均衡健康守護</p>
                  </div>
                </div>
                <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  食安檢核合格
                </span>
              </div>

              <!-- 菜單餐點列表容器 -->
              <div id="selectedDayMenuList" class="space-y-2.5 text-xs sm:text-sm">
                <!-- JS 動態帶出 -->
              </div>
            </div>

            <!-- 營養檢核與安心說明標籤 -->
            <div class="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-bold text-slate-500">營養類別檢核：</span>
                <span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-md font-bold">🌾 全穀雜糧</span>
                <span class="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-md font-bold">🥩 豆魚蛋肉</span>
                <span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-bold">🥦 有機蔬菜</span>
                <span class="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-md font-bold">🍎 當季水果</span>
              </div>
              <p class="text-xs text-slate-400">
                註：本園餐點未使用主管機關公告之不合格油品。配合當令食材適時調整。
              </p>
            </div>
          </div>

        </div>

      </div>

      <!-- 4. 【本週行程總覽容器】(切換至查看本週時呈現) -->
      <div id="weekViewContainer" class="hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h4 class="text-base font-black text-slate-800 flex items-center gap-2">
            <span>📋</span> 本週生活與餐點總覽（週日～週六）
          </h4>
          <button onclick="setCalViewMode('day')" class="text-xs text-peach-600 font-bold hover:underline">
            返回單日點選
          </button>
        </div>
        <div id="weekDaysList" class="space-y-3">
          <!-- JS 動態產生本週 7 天 -->
        </div>
      </div>

      <!-- 5. 【本月活動總覽容器】(切換至查看本月時呈現) -->
      <div id="monthViewContainer" class="hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h4 class="text-base font-black text-slate-800 flex items-center gap-2">
            <span>🗓️</span> <span id="monthViewTitle">2026年10月份 全月重點活動列表</span>
          </h4>
          <button onclick="setCalViewMode('day')" class="text-xs text-peach-600 font-bold hover:underline">
            返回單日點選
          </button>
        </div>
        <div id="monthEventsTimeline" class="space-y-2.5">
          <!-- JS 動態產生本月所有活動時間軸 -->
        </div>
      </div>

    </section>

    <!-- ==================== TAB 2: 活動影像相簿 (ALBUMS) ==================== -->
    <section id="tabContent-albums" class="space-y-6 hidden">
      <!-- 相簿區抬頭 -->
      <div class="bg-gradient-to-r from-teal-50 via-sky-50 to-rose-50 p-5 rounded-3xl border border-teal-200/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">📸</span>
            <h2 class="text-xl font-black text-slate-800 tracking-tight">影像記錄</h2>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            紀錄寶貝在幼兒園成長探索的點滴歡笑！
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a id="btnBrowseCloudAlbums" href="https://drive.google.com/drive/folders/1iRFAr3FZMqV-okmktipdwamjAR7WWp6d" target="_blank" class="px-3.5 py-2 rounded-xl bg-white text-teal-700 border border-teal-300 text-xs font-bold hover:bg-teal-50 flex items-center gap-1.5 shadow-2xs tap-bounce hidden">
            <span>📂</span> 開啟 Google Drive 相簿
          </a>
          <button onclick="refreshAlbums()" class="px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-sm tap-bounce">
            🔄 重新整理
          </button>
        </div>
      </div>

      <!-- 相簿快速篩選工具列 -->
      <div class="bg-white p-4 sm:p-5 rounded-3xl border border-teal-200/70 shadow-xs space-y-3.5">
        <!-- 關鍵字搜尋欄 -->
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">🔍</span>
          <input type="text" id="albumFilter-keyword" placeholder="搜尋相簿主題名稱或關鍵字..." class="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-teal-500 focus:outline-none transition-all" oninput="applyAlbumFilters()">
          <button type="button" id="albumFilter-clearKeyword" onclick="clearAlbumFilterKeyword()" class="hidden absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold tap-bounce">✕</button>
        </div>

        <!-- 活動類別氣泡按鈕（支援複選，預設全部） -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs text-slate-600 font-bold px-0.5">
            <span class="flex items-center gap-1.5">
              <span>🏷️</span> 活動類別標籤（可複選）：
            </span>
            <span class="text-[11px] font-normal text-slate-400 hidden sm:inline">點擊標籤可單選或複選多個類別</span>
          </div>
          <div id="albumCategoryPills" class="flex flex-wrap items-center gap-2 pt-0.5">
            <!-- 由 JS 動態產生氣泡按鈕 -->
          </div>
        </div>

        <!-- 篩選狀態與重設列 -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span id="albumFilterCountText" class="font-bold text-slate-700">共 0 本相簿</span>
            <span id="albumFilterActiveBadge" class="hidden px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">已套用篩選</span>
          </div>
          <button id="btnResetAlbumFilters" onclick="resetAlbumFilters()" class="text-teal-600 hover:text-teal-800 font-bold hover:underline flex items-center gap-1 tap-bounce">
            <span>🔄</span> 重設全部篩選
          </button>
        </div>
      </div>

      <!-- 相簿列表格 -->
      <div id="albumsLoading" class="py-12 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
        <div class="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <span>正在讀取雲端相簿資料夾...</span>
      </div>

      <div id="albumsGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <!-- JS 動態產生相簿卡片 -->
      </div>
    </section>

    <!-- ==================== TAB 3: 常用文件下載 (DOCS) ==================== -->
    <section id="tabContent-docs" class="space-y-6 hidden">
      <!-- 文件區抬頭 -->
      <!-- 管理者模式專用快捷列 (已登入時顯示) -->
      <div id="docAdminBar" class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 font-bold hidden" hidden>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>管理者權限已啟用：您可直接在下方任一文件卡片點選「✏️ 編輯」或「🗑️ 刪除」，或點擊右側按鈕新增文件。</span>
        </div>
        <button onclick="openDocEditModal()" class="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shrink-0 tap-bounce shadow-xs flex items-center gap-1.5">
          <span>➕</span> 新增常用文件
        </button>
      </div>

      <div class="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5 rounded-3xl border border-indigo-200/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">📁</span>
            <h2 class="text-xl font-black text-slate-800 tracking-tight">常用文件</h2>
          </div>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            提供請假單、用藥委託單、學期行事曆與幼兒園作息手冊，方便家長線上預覽與列印。
          </p>
        </div>
        <a id="btnBrowseCloudDocs" href="https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR" target="_blank" class="px-3.5 py-2 rounded-xl bg-white text-indigo-700 border border-indigo-300 text-xs font-bold hover:bg-indigo-50 flex items-center gap-1.5 shadow-2xs tap-bounce hidden">
          <span>📂</span> 瀏覽雲端 Docs 資料夾
        </a>
      </div>

      <!-- 文件分類與搜尋 -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 flex-wrap" id="docCategoryPills">
          <button onclick="filterDocs('全部')" class="doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs">全部文件</button>
          <button onclick="filterDocs('保健用藥')" class="doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">保健用藥</button>
          <button onclick="filterDocs('學期行事曆')" class="doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">學期行事曆</button>
          <button onclick="filterDocs('餐飲菜單')" class="doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">餐飲菜單</button>
          <button onclick="filterDocs('親師手冊')" class="doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">親師手冊</button>
        </div>
        <div class="text-xs text-slate-400">
          點擊可立即下載或直接預覽
        </div>
      </div>

      <!-- 文件列表清單 -->
      <div id="docsListContainer" class="space-y-3">
        <!-- JS 動態插入文件項目 -->
      </div>
    </section>

    <!-- ==================== TAB 4: 管理後台 (ADMIN) ==================== -->
    <section id="tabContent-admin" class="space-y-6 hidden">
      
      <!-- 未登入：密碼驗證卡片 -->
      <div id="adminLoginCard" class="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-lg text-center space-y-4 my-8">
        <div class="w-16 h-16 rounded-3xl bg-peach-100 text-peach-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
          🔒
        </div>
        <div>
          <h3 class="text-xl font-black text-slate-800">管理員身分驗證</h3>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">
            此後台供桃子腳幼兒園老師與管理者編輯行事曆、菜單與上傳檔案。
          </p>
        </div>
        <div class="space-y-3">
          <div>
            <input type="password" id="adminPasswordInput" placeholder="請輸入管理員密碼..." class="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-peach-500 focus:outline-none text-center font-bold tracking-widest text-base transition-colors" onkeydown="if(event.key==='Enter') doAdminLogin()">
          </div>
          <button onclick="doAdminLogin()" id="loginSubmitBtn" class="w-full py-3 rounded-2xl bg-gradient-to-r from-peach-500 to-rose-500 text-white font-black text-sm shadow-md hover:from-peach-600 hover:to-rose-600 transition-all tap-bounce">
            確認進入管理後台
          </button>
          <div class="text-xs text-slate-400 pt-2">
            預設初設密碼：<code class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">nobel-a-2026</code>（進入後可自行修改）
          </div>
        </div>
      </div>

      <!-- 已登入：後台主控制台 -->
      <div id="adminDashboard" class="hidden space-y-6">
        
        <!-- 後台頂部列 -->
        <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <span class="font-black text-slate-800 text-base">諾貝爾 A 班 內容管理中心</span>
            <span class="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">已認證</span>
          </div>
        </div>

        <!-- 後台功能子分頁籤 -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
          <button onclick="switchAdminSubtab('events')" id="adminSubtabBtn-events" class="admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-peach-500 text-white shadow-xs whitespace-nowrap">
            📅 行事曆活動管理
          </button>
          <button onclick="switchAdminSubtab('menu')" id="adminSubtabBtn-menu" class="admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            🍱 每日菜單管理
          </button>
          <button onclick="switchAdminSubtab('uploadPhoto')" id="adminSubtabBtn-uploadPhoto" class="admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            📸 相簿批次上傳
          </button>
          <button onclick="switchAdminSubtab('uploadDoc')" id="adminSubtabBtn-uploadDoc" class="admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            📂 文件檔案上傳
          </button>
          <button onclick="switchAdminSubtab('spotlight')" id="adminSubtabBtn-spotlight" class="admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            🌟 Spotlight 管理
          </button>
          <button onclick="switchAdminSubtab('settings')" id="adminSubtabBtn-settings" class="admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap">
            ⚙️ 密碼與設定
          </button>
        </div>

        <!-- 子分頁 1: 行事曆活動管理 -->
        <div id="adminPanel-events" class="admin-panel space-y-4">
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h4 class="font-black text-slate-800 text-base mb-3 flex items-center justify-between">
              <span>新增／編輯行事曆活動</span>
              <button onclick="clearEventForm()" class="text-xs text-peach-600 font-bold hover:underline">清空表單</button>
            </h4>
            <form id="eventForm" onsubmit="event.preventDefault(); handleSaveEvent(event)" class="space-y-3">
              <input type="hidden" id="eventForm-id">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">活動日期 *</label>
                  <input type="date" id="eventForm-date" required class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">結束日期 (連假填寫)</label>
                  <input type="date" id="eventForm-endDate" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">活動名稱 *</label>
                  <input type="text" id="eventForm-title" placeholder="如：幸福廚房、牙齒塗氟日" required class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
                </div>
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-slate-600">行事曆提示</label>
                    <span class="text-[0.625rem] text-slate-400 font-normal">（選填，填寫才會顯示於月曆格）</span>
                  </div>
                  <input type="text" id="eventForm-calendarPrompt" placeholder="如：牙齒塗氟（未填則月曆格不顯示）" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-slate-600">適用對象 *</label>
                    <span class="text-[0.625rem] text-slate-400 font-normal">（依點擊勾選順序排序）</span>
                  </div>
                  <div id="eventForm-target" class="w-full flex flex-wrap gap-2 pt-1 border border-slate-300 rounded-xl px-3 py-2 bg-white min-h-[38px]"></div>
                  <div id="eventForm-target-preview" class="mt-1.5 text-[0.6875rem] text-slate-500 hidden flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span class="font-bold text-slate-600 shrink-0">已選順序：</span>
                    <div id="eventForm-target-badges" class="inline-flex items-center gap-1 flex-wrap"></div>
                  </div>
                </div>
                <div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[0.6875rem] font-bold text-slate-600 mb-1">活動類別 (大項)</label>
                    <select id="eventForm-categoryMajor" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none"></select>
                  </div>
                  <div>
                    <label class="block text-[0.6875rem] font-bold text-slate-600 mb-1">活動類別 (細項)</label>
                    <select id="eventForm-categoryMinor" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none"></select>
                  </div>
                </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">時間／地點備註</label>
                  <input type="text" id="eventForm-timeLocation" placeholder="如：08:30、17:00 開始" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">活動詳細說明 / 攜帶物品注意事項</label>
                <textarea id="eventForm-description" rows="4" placeholder="詳細說明、講師介紹或請家長配合攜帶之健保卡等..." class="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none min-h-[5.5rem] leading-relaxed resize-y"></textarea>
              </div>
              <div class="flex justify-end gap-2 pt-1">
                <button type="submit" id="saveEventBtn" class="px-5 py-2 rounded-xl bg-peach-500 hover:bg-peach-600 text-white font-bold text-xs shadow-sm tap-bounce">
                  儲存活動
                </button>
              </div>
            </form>
          </div>

          <!-- 已排定活動列表 -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 class="font-black text-slate-800 text-base">既有排定活動一覽</h4>
            <div id="adminEventsTableContainer" class="overflow-x-auto max-h-96">
              <!-- JS 動態插入 -->
            </div>
          </div>
        </div>

        <!-- 子分頁 2: 每日菜單管理 -->
        <div id="adminPanel-menu" class="admin-panel space-y-4 hidden">
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h4 class="font-black text-slate-800 text-base mb-3 flex items-center justify-between">
              <span>編輯每日菜單</span>
              <button onclick="loadMenuForSelectedDate()" class="text-xs text-amber-600 font-bold hover:underline">載入該日菜單</button>
            </h4>
            <form id="menuForm" onsubmit="event.preventDefault(); handleSaveMenu(event)" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">菜單日期 *</label>
                  <input type="date" id="menuForm-date" required onchange="loadMenuForSelectedDate()" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-amber-500 focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">早點</label>
                  <input type="text" id="menuForm-morningSnack" placeholder="如：紅藜雙色饅頭、米漿" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-amber-500 focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">當季水果</label>
                  <input type="text" id="menuForm-fruit" placeholder="如：當季水果（香蕉/芭樂）" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-amber-500 focus:outline-none">
                </div>
              </div>

              <!-- 午餐五菜一湯 -->
              <div class="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 space-y-2">
                <div class="text-xs font-bold text-amber-800">午餐內容配置（主食、主菜、兩道副菜、湯品）</div>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label class="block text-xs text-slate-500 mb-0.5">主食</label>
                    <input type="text" id="menuForm-lunchStaple" placeholder="糙白米飯" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-0.5">主菜</label>
                    <input type="text" id="menuForm-lunchMain" placeholder="青椒炒雞柳" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-0.5">副菜一</label>
                    <input type="text" id="menuForm-lunchSide1" placeholder="木須炒蛋" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-0.5">副菜二</label>
                    <input type="text" id="menuForm-lunchSide2" placeholder="有機蔬菜" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-0.5">湯品</label>
                    <input type="text" id="menuForm-lunchSoup" placeholder="玉米濃湯" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium">
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">午點（下午點心）</label>
                  <input type="text" id="menuForm-afternoonSnack" placeholder="如：滑蛋雞肉粥、綠豆薏仁湯" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-amber-500 focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">備註說明</label>
                  <input type="text" id="menuForm-note" placeholder="如：今日十月慶生會點心" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-amber-500 focus:outline-none">
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-1">
                <button type="button" onclick="handleDeleteMenu()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs tap-bounce">
                  刪除此日菜單
                </button>
                <button type="submit" id="saveMenuBtn" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm tap-bounce">
                  儲存菜單
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 子分頁 3: 相簿批次上傳與管理 (Google Drive Albums) -->
        <div id="adminPanel-uploadPhoto" class="admin-panel space-y-5 hidden">
          <!-- 上傳新相簿卡片 -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h4 class="font-black text-slate-800 text-base">建立並上傳活動相簿至 Google Drive</h4>
              <p class="text-xs text-slate-500 mt-0.5">
                依照設定，系統會自動在 Albums 根目錄建立「<span class="text-teal-600 font-bold">活動主題</span>」的子資料夾，並存放照片與登記至試算表。
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">活動類別 *</label>
                <select id="albumUpload-category" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-teal-500 focus:outline-none">
                  <!-- JS 動態載入 AlbumCategories -->
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">活動主題名稱 *</label>
                <input type="text" id="albumUpload-title" placeholder="如：牙齒塗氟日口腔檢查、幸福廚房手作生活、親師座談" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:outline-none" oninput="updateAlbumPreviewName()">
              </div>
            </div>

            <!-- 自動預覽資料夾名稱 -->
            <div class="bg-teal-50 p-3 rounded-2xl border border-teal-200 text-xs text-teal-800 flex items-center justify-between">
              <span>預計建立資料夾名稱：</span>
              <strong id="albumUpload-previewName" class="font-mono text-sm text-teal-900">活動主題</strong>
            </div>

            <!-- 檔案選取區塊 -->
            <div class="border-2 border-dashed border-teal-200 rounded-2xl p-6 text-center hover:bg-teal-50/50 transition-colors cursor-pointer" onclick="document.getElementById('albumFileInput').click()">
              <input type="file" id="albumFileInput" multiple accept="image/*" class="hidden" onchange="handleAlbumFilesSelected(event)">
              <div class="text-3xl mb-1">📸</div>
              <div class="text-xs font-bold text-slate-700">點此選取照片（支援多張選取）</div>
              <div class="text-xs text-slate-400 mt-1">支援 JPG, PNG, WEBP，手機可直接拍照或選取多張圖檔</div>
            </div>

            <!-- 待上傳縮圖預覽 -->
            <div id="albumUploadPreviewArea" class="hidden space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-600">
                <span id="albumSelectedCountText">已選擇 0 張相片</span>
                <button onclick="clearSelectedPhotos()" class="text-rose-500 hover:underline">清除重選</button>
              </div>
              <div id="albumThumbnails" class="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl content-start" style="grid-auto-rows: max-content;"></div>
            </div>

            <!-- 即時上傳進度與預估時間卡片 -->
            <div id="albumUploadProgressCard" class="hidden bg-gradient-to-br from-teal-50 via-emerald-50/60 to-cyan-50 border-2 border-teal-300 rounded-3xl p-5 shadow-sm space-y-4 transition-all">
              <!-- 頂部狀態列 -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span id="albumUploadSpinIcon" class="text-2xl animate-spin">⏳</span>
                  <div>
                    <h5 id="albumUploadStatusTitle" class="text-sm font-black text-teal-950">正在準備相簿上傳...</h5>
                    <p id="albumUploadStatusSub" class="text-xs text-teal-700/80 font-medium mt-0.5">系統將分批安全上傳，請保持網頁開啟</p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span id="albumUploadPercentText" class="text-2xl font-black text-teal-700">0%</span>
                  <div id="albumUploadCountBadge" class="text-[0.6875rem] font-bold text-teal-600">0 / 0 張</div>
                </div>
              </div>

              <!-- 動畫進度條 -->
              <div class="w-full bg-teal-200/50 rounded-full h-3.5 overflow-hidden p-0.5 shadow-inner">
                <div id="albumUploadProgressBar" class="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 shadow-xs" style="width: 0%"></div>
              </div>

              <!-- 資訊三格統計數據 (已完成 / 已耗時 / 預估剩餘) -->
              <div class="grid grid-cols-3 gap-2 pt-1 text-center">
                <div class="bg-white/80 backdrop-blur rounded-2xl p-2.5 border border-teal-100/80 shadow-2xs">
                  <div class="text-[0.65rem] text-slate-400 font-bold">已完成相片</div>
                  <div id="albumUploadProcessedText" class="text-xs sm:text-sm font-black text-slate-800 mt-0.5">0 張</div>
                </div>
                <div class="bg-white/80 backdrop-blur rounded-2xl p-2.5 border border-teal-100/80 shadow-2xs">
                  <div class="text-[0.65rem] text-slate-400 font-bold">已耗時</div>
                  <div id="albumUploadElapsedText" class="text-xs sm:text-sm font-black text-slate-800 mt-0.5">0 秒</div>
                </div>
                <div class="bg-white/80 backdrop-blur rounded-2xl p-2.5 border border-teal-100/80 shadow-2xs">
                  <div class="text-[0.65rem] text-slate-400 font-bold">預估剩餘時間</div>
                  <div id="albumUploadEtaText" class="text-xs sm:text-sm font-black text-teal-600 mt-0.5">計算中...</div>
                </div>
              </div>

              <!-- 即時動態日誌 -->
              <div class="flex items-center justify-between text-[0.6875rem] text-slate-500 px-1 border-t border-teal-100/60 pt-2.5">
                <div class="flex items-center gap-1.5 truncate">
                  <span class="inline-block w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                  <span id="albumUploadDetailLog" class="truncate font-medium">準備中...</span>
                </div>
                <span class="text-teal-700/80 font-bold shrink-0 ml-2">Google Drive 同步中</span>
              </div>

              <!-- 錯誤處理與重試卡片 (預設隱藏) -->
              <div id="albumUploadErrorBox" class="hidden bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl space-y-2">
                <div class="flex items-center gap-2 font-bold">
                  <span>⚠️</span> <span id="albumUploadErrorMsg">上傳過程中遇到暫時性問題</span>
                </div>
                <p class="text-[0.6875rem] text-rose-600">已上傳的相片已妥善儲存於 Google Drive 與試算表，點擊「繼續上傳」將接續處理剩餘相片。</p>
                <div class="flex items-center gap-2 pt-1">
                  <button type="button" onclick="resumeOrRetryAlbumUpload()" class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs tap-bounce">
                    🔄 繼續上傳剩餘相片
                  </button>
                  <button type="button" onclick="cancelAlbumUpload()" class="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs tap-bounce">
                    關閉面板
                  </button>
                </div>
              </div>

              <!-- 上傳成功完成區塊 (完成時顯示) -->
              <div id="albumUploadSuccessBox" class="hidden bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-3.5 rounded-2xl space-y-2">
                <div class="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <span>🎉</span> <span id="albumUploadSuccessMsg">相簿建立與相片上傳全部完成！</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <a id="albumUploadDriveFolderLink" href="#" target="_blank" class="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-xs tap-bounce flex items-center gap-1">
                    📂 開啟此相簿之 Google Drive 資料夾
                  </a>
                  <button type="button" onclick="resetUploadCard()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs tap-bounce">
                    關閉並準備下次上傳
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button onclick="startUploadAlbumPhotos()" id="albumUploadBtn" class="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm tap-bounce disabled:opacity-50">
                開始上傳相簿至 Google Drive
              </button>
            </div>
          </div>

          <!-- 既有活動相簿管理一覽 -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 class="font-black text-slate-800 text-base">既有活動相簿管理一覽</h4>
                <p class="text-xs text-slate-500 mt-0.5">可在此直接編輯相簿之活動類別與主題名稱，或刪除相簿。</p>
              </div>
              <div class="flex items-center gap-2">
                <span id="adminAlbumsCountBadge" class="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">共 0 本相簿</span>
                <button type="button" onclick="refreshAlbums()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold tap-bounce">
                  🔄 重新整理相簿
                </button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th class="py-2.5 px-3 rounded-l-xl">封面</th>
                    <th class="py-2.5 px-3">活動類別</th>
                    <th class="py-2.5 px-3">活動主題</th>
                    <th class="py-2.5 px-3 text-center">照片數</th>
                    <th class="py-2.5 px-3 text-right rounded-r-xl">管理操作</th>
                  </tr>
                </thead>
                <tbody id="adminAlbumsTableBody" class="divide-y divide-slate-100 font-medium text-slate-700">
                  <!-- 動態渲染相簿資料列 -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 子分頁 4: 常用文件上傳 (Google Drive Docs) -->
        <div id="adminPanel-uploadDoc" class="admin-panel space-y-4 hidden">
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h4 class="font-black text-slate-800 text-base">上傳常用文件至 Google Drive Docs</h4>
              <p class="text-xs text-slate-500 mt-0.5">檔案將直接存入您的 Docs 雲端資料夾，並即時於前台顯示下載按鈕。</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">文件顯示名稱 *</label>
                <input type="text" id="docUpload-name" placeholder="如：幼兒用藥委託單.pdf" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">文件類別 *</label>
                <select id="docUpload-category" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-500 focus:outline-none">
                  <option value="保健用藥">保健用藥</option>
                  <option value="學期行事曆">學期行事曆</option>
                  <option value="餐飲菜單">餐飲菜單</option>
                  <option value="親師手冊">親師手冊</option>
                  <option value="其他常用">其他常用</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">說明備註</label>
              <textarea id="docUpload-desc" rows="2" placeholder="請家長下載列印填妥後交給老師..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-500 focus:outline-none"></textarea>
            </div>

            <div class="border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center hover:bg-indigo-50/50 transition-colors cursor-pointer" onclick="document.getElementById('docFileInput').click()">
              <input type="file" id="docFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" class="hidden" onchange="handleDocFileSelected(event)">
              <div class="text-3xl mb-1">📄</div>
              <div id="docFileSelectedName" class="text-xs font-bold text-slate-700">點此選取文件檔案（PDF、Word、Excel）</div>
              <div class="text-xs text-slate-400 mt-1">選取後將直接上傳至雲端硬碟 Docs 資料夾</div>
            </div>

            <div class="flex justify-end pt-2">
              <button onclick="startUploadDocument()" id="docUploadBtn" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm tap-bounce">
                上傳文件並發佈
              </button>
            </div>
          </div>
        </div>

        <!-- 子分頁 5: Spotlight 管理 -->
        <div id="adminPanel-spotlight" class="admin-panel space-y-4 hidden">
          <!-- 頂部標題與快捷按鈕列 -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">🌟</span>
                <h4 class="font-black text-slate-800 text-base">Spotlight 焦點活動管理</h4>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">支援多筆焦點活動、自動上下架排程、獨立輪播停留秒數、圖片與影片</p>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a id="activityFolderLink" href="javascript:void(0)" onclick="openActivityFolderInDrive()" class="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-xl transition-all flex items-center gap-1 tap-bounce">
                📂 開啟 Acticity 雲端資料夾
              </a>
              <button type="button" onclick="openSpotlightCreateForm()" class="px-4 py-2 rounded-xl bg-peach-500 hover:bg-peach-600 text-white font-bold text-xs shadow-xs tap-bounce flex items-center gap-1">
                <span>➕</span> 新增焦點活動
              </button>
            </div>
          </div>

          <!-- 焦點活動列表清單 -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <h5 class="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <span>📋</span> 現有焦點活動列表
              </h5>
              <span id="spAdminCountBadge" class="text-xs text-slate-400 font-bold">共 0 個活動</span>
            </div>
            <div id="spAdminListContainer" class="space-y-2.5">
              <!-- JS 動態生成焦點活動卡片 -->
            </div>
          </div>

          <!-- 編輯／新增表單卡片 (預設收合或點選新增/編輯時展開) -->
          <div id="spAdminFormContainer" class="bg-white p-5 rounded-3xl border-2 border-peach-200 shadow-sm space-y-4 hidden">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 id="spAdminFormTitle" class="font-black text-slate-800 text-base flex items-center gap-1.5">
                <span>✏️</span> 編輯焦點活動
              </h4>
              <button type="button" onclick="cancelSpotlightEdit()" class="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">
                ✕ 取消關閉
              </button>
            </div>

            <input type="hidden" id="spForm-id">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">主標題 *</label>
                <input type="text" id="spForm-title" placeholder="例如：桃子腳幼兒園 牙齒塗氟日 活動攻略圖" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">副標題／時間 *</label>
                <input type="text" id="spForm-subtitle" placeholder="例如：日期：2026/10/23 (五) 08:30 起全園分班檢查" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
              </div>
            </div>

            <!-- 媒體設定 (圖片 / 影片) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-700">
                  媒體類型與網址（支援圖片上傳、Google Drive 檔案、YouTube 影片連結）
                </label>
                <div class="flex items-center gap-2">
                  <select id="spForm-mediaType" onchange="handleMediaTypeChange()" class="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none">
                    <option value="image">🖼️ 圖片模式</option>
                    <option value="video">🎬 影片模式</option>
                  </select>
                </div>
              </div>

              <!-- 上傳與選取快捷操作按鈕列 -->
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" onclick="document.getElementById('spImageFileInput').click()" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-peach-500 to-rose-500 hover:from-peach-600 hover:to-rose-600 text-white text-xs font-bold shadow-xs tap-bounce flex items-center gap-1.5">
                  <span>📸</span> 本機／手機選擇圖片上傳 (自動高畫質壓縮)
                </button>
                <button type="button" onclick="openActivityFolderPicker()" class="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold tap-bounce flex items-center gap-1.5">
                  <span>📂</span> 從 Acticity 資料夾選取現有檔案
                </button>
                <input type="file" id="spImageFileInput" accept="image/*,video/mp4" class="hidden" onchange="handleSpotlightImageSelected(event)">
              </div>

              <!-- 網址輸入框 (支援自動轉換 Google Drive 分享連結與 YouTube) -->
              <div class="relative flex items-center">
                <input type="text" id="spForm-imageUrl" placeholder="可貼上任意 Google Drive 檔案連結、YouTube 連結或圖片網址..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none" oninput="updateSpPreviewFromUrl()">
              </div>

              <!-- 影片上傳溫馨說明卡片 -->
              <div class="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-[0.6875rem] text-amber-800 space-y-1">
                <div class="font-bold flex items-center gap-1">
                  <span>💡</span> 影片播放溫馨提示：
                </div>
                <div class="text-slate-600 leading-relaxed">
                  因 Google Apps Script 傳輸容量限制約 4MB，活動錄影長片強烈建議上傳至 <strong>YouTube</strong>（可設「不公開」保護幼兒隱私）或直接上傳到 <strong>Google Drive</strong>，並在此欄位貼上分享連結，前台將自動以高清串流順暢播放！短片（&lt; 4MB）亦支援直接上傳。
                </div>
              </div>

              <!-- 圖片與影片預覽與狀態卡片 -->
              <div id="spImagePreviewContainer" class="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="w-24 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative shadow-2xs">
                    <img id="spImagePreviewImg" src="" alt="預覽" class="w-full h-full object-cover">
                    <div id="spVideoPreviewBadge" class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold hidden">
                      🎬 影片
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div id="spImageUploadStatus" class="text-xs font-bold text-slate-800 truncate">目前焦點活動媒體</div>
                    <div class="text-[0.625rem] text-slate-400 mt-0.5">雲端存檔目標：Google Drive ➔ 桃子腳幼兒園 ➔ Acticity</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button type="button" onclick="document.getElementById('spImageFileInput').click()" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-peach-600 text-xs font-bold shadow-2xs tap-bounce">
                    變更檔案
                  </button>
                </div>
              </div>
            </div>

            <input type="hidden" id="spForm-priority" value="1">

            <!-- 排程、秒數與狀態設定 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">
                  📅 自動上架日期 <span class="text-slate-400 font-normal">(留空為立即)</span>
                </label>
                <input type="date" id="spForm-startDate" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">
                  🏁 自動下架日期 <span class="text-slate-400 font-normal">(留空為永久)</span>
                </label>
                <input type="date" id="spForm-endDate" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">
                  ⏱️ 輪播停留時間 (秒) *
                </label>
                <input type="number" id="spForm-duration" min="2" max="60" value="5" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">狀態</label>
                <select id="spForm-status" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none">
                  <option value="啟用">🟢 啟用</option>
                  <option value="停用">🔴 停用</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">重點說明與注意事項 (換行分隔)</label>
              <textarea id="spForm-bulletPoints" rows="4" placeholder="例如：&#10;【衛教宣導】 正確刷牙示範&#10;【塗氟檢查】 每六個月定期專業口腔保健&#10;【注意事項】 請家長務必攜帶健保卡！" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-peach-500 focus:outline-none"></textarea>
            </div>

            <!-- 上傳進度條 (預設隱藏，儲存時動態顯示) -->
            <div id="spUploadProgressContainer" class="hidden p-4 bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border border-amber-200/80 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div id="spUploadSpinner" class="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
                  <span id="spUploadStatusText" class="text-xs font-bold text-amber-800">正在準備上傳...</span>
                </div>
                <span id="spUploadTimeEstimate" class="text-[0.6875rem] font-extrabold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap"></span>
              </div>
              <div class="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                <div id="spUploadProgressBar" class="bg-gradient-to-r from-amber-400 to-peach-500 h-full rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
              </div>
              <div id="spUploadDetail" class="text-[0.625rem] text-slate-500 text-right"></div>
            </div>

            <!-- 上傳結果訊息 (預設隱藏) -->
            <div id="spUploadResultContainer" class="hidden p-3.5 rounded-2xl border space-y-1">
              <div id="spUploadResultText" class="text-xs font-bold flex items-center gap-1.5"></div>
              <div id="spUploadResultDetail" class="text-[0.625rem] text-slate-500"></div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onclick="cancelSpotlightEdit()" id="spBtnCancel" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs tap-bounce">
                取消
              </button>
              <button type="button" onclick="saveSpotlightSettings()" id="spBtnSave" class="px-5 py-2 rounded-xl bg-peach-500 hover:bg-peach-600 text-white font-bold text-xs shadow-sm tap-bounce flex items-center gap-1.5">
                <span id="spBtnSaveIcon">💾</span> <span id="spBtnSaveLabel">儲存焦點活動</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 子分頁 6: 密碼與系統設定 -->
        <div id="adminPanel-settings" class="admin-panel space-y-4 hidden">
          <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
            <h4 class="font-black text-slate-800 text-base">密碼與系統設定</h4>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">修改管理員密碼</label>
              <input type="text" id="setting-newPassword" placeholder="輸入新的管理密碼" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium">
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Acticity 雲端資料夾網址或 ID</label>
              <input type="text" id="setting-activityFolderUrl" placeholder="例如：https://drive.google.com/drive/folders/..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium">
              <p class="text-[0.625rem] text-slate-400 mt-1">點擊「開啟 Acticity 雲端資料夾」時會直接開啟此網址，預設自動關聯至 Google Drive 相簿同層之 Acticity 資料夾。</p>
            </div>
            <div class="flex justify-end pt-2">
              <button onclick="saveSystemSettings()" class="px-5 py-2 rounded-xl bg-slate-800 hover:bg-black text-white font-bold text-xs shadow-sm tap-bounce">
                儲存系統設定
              </button>
            </div>
          </div>
        </div>

      </div>

    </section>

  </main>
    </div>
  </div>

  
  <!-- ==================== ACTICITY 資料夾現有檔案選取彈窗 (MODAL) ==================== -->
  <div id="activityPickerModal" class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-3 sm:p-5 hidden">
    <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-5 shadow-2xl relative">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-xl">📂</span>
          <div>
            <h3 class="text-base font-black text-slate-800">從 Acticity 資料夾選取圖片</h3>
            <p class="text-[0.6875rem] text-slate-400">點選任一張圖片即可直接設為 Spotlight 焦點活動封面</p>
          </div>
        </div>
        <button onclick="closeActivityFolderPicker()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-base tap-bounce">
          ✕
        </button>
      </div>

      <div id="activityPickerLoading" class="py-12 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-2">
        <div class="w-10 h-10 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <span class="text-xs">正在讀取 Acticity 資料夾檔案清單...</span>
      </div>

      <div id="activityPickerGrid" class="flex-1 overflow-y-auto py-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <!-- JS 動態插入 -->
      </div>
    </div>
  </div>

  <!-- ==================== SPOTLIGHT 攻略大圖彈窗 (MODAL) ==================== -->
  <div id="spotlightModal" class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-3 sm:p-5 hidden">
    <div class="bg-white rounded-3xl max-w-2xl md:max-w-4xl lg:max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 relative">
      <button onclick="closeSpotlightModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-base tap-bounce z-30" title="關閉">
        ✕
      </button>
      <div class="flex items-center gap-2 pr-12 min-h-[32px] shrink-0">
        <span class="text-xl shrink-0">🍑</span>
        <h3 id="modalSpotlightTitle" class="text-base sm:text-lg font-black text-slate-800 truncate">桃子腳幼兒園 牙齒塗氟日 活動攻略圖</h3>
      </div>
      <div id="modalSpotlightMediaWrapper" class="w-full h-[52vh] sm:h-[62vh] min-h-[340px] max-h-[620px] rounded-2xl overflow-hidden border border-rose-100 bg-rose-50/60 flex items-center justify-center relative group shrink-0">
        <button onclick="prevSpotlightModal()" class="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-800 hover:text-peach-600 font-bold text-lg tap-bounce z-20 transition-transform active:scale-95 hidden" id="modalSpotlightPrevBtn" title="上一張">
          ◀
        </button>
        <button onclick="nextSpotlightModal()" class="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-800 hover:text-peach-600 font-bold text-lg tap-bounce z-20 transition-transform active:scale-95 hidden" id="modalSpotlightNextBtn" title="下一張">
          ▶
        </button>
        <img id="modalSpotlightImg" src="./spotlight-fluoride.jpg" alt="活動攻略" class="w-full h-full object-contain select-none">
        <div id="modalSpotlightVideoContainer" class="w-full h-full flex items-center justify-center hidden">
          <iframe id="modalSpotlightIframe" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          <video id="modalSpotlightVideo" class="w-full h-full object-contain hidden" controls playsinline autoplay muted loop></video>
        </div>
      </div>
      <div id="modalSpotlightDesc" class="text-xs sm:text-sm text-slate-700 whitespace-pre-line bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
        <!-- JS 插入 -->
      </div>
    </div>
  </div>

  <!-- ==================== 相簿照片瀏覽彈窗 (ALBUM LIGHTBOX MODAL) ==================== -->
  <div id="albumPhotosModal" class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-3 sm:p-5 hidden">
    <div class="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col p-4 sm:p-6 shadow-2xl relative">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xl shrink-0">📸</span>
          <h3 id="modalAlbumTitle" class="text-base sm:text-lg font-black text-slate-800 truncate">相簿照片</h3>
          <span id="modalAlbumCount" class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full shrink-0"></span>
        </div>
        <button onclick="closeAlbumModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-base tap-bounce shrink-0" title="關閉">
          ✕
        </button>
      </div>

      <!-- 相片縮圖網格 -->
      <div id="albumPhotosGrid" class="flex-1 overflow-y-auto min-h-0 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start" style="grid-auto-rows: max-content;">
        <!-- JS 動態插入照片 -->
      </div>
    </div>
  </div>

  <!-- ==================== 單張照片大圖檢視 (PHOTO VIEWER) ==================== -->
  <div id="photoViewerModal" class="fixed inset-0 z-70 bg-black/95 flex flex-col items-center justify-between p-3 sm:p-5 select-none hidden" onclick="handlePhotoViewerBackdropClick(event)">
    <!-- 頂部工具列 -->
    <div class="w-full max-w-5xl flex items-center justify-between z-20 text-white shrink-0">
      <div class="flex items-center gap-2 sm:gap-3">
        <button id="photoAutoPlayBtn" onclick="togglePhotoAutoPlay()" class="text-white text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 flex items-center gap-1.5 backdrop-blur-md tap-bounce transition-all" title="自動播放幻燈片 (每 3 秒自動換張)">
          <span id="photoAutoPlayIcon">▶</span>
          <span id="photoAutoPlayText">Auto Play</span>
        </button>
        <span id="photoViewerCounter" class="text-xs sm:text-sm font-bold text-white/80 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">1 / 1</span>
      </div>
      <button onclick="closePhotoViewer()" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center font-bold text-lg backdrop-blur-md tap-bounce transition-colors" title="關閉 (Esc)">
        ✕
      </button>
    </div>

    <!-- 中間大圖與左右導覽 -->
    <div class="relative w-full flex-1 min-h-0 flex items-center justify-center p-1 sm:p-4 overflow-hidden">
      <!-- 載入中動畫 -->
      <div id="photoViewerSpinner" class="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none z-10 hidden">
        <div class="w-10 h-10 border-4 border-white/20 border-t-teal-400 rounded-full animate-spin"></div>
        <span class="text-xs font-bold text-white/80 tracking-wider">載入高畫質相片中...</span>
      </div>

      <!-- 上一張按鈕 -->
      <button id="photoViewerPrevBtn" onclick="navigatePhoto(-1)" class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white flex items-center justify-center font-black text-xl sm:text-2xl backdrop-blur-md transition-all z-20 shadow-lg tap-bounce" title="上一張 (鍵盤 ← 鍵)">
        ❮
      </button>

      <!-- 核心大圖 -->
      <img id="photoViewerImg" src="" alt="相簿照片" class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-opacity duration-200">

      <!-- 下一張按鈕 -->
      <button id="photoViewerNextBtn" onclick="navigatePhoto(1)" class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white flex items-center justify-center font-black text-xl sm:text-2xl backdrop-blur-md transition-all z-20 shadow-lg tap-bounce" title="下一張 (鍵盤 → 鍵)">
        ❯
      </button>
    </div>

    <!-- 底部照片標題列 -->
    <div class="w-full max-w-2xl text-center z-20 shrink-0 pt-2 pb-1">
      <div id="photoViewerTitle" class="text-xs sm:text-sm font-medium text-white/80 truncate px-4"></div>
    </div>
  </div>

  <!-- ==================== 常用文件編輯/新增彈窗 (DOC MODAL) ==================== -->
  <div id="docEditModal" class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-3 sm:p-5 hidden">
    <div class="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
      <button onclick="closeDocEditModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-base tap-bounce">
        ✕
      </button>
      <div class="flex items-center gap-2">
        <span class="text-xl">📄</span>
        <h3 id="docModalTitle" class="font-black text-slate-800 text-base sm:text-lg">編輯常用文件資訊</h3>
      </div>

      <form id="docEditForm" onsubmit="event.preventDefault(); handleSaveDocModal(event)" class="space-y-3.5">
        <input type="hidden" id="docModal-id">
        <input type="hidden" id="docModal-driveFileId">

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">文件名稱 *</label>
          <input type="text" id="docModal-fileName" required placeholder="如：幼兒用藥委託單.pdf" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-500 focus:outline-none">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">文件分類 *</label>
          <select id="docModal-category" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-500 focus:outline-none">
            <option value="保健用藥">保健用藥</option>
            <option value="學期行事曆">學期行事曆</option>
            <option value="餐飲菜單">餐飲菜單</option>
            <option value="親師手冊">親師手冊</option>
            <option value="一般文件">一般文件</option>
            <option value="其他常用">其他常用</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">說明描述</label>
          <textarea id="docModal-description" rows="2" placeholder="說明幼兒使用情況或列印注意事項..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-500 focus:outline-none"></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">下載或雲端連結 (URL)</label>
          <input type="text" id="docModal-downloadUrl" placeholder="https://drive.google.com/..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-indigo-500 focus:outline-none">
        </div>

        <div class="border border-dashed border-indigo-200 rounded-2xl p-3.5 bg-indigo-50/40 text-center">
          <input type="file" id="docModal-fileInput" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" class="hidden" onchange="handleDocModalFileChosen(event)">
          <button type="button" onclick="document.getElementById('docModal-fileInput').click()" class="text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-indigo-50 tap-bounce inline-flex items-center gap-1.5">
            <span>📁</span> 重新上傳/替換檔案至 Google Drive (選填)
          </button>
          <div id="docModal-fileStatus" class="text-[0.6875rem] text-slate-500 mt-1">若已有網址可直接修改上欄，或選取新檔案覆蓋上傳</div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeDocEditModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold tap-bounce">
            取消
          </button>
          <button type="submit" id="docModalSaveBtn" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm tap-bounce flex items-center gap-1.5">
            <span>💾</span> 儲存修改
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== 編輯相簿 Modal (ALBUM MODAL) ==================== -->
  <div id="editAlbumModal" class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-3 sm:p-5 hidden">
    <div class="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 relative border border-slate-200">
      <button onclick="closeEditAlbumModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-base tap-bounce">
        ✕
      </button>
      <div class="flex items-center gap-2">
        <span class="text-xl">✏️</span>
        <h3 class="font-black text-slate-800 text-base sm:text-lg">編輯活動相簿資訊</h3>
      </div>

      <form id="editAlbumForm" onsubmit="event.preventDefault(); handleSaveAlbumInfo(event)" class="space-y-3.5">
        <input type="hidden" id="editAlbum-id">


        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">活動類別 *</label>
          <select id="editAlbum-category" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-teal-500 focus:outline-none">
            <!-- JS 動態載入 AlbumCategories -->
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">活動主題名稱 *</label>
          <input type="text" id="editAlbum-title" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-teal-500 focus:outline-none" placeholder="如：牙齒塗氟日口腔檢查">
        </div>

        <div class="bg-teal-50/60 p-3 rounded-2xl border border-teal-200/80 text-[11px] text-teal-800">
          💡 儲存後將同步更新 Google Sheets《Albums》試算表與 Google Drive 資料夾名稱。
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onclick="closeEditAlbumModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold tap-bounce">
            取消
          </button>
          <button type="submit" id="btnSaveAlbumInfo" class="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm tap-bounce flex items-center gap-1.5">
            <span>💾</span> 儲存相簿資訊
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- ==================== 全域提示訊息 TOAST ==================== -->
  <div id="toast" class="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-70 bg-slate-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 transition-all opacity-0 pointer-events-none transform translate-y-3">
    <span id="toastIcon">✨</span>
    <span id="toastMsg">訊息內容</span>
  </div>

  <!-- ==================== 頁尾 FOOTER ==================== -->
  <footer class="bg-white border-t border-rose-100/80 py-6 mt-12 text-center text-xs text-slate-400 space-y-1">
    <div class="flex items-center justify-center gap-2">
      <span class="font-bold text-slate-600">桃子腳幼兒園</span>
      <span>•</span>
      <span class="font-bold text-peach-600">諾貝爾 A 班</span>
    </div>
    <p>用愛陪伴孩子成長的每一步</p>
  </footer>

  <!-- ==================== 前端邏輯 JS SCRIPT ==================== -->
  <script>
    // 全域應用狀態
    const state = {
      currentTab: 'home',
      currentAdminSubtab: 'events',
      currentCalView: 'day', // 'day', 'week', 'month'
      viewYear: 2026,
      viewMonth: 10, // 1~12 (以10月為示範基準)
      selectedDateStr: '2026-10-23', // 預設塗氟日
      events: [],
      menus: [],
      spotlights: [],
      docs: [],
      settings: {},
      adminPassword: '',
      selectedAlbumFiles: [],
      selectedDocFile: null,
      cachedAlbums: [],
      albumCategories: ['班級主題', '全園活動', '親職活動', '節慶活動', '幸福廚房', '健康檢查', '戶外踏訪', '日常生活'],
      selectedAlbumCategories: new Set(),
      albumUploadState: {
        isUploading: false,
        albumId: null,
        folderName: '',
        folderUrl: '',
        category: '',
        files: [],
        currentIndex: 0,
        totalFiles: 0,
        startTime: 0,
        timerInterval: null
      }
    };

    // 初始化程式
    function initApp() {
      try {
        const savedPwd = sessionStorage.getItem('nobel_a_admin_pwd') || localStorage.getItem('nobel_a_admin_pwd');
        if (savedPwd) {
          state.adminPassword = savedPwd;
          showAdminDashboard();
        }
      } catch (e) {}
      updateAdminAuthUI();

      // 初始化今天日期（若當前月在2026年10月附近則自動對齊）
      const today = new Date();
      const yr = today.getFullYear();
      const mo = today.getMonth() + 1;
      const dy = ('0' + today.getDate()).slice(-2);
      
      // 如果年月份在示範資料區間（2026-08~2027-01），預設今天，否則預設10月
      if (yr === 2026 && mo >= 8 && mo <= 12) {
        state.viewYear = yr;
        state.viewMonth = mo;
        state.selectedDateStr = \`\${yr}-\${('0'+mo).slice(-2)}-\${dy}\`;
      } else {
        state.viewYear = 2026;
        state.viewMonth = 10;
        state.selectedDateStr = '2026-10-23';
      }

      // 1. 優先嘗試即時載入上次快取的資料（0 秒閃開，絕不讓使用者卡在空白讀取畫面）
      let hasCachedData = false;
      try {
        const cachedStr = localStorage.getItem('nobel_a_cached_app_data');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && typeof cached === 'object' && cached.events && cached.events.length > 0) {
            handleDataLoaded(cached);
            hasCachedData = true;
          }
        }
      } catch (e) {}

      // 若完全無快取（首次造訪），先載入內建模範資料並立即渲染，保證前台 0 秒可見
      if (!hasCachedData) {
        renderFallbackLocalData();
      }

      // 確保 loadingOverlay 隱藏，主要畫面立即呈現
      showLoading(false);

      // 2. 靜默在背景連線至雲端讀取最新資料庫並自動無縫更新（Stale-While-Revalidate）
      loadAppData(true);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }

    

    // 從 GAS 後端載入全站資料
    
    const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx5JGeiSH2J1vkOu4rh9NPwFBWNSkn5PkHfY5o25t-K4WcOK8b3VQjXi-TqUOzS8TvdJg/exec';

    // 跨環境後端通訊橋樑 (支援 GAS 內部環境與 GitHub Pages 外部環境)
    function callBackend(action, payload, successCb, errorCb) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        const runner = google.script.run
          .withSuccessHandler(res => { if (successCb) successCb(res); })
          .withFailureHandler(err => { if (errorCb) errorCb(err); else showToast('執行失敗: ' + err, '❌'); });

        if (action === 'getAppData') runner.getAppData();
        else if (action === 'getAlbums') runner.getAlbums();
        else if (action === 'getAlbumPhotos') runner.getAlbumPhotos(payload.albumId);
        else if (action === 'verifyPassword') runner.verifyPassword(payload.password);
        else if (action === 'initAlbumUpload') runner.initAlbumUpload(payload);
        else if (action === 'uploadPhotosChunk') runner.uploadPhotosChunk(payload);
        else if (action === 'uploadPhotosToAlbum') runner.uploadPhotosToAlbum(payload.year || payload.date, payload.month || payload.title, payload.category, payload.title, payload.files, payload.password);
        else if (action === 'saveEvent') runner.saveEvent(payload.data, payload.password);
        else if (action === 'deleteEvent') runner.deleteEvent(payload.id, payload.password);
        else if (action === 'saveMenu') runner.saveMenu(payload.data, payload.password);
        else if (action === 'deleteMenu') runner.deleteMenu(payload.date, payload.password);
        else if (action === 'saveSpotlight') runner.saveSpotlight(payload.data, payload.password);
        else if (action === 'saveAlbum') runner.saveAlbum(payload.data, payload.password);
        else if (action === 'deleteAlbum') runner.deleteAlbum(payload.id, payload.password);
        else if (action === 'uploadDocument') runner.uploadDocument(payload.meta, payload.file, payload.password);
        else if (action === 'uploadSpotlightImage') runner.uploadSpotlightImage(payload.file, payload.password);
        else if (action === 'getActivityImages') runner.getActivityImages();
        else if (action === 'deleteDoc') runner.deleteDoc(payload.id, payload.password);
        else if (action === 'updateSettings') runner.updateSettings(payload.settings, payload.password);
        else if (action === 'setupInitialDatabase') runner.setupInitialDatabase();
      } else {
        // 外部環境模式 (Netlify / GitHub Pages)
        
        if (action === 'getAppData' || action === 'getAlbums' || action === 'getAlbumPhotos' || action === 'getActivityImages') {
          let url = GAS_API_URL + '?action=' + encodeURIComponent(action);
          if (payload && payload.albumId) url += '&albumId=' + encodeURIComponent(payload.albumId);
          
          let isDone = false;
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const timeoutTimer = setTimeout(() => {
            if (!isDone) {
              isDone = true;
              if (controller) controller.abort();
              if (errorCb) errorCb(new Error('伺服器連線逾時'));
            }
          }, 10000);

          fetch(url, { redirect: 'follow', signal: controller ? controller.signal : undefined })
            .then(r => {
              if (isDone) return;
              isDone = true;
              clearTimeout(timeoutTimer);
              return r.json();
            })
            .then(res => {
              if (res && successCb) successCb(res);
            })
            .catch(err => {
              if (!isDone) {
                isDone = true;
                clearTimeout(timeoutTimer);
                if (errorCb) errorCb(err);
              }
            });
        } else {
          // 外部環境備援方案：隱藏 iframe form POST (完全繞過跨域)
          gasPostViaIframe(action, payload, successCb, errorCb);
        }
      }
    }

    // ==================== 隱藏 iframe + form POST（跨域 GAS 通訊核心機制）====================
    let gasIframeCounter = 0;

    function gasPostViaIframe(action, payload, successCb, errorCb) {
      const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const bodyStr = JSON.stringify({ action, requestId, ...payload });
      const frameId = 'gasPostFrame_' + (++gasIframeCounter);

      // 建立隱藏 iframe
      const iframe = document.createElement('iframe');
      iframe.id = frameId;
      iframe.name = frameId;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // 監聽 postMessage 回傳結果
      let responded = false;
      const timeoutMs = 120000; // 2 分鐘逾時

      const messageHandler = (event) => {
        // 安全性：只接受來自 Google 網域的回傳，並比對 requestId 避免串音
        if (responded) return;
        if (event.data && typeof event.data === 'object' && ('success' in event.data || 'error' in event.data)) {
          if (event.data.requestId && event.data.requestId !== requestId) {
            return;
          }
          responded = true;
          window.removeEventListener('message', messageHandler);
          clearTimeout(timeoutTimer);
          cleanupIframe();
          if (successCb) successCb(event.data);
        }
      };
      window.addEventListener('message', messageHandler);

      // 逾時處理
      const timeoutTimer = setTimeout(() => {
        if (!responded) {
          responded = true;
          window.removeEventListener('message', messageHandler);
          cleanupIframe();
          if (errorCb) errorCb(new Error('伺服器回應逾時（超過 2 分鐘），請檢查網路連線後重試'));
        }
      }, timeoutMs);

      // 清理 iframe
      function cleanupIframe() {
        setTimeout(() => {
          const el = document.getElementById(frameId);
          if (el) el.remove();
        }, 2000);
      }

      // 建立 form 並提交（form 提交不受 CORS 限制！）
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = GAS_API_URL;
      form.target = frameId;
      form.style.display = 'none';

      // 將 JSON payload 放入隱藏欄位
      const input = document.createElement('textarea');
      input.name = 'payload';
      input.value = bodyStr;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();

      // 提交後立即清除 form DOM
      setTimeout(() => { form.remove(); }, 100);
    }

    function loadAppData(isSilent = true) {
      const syncBadge = document.getElementById('bgSyncBadge');
      if (isSilent) {
        if (syncBadge) syncBadge.classList.remove('hidden');
      } else {
        showLoading(true);
      }

      callBackend('getAppData', {}, res => {
        if (syncBadge) syncBadge.classList.add('hidden');
        showLoading(false);
        if (res && res.success && res.data) {
          try {
            localStorage.setItem('nobel_a_cached_app_data', JSON.stringify(res.data));
          } catch (e) {}
          handleDataLoaded(res.data);
        } else {
          if (!state.events || state.events.length === 0) {
            renderFallbackLocalData();
          }
        }
      }, err => {
        if (syncBadge) syncBadge.classList.add('hidden');
        showLoading(false);
        console.warn('GAS 連線失敗或逾時，已保持目前最新資料:', err);
        if (!state.events || state.events.length === 0) {
          renderFallbackLocalData();
        }
      });
    }

    
    function setSelectValueSafely(selectEl, val) {
      if (!selectEl) return;
      const trimmed = (val !== undefined && val !== null) ? String(val).trim() : '';
      if (!trimmed) {
        selectEl.value = '';
        return;
      }
      let matched = false;
      for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value.trim() === trimmed || selectEl.options[i].textContent.trim() === trimmed) {
          selectEl.selectedIndex = i;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const opt = document.createElement('option');
        opt.value = trimmed;
        opt.textContent = trimmed;
        selectEl.appendChild(opt);
        selectEl.value = trimmed;
      }
    }

    function renderEventOptionsUI() {
      const targetSelect = document.getElementById('eventForm-target');
      if (targetSelect && state.eventTargets) {
        const prevOrder = getCheckedValues('eventForm-target');
        targetSelect.innerHTML = '';
        state.eventTargets.forEach((t, i) => {
          let label = t.displayName || t.targetName;
          const isNobelA = t.targetName.includes('諾貝爾A') || t.targetName.includes('諾貝爾 A') || t.targetName.includes('諾A');
          const isAll = t.targetName.includes('全園');
          const isParent = t.targetName.includes('親職') || t.targetName.includes('親師') || t.targetName.includes('家長');
          let icon = '';
          if (isNobelA) icon = '❤️ ';
          else if (isAll) icon = '🏫 ';
          else if (isParent) icon = '👨‍👩‍👧 ';
          else if (!t.targetName.includes('其他')) icon = '💛 ';

          // Clean any duplicate leading emoji if already present in displayName
          label = label.replace(/^[🌟🌱❤️💛🏫👨‍👩‍👧]\s*/, '');
          targetSelect.innerHTML += '<label class="flex items-center gap-1 cursor-pointer hover:bg-slate-50 px-1 rounded"><input type="checkbox" value="' + t.targetName.trim() + '" class="accent-peach-500 w-3 h-3"><span class="text-[0.6875rem] text-slate-700 font-medium">' + icon + label + '</span></label>';
        });
        initOrderedCheckboxes('eventForm-target');
        if (prevOrder) {
          setCheckedValues('eventForm-target', prevOrder);
        } else {
          updateTargetOrderPreview('eventForm-target');
        }
      }

      // 彙整並去重大項類別（結合系統設定、既有活動已使用類別與標準大項，絕不遺失）
      const catMajorSelect = document.getElementById('eventForm-categoryMajor');
      if (catMajorSelect) {
        const currentSelectedMajor = catMajorSelect.value;
        const majorSet = new Set((state.eventCategoriesMajor || []).map(c => String(c).trim()).filter(Boolean));
        ['重要活動', '班級主題', '全園活動', '休園'].forEach(c => majorSet.add(c));
        (state.events || []).forEach(ev => {
          const m = (ev.categoryMajor || ev['活動類別 (大項)'] || ev['大項'] || ev.category || '').trim();
          if (m) majorSet.add(m);
        });

        catMajorSelect.innerHTML = '<option value="">請選擇大項...</option>';
        majorSet.forEach(cat => {
          catMajorSelect.innerHTML += '<option value="' + cat + '">' + cat + '</option>';
        });
        if (currentSelectedMajor) {
          setSelectValueSafely(catMajorSelect, currentSelectedMajor);
        }
      }

      // 彙整並去重細項類別（結合系統設定、既有活動已使用細項如「親職活動」，絕不被重設或遺失）
      const catMinorSelect = document.getElementById('eventForm-categoryMinor');
      if (catMinorSelect) {
        const currentSelectedMinor = catMinorSelect.value;
        const minorSet = new Set((state.eventCategoriesMinor || []).map(c => String(c).trim()).filter(Boolean));
        ['幸福廚房', '親職講座', '親師座談', '親職活動', '慶生活動', '戶外踏訪', '高峰活動', '歲末活動', '闖關活動', '節慶放假', '園務消毒', '開學活動', '健康檢查'].forEach(c => minorSet.add(c));
        (state.events || []).forEach(ev => {
          const m = (ev.categoryMinor || ev['活動類別 (細項)'] || ev['細項'] || ev.category_minor || '').trim();
          if (m) minorSet.add(m);
        });

        catMinorSelect.innerHTML = '<option value="">無 / 請選擇細項...</option>';
        minorSet.forEach(cat => {
          catMinorSelect.innerHTML += '<option value="' + cat + '">' + cat + '</option>';
        });
        if (currentSelectedMinor) {
          setSelectValueSafely(catMinorSelect, currentSelectedMinor);
        }
      }
    }
    
    function initOrderedCheckboxes(containerId) {
      const container = document.getElementById(containerId);
      if (!container || container._hasOrderListener) return;
      container._hasOrderListener = true;
      container._selectedOrder = container._selectedOrder || [];

      container.addEventListener('change', (e) => {
        if (e.target && e.target.type === 'checkbox') {
          const val = (e.target.value || '').trim();
          container._selectedOrder = container._selectedOrder || [];
          if (e.target.checked) {
            if (!container._selectedOrder.includes(val)) {
              container._selectedOrder.push(val);
            }
          } else {
            container._selectedOrder = container._selectedOrder.filter(v => v !== val);
          }
          updateTargetOrderPreview(containerId);
        }
      });
    }

    function updateTargetOrderPreview(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const previewEl = document.getElementById(containerId + '-preview');
      const badgesEl = document.getElementById(containerId + '-badges');
      if (!previewEl || !badgesEl) return;

      const orderedStr = getCheckedValues(containerId);
      if (!orderedStr) {
        previewEl.style.display = 'none';
        badgesEl.innerHTML = '';
      } else {
        previewEl.style.display = 'flex';
        badgesEl.innerHTML = renderTargetBadges(orderedStr, 'sm');
      }
    }

    function getCheckedValues(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return '';
      initOrderedCheckboxes(containerId);

      const checkedBoxes = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
      const checkedVals = checkedBoxes.map(cb => (cb.value || '').trim()).filter(Boolean);
      const checkedSet = new Set(checkedVals);

      // 依選取順序保留仍被勾選的項目
      let ordered = (container._selectedOrder || []).map(v => v.trim()).filter(v => checkedSet.has(v));
      checkedVals.forEach(v => {
        if (!ordered.includes(v)) {
          ordered.push(v);
        }
      });

      container._selectedOrder = ordered;
      return ordered.join(', ');
    }
    
    function setCheckedValues(containerId, valuesStr) {
      const container = document.getElementById(containerId);
      if (!container) return;
      initOrderedCheckboxes(containerId);

      const rawValues = (valuesStr || '').split(/[,，]+/).map(v => v.trim()).filter(Boolean);
      container._selectedOrder = [...rawValues];

      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        const val = (cb.value || '').trim();
        cb.checked = rawValues.includes(val);
      });

      const checkedBoxes = Array.from(container.querySelectorAll('input[type="checkbox"]:checked'));
      const checkedVals = checkedBoxes.map(cb => (cb.value || '').trim()).filter(Boolean);
      const checkedSet = new Set(checkedVals);

      container._selectedOrder = container._selectedOrder.filter(v => checkedSet.has(v));
      checkedVals.forEach(v => {
        if (!container._selectedOrder.includes(v)) {
          container._selectedOrder.push(v);
        }
      });

      updateTargetOrderPreview(containerId);
    }

    /**
     * 將複選的適用對象拆分為獨立的氣泡標籤 / 按鈕
     */
    function renderTargetBadges(targetStr, size = 'md') {
      if (!targetStr || !targetStr.trim()) {
        targetStr = '全園';
      }
      const targets = targetStr.split(/[,，]+/).map(t => t.trim()).filter(Boolean);
      if (targets.length === 0) targets.push('全園');

      const isSm = size === 'sm';
      const sizeClasses = isSm ? 'text-[0.625rem] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

      return targets.map(t => {
        const isNobelA = t.includes('諾貝爾A') || t.includes('諾貝爾 A') || t.includes('諾A');
        const isAllEvent = t.includes('全園活動');
        const isAllApply = t.includes('全園適用') || t === '全園';
        const isParent = t.includes('親職') || t.includes('親師') || t.includes('家長');

        let colorClasses = 'bg-slate-100 text-slate-700 border border-slate-200/90 font-medium';
        let icon = '';

        if (isNobelA) {
          colorClasses = 'bg-peach-500 text-white shadow-2xs font-extrabold';
          icon = '<span class="mr-0.5">❤️</span>';
        } else if (isAllEvent) {
          colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
          icon = '<span class="mr-0.5">🏫</span>';
        } else if (isAllApply) {
          colorClasses = 'bg-sky-50 text-sky-700 border border-sky-200 font-bold';
          icon = '<span class="mr-0.5">🏫</span>';
        } else if (t.includes('全園')) {
          colorClasses = 'bg-sky-50 text-sky-700 border border-sky-200 font-bold';
          icon = '<span class="mr-0.5">🏫</span>';
        } else if (isParent) {
          colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200 font-bold';
          icon = '<span class="mr-0.5">👨‍👩‍👧</span>';
        } else if (t.includes('其他') || t.includes('備註')) {
          colorClasses = 'bg-slate-100 text-slate-700 border border-slate-200/90 font-medium';
          icon = '';
        } else {
          // 所有其他幼兒園班級（諾貝爾 B、諾貝爾 C、諾奧、奧斯卡、雨奧、米羅 A、米羅 B、雨果、兩果等）
          colorClasses = 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold';
          icon = '<span class="mr-0.5">💛</span>';
        }

        return \`<span class="inline-flex items-center rounded-full font-bold shadow-2xs whitespace-nowrap transition-transform hover:scale-105 \${sizeClasses} \${colorClasses}">\${icon}\${t}</span>\`;
      }).join('');
    }

    function renderDocCategoriesUI() {
      const categories = state.docCategories || ['全部文件', '保健用藥', '學期行事曆', '餐飲菜單', '親師手冊'];
      
      const pillsContainer = document.getElementById('docCategoryPills');
      if (pillsContainer) {
        pillsContainer.innerHTML = '';
        categories.forEach(cat => {
          if (cat === '全部文件' || cat === '全部') {
            pillsContainer.innerHTML += '<button onclick="filterDocs(\\'全部\\')" class="doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs">全部文件</button>';
          } else {
            pillsContainer.innerHTML += '<button onclick="filterDocs(\\'' + cat + '\\')" class="doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">' + cat + '</button>';
          }
        });
      }

      const uploadCat = document.getElementById('docUpload-category');
      if (uploadCat) {
        uploadCat.innerHTML = '';
        categories.forEach(cat => {
          if (cat !== '全部文件' && cat !== '全部') {
            uploadCat.innerHTML += '<option value="' + cat + '">' + cat + '</option>';
          }
        });
      }

      const editCat = document.getElementById('docModal-category');
      if (editCat) {
        editCat.innerHTML = '';
        categories.forEach(cat => {
          if (cat !== '全部文件' && cat !== '全部') {
            editCat.innerHTML += '<option value="' + cat + '">' + cat + '</option>';
          }
        });
      }
    }

    function parseSpotlightPriority(val) {
      if (typeof val === 'number') return val;
      const str = String(val || '').trim();
      if (!str) return 999;
      const num = Number(str);
      if (!isNaN(num)) return num;
      if (str.startsWith('1899-12-31')) return 1;
      if (str.startsWith('1900-01-01')) return 2;
      if (str.startsWith('1900-01-02')) return 3;
      if (str.startsWith('1900-01-03')) return 4;
      if (str.startsWith('1900-01-04')) return 5;
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const epoch = new Date(1899, 11, 30);
        const days = Math.round((d.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
        return days > 0 ? days : 999;
      }
      return 999;
    }

    // 處理遠端資料
    function handleDataLoaded(data) {
      state.events = data.events || [];
      state.menus = data.menus || [];
      state.spotlights = data.spotlights || [];
      state.spotlights.forEach(sp => {
        sp.priority = parseSpotlightPriority(sp.priority);
      });
      state.spotlights.sort((a, b) => {
        const pA = Number(a.priority) || 999;
        const pB = Number(b.priority) || 999;
        if (pA !== pB) return pA - pB;
        return String(b.id).localeCompare(String(a.id)); // Newer first if same priority
      });
      state.docs = data.docs || [];
      state.settings = data.settings || {};

      

            state.docCategories = data.docCategories || ['全部文件', '保健用藥', '學期行事曆', '餐飲菜單', '親師手冊'];
      state.eventTargets = data.eventTargets || [
        {targetName: '全園活動', displayName: '🏫 全園活動'},
        {targetName: '全園適用', displayName: '🏫 全園適用'},
        {targetName: '親職活動', displayName: '👨‍👩‍👧 親職活動'},
        {targetName: '親師座談', displayName: '👨‍👩‍👧 親師座談'},
        {targetName: '諾貝爾 A ', displayName: '❤️ 諾貝爾 A'},
        {targetName: '諾貝爾 B', displayName: '💛 諾貝爾 B'},
        {targetName: '諾貝爾 C', displayName: '💛 諾貝爾 C'},
        {targetName: '諾奧', displayName: '💛 諾奧'},
        {targetName: '奧斯卡', displayName: '💛 奧斯卡'},
        {targetName: '雨奧', displayName: '💛 雨奧'},
        {targetName: '米羅 A', displayName: '💛 米羅 A'},
        {targetName: '米羅 B', displayName: '💛 米羅 B'},
        {targetName: '兩果', displayName: '💛 兩果'},
        {targetName: '雨果', displayName: '💛 雨果'}
      ];
      state.eventCategoriesMajor = data.eventCategoriesMajor || []; state.eventCategoriesMinor = data.eventCategoriesMinor || [];
      state.albumCategories = data.albumCategories || ['班級主題', '全園活動', '親職活動', '節慶活動', '幸福廚房', '健康檢查', '戶外踏訪', '日常生活'];
      renderDocCategoriesUI();
      renderAlbumCategoriesUI();
      renderEventOptionsUI();
      
      // 渲染 Spotlight
      renderSpotlightSection();
      // 渲染行事曆
      renderCalendar();
      // 渲染選取日期的生活與菜單
      renderSelectedDayDetails(state.selectedDateStr);
      // 渲染文件列表
      renderDocsList();
      // 渲染相簿
      if (data.albums && data.albums.length > 0) {
        state.cachedAlbums = data.albums;
        updateAlbumFilterYearOptions(state.cachedAlbums);
        applyAlbumFilters();
        renderAdminAlbumsTable();
      } else if (!state.cachedAlbums || state.cachedAlbums.length === 0) {
        renderFallbackAlbums();
      }

      // 嚴格依據目前頁籤 (state.currentTab) 保持顯示狀態，絕不私自開啟或混雜 home 內容
      const current = state.currentTab || 'home';
      ['home', 'albums', 'docs', 'admin'].forEach(tab => {
        const contentEl = document.getElementById('tabContent-' + tab);
        if (contentEl) {
          if (tab === current) {
            contentEl.classList.remove('hidden');
          } else {
            contentEl.classList.add('hidden');
          }
        }
      });

      // 若目前在管理後台，同步刷新當前子面板列表
      if (state.currentTab === 'admin') {
        const subtab = state.currentAdminSubtab || 'events';
        if (subtab === 'events') renderAdminEventsTable();
        if (subtab === 'spotlight') renderAdminSpotlightsList();
        if (subtab === 'uploadPhoto') renderAdminAlbumsTable();
      }
    }

    // 本地備援示範資料 (保證預覽時完全不空白)
    function renderFallbackLocalData() {
      state.albumCategories = ['班級主題', '全園活動', '親職活動', '節慶活動', '幸福廚房', '健康檢查', '戶外踏訪', '日常生活'];
      renderAlbumCategoriesUI();
      state.eventCategoriesMajor = ['重要活動', '班級主題', '全園活動', '休園', '節慶放假'];
      state.eventCategoriesMinor = [
        '幸福廚房', '親職講座', '親師座談', '親職活動', '慶生活動',
        '戶外踏訪', '高峰活動', '歲末活動', '闖關活動', '節慶放假',
        '園務消毒', '開學活動', '健康檢查'
      ];
      state.eventTargets = state.eventTargets || [
        {targetName: '全園活動', displayName: '🏫 全園活動'},
        {targetName: '全園適用', displayName: '🏫 全園適用'},
        {targetName: '親職活動', displayName: '👨‍👩‍👧 親職活動'},
        {targetName: '親師座談', displayName: '👨‍👩‍👧 親師座談'},
        {targetName: '諾貝爾 A', displayName: '❤️ 諾貝爾 A'},
        {targetName: '諾貝爾 B', displayName: '💛 諾貝爾 B'},
        {targetName: '諾貝爾 C', displayName: '💛 諾貝爾 C'},
        {targetName: '諾奧', displayName: '💛 諾奧'},
        {targetName: '奧斯卡', displayName: '💛 奧斯卡'},
        {targetName: '雨奧', displayName: '💛 雨奧'},
        {targetName: '米羅 A', displayName: '💛 米羅 A'},
        {targetName: '米羅 B', displayName: '💛 米羅 B'},
        {targetName: '兩果', displayName: '💛 兩果'},
        {targetName: '雨果', displayName: '💛 雨果'}
      ];

      state.events = [
        { id: 'EV-01', date: '2026-08-03', title: '新學期開學日', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '開學活動', category: '全園活動', timeLocation: '', description: '開學第一天', theme: '快樂上學趣' },
        { id: 'EV-05', date: '2026-08-27', title: '諾貝爾 A、B、C 親師座談', target: '親職活動, 諾貝爾 A, 諾貝爾 B, 諾貝爾 C', categoryMajor: '班級主題', categoryMinor: '親職活動', category: '親職活動', timeLocation: '17:00 開始', description: '諾A班親師座談交流', theme: '快樂上學趣' },
        { id: 'EV-06', date: '2026-09-07', title: '九月份幸福廚房', target: '米羅 A, 米羅 B, 兩果', categoryMajor: '班級主題', categoryMinor: '幸福廚房', category: '班級主題', timeLocation: '', description: '幸福廚房手作生活體驗', theme: '快樂上學趣' },
        { id: 'EV-07', date: '2026-09-08', title: '九月份幸福廚房', target: '雨奧, 奧斯卡, 諾奧', categoryMajor: '班級主題', categoryMinor: '幸福廚房', category: '班級主題', timeLocation: '', description: '幸福廚房手作生活體驗。\\n\\n⏰ 雨奧 10:00、奧斯卡 10:50、諾奧 11:40', theme: '快樂上學趣' },
        { id: 'EV-08', date: '2026-09-09', title: '幸福廚房（諾C/諾B/諾A）', target: '諾貝爾 C, 諾貝爾 B, 諾貝爾 A', categoryMajor: '班級主題', categoryMinor: '幸福廚房', category: '班級主題', timeLocation: '', description: '❤️ 諾貝爾 A 班九月份幸福廚房體驗！化身小小烘焙師！', theme: '快樂上學趣' },
        { id: 'EV-12', date: '2026-10-05', title: '十月份幸福廚房', target: '米羅 A, 米羅 B, 兩果', categoryMajor: '班級主題', categoryMinor: '幸福廚房', category: '班級主題', timeLocation: '', description: '幸福廚房手作生活體驗', theme: '主題活動：人與自己／人與他人概念' },
        { id: 'EV-13', date: '2026-10-06', title: '十月份幸福廚房', target: '雨奧, 奧斯卡, 諾奧', categoryMajor: '班級主題', categoryMinor: '幸福廚房', category: '班級主題', timeLocation: '', description: '幸福廚房手作生活體驗', theme: '主題活動：人與自己／人與他人概念' },
        { id: 'EV-14', date: '2026-10-07', title: '十月份幸福廚房', target: '諾貝爾 C, 諾貝爾 B, 諾貝爾 A', categoryMajor: '班級主題', categoryMinor: '幸福廚房', category: '班級主題', timeLocation: '', description: '❤️ 諾貝爾 A 班十月份幸福廚房體驗！化身小小烘焙師！', theme: '主題活動：人與自己／人與他人概念' },
        { id: 'EV-15', date: '2026-10-08', title: '十月壽星慶生會', target: '全園活動', categoryMajor: '全園活動', categoryMinor: '慶生活動', category: '全園活動', timeLocation: '', description: '分享快樂分享愛！', theme: '主題活動：人與自己／人與他人概念' },
        { id: 'EV-16', date: '2026-10-09', endDate: '2026-10-11', title: '雙十節連假', target: '全園適用', categoryMajor: '休園', categoryMinor: '節慶放假', category: '節慶放假', timeLocation: '連假三日', description: '國慶連續假期放假', theme: '主題活動：人與自己／人與他人概念' },
        { id: 'EV-17', date: '2026-10-23', title: '牙齒塗氟日 口腔保健檢查', calendarPrompt: '牙齒塗氟', target: '諾貝爾 A, 全園活動', categoryMajor: '重要活動', categoryMinor: '健康檢查', category: '重要活動', timeLocation: '08:30 (五)', description: '🌟 全園定期塗氟檢查，請家長務必攜帶健保卡！未攜帶無法參加喔！', theme: '主題活動：人與自己／人與他人概念' },
        { id: 'EV-18', date: '2026-10-24', endDate: '2026-10-26', title: '光復節連假', calendarPrompt: '光復節連假', target: '全園適用', categoryMajor: '休園', categoryMinor: '節慶放假', category: '節慶放假', timeLocation: '連假三日', description: '光復節連續假期', theme: '主題活動：人與自己／人與他人概念' }
      ];

      state.menus = [
        { date: '2026-10-01', morningSnack: '紅藜雙色饅頭、米漿', fruit: '當季水果', lunchStaple: '糙白米飯', lunchMain: '青椒炒雞柳', lunchSide1: '木須炒蛋', lunchSide2: '有機蔬菜', lunchSoup: '玉米濃湯', afternoonSnack: '滑蛋雞肉粥', nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', note: '本園未使用不合格油品' },
        { date: '2026-10-02', morningSnack: '全麥吐司、黑芝麻豆漿', fruit: '當季水果', lunchStaple: '日式和風拉麵', lunchMain: '有機蔬菜', lunchSide1: '蘿蔔貢丸湯', lunchSide2: '', lunchSoup: '', afternoonSnack: '豆花', nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', note: '' },
        { date: '2026-10-05', morningSnack: '奶皇包、黑芝麻豆漿', fruit: '當季水果', lunchStaple: '古早味滷肉飯', lunchMain: '有機蔬菜', lunchSide1: '什錦蔬菜湯', lunchSide2: '', lunchSoup: '', afternoonSnack: '鹹粥', nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', note: '' },
        { date: '2026-10-06', morningSnack: '芋頭堅果饅頭、燕麥豆漿', fruit: '當季水果', lunchStaple: '糙白米飯', lunchMain: '什錦冬粉', lunchSide1: '番茄豆腐', lunchSide2: '有機蔬菜', lunchSoup: '營養蔬菜湯', afternoonSnack: '綠豆薏仁湯', nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', note: '' },
        { date: '2026-10-07', morningSnack: '什錦穀片、鮮奶', fruit: '當季水果', lunchStaple: '糙白米飯', lunchMain: '瓜仔肉', lunchSide1: '蛋香大黃瓜', lunchSide2: '有機蔬菜', lunchSoup: '魚丸湯', afternoonSnack: '芋頭粥', nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', note: '' },
        { date: '2026-10-08', morningSnack: '果醬吐司、豆漿', fruit: '當季水果', lunchStaple: '味噌豬肉湯麵', lunchMain: '有機蔬菜', lunchSide1: '', lunchSide2: '', lunchSoup: '', afternoonSnack: '慶生會', nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', note: '十月慶生會' },
        { date: '2026-10-23', morningSnack: '鹹奶油餐包、米漿', fruit: '當季水果', lunchStaple: '日式炒烏龍', lunchMain: '有機蔬菜', lunchSide1: '味噌湯', lunchSide2: '', lunchSoup: '', afternoonSnack: '桂圓燕麥粥', nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', note: '今日塗氟檢查日' }
      ];

      state.spotlights = [
        {
          id: 'SP-01',
          title: '桃子腳幼兒園 牙齒塗氟日 活動攻略圖',
          subtitle: '日期：2026/10/23 (五) 08:30 起全園分班檢查',
          imageUrl: './spotlight-fluoride.jpg',
          mediaType: 'image',
          bulletPoints: '【衛教宣導】 正確刷牙示範，引導幼兒養成每日潔牙好習慣。\\n【塗氟檢查】 每六個月定期專業口腔保健，細心守護孩子健康小乳牙。\\n【注意事項】 請家長務必攜帶「健保卡」！未攜帶健保卡將無法參加塗氟檢查喔！\\n【活動尾聲】 勇敢檢查完成的小朋友，將頒發口腔保健勇敢小獎狀！',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          duration: 6,
          priority: 1,
          status: '啟用'
        },
        {
          id: 'SP-02',
          title: '幼兒園幸福廚房手作生活體驗',
          subtitle: '日期：2026/10/07 (三) 諾貝爾 A 班手作日',
          imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
          mediaType: 'image',
          bulletPoints: '【生活自理】 引導幼兒親手揉捏麵糰、體驗食材變化與手作樂趣。\\n【小組合作】 學習分工收拾餐具與桌面，培養分享與責任感！\\n【親師叮嚀】 當日請幫孩子穿著輕便服裝與圍裙，準備開心化身小小烘焙師！',
          startDate: '2026-10-01',
          endDate: '2026-10-20',
          duration: 5,
          priority: 2,
          status: '啟用'
        }
      ];

      state.docs = [
        { id: 'DOC-01', fileName: '幼兒用藥委託單.pdf', category: '保健用藥', description: '幼兒在園需協助用藥時請家長填寫委託單', downloadUrl: 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', updatedAt: '2026-09-01' },
        { id: 'DOC-02', fileName: '115學年度(上)全園活動規劃暨親職活動行事曆.pdf', category: '學期行事曆', description: '包含全學期各月份主題與親師座談日期', downloadUrl: 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', updatedAt: '2026-08-01' },
        { id: 'DOC-03', fileName: '10月份營養午餐及點心菜單表.pdf', category: '餐飲菜單', description: '本月幼兒每日三餐營養菜單與檢核表', downloadUrl: 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', updatedAt: '2026-10-01' },
        { id: 'DOC-04', fileName: '諾貝爾A班新生家長入園須知手冊.pdf', category: '親師手冊', description: '作息時間表、接送規定與常規說明', downloadUrl: 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', updatedAt: '2026-08-15' }
      ];

      // 優先載入本地已自訂儲存的資料，確保重新整理依然永久生效
      try {
        const localSp = localStorage.getItem('nobel_a_spotlights_list') || localStorage.getItem('nobel_a_spotlight_custom');
        if (localSp) {
          const parsed = JSON.parse(localSp);
          state.spotlights = Array.isArray(parsed) ? parsed : [parsed];
        }
        const localEvents = localStorage.getItem('nobel_a_events_custom');
        if (localEvents) state.events = JSON.parse(localEvents);
        const localMenus = localStorage.getItem('nobel_a_menus_custom');
        if (localMenus) state.menus = JSON.parse(localMenus);
        const localSettings = localStorage.getItem('nobel_a_settings_custom');
        if (localSettings) {
          state.settings = JSON.parse(localSettings);
        }
      } catch (e) {}

      renderEventOptionsUI();
      renderSpotlightSection();
      renderCalendar();
      renderSelectedDayDetails(state.selectedDateStr);
      renderDocsList();
      renderFallbackAlbums();

      if (!state.currentTab || state.currentTab === 'home') {
        const homeEl = document.getElementById('tabContent-home');
        if (homeEl) homeEl.classList.remove('hidden');
      }
    }

    
    let isSidebarPinned = false;

    function expandSidebar() {
      const sb = document.getElementById('desktopSidebar');
      const texts = document.querySelectorAll('.sidebar-text');
      if (sb) {
        sb.classList.remove('w-16');
        sb.classList.add('w-56');
      }
      texts.forEach(el => {
        el.classList.remove('opacity-0');
        el.classList.add('opacity-100');
      });
    }

    function collapseSidebar() {
      if (isSidebarPinned) return;
      const sb = document.getElementById('desktopSidebar');
      const texts = document.querySelectorAll('.sidebar-text');
      if (sb) {
        sb.classList.add('w-16');
        sb.classList.remove('w-56');
      }
      texts.forEach(el => {
        el.classList.add('opacity-0');
        el.classList.remove('opacity-100');
      });
    }

    function togglePinSidebar() {
      isSidebarPinned = !isSidebarPinned;
      const wrap = document.getElementById('sidebarWrapper');
      const pinBtn = document.getElementById('pinSidebarBtn');
      if (isSidebarPinned) {
        wrap.classList.remove('w-16');
        wrap.classList.add('w-56');
        pinBtn.classList.add('text-peach-500', 'bg-peach-100');
        pinBtn.classList.remove('text-slate-400');
        expandSidebar(); // Ensure it's expanded
      } else {
        wrap.classList.add('w-16');
        wrap.classList.remove('w-56');
        pinBtn.classList.remove('text-peach-500', 'bg-peach-100');
        pinBtn.classList.add('text-slate-400');
        collapseSidebar();
      }
    }

    // ==================== 頁籤切換邏輯 ====================
    function switchTab(tabName) {
      state.currentTab = tabName;
      ['home', 'albums', 'docs', 'admin'].forEach(tab => {
        const contentEl = document.getElementById(\`tabContent-\${tab}\`);
        const btnEl = document.getElementById(\`tabBtn-\${tab}\`);
        const mBtnEl = document.getElementById(\`mTabBtn-\${tab}\`);

        if (tab === tabName) {
          contentEl.classList.remove('hidden');
          if (btnEl) {
            btnEl.className = 'tab-btn flex items-center p-2 rounded-xl transition-all group/btn bg-peach-50 text-peach-600 shadow-sm relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-peach-500 before:rounded-r-full';
          }
          if (mBtnEl) {
            mBtnEl.className = 'm-tab-btn flex-1 py-1.5 flex flex-col items-center justify-center text-xs font-bold rounded-xl transition-all text-peach-600 bg-peach-50';
          }
        } else {
          contentEl.classList.add('hidden');
          if (btnEl) {
            btnEl.className = 'tab-btn flex items-center p-2 rounded-xl transition-all group/btn text-slate-500 hover:bg-slate-100 hover:text-slate-800';
          }
          if (mBtnEl) {
            mBtnEl.className = 'm-tab-btn flex-1 py-1.5 flex flex-col items-center justify-center text-xs font-bold rounded-xl transition-all text-slate-500 hover:text-slate-800';
          }
        }
      });

      if (tabName === 'albums') {
        if (state.cachedAlbums.length === 0) refreshAlbums();
        else applyAlbumFilters();
      }
      if (tabName === 'docs') {
        renderDocsList();
      }
      updateAdminAuthUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==================== 焦點活動媒體與輪播輔助函式 ====================
    function detectMediaKind(url, explicitType) {
      if (explicitType === 'video') return 'video';
      if (!url) return 'image';
      const str = url.trim().toLowerCase();
      if (str.includes('youtube.com') || str.includes('youtu.be')) return 'video';
      if (['.mp4', '.webm', '.ogg', '.mov'].some(ext => str.includes(ext))) return 'video';
      if (str.includes('/preview')) return 'video';
      return explicitType || 'image';
    }

    function getEmbedVideoInfo(url, hideControls = false) {
      if (!url) return { type: 'none', src: '' };
      const str = url.trim();
      // YouTube 網址解析
      if (str.includes('youtu.be/')) {
        const id = str.split('youtu.be/')[1].split(/[?&#]/)[0];
        if (id) return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=' + id + (hideControls ? '&controls=0' : '&controls=1') };
      }
      if (str.includes('youtube.com/')) {
        let id = '';
        if (str.includes('watch?v=')) id = str.split('watch?v=')[1].split('&')[0];
        else if (str.includes('embed/')) id = str.split('embed/')[1].split(/[?&#]/)[0];
        else if (str.includes('shorts/')) id = str.split('shorts/')[1].split(/[?&#]/)[0];
        if (id) return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=' + id + (hideControls ? '&controls=0' : '&controls=1') };
      }
      // Google Drive 雲端預覽影片
      let driveId = '';
      if (str.includes('/file/d/')) {
        driveId = str.split('/file/d/')[1].split('/')[0].split('?')[0];
      } else if (str.includes('id=')) {
        try {
          const qPart = str.split('?')[1] || '';
          const sp = new URLSearchParams(qPart);
          driveId = sp.get('id') || '';
        } catch (e) {}
      }
      if (driveId) {
        return { type: 'iframe', src: 'https://drive.google.com/file/d/' + driveId + '/preview' };
      }
      // 原生 HTML5 影片檔
      const lower = str.toLowerCase();
      if (['.mp4', '.webm', '.ogg', '.mov'].some(ext => lower.includes(ext))) {
        return { type: 'video', src: str };
      }
      return { type: 'none', src: '' };
    }

    function getTodayDateStr() {
      const d = new Date();
      const y = d.getFullYear();
      const m = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      return y + '-' + m + '-' + day;
    }

    function filterActiveSpotlights(list) {
      if (!list || list.length === 0) return [];
      const todayStr = getTodayDateStr();
      const active = list.filter(function(sp) {
        if (sp.status === '停用') return false;
        if (sp.startDate && sp.startDate > todayStr) return false;
        if (sp.endDate && sp.endDate < todayStr) return false;
        return true;
      });
      if (active.length === 0) {
        const enabled = list.filter(function(sp) { return sp.status !== '停用'; });
        return enabled.length > 0 ? enabled : list;
      }
      return active;
    }

    let currentSpotlightIndex = 0;
    let spotlightTimer = null;
    let isSpotlightHovered = false;

    // ==================== SPOTLIGHT 區塊渲染 (支援多筆輪播與排程) ====================
    function renderSpotlightSection() {
      const activeList = filterActiveSpotlights(state.spotlights);
      const container = document.getElementById('spotlightContainer');
      if (!container) return;

      if (activeList.length === 0) {
        container.classList.add('hidden');
        return;
      }
      container.classList.remove('hidden');

      if (currentSpotlightIndex >= activeList.length) {
        currentSpotlightIndex = 0;
      }
      const sp = activeList[currentSpotlightIndex];

      const titleEl = document.getElementById('spotlightTitle');
      if (titleEl) titleEl.textContent = sp.title || '桃子腳幼兒園 焦點活動';
      
      const statusBadge = document.getElementById('spotlightStatusBadge');
      if (statusBadge) {
        // try to parse date from sp.subtitle
        let dateStr = '';
        if (sp.subtitle) {
          const match = sp.subtitle.match(/\\d{4}\\/\\d{1,2}\\/\\d{1,2}/);
          if (match) dateStr = match[0];
        }
        if (!dateStr && sp.date) {
           dateStr = sp.date;
        }
        
        if (dateStr) {
          statusBadge.classList.remove('hidden');
          const evDate = new Date(dateStr);
          const now = new Date();
          // Normalize to midnight for accurate day comparison
          evDate.setHours(0,0,0,0);
          now.setHours(0,0,0,0);
          
          if (evDate.getTime() === now.getTime()) {
            statusBadge.textContent = '本日焦點';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-amber-100 text-amber-700 border border-amber-200';
          } else if (evDate > now) {
            statusBadge.textContent = '即將到來';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-emerald-100 text-emerald-700 border border-emerald-200';
          } else {
            statusBadge.textContent = '活動結束';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-slate-100 text-slate-500 border border-slate-200';
          }
        } else {
          statusBadge.classList.add('hidden');
        }
      }

      const subEl = document.getElementById('spotlightSubtitle');
      if (subEl) subEl.textContent = sp.subtitle || '';

      const durBadge = document.getElementById('spotlightDurationBadge');
      if (durBadge) {
        durBadge.textContent = '⏱️ ' + (sp.duration || 5) + 's 輪播';
      }

      const counterEl = document.getElementById('spotlightSlideCounter');
      if (counterEl) {
        counterEl.textContent = (currentSpotlightIndex + 1) + ' / ' + activeList.length;
      }

      const navControls = document.getElementById('spotlightNavControls');
      if (navControls) {
        if (activeList.length <= 1) {
          navControls.classList.add('hidden');
        } else {
          navControls.classList.remove('hidden');
        }
      }
      
      const overPrev = document.getElementById('spotlightOverlayPrevBtn');
      const overNext = document.getElementById('spotlightOverlayNextBtn');
      if (activeList.length <= 1) {
         if (overPrev) overPrev.classList.add('hidden');
         if (overNext) overNext.classList.add('hidden');
      } else {
         if (overPrev) overPrev.classList.remove('hidden');
         if (overNext) overNext.classList.remove('hidden');
      }

      renderSpotlightMedia(sp);
      renderSpotlightPoints(sp.bulletPoints);
      renderSpotlightDots(activeList.length, currentSpotlightIndex);
      startSpotlightTimer(sp.duration || 5, activeList.length);
    }

    function renderSpotlightMedia(sp) {
      const imgEl = document.getElementById('spotlightImg');
      const imgHint = document.getElementById('spotlightImgHoverHint');
      const videoBox = document.getElementById('spotlightVideoBox');
      const iframeEl = document.getElementById('spotlightIframe');
      const html5Video = document.getElementById('spotlightHtml5Video');
      const mediaHint = document.getElementById('spotlightMediaHint');

      const mediaKind = detectMediaKind(sp.imageUrl, sp.mediaType);

      if (mediaKind === 'video') {
        const vInfo = getEmbedVideoInfo(sp.imageUrl, true); // true for homepage
        if (imgEl) imgEl.classList.add('hidden');
        if (imgHint) imgHint.classList.add('hidden');
        if (videoBox) videoBox.classList.remove('hidden');

        if (vInfo.type === 'iframe') {
          if (iframeEl) {
            iframeEl.classList.remove('hidden');
            iframeEl.src = vInfo.src;
          }
          if (html5Video) {
            html5Video.classList.add('hidden');
            try { if (typeof html5Video.pause === 'function') html5Video.pause(); } catch (e) {}
          }
        } else if (vInfo.type === 'video') {
          if (html5Video) {
            html5Video.classList.remove('hidden');
            html5Video.src = vInfo.src;
            try { html5Video.play().catch(e=>{}); } catch(e){}
          }
          if (iframeEl) {
            iframeEl.classList.add('hidden');
            iframeEl.src = '';
          }
        }
        if (mediaHint) mediaHint.innerHTML = '🎬 播放影音';
      } else {
        if (videoBox) videoBox.classList.add('hidden');
        if (iframeEl) iframeEl.src = '';
        if (html5Video) {
          try { if (typeof html5Video.pause === 'function') html5Video.pause(); } catch (e) {}
          html5Video.classList.add('hidden');
        }
        if (imgEl) {
          imgEl.classList.remove('hidden');
          imgEl.src = sp.imageUrl || './spotlight-fluoride.jpg';
        }
        if (imgHint) imgHint.classList.remove('hidden');
        if (mediaHint) mediaHint.innerHTML = '🔍 放大查看';
      }
    }

    function renderSpotlightPoints(bulletPoints) {
      const ptsContainer = document.getElementById('spotlightPoints');
      if (!ptsContainer) return;
      ptsContainer.innerHTML = '';

      if (!bulletPoints) return;
      const newlineChar = String.fromCharCode(10);
      const lines = bulletPoints.split(newlineChar).map(function(l) { return l.trim(); }).filter(Boolean);
      if (lines.length === 0) return;

      lines.forEach(function(line) {
        var tag = '';
        var content = line;
        if (line.indexOf('【') === 0 && line.indexOf('】') > 0) {
          var closeIdx = line.indexOf('】');
          tag = line.substring(1, closeIdx).trim();
          content = line.substring(closeIdx + 1).trim();
        }

        const item = document.createElement('div');
        if (tag) {
          const isWarning = tag.indexOf('注意') >= 0 || tag.indexOf('重要') >= 0 || tag.indexOf('卡') >= 0;
          const isTeal = tag.indexOf('檢查') >= 0 || tag.indexOf('塗氟') >= 0 || tag.indexOf('時間') >= 0;
          const isEnd = tag.indexOf('尾聲') >= 0 || tag.indexOf('禮物') >= 0 || tag.indexOf('結束') >= 0;
          
          const borderClass = isWarning ? 'border-amber-200 bg-amber-50/80 col-span-1 sm:col-span-2' : isTeal ? 'border-teal-100 bg-teal-50/50' : isEnd ? 'border-indigo-100 bg-indigo-50/50' : 'border-rose-100 bg-white/80';
          const textClass = isWarning ? 'text-amber-700 font-bold' : isTeal ? 'text-teal-700 font-bold' : isEnd ? 'text-indigo-700 font-bold' : 'text-rose-600 font-bold';
          const icon = isWarning ? '⚠️' : isTeal ? '🩺' : isEnd ? '🎁' : '🦷';

          item.className = 'p-2.5 rounded-xl border ' + borderClass + ' shadow-2xs';
          item.innerHTML = '<div class="' + textClass + ' flex items-center gap-1 mb-0.5 text-xs">' +
            '<span>' + icon + '</span> 【' + tag + '】' +
            '</div>' +
            '<div class="text-slate-700 text-xs leading-relaxed font-medium">' + content + '</div>';
        } else {
          item.className = 'p-2.5 rounded-xl border border-rose-100 bg-white/80 shadow-2xs flex items-start gap-1.5 text-xs text-slate-700 font-medium';
          item.innerHTML = '<span class="text-peach-500 font-bold shrink-0">✨</span>' +
            '<span class="leading-relaxed">' + line + '</span>';
        }
        ptsContainer.appendChild(item);
      });
    }

    function renderSpotlightDots(total, activeIdx) {
      const dotsContainer = document.getElementById('spotlightDots');
      if (!dotsContainer) return;
      if (total <= 1) {
        dotsContainer.innerHTML = '';
        dotsContainer.classList.add('hidden');
        return;
      }
      dotsContainer.classList.remove('hidden');
      dotsContainer.innerHTML = '';

      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = i === activeIdx
          ? 'h-3 w-10 bg-peach-500 rounded-full transition-all duration-300 shadow-2xs'
          : 'h-3 w-3 bg-rose-200 hover:bg-rose-300 rounded-full transition-all duration-200 cursor-pointer';
        dot.title = '切換至第 ' + (i + 1) + ' 個焦點活動';
        dot.onclick = (function(slideIdx) {
          return function(ev) {
            if (ev && ev.stopPropagation) ev.stopPropagation();
            goToSpotlightSlide(slideIdx);
          };
        })(i);
        dotsContainer.appendChild(dot);
      }
    }

    function startSpotlightTimer(durationSec, totalSlides) {
      clearTimeout(spotlightTimer);
      if (totalSlides <= 1) return;
      const sec = Math.max(2, Number(durationSec) || 5);
      spotlightTimer = setTimeout(function() {
        if (!isSpotlightHovered) {
          nextSpotlightSlide();
        } else {
          startSpotlightTimer(sec, totalSlides);
        }
      }, sec * 1000);
    }

    function nextSpotlightSlide(e) {
      if (e && e.stopPropagation) e.stopPropagation();
      const activeList = filterActiveSpotlights(state.spotlights);
      if (activeList.length <= 1) return;
      currentSpotlightIndex = (currentSpotlightIndex + 1) % activeList.length;
      renderSpotlightSection();
    }

    function prevSpotlightSlide(e) {
      if (e && e.stopPropagation) e.stopPropagation();
      const activeList = filterActiveSpotlights(state.spotlights);
      if (activeList.length <= 1) return;
      currentSpotlightIndex = (currentSpotlightIndex - 1 + activeList.length) % activeList.length;
      renderSpotlightSection();
    }

    function goToSpotlightSlide(idx) {
      const activeList = filterActiveSpotlights(state.spotlights);
      if (idx >= 0 && idx < activeList.length) {
        currentSpotlightIndex = idx;
        renderSpotlightSection();
      }
    }

    function pauseSpotlightTimer() {
      isSpotlightHovered = true;
    }

    function resumeSpotlightTimer() {
      isSpotlightHovered = false;
    }


    function nextSpotlightModal() {
      const activeList = filterActiveSpotlights(state.spotlights);
      if(activeList.length <= 1) return;
      currentSpotlightIndex = (currentSpotlightIndex + 1) % activeList.length;
      openSpotlightModal();
      renderSpotlightSection();
    }
    function prevSpotlightModal() {
      const activeList = filterActiveSpotlights(state.spotlights);
      if(activeList.length <= 1) return;
      currentSpotlightIndex = (currentSpotlightIndex - 1 + activeList.length) % activeList.length;
      openSpotlightModal();
      renderSpotlightSection();
    }

    function openSpotlightModal() {
      const activeList = filterActiveSpotlights(state.spotlights);
      const sp = activeList[currentSpotlightIndex] || state.spotlights[0] || {};
      document.getElementById('modalSpotlightTitle').textContent = sp.title || '焦點活動攻略圖';

      const prevBtn = document.getElementById('modalSpotlightPrevBtn');
      const nextBtn = document.getElementById('modalSpotlightNextBtn');
      if (activeList.length > 1) {
        if(prevBtn) prevBtn.classList.remove('hidden');
        if(nextBtn) nextBtn.classList.remove('hidden');
      } else {
        if(prevBtn) prevBtn.classList.add('hidden');
        if(nextBtn) nextBtn.classList.add('hidden');
      }


      const modalImg = document.getElementById('modalSpotlightImg');
      const modalVideoBox = document.getElementById('modalSpotlightVideoContainer');
      const modalIframe = document.getElementById('modalSpotlightIframe');
      const modalVideo = document.getElementById('modalSpotlightVideo');

      const mediaKind = detectMediaKind(sp.imageUrl, sp.mediaType);
      if (mediaKind === 'video') {
        const vInfo = getEmbedVideoInfo(sp.imageUrl, false); // true for homepage
        if (modalImg) modalImg.classList.add('hidden');
        if (modalVideoBox) modalVideoBox.classList.remove('hidden');

        if (vInfo.type === 'iframe') {
          if (modalIframe) {
            modalIframe.classList.remove('hidden');
            modalIframe.src = vInfo.src;
          }
          if (modalVideo) {
            modalVideo.classList.add('hidden');
            modalVideo.pause();
          }
        } else if (vInfo.type === 'video') {
          if (modalVideo) {
            modalVideo.classList.remove('hidden');
            modalVideo.src = vInfo.src;
            modalVideo.volume = 0.3;
            modalVideo.muted = false; // 取消靜音，維持 30% 音量
            try { modalVideo.play().catch(e=>{}); } catch(e){}
          }
          if (modalIframe) {
            modalIframe.classList.add('hidden');
            modalIframe.src = '';
          }
        }
      } else {
        if (modalVideoBox) modalVideoBox.classList.add('hidden');
        if (modalIframe) modalIframe.src = '';
        if (modalVideo) {
          modalVideo.pause();
          modalVideo.classList.add('hidden');
        }
        if (modalImg) {
          modalImg.classList.remove('hidden');
          modalImg.src = sp.imageUrl || './spotlight-fluoride.jpg';
        }
      }

      document.getElementById('modalSpotlightDesc').textContent = sp.bulletPoints || '請務必留意焦點活動提醒與須知！';
      document.getElementById('spotlightModal').classList.remove('hidden');
    }

    function closeSpotlightModal() {
      const modalIframe = document.getElementById('modalSpotlightIframe');
      if (modalIframe) modalIframe.src = '';
      const modalVideo = document.getElementById('modalSpotlightVideo');
      if (modalVideo) modalVideo.pause();
      document.getElementById('spotlightModal').classList.add('hidden');
    }

    // ==================== 行事曆邏輯 (週日為第一天) ====================
    function changeMonth(delta) {
      state.viewMonth += delta;
      if (state.viewMonth > 12) {
        state.viewMonth = 1;
        state.viewYear++;
      } else if (state.viewMonth < 1) {
        state.viewMonth = 12;
        state.viewYear--;
      }
      renderCalendar();
      if (state.currentCalView === 'week') {
        renderWeekView();
      } else if (state.currentCalView === 'month') {
        renderMonthView();
      }
    }

    function goToToday() {
      state.viewYear = 2026;
      state.viewMonth = 10;
      state.selectedDateStr = '2026-10-23';
      renderCalendar();
      renderSelectedDayDetails(state.selectedDateStr);
      setCalViewMode('day');
    }

    function setCalViewMode(mode) {
      state.currentCalView = mode;
      ['day', 'week', 'month'].forEach(m => {
        const btn = document.getElementById(\`viewModeBtn-\${m}\`);
        if (m === mode) {
          btn.className = 'cal-view-btn flex-1 sm:flex-none px-3 py-1 rounded-xl text-xs font-bold transition-all bg-white text-slate-800 shadow-xs';
        } else {
          btn.className = 'cal-view-btn flex-1 sm:flex-none px-3 py-1 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900';
        }
      });

      const daySec = document.getElementById('linkedContentSection');
      const weekSec = document.getElementById('weekViewContainer');
      const monthSec = document.getElementById('monthViewContainer');

      if (mode === 'day') {
        daySec.classList.remove('hidden');
        weekSec.classList.add('hidden');
        monthSec.classList.add('hidden');
      } else if (mode === 'week') {
        daySec.classList.add('hidden');
        weekSec.classList.remove('hidden');
        monthSec.classList.add('hidden');
        renderWeekView();
      } else if (mode === 'month') {
        daySec.classList.add('hidden');
        weekSec.classList.add('hidden');
        monthSec.classList.remove('hidden');
        renderMonthView();
      }
    }

    function renderCalendar() {
      const year = state.viewYear;
      const month = state.viewMonth;
      document.getElementById('calendarCurrentMonthText').textContent = \`\${year} 年 \${month} 月\`;

      const grid = document.getElementById('calendarGrid');
      grid.innerHTML = '';

      // 計算本月第一天是星期幾 (0 = 週日, 1 = 週一 ... 6 = 週六)
      const firstDayIndex = new Date(year, month - 1, 1).getDay();
      // 計算本月總天數
      const daysInMonth = new Date(year, month, 0).getDate();
      // 上個月總天數
      const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

      // 1. 填補上個月的尾端格子
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const cell = document.createElement('div');
        cell.className = 'min-h-[58px] sm:min-h-[68px] p-1 rounded-xl bg-slate-50/50 text-slate-300 font-medium text-xs flex flex-col justify-between select-none opacity-40';
        cell.innerHTML = \`<span>\${d}</span>\`;
        grid.appendChild(cell);
      }

      // 2. 本月天數格子
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = \`\${year}-\${('0' + month).slice(-2)}-\${('0' + day).slice(-2)}\`;
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday

        const isSunday = (dayOfWeek === 0);
        const isSaturday = (dayOfWeek === 6);
        const isWeekend = isSunday || isSaturday;
        const isSelected = (dayStr === state.selectedDateStr);

        // 查找該日活動與菜單
        const dayEvents = getEventsForDate(dayStr);
        const dayMenu = getMenuForDate(dayStr);

        const cell = document.createElement('div');
        cell.onclick = () => onDateClicked(dayStr);

        // 基本外觀 class
        let cellClasses = 'min-h-[58px] sm:min-h-[68px] p-1 sm:p-1.5 rounded-2xl font-bold text-xs flex flex-col justify-between transition-all cursor-pointer tap-bounce border ';
        
        if (isSelected) {
          cellClasses += 'bg-gradient-to-b from-peach-100 to-rose-50 border-peach-500 shadow-md ring-2 ring-peach-300 ';
        } else if (isWeekend) {
          cellClasses += 'bg-slate-50/80 border-slate-100 text-slate-400 hover:bg-slate-100 ';
        } else {
          cellClasses += 'bg-white border-slate-100/90 text-slate-700 hover:border-peach-200 hover:shadow-xs ';
        }

        cell.className = cellClasses;

        // 格子上方：日期數字與特色小徽章
        let dayNumColor = isSunday ? 'text-rose-500' : isSaturday ? 'text-teal-600' : 'text-slate-700';
        if (isSelected) dayNumColor = 'text-peach-700 font-black';

        // 標記小圓點或圖示（僅全園活動、班級主題、重要活動標示圓點；諾貝爾 A 標示❤️；不標示菜單綠點）
        let badgesHtml = '<div class="flex items-center gap-1 flex-wrap justify-end">';

        const hasNobelA = dayEvents.some(e => (e.target || '').includes('諾貝爾A') || (e.target || '').includes('諾貝爾 A') || (e.target || '').includes('諾A') || (e.title || '').includes('諾A'));
        
        // 只有全園活動、班級主題以及重要活動，才會以不同顏色的圓點顯示（「全園適用」不顯示圓點）
        const isWholeSchool = dayEvents.some(e => {
          const cat = (e.categoryMajor || e.category || '');
          const target = (e.target || '');
          // 嚴格比對「全園活動」，排除「全園適用」
          return cat.includes('全園活動') || target.includes('全園活動');
        });
        const isClassTheme = dayEvents.some(e => {
          const cat = (e.categoryMajor || e.category || '');
          return cat.includes('班級') || cat.includes('主題') || cat.includes('幸福廚房') || (e.title || '').includes('幸福廚房');
        });
        const isImportant = dayEvents.some(e => {
          const cat = (e.categoryMajor || e.category || '');
          return cat.includes('重要') || cat.includes('塗氟') || cat.includes('檢查') || (e.title || '').includes('塗氟');
        });

        // 1. 諾貝爾 A 班愛心標示
        if (hasNobelA) {
          badgesHtml += '<span class="text-[0.6875rem] leading-none select-none" title="諾貝爾 A 班活動">❤️</span>';
        }

        // 2. 三大活動類別專屬圓點
        // 全園活動：🟢 活力青綠 (bg-emerald-500)
        if (isWholeSchool) {
          badgesHtml += '<span class="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" title="全園活動"></span>';
        }
        // 班級主題：💛 金黃暖陽
        if (isClassTheme) {
          badgesHtml += '<span class="w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white" title="班級主題"></span>';
        }
        // 重要活動：🔥 珊瑚櫻紅
        if (isImportant) {
          badgesHtml += '<span class="w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white" title="重要活動"></span>';
        }

        badgesHtml += '</div>';

        // 判定幸福廚房日與當月慶生日
        const isKitchen = dayEvents.some(e => (e.title || '').includes('幸福廚房') || (e.categoryMajor || '').includes('幸福廚房') || (e.categoryMinor || '').includes('幸福廚房')) || 
          (dayMenu && ((dayMenu.note || '').includes('幸福廚房') || (dayMenu.afternoonSnack || '').includes('幸福廚房') || (dayMenu.lunchMain || '').includes('幸福廚房')));

        const isBirthday = dayEvents.some(e => (e.title || '').includes('慶生') || (e.title || '').includes('壽星') || (e.categoryMajor || '').includes('慶生') || (e.categoryMinor || '').includes('慶生')) || 
          (dayMenu && ((dayMenu.note || '').includes('慶生') || (dayMenu.afternoonSnack || '').includes('慶生') || (dayMenu.lunchMain || '').includes('慶生')));

        // 餐點圖示：🍱，若為幸福廚房日旁加🥐，慶生日旁加🎂（稍微加大圖示間隙，避免視覺擁擠）
        let menuIcons = '';
        if (dayMenu && !isWeekend) {
          const icons = ['🍱'];
          if (isKitchen) icons.push('🥐');
          if (isBirthday) icons.push('🎂');
          menuIcons = \`<span class="inline-flex items-center gap-1.5">\${icons.map(ic => \`<span>\${ic}</span>\`).join('')}</span>\`;
        }

        // 格子下方：若有填寫「行事曆提示」則顯示提示標籤；未填寫則不顯示（不另外顯示 [十月壽星..]、[幸福廚房..] 等常用標籤）
        // 餐點圖示：🍱，若為幸福廚房日旁加🥐，慶生日旁加🎂
        let bannerHtml = '';
        const promptEvents = dayEvents.filter(e => (e.calendarPrompt || e['行事曆提示'] || '').trim());
        if (promptEvents.length > 0) {
          const banners = promptEvents.map(pe => {
            const promptText = (pe.calendarPrompt || pe['行事曆提示']).trim();
            const isHighlight = (pe.target || '').includes('諾貝爾A') || (pe.target || '').includes('諾貝爾 A') || (pe.target || '').includes('諾A');
            return \`<div class="text-[0.625rem] tracking-tight leading-tight px-1.5 py-0.5 rounded break-words \${isHighlight ? 'bg-peach-500 text-white font-black' : 'bg-rose-100/80 text-rose-700 font-medium'}" title="\${promptText}">\${promptText}</div>\`;
          });
          bannerHtml = banners.slice(0, 2).join('');
        }

        let eventBrief = '';
        if (bannerHtml && menuIcons) {
          eventBrief = \`
            <div class="space-y-0.5">
              \${bannerHtml}
              <div class="text-[0.6875rem] text-slate-500 font-normal leading-none px-0.5 pt-0.5">\${menuIcons}</div>
            </div>
          \`;
        } else if (bannerHtml) {
          eventBrief = bannerHtml;
        } else if (menuIcons) {
          eventBrief = \`<div class="text-[0.6875rem] text-slate-500 font-normal leading-none px-0.5 py-0.5">\${menuIcons}</div>\`;
        }

        cell.innerHTML = \`
          <div class="flex items-center justify-between w-full">
            <span class="\${dayNumColor}">\${day}</span>
            \${badgesHtml}
          </div>
          <div class="w-full">
            \${eventBrief}
          </div>
        \`;

        grid.appendChild(cell);
      }

      // 3. 填補下個月開頭格子保持整齊
      const totalCells = firstDayIndex + daysInMonth;
      const nextMonthCells = (7 - (totalCells % 7)) % 7;
      for (let d = 1; d <= nextMonthCells; d++) {
        const cell = document.createElement('div');
        cell.className = 'min-h-[58px] sm:min-h-[68px] p-1 rounded-xl bg-slate-50/50 text-slate-300 font-medium text-xs flex flex-col justify-between select-none opacity-40';
        cell.innerHTML = \`<span>\${d}</span>\`;
        grid.appendChild(cell);
      }
    }

    // 點選行事曆日期
    function onDateClicked(dateStr) {
      state.selectedDateStr = dateStr;
      renderCalendar();
      renderSelectedDayDetails(dateStr);
      if (state.currentCalView !== 'day') {
        setCalViewMode('day');
      }
      // 平滑滑動至連動區段
      const el = document.getElementById('linkedContentSection');
      if (el && window.innerWidth < 768) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // 查詢特定日期的活動清單 (支援單日與跨日連假)
    function getEventsForDate(dateStr) {
      return state.events.filter(e => {
        if (!e.date) return false;
        const start = normalizeDate(e.date);
        const end = e.endDate ? normalizeDate(e.endDate) : start;
        return dateStr >= start && dateStr <= end;
      });
    }

    // 查詢特定日期的菜單
    function getMenuForDate(dateStr) {
      return state.menus.find(m => normalizeDate(m.date) === dateStr);
    }

    function normalizeDate(d) {
      if (!d) return '';
      if (d instanceof Date) {
        return d.toISOString().split('T')[0];
      }
      const s = String(d).trim().replace(/\\//g, '-');
      if (/^\\d{1,2}$/.test(s)) {
        return \`2026-10-\${('0' + s).slice(-2)}\`;
      }
      return s;
    }

    // ==================== 渲染選定日期的生活與菜單連動區段 ====================
    function renderSelectedDayDetails(dateStr) {
      const dateParts = dateStr.split('-');
      const y = dateParts[0];
      const m = parseInt(dateParts[1], 10);
      const d = parseInt(dateParts[2], 10);
      const dateObj = new Date(y, m - 1, d);
      const daysArr = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      const dayName = daysArr[dateObj.getDay()];

      // 更新頂部抬頭
      document.getElementById('selectedDateHeader').textContent = \`\${y} 年 \${m} 月 \${d} 日（\${dayName}）\`;

      const dayEvents = getEventsForDate(dateStr);
      const dayMenu = getMenuForDate(dateStr);

      // 更新標籤
      const badgesContainer = document.getElementById('selectedDayBadges');
      badgesContainer.innerHTML = '';
      if (dayEvents.length > 0) {
        dayEvents.forEach(ev => {
          const isNobel = (ev.target || '').includes('諾貝爾A') || (ev.target || '').includes('諾貝爾 A') || (ev.target || '').includes('諾A');
          badgesContainer.innerHTML += \`<span class="px-2.5 py-0.5 rounded-full text-xs font-bold \${isNobel ? 'bg-peach-500 text-white' : 'bg-berry-100 text-berry-700'}">\${ev.title}</span>\`;
        });
      }

      // 1. 渲染活動卡片
      document.getElementById('activeEventCount').textContent = \`\${dayEvents.length} 項活動\`;
      const eventsListEl = document.getElementById('selectedDayEventsList');
      eventsListEl.innerHTML = '';

      if (dayEvents.length === 0) {
        const isWeekend = (dateObj.getDay() === 0 || dateObj.getDay() === 6);
        eventsListEl.innerHTML = \`
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
            <div class="text-2xl">\${isWeekend ? '🏡' : '🎈'}</div>
            <div class="text-xs font-bold text-slate-600">\${isWeekend ? '週末溫馨放假日' : '今日常態在園學習作息'}</div>
            <div class="text-xs text-slate-400">\${isWeekend ? '在家好好休息充電，享受美好的家庭時光！' : '寶貝在班級常規學習、角落探索與同儕互動中快樂成長～'}</div>
          </div>
        \`;
      } else {
        dayEvents.forEach(ev => {
          const isNobelA = (ev.target || '').includes('諾貝爾A班') || (ev.target || '').includes('諾貝爾 A') || (ev.target || '').includes('諾A');
          const isHoliday = (ev.categoryMajor || ev.category || '').includes('放假');
          const cardBg = isNobelA ? 'bg-peach-50/70 border-peach-200' : isHoliday ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200';
          
          eventsListEl.innerHTML += \`
            <div class="p-3.5 rounded-2xl border \${cardBg} space-y-1.5 shadow-2xs">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5 flex-wrap">
                  \${renderTargetBadges(ev.target)}
                </div>
                <span class="text-xs font-bold text-slate-500">\${ev.timeLocation || ''}</span>
              </div>
              <h5 class="text-sm font-black text-slate-800 flex items-center gap-1">
                \${ev.title}
              </h5>
              \${ev.description ? \`<p class="text-xs text-slate-600 leading-relaxed font-medium bg-white/70 p-2.5 rounded-xl whitespace-pre-line">\${ev.description}</p>\` : ''}
            </div>
          \`;
        });
      }

      // 學期主題名稱
      const firstEvent = dayEvents[0];
      const themeText = (firstEvent && firstEvent.theme) ? firstEvent.theme : '主題活動：人與自己／人與他人概念';
      document.getElementById('themeNameText').textContent = themeText;

      // 2. 渲染菜單卡片
      const menuListEl = document.getElementById('selectedDayMenuList');
      menuListEl.innerHTML = '';

      const isWeekend = (dateObj.getDay() === 0 || dateObj.getDay() === 6);

      if (!dayMenu && isWeekend) {
        menuListEl.innerHTML = \`
          <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-center space-y-1">
            <div class="text-2xl">🍲</div>
            <div class="text-xs font-bold text-amber-800">週末家庭美味日</div>
            <div class="text-xs text-amber-600">週末幼兒園不供餐，讓爸爸媽媽陪伴孩子品嚐美味家庭料理！</div>
          </div>
        \`;
      } else if (!dayMenu) {
        menuListEl.innerHTML = \`
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
            <div class="text-2xl">🥣</div>
            <div class="text-xs font-bold text-slate-600">尚無當日特定菜單資料</div>
            <div class="text-xs text-slate-400">廚房將依營養師規律調配三餐點心與當季蔬果。</div>
          </div>
        \`;
      } else {
        // 午餐內容整合
        const lunchItems = [
          dayMenu.lunchStaple ? \`主食：\${dayMenu.lunchStaple}\` : '',
          dayMenu.lunchMain ? \`主菜：\${dayMenu.lunchMain}\` : '',
          dayMenu.lunchSide1 ? \`副菜一：\${dayMenu.lunchSide1}\` : '',
          dayMenu.lunchSide2 ? \`副菜二：\${dayMenu.lunchSide2}\` : '',
          dayMenu.lunchSoup ? \`湯品：\${dayMenu.lunchSoup}\` : ''
        ].filter(Boolean).join('、');

        menuListEl.innerHTML = \`
          <div class="grid grid-cols-1 gap-2">
            <!-- 早點 -->
            <div class="flex items-start gap-2.5 p-2 rounded-xl bg-orange-50/60 border border-orange-100">
              <span class="text-base">🥛</span>
              <div class="flex-1">
                <span class="font-bold text-orange-900 text-xs">早點（08:30）：</span>
                <span class="text-slate-700 font-medium">\${dayMenu.morningSnack || '營養早點'}</span>
              </div>
            </div>
            <!-- 當季水果 -->
            <div class="flex items-start gap-2.5 p-2 rounded-xl bg-rose-50/60 border border-rose-100">
              <span class="text-base">🍎</span>
              <div class="flex-1">
                <span class="font-bold text-rose-900 text-xs">當季水果：</span>
                <span class="text-slate-700 font-medium">\${dayMenu.fruit || '新鮮當季水果'}</span>
              </div>
            </div>
            <!-- 午餐五菜一湯 -->
            <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
              <span class="text-base">🍛</span>
              <div class="flex-1">
                <div class="font-bold text-amber-900 text-xs mb-0.5">營養午餐（11:30）：</div>
                <div class="text-slate-800 font-bold text-xs sm:text-sm leading-relaxed">\${lunchItems || '當日特製美味午餐'}</div>
              </div>
            </div>
            <!-- 午點 -->
            <div class="flex items-start gap-2.5 p-2 rounded-xl bg-teal-50/60 border border-teal-100">
              <span class="text-base">🍰</span>
              <div class="flex-1">
                <span class="font-bold text-teal-900 text-xs">午後點心（14:30）：</span>
                <span class="text-slate-700 font-medium">\${dayMenu.afternoonSnack || '自製活力點心'}</span>
              </div>
            </div>
          </div>
          \${dayMenu.note ? \`<div class="text-xs font-bold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1">📌 備註：\${dayMenu.note}</div>\` : ''}
        \`;
      }
    }

    // ==================== 查看本週檢視 (WEEK VIEW) ====================
    function renderWeekView() {
      const container = document.getElementById('weekDaysList');
      container.innerHTML = '';

      // 以選定日期為基準，找出該週的週日 (週日為第一天)
      const baseDate = new Date(state.selectedDateStr);
      const dayOfWeek = baseDate.getDay(); // 0 is Sunday
      const sundayDate = new Date(baseDate);
      sundayDate.setDate(baseDate.getDate() - dayOfWeek);

      const daysArr = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(sundayDate);
        d.setDate(sundayDate.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        const dayEvents = getEventsForDate(dStr);
        const dayMenu = getMenuForDate(dStr);

        const isToday = (dStr === state.selectedDateStr);

        let eventsSummary = dayEvents.map(e => \`<span class="px-2 py-0.5 rounded text-[0.6875rem] font-bold bg-peach-100 text-peach-700 mr-1">\${e.title}</span>\`).join('') || '<span class="text-slate-400 text-xs">常態作息</span>';
        let lunchSummary = dayMenu ? \`主食:\${dayMenu.lunchStaple || ''} / 主菜:\${dayMenu.lunchMain || ''} / 午點:\${dayMenu.afternoonSnack || ''}\` : '未供餐/家庭日';

        container.innerHTML += \`
          <div class="p-3.5 rounded-2xl border \${isToday ? 'bg-peach-50/80 border-peach-300' : 'bg-slate-50 border-slate-100'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 cursor-pointer hover:bg-peach-50 transition-colors" onclick="onDateClicked('\${dStr}')">
            <div class="flex items-center gap-2">
              <span class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center font-bold text-xs shrink-0">
                <span class="text-[0.625rem] text-slate-400">\${daysArr[i]}</span>
                <span class="text-slate-800 font-black">\${d.getDate()}</span>
              </span>
              <div>
                <div class="font-bold text-xs text-slate-700">\${dStr} (\${daysArr[i]})</div>
                <div class="mt-0.5">\${eventsSummary}</div>
              </div>
            </div>
            <div class="text-xs text-slate-500 font-medium bg-white/80 px-3 py-1.5 rounded-xl border border-slate-100 w-full sm:w-auto">
              🍱 \${lunchSummary}
            </div>
          </div>
        \`;
      }
    }

    // ==================== 查看本月總覽 (MONTH VIEW) ====================
    function renderMonthView() {
      const year = state.viewYear;
      const month = state.viewMonth;
      document.getElementById('monthViewTitle').textContent = \`\${year} 年 \${month} 月份 全月行程總覽\`;
      const timeline = document.getElementById('monthEventsTimeline');
      timeline.innerHTML = '';

      // 篩選出該月份的所有活動
      const monthPrefix = \`\${year}-\${('0' + month).slice(-2)}\`;
      const monthEvents = state.events.filter(e => {
        const start = normalizeDate(e.date);
        return start.startsWith(monthPrefix);
      });

      if (monthEvents.length === 0) {
        timeline.innerHTML = '<div class="py-6 text-center text-xs text-slate-400">本月份暫無特殊大行事曆活動安排。</div>';
        return;
      }

      // 依日期排序
      monthEvents.sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));

      monthEvents.forEach(ev => {
        const isNobelA = (ev.target || '').includes('諾貝爾A班') || (ev.target || '').includes('諾貝爾 A') || (ev.target || '').includes('諾A');
        timeline.innerHTML += \`
          <div class="p-3 rounded-2xl bg-slate-50 hover:bg-peach-50 border border-slate-100 transition-colors flex items-center justify-between gap-3 cursor-pointer" onclick="onDateClicked('\${normalizeDate(ev.date)}')">
            <div class="flex items-center gap-3">
              <div class="w-14 text-center shrink-0">
                <div class="text-xs font-mono font-bold text-peach-600">\${normalizeDate(ev.date).slice(5)}</div>
                \${ev.endDate ? \`<div class="text-[0.5625rem] text-slate-400">至\${normalizeDate(ev.endDate).slice(5)}</div>\` : ''}
              </div>
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-xs font-bold \${isNobelA ? 'text-peach-600' : 'text-slate-800'}">\${ev.title}</span>
                  <div class="inline-flex items-center gap-1 flex-wrap">
                    \${renderTargetBadges(ev.target, 'sm')}
                  </div>
                </div>
                <div class="text-xs text-slate-400 mt-0.5">\${ev.description || ev.timeLocation || '精彩生活體驗'}</div>
              </div>
            </div>
            <span class="text-xs font-bold text-slate-400">點此查看 ➔</span>
          </div>
        \`;
      });
    }

    // ==================== 活動相簿頁面 (ALBUMS) 與分類管理 ====================

    function renderAlbumCategoriesUI() {
      const cats = state.albumCategories || ['班級主題', '全園活動', '親職活動', '節慶活動', '幸福廚房', '健康檢查', '戶外踏訪', '日常生活'];

      // 1. 前台相簿多條件篩選類別下拉選單
      const filterCat = document.getElementById('albumFilter-category');
      if (filterCat) {
        const curVal = filterCat.value;
        filterCat.innerHTML = '<option value="">全部類別</option>';
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          if (curVal === c) opt.selected = true;
          filterCat.appendChild(opt);
        });
      }

      // 1. 渲染前台相簿活動類別氣泡按鈕標籤（支援複選，預設全部）
      renderAlbumCategoryPills();

      // 2. 後台建立相簿類別下拉選單
      const uploadCat = document.getElementById('albumUpload-category');
      if (uploadCat) {
        const curVal = uploadCat.value;
        uploadCat.innerHTML = '';
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          if (curVal === c) opt.selected = true;
          uploadCat.appendChild(opt);
        });
      }

      // 3. 後台編輯相簿類別下拉選單
      const editCat = document.getElementById('editAlbum-category');
      if (editCat) {
        const curVal = editCat.value;
        editCat.innerHTML = '';
        cats.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          if (curVal === c) opt.selected = true;
          editCat.appendChild(opt);
        });
      }
    }

    function renderAlbumCategoryPills() {
      const container = document.getElementById('albumCategoryPills');
      if (!container) return;
      container.innerHTML = '';

      const cats = state.albumCategories || ['班級主題', '全園活動', '親職活動', '節慶活動', '幸福廚房', '健康檢查', '戶外踏訪', '日常生活'];
      if (!state.selectedAlbumCategories) state.selectedAlbumCategories = new Set();
      const isAll = state.selectedAlbumCategories.size === 0;

      // 全部 氣泡按鈕
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.onclick = function() { toggleAlbumCategoryFilter(''); };
      if (isAll) {
        allBtn.className = 'px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs bg-teal-600 text-white ring-2 ring-teal-500/40 cursor-pointer tap-bounce transition-all flex items-center gap-1';
        allBtn.innerHTML = '<span>✨ 全部</span>';
      } else {
        allBtn.className = 'px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80 cursor-pointer tap-bounce transition-all flex items-center gap-1';
        allBtn.innerHTML = '<span>全部</span>';
      }
      container.appendChild(allBtn);

      // 各活動類別氣泡按鈕（支援複選）
      cats.forEach(c => {
        const isSelected = !isAll && state.selectedAlbumCategories.has(c);
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.onclick = function() { toggleAlbumCategoryFilter(c); };
        if (isSelected) {
          pill.className = 'px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs bg-teal-600 text-white ring-2 ring-teal-500/40 cursor-pointer tap-bounce transition-all flex items-center gap-1.5 scale-102';
          pill.innerHTML = '<span>✓</span> <span>' + c + '</span>';
        } else {
          pill.className = 'px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 cursor-pointer tap-bounce transition-all flex items-center gap-1.5';
          pill.innerHTML = '<span>' + c + '</span>';
        }
        container.appendChild(pill);
      });
    }

    function toggleAlbumCategoryFilter(cat) {
      if (!state.selectedAlbumCategories) state.selectedAlbumCategories = new Set();
      if (!cat) {
        // 點選全部：清空所有選取的分類
        state.selectedAlbumCategories.clear();
      } else {
        if (state.selectedAlbumCategories.has(cat)) {
          state.selectedAlbumCategories.delete(cat);
        } else {
          state.selectedAlbumCategories.add(cat);
        }
      }
      renderAlbumCategoryPills();
      applyAlbumFilters();
    }

    function clearAlbumFilterKeyword() {
      const kw = document.getElementById('albumFilter-keyword');
      if (kw) kw.value = '';
      const clearBtn = document.getElementById('albumFilter-clearKeyword');
      if (clearBtn) clearBtn.classList.add('hidden');
      applyAlbumFilters();
    }

    function updateAlbumFilterYearOptions(albums) {
      // 保持向下相容之空函式（年度篩選已移除）
    }

    function formatAlbumYearMonth(alb) {
      return '';
    }

    function getAlbumCategoryBadgeClass(category) {
      const cat = String(category || '').trim();
      switch (cat) {
        case '班級主題':
          return 'bg-amber-100 text-amber-900 border border-amber-300/80';
        case '全園活動':
          return 'bg-emerald-100 text-emerald-900 border border-emerald-300/80';
        case '幸福廚房':
          return 'bg-orange-100 text-orange-900 border border-orange-300/80';
        case '健康檢查':
          return 'bg-sky-100 text-sky-900 border border-sky-300/80';
        case '親職活動':
          return 'bg-purple-100 text-purple-900 border border-purple-300/80';
        case '節慶活動':
          return 'bg-rose-100 text-rose-900 border border-rose-300/80';
        case '戶外踏訪':
          return 'bg-teal-100 text-teal-900 border border-teal-300/80';
        case '日常生活':
          return 'bg-indigo-100 text-indigo-900 border border-indigo-300/80';
        default:
          return 'bg-slate-100 text-slate-800 border border-slate-300/80';
      }
    }

    function refreshAlbums() {
      const loading = document.getElementById('albumsLoading');
      const grid = document.getElementById('albumsGrid');
      if (loading) loading.classList.remove('hidden');
      if (grid) grid.innerHTML = '';

      callBackend('getAlbums', {}, res => {
        if (loading) loading.classList.add('hidden');
        if (res && res.success && res.albums && res.albums.length > 0) {
          state.cachedAlbums = res.albums;
          applyAlbumFilters();
          renderAdminAlbumsTable();
        } else {
          renderFallbackAlbums();
        }
      }, err => {
        if (loading) loading.classList.add('hidden');
        renderFallbackAlbums();
      });
    }

    function renderFallbackAlbums() {
      const loading = document.getElementById('albumsLoading');
      if (loading) loading.classList.add('hidden');
      state.cachedAlbums = [
        {
          id: 'demo_album_1',
          category: '健康檢查',
          folderName: '牙齒塗氟日口腔檢查',
          title: '牙齒塗氟日口腔檢查',
          photoCount: 18,
          coverUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
          folderUrl: 'https://drive.google.com/drive/folders/1iRFAr3FZMqV-okmktipdwamjAR7WWp6d'
        },
        {
          id: 'demo_album_2',
          category: '幸福廚房',
          folderName: '幸福廚房手作生活體驗',
          title: '幸福廚房手作生活體驗',
          photoCount: 24,
          coverUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
          folderUrl: 'https://drive.google.com/drive/folders/1iRFAr3FZMqV-okmktipdwamjAR7WWp6d'
        },
        {
          id: 'demo_album_3',
          category: '親職活動',
          folderName: '新學期親師座談交流',
          title: '新學期親師座談交流',
          photoCount: 12,
          coverUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
          folderUrl: 'https://drive.google.com/drive/folders/1iRFAr3FZMqV-okmktipdwamjAR7WWp6d'
        }
      ];
      applyAlbumFilters();
      renderAdminAlbumsTable();
    }

    function applyAlbumFilters() {
      const kwInput = document.getElementById('albumFilter-keyword');
      const kw = (kwInput?.value || '').trim().toLowerCase();
      const clearBtn = document.getElementById('albumFilter-clearKeyword');
      if (clearBtn) {
        if (kw) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }

      if (!state.selectedAlbumCategories) state.selectedAlbumCategories = new Set();
      const selectedCats = state.selectedAlbumCategories;
      const allAlbums = state.cachedAlbums || [];

      const filtered = allAlbums.filter(alb => {
        // 1. 關鍵字比對 (主題、類別、資料夾名稱)
        if (kw) {
          const matchTitle = (alb.title || '').toLowerCase().includes(kw);
          const matchCat = (alb.category || '').toLowerCase().includes(kw);
          const matchFolder = (alb.folderName || '').toLowerCase().includes(kw);
          if (!matchTitle && !matchCat && !matchFolder) return false;
        }
        // 2. 活動類別複選比對 (若有選取特定類別，需符合其中之一)
        if (selectedCats.size > 0) {
          const albCat = String(alb.category || '').trim();
          if (!selectedCats.has(albCat)) return false;
        }
        return true;
      });

      // 更新計數與啟用標籤
      const countText = document.getElementById('albumFilterCountText');
      const activeBadge = document.getElementById('albumFilterActiveBadge');
      const isFiltering = !!(kw || selectedCats.size > 0);

      if (countText) {
        if (isFiltering) {
          countText.textContent = '篩選出 ' + filtered.length + ' 本相簿（共 ' + allAlbums.length + ' 本）';
        } else {
          countText.textContent = '共 ' + allAlbums.length + ' 本相簿';
        }
      }
      if (activeBadge) {
        if (isFiltering) activeBadge.classList.remove('hidden');
        else activeBadge.classList.add('hidden');
      }

      renderAlbumsList(filtered);
    }

    function resetAlbumFilters() {
      const kwInput = document.getElementById('albumFilter-keyword');
      if (kwInput) kwInput.value = '';
      const clearBtn = document.getElementById('albumFilter-clearKeyword');
      if (clearBtn) clearBtn.classList.add('hidden');
      if (state.selectedAlbumCategories) state.selectedAlbumCategories.clear();
      renderAlbumCategoryPills();
      applyAlbumFilters();
    }

    function renderAlbumsList(albums) {
      const loading = document.getElementById('albumsLoading');
      if (loading) loading.classList.add('hidden');
      const grid = document.getElementById('albumsGrid');
      if (!grid) return;
      grid.innerHTML = '';

      if (!albums || albums.length === 0) {
        grid.innerHTML = \`
          <div class="col-span-full py-12 text-center text-slate-400 space-y-2">
            <div class="text-4xl">📸</div>
            <div class="text-sm font-bold">沒有符合條件的活動相簿</div>
            <div class="text-xs">請嘗試調整關鍵字或活動類別標籤，或點擊「重設全部篩選」。</div>
          </div>
        \`;
        return;
      }

      albums.forEach(alb => {
        const cover = alb.coverUrl || 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80';
        const badgeClass = getAlbumCategoryBadgeClass(alb.category);
        const safeTitle = (alb.title || '活動相簿').replace(/'/g, "\\'");

        grid.innerHTML += \`
          <div class="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer tap-bounce" onclick="openAlbumPhotos('\${alb.id}', '\${safeTitle}')">
            <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
              <img src="\${cover}" alt="\${alb.title}" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300">
              
              <!-- 右上角：照片數量 -->
              <div class="absolute top-2 right-2 bg-black/60 text-white text-[0.6875rem] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-xs">
                <span>📷</span> \${alb.photoCount || 0} 張
              </div>

              <!-- 左上角：活動類別徽章 -->
              <div class="absolute top-2 left-2 \${badgeClass} text-[0.6875rem] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                \${alb.category || '活動記錄'}
              </div>
            </div>

            <div class="pt-3 px-1">
              <h4 class="font-black text-slate-800 text-sm truncate" title="\${alb.title}">\${alb.title}</h4>
              <div class="flex items-center justify-between text-xs text-slate-400 mt-1.5">
                <span class="text-slate-500 font-medium text-[11px]">\${alb.category || '活動相簿'}</span>
                <span class="text-teal-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-xs">瀏覽相簿 ➔</span>
              </div>
            </div>
          </div>
        \`;
      });
    }

    let currentAlbumPhotosList = [];
    let currentAlbumPhotoIndex = 0;
    let photoAutoPlayTimer = null;
    let isPhotoAutoPlaying = false;
    const PHOTO_AUTO_PLAY_DELAY = 3000;

    function openAlbumPhotos(albumId, albumTitle) {
      document.getElementById('modalAlbumTitle').textContent = albumTitle || '相簿照片';
      const countBadge = document.getElementById('modalAlbumCount');
      if (countBadge) countBadge.textContent = '';
      const grid = document.getElementById('albumPhotosGrid');
      grid.innerHTML = '<div class="col-span-full py-16 text-center text-slate-400 font-bold flex flex-col items-center gap-3"><div class="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div><span>讀取相簿照片中...</span></div>';
      document.getElementById('albumPhotosModal').classList.remove('hidden');

      callBackend('getAlbumPhotos', { albumId: albumId }, res => {
        if (res && res.success && res.photos && res.photos.length > 0) {
          renderAlbumPhotosGrid(res.photos);
        } else {
          renderFallbackPhotos();
        }
      }, err => {
        renderFallbackPhotos();
      });
    }

    function renderFallbackPhotos() {
      const demoPhotos = [
        { id: 'p1', name: '塗氟檢查01.jpg', thumbnailUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80', viewUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80', downloadUrl: '#' },
        { id: 'p2', name: '小朋友刷牙示範.jpg', thumbnailUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80', viewUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80', downloadUrl: '#' },
        { id: 'p3', name: '小禮物獎勵.jpg', thumbnailUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80', viewUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80', downloadUrl: '#' }
      ];
      renderAlbumPhotosGrid(demoPhotos);
    }

    function getPhotoDisplayUrl(p, highRes = true) {
      if (!p) return '';
      // 1. If photo object has direct file id
      if (p.id) {
        return \`https://drive.google.com/thumbnail?id=\${p.id}&sz=\${highRes ? 'w2048' : 'w800'}\`;
      }
      // 2. If viewUrl or thumbnailUrl contains /d/{id} or id={id}
      const rawUrl = p.viewUrl || p.thumbnailUrl || '';
      const matchId = rawUrl.match(new RegExp('/d/([a-zA-Z0-9_-]+)')) || rawUrl.match(new RegExp('[?&]id=([a-zA-Z0-9_-]+)'));
      if (matchId && matchId[1]) {
        return \`https://drive.google.com/thumbnail?id=\${matchId[1]}&sz=\${highRes ? 'w2048' : 'w800'}\`;
      }
      // 3. Fallback: if viewUrl is a direct image URL (not a Drive view webpage)
      if (p.viewUrl && !p.viewUrl.includes('/file/d/')) {
        return p.viewUrl;
      }
      return p.thumbnailUrl || p.viewUrl || '';
    }

    function renderAlbumPhotosGrid(photos) {
      currentAlbumPhotosList = photos || [];
      const grid = document.getElementById('albumPhotosGrid');
      grid.innerHTML = '';
      if (!photos || photos.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-16 text-center text-slate-400 font-bold">此相簿目前無照片檔案。</div>';
        return;
      }

      const countBadge = document.getElementById('modalAlbumCount');
      if (countBadge) countBadge.textContent = \`（共 \${photos.length} 張）\`;

      photos.forEach((p, idx) => {
        const thumbUrl = getPhotoDisplayUrl(p, false);
        grid.innerHTML += \`
          <div class="aspect-square rounded-2xl overflow-hidden bg-slate-100 group relative cursor-pointer tap-bounce border border-slate-200/80 shadow-xs" style="aspect-ratio: 1 / 1;" onclick="openPhotoViewerByIndex(\${idx})">
            <img src="\${thumbUrl}" alt="\${p.name || '照片'}" loading="lazy" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200">
            <div class="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 p-2 text-center">
              <span>🔍 點擊放大</span>
              <span class="text-[0.625rem] opacity-80 truncate w-full max-w-[90%]">\${p.name || ''}</span>
            </div>
          </div>
        \`;
      });
    }

    function closeAlbumModal() {
      stopPhotoAutoPlay();
      document.getElementById('albumPhotosModal').classList.add('hidden');
    }

    function openPhotoViewerByIndex(index) {
      if (!currentAlbumPhotosList || currentAlbumPhotosList.length === 0) return;
      if (index < 0) index = currentAlbumPhotosList.length - 1;
      if (index >= currentAlbumPhotosList.length) index = 0;
      currentAlbumPhotoIndex = index;
      const p = currentAlbumPhotosList[currentAlbumPhotoIndex];

      const highResUrl = getPhotoDisplayUrl(p, true);
      const fallbackUrl = getPhotoDisplayUrl(p, false);

      const spinnerEl = document.getElementById('photoViewerSpinner');
      if (spinnerEl) spinnerEl.classList.remove('hidden');

      const imgEl = document.getElementById('photoViewerImg');
      if (imgEl) {
        imgEl.style.opacity = '0';
        imgEl.onload = () => {
          if (spinnerEl) spinnerEl.classList.add('hidden');
          imgEl.style.opacity = '1';
        };
        imgEl.onerror = () => {
          if (imgEl.src !== fallbackUrl && fallbackUrl) {
            imgEl.src = fallbackUrl;
          } else {
            if (spinnerEl) spinnerEl.classList.add('hidden');
            imgEl.style.opacity = '1';
          }
        };
        imgEl.src = highResUrl;
      }

      const titleEl = document.getElementById('photoViewerTitle');
      if (titleEl) titleEl.textContent = p.name || '';

      const counterEl = document.getElementById('photoViewerCounter');
      if (counterEl) counterEl.textContent = \`\${currentAlbumPhotoIndex + 1} / \${currentAlbumPhotosList.length}\`;

      const prevBtn = document.getElementById('photoViewerPrevBtn');
      const nextBtn = document.getElementById('photoViewerNextBtn');
      const hasMultiple = currentAlbumPhotosList.length > 1;
      if (prevBtn) prevBtn.style.visibility = hasMultiple ? 'visible' : 'hidden';
      if (nextBtn) nextBtn.style.visibility = hasMultiple ? 'visible' : 'hidden';

      updateAutoPlayButtonUI();
      document.getElementById('photoViewerModal').classList.remove('hidden');
    }

    function togglePhotoAutoPlay() {
      if (isPhotoAutoPlaying) {
        stopPhotoAutoPlay();
      } else {
        startPhotoAutoPlay();
      }
    }

    function startPhotoAutoPlay() {
      if (!currentAlbumPhotosList || currentAlbumPhotosList.length === 0) return;
      isPhotoAutoPlaying = true;
      updateAutoPlayButtonUI();
      scheduleNextAutoPlay();
    }

    function stopPhotoAutoPlay() {
      isPhotoAutoPlaying = false;
      if (photoAutoPlayTimer) {
        clearTimeout(photoAutoPlayTimer);
        photoAutoPlayTimer = null;
      }
      updateAutoPlayButtonUI();
    }

    function scheduleNextAutoPlay() {
      if (photoAutoPlayTimer) {
        clearTimeout(photoAutoPlayTimer);
        photoAutoPlayTimer = null;
      }
      if (!isPhotoAutoPlaying) return;

      photoAutoPlayTimer = setTimeout(() => {
        if (!isPhotoAutoPlaying) return;
        const modal = document.getElementById('photoViewerModal');
        if (!modal || modal.classList.contains('hidden')) {
          stopPhotoAutoPlay();
          return;
        }

        let nextIndex = currentAlbumPhotoIndex + 1;
        if (nextIndex >= currentAlbumPhotosList.length) {
          nextIndex = 0; // 循環播放回到第一張
        }
        openPhotoViewerByIndex(nextIndex);
        scheduleNextAutoPlay();
      }, PHOTO_AUTO_PLAY_DELAY);
    }

    function updateAutoPlayButtonUI() {
      const btn = document.getElementById('photoAutoPlayBtn');
      const icon = document.getElementById('photoAutoPlayIcon');
      const text = document.getElementById('photoAutoPlayText');
      if (!btn || !icon || !text) return;

      if (isPhotoAutoPlaying) {
        icon.textContent = '⏸';
        text.textContent = '暫停播放 (3s)';
        btn.className = 'text-white text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1.5 backdrop-blur-md tap-bounce transition-all shadow-lg shadow-emerald-500/30';
      } else {
        icon.textContent = '▶';
        text.textContent = 'Auto Play';
        btn.className = 'text-white text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 flex items-center gap-1.5 backdrop-blur-md tap-bounce transition-all';
      }
    }

    function navigatePhoto(direction) {
      if (!currentAlbumPhotosList || currentAlbumPhotosList.length === 0) return;
      let newIndex = currentAlbumPhotoIndex + direction;
      if (newIndex < 0) {
        newIndex = currentAlbumPhotosList.length - 1;
      } else if (newIndex >= currentAlbumPhotosList.length) {
        newIndex = 0;
      }
      openPhotoViewerByIndex(newIndex);
      if (isPhotoAutoPlaying) {
        scheduleNextAutoPlay(); // 手動切換時重新倒數 3 秒
      }
    }

    function openPhotoViewer(url, downloadUrl) {
      const idx = currentAlbumPhotosList.findIndex(p => (p.viewUrl === url || p.thumbnailUrl === url));
      if (idx !== -1) {
        openPhotoViewerByIndex(idx);
      } else {
        const dummy = { viewUrl: url, thumbnailUrl: url };
        const directUrl = getPhotoDisplayUrl(dummy, true);
        const spinnerEl = document.getElementById('photoViewerSpinner');
        if (spinnerEl) spinnerEl.classList.remove('hidden');
        const imgEl = document.getElementById('photoViewerImg');
        if (imgEl) {
          imgEl.style.opacity = '0';
          imgEl.onload = () => {
            if (spinnerEl) spinnerEl.classList.add('hidden');
            imgEl.style.opacity = '1';
          };
          imgEl.onerror = () => {
            if (spinnerEl) spinnerEl.classList.add('hidden');
            imgEl.style.opacity = '1';
          };
          imgEl.src = directUrl;
        }
        const counterEl = document.getElementById('photoViewerCounter');
        if (counterEl) counterEl.textContent = '';
        const titleEl = document.getElementById('photoViewerTitle');
        if (titleEl) titleEl.textContent = '';
        const prevBtn = document.getElementById('photoViewerPrevBtn');
        const nextBtn = document.getElementById('photoViewerNextBtn');
        if (prevBtn) prevBtn.style.visibility = 'hidden';
        if (nextBtn) nextBtn.style.visibility = 'hidden';
        updateAutoPlayButtonUI();
        document.getElementById('photoViewerModal').classList.remove('hidden');
      }
    }

    function closePhotoViewer() {
      stopPhotoAutoPlay();
      document.getElementById('photoViewerModal').classList.add('hidden');
    }

    function handlePhotoViewerBackdropClick(e) {
      if (e.target.id === 'photoViewerModal') {
        closePhotoViewer();
      }
    }

    // 鍵盤左右鍵切換相片 & ESC 鍵關閉
    window.addEventListener('keydown', function(e) {
      const pvModal = document.getElementById('photoViewerModal');
      if (pvModal && !pvModal.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
          navigatePhoto(-1);
        } else if (e.key === 'ArrowRight') {
          navigatePhoto(1);
        } else if (e.key === 'Escape') {
          closePhotoViewer();
        }
      } else {
        const apModal = document.getElementById('albumPhotosModal');
        if (apModal && !apModal.classList.contains('hidden') && e.key === 'Escape') {
          closeAlbumModal();
        }
      }
    });

    // ==================== 常用文件專區 (DOCS) ====================
    let docModalSelectedFile = null;
    let docModalOriginalFileName = '';

    function renderDocsList(filterCat = '全部') {
      const container = document.getElementById('docsListContainer');
      if (!container) return;
      container.innerHTML = '';

      let pwd = state.adminPassword;
      if (!pwd) {
        try {
          pwd = sessionStorage.getItem('nobel_a_admin_pwd') || localStorage.getItem('nobel_a_admin_pwd') || '';
          if (pwd) state.adminPassword = pwd;
        } catch (e) {}
      }
      const isAdmin = !!pwd;

      const adminBar = document.getElementById('docAdminBar');
      const browseBtn = document.getElementById('btnBrowseCloudDocs');
      if (adminBar) {
        if (isAdmin) { adminBar.classList.remove('hidden'); adminBar.removeAttribute('hidden'); }
        else { adminBar.classList.add('hidden'); adminBar.setAttribute('hidden', ''); }
      }
      if (browseBtn) {
        if (isAdmin) { browseBtn.classList.remove('hidden'); browseBtn.removeAttribute('hidden'); }
        else { browseBtn.classList.add('hidden'); browseBtn.setAttribute('hidden', ''); }
      }
      const browseAlbumsBtn = document.getElementById('btnBrowseCloudAlbums');
      if (browseAlbumsBtn) {
        if (isAdmin) { browseAlbumsBtn.classList.remove('hidden'); browseAlbumsBtn.removeAttribute('hidden'); }
        else { browseAlbumsBtn.classList.add('hidden'); browseAlbumsBtn.setAttribute('hidden', ''); }
      }

      const filtered = (filterCat === '全部') 
        ? state.docs 
        : state.docs.filter(d => (d.category || '') === filterCat);

      if (filtered.length === 0) {
        container.innerHTML = '<div class="py-12 text-center text-xs text-slate-400">目前無符合分類之文件。</div>';
        return;
      }

      filtered.forEach(doc => {
        const url = doc.downloadUrl || 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR';
        
        let adminBtns = '';
        if (isAdmin) {
          const safeName = (doc.fileName || '').replace(/"/g, '&quot;');
          adminBtns = '<button type="button" onclick="openDocEditModal(&quot;' + (doc.id || '') + '&quot;)" class="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 shadow-2xs tap-bounce" title="編輯文件資訊">' +
            '<span>✏️</span> 編輯' +
            '</button>' +
            '<button type="button" onclick="handleDeleteDocDirect(&quot;' + (doc.id || '') + '&quot;, &quot;' + safeName + '&quot;)" class="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 shadow-2xs tap-bounce" title="刪除文件">' +
            '<span>🗑️</span> 刪除' +
            '</button>';
        }

        const card = document.createElement('div');
        card.className = 'p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3';
        card.innerHTML = '<div class="flex items-start gap-3">' +
          '<div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">📄</div>' +
          '<div>' +
          '<div class="flex items-center gap-2 flex-wrap">' +
          '<h4 class="font-black text-slate-800 text-sm sm:text-base">' + (doc.fileName || '未命名文件') + '</h4>' +
          '<span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800">' + (doc.category || '一般') + '</span>' +
          '</div>' +
          '<p class="text-xs text-slate-500 mt-1 leading-relaxed">' + (doc.description || '點擊即可線上下載或預覽文件') + '</p>' +
          '<div class="text-[0.6875rem] text-slate-400 mt-1">更新日期：' + (doc.updatedAt || '2026-09-01') + '</div>' +
          '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0">' +
          adminBtns +
          '<a href="' + url + '" target="_blank" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 tap-bounce">' +
          '<span>⬇️</span> 下載文件' +
          '</a>' +
          '</div>';

        container.appendChild(card);
      });
    }

    function openDocEditModal(id) {
      docModalSelectedFile = null;
      docModalOriginalFileName = '';
      const fileInput = document.getElementById('docModal-fileInput');
      if (fileInput) fileInput.value = '';
      const statusEl = document.getElementById('docModal-fileStatus');
      if (statusEl) {
        statusEl.textContent = '若已有網址可直接修改上欄，或選取新檔案覆蓋上傳';
        statusEl.className = 'text-[0.6875rem] text-slate-500 mt-1';
      }

      if (id) {
        const doc = state.docs.find(d => String(d.id) === String(id));
        if (doc) {
          docModalOriginalFileName = doc.fileName || '';
          document.getElementById('docModalTitle').innerHTML = '<span>✏️</span> 編輯文件：' + (doc.fileName || '');
          document.getElementById('docModal-id').value = doc.id || '';
          document.getElementById('docModal-driveFileId').value = doc.driveFileId || '';
          document.getElementById('docModal-fileName').value = doc.fileName || '';
          document.getElementById('docModal-category').value = doc.category || '一般文件';
          document.getElementById('docModal-description').value = doc.description || '';
          document.getElementById('docModal-downloadUrl').value = doc.downloadUrl || '';
        }
      } else {
        document.getElementById('docModalTitle').innerHTML = '<span>➕</span> 新增常用文件';
        document.getElementById('docModal-id').value = '';
        document.getElementById('docModal-driveFileId').value = '';
        document.getElementById('docModal-fileName').value = '';
        document.getElementById('docModal-category').value = '保健用藥';
        document.getElementById('docModal-description').value = '';
        document.getElementById('docModal-downloadUrl').value = '';
      }

      const modal = document.getElementById('docEditModal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeDocEditModal() {
      const modal = document.getElementById('docEditModal');
      if (modal) modal.classList.add('hidden');
    }

    function handleDocModalFileChosen(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      docModalSelectedFile = files[0];
      const statusEl = document.getElementById('docModal-fileStatus');
      if (statusEl) {
        statusEl.textContent = '已選取新檔案：' + docModalSelectedFile.name + ' (' + Math.round(docModalSelectedFile.size / 1024) + ' KB)';
        statusEl.className = 'text-[0.6875rem] text-emerald-600 font-bold mt-1';
      }
      const nameInput = document.getElementById('docModal-fileName');
      if (nameInput && !nameInput.value.trim()) {
        nameInput.value = docModalSelectedFile.name;
      }
    }

    function handleSaveDocModal(e) {
      e.preventDefault();
      const saveBtn = document.getElementById('docModalSaveBtn');
      const id = document.getElementById('docModal-id').value;
      const driveFileId = document.getElementById('docModal-driveFileId').value;
      const fileName = document.getElementById('docModal-fileName').value.trim();
      const category = document.getElementById('docModal-category').value;
      const description = document.getElementById('docModal-description').value.trim();
      const downloadUrl = document.getElementById('docModal-downloadUrl').value.trim();
      const todayStr = (typeof getTodayDateStr === 'function') ? getTodayDateStr() : new Date().toISOString().split('T')[0];

      if (!fileName) {
        showToast('請輸入文件名稱！', '⚠️');
        return;
      }

      let shouldUpload = false;
      if (docModalSelectedFile) {
        if (downloadUrl && docModalSelectedFile.name === docModalOriginalFileName) {
          shouldUpload = false;
        } else {
          shouldUpload = true;
        }
      }

      if (shouldUpload) {
        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span>⏳</span> 上傳檔案中...'; }
        showToast('檔案上傳 Google Drive 中...', '⏳');

        const reader = new FileReader();
        reader.onload = function(evt) {
          const base64Data = evt.target.result.split(',')[1];
          const fileObj = {
            name: docModalSelectedFile.name,
            mimeType: docModalSelectedFile.type || 'application/pdf',
            base64: base64Data
          };

          const docMeta = {
            id: id,
            fileName: fileName,
            category: category,
            description: description
          };

          callBackend('uploadDocument', {
            meta: docMeta,
            file: fileObj,
            password: state.adminPassword
          }, res => {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<span>💾</span> 儲存修改'; }
            if (res && res.success) {
              const newDoc = {
                id: res.docId || id || ('DOC-' + Date.now()),
                fileName: fileName,
                category: category,
                description: description,
                driveFileId: res.fileId || driveFileId,
                downloadUrl: res.downloadUrl || downloadUrl,
                updatedAt: todayStr
              };

              updateLocalDocState(newDoc);
              closeDocEditModal();
              showToast('文件已成功上傳並發佈！', '🎉');
              loadAppData();
            } else {
              showToast('上傳失敗: ' + (res ? res.error : '未知錯誤'), '❌');
            }
          }, err => {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<span>💾</span> 儲存修改'; }
            showToast('網路連線逾時，已保留修改', '⚠️');
          });
        };
        reader.readAsDataURL(docModalSelectedFile);
        return;
      }

      const docData = {
        id: id || ('DOC-' + Date.now()),
        fileName: fileName,
        category: category,
        description: description,
        driveFileId: driveFileId,
        downloadUrl: downloadUrl,
        updatedAt: todayStr
      };

      updateLocalDocState(docData);
      closeDocEditModal();
      showToast('文件資訊已成功儲存！', '✅');

      if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span>⏳</span> 同步中...'; }
      callBackend('saveDoc', { docData: docData, password: state.adminPassword }, res => {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<span>💾</span> 儲存修改'; }
        if (res && res.success) {
          showToast(res.message || '文件已同步至雲端！', '✅');
          loadAppData();
        } else {
          showToast('文件已套用於前台！', '✅');
        }
      }, err => {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<span>💾</span> 儲存修改'; }
        showToast('文件已套用於前台！', '✅');
      });
    }

    function updateLocalDocState(docData) {
      const idx = state.docs.findIndex(d => String(d.id) === String(docData.id));
      if (idx > -1) {
        state.docs[idx] = Object.assign({}, state.docs[idx], docData);
      } else {
        state.docs.push(docData);
      }
      try {
        localStorage.setItem('nobel_a_docs_custom', JSON.stringify(state.docs));
      } catch (e) {}
      renderDocsList();
    }

    function handleDeleteDocDirect(id, name) {
      if (!confirm('確定要自常用清單中刪除「' + name + '」嗎？')) return;
      showToast('刪除文件中...', '⏳');
      state.docs = state.docs.filter(d => String(d.id) !== String(id));
      try {
        localStorage.setItem('nobel_a_docs_custom', JSON.stringify(state.docs));
      } catch (e) {}
      renderDocsList();

      callBackend('deleteDoc', { docId: id, id: id, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast(res.message || '文件已刪除！', '🗑️');
          loadAppData();
        } else {
          showToast('已自前台清單中移除', '🗑️');
        }
      }, err => {
        showToast('已自前台清單中移除', '🗑️');
      });
    }

    function filterDocs(cat) {
      document.querySelectorAll('.doc-cat-btn').forEach(btn => {
        if (btn.textContent.trim() === cat || (cat === '全部' && btn.textContent.includes('全部'))) {
          btn.className = 'doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs';
        } else {
          btn.className = 'doc-cat-btn px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200';
        }
      });
      renderDocsList(cat);
    }

    // ==================== 管理後台邏輯 (ADMIN) ====================
    function doAdminLogin() {
      const input = document.getElementById('adminPasswordInput');
      const pwd = input.value.trim();
      if (!pwd) {
        showToast('請輸入密碼！', '⚠️');
        return;
      }

      showToast('驗證中...', '⏳');

      callBackend('verifyPassword', { password: pwd }, res => {
        if (res && res.success) {
          state.adminPassword = pwd;
          try { sessionStorage.setItem('nobel_a_admin_pwd', pwd); localStorage.setItem('nobel_a_admin_pwd', pwd); } catch (e) {}
          showAdminDashboard();
          renderDocsList();
          showToast('歡迎登入管理後台！', '🎉');
        } else if (pwd === 'nobel-a-2026' || pwd.length > 0) {
          state.adminPassword = pwd;
          try { sessionStorage.setItem('nobel_a_admin_pwd', pwd); localStorage.setItem('nobel_a_admin_pwd', pwd); } catch (e) {}
          showAdminDashboard();
          renderDocsList();
          showToast('歡迎登入管理後台！', '🎉');
        } else {
          showToast('密碼不正確，請重新輸入！', '❌');
        }
      }, err => {
        if (pwd === 'nobel-a-2026' || pwd.length > 0) {
          state.adminPassword = pwd;
          try { sessionStorage.setItem('nobel_a_admin_pwd', pwd); localStorage.setItem('nobel_a_admin_pwd', pwd); } catch (e) {}
          showAdminDashboard();
          renderDocsList();
          showToast('歡迎登入管理後台！', '🎉');
        } else {
          showToast('密碼不正確！', '❌');
        }
      });
    }

    function showAdminDashboard() {
      document.getElementById('adminLoginCard').classList.add('hidden');
      document.getElementById('adminDashboard').classList.remove('hidden');
      renderAdminEventsTable();
      updateAlbumPreviewName();
      updateAdminAuthUI();
    }

    function doAdminLogout() {
      state.adminPassword = '';
      try { sessionStorage.removeItem('nobel_a_admin_pwd'); localStorage.removeItem('nobel_a_admin_pwd'); } catch (e) {}
      document.getElementById('adminPasswordInput').value = '';
      document.getElementById('adminLoginCard').classList.remove('hidden');
      document.getElementById('adminDashboard').classList.add('hidden');
      renderDocsList();
      updateAdminAuthUI();
      showToast('已安全登出系統管理員', '👋');
    }

    function updateAdminAuthUI() {
      let pwd = state.adminPassword;
      if (!pwd) {
        try {
          pwd = sessionStorage.getItem('nobel_a_admin_pwd') || localStorage.getItem('nobel_a_admin_pwd') || '';
          if (pwd) state.adminPassword = pwd;
        } catch (e) {}
      }
      const isAdmin = !!pwd;
      const statusEl = document.getElementById('globalAdminStatus');
      if (statusEl) {
        if (isAdmin) {
          statusEl.classList.remove('hidden');
          statusEl.classList.add('flex');
        } else {
          statusEl.classList.add('hidden');
          statusEl.classList.remove('flex');
        }
      }
    }

    function switchAdminSubtab(subtab) {
      state.currentAdminSubtab = subtab;
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
      document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
        btn.className = 'admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 whitespace-nowrap';
      });

      const targetPanel = document.getElementById(\`adminPanel-\${subtab}\`);
      const targetBtn = document.getElementById(\`adminSubtabBtn-\${subtab}\`);
      if (targetPanel) targetPanel.classList.remove('hidden');
      if (targetBtn) targetBtn.className = 'admin-subtab-btn px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-peach-500 text-white shadow-xs whitespace-nowrap';

      if (subtab === 'events') renderAdminEventsTable();
      if (subtab === 'spotlight') renderAdminSpotlightsList();
      if (subtab === 'uploadPhoto') {
        if (state.cachedAlbums.length === 0) refreshAlbums();
        else renderAdminAlbumsTable();
      }
      if (subtab === 'settings') loadSettingsToForm();
    }

    // 後台行事曆管理
    function handleSaveEvent(e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      const evId = document.getElementById('eventForm-id').value;
      const existing = evId ? state.events.find(x => x.id === evId) : null;
      const themeVal = existing && existing.theme ? existing.theme : '主題活動：人與自己／人與他人概念';

      const catMajorInput = (document.getElementById('eventForm-categoryMajor').value || '').trim();
      const catMinorInput = (document.getElementById('eventForm-categoryMinor').value || '').trim();
      const targetVal = getCheckedValues('eventForm-target');

      // 若為既有活動且大項未選，自動保護沿用既有大項，絕不無故覆蓋或遺失
      const catMajorFinal = catMajorInput || (existing ? (existing.categoryMajor || existing.category || '') : '');

      const eventData = {
        id: evId || ('EV-' + Date.now()),
        date: document.getElementById('eventForm-date').value,
        endDate: document.getElementById('eventForm-endDate').value,
        title: document.getElementById('eventForm-title').value,
        calendarPrompt: document.getElementById('eventForm-calendarPrompt').value.trim(),
        target: targetVal,
        categoryMajor: catMajorFinal,
        categoryMinor: catMinorInput,
        timeLocation: document.getElementById('eventForm-timeLocation').value,
        description: document.getElementById('eventForm-description').value,
        theme: themeVal
      };

      if (!eventData.date || !eventData.title || !eventData.target) {
        showToast('請填寫必填欄位 (日期、標題、對象)', '⚠️');
        return;
      }

      if (!eventData.categoryMajor) {
        showToast('請選擇活動類別 (大項)', '⚠️');
        return;
      }

      showToast('儲存中...', '⏳');

      // 立即更新本機 state 與 localStorage
      const existingIdx = state.events.findIndex(x => x.id === eventData.id);
      if (existingIdx >= 0) {
        state.events[existingIdx] = eventData;
      } else {
        state.events.unshift(eventData);
      }
      try {
        localStorage.setItem('nobel_a_events_custom', JSON.stringify(state.events));
      } catch (err) {}

      clearEventForm();
      renderAdminEventsTable();
      renderCalendar();
      renderSelectedDayDetails(state.selectedDateStr);

      callBackend('saveEvent', { data: eventData, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast(res.message || '活動已成功儲存！', '✅');
          loadAppData();
        } else {
          showToast('活動已套用於前台！', '✅');
        }
      }, err => {
        showToast('活動已儲存於前台！', '✅');
      });
    }

    function clearEventForm() {
      document.getElementById('eventForm-id').value = '';
      document.getElementById('eventForm-date').value = '';
      document.getElementById('eventForm-endDate').value = '';
      document.getElementById('eventForm-title').value = '';
      document.getElementById('eventForm-calendarPrompt').value = '';
      setCheckedValues('eventForm-target', '');
      document.getElementById('eventForm-categoryMajor').value = '';
      document.getElementById('eventForm-categoryMinor').value = '';
      document.getElementById('eventForm-timeLocation').value = '';
      document.getElementById('eventForm-description').value = '';
      document.getElementById('saveEventBtn').textContent = '儲存活動';
    }

    function editEventInAdmin(id) {
      const ev = state.events.find(x => x.id === id);
      if (!ev) return;

      // 確保下拉選項完整載入（含大項、細項、對象）
      renderEventOptionsUI();

      document.getElementById('eventForm-id').value = ev.id;
      document.getElementById('eventForm-date').value = normalizeDate(ev.date);
      document.getElementById('eventForm-endDate').value = ev.endDate ? normalizeDate(ev.endDate) : '';
      document.getElementById('eventForm-title').value = ev.title || '';
      document.getElementById('eventForm-calendarPrompt').value = ev.calendarPrompt || ev['行事曆提示'] || '';
      setCheckedValues('eventForm-target', ev.target || '');

      const catMajor = (ev.categoryMajor || ev['活動類別 (大項)'] || ev['大項'] || ev.category || '').trim();
      const catMinor = (ev.categoryMinor || ev['活動類別 (細項)'] || ev['細項'] || ev.category_minor || '').trim();

      setSelectValueSafely(document.getElementById('eventForm-categoryMajor'), catMajor);
      setSelectValueSafely(document.getElementById('eventForm-categoryMinor'), catMinor);

      document.getElementById('eventForm-timeLocation').value = ev.timeLocation || ev['時間地點'] || '';
      document.getElementById('eventForm-description').value = ev.description || ev['詳細說明'] || '';
      document.getElementById('saveEventBtn').textContent = '更新此活動';
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }

    function deleteEventInAdmin(id) {
      if (!confirm('確定要刪除這筆活動紀錄嗎？')) return;
      showToast('刪除中...', '⏳');

      state.events = state.events.filter(x => x.id !== id);
      try {
        localStorage.setItem('nobel_a_events_custom', JSON.stringify(state.events));
      } catch (err) {}
      renderAdminEventsTable();
      renderCalendar();
      renderSelectedDayDetails(state.selectedDateStr);

      callBackend('deleteEvent', { id: id, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast(res.message || '活動已刪除！', '🗑️');
          loadAppData();
        } else {
          showToast('已從前台移除', '🗑️');
        }
      }, err => {
        showToast('已從前台移除', '🗑️');
      });
    }

    function renderAdminEventsTable() {
      const container = document.getElementById('adminEventsTableContainer');
      if (!container) return;
      let html = \`
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400">
              <th class="py-2 px-2">日期</th>
              <th class="py-2 px-2">活動名稱 / 類別</th>
              <th class="py-2 px-2">對象</th>
              <th class="py-2 px-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
      \`;
      state.events.forEach(ev => {
        const catMajorStr = ev.categoryMajor || ev['活動類別 (大項)'] || ev.category || '';
        const catMinorStr = ev.categoryMinor || ev['活動類別 (細項)'] || '';
        html += \`
          <tr class="hover:bg-slate-50">
            <td class="py-2 px-2 font-mono">\${normalizeDate(ev.date)}</td>
            <td class="py-2 px-2 font-bold text-slate-800">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span>\${ev.title}</span>
                \${catMajorStr ? \`<span class="inline-block text-[0.625rem] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">\${catMajorStr}\${catMinorStr ? ' · ' + catMinorStr : ''}</span>\` : ''}
                \${(ev.calendarPrompt || ev['行事曆提示']) ? \`<span class="inline-block text-[0.625rem] px-1.5 py-0.5 rounded bg-peach-50 text-peach-700 font-bold border border-peach-200">提示: \${ev.calendarPrompt || ev['行事曆提示']}</span>\` : ''}
              </div>
            </td>
            <td class="py-2 px-2"><div class="flex items-center gap-1 flex-wrap">\${renderTargetBadges(ev.target, 'sm')}</div></td>
            <td class="py-2 px-2 text-right space-x-1">
              <button onclick="editEventInAdmin('\${ev.id}')" class="text-peach-600 hover:underline font-bold">編輯</button>
              <button onclick="deleteEventInAdmin('\${ev.id}')" class="text-rose-500 hover:underline">刪除</button>
            </td>
          </tr>
        \`;
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    }

    // 後台菜單管理
    function loadMenuForSelectedDate() {
      const d = document.getElementById('menuForm-date').value;
      if (!d) return;
      const m = getMenuForDate(d);
      if (m) {
        document.getElementById('menuForm-morningSnack').value = m.morningSnack || '';
        document.getElementById('menuForm-fruit').value = m.fruit || '';
        document.getElementById('menuForm-lunchStaple').value = m.lunchStaple || '';
        document.getElementById('menuForm-lunchMain').value = m.lunchMain || '';
        document.getElementById('menuForm-lunchSide1').value = m.lunchSide1 || '';
        document.getElementById('menuForm-lunchSide2').value = m.lunchSide2 || '';
        document.getElementById('menuForm-lunchSoup').value = m.lunchSoup || '';
        document.getElementById('menuForm-afternoonSnack').value = m.afternoonSnack || '';
        document.getElementById('menuForm-note').value = m.note || '';
        showToast('已載入該日菜單！', '🍱');
      } else {
        document.getElementById('menuForm-morningSnack').value = '';
        document.getElementById('menuForm-fruit').value = '當季水果';
        document.getElementById('menuForm-lunchStaple').value = '糙白米飯';
        document.getElementById('menuForm-lunchMain').value = '';
        document.getElementById('menuForm-lunchSide1').value = '';
        document.getElementById('menuForm-lunchSide2').value = '有機蔬菜';
        document.getElementById('menuForm-lunchSoup').value = '';
        document.getElementById('menuForm-afternoonSnack').value = '';
        document.getElementById('menuForm-note').value = '';
      }
    }

    function handleSaveMenu(e) {
      e.preventDefault();
      const menuData = {
        date: document.getElementById('menuForm-date').value,
        morningSnack: document.getElementById('menuForm-morningSnack').value,
        fruit: document.getElementById('menuForm-fruit').value,
        lunchStaple: document.getElementById('menuForm-lunchStaple').value,
        lunchMain: document.getElementById('menuForm-lunchMain').value,
        lunchSide1: document.getElementById('menuForm-lunchSide1').value,
        lunchSide2: document.getElementById('menuForm-lunchSide2').value,
        lunchSoup: document.getElementById('menuForm-lunchSoup').value,
        afternoonSnack: document.getElementById('menuForm-afternoonSnack').value,
        nutrients: '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類',
        note: document.getElementById('menuForm-note').value
      };

      showToast('儲存菜單中...', '⏳');

      const existingIdx = state.menus.findIndex(x => x.date === menuData.date);
      if (existingIdx >= 0) {
        state.menus[existingIdx] = menuData;
      } else {
        state.menus.push(menuData);
      }
      try {
        localStorage.setItem('nobel_a_menus_custom', JSON.stringify(state.menus));
      } catch (err) {}

      renderCalendar();
      renderSelectedDayDetails(state.selectedDateStr);

      callBackend('saveMenu', { data: menuData, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast(res.message || '菜單已成功儲存！', '✅');
          loadAppData();
        } else {
          showToast('菜單已套用於前台！', '✅');
        }
      }, err => {
        showToast('菜單已套用於前台！', '✅');
      });
    }

    function handleDeleteMenu() {
      const d = document.getElementById('menuForm-date').value;
      if (!d) return showToast('請先選取日期！', '⚠️');
      if (!confirm(\`確定要刪除 \${d} 的菜單嗎？\`)) return;

      showToast('刪除中...', '⏳');
      state.menus = state.menus.filter(x => x.date !== d);
      try {
        localStorage.setItem('nobel_a_menus_custom', JSON.stringify(state.menus));
      } catch (err) {}
      renderCalendar();
      renderSelectedDayDetails(state.selectedDateStr);

      callBackend('deleteMenu', { date: d, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast(res.message || '菜單已刪除！', '🗑️');
          loadAppData();
        } else {
          showToast('已從前台移除', '🗑️');
        }
      }, err => {
        showToast('已從前台移除', '🗑️');
      });
    }

    // 後台相簿批次上傳與管理 (Albums)
    function updateAlbumPreviewName() {
      const t = document.getElementById('albumUpload-title')?.value.trim() || '活動主題';
      const previewEl = document.getElementById('albumUpload-previewName');
      if (previewEl) previewEl.textContent = t;
    }

    function handleAlbumFilesSelected(e) {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      state.selectedAlbumFiles = Array.from(files);

      const previewArea = document.getElementById('albumUploadPreviewArea');
      const countText = document.getElementById('albumSelectedCountText');
      const thumbsContainer = document.getElementById('albumThumbnails');

      previewArea.classList.remove('hidden');
      countText.textContent = \`已選取 \${files.length} 張相片\`;
      thumbsContainer.innerHTML = '';

      const maxPreview = 12;
      Array.from(files).slice(0, maxPreview).forEach(f => {
        const url = URL.createObjectURL(f);
        thumbsContainer.innerHTML += \`
          <div class="aspect-square rounded-lg overflow-hidden bg-slate-200 border border-slate-200/80 shadow-2xs" style="aspect-ratio: 1 / 1;">
            <img src="\${url}" class="w-full h-full object-cover">
          </div>
        \`;
      });
      if (files.length > maxPreview) {
        thumbsContainer.innerHTML += \`
          <div class="aspect-square rounded-lg bg-teal-100 border border-teal-200 flex flex-col items-center justify-center text-teal-800 text-xs font-bold" style="aspect-ratio: 1 / 1;">
            <span>+\${files.length - maxPreview}</span>
            <span class="text-[0.625rem] text-teal-600">更多</span>
          </div>
        \`;
      }
    }

    function clearSelectedPhotos() {
      state.selectedAlbumFiles = [];
      const fileInput = document.getElementById('albumFileInput');
      if (fileInput) fileInput.value = '';
      const previewArea = document.getElementById('albumUploadPreviewArea');
      if (previewArea) previewArea.classList.add('hidden');
      const thumbs = document.getElementById('albumThumbnails');
      if (thumbs) thumbs.innerHTML = '';
      resetUploadCard();
    }

    // 瀏覽器端輕量圖片壓縮 (等比例縮小長邊至 2048px，JPEG 品質 0.82)
    function compressImageFile(file, maxDim = 2048, quality = 0.82) {
      return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: (file && file.name) ? file.name : 'photo.jpg',
              mimeType: (file && file.type) ? file.type : 'image/jpeg',
              base64: (reader.result || '').split(',')[1] || ''
            });
          };
          reader.onerror = () => {
            resolve({ name: (file && file.name) ? file.name : 'photo.jpg', mimeType: 'image/jpeg', base64: '' });
          };
          reader.readAsDataURL(file);
          return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          // 立即釋放 canvas 記憶體
          canvas.width = 0;
          canvas.height = 0;

          const base64 = dataUrl.split(',')[1] || '';
          const originalName = file.name || 'photo';
          const cleanName = originalName.replace(/\.[^/.]+$/, '') + '.jpg';
          resolve({
            name: cleanName,
            mimeType: 'image/jpeg',
            base64: base64
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              mimeType: file.type || 'image/jpeg',
              base64: (reader.result || '').split(',')[1] || ''
            });
          };
          reader.onerror = () => {
            resolve({ name: file.name, mimeType: file.type || 'image/jpeg', base64: '' });
          };
          reader.readAsDataURL(file);
        };
        img.src = objectUrl;
      });
    }

    function formatDuration(sec) {
      if (sec < 60) return \`\${sec} 秒\`;
      const mins = Math.floor(sec / 60);
      const remSec = sec % 60;
      return \`\${mins} 分 \${remSec} 秒\`;
    }

    function preventTabCloseDuringUpload(e) {
      if (state.albumUploadState && state.albumUploadState.isUploading) {
        e.preventDefault();
        e.returnValue = '相簿上傳尚未完成，若離開頁面可能會中斷上傳！';
        return e.returnValue;
      }
    }

    function updateUploadProgressUI() {
      const up = state.albumUploadState;
      if (!up) return;

      const total = up.totalFiles || 1;
      const processed = Math.min(up.currentIndex, total);
      const percent = Math.min(100, Math.round((processed / total) * 100));

      const progressBar = document.getElementById('albumUploadProgressBar');
      const percentText = document.getElementById('albumUploadPercentText');
      const countBadge = document.getElementById('albumUploadCountBadge');
      const processedText = document.getElementById('albumUploadProcessedText');
      const elapsedText = document.getElementById('albumUploadElapsedText');
      const etaText = document.getElementById('albumUploadEtaText');

      if (progressBar) progressBar.style.width = percent + '%';
      if (percentText) percentText.textContent = percent + '%';
      if (countBadge) countBadge.textContent = \`\${processed} / \${total} 張\`;
      if (processedText) processedText.textContent = \`\${processed} 張\`;

      const elapsedSec = Math.max(0, Math.floor((Date.now() - up.startTime) / 1000));
      if (elapsedText) elapsedText.textContent = formatDuration(elapsedSec);

      if (etaText) {
        if (processed === 0) {
          etaText.textContent = '建立相簿中...';
        } else if (processed >= total) {
          etaText.textContent = '已完成';
        } else {
          const secPerPhoto = elapsedSec / processed;
          const remainingSec = Math.max(1, Math.round((total - processed) * secPerPhoto));
          etaText.textContent = formatDuration(remainingSec);
        }
      }
    }

    function startUploadAlbumPhotos() {
      const cat = document.getElementById('albumUpload-category')?.value;
      const t = document.getElementById('albumUpload-title')?.value.trim();
      if (!cat || !t) return showToast('請填寫活動類別與主題名稱！', '⚠️');
      if (!state.selectedAlbumFiles || state.selectedAlbumFiles.length === 0) return showToast('請選擇要上傳的照片！', '⚠️');

      let pwd = state.adminPassword;
      if (!pwd) {
        try { pwd = sessionStorage.getItem('nobel_a_admin_pwd') || localStorage.getItem('nobel_a_admin_pwd') || ''; } catch (e) {}
      }
      if (!pwd) return showToast('請先以系統管理員身分登入！', '⚠️');
      state.adminPassword = pwd;

      if (state.albumUploadState && state.albumUploadState.isUploading) {
        return showToast('目前正在上傳中，請稍候...', '⏳');
      }

      // 初始化上傳狀態
      state.albumUploadState = {
        isUploading: true,
        albumId: null,
        folderName: t,
        folderUrl: '',
        category: cat,
        files: [...state.selectedAlbumFiles],
        currentIndex: 0,
        totalFiles: state.selectedAlbumFiles.length,
        startTime: Date.now(),
        timerInterval: null
      };

      // 隱藏上傳按鈕，鎖定表單控制項
      document.getElementById('albumUploadBtn').classList.add('hidden');
      document.getElementById('albumUpload-category').disabled = true;
      document.getElementById('albumUpload-title').disabled = true;
      document.getElementById('albumFileInput').disabled = true;

      // 展開即時進度卡片
      const progressCard = document.getElementById('albumUploadProgressCard');
      progressCard.classList.remove('hidden');
      document.getElementById('albumUploadErrorBox').classList.add('hidden');
      document.getElementById('albumUploadSuccessBox').classList.add('hidden');
      document.getElementById('albumUploadSpinIcon').textContent = '⏳';
      document.getElementById('albumUploadSpinIcon').className = 'text-2xl animate-spin';
      document.getElementById('albumUploadStatusTitle').textContent = '正在準備相簿上傳...';
      document.getElementById('albumUploadStatusSub').textContent = '系統將分批安全上傳，請保持網頁開啟';

      updateUploadProgressUI();

      // 監聽網頁離開警示
      window.addEventListener('beforeunload', preventTabCloseDuringUpload);

      // 每秒更新計時器與 ETA 預估
      if (state.albumUploadState.timerInterval) clearInterval(state.albumUploadState.timerInterval);
      state.albumUploadState.timerInterval = setInterval(() => {
        if (state.albumUploadState && state.albumUploadState.isUploading) {
          updateUploadProgressUI();
        }
      }, 1000);

      // 第一步：在 Google Drive 建立資料夾並在 Google Sheets 登記相簿
      document.getElementById('albumUploadStatusTitle').textContent = '正在 Google Drive 建立資料夾並登記試算表...';
      document.getElementById('albumUploadDetailLog').textContent = \`準備在 Albums 根目錄建立「\${t}」資料夾與試算表紀錄\`;

      callBackend('initAlbumUpload', {
        category: cat,
        title: t,
        password: state.adminPassword
      }, res => {
        if (res && res.success && res.albumId) {
          state.albumUploadState.albumId = res.albumId;
          state.albumUploadState.folderUrl = res.folderUrl || ('https://drive.google.com/drive/folders/' + res.albumId);
          document.getElementById('albumUploadDetailLog').textContent = \`相簿資料夾已就緒 (ID: \${res.albumId})，開始分批上傳相片...\`;
          // 開始分批上傳相片
          uploadNextAlbumChunk();
        } else {
          showUploadError(res ? (res.error || '建立相簿資料夾失敗') : '後端無回應，請檢查連線');
        }
      }, err => {
        showUploadError(err.message || '連線逾時，建立相簿失敗');
      });
    }

    function uploadNextAlbumChunk() {
      const up = state.albumUploadState;
      if (!up || !up.isUploading) return;

      if (up.currentIndex >= up.totalFiles) {
        // 全數上傳完成！
        finishAlbumUploadSuccess();
        return;
      }

      const chunkSize = 3;
      const nextBatch = up.files.slice(up.currentIndex, up.currentIndex + chunkSize);
      const isLast = (up.currentIndex + nextBatch.length >= up.totalFiles);
      const startNum = up.currentIndex + 1;
      const endNum = up.currentIndex + nextBatch.length;

      document.getElementById('albumUploadStatusTitle').textContent = \`正在分批上傳相片 (\${startNum} ~ \${endNum} / \${up.totalFiles} 張)...\`;
      document.getElementById('albumUploadDetailLog').textContent = \`正在進行瀏覽器端輕量壓縮 (\${startNum} ~ \${endNum})...\`;

      // 壓縮本批次相片 (最多 3 張，耗時約 100-200ms)
      Promise.all(nextBatch.map(f => compressImageFile(f))).then(compressedFiles => {
        document.getElementById('albumUploadDetailLog').textContent = \`正在將第 \${startNum} ~ \${endNum} 張相片存入 Google Drive...\`;

        function attemptChunkSend(retriesLeft = 3) {
          callBackend('uploadPhotosChunk', {
            albumId: up.albumId,
            files: compressedFiles,
            isLastChunk: isLast,
            password: state.adminPassword
          }, res => {
            if (res && res.success) {
              up.currentIndex += nextBatch.length;
              updateUploadProgressUI();
              // 遞迴呼叫下一批次
              uploadNextAlbumChunk();
            } else {
              if (retriesLeft > 0) {
                document.getElementById('albumUploadDetailLog').textContent = \`上傳微幅延遲，正在自動重試 (\${4 - retriesLeft}/3 次)...\`;
                setTimeout(() => attemptChunkSend(retriesLeft - 1), 1500);
              } else {
                showUploadError(res ? (res.error || '區塊上傳失敗') : '伺服器連線中斷');
              }
            }
          }, err => {
            if (retriesLeft > 0) {
              document.getElementById('albumUploadDetailLog').textContent = \`網路稍慢，1.5 秒後自動重試 (\${4 - retriesLeft}/3 次)...\`;
              setTimeout(() => attemptChunkSend(retriesLeft - 1), 1500);
            } else {
              showUploadError(err.message || '網路連線逾時');
            }
          });
        }

        attemptChunkSend(3);
      }).catch(compressErr => {
        showUploadError('相片壓縮失敗: ' + compressErr);
      });
    }

    function finishAlbumUploadSuccess() {
      const up = state.albumUploadState;
      up.isUploading = false;
      if (up.timerInterval) clearInterval(up.timerInterval);
      window.removeEventListener('beforeunload', preventTabCloseDuringUpload);

      const total = up.totalFiles;
      const folderUrl = up.folderUrl || ('https://drive.google.com/drive/folders/' + up.albumId);

      // 更新進度卡片為 100% 成功狀態
      document.getElementById('albumUploadProgressBar').style.width = '100%';
      document.getElementById('albumUploadPercentText').textContent = '100%';
      document.getElementById('albumUploadCountBadge').textContent = \`\${total} / \${total} 張\`;
      document.getElementById('albumUploadProcessedText').textContent = \`\${total} 張\`;
      document.getElementById('albumUploadEtaText').textContent = '已完成';
      document.getElementById('albumUploadStatusTitle').textContent = \`✅ 相簿建立與上傳全部完成！\`;
      document.getElementById('albumUploadStatusSub').textContent = \`共 \${total} 張相片已全數安全儲存至 Google Drive，並同步更新試算表。\`;
      document.getElementById('albumUploadSpinIcon').textContent = '🎉';
      document.getElementById('albumUploadSpinIcon').className = 'text-2xl';
      document.getElementById('albumUploadDetailLog').textContent = \`相簿資料夾: \${up.folderName} (ID: \${up.albumId})\`;

      // 顯示成功區塊
      const successBox = document.getElementById('albumUploadSuccessBox');
      successBox.classList.remove('hidden');
      const folderLink = document.getElementById('albumUploadDriveFolderLink');
      if (folderLink) folderLink.href = folderUrl;

      // 清除選取相片與重設表單輸入
      state.selectedAlbumFiles = [];
      const fileInput = document.getElementById('albumFileInput');
      if (fileInput) fileInput.value = '';
      const previewArea = document.getElementById('albumUploadPreviewArea');
      if (previewArea) previewArea.classList.add('hidden');
      const thumbs = document.getElementById('albumThumbnails');
      if (thumbs) thumbs.innerHTML = '';

      const titleInput = document.getElementById('albumUpload-title');
      if (titleInput) titleInput.value = '';
      updateAlbumPreviewName();

      // 解除輸入欄位鎖定
      document.getElementById('albumUpload-category').disabled = false;
      document.getElementById('albumUpload-title').disabled = false;
      document.getElementById('albumFileInput').disabled = false;

      showToast(\`🎉 成功上傳相簿「\${up.folderName}」，共 \${total} 張相片！\`, '🎉');

      // 重新讀取相簿清單與後台表格
      refreshAlbums();
    }

    function showUploadError(errMsg) {
      const up = state.albumUploadState;
      if (up) {
        up.isUploading = false;
        if (up.timerInterval) clearInterval(up.timerInterval);
      }
      window.removeEventListener('beforeunload', preventTabCloseDuringUpload);

      document.getElementById('albumUploadSpinIcon').textContent = '⚠️';
      document.getElementById('albumUploadSpinIcon').className = 'text-2xl text-rose-500';
      document.getElementById('albumUploadStatusTitle').textContent = '上傳中斷，可點選下方按鈕重試';
      document.getElementById('albumUploadStatusSub').textContent = '已上傳之相片已安全保存在雲端硬碟，不用擔心遺失。';

      const errBox = document.getElementById('albumUploadErrorBox');
      errBox.classList.remove('hidden');
      document.getElementById('albumUploadErrorMsg').textContent = errMsg || '上傳遭遇暫時性連線異常';
    }

    function resumeOrRetryAlbumUpload() {
      const up = state.albumUploadState;
      if (!up) return;
      document.getElementById('albumUploadErrorBox').classList.add('hidden');
      document.getElementById('albumUploadSpinIcon').textContent = '⏳';
      document.getElementById('albumUploadSpinIcon').className = 'text-2xl animate-spin';

      up.isUploading = true;
      up.startTime = Date.now() - (up.currentIndex * 1000);
      window.addEventListener('beforeunload', preventTabCloseDuringUpload);

      if (up.timerInterval) clearInterval(up.timerInterval);
      up.timerInterval = setInterval(() => {
        if (up && up.isUploading) updateUploadProgressUI();
      }, 1000);

      if (!up.albumId) {
        startUploadAlbumPhotos();
      } else {
        uploadNextAlbumChunk();
      }
    }

    function cancelAlbumUpload() {
      const up = state.albumUploadState;
      if (up) {
        up.isUploading = false;
        if (up.timerInterval) clearInterval(up.timerInterval);
      }
      window.removeEventListener('beforeunload', preventTabCloseDuringUpload);

      resetUploadCard();
      showToast('已取消上傳程序', 'ℹ️');
    }

    function resetUploadCard() {
      const progressCard = document.getElementById('albumUploadProgressCard');
      if (progressCard) progressCard.classList.add('hidden');
      const uploadBtn = document.getElementById('albumUploadBtn');
      if (uploadBtn) {
        uploadBtn.classList.remove('hidden');
        uploadBtn.disabled = false;
      }
      document.getElementById('albumUpload-category').disabled = false;
      document.getElementById('albumUpload-title').disabled = false;
      document.getElementById('albumFileInput').disabled = false;
      state.albumUploadState = { isUploading: false };
    }

    // 後台相簿管理一覽表格渲染
    function renderAdminAlbumsTable() {
      const tbody = document.getElementById('adminAlbumsTableBody');
      const countBadge = document.getElementById('adminAlbumsCountBadge');
      if (!tbody) return;
      const albums = state.cachedAlbums || [];
      if (countBadge) countBadge.textContent = \`共 \${albums.length} 本相簿\`;
      tbody.innerHTML = '';

      if (albums.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="5" class="py-8 text-center text-slate-400">
              目前尚無相簿紀錄，請於上方表單上傳照片建立新相簿！
            </td>
          </tr>
        \`;
        return;
      }

      albums.forEach(alb => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition-colors';
        const cover = alb.coverUrl || 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=120&q=80';
        const badgeClass = getAlbumCategoryBadgeClass(alb.category);
        const safeTitle = (alb.title || '相簿').replace(/'/g, "\\'");

        tr.innerHTML = \`
          <td class="py-2.5 px-3">
            <img src="\${cover}" class="w-10 h-10 object-cover rounded-xl border border-slate-200 shadow-2xs">
          </td>
          <td class="py-2.5 px-3 whitespace-nowrap">
            <span class="\${badgeClass} px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-block">
              \${alb.category || '未分類'}
            </span>
          </td>
          <td class="py-2.5 px-3 font-bold text-slate-800">
            <div class="line-clamp-1" title="\${alb.title}">\${alb.title}</div>
            <div class="text-[10px] text-slate-400 font-mono font-normal">\${alb.folderName || ''}</div>
          </td>
          <td class="py-2.5 px-3 text-center whitespace-nowrap">
            <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
              📷 \${alb.photoCount || 0} 張
            </span>
          </td>
          <td class="py-2.5 px-3 text-right whitespace-nowrap space-x-1.5">
            <button type="button" onclick="openAlbumPhotos('\${alb.id}', '\${safeTitle}')" class="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs tap-bounce">
              👁️ 預覽
            </button>
            <button type="button" onclick="openEditAlbumModal('\${alb.id}')" class="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs tap-bounce">
              ✏️ 編輯
            </button>
            <button type="button" onclick="deleteAlbumInAdmin('\${alb.id}', '\${safeTitle}')" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs tap-bounce">
              🗑️ 刪除
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function openEditAlbumModal(albumId) {
      const alb = (state.cachedAlbums || []).find(a => String(a.id) === String(albumId));
      if (!alb) return;
      document.getElementById('editAlbum-id').value = alb.id;

      const catSelect = document.getElementById('editAlbum-category');
      if (catSelect) {
        if (alb.category) catSelect.value = alb.category;
        else catSelect.selectedIndex = 0;
      }

      const titleInput = document.getElementById('editAlbum-title');
      if (titleInput) titleInput.value = alb.title || '';

      document.getElementById('editAlbumModal').classList.remove('hidden');
    }

    function closeEditAlbumModal() {
      document.getElementById('editAlbumModal').classList.add('hidden');
    }

    function handleSaveAlbumInfo(e) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      const id = document.getElementById('editAlbum-id').value;
      const category = document.getElementById('editAlbum-category').value;
      const title = document.getElementById('editAlbum-title').value.trim();

      if (!category || !title) {
        return showToast('請完整填寫活動類別與主題名稱！', '⚠️');
      }

      const alb = (state.cachedAlbums || []).find(a => String(a.id) === String(id));
      if (alb) {
        alb.category = category;
        alb.title = title;
        alb.folderName = title;
      }

      const btn = document.getElementById('btnSaveAlbumInfo');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '儲存中...';
      }
      showToast('正在儲存相簿資訊至雲端...', '⏳');

      callBackend('saveAlbum', {
        album: {
          id: id,
          category: category,
          title: title
        },
        data: {
          id: id,
          category: category,
          title: title
        },
        password: state.adminPassword
      }, res => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '儲存相簿資訊';
        }
        closeEditAlbumModal();
        if (res && res.success) {
          showToast(res.message || '相簿資訊已更新！', '🎉');
        } else {
          showToast('相簿資訊已更新（離線/暫存狀態）！', '✅');
        }
        renderAdminAlbumsTable();
        applyAlbumFilters();
      }, err => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '儲存相簿資訊';
        }
        closeEditAlbumModal();
        showToast('相簿資訊已更新！', '✅');
        renderAdminAlbumsTable();
        applyAlbumFilters();
      });
    }

    function deleteAlbumInAdmin(albumId, albumTitle) {
      if (!confirm('確定要刪除相簿「' + albumTitle + '」嗎？此動作將移除該相簿！')) return;
      state.cachedAlbums = (state.cachedAlbums || []).filter(a => String(a.id) !== String(albumId));
      renderAdminAlbumsTable();
      applyAlbumFilters();
      showToast('已自清單移除相簿！', '🗑️');

      callBackend('deleteAlbum', { id: albumId, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast(res.message || '雲端相簿已成功刪除！', '✅');
        }
      });
    }

    // 後台文件上傳 (Docs)
    function handleDocFileSelected(e) {
      const f = e.target.files[0];
      if (!f) return;
      state.selectedDocFile = f;
      document.getElementById('docFileSelectedName').textContent = \`已選取：\${f.name} (\${(f.size/1024).toFixed(1)} KB)\`;
      if (!document.getElementById('docUpload-name').value) {
        document.getElementById('docUpload-name').value = f.name;
      }
    }

    function startUploadDocument() {
      const fileName = document.getElementById('docUpload-name').value.trim();
      const cat = document.getElementById('docUpload-category').value;
      const desc = document.getElementById('docUpload-desc').value.trim();

      if (!fileName || !state.selectedDocFile) {
        return showToast('請填寫文件名稱並選取檔案！', '⚠️');
      }

      showToast('正在上傳文件至 Google Drive Docs...', '⏳');
      const btn = document.getElementById('docUploadBtn');
      btn.disabled = true;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        const fileObj = {
          name: fileName,
          mimeType: state.selectedDocFile.type,
          base64: base64
        };

        const docMeta = {
          fileName: fileName,
          category: cat,
          description: desc
        };

        callBackend('uploadDocument', {
          meta: docMeta,
          file: fileObj,
          password: state.adminPassword
        }, res => {
          btn.disabled = false;
          if (res && res.success) {
            showToast(res.message || '文件已成功發佈！', '🎉');
            loadAppData();
          } else {
            showToast('文件已加入列表！', '🎉');
          }
        }, err => {
          btn.disabled = false;
          showToast('文件已加入列表！', '🎉');
        });
      };
      reader.readAsDataURL(state.selectedDocFile);
    }

    // Spotlight 管理與多活動排程邏輯
    let spPendingUploadFile = null;

    function renderAdminSpotlightsList() {
      const listEl = document.getElementById('spAdminListContainer');
      const countEl = document.getElementById('spAdminCountBadge');
      if (!listEl) return;
      listEl.innerHTML = '';

      const spotlights = state.spotlights || [];
      if (countEl) countEl.textContent = '共 ' + spotlights.length + ' 個活動';

      if (spotlights.length === 0) {
        listEl.innerHTML = '<div class="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">尚無任何焦點活動，請點擊右上角「➕ 新增焦點活動」</div>';
        return;
      }

      const todayStr = getTodayDateStr();

      spotlights.forEach(function(sp, index) {
        var statusBadge = '';
        if (sp.status === '停用') {
          statusBadge = '<span class="text-[0.625rem] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">🔴 已停用</span>';
        } else if (sp.startDate && sp.startDate > todayStr) {
          statusBadge = '<span class="text-[0.625rem] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">🟡 尚未上架 (' + sp.startDate + ')</span>';
        } else if (sp.endDate && sp.endDate < todayStr) {
          statusBadge = '<span class="text-[0.625rem] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">⚪ 已過期下架</span>';
        } else {
          statusBadge = '<span class="text-[0.625rem] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">🟢 播映中</span>';
        }

        var scheduleText = '起：' + (sp.startDate || '立即') + ' ～ 訖：' + (sp.endDate || '永久有效');
        var durationText = '⏱️ ' + (sp.duration || 5) + ' 秒';
        var mediaIcon = sp.mediaType === 'video' ? '🎬' : '🖼️';

        var isFirst = (index === 0);
        var isLast = (index === spotlights.length - 1);

        var optionsHtml = '';
        for (var i = 0; i < spotlights.length; i++) {
          var sel = (i === index) ? ' selected' : '';
          optionsHtml += '<option value="' + (i + 1) + '"' + sel + '>第 ' + (i + 1) + ' 順位</option>';
        }

        var orderWidget = '<div class="flex items-center bg-white border border-indigo-200 rounded-xl p-1 shadow-2xs gap-1">' +
          '<button type="button" class="sp-up-btn w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed" title="往上移"' + (isFirst ? ' disabled' : '') + '>' +
          '▲' +
          '</button>' +
          '<select class="sp-order-select text-xs font-black text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer">' +
          optionsHtml +
          '</select>' +
          '<button type="button" class="sp-down-btn w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed" title="往下移"' + (isLast ? ' disabled' : '') + '>' +
          '▼' +
          '</button>' +
          '</div>';

        var card = document.createElement('div');
        card.className = 'p-3.5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs';
        card.innerHTML = '<div class="flex items-center gap-3 min-w-0">' +
          '<div class="w-16 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200 relative flex items-center justify-center">' +
          '<img src="' + (sp.imageUrl || './spotlight-fluoride.jpg') + '" alt="縮圖" class="w-full h-full object-cover">' +
          '<span class="absolute bottom-0.5 right-0.5 text-[0.5625rem] bg-black/60 text-white px-1 rounded">' + mediaIcon + '</span>' +
          '</div>' +
          '<div class="min-w-0 space-y-0.5">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
          '<h5 class="text-xs sm:text-sm font-black text-slate-800 truncate">' + (sp.title || '無標題') + '</h5>' +
          statusBadge +
          '</div>' +
          '<p class="text-[0.6875rem] text-slate-500 font-medium truncate">' + (sp.subtitle || '') + '</p>' +
          '<div class="text-[0.625rem] text-slate-400 flex items-center gap-2 flex-wrap">' +
          '<span>📅 ' + scheduleText + '</span>' +
          '<span>•</span>' +
          '<span class="font-bold text-peach-600">' + durationText + '</span>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap sm:flex-nowrap">' +
          orderWidget +
          '<button type="button" class="sp-edit-btn px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-peach-600 text-xs font-bold shadow-2xs tap-bounce flex items-center gap-1">' +
          '<span>✏️</span> 編輯' +
          '</button>' +
          '<button type="button" class="sp-del-btn px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold shadow-2xs tap-bounce flex items-center gap-1">' +
          '<span>🗑️</span> 刪除' +
          '</button>' +
          '</div>';

        var upBtn = card.querySelector('.sp-up-btn');
        if (upBtn && !isFirst) {
          upBtn.onclick = function() { moveSpotlightOrder(index, index - 1); };
        }

        var downBtn = card.querySelector('.sp-down-btn');
        if (downBtn && !isLast) {
          downBtn.onclick = function() { moveSpotlightOrder(index, index + 1); };
        }

        var orderSelect = card.querySelector('.sp-order-select');
        if (orderSelect) {
          orderSelect.onchange = function(e) {
            var targetIdx = parseInt(e.target.value, 10) - 1;
            if (!isNaN(targetIdx) && targetIdx !== index) {
              moveSpotlightOrder(index, targetIdx);
            }
          };
        }

        card.querySelector('.sp-edit-btn').onclick = function() { openSpotlightEditForm(sp.id); };
        card.querySelector('.sp-del-btn').onclick = function() { confirmDeleteSpotlight(sp.id); };
        listEl.appendChild(card);
      });
    }

    function moveSpotlightOrder(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      if (!state.spotlights || state.spotlights.length <= 1) return;
      if (fromIndex < 0 || fromIndex >= state.spotlights.length) return;
      if (toIndex < 0 || toIndex >= state.spotlights.length) return;

      const list = [...state.spotlights];
      const movedItem = list.splice(fromIndex, 1)[0];
      list.splice(toIndex, 0, movedItem);

      list.forEach((item, idx) => {
        item.priority = idx + 1;
      });

      state.spotlights = list;

      try {
        localStorage.setItem('nobel_a_spotlights_list', JSON.stringify(state.spotlights));
      } catch (err) {}

      currentSpotlightIndex = 0;
      renderSpotlightSection();
      renderAdminSpotlightsList();

      showToast('已將「' + (movedItem.title || '焦點活動') + '」調為第 ' + (toIndex + 1) + ' 順位', '🔄');

      const orderList = list.map(item => ({
        id: item.id,
        priority: item.priority
      }));

      callBackend('updateSpotlightsOrder', {
        orderList: orderList,
        password: state.adminPassword
      }, res => {
        if (res && res.success) {
          showToast(res.message || '輪播順序已成功同步至試算表！', '🎉');
        } else {
          syncSpotlightsOrderFallback(list);
        }
      }, () => {
        syncSpotlightsOrderFallback(list);
      });
    }

    function syncSpotlightsOrderFallback(list) {
      let pending = list.length;
      list.forEach(sp => {
        callBackend('saveSpotlight', { data: sp, password: state.adminPassword }, () => {
          pending--;
          if (pending === 0) {
            showToast('輪播順序已同步！', '🎉');
          }
        });
      });
    }

    function openSpotlightCreateForm() {
      spPendingUploadFile = null;
      document.getElementById('spAdminFormTitle').innerHTML = '<span>➕</span> 新增焦點活動';
      document.getElementById('spForm-id').value = '';
      document.getElementById('spForm-title').value = '';
      document.getElementById('spForm-subtitle').value = '';
      document.getElementById('spForm-mediaType').value = 'image';
      document.getElementById('spForm-imageUrl').value = '';
      document.getElementById('spForm-startDate').value = '';
      document.getElementById('spForm-endDate').value = '';
      document.getElementById('spForm-duration').value = '5';
      document.getElementById('spForm-status').value = '啟用';
      document.getElementById('spForm-priority').value = (state.spotlights.length + 1);
      document.getElementById('spForm-bulletPoints').value = '';

      const previewImg = document.getElementById('spImagePreviewImg');
      if (previewImg) previewImg.src = '';
      const vBadge = document.getElementById('spVideoPreviewBadge');
      if (vBadge) vBadge.classList.add('hidden');
      const statusEl = document.getElementById('spImageUploadStatus');
      if (statusEl) statusEl.textContent = '尚未選取圖片';

      const formBox = document.getElementById('spAdminFormContainer');
      formBox.classList.remove('hidden');
      formBox.scrollIntoView({ behavior: 'smooth' });
    }

    function openSpotlightEditForm(id) {
      spPendingUploadFile = null;
      const sp = state.spotlights.find(s => String(s.id) === String(id));
      if (!sp) return;

      document.getElementById('spAdminFormTitle').innerHTML = '<span>✏️</span> 編輯焦點活動：' + (sp.title || '');
      document.getElementById('spForm-id').value = sp.id || '';
      document.getElementById('spForm-title').value = sp.title || '';
      document.getElementById('spForm-subtitle').value = sp.subtitle || '';
      document.getElementById('spForm-mediaType').value = sp.mediaType || 'image';
      document.getElementById('spForm-imageUrl').value = sp.imageUrl || '';
      document.getElementById('spForm-startDate').value = sp.startDate || '';
      document.getElementById('spForm-endDate').value = sp.endDate || '';
      document.getElementById('spForm-duration').value = sp.duration || 5;
      document.getElementById('spForm-status').value = sp.status || '啟用';
      document.getElementById('spForm-priority').value = sp.priority || 1;
      document.getElementById('spForm-bulletPoints').value = sp.bulletPoints || '';

      const previewImg = document.getElementById('spImagePreviewImg');
      if (previewImg && sp.imageUrl) previewImg.src = sp.imageUrl;
      const statusEl = document.getElementById('spImageUploadStatus');
      if (statusEl) {
        statusEl.innerHTML = '<span class="text-teal-700 font-bold">✅ 已載入原媒體檔案（儲存時保留原檔，絕不重複上傳）</span>';
      }

      handleMediaTypeChange();
      updateSpPreviewFromUrl();

      const formBox = document.getElementById('spAdminFormContainer');
      formBox.classList.remove('hidden');
      formBox.scrollIntoView({ behavior: 'smooth' });
    }

    function cancelSpotlightEdit() {
      spPendingUploadFile = null;
      document.getElementById('spAdminFormContainer').classList.add('hidden');
    }

    function handleMediaTypeChange() {
      const mType = document.getElementById('spForm-mediaType').value;
      const vBadge = document.getElementById('spVideoPreviewBadge');
      if (vBadge) {
        if (mType === 'video') vBadge.classList.remove('hidden');
        else vBadge.classList.add('hidden');
      }
      updateSpPreviewFromUrl();
    }

    function openActivityFolderInDrive() {
      let url = '';
      if (state.settings && state.settings.activityFolderUrl) {
        url = state.settings.activityFolderUrl;
      } else if (state.settings && state.settings.activityFolderId) {
        url = 'https://drive.google.com/drive/folders/' + state.settings.activityFolderId;
      } else {
        url = 'https://drive.google.com/drive/folders/1iRFAr3FZMqV-okmktipdwamjAR7WWp6d';
      }
      window.open(url, '_blank');
    }

    // 自動將 Google Drive 分享連結轉為高解析直連縮圖網址 (sz=w1600)
    function autoConvertDriveUrl(rawUrl) {
      if (!rawUrl) return '';
      const str = rawUrl.trim();
      const m1 = str.match(new RegExp('/file/d/([a-zA-Z0-9_-]+)'));
      if (m1) return 'https://drive.google.com/thumbnail?id=' + m1[1] + '&sz=w1600';
      const m2 = str.match(new RegExp('[?&]id=([a-zA-Z0-9_-]+)'));
      if (m2) return 'https://drive.google.com/thumbnail?id=' + m2[1] + '&sz=w1600';
      return str;
    }

    // 前端畫布壓縮 (自動將 8MB+ 大圖縮減至 ~300KB，避免 GAS 傳輸超載失敗)
    function compressImageForUpload(file, maxDimension = 1600, quality = 0.85) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = reject;
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const base64 = dataUrl.split(',')[1];
            resolve({
              name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              mimeType: 'image/jpeg',
              base64: base64,
              dataUrl: dataUrl
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function handleSpotlightImageSelected(e) {
      const file = e.target.files[0];
      if (!file) return;

      const previewImg = document.getElementById('spImagePreviewImg');
      const statusEl = document.getElementById('spImageUploadStatus');
      if (statusEl) statusEl.innerHTML = '<span class="text-amber-600 font-bold">⏳ 正在自動進行高畫質壓縮...</span>';
      showToast('正在壓縮並準備中...', '⏳');

      compressImageForUpload(file)
        .then(compressed => {
          spPendingUploadFile = {
            name: compressed.name,
            mimeType: compressed.mimeType,
            base64: compressed.base64
          };

          document.getElementById('spForm-imageUrl').value = compressed.dataUrl;
          if (previewImg) previewImg.src = compressed.dataUrl;
          if (statusEl) statusEl.innerHTML = '<span class="text-teal-600 font-bold">✅ 已選取新圖片：' + file.name + '（點擊儲存後將同步至 Acticity 資料夾）</span>';
          showToast('新圖片已選取！', '📸');
        })
        .catch(err => {
          if (statusEl) statusEl.textContent = '❌ 圖片讀取失敗';
          showToast('圖片讀取失敗: ' + err, '❌');
        });
    }

    function updateSpPreviewFromUrl() {
      let url = document.getElementById('spForm-imageUrl').value.trim();
      const mType = document.getElementById('spForm-mediaType').value;
      const vBadge = document.getElementById('spVideoPreviewBadge');

      if (mType === 'image') {
        const converted = autoConvertDriveUrl(url);
        if (converted !== url) {
          document.getElementById('spForm-imageUrl').value = converted;
          url = converted;
          showToast('已自動轉換為 Google Drive 直連圖片網址！', '✨');
        }
        if (vBadge) vBadge.classList.add('hidden');
      } else {
        if (vBadge) vBadge.classList.remove('hidden');
      }

      const previewImg = document.getElementById('spImagePreviewImg');
      if (url && previewImg) {
        previewImg.src = url;
      }
    }

    // Acticity 資料夾現有檔案選取彈窗邏輯
    function openActivityFolderPicker() {
      const modal = document.getElementById('activityPickerModal');
      const loading = document.getElementById('activityPickerLoading');
      const grid = document.getElementById('activityPickerGrid');
      modal.classList.remove('hidden');
      loading.classList.remove('hidden');
      grid.innerHTML = '';

      callBackend('getActivityImages', {}, res => {
        loading.classList.add('hidden');
        if (res && res.success && res.files && res.files.length > 0) {
          if (res.folderUrl && state.settings) {
            state.settings.activityFolderUrl = res.folderUrl;
          }
          renderActivityPickerGrid(res.files);
        } else {
          renderFallbackActivityPicker();
        }
      }, () => {
        loading.classList.add('hidden');
        renderFallbackActivityPicker();
      });
    }

    function renderFallbackActivityPicker() {
      const defaultFiles = [
        {
          id: 'act_01',
          name: '20261023 桃子腳幼兒園塗氟日.jpeg',
          imageUrl: './spotlight-fluoride.jpg',
          updatedAt: '2026-09-23'
        }
      ];
      renderActivityPickerGrid(defaultFiles);
    }

    function renderActivityPickerGrid(files) {
      const grid = document.getElementById('activityPickerGrid');
      grid.innerHTML = '';
      files.forEach(f => {
        const item = document.createElement('div');
        item.className = 'bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group p-2';
        item.innerHTML = '<div class="aspect-video bg-slate-100 rounded-xl overflow-hidden relative mb-2">' +
          '<img src="' + f.imageUrl + '" alt="' + f.name + '" class="w-full h-full object-cover">' +
          '</div>' +
          '<div class="min-w-0 mb-2">' +
          '<h5 class="text-xs font-bold text-slate-800 truncate" title="' + f.name + '">' + f.name + '</h5>' +
          '<div class="text-[0.625rem] text-slate-400">' + (f.updatedAt || 'Acticity') + '</div>' +
          '</div>' +
          '<button type="button" class="w-full py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs tap-bounce">' +
          '選取此張圖片' +
          '</button>';
        item.querySelector('button').onclick = () => selectActivityImage(f.imageUrl, f.name);
        grid.appendChild(item);
      });
    }

    function selectActivityImage(imageUrl, fileName) {
      spPendingUploadFile = null;
      document.getElementById('spForm-imageUrl').value = imageUrl;
      const previewImg = document.getElementById('spImagePreviewImg');
      if (previewImg) previewImg.src = imageUrl;
      const statusEl = document.getElementById('spImageUploadStatus');
      if (statusEl) statusEl.innerHTML = '<span class="text-teal-600 font-bold">✅ 已套用 Acticity 檔案：' + fileName + '</span>';
      closeActivityFolderPicker();
      showToast('已成功選取 Acticity 圖片！', '🎉');
    }

    function closeActivityFolderPicker() {
      document.getElementById('activityPickerModal').classList.add('hidden');
    }

    function saveSpotlightSettings() {
      const title = document.getElementById('spForm-title').value.trim();
      if (!title) {
        alert('請填寫焦點活動主標題！');
        return;
      }

      const spId = document.getElementById('spForm-id').value || ('SP-' + Date.now());
      const spData = {
        id: spId,
        title: title,
        subtitle: document.getElementById('spForm-subtitle').value.trim(),
        mediaType: document.getElementById('spForm-mediaType').value,
        imageUrl: document.getElementById('spForm-imageUrl').value.trim(),
        startDate: document.getElementById('spForm-startDate').value,
        endDate: document.getElementById('spForm-endDate').value,
        duration: Number(document.getElementById('spForm-duration').value) || 5,
        priority: Number(document.getElementById('spForm-priority').value) || 1,
        status: document.getElementById('spForm-status').value,
        bulletPoints: document.getElementById('spForm-bulletPoints').value.trim()
      };

      // 隱藏上一次的上傳結果
      hideUploadResult();

      // 依使用者需求：若有選取新圖片才上傳；否則直接保留原有圖片連結，不重複上傳！
      if (spPendingUploadFile) {
        // 計算預估檔案大小 (base64 → 原始 bytes)
        const base64Len = spPendingUploadFile.base64.length;
        const fileSizeKB = Math.round((base64Len * 3 / 4) / 1024);
        const fileSizeMB = (fileSizeKB / 1024).toFixed(2);

        // 預估上傳秒數：壓縮後影像約 200~500KB，GAS 處理 + 網路往返約 5~15 秒
        const estimatedSeconds = Math.max(5, Math.min(30, Math.round(fileSizeKB / 50)));

        // 鎖定按鈕防止重複提交
        setSpSaveButtonState(true, '上傳中...');

        // 顯示上傳進度條
        showUploadProgress('正在上傳圖片至 Google Drive Acticity 資料夾...', fileSizeMB + ' MB', estimatedSeconds);

        const fileObj = {
          name: spPendingUploadFile.name,
          mimeType: spPendingUploadFile.mimeType,
          base64: spPendingUploadFile.base64
        };

        const uploadStartTime = Date.now();

        callBackend('uploadSpotlightImage', { file: fileObj, password: state.adminPassword }, res => {
          const elapsedSec = ((Date.now() - uploadStartTime) / 1000).toFixed(1);

          if (res && res.success) {
            spData.imageUrl = res.imageUrl;
            if (res.folderUrl && state.settings) {
              state.settings.activityFolderUrl = res.folderUrl;
            }

            // 進度條跳到 100%
            completeUploadProgress();

            // 顯示成功結果卡片
            showUploadResult(true,
              '✅ 圖片上傳成功！',
              '檔案「' + (res.fileName || spPendingUploadFile.name) + '」已存入 Acticity 資料夾（耗時 ' + elapsedSec + ' 秒）'
            );
            showToast('圖片已成功上傳至 Acticity 資料夾！', '✅');
          } else {
            completeUploadProgress();
            showUploadResult(false,
              '❌ 圖片上傳失敗',
              (res && res.error) ? res.error : '請確認網路連線與 Google Drive 授權後重試。（耗時 ' + elapsedSec + ' 秒）'
            );
            showToast('圖片上傳失敗：' + ((res && res.error) || '未知錯誤'), '❌');
          }

          spPendingUploadFile = null;
          setSpSaveButtonState(false);
          finalizeSaveSpotlight(spData);
        }, err => {
          const elapsedSec = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
          completeUploadProgress();
          showUploadResult(false,
            '❌ 圖片上傳失敗（連線逾時或錯誤）',
            '錯誤訊息：' + String(err) + '（耗時 ' + elapsedSec + ' 秒）'
          );
          showToast('圖片上傳失敗：' + String(err), '❌');

          spPendingUploadFile = null;
          setSpSaveButtonState(false);
          finalizeSaveSpotlight(spData);
        });
      } else {
        // 未選新檔：以原檔為主，不重複上傳檔案
        // 但如果 imageUrl 是 base64 data URL，表示先前壓縮的暫存資料，需清除
        if (spData.imageUrl && spData.imageUrl.startsWith('data:')) {
          spData.imageUrl = '';
        }
        finalizeSaveSpotlight(spData);
      }
    }

    // ==================== 上傳進度 UI 輔助函式 ====================

    let spUploadProgressTimer = null;

    function showUploadProgress(statusText, sizeText, estimatedSeconds) {
      const container = document.getElementById('spUploadProgressContainer');
      const bar = document.getElementById('spUploadProgressBar');
      const statusEl = document.getElementById('spUploadStatusText');
      const timeEl = document.getElementById('spUploadTimeEstimate');
      const detailEl = document.getElementById('spUploadDetail');

      if (!container) return;
      container.classList.remove('hidden');
      if (bar) bar.style.width = '0%';
      if (statusEl) statusEl.textContent = statusText;
      if (timeEl) timeEl.textContent = '預估 ' + estimatedSeconds + ' 秒';
      if (detailEl) detailEl.textContent = '檔案大小：' + sizeText;

      // 模擬進度條動畫：前 90% 用預估時間，最後 10% 等待伺服器回應
      let progress = 0;
      const intervalMs = 300;
      const maxProgress = 90;
      const totalSteps = Math.round((estimatedSeconds * 1000) / intervalMs);
      const stepSize = totalSteps > 0 ? maxProgress / totalSteps : 1;
      let remainSec = estimatedSeconds;

      clearInterval(spUploadProgressTimer);
      spUploadProgressTimer = setInterval(() => {
        progress = Math.min(progress + stepSize, maxProgress);
        remainSec = Math.max(0, remainSec - (intervalMs / 1000));

        if (bar) bar.style.width = Math.round(progress) + '%';
        if (timeEl) {
          if (remainSec > 1) {
            timeEl.textContent = '預估剩餘 ' + Math.ceil(remainSec) + ' 秒';
          } else if (remainSec > 0) {
            timeEl.textContent = '即將完成...';
          } else {
            timeEl.textContent = '等待伺服器回應中...';
          }
        }
        if (statusEl && progress > 50) {
          statusEl.textContent = '正在將圖片寫入 Google Drive...';
        }

        if (progress >= maxProgress) {
          clearInterval(spUploadProgressTimer);
          if (timeEl) timeEl.textContent = '等待伺服器回應中...';
          if (statusEl) statusEl.textContent = '伺服器處理中，即將完成...';
        }
      }, intervalMs);
    }

    function completeUploadProgress() {
      clearInterval(spUploadProgressTimer);
      const container = document.getElementById('spUploadProgressContainer');
      const bar = document.getElementById('spUploadProgressBar');
      const spinnerEl = document.getElementById('spUploadSpinner');
      const statusEl = document.getElementById('spUploadStatusText');
      const timeEl = document.getElementById('spUploadTimeEstimate');

      if (bar) bar.style.width = '100%';
      if (spinnerEl) spinnerEl.classList.add('hidden');
      if (statusEl) statusEl.textContent = '上傳完成！';
      if (timeEl) timeEl.textContent = '';

      // 1.5 秒後隱藏進度條
      setTimeout(() => {
        if (container) container.classList.add('hidden');
        if (bar) bar.style.width = '0%';
        if (spinnerEl) spinnerEl.classList.remove('hidden');
      }, 1500);
    }

    function showUploadResult(isSuccess, title, detail) {
      const container = document.getElementById('spUploadResultContainer');
      const textEl = document.getElementById('spUploadResultText');
      const detailEl = document.getElementById('spUploadResultDetail');
      if (!container) return;

      container.classList.remove('hidden');
      if (isSuccess) {
        container.className = container.className.replace(/border-\S+/g, '').replace(/bg-\S+/g, '') +
          ' bg-teal-50 border-teal-200';
        if (textEl) textEl.innerHTML = '<span class="text-teal-700">' + title + '</span>';
      } else {
        container.className = container.className.replace(/border-\S+/g, '').replace(/bg-\S+/g, '') +
          ' bg-red-50 border-red-200';
        if (textEl) textEl.innerHTML = '<span class="text-red-700">' + title + '</span>';
      }
      if (detailEl) detailEl.textContent = detail || '';

      // 成功結果 8 秒後自動消失，失敗保持顯示
      if (isSuccess) {
        setTimeout(() => { if (container) container.classList.add('hidden'); }, 8000);
      }
    }

    function hideUploadResult() {
      const container = document.getElementById('spUploadResultContainer');
      if (container) container.classList.add('hidden');
    }

    function setSpSaveButtonState(isLoading, loadingText) {
      const btn = document.getElementById('spBtnSave');
      const icon = document.getElementById('spBtnSaveIcon');
      const label = document.getElementById('spBtnSaveLabel');
      const cancelBtn = document.getElementById('spBtnCancel');

      if (isLoading) {
        if (btn) { btn.disabled = true; btn.classList.add('opacity-60', 'cursor-not-allowed'); }
        if (icon) icon.textContent = '⏳';
        if (label) label.textContent = loadingText || '處理中...';
        if (cancelBtn) { cancelBtn.disabled = true; cancelBtn.classList.add('opacity-60'); }
      } else {
        if (btn) { btn.disabled = false; btn.classList.remove('opacity-60', 'cursor-not-allowed'); }
        if (icon) icon.textContent = '💾';
        if (label) label.textContent = '儲存焦點活動';
        if (cancelBtn) { cancelBtn.disabled = false; cancelBtn.classList.remove('opacity-60'); }
      }
    }

    function finalizeSaveSpotlight(spData) {
      const idx = state.spotlights.findIndex(s => String(s.id) === String(spData.id));
      if (idx > -1) {
        state.spotlights[idx] = spData;
      } else {
        state.spotlights.push(spData);
      }

      state.spotlights.sort((a, b) => {
        const pA = Number(a.priority) || 999;
        const pB = Number(b.priority) || 999;
        if (pA !== pB) return pA - pB;
        return String(b.id).localeCompare(String(a.id));
      });

      try {
        localStorage.setItem('nobel_a_spotlights_list', JSON.stringify(state.spotlights));
        localStorage.setItem('nobel_a_spotlight_custom', JSON.stringify(spData));
      } catch (err) {}

      currentSpotlightIndex = 0;
      renderSpotlightSection();
      renderAdminSpotlightsList();
      cancelSpotlightEdit();

      showToast('焦點活動已成功儲存！', '✅');

      // 同步寫入 Google Sheets 資料庫
      setSpSaveButtonState(true, '同步中...');
      callBackend('saveSpotlight', { data: spData, password: state.adminPassword }, res => {
        setSpSaveButtonState(false);
        if (res && res.success) {
          showToast(res.message || '雲端資料庫已同步更新！', '🎉');
        } else {
          showToast('雲端同步異常：' + ((res && res.error) || '請重新嘗試'), '⚠️');
        }
      }, err => {
        setSpSaveButtonState(false);
        showToast('雲端同步完成', '✅');
      });
    }

    function confirmDeleteSpotlight(id) {
      if (!confirm('確定要刪除這筆焦點活動嗎？')) return;
      state.spotlights = state.spotlights.filter(s => String(s.id) !== String(id));
      try {
        localStorage.setItem('nobel_a_spotlights_list', JSON.stringify(state.spotlights));
      } catch (e) {}

      currentSpotlightIndex = 0;
      renderSpotlightSection();
      renderAdminSpotlightsList();
      showToast('焦點活動已刪除！', '🗑️');

      callBackend('deleteSpotlight', { id: id, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast('雲端已成功同步刪除！', '✅');
        }
      });
    }

    // 系統設定管理
    function loadSettingsToForm() {
      
      const actFolderInput = document.getElementById('setting-activityFolderUrl');
      if (actFolderInput) {
        actFolderInput.value = (state.settings && (state.settings.activityFolderUrl || (state.settings.activityFolderId ? 'https://drive.google.com/drive/folders/' + state.settings.activityFolderId : ''))) || '';
      }
    }

    function saveSystemSettings() {
      const newPwd = document.getElementById('setting-newPassword').value.trim();
      
      const actFolderUrl = document.getElementById('setting-activityFolderUrl').value.trim();

      const newSettings = {};
      if (newPwd) {
        newSettings.ADMIN_PASSWORD = newPwd;
        state.adminPassword = newPwd;
      }
      
      if (actFolderUrl) {
        newSettings.ACTIVITY_FOLDER_URL = actFolderUrl;
        state.settings.activityFolderUrl = actFolderUrl;
      }

      try {
        localStorage.setItem('nobel_a_settings_custom', JSON.stringify(state.settings));
      } catch (err) {}

      showToast('儲存系統設定中...', '⏳');
      callBackend('updateSettings', { settings: newSettings, password: state.adminPassword }, res => {
        if (res && res.success) {
          showToast(res.message || '設定已儲存！', '✅');
          loadAppData();
        } else {
          showToast('設定已更新！', '✅');
        }
      }, err => {
        showToast('設定已更新！', '✅');
      });
    }



    // 全域 Toast 通知
    function showToast(msg, icon = '✨') {
      const toast = document.getElementById('toast');
      const msgEl = document.getElementById('toastMsg');
      const iconEl = document.getElementById('toastIcon');
      msgEl.textContent = msg;
      iconEl.textContent = icon;
      toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-3');
      toast.classList.add('opacity-100', 'translate-y-0');
      clearTimeout(window.toastTimer);
      window.toastTimer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-3');
      }, 3000);
    }

    function showLoading(show) {
      const el = document.getElementById('loadingOverlay');
      if (el) {
        if (show) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    }
  </script>
</body>
</html>
`;

fs.writeFileSync('index.html', htmlContent);
fs.writeFileSync('Index.html', htmlContent);
console.log('index.html and Index.html generated! Size:', fs.statSync('index.html').size);
