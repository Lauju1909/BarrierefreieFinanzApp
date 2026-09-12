/**
 * HOCHSICHERE ENDE-ZU-ENDE VERSCHLÜSSELTE SYNCHRONISATION (E2EE)
 * Barrierefreie FinanzApp (Desktop <-> Android)
 * Standard: AES-256-GCM, PBKDF2-HMAC-SHA256 (100.000 Runden), Zero-Knowledge
 */

const SyncEngine = {
  activeListener: null,
  isListening: false,
  lastSyncTime: null,

  // 1. ZUFALLS-GERÄTENAME GENERIEREN (z. B. Handy-7X49)
  getDeviceName() {
    let name = localStorage.getItem('haushaltsbuch_sync_devicename');
    if (!name) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      name = (window.__IS_ANDROID__ ? 'Handy-' : 'PC-') + suffix;
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
    const cleanCode = pairingCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
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
  async getTopicForDevice(deviceName) {
    const clean = deviceName.trim().toUpperCase();
    const hash = await this.sha256Hex('finanz_sync_' + clean);
    return 'hb_sync_' + hash.substring(0, 16);
  },

  // 5. HANDY: AUF SYNCHRONISATION LAUSCHEN (RECEIVER)
  async startListening(onStatusUpdate) {
    this.isListening = true;
    const myDevice = this.getDeviceName();
    const myCode = this.getPairingCode();
    const topic = await this.getTopicForDevice(myDevice);

    if (onStatusUpdate) onStatusUpdate('waiting', '🟢 Warte auf Synchronisations-Anfrage vom PC...');

    // Polling Loop alle 2.5 Sekunden
    const pollMessages = async () => {
      if (!this.isListening) return;
      try {
        const sinceParam = Math.floor((Date.now() - 60000) / 1000); // letzte 60s
        const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=${sinceParam}`);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const msgObj = JSON.parse(line);
              if (msgObj.event === 'message' && msgObj.message) {
                const payload = JSON.parse(msgObj.message);
                if (payload && payload.ct && payload.iv && payload.salt) {
                  // Entschlüsseln versuchen
                  const decrypted = await this.decrypt(payload, myCode);
                  if (decrypted && decrypted.type === 'SYNC_REQUEST') {
                    if (onStatusUpdate) onStatusUpdate('syncing', '⚡ Anfrage vom PC empfangen. Verschlüssle Tresordaten...');
                    await this.handleIncomingSyncRequest(decrypted, topic, myCode, onStatusUpdate);
                    break;
                  }
                }
              }
            } catch (e) {
              // Fehlgeschlagene Entschlüsselung = nicht für uns oder falscher Code
            }
          }
        }
      } catch (e) {}

      if (this.isListening) {
        setTimeout(pollMessages, 2500);
      }
    };

    pollMessages();
  },

  stopListening() {
    this.isListening = false;
  },

  async handleIncomingSyncRequest(request, topic, myCode, onStatusUpdate) {
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
      await fetch(`https://ntfy.sh/${topic}_resp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encrypted)
      });

      // 4. Falls PC neuere Daten mitgeschickt hat, diese übernehmen
      if (request.vault && request.vault.transactions) {
        await this.importSyncedVaultData(request.vault);
      }

      this.lastSyncTime = new Date();
      if (onStatusUpdate) {
        const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
        onStatusUpdate('success', `✅ Erfolgreich mit PC synchronisiert um ${timeStr}!`);
      }

      // Audio & Vibration
      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate([40, 30, 50]); } catch(e) {}
      }
    } catch (e) {
      if (onStatusUpdate) onStatusUpdate('error', 'Fehler beim Abgleich: ' + e.message);
    }
  },

  // 6. PC: SYNCHRONISATION MIT HANDY STARTEN (INITIATOR)
  async syncWithSmartphone(targetDeviceName, pairingCode, onStatusUpdate) {
    if (!targetDeviceName || !pairingCode) {
      throw new Error('Bitte Gerätename und Kopplungscode angeben!');
    }

    const topic = await this.getTopicForDevice(targetDeviceName);
    if (onStatusUpdate) onStatusUpdate('connecting', 'Verbinde mit Smartphone (' + targetDeviceName + ')...');

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

    const sendRes = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encrypted)
    });

    if (!sendRes.ok) {
      throw new Error('Verbindung zum Übertragungskanal fehlgeschlagen.');
    }

    if (onStatusUpdate) onStatusUpdate('waiting_reply', 'Signal gesendet. Warte auf verschlüsselte Antwort vom Smartphone...');

    // 3. Bis zu 25 Sekunden auf Antwort lauschen
    const startTime = Date.now();
    const sinceParam = Math.floor((startTime - 10000) / 1000);

    while (Date.now() - startTime < 25000) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const resp = await fetch(`https://ntfy.sh/${topic}_resp/json?poll=1&since=${sinceParam}`);
        if (resp.ok) {
          const text = await resp.text();
          const lines = text.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const msg = JSON.parse(line);
              if (msg.event === 'message' && msg.message) {
                const payload = JSON.parse(msg.message);
                if (payload && payload.ct && payload.iv && payload.salt) {
                  // Entschlüsseln mit dem Kopplungscode
                  const decrypted = await this.decrypt(payload, pairingCode);
                  if (decrypted && decrypted.type === 'SYNC_RESPONSE') {
                    if (onStatusUpdate) onStatusUpdate('merging', 'Antwort empfangen! Führe Tresor-Abgleich durch...');
                    
                    // Tresordaten übernehmen
                    if (decrypted.vault) {
                      await this.importSyncedVaultData(decrypted.vault);
                    }

                    this.lastSyncTime = new Date();
                    const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
                    if (onStatusUpdate) onStatusUpdate('success', `🎉 Synchronisation erfolgreich abgeschlossen (${timeStr})!`);
                    
                    if (window.navigator && window.navigator.vibrate) {
                      try { window.navigator.vibrate([50, 40, 60]); } catch(e) {}
                    }
                    return true;
                  }
                }
              }
            } catch (decErr) {}
          }
        }
      } catch (e) {}
    }

    throw new Error('Zeitüberschreitung: Das Smartphone hat nicht geantwortet. Ist die App auf dem Handy geöffnet und der Bereich "Smartphone-Sync" aktiv?');
  },

  // 7. TRESORDATEN EXPORTIEREN & IMPORTIEREN
  async exportCurrentVaultData() {
    let data = {
      exportedAt: Date.now(),
      transactions: (typeof transactions !== 'undefined') ? transactions : [],
      recurringRules: (typeof recurringRules !== 'undefined') ? recurringRules : [],
      spartoepfe: (typeof spartoepfe !== 'undefined') ? spartoepfe : [],
      accounts: (typeof accounts !== 'undefined') ? accounts : [],
      profiles: (typeof profiles !== 'undefined') ? profiles : [],
      currentProfile: (typeof currentProfile !== 'undefined') ? currentProfile : 'Standard',
      wishlist: (typeof wishlistItems !== 'undefined') ? wishlistItems : []
    };
    return data;
  },

  async importSyncedVaultData(incomingData) {
    if (!incomingData) return;

    // Transaktionen zusammenführen (anhand von ID)
    if (incomingData.transactions && Array.isArray(incomingData.transactions) && typeof transactions !== 'undefined') {
      const existingIds = new Set(transactions.map(t => t.id));
      let added = 0;
      for (const t of incomingData.transactions) {
        if (!existingIds.has(t.id)) {
          transactions.push(t);
          added++;
        }
      }
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Spartöpfe zusammenführen
    if (incomingData.spartoepfe && Array.isArray(incomingData.spartoepfe) && typeof spartoepfe !== 'undefined') {
      const existingPotIds = new Set(spartoepfe.map(p => p.id));
      for (const p of incomingData.spartoepfe) {
        if (!existingPotIds.has(p.id)) {
          spartoepfe.push(p);
        }
      }
    }

    // Konten zusammenführen
    if (incomingData.accounts && Array.isArray(incomingData.accounts) && typeof accounts !== 'undefined') {
      const existingAccIds = new Set(accounts.map(a => a.id));
      for (const a of incomingData.accounts) {
        if (!existingAccIds.has(a.id)) {
          accounts.push(a);
        }
      }
    }

    // UI aktualisieren & speichern
    if (typeof saveEverything === 'function') {
      await saveEverything();
    } else if (typeof idbSaveVault === 'function') {
      await idbSaveVault();
    }

    if (typeof renderAll === 'function') {
      renderAll();
    } else if (typeof renderOverview === 'function') {
      renderOverview();
    }
  }
};