const fs = require('fs');

let v = fs.readFileSync('version.json', 'utf8');
v = v.replace('"version": "6.9.61"', '"version": "6.9.62"');
v = v.replace('"buildDate": "2026-11-03"', '"buildDate": "2026-11-07"');
fs.writeFileSync('version.json', v, 'utf8');
console.log('Updated version.json to 6.9.62');
