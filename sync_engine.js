/**
 * HOCHSICHERE ENDE-ZU-ENDE VERSCHLÜSSELTE SYNCHRONISATION (E2EE)
 * Barrierefreie FinanzApp (Desktop <-> Android)
 * Standard: AES-256-GCM, PBKDF2-HMAC-SHA256 (100.000 Runden), Zero-Knowledge
 * Transport: Hochperformantes MQTT über WebSockets (WSS) mit Ausfallsicherung
 * Broker: wss://broker.emqx.io:8084/mqtt (Fallback: wss://test.mosquitto.org:8081)
 */

// =============================================================================
// MINIMALER PURE-JS MQTT 3.1.1 ÜBER WEBSOCKETS (KEINE EXTERNEN ABHÄNGIGKEITEN)
// =============================================================================
class MiniMqttClient {
  constructor(brokerUrls) {
    this.brokerUrls = Array.isArray(brokerUrls) ? brokerUrls : [brokerUrls];
    this.currentBrokerIndex = 0;
    this.ws = null;
    this.connected = false;
    this.msgId = 1;
    this.subscriptions = new Map();
    this.pingTimer = null;
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 9);
    this.shouldReconnect = false;
    this.reconnectTimer = null;
  }

  async connect(clientId) {
    if (clientId) this.clientId = clientId;
    this.shouldReconnect = true;

    for (let attempt = 0; attempt < this.brokerUrls.length; attempt++) {
      const url = this.brokerUrls[this.currentBrokerIndex];
      try {
        await this._connectSingle(url);
        return; // Erfolgreich verbunden!
      } catch (err) {
        console.warn(`[SyncEngine/Mqtt] Verbindung zu ${url} fehlgeschlagen:`, err.message);
        this.currentBrokerIndex = (this.currentBrokerIndex + 1) % this.brokerUrls.length;
      }
    }
    throw new Error('Keiner der Synchronisations-Server konnte erreicht werden.');
  }

  _connectSingle(url) {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws) {
          try { this.ws.close(); } catch(e) {}
        }

        const ws = new WebSocket(url, ['mqtt']);
        ws.binaryType = 'arraybuffer';
        this.ws = ws;

        const connTimer = setTimeout(() => {
          if (!this.connected) {
            try { ws.close(); } catch(e) {}
            reject(new Error('Timeout bei Broker-Verbindung'));
          }
        }, 5000);

        ws.onopen = () => {
          // MQTT CONNECT Packet senden (QoS 0, Clean Session)
          const cidBytes = new TextEncoder().encode(this.clientId);
          const protoName = [0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x3c]; // "MQTT", Lv4, Clean, Keepalive 60s
          const payload = [
            (cidBytes.length >> 8) & 0xff,
            cidBytes.length & 0xff,
            ...cidBytes
          ];
          const remainingLength = protoName.length + payload.length;
          const packet = new Uint8Array([0x10, remainingLength, ...protoName, ...payload]);
          ws.send(packet);
        };

        ws.onmessage = (event) => {
          const data = new Uint8Array(event.data);
          const packetType = data[0] >> 4;

          // 2 = CONNACK
          if (packetType === 2) {
            clearTimeout(connTimer);
            if (data[3] === 0) {
              this.connected = true;
              this._startPing();
              // Alle bestehenden Subscriptions erneut abonnieren (z. B. nach Reconnect)
              for (const [topic, cb] of this.subscriptions.entries()) {
                this._sendSubscribePacket(topic);
              }
              resolve();
            } else {
              reject(new Error('MQTT Verbindung abgelehnt mit Code: ' + data[3]));
            }
          }

          // 3 = PUBLISH
          if (packetType === 3) {
            let offset = 1;
            let multiplier = 1;
            let remainingLen = 0;
            let byte;
            do {
              byte = data[offset++];
              remainingLen += (byte & 0x7f) * multiplier;
              multiplier *= 128;
            } while ((byte & 0x80) !== 0);

            const topicLen = (data[offset] << 8) | data[offset + 1];
            offset += 2;
            const topic = new TextDecoder().decode(data.slice(offset, offset + topicLen));
            offset += topicLen;
            const payload = new TextDecoder().decode(data.slice(offset));

            if (this.subscriptions.has(topic)) {
              this.subscriptions.get(topic)(topic, payload);
            }
          }
        };

        ws.onerror = (e) => {
          clearTimeout(connTimer);
          if (!this.connected) {
            reject(new Error('WebSocket Netzwerkfehler'));
          }
        };

        ws.onclose = () => {
          this.connected = false;
          clearInterval(this.pingTimer);

          if (this.shouldReconnect) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              if (this.shouldReconnect) {
                this.connect().catch(() => {});
              }
            }, 3000);
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  _startPing() {
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(new Uint8Array([0xc0, 0x00])); // PINGREQ
      }
    }, 25000);
  }

  _sendSubscribePacket(topic) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const topicBytes = new TextEncoder().encode(topic);
    const packetId = this.msgId++;
    const varHeader = [(packetId >> 8) & 0xff, packetId & 0xff];
    const payload = [
      (topicBytes.length >> 8) & 0xff,
      topicBytes.length & 0xff,
      ...topicBytes,
      0x00 // QoS 0
    ];
    const remainingLength = varHeader.length + payload.length;
    const packet = new Uint8Array([0x82, remainingLength, ...varHeader, ...payload]);
    this.ws.send(packet);
  }

  subscribe(topic, callback) {
    this.subscriptions.set(topic, callback);
    this._sendSubscribePacket(topic);
  }

  unsubscribe(topic) {
    this.subscriptions.delete(topic);
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const topicBytes = new TextEncoder().encode(topic);
    const packetId = this.msgId++;
    const varHeader = [(packetId >> 8) & 0xff, packetId & 0xff];
    const payload = [
      (topicBytes.length >> 8) & 0xff,
      topicBytes.length & 0xff,
      ...topicBytes
    ];
    const remainingLength = varHeader.length + payload.length;
    const packet = new Uint8Array([0xa2, remainingLength, ...varHeader, ...payload]);
    this.ws.send(packet);
  }

  publish(topic, message) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Nicht mit dem Synchronisations-Server verbunden.');
    }
    const topicBytes = new TextEncoder().encode(topic);
    const msgBytes = new TextEncoder().encode(message);
    const remainingLength = 2 + topicBytes.length + msgBytes.length;

    const lenBytes = [];
    let x = remainingLength;
    do {
      let encodedByte = x % 128;
      x = Math.floor(x / 128);
      if (x > 0) encodedByte = encodedByte | 128;
      lenBytes.push(encodedByte);
    } while (x > 0);

    const header = [
      0x30, // PUBLISH QoS 0
      ...lenBytes,
      (topicBytes.length >> 8) & 0xff,
      topicBytes.length & 0xff,
      ...topicBytes
    ];
    const packet = new Uint8Array([...header, ...msgBytes]);
    this.ws.send(packet);
  }

  close() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingTimer);
    if (this.ws) {
      try { this.ws.close(); } catch(e) {}
    }
    this.connected = false;
    this.subscriptions.clear();
  }
}

