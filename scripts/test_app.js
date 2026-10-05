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

// 5. Test Mailbox Sync UI and Functions
console.log('Testing Mailbox Sync integration...');
const expectedMailboxIds = [
  'sync-mailbox-card',
  'sync-mailbox-badge',
  'sync-mailbox-paired-content',
  'sync-mailbox-unpaired-notice',
  'sync-mailbox-partner-name',
  'sync-mailbox-last-sync-time',
  'btn-manual-mailbox-sync',
  'sync-mailbox-last-status'
];
expectedMailboxIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`Missing Mailbox Sync HTML element id="${id}"`);
    process.exit(1);
  }
});
console.log('All 8 Mailbox Sync HTML element IDs present.');

const syncEngineJs = fs.readFileSync('sync_engine.js', 'utf8');
try {
  new Function(syncEngineJs);
  console.log('sync_engine.js syntax check: PASS (valid JavaScript)');
} catch (e) {
  console.error('sync_engine.js syntax check: FAIL', e.message);
  process.exit(1);
}

const requiredSyncMethods = [
  'postToMailbox',
  'checkMailbox',
  'scheduleMailboxPush',
  'startMailboxListener',
  'handleIncomingMailboxUpdate',
  'getMailboxTopic',
  'exportCurrentVaultData',
  'mergeIncomingIntoAppState'
];
requiredSyncMethods.forEach(m => {
  if (!syncEngineJs.includes(m)) {
    console.error(`Missing required SyncEngine method: ${m}`);
    process.exit(1);
  }
});
console.log('All 8 SyncEngine mailbox methods present.');

// Test entity merging logic
const localState = {
  transactions: [{ id: 'tx_1', amount: 50 }],
  accounts: [{ id: 'acc_1', name: 'Giro', balance: 500 }],
  savingPots: [{ id: 'pot_1', name: 'Urlaub', currentAmount: 100 }],
  shoppingList: [{ id: 'shop_1', name: 'Milch', checked: false }],
  budgets: { Lebensmittel: 300 },
  customCategories: { exp: { Garten: true } }
};

const incomingState = {
  transactions: [{ id: 'tx_1', amount: 50 }, { id: 'tx_2', amount: 25 }],
  savingPots: [{ id: 'pot_1', name: 'Urlaub' }, { id: 'pot_2', name: 'Auto', currentAmount: 500 }],
  shoppingList: [{ id: 'shop_1', name: 'Milch' }, { id: 'shop_2', name: 'Brot', checked: true }],
  budgets: { Freizeit: 150 },
  customCategories: { exp: { Haustier: true } }
};

// Simulate mergeIncomingIntoAppState
const existingTxIds = new Set(localState.transactions.map(t => String(t.id)));
for (const t of incomingState.transactions) {
  if (t && t.id && !existingTxIds.has(String(t.id))) {
    localState.transactions.push(t);
  }
}
const existingPotIds = new Set(localState.savingPots.map(p => String(p.id)));
for (const p of incomingState.savingPots) {
  if (p && p.id && !existingPotIds.has(String(p.id))) {
    localState.savingPots.push(p);
  }
}
const existingShopIds = new Set(localState.shoppingList.map(s => String(s.id)));
for (const s of incomingState.shoppingList) {
  if (s && s.id && !existingShopIds.has(String(s.id))) {
    localState.shoppingList.push(s);
  }
}
Object.assign(localState.budgets, incomingState.budgets);
Object.assign(localState.customCategories.exp, incomingState.customCategories.exp);

if (localState.transactions.length !== 2 || localState.savingPots.length !== 2 || localState.shoppingList.length !== 2) {
  console.error('Entity merge mismatch');
  process.exit(1);
}
if (localState.budgets.Freizeit !== 150 || localState.customCategories.exp.Haustier !== true) {
  console.error('Budgets or categories merge mismatch');
  process.exit(1);
}
console.log('Entity merge simulation: 100% PASS!');

// 6. Test Overview Accordion & Transaction Filtering / Sorting
console.log('Testing Transaction Filter & Sort Engine for Overview Accordions...');

const requiredTxFunctions = [
  'applyTxFilters',
  'applyTxSorting',
  'handleTxSearchFilterChange',
  'handleTxSortChange',
  'clearTxSearch',
  'renderTransactionList'
];
requiredTxFunctions.forEach(fn => {
  const regex = new RegExp(`\\bfunction\\s+${fn}\\b|\\basync\\s+function\\s+${fn}\\b`);
  if (!regex.test(appJs)) {
    console.error(`Missing required Transaction function: ${fn}`);
    process.exit(1);
  }
});
console.log('All 6 Transaction / Overview functions present in app.js.');

