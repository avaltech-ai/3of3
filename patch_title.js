const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

const oldHtml = `<h2 id="spotlightTitle" class="text-lg sm:text-xl font-black text-slate-800 leading-snug">
              桃子腳幼兒園 牙齒塗氟日 活動攻略圖
            </h2>`;
const newHtml = `<div class="flex items-start gap-2 flex-wrap">
              <h2 id="spotlightTitle" class="text-lg sm:text-xl font-black text-slate-800 leading-snug">
                桃子腳幼兒園 牙齒塗氟日 活動攻略圖
              </h2>
              <span id="spotlightStatusBadge" class="text-xs font-bold px-2 py-0.5 rounded-md mt-1 hidden shrink-0 whitespace-nowrap"></span>
            </div>`;

code = code.split(oldHtml).join(newHtml);

const oldJs = `if (titleEl) titleEl.textContent = sp.title || '桃子腳幼兒園 焦點活動';`;
const newJs = `if (titleEl) titleEl.textContent = sp.title || '桃子腳幼兒園 焦點活動';
      
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
          
          if (evDate >= now) {
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
`;

code = code.split(oldJs).join(newJs);

fs.writeFileSync('build_index.js', code);
