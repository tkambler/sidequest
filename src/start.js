import { createTurkeys } from './turkeys.js';
import { createOrcGame } from './orcs.js';
import { createSantaGame } from './santa.js';

/** Launch a game immediately and return its scene controller. */
export function start({ mode, ...options } = {}) {
  switch (mode) {
    case 'turkeys': return createTurkeys(options).start();
    case 'orc': return createOrcGame(options).start();
    case 'santa': return createSantaGame(options).start();
    default: throw new TypeError('mode must be "turkeys", "orc", or "santa"');
  }
}
