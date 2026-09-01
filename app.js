/**
 * ============================================================================
 * BARRIEREFREIE FINANZ-APP & HAUSHALTSBUCH - STABLE v3.8.0
 * 100% DSGVO-konform, AES-GCM 256-Bit verschlüsselt
 * Echte permanente Speicherung ohne unerwünschtes Sperren
 * Optimiert für NVDA Screenreader & WCAG 2.2 AAA
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. GLOBALE KONSTANTEN & STATE
// ----------------------------------------------------------------------------
const STORAGE_DATA_KEY = 'barrierefreie_finanzen_enc_v1';
const STORAGE_SALT_KEY = 'barrierefreie_finanzen_salt_v1';
const STORAGE_THEME_KEY = 'barrierefreie_finanzen_theme_v1';
const STORAGE_FONTSIZE_KEY = 'barrierefreie_finanzen_fontsize_v1';

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
let currentOverviewMode = 'month'; // 'day', 'week', 'month', 'quarter', 'halfyear', 'year'

// Datumsauswahl
const initialDate = new Date();
let selectedYear = initialDate.getFullYear();
let selectedMonth = initialDate.getMonth();
let selectedDateStr = initialDate.toISOString().split('T')[0];
let currentWeekDateStr = initialDate.toISOString().split('T')[0];

let inactivityTimer = null;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minuten entspanntes Timeout

// ----------------------------------------------------------------------------
// 2. INITIALISIERUNG
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDatePickers();
  setupGlobalKeyboardShortcuts();
  checkVaultStatus();
  startHeartbeat();
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

// ----------------------------------------------------------------------------
// 3. BARRIEREFREIE NVDA SCREENREADER ANKÜNDIGUNGEN
// ----------------------------------------------------------------------------
function announceNVDA(message, assertive = false) {
  const regionId = assertive ? 'sr-live-assertive' : 'sr-live';
  const region = document.getElementById(regionId);
  if (!region) return;

  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 60);
}

// ----------------------------------------------------------------------------
// 4. TASTATURKÜRZEL (1-5, T, L, ESC)
// ----------------------------------------------------------------------------
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

  // WICHTIG: KEIN visibilitychange Auto-Lock mehr!
  // Dadurch wird die App niemals gesperrt, wenn man Tabs wechselt oder Eingaben macht!
}

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (cryptoKey) {
    inactivityTimer = setTimeout(() => {
      lockApp();
      announceNVDA('Automatisch gesperrt wegen 30 Minuten Inaktivität.');
    }, INACTIVITY_TIMEOUT_MS);
  }
}

// ----------------------------------------------------------------------------
// 5. ZEITRAUM- & KALENDERWOCHEN-LOGIK (TAG, WOCHE, MONAT, 3M, 6M, JAHR)
// ----------------------------------------------------------------------------
function getWeekBoundaries(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);

  return {
    mondayStr: formatDate(monday),
    sundayStr: formatDate(sunday),
    weekNum: weekNum,
    mondayObj: monday,
    sundayObj: sunday
  };
}

function changeWeekRelative(direction) {
  const d = new Date(currentWeekDateStr + 'T00:00:00');
  d.setDate(d.getDate() + (direction * 7));
  currentWeekDateStr = d.toISOString().split('T')[0];
  renderSubTimeNavigation();
  updateOverview();
  const w = getWeekBoundaries(currentWeekDateStr);
  announceNVDA(`Gewechselt zu Kalenderwoche ${w.weekNum}.`);
}

function setWeekToCurrent() {
  currentWeekDateStr = new Date().toISOString().split('T')[0];
  renderSubTimeNavigation();
  updateOverview();
  announceNVDA('Zur aktuellen Kalenderwoche gesprungen.');
}

function handleWeekChange(val) {
  if (!val) return;
  currentWeekDateStr = val;
  renderSubTimeNavigation();
  updateOverview();
}

function handlePeriodDropdownChange(mode) {
  currentOverviewMode = mode;
  renderSubTimeNavigation();
  updateOverview();

  const names = {
    day: 'Tages-Ansicht',
    week: 'Wochen-Ansicht (Kalenderwoche)',
    month: 'Monats-Ansicht',
    quarter: '3-Monate-Ansicht (Quartal)',
    halfyear: '6-Monate-Ansicht (Halbjahr)',
    year: 'Jahres-Ansicht'
  };
  announceNVDA(`Zeitraum gewechselt zu ${names[mode] || mode}.`);
}

function setOverviewMode(mode) {
  currentOverviewMode = mode;
  const select = document.getElementById('overview-period-select');
  if (select) select.value = mode;
  renderSubTimeNavigation();
  updateOverview();
}

function renderSubTimeNavigation() {
  const container = document.getElementById('sub-time-navigation-wrapper');
  if (!container) return;

  const select = document.getElementById('overview-period-select');
  if (select && select.value !== currentOverviewMode) {
    select.value = currentOverviewMode;
  }

  if (currentOverviewMode === 'day') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeDayRelative(-1)" title="Einen Tag zurückgehen (Gestern)" aria-label="Vorheriger Tag">
        ◀ Gestern
      </button>
      <div class="time-select-wrapper">
        <label for="global-day-select" class="time-select-label">📍 <strong>Tag:</strong></label>
        <input type="date" id="global-day-select" class="time-date-input" value="${selectedDateStr}" onchange="handleDayChange(this.value)">
      </div>
      <button class="btn btn-time-nav" onclick="changeDayRelative(1)" title="Einen Tag vorwärtsgehen (Morgen)" aria-label="Nächster Tag">
        Morgen ▶
      </button>
      <button class="btn btn-time-today" onclick="setDayToToday()" title="Zum heutigen Tag springen (Taste T)">
        📍 Heute (T)
      </button>
    `;
  } else if (currentOverviewMode === 'week') {
    const wb = getWeekBoundaries(currentWeekDateStr);
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeWeekRelative(-1)" title="Eine Woche zurückgehen" aria-label="Vorherige Woche">
        ◀ Vorherige Woche
      </button>
      <div class="time-select-wrapper">
        <label for="global-week-select" class="time-select-label">📆 <strong>KW ${wb.weekNum} (${wb.mondayStr.slice(8,10)}.${wb.mondayStr.slice(5,7)}. - ${wb.sundayStr.slice(8,10)}.${wb.sundayStr.slice(5,7)}.):</strong></label>
        <input type="date" id="global-week-select" class="time-date-input" value="${currentWeekDateStr}" onchange="handleWeekChange(this.value)" title="Datum in der gewünschten Woche wählen">
      </div>
      <button class="btn btn-time-nav" onclick="changeWeekRelative(1)" title="Eine Woche vorwärtsgehen" aria-label="Nächste Woche">
        Nächste Woche ▶
      </button>
      <button class="btn btn-time-today" onclick="setWeekToCurrent()" title="Zur aktuellen Woche springen">
        📆 Diese Woche
      </button>
    `;
  } else if (currentOverviewMode === 'month') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeMonthRelative(-1)" title="Einen Monat zurückgehen" aria-label="Vorheriger Monat">
        ◀ Vormonat
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
        <label for="global-quarter-select" class="time-select-label">📊 <strong>Quartal:</strong></label>
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
        <label for="global-halfyear-select" class="time-select-label">📈 <strong>Halbjahr:</strong></label>
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
        <label for="global-year-select" class="time-select-label">🗓️ <strong>Jahr:</strong></label>
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

function renderTimePickerBar() {
  renderSubTimeNavigation();
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

// ----------------------------------------------------------------------------
// 6. DAUERAUFTRÄGE LOGIK & BERECHNUNGEN
// ----------------------------------------------------------------------------
function isRecurringDueInMonth(rec, year, month) {
  if (!rec.active && rec.active !== undefined) return false;
  const startY = rec.startYear !== undefined ? rec.startYear : 2025;
  const startM = rec.startMonth !== undefined ? rec.startMonth : 0;

  if (year < startY || (year === startY && month < startM)) return false;

  if (rec.interval === 'weekly' || rec.interval === 'monthly') return true;
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
      if (rec.interval === 'weekly') {
        const targetWeekday = parseInt(rec.weekday !== undefined ? rec.weekday : 5, 10);
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
          if (dateObj.getDay() === targetWeekday) {
            const dayFormatted = String(d).padStart(2, '0');
            const mFormatted = String(month + 1).padStart(2, '0');
            const dateStr = `${year}-${mFormatted}-${dayFormatted}`;

            list.push({
              id: `rec_instance_${rec.id}_${year}_${month}_${d}`,
              recurringId: rec.id,
              isRecurring: true,
              type: rec.type,
              account: rec.account,
              fromAccount: rec.fromAccount,
              toAccount: rec.toAccount,
              amount: Number(rec.amount),
              category: rec.category,
              description: `${rec.name} (Wöchentlich)`,
              costType: 'fixed',
              date: dateStr
            });
          }
        }
      } else {
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
    }
  });

  return list;
}

// ----------------------------------------------------------------------------
// 7. FINANZIELLE MATHEMATIK & KONTOSTÄNDE
// ----------------------------------------------------------------------------
function calculateBalancesUpToDate(targetDateStr) {
  const balances = {
    bank: Number(appState.initialBalances.bank || 0),
    paypal: Number(appState.initialBalances.paypal || 0),
    savings: Number(appState.initialBalances.savings || 0),
    cash: Number(appState.initialBalances.cash || 0),
    total: 0
  };

  const targetDate = new Date(targetDateStr + 'T23:59:59');
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  // 1. Alle einmaligen Transaktionen bis zum Zieldatum
  appState.transactions.forEach(tx => {
    if (tx.date <= targetDateStr) {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income' && tx.account && balances[tx.account] !== undefined) {
        balances[tx.account] += amt;
      } else if (tx.type === 'expense' && tx.account && balances[tx.account] !== undefined) {
        balances[tx.account] -= amt;
      } else if (tx.type === 'transfer' && tx.fromAccount && tx.toAccount) {
        if (balances[tx.fromAccount] !== undefined) balances[tx.fromAccount] -= amt;
        if (balances[tx.toAccount] !== undefined) balances[tx.toAccount] += amt;
      }
    }
  });

  // 2. Alle wiederkehrenden Buchungen von Start bis zum Zielmonat
  const startYear = 2025;
  for (let y = startYear; y <= targetYear; y++) {
    const endM = (y === targetYear) ? targetMonth : 11;
    for (let m = 0; m <= endM; m++) {
      const recList = getRecurringTransactionsForMonth(y, m);
      recList.forEach(rec => {
        if (rec.date <= targetDateStr) {
          const amt = Number(rec.amount || 0);
          if (rec.type === 'income' && rec.account && balances[rec.account] !== undefined) {
            balances[rec.account] += amt;
          } else if (rec.type === 'expense' && rec.account && balances[rec.account] !== undefined) {
            balances[rec.account] -= amt;
          } else if (rec.type === 'transfer' && rec.fromAccount && rec.toAccount) {
            if (balances[rec.fromAccount] !== undefined) balances[rec.fromAccount] -= amt;
            if (balances[rec.toAccount] !== undefined) balances[rec.toAccount] += amt;
          }
        }
      });
    }
  }

  balances.total = balances.bank + balances.paypal + balances.savings + balances.cash;
  return balances;
}

function calculateDayStats(dayStr) {
  const d = new Date(dayStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = d.getMonth();

  const dayTx = appState.transactions.filter(t => t.date === dayStr);
  const recList = getRecurringTransactionsForMonth(y, m).filter(r => r.date === dayStr);
  const allDay = [...dayTx, ...recList];

  const incomeList = allDay.filter(t => t.type === 'income');
  const expenseList = allDay.filter(t => t.type === 'expense');

  const dayIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dayExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dayLeftover = dayIncome - dayExpense;

  const balances = calculateBalancesUpToDate(dayStr);

  return { dayIncome, dayExpense, dayLeftover, incomeList, expenseList, balances };
}

function calculateMonthStats(year, month) {
  const mFormatted = String(month + 1).padStart(2, '0');
  const monthPrefix = `${year}-${mFormatted}`;

  const monthTx = appState.transactions.filter(t => t.date.startsWith(monthPrefix));
  const recList = getRecurringTransactionsForMonth(year, month);
  const allMonth = [...monthTx, ...recList];

  const incomeList = allMonth.filter(t => t.type === 'income');
  const expenseList = allMonth.filter(t => t.type === 'expense');

  const totalIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const leftover = totalIncome - totalExpense;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endOfMonthStr = `${year}-${mFormatted}-${String(daysInMonth).padStart(2, '0')}`;
  const balances = calculateBalancesUpToDate(endOfMonthStr);

  return { totalIncome, totalExpense, leftover, incomeList, expenseList, balances };
}

// ----------------------------------------------------------------------------
// 8. HAUPTÜBERSICHT RENDERN (TAG, WOCHE, MONAT, 3M, 6M, JAHR)
// ----------------------------------------------------------------------------
function updateOverview() {
  if (currentActiveView !== 'overview') return;

  const bannerTitle = document.getElementById('overview-month-title');
  const bannerSub = document.getElementById('overview-banner-subtitle');
  const accHeading = document.getElementById('section-accounts-heading');
  const incHeading = document.getElementById('section-income-heading');
  const expHeading = document.getElementById('section-expense-heading');
  const totalHeading = document.getElementById('section-total-heading');
  const leftoverLabel = document.getElementById('leftover-main-label');
  const periodSection = document.getElementById('section-period-breakdown');

  const cardIncome = document.getElementById('card-month-income');
  const cardExpense = document.getElementById('card-month-expense');
  const cardTotal = document.getElementById('card-alltime-total');
  const monthLeftover = document.getElementById('month-leftover-display');
  const incomeSummarySub = document.getElementById('income-summary-subtext');
  const expenseSummarySub = document.getElementById('expense-summary-subtext');

  if (periodSection) periodSection.style.display = 'none';

  // --- ANSICHT: TAG ---
  if (currentOverviewMode === 'day') {
    const dayStats = calculateDayStats(selectedDateStr);
    const dayFormatted = formatDateGerman(selectedDateStr);

    if (bannerTitle) bannerTitle.textContent = `Tagesübersicht für ${dayFormatted}`;
    if (bannerSub) bannerSub.textContent = `Hier siehst du deine genauen Kontostände an diesem Tag und alle Einnahmen & Ausgaben am ${dayFormatted}.`;

    if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände am ${dayFormatted}`;
    if (incHeading) incHeading.textContent = `2. 📥 Einnahmen am ${dayFormatted}`;
    if (expHeading) expHeading.textContent = `3. 📤 Ausgaben am ${dayFormatted}`;
    if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTER KONTOSTAND AM ${dayFormatted.toUpperCase()}`;
    if (leftoverLabel) leftoverLabel.textContent = `Tagesergebnis (${dayFormatted}):`;

    if (incomeSummarySub) incomeSummarySub.textContent = `${dayStats.incomeList.length} Einnahme(n) an diesem Tag`;
    if (expenseSummarySub) expenseSummarySub.textContent = `${dayStats.expenseList.length} Ausgabe(n) an diesem Tag`;

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(dayStats.dayIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(dayStats.dayExpense)}`;
    if (cardTotal) cardTotal.textContent = formatCurrency(dayStats.balances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (dayStats.dayLeftover >= 0 ? '+ ' : '') + formatCurrency(dayStats.dayLeftover);
      monthLeftover.style.color = dayStats.dayLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(dayStats.balances);
    renderTransactionList(dayStats.incomeList, 'overview-income-items-feed', 'Keine Einnahmen an diesem Tag erfasst.');
    renderTransactionList(dayStats.expenseList, 'overview-expense-items-feed', 'Keine Ausgaben an diesem Tag erfasst.');
    runPurchaseSimulation();
    return;
  }

  // --- ANSICHT: WOCHE ---
  if (currentOverviewMode === 'week') {
    const wb = getWeekBoundaries(currentWeekDateStr);
    const monFormatted = formatDateGerman(wb.mondayStr);
    const sunFormatted = formatDateGerman(wb.sundayStr);
    const weekBalances = calculateBalancesUpToDate(wb.sundayStr);

    const allTx = [];
    appState.transactions.forEach(tx => {
      if (tx.date >= wb.mondayStr && tx.date <= wb.sundayStr) {
        allTx.push(tx);
      }
    });

    const m1 = new Date(wb.mondayStr + 'T00:00:00');
    const m2 = new Date(wb.sundayStr + 'T00:00:00');
    const monthKeys = new Set();
    monthKeys.add(`${m1.getFullYear()}_${m1.getMonth()}`);
    monthKeys.add(`${m2.getFullYear()}_${m2.getMonth()}`);

    monthKeys.forEach(mk => {
      const [y, m] = mk.split('_').map(Number);
      const recList = getRecurringTransactionsForMonth(y, m);
      recList.forEach(r => {
        if (r.date >= wb.mondayStr && r.date <= wb.sundayStr) {
          allTx.push(r);
        }
      });
    });

    const incomeList = allTx.filter(t => t.type === 'income');
    const expenseList = allTx.filter(t => t.type === 'expense');

    const weekIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const weekExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const weekLeftover = weekIncome - weekExpense;

    if (bannerTitle) bannerTitle.textContent = `Wochenübersicht für KW ${wb.weekNum} (${monFormatted} bis ${sunFormatted})`;
    if (bannerSub) bannerSub.textContent = `Hier siehst du deine Kontostände am Ende der Woche sowie alle Einnahmen & Ausgaben in dieser Kalenderwoche.`;

    if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände am Ende von KW ${wb.weekNum} (${sunFormatted})`;
    if (incHeading) incHeading.textContent = `2. 📥 Einnahmen in dieser Woche (KW ${wb.weekNum})`;
    if (expHeading) expHeading.textContent = `3. 📤 Ausgaben in dieser Woche (KW ${wb.weekNum})`;
    if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTGUTHABEN AM ENDE VON KW ${wb.weekNum}`;
    if (leftoverLabel) leftoverLabel.textContent = `Wochen-Ergebnis (KW ${wb.weekNum}):`;

    if (incomeSummarySub) incomeSummarySub.textContent = `${incomeList.length} Einnahme(n) in dieser Woche`;
    if (expenseSummarySub) expenseSummarySub.textContent = `${expenseList.length} Ausgabe(n) in dieser Woche`;

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(weekIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(weekExpense)}`;
    if (cardTotal) cardTotal.textContent = formatCurrency(weekBalances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (weekLeftover >= 0 ? '+ ' : '') + formatCurrency(weekLeftover);
      monthLeftover.style.color = weekLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(weekBalances);
    renderTransactionList(incomeList, 'overview-income-items-feed', 'Keine Einnahmen in dieser Kalenderwoche erfasst.');
    renderTransactionList(expenseList, 'overview-expense-items-feed', 'Keine Ausgaben in dieser Kalenderwoche erfasst.');
    runPurchaseSimulation();
    return;
  }

  // --- ANSICHT: MONAT ---
  if (currentOverviewMode === 'month') {
    const stats = calculateMonthStats(selectedYear, selectedMonth);
    const monthName = MONTH_NAMES[selectedMonth];

    if (bannerTitle) bannerTitle.textContent = `Monatsübersicht für ${monthName} ${selectedYear}`;
    if (bannerSub) bannerSub.textContent = `Hier siehst du deine Konten, Einnahmen, Ausgaben und dein Gesamtergebnis für ${monthName} ${selectedYear}.`;

    if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände (Ende ${monthName} ${selectedYear})`;
    if (incHeading) incHeading.textContent = `2. 📥 Einnahmen im ${monthName} ${selectedYear}`;
    if (expHeading) expHeading.textContent = `3. 📤 Ausgaben im ${monthName} ${selectedYear}`;
    if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTER KONTOSTAND & ERGEBNIS (${monthName.toUpperCase()} ${selectedYear})`;
    if (leftoverLabel) leftoverLabel.textContent = `Ergebnis im ${monthName}:`;

    if (incomeSummarySub) incomeSummarySub.textContent = `${stats.incomeList.length} Einnahme(n) in diesem Monat`;
    if (expenseSummarySub) expenseSummarySub.textContent = `${stats.expenseList.length} Ausgabe(n) in diesem Monat`;

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(stats.totalIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(stats.totalExpense)}`;
    if (cardTotal) cardTotal.textContent = formatCurrency(stats.balances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (stats.leftover >= 0 ? '+ ' : '') + formatCurrency(stats.leftover);
      monthLeftover.style.color = stats.leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(stats.balances);
    renderTransactionList(stats.incomeList, 'overview-income-items-feed', 'Keine Einnahmen in diesem Monat erfasst.');
    renderTransactionList(stats.expenseList, 'overview-expense-items-feed', 'Keine Ausgaben in diesem Monat erfasst.');
    runPurchaseSimulation();
    return;
  }

  // --- ANSICHT: MEHRMONATS- & JAHRESÜBERSICHT (3M, 6M, JAHR) ---
  let startM = 0, endM = 11, titlePeriod = `Jahr ${selectedYear}`;
  if (currentOverviewMode === 'quarter') {
    const q = Math.floor(selectedMonth / 3) + 1;
    startM = (q - 1) * 3;
    endM = startM + 2;
    titlePeriod = `Q${q} ${selectedYear} (${MONTH_NAMES[startM]} - ${MONTH_NAMES[endM]})`;
  } else if (currentOverviewMode === 'halfyear') {
    const h = selectedMonth < 6 ? 1 : 2;
    startM = (h - 1) * 6;
    endM = startM + 5;
    titlePeriod = `${h}. Halbjahr ${selectedYear} (${MONTH_NAMES[startM]} - ${MONTH_NAMES[endM]})`;
  }

  let grandIncome = 0, grandExpense = 0;
  const allPeriodIncome = [];
  const allPeriodExpense = [];
  const monthlyBreakdown = [];

  for (let m = startM; m <= endM; m++) {
    const mStats = calculateMonthStats(selectedYear, m);
    grandIncome += mStats.totalIncome;
    grandExpense += mStats.totalExpense;
    allPeriodIncome.push(...mStats.incomeList);
    allPeriodExpense.push(...mStats.expenseList);
    monthlyBreakdown.push({
      monthName: MONTH_NAMES[m],
      income: mStats.totalIncome,
      expense: mStats.totalExpense,
      leftover: mStats.leftover
    });
  }

  const grandLeftover = grandIncome - grandExpense;
  const lastDays = new Date(selectedYear, endM + 1, 0).getDate();
  const endPeriodDateStr = `${selectedYear}-${String(endM + 1).padStart(2, '0')}-${String(lastDays).padStart(2, '0')}`;
  const periodEndBalances = calculateBalancesUpToDate(endPeriodDateStr);

  if (bannerTitle) bannerTitle.textContent = `Übersicht für ${titlePeriod}`;
  if (bannerSub) bannerSub.textContent = `Zusammenfassung aller Einnahmen, Ausgaben und Kontostände im gewählten Zeitraum.`;

  if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände am Ende von ${titlePeriod}`;
  if (incHeading) incHeading.textContent = `2. 📥 Einnahmen in ${titlePeriod}`;
  if (expHeading) expHeading.textContent = `3. 📤 Ausgaben in ${titlePeriod}`;
  if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTER KONTOSTAND & ERGEBNIS (${titlePeriod.toUpperCase()})`;
  if (leftoverLabel) leftoverLabel.textContent = `Gesamtergebnis in ${titlePeriod}:`;

  if (incomeSummarySub) incomeSummarySub.textContent = `${allPeriodIncome.length} Einnahme(n) im Zeitraum`;
  if (expenseSummarySub) expenseSummarySub.textContent = `${allPeriodExpense.length} Ausgabe(n) im Zeitraum`;

  if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(grandIncome)}`;
  if (cardExpense) cardExpense.textContent = `- ${formatCurrency(grandExpense)}`;
  if (cardTotal) cardTotal.textContent = formatCurrency(periodEndBalances.total);

  if (monthLeftover) {
    monthLeftover.textContent = (grandLeftover >= 0 ? '+ ' : '') + formatCurrency(grandLeftover);
    monthLeftover.style.color = grandLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
  }

  renderAccountCardBalances(periodEndBalances);
  renderTransactionList(allPeriodIncome, 'overview-income-items-feed', 'Keine Einnahmen in diesem Zeitraum.');
  renderTransactionList(allPeriodExpense, 'overview-expense-items-feed', 'Keine Ausgaben in diesem Zeitraum.');

  if (periodSection) {
    periodSection.style.display = 'block';
    const tbody = document.getElementById('period-table-body');
    if (tbody) {
      tbody.innerHTML = monthlyBreakdown.map(mb => `
        <tr>
          <td><strong>${mb.monthName}</strong></td>
          <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(mb.income)}</td>
          <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(mb.expense)}</td>
          <td class="text-right" style="font-weight: bold; color: ${mb.leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
            ${mb.leftover >= 0 ? '+ ' : ''}${formatCurrency(mb.leftover)}
          </td>
          <td class="text-center">${mb.leftover >= 0 ? '🟢 Plus' : '🔴 Minus'}</td>
        </tr>
      `).join('');
    }
  }

  runPurchaseSimulation();
}

function renderAccountCardBalances(balances) {
  const bBank = document.getElementById('acc-balance-bank');
  const bPaypal = document.getElementById('acc-balance-paypal');
  const bSavings = document.getElementById('acc-balance-savings');
  const bCash = document.getElementById('acc-balance-cash');

  if (bBank) bBank.textContent = formatCurrency(balances.bank);
  if (bPaypal) bPaypal.textContent = formatCurrency(balances.paypal);
  if (bSavings) bSavings.textContent = formatCurrency(balances.savings);
  if (bCash) bCash.textContent = formatCurrency(balances.cash);
}

function renderTransactionList(list, containerId, emptyText) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p class="empty-state">${emptyText}</p>`;
    return;
  }

  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));

  let html = '<ul class="tx-list">';
  sorted.forEach(tx => {
    const isIncome = tx.type === 'income';
    const sign = isIncome ? '+' : '-';
    const colorClass = isIncome ? 'income' : 'expense';
    const icon = isIncome ? '📥' : '📤';
    const dateFormatted = formatDateGerman(tx.date);

    let statusBadge = '';
    if (tx.isPlanned) {
      statusBadge = '<span class="status-badge status-planned">🎯 Geplant</span>';
    } else if (tx.isRecurring) {
      statusBadge = '<span class="status-badge status-booked">🔁 Dauerhaft</span>';
    }

    html += `
      <li class="tx-item" tabindex="0">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">${icon}</span>
          <div class="tx-details">
            <span class="tx-cat-name">${tx.category || 'Buchung'}</span>
            <span class="tx-account-badge">${dateFormatted} | ${formatAccountName(tx.account)}</span>
            ${statusBadge}
            ${tx.description ? `<span class="tx-note">${tx.description}</span>` : ''}
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum ${colorClass}">${sign} ${formatCurrency(tx.amount)}</span>
          ${!tx.isRecurring ? `<button type="button" class="btn-edit-tx" onclick="openEditModal('${tx.id}')">✏️ Bearbeiten</button>` : ''}
          ${!tx.isRecurring ? `<button type="button" class="btn-delete-tx" onclick="deleteTransaction('${tx.id}')">🗑️ Löschen</button>` : ''}
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

// ----------------------------------------------------------------------------
// 9. FORMULAR-HANDLER: AUSGABEN, EINNAHMEN, UMBUCHUNGEN
// ----------------------------------------------------------------------------
function toggleExpenseFrequencyFields() {
  const freq = document.getElementById('exp-frequency').value;
  const isRec = ['weekly', 'monthly', 'yearly', 'quarterly'].includes(freq);
  document.getElementById('exp-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('exp-date-group').style.display = isRec ? 'none' : 'block';
  document.getElementById('exp-yearly-month-group').style.display = freq === 'yearly' ? 'block' : 'none';
  
  const isWeekly = freq === 'weekly';
  if (document.getElementById('exp-weekday-group')) document.getElementById('exp-weekday-group').style.display = isWeekly ? 'block' : 'none';
  if (document.getElementById('exp-month-day-group')) document.getElementById('exp-month-day-group').style.display = isWeekly ? 'none' : 'block';
}

function toggleIncomeFrequencyFields() {
  const freq = document.getElementById('inc-frequency').value;
  const isRec = ['weekly', 'monthly', 'yearly'].includes(freq);
  document.getElementById('inc-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('inc-date-group').style.display = isRec ? 'none' : 'block';

  const isWeekly = freq === 'weekly';
  if (document.getElementById('inc-weekday-group')) document.getElementById('inc-weekday-group').style.display = isWeekly ? 'block' : 'none';
  if (document.getElementById('inc-month-day-group')) document.getElementById('inc-month-day-group').style.display = isWeekly ? 'none' : 'block';
}

function toggleTransferFrequencyFields() {
  const freq = document.getElementById('trf-frequency').value;
  const isRec = ['weekly', 'monthly'].includes(freq);
  document.getElementById('trf-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('trf-date-group').style.display = isRec ? 'none' : 'block';

  const isWeekly = freq === 'weekly';
  if (document.getElementById('trf-weekday-group')) document.getElementById('trf-weekday-group').style.display = isWeekly ? 'block' : 'none';
  if (document.getElementById('trf-month-day-group')) document.getElementById('trf-month-day-group').style.display = isWeekly ? 'none' : 'block';
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

  if (['weekly', 'monthly', 'yearly', 'quarterly'].includes(freq)) {
    const day = parseInt(document.getElementById('exp-rec-day').value, 10) || 1;
    const weekday = document.getElementById('exp-rec-weekday') ? parseInt(document.getElementById('exp-rec-weekday').value, 10) : 5;
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
      weekday: weekday,
      yearlyMonth: yearlyMonth,
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Dauerhafter Eintrag ${category} über ${formatCurrency(amount)} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'expense',
      account: account,
      amount: amount,
      category: category,
      description: desc,
      costType: 'variable',
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

  if (['weekly', 'monthly', 'yearly'].includes(freq)) {
    const day = parseInt(document.getElementById('inc-rec-day').value, 10) || 1;
    const weekday = document.getElementById('inc-rec-weekday') ? parseInt(document.getElementById('inc-rec-weekday').value, 10) : 5;
    
    appState.recurring.push({
      id: `rec_${Date.now()}`,
      type: 'income',
      account: account,
      amount: amount,
      category: category,
      name: desc || category,
      interval: freq,
      day: day,
      weekday: weekday,
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Dauerhafte Einnahme ${category} über ${formatCurrency(amount)} gespeichert!`);
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
    announceNVDA('Fehler: Quelle und Zielkonto müssen unterschiedlich sein.', true);
    return;
  }

  if (['weekly', 'monthly'].includes(freq)) {
    const day = parseInt(document.getElementById('trf-rec-day').value, 10) || 1;
    const weekday = document.getElementById('trf-rec-weekday') ? parseInt(document.getElementById('trf-rec-weekday').value, 10) : 5;
    
    appState.recurring.push({
      id: `rec_${Date.now()}`,
      type: 'transfer',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      category: 'Umbuchung & Sparplan',
      name: desc || `Sparplan ${formatAccountName(fromAccount)} -> ${formatAccountName(toAccount)}`,
      interval: freq,
      day: day,
      weekday: weekday,
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Sparplan über ${formatCurrency(amount)} gespeichert!`);
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

// ----------------------------------------------------------------------------
// 10. MODAL DIALOGE & BEARBEITEN
// ----------------------------------------------------------------------------
function openEditModal(txId) {
  const tx = appState.transactions.find(t => t.id === txId);
  if (!tx) return;

  document.getElementById('edit-tx-id').value = tx.id;
  document.getElementById('edit-tx-amount').value = tx.amount;
  document.getElementById('edit-tx-date').value = tx.date;
  document.getElementById('edit-tx-account').value = tx.account || 'bank';
  document.getElementById('edit-tx-category').value = tx.category || '';
  document.getElementById('edit-tx-desc').value = tx.description || '';

  const modal = document.getElementById('edit-tx-modal');
  modal.style.display = 'flex';
  document.getElementById('edit-tx-amount').focus();
  announceNVDA('Buchung bearbeiten geöffnet.');
}

function closeEditModal() {
  const modal = document.getElementById('edit-tx-modal');
  if (modal) modal.style.display = 'none';
}

function saveEditedTransaction(e) {
  e.preventDefault();
  const id = document.getElementById('edit-tx-id').value;
  const tx = appState.transactions.find(t => t.id === id);
  if (!tx) return;

  tx.amount = parseFloat(document.getElementById('edit-tx-amount').value);
  tx.date = document.getElementById('edit-tx-date').value;
  tx.account = document.getElementById('edit-tx-account').value;
  tx.category = document.getElementById('edit-tx-category').value;
  tx.description = document.getElementById('edit-tx-desc').value.trim();

  saveStateToEncryptedStorage();
  closeEditModal();
  updateOverview();
  announceNVDA('Buchung erfolgreich aktualisiert!');
}

function deleteTransaction(txId) {
  const idx = appState.transactions.findIndex(t => t.id === txId);
  if (idx !== -1) {
    const deleted = appState.transactions.splice(idx, 1)[0];
    saveStateToEncryptedStorage();
    updateOverview();
    announceNVDA(`Buchung über ${formatCurrency(deleted.amount)} gelöscht.`);
  }
}

function openEditRecModal(recId) {
  const rec = appState.recurring.find(r => r.id === recId);
  if (!rec) return;

  document.getElementById('edit-rec-id').value = rec.id;
  document.getElementById('edit-rec-amount').value = rec.amount;
  document.getElementById('edit-rec-interval').value = rec.interval || 'monthly';
  document.getElementById('edit-rec-day').value = rec.day || 1;
  document.getElementById('edit-rec-name').value = rec.name || rec.category || '';

  const modal = document.getElementById('edit-rec-modal');
  modal.style.display = 'flex';
  document.getElementById('edit-rec-amount').focus();
  announceNVDA('Dauerauftrag bearbeiten geöffnet.');
}

function closeEditRecModal() {
  const modal = document.getElementById('edit-rec-modal');
  if (modal) modal.style.display = 'none';
}

function saveEditedRecurring(e) {
  e.preventDefault();
  const id = document.getElementById('edit-rec-id').value;
  const rec = appState.recurring.find(r => r.id === id);
  if (!rec) return;

  rec.amount = parseFloat(document.getElementById('edit-rec-amount').value);
  rec.interval = document.getElementById('edit-rec-interval').value;
  rec.day = parseInt(document.getElementById('edit-rec-day').value, 10) || 1;
  rec.name = document.getElementById('edit-rec-name').value.trim();

  saveStateToEncryptedStorage();
  closeEditRecModal();
  renderSettingsRecurringList();
  updateOverview();
  announceNVDA('Dauerauftrag erfolgreich aktualisiert!');
}

function deleteRecurring(recId) {
  const idx = appState.recurring.findIndex(r => r.id === recId);
  if (idx !== -1) {
    const deleted = appState.recurring.splice(idx, 1)[0];
    saveStateToEncryptedStorage();
    renderSettingsRecurringList();
    updateOverview();
    announceNVDA(`Dauerauftrag ${deleted.name} gelöscht.`);
  }
}

// ----------------------------------------------------------------------------
// 11. KAUF-PLANER & SIMULATOR
// ----------------------------------------------------------------------------
let currentSimulatedPurchase = null;

function runPurchaseSimulation() {
  const priceInput = document.getElementById('sim-item-price');
  const nameInput = document.getElementById('sim-item-name');
  const resultBox = document.getElementById('sim-result-box');
  const actionBox = document.getElementById('sim-save-action');
  if (!priceInput || !resultBox) return;

  const price = parseFloat(priceInput.value);
  const name = (nameInput && nameInput.value.trim()) || 'Wunsch';

  if (isNaN(price) || price <= 0) {
    resultBox.innerHTML = '<p>💡 <em>Gib oben einen Preis ein, um zu sehen, wie viel Geld danach noch übrig bleibt.</em></p>';
    if (actionBox) actionBox.style.display = 'none';
    currentSimulatedPurchase = null;
    return;
  }

  const stats = calculateMonthStats(selectedYear, selectedMonth);
  const leftoverAfter = stats.leftover - price;
  const isAffordable = leftoverAfter >= 0;

  resultBox.innerHTML = `
    <div style="font-size: 20px; font-weight: bold; color: ${isAffordable ? 'var(--accent-income)' : 'var(--accent-expense)'};">
      ${isAffordable ? '✅ Ja, das kannst du dir leisten!' : '⚠️ Achtung: Dein Monatsbudget wird überzogen!'}
    </div>
    <div style="margin-top: 6px;">
      Wenn du dir <strong>${escapeHTML(name)}</strong> für <strong>${formatCurrency(price)}</strong> kaufst,
      bleiben dir in diesem Monat noch <strong style="font-size: 22px; color: ${isAffordable ? 'var(--accent-income)' : 'var(--accent-expense)'};">${formatCurrency(leftoverAfter)}</strong> übrig.
    </div>
  `;

  if (actionBox) actionBox.style.display = 'block';
  currentSimulatedPurchase = { name, price, date: selectedDateStr };
}

function saveSimulatedPurchase() {
  if (!currentSimulatedPurchase) return;
  appState.transactions.push({
    id: `tx_${Date.now()}`,
    type: 'expense',
    account: 'bank',
    amount: currentSimulatedPurchase.price,
    category: 'Shopping & Wünsche',
    description: `Geplant: ${currentSimulatedPurchase.name}`,
    isPlanned: true,
    date: currentSimulatedPurchase.date
  });

  saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Geplanter Kauf ${currentSimulatedPurchase.name} gespeichert!`);

  document.getElementById('sim-item-price').value = '';
  document.getElementById('sim-item-name').value = '';
  runPurchaseSimulation();
}

// ----------------------------------------------------------------------------
// 12. EINSTELLUNGEN: DESIGN, SCHRIFTGRÖSSE, DAUERAUFTRÄGE
// ----------------------------------------------------------------------------
function renderSettingsRecurringList() {
  const container = document.getElementById('settings-recurring-container');
  if (!container) return;

  if (appState.recurring.length === 0) {
    container.innerHTML = '<p class="empty-state">Keine dauerhaften Daueraufträge oder Sparpläne angelegt.</p>';
    return;
  }

  const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  let html = '<ul class="tx-list">';
  appState.recurring.forEach(rec => {
    let freqLabel = 'Monatlich';
    if (rec.interval === 'weekly') freqLabel = `Wöchentlich jeden ${weekdayNames[parseInt(rec.weekday || 5, 10)]}`;
    else if (rec.interval === 'yearly') freqLabel = `Jährlich im ${MONTH_NAMES[parseInt(rec.yearlyMonth || 0, 10)]}`;
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

function changeTheme(themeClass) {
  const currentFont = localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'font-normal';
  document.body.className = `${themeClass} ${currentFont}`;
  localStorage.setItem(STORAGE_THEME_KEY, themeClass);
  
  const sel = document.getElementById('settings-theme-select');
  if (sel) sel.value = themeClass;

  const names = {
    'theme-light': 'Standard Web-Design (Hell)',
    'theme-dark': 'Dunkel-Modus',
    'theme-high-contrast': 'Gelb auf Schwarz (Maximaler Kontrast)'
  };
  announceNVDA(`Design gewechselt zu: ${names[themeClass] || themeClass}.`);
}

function changeFontSize(fontClass) {
  const currentTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'theme-light';
  document.body.className = `${currentTheme} ${fontClass}`;
  localStorage.setItem(STORAGE_FONTSIZE_KEY, fontClass);

  const sel = document.getElementById('settings-fontsize-select');
  if (sel) sel.value = fontClass;

  const names = {
    'font-normal': 'Normale Schriftgröße (100%)',
    'font-large': 'Große Schrift (125%)',
    'font-xlarge': 'Sehr große Schrift (150%)'
  };
  announceNVDA(`Schriftgröße gewechselt zu: ${names[fontClass] || fontClass}.`);
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'theme-light';
  const savedFont = localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'font-normal';
  document.body.className = `${savedTheme} ${savedFont}`;

  const themeSel = document.getElementById('settings-theme-select');
  if (themeSel) themeSel.value = savedTheme;

  const fontSel = document.getElementById('settings-fontsize-select');
  if (fontSel) fontSel.value = savedFont;
}

// ----------------------------------------------------------------------------
// 13. VIEW NAVIGATION (TABS 1-5)
// ----------------------------------------------------------------------------
function switchView(viewName) {
  currentActiveView = viewName;

  const views = ['overview', 'expense', 'income', 'transfer', 'settings'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const tab = document.getElementById(`tab-${v}`);
    const isTarget = v === viewName;

    if (el) el.style.display = isTarget ? 'flex' : 'none';
    if (tab) {
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      tab.setAttribute('tabindex', isTarget ? '0' : '-1');
    }
  });

  const timeBar = document.getElementById('time-picker-bar');
  if (timeBar) timeBar.style.display = viewName === 'overview' ? 'block' : 'none';

  if (viewName === 'overview') {
    updateOverview();
    announceNVDA('Übersicht geöffnet.');
  } else if (viewName === 'expense') {
    document.getElementById('exp-amount').focus();
    announceNVDA('Ausgabe eintragen geöffnet.');
  } else if (viewName === 'income') {
    document.getElementById('inc-amount').focus();
    announceNVDA('Einnahme eintragen geöffnet.');
  } else if (viewName === 'transfer') {
    document.getElementById('trf-amount').focus();
    announceNVDA('Umbuchen und Sparen geöffnet.');
  } else if (viewName === 'settings') {
    renderSettingsRecurringList();
    announceNVDA('Einstellungen geöffnet.');
  }
}

// ----------------------------------------------------------------------------
// 14. AES-256 WEB CRYPTO ENGINE (PBKDF2 100.000 + AES-GCM + PERSISTENCE)
// ----------------------------------------------------------------------------
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


function startHeartbeat() {
  const port = window.__LOCAL_PORT__ || 48123;
  setInterval(function() {
    fetch('http://127.0.0.1:' + port + '/api/heartbeat').catch(function() {});
  }, 3000);
}

function checkVaultStatus() {
  var savedVault = localStorage.getItem(STORAGE_DATA_KEY);
  var savedSalt = localStorage.getItem(STORAGE_SALT_KEY);

  // 1. Festplatten-Tresor aus Injektion
  if (window.__DISK_VAULT__ && window.__DISK_VAULT__.vault && window.__DISK_VAULT__.salt) {
    savedVault = window.__DISK_VAULT__.vault;
    savedSalt = window.__DISK_VAULT__.salt;
    try {
      localStorage.setItem(STORAGE_DATA_KEY, savedVault);
      localStorage.setItem(STORAGE_SALT_KEY, savedSalt);
    } catch(e) {}
  }

  // 2. Festplatten-Tresor per API abfragen
  var port = window.__LOCAL_PORT__ || 48123;
  try {
    fetch('http://127.0.0.1:' + port + '/api/get_vault')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.vault && data.salt) {
          localStorage.setItem(STORAGE_DATA_KEY, data.vault);
          localStorage.setItem(STORAGE_SALT_KEY, data.salt);
          window.__DISK_VAULT__ = data;
          updateLockScreenUI(false);
        }
      })
      .catch(function() {});
  } catch(e) {}

  updateLockScreenUI(!savedVault || !savedSalt);
}

function updateLockScreenUI(isFirstTime) {
  var firstTimeHint = document.getElementById('first-time-hint');
  var lockHeading = document.getElementById('lock-heading');
  var lockInstructions = document.getElementById('lock-instructions');

  if (firstTimeHint) firstTimeHint.style.display = isFirstTime ? 'block' : 'none';

  if (isFirstTime) {
    if (lockHeading) lockHeading.textContent = 'Willkommen! Neue PIN festlegen';
    if (lockInstructions) lockInstructions.textContent = 'Gib eine neue PIN oder ein Passwort ein (z. B. 1234), um deinen sicheren Datentresor auf diesem Computer zu erstellen.';
  } else {
    if (lockHeading) lockHeading.textContent = 'Sicherer AES-256 Zugang';
    if (lockInstructions) lockInstructions.textContent = 'Deine Finanzdaten sind auf diesem Computer geschützt. Bitte gib deine PIN oder dein Passwort ein:';
  }
}

function unlockApp() {
  const lockScreen = document.getElementById('lock-screen');
  const appWrapper = document.getElementById('app-wrapper');
  if (lockScreen) lockScreen.style.display = 'none';
  if (appWrapper) appWrapper.style.display = 'block';

  switchView('overview');
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

  checkVaultStatus();
  startHeartbeat();
  announceNVDA('App gesperrt.');
}

async function handleChangePin(e) {
  e.preventDefault();
  const oldPin = document.getElementById('change-old-pin').value.trim();
  const newPin = document.getElementById('change-new-pin').value.trim();

  if (!oldPin || !newPin) return;

  const storedData = localStorage.getItem(STORAGE_DATA_KEY);
  const saltBase64 = localStorage.getItem(STORAGE_SALT_KEY);

  try {
    const saltBuffer = base64ToArrayBuffer(saltBase64);
    const salt = new Uint8Array(saltBuffer);
    const oldKey = await deriveKey(oldPin, salt);

    // Entschlüsseln prüfen
    await decryptData(storedData, oldKey);

    // Neue PIN: Neuer Salt + Neuer Key
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newSaltBase64 = arrayBufferToBase64(newSalt.buffer);
    const newKey = await deriveKey(newPin, newSalt);

    cryptoKey = newKey;
    localStorage.setItem(STORAGE_SALT_KEY, newSaltBase64);
    await saveStateToEncryptedStorage();

    document.getElementById('form-change-pin').reset();
    announceNVDA('PIN erfolgreich geändert und Daten neu verschlüsselt!');
  } catch (err) {
    announceNVDA('Aktuelle PIN war nicht korrekt.', true);
  }
}

function resetAllAppData() {
  if (confirm('WARNUNG: Möchtest du wirklich ALLE deine Finanzdaten und die PIN unwiderruflich löschen?')) {
    localStorage.removeItem(STORAGE_DATA_KEY);
    localStorage.removeItem(STORAGE_SALT_KEY);
    window.__DISK_VAULT__ = null;

    cryptoKey = null;
    appState = { initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 }, transactions: [], recurring: [] };
    lockApp();
    announceNVDA('Alle Daten wurden vollständig gelöscht.');
  }
}

// ----------------------------------------------------------------------------
// 15. UNIVERSELLER BACKUP-EXPORT & -IMPORT (ALLE VERSIONEN & FORMATE)
// ----------------------------------------------------------------------------
function exportEncryptedBackup() {
  const vault = localStorage.getItem(STORAGE_DATA_KEY);
  const salt = localStorage.getItem(STORAGE_SALT_KEY);

  if (!vault || !salt) {
    announceNVDA('Keine Daten zum Sichern vorhanden.', true);
    return;
  }

  const backupObj = {
    version: '3.8.0',
    appName: 'BarrierefreieFinanzApp',
    exportedAt: new Date().toISOString(),
    salt: salt,
    vault: vault
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
  const downloadAnchor = document.createElement('a');
  const now = new Date();
  const dateStamp = now.toISOString().split('T')[0];

  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Haushaltsbuch_Sicherung_${dateStamp}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  announceNVDA('Verschlüsselte Sicherung erfolgreich heruntergeladen!');
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function uint8ArrayToBase64(uint8) {
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

async function importEncryptedBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const backupObj = JSON.parse(e.target.result);
      
      let normalizedVault = null;
      let normalizedSalt = null;
      let directState = null;

      // Format A: v2.1+ ({ salt, vault })
      if (backupObj.vault && backupObj.salt) {
        normalizedSalt = backupObj.salt;
        if (/^[0-9a-fA-F]{32}$/.test(normalizedSalt)) {
          normalizedSalt = uint8ArrayToBase64(hexToUint8Array(normalizedSalt));
        }
        normalizedVault = backupObj.vault;
      }
      // Format B: v2.0 ({ salt: hex, encryptedData: "{\"iv\":\"...\",\"data\":\"...\"}" })
      else if (backupObj.salt && backupObj.encryptedData) {
        normalizedSalt = backupObj.salt;
        if (/^[0-9a-fA-F]{32}$/.test(normalizedSalt)) {
          normalizedSalt = uint8ArrayToBase64(hexToUint8Array(normalizedSalt));
        }

        let encParsed = backupObj.encryptedData;
        if (typeof encParsed === 'string') {
          try { encParsed = JSON.parse(encParsed); } catch(err) {}
        }

        if (encParsed && encParsed.iv && encParsed.data) {
          const ivBytes = hexToUint8Array(encParsed.iv);
          const dataBytes = hexToUint8Array(encParsed.data);
          const combined = new Uint8Array(ivBytes.length + dataBytes.length);
          combined.set(ivBytes, 0);
          combined.set(dataBytes, ivBytes.length);
          normalizedVault = uint8ArrayToBase64(combined);
        }
      }
      // Format C: Direktes JSON State ({ initialBalances, transactions })
      else if (backupObj.initialBalances || backupObj.transactions) {
        directState = backupObj;
      }

      if (normalizedVault && normalizedSalt) {
        localStorage.setItem(STORAGE_DATA_KEY, normalizedVault);
        localStorage.setItem(STORAGE_SALT_KEY, normalizedSalt);

        window.__DISK_VAULT__ = { salt: normalizedSalt, vault: normalizedVault };

        // Sofortige Entschlüsselung falls eingeloggt
        if (cryptoKey) {
          try {
            const decrypted = await decryptData(normalizedVault, cryptoKey);
            appState = decrypted;
            if (!appState.initialBalances) appState.initialBalances = { bank: 0, paypal: 0, savings: 0, cash: 0 };
            if (!appState.transactions) appState.transactions = [];
            if (!appState.recurring) appState.recurring = [];

            updateOverview();
            switchView('overview');
            announceNVDA('Sicherung erfolgreich importiert und live geladen! Alle Buchungen sind sofort sichtbar.');
            return;
          } catch (err) {
            lockApp();
            announceNVDA('Sicherung importiert. Bitte gib die PIN deiner Sicherungsdatei ein.');
            return;
          }
        } else {
          announceNVDA('Sicherung importiert. Bitte mit deiner PIN entsperren.');
          lockApp();
          return;
        }
      } else if (directState) {
        appState = {
          initialBalances: directState.initialBalances || { bank: 0, paypal: 0, savings: 0, cash: 0 },
          transactions: directState.transactions || [],
          recurring: directState.recurring || []
        };
        await saveStateToEncryptedStorage();
        updateOverview();
        switchView('overview');
        announceNVDA('Finanzdaten erfolgreich importiert und gespeichert!');
        return;
      }

      announceNVDA('Fehler: Unbekanntes Dateiformat.', true);
    } catch (err) {
      console.error('Import-Fehler:', err);
      announceNVDA('Fehler beim Lesen der Backup-Datei.', true);
    }
  };
  reader.readAsText(file);
}

// ----------------------------------------------------------------------------
// 16. FORMATIERUNGS-HILFSFUNKTIONEN
// ----------------------------------------------------------------------------
function formatCurrency(num) {
  const val = Number(num || 0);
  return val.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatDateGerman(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const m = MONTH_NAMES[d.getMonth()];
  const y = d.getFullYear();
  return `${day}. ${m} ${y}`;
}

function formatAccountName(accKey) {
  const map = {
    bank: 'Bankkonto (Giro)',
    paypal: 'PayPal',
    savings: 'Tagesgeld (Sparen)',
    cash: 'Bargeld'
  };
  return map[accKey] || accKey || 'Konto';
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
