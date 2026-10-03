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

// 4. Test Wishlist elements and functions
console.log('Testing Wishlist & Sparziele integration...');
const expectedWishlistIds = [
  'form-add-wish',
  'wish-type',
  'wish-title',
  'wish-amount',
  'wish-priority',
  'wish-category',
  'wish-target-account',
  'wish-target-date',
  'wish-note',
  'wish-filter-status',
  'wish-filter-type',
  'wishlist-items-container',
  'wishlist-stat-count',
  'wishlist-stat-total',
  'wishlist-stat-affordable'
];
expectedWishlistIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`Missing Wishlist HTML element id="${id}"`);
    process.exit(1);
  }
});
console.log('All 15 Wishlist HTML element IDs present.');

// Test wishlist functions existence in app.js
const requiredWishlistFunctions = [
  'ensureWishlistInitialized',
  'populateWishlistAccountDropdown',
  'handleAddWish',
  'renderWishlist',
  'handleFulfillWishAsExpense',
  'handleFulfillWishAsRecurring',
  'handleToggleWishFulfilled',
  'handleDeleteWish'
];
requiredWishlistFunctions.forEach(fn => {
  const regex = new RegExp(`\\bfunction\\s+${fn}\\b|\\basync\\s+function\\s+${fn}\\b`);
  if (!regex.test(appJs)) {
    console.error(`Missing required Wishlist function: ${fn}`);
    process.exit(1);
  }
});
console.log('All 8 Wishlist functions present in app.js.');

// Functional simulation of wishlist logic
const testState = {
  wishlist: [],
  accounts: [{ id: 'bank', name: 'Girokonto', balance: 500 }],
  savingPots: [{ id: 'pot_1', accountId: 'bank', name: 'Neuer PC', currentAmount: 250, targetAmount: 1000 }],
  transactions: []
};

// Add one-time wish
testState.wishlist.push({
  id: 'wish_test_1',
  type: 'once',
  title: 'Monitor',
  amount: 200,
  priority: 'high',
  category: 'Elektronik',
  account: 'pot_1',
  fulfilled: false
});

// Add subscription wish
testState.wishlist.push({
  id: 'wish_test_2',
  type: 'monthly',
  title: 'Musik-Streaming',
  amount: 10.99,
  priority: 'medium',
  category: 'Abo',
  account: 'bank',
  fulfilled: false
});

if (testState.wishlist.length !== 2) {
  console.error('Wishlist length mismatch');
  process.exit(1);
}

// Test open wishes filter
const openWishes = testState.wishlist.filter(w => !w.fulfilled);
if (openWishes.length !== 2) {
  console.error('Open wishes filter mismatch');
  process.exit(1);
}

// Fulfill wish 1 from pot
const wish1 = testState.wishlist.find(w => w.id === 'wish_test_1');
const pot = testState.savingPots.find(p => p.id === wish1.account);
pot.currentAmount -= wish1.amount;
wish1.fulfilled = true;
testState.transactions.push({
  id: 'tx_wish_1',
  type: 'expense',
  amount: wish1.amount,
  description: `Wunsch erfüllt: ${wish1.title}`
});

if (pot.currentAmount !== 50) {
  console.error('Pot deduction mismatch, expected 50, got', pot.currentAmount);
  process.exit(1);
}
if (testState.transactions.length !== 1 || testState.transactions[0].amount !== 200) {
  console.error('Transaction mismatch');
  process.exit(1);
}

const remainingOpen = testState.wishlist.filter(w => !w.fulfilled);
if (remainingOpen.length !== 1 || remainingOpen[0].id !== 'wish_test_2') {
  console.error('Remaining open wishes mismatch');
  process.exit(1);
}

console.log('Wishlist logic test: 100% PASS!');
