const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

// Inject the navigation logic
const newLogic = `
    function nextSpotlightModal() {
      const activeList = filterActiveSpotlights(state.spotlights);
      if(activeList.length <= 1) return;
      currentSpotlightIndex = (currentSpotlightIndex + 1) % activeList.length;
      openSpotlightModal();
    }
    function prevSpotlightModal() {
      const activeList = filterActiveSpotlights(state.spotlights);
      if(activeList.length <= 1) return;
      currentSpotlightIndex = (currentSpotlightIndex - 1 + activeList.length) % activeList.length;
      openSpotlightModal();
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
`;

code = code.replace(`    function openSpotlightModal() {
      const activeList = filterActiveSpotlights(state.spotlights);
      const sp = activeList[currentSpotlightIndex] || state.spotlights[0] || {};
      document.getElementById('modalSpotlightTitle').textContent = sp.title || '焦點活動攻略圖';`, newLogic);

fs.writeFileSync('build_index.js', code);
