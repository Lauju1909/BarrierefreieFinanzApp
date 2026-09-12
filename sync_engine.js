/**
 * HOCHSICHERE ENDE-ZU-ENDE VERSCHLÜSSELTE SYNCHRONISATION (E2EE)
 * Barrierefreie FinanzApp (Desktop <-> Android)
 * Standard: AES-256-GCM, PBKDF2-HMAC-SHA256 (100.000 Runden), Zero-Knowledge
 * Relay: Hochverfügbarer ntfy-Cluster (ntfy.envs.net) ohne IP-Rate-Limits
 */

const SyncEngine = {
  activeListener: null,
  isListening: false,
  lastSyncTime: null,
  processedMessageIds: new Set(),

  // Primärer Relay-Server (stabil, ohne 429-Rate-Limits) & Fallbacks
  RELAYS: [
    'https://ntfy.envs.net',
    'https://ntfy.org'
  ],

  getPrimaryRelay() {
    return this.RELAYS[0];
  },

  // 1. ZUFALLS-GERÄTENAME GENERIEREN (z. B. Handy-7X49)
  getDeviceName() {
    let name = localStorage.getItem('haushaltsbuch_sync_devicename');
    if (!name) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const isAndroid = !!window.__IS_ANDROID__ || 
                        (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
                        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      name = (isAndroid ? 'Handy-' : 'PC-') + suffix;
      localStorage.setItem('haushaltsbuch_sync_devicename', name);
    }
    return name;
  },

  setDeviceName(newName) {
    if (newName && newName.trim()) {
      localStorage.setItem('haushaltsbuch_sync_devicename', newName.trim());
    }
  },

  // 2. KOPPLUNGSCODE GENERIEREN (z. B. 682-419)
  getPairingCode() {
    let code = localStorage.getItem('haushaltsbuch_sync_code');
    if (!code) {
      code = this.generateNewPairingCode();
    }
    return code;
  },

  generateNewPairingCode() {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    const code = `${p1}-${p2}`;
    localStorage.setItem('haushaltsbuch_sync_code', code);
    return code;
  },

  // 3. KRYPTOGRAPHISCHE PRIMITIVE (WEB CRYPTO API)
  async sha256Hex(str) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(str));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async deriveKey(pairingCode, saltBytes) {
    // Vollständige Bereinigung: Nur Ziffern und Buchstaben, Großbuchstaben
    const cleanCode = (pairingCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(cleanCode),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  async encrypt(dataObj, pairingCode) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(pairingCode, salt);

    const enc = new TextEncoder();
    const plaintext = enc.encode(JSON.stringify(dataObj));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      plaintext
    );

    const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return {
      salt: toHex(salt),
      iv: toHex(iv),
      ct: toHex(ciphertext)
    };
  },

  async decrypt(payload, pairingCode) {
    const fromHex = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const salt = fromHex(payload.salt);
    const iv = fromHex(payload.iv);
    const ciphertext = fromHex(payload.ct);

    const key = await this.deriveKey(pairingCode, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  },

  // 4. TOPIC FÜR GERÄT BERECHNEN (Zero-Knowledge: SHA-256 Hash)
  // Wichtig: Robuste Normalisierung (Leerzeichen, Bindestriche, Groß-/Kleinschreibung ignorieren)
  async getTopicForDevice(deviceName) {
    const clean = (deviceName || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const hash = await this.sha256Hex('finanz_sync_' + clean);
    return 'hb_sync_' + hash.substring(0, 16);
  },

  // 5. HANDY / RECEIVER: AUF SYNCHRONISATION LAUSCHEN
  async startListening(onStatusUpdate) {
    this.isListening = true;
    this.processedMessageIds.clear();
    const myDevice = this.getDeviceName();
    const myCode = this.getPairingCode();
    const topic = await this.getTopicForDevice(myDevice);
    const relay = this.getPrimaryRelay();

    if (onStatusUpdate) onStatusUpdate('waiting', `🟢 Warte auf Signal vom PC (Gerät: ${myDevice})...`);

    const pollMessages = async () => {
      if (!this.isListening) return;
      try {
        // Fragt die letzten Meldungen der letzten 5 Minuten ab
        const res = await fetch(`${relay}/${topic}/json?poll=1&since=5m`);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const msgObj = JSON.parse(line);
              if (msgObj.event === 'message' && msgObj.message && msgObj.id) {
                if (this.processedMessageIds.has(msgObj.id)) {
                  continue; // bereits verarbeitet
                }

                let payload;
                try { payload = JSON.parse(msgObj.message); } catch(e) {}
                if (payload && payload.ct && payload.iv && payload.salt) {
                  // Entschlüsseln mit dem Pairing-Code
                  const decrypted = await this.decrypt(payload, myCode);
                  if (decrypted && decrypted.type === 'SYNC_REQUEST') {
                    this.processedMessageIds.add(msgObj.id);
                    if (onStatusUpdate) onStatusUpdate('syncing', '⚡ Signal vom Computer empfangen! Sende Antwort...');
                    if (typeof announceNVDA === 'function') announceNVDA('Signal vom Computer empfangen! Synchronisiere Daten...', true);

                    await this.handleIncomingSyncRequest(decrypted, topic, myCode, relay, onStatusUpdate);
                    break;
                  }
                }
              }
            } catch (e) {
              // Falscher Code oder nicht für uns
            }
          }
        }
      } catch (e) {
        console.warn('[SyncEngine] Poll network error:', e.message);
      }

      if (this.isListening) {
        setTimeout(pollMessages, 2000);
      }
    };

    pollMessages();
  },

  stopListening() {
    this.isListening = false;
  },

  async handleIncomingSyncRequest(request, topic, myCode, relay, onStatusUpdate) {
    try {
      // 1. Lokale Tresordaten auslesen
      const vaultData = await this.exportCurrentVaultData();

      // 2. Antwortpaket verschlüsseln
      const responsePayload = {
        type: 'SYNC_RESPONSE',
        timestamp: Date.now(),
        sender: this.getDeviceName(),
        vault: vaultData
      };
      const encrypted = await this.encrypt(responsePayload, myCode);

      // 3. Antwort an Response-Topic senden
      const respRes = await fetch(`${relay}/${topic}_resp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encrypted)
      });

      if (!respRes.ok) {
        console.warn('[SyncEngine] Failed to post response to relay:', respRes.status);
      }

      // 4. Falls PC neuere Daten mitgeschickt hat, diese übernehmen
      if (request.vault) {
        await this.importSyncedVaultData(request.vault, onStatusUpdate);
      }

      this.lastSyncTime = new Date();
      if (onStatusUpdate) {
        const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
        onStatusUpdate('success', `✅ Erfolgreich mit PC synchronisiert um ${timeStr}!`);
      }
      if (typeof announceNVDA === 'function') {
        announceNVDA('Synchronisation mit Computer erfolgreich abgeschlossen!', true);
      }

      // Vibration
      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate([50, 40, 60]); } catch(e) {}
      }
    } catch (e) {
      console.error('[SyncEngine] handleIncomingSyncRequest error:', e);
      if (onStatusUpdate) onStatusUpdate('error', '❌ Fehler beim Abgleich: ' + e.message);
    }
  },

  // 6. PC: SYNCHRONISATION MIT HANDY STARTEN (INITIATOR)
  async syncWithSmartphone(targetDeviceName, pairingCode, onStatusUpdate) {
    if (!targetDeviceName || !pairingCode) {
      throw new Error('Bitte Gerätename und Kopplungscode angeben!');
    }

    const topic = await this.getTopicForDevice(targetDeviceName);
    const relay = this.getPrimaryRelay();

    if (onStatusUpdate) onStatusUpdate('connecting', `🔗 Verbinde mit Smartphone (${targetDeviceName.trim()})...`);
    if (typeof announceNVDA === 'function') announceNVDA(`Verbinde mit Smartphone ${targetDeviceName.trim()}...`, true);

    // 1. Eigene Tresordaten vorbereiten
    const localVault = await this.exportCurrentVaultData();

    // 2. Verschlüsselte Anfrage senden
    const requestPayload = {
      type: 'SYNC_REQUEST',
      timestamp: Date.now(),
      sender: this.getDeviceName(),
      vault: localVault
    };

    const encrypted = await this.encrypt(requestPayload, pairingCode);

    const sendRes = await fetch(`${relay}/${topic}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encrypted)
    });

    if (!sendRes.ok) {
      throw new Error('Verbindung zum Übertragungskanal fehlgeschlagen (HTTP ' + sendRes.status + ').');
    }

    if (onStatusUpdate) onStatusUpdate('waiting_reply', '📡 Signal an Smartphone gesendet. Warte auf verschlüsselte Antwort...');
    if (typeof announceNVDA === 'function') announceNVDA('Signal an Smartphone gesendet. Warte auf Antwort...', true);

    // 3. Bis zu 35 Sekunden auf Antwort lauschen
    const startTime = Date.now();
    const seenResponseIds = new Set();

    while (Date.now() - startTime < 35000) {
      await new Promise(r => setTimeout(r, 1500));
      try {
        const resp = await fetch(`${relay}/${topic}_resp/json?poll=1&since=5m`);
        if (resp.ok) {
          const text = await resp.text();
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const msg = JSON.parse(line);
              if (msg.event === 'message' && msg.message && msg.id) {
                if (seenResponseIds.has(msg.id)) continue;
                seenResponseIds.add(msg.id);

                let payload;
                try { payload = JSON.parse(msg.message); } catch(e) {}
                if (payload && payload.ct && payload.iv && payload.salt) {
                  // Entschlüsseln mit dem Kopplungscode
                  const decrypted = await this.decrypt(payload, pairingCode);
                  if (decrypted && decrypted.type === 'SYNC_RESPONSE') {
                    if (onStatusUpdate) onStatusUpdate('merging', '🔄 Antwort vom Smartphone empfangen! Führe Datenabgleich durch...');
                    if (typeof announceNVDA === 'function') announceNVDA('Antwort vom Smartphone empfangen! Führe Datenabgleich durch...', true);

                    // Tresordaten übernehmen
                    if (decrypted.vault) {
                      await this.importSyncedVaultData(decrypted.vault, onStatusUpdate);
                    }

                    this.lastSyncTime = new Date();
                    const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
                    const finishMsg = `🎉 Synchronisation erfolgreich abgeschlossen um ${timeStr}!`;
                    if (onStatusUpdate) onStatusUpdate('success', finishMsg);
                    if (typeof announceNVDA === 'function') announceNVDA(finishMsg, true);

                    if (window.navigator && window.navigator.vibrate) {
                      try { window.navigator.vibrate([50, 40, 60]); } catch(e) {}
                    }
                    return true;
                  }
                }
              }
            } catch (decErr) {
              // Falscher Code oder fremde Nachricht
            }
          }
        }
      } catch (e) {}
    }

    throw new Error('Zeitüberschreitung (35s): Das Smartphone hat nicht geantwortet. Bitte stelle sicher, dass die App auf dem Handy geöffnet ist und der Gerätename sowie der Kopplungscode exakt übereinstimmen.');
  },

  // 7. TRESORDATEN EXPORTIEREN
  async exportCurrentVaultData() {
    if (typeof appState !== 'undefined' && appState !== null) {
      return {
        exportedAt: Date.now(),
        appState: JSON.parse(JSON.stringify(appState)),
        transactions: appState.transactions || [],
        accounts: appState.accounts || [],
        wishlist: appState.wishlist || [],
        recurring: appState.recurring || []
      };
    }

    return {
      exportedAt: Date.now(),
      transactions: (typeof transactions !== 'undefined') ? transactions : [],
      recurringRules: (typeof recurringRules !== 'undefined') ? recurringRules : [],
      spartoepfe: (typeof spartoepfe !== 'undefined') ? spartoepfe : [],
      accounts: (typeof accounts !== 'undefined') ? accounts : [],
      profiles: (typeof profiles !== 'undefined') ? profiles : [],
      currentProfile: (typeof currentProfile !== 'undefined') ? currentProfile : 'Standard',
      wishlist: (typeof wishlistItems !== 'undefined') ? wishlistItems : []
    };
  },

  // 8. TRESORDATEN IMPORTIEREN — Funktioniert immer (auch ohne PIN / bei Erststart!)
  async importSyncedVaultData(incomingData, onStatusUpdate) {
    if (!incomingData) return;

    try {
      const incoming = incomingData.appState || incomingData;

      const isUnlocked = typeof cryptoKey !== 'undefined' && cryptoKey !== null;
      const hasVaultOnDisk = !!(localStorage.getItem('haushaltsbuch_vault_data') || (window.__DISK_VAULT__ && window.__DISK_VAULT__.vault));

      // FALL 1: ERSTSTART (Kein Tresor auf Gerät, noch keine PIN eingerichtet)
      if (!isUnlocked && !hasVaultOnDisk) {
        if (onStatusUpdate) onStatusUpdate('syncing', '📦 Erstelle neuen Tresor aus den Computer-Daten...');

        const pinInputEl = document.getElementById('pin-input');
        const chosenPin = (pinInputEl && pinInputEl.value.trim()) ? pinInputEl.value.trim() : '1234';

        const newAppState = {
          accounts: (incoming.accounts && incoming.accounts.length) ? incoming.accounts : [
            { id: 'bank', name: 'Girokonto (Bank)', type: 'giro', initialBalance: 0, isDefault: true },
            { id: 'cash', name: 'Bargeld (Geldbeutel)', type: 'cash', initialBalance: 0, isDefault: false },
            { id: 'savings', name: 'Tagesgeld / Sparkonto', type: 'savings', initialBalance: 0, isDefault: false },
            { id: 'paypal', name: 'PayPal Guthaben', type: 'paypal', initialBalance: 0, isDefault: false }
          ],
          initialBalances: incoming.initialBalances || { bank: 0, paypal: 0, savings: 0, cash: 0 },
          transactions: incoming.transactions || incomingData.transactions || [],
          recurring: incoming.recurring || incomingData.recurring || [],
          budgets: incoming.budgets || {},
          customCategories: incoming.customCategories || { exp: {}, inc: {}, trf: {} },
          wishlist: incoming.wishlist || incomingData.wishlist || []
        };

        if (typeof deriveKey === 'function' && typeof arrayBufferToBase64 === 'function') {
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const saltBase64 = arrayBufferToBase64(salt.buffer);
          currentSaltBase64 = saltBase64;
          localStorage.setItem('haushaltsbuch_vault_salt', saltBase64);

          cryptoKey = await deriveKey(chosenPin, salt);
          appState = newAppState;

          if (typeof saveStateToEncryptedStorage === 'function') {
            await saveStateToEncryptedStorage();
          }

          if (typeof unlockApp === 'function') {
            unlockApp();
          }

          const txCount = appState.transactions ? appState.transactions.length : 0;
          const msg = `Synchronisation erfolgreich! ${txCount} Buchungen geladen.`;
          if (typeof announceNVDA === 'function') announceNVDA(msg, true);
          if (onStatusUpdate) onStatusUpdate('success', '🎉 ' + msg);

          if (!pinInputEl || !pinInputEl.value.trim()) {
            setTimeout(() => {
              alert(`🎉 Synchronisation erfolgreich!\n\n${txCount} Buchungen vom Computer geladen.\n\nDeine Start-PIN lautet: 1234\n(Kann jederzeit in den Einstellungen geändert werden)`);
            }, 300);
          }
          return;
        }
      }

      // FALL 2: GERÄT IST GESPERRT, ABER HAT BEREITS EINEN TRESOR (Warte auf PIN-Eingabe)
      if (!isUnlocked && hasVaultOnDisk) {
        window.__PENDING_SYNC_DATA__ = incomingData;
        const msg = 'Daten empfangen! Bitte gib oben deine PIN ein, um die App zu öffnen.';
        if (typeof announceNVDA === 'function') announceNVDA(msg, true);
        if (onStatusUpdate) onStatusUpdate('waiting_pin', '🔑 ' + msg);
        const lockStatusEl = document.getElementById('lock-sync-status');
        if (lockStatusEl) lockStatusEl.textContent = '✅ ' + msg;
        return;
      }

      // FALL 3: GERÄT IST ENTSPERRT -> DATEN DIREKT MERGEN
      if (typeof appState !== 'undefined' && appState !== null) {
        if (!Array.isArray(appState.transactions)) appState.transactions = [];
        const existingTxIds = new Set(appState.transactions.map(t => String(t.id)));
        let addedTx = 0;

        const incomingTx = incoming.transactions || incomingData.transactions || [];
        for (const t of incomingTx) {
          if (t && t.id && !existingTxIds.has(String(t.id))) {
            appState.transactions.push(t);
            existingTxIds.add(String(t.id));
            addedTx++;
          }
        }
        if (addedTx > 0) {
          appState.transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        }

        // Konten
        if (!Array.isArray(appState.accounts)) appState.accounts = [];
        const existingAccIds = new Set(appState.accounts.map(a => String(a.id)));
        const incomingAcc = incoming.accounts || incomingData.accounts || [];
        for (const a of incomingAcc) {
          if (a && a.id && !existingAccIds.has(String(a.id))) {
            appState.accounts.push(a);
            existingAccIds.add(String(a.id));
          }
        }

        // Wunschliste
        if (!Array.isArray(appState.wishlist)) appState.wishlist = [];
        const existingWishIds = new Set(appState.wishlist.map(w => String(w.id)));
        const incomingWish = incoming.wishlist || incomingData.wishlist || [];
        for (const w of incomingWish) {
          if (w && w.id && !existingWishIds.has(String(w.id))) {
            appState.wishlist.push(w);
            existingWishIds.add(String(w.id));
          }
        }

        // Daueraufträge
        if (!Array.isArray(appState.recurring)) appState.recurring = [];
        const existingRecIds = new Set(appState.recurring.map(r => String(r.id)));
        const incomingRec = incoming.recurring || incomingData.recurring || [];
        for (const r of incomingRec) {
          if (r && r.id && !existingRecIds.has(String(r.id))) {
            appState.recurring.push(r);
            existingRecIds.add(String(r.id));
          }
        }

        // Speichern
        if (typeof saveStateToEncryptedStorage === 'function') {
          await saveStateToEncryptedStorage();
        }

        // UI aktualisieren
        if (typeof updateOverview === 'function') updateOverview();
        if (typeof renderAccountsViewList === 'function') renderAccountsViewList();
        if (typeof renderOverviewCreditAccordion === 'function') renderOverviewCreditAccordion();
      }

    } catch (err) {
      console.error('[SyncEngine] importSyncedVaultData error:', err);
      throw new Error('Abgleich fehlgeschlagen: ' + err.message);
    }
  }
};
