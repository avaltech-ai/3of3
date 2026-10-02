const fs = require('fs');
let code = fs.readFileSync('Code.js', 'utf8');

code = code.replace(/<script>try\{window\.top\.postMessage\(' \+ errResult\.replace\(\/<\/g, '\\\\u003c'\)\.replace\(\/>\/g, '\\\\u003e'\) \+ ',"\*"\);\}catch\(e\)\{\}<\/script>/g, 
  '<script>try{window.top.postMessage(\' + errResult.replace(/</g, \'\\\\u003c\').replace(/>/g, \'\\\\u003e\') + \',"*");}catch(e){}try{window.parent.postMessage(\' + errResult.replace(/</g, \'\\\\u003c\').replace(/>/g, \'\\\\u003e\') + \',"*");}catch(e){}try{window.parent.parent.postMessage(\' + errResult.replace(/</g, \'\\\\u003c\').replace(/>/g, \'\\\\u003e\') + \',"*");}catch(e){}</script>');

fs.writeFileSync('Code.js', code);
