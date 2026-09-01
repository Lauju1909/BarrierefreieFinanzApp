/**
 * BARRIEREFREIE FINANZ-APP & HAUSHALTSBUCH (v2.2.0)
 * 100% DSGVO-konform, militärisch verschlüsselt mit AES-GCM 256-Bit
 * Optimiert für NVDA Screenreader & barrierefreie Bedienung
 */

// --------------------------------------------------------------------------
// 1. GLOBALE KONSTANTEN & STATE
// --------------------------------------------------------------------------
const STORAGE_DATA_KEY = 'barrierefreie_finanzen_enc_v1';
const STORAGE_SALT_KEY = 'barrierefreie_finanzen_salt_v1';
const STORAGE_THEME_KEY = 'barrierefreie_finanzen_theme_v1';

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

let appState = {
  initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 },
  transactions: [],
  recurring: []
};

let cryptoKey = null;
let currentActiveView = 'overview'; // 'overview', 'expense', 'income', 'transfer', 'settings'
let currentOverviewMode = 'month'; // 'day', 'month', 'quarter', 'halfyear', 'year'

// Datumsauswahl
const initialDate = new Date();
let selectedYear = initialDate.getFullYear();
let selectedMonth = initialDate.getMonth();
let selectedDateStr = initialDate.toISOString().split('T')[0];

let inactivityTimer = null;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 Minuten

// --------------------------------------------------------------------------
// 2. INITIALISIERUNG
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDatePickers();
  setupGlobalKeyboardShortcuts();
  checkVaultStatus();
  updateTodayDisplay();

  // Datumseingaben mit Standardwert heute belegen
  const todayVal = new Date().toISOString().split('T')[0];
  if (document.getElementById('exp-date')) document.getElementById('exp-date').value = todayVal;
  if (document.getElementById('inc-date')) document.getElementById('inc-date').value = todayVal;
  if (document.getElementById('trf-date')) document.getElementById('trf-date').value = todayVal;
});

function updateTodayDisplay() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = now.toLocaleDateString('de-DE', options);
  const badge = document.getElementById('today-date-text');
  if (badge) badge.textContent = formatted;
}

// --------------------------------------------------------------------------
// 3. BARRIEREFREIE NVDA SCREENREADER ANKÜNDIGUNGEN
// --------------------------------------------------------------------------
function announceNVDA(message, assertive = false) {
  const regionId = assertive ? 'sr-live-assertive' : 'sr-live';
  const region = document.getElementById(regionId);
  if (!region) return;

  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 60);
}

// --------------------------------------------------------------------------
// 4. TASTATURKÜRZEL (1-5, T, L)
// --------------------------------------------------------------------------
function setupGlobalKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    resetInactivityTimer();

    // Tastaturkürzel nur im eingeloggten Zustand
    if (!cryptoKey) return;

    // Keine Tastaturkürzel in aktiven Formulareingaben
    const activeEl = document.activeElement;
    const isEditing = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );

    if (e.key === 'Escape') {
      closeEditModal();
      closeEditRecModal();
      return;
    }

    if (isEditing) return;

    if (e.key === '1') { e.preventDefault(); switchView('overview'); }
    else if (e.key === '2') { e.preventDefault(); switchView('expense'); }
    else if (e.key === '3') { e.preventDefault(); switchView('income'); }
    else if (e.key === '4') { e.preventDefault(); switchView('transfer'); }
    else if (e.key === '5') { e.preventDefault(); switchView('settings'); }
    else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      setDayToToday();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      lockApp();
    }
  });

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && cryptoKey) {
      lockApp();
    }
  });
}

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (cryptoKey) {
    inactivityTimer = setTimeout(() => {
      lockApp();
      announceNVDA('Automatisch gesperrt wegen 5 Minuten Inaktivität.');
    }, INACTIVITY_TIMEOUT_MS);
  }
}

