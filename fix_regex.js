const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

code = code.replace(/sp\.subtitle\.match\(\/\\d\{4\}\\\/\\d\{1,2\}\\\/\\d\{1,2\}\/\)/g, 'sp.subtitle.match(/\\\\d{4}\\\\/\\\\d{1,2}\\\\/\\\\d{1,2}/)');

fs.writeFileSync('build_index.js', code);
