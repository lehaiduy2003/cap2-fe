const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname);

fs.readdir(migrationsDir, (err, files) => {
  if (err) {
    console.error("Error reading migrations directory:", err);
    process.exit(1);
  }

  const sqlFiles = files.filter((f) => f.endsWith(".sql"));

  let maxVersion = 0;
  sqlFiles.forEach((file) => {
    const match = file.match(/^V(\d+)_/);
    if (match) {
      const version = parseInt(match[1]);
      if (version > maxVersion) maxVersion = version;
    }
  });

  const nextVersion = maxVersion + 1;

  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const filename = `V${nextVersion}_${dateStr}.sql`;
  const filepath = path.join(migrationsDir, filename);

  const defaultContent = `-- Migration V${nextVersion} - ${now
    .toISOString()
    .slice(0, 19)
    .replace("T", " ")}
-- Add your SQL statements here

`;

  fs.writeFile(filepath, defaultContent, (err) => {
    if (err) {
      console.error("Error creating migration file:", err);
      process.exit(1);
    }
    console.log(`Created new migration file: ${filename}`);
  });
});
