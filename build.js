import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting build process...');

try {
  // Build client
  console.log('Building client...');
  process.chdir('client');
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  process.chdir('..');
  
  // Create dist directory structure
  console.log('Creating dist directory structure...');
  const distPath = path.resolve('dist');
  const distPublicPath = path.resolve('dist/public');
  
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  if (!fs.existsSync(distPublicPath)) {
    fs.mkdirSync(distPublicPath, { recursive: true });
  }
  
  // Copy client build files to dist/public
  console.log('Copying client build files...');
  const clientDistPath = path.resolve('client/dist');
  
  function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      fs.readdirSync(src).forEach(function(childItemName) {
        copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  
  copyRecursiveSync(clientDistPath, distPublicPath);
  
  // Install server dependencies
  console.log('Installing server dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build server
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --external:./server/vite.ts --external:./client/vite.config.ts --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}