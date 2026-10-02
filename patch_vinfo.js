const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

code = code.replace(/function getEmbedVideoInfo\(url\) \{/g, 'function getEmbedVideoInfo(url, hideControls = false) {');

const oldYT1 = "?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&controls=0&playlist=";
const newYT1 = "?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=";

code = code.split(oldYT1).join(newYT1);

code = code.replace(/if \(id\) return \{ type: 'iframe', src: 'https:\/\/www\.youtube-nocookie\.com\/embed\/' \+ id \+ '\?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=' \+ id \};/g,
  "if (id) return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=' + id + (hideControls ? '&controls=0' : '&controls=1') };");


code = code.replace(/const vInfo = getEmbedVideoInfo\(sp\.imageUrl\);/g, "const vInfo = getEmbedVideoInfo(sp.imageUrl, true); // true for homepage");
code = code.replace(/const vInfo = getEmbedVideoInfo\(sp\.imageUrl, true\); \/\/ true for homepage/g, function(match, offset, string) {
    // Only replace the first occurrence (which is renderSpotlightMedia)
    // Actually, there are two occurrences: one in renderSpotlightMedia, one in openSpotlightModal.
    // I need to be careful.
    return match;
});

fs.writeFileSync('build_index.js', code);
