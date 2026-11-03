const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const appJsPath = path.join(baseDir, 'app.js');
const syncEnginePath = path.join(baseDir, 'sync_engine.js');

console.log('--- Applying Comprehensive Fixes ---');

// ==========================================
// 1. PATCH sync_engine.js
// ==========================================
let syncEngineCode = fs.readFileSync(syncEnginePath, 'utf8');

// Patch restorePersistentState in sync_engine.js
const oldRestorePersistentState = `  restorePersistentState() {
    try {
      if (typeof window !== 'undefined' && window.AndroidBiometrics && typeof window.AndroidBiometrics.getPreference === 'function') {
        const keys = [
          'haushaltsbuch_sync_code',
          'haushaltsbuch_sync_devicename',
          'haushaltsbuch_sync_paired_devices',
          'haushaltsbuch_sync_connected',
          'haushaltsbuch_sync_connected_device',
          'haushaltsbuch_sync_connected_code',
          'haushaltsbuch_sync_connected_time',
          'haushaltsbuch_sync_removed_devices'
        ];
        for (const k of keys) {
          const nativeVal = window.AndroidBiometrics.getPreference(k);
          const localVal = (typeof localStorage !== 'undefined') ? localStorage.getItem(k) : null;
          if (nativeVal && (!localVal || (k === 'haushaltsbuch_sync_paired_devices' && localVal === '[]' && nativeVal !== '[]'))) {
            if (typeof localStorage !== 'undefined') localStorage.setItem(k, nativeVal);
          } else if (localVal && !nativeVal) {
            window.AndroidBiometrics.setPreference(k, localVal);
          }
        }
      }
    } catch (e) {}
  },`;

const newRestorePersistentState = `  restorePersistentState() {
    try {
      if (typeof window !== 'undefined' && window.AndroidBiometrics && typeof window.AndroidBiometrics.getPreference === 'function') {
        const keys = [
          'haushaltsbuch_sync_code',
          'haushaltsbuch_sync_devicename',
          'haushaltsbuch_sync_paired_devices',
          'haushaltsbuch_sync_connected',
          'haushaltsbuch_sync_connected_device',
          'haushaltsbuch_sync_connected_code',
          'haushaltsbuch_sync_connected_time',
          'haushaltsbuch_sync_removed_devices'
        ];
        for (const k of keys) {
          const nativeVal = window.AndroidBiometrics.getPreference(k);
          const localVal = (typeof localStorage !== 'undefined') ? localStorage.getItem(k) : null;
          if (nativeVal && typeof nativeVal === 'string' && nativeVal.trim()) {
            if (k === 'haushaltsbuch_sync_paired_devices') {
              if (!localVal || localVal === '[]' || localVal === 'null') {
                if (typeof localStorage !== 'undefined') localStorage.setItem(k, nativeVal);
              } else {
                // Beide Quellen haben Geräte -> zusammenführen ohne Verlust
                try {
                  const nList = JSON.parse(nativeVal);
                  const lList = JSON.parse(localVal);
                  if (Array.isArray(nList) && Array.isArray(lList)) {
                    const mergedMap = new Map();
                    lList.forEach(d => { if (d && d.name) mergedMap.set(d.name.toLowerCase(), d); });
                    nList.forEach(d => {
                      if (d && d.name && (!mergedMap.has(d.name.toLowerCase()) || !mergedMap.get(d.name.toLowerCase()).code)) {
                        mergedMap.set(d.name.toLowerCase(), d);
                      }
                    });
                    const mergedStr = JSON.stringify(Array.from(mergedMap.values()));
                    if (typeof localStorage !== 'undefined') localStorage.setItem(k, mergedStr);
                    window.AndroidBiometrics.setPreference(k, mergedStr);
                  }
                } catch (e) {}
              }
            } else if (k === 'haushaltsbuch_sync_code') {
              // Android SharedPreferences ist der Master-Schlüssel für diesen Kopplungscode!
              if (typeof localStorage !== 'undefined') localStorage.setItem(k, nativeVal);
            } else if (k === 'haushaltsbuch_sync_devicename') {
              if (!localVal || /^(PC|Handy)-[A-Z0-9]{4}$/i.test(localVal)) {
                if (typeof localStorage !== 'undefined') localStorage.setItem(k, nativeVal);
              }
            } else if (!localVal) {
              if (typeof localStorage !== 'undefined') localStorage.setItem(k, nativeVal);
            }
          } else if (localVal && (!nativeVal || !nativeVal.trim())) {
            window.AndroidBiometrics.setPreference(k, localVal);
          }
        }
      }
    } catch (e) {}
  },`;