// --------------------------------------------------------------------------
// 5. ZEITRAUM- & ANSICHTS-MODI (TAG, MONAT, 3 MONATE, 6 MONATE, JAHR)
// --------------------------------------------------------------------------
function setOverviewMode(mode) {
  currentOverviewMode = mode;

  ['day', 'month', 'quarter', 'halfyear', 'year'].forEach(m => {
    const btn = document.getElementById(`mode-btn-${m}`);
    if (btn) {
      if (m === mode) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  renderTimePickerBar();
  updateOverview();

  const names = {
    day: 'Tages-Ansicht',
    month: 'Monats-Ansicht',
    quarter: '3-Monate-Ansicht (Quartal)',
    halfyear: '6-Monate-Ansicht (Halbjahr)',
    year: 'Jahres-Ansicht'
  };
  announceNVDA(`Modus gewechselt zu ${names[mode] || mode}.`);
}

function renderTimePickerBar() {
  const container = document.getElementById('time-picker-content');
  if (!container) return;

  if (currentOverviewMode === 'day') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeDayRelative(-1)" title="Einen Tag zurückgehen (Gestern)" aria-label="Vorheriger Tag">
        ◀ Gestern / Vorheriger Tag
      </button>
      <div class="time-select-wrapper">
        <label for="global-day-select" class="time-select-label">📍 <strong>Tag:</strong></label>
        <input type="date" id="global-day-select" class="time-date-input" value="${selectedDateStr}" onchange="handleDayChange(this.value)">
      </div>
      <button class="btn btn-time-nav" onclick="changeDayRelative(1)" title="Einen Tag vorwärtsgehen (Morgen)" aria-label="Nächster Tag">
        Nächster Tag / Morgen ▶
      </button>
      <button class="btn btn-time-today" onclick="setDayToToday()" title="Zum heutigen Tag springen (Taste T)">
        📍 Heute (T)
      </button>
    `;
  } else if (currentOverviewMode === 'month') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeMonthRelative(-1)" title="Einen Monat zurückgehen" aria-label="Vorheriger Monat">
        ◀ Vorheriger Monat
      </button>
      <div class="time-select-wrapper">
        <label for="global-month-select" class="time-select-label">📅 <strong>Monat:</strong></label>
        <select id="global-month-select" class="time-dropdown" onchange="handleMonthChange(this.value)">
          ${generateMonthOptions(`${selectedYear}-${selectedMonth}`)}
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeMonthRelative(1)" title="Einen Monat vorwärtsgehen" aria-label="Nächster Monat">
        Nächster Monat ▶
      </button>
      <button class="btn btn-time-today" onclick="setMonthToCurrent()" title="Zum aktuellen Monat springen">
        📍 Aktueller Monat
      </button>
    `;
  } else if (currentOverviewMode === 'quarter') {
    const currentQ = Math.floor(selectedMonth / 3) + 1;
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeQuarterRelative(-1)" title="Vorheriges Quartal">
        ◀ Vorheriges Quartal
      </button>
      <div class="time-select-wrapper">
        <label for="global-quarter-select" class="time-select-label">📊 <strong>3 Monate (Quartal):</strong></label>
        <select id="global-quarter-select" class="time-dropdown" onchange="handleQuarterChange(this.value)">
          <option value="${selectedYear}-1" ${currentQ === 1 ? 'selected' : ''}>Q1 ${selectedYear} (Januar - März)</option>
          <option value="${selectedYear}-2" ${currentQ === 2 ? 'selected' : ''}>Q2 ${selectedYear} (April - Juni)</option>
          <option value="${selectedYear}-3" ${currentQ === 3 ? 'selected' : ''}>Q3 ${selectedYear} (Juli - September)</option>
          <option value="${selectedYear}-4" ${currentQ === 4 ? 'selected' : ''}>Q4 ${selectedYear} (Oktober - Dezember)</option>
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeQuarterRelative(1)" title="Nächstes Quartal">
        Nächstes Quartal ▶
      </button>
      <button class="btn btn-time-today" onclick="setQuarterToCurrent()">
        📍 Aktuelles Quartal
      </button>
    `;
  } else if (currentOverviewMode === 'halfyear') {
    const currentH = selectedMonth < 6 ? 1 : 2;
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeHalfyearRelative(-1)" title="Vorheriges Halbjahr">
        ◀ Vorheriges Halbjahr
      </button>
      <div class="time-select-wrapper">
        <label for="global-halfyear-select" class="time-select-label">📈 <strong>6 Monate (Halbjahr):</strong></label>
        <select id="global-halfyear-select" class="time-dropdown" onchange="handleHalfyearChange(this.value)">
          <option value="${selectedYear}-1" ${currentH === 1 ? 'selected' : ''}>1. Halbjahr ${selectedYear} (Januar - Juni)</option>
          <option value="${selectedYear}-2" ${currentH === 2 ? 'selected' : ''}>2. Halbjahr ${selectedYear} (Juli - Dezember)</option>
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeHalfyearRelative(1)" title="Nächstes Halbjahr">
        Nächstes Halbjahr ▶
      </button>
      <button class="btn btn-time-today" onclick="setHalfyearToCurrent()">
        📍 Aktuelles Halbjahr
      </button>
    `;
  } else if (currentOverviewMode === 'year') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeYearRelative(-1)" title="Vorheriges Jahr">
        ◀ Vorheriges Jahr
      </button>
      <div class="time-select-wrapper">
        <label for="global-year-select" class="time-select-label">🗓️ <strong>Ganzes Jahr:</strong></label>
        <select id="global-year-select" class="time-dropdown" onchange="handleYearChange(this.value)">
          <option value="2025" ${selectedYear === 2025 ? 'selected' : ''}>Jahr 2025</option>
          <option value="2026" ${selectedYear === 2026 ? 'selected' : ''}>Jahr 2026</option>
          <option value="2027" ${selectedYear === 2027 ? 'selected' : ''}>Jahr 2027</option>
          <option value="2028" ${selectedYear === 2028 ? 'selected' : ''}>Jahr 2028</option>
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeYearRelative(1)" title="Nächstes Jahr">
        Nächstes Jahr ▶
      </button>
      <button class="btn btn-time-today" onclick="setYearToCurrent()">
        📍 Aktuelles Jahr
      </button>
    `;
  }
}

function generateMonthOptions(selectedVal) {
  let html = '';
  for (let y = 2025; y <= 2027; y++) {
    for (let m = 0; m < 12; m++) {
      const val = `${y}-${m}`;
      const isSel = val === selectedVal ? 'selected' : '';
      html += `<option value="${val}" ${isSel}>${MONTH_NAMES[m]} ${y}</option>`;
    }
  }
  return html;
}

function initDatePickers() {
  renderTimePickerBar();
}

function handleMonthChange(val) {
  const parts = val.split('-');
  selectedYear = parseInt(parts[0], 10);
  selectedMonth = parseInt(parts[1], 10);
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  updateOverview();
  announceNVDA(`Monat ausgewählt: ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function changeMonthRelative(offset) {
  let newM = selectedMonth + offset;
  let newY = selectedYear;
  if (newM > 11) { newM = 0; newY++; }
  else if (newM < 0) { newM = 11; newY--; }

  selectedYear = newY;
  selectedMonth = newM;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Monat gewechselt zu ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function setMonthToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth();
  selectedDateStr = now.toISOString().split('T')[0];
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Zum aktuellen Monat gewechselt: ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function handleDayChange(val) {
  if (!val) return;
  selectedDateStr = val;
  const d = new Date(val + 'T00:00:00');
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth();
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
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Tag gewechselt zu ${formatDateDisplay(selectedDateStr)}.`);
}

function setDayToToday() {
  const now = new Date();
  selectedDateStr = now.toISOString().split('T')[0];
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth();
  currentOverviewMode = 'day';
  setOverviewMode('day');
  announceNVDA(`Zum heutigen Tag gewechselt: ${formatDateDisplay(selectedDateStr)}.`);
}

function handleQuarterChange(val) {
  const parts = val.split('-');
  selectedYear = parseInt(parts[0], 10);
  const q = parseInt(parts[1], 10);
  selectedMonth = (q - 1) * 3;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  updateOverview();
  announceNVDA(`Quartal ausgewählt: Q${q} ${selectedYear}.`);
}

function changeQuarterRelative(offset) {
  let q = Math.floor(selectedMonth / 3) + 1 + offset;
  let y = selectedYear;
  if (q > 4) { q = 1; y++; }
  else if (q < 1) { q = 4; y--; }
  selectedYear = y;
  selectedMonth = (q - 1) * 3;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Gewechselt zu Q${q} ${selectedYear}.`);
}

function setQuarterToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  selectedMonth = (currentQ - 1) * 3;
  renderTimePickerBar();
  updateOverview();
}

function handleHalfyearChange(val) {
  const parts = val.split('-');
  selectedYear = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  selectedMonth = (h - 1) * 6;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  updateOverview();
  announceNVDA(`Halbjahr ausgewählt: ${h}. Halbjahr ${selectedYear}.`);
}

function changeHalfyearRelative(offset) {
  let h = (selectedMonth < 6 ? 1 : 2) + offset;
  let y = selectedYear;
  if (h > 2) { h = 1; y++; }
  else if (h < 1) { h = 2; y--; }
  selectedYear = y;
  selectedMonth = (h - 1) * 6;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  renderTimePickerBar();
  updateOverview();
}

function setHalfyearToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth() < 6 ? 0 : 6;
  renderTimePickerBar();
  updateOverview();
}

function handleYearChange(val) {
  selectedYear = parseInt(val, 10);
  selectedMonth = 0;
  selectedDateStr = `${selectedYear}-01-01`;
  updateOverview();
  announceNVDA(`Jahr ausgewählt: ${selectedYear}.`);
}

function changeYearRelative(offset) {
  selectedYear += offset;
  selectedMonth = 0;
  selectedDateStr = `${selectedYear}-01-01`;
  renderTimePickerBar();
  updateOverview();
}

function setYearToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = 0;
  renderTimePickerBar();
  updateOverview();
}

// --------------------------------------------------------------------------
// 6. DAUERAUFTRÄGE LOGIK
// --------------------------------------------------------------------------
function isRecurringDueInMonth(rec, year, month) {
  if (!rec.active && rec.active !== undefined) return false;
  const startY = rec.startYear !== undefined ? rec.startYear : 2025;
  const startM = rec.startMonth !== undefined ? rec.startMonth : 0;

  if (year < startY || (year === startY && month < startM)) return false;

  if (rec.interval === 'monthly') return true;
  if (rec.interval === 'yearly') return parseInt(rec.yearlyMonth, 10) === month;
  if (rec.interval === 'quarterly') {
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

      list.push({
        id: `rec_instance_${rec.id}_${year}_${month}`,
        recurringId: rec.id,
        isRecurring: true,
        type: rec.type,
        account: rec.account,
        fromAccount: rec.fromAccount,
        toAccount: rec.toAccount,
        amount: Number(rec.amount),
        category: rec.category,
        description: `${rec.name} (Dauerauftrag / Sparplan)`,
        costType: 'fixed',
        date: dateStr
      });
    }
  });

  return list;
}

