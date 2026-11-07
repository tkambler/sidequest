# Tiny Turkeys

An opt-in Thanksgiving easter egg for any web page. Little 30 × 30 pixel-art turkeys stroll along element tops, flap their wings, and hop onto nearby ledges. Inspired by a classic blue-headed, brown-tailed pixel turkey.

No dependencies, network requests, external images, sound, or framework required. The overlay ignores pointer events and stays out of the accessibility tree. Nothing happens until you call `start()`.

## Try it

```sh
npm run dev
```

Open **http://localhost:4173/demo/** and choose **Release the turkeys**. Stop them with **Gather the turkeys**.

## Add to any page

Copy `dist/turkeys.js` alongside your page and add this before `</body>`:

```html
<script src="./turkeys.js"></script>
<script>
  const flock = TinyTurkeys.createTurkeys();
  // Call this from your own easter-egg button or holiday toggle:
  flock.start();
</script>
```

Or use an ES module:

```js
import { createTurkeys } from './dist/turkeys.mjs';
const flock = createTurkeys();
document.querySelector('#holiday-mode').addEventListener('click', () => {
  if (flock.running) flock.stop();
  else flock.start();
});
```

The package exports the same `createTurkeys` function for bundlers, with TypeScript declarations included. `turkeySVG()` returns the decorative pixel-art SVG used in the demo.

## Controls

```js
flock.start();   // First arrival on the next animation frame, then occasional arrivals
flock.spawn();   // Add one now; returns false if stopped, paused, full, or motion-blocked
flock.pause();   // Freeze visitors and their lifetimes
flock.resume();  // Continue
flock.stop();    // Remove visitors and all animation work, observers, and listeners
flock.start();   // Restart a stopped flock
flock.destroy();// Permanently stop; future start() calls throw
flock.count;    // Current number of visitors
flock.running;  // Started, including while paused or motion-blocked
flock.paused;   // Explicitly paused
```

`start`, `stop`, `pause`, and `resume` return the flock for chaining. Call `start()` after `document.body` exists. Each instance owns and removes only its own overlay.

## Options

```js
const flock = createTurkeys({
  maxTurkeys: 5,
  spawnInterval: [7000, 14000], // Random arrival interval, ms
  lifetime: [45000, 90000],    // Random visitor lifetime, active ms
  size: 30,                  // CSS px
  speed: 20,                 // Walking px per second
  jumpDistance: 130,         // Maximum ledge distance, px
  jumpHeight: 72,            // Maximum vertical ledge separation, px
  respectReducedMotion: true,
});
```

Turkeys use the top edges of visible headings, paragraphs, buttons, links, images, articles, sections, navigation, headers, footers, list items, inputs, and elements marked `data-turkey-perch`. They also walk along the bottom of the viewport. Override `perchSelector` to pick a smaller set:

```js
createTurkeys({ perchSelector: '[data-turkey-perch], button' }).start();
```

Add `data-turkey-ignore` to an element to exclude it and its descendants, or supply your own `excludeSelector`. Invalid numbers, ranges, or selectors throw early.

## Behavior and limits

- Movement runs in one `requestAnimationFrame` loop per flock; sprite animation and styles are isolated in Shadow DOM.
- Positions use viewport coordinates. Scroll, resize, DOM changes, and periodic geometry checks update the ledges. A visitor whose ledge disappears is moved to the viewport floor.
- Lifetimes and arrivals freeze in hidden tabs and during manual pauses. Reduced-motion requests hide and freeze the flock, including when the preference changes live.
- The library samples exposed element tops and uses simple parabolic hops. It is playful decoration, not a full collision or platform physics engine: it does not understand text line contours, rotated surfaces, iframe contents, or elements inside shadow roots. It reads at most 1,500 candidate elements per geometry scan; use a narrow selector on very large pages.
- The overlay uses a high z-index; browser top-layer dialogs and popovers can still appear above it. Host styles using `!important` or strict Content Security Policies may need integration-specific changes. The library injects inline styles; include it in your CSP plan if your site restricts these.
- Supported target: modern browsers with ES modules, Shadow DOM, MutationObserver, and `MediaQueryList.addEventListener`.

## Development

```sh
npm run build  # Build module + classic script, no build dependencies
npm test       # Option validation and distribution checks
npm run dev    # Serve the demo and browser test page on port 4173
```

Open `/test/browser.html` on the dev server to run lifecycle, jumping, geometry, scroll, dynamic-page, and cleanup checks in a real browser. The test result is also available as `window.testResults`. Reduced-motion and responsive layout checks can be performed with browser emulation.

MIT licensed.
