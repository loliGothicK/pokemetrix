const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const cargoPath = path.join(__dirname, '..', 'Cargo.toml');

const pkg = require(pkgPath);
let cargo = fs.readFileSync(cargoPath, 'utf8');

// Replace the first occurrence of version = "..." with the package.json version
cargo = cargo.replace(/^version = ".*"$/m, `version = "${pkg.version}"`);

fs.writeFileSync(cargoPath, cargo);
console.log(`Synced Cargo.toml version to ${pkg.version}`);
