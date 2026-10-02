const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

code = code.replace(/html5Video\.src = vInfo\.src;/g, "html5Video.src = vInfo.src;\n            try { html5Video.play().catch(e=>{}); } catch(e){}");

code = code.replace(/modalVideo\.src = vInfo\.src;/g, "modalVideo.src = vInfo.src;\n            try { modalVideo.play().catch(e=>{}); } catch(e){}");

fs.writeFileSync('build_index.js', code);