if (syncEngineCode.includes(oldRestorePersistentState)) {
  syncEngineCode = syncEngineCode.replace(oldRestorePersistentState, newRestorePersistentState);
  console.log('✓ Patched restorePersistentState in sync_engine.js');
} else {
  console.warn('⚠️ oldRestorePersistentState exact match not found in sync_engine.js');
}

// In getDeviceName, replace localStorage.setItem with this.setPersistentItem
syncEngineCode = syncEngineCode.replace(
  'name = realName;\n        localStorage.setItem("haushaltsbuch_sync_devicename", name);',
  'name = realName;\n        this.setPersistentItem("haushaltsbuch_sync_devicename", name);'
);
syncEngineCode = syncEngineCode.replace(
  'name = realName;\n        localStorage.setItem("haushaltsbuch_sync_devicename", name);',
  'name = realName;\n        this.setPersistentItem("haushaltsbuch_sync_devicename", name);'
);
syncEngineCode = syncEngineCode.replace(
  'name = (isAndroid ? "Handy-" : "PC-") + suffix;\n        localStorage.setItem("haushaltsbuch_sync_devicename", name);',
  'name = (isAndroid ? "Handy-" : "PC-") + suffix;\n        this.setPersistentItem("haushaltsbuch_sync_devicename", name);'
);

// In getPairingCode, call this.restorePersistentState() first
const oldGetPairingCode = `  getPairingCode() {
    let code = this.getPersistentItem('haushaltsbuch_sync_code');`;
const newGetPairingCode = `  getPairingCode() {
    this.restorePersistentState();
    let code = this.getPersistentItem('haushaltsbuch_sync_code');`;
if (syncEngineCode.includes(oldGetPairingCode)) {
  syncEngineCode = syncEngineCode.replace(oldGetPairingCode, newGetPairingCode);
  console.log('✓ Patched getPairingCode in sync_engine.js');
}

// In getDeviceName, call this.restorePersistentState() first
const oldGetDeviceName = `    getDeviceName() {
      let name = this.getPersistentItem("haushaltsbuch_sync_devicename");`;
const newGetDeviceName = `    getDeviceName() {
      this.restorePersistentState();
      let name = this.getPersistentItem("haushaltsbuch_sync_devicename");`;
if (syncEngineCode.includes(oldGetDeviceName)) {
  syncEngineCode = syncEngineCode.replace(oldGetDeviceName, newGetDeviceName);
  console.log('✓ Patched getDeviceName in sync_engine.js');
}

// Add lifecycle persistence initialization at the bottom of sync_engine.js if not already present
if (!syncEngineCode.includes('initSyncPersistence')) {
  syncEngineCode += `

// Automatische Persistenz-Wiederherstellung für WebViews & Android
if (typeof window !== 'undefined') {
  const initSyncPersistence = () => {
    try {
      if (typeof SyncEngine !== 'undefined' && typeof SyncEngine.restorePersistentState === 'function') {
        SyncEngine.restorePersistentState();
      }
    } catch (e) {}
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSyncPersistence);
  } else {
    initSyncPersistence();
  }
  window.addEventListener('load', initSyncPersistence);
  setTimeout(initSyncPersistence, 150);
  setTimeout(initSyncPersistence, 600);
  setTimeout(initSyncPersistence, 1500);
}
`;
  console.log('✓ Added lifecycle persistence hook to sync_engine.js');
}

fs.writeFileSync(syncEnginePath, syncEngineCode, 'utf8');


// ==========================================
// 2. PATCH app.js
// ==========================================
let appCode = fs.readFileSync(appJsPath, 'utf8');

// Patch A: closeTopmostModal function and Escape key handler
const oldEscapeBlock = `    if (e.key === 'Escape') {
      const quickCatModal = document.getElementById('quick-add-category-modal');
      if (quickCatModal && quickCatModal.style.display !== 'none') {
        closeQuickCategoryModal();
        return;
      }
      closeReceiptModal();
      closeReceiptTextPrompt();
      closeEditModal();
      closeEditRecModal();
      closeEndOrDeleteRecModal();
      closeAccountModal();
      closeCashCounterModal();
      return;
    }`;

const newEscapeBlock = `    if (e.key === 'Escape') {
      if (closeTopmostModal()) {
        e.preventDefault();
        return;
      }
    }`;

