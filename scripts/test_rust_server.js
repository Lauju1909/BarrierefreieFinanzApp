const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Testing Rust Haushaltsbuch.exe Endpoints & Backward Compatibility ---');

const tempDir = path.join(__dirname, 'test_temp_rust');
if (fs.existsSync(tempDir)) {
  // keep tempDir
}
fs.mkdirSync(tempDir, { recursive: true });

// Copy compiled haushaltsbuch.exe to tempDir
const exeSrc = path.join(__dirname, '../Haushaltsbuch.exe');
const exeDst = path.join(tempDir, 'Haushaltsbuch.exe');
fs.copyFileSync(exeSrc, exeDst);

// Place a simulated existing vault in tempDir (abwärtskompatibilität test!)
const initialVaultContent = JSON.stringify({
  salt: "mock_salt_12345",
  iv: "mock_iv_67890",
  vault: "mock_encrypted_ciphertext_data",
  updatedAt: 1700000000000
});
fs.writeFileSync(path.join(tempDir, 'Haushaltsbuch_Daten.vault'), initialVaultContent, 'utf8');

console.log('Starting Rust process in isolated test directory...');
const proc = spawn(exeDst, [], {
  cwd: tempDir,
  windowsHide: true,
  stdio: 'inherit'
});
proc.on('exit', (code, signal) => {
  console.log(`[PROC EXIT EVENT] code: ${code}, signal: ${signal}`);
});
console.log('Spawned proc PID:', proc.pid);

let currentPort = 48123;

function httpRequest(method, urlPath, headers = {}, body = null, targetPort = null) {
  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    const opts = {
      hostname: '127.0.0.1',
      family: 4,
      port: targetPort || currentPort,
      path: urlPath,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  // 1. Wait for server to start (try ports 48123 - 48135)
  let connected = false;
  for (let i = 0; i < 30; i++) {
    for (let p = 48123; p <= 48135; p++) {
      try {
        const hb = await httpRequest('GET', '/api/heartbeat', {}, null, p);
        if (hb.statusCode === 200) {
          console.log(`✓ Rust server responded to heartbeat on port ${p}:`, hb.body);
          currentPort = p;
          connected = true;
          break;
        }
      } catch (e) {
        if (i === 10 && p === 48123) {
          console.log(`Debug connect attempt on 48123: ${e.code || e.message}`);
        }
      }
    }
    if (connected) break;
    await new Promise(r => setTimeout(r, 200));
  }

  if (!connected) {
    throw new Error('Rust server did not start on any port 48123-48135 in time');
  }

  // 2. Fetch root / to verify HTML embedding and disk-vault injection
  const rootResp = await httpRequest('GET', '/');
  if (rootResp.statusCode !== 200 || !rootResp.body.includes('id="disk-vault-data"')) {
    throw new Error(`Failed to load root HTML. Status: ${rootResp.statusCode}`);
  }
  if (!rootResp.body.includes('mock_salt_12345')) {
    throw new Error('Initial vault was not injected into HTML!');
  }
  console.log('✓ Root HTML serves embedded app with initial vault injected.');

  // Extract session token from root HTML
  const tokenMatch = rootResp.body.match(/window\.__AUTH_TOKEN__\s*=\s*"([^"]+)";/);
  if (!tokenMatch) {
    throw new Error('Session token not found in injected HTML script tag!');
  }
  const token = tokenMatch[1];
  console.log('✓ Extracted session token from injected script:', token);

  // 3. Test Security: Unauthorized /api/ request without token
  const unauthResp = await httpRequest('GET', '/api/get_vault');
  if (unauthResp.statusCode !== 403) {
    throw new Error(`Expected 403 Forbidden without token, got ${unauthResp.statusCode}`);
  }
  console.log('✓ Security verified: Unauthorized API requests are blocked with 403.');

  // 4. Test Authorized /api/get_vault
  const authHeaders = {
    'X-Session-Token': token,
    'Content-Type': 'application/json'
  };
  const vaultResp = await httpRequest('GET', '/api/get_vault', authHeaders);
  if (vaultResp.statusCode !== 200 || !vaultResp.body.includes('mock_salt_12345')) {
    throw new Error(`get_vault failed: ${vaultResp.body}`);
  }
  console.log('✓ Authorized get_vault returned correct existing vault data.');

  // 5. Test Authorized /api/save_vault (Atomic write + rolling backup)
  const updatedVault = JSON.stringify({
    salt: "new_salt_rust_secure_999",
    iv: "new_iv_rust",
    vault: "new_encrypted_content_2026",
    updatedAt: Date.now()
  });
  const saveResp = await httpRequest('POST', '/api/save_vault', authHeaders, updatedVault);
  if (saveResp.statusCode !== 200 || !saveResp.body.includes('saved')) {
    throw new Error(`save_vault failed: ${saveResp.body}`);
  }
  console.log('✓ save_vault succeeded.');

  // Verify file on disk
  const onDisk = fs.readFileSync(path.join(tempDir, 'Haushaltsbuch_Daten.vault'), 'utf8');
  if (!onDisk.includes('new_salt_rust_secure_999')) {
    throw new Error('Haushaltsbuch_Daten.vault was not updated on disk!');
  }
  console.log('✓ Haushaltsbuch_Daten.vault verified updated on disk.');

  // Verify .bak file created
  const bakExists = fs.existsSync(path.join(tempDir, 'Haushaltsbuch_Daten.vault.bak'));
  if (!bakExists) {
    throw new Error('Haushaltsbuch_Daten.vault.bak was not created!');
  }
  console.log('✓ Backup Haushaltsbuch_Daten.vault.bak created.');

  // Verify rolling backup directory and files
  const backupDir = path.join(tempDir, 'Tresor_Sicherheitskopien');
  if (!fs.existsSync(backupDir)) {
    throw new Error('Tresor_Sicherheitskopien folder not created!');
  }
  const baks = fs.readdirSync(backupDir).filter(f => f.startsWith('vault_') && f.endsWith('.bak'));
  if (baks.length === 0) {
    throw new Error('No rolling backup files found in Tresor_Sicherheitskopien!');
  }
  console.log(`✓ Rolling backup verified in Tresor_Sicherheitskopien (${baks.length} backups present).`);

  // 6. Test Pairing Save & Get
  const pairingPayload = JSON.stringify({
    device: "Handy von Laurin",
    code: "7777-8888-9999",
    time: "Heute"
  });
  const savePairResp = await httpRequest('POST', '/api/save_pairing', authHeaders, pairingPayload);
  if (savePairResp.statusCode !== 200 || !savePairResp.body.includes('saved')) {
    throw new Error(`save_pairing failed: ${savePairResp.body}`);
  }
  const getPairResp = await httpRequest('GET', '/api/get_pairing', authHeaders);
  if (getPairResp.statusCode !== 200 || !getPairResp.body.includes('7777-8888-9999')) {
    throw new Error(`get_pairing failed: ${getPairResp.body}`);
  }
  console.log('✓ save_pairing and get_pairing fully verified.');

  console.log('===================================================');
  console.log('ALL RUST DESKTOP SERVER & COMPATIBILITY TESTS PASSED 100%!');
  console.log('===================================================');
}

runTests()
  .then(() => {
    try { proc.kill('SIGKILL'); } catch (e) {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ TEST FAILED:', err);
    try { proc.kill('SIGKILL'); } catch (e) {}
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    process.exit(1);
  });
