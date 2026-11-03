const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const appJsPath = path.join(baseDir, 'app.js');
const syncEnginePath = path.join(baseDir, 'sync_engine.js');

function patchFile(filePath, transforms) {
  let content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  let normalized = content.replace(/\r\n/g, '\n');

  transforms.forEach(({ name, target, replacement }) => {
    const targetNorm = target.replace(/\r\n/g, '\n');
    const repNorm = replacement.replace(/\r\n/g, '\n');
    if (normalized.includes(targetNorm)) {
      normalized = normalized.replace(targetNorm, repNorm);
      console.log(`✓ [SUCCESS] ${name}`);
    } else {
      console.warn(`⚠️ [NOT FOUND] ${name}`);
    }
  });

  if (isCrlf) {
    normalized = normalized.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(filePath, normalized, 'utf8');
}

// 1. sync_engine.js
patchFile(syncEnginePath, [
  {
    name: 'sync_engine: restorePersistentState',
    target: `  restorePersistentState() {
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
  },`,
    replacement: `  restorePersistentState() {
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
              // Android SharedPreferences ist der unzerstörbare Master-Schlüssel für diesen Kopplungscode!
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
  },`
  }
]);

// 2. app.js
patchFile(appJsPath, [
  {
    name: 'app.js: Escape key handler',
    target: `    if (e.key === 'Escape') {
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
    }`,
    replacement: `    if (e.key === 'Escape') {
      if (closeTopmostModal()) {
        e.preventDefault();
        return;
      }
    }`
  },
  {
    name: 'app.js: initAndroidBackButton',
    target: `      // 1. Offenes Modal schließen
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
      }`,
    replacement: `      // 1. Offenes Modal schließen (hierarchisch: Kind-Modals vor Eltern-Modals)
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
      }`
  },
  {
    name: 'app.js: calculateBalancesUpToDate',
    target: `      const amt = Number(tx.amount || 0);
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
          const recAccId = resolveTxAccId(rec.account);`,
    replacement: `      const amt = Number(tx.amount || 0);
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
          const recAccId = resolveTxAccId(rec.account);`
  },
  {
    name: 'app.js: saveEditedTransaction transfer check',
    target: `    if (type === 'transfer') {
      tx.fromAccount = document.getElementById('edit-tx-from').value;
      tx.toAccount = document.getElementById('edit-tx-to').value;
      tx.account = undefined;
      tx.category = 'Umbuchung';
      tx.subcategory = '';
    }`,
    replacement: `    if (type === 'transfer') {
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
    }`
  },
  {
    name: 'app.js: saveEditedRecurring transfer check',
    target: `  if (type === 'transfer') {
    rec.fromAccount = document.getElementById('edit-rec-from').value;
    rec.toAccount = document.getElementById('edit-rec-to').value;
    rec.account = undefined;
    rec.category = 'Umbuchung & Sparplan';
    rec.subcategory = '';
  }`,
    replacement: `  if (type === 'transfer') {
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
  }`
  },
  {
    name: 'app.js: mergeCustomCategoriesIntoDB Array.isArray check',
    target: `      subList.forEach(sub => {
        if (!CATEGORIES_DB[type][mainCat].includes(sub)) {
          CATEGORIES_DB[type][mainCat].push(sub);
        }
      });`,
    replacement: `      if (Array.isArray(subList)) {
        subList.forEach(sub => {
          if (sub && !CATEGORIES_DB[type][mainCat].includes(sub)) {
            CATEGORIES_DB[type][mainCat].push(sub);
          }
        });
      }`
  },
  {
    name: 'app.js: updateSyncConnectedUI pair restore check',
    target: `      const existingRaw = localStorage.getItem('haushaltsbuch_sync_paired_devices');
      if (!existingRaw) {`,
    replacement: `      const existingRaw = localStorage.getItem('haushaltsbuch_sync_paired_devices');
      if (!existingRaw || existingRaw === '[]' || existingRaw === 'null') {`
  }
]);

console.log('--- CRLF-Safe Patch Completed ---');