// --------------------------------------------------------------------------
// 7. BERECHNUNGEN: TAGESGENAU, MONAT, 3M, 6M, JAHR
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

function calculateMultiMonthStats(year, startMonth, countMonths) {
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  const allIncomeList = [];
  const allExpenseList = [];
  const monthsBreakdown = [];

  for (let i = 0; i < countMonths; i++) {
    const m = startMonth + i;
    const stats = calculateMonthStats(year, m);
    totalIncome += stats.income;
    totalExpense += stats.expense;
    incomeCount += stats.incomeCount;
    expenseCount += stats.expenseCount;
    allIncomeList.push(...stats.incomeList);
    allExpenseList.push(...stats.expenseList);

    monthsBreakdown.push({
      monthIndex: m,
      monthName: MONTH_NAMES[m],
      income: stats.income,
      expense: stats.expense,
      leftover: stats.leftover
    });
  }

  allIncomeList.sort((a, b) => new Date(b.date) - new Date(a.date));
  allExpenseList.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    totalIncome,
    totalExpense,
    totalLeftover: totalIncome - totalExpense,
    incomeCount,
    expenseCount,
    incomeList: allIncomeList,
    expenseList: allExpenseList,
    monthsBreakdown
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAccountName(accKey) {
  switch (accKey) {
    case 'bank': return '🏦 Bankkonto';
    case 'paypal': return '🅿️ PayPal';
    case 'savings': return '📈 Tagesgeld';
    case 'cash': return '💵 Bargeld';
    default: return 'Konto';
  }
}

// --------------------------------------------------------------------------
// 8. HAUPTÜBERSICHT AKTUALISIEREN (UPDATE OVERVIEW)
// --------------------------------------------------------------------------
function updateOverview() {
  const periodSection = document.getElementById('section-period-breakdown');

  if (currentOverviewMode === 'day') {
    // 1. TAGES-ANSICHT
    if (periodSection) periodSection.style.display = 'none';

    const dayStats = calculateDayStats(selectedDateStr);
    const dayFormatted = formatDateDisplay(selectedDateStr);
    const dayDateObj = new Date(selectedDateStr + 'T00:00:00');
    const dayName = dayDateObj.toLocaleDateString('de-DE', { weekday: 'long' });
    const balances = calculateBalancesUpToDate(selectedDateStr);

    document.getElementById('overview-month-title').textContent = `Tagesübersicht für ${dayName}, ${dayFormatted}`;
    document.getElementById('overview-banner-subtitle').textContent = `Hier siehst du den genauen Kontostand am Ende des Tages (${dayFormatted}) und alle Buchungen an diesem Tag.`;
    document.getElementById('section-accounts-heading').textContent = `1. 💳 Deine Kontostände am ${dayFormatted} (Tagesende)`;

    // Kontostände
    document.getElementById('acc-balance-bank').textContent = formatCurrency(balances.bank);
    document.getElementById('acc-balance-paypal').textContent = formatCurrency(balances.paypal);
    document.getElementById('acc-balance-savings').textContent = formatCurrency(balances.savings);
    document.getElementById('acc-balance-cash').textContent = formatCurrency(balances.cash);

    // Einnahmen & Ausgaben
    document.getElementById('card-month-income').textContent = `+ ${formatCurrency(dayStats.income)}`;
    document.getElementById('income-summary-subtext').textContent = `${dayStats.incomeCount} Einnahmen am ${dayFormatted}`;
    document.getElementById('details-income-summary-text').textContent = `Alle Einnahmen vom ${dayFormatted} (mit Bearbeiten & Löschen)`;
    renderDetailedIncomeList(dayStats.incomeList);

    document.getElementById('card-month-expense').textContent = `- ${formatCurrency(dayStats.expense)}`;
    document.getElementById('expense-summary-subtext').textContent = `${dayStats.expenseCount} Ausgaben am ${dayFormatted}`;
    document.getElementById('details-expense-summary-text').textContent = `Alle Ausgaben vom ${dayFormatted} (mit Bearbeiten & Löschen)`;
    renderDetailedExpenseList(dayStats.expenseList);

    // Gesamt
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
      leftSub.textContent = `Ausgeglichen: Keine Buchungen am ${dayFormatted}.`;
    }

  } else if (currentOverviewMode === 'month') {
    // 2. MONATS-ANSICHT
    if (periodSection) periodSection.style.display = 'none';

    const stats = calculateMonthStats(selectedYear, selectedMonth);
    const currentMonthTitle = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endOfMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const balances = calculateBalancesUpToDate(endOfMonthStr);

    document.getElementById('overview-month-title').textContent = `Monatsübersicht für ${currentMonthTitle}`;
    document.getElementById('overview-banner-subtitle').textContent = `Hier siehst du deine Konten, Einnahmen, Ausgaben und dein Gesamtergebnis für den gesamten Monat.`;
    document.getElementById('section-accounts-heading').textContent = `1. 💳 Deine Kontostände (Stand: Ende ${currentMonthTitle})`;

    document.getElementById('acc-balance-bank').textContent = formatCurrency(balances.bank);
    document.getElementById('acc-balance-paypal').textContent = formatCurrency(balances.paypal);
    document.getElementById('acc-balance-savings').textContent = formatCurrency(balances.savings);
    document.getElementById('acc-balance-cash').textContent = formatCurrency(balances.cash);

    document.getElementById('card-month-income').textContent = `+ ${formatCurrency(stats.income)}`;
    document.getElementById('income-summary-subtext').textContent = `${stats.incomeCount} Einnahmen im ${MONTH_NAMES[selectedMonth]}`;
    document.getElementById('details-income-summary-text').textContent = `Alle Einnahmen dieses Monats (mit Bearbeiten & Löschen)`;
    renderDetailedIncomeList(stats.incomeList);

    document.getElementById('card-month-expense').textContent = `- ${formatCurrency(stats.expense)}`;
    document.getElementById('expense-summary-subtext').textContent = `${stats.expenseCount} Ausgaben (Fixkosten: ${formatCurrency(stats.fixedExpense)})`;
    document.getElementById('details-expense-summary-text').textContent = `Alle Ausgaben dieses Monats (mit Bearbeiten & Löschen)`;
    renderDetailedExpenseList(stats.expenseList);

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

  } else {
    // 3. MEHRMONATS- & JAHRES-ANSICHT (3 Monate, 6 Monate, Jahr)
    if (periodSection) periodSection.style.display = 'block';

    let countMonths = 3;
    let startMonth = Math.floor(selectedMonth / 3) * 3;
    let periodTitle = `3-Monats-Übersicht (Quartal: ${MONTH_NAMES[startMonth]} - ${MONTH_NAMES[startMonth + 2]} ${selectedYear})`;

    if (currentOverviewMode === 'halfyear') {
      countMonths = 6;
      startMonth = selectedMonth < 6 ? 0 : 6;
      periodTitle = `6-Monats-Übersicht (${startMonth === 0 ? '1. Halbjahr: Jan - Jun' : '2. Halbjahr: Jul - Dez'} ${selectedYear})`;
    } else if (currentOverviewMode === 'year') {
      countMonths = 12;
      startMonth = 0;
      periodTitle = `Jahresübersicht für das gesamte Jahr ${selectedYear} (Januar - Dezember)`;
    }

    const multiStats = calculateMultiMonthStats(selectedYear, startMonth, countMonths);
    const endMIndex = startMonth + countMonths - 1;
    const lastDayOfMonth = new Date(selectedYear, endMIndex + 1, 0).getDate();
    const endOfPeriodStr = `${selectedYear}-${String(endMIndex + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    const balances = calculateBalancesUpToDate(endOfPeriodStr);

    document.getElementById('overview-month-title').textContent = periodTitle;
    document.getElementById('overview-banner-subtitle').textContent = `Zusammenfassung aller Einnahmen, Ausgaben und Kontostände über ${countMonths} Monate.`;
    document.getElementById('section-accounts-heading').textContent = `1. 💳 Deine Kontostände (Stand: Ende ${MONTH_NAMES[endMIndex]} ${selectedYear})`;

    document.getElementById('acc-balance-bank').textContent = formatCurrency(balances.bank);
    document.getElementById('acc-balance-paypal').textContent = formatCurrency(balances.paypal);
    document.getElementById('acc-balance-savings').textContent = formatCurrency(balances.savings);
    document.getElementById('acc-balance-cash').textContent = formatCurrency(balances.cash);

    // Tabelle für den Zeitraum
    renderPeriodSummaryTable(multiStats.monthsBreakdown);

    document.getElementById('card-month-income').textContent = `+ ${formatCurrency(multiStats.totalIncome)}`;
    document.getElementById('income-summary-subtext').textContent = `${multiStats.incomeCount} Einnahmen in diesem Zeitraum`;
    document.getElementById('details-income-summary-text').textContent = `Alle Einnahmen des Zeitraums (${countMonths} Monate, mit Bearbeiten & Löschen)`;
    renderDetailedIncomeList(multiStats.incomeList);

    document.getElementById('card-month-expense').textContent = `- ${formatCurrency(multiStats.totalExpense)}`;
    document.getElementById('expense-summary-subtext').textContent = `${multiStats.expenseCount} Ausgaben in diesem Zeitraum`;
    document.getElementById('details-expense-summary-text').textContent = `Alle Ausgaben des Zeitraums (${countMonths} Monate, mit Bearbeiten & Löschen)`;
    renderDetailedExpenseList(multiStats.expenseList);

    document.getElementById('card-alltime-total').textContent = formatCurrency(balances.total);
    document.getElementById('total-balance-sub').textContent = `Voraussichtlicher Kontostand am Ende des Zeitraums (${MONTH_NAMES[endMIndex]} ${selectedYear})`;

    const leftEl = document.getElementById('month-leftover-display');
    const leftSub = document.getElementById('month-leftover-sub');
    const leftMainLabel = document.getElementById('leftover-main-label');
    leftMainLabel.textContent = `Ergebnis über ${countMonths} Monate:`;
    leftEl.textContent = formatCurrency(multiStats.totalLeftover);

    if (multiStats.totalLeftover > 0) {
      leftEl.style.color = 'var(--accent-income)';
      leftSub.textContent = `🟢 Gesamt-Plus: Du hast in diesem Zeitraum ${formatCurrency(multiStats.totalLeftover)} mehr eingenommen als ausgegeben.`;
    } else if (multiStats.totalLeftover < 0) {
      leftEl.style.color = 'var(--accent-expense)';
      leftSub.textContent = `⚠️ Gesamt-Minus: Du hast in diesem Zeitraum ${formatCurrency(Math.abs(multiStats.totalLeftover))} mehr ausgegeben als eingenommen.`;
    } else {
      leftEl.style.color = 'var(--text-primary)';
      leftSub.textContent = `Ausgeglichen im Zeitraum.`;
    }
  }

  // Simulator & Settings
  runPurchaseSimulation();
  renderSettingsRecurringList();
  renderAnnualTable(document.getElementById('year-view-select') ? document.getElementById('year-view-select').value : selectedYear);
  renderFutureForecast(document.getElementById('forecast-range-select') ? document.getElementById('forecast-range-select').value : 6);
}

function renderPeriodSummaryTable(breakdown) {
  const tbody = document.getElementById('period-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  breakdown.forEach(row => {
    const tr = document.createElement('tr');
    const isPlus = row.leftover >= 0;
    tr.innerHTML = `
      <td><strong>${row.monthName}</strong></td>
      <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(row.income)}</td>
      <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(row.expense)}</td>
      <td class="text-right" style="font-weight: bold; color: ${isPlus ? 'var(--accent-income)' : 'var(--accent-expense)'};">
        ${isPlus ? '+' : ''} ${formatCurrency(row.leftover)}
      </td>
      <td class="text-center">
        <span class="status-badge ${isPlus ? 'status-booked' : 'status-future'}">
          ${isPlus ? '🟢 Plus' : '🔴 Minus'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --------------------------------------------------------------------------
// 9. EINNAHMEN & AUSGABEN LISTEN MIT "BEARBEITEN" (EDIT) & "LÖSCHEN"
// --------------------------------------------------------------------------
function renderDetailedIncomeList(items) {
  const feed = document.getElementById('overview-income-items-feed');
  if (!feed) return;

  if (items.length === 0) {
    feed.innerHTML = '<div class="empty-state">Keine Einnahmen im ausgewählten Zeitraum eingetragen.</div>';
    return;
  }

  let html = '<ul class="tx-list" role="list">';
  items.forEach(tx => {
    const isFuture = new Date(tx.date) > new Date();
    const dateFormatted = formatDateDisplay(tx.date);

    let badgeHtml = '';
    if (tx.isPlanned) {
      badgeHtml = `<span class="status-badge status-planned">🎯 Geplante Einnahme</span>`;
    } else if (isFuture) {
      badgeHtml = `<span class="status-badge status-future">⏳ Kommt noch (${dateFormatted})</span>`;
    } else {
      badgeHtml = `<span class="status-badge status-booked">✓ Erhalten (${dateFormatted})</span>`;
    }

    const editBtn = tx.isRecurring ? 
      `<button type="button" class="btn-edit-tx" onclick="openEditRecModal('${tx.recurringId}')" title="Dauerauftrag bearbeiten">✏️ Bearbeiten</button>` :
      `<button type="button" class="btn-edit-tx" onclick="openEditTxModal('${tx.id}')" title="Einnahme bearbeiten">✏️ Bearbeiten</button>`;

    const deleteBtn = tx.isRecurring ?
      `<button type="button" class="btn-delete-tx" onclick="deleteRecurring('${tx.recurringId}')" title="Dauerauftrag löschen">🗑️ Löschen</button>` :
      `<button type="button" class="btn-delete-tx" onclick="deleteTransaction('${tx.id}')" title="Einnahme löschen">🗑️ Löschen</button>`;

    html += `
      <li class="tx-item" tabindex="0" aria-label="Einnahme: ${tx.category}, Betrag: + ${formatCurrency(tx.amount)}, Datum: ${dateFormatted}">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">🟢</span>
          <div class="tx-details">
            <span class="tx-cat-name">${tx.category || 'Einnahme'}</span>
            <span class="tx-account-badge">${formatAccountName(tx.account)}</span>
            ${badgeHtml}
            ${tx.description ? `<span class="tx-note">${tx.description}</span>` : ''}
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum income">+ ${formatCurrency(tx.amount)}</span>
          ${editBtn}
          ${deleteBtn}
        </div>
      </li>
    `;
  });
  html += '</ul>';
  feed.innerHTML = html;
}

function renderDetailedExpenseList(items) {
  const feed = document.getElementById('overview-expense-items-feed');
  if (!feed) return;

  if (items.length === 0) {
    feed.innerHTML = '<div class="empty-state">Keine Ausgaben im ausgewählten Zeitraum eingetragen.</div>';
    return;
  }

  let html = '<ul class="tx-list" role="list">';
  items.forEach(tx => {
    const isFuture = new Date(tx.date) > new Date();
    const dateFormatted = formatDateDisplay(tx.date);

    let badgeHtml = '';
    if (tx.isPlanned) {
      badgeHtml = `<span class="status-badge status-planned">🎯 Geplanter Kauf (Wunsch)</span>`;
    } else if (tx.costType === 'fixed') {
      badgeHtml = `<span class="status-badge status-future">🔁 Feste Fixkosten (${dateFormatted})</span>`;
    } else if (isFuture) {
      badgeHtml = `<span class="status-badge status-future">⏳ Geht noch ab (${dateFormatted})</span>`;
    } else {
      badgeHtml = `<span class="status-badge status-booked">✓ Abgebucht / Bezahlt (${dateFormatted})</span>`;
    }

    const editBtn = tx.isRecurring ? 
      `<button type="button" class="btn-edit-tx" onclick="openEditRecModal('${tx.recurringId}')" title="Dauerauftrag bearbeiten">✏️ Bearbeiten</button>` :
      `<button type="button" class="btn-edit-tx" onclick="openEditTxModal('${tx.id}')" title="Ausgabe bearbeiten">✏️ Bearbeiten</button>`;

    const deleteBtn = tx.isRecurring ?
      `<button type="button" class="btn-delete-tx" onclick="deleteRecurring('${tx.recurringId}')" title="Dauerauftrag löschen">🗑️ Löschen</button>` :
      `<button type="button" class="btn-delete-tx" onclick="deleteTransaction('${tx.id}')" title="Ausgabe löschen">🗑️ Löschen</button>`;

    html += `
      <li class="tx-item" tabindex="0" aria-label="Ausgabe: ${tx.category}, Betrag: - ${formatCurrency(tx.amount)}, Datum: ${dateFormatted}">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">🔴</span>
          <div class="tx-details">
            <span class="tx-cat-name">${tx.category || 'Ausgabe'}</span>
            <span class="tx-account-badge">${formatAccountName(tx.account)}</span>
            ${badgeHtml}
            ${tx.description ? `<span class="tx-note">${tx.description}</span>` : ''}
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum expense">- ${formatCurrency(tx.amount)}</span>
          ${editBtn}
          ${deleteBtn}
        </div>
      </li>
    `;
  });
  html += '</ul>';
  feed.innerHTML = html;
}

// --------------------------------------------------------------------------
// 10. BEARBEITEN-MODALS (EDIT TRANSACTION & EDIT RECURRING)
// --------------------------------------------------------------------------
function openEditTxModal(id) {
  const tx = appState.transactions.find(t => t.id === id);
  if (!tx) return;

  document.getElementById('edit-tx-id').value = tx.id;
  document.getElementById('edit-tx-amount').value = tx.amount;
  document.getElementById('edit-tx-date').value = tx.date;
  document.getElementById('edit-tx-account').value = tx.account || 'bank';
  document.getElementById('edit-tx-category').value = tx.category || '';
  document.getElementById('edit-tx-desc').value = tx.description || '';

  const modal = document.getElementById('edit-tx-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('edit-tx-amount').focus();
    announceNVDA(`Bearbeiten-Dialog geöffnet für ${tx.category || 'Buchung'}.`);
  }
}

function closeEditModal() {
  const modal = document.getElementById('edit-tx-modal');
  if (modal) modal.style.display = 'none';
}

function saveEditedTransaction(event) {
  event.preventDefault();
  const id = document.getElementById('edit-tx-id').value;
  const amount = parseFloat(document.getElementById('edit-tx-amount').value);
  const date = document.getElementById('edit-tx-date').value;
  const account = document.getElementById('edit-tx-account').value;
  const category = document.getElementById('edit-tx-category').value.trim();
  const description = document.getElementById('edit-tx-desc').value.trim();

  const idx = appState.transactions.findIndex(t => t.id === id);
  if (idx === -1) return;

  appState.transactions[idx].amount = amount;
  appState.transactions[idx].date = date;
  appState.transactions[idx].account = account;
  appState.transactions[idx].category = category;
  appState.transactions[idx].description = description;

  closeEditModal();
  saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Änderungen für ${category} über ${formatCurrency(amount)} erfolgreich gespeichert.`);
}

function openEditRecModal(recId) {
  const rec = appState.recurring.find(r => r.id === recId);
  if (!rec) return;

  document.getElementById('edit-rec-id').value = rec.id;
  document.getElementById('edit-rec-amount').value = rec.amount;
  document.getElementById('edit-rec-interval').value = rec.interval || 'monthly';
  document.getElementById('edit-rec-day').value = rec.day || 1;
  document.getElementById('edit-rec-name').value = rec.name || '';

  const modal = document.getElementById('edit-rec-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('edit-rec-amount').focus();
    announceNVDA(`Bearbeiten-Dialog geöffnet für Dauerauftrag ${rec.name}.`);
  }
}

function closeEditRecModal() {
  const modal = document.getElementById('edit-rec-modal');
  if (modal) modal.style.display = 'none';
}

function saveEditedRecurring(event) {
  event.preventDefault();
  const id = document.getElementById('edit-rec-id').value;
  const amount = parseFloat(document.getElementById('edit-rec-amount').value);
  const interval = document.getElementById('edit-rec-interval').value;
  const day = parseInt(document.getElementById('edit-rec-day').value, 10);
  const name = document.getElementById('edit-rec-name').value.trim();

  const idx = appState.recurring.findIndex(r => r.id === id);
  if (idx === -1) return;

  appState.recurring[idx].amount = amount;
  appState.recurring[idx].interval = interval;
  appState.recurring[idx].day = day;
  appState.recurring[idx].name = name;

  closeEditRecModal();
  saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Dauerauftrag ${name} über ${formatCurrency(amount)} erfolgreich gespeichert.`);
}

