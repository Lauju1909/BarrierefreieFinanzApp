const fs = require('fs');
const path = require('path');

const userDir = 'C:/Users/lauri/Documents/haushalz blan';
const srcHtml = path.resolve(__dirname, '../Haushaltsbuch_App.html');
const srcExe = path.resolve(__dirname, '../Haushaltsbuch.exe');
const targetHtml = path.join(userDir, 'Haushaltsbuch_App.html');
const targetExe = path.join(userDir, 'Haushaltsbuch.exe');
const vaultPath = path.join(userDir, 'Haushaltsbuch_Daten.vault');
const pairingPath = path.join(userDir, 'Haushaltsbuch_Kopplung.json');

// 1. Copy EXE
fs.copyFileSync(srcExe, targetExe);
console.log('✅ Haushaltsbuch.exe copied to user documents folder');

// 2. Read HTML and inject disk vault data so browser direct-open works immediately
let html = fs.readFileSync(srcHtml, 'utf8');
let vaultJson = '{}';
if (fs.existsSync(vaultPath)) {
  const vText = fs.readFileSync(vaultPath, 'utf8').trim();
  if (vText.startsWith('{') && vText.includes('salt')) {
    vaultJson = vText;
  }
}

let pairingJson = '{}';
if (fs.existsSync(pairingPath)) {
  try {
    const pText = fs.readFileSync(pairingPath, 'utf8').trim();
    if (pText.startsWith('{')) pairingJson = pText;
  } catch(e) {}
}

const diskScript = `<script id="disk-vault-data">window.__DISK_VAULT__ = ${vaultJson}; window.__PAIRED_DEVICE__ = ${pairingJson};</script>`;
html = html.replace(/<script id="disk-vault-data">[\s\S]*?<\/script>/, () => diskScript);

fs.writeFileSync(targetHtml, html, 'utf8');
console.log('✅ Haushaltsbuch_App.html copied & injected with active vault data.');
