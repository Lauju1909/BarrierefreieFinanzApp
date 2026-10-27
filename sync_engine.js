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
            const qos = (data[0] >> 1) & 0x03;
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
            if (qos > 0) {
              offset += 2; // MQTT 3.1.1: 2-byte Packet Identifier überspringen
            }
            const payload = new TextDecoder().decode(data.slice(offset));

            if (qos === 1 && offset >= 2) {
              try {
                const pidMsb = data[offset - 2];
                const pidLsb = data[offset - 1];
                this.ws.send(new Uint8Array([0x40, 0x02, pidMsb, pidLsb]));
              } catch(e) {}
            }

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
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://test.mosquitto.org:8081'
  ],

  getActivePairingCode() {
    const paired = this.getPairedDevices();
    if (paired.length > 0 && paired[0].code) {
      return paired[0].code;
    }
    return localStorage.getItem('haushaltsbuch_sync_connected_code') || 
           localStorage.getItem('haushaltsbuch_sync_code') || 
           (typeof window !== 'undefined' && window.__PAIRED_DEVICE__ && window.__PAIRED_DEVICE__.code) || 
           null;
  },

  getAllActivePairingCodes() {
    const codes = new Set();
    const addCode = (c) => {
      if (c && typeof c === 'string' && c.trim().length >= 4) {
        codes.add(c.trim().toUpperCase());
      }
    };
    const paired = this.getPairedDevices();
    paired.forEach(d => addCode(d.code));
    addCode(localStorage.getItem('haushaltsbuch_sync_connected_code'));
    if (typeof window !== 'undefined' && window.__PAIRED_DEVICE__) {
      addCode(window.__PAIRED_DEVICE__.code);
      if (Array.isArray(window.__PAIRED_DEVICE__.devices)) {
        window.__PAIRED_DEVICE__.devices.forEach(d => d && addCode(d.code));
      }
    }
    addCode(localStorage.getItem('haushaltsbuch_sync_code'));
    return Array.from(codes);
  },

  isPaired() {
    const paired = this.getPairedDevices();
    if (paired.length > 0) return true;
    return !!localStorage.getItem('haushaltsbuch_sync_connected') || 
           !!localStorage.getItem('haushaltsbuch_sync_connected_code') || 
           (typeof window !== 'undefined' && window.__PAIRED_DEVICE__ && !!window.__PAIRED_DEVICE__.code);
  },

  getRemovedDevices() {
    try {
      const raw = localStorage.getItem('haushaltsbuch_sync_removed_devices');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.map(s => String(s).toLowerCase());
      }
    } catch (e) {}
    return [];
  },

  markDeviceRemoved(deviceName) {
    if (!deviceName) return;
    const clean = String(deviceName).trim().toLowerCase();
    const list = this.getRemovedDevices();
    if (!list.includes(clean)) {
      list.push(clean);
      try { localStorage.setItem('haushaltsbuch_sync_removed_devices', JSON.stringify(list)); } catch (e) {}
    }
  },

  unmarkDeviceRemoved(deviceName) {
    if (!deviceName) return;
    const clean = String(deviceName).trim().toLowerCase();
    const list = this.getRemovedDevices().filter(n => n !== clean);
    try { localStorage.setItem('haushaltsbuch_sync_removed_devices', JSON.stringify(list)); } catch (e) {}
  },

  getPairedDevices() {
    const myDev = (localStorage.getItem('haushaltsbuch_sync_devicename') || '').trim().toLowerCase();
    const removed = this.getRemovedDevices();
    const isAndroid = typeof window !== 'undefined' && (
      !!window.__IS_ANDROID__ || 
      (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
      (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    );

    const map = new Map();
    const addEntry = (name, code, time) => {
      if (!name || typeof name !== 'string') return;
      const cleanName = name.trim();
      if (!cleanName) return;
      const lower = cleanName.toLowerCase();
      if (myDev && lower === myDev) return;
      if (!isAndroid && (lower === 'computer' || lower === 'pc')) return;
      if (removed.includes(lower)) return;

      const cleanCode = (code && typeof code === 'string') ? code.trim().toUpperCase() : '';
      const cleanTime = (time && typeof time === 'string') ? time.trim() : 'Heute';

      if (!map.has(lower)) {
        map.set(lower, { name: cleanName, code: cleanCode, time: cleanTime });
      } else {
        const existing = map.get(lower);
        if (cleanCode && !existing.code) existing.code = cleanCode;
        if (cleanTime && cleanTime !== 'Heute') existing.time = cleanTime;
      }
    };

    try {
      const raw = localStorage.getItem('haushaltsbuch_sync_paired_devices');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(d => {
            if (d && d.name) addEntry(d.name, d.code, d.time);
          });
        }
      }
    } catch (e) {}

    const legacyDev = localStorage.getItem('haushaltsbuch_sync_connected_device');
    const legacyCode = localStorage.getItem('haushaltsbuch_sync_connected_code');
    const legacyTime = localStorage.getItem('haushaltsbuch_sync_connected_time');
    if (legacyDev) {
      addEntry(legacyDev, legacyCode || localStorage.getItem('haushaltsbuch_sync_code') || '', legacyTime);
    }

    if (typeof window !== 'undefined' && window.__PAIRED_DEVICE__) {
      if (Array.isArray(window.__PAIRED_DEVICE__.devices)) {
        window.__PAIRED_DEVICE__.devices.forEach(d => {
          if (d && d.name) addEntry(d.name, d.code, d.time);
        });
      }
      if (window.__PAIRED_DEVICE__.device) {
        addEntry(window.__PAIRED_DEVICE__.device, window.__PAIRED_DEVICE__.code, window.__PAIRED_DEVICE__.time);
      }
    }

    const result = Array.from(map.values()).filter(d => !!d.code);
    return result;
  },

  savePairedDevice(deviceName, pairingCode, timeStr = null, isExplicitUserAction = false) {
    if (!deviceName || typeof deviceName !== 'string') return;
    const cleanName = deviceName.trim();
    if (!cleanName) return;

    const myDev = this.getDeviceName();
    if (cleanName.toLowerCase() === myDev.toLowerCase()) return;

    const isAndroid = typeof window !== 'undefined' && (
      !!window.__IS_ANDROID__ || 
      (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
      (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    );
    if (!isAndroid && (cleanName.toLowerCase() === 'computer' || cleanName.toLowerCase() === 'pc')) return;

    if (isExplicitUserAction) {
      this.unmarkDeviceRemoved(cleanName);
    } else if (this.getRemovedDevices().includes(cleanName.toLowerCase())) {
      return;
    }

    const cleanCode = (pairingCode || this.getActivePairingCode() || this.getPairingCode() || '').trim().toUpperCase();
    if (!cleanCode) return;

    const nowStr = timeStr || (new Date().toLocaleDateString('de-DE') + ' um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));

    const current = this.getPairedDevices();
    const filtered = current.filter(d => d.name.toLowerCase() !== cleanName.toLowerCase());
    const updatedEntry = { name: cleanName, code: cleanCode, time: nowStr };
    const newList = [updatedEntry, ...filtered];

    try {
      localStorage.setItem('haushaltsbuch_sync_paired_devices', JSON.stringify(newList));
      localStorage.setItem('haushaltsbuch_sync_connected', 'true');
      localStorage.setItem('haushaltsbuch_sync_connected_device', cleanName);
      localStorage.setItem('haushaltsbuch_sync_connected_code', cleanCode);
      localStorage.setItem('haushaltsbuch_sync_connected_time', nowStr);
      // Gemeinsamen Gruppen-Kopplungscode auch als eigenen Sync-Code übernehmen,
      // damit Laptop, PC und Smartphone automatisch denselben Gruppen-Schlüssel teilen!
      localStorage.setItem('haushaltsbuch_sync_code', cleanCode);
    } catch (e) {}

    this._persistPairingToDisk(newList);
  },

  removePairedDevice(deviceName) {
    if (!deviceName) return;
    const lower = String(deviceName).trim().toLowerCase();
    this.markDeviceRemoved(deviceName);

    const remaining = this.getPairedDevices().filter(d => d.name.toLowerCase() !== lower);
    try {
      if (remaining.length > 0) {
        localStorage.setItem('haushaltsbuch_sync_paired_devices', JSON.stringify(remaining));
        localStorage.setItem('haushaltsbuch_sync_connected', 'true');
        localStorage.setItem('haushaltsbuch_sync_connected_device', remaining[0].name);
        localStorage.setItem('haushaltsbuch_sync_connected_code', remaining[0].code);
        localStorage.setItem('haushaltsbuch_sync_connected_time', remaining[0].time || 'Heute');
        this._persistPairingToDisk(remaining);
      } else {
        localStorage.removeItem('haushaltsbuch_sync_paired_devices');
        localStorage.removeItem('haushaltsbuch_sync_connected');
        localStorage.removeItem('haushaltsbuch_sync_connected_device');
        localStorage.removeItem('haushaltsbuch_sync_connected_code');
        localStorage.removeItem('haushaltsbuch_sync_connected_time');
        this._persistPairingToDisk([]);
      }
    } catch (e) {}
  },

  _persistPairingToDisk(pairedList) {
    try {
      const primary = (pairedList && pairedList.length > 0) ? pairedList[0] : null;
      const payloadObj = primary ? {
        device: primary.name,
        code: primary.code,
        time: primary.time,
        devices: pairedList
      } : {};

      if (typeof window !== 'undefined') {
        window.__PAIRED_DEVICE__ = primary ? payloadObj : null;
      }

      if (typeof fetch === 'function' && typeof window !== 'undefined') {
        const port = window.__LOCAL_PORT__ || 48123;
        const headers = (typeof getVaultApiHeaders === 'function') ? getVaultApiHeaders({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' };
        fetch(`http://127.0.0.1:${port}/api/save_pairing`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payloadObj)
        }).catch(() => {});
      }
    } catch (e) {}
  },

  getExportablePeers(activeCode = null) {
    const myName = this.getDeviceName();
    const myCode = (activeCode || this.getActivePairingCode() || this.getPairingCode() || '').trim().toUpperCase();
    const nowStr = new Date().toLocaleDateString('de-DE') + ' um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const list = this.getPairedDevices().map(d => ({
      name: d.name,
      code: d.code || myCode,
      time: d.time || nowStr
    }));
    if (myName && myCode) {
      list.unshift({ name: myName, code: myCode, time: nowStr });
    }
    return list;
  },

  registerIncomingPeerAndGroup(senderName, usedCode, packetPeers = [], timeStr = null) {
    const cleanCode = (usedCode || this.getActivePairingCode() || this.getPairingCode() || '').trim().toUpperCase();
    if (senderName && cleanCode) {
      this.savePairedDevice(senderName, cleanCode, timeStr, false);
    }
    if (Array.isArray(packetPeers)) {
      packetPeers.forEach(peer => {
        if (peer && peer.name && (peer.code || cleanCode)) {
          this.savePairedDevice(peer.name, peer.code || cleanCode, peer.time || timeStr, false);
        }
      });
    }
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

  async decryptWithAnyKnownCode(payload, preferredCode = null) {
    const candidates = new Set();
    if (preferredCode) candidates.add(preferredCode.trim().toUpperCase());
    const myCode = this.getPairingCode();
    if (myCode) candidates.add(myCode.trim().toUpperCase());
    this.getAllActivePairingCodes().forEach(c => candidates.add(c));

    for (const code of candidates) {
      try {
        const data = await this.decrypt(payload, code);
        if (data) return { decrypted: data, usedCode: code };
      } catch (e) {}
    }
    return null;
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

  // 5. GERÄT / RECEIVER: AUF SYNCHRONISATION LAUSCHEN (HANDY, LAPTOP & PC)
  async startListening(onStatusUpdate) {
    this.isListening = true;
    this.processedMessageIds.clear();

    const myDevice = this.getDeviceName();
    const myCode = this.getPairingCode();
    const topicReq = await this.getTopicForDevice(myDevice);
    const topicResp = topicReq + '_resp';

    if (onStatusUpdate) onStatusUpdate('waiting', `🟢 Warte auf Signal (Gerät: ${myDevice})...`);

    try {
      if (this.mqttClient) {
        this.mqttClient.close();
      }

      this.mqttClient = new MiniMqttClient(this.BROKERS);
      await this.mqttClient.connect('dev_' + myDevice.replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 6));

      // 1. Live-Sync Kanal (akzeptiert eigenen Code sowie alle gekoppelten Gruppen-Codes)
      const onIncomingLiveSync = async (topic, msgStr) => {
        try {
          const payload = JSON.parse(msgStr);
          if (payload && payload.ct && payload.iv && payload.salt) {
            const res = await this.decryptWithAnyKnownCode(payload, myCode);
            if (res && res.decrypted && res.decrypted.type === 'SYNC_REQUEST') {
              const decrypted = res.decrypted;
              const usedCode = res.usedCode || myCode;
              const msgId = decrypted.timestamp + '_' + decrypted.sender;
              if (this.processedMessageIds.has(msgId)) return;
              this.processedMessageIds.add(msgId);

              if (onStatusUpdate) onStatusUpdate('syncing', `⚡ Signal von ${decrypted.sender || 'Partnergerät'} empfangen! Sende Antwort...`);
              if (typeof announceNVDA === 'function') announceNVDA(`Signal von ${decrypted.sender || 'Partnergerät'} empfangen! Synchronisiere...`, true);

              await this.handleIncomingSyncRequest(decrypted, topicResp, usedCode, onStatusUpdate);
            }
          }
        } catch (e) {
          // Falscher Code oder nicht für dieses Gerät bestimmtes Paket
        }
      };

      this.mqttClient.subscribe(topicReq, onIncomingLiveSync);
      const allActiveSyncCodes = this.getAllActivePairingCodes();
      for (const scode of allActiveSyncCodes) {
        const scodeBox = await this.getMailboxTopic(scode);
        if (scodeBox) {
          this.mqttClient.subscribe(scodeBox + '/live_req', onIncomingLiveSync);
        }
      }
      // 2. Asynchrones E2E-Postfach für ALLE aktiven Codes abonnieren (empfängt auch Retained Messages von PC, Laptop & Handy!)
      await this._subscribeAllActiveMailboxes(this.mqttClient, onStatusUpdate);

      if (onStatusUpdate) onStatusUpdate('waiting', `🟢 Bereit für Synchronisation & Multi-Geräte-Postfach aktiv (Gerät: ${myDevice})`);
    } catch (err) {
      console.warn('[SyncEngine] startListening Verbindungsfehler:', err.message);
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Verbindung wird aufgebaut... (Offline-Modus aktiv)');
    }
  },

  async _subscribeAllActiveMailboxes(client, onStatusUpdate, onFoundCallback = null) {
    if (!client) return;
    const allCodes = this.getAllActivePairingCodes();
    for (const code of allCodes) {
      const boxTopic = await this.getMailboxTopic(code);
      if (!boxTopic) continue;
      const handleMailbox = async (topic, msgStr) => {
        try {
          const payload = JSON.parse(msgStr);
          if (payload && payload.ct && payload.iv && payload.salt) {
            const res = await this.decryptWithAnyKnownCode(payload, code);
            if (res && res.decrypted && res.decrypted.type === 'MAILBOX_UPDATE') {
              if (onFoundCallback) onFoundCallback(res.decrypted);
              await this.handleIncomingMailboxUpdate(res.decrypted, onStatusUpdate, res.usedCode || code);
            }
          }
        } catch (e) {}
      };
      client.subscribe(boxTopic, handleMailbox);
      client.subscribe(boxTopic + '/#', handleMailbox);
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
      const isForceOverwrite = Boolean(request.forceOverwrite || request.mode === 'FORCE_OVERWRITE');
      const nowStr = new Date().toLocaleDateString('de-DE') + ' um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

      // Sender und dessen gekoppelte Geräte (z.B. PC + Laptop + Handy) sofort in den Sync-Verbund aufnehmen!
      this.registerIncomingPeerAndGroup(request.sender || 'Computer', myCode, request.peers || [], nowStr);

      if (isForceOverwrite) {
        // 1. Gerät wird KOMPLETT mit dem empfangenen Master-Stand überschrieben!
        if (request.vault) {
          await this.importSyncedVaultData(request.vault, onStatusUpdate, true);
        }

        // 2. Bestätigung ohne altes lokales Vault zurücksenden, aber mit vollständiger Peer-Liste!
        const responsePayload = {
          type: 'SYNC_RESPONSE',
          mode: 'FORCE_OVERWRITE',
          overwritten: true,
          timestamp: Date.now(),
          sender: this.getDeviceName(),
          peers: this.getExportablePeers(myCode)
        };
        const encrypted = await this.encrypt(responsePayload, myCode);
        if (this.mqttClient && this.mqttClient.connected) {
          const respStr = JSON.stringify(encrypted);
          this.mqttClient.publish(topicResp, respStr);
          const myBox = await this.getMailboxTopic(myCode);
          if (myBox) {
            this.mqttClient.publish(myBox + '/live_resp', respStr);
          }
        }

        this.lastSyncTime = new Date();
        if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
        if (onStatusUpdate) {
          const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
          onStatusUpdate('success', `🎉 Gerät wurde komplett mit Stand von ${request.sender || 'Computer'} überschrieben um ${timeStr}!`);
        }
        if (typeof announceNVDA === 'function') {
          announceNVDA('Gerät wurde komplett mit dem Stand des Partnergeräts überschrieben!', true);
        }
        if (window.navigator && window.navigator.vibrate) {
          try { window.navigator.vibrate([100, 50, 100]); } catch(e) {}
        }
        return;
      }

      // Normaler 2-Wege-Sync:
      // 1. Falls Partnergerät neuere Daten mitgeschickt hat, diese zuerst zusammenführen,
      //    damit die Antwort bereits den kombinierten Stand aller Geräte enthält!
      if (request.vault) {
        await this.importSyncedVaultData(request.vault, onStatusUpdate);
      }

      // 2. Kombinierten lokalen Tresorstand + alle gekoppelten Geräte (Peers) exportieren
      const vaultData = await this.exportCurrentVaultData();
      const responsePayload = {
        type: 'SYNC_RESPONSE',
        timestamp: Date.now(),
        sender: this.getDeviceName(),
        peers: this.getExportablePeers(myCode),
        vault: vaultData
      };
      const encrypted = await this.encrypt(responsePayload, myCode);

      // 3. Antwort an Response-Topic senden (in Echtzeit via WebSocket über beide Kanäle)
      if (this.mqttClient && this.mqttClient.connected) {
        const respStr = JSON.stringify(encrypted);
        this.mqttClient.publish(topicResp, respStr);
        const myBox = await this.getMailboxTopic(myCode);
        if (myBox) {
          this.mqttClient.publish(myBox + '/live_resp', respStr);
        }
      }

      this.lastSyncTime = new Date();
      // Gemeinsames Postfach aktualisieren, damit auch ein drittes Gerät (z.B. ausgeschalteter PC oder Laptop)
      // sofort die neue Gruppen-Kopplung und den zusammengeführten Datenstand erhält!
      this.scheduleMailboxPush(false);

      if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
      if (onStatusUpdate) {
        const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
        onStatusUpdate('success', `✅ Erfolgreich mit ${request.sender || 'Partnergerät'} synchronisiert um ${timeStr}!`);
      }
      if (typeof announceNVDA === 'function') {
        announceNVDA(`Synchronisation mit ${request.sender || 'Partnergerät'} erfolgreich abgeschlossen!`, true);
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

  // 6. SYNCHRONISATION MIT ZIELGERÄT STARTEN (INITIATOR: PC, LAPTOP ODER HANDY)
  async syncWithSmartphone(targetDeviceName, pairingCode, onStatusUpdate, forceOverwrite = false) {
    if (!targetDeviceName || !pairingCode) {
      throw new Error('Bitte Gerätename und Kopplungscode angeben!');
    }

    const cleanTargetName = targetDeviceName.trim();
    const cleanPairCode = pairingCode.trim().toUpperCase();
    const topicReq = await this.getTopicForDevice(cleanTargetName);
    const topicResp = topicReq + '_resp';

    // Zielgerät sofort als gekoppelt speichern, damit Postfach-Fallback & Multi-Geräte-Gruppe den Code kennen
    this.savePairedDevice(cleanTargetName, cleanPairCode, null, true);
    if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();

    const connectMsg = forceOverwrite 
      ? `🔗 Verbinde mit ${cleanTargetName} zum vollständigen Überschreiben...`
      : `🔗 Verbinde mit ${cleanTargetName}...`;
    if (onStatusUpdate) onStatusUpdate('connecting', connectMsg);
    if (typeof announceNVDA === 'function') announceNVDA(connectMsg, true);

    // 1. Temporären Initiator-Client verbinden
    const client = new MiniMqttClient(this.BROKERS);
    await client.connect('pc_init_' + Math.random().toString(36).substring(2, 7));

    // Direkten Code-Kanal zusätzlich vorbereiten
    const targetBoxTopic = await this.getMailboxTopic(cleanPairCode);
    const liveCodeReq = targetBoxTopic ? (targetBoxTopic + '/live_req') : null;
    const liveCodeResp = targetBoxTopic ? (targetBoxTopic + '/live_resp') : null;

    // 2. Auf Antwort vorbereiten
    let responseReceived = false;

    const responsePromise = new Promise((resolve, reject) => {
      // 10 Sekunden Timeout für Live-Handshake
      const timer = setTimeout(async () => {
        if (!responseReceived) {
          client.close();
          // Automatischer Fallback in das asynchrone E2E-Postfach!
          try {
            if (onStatusUpdate) {
              onStatusUpdate('syncing', forceOverwrite 
                ? `📬 ${cleanTargetName} antwortet gerade nicht. Hinterlege Master-Stand versiegelt im Postfach...` 
                : `📬 ${cleanTargetName} antwortet gerade nicht. Synchronisiere über das verschlüsselte E2E-Postfach...`);
            }
            // Falls kein Force-Overwrite: Zuerst vorhandene Postfach-Daten (z.B. von Handy & PC) abholen und zusammenführen!
            if (!forceOverwrite) {
              await this.checkMailbox(onStatusUpdate, false);
              await new Promise(r => setTimeout(r, 1200));
            }
            await this.postToMailbox(onStatusUpdate, forceOverwrite);
            const pairedNames = this.getPairedDevices().map(d => d.name).join(', ') || cleanTargetName;
            const msg = forceOverwrite
              ? `📬 ${cleanTargetName} ist gerade im Standby/Offline. Dein Stand wurde als Master im Postfach hinterlegt und überschreibt die gekoppelten Geräte (${pairedNames}) automatisch beim nächsten Start!`
              : `📬 ${cleanTargetName} ist gerade im Standby/Offline. Daten & Gruppen-Kopplung (${pairedNames}) wurden über das verschlüsselte Postfach abgeglichen!`;
            if (onStatusUpdate) onStatusUpdate('success', msg);
            if (typeof announceNVDA === 'function') announceNVDA(msg, true);
            resolve({ type: 'MAILBOX_SAVED', vault: null, overwritten: forceOverwrite });
          } catch(boxErr) {
            reject(new Error('Das Zielgerät ist offline und das Postfach konnte nicht erreicht werden: ' + boxErr.message));
          }
        }
      }, 10000);

      const onRespMsg = async (topic, msgStr) => {
        try {
          const payload = JSON.parse(msgStr);
          if (payload && payload.ct && payload.iv && payload.salt) {
            const res = await this.decryptWithAnyKnownCode(payload, cleanPairCode);
            if (res && res.decrypted && res.decrypted.type === 'SYNC_RESPONSE') {
              responseReceived = true;
              clearTimeout(timer);
              resolve(res.decrypted);
            }
          }
        } catch (e) {
          // Falsches Paket oder Entschlüsselungsfehler
        }
      };

      client.subscribe(topicResp, onRespMsg);
      if (liveCodeResp) {
        client.subscribe(liveCodeResp, onRespMsg);
      }
    });

    // Kurz warten, bis Subscription beim Broker registriert ist (~200ms)
    await new Promise(r => setTimeout(r, 250));

    const sendMsg = forceOverwrite 
      ? `📡 Sende Master-Stand an ${cleanTargetName} zum vollständigen Überschreiben...` 
      : `📡 Sende verschlüsselte Daten an ${cleanTargetName}...`;
    if (onStatusUpdate) onStatusUpdate('waiting_reply', sendMsg);
    if (typeof announceNVDA === 'function') announceNVDA(sendMsg, true);

    // 3. Eigene Tresordaten + bekannte Gruppen-Geräte exportieren und Anfrage senden
    const localVault = await this.exportCurrentVaultData();
    const requestPayload = {
      type: 'SYNC_REQUEST',
      mode: forceOverwrite ? 'FORCE_OVERWRITE' : 'MERGE',
      forceOverwrite: Boolean(forceOverwrite),
      timestamp: Date.now(),
      sender: this.getDeviceName(),
      peers: this.getExportablePeers(cleanPairCode),
      vault: localVault
    };

    const encryptedReq = await this.encrypt(requestPayload, cleanPairCode);
    const reqStr = JSON.stringify(encryptedReq);
    client.publish(topicReq, reqStr);
    if (liveCodeReq) {
      client.publish(liveCodeReq, reqStr);
    }

    if (onStatusUpdate) onStatusUpdate('waiting_reply', `⚡ Signal übertragen. Warte auf Bestätigung von ${cleanTargetName}...`);

    // 4. Antwort abwarten
    const response = await responsePromise;
    client.close(); // Temporären Client schließen

    const nowStr = new Date().toLocaleDateString('de-DE') + ' um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    // Empfangene Peer-Liste (z.B. PC, der bereits mit dem Handy gekoppelt war!) automatisch übernehmen!
    if (response && response.type === 'SYNC_RESPONSE') {
      this.registerIncomingPeerAndGroup(response.sender || cleanTargetName, cleanPairCode, response.peers || [], nowStr);
    }
    this.savePairedDevice(cleanTargetName, cleanPairCode, nowStr, true);

    // Falls Master-Overwrite: Keine alten Daten zurück importieren!
    if (forceOverwrite) {
      const succMsg = `🎉 ${cleanTargetName} wurde erfolgreich zu 100% mit deinen Daten überschrieben!`;
      if (onStatusUpdate) onStatusUpdate('success', succMsg);
      if (typeof announceNVDA === 'function') announceNVDA(succMsg, true);
    } else if (response && response.type === 'SYNC_RESPONSE' && response.vault) {
      if (onStatusUpdate) onStatusUpdate('syncing', '📦 Antwort empfangen. Aktualisiere lokale Daten...');
      await this.importSyncedVaultData(response.vault, onStatusUpdate);
    }

    this.lastSyncTime = new Date();
    
    // Auch Postfach aktualisieren (für alle gekoppelten Geräte im Verbund, z.B. PC + Laptop + Handy)
    this.scheduleMailboxPush(forceOverwrite);

    // Hintergrund-Listener aktualisieren, damit neu gelernte Gruppen-Codes sofort abonniert sind
    if (this.mqttClient && this.mqttClient.connected) {
      this._subscribeAllActiveMailboxes(this.mqttClient, null).catch(() => {});
    }

    if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
    const timeStr = this.lastSyncTime.toLocaleTimeString('de-DE');
    if (response && response.type === 'SYNC_RESPONSE') {
      const allPeers = this.getPairedDevices().map(d => d.name).join(', ');
      if (onStatusUpdate) onStatusUpdate('success', `✅ Synchronisation erfolgreich abgeschlossen um ${timeStr}! Gekoppelte Geräte: ${allPeers}`);
      if (typeof announceNVDA === 'function') announceNVDA(`Synchronisation erfolgreich abgeschlossen! Gekoppelte Geräte: ${allPeers}`, true);
    }

    // Vibration / Feedback
    if (window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate([40, 30, 60]); } catch(e) {}
    }
  },

  async syncAllPairedDevices(onStatusUpdate, forceOverwrite = false) {
    const devices = this.getPairedDevices();
    if (!devices || devices.length === 0) {
      throw new Error('Noch keine gekoppelten Geräte vorhanden.');
    }
    if (devices.length === 1) {
      return await this.syncWithSmartphone(devices[0].name, devices[0].code, onStatusUpdate, forceOverwrite);
    }

    // Zuerst das gemeinsame Postfach prüfen und dann alle Geräte abgleichen
    if (!forceOverwrite) {
      await this.checkMailbox(onStatusUpdate, false);
    }
    for (let i = 0; i < devices.length; i++) {
      const dev = devices[i];
      if (onStatusUpdate) {
        onStatusUpdate('connecting', `🔄 Synchronisiere Gerät ${i + 1} von ${devices.length}: ${dev.name}...`);
      }
      try {
        await this.syncWithSmartphone(dev.name, dev.code, onStatusUpdate, forceOverwrite);
      } catch (e) {
        console.warn(`[SyncEngine] Sync mit ${dev.name} über Postfach fortgesetzt:`, e.message);
      }
    }
    await this.postToMailbox(onStatusUpdate, forceOverwrite);
    const names = this.getPairedDevices().map(d => d.name).join(', ');
    const msg = `✅ Alle gekoppelten Geräte (${names}) sind synchronisiert!`;
    if (onStatusUpdate) onStatusUpdate('success', msg);
    if (typeof announceNVDA === 'function') announceNVDA(msg, true);
  },

  // 6b. ASYNCHRONES E2E-POSTFACH: DATEN IM BRIEFKASTEN HINTERLEGEN (RETAINED FÜR ALLE GRUPPEN-GERÄTE)
  async postToMailbox(onStatusUpdate, forceOverwrite = false) {
    const allCodes = this.getAllActivePairingCodes();
    if (!allCodes || allCodes.length === 0) {
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Noch kein Kopplungscode vorhanden.');
      return false;
    }

    if (this.isPostingMailbox) return false;
    this.isPostingMailbox = true;

    try {
      const myDevice = this.getDeviceName();
      const timestamp = Date.now();
      const vaultData = await this.exportCurrentVaultData();
      const primaryCode = allCodes[0];

      const envelope = {
        type: 'MAILBOX_UPDATE',
        version: 2,
        mode: forceOverwrite ? 'FORCE_OVERWRITE' : 'MERGE',
        forceOverwrite: Boolean(forceOverwrite),
        timestamp: timestamp,
        sender: myDevice,
        peers: this.getExportablePeers(primaryCode),
        vault: vaultData
      };

      localStorage.setItem('haushaltsbuch_last_sent_mailbox_ts', String(timestamp));

      // Verwende bestehenden Client oder erstelle einen kurzlebigen Sender
      let client = this.mqttClient;
      let needClose = false;
      if (!client || !client.connected) {
        client = new MiniMqttClient(this.BROKERS);
        await client.connect('box_pub_' + Math.random().toString(36).substring(2, 7));
        needClose = true;
      }

      // In alle aktiven Postfächer der gekoppelten Geräte (PC, Laptop, Handy) publizieren
      for (const code of allCodes) {
        const baseTopic = await this.getMailboxTopic(code);
        const devTopic = await this.getMailboxTopic(code, myDevice);
        if (!baseTopic || !devTopic) continue;
        const encrypted = await this.encrypt(envelope, code);
        const payloadStr = JSON.stringify(encrypted);
        client.publish(devTopic, payloadStr, true); // retain = true (pro Gerät eigener Slot!)
        client.publish(baseTopic, payloadStr, true); // retain = true (Basis-Slot)
      }

      if (needClose) {
        setTimeout(() => {
          try { client.close(); } catch(e) {}
        }, 1000);
      }

      const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('haushaltsbuch_sync_connected_time', new Date().toLocaleDateString('de-DE') + ' um ' + timeStr);
      localStorage.setItem('haushaltsbuch_mailbox_last_sync', timeStr);

      if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
      const statusMsg = forceOverwrite
        ? `📬 Master-Stand versiegelt im Postfach hinterlegt (Stand: ${timeStr})! Alle gekoppelten Geräte übernehmen 1:1.`
        : `📬 Daten versiegelt für alle gekoppelten Geräte im Postfach hinterlegt (Stand: ${timeStr})!`;
      if (onStatusUpdate) onStatusUpdate('success', statusMsg);
      if (typeof announceNVDA === 'function') {
        announceNVDA(forceOverwrite
          ? 'Master-Finanzdaten erfolgreich im Postfach hinterlegt. Alle gekoppelten Geräte übernehmen diesen Stand zu 100%!'
          : 'Finanzdaten erfolgreich im verschlüsselten Multi-Geräte-Postfach hinterlegt!', true);
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

  scheduleMailboxPush(forceOverwrite = false) {
    if (this.isImporting) return; // Nicht während eines laufenden Imports zurückfeuern
    if (!this.isPaired()) return;
    clearTimeout(this.mailboxPushTimer);
    this.mailboxPushTimer = setTimeout(() => {
      this.postToMailbox(null, forceOverwrite).catch(() => {});
    }, 800);
  },

  // 6c. ASYNCHRONES E2E-POSTFACH: BRIEFKASTEN PRÜFEN & NEUE DATEN VON ALLEN GERÄTEN ABHOLEN
  async checkMailbox(onStatusUpdate, isManual = false) {
    const allCodes = this.getAllActivePairingCodes();
    if (!allCodes || allCodes.length === 0) {
      if (onStatusUpdate) onStatusUpdate('error', '⚠️ Noch kein Kopplungscode vorhanden.');
      return false;
    }

    if (this.isCheckingMailbox) return false;
    this.isCheckingMailbox = true;

    try {
      if (onStatusUpdate) onStatusUpdate('connecting', '📬 Prüfe verschlüsseltes Postfach auf neue Daten von allen Geräten...');

      let client = this.mqttClient;
      if (!client || !client.connected) {
        client = new MiniMqttClient(this.BROKERS);
        this.mqttClient = client;
        await client.connect('box_sub_' + Math.random().toString(36).substring(2, 7));
      }

      let updateFound = false;
      await this._subscribeAllActiveMailboxes(client, onStatusUpdate, () => {
        updateFound = true;
      });

      if (isManual) {
        if (typeof announceNVDA === 'function') {
          announceNVDA('Postfach wird auf neue Daten geprüft...', true);
        }
        setTimeout(() => {
          if (!updateFound && onStatusUpdate) {
            const lastSync = localStorage.getItem('haushaltsbuch_mailbox_last_sync');
            const info = lastSync ? ` (Zuletzt synchronisiert: ${lastSync})` : '';
            onStatusUpdate('success', `✅ Postfach ist auf dem neuesten Stand! Alle gekoppelten Geräte sind synchron${info}.`);
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

  async handleIncomingMailboxUpdate(update, onStatusUpdate, usedCode = null) {
    if (!update) return;
    const myDevice = this.getDeviceName();
    const timeStr = new Date(update.timestamp || Date.now()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(update.timestamp || Date.now()).toLocaleDateString('de-DE');
    const fullTimeStr = `${dateStr} um ${timeStr}`;
    const activeCode = usedCode || this.getActivePairingCode() || this.getPairingCode();

    // Auch wenn ein Paket eine bekannte Peer-Liste mitbringt, Gruppen-Geräte (z.B. Laptop <-> Handy <-> PC) immer registrieren!
    if (update.sender && update.sender !== myDevice) {
      this.registerIncomingPeerAndGroup(update.sender, activeCode, update.peers || [], fullTimeStr);
    } else if (Array.isArray(update.peers) && update.peers.length > 0) {
      this.registerIncomingPeerAndGroup(null, activeCode, update.peers, fullTimeStr);
    }

    if (update.sender === myDevice) {
      if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
      return; // Eigenes Datenpaket nicht erneut importieren
    }

    // Zeitstempel pro Absender-Gerät prüfen, damit Laptop, PC und Handy sich niemals gegenseitig durch Uhrzeit-Abweichungen blockieren!
    const cleanSenderKey = 'haushaltsbuch_last_received_mailbox_ts_' + String(update.sender || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
    const lastSenderTs = Number(localStorage.getItem(cleanSenderKey) || 0);
    if (update.timestamp && update.timestamp <= lastSenderTs) {
      if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
      return; // Dieses Paket dieses Absenders wurde bereits verarbeitet
    }

    localStorage.setItem(cleanSenderKey, String(update.timestamp));
    const globalLastTs = Number(localStorage.getItem('haushaltsbuch_last_received_mailbox_ts') || 0);
    if (update.timestamp > globalLastTs) {
      localStorage.setItem('haushaltsbuch_last_received_mailbox_ts', String(update.timestamp));
    }
    localStorage.setItem('haushaltsbuch_mailbox_last_sync', timeStr);

    const isForceOverwrite = Boolean(update.forceOverwrite || update.mode === 'FORCE_OVERWRITE');

    if (update.vault) {
      const notice = isForceOverwrite
        ? `📬 Master-Stand von ${update.sender} im Postfach gefunden! Überschreibe lokales Gerät zu 100%...`
        : `📬 Neue Daten von ${update.sender} im Postfach gefunden! Übernehme...`;
      if (onStatusUpdate) onStatusUpdate('syncing', notice);
      await this.importSyncedVaultData(update.vault, onStatusUpdate, isForceOverwrite);
    }

    this.lastSyncTime = new Date();
    if (typeof updateSyncConnectedUI === 'function') updateSyncConnectedUI();
    const succMsg = isForceOverwrite
      ? `✅ Postfach-Abgleich: Gerät wurde 1:1 mit dem Master-Stand von ${update.sender} überschrieben (Stand: ${timeStr})!`
      : `✅ Postfach-Abgleich: Daten von ${update.sender} erfolgreich übernommen (Stand: ${timeStr})!`;
    if (onStatusUpdate) onStatusUpdate('success', succMsg);
    if (typeof announceNVDA === 'function') {
      announceNVDA(succMsg, true);
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
        customCategories: appState.customCategories || {},
        securitySettings: appState.securitySettings || {},
        securityAudit: appState.securityAudit || {},
        deletedEntities: appState.deletedEntities || {}
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
  async importSyncedVaultData(incomingData, onStatusUpdate, forceOverwrite = false) {
    if (!incomingData) return;
    this.isImporting = true;

    try {
      const incoming = incomingData.appState || incomingData;
      const shouldOverwrite = Boolean(forceOverwrite || incomingData.forceOverwrite || incomingData.mode === 'FORCE_OVERWRITE');

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

      // FALL 1: GERÄT IST AKTUELL BEREITS ENTSPERRT -> DIREKT MERGEN/ÜBERSCHREIBEN & SPEICHERN
      if (isUnlocked && typeof appState !== 'undefined' && appState !== null) {
        if (shouldOverwrite) {
          this.overwriteAppStateFromIncoming(incoming);
        } else {
          this.mergeIncomingIntoAppState(incoming);
        }
        if (typeof saveStateToEncryptedStorage === 'function') {
          await saveStateToEncryptedStorage();
        }
        if (typeof updateOverview === 'function') updateOverview();
        if (typeof renderAccountsViewList === 'function') renderAccountsViewList();
        if (typeof renderOverviewCreditAccordion === 'function') renderOverviewCreditAccordion();
        if (typeof renderShoppingList === 'function') renderShoppingList();
        if (typeof renderWishlist === 'function') renderWishlist();
        if (typeof renderSavingPotsList === 'function') renderSavingPotsList();
        if (typeof renderOverviewPeerLoans === 'function') renderOverviewPeerLoans();
        if (typeof renderPeerLoans === 'function') renderPeerLoans();
        if (typeof renderSettingsRecurringList === 'function') renderSettingsRecurringList();
        if (typeof renderBudgetsList === 'function') renderBudgetsList();
        if (typeof populateCategoriesDropdowns === 'function') populateCategoriesDropdowns();
        if (typeof populateAllAccountDropdowns === 'function') populateAllAccountDropdowns();
        if (typeof populateWishlistAccountDropdown === 'function') populateWishlistAccountDropdown();

        const txCount = appState.transactions ? appState.transactions.length : 0;
        const msg = shouldOverwrite 
          ? `Gerät erfolgreich zu 100% überschrieben! ${txCount} Buchungen aktiv.`
          : `Synchronisation erfolgreich! ${txCount} Buchungen synchronisiert.`;
        if (typeof announceNVDA === 'function') announceNVDA(msg, true);
        if (onStatusUpdate) onStatusUpdate('success', '🎉 ' + msg);
        return;
      }

      // FALL 2: GERÄT IST GESPERRT, ABER WIR KÖNNEN MIT BEKANNTER PIN (Z.B. BIOMETRIE) AUTOMATISCH ENTSPERREN & MERGEN/ÜBERSCHREIBEN
      if (!isUnlocked && hasVaultOnDisk && knownPin && typeof deriveKey === 'function' && typeof decryptData === 'function') {
        try {
          const saltBuffer = base64ToArrayBuffer(storedSalt);
          const key = await deriveKey(knownPin, new Uint8Array(saltBuffer));
          const decrypted = await decryptData(storedEnc, key);
          if (decrypted) {
            cryptoKey = key;
            appState = decrypted;
            window.__ACTIVE_PIN__ = knownPin;
            if (shouldOverwrite) {
              this.overwriteAppStateFromIncoming(incoming);
            } else {
              this.mergeIncomingIntoAppState(incoming);
            }
            if (typeof saveStateToEncryptedStorage === 'function') {
              await saveStateToEncryptedStorage();
            }
            if (typeof unlockApp === 'function') {
              unlockApp();
            }
            const txCount = appState.transactions ? appState.transactions.length : 0;
            const msg = shouldOverwrite
              ? `Gerät erfolgreich zu 100% überschrieben! ${txCount} Buchungen aktiv und Tresor entsperrt.`
              : `Synchronisation erfolgreich! ${txCount} Buchungen geladen und Tresor entsperrt.`;
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
        if (shouldOverwrite) {
          incomingData.forceOverwrite = true;
        }
        window.__PENDING_SYNC_DATA__ = incomingData;
        try {
          localStorage.setItem('haushaltsbuch_pending_sync_data', JSON.stringify(incomingData));
        } catch(e) {}
        const msg = shouldOverwrite
          ? 'Master-Daten empfangen! Bitte berühre den Fingerabdrucksensor oder gib deine PIN ein, um das Gerät 1:1 zu überschreiben.'
          : 'Daten empfangen! Bitte berühre den Fingerabdrucksensor oder gib deine PIN ein.';
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
          wishlist: incoming.wishlist || incomingData.wishlist || [],
          deletedEntities: incoming.deletedEntities || {}
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

  // 8b. MASTER-OVERWRITE: APP-STATE 1:1 DURCH EINGEHENDE DATEN ERSETZEN
  overwriteAppStateFromIncoming(incoming) {
    if (!incoming) return;
    if (typeof appState === 'undefined' || appState === null) {
      appState = {};
    }

    // 1:1 Kopie aller Datenbereiche
    appState.accounts = Array.isArray(incoming.accounts) ? JSON.parse(JSON.stringify(incoming.accounts)) : (appState.accounts || []);
    appState.initialBalances = incoming.initialBalances ? JSON.parse(JSON.stringify(incoming.initialBalances)) : {};
    appState.transactions = Array.isArray(incoming.transactions) ? JSON.parse(JSON.stringify(incoming.transactions)) : [];
    appState.recurring = Array.isArray(incoming.recurring) ? JSON.parse(JSON.stringify(incoming.recurring)) : [];
    appState.wishlist = Array.isArray(incoming.wishlist) ? JSON.parse(JSON.stringify(incoming.wishlist)) : [];
    appState.shoppingList = Array.isArray(incoming.shoppingList) ? JSON.parse(JSON.stringify(incoming.shoppingList)) : [];
    appState.savingPots = Array.isArray(incoming.savingPots) ? JSON.parse(JSON.stringify(incoming.savingPots)) : [];
    appState.peerLoans = Array.isArray(incoming.peerLoans) ? JSON.parse(JSON.stringify(incoming.peerLoans)) : [];
    appState.budgets = incoming.budgets ? JSON.parse(JSON.stringify(incoming.budgets)) : {};
    appState.customCategories = incoming.customCategories ? JSON.parse(JSON.stringify(incoming.customCategories)) : { exp: {}, inc: {}, trf: {} };
    appState.deletedEntities = incoming.deletedEntities ? JSON.parse(JSON.stringify(incoming.deletedEntities)) : {};

    if (incoming.securitySettings) {
      appState.securitySettings = JSON.parse(JSON.stringify(incoming.securitySettings));
    }
    if (incoming.securityAudit) {
      appState.securityAudit = JSON.parse(JSON.stringify(incoming.securityAudit));
    }

    // Sortierung der Buchungen sicherstellen
    if (Array.isArray(appState.transactions)) {
      appState.transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
  },

  mergeIncomingIntoAppState(incoming) {
    if (!appState || !incoming) return;

    // 0. Gelöschte Einträge (Tombstones) synchronisieren
    if (!appState.deletedEntities || typeof appState.deletedEntities !== 'object') {
      appState.deletedEntities = {};
    }
    const incomingDeleted = incoming.deletedEntities || {};
    const entityTypes = ['transactions', 'recurring', 'wishlist', 'shoppingList', 'savingPots', 'peerLoans', 'accounts', 'budgets'];

    // Beide Tombstone-Listen zusammenführen
    entityTypes.forEach(type => {
      if (!appState.deletedEntities[type]) appState.deletedEntities[type] = {};
      const incDelType = incomingDeleted[type] || {};
      Object.keys(incDelType).forEach(id => {
        const incTs = Number(incDelType[id] || 0);
        const curTs = Number(appState.deletedEntities[type][id] || 0);
        appState.deletedEntities[type][id] = Math.max(incTs, curTs);
      });
    });

    const isTxDeleted = (id) => Boolean(appState.deletedEntities.transactions && appState.deletedEntities.transactions[String(id)]);
    const isRecDeleted = (id) => Boolean(appState.deletedEntities.recurring && appState.deletedEntities.recurring[String(id)]);
    const isWishDeleted = (id) => Boolean(appState.deletedEntities.wishlist && appState.deletedEntities.wishlist[String(id)]);
    const isShopDeleted = (id) => Boolean(appState.deletedEntities.shoppingList && appState.deletedEntities.shoppingList[String(id)]);
    const isPotDeleted = (id) => Boolean(appState.deletedEntities.savingPots && appState.deletedEntities.savingPots[String(id)]);
    const isLoanDeleted = (id) => Boolean(appState.deletedEntities.peerLoans && appState.deletedEntities.peerLoans[String(id)]);
    const isAccDeleted = (id) => Boolean(appState.deletedEntities.accounts && appState.deletedEntities.accounts[String(id)]);
    const isBudgetDeleted = (cat) => Boolean(appState.deletedEntities.budgets && appState.deletedEntities.budgets[String(cat)]);

    // 1. Lokale Listen von gelöschten Elementen bereinigen (falls auf anderem Gerät gelöscht)
    if (Array.isArray(appState.transactions)) {
      appState.transactions = appState.transactions.filter(t => t && t.id && !isTxDeleted(t.id));
    } else {
      appState.transactions = [];
    }

    if (Array.isArray(appState.recurring)) {
      appState.recurring = appState.recurring.filter(r => r && r.id && !isRecDeleted(r.id));
    } else {
      appState.recurring = [];
    }

    if (Array.isArray(appState.wishlist)) {
      appState.wishlist = appState.wishlist.filter(w => w && w.id && !isWishDeleted(w.id));
    } else {
      appState.wishlist = [];
    }

    if (Array.isArray(appState.shoppingList)) {
      appState.shoppingList = appState.shoppingList.filter(s => s && s.id && !isShopDeleted(s.id));
    } else {
      appState.shoppingList = [];
    }

    if (Array.isArray(appState.savingPots)) {
      appState.savingPots = appState.savingPots.filter(p => p && p.id && !isPotDeleted(p.id));
    } else {
      appState.savingPots = [];
    }

    if (Array.isArray(appState.peerLoans)) {
      appState.peerLoans = appState.peerLoans.filter(l => l && l.id && !isLoanDeleted(l.id));
    } else {
      appState.peerLoans = [];
    }

    if (Array.isArray(appState.accounts)) {
      // Mindestens 1 Konto immer behalten
      if (appState.accounts.length > 1) {
        appState.accounts = appState.accounts.filter(a => a && a.id && !isAccDeleted(a.id));
      }
    } else {
      appState.accounts = [];
    }

    if (appState.budgets && typeof appState.budgets === 'object') {
      Object.keys(appState.budgets).forEach(cat => {
        if (isBudgetDeleted(cat)) {
          delete appState.budgets[cat];
        }
      });
    }

    // 2. Buchungen (transactions) einpflegen & aktualisieren
    const existingTxMap = new Map(appState.transactions.map(t => [String(t.id), t]));
    let txChanged = 0;
    const incomingTx = incoming.transactions || [];
    for (const t of incomingTx) {
      if (t && t.id && !isTxDeleted(t.id)) {
        const existing = existingTxMap.get(String(t.id));
        if (!existing) {
          appState.transactions.push(t);
          existingTxMap.set(String(t.id), t);
          txChanged++;
        } else if ((t.updatedAt || 0) > (existing.updatedAt || 0)) {
          Object.assign(existing, t);
          txChanged++;
        }
      }
    }
    if (txChanged > 0) {
      appState.transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    // 3. Konten & Startguthaben abgleichen
    if (!appState.initialBalances) appState.initialBalances = {};
    const existingAccMap = new Map(appState.accounts.map(a => [String(a.id), a]));
    const incomingAcc = incoming.accounts || [];

    for (const a of incomingAcc) {
      if (a && a.id && !isAccDeleted(a.id)) {
        const existing = existingAccMap.get(String(a.id));
        if (!existing) {
          appState.accounts.push(a);
          existingAccMap.set(String(a.id), a);
        } else if ((a.updatedAt || 0) >= (existing.updatedAt || 0)) {
          Object.assign(existing, a);
        } else {
          if (a.name && !existing.name) existing.name = a.name;
          if (a.icon && !existing.icon) existing.icon = a.icon;
          if (a.type && !existing.type) existing.type = a.type;
          if (a.hint !== undefined && !existing.hint) existing.hint = a.hint;
          if (a.initialBalance !== undefined && (existing.initialBalance === undefined || existing.initialBalance === 0)) {
            existing.initialBalance = Number(a.initialBalance || 0);
          }
        }
      }
    }

    // Anfangsbestände abgleichen
    if (incoming.initialBalances && typeof incoming.initialBalances === 'object') {
      Object.keys(incoming.initialBalances).forEach(accId => {
        if (!isAccDeleted(accId)) {
          const incBal = Number(incoming.initialBalances[accId] || 0);
          const curBal = Number(appState.initialBalances[accId] || 0);
          const accObj = existingAccMap.get(String(accId));
          if (accObj && accObj.initialBalance !== undefined) {
            appState.initialBalances[accId] = accObj.initialBalance;
          } else if (curBal === 0 && incBal !== 0) {
            appState.initialBalances[accId] = incBal;
          }
        }
      });
    }

    appState.accounts.forEach(a => {
      if (a.initialBalance !== undefined) {
        appState.initialBalances[a.id] = Number(a.initialBalance || 0);
      }
    });

    // 4. Wunschliste einpflegen & aktualisieren
    const existingWishMap = new Map(appState.wishlist.map(w => [String(w.id), w]));
    const incomingWish = incoming.wishlist || [];
    for (const w of incomingWish) {
      if (w && w.id && !isWishDeleted(w.id)) {
        const existing = existingWishMap.get(String(w.id));
        if (!existing) {
          appState.wishlist.push(w);
          existingWishMap.set(String(w.id), w);
        } else if ((w.updatedAt || 0) > (existing.updatedAt || 0)) {
          Object.assign(existing, w);
        } else if (w.fulfilled !== undefined && existing.fulfilled !== w.fulfilled && !existing.updatedAt) {
          existing.fulfilled = w.fulfilled;
        }
      }
    }

    // 5. Daueraufträge einpflegen & aktualisieren
    const existingRecMap = new Map(appState.recurring.map(r => [String(r.id), r]));
    const incomingRec = incoming.recurring || [];
    for (const r of incomingRec) {
      if (r && r.id && !isRecDeleted(r.id)) {
        const existing = existingRecMap.get(String(r.id));
        if (!existing) {
          appState.recurring.push(r);
          existingRecMap.set(String(r.id), r);
        } else if ((r.updatedAt || 0) > (existing.updatedAt || 0)) {
          Object.assign(existing, r);
        }
      }
    }

    // 6. Spartöpfe einpflegen & Salden aktualisieren
    const existingPotMap = new Map(appState.savingPots.map(p => [String(p.id), p]));
    const incomingPots = incoming.savingPots || [];
    for (const p of incomingPots) {
      if (p && p.id && !isPotDeleted(p.id)) {
        const existing = existingPotMap.get(String(p.id));
        if (!existing) {
          appState.savingPots.push(p);
          existingPotMap.set(String(p.id), p);
        } else if ((p.updatedAt || 0) > (existing.updatedAt || 0)) {
          Object.assign(existing, p);
        } else if (p.currentAmount !== undefined && !existing.updatedAt) {
          existing.currentAmount = p.currentAmount;
        }
      }
    }

    // 7. Einkaufsliste & Checkliste einpflegen & Häkchen abgleichen
    const existingShopMap = new Map(appState.shoppingList.map(s => [String(s.id), s]));
    const incomingShop = incoming.shoppingList || [];
    for (const s of incomingShop) {
      if (s && s.id && !isShopDeleted(s.id)) {
        const existing = existingShopMap.get(String(s.id));
        if (!existing) {
          appState.shoppingList.push(s);
          existingShopMap.set(String(s.id), s);
        } else if ((s.updatedAt || 0) > (existing.updatedAt || 0)) {
          Object.assign(existing, s);
        } else if (s.checked !== undefined && existing.checked !== s.checked && !existing.updatedAt) {
          existing.checked = s.checked;
        }
      }
    }

    // 8. Geliehenes & Verliehenes Geld (Peer Loans)
    const existingLoanMap = new Map(appState.peerLoans.map(l => [String(l.id), l]));
    const incomingLoans = incoming.peerLoans || [];
    for (const l of incomingLoans) {
      if (l && l.id && !isLoanDeleted(l.id)) {
        const existing = existingLoanMap.get(String(l.id));
        if (!existing) {
          appState.peerLoans.push(l);
          existingLoanMap.set(String(l.id), l);
        } else if ((l.updatedAt || 0) > (existing.updatedAt || 0)) {
          Object.assign(existing, l);
        }
      }
    }

    // 9. Budgets
    if (incoming.budgets && typeof incoming.budgets === 'object') {
      if (!appState.budgets) appState.budgets = {};
      Object.entries(incoming.budgets).forEach(([cat, val]) => {
        if (!isBudgetDeleted(cat)) {
          appState.budgets[cat] = val;
        }
      });
    }

    // 10. Benutzerdefinierte Kategorien
    if (incoming.customCategories && typeof incoming.customCategories === 'object') {
      if (!appState.customCategories) appState.customCategories = { exp: {}, inc: {}, trf: {} };
      ['exp', 'inc', 'trf'].forEach(type => {
        if (incoming.customCategories[type]) {
          if (!appState.customCategories[type]) appState.customCategories[type] = {};
          Object.assign(appState.customCategories[type], incoming.customCategories[type]);
        }
      });
    }

    // 11. Sicherheitseinstellungen
    if (incoming.securitySettings && typeof incoming.securitySettings === 'object') {
      if (!appState.securitySettings) appState.securitySettings = {};
      Object.assign(appState.securitySettings, incoming.securitySettings);
    }

    // 12. Sicherheits-Audit
    if (incoming.securityAudit && typeof incoming.securityAudit === 'object') {
      if (!appState.securityAudit) appState.securityAudit = {};
      appState.securityAudit.unlockCount = Math.max(appState.securityAudit.unlockCount || 0, incoming.securityAudit.unlockCount || 0);
      if (incoming.securityAudit.lastUnlockTime) {
        if (!appState.securityAudit.lastUnlockTime || new Date(incoming.securityAudit.lastUnlockTime) > new Date(appState.securityAudit.lastUnlockTime)) {
          appState.securityAudit.lastUnlockTime = incoming.securityAudit.lastUnlockTime;
        }
      }
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
