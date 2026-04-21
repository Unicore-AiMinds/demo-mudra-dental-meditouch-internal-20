import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function getDeps(pkgName, visited = new Set()) {
  if (visited.has(pkgName)) return;
  visited.add(pkgName);

  const pkgPath = join('node_modules', pkgName, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error('MISSING:', pkgName);
    return;
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = pkg.dependencies || {};

  for (const dep of Object.keys(deps)) {
    getDeps(dep, visited);
  }
  return visited;
}

const all = new Set();
getDeps('@whiskeysockets/baileys', all);
getDeps('qrcode', all);

const sorted = [...all].sort();
for (const dep of sorted) {
  console.log(dep);
}
console.log('---');
console.log('Total:', sorted.length);
