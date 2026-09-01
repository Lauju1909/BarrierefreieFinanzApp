
let currentWeekDateStr = new Date().toISOString().split('T')[0];

function getWeekBoundaries(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
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

const STORAGE_FONTSIZE_KEY = 'barrierefreie_finanzen_fontsize_v1';

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
    const monFormatted = formatDateGerman(wb.mondayStr);
    const sunFormatted = formatDateGerman(wb.sundayStr);
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

// --------------------------------------------------------------------------
// 6. DAUERAUFTRÄGE LOGIK
// --------------------------------------------------------------------------
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
    let freqLabel = 'Monatlich';
    const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
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

        // Falls bereits eingeloggt, versuche sofortige Entschlüsselung
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
            // PIN unterscheidet sich -> Lock Screen mit PIN-Abfrage
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

  // unified control bar
  const timeBar = document.getElementById('time-picker-bar');
  // unified control bar
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
  const sel = document.getElementById('settings-theme-select');
  if (sel) sel.value = saved;
}
