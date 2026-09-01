// ==========================================================================
// BARRIEREFREIE FINANZEN - MIT TAGES- & MONATS-ANSICHT (NVDA)
// ==========================================================================

const STORAGE_ENCRYPTED_KEY = 'barrierefreie_finanz_app_aes_v6';
const PIN_SALT_KEY = 'barrierefreie_finanz_app_salt';
const PIN_VERIFIER_KEY = 'barrierefreie_finanz_app_verifier';

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const currentDateObj = new Date();
let selectedYear = currentDateObj.getFullYear();
let selectedMonth = currentDateObj.getMonth();
let selectedDateStr = currentDateObj.toISOString().split('T')[0]; // Standardmäßig HEUTE!
let currentOverviewMode = 'month'; // 'month' oder 'day'

let currentSessionKey = null;
let autoLockTimer = null;

let appState = {
  theme: 'theme-high-contrast',
  initialBalances: {
    bank: 0.00,
    paypal: 0.00,
    savings: 0.00,
    cash: 0.00
  },
  transactions: [],
  recurring: []
};

// --------------------------------------------------------------------------
// 1. NVDA LIVE ANNOUNCER
// --------------------------------------------------------------------------
function announceNVDA(message, isAssertive = false) {
  const targetId = isAssertive ? 'sr-live-assertive' : 'sr-live';
  const el = document.getElementById(targetId);
  if (el) {
    el.textContent = '';
    setTimeout(() => {
      el.textContent = message;
    }, 50);
  }
}

// --------------------------------------------------------------------------
// 2. KRYPTOGRAPHIE: AES-GCM 256-BIT (WEB CRYPTO API)
// --------------------------------------------------------------------------
function getOrCreateSalt() {
  let saltHex = localStorage.getItem(PIN_SALT_KEY);
  if (!saltHex) {
    const saltBytes = new Uint8Array(16);
    window.crypto.getRandomValues(saltBytes);
    saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(PIN_SALT_KEY, saltHex);
  }
  const match = saltHex.match(/.{1,2}/g) || [];
  return new Uint8Array(match.map(byte => parseInt(byte, 16)));
}

async function deriveKeyFromPin(pin) {
  const enc = new TextEncoder();
  const salt = getOrCreateSalt();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(plainText, key) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(plainText)
  );

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
  return JSON.stringify({ iv: ivHex, data: cipherHex });
}

async function decryptData(cipherJsonStr, key) {
  try {
    const parsed = JSON.parse(cipherJsonStr);
    const iv = new Uint8Array(parsed.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const cipherBytes = new Uint8Array(parsed.data.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    throw new Error("Entschlüsselung fehlgeschlagen.");
  }
}

// --------------------------------------------------------------------------
// 3. SPERRBILDSCHIRM & AUTHENTIFIZIERUNG
// --------------------------------------------------------------------------
function checkLockState() {
  const verifier = localStorage.getItem(PIN_VERIFIER_KEY);
  const lockScreen = document.getElementById('lock-screen');
  const appWrapper = document.getElementById('app-wrapper');
  const pinInput = document.getElementById('pin-input');
  const firstTimeHint = document.getElementById('first-time-hint');

  if (!verifier) {
    firstTimeHint.style.display = 'block';
    document.getElementById('lock-instructions').textContent = "Erster Start: Bitte wähle eine PIN oder ein Passwort.";
    document.getElementById('btn-unlock').innerHTML = "<span>🛡️ <strong>PIN festlegen & Verschlüsseln</strong></span>";
  } else {
    firstTimeHint.style.display = 'none';
    document.getElementById('lock-instructions').textContent = "Deine Finanzdaten sind auf diesem Gerät mit 256-Bit AES verschlüsselt. Gib deine PIN oder dein Passwort ein.";
    document.getElementById('btn-unlock').innerHTML = "<span>🔓 <strong>Entschlüsseln & Öffnen</strong> (Enter)</span>";
  }

  lockScreen.style.display = 'flex';
  appWrapper.style.display = 'none';
  pinInput.value = '';
  setTimeout(() => pinInput.focus(), 100);
}

async function handlePinSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('pin-input');
  const pinVal = input.value.trim();
  const verifier = localStorage.getItem(PIN_VERIFIER_KEY);

  if (!pinVal) {
    showPinError("Bitte gib eine PIN oder ein Passwort ein.");
    return;
  }

  try {
    const key = await deriveKeyFromPin(pinVal);

    if (!verifier) {
      const testEncrypted = await encryptData("VERIFIED_OK", key);
      localStorage.setItem(PIN_VERIFIER_KEY, testEncrypted);
      currentSessionKey = key;
      await saveEncryptedData();
      unlockApp("PIN eingerichtet. Deine Finanzdaten sind 256-Bit AES verschlüsselt.");
    } else {
      try {
        const decryptedVerifier = await decryptData(verifier, key);
        if (decryptedVerifier === "VERIFIED_OK") {
          currentSessionKey = key;
          await loadEncryptedData();
          unlockApp("Erfolgreich entschlüsselt. Willkommen in deinem Haushaltsbuch!");
        } else {
          throw new Error("Invalid");
        }
      } catch (err) {
        showPinError("Falsche PIN oder Passwort! Entschlüsselung verweigert.");
        input.value = '';
        input.focus();
      }
    }
  } catch (cryptoErr) {
    showPinError("Sicherheitsfehler bei der Schlüsselberechnung.");
  }
}

function showPinError(msg) {
  const errorBox = document.getElementById('pin-error-msg');
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  announceNVDA(msg, true);
}

function unlockApp(announcement = "") {
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('app-wrapper').style.display = 'block';
  document.getElementById('pin-error-msg').style.display = 'none';

  updateTodayDateDisplay();
  initMonthPickerDropdown();
  setDayToToday();
  updateOverview();
  resetInactivityTimer();

  document.getElementById('tab-overview').focus();
  if (announcement) announceNVDA(announcement);
}

function lockApp() {
  currentSessionKey = null;
  document.getElementById('lock-screen').style.display = 'flex';
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-input').focus();
  announceNVDA("App gesperrt. Alle Daten wurden sicher verschlüsselt.", true);
}

function resetInactivityTimer() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = setTimeout(() => {
    if (currentSessionKey) {
      lockApp();
    }
  }, 5 * 60 * 1000);
}

['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, () => resetInactivityTimer(), { passive: true });
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && currentSessionKey) {
    lockApp();
  }
});

async function handleChangePin(e) {
  e.preventDefault();
  const oldPin = document.getElementById('change-old-pin').value.trim();
  const newPin = document.getElementById('change-new-pin').value.trim();
  const verifier = localStorage.getItem(PIN_VERIFIER_KEY);

  if (!newPin || newPin.length < 2) {
    alert("Die neue PIN muss mindestens 2 Zeichen lang sein.");
    return;
  }

  try {
    const oldKey = await deriveKeyFromPin(oldPin);
    const decryptedVerifier = await decryptData(verifier, oldKey);
    if (decryptedVerifier !== "VERIFIED_OK") {
      alert("Die aktuelle PIN ist falsch!");
      return;
    }

    const newKey = await deriveKeyFromPin(newPin);
    const newVerifier = await encryptData("VERIFIED_OK", newKey);
    localStorage.setItem(PIN_VERIFIER_KEY, newVerifier);

    currentSessionKey = newKey;
    await saveEncryptedData();

    document.getElementById('form-change-pin').reset();
    alert("PIN erfolgreich geändert!");
    announceNVDA("Neue PIN gespeichert.");
  } catch (err) {
    alert("Fehler: Aktuelle PIN ist falsch!");
  }
}

function updateTodayDateDisplay() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const str = now.toLocaleDateString('de-DE', options);
  const el = document.getElementById('today-date-text');
  if (el) el.textContent = str;
}

