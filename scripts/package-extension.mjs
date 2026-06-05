import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const extDir = path.join(rootDir, 'apps/extension');
const webPublicDir = path.join(rootDir, 'apps/web/public/extension');
const distDir = path.join(extDir, 'dist');
const zipDest = path.join(webPublicDir, 'jata-extension.zip');

try {
  // 1. Build the extension
  console.log('Building extension...');
  execSync('pnpm --filter @jata/extension build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Prepare directories
  if (!fs.existsSync(webPublicDir)) {
    fs.mkdirSync(webPublicDir, { recursive: true });
  }

  // Remove existing zip
  if (fs.existsSync(zipDest)) {
    fs.unlinkSync(zipDest);
  }

  // 3. Compress using adm-zip
  console.log('Packaging extension as zip...');
  const zip = new AdmZip();
  // Add distDir contents into a root folder named 'jata-extension' inside the ZIP
  zip.addLocalFolder(distDir, 'jata-extension');
  zip.writeZip(zipDest);

  console.log(`\nSuccess! Browser extension packaged at:\n${zipDest}\n`);
} catch (error) {
  console.error('Packaging failed:', error);
  process.exit(1);
}