// --------------------------------------------------------------------------
// 11. KAUF-SIMULATOR
// --------------------------------------------------------------------------
function runPurchaseSimulation() {
  const priceInput = document.getElementById('sim-item-price');
  const nameInput = document.getElementById('sim-item-name');
  const resultBox = document.getElementById('sim-result-box');
  const saveAction = document.getElementById('sim-save-action');
  if (!priceInput || !resultBox) return;

  const price = parseFloat(priceInput.value);
  const itemName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Dieser Kauf';

  if (isNaN(price) || price <= 0) {
    resultBox.innerHTML = '<p>💡 <em>Gib oben einen Preis ein, um zu sehen, was nach dem Kauf von deinem Geld noch übrig bleibt.</em></p>';
    if (saveAction) saveAction.style.display = 'none';
    return;
  }

  const stats = calculateMonthStats(selectedYear, selectedMonth);
  const currentLeftover = stats.leftover;
  const newLeftover = currentLeftover - price;
  const isAffordable = newLeftover >= 0;

  let msg = '';
  if (isAffordable) {
    msg = `
      <div style="color: var(--accent-income);">
        🟢 <strong>DAS PASST INS BUDGET!</strong><br>
        Wenn du dir <em>${itemName}</em> für <strong>${formatCurrency(price)}</strong> kaufst, hast du im ${MONTH_NAMES[selectedMonth]} immer noch <strong>${formatCurrency(newLeftover)}</strong> übrig.
      </div>
    `;
  } else {
    msg = `
      <div style="color: var(--accent-expense);">
        ⚠️ <strong>ACHTUNG: KAUF ÜBERSTEIGT DEIN BUDGET!</strong><br>
        Wenn du dir <em>${itemName}</em> für <strong>${formatCurrency(price)}</strong> kaufst, wärst du im ${MONTH_NAMES[selectedMonth]} um <strong>${formatCurrency(Math.abs(newLeftover))}</strong> im Minus!
      </div>
    `;
  }

  resultBox.innerHTML = msg;
  if (saveAction) saveAction.style.display = 'block';
}

