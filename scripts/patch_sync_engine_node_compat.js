const fs = require('fs');
let content = fs.readFileSync('sync_engine.js', 'utf8');

const oldHook = `// Automatische Persistenz-Wiederherstellung für WebViews & Android
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
}`;

const newHook = `// Automatische Persistenz-Wiederherstellung für WebViews & Android
if (typeof window !== 'undefined') {
  const initSyncPersistence = () => {
    try {
      if (typeof SyncEngine !== 'undefined' && typeof SyncEngine.restorePersistentState === 'function') {
        SyncEngine.restorePersistentState();
      }
    } catch (e) {}
  };
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSyncPersistence);
    } else {
      initSyncPersistence();
    }
  } else {
    initSyncPersistence();
  }
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('load', initSyncPersistence);
  }
  setTimeout(initSyncPersistence, 150);
  setTimeout(initSyncPersistence, 600);
  setTimeout(initSyncPersistence, 1500);
}`;

content = content.replace(/\r\n/g, '\n').replace(oldHook.replace(/\r\n/g, '\n'), newHook.replace(/\r\n/g, '\n'));
fs.writeFileSync('sync_engine.js', content, 'utf8');
console.log('Fixed sync_engine hook for node mock environment');
