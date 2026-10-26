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
    fs.copyFileSync(file, dest);
    console.log(`Copied ${file} -> ${dest} (${fs.statSync(dest).size} bytes)`);
  } else {
    console.warn(`File not found to copy: ${file}`);
  }
});

console.log('User documents deployment complete!');