// --------------------------------------------------------------------------
// 4. ANSICHTS-MODUS (MONATS-ANSICHT VS. TAGES-ANSICHT)
// --------------------------------------------------------------------------
function setOverviewMode(mode) {
  currentOverviewMode = mode;
  const btnMonth = document.getElementById('mode-btn-month');
  const btnDay = document.getElementById('mode-btn-day');
  const monthBar = document.getElementById('month-picker-bar');
  const dayBar = document.getElementById('day-picker-bar');

  if (mode === 'month') {
    btnMonth.classList.add('active');
    btnMonth.setAttribute('aria-checked', 'true');
    btnDay.classList.remove('active');
    btnDay.setAttribute('aria-checked', 'false');
    monthBar.style.display = 'block';
    dayBar.style.display = 'none';
    announceNVDA(`Monats-Ansicht für ${MONTH_NAMES[selectedMonth]} ${selectedYear} aktiviert.`);
  } else {
    btnDay.classList.add('active');
    btnDay.setAttribute('aria-checked', 'true');
    btnMonth.classList.remove('active');
    btnMonth.setAttribute('aria-checked', 'false');
    dayBar.style.display = 'block';
    monthBar.style.display = 'none';
    announceNVDA(`Tages-Ansicht für ${formatDateDisplay(selectedDateStr)} aktiviert.`);
  }

  updateOverview();
}

