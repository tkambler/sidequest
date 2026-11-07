import { readFile, writeFile, mkdir } from 'node:fs/promises';
const [core, perches, muskets] = await Promise.all([
  readFile(new URL('../src/turkeys.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/perches.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/muskets.js', import.meta.url), 'utf8'),
]);
const source = perches.replace('export function visiblePerches', 'function visiblePerches') + '\n' + muskets.replaceAll('export ', '') + '\n' +
  core.replace("import { visiblePerches } from './perches.js';\n", '').replace("import { aimAt, muzzleAt, segmentHitTime } from './muskets.js';\n", '');
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/turkeys.mjs', import.meta.url), source);
await writeFile(new URL('../dist/turkeys.js', import.meta.url), `/* tiny-turkeys · MIT */\n(function () {\n'use strict';\n${source.replaceAll('export ', '')}\nwindow.TinyTurkeys = { createTurkeys, turkeySVG, pilgrimSVG, roastSVG };\n})();\n`);
console.log('Built dist/turkeys.mjs and dist/turkeys.js');