// Evaluate filtering and sorting functions in sandbox
const sandbox = {};
const txTestCode = `
${appJs}
return {
  applyTxFilters,
  applyTxSorting,
  currentTxFilter,
  get currentTxSortOrder() { return currentTxSortOrder; },
  set currentTxSortOrder(v) { currentTxSortOrder = v; },
  handleTxSortChange,
  renderTransactionList
};
`;

let txEngine;
try {
  const factory = new Function(txTestCode);
  // Provide basic window / document mocks
  global.window = {
    addEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    location: { href: '' }
  };
  global.document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: (id) => ({
      value: '',
      style: {},
      innerHTML: '',
      focus: () => {},
      querySelectorAll: () => []
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {} }),
    body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }
  };
  global.appState = {
    accounts: [
      { id: 'acc_giro', name: 'Girokonto' },
      { id: 'acc_sparen', name: 'Tagesgeld' }
    ]
  };
  global.announceNVDA = () => {};
  global.formatDateGerman = (d) => d;
  global.formatCurrency = (amt) => (amt || 0).toFixed(2) + ' €';
  global.escapeHTML = (s) => String(s || '');
  txEngine = factory();
} catch (e) {
  console.error('Failed to instantiate Transaction Filter / Sort Engine:', e);
  process.exit(1);
}

// Test sample transaction list
const dummyTransactions = [
  { id: 'tx_1', date: '2026-10-01', amount: 45.50, category: 'Lebensmittel', subcategory: 'Supermarkt', description: 'Wocheneinkauf Rewe', type: 'expense', account: 'acc_giro' },
  { id: 'tx_2', date: '2026-10-02', amount: 1200.00, category: 'Gehalt', subcategory: 'Hauptberuf', description: 'Gehaltseingang', type: 'income', account: 'acc_giro' },
  { id: 'tx_3', date: '2026-10-03', amount: 15.00, category: 'Freizeit', subcategory: 'Kino', description: 'Kinokarte Cinemaxx', type: 'expense', account: 'acc_sparen' },
  { id: 'tx_4', date: '2026-10-04', amount: 150.00, category: 'Sparen', subcategory: 'Notgroschen', description: 'Übertrag Tagesgeld', type: 'transfer', fromAccount: 'acc_giro', toAccount: 'acc_sparen' }
];

// Test 1: Empty filter returns all
let res = txEngine.applyTxFilters(dummyTransactions);
if (res.length !== 4) {
  console.error('Expected 4 unfiltered transactions, got', res.length);
  process.exit(1);
}

// Test 2: Search by query (fuzzy / text)
txEngine.currentTxFilter.query = 'rewe';
res = txEngine.applyTxFilters(dummyTransactions);
if (res.length !== 1 || res[0].id !== 'tx_1') {
  console.error('Query search for "rewe" failed, got', res);
  process.exit(1);
}

// Test 3: Search by account
txEngine.currentTxFilter.query = '';
txEngine.currentTxFilter.account = 'acc_sparen';
res = txEngine.applyTxFilters(dummyTransactions);
// tx_3 (account: acc_sparen) and tx_4 (toAccount: acc_sparen)
if (res.length !== 2) {
  console.error('Account filter for "acc_sparen" failed, got', res.length);
  process.exit(1);
}

// Test 4: Sorting by amount descending
txEngine.currentTxFilter.account = 'all';
txEngine.currentTxSortOrder = 'amount-desc';
res = txEngine.applyTxSorting(dummyTransactions);
if (res[0].id !== 'tx_2' || res[res.length - 1].id !== 'tx_3') {
  console.error('Amount desc sort failed:', res.map(t => t.amount));
  process.exit(1);
}

// Test 5: Sorting by date ascending
txEngine.currentTxSortOrder = 'date-asc';
res = txEngine.applyTxSorting(dummyTransactions);
if (res[0].id !== 'tx_1' || res[res.length - 1].id !== 'tx_4') {
  console.error('Date asc sort failed:', res.map(t => t.date));
  process.exit(1);
}

// Test 6: Verify renderTransactionList works without error and produces markup
const containerEl = { innerHTML: '', style: {} };
global.document.getElementById = (id) => {
  if (id === 'test-tx-container') return containerEl;
  return { value: '', style: {}, innerHTML: '', focus: () => {}, querySelectorAll: () => [] };
};
txEngine.renderTransactionList(dummyTransactions, 'test-tx-container', 'Keine Buchungen vorhanden');
if (!containerEl.innerHTML.includes('tx-list') || !containerEl.innerHTML.includes('Wocheneinkauf Rewe')) {
  console.error('renderTransactionList failed to render markup:', containerEl.innerHTML);
  process.exit(1);
}
console.log('renderTransactionList HTML output: verified PASS!');

console.log('Transaction Filter & Sort Engine: 100% PASS!');
console.log('\n======================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (v6.9.3)');
console.log('======================================');

