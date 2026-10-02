const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

// For HTML5 Video volume in the modal
code = code.replace(/modalVideo\.src = vInfo\.src;/g, "modalVideo.src = vInfo.src;\n            modalVideo.volume = 0.3;\n            modalVideo.muted = false; // 取消靜音，維持 30% 音量");

fs.writeFileSync('build_index.js', code);
