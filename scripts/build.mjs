import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { santaSVG } from '../src/santa-art.js';
const files = ['perches', 'ballistics', 'movement', 'styles', 'ranger', 'cowboy', 'turkeys', 'orc-art', 'orcs', 'santa-art', 'sleigh-physics', 'snow', 'santa-animation', 'santa-flight', 'santa-controls', 'santa-gifts', 'santa-threat', 'santa-crash', 'santa', 'start'];
const sources = await Promise.all(files.map(name => readFile(new URL(`../src/${name}.js`, import.meta.url), 'utf8')));
const source = sources.map(code => {
  code = code.replace(/^import .*;\n/gm, '').replace(/^export \{.*\};\n/gm, '');
  return code.replaceAll('export ', '');
}).join('\n') + '\nexport { start, createTurkeys, turkeySVG, cowboySVG, roastSVG, createOrcGame, orcSVG, createSantaGame, childSVG, santaSVG, giftSVG };\n';
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/sidequest.mjs', import.meta.url), source);
const classic = source.replace(/^export \{.*\};\n/gm, '').replaceAll('export ', '');
await writeFile(new URL('../dist/sidequest.js', import.meta.url), `/* sidequest · MIT */\n(function () {\n'use strict';\n${classic}\nwindow.Sidequest = { start, createTurkeys, turkeySVG, cowboySVG, roastSVG, createOrcGame, orcSVG, createSantaGame, childSVG, santaSVG, giftSVG };\n})();\n`);
await writeFile(new URL('../dist/santa-sleigh.svg', import.meta.url), santaSVG());
console.log('Built dist/sidequest.mjs, dist/sidequest.js, and dist/santa-sleigh.svg');
