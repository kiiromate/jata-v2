const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const source = path.join(__dirname, 'db_cluster-12-09-2025@23-28-33.backup.gz');
const destination = path.join(__dirname, 'db_cluster.backup');

console.log(`Decompressing ${source} to ${destination}...`);

const gunzip = zlib.createGunzip();
const sourceStream = fs.createReadStream(source);
const destinationStream = fs.createWriteStream(destination);

sourceStream
  .pipe(gunzip)
  .pipe(destinationStream)
  .on('finish', () => {
    console.log('Decompression complete: db_cluster.backup created');
  })
  .on('error', (err) => {
    console.error('Error decompressing:', err);
    process.exit(1);
  });
