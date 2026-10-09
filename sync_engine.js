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

            for (const [subPattern, callback] of this.subscriptions.entries()) {
              if (this._matchesTopic(subPattern, topic)) {
                try {
                  callback(topic, payload);
                } catch (e) {
                  console.warn('[MiniMqttClient] Sub callback error:', e);
                }
              }
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

  _matchesTopic(pattern, topic) {
    if (pattern === topic) return true;
    if (pattern.endsWith('/#')) {
      const prefix = pattern.slice(0, -2);
      return topic === prefix || topic.startsWith(prefix + '/');
    }
    if (pattern === '#') return true;
    if (pattern.includes('+')) {
      const pParts = pattern.split('/');
      const tParts = topic.split('/');
      if (pParts.length !== tParts.length) return false;
      for (let i = 0; i < pParts.length; i++) {
        if (pParts[i] !== '+' && pParts[i] !== tParts[i]) return false;
      }
      return true;
    }
    return false;
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

  publish(topic, message, retain = false) {
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

    const firstByte = retain ? 0x31 : 0x30; // 0x31 = PUBLISH QoS 0 mit RETAIN-Flag
    const header = [
      firstByte,
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
  isImporting: false,
  mailboxPushTimer: null,
  isCheckingMailbox: false,
  isPostingMailbox: false,
  mailboxListenerActive: false,

  // Ausfallsichere Broker-Liste über WebSockets (Standard-WSS Ports)
  BROKERS: [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081'
  ],

  getActivePairingCode() {
    return localStorage.getItem('haushaltsbuch_sync_connected_code') || 
           localStorage.getItem('haushaltsbuch_sync_code') || 
           (window.__PAIRED_DEVICE__ && window.__PAIRED_DEVICE__.code) || 
           null;
  },

  isPaired() {
    return !!localStorage.getItem('haushaltsbuch_sync_connected') || 
           !!localStorage.getItem('haushaltsbuch_sync_connected_code') || 
           (window.__PAIRED_DEVICE__ && !!window.__PAIRED_DEVICE__.code);
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
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const buf = new Uint8Array(12);
    crypto.getRandomValues(buf);
    let raw = '';
    for (let i = 0; i < 12; i++) {
      raw += chars[buf[i] % chars.length];
    }
    const code = `${raw.substring(0, 4)}-${raw.substring(4, 8)}-${raw.substring(8, 12)}`;
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

  // 4b. ASYNCHRONES E2E-POSTFACH TOPIC (Zero-Knowledge: SHA-256 aus Pairing-Code)
  async getMailboxTopic(pairingCode, deviceName = null) {
    const code = (pairingCode || this.getActivePairingCode() || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!code) return null;
    const hash = await this.sha256Hex('finanz_mailbox_' + code);
    const base = 'finanzapp/v2/mailbox/' + hash.substring(0, 24);
    if (deviceName) {
      const cleanDev = String(deviceName).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${base}/${cleanDev}`;
    }
    return base;
  },

  // 5. HANDY / RECEIVER: AUF SYNCHRONISATION LAUSCHEN
  async startListening(onStatusUpdate) {
    this.isListening = true;
    this.processedMessageIds.clear();

    const myDevice = this.getDeviceName();
    const myCode = this.getPairingCode();
    const topicReq = await this.getTopicForDevice(myDevice);
    const topicResp = topicReq + '_resp';
    const boxTopic = await this.getMailboxTopic(myCode);

    if (onStatusUpdate) onStatusUpdate('waiting', `🟢 Warte auf Signal vom PC (Gerät: ${myDevice})...`);

    try {
      if (this.mqttClient) {
        this.mqttClient.close();
      }

      this.mqttClient = new MiniMqttClient(this.BROKERS);
      await this.mqttClient.connect('dev_' + myDevice.replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 6));

      // 1. Live-Sync Kanal
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

      // 2. Asynchrones E2E-Postfach abonnieren (empfängt auch Retained Messages, falls PC längst aus ist!)
      if (boxTopic) {
        const handleMailbox = async (topic, msgStr) => {
          try {
            const payload = JSON.parse(msgStr);
            if (payload && payload.ct && payload.iv && payload.salt) {
              const decrypted = await this.decrypt(payload, myCode);
              if (decrypted && decrypted.type === 'MAILBOX_UPDATE') {
                await this.handleIncomingMailboxUpdate(decrypted, onStatusUpdate);
              }
            }
          } catch (e) {
            // Ignorieren
          }
        };
        this.mqttClient.subscribe(boxTopic, handleMailbox);
        this.mqttClient.subscribe(boxTopic + '/#', handleMailbox);
      }

      if (onStatusUpdate) onStatusUpdate('waiting', `🟢 Bereit für Synchronisation & Postfach aktiv (Gerät: ${myDevice})`);
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
      localStorage.setItem('haushaltsbuch_sync_connected', 'true');
      localStorage.setItem('haushaltsbuch_sync_connected_device', request.sender || 'Computer');
      if (myCode) {
        localStorage.setItem('haushaltsbuch_sync_connected_code', myCode);
      }
      localStorage.setItem('haushaltsbuch_sync_connected_time', new Date().toLocaleDateString('de-DE') + ' um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
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
      // 10 Sekunden Timeout für Live-Handshake
      const timer = setTimeout(async () => {
        if (!responseReceived) {
          client.close();
          // Automatischer Fallback in das asynchrone E2E-Postfach!
          try {
            if (onStatusUpdate) onStatusUpdate('syncing', '📬 Smartphone antwortet gerade nicht. Hinterlege Daten versiegelt im Postfach...');
            await this.postToMailbox(onStatusUpdate, false);
            const msg = `📬 Smartphone ist gerade offline. Deine Daten wurden versiegelt im Postfach hinterlegt und werden automatisch geladen, sobald das Smartphone gestartet wird!`;
            if (onStatusUpdate) onStatusUpdate('success', msg);
            if (typeof announceNVDA === 'function') announceNVDA(msg, true);
            resolve({ type: 'MAILBOX_SAVED', vault: null });
          } catch(boxErr) {
            reject(new Error('Das Smartphone ist offline und das Postfach konnte nicht erreicht werden: ' + boxErr.message));
          }
        }
      }, 10000);

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

    // Falls reguläre Antwort empfangen wurde: Daten mergen
    if (response && response.type === 'SYNC_RESPONSE' && response.vault) {
      if (onStatusUpdate) onStatusUpdate('syncing', '📦 Antwort empfangen. Aktualisiere lokale Daten...');
      await this.importSyncedVaultData(response.vault, onStatusUpdate);
    }

    this.lastSyncTime = new Date();
    localStorage.setItem('haushaltsbuch_sync_connected', 'true');
    localStorage.setItem('haushaltsbuch_sync_connected_device', cleanTargetName);
    localStorage.setItem('haushaltsbuch_sync_connected_code', cleanPairCode);
    localStorage.setItem('haushaltsbuch_sync_connected_time', new Date().toLocaleDateString('de-DE') + ' um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
    
    // Auch Postfach aktualisieren, damit immer der neueste Stand im Briefkasten liegt
    this.scheduleMailboxPush();

    // An den lokalen Desktop-Server senden zur dauerhaften Speicherung in Haushaltsbuch_Kopplung.json
    try {
      const port = window.__LOCAL_PORT__ || 48123;
      const headers = (typeof getVaultApiHeaders === 'function') ? getVaultApiHeaders({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' };
      fetch(`http://127.0.0.1:${port}/api/save_pairing`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          device: cleanTargetName,
          code: cleanPairCode,
          time: localStorage.getItem('haushaltsbuch_sync_connected_time')
        })
      }).catch(() => {});
    } catch(e) {}

    if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
    const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
    if (response && response.type === 'SYNC_RESPONSE') {
      if (onStatusUpdate) onStatusUpdate('success', `✅ Synchronisation erfolgreich abgeschlossen um ${timeStr}!`);
      if (typeof announceNVDA === 'function') announceNVDA('Synchronisation mit Smartphone erfolgreich abgeschlossen!', true);
    }

    // Vibration / Feedback
    if (window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate([40, 30, 60]); } catch(e) {}
    }
  },

  // 6b. ASYNCHRONES E2E-POSTFACH: DATEN IM BRIEFKASTEN HINTERLEGEN (RETAINED)
  async postToMailbox(onStatusUpdate, isManual = false) {
    const code = this.getActivePairingCode();
    if (!code) {
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Noch kein Kopplungscode vorhanden.');
      return false;
    }

    if (this.isPostingMailbox) return false;
    this.isPostingMailbox = true;

    try {
      const baseTopic = await this.getMailboxTopic(code);
      if (!baseTopic) return false;

      const myDevice = this.getDeviceName();
      const devTopic = await this.getMailboxTopic(code, myDevice);
      const timestamp = Date.now();
      const vaultData = await this.exportCurrentVaultData();

      const envelope = {
        type: 'MAILBOX_UPDATE',
        version: 2,
        timestamp: timestamp,
        sender: myDevice,
        vault: vaultData
      };

      const encrypted = await this.encrypt(envelope, code);
      const payloadStr = JSON.stringify(encrypted);

      localStorage.setItem('haushaltsbuch_last_sent_mailbox_ts', String(timestamp));

      // Verwende bestehenden Client oder erstelle einen kurzlebigen Sender
      let client = this.mqttClient;
      let needClose = false;
      if (!client || !client.connected) {
        client = new MiniMqttClient(this.BROKERS);
        await client.connect('box_pub_' + Math.random().toString(36).substring(2, 7));
        needClose = true;
      }

      client.publish(devTopic, payloadStr, true); // retain = true (0x31)
      client.publish(baseTopic, payloadStr, true); // retain = true (0x31)

      if (needClose) {
        setTimeout(() => {
          try { client.close(); } catch(e) {}
        }, 1000);
      }

      const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('haushaltsbuch_sync_connected_time', new Date().toLocaleDateString('de-DE') + ' um ' + timeStr);
      localStorage.setItem('haushaltsbuch_mailbox_last_sync', timeStr);

      if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
      if (onStatusUpdate) onStatusUpdate('success', `📬 Daten versiegelt im Postfach hinterlegt (Stand: ${timeStr})!`);
      if (isManual && typeof announceNVDA === 'function') {
        announceNVDA('Finanzdaten erfolgreich im verschlüsselten Postfach hinterlegt!', true);
      }
      return true;
    } catch (err) {
      console.warn('[SyncEngine] postToMailbox error:', err);
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Postfach-Aktualisierung: ' + err.message);
      return false;
    } finally {
      this.isPostingMailbox = false;
    }
  },

  scheduleMailboxPush() {
    if (this.isImporting) return; // Nicht während eines laufenden Imports zurückfeuern
    if (!this.isPaired()) return;
    clearTimeout(this.mailboxPushTimer);
    this.mailboxPushTimer = setTimeout(() => {
      this.postToMailbox(null, false).catch(() => {});
    }, 800);
  },

  // 6c. ASYNCHRONES E2E-POSTFACH: BRIEFKASTEN PRÜFEN & NEUE DATEN ABHOLEN
  async checkMailbox(onStatusUpdate, isManual = false) {
    const code = this.getActivePairingCode();
    if (!code) {
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Noch kein Kopplungscode vorhanden.');
      return false;
    }

    if (this.isCheckingMailbox) return false;
    this.isCheckingMailbox = true;

    try {
      const baseTopic = await this.getMailboxTopic(code);
      if (!baseTopic) return false;

      if (onStatusUpdate) onStatusUpdate('connecting', '📬 Prüfe verschlüsseltes Postfach auf neue Daten...');

      let client = this.mqttClient;
      if (!client || !client.connected) {
        client = new MiniMqttClient(this.BROKERS);
        this.mqttClient = client;
        await client.connect('box_sub_' + Math.random().toString(36).substring(2, 7));
      }

      let updateFound = false;
      const onMailboxMsg = async (recvTopic, msgStr) => {
        try {
          const payload = JSON.parse(msgStr);
          if (payload && payload.ct && payload.iv && payload.salt) {
            const decrypted = await this.decrypt(payload, code);
            if (decrypted && decrypted.type === 'MAILBOX_UPDATE') {
              updateFound = true;
              await this.handleIncomingMailboxUpdate(decrypted, onStatusUpdate);
            }
          }
        } catch (e) {
          console.warn('[SyncEngine] Fehler beim Entschlüsseln der Postfach-Nachricht:', e.message);
        }
      };

      client.subscribe(baseTopic, onMailboxMsg);
      client.subscribe(baseTopic + '/#', onMailboxMsg);

      if (isManual) {
        if (typeof announceNVDA === 'function') {
          announceNVDA('Postfach wird auf neue Daten geprüft...', true);
        }
        setTimeout(() => {
          if (!updateFound && onStatusUpdate) {
            const lastSync = localStorage.getItem('haushaltsbuch_mailbox_last_sync');
            const info = lastSync ? ` (Zuletzt synchronisiert: ${lastSync})` : '';
            onStatusUpdate('success', `✅ Postfach ist auf dem neuesten Stand! Keine neueren Daten vom Partnergerät vorhanden${info}.`);
          }
        }, 1500);
      }
      return true;
    } catch (err) {
      console.warn('[SyncEngine] checkMailbox error:', err);
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Postfach nicht erreichbar: ' + err.message);
      return false;
    } finally {
      this.isCheckingMailbox = false;
    }
  },

  async handleIncomingMailboxUpdate(update, onStatusUpdate) {
    const myDevice = this.getDeviceName();
    if (update.sender === myDevice) {
      return; // Eigene Aktualisierung ignorieren
    }

    const lastReceivedTs = Number(localStorage.getItem('haushaltsbuch_last_received_mailbox_ts') || 0);
    if (update.timestamp <= lastReceivedTs) {
      return; // Bereits verarbeitet
    }

    localStorage.setItem('haushaltsbuch_last_received_mailbox_ts', String(update.timestamp));
    localStorage.setItem('haushaltsbuch_sync_connected', 'true');
    localStorage.setItem('haushaltsbuch_sync_connected_device', update.sender || 'Gekoppeltes Gerät');
    const curCode = this.getActivePairingCode();
    if (curCode) {
      localStorage.setItem('haushaltsbuch_sync_connected_code', curCode);
    }
    
    const timeStr = new Date(update.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(update.timestamp).toLocaleDateString('de-DE');
    localStorage.setItem('haushaltsbuch_sync_connected_time', `${dateStr} um ${timeStr}`);
    localStorage.setItem('haushaltsbuch_mailbox_last_sync', timeStr);

    if (update.vault) {
      if (onStatusUpdate) onStatusUpdate('syncing', `📬 Neue Daten von ${update.sender} im Postfach gefunden! Übernehme...`);
      await this.importSyncedVaultData(update.vault, onStatusUpdate);
    }

    this.lastSyncTime = new Date();
    if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
    if (onStatusUpdate) onStatusUpdate('success', `✅ Postfach-Abgleich: Daten von ${update.sender} erfolgreich übernommen (Stand: ${timeStr})!`);
    if (typeof announceNVDA === 'function') {
      announceNVDA(`Neue Daten vom Postfach übernommen! Synchronisiert mit ${update.sender}.`, true);
    }
    if (window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate([40, 30, 40]); } catch(e) {}
    }
  },

  startMailboxListener() {
    if (!this.isPaired()) return;
    if (this.mailboxListenerActive && this.mqttClient && this.mqttClient.connected) return;
    this.mailboxListenerActive = true;
    this.checkMailbox(null, false).catch(() => {});
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
        recurring: appState.recurring || [],
        savingPots: appState.savingPots || [],
        shoppingList: appState.shoppingList || [],
        peerLoans: appState.peerLoans || [],
        budgets: appState.budgets || {},
        customCategories: appState.customCategories || {}
      };
    }

    return {
      exportedAt: Date.now(),
      transactions: (typeof transactions !== 'undefined') ? transactions : [],
      recurringRules: (typeof recurringRules !== 'undefined') ? recurringRules : [],
      spartoepfe: (typeof spartoepfe !== 'undefined') ? spartoepfe : [],
      accounts: (typeof accounts !== 'undefined') ? accounts : [],
      savingPots: (typeof savingPots !== 'undefined') ? savingPots : [],
      shoppingList: (typeof appState !== 'undefined' && appState && appState.shoppingList) ? appState.shoppingList : [],
      wishlist: (typeof wishlistItems !== 'undefined') ? wishlistItems : []
    };
  },

  // 8. TRESORDATEN IMPORTIEREN — Funktioniert immer (auch ohne PIN / bei Erststart!)
  async importSyncedVaultData(incomingData, onStatusUpdate) {
    if (!incomingData) return;
    this.isImporting = true;

    try {
      const incoming = incomingData.appState || incomingData;

      const isUnlocked = typeof cryptoKey !== 'undefined' && cryptoKey !== null;
      const storedEnc = localStorage.getItem('barrierefreie_finanzen_enc_v1') || 
                        localStorage.getItem('haushaltsbuch_vault_data') || 
                        (window.__DISK_VAULT__ && window.__DISK_VAULT__.vault);
      const storedSalt = localStorage.getItem('barrierefreie_finanzen_salt_v1') || 
                         localStorage.getItem('haushaltsbuch_vault_salt') || 
                         (window.__DISK_VAULT__ && window.__DISK_VAULT__.salt);
      const hasVaultOnDisk = !!(storedEnc && storedSalt);

      // Bestimme eventuell vorhandene PIN (z.B. durch Biometrie oder aktive Sitzung)
      let knownPin = null;
      if (typeof window !== 'undefined' && window.__ACTIVE_PIN__) {
        knownPin = window.__ACTIVE_PIN__;
      } else {
        const bioToken = localStorage.getItem('haushaltsbuch_bio_token');
        if (bioToken) {
          try {
            knownPin = decodeURIComponent(atob(bioToken)).trim();
          } catch(e) {}
        }
      }

      // FALL 1: GERÄT IST AKTUELL BEREITS ENTSPERRT -> DIREKT MERGEN & SPEICHERN
      if (isUnlocked && typeof appState !== 'undefined' && appState !== null) {
        this.mergeIncomingIntoAppState(incoming);
        if (typeof saveStateToEncryptedStorage === 'function') {
          await saveStateToEncryptedStorage();
        }
        if (typeof updateOverview === 'function') updateOverview();
        if (typeof renderAccountsViewList === 'function') renderAccountsViewList();
        if (typeof renderOverviewCreditAccordion === 'function') renderOverviewCreditAccordion();

        const txCount = appState.transactions ? appState.transactions.length : 0;
        const msg = `Synchronisation erfolgreich! ${txCount} Buchungen synchronisiert.`;
        if (typeof announceNVDA === 'function') announceNVDA(msg, true);
        if (onStatusUpdate) onStatusUpdate('success', '🎉 ' + msg);
        return;
      }

      // FALL 2: GERÄT IST GESPERRT, ABER WIR KÖNNEN MIT BEKANNTER PIN (Z.B. BIOMETRIE) AUTOMATISCH ENTSPERREN & MERGEN
      if (!isUnlocked && hasVaultOnDisk && knownPin && typeof deriveKey === 'function' && typeof decryptData === 'function') {
        try {
          const saltBuffer = base64ToArrayBuffer(storedSalt);
          const key = await deriveKey(knownPin, new Uint8Array(saltBuffer));
          const decrypted = await decryptData(storedEnc, key);
          if (decrypted) {
            cryptoKey = key;
            appState = decrypted;
            window.__ACTIVE_PIN__ = knownPin;
            this.mergeIncomingIntoAppState(incoming);
            if (typeof saveStateToEncryptedStorage === 'function') {
              await saveStateToEncryptedStorage();
            }
            if (typeof unlockApp === 'function') {
              unlockApp();
            }
            const txCount = appState.transactions ? appState.transactions.length : 0;
            const msg = `Synchronisation erfolgreich! ${txCount} Buchungen geladen und Tresor entsperrt.`;
            if (typeof announceNVDA === 'function') announceNVDA(msg, true);
            if (onStatusUpdate) onStatusUpdate('success', '🎉 ' + msg);
            return;
          }
        } catch(e) {
          console.warn('[SyncEngine] Konnte Tresor nicht mit bekannter PIN entschlüsseln, warte auf Entsperrung:', e);
        }
      }

      // FALL 3: GERÄT IST GESPERRT UND HAT BEREITS EINEN TRESOR -> DATEN ZWISCHENSPEICHERN BIS PIN EINGEGEBEN WIRD
      if (!isUnlocked && hasVaultOnDisk) {
        window.__PENDING_SYNC_DATA__ = incomingData;
        try {
          localStorage.setItem('haushaltsbuch_pending_sync_data', JSON.stringify(incomingData));
        } catch(e) {}
        const msg = 'Daten empfangen! Bitte berühre den Fingerabdrucksensor oder gib deine PIN ein.';
        if (typeof announceNVDA === 'function') announceNVDA(msg, true);
        if (onStatusUpdate) onStatusUpdate('waiting_pin', '🔑 ' + msg);
        const lockStatusEl = document.getElementById('lock-sync-status');
        if (lockStatusEl) lockStatusEl.textContent = '✅ ' + msg;
        return;
      }

      // FALL 4: ERSTSTART (Kein Tresor auf Gerät, noch keine PIN eingerichtet)
      if (!isUnlocked && !hasVaultOnDisk) {
        if (onStatusUpdate) onStatusUpdate('syncing', '📦 Erstelle neuen Tresor aus den Computer-Daten...');

        const pinInputEl = document.getElementById('pin-input');
        const chosenPin = (knownPin) ? knownPin : ((pinInputEl && pinInputEl.value.trim()) ? pinInputEl.value.trim() : '1234');

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
          shoppingList: incoming.shoppingList || incomingData.shoppingList || [],
          peerLoans: incoming.peerLoans || incomingData.peerLoans || [],
          budgets: incoming.budgets || {},
          customCategories: incoming.customCategories || { exp: {}, inc: {}, trf: {} },
          wishlist: incoming.wishlist || incomingData.wishlist || []
        };

        if (typeof deriveKey === 'function' && typeof arrayBufferToBase64 === 'function') {
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const saltBase64 = arrayBufferToBase64(salt.buffer);
          currentSaltBase64 = saltBase64;
          localStorage.setItem('barrierefreie_finanzen_salt_v1', saltBase64);
          localStorage.setItem('haushaltsbuch_vault_salt', saltBase64);

          cryptoKey = await deriveKey(chosenPin, salt);
          appState = newAppState;
          window.__ACTIVE_PIN__ = chosenPin;

          if (typeof saveStateToEncryptedStorage === 'function') {
            await saveStateToEncryptedStorage();
          }

          if (localStorage.getItem('haushaltsbuch_bio_enabled') === 'true') {
            try {
              localStorage.setItem('haushaltsbuch_bio_token', btoa(encodeURIComponent(chosenPin)));
            } catch(e) {}
          }

          if (typeof unlockApp === 'function') {
            unlockApp();
          }

          const txCount = appState.transactions ? appState.transactions.length : 0;
          const msg = `Synchronisation erfolgreich! ${txCount} Buchungen geladen.`;
          if (typeof announceNVDA === 'function') announceNVDA(msg, true);
          if (onStatusUpdate) onStatusUpdate('success', '🎉 ' + msg);

          if (!pinInputEl || !pinInputEl.value.trim()) {
            const successNotice = `🎉 Synchronisation erfolgreich! ${txCount} Buchungen vom Computer geladen. Deine Start-PIN lautet ${chosenPin}.`;
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
    } catch (err) {
      console.error('[SyncEngine] importSyncedVaultData error:', err);
      throw new Error('Abgleich fehlgeschlagen: ' + err.message);
    } finally {
      this.isImporting = false;
    }
  },

  mergeIncomingIntoAppState(incoming) {
    if (!appState || !incoming) return;

    if (!Array.isArray(appState.transactions)) appState.transactions = [];
    const existingTxIds = new Set(appState.transactions.map(t => String(t.id)));
    let addedTx = 0;

    const incomingTx = incoming.transactions || [];
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
    const incomingAcc = incoming.accounts || [];
    for (const a of incomingAcc) {
      if (a && a.id && !existingAccIds.has(String(a.id))) {
        appState.accounts.push(a);
        existingAccIds.add(String(a.id));
      }
    }

    // Wunschliste
    if (!Array.isArray(appState.wishlist)) appState.wishlist = [];
    const existingWishIds = new Set(appState.wishlist.map(w => String(w.id)));
    const incomingWish = incoming.wishlist || [];
    for (const w of incomingWish) {
      if (w && w.id && !existingWishIds.has(String(w.id))) {
        appState.wishlist.push(w);
        existingWishIds.add(String(w.id));
      }
    }

    // Daueraufträge
    if (!Array.isArray(appState.recurring)) appState.recurring = [];
    const existingRecIds = new Set(appState.recurring.map(r => String(r.id)));
    const incomingRec = incoming.recurring || [];
    for (const r of incomingRec) {
      if (r && r.id && !existingRecIds.has(String(r.id))) {
        appState.recurring.push(r);
        existingRecIds.add(String(r.id));
      }
    }

    // Spartöpfe
    if (!Array.isArray(appState.savingPots)) appState.savingPots = [];
    const existingPotIds = new Set(appState.savingPots.map(p => String(p.id)));
    const incomingPots = incoming.savingPots || [];
    for (const p of incomingPots) {
      if (p && p.id && !existingPotIds.has(String(p.id))) {
        appState.savingPots.push(p);
        existingPotIds.add(String(p.id));
      }
    }

    // Einkaufsliste & Checkliste
    if (!Array.isArray(appState.shoppingList)) appState.shoppingList = [];
    const existingShopIds = new Set(appState.shoppingList.map(s => String(s.id)));
    const incomingShop = incoming.shoppingList || [];
    for (const s of incomingShop) {
      if (s && s.id && !existingShopIds.has(String(s.id))) {
        appState.shoppingList.push(s);
        existingShopIds.add(String(s.id));
      }
    }

    // Geliehenes & Verliehenes Geld (Peer Loans)
    if (!Array.isArray(appState.peerLoans)) appState.peerLoans = [];
    const existingLoanMap = new Map(appState.peerLoans.map(l => [String(l.id), l]));
    const incomingLoans = incoming.peerLoans || [];
    for (const l of incomingLoans) {
      if (l && l.id) {
        const existing = existingLoanMap.get(String(l.id));
        if (!existing) {
          appState.peerLoans.push(l);
          existingLoanMap.set(String(l.id), l);
        } else if ((l.updatedAt || 0) > (existing.updatedAt || 0)) {
          Object.assign(existing, l);
        }
      }
    }

    // Budgets
    if (incoming.budgets && typeof incoming.budgets === 'object') {
      if (!appState.budgets) appState.budgets = {};
      Object.assign(appState.budgets, incoming.budgets);
    }

    // Benutzerdefinierte Kategorien
    if (incoming.customCategories && typeof incoming.customCategories === 'object') {
      if (!appState.customCategories) appState.customCategories = { exp: {}, inc: {}, trf: {} };
      ['exp', 'inc', 'trf'].forEach(type => {
        if (incoming.customCategories[type]) {
          if (!appState.customCategories[type]) appState.customCategories[type] = {};
          Object.assign(appState.customCategories[type], incoming.customCategories[type]);
        }
      });
    }
  },

  // 9. HILFSFUNKTIONEN (ARRAYBUFFER & BASE64)
  uint8ArrayToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  },

  base64ToUint8Array(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
};

// Global bereitstellen
if (typeof window !== 'undefined') {
  window.SyncEngine = SyncEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncEngine;
}
