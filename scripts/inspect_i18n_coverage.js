const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

// Parse I18N_APP_LABELS and I18N_APP_ELEMENTS keys
function extractKeys(varName) {
  const match = app.match(new RegExp(varName + '\\s*=\\s*\\{([\\s\\S]*?)\\};'));
  if (!match) return [];
  const keys = [];
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kMatch = line.match(/^\s*'([^']+)'\s*:/);
    if (kMatch) keys.push(kMatch[1]);
  }
  return keys;
}

const labelKeys = extractKeys('I18N_APP_LABELS');
const elementKeys = extractKeys('I18N_APP_ELEMENTS');
const placeholderKeys = extractKeys('I18N_APP_PLACEHOLDERS');

console.log('labelKeys count:', labelKeys.length);
console.log('elementKeys count:', elementKeys.length);
console.log('placeholderKeys count:', placeholderKeys.length);

// Now inspect modals
const modalRegex = /<div[^>]*id="([^"]*modal[^"]*)"[^>]*>([\s\S]*?)<\/div>\s*(?=<!--|<div class="modal|$)/gi;
// We can also find all buttons, h2, h3, labels inside any modal
const btnRegex = /<button[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/button>/gi;
let m;
const missingBtns = [];
while ((m = btnRegex.exec(html)) !== null) {
  const id = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  if (!elementKeys.includes(id) && !['btn-filter-all', 'btn-filter-expenses', 'btn-filter-income'].includes(id)) {
    missingBtns.push({ id, text });
  }
}

console.log('Buttons not in I18N_APP_ELEMENTS:', missingBtns.length);
missingBtns.forEach(b => console.log('  BTN:', b.id, '->', b.text));

// Check labels
const lblRegex = /<label[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/label>/gi;
const missingLabels = [];
while ((m = lblRegex.exec(html)) !== null) {
  const forAttr = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  if (!labelKeys.includes(forAttr)) {
    missingLabels.push({ forAttr, text });
  }
}
console.log('Labels not in I18N_APP_LABELS:', missingLabels.length);
missingLabels.forEach(l => console.log('  LABEL:', l.forAttr, '->', l.text));

// Check placeholders
const phRegex = /<input[^>]*id="([^"]+)"[^>]*placeholder="([^"]+)"/gi;
const missingPlaceholders = [];
while ((m = phRegex.exec(html)) !== null) {
  const id = m[1];
  const ph = m[2];
  if (!placeholderKeys.includes(id)) {
    missingPlaceholders.push({ id, ph });
  }
}
console.log('Placeholders not in I18N_APP_PLACEHOLDERS:', missingPlaceholders.length);
missingPlaceholders.forEach(p => console.log('  PH:', p.id, '->', p.ph));
