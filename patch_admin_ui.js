const fs = require('fs');
let code = fs.readFileSync('build_index.js', 'utf8');

const oldStr = `var durationText = '⏱️ ' + (sp.duration || 5) + ' 秒';`;
const newStr = `var durationText = '⏱️ ' + (sp.duration || 5) + ' 秒';
        var priorityText = '📌 順序: ' + (sp.priority || '未設');`;
code = code.replace(oldStr, newStr);

const oldHTML = `<span>•</span>' +
          '<span class="font-bold text-peach-600">' + durationText + '</span>' +`;
const newHTML = `<span>•</span>' +
          '<span class="font-bold text-peach-600">' + durationText + '</span>' +
          '<span>•</span>' +
          '<span class="font-bold text-indigo-500">' + priorityText + '</span>' +`;
code = code.replace(oldHTML, newHTML);

fs.writeFileSync('build_index.js', code);
