const fs = require('fs');

console.log('==================================================');
console.log('AUDIT: Checking BarrierefreieFinanzApp Codebase');
console.log('==================================================\n');

const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');
const syncEngineJs = fs.readFileSync('sync_engine.js', 'utf8');
const combinedJs = appJs + '\n' + syncEngineJs;

// 1. Find all function calls in HTML inline handlers
const handlerRegex = /on[a-z]+\s*=\s*['"]([^'"]+)['"]/gi;
const calledFuncs = new Set();
let match;
while ((match = handlerRegex.exec(html)) !== null) {
  const code = match[1];
  const fnMatches = code.matchAll(/([a-zA-Z0-9_$]+)\s*\(/g);
  for (const fn of fnMatches) {
    const fnName = fn[1];
    if (!['alert', 'confirm', 'prompt', 'parseFloat', 'parseInt', 'Boolean', 'Number', 'String', 'encodeURIComponent', 'decodeURIComponent', 'event', 'stopPropagation', 'preventDefault'].includes(fnName)) {
      calledFuncs.add(fnName);
    }
  }
}

console.log('1. Inline HTML functions called:', calledFuncs.size);
const missingInJs = [];
for (const fn of calledFuncs) {
  const exists = new RegExp('\\bfunction\\s+' + fn + '\\b|\\basync\\s+function\\s+' + fn + '\\b|\\bconst\\s+' + fn + '\\s*=|\\blet\\s+' + fn + '\\s*=|\\bvar\\s+' + fn + '\\s*=').test(combinedJs);
  if (!exists) {
    missingInJs.push(fn);
  }
}
console.log('   Missing functions called from HTML:', missingInJs.length === 0 ? 'None (ALL EXIST)' : missingInJs);

// 2. Check getElementById calls in app.js and sync_engine.js
const idRegex = /document\.getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
const referencedIds = new Set();
while ((match = idRegex.exec(combinedJs)) !== null) {
  referencedIds.add(match[1]);
}
console.log('\n2. Total getElementById calls:', referencedIds.size);

// Check which IDs are neither in index.html nor dynamically created in app.js
const dynamicIdPatterns = [
  'tx-', 'opt-', 'badge-', 'row-', 'card-', 'item-', 'wish-', 'shop-', 'btn-', 'pot-', 'cat-', 'filter-'
];
const missingIds = [];
const htmlIdRegex = /\bid\s*=\s*['"]([^'"]+)['"]/g;
const presentIds = new Set();
while ((match = htmlIdRegex.exec(html)) !== null) {
  presentIds.add(match[1]);
}

for (const id of referencedIds) {
  if (!presentIds.has(id)) {
    // Check if it's created dynamically in JS (e.g. innerHTML = `... id="${id}"` or createElement)
    const isDynamic = combinedJs.includes('id="' + id + '"') || 
                      combinedJs.includes("id='" + id + "'") || 
                      combinedJs.includes('id=\\"' + id + '\\"') ||
                      combinedJs.includes('id="${' + id) ||
                      combinedJs.includes('id="' + id + '_') ||
                      combinedJs.includes('id=\'' + id + '_');
    if (!isDynamic) {
      // Check if it's accessed without null-check in JS
      // e.g. document.getElementById('foo').value or document.getElementById('foo').addEventListener
      const unsafeAccess = new RegExp('document\\.getElementById\\(\\s*[\'"]' + id + '[\'"]\\s*\\)\\.[a-zA-Z]').test(combinedJs);
      missingIds.push({ id, unsafeAccess });
    }
  }
}
console.log('   Missing IDs not in HTML:', missingIds.length);
if (missingIds.length > 0) {
  console.log('   Details on missing IDs:');
  missingIds.forEach(m => {
    console.log(`     - "${m.id}" (Unsafe direct access: ${m.unsafeAccess})`);
    appJs.split('\n').forEach((l, idx) => {
      if (l.includes("'" + m.id + "'") || l.includes('"' + m.id + '"')) {
        console.log(`         Line ${idx + 1}: ${l.trim().substring(0, 100)}`);
      }
    });
  });
}

// Strip comments and strings from appJs
let cleanJs = appJs
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*/g, ' ')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

// Find STANDALONE function calls inside app.js: foo(...) not preceded by a dot
const jsStandaloneCalls = new Set();
const callRegex = /(?:^|[^\w$.])([a-zA-Z0-9_$]+)\s*\(/g;
while ((match = callRegex.exec(cleanJs)) !== null) {
  jsStandaloneCalls.add(match[1]);
}

const standardBuiltins = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'await', 'async',
  'alert', 'confirm', 'prompt', 'parseFloat', 'parseInt', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'btoa', 'atob', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'fetch',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Promise', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'Uint8Array', 'Uint16Array', 'Uint32Array',
  'Int8Array', 'Int16Array', 'Int32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'DataView',
  'FileReader', 'Blob', 'File', 'FormData', 'URL', 'URLSearchParams', 'Headers', 'Request', 'Response',
  'console', 'document', 'window', 'navigator', 'localStorage', 'sessionStorage', 'crypto', 'SubtleCrypto',
  'CustomEvent', 'Event', 'MutationObserver', 'IntersectionObserver', 'ResizeObserver', 'AudioContext', 'SpeechSynthesisUtterance',
  'require', 'process', 'module', 'exports', 'Buffer', 'new', 'typeof', 'void', 'delete', 'in', 'instanceof', 'eval',
  // Specific app/Capacitor globals
  'Capacitor', 'announceNVDA', 'escapeHTML', 'formatCurrency', 'formatCurrencySpoken', 'formatDateGerman'
]);

console.log('\n3. Analyzing STANDALONE function calls in app.js...');
const undefinedCalls = [];
for (const fn of jsStandaloneCalls) {
  if (standardBuiltins.has(fn)) continue;
  // Check if defined in combinedJs
  const isDefined = new RegExp(
    '\\bfunction\\s+' + fn + '\\b|' +
    '\\basync\\s+function\\s+' + fn + '\\b|' +
    '\\bconst\\s+' + fn + '\\b|' +
    '\\blet\\s+' + fn + '\\b|' +
    '\\bvar\\s+' + fn + '\\b|' +
    '\\bclass\\s+' + fn + '\\b|' +
    '\\b' + fn + '\\s*:\\s*(?:function|async\\s+function|\\()'
  ).test(combinedJs);
  if (!isDefined) {
    undefinedCalls.push(fn);
  }
}
console.log('   Standalone undefined calls count:', undefinedCalls.length);
if (undefinedCalls.length > 0) {
  console.log('   Undefined functions:', undefinedCalls);
  undefinedCalls.forEach(fn => {
    appJs.split('\n').forEach((l, idx) => {
      if (new RegExp('(?:^|[^\\w$.])' + fn + '\\s*\\(').test(l)) {
        console.log(`     Line ${idx + 1}: ${l.trim().substring(0, 100)}`);
      }
    });
  });
}
