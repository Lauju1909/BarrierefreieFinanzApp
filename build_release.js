const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Building Haushaltsbuch_App.html ---');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const argon2Js = fs.existsSync('argon2.umd.min.js') ? fs.readFileSync('argon2.umd.min.js', 'utf8') : '';
const syncEngine = fs.readFileSync('sync_engine.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

let bundle = html.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']style\.css["']\s*\/?>/i,
  () => `<style>\n${css}\n</style>`
);

bundle = bundle.replace(
  /<script\s+src=["']argon2\.umd\.min\.js["']><\/script>\s*[\r\n]+\s*<script\s+src=["']sync_engine\.js["']><\/script>\s*[\r\n]+\s*<script\s+src=["']app\.js["']><\/script>/i,
  () => `<script>\n${argon2Js}\n</script>\n<script>\n${syncEngine}\n</script>\n<script id="disk-vault-data">window.__DISK_VAULT__ = {};</script>\n<script>\n${appJs}\n</script>`
);

fs.writeFileSync('Haushaltsbuch_App.html', bundle, 'utf8');
console.log(`✅ Haushaltsbuch_App.html built (${fs.statSync('Haushaltsbuch_App.html').size} bytes).`);

// Sanity check syntax of bundled scripts
const scriptRegex = /<script(?:\s+id=["'][^"']*["'])?>([\s\S]*?)<\/script>/gi;
let m;
let sIdx = 1;
while ((m = scriptRegex.exec(bundle)) !== null) {
  try {
    new Function(m[1]);
  } catch (err) {
    console.error(`❌ BUNDLE SYNTAX ERROR in script #${sIdx}: ${err.message}`);
    process.exit(1);
  }
  sIdx++;
}
console.log(`✅ All ${sIdx - 1} bundled scripts in Haushaltsbuch_App.html have 100% valid JavaScript syntax.`);

if (process.platform === 'win32') {
  console.log('--- Compiling Haushaltsbuch.exe, Feedback_Zentrale.exe & Kategorie_Zentrale.exe with Rust ---');
  execSync('cargo build --release', { stdio: 'inherit' });
  for (const binName of ['Haushaltsbuch.exe', 'Feedback_Zentrale.exe', 'Kategorie_Zentrale.exe']) {
    const srcExe = `target/release/${binName}`;
    if (fs.existsSync(srcExe)) {
      fs.copyFileSync(srcExe, binName);
      console.log(`✅ ${binName} compiled with Rust (${fs.statSync(binName).size} bytes).`);
    }
  }
}
