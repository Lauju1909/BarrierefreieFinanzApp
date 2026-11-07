const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Building Haushaltsbuch_App.html ---');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');
const argon2Js = fs.existsSync('argon2.umd.min.js') ? fs.readFileSync('argon2.umd.min.js', 'utf8') : '';
const syncEngine = fs.readFileSync('sync_engine.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

// Note: Use functions () => ... in .replace to prevent JavaScript's special replacement
// patterns ($', $`, $&, $1) from corrupting strings containing dollar signs!
let bundle = html.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']style\.css["']\s*\/?>/i,
  () => `<style>\n${css}\n</style>`
);

bundle = bundle.replace(
  /<script\s+src=["']argon2\.umd\.min\.js["']><\/script>\s*[\r\n]+\s*<script\s+src=["']sync_engine\.js["']><\/script>\s*[\r\n]+\s*<script\s+src=["']app\.js["']><\/script>/i,
  () => `<script>\n${argon2Js}\n</script>\n<script>\n${syncEngine}\n</script>\n<script id="disk-vault-data">window.__DISK_VAULT__ = {};</script>\n<script>\n${appJs}\n</script>`
);

fs.writeFileSync('Haushaltsbuch_App.html', bundle, 'utf8');
if (!fs.existsSync('rust_desktop')) {
  fs.mkdirSync('rust_desktop', { recursive: true });
}
fs.writeFileSync('rust_desktop/embedded_app.html', bundle, 'utf8');
console.log(`✅ Haushaltsbuch_App.html & rust_desktop/embedded_app.html built (${fs.statSync('Haushaltsbuch_App.html').size} bytes).`);

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
  console.log('--- Compiling Haushaltsbuch.exe with Rust ---');
  let rustSuccess = false;
  try {
    execSync('cargo build --release', { cwd: 'rust_desktop', stdio: 'inherit' });
    const rustExe = 'rust_desktop/target/release/haushaltsbuch.exe';
    if (fs.existsSync(rustExe)) {
      fs.copyFileSync(rustExe, 'Haushaltsbuch.exe');
      console.log(`✅ Haushaltsbuch.exe compiled with Rust (${fs.statSync('Haushaltsbuch.exe').size} bytes).`);
      rustSuccess = true;
    }
  } catch (err) {
    console.warn('⚠️ Rust build encountered an issue, falling back to C# compiler:', err.message);
  }

  if (!rustSuccess) {
    console.log('--- Compiling Haushaltsbuch.exe (C# Fallback) ---');
    const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
    const cmd = `"${cscPath}" /target:winexe /out:Haushaltsbuch.exe /resource:Haushaltsbuch_App.html,HaushaltsbuchApp.embedded_app.html Program.cs`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Haushaltsbuch.exe compiled with C# (${fs.statSync('Haushaltsbuch.exe').size} bytes).`);
  }

  const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
  if (fs.existsSync('FeedbackProgram.cs')) {
    try {
      console.log('--- Compiling Feedback_Zentrale.exe ---');
      execSync(`"${cscPath}" /target:winexe /out:Feedback_Zentrale.exe FeedbackProgram.cs`, { stdio: 'inherit' });
      console.log(`✅ Feedback_Zentrale.exe compiled.`);
    } catch (e) {
      console.warn('⚠️ Feedback_Zentrale.exe compilation skipped (file in use or unchanged).');
    }
  }

  if (fs.existsSync('KategorieProgram.cs')) {
    try {
      console.log('--- Compiling Kategorie_Zentrale.exe ---');
      execSync(`"${cscPath}" /target:winexe /out:Kategorie_Zentrale.exe KategorieProgram.cs`, { stdio: 'inherit' });
      console.log(`✅ Kategorie_Zentrale.exe compiled.`);
    } catch (e) {
      console.warn('⚠️ Kategorie_Zentrale.exe compilation skipped (file in use or unchanged).');
    }
  }
}
