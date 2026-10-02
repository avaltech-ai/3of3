const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

// 1. Remove old buttons from spotlightNavControls
const oldNavControls = `<div class="flex items-center gap-1">
              <button type="button" onclick="prevSpotlightSlide(event)" class="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-peach-600 border border-rose-100 flex items-center justify-center text-lg font-black shadow-md transition-all tap-bounce" title="上一個焦點活動">
                ❮
              </button>
              <button type="button" onclick="nextSpotlightSlide(event)" class="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-peach-600 border border-rose-100 flex items-center justify-center text-lg font-black shadow-md transition-all tap-bounce" title="下一個焦點活動">
                ❯
              </button>
            </div>`;
code = code.replace(oldNavControls, '');

// 2. Add overlay buttons inside the image wrapper
const oldImageWrapper = `<div class="w-full aspect-[16/10] bg-rose-50 rounded-xl overflow-hidden relative flex items-center justify-center">`;
const newImageWrapper = `<div class="w-full aspect-[16/10] bg-rose-50 rounded-xl overflow-hidden relative flex items-center justify-center group/nav">
              <button type="button" onclick="event.stopPropagation(); prevSpotlightSlide(event)" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-800 font-bold text-sm sm:text-lg tap-bounce z-10 transition-opacity opacity-80 hover:opacity-100 hidden" id="spotlightOverlayPrevBtn" title="上一個焦點活動">
                ◀
              </button>
              <button type="button" onclick="event.stopPropagation(); nextSpotlightSlide(event)" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-800 font-bold text-sm sm:text-lg tap-bounce z-10 transition-opacity opacity-80 hover:opacity-100 hidden" id="spotlightOverlayNextBtn" title="下一個焦點活動">
                ▶
              </button>`;
code = code.replace(oldImageWrapper, newImageWrapper);

// 3. Update updateSpotlight UI logic to hide/show these new buttons
const oldUpdateLogic = `if (navControls) {
        if (activeList.length <= 1) {
          navControls.classList.add('opacity-40', 'pointer-events-none');
        } else {
          navControls.classList.remove('opacity-40', 'pointer-events-none');
        }
      }`;
const newUpdateLogic = `if (navControls) {
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
      }`;
code = code.replace(oldUpdateLogic, newUpdateLogic);

// 4. Update the Status Badge logic
const oldBadgeLogic = `if (evDate >= now) {
            statusBadge.textContent = '即將到來';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-emerald-100 text-emerald-700 border border-emerald-200';
          } else {
            statusBadge.textContent = '活動結束';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-slate-100 text-slate-500 border border-slate-200';
          }`;
const newBadgeLogic = `if (evDate.getTime() === now.getTime()) {
            statusBadge.textContent = '本日焦點';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-amber-100 text-amber-700 border border-amber-200';
          } else if (evDate > now) {
            statusBadge.textContent = '即將到來';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-emerald-100 text-emerald-700 border border-emerald-200';
          } else {
            statusBadge.textContent = '活動結束';
            statusBadge.className = 'text-xs font-bold px-2 py-0.5 rounded-md mt-1 shrink-0 whitespace-nowrap bg-slate-100 text-slate-500 border border-slate-200';
          }`;
code = code.replace(oldBadgeLogic, newBadgeLogic);

fs.writeFileSync('build_index.js', code);