function initMonthPickerDropdown() {
  const select = document.getElementById('global-month-select');
  if (!select) return;

  select.innerHTML = '';
  for (let year = 2025; year <= 2027; year++) {
    MONTH_NAMES.forEach((mName, mIdx) => {
      const val = `${year}-${mIdx}`;
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = `${mName} ${year}`;
      if (year === selectedYear && mIdx === selectedMonth) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }
}

function handleMonthChange(val) {
  const parts = val.split('-');
  selectedYear = parseInt(parts[0], 10);
  selectedMonth = parseInt(parts[1], 10);
  updateOverview();
  announceNVDA(`Monat gewechselt zu ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function changeMonthRelative(offset) {
  selectedMonth += offset;
  if (selectedMonth > 11) {
    selectedMonth = 0;
    selectedYear++;
  } else if (selectedMonth < 0) {
    selectedMonth = 11;
    selectedYear--;
  }

  const select = document.getElementById('global-month-select');
  if (select) {
    select.value = `${selectedYear}-${selectedMonth}`;
  }

  updateOverview();
  announceNVDA(`Monat gewechselt zu ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function setMonthToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth();

  const select = document.getElementById('global-month-select');
  if (select) {
    select.value = `${selectedYear}-${selectedMonth}`;
  }

  updateOverview();
  announceNVDA(`Zurück zum aktuellen Monat: ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

// TAGES-WÄHLER LOGIK
function handleDayChange(val) {
  if (!val) return;
  selectedDateStr = val;
  const d = new Date(val + 'T00:00:00');
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth();

  const select = document.getElementById('global-month-select');
  if (select) select.value = `${selectedYear}-${selectedMonth}`;

  updateOverview();
  announceNVDA(`Tag ausgewählt: ${formatDateDisplay(selectedDateStr)}.`);
}

function changeDayRelative(offset) {
  const d = new Date(selectedDateStr + 'T00:00:00');
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  selectedDateStr = `${y}-${m}-${day}`;
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth();

  const dayInput = document.getElementById('global-day-select');
  if (dayInput) dayInput.value = selectedDateStr;

  const monthSelect = document.getElementById('global-month-select');
  if (monthSelect) monthSelect.value = `${selectedYear}-${selectedMonth}`;

  updateOverview();
  announceNVDA(`Tag gewechselt zu ${formatDateDisplay(selectedDateStr)}.`);
}

function setDayToToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  selectedDateStr = `${y}-${m}-${d}`;
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth();

  const dayInput = document.getElementById('global-day-select');
  if (dayInput) dayInput.value = selectedDateStr;

  const monthSelect = document.getElementById('global-month-select');
  if (monthSelect) monthSelect.value = `${selectedYear}-${selectedMonth}`;

  updateOverview();
  announceNVDA(`Zum heutigen Tag gewechselt: ${formatDateDisplay(selectedDateStr)}.`);
}

// --------------------------------------------------------------------------
// 5. DAUERAUFTRÄGE & DATUMSSTATUS
// --------------------------------------------------------------------------
function isRecurringDueInMonth(rec, year, month) {
  if (!rec.active && rec.active !== undefined) return false;

  const startY = rec.startYear !== undefined ? rec.startYear : (rec.created ? new Date(rec.created).getFullYear() : 2026);
  const startM = rec.startMonth !== undefined ? rec.startMonth : (rec.created ? new Date(rec.created).getMonth() : 8);

  if (year < startY || (year === startY && month < startM)) {
    return false;
  }

  if (rec.interval === 'monthly') {
    return true;
  } else if (rec.interval === 'yearly') {
    return parseInt(rec.yearlyMonth, 10) === month;
  } else if (rec.interval === 'quarterly') {
    const startMOffset = parseInt(rec.yearlyMonth || startM, 10) % 3;
    return (month % 3) === startMOffset;
  }
  return true;
}

function getRecurringTransactionsForMonth(year, month) {
  const list = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  appState.recurring.forEach(rec => {
    if (isRecurringDueInMonth(rec, year, month)) {
      const day = Math.min(parseInt(rec.day || 1, 10), daysInMonth);
      const dayFormatted = String(day).padStart(2, '0');
      const mFormatted = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${mFormatted}-${dayFormatted}`;

      if (rec.type === 'transfer') {
        list.push({
          id: 'rec_trf_' + rec.id + '_' + year + '_' + month,
          isRecurringInstance: true,
          recurringId: rec.id,
          name: rec.name || rec.description,
          type: 'transfer',
          fromAccount: rec.fromAccount,
          toAccount: rec.toAccount,
          amount: Number(rec.amount),
          category: `🔁 Regelmäßiges Sparen (${formatAccountName(rec.fromAccount)} ➔ ${formatAccountName(rec.toAccount)})`,
          description: `🔁 Sparplan: ${rec.name || rec.description || 'Sparen'}`,
          date: dateStr,
          costType: 'transfer',
          timestamp: new Date(year, month, day).toISOString()
        });
      } else {
        list.push({
          id: 'rec_' + rec.id + '_' + year + '_' + month,
          isRecurringInstance: true,
          recurringId: rec.id,
          name: rec.name || rec.description,
          type: rec.type,
          account: rec.account,
          amount: Number(rec.amount),
          category: rec.category,
          description: `🔁 Dauerauftrag: ${rec.name || rec.description || rec.category} (${rec.interval === 'monthly' ? 'Monatlich' : 'Jährlich'})`,
          date: dateStr,
          costType: 'fixed',
          timestamp: new Date(year, month, day).toISOString()
        });
      }
    }
  });

  return list;
}

function getBookingDateStatus(item) {
  if (item.isPlanned) {
    return { isFuture: true, label: '🎯 Geplanter Kauf / Vorhaben (Nicht fest)', badgeClass: 'status-planned' };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (item.date > todayStr) {
    return { isFuture: true, label: '⏳ Steht noch aus (Zukunft)', badgeClass: 'status-future' };
  } else {
    return { isFuture: false, label: '✅ Bereits gebucht', badgeClass: 'status-booked' };
  }
}

// --------------------------------------------------------------------------
// 6. BERECHNUNGEN: MONAT & TAG
// --------------------------------------------------------------------------
function calculateMonthStats(year, month) {
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let fixedExpense = 0;
  let variableExpense = 0;
  let plannedExpense = 0;
  const incomeList = [];
  const expenseList = [];

  appState.transactions.forEach(tx => {
    const d = new Date(tx.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (tx.type === 'income') {
        income += tx.amount;
        incomeCount++;
        incomeList.push(tx);
      } else if (tx.type === 'expense') {
        expense += tx.amount;
        expenseCount++;
        if (tx.isPlanned) plannedExpense += tx.amount;
        else if (tx.costType === 'fixed') fixedExpense += tx.amount;
        else variableExpense += tx.amount;
        expenseList.push(tx);
      }
    }
  });

  const recTxList = getRecurringTransactionsForMonth(year, month);
  recTxList.forEach(rtx => {
    if (rtx.type === 'income') {
      income += rtx.amount;
      incomeCount++;
      incomeList.push(rtx);
    } else if (rtx.type === 'expense') {
      expense += rtx.amount;
      expenseCount++;
      fixedExpense += rtx.amount;
      expenseList.push(rtx);
    }
  });

  incomeList.sort((a, b) => new Date(b.date) - new Date(a.date));
  expenseList.sort((a, b) => new Date(b.date) - new Date(a.date));

  const leftover = income - expense;
  return {
    income,
    expense,
    leftover,
    incomeCount,
    expenseCount,
    fixedExpense,
    variableExpense,
    plannedExpense,
    incomeList,
    expenseList
  };
}

function calculateDayStats(dateStr) {
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  const incomeList = [];
  const expenseList = [];

  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();

  appState.transactions.forEach(tx => {
    if (tx.date === dateStr) {
      if (tx.type === 'income') {
        income += tx.amount;
        incomeCount++;
        incomeList.push(tx);
      } else if (tx.type === 'expense') {
        expense += tx.amount;
        expenseCount++;
        expenseList.push(tx);
      }
    }
  });

  const recTxList = getRecurringTransactionsForMonth(year, month);
  recTxList.forEach(rtx => {
    if (rtx.date === dateStr) {
      if (rtx.type === 'income') {
        income += rtx.amount;
        incomeCount++;
        incomeList.push(rtx);
      } else if (rtx.type === 'expense') {
        expense += rtx.amount;
        expenseCount++;
        expenseList.push(rtx);
      }
    }
  });

  const leftover = income - expense;
  return {
    dateStr,
    income,
    expense,
    leftover,
    incomeCount,
    expenseCount,
    incomeList,
    expenseList
  };
}


// --------------------------------------------------------------------------
// 6. BERECHNUNGEN: MONAT, TAG & TAGESGENAUE KONTOSTÄNDE
// --------------------------------------------------------------------------
function calculateBalancesUpToDate(targetDateStr) {
  const balances = {
    bank: Number(appState.initialBalances.bank || 0),
    paypal: Number(appState.initialBalances.paypal || 0),
    savings: Number(appState.initialBalances.savings || 0),
    cash: Number(appState.initialBalances.cash || 0)
  };

  const targetDate = new Date(targetDateStr + 'T23:59:59');
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  // 1. Alle regulären Buchungen bis zu diesem Datum
  appState.transactions.forEach(tx => {
    if (tx.date <= targetDateStr) {
      const amount = Number(tx.amount);
      if (tx.type === 'income') {
        if (balances[tx.account] !== undefined) balances[tx.account] += amount;
      } else if (tx.type === 'expense') {
        if (balances[tx.account] !== undefined) balances[tx.account] -= amount;
      } else if (tx.type === 'transfer') {
        if (balances[tx.fromAccount] !== undefined) balances[tx.fromAccount] -= amount;
        if (balances[tx.toAccount] !== undefined) balances[tx.toAccount] += amount;
      }
    }
  });

  // 2. Alle wiederkehrenden Daueraufträge & Sparpläne bis zu diesem Tag
  const startY = 2025;
  for (let y = startY; y <= targetYear; y++) {
    const endM = (y === targetYear) ? targetMonth : 11;
    for (let m = 0; m <= endM; m++) {
      const recTxList = getRecurringTransactionsForMonth(y, m);
      recTxList.forEach(rtx => {
        if (rtx.date <= targetDateStr) {
          const amount = Number(rtx.amount);
          if (rtx.type === 'income') {
            if (balances[rtx.account] !== undefined) balances[rtx.account] += amount;
          } else if (rtx.type === 'expense') {
            if (balances[rtx.account] !== undefined) balances[rtx.account] -= amount;
          } else if (rtx.type === 'transfer') {
            if (balances[rtx.fromAccount] !== undefined) balances[rtx.fromAccount] -= amount;
            if (balances[rtx.toAccount] !== undefined) balances[rtx.toAccount] += amount;
          }
        }
      });
    }
  }

  const total = balances.bank + balances.paypal + balances.savings + balances.cash;
  return { ...balances, total };
}

function calculateAllTimeBalances() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  return calculateBalancesUpToDate(todayStr);
}

function calculateDayAccountChanges(dateStr) {
  const changes = { bank: 0, paypal: 0, savings: 0, cash: 0 };
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();

  appState.transactions.forEach(tx => {
    if (tx.date === dateStr) {
      const amount = Number(tx.amount);
      if (tx.type === 'income') {
        if (changes[tx.account] !== undefined) changes[tx.account] += amount;
      } else if (tx.type === 'expense') {
        if (changes[tx.account] !== undefined) changes[tx.account] -= amount;
      } else if (tx.type === 'transfer') {
        if (changes[tx.fromAccount] !== undefined) changes[tx.fromAccount] -= amount;
        if (changes[tx.toAccount] !== undefined) changes[tx.toAccount] += amount;
      }
    }
  });

  const recTxList = getRecurringTransactionsForMonth(year, month);
  recTxList.forEach(rtx => {
    if (rtx.date === dateStr) {
      const amount = Number(rtx.amount);
      if (rtx.type === 'income') {
        if (changes[rtx.account] !== undefined) changes[rtx.account] += amount;
      } else if (rtx.type === 'expense') {
        if (changes[rtx.account] !== undefined) changes[rtx.account] -= amount;
      } else if (rtx.type === 'transfer') {
        if (changes[rtx.fromAccount] !== undefined) changes[rtx.fromAccount] -= amount;
        if (changes[rtx.toAccount] !== undefined) changes[rtx.toAccount] += amount;
      }
    }
  });

  return changes;
}


function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatAccountName(accKey) {
  switch (accKey) {
    case 'bank': return '🏦 Bankkonto';
    case 'paypal': return '🅿️ PayPal';
    case 'savings': return '📈 Tagesgeld';
    case 'cash': return '💵 Bargeld';
    default: return accKey;
  }
}

// --------------------------------------------------------------------------
// 7. UI AKTUALISIERUNG (ÜBERSICHT: MONAT ODER TAG)
// --------------------------------------------------------------------------

function updateOverview() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (currentOverviewMode === 'day') {
    // TAGES-ANSICHT
    const dayStats = calculateDayStats(selectedDateStr);
    const dayFormatted = formatDateDisplay(selectedDateStr);
    const dayDateObj = new Date(selectedDateStr + 'T00:00:00');
    const dayName = dayDateObj.toLocaleDateString('de-DE', { weekday: 'long' });

    // TAGESGENAUE KONTOSTÄNDE AM ENDE DIESES TAGES!
    const balances = calculateBalancesUpToDate(selectedDateStr);
    const dayChanges = calculateDayAccountChanges(selectedDateStr);

    document.getElementById('overview-month-title').textContent = `Tagesübersicht für ${dayName}, ${dayFormatted}`;
    document.getElementById('overview-banner-subtitle').textContent = `Hier siehst du den genauen Kontostand am Ende des Tages (${dayFormatted}) und alle Buchungen an diesem Tag.`;
    document.getElementById('section-accounts-heading').textContent = `1. 💳 Deine Kontostände am ${dayFormatted} (Tagesende)`;

    // 1. Kontostände am Stichtag
    document.getElementById('acc-balance-bank').textContent = formatCurrency(balances.bank);
    document.getElementById('acc-balance-paypal').textContent = formatCurrency(balances.paypal);
    document.getElementById('acc-balance-savings').textContent = formatCurrency(balances.savings);
    document.getElementById('acc-balance-cash').textContent = formatCurrency(balances.cash);

    // Tagesveränderung je Konto
    const formatChange = (val) => {
      if (val > 0) return `📈 An diesem Tag: +${formatCurrency(val)}`;
      if (val < 0) return `📉 An diesem Tag: -${formatCurrency(Math.abs(val))}`;
      return `Keine Buchung an diesem Tag`;
    };
    const hintBank = document.querySelector('#acc-balance-bank + .acc-hint');
    const hintPaypal = document.querySelector('#acc-balance-paypal + .acc-hint');
    const hintSavings = document.querySelector('#acc-balance-savings + .acc-hint');
    const hintCash = document.querySelector('#acc-balance-cash + .acc-hint');
    if (hintBank) hintBank.textContent = formatChange(dayChanges.bank);
    if (hintPaypal) hintPaypal.textContent = formatChange(dayChanges.paypal);
    if (hintSavings) hintSavings.textContent = formatChange(dayChanges.savings);
    if (hintCash) hintCash.textContent = formatChange(dayChanges.cash);

    // 2. Einnahmen Tag
    document.getElementById('card-month-income').textContent = `+ ${formatCurrency(dayStats.income)}`;
    document.getElementById('income-summary-subtext').textContent = `${dayStats.incomeCount} Einnahmen am ${dayFormatted}`;
    document.getElementById('details-income-summary-text').textContent = `Alle Einnahmen vom ${dayFormatted} anzeigen`;
    renderDetailedIncomeList(dayStats.incomeList);

    // 3. Ausgaben Tag
    document.getElementById('card-month-expense').textContent = `- ${formatCurrency(dayStats.expense)}`;
    document.getElementById('expense-summary-subtext').textContent = `${dayStats.expenseCount} Ausgaben am ${dayFormatted}`;
    document.getElementById('details-expense-summary-text').textContent = `Alle Ausgaben vom ${dayFormatted} anzeigen`;
    renderDetailedExpenseList(dayStats.expenseList);

    // 4. Saldo für diesen Tag & Gesamtsaldo am Tag
    document.getElementById('card-alltime-total').textContent = formatCurrency(balances.total);
    document.getElementById('total-balance-sub').textContent = `Verfügbares Gesamtguthaben am Ende des Tages (${dayFormatted})`;

    const leftEl = document.getElementById('month-leftover-display');
    const leftSub = document.getElementById('month-leftover-sub');
    const leftMainLabel = document.getElementById('leftover-main-label');
    leftMainLabel.textContent = `Tages-Ergebnis (${dayFormatted}):`;
    leftEl.textContent = formatCurrency(dayStats.leftover);

    if (dayStats.leftover > 0) {
      leftEl.style.color = 'var(--accent-income)';
      leftSub.textContent = `🟢 Tages-Plus: Am ${dayFormatted} hast du ${formatCurrency(dayStats.leftover)} mehr eingenommen als ausgegeben.`;
    } else if (dayStats.leftover < 0) {
      leftEl.style.color = 'var(--accent-expense)';
      leftSub.textContent = `🔴 Tages-Ausgabe: Am ${dayFormatted} hast du ${formatCurrency(Math.abs(dayStats.leftover))} ausgegeben.`;
    } else {
      leftEl.style.color = 'var(--text-primary)';
      leftSub.textContent = `Ausgeglichen: Keine Einnahmen oder Ausgaben am ${dayFormatted}.`;
    }
  } else {
    // MONATS-ANSICHT
    const stats = calculateMonthStats(selectedYear, selectedMonth);
    const currentMonthTitle = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endOfMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // KONTOSTÄNDE AM ENDE DIESES MONATS
    const balances = calculateBalancesUpToDate(endOfMonthStr);

    document.getElementById('overview-month-title').textContent = `Monatsübersicht für ${currentMonthTitle}`;
    document.getElementById('overview-banner-subtitle').textContent = `Hier siehst du deine Konten, Einnahmen, Ausgaben und dein Gesamtergebnis für den gesamten Monat.`;
    document.getElementById('section-accounts-heading').textContent = `1. 💳 Deine Kontostände (Stand: Ende ${currentMonthTitle})`;

    // 1. Kontostände
    document.getElementById('acc-balance-bank').textContent = formatCurrency(balances.bank);
    document.getElementById('acc-balance-paypal').textContent = formatCurrency(balances.paypal);
    document.getElementById('acc-balance-savings').textContent = formatCurrency(balances.savings);
    document.getElementById('acc-balance-cash').textContent = formatCurrency(balances.cash);

    const hintBank = document.querySelector('#acc-balance-bank + .acc-hint');
    const hintPaypal = document.querySelector('#acc-balance-paypal + .acc-hint');
    const hintSavings = document.querySelector('#acc-balance-savings + .acc-hint');
    const hintCash = document.querySelector('#acc-balance-cash + .acc-hint');
    if (hintBank) hintBank.textContent = "Miete, EC-Karte, Daueraufträge";
    if (hintPaypal) hintPaypal.textContent = "Online-Shopping, Freunde, Spotify";
    if (hintSavings) hintSavings.textContent = "Notgroschen, Führerschein, Urlaub";
    if (hintCash) hintCash.textContent = "Bäcker, Döner, Barbezahlung";

    // 2. Einnahmen Monat
    document.getElementById('card-month-income').textContent = `+ ${formatCurrency(stats.income)}`;
    document.getElementById('income-summary-subtext').textContent = `${stats.incomeCount} Einnahmen im ${MONTH_NAMES[selectedMonth]}`;
    document.getElementById('details-income-summary-text').textContent = `Alle Einnahmen dieses Monats anzeigen (mit Datum & Status)`;
    renderDetailedIncomeList(stats.incomeList);

    // 3. Ausgaben Monat
    document.getElementById('card-month-expense').textContent = `- ${formatCurrency(stats.expense)}`;
    let expNote = `Fixkosten: ${formatCurrency(stats.fixedExpense)}`;
    if (stats.plannedExpense > 0) expNote += ` | 🎯 Geplant: ${formatCurrency(stats.plannedExpense)}`;
    document.getElementById('expense-summary-subtext').textContent = `${stats.expenseCount} Ausgaben (${expNote})`;
    document.getElementById('details-expense-summary-text').textContent = `Alle Ausgaben dieses Monats anzeigen (mit Datum, Kategorie & Status)`;
    renderDetailedExpenseList(stats.expenseList);

    // 4. Gesamt über alle Konten & Monats-Saldo
    document.getElementById('card-alltime-total').textContent = formatCurrency(balances.total);
    document.getElementById('total-balance-sub').textContent = `Verfügbares Gesamtguthaben am Ende von ${currentMonthTitle}`;

    const leftEl = document.getElementById('month-leftover-display');
    const leftSub = document.getElementById('month-leftover-sub');
    const leftMainLabel = document.getElementById('leftover-main-label');
    leftMainLabel.textContent = `Monats-Saldo (In diesem Monat noch übrig):`;
    leftEl.textContent = formatCurrency(stats.leftover);

    if (stats.leftover > 0) {
      leftEl.style.color = 'var(--accent-income)';
      leftSub.textContent = `🟢 Monats-Plus: Du hast ${formatCurrency(stats.leftover)} mehr eingenommen als ausgegeben.`;
    } else if (stats.leftover < 0) {
      leftEl.style.color = 'var(--accent-expense)';
      leftSub.textContent = `⚠️ Monats-Minus: Du hast ${formatCurrency(Math.abs(stats.leftover))} mehr ausgegeben als eingenommen.`;
    } else {
      leftEl.style.color = 'var(--text-primary)';
      leftSub.textContent = `Ausgeglichen: Einnahmen und Ausgaben sind im ${MONTH_NAMES[selectedMonth]} gleich hoch.`;
    }
  }

  // Simulator & Settings
  runPurchaseSimulation();
  renderSettingsRecurringList();
  renderAnnualTable(document.getElementById('year-view-select') ? document.getElementById('year-view-select').value : selectedYear);
  renderFutureForecast(document.getElementById('forecast-range-select') ? document.getElementById('forecast-range-select').value : 6);
}


