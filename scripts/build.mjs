import { readFile, writeFile, mkdir } from 'node:fs/promises';
const files = ['perches', 'ballistics', 'movement', 'styles', 'ranger', 'cowboy', 'turkeys', 'orc-art', 'orcs'];
const sources = await Promise.all(files.map(name => readFile(new URL(`../src/${name}.js`, import.meta.url), 'utf8')));
const source = sources.map((code, index) => {
  code = code.replace(/^import .*;\n/gm, '').replace(/^export \{.*\};\n/gm, '');
  return code.replaceAll('export ', '');
}).join('\n') + '\nexport { createTurkeys, turkeySVG, cowboySVG, roastSVG, createOrcGame, orcSVG };\n';
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/turkeys.mjs', import.meta.url), source);
const classic = source.replace(/^export \{.*\};\n/gm, '').replaceAll('export ', '');
await writeFile(new URL('../dist/turkeys.js', import.meta.url), `/* tiny-turkeys · MIT */\n(function () {\n'use strict';\n${classic}\nwindow.TinyTurkeys = { createTurkeys, turkeySVG, cowboySVG, roastSVG, createOrcGame, orcSVG };\n})();\n`);
console.log('Built dist/turkeys.mjs and dist/turkeys.js');
