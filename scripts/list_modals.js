const fs = require('fs');
const content = fs.readFileSync('C:/Users/lauri/.gemini/antigravity/scratch/BarrierefreieFinanzApp/index.html', 'utf8');
const lines = content.split('\n');
const modals = [];
lines.forEach((l, i) => {
  const m = l.match(/id=["']([^"']*(?:modal|dialog|popup)[^"']*)["']/i);
  if (m) modals.push({ line: i + 1, id: m[1] });
});
console.log('Found modals:', modals.length);
modals.forEach(m => console.log(`${m.line}: ${m.id}`));
