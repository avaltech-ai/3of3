const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

// Replace handleDataLoaded
const oldLoad = `state.spotlights = data.spotlights || [];
      state.spotlights.sort((a, b) => (Number(a.priority) || 999) - (Number(b.priority) || 999));`;
const newLoad = `state.spotlights = data.spotlights || [];
      state.spotlights.sort((a, b) => {
        const pA = Number(a.priority) || 999;
        const pB = Number(b.priority) || 999;
        if (pA !== pB) return pA - pB;
        return String(b.id).localeCompare(String(a.id)); // Newer first if same priority
      });`;
code = code.replace(oldLoad, newLoad);

// Replace saveSpotlight
const oldSave = `state.spotlights.sort((a, b) => (Number(a.priority) || 1) - (Number(b.priority) || 1));`;
const newSave = `state.spotlights.sort((a, b) => {
        const pA = Number(a.priority) || 999;
        const pB = Number(b.priority) || 999;
        if (pA !== pB) return pA - pB;
        return String(b.id).localeCompare(String(a.id));
      });`;
code = code.replace(oldSave, newSave);

fs.writeFileSync('build_index.js', code);