// =============================================================================
// HAUPT-SYNCHRONISATIONS-ENGINE (E2EE + WEBSOCKET MQTT)
// =============================================================================
const SyncEngine = {
  activeListener: null,
  isListening: false,
  lastSyncTime: null,
  processedMessageIds: new Set(),
  mqttClient: null,

  // Ausfallsichere Broker-Liste über WebSockets (Standard-WSS Ports)
  BROKERS: [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081'
  ],

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
  async getTopicForDevice(deviceName) {
    const clean = (deviceName || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const hash = await this.sha256Hex('finanz_sync_' + clean);
    return 'finanzapp/v2/' + hash.substring(0, 16);
  },

  // 5. HANDY / RECEIVER: AUF SYNCHRONISATION LAUSCHEN
  async startListening(onStatusUpdate) {
    this.isListening = true;
    this.processedMessageIds.clear();

    const myDevice = this.getDeviceName();
    const myCode = this.getPairingCode();
    const topicReq = await this.getTopicForDevice(myDevice);
    const topicResp = topicReq + '_resp';

    if (onStatusUpdate) onStatusUpdate('waiting', `🟢 Warte auf Signal vom PC (Gerät: ${myDevice})...`);

    try {
      if (this.mqttClient) {
        this.mqttClient.close();
      }

      this.mqttClient = new MiniMqttClient(this.BROKERS);
      await this.mqttClient.connect('dev_' + myDevice.replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 6));

      this.mqttClient.subscribe(topicReq, async (topic, msgStr) => {
        try {
          const payload = JSON.parse(msgStr);
          if (payload && payload.ct && payload.iv && payload.salt) {
            // Mit Pairing-Code entschlüsseln
            const decrypted = await this.decrypt(payload, myCode);
            if (decrypted && decrypted.type === 'SYNC_REQUEST') {
              const msgId = decrypted.timestamp + '_' + decrypted.sender;
              if (this.processedMessageIds.has(msgId)) return;
              this.processedMessageIds.add(msgId);

              if (onStatusUpdate) onStatusUpdate('syncing', '⚡ Signal vom Computer empfangen! Sende Antwort...');
              if (typeof announceNVDA === 'function') announceNVDA('Signal vom Computer empfangen! Synchronisiere...', true);

              await this.handleIncomingSyncRequest(decrypted, topicResp, myCode, onStatusUpdate);
            }
          }
        } catch (e) {
          // Falscher Code oder nicht für dieses Gerät bestimmtes Paket
        }
      });

      if (onStatusUpdate) onStatusUpdate('waiting', `🟢 Bereit für Synchronisation (Gerät: ${myDevice})`);
    } catch (err) {
      console.warn('[SyncEngine] startListening Verbindungsfehler:', err.message);
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Verbindung wird aufgebaut... (Offline-Modus aktiv)');
    }
  },

  stopListening() {
    this.isListening = false;
    if (this.mqttClient) {
      this.mqttClient.close();
      this.mqttClient = null;
    }
  },

  async handleIncomingSyncRequest(request, topicResp, myCode, onStatusUpdate) {
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

      // 3. Antwort an Response-Topic senden (in Echtzeit via WebSocket)
      if (this.mqttClient && this.mqttClient.connected) {
        this.mqttClient.publish(topicResp, JSON.stringify(encrypted));
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

      // Vibration (Haptisches Feedback auf dem Smartphone)
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

    const cleanTargetName = targetDeviceName.trim();
    const cleanPairCode = pairingCode.trim();
    const topicReq = await this.getTopicForDevice(cleanTargetName);
    const topicResp = topicReq + '_resp';

    if (onStatusUpdate) onStatusUpdate('connecting', `🔗 Verbinde mit Smartphone (${cleanTargetName})...`);
    if (typeof announceNVDA === 'function') announceNVDA(`Verbinde mit Smartphone ${cleanTargetName}...`, true);

    // 1. Temporären Initiator-Client verbinden
    const client = new MiniMqttClient(this.BROKERS);
    await client.connect('pc_init_' + Math.random().toString(36).substring(2, 7));

    // 2. Auf Antwort vorbereiten
    let responseReceived = false;

    const responsePromise = new Promise((resolve, reject) => {
      // 15 Sekunden Timeout
      const timer = setTimeout(() => {
        if (!responseReceived) {
          client.close();
          reject(new Error('Das Smartphone hat nicht geantwortet. Bitte stelle sicher, dass die App auf dem Smartphone geöffnet ist und Gerätename & Code übereinstimmen.'));
        }
      }, 15000);

      client.subscribe(topicResp, async (topic, msgStr) => {
        try {
          const payload = JSON.parse(msgStr);
          if (payload && payload.ct && payload.iv && payload.salt) {
            const decrypted = await this.decrypt(payload, cleanPairCode);
            if (decrypted && decrypted.type === 'SYNC_RESPONSE') {
              responseReceived = true;
              clearTimeout(timer);
              resolve(decrypted);
            }
          }
        } catch (e) {
          // Falsches Paket oder Entschlüsselungsfehler
        }
      });
    });

    // Kurz warten, bis Subscription beim Broker registriert ist (~200ms)
    await new Promise(r => setTimeout(r, 250));

    if (onStatusUpdate) onStatusUpdate('waiting_reply', '📡 Sende verschlüsselte Daten an Smartphone...');
    if (typeof announceNVDA === 'function') announceNVDA('Sende Daten an Smartphone. Warte auf Antwort...', true);

    // 3. Eigene Tresordaten exportieren und Anfrage senden
    const localVault = await this.exportCurrentVaultData();
    const requestPayload = {
      type: 'SYNC_REQUEST',
      timestamp: Date.now(),
      sender: this.getDeviceName(),
      vault: localVault
    };

    const encryptedReq = await this.encrypt(requestPayload, cleanPairCode);
    client.publish(topicReq, JSON.stringify(encryptedReq));

    if (onStatusUpdate) onStatusUpdate('waiting_reply', '⚡ Signal übertragen. Warte auf Bestätigung vom Smartphone...');

    // 4. Antwort abwarten
    const response = await responsePromise;
    client.close(); // Temporären Client schließen

    if (onStatusUpdate) onStatusUpdate('syncing', '📦 Antwort empfangen. Aktualisiere lokale Daten...');

    // 5. Empfangene Daten in lokalen Tresor mergen
    if (response.vault) {
      await this.importSyncedVaultData(response.vault, onStatusUpdate);
    }

    this.lastSyncTime = new Date();
    const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
    if (onStatusUpdate) onStatusUpdate('success', `✅ Synchronisation erfolgreich abgeschlossen um ${timeStr}!`);
    if (typeof announceNVDA === 'function') announceNVDA('Synchronisation mit Smartphone erfolgreich abgeschlossen!', true);

    // Vibration / Feedback
    if (window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate([40, 30, 60]); } catch(e) {}
    }
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
            const successNotice = `🎉 Synchronisation erfolgreich! ${txCount} Buchungen vom Computer geladen. Deine Start-PIN lautet 1234.`;
            if (typeof announceNVDA === 'function') announceNVDA(successNotice, true);
            const banner = document.getElementById('lock-sync-status');
            if (banner) {
              banner.textContent = '✅ ' + successNotice;
              banner.style.color = '#15803d';
              banner.style.background = 'rgba(76, 175, 80, 0.15)';
            }
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

// Global bereitstellen
if (typeof window !== 'undefined') {
  window.SyncEngine = SyncEngine;
}
