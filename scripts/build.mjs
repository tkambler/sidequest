import { readFile, writeFile, mkdir } from 'node:fs/promises';
const source = await readFile(new URL('../src/turkeys.js', import.meta.url), 'utf8');
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/turkeys.mjs', import.meta.url), source);
await writeFile(new URL('../dist/turkeys.js', import.meta.url), `/* tiny-turkeys · MIT */\n(function () {\n'use strict';\n${source.replaceAll('export ', '')}\nwindow.TinyTurkeys = { createTurkeys, turkeySVG };\n})();\n`);
console.log('Built dist/turkeys.mjs and dist/turkeys.js');
