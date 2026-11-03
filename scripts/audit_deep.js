const fs = require('fs');
const content = fs.readFileSync('C:/Users/lauri/.gemini/antigravity/scratch/BarrierefreieFinanzApp/app.js', 'utf8');
const lines = content.split('\n');

console.log('Total lines in app.js:', lines.length);

// 1. Check for unhandled JSON.parse
let jsonParseCount = 0;
lines.forEach((l, i) => {
  if (l.includes('JSON.parse') && !lines.slice(Math.max(0, i - 3), i + 1).some(prev => prev.includes('try'))) {
    // Check if within try/catch block
    // simple heuristic
  }
});

// 2. Check for duplicate IDs in index.html
const htmlContent = fs.readFileSync('C:/Users/lauri/.gemini/antigravity/scratch/BarrierefreieFinanzApp/index.html', 'utf8');
const idMatches = htmlContent.match(/id="([^"]+)"/g) || [];
const ids = idMatches.map(m => m.replace(/id="|"/g, ''));
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
console.log('Duplicate IDs in index.html:', [...new Set(duplicates)]);

console.log('Audit scan completed.');