// KAUF-SIMULATOR LOGIK
function runPurchaseSimulation() {
  const priceInput = document.getElementById('sim-item-price');
  const nameInput = document.getElementById('sim-item-name');
  const resultBox = document.getElementById('sim-result-box');
  const saveAction = document.getElementById('sim-save-action');

  if (!priceInput || !resultBox) return;

  const price = parseFloat(priceInput.value);
  const itemName = (nameInput && nameInput.value.trim()) || "Dein geplanter Kauf";

  if (isNaN(price) || price <= 0) {
    resultBox.innerHTML = `<p>💡 <em>Gib oben einen Betrag ein, um zu sehen, was nach dem Kauf von deinem Monatsgeld noch übrig bleibt.</em></p>`;
    if (saveAction) saveAction.style.display = 'none';
    return;
  }

  const stats = calculateMonthStats(selectedYear, selectedMonth);
  const currentLeftover = stats.leftover;
  const simulatedLeftover = currentLeftover - price;

  let msg = '';
  let color = 'var(--accent-income)';

  if (simulatedLeftover >= 0) {
    color = 'var(--accent-income)';
    msg = `
      <div style="color: ${color};">
        <p>✅ <strong>Grünes Licht – Kauf ist sicher möglich!</strong></p>
        <p>Wenn du <strong>${escapeHtml(itemName)}</strong> für <strong>${formatCurrency(price)}</strong> kaufst, hast du im ${MONTH_NAMES[selectedMonth]} immer noch <strong>${formatCurrency(simulatedLeftover)}</strong> übrig.</p>
      </div>
    `;
  } else {
    color = 'var(--accent-expense)';
    msg = `
      <div style="color: ${color};">
        <p>⚠️ <strong>Achtung – Defizitgefahr!</strong></p>
        <p>Wenn du <strong>${escapeHtml(itemName)}</strong> für <strong>${formatCurrency(price)}</strong> kaufst, wärst du in diesem Monat mit <strong>- ${formatCurrency(Math.abs(simulatedLeftover))}</strong> im Minus!</p>
      </div>
    `;
  }

  resultBox.innerHTML = msg;
  if (saveAction) saveAction.style.display = 'block';
}

