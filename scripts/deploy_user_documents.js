const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\lauri\\Documents\\haushalz blan';

if (!fs.existsSync(targetDir)) {
  console.log('Target directory does not exist:', targetDir);
  process.exit(1);
}

const filesToCopy = [
  'Haushaltsbuch_App.html',
  'Haushaltsbuch.exe',
  'Feedback_Zentrale.exe',
  'Kategorie_Zentrale.exe',
  'version.json'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    const dest = path.join(targetDir, file);
    try {
      fs.copyFileSync(file, dest);
      console.log(`Copied ${file} -> ${dest} (${fs.statSync(dest).size} bytes)`);
    } catch (e) {
      if (e.code === 'EBUSY') {
        console.warn(`File is currently open/locked by user: ${file} (Skipping binary overwrite while app is running)`);
      } else {
        throw e;
      }
    }
  } else {
    console.warn(`File not found to copy: ${file}`);
  }
});

console.log('User documents deployment complete!');
