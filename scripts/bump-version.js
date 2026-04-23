import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const versionParts = pkg.version.split('.').map(Number);
versionParts[2] += 1; // Increment patch version
pkg.version = versionParts.join('.');

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Version bumped to ${pkg.version}`);
