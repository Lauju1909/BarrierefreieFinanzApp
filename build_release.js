const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Building Haushaltsbuch_App.html ---');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const syncEngine = fs.readFileSync('sync_engine.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

let bundle = html.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']style\.css["']\s*\/?>/i,
  `<style>\n${css}\n</style>`
);

bundle = bundle.replace(
  /<script\s+src=["']sync_engine\.js["']><\/script>\s*[\r\n]+\s*<script\s+src=["']app\.js["']><\/script>/i,
  `<script>\n${syncEngine}\n</script>\n<script id="disk-vault-data">window.__DISK_VAULT__ = {};</script>\n<script>\n${appJs}\n</script>`
);

fs.writeFileSync('Haushaltsbuch_App.html', bundle, 'utf8');
console.log(`✅ Haushaltsbuch_App.html built (${fs.statSync('Haushaltsbuch_App.html').size} bytes).`);

console.log('--- Compiling Haushaltsbuch.exe ---');
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const cmd = `"${cscPath}" /target:winexe /out:Haushaltsbuch.exe /resource:Haushaltsbuch_App.html,HaushaltsbuchApp.embedded_app.html Program.cs`;
execSync(cmd, { stdio: 'inherit' });
console.log(`✅ Haushaltsbuch.exe compiled (${fs.statSync('Haushaltsbuch.exe').size} bytes).`);