// Define closeTopmostModal before setupGlobalKeyboardShortcuts
const closeTopmostModalFn = `function isModalOpen(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  return el.style && el.style.display !== 'none' && el.style.display !== '';
}

function closeTopmostModal() {
  // 1. Zuerst übergeordnete Popups / Child-Modals schließen
  if (isModalOpen('quick-add-category-modal')) { closeQuickCategoryModal(); return true; }
  if (isModalOpen('receipt-text-prompt-modal')) { closeReceiptTextPrompt(); return true; }
  if (isModalOpen('receipt-viewer-modal')) { closeReceiptModal(); return true; }
  if (isModalOpen('delete-peer-repay-modal')) { closeDeletePeerRepayModal(); return true; }
  if (isModalOpen('delete-peer-loan-modal')) { closeDeletePeerLoanModal(); return true; }
  if (isModalOpen('settle-peer-loan-modal')) { closeSettlePeerLoanModal(); return true; }
  if (isModalOpen('peer-loan-repay-modal')) { closePeerLoanRepayModal(); return true; }
  if (isModalOpen('end-or-delete-rec-modal')) { closeEndOrDeleteRecModal(); return true; }
  if (isModalOpen('cash-counter-modal')) { closeCashCounterModal(); return true; }
  if (isModalOpen('shopping-paste-modal')) { closeShoppingPasteModal(); return true; }
  if (isModalOpen('shopping-book-modal')) { closeShoppingBookModal(); return true; }
  if (isModalOpen('csv-preview-modal')) { closeCsvPreviewModal(); return true; }
  if (isModalOpen('print-report-modal')) { closePrintReportModal(); return true; }
  if (isModalOpen('changelog-modal')) { closeChangelogModal(); return true; }

  // 2. Parent-Modals schließen (nur wenn kein Child-Modal darüber liegt)
  if (isModalOpen('peer-loan-modal')) { closePeerLoanModal(); return true; }
  if (isModalOpen('edit-tx-modal')) { closeEditModal(); return true; }
  if (isModalOpen('edit-rec-modal')) { closeEditRecModal(); return true; }
  if (isModalOpen('account-modal')) { closeAccountModal(); return true; }

  return false;
}

`;

if (!appCode.includes('function closeTopmostModal()')) {
  appCode = appCode.replace('function setupGlobalKeyboardShortcuts() {', closeTopmostModalFn + 'function setupGlobalKeyboardShortcuts() {');
  console.log('✓ Added closeTopmostModal function to app.js');
}

if (appCode.includes(oldEscapeBlock)) {
  appCode = appCode.replace(oldEscapeBlock, newEscapeBlock);
  console.log('✓ Patched Escape handler with closeTopmostModal() in app.js');
} else {
  console.warn('⚠️ oldEscapeBlock not found in app.js');
}

// Patch Android Back Button to use closeTopmostModal() first
const oldAndroidBackButton = `      // 1. Offenes Modal schließen
      const modalSelectors = [
        '#quick-add-category-modal', '#edit-tx-modal', '#settle-peer-loan-modal', '#delete-peer-loan-modal',
        '#delete-peer-repay-modal', '#peer-loan-modal', '#peer-loan-repay-modal',
        '#quick-cat-modal', '#cash-counter-modal', '#edit-account-modal',
        '#delete-account-modal', '#edit-rec-modal', '#tx-detail-modal',
        '#edit-planned-modal', '#end-or-delete-rec-modal', '#edit-budget-modal',
        '#delete-budget-modal', '#edit-shopping-modal', '#changelog-modal',
        '#vault-reset-confirm-modal', '#receipt-fullscreen-viewer-modal', '#qr-scanner-modal'
      ];
      for (const sel of modalSelectors) {
        const m = document.querySelector(sel);
        if (m && m.style && m.style.display !== 'none' && m.style.display !== '') {
          const closeBtn = m.querySelector('.btn-close-modal, .modal-close-btn, button[onclick*="close"], button[aria-label*="schließen"], button[aria-label*="Schließen"]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            m.style.display = 'none';
          }
          announceNVDA('Fenster geschlossen.');
          return;
        }
      }`;

