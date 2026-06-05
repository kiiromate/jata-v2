import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';

const extDir = path.join(rootDir, 'apps/extension');
const webPublicDir = path.join(rootDir, 'apps/web/public/extension');
const distDir = path.join(extDir, 'dist');
const tempDir = path.join(extDir, 'jata-extension');
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

  // Remove existing temp dir if any
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // Create temp dir and copy dist contents into it
  console.log('Creating clean package directory structure...');
  fs.mkdirSync(tempDir, { recursive: true });
  copyFolderSync(distDir, tempDir);

  // 3. Compress
  console.log('Packaging extension as zip...');
  if (isWindows) {
    // Compress using PowerShell with absolute paths
    const cmd = `powershell.exe -Command "Compress-Archive -Path '${tempDir}' -DestinationPath '${zipDest}' -Force"`;
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
  } else {
    // Compress using zip command on unix/macOS
    const cmd = `cd "${extDir}" && zip -r "${zipDest}" jata-extension`;
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
  }

  // 4. Cleanup temp dir
  console.log('Cleaning up temporary files...');
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`\nSuccess! Browser extension packaged at:\n${zipDest}\n`);
} catch (error) {
  console.error('Packaging failed:', error);
  // Ensure temp dir cleanup
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
  process.exit(1);
}

// Helper function to recursively copy folders
function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}
