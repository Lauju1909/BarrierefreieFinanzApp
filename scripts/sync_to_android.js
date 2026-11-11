const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const androidDir = path.resolve(__dirname, '..', '..', 'BarrierefreieFinanzApp_Android');

if (!fs.existsSync(androidDir)) {
  console.error('Android directory not found:', androidDir);
  process.exit(1);
}

// 1. Copy to www
const wwwDir = path.join(androidDir, 'www');
if (fs.existsSync(wwwDir)) {
  fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(wwwDir, 'index.html'));
  fs.copyFileSync(path.join(srcDir, 'app.js'), path.join(wwwDir, 'app.js'));
  fs.copyFileSync(path.join(srcDir, 'version.json'), path.join(wwwDir, 'version.json'));
  console.log('✓ Synced index.html, app.js, version.json to www/');
}

// 2. Copy to assets/public if exists
const assetsDir = path.join(androidDir, 'android', 'app', 'src', 'main', 'assets', 'public');
if (fs.existsSync(assetsDir)) {
  fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(assetsDir, 'index.html'));
  fs.copyFileSync(path.join(srcDir, 'app.js'), path.join(assetsDir, 'app.js'));
  fs.copyFileSync(path.join(srcDir, 'version.json'), path.join(assetsDir, 'version.json'));
  console.log('✓ Synced to android/app/src/main/assets/public/');
}

// 3. Update package.json
const pkgPath = path.join(androidDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.version = '6.9.70';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log('✓ Updated package.json to 6.9.70');
}

// 4. Update build.gradle
const gradlePath = path.join(androidDir, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  gradle = gradle.replace(/versionCode \d+/, 'versionCode 70');
  gradle = gradle.replace(/versionName "[^"]+"/, 'versionName "6.9.70"');
  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('✓ Updated build.gradle (versionCode 70, versionName "6.9.70")');
}

console.log('Android sync complete!');