const newAndroidBackButton = `      // 1. Offenes Modal schließen (hierarchisch: Kind-Modals vor Eltern-Modals)
      if (typeof closeTopmostModal === 'function' && closeTopmostModal()) {
        announceNVDA('Fenster geschlossen.');
        return;
      }
      const genericModalSelectors = [
        '#quick-cat-modal', '#edit-account-modal', '#delete-account-modal',
        '#tx-detail-modal', '#edit-planned-modal', '#edit-budget-modal',
        '#delete-budget-modal', '#edit-shopping-modal',
        '#vault-reset-confirm-modal', '#receipt-fullscreen-viewer-modal', '#qr-scanner-modal'
      ];
      for (const sel of genericModalSelectors) {
        const m = document.querySelector(sel);
        if (m && m.style && m.style.display !== 'none' && m.style.display !== '') {
          const closeBtn = m.querySelector('.btn-close-modal, .modal-close-btn, button[onclick*="close"], button[aria-label*="schließen"], button[aria-label*="Schließen"]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            m.style.display = 'none';
          }
          announceNVDA('Fenster geschlossen.');
          return;
        }
      }`;

if (appCode.includes(oldAndroidBackButton)) {
  appCode = appCode.replace(oldAndroidBackButton, newAndroidBackButton);
  console.log('✓ Patched initAndroidBackButton in app.js');
} else {
  console.warn('⚠️ oldAndroidBackButton not found in app.js');
}

// Patch B: saveEditedTransaction same-account validation
const oldTxTransferBlock = `    if (type === 'transfer') {
      tx.fromAccount = document.getElementById('edit-tx-from').value;
      tx.toAccount = document.getElementById('edit-tx-to').value;
      tx.account = undefined;
      tx.category = 'Umbuchung';
      tx.subcategory = '';
    }`;

const newTxTransferBlock = `    if (type === 'transfer') {
      const fromAcc = document.getElementById('edit-tx-from').value;
      const toAcc = document.getElementById('edit-tx-to').value;
      if (fromAcc === toAcc) {
        showAppNotification('Start- und Zielkonto dürfen bei einer Umbuchung nicht identisch sein.', 'warning');
        announceNVDA('Fehler: Start- und Zielkonto dürfen bei einer Umbuchung nicht identisch sein.');
        return;
      }
      tx.fromAccount = fromAcc;
      tx.toAccount = toAcc;
      tx.account = undefined;
      tx.category = 'Umbuchung';
      tx.subcategory = '';
    }`;

if (appCode.includes(oldTxTransferBlock)) {
  appCode = appCode.replace(oldTxTransferBlock, newTxTransferBlock);
  console.log('✓ Patched saveEditedTransaction transfer check in app.js');
}

// Patch B2: saveEditedRecurring same-account validation
const oldRecTransferBlock = `  if (type === 'transfer') {
    rec.fromAccount = document.getElementById('edit-rec-from').value;
    rec.toAccount = document.getElementById('edit-rec-to').value;
    rec.account = undefined;
    rec.category = 'Umbuchung & Sparplan';
    rec.subcategory = '';
  }`;

const newRecTransferBlock = `  if (type === 'transfer') {
    const fromAcc = document.getElementById('edit-rec-from').value;
    const toAcc = document.getElementById('edit-rec-to').value;
    if (fromAcc === toAcc) {
      showAppNotification('Start- und Zielkonto dürfen bei einer Dauer-Umbuchung nicht identisch sein.', 'warning');
      announceNVDA('Fehler: Start- und Zielkonto dürfen bei einer Dauer-Umbuchung nicht identisch sein.');
      return;
    }
    rec.fromAccount = fromAcc;
    rec.toAccount = toAcc;
    rec.account = undefined;
    rec.category = 'Umbuchung & Sparplan';
    rec.subcategory = '';
  }`;

if (appCode.includes(oldRecTransferBlock)) {
  appCode = appCode.replace(oldRecTransferBlock, newRecTransferBlock);
  console.log('✓ Patched saveEditedRecurring transfer check in app.js');
}

// Patch C: populateEditRecCategories safeType
appCode = appCode.replace(
  "const catType = (type === 'income') ? 'inc' : 'exp';",
  "const catType = (type === 'income' || type === 'inc') ? 'inc' : 'exp';"
);
appCode = appCode.replace(
  "const currentType = (type === 'income') ? 'inc' : 'exp';",
  "const currentType = (type === 'income' || type === 'inc') ? 'inc' : 'exp';"
);
console.log('✓ Patched populateEditRecCategories safeType in app.js');

