const fs = require('fs');
const path = require('path');

const targetDirs = [
  'C:\\Users\\lauri\\Documents\\haushalz blan',
  'C:\\Users\\lauri\\Documents\\haushalz blan - Kopie'
];

targetDirs.forEach(targetDir => {
  if (!fs.existsSync(targetDir)) return;

  // Clean up loose HTML and version files so only the clean EXE remains
  const filesToRemove = [
    'Haushaltsbuch_App.html',
    'version.json'
  ];

  filesToRemove.forEach(file => {
    const dest = path.join(targetDir, file);
    if (fs.existsSync(dest)) {
      try {
        fs.unlinkSync(dest);
        console.log(`Cleaned up loose file from ${targetDir}: ${file}`);
      } catch (e) {
        console.warn(`Could not remove ${dest}:`, e.message);
      }
    }
  });

  const filesToCopy = [
    'Haushaltsbuch.exe',
    'Feedback_Zentrale.exe',
    'Kategorie_Zentrale.exe'
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
});

console.log('User documents deployment complete!');
