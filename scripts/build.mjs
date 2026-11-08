import { readFile, writeFile, mkdir } from 'node:fs/promises';
const files = ['perches', 'ballistics', 'movement', 'styles', 'ranger', 'cowboy', 'turkeys', 'orc-art', 'orcs'];
const sources = await Promise.all(files.map(name => readFile(new URL(`../src/${name}.js`, import.meta.url), 'utf8')));
const source = sources.map(code => {
  code = code.replace(/^import .*;\n/gm, '').replace(/^export \{.*\};\n/gm, '');
  return code.replaceAll('export ', '');
}).join('\n') + '\nexport { createTurkeys, turkeySVG, cowboySVG, roastSVG, createOrcGame, orcSVG };\n';
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/sidequest.mjs', import.meta.url), source);
const classic = source.replace(/^export \{.*\};\n/gm, '').replaceAll('export ', '');
await writeFile(new URL('../dist/sidequest.js', import.meta.url), `/* sidequest · MIT */\n(function () {\n'use strict';\n${classic}\nwindow.Sidequest = { createTurkeys, turkeySVG, cowboySVG, roastSVG, createOrcGame, orcSVG };\n})();\n`);
console.log('Built dist/sidequest.mjs and dist/sidequest.js');
