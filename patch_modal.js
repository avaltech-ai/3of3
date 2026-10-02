const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

// Add the navigation buttons to the media wrapper
const newWrapper = `<div id="modalSpotlightMediaWrapper" class="rounded-2xl overflow-hidden border border-rose-100 bg-rose-50 flex items-center justify-center relative group">
        <button onclick="prevSpotlightModal()" class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-800 font-bold text-lg tap-bounce z-10 hidden" id="modalSpotlightPrevBtn">
          ◀
        </button>
        <button onclick="nextSpotlightModal()" class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-800 font-bold text-lg tap-bounce z-10 hidden" id="modalSpotlightNextBtn">
          ▶
        </button>
        <img id="modalSpotlightImg"`;

code = code.replace('<div id="modalSpotlightMediaWrapper" class="rounded-2xl overflow-hidden border border-rose-100 bg-rose-50 flex items-center justify-center">\n        <img id="modalSpotlightImg"', newWrapper);

fs.writeFileSync('build_index.js', code);
