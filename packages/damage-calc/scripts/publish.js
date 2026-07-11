const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const packageDir = path.join(__dirname, '..');
const pkgDir = path.join(packageDir, 'pkg');

try {
  console.log('📦 Running wasm-pack build...');
  execSync('wasm-pack build --scope pokemetrix --target bundler --out-dir pkg --out-name damage_calc', { cwd: packageDir, stdio: 'inherit' });

  if (!pkgDir) {
    console.error('❌ Error: No pkg directory.');
    process.exit(1);
  }

  // 1. Run wasm-pack pack
  console.log('📦 Running wasm-pack pack...');
  execSync('wasm-pack pack pkg', { cwd: packageDir, stdio: 'inherit' });

  // 2. Find the generated .tgz file
  const files = fs.readdirSync(pkgDir);
  const tgzFile = files.find(f => f.endsWith('.tgz'));

  if (!tgzFile) {
    console.error('❌ Error: No .tgz file found in the pkg directory.');
    process.exit(1);
  }

  const tgzPath = path.join(pkgDir, tgzFile);
  console.log(`\n🚀 Publishing ${tgzFile}...`);

  // 3. Run pnpm publish
  // Use stdio: 'inherit' to ensure the interactive OTP prompt works correctly
  execSync(`pnpm publish ${tgzFile} --access public --no-git-checks --ignore-scripts`, {
    cwd: pkgDir,
    stdio: 'inherit',
  });

  console.log('\n✅ Successfully published Wasm package!');
} catch (error) {
  console.error('\n❌ Failed to publish Wasm package:', error.message);
  process.exit(1);
}
