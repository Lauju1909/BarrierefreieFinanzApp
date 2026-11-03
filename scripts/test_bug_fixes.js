const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Testing Bug Fixes Suite ---');

const appJsCode = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const syncEngineCode = fs.readFileSync(path.join(__dirname, '../sync_engine.js'), 'utf8');

// 1. Test closeTopmostModal hierarchy logic
const domMock = {
  elements: {
    'quick-add-category-modal': { style: { display: 'none' } },
    'receipt-viewer-modal': { style: { display: 'none' } },
    'receipt-text-prompt-modal': { style: { display: 'none' } },
    'delete-peer-repay-modal': { style: { display: 'none' } },
    'delete-peer-loan-modal': { style: { display: 'none' } },
    'settle-peer-loan-modal': { style: { display: 'none' } },
    'peer-loan-repay-modal': { style: { display: 'none' } },
    'end-or-delete-rec-modal': { style: { display: 'none' } },
    'cash-counter-modal': { style: { display: 'none' } },
    'shopping-paste-modal': { style: { display: 'none' } },
    'shopping-book-modal': { style: { display: 'none' } },
    'csv-preview-modal': { style: { display: 'none' } },
    'print-report-modal': { style: { display: 'none' } },
    'changelog-modal': { style: { display: 'none' } },
    'peer-loan-modal': { style: { display: 'none' } },
    'edit-tx-modal': { style: { display: 'none' } },
    'edit-rec-modal': { style: { display: 'none' } },
    'account-modal': { style: { display: 'none' } }
  }
};

let closedOrder = [];
const sandbox = {
  document: {
    getElementById: (id) => domMock.elements[id] || null
  },
  closeQuickCategoryModal: () => closedOrder.push('quick-add-category-modal'),
  closeReceiptModal: () => {
    closedOrder.push('receipt-viewer-modal');
    domMock.elements['receipt-viewer-modal'].style.display = 'none';
  },
  closeReceiptTextPrompt: () => closedOrder.push('receipt-text-prompt-modal'),
  closeDeletePeerRepayModal: () => closedOrder.push('delete-peer-repay-modal'),
  closeDeletePeerLoanModal: () => closedOrder.push('delete-peer-loan-modal'),
  closeSettlePeerLoanModal: () => closedOrder.push('settle-peer-loan-modal'),
  closePeerLoanRepayModal: () => closedOrder.push('peer-loan-repay-modal'),
  closeEndOrDeleteRecModal: () => closedOrder.push('end-or-delete-rec-modal'),
  closeCashCounterModal: () => {
    closedOrder.push('cash-counter-modal');
    domMock.elements['cash-counter-modal'].style.display = 'none';
  },
  closeShoppingPasteModal: () => closedOrder.push('shopping-paste-modal'),
  closeShoppingBookModal: () => closedOrder.push('shopping-book-modal'),
  closeCsvPreviewModal: () => closedOrder.push('csv-preview-modal'),
  closePrintReportModal: () => closedOrder.push('print-report-modal'),
  closeChangelogModal: () => closedOrder.push('changelog-modal'),
  closePeerLoanModal: () => closedOrder.push('peer-loan-modal'),
  closeEditModal: () => {
    closedOrder.push('edit-tx-modal');
    domMock.elements['edit-tx-modal'].style.display = 'none';
  },
  closeEditRecModal: () => closedOrder.push('edit-rec-modal'),
  closeAccountModal: () => {
    closedOrder.push('account-modal');
    domMock.elements['account-modal'].style.display = 'none';
  }
};

// Extract closeTopmostModal and isModalOpen from app.js
const modalFuncMatch = appJsCode.match(/function isModalOpen[\s\S]+?return false;\s*\}/);
if (!modalFuncMatch) {
  throw new Error('closeTopmostModal function not found in app.js');
}

vm.runInNewContext(modalFuncMatch[0], sandbox);

// Scenario A: Both edit-tx-modal and receipt-viewer-modal are open
domMock.elements['edit-tx-modal'].style.display = 'flex';
domMock.elements['receipt-viewer-modal'].style.display = 'flex';
closedOrder = [];

const firstClose = sandbox.closeTopmostModal();
if (!firstClose || closedOrder.length !== 1 || closedOrder[0] !== 'receipt-viewer-modal') {
  throw new Error(`Scenario A failed: Expected only receipt-viewer-modal to close, got ${closedOrder.join(',')}`);
}
if (domMock.elements['edit-tx-modal'].style.display !== 'flex') {
  throw new Error('Scenario A failed: edit-tx-modal was closed prematurely!');
}
console.log('✓ Scenario A: Receipt modal closed while Edit Tx modal stayed open.');

// Scenario B: Now pressing Escape again closes edit-tx-modal
closedOrder = [];
const secondClose = sandbox.closeTopmostModal();
if (!secondClose || closedOrder.length !== 1 || closedOrder[0] !== 'edit-tx-modal') {
  throw new Error(`Scenario B failed: Expected edit-tx-modal to close, got ${closedOrder.join(',')}`);
}
console.log('✓ Scenario B: Edit Tx modal closed on second Escape.');

// Scenario C: Cash counter on top of Account modal
domMock.elements['account-modal'].style.display = 'flex';
domMock.elements['cash-counter-modal'].style.display = 'flex';
closedOrder = [];
sandbox.closeTopmostModal();
if (closedOrder.length !== 1 || closedOrder[0] !== 'cash-counter-modal') {
  throw new Error(`Scenario C failed: Expected only cash-counter-modal to close, got ${closedOrder.join(',')}`);
}
if (domMock.elements['account-modal'].style.display !== 'flex') {
  throw new Error('Scenario C failed: account-modal was closed prematurely!');
}
console.log('✓ Scenario C: Cash counter closed while Account modal stayed open.');

// 2. Test Sync Engine SharedPreferences master priority & merging
const storageMock = {
  native: {
    'haushaltsbuch_sync_code': 'MASTER-1234-CODE',
    'haushaltsbuch_sync_paired_devices': JSON.stringify([
      { name: 'PC von Laurin', code: 'PC-CODE-1111', time: 'Gestern', type: 'pc' }
    ])
  },
  local: {
    'haushaltsbuch_sync_code': 'TRANSIENT-9999-CODE',
    'haushaltsbuch_sync_paired_devices': JSON.stringify([
      { name: 'Handy von Laurin', code: 'HANDY-CODE-2222', time: 'Heute', type: 'phone' }
    ])
  }
};

const syncSandbox = {
  window: {
    AndroidBiometrics: {
      getPreference: (k) => storageMock.native[k] || null,
      setPreference: (k, v) => { storageMock.native[k] = v; }
    }
  },
  localStorage: {
    getItem: (k) => storageMock.local[k] || null,
    setItem: (k, v) => { storageMock.local[k] = v; }
  },
  console: console
};

// Run restorePersistentState in syncSandbox
const syncRestoreMatch = syncEngineCode.match(/restorePersistentState\(\)\s*\{[\s\S]+?\n  \},/);
if (!syncRestoreMatch) {
  throw new Error('restorePersistentState not found in sync_engine.js');
}

const restoreFnCode = `const SyncEngine = { ${syncRestoreMatch[0]} }; SyncEngine.restorePersistentState();`;
vm.runInNewContext(restoreFnCode, syncSandbox);

// Check that MASTER-1234-CODE superseded the transient code
if (storageMock.local['haushaltsbuch_sync_code'] !== 'MASTER-1234-CODE') {
  throw new Error(`Sync test failed: Expected local code to be MASTER-1234-CODE, got ${storageMock.local['haushaltsbuch_sync_code']}`);
}
console.log('✓ Sync Engine: Android SharedPreferences master code preserved.');

// Check that paired devices were merged
const mergedDevices = JSON.parse(storageMock.local['haushaltsbuch_sync_paired_devices']);
if (mergedDevices.length !== 2) {
  throw new Error(`Sync test failed: Expected 2 merged devices, got ${mergedDevices.length}`);
}
console.log('✓ Sync Engine: Devices merged without loss between native and local storage.');

console.log('======================================');
console.log('ALL BUG AUDIT CHECKS PASSED 100%!');
console.log('======================================');