function saveSimulatedPurchase() {
  const priceInput = document.getElementById('sim-item-price');
  const nameInput = document.getElementById('sim-item-name');
  if (!priceInput || !nameInput) return;

  const amount = parseFloat(priceInput.value);
  const name = nameInput.value.trim() || 'Geplante Anschaffung';
  if (isNaN(amount) || amount <= 0) return;

  const plannedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-15`;

  const newTx = {
    id: `planned_${Date.now()}`,
    type: 'expense',
    account: 'bank',
    amount: amount,
    category: 'Shopping & Kleidung',
    description: name,
    costType: 'variable',
    isPlanned: true,
    date: plannedDateStr
  };

  appState.transactions.push(newTx);
  saveStateToEncryptedStorage();
  updateOverview();

  priceInput.value = '';
  nameInput.value = '';
  runPurchaseSimulation();

  announceNVDA(`Geplanter Kauf von ${name} über ${formatCurrency(amount)} für ${MONTH_NAMES[selectedMonth]} gespeichert!`);
}

// --------------------------------------------------------------------------
// 12. JAHRESTABELLE & PROGNOSE
// --------------------------------------------------------------------------
function renderAnnualTable(yearStr) {
  const year = parseInt(yearStr, 10);
  const tbody = document.getElementById('annual-table-body');
  const tfoot = document.getElementById('annual-table-foot');
  if (!tbody) return;

  tbody.innerHTML = '';
  let sumIncome = 0;
  let sumExpense = 0;

  for (let m = 0; m < 12; m++) {
    const stats = calculateMonthStats(year, m);
    sumIncome += stats.income;
    sumExpense += stats.expense;

    const tr = document.createElement('tr');
    const isPlus = stats.leftover >= 0;
    tr.innerHTML = `
      <td><strong>${MONTH_NAMES[m]} ${year}</strong></td>
      <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(stats.income)}</td>
      <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(stats.expense)}</td>
      <td class="text-right" style="font-weight: bold; color: ${isPlus ? 'var(--accent-income)' : 'var(--accent-expense)'};">
        ${isPlus ? '+' : ''} ${formatCurrency(stats.leftover)}
      </td>
      <td class="text-center">
        <span class="status-badge ${isPlus ? 'status-booked' : 'status-future'}">
          ${isPlus ? '🟢 Plus' : '🔴 Minus'}
        </span>
      </td>
      <td class="text-center">
        <button class="btn-jump-month" onclick="jumpToSpecificMonth(${year}, ${m})" title="Diesen Monat öffnen">Öffnen</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  if (tfoot) {
    const sumLeft = sumIncome - sumExpense;
    const isPlus = sumLeft >= 0;
    tfoot.innerHTML = `
      <tr>
        <th>GESAMT ${year}:</th>
        <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(sumIncome)}</td>
        <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(sumExpense)}</td>
        <td class="text-right" style="color: ${isPlus ? 'var(--accent-income)' : 'var(--accent-expense)'};">
          ${isPlus ? '+' : ''} ${formatCurrency(sumLeft)}
        </td>
        <td class="text-center"><strong>${isPlus ? '🟢 Jahres-Plus' : '🔴 Jahres-Minus'}</strong></td>
        <td></td>
      </tr>
    `;
  }
}

