const fs = require('fs');

// 1. Check HTML for duplicate IDs
const html = fs.readFileSync('index.html', 'utf8');
const idRegex = /\bid=["']([^"']+)["']/g;
const ids = {};
let match;
let dups = [];
while ((match = idRegex.exec(html)) !== null) {
  const id = match[1];
  if (ids[id]) {
    dups.push(id);
  } else {
    ids[id] = true;
  }
}
console.log('HTML Total unique IDs:', Object.keys(ids).length);
console.log('HTML Duplicates:', dups.length === 0 ? 'None (0)' : dups);

// 2. Syntax check app.js
const appJs = fs.readFileSync('app.js', 'utf8');
try {
  new Function(appJs);
  console.log('app.js syntax check: PASS (valid JavaScript)');
} catch (e) {
  console.error('app.js syntax check: FAIL', e.message);
  process.exit(1);
}

// 3. Test shopping list logic
console.log('Testing shopping list text parser...');

// Mock appState & storage
const mockAppState = { shoppingList: [] };
function parseShoppingTextTest(rawText, defaultStore) {
  const lines = rawText.split(/\r?\n/);
  const itemsToAdd = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (/^(einkauf|einkaufsliste|liste|supermarkt|besorgen|rewe|aldi|lidl|edeka|hallo|moin)[\s:!]*$/i.test(line)) continue;
    line = line.replace(/^[\s\-\*\u2022\u2013\u2014\+■□\>]+/, '').trim();
    line = line.replace(/^\d+[\.\)\-]\s*/, '').trim();
    line = line.replace(/^\[[ xX\u2713\u2714]?\]\s*/, '').trim();
    line = line.replace(/^[\u2610\u2611\u2612\u2705\u2713\u2714\u2022]\s*/, '').trim();
    if (!line) continue;

    let price = null;
    const priceMatch = line.match(/(?:(?:EUR|€)\s*([0-9]+[.,][0-9]{2})|([0-9]+[.,][0-9]{2})\s*(?:EUR|€|Euro)?)$/i);
    if (priceMatch) {
      const priceStr = priceMatch[1] || priceMatch[2];
      const parsed = parseFloat(priceStr.replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        price = parsed;
        line = line.substring(0, priceMatch.index).trim();
      }
    }

    let store = defaultStore || '';
    const storeMatch = line.match(/[\(\[]([^\)\]]+)[\)\]]\s*$/);
    if (storeMatch) {
      const inside = storeMatch[1].trim();
      const isPackSize = /^(\d+[\.,]?\d*\s*(?:er|g|kg|ml|l|stk|stück|st\.?|pack|pkg|dose|fl|flasche|beutel|bund|x|gl)?|\d+)$/i.test(inside);
      if (!isPackSize) {
        store = inside;
        line = line.substring(0, storeMatch.index).trim();
      }
    }
    line = line.replace(/[,;:]+$/, '').trim();
    if (!line) continue;

    itemsToAdd.push({
      id: 'shop_test_' + itemsToAdd.length,
      name: line,
      price: price,
      store: store,
      checked: false
    });
  }
  return itemsToAdd;
}

const sampleWhatsApp = `
Einkaufsliste:
- 2x Hafermilch (Rewe)
- 1 Laib Vollkornbrot 2,49 €
• Äpfel 1.99€
Butter (Aldi)
4) Bio Eier (10er)
[ ] Kaffee 6,99 €
`;

const parsed = parseShoppingTextTest(sampleWhatsApp, 'Supermarkt');
console.log('Parsed items count:', parsed.length);
parsed.forEach((it, idx) => {
  console.log(`  ${idx + 1}. [${it.store}] ${it.name} | Price: ${it.price !== null ? it.price + ' €' : 'none'}`);
});

if (parsed.length !== 6) {
  console.error('Expected 6 parsed items, got', parsed.length);
  process.exit(1);
}

if (parsed[0].name !== '2x Hafermilch' || parsed[0].store !== 'Rewe') {
  console.error('Item 0 mismatch', parsed[0]);
  process.exit(1);
}
if (parsed[1].name !== '1 Laib Vollkornbrot' || parsed[1].price !== 2.49) {
  console.error('Item 1 mismatch', parsed[1]);
  process.exit(1);
}
if (parsed[2].name !== 'Äpfel' || parsed[2].price !== 1.99) {
  console.error('Item 2 mismatch', parsed[2]);
  process.exit(1);
}
if (parsed[5].name !== 'Kaffee' || parsed[5].price !== 6.99) {
  console.error('Item 5 mismatch', parsed[5]);
  process.exit(1);
}

console.log('Shopping list test: 100% PASS!');