async function saveSimulatedPurchase() {
  const price = parseFloat(document.getElementById('sim-item-price').value);
  const itemName = document.getElementById('sim-item-name').value.trim() || "Geplante Anschaffung";

  if (isNaN(price) || price <= 0) return;

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const tx = {
    id: Date.now().toString(),
    type: 'expense',
    account: 'bank',
    amount: price,
    category: 'Shopping & Kleidung',
    description: `🎯 Geplanter Kauf: ${itemName}`,
    date: dateStr,
    isPlanned: true,
    timestamp: new Date().toISOString()
  };

  appState.transactions.unshift(tx);
  await saveEncryptedData();

  document.getElementById('sim-item-price').value = '';
  document.getElementById('sim-item-name').value = '';
  runPurchaseSimulation();

  announceNVDA(`Geplanter Kauf "${itemName}" über ${formatCurrency(price)} gespeichert.`);
}

function renderDetailedIncomeList(incomeList) {
  const container = document.getElementById('overview-income-items-feed');
  if (!container) return;

  if (incomeList.length === 0) {
    container.innerHTML = `<p class="empty-state">Keine Einnahmen für diesen Zeitraum vorhanden.</p>`;
    return;
  }

  let html = '<ul class="tx-list">';
  incomeList.forEach(item => {
    const status = getBookingDateStatus(item);
    const dateFormatted = formatDateDisplay(item.date);
    const icon = item.isRecurringInstance ? '🔁' : (item.isPlanned ? '🎯' : '📥');
    const srText = `Einnahme am ${dateFormatted}: ${formatCurrency(item.amount)} von ${item.category} auf ${formatAccountName(item.account)}. Status: ${status.label}`;

    html += `
      <li class="tx-item" tabindex="0" aria-label="${srText}">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">${icon}</span>
          <div class="tx-details">
            <span class="tx-cat-name">${escapeHtml(item.name || item.description || item.category)}</span>
            <span class="tx-account-badge">📅 Datum: <strong>${dateFormatted}</strong> | Auf: ${formatAccountName(item.account)}</span>
            <span class="status-badge ${status.badgeClass}">${status.label}</span>
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum income">+ ${formatCurrency(item.amount)}</span>
          ${!item.isRecurringInstance ? `
            <button class="btn-delete-tx" onclick="deleteTransaction('${item.id}')" aria-label="Einnahme löschen">🗑️</button>
          ` : ''}
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

function renderDetailedExpenseList(expenseList) {
  const container = document.getElementById('overview-expense-items-feed');
  if (!container) return;

  if (expenseList.length === 0) {
    container.innerHTML = `<p class="empty-state">Keine Ausgaben für diesen Zeitraum vorhanden.</p>`;
    return;
  }

  let html = '<ul class="tx-list">';
  expenseList.forEach(item => {
    const status = getBookingDateStatus(item);
    const dateFormatted = formatDateDisplay(item.date);
    const icon = item.isRecurringInstance ? '🔁' : (item.isPlanned ? '🎯' : '🔴');
    const srText = `Ausgabe am ${dateFormatted}: ${formatCurrency(item.amount)} für ${item.category} über ${formatAccountName(item.account)}. Status: ${status.label}`;

    html += `
      <li class="tx-item" tabindex="0" aria-label="${srText}">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">${icon}</span>
          <div class="tx-details">
            <span class="tx-cat-name">${escapeHtml(item.name || item.description || item.category)}</span>
            <span class="tx-account-badge">📅 Datum: <strong>${dateFormatted}</strong> | Von: ${formatAccountName(item.account)}</span>
            <span class="status-badge ${status.badgeClass}">${status.label}</span>
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum expense">- ${formatCurrency(item.amount)}</span>
          ${!item.isRecurringInstance ? `
            <button class="btn-delete-tx" onclick="deleteTransaction('${item.id}')" aria-label="Ausgabe löschen">🗑️</button>
          ` : ''}
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

// --------------------------------------------------------------------------
// 8. ZUKUNFTS-VORSCHAU & PROGNOSE
// --------------------------------------------------------------------------
function renderFutureForecast(monthsAheadStr) {
  const monthsAhead = parseInt(monthsAheadStr, 10) || 6;
  const tbody = document.getElementById('forecast-table-body');
  if (!tbody) return;

  const now = new Date();
  let simYear = now.getFullYear();
  let simMonth = now.getMonth();

  let runningBalance = calculateAllTimeBalances().total;
  let html = '';

  for (let i = 0; i < monthsAhead; i++) {
    const stats = calculateMonthStats(simYear, simMonth);
    const mName = MONTH_NAMES[simMonth];
    const isCurrent = (i === 0);

    runningBalance += stats.leftover;

    html += `
      <tr>
        <td><strong>${mName} ${simYear}</strong> ${isCurrent ? '<em>(Aktueller Monat)</em>' : ''}</td>
        <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(stats.income)}</td>
        <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(stats.expense)}</td>
        <td class="text-right" style="font-weight: 800; color: ${stats.leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
          ${formatCurrency(stats.leftover)}
        </td>
        <td class="text-right" style="font-weight: 900; color: ${runningBalance >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
          ${formatCurrency(runningBalance)}
        </td>
      </tr>
    `;

    simMonth++;
    if (simMonth > 11) {
      simMonth = 0;
      simYear++;
    }
  }

  tbody.innerHTML = html;
}

// --------------------------------------------------------------------------
// 9. FORMULAR-FELDER TOGGLEN
// --------------------------------------------------------------------------
function toggleExpenseFrequencyFields() {
  const freq = document.getElementById('exp-frequency').value;
  const dateGroup = document.getElementById('exp-date-group');
  const recDetails = document.getElementById('exp-recurring-details');
  const yearlyGroup = document.getElementById('exp-yearly-month-group');

  if (freq === 'once' || freq === 'planned') {
    dateGroup.style.display = 'block';
    recDetails.style.display = 'none';
  } else {
    dateGroup.style.display = 'none';
    recDetails.style.display = 'block';
    yearlyGroup.style.display = freq === 'yearly' ? 'block' : 'none';
  }
}

function toggleIncomeFrequencyFields() {
  const freq = document.getElementById('inc-frequency').value;
  const dateGroup = document.getElementById('inc-date-group');
  const recDetails = document.getElementById('inc-recurring-details');

  if (freq === 'once' || freq === 'planned') {
    dateGroup.style.display = 'block';
    recDetails.style.display = 'none';
  } else {
    dateGroup.style.display = 'none';
    recDetails.style.display = 'block';
  }
}

function toggleTransferFrequencyFields() {
  const freq = document.getElementById('trf-frequency').value;
  const dateGroup = document.getElementById('trf-date-group');
  const recDetails = document.getElementById('trf-recurring-details');

  if (freq === 'once') {
    dateGroup.style.display = 'block';
    recDetails.style.display = 'none';
  } else {
    dateGroup.style.display = 'none';
    recDetails.style.display = 'block';
  }
}

// --------------------------------------------------------------------------
// 10. FORMULAR-HANDLER: AUSGABEN, EINNAHMEN, UMBUCHUNGEN
// --------------------------------------------------------------------------
async function handleAddExpense(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const freq = document.getElementById('exp-frequency').value;
  const account = document.getElementById('exp-account').value;
  const category = document.getElementById('exp-category').value;
  const desc = document.getElementById('exp-desc').value.trim();

  if (isNaN(amount) || amount <= 0) {
    alert("Bitte gib einen Betrag größer als 0 Euro ein.");
    document.getElementById('exp-amount').focus();
    return;
  }

  if (freq === 'once' || freq === 'planned') {
    const date = document.getElementById('exp-date').value;
    const isPlanned = (freq === 'planned');
    const tx = {
      id: Date.now().toString(),
      type: 'expense',
      account: account,
      amount: amount,
      category: category,
      description: desc,
      date: date,
      isPlanned: isPlanned,
      timestamp: new Date().toISOString()
    };
    appState.transactions.unshift(tx);
    await saveEncryptedData();

    selectedDateStr = date;
    const txDate = new Date(date + 'T00:00:00');
    selectedYear = txDate.getFullYear();
    selectedMonth = txDate.getMonth();
    const select = document.getElementById('global-month-select');
    if (select) select.value = `${selectedYear}-${selectedMonth}`;
    const dayInput = document.getElementById('global-day-select');
    if (dayInput) dayInput.value = selectedDateStr;

    const dateStatus = getBookingDateStatus(tx);
    announceNVDA(`Ausgabe von ${formatCurrency(amount)} für ${category} am ${formatDateDisplay(date)} gespeichert (${dateStatus.label}).`);
  } else {
    const day = parseInt(document.getElementById('exp-rec-day').value, 10) || 1;
    const yearlyMonth = parseInt(document.getElementById('exp-yearly-month').value, 10) || 0;

    const recItem = {
      id: Date.now().toString(),
      type: 'expense',
      name: desc || category,
      amount: amount,
      interval: freq,
      day: day,
      yearlyMonth: yearlyMonth,
      startYear: selectedYear,
      startMonth: selectedMonth,
      account: account,
      category: category,
      active: true,
      created: new Date().toISOString()
    };
    appState.recurring.push(recItem);
    await saveEncryptedData();

    announceNVDA(`Dauerhafte Ausgabe von ${formatCurrency(amount)} für ${category} gespeichert.`);
  }

  document.getElementById('form-add-expense').reset();
  toggleExpenseFrequencyFields();
  switchView('overview');
}

async function handleAddIncome(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('inc-amount').value);
  const freq = document.getElementById('inc-frequency').value;
  const account = document.getElementById('inc-account').value;
  const category = document.getElementById('inc-category').value;
  const desc = document.getElementById('inc-desc').value.trim();

  if (isNaN(amount) || amount <= 0) {
    alert("Bitte gib einen Betrag größer als 0 Euro ein.");
    document.getElementById('inc-amount').focus();
    return;
  }

  if (freq === 'once' || freq === 'planned') {
    const date = document.getElementById('inc-date').value;
    const isPlanned = (freq === 'planned');
    const tx = {
      id: Date.now().toString(),
      type: 'income',
      account: account,
      amount: amount,
      category: category,
      description: desc,
      date: date,
      isPlanned: isPlanned,
      timestamp: new Date().toISOString()
    };
    appState.transactions.unshift(tx);
    await saveEncryptedData();

    selectedDateStr = date;
    const txDate = new Date(date + 'T00:00:00');
    selectedYear = txDate.getFullYear();
    selectedMonth = txDate.getMonth();
    const select = document.getElementById('global-month-select');
    if (select) select.value = `${selectedYear}-${selectedMonth}`;
    const dayInput = document.getElementById('global-day-select');
    if (dayInput) dayInput.value = selectedDateStr;

    const dateStatus = getBookingDateStatus(tx);
    announceNVDA(`Einnahme von ${formatCurrency(amount)} am ${formatDateDisplay(date)} gespeichert (${dateStatus.label}).`);
  } else {
    const day = parseInt(document.getElementById('inc-rec-day').value, 10) || 1;

    const recItem = {
      id: Date.now().toString(),
      type: 'income',
      name: desc || category,
      amount: amount,
      interval: freq,
      day: day,
      startYear: selectedYear,
      startMonth: selectedMonth,
      account: account,
      category: category,
      active: true,
      created: new Date().toISOString()
    };
    appState.recurring.push(recItem);
    await saveEncryptedData();

    announceNVDA(`Dauerhafte Einnahme von ${formatCurrency(amount)} gespeichert.`);
  }

  document.getElementById('form-add-income').reset();
  toggleIncomeFrequencyFields();
  switchView('overview');
}

async function handleAddTransfer(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('trf-amount').value);
  const freq = document.getElementById('trf-frequency').value;
  const fromAcc = document.getElementById('trf-from').value;
  const toAcc = document.getElementById('trf-to').value;
  const desc = document.getElementById('trf-desc').value.trim();

  if (isNaN(amount) || amount <= 0) {
    alert("Bitte Betrag größer als 0 Euro eingeben.");
    return;
  }

  if (fromAcc === toAcc) {
    alert("Startkonto und Zielkonto dürfen nicht identisch sein!");
    return;
  }

  if (freq === 'once') {
    const date = document.getElementById('trf-date').value;
    const tx = {
      id: Date.now().toString(),
      type: 'transfer',
      fromAccount: fromAcc,
      toAccount: toAcc,
      amount: amount,
      category: `Umbuchung (${formatAccountName(fromAcc)} ➔ ${formatAccountName(toAcc)})`,
      description: desc,
      date: date,
      timestamp: new Date().toISOString()
    };
    appState.transactions.unshift(tx);
    await saveEncryptedData();

    selectedDateStr = date;
    const dayInput = document.getElementById('global-day-select');
    if (dayInput) dayInput.value = selectedDateStr;

    announceNVDA(`Umbuchung von ${formatCurrency(amount)} ausgeführt.`);
  } else {
    const day = parseInt(document.getElementById('trf-rec-day').value, 10) || 1;
    const recItem = {
      id: Date.now().toString(),
      type: 'transfer',
      name: desc || `Sparplan ${formatAccountName(toAcc)}`,
      fromAccount: fromAcc,
      toAccount: toAcc,
      amount: amount,
      interval: freq,
      day: day,
      startYear: selectedYear,
      startMonth: selectedMonth,
      category: `Sparen (${formatAccountName(fromAcc)} ➔ ${formatAccountName(toAcc)})`,
      active: true,
      created: new Date().toISOString()
    };
    appState.recurring.push(recItem);
    await saveEncryptedData();
    announceNVDA(`Sparplan über ${formatCurrency(amount)} gespeichert.`);
  }

  document.getElementById('form-add-transfer').reset();
  toggleTransferFrequencyFields();
  switchView('overview');
}

async function deleteTransaction(id) {
  const tx = appState.transactions.find(t => t.id === id);
  if (!tx) return;

  const desc = tx.description || tx.category;
  if (confirm(`Buchung wirklich löschen: ${formatCurrency(tx.amount)} (${desc})?`)) {
    appState.transactions = appState.transactions.filter(t => t.id !== id);
    await saveEncryptedData();
    announceNVDA(`Buchung über ${formatCurrency(tx.amount)} gelöscht.`);
  }
}

async function deleteRecurring(id) {
  const item = appState.recurring.find(r => r.id === id);
  if (!item) return;

  if (confirm(`Dauerauftrag / Sparplan wirklich löschen: "${item.name || item.description}" über ${formatCurrency(item.amount)}?`)) {
    appState.recurring = appState.recurring.filter(r => r.id !== id);
    await saveEncryptedData();
    renderSettingsRecurringList();
    announceNVDA(`Dauerauftrag gelöscht.`);
  }
}

function renderSettingsRecurringList() {
  const container = document.getElementById('settings-recurring-container');
  if (!container) return;

  if (appState.recurring.length === 0) {
    container.innerHTML = `<p class="field-hint">Aktuell sind keine dauerhaften Daueraufträge oder Sparpläne gespeichert.</p>`;
    return;
  }

  let html = '<ul class="tx-list" style="border: 2px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">';
  appState.recurring.forEach(item => {
    let sign = '-';
    let cssClass = 'expense';
    let icon = '🔴';
    let accText = '';

    if (item.type === 'expense') {
      sign = '-';
      cssClass = 'expense';
      icon = '🔴';
      accText = `Konto: ${formatAccountName(item.account)}`;
    } else if (item.type === 'income') {
      sign = '+';
      cssClass = 'income';
      icon = '🟢';
      accText = `Konto: ${formatAccountName(item.account)}`;
    } else if (item.type === 'transfer') {
      sign = '🔄';
      cssClass = 'transfer';
      icon = '🔄';
      accText = `Sparplan: Von ${formatAccountName(item.fromAccount)} ➔ ${formatAccountName(item.toAccount)}`;
    }
    
    let freqText = 'Monatlich';
    if (item.interval === 'yearly') freqText = `Einmal im Jahr (im ${MONTH_NAMES[item.yearlyMonth]})`;
    else if (item.interval === 'quarterly') freqText = 'Alle 3 Monate';

    html += `
      <li class="tx-item" tabindex="0" aria-label="${item.name || item.description}: ${freqText} ${formatCurrency(item.amount)}">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">${icon}</span>
          <div class="tx-details">
            <span class="tx-cat-name">${escapeHtml(item.name || item.description || item.category)}</span>
            <span class="tx-account-badge">${accText} | 📅 ${freqText} am ${item.day}.</span>
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum ${cssClass}">${sign} ${formatCurrency(item.amount)}</span>
          <button class="btn-delete-tx" onclick="deleteRecurring('${item.id}')" aria-label="Dauerauftrag löschen">
            🗑️ Löschen
          </button>
        </div>
      </li>
    `;
  });
  html += '</ul>';

  container.innerHTML = html;
}

// --------------------------------------------------------------------------
// 11. JAHRESÜBERSICHT
// --------------------------------------------------------------------------
function renderAnnualTable(yearStr) {
  const year = parseInt(yearStr, 10) || selectedYear;
  const tbody = document.getElementById('annual-table-body');
  const tfoot = document.getElementById('annual-table-foot');
  if (!tbody || !tfoot) return;

  let totalYearIncome = 0;
  let totalYearExpense = 0;
  let tbodyHtml = '';

  MONTH_NAMES.forEach((mName, mIdx) => {
    const stats = calculateMonthStats(year, mIdx);
    totalYearIncome += stats.income;
    totalYearExpense += stats.expense;

    const leftover = stats.leftover;
    const isCurrent = (year === selectedYear && mIdx === selectedMonth);
    const rowClass = isCurrent ? 'style="font-weight: bold; background-color: var(--bg-surface-elevated);"' : '';

    let statusText = '—';
    if (stats.income > 0 || stats.expense > 0) {
      statusText = leftover >= 0 ? '✅ Im Plus' : '⚠️ Im Minus';
    }

    tbodyHtml += `
      <tr ${rowClass}>
        <td><strong>${mName} ${year}</strong> ${isCurrent ? '(Aktiver Monat)' : ''}</td>
        <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(stats.income)}</td>
        <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(stats.expense)}</td>
        <td class="text-right" style="font-weight: 800; color: ${leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
          ${formatCurrency(leftover)}
        </td>
        <td class="text-center">${statusText}</td>
        <td class="text-center">
          <button class="btn-jump-month" onclick="jumpToMonth(${year}, ${mIdx})" aria-label="Zu ${mName} ${year} wechseln">
            👉 Anzeigen
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = tbodyHtml;

  const totalYearLeftover = totalYearIncome - totalYearExpense;
  tfoot.innerHTML = `
    <tr>
      <th>GESAMT JAHR ${year}</th>
      <th class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(totalYearIncome)}</th>
      <th class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(totalYearExpense)}</th>
      <th class="text-right" style="color: ${totalYearLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
        ${formatCurrency(totalYearLeftover)}
      </th>
      <th class="text-center">${totalYearLeftover >= 0 ? '🎉 Plus' : '⚠️ Defizit'}</th>
      <th></th>
    </tr>
  `;
}

function jumpToMonth(year, monthIdx) {
  selectedYear = year;
  selectedMonth = monthIdx;
  currentOverviewMode = 'month';
  const select = document.getElementById('global-month-select');
  if (select) select.value = `${year}-${monthIdx}`;
  setOverviewMode('month');
  switchView('overview');
  updateOverview();
  announceNVDA(`Zu ${MONTH_NAMES[monthIdx]} ${year} gewechselt.`);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function handleSetInitialBalances(e) {
  e.preventDefault();
  appState.initialBalances.bank = parseFloat(document.getElementById('init-bank').value) || 0;
  appState.initialBalances.paypal = parseFloat(document.getElementById('init-paypal').value) || 0;
  appState.initialBalances.savings = parseFloat(document.getElementById('init-savings').value) || 0;
  appState.initialBalances.cash = parseFloat(document.getElementById('init-cash').value) || 0;

  await saveEncryptedData();
  alert("Startguthaben erfolgreich gespeichert!");
  switchView('overview');
  announceNVDA("Startguthaben dauerhaft gespeichert.");
}

function resetAllAppData() {
  if (confirm("⚠️ DSGVO-LÖSCHUNG: Möchtest du wirklich ALLE Finanzdaten unwiderruflich vernichten?")) {
    if (confirm("Letzte Bestätigung: Alle Daten werden unwiderruflich gelöscht!")) {
      localStorage.clear();
      currentSessionKey = null;
      appState = {
        theme: 'theme-high-contrast',
        initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 },
        transactions: [],
        recurring: []
      };
      location.reload();
    }
  }
}

// --------------------------------------------------------------------------
// 12. VIEW-NAVIGATION
// --------------------------------------------------------------------------
const views = ['overview', 'expense', 'income', 'transfer', 'settings'];

function switchView(targetView) {
  views.forEach(v => {
    const tabBtn = document.getElementById(`tab-${v}`);
    const viewPanel = document.getElementById(`view-${v}`);

    if (v === targetView) {
      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');
      tabBtn.setAttribute('tabindex', '0');
      viewPanel.style.display = 'flex';
    } else {
      tabBtn.classList.remove('active');
      tabBtn.setAttribute('aria-selected', 'false');
      tabBtn.setAttribute('tabindex', '-1');
      viewPanel.style.display = 'none';
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const modeBar = document.getElementById('overview-mode-bar');
  const monthBar = document.getElementById('month-picker-bar');
  const dayBar = document.getElementById('day-picker-bar');

  if (targetView === 'overview') {
    if (modeBar) modeBar.style.display = 'block';
    if (currentOverviewMode === 'day') {
      if (dayBar) dayBar.style.display = 'block';
      if (monthBar) monthBar.style.display = 'none';
    } else {
      if (monthBar) monthBar.style.display = 'block';
      if (dayBar) dayBar.style.display = 'none';
    }
    updateOverview();
    announceNVDA(`Übersicht geöffnet.`);
  } else {
    if (modeBar) modeBar.style.display = 'none';
    if (monthBar) monthBar.style.display = 'none';
    if (dayBar) dayBar.style.display = 'none';
  }

  if (targetView === 'expense') {
    document.getElementById('exp-date').value = todayStr;
    toggleExpenseFrequencyFields();
    setTimeout(() => document.getElementById('exp-amount').focus(), 100);
    announceNVDA("Ausgabe eintragen geöffnet.");
  } else if (targetView === 'income') {
    document.getElementById('inc-date').value = todayStr;
    toggleIncomeFrequencyFields();
    setTimeout(() => document.getElementById('inc-amount').focus(), 100);
    announceNVDA("Einnahme eintragen geöffnet.");
  } else if (targetView === 'transfer') {
    document.getElementById('trf-date').value = todayStr;
    toggleTransferFrequencyFields();
    setTimeout(() => document.getElementById('trf-amount').focus(), 100);
    announceNVDA("Umbuchen & Sparen geöffnet.");
  } else if (targetView === 'settings') {
    document.getElementById('init-bank').value = appState.initialBalances.bank || '';
    document.getElementById('init-paypal').value = appState.initialBalances.paypal || '';
    document.getElementById('init-savings').value = appState.initialBalances.savings || '';
    document.getElementById('init-cash').value = appState.initialBalances.cash || '';
    renderSettingsRecurringList();
    renderAnnualTable(document.getElementById('year-view-select').value);
    renderFutureForecast(document.getElementById('forecast-range-select') ? document.getElementById('forecast-range-select').value : 6);
    announceNVDA("Backup & Einstellungen geöffnet.");
  }
}

// --------------------------------------------------------------------------
// 13. PERSISTENZ (AES-256)
// --------------------------------------------------------------------------
async function loadEncryptedData() {
  const cipherStr = localStorage.getItem(STORAGE_ENCRYPTED_KEY);
  if (cipherStr && currentSessionKey) {
    try {
      const plainJson = await decryptData(cipherStr, currentSessionKey);
      appState = JSON.parse(plainJson);
      if (!appState.recurring) appState.recurring = [];
    } catch (e) {
      console.error("Entschlüsselungsfehler:", e);
    }
  } else {
    appState = {
      theme: 'theme-high-contrast',
      initialBalances: { bank: 0.00, paypal: 0.00, savings: 0.00, cash: 0.00 },
      transactions: [],
      recurring: []
    };
  }
}

async function saveEncryptedData() {
  if (!currentSessionKey) return;
  const plainJson = JSON.stringify(appState);
  const cipherJson = await encryptData(plainJson, currentSessionKey);
  localStorage.setItem(STORAGE_ENCRYPTED_KEY, cipherJson);
  updateOverview();
}

function changeTheme(themeName) {
  document.body.className = themeName;
  appState.theme = themeName;
  saveEncryptedData();
  announceNVDA("Farbkontrast geändert.");
}

// --------------------------------------------------------------------------
// 14. BACKUP EXPORT & IMPORT (PC-WECHSEL & DATENSICHERUNG)
// --------------------------------------------------------------------------
function exportEncryptedBackup() {
  const cipherStr = localStorage.getItem(STORAGE_ENCRYPTED_KEY);
  const salt = localStorage.getItem(PIN_SALT_KEY);
  const verifier = localStorage.getItem(PIN_VERIFIER_KEY);

  if (!cipherStr || !verifier) {
    alert("Keine Daten zum Sichern vorhanden.");
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const backupPayload = {
    version: "2.0",
    appName: "BarrierefreieFinanzApp",
    exportedAt: now.toISOString(),
    salt: salt,
    verifier: verifier,
    encryptedData: cipherStr
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Haushaltsbuch_Sicherung_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  announceNVDA("Verschlüsselte Sicherungsdatei für PC-Wechsel erfolgreich heruntergeladen.");
}

function importEncryptedBackup(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.encryptedData || !parsed.verifier || !parsed.salt) {
        alert("Ungültige Sicherungsdatei! Erforderliche Sicherheits-Schlüssel fehlen.");
        return;
      }

      if (confirm("Möchtest du diese Sicherungsdatei wirklich importieren? Deine aktuellen Daten werden dadurch ersetzt.")) {
        localStorage.setItem(PIN_SALT_KEY, parsed.salt);
        localStorage.setItem(PIN_VERIFIER_KEY, parsed.verifier);
        localStorage.setItem(STORAGE_ENCRYPTED_KEY, parsed.encryptedData);

        alert("Sicherungsdatei erfolgreich importiert! Die App wird jetzt neu geladen – bitte gib deine gewohnte PIN ein.");
        location.reload();
      }
    } catch (err) {
      alert("Fehler beim Lesen der Sicherungsdatei: " + err.message);
    }
  };
  reader.readAsText(file);
}

// --------------------------------------------------------------------------
// 15. TASTATURKÜRZEL FÜR NVDA
// --------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

  if (document.getElementById('lock-screen').style.display !== 'none') return;

  if (!isInput) {
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      lockApp();
    } else if (e.key === '1') {
      e.preventDefault();
      switchView('overview');
    } else if (e.key === '2') {
      e.preventDefault();
      switchView('expense');
    } else if (e.key === '3') {
      e.preventDefault();
      switchView('income');
    } else if (e.key === '4') {
      e.preventDefault();
      switchView('transfer');
    } else if (e.key === '5') {
      e.preventDefault();
      switchView('settings');
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      setDayToToday();
      setOverviewMode('day');
    }
  }
});

// INITIALISIERUNG
document.addEventListener('DOMContentLoaded', () => {
  updateTodayDateDisplay();
  checkLockState();
});