function jumpToSpecificMonth(year, month) {
  selectedYear = year;
  selectedMonth = month;
  selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  currentOverviewMode = 'month';
  setOverviewMode('month');
  switchView('overview');
  announceNVDA(`Gewechselt zu ${MONTH_NAMES[month]} ${year}.`);
}

function renderFutureForecast(monthsAheadStr) {
  const monthsAhead = parseInt(monthsAheadStr, 10);
  const tbody = document.getElementById('forecast-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const now = new Date();
  let curY = now.getFullYear();
  let curM = now.getMonth();

  let runningTotal = calculateBalancesUpToDate(now.toISOString().split('T')[0]).total;

  for (let i = 1; i <= monthsAhead; i++) {
    curM++;
    if (curM > 11) { curM = 0; curY++; }

    const stats = calculateMonthStats(curY, curM);
    runningTotal += stats.leftover;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${MONTH_NAMES[curM]} ${curY}</strong></td>
      <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(stats.income)}</td>
      <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(stats.expense)}</td>
      <td class="text-right" style="font-weight: bold; color: ${stats.leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
        ${stats.leftover >= 0 ? '+' : ''} ${formatCurrency(stats.leftover)}
      </td>
      <td class="text-right" style="font-weight: 900; color: var(--text-primary);">
        ${formatCurrency(runningTotal)}
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// --------------------------------------------------------------------------
// 13. FORMULAR HANDLER (ADD EXPENSE, INCOME, TRANSFER)
// --------------------------------------------------------------------------
function toggleExpenseFrequencyFields() {
  const freq = document.getElementById('exp-frequency').value;
  const isRec = ['monthly', 'yearly', 'quarterly'].includes(freq);
  document.getElementById('exp-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('exp-date-group').style.display = isRec ? 'none' : 'block';
  document.getElementById('exp-yearly-month-group').style.display = freq === 'yearly' ? 'block' : 'none';
}

function toggleIncomeFrequencyFields() {
  const freq = document.getElementById('inc-frequency').value;
  const isRec = ['monthly', 'yearly'].includes(freq);
  document.getElementById('inc-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('inc-date-group').style.display = isRec ? 'none' : 'block';
}

function toggleTransferFrequencyFields() {
  const freq = document.getElementById('trf-frequency').value;
  const isRec = freq === 'monthly';
  document.getElementById('trf-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('trf-date-group').style.display = isRec ? 'none' : 'block';
}

function handleAddExpense(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const freq = document.getElementById('exp-frequency').value;
  const account = document.getElementById('exp-account').value;
  const category = document.getElementById('exp-category').value;
  const date = document.getElementById('exp-date').value;
  const desc = document.getElementById('exp-desc').value.trim();

  if (isNaN(amount) || amount <= 0) return;

  if (['monthly', 'yearly', 'quarterly'].includes(freq)) {
    const day = parseInt(document.getElementById('exp-rec-day').value, 10) || 1;
    const yearlyMonth = freq === 'yearly' ? document.getElementById('exp-yearly-month').value : null;

    appState.recurring.push({
      id: `rec_${Date.now()}`,
      type: 'expense',
      account: account,
      amount: amount,
      category: category,
      name: desc || category,
      interval: freq,
      day: day,
      yearlyMonth: yearlyMonth,
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Fester Dauerauftrag ${category} über ${formatCurrency(amount)} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'expense',
      account: account,
      amount: amount,
      category: category,
      description: desc,
      costType: freq === 'planned' ? 'variable' : 'variable',
      isPlanned: freq === 'planned',
      date: date
    });
    announceNVDA(`Ausgabe ${category} über ${formatCurrency(amount)} gespeichert!`);
  }

  saveStateToEncryptedStorage();
  document.getElementById('form-add-expense').reset();
  document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
  toggleExpenseFrequencyFields();
  updateOverview();
  switchView('overview');
}

function handleAddIncome(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('inc-amount').value);
  const freq = document.getElementById('inc-frequency').value;
  const account = document.getElementById('inc-account').value;
  const category = document.getElementById('inc-category').value;
  const date = document.getElementById('inc-date').value;
  const desc = document.getElementById('inc-desc').value.trim();

  if (isNaN(amount) || amount <= 0) return;

  if (['monthly', 'yearly'].includes(freq)) {
    const day = parseInt(document.getElementById('inc-rec-day').value, 10) || 1;
    appState.recurring.push({
      id: `rec_${Date.now()}`,
      type: 'income',
      account: account,
      amount: amount,
      category: category,
      name: desc || category,
      interval: freq,
      day: day,
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Feste Einnahme ${category} über ${formatCurrency(amount)} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'income',
      account: account,
      amount: amount,
      category: category,
      description: desc,
      isPlanned: freq === 'planned',
      date: date
    });
    announceNVDA(`Einnahme ${category} über ${formatCurrency(amount)} gespeichert!`);
  }

  saveStateToEncryptedStorage();
  document.getElementById('form-add-income').reset();
  document.getElementById('inc-date').value = new Date().toISOString().split('T')[0];
  toggleIncomeFrequencyFields();
  updateOverview();
  switchView('overview');
}

function handleAddTransfer(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('trf-amount').value);
  const freq = document.getElementById('trf-frequency').value;
  const fromAccount = document.getElementById('trf-from').value;
  const toAccount = document.getElementById('trf-to').value;
  const date = document.getElementById('trf-date').value;
  const desc = document.getElementById('trf-desc').value.trim();

  if (isNaN(amount) || amount <= 0 || fromAccount === toAccount) {
    announceNVDA('Fehler: Quelle und Zielkonto müssen unterschiedlich sein.');
    return;
  }

  if (freq === 'monthly') {
    const day = parseInt(document.getElementById('trf-rec-day').value, 10) || 1;
    appState.recurring.push({
      id: `rec_${Date.now()}`,
      type: 'transfer',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      category: 'Umbuchung & Sparplan',
      name: desc || `Sparplan ${formatAccountName(fromAccount)} -> ${formatAccountName(toAccount)}`,
      interval: 'monthly',
      day: day,
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Monatlicher Sparplan über ${formatCurrency(amount)} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'transfer',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      category: 'Umbuchung',
      description: desc,
      date: date
    });
    announceNVDA(`Umbuchung über ${formatCurrency(amount)} gespeichert!`);
  }

  saveStateToEncryptedStorage();
  document.getElementById('form-add-transfer').reset();
  document.getElementById('trf-date').value = new Date().toISOString().split('T')[0];
  toggleTransferFrequencyFields();
  updateOverview();
  switchView('overview');
}

function deleteTransaction(id) {
  const tx = appState.transactions.find(t => t.id === id);
  if (!tx) return;

  if (confirm(`Möchtest du diese Buchung (${tx.category || 'Buchung'}, ${formatCurrency(tx.amount)}) wirklich löschen?`)) {
    appState.transactions = appState.transactions.filter(t => t.id !== id);
    saveStateToEncryptedStorage();
    updateOverview();
    announceNVDA('Buchung gelöscht.');
  }
}

function deleteRecurring(recId) {
  const rec = appState.recurring.find(r => r.id === recId);
  if (!rec) return;

  if (confirm(`Möchtest du den Dauerauftrag / Sparplan "${rec.name}" wirklich löschen?`)) {
    appState.recurring = appState.recurring.filter(r => r.id !== recId);
    saveStateToEncryptedStorage();
    updateOverview();
    announceNVDA(`Dauerauftrag ${rec.name} gelöscht.`);
  }
}

function renderSettingsRecurringList() {
  const container = document.getElementById('settings-recurring-container');
  if (!container) return;

  if (appState.recurring.length === 0) {
    container.innerHTML = '<div class="empty-state">Keine aktiven Daueraufträge oder Sparpläne eingerichtet.</div>';
    return;
  }

  let html = '<ul class="tx-list" role="list">';
  appState.recurring.forEach(rec => {
    let freqLabel = 'Monatlich';
    if (rec.interval === 'yearly') freqLabel = `Jährlich im ${MONTH_NAMES[parseInt(rec.yearlyMonth, 10)]}`;
    else if (rec.interval === 'quarterly') freqLabel = 'Alle 3 Monate';

    html += `
      <li class="tx-item" tabindex="0">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">🔁</span>
          <div class="tx-details">
            <span class="tx-cat-name">${rec.name || rec.category}</span>
            <span class="tx-account-badge">${freqLabel} | Am ${rec.day}. des Monats | ${formatAccountName(rec.account || rec.fromAccount)}</span>
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum ${rec.type}">${rec.type === 'income' ? '+' : '-'} ${formatCurrency(rec.amount)}</span>
          <button type="button" class="btn-edit-tx" onclick="openEditRecModal('${rec.id}')">✏️ Bearbeiten</button>
          <button type="button" class="btn-delete-tx" onclick="deleteRecurring('${rec.id}')">🗑️ Löschen</button>
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

// --------------------------------------------------------------------------
// 14. AES-256 WEB CRYPTO ENGINE (PBKDF2 100.000 Runden + GCM)
// --------------------------------------------------------------------------
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(dataObj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(dataObj));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

async function decryptData(base64Ciphertext, key) {
  const combinedBuffer = base64ToArrayBuffer(base64Ciphertext);
  const combined = new Uint8Array(combinedBuffer);

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  const decodedStr = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decodedStr);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = atob(base64);
  const bytes = new Uint8Array(binary_string.length);
  for (let i = 0; i < binary_string.length; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function checkVaultStatus() {
  const hasVault = localStorage.getItem(STORAGE_DATA_KEY);
  const firstTimeHint = document.getElementById('first-time-hint');
  const lockInstructions = document.getElementById('lock-instructions');

  if (!hasVault) {
    if (firstTimeHint) firstTimeHint.style.display = 'block';
    if (lockInstructions) lockInstructions.textContent = 'Willkommen! Lege jetzt deine persönliche PIN oder dein Passwort fest, um deinen Datensafe einzurichten.';
    const btnUnlock = document.getElementById('btn-unlock');
    if (btnUnlock) btnUnlock.innerHTML = '<span>🔒 <strong>PIN festlegen & Datensafe erstellen</strong> (Enter)</span>';
  }
}

async function handlePinSubmit(e) {
  e.preventDefault();
  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error-msg');
  const enteredPin = pinInput.value.trim();

  if (!enteredPin) return;

  const storedData = localStorage.getItem(STORAGE_DATA_KEY);
  let saltBase64 = localStorage.getItem(STORAGE_SALT_KEY);

  try {
    if (!storedData) {
      // Neuer Datensafe
      const salt = crypto.getRandomValues(new Uint8Array(16));
      saltBase64 = arrayBufferToBase64(salt.buffer);
      localStorage.setItem(STORAGE_SALT_KEY, saltBase64);

      cryptoKey = await deriveKey(enteredPin, salt);
      appState = {
        initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 },
        transactions: [],
        recurring: []
      };
      await saveStateToEncryptedStorage();
      unlockApp();
      announceNVDA('Neuer Datensafe erfolgreich eingerichtet.');
    } else {
      // Vorhandener Datensafe
      const saltBuffer = base64ToArrayBuffer(saltBase64);
      const salt = new Uint8Array(saltBuffer);
      const key = await deriveKey(enteredPin, salt);

      const decrypted = await decryptData(storedData, key);
      cryptoKey = key;
      appState = decrypted;

      if (!appState.initialBalances) appState.initialBalances = { bank: 0, paypal: 0, savings: 0, cash: 0 };
      if (!appState.transactions) appState.transactions = [];
      if (!appState.recurring) appState.recurring = [];

      unlockApp();
      announceNVDA('Erfolgreich entsperrt.');
    }
  } catch (err) {
    if (errorMsg) {
      errorMsg.textContent = '❌ Falsche PIN oder Passwort! Zugriff verweigert.';
      errorMsg.style.display = 'block';
    }
    pinInput.value = '';
    pinInput.focus();
    announceNVDA('Falsche PIN. Bitte erneut versuchen.', true);
  }
}

async function saveStateToEncryptedStorage() {
  if (!cryptoKey) return;
  try {
    const encStr = await encryptData(appState, cryptoKey);
    localStorage.setItem(STORAGE_DATA_KEY, encStr);
  } catch (e) {
    console.error('Verschlüsselungsfehler:', e);
  }
}

function unlockApp() {
  const lockScreen = document.getElementById('lock-screen');
  const appWrapper = document.getElementById('app-wrapper');
  if (lockScreen) lockScreen.style.display = 'none';
  if (appWrapper) appWrapper.style.display = 'block';

  // Formulare vorbefüllen
  if (appState.initialBalances) {
    if (document.getElementById('init-bank')) document.getElementById('init-bank').value = appState.initialBalances.bank || '';
    if (document.getElementById('init-paypal')) document.getElementById('init-paypal').value = appState.initialBalances.paypal || '';
    if (document.getElementById('init-savings')) document.getElementById('init-savings').value = appState.initialBalances.savings || '';
    if (document.getElementById('init-cash')) document.getElementById('init-cash').value = appState.initialBalances.cash || '';
  }

  updateOverview();
  resetInactivityTimer();
}

function lockApp() {
  cryptoKey = null;
  const lockScreen = document.getElementById('lock-screen');
  const appWrapper = document.getElementById('app-wrapper');
  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error-msg');

  if (appWrapper) appWrapper.style.display = 'none';
  if (lockScreen) lockScreen.style.display = 'flex';
  if (errorMsg) errorMsg.style.display = 'none';
  if (pinInput) {
    pinInput.value = '';
    pinInput.focus();
  }
  announceNVDA('Haushaltsbuch gesperrt.');
}

// --------------------------------------------------------------------------
// 15. BACKUP & IMPORT FÜR PC-WECHSEL
// --------------------------------------------------------------------------
function exportEncryptedBackup() {
  const storedData = localStorage.getItem(STORAGE_DATA_KEY);
  const salt = localStorage.getItem(STORAGE_SALT_KEY);

  if (!storedData || !salt) {
    announceNVDA('Keine Daten zum Sichern vorhanden.');
    return;
  }

  const backupObj = {
    app: 'BarrierefreieFinanzApp',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    salt: salt,
    vault: storedData
  };

  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Haushaltsbuch_Sicherung_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  announceNVDA('Verschlüsseltes Backup erfolgreich heruntergeladen!');
}

function importEncryptedBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      if (backup.vault && backup.salt) {
        localStorage.setItem(STORAGE_DATA_KEY, backup.vault);
        localStorage.setItem(STORAGE_SALT_KEY, backup.salt);
        announceNVDA('Sicherung erfolgreich importiert! Bitte entsperre jetzt mit deiner PIN.');
        setTimeout(() => location.reload(), 1500);
      } else {
        announceNVDA('Fehler: Ungültige Sicherungsdatei.', true);
      }
    } catch (err) {
      announceNVDA('Fehler beim Lesen der Backup-Datei.', true);
    }
  };
  reader.readAsText(file);
}

function handleSetInitialBalances(e) {
  e.preventDefault();
  appState.initialBalances = {
    bank: parseFloat(document.getElementById('init-bank').value) || 0,
    paypal: parseFloat(document.getElementById('init-paypal').value) || 0,
    savings: parseFloat(document.getElementById('init-savings').value) || 0,
    cash: parseFloat(document.getElementById('init-cash').value) || 0
  };
  saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA('Start-Kontostände gespeichert.');
}

async function handleChangePin(e) {
  e.preventDefault();
  const oldPin = document.getElementById('change-old-pin').value;
  const newPin = document.getElementById('change-new-pin').value;

  try {
    const saltBase64 = localStorage.getItem(STORAGE_SALT_KEY);
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const testKey = await deriveKey(oldPin, salt);
    await decryptData(localStorage.getItem(STORAGE_DATA_KEY), testKey);

    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(STORAGE_SALT_KEY, arrayBufferToBase64(newSalt.buffer));
    cryptoKey = await deriveKey(newPin, newSalt);
    await saveStateToEncryptedStorage();

    document.getElementById('form-change-pin').reset();
    announceNVDA('PIN erfolgreich geändert und Daten neu verschlüsselt.');
  } catch (err) {
    announceNVDA('Fehler: Alte PIN war nicht korrekt.', true);
  }
}

function resetAllAppData() {
  if (confirm('WARNUNG: Möchtest du wirklich alle Buchungen, Kontostände und Schlüssel unwiderruflich löschen?')) {
    localStorage.removeItem(STORAGE_DATA_KEY);
    localStorage.removeItem(STORAGE_SALT_KEY);
    location.reload();
  }
}

// --------------------------------------------------------------------------
// 16. ANSICHT- & DESIGN-WECHSEL
// --------------------------------------------------------------------------
function switchView(viewName) {
  currentActiveView = viewName;
  ['overview', 'expense', 'income', 'transfer', 'settings'].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const tab = document.getElementById(`tab-${v}`);
    if (el) el.style.display = v === viewName ? 'flex' : 'none';
    if (tab) {
      tab.classList.toggle('active', v === viewName);
      tab.setAttribute('aria-selected', v === viewName ? 'true' : 'false');
      tab.tabIndex = v === viewName ? 0 : -1;
    }
  });

  const modeBar = document.getElementById('overview-mode-bar');
  const timeBar = document.getElementById('time-picker-bar');
  if (modeBar) modeBar.style.display = viewName === 'overview' ? 'block' : 'none';
  if (timeBar) timeBar.style.display = viewName === 'overview' ? 'block' : 'none';

  if (viewName === 'overview') updateOverview();

  const labels = {
    overview: 'Übersicht & Zeiträume',
    expense: 'Ausgabe eintragen',
    income: 'Einnahme eintragen',
    transfer: 'Umbuchen & Sparen',
    settings: 'Backup & Einstellungen'
  };
  announceNVDA(`Bereich geöffnet: ${labels[viewName] || viewName}.`);
}

function changeTheme(themeClass) {
  document.body.className = themeClass;
  localStorage.setItem(STORAGE_THEME_KEY, themeClass);
  announceNVDA(`Kontrast gewechselt zu ${themeClass}.`);
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_THEME_KEY) || 'theme-high-contrast';
  document.body.className = saved;
  const sel = document.getElementById('theme-select');
  if (sel) sel.value = saved;
}
