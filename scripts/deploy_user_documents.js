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

  const dirsToRemove = [
    'Profile',
    'Profile_Feedback',
    'Profile_Kategorien'
  ];

  dirsToRemove.forEach(dirName => {
    const dPath = path.join(targetDir, dirName);
    if (fs.existsSync(dPath)) {
      try {
        fs.rmSync(dPath, { recursive: true, force: true });
        console.log(`Cleaned up profile directory from ${targetDir}: ${dirName}`);
      } catch (e) {
        console.warn(`Could not remove ${dPath}:`, e.message);
      }
    }
  });

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
