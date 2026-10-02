const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

// Update getEmbedVideoInfo to support YouTube autoplay
const oldYoutube = "if (id) return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1' };";
const newYoutube = "if (id) return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=' + id };";

code = code.split(oldYoutube).join(newYoutube);

// Make HTML5 videos autoplay muted loop
code = code.replace(/<video id="spotlightHtml5Video" class="w-full h-full object-cover rounded-xl hidden" controls playsinline><\/video>/g,
  '<video id="spotlightHtml5Video" class="w-full h-full object-cover rounded-xl hidden" controls playsinline autoplay muted loop></video>');

code = code.replace(/<video id="modalSpotlightVideo" class="w-full h-full object-contain hidden" controls playsinline><\/video>/g,
  '<video id="modalSpotlightVideo" class="w-full h-full object-contain hidden" controls playsinline autoplay muted loop></video>');


fs.writeFileSync('build_index.js', code);