// Patch D: calculateBalancesUpToDate dynamic startYear and NaN guards
const oldBalanceLoop = `      const amt = Number(tx.amount || 0);
      const accId = resolveTxAccId(tx.account);
      if (tx.type === 'income' && accId && balances[accId] !== undefined) {
        balances[accId] += amt;
      } else if (tx.type === 'expense' && accId && balances[accId] !== undefined) {
        balances[accId] -= amt;
      } else if (tx.type === 'transfer') {
        const fromId = resolveTxAccId(tx.fromAccount);
        const toId = resolveTxAccId(tx.toAccount);
        if (fromId && balances[fromId] !== undefined) balances[fromId] -= amt;
        if (toId && balances[toId] !== undefined) balances[toId] += amt;
      }
    }
  });

  const startYear = 2025;
  for (let y = startYear; y <= targetYear; y++) {
    const endM = (y === targetYear) ? targetMonth : 11;
    for (let m = 0; m <= endM; m++) {
      const recList = getRecurringTransactionsForMonth(y, m);
      recList.forEach(rec => {
        const recDate = rec.date || targetDateStr;
        if (recDate <= targetDateStr) {
          const amt = Number(rec.amount || 0);
          const recAccId = resolveTxAccId(rec.account);`;

const newBalanceLoop = `      const amt = Number(tx.amount || 0);
      if (isNaN(amt) || !isFinite(amt)) return;
      const accId = resolveTxAccId(tx.account);
      if (tx.type === 'income' && accId && balances[accId] !== undefined) {
        balances[accId] += amt;
      } else if (tx.type === 'expense' && accId && balances[accId] !== undefined) {
        balances[accId] -= amt;
      } else if (tx.type === 'transfer') {
        const fromId = resolveTxAccId(tx.fromAccount);
        const toId = resolveTxAccId(tx.toAccount);
        if (fromId && balances[fromId] !== undefined) balances[fromId] -= amt;
        if (toId && balances[toId] !== undefined) balances[toId] += amt;
      }
    }
  });

  let earliestYear = 2025;
  if (Array.isArray(appState.recurring)) {
    appState.recurring.forEach(r => {
      if (r && r.startYear && r.startYear < earliestYear) earliestYear = r.startYear;
    });
  }
  if (Array.isArray(appState.transactions)) {
    appState.transactions.forEach(t => {
      if (t && t.date) {
        const y = parseInt(t.date.substring(0, 4), 10);
        if (!isNaN(y) && y < earliestYear) earliestYear = y;
      }
    });
  }
  const startYear = Math.min(earliestYear, targetYear);
  for (let y = startYear; y <= targetYear; y++) {
    const endM = (y === targetYear) ? targetMonth : 11;
    for (let m = 0; m <= endM; m++) {
      const recList = getRecurringTransactionsForMonth(y, m);
      recList.forEach(rec => {
        const recDate = rec.date || targetDateStr;
        if (recDate <= targetDateStr) {
          const amt = Number(rec.amount || 0);
          if (isNaN(amt) || !isFinite(amt)) return;
          const recAccId = resolveTxAccId(rec.account);`;

if (appCode.includes(oldBalanceLoop)) {
  appCode = appCode.replace(oldBalanceLoop, newBalanceLoop);
  console.log('✓ Patched calculateBalancesUpToDate with dynamic startYear and NaN guards');
} else {
  console.warn('⚠️ oldBalanceLoop not matched exactly in app.js');
}

// Patch E: mergeCustomCategoriesIntoDB Array.isArray check
const oldMergeCategories = `      subList.forEach(sub => {
        if (!CATEGORIES_DB[type][mainCat].includes(sub)) {
          CATEGORIES_DB[type][mainCat].push(sub);
        }
      });`;

const newMergeCategories = `      if (Array.isArray(subList)) {
        subList.forEach(sub => {
          if (sub && !CATEGORIES_DB[type][mainCat].includes(sub)) {
            CATEGORIES_DB[type][mainCat].push(sub);
          }
        });
      }`;

if (appCode.includes(oldMergeCategories)) {
  appCode = appCode.replace(oldMergeCategories, newMergeCategories);
  console.log('✓ Patched mergeCustomCategoriesIntoDB Array.isArray check in app.js');
}

// Patch Desktop window.__PAIRED_DEVICE__ restore check
const oldPairedDevRestore = `      const existingRaw = localStorage.getItem('haushaltsbuch_sync_paired_devices');
      if (!existingRaw) {`;
const newPairedDevRestore = `      const existingRaw = localStorage.getItem('haushaltsbuch_sync_paired_devices');
      if (!existingRaw || existingRaw === '[]' || existingRaw === 'null') {`;

if (appCode.includes(oldPairedDevRestore)) {
  appCode = appCode.replace(oldPairedDevRestore, newPairedDevRestore);
  console.log('✓ Patched updateSyncConnectedUI pair restore check in app.js');
}

fs.writeFileSync(appJsPath, appCode, 'utf8');
console.log('--- Comprehensive Fixes Successfully Applied! ---');
