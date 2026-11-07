# Tiny Turkeys

An opt-in Thanksgiving easter egg for any web page. Little 30 × 30 pixel-art turkeys stroll along element tops, flap their wings, and hop onto nearby ledges. Inspired by a classic blue-headed, brown-tailed pixel turkey.

No dependencies, network requests, external images, sound, or framework required. The overlay ignores pointer events and stays out of the accessibility tree. Nothing happens until you call `start()`.

## Try it

```sh
npm run dev
```

Open **http://localhost:4173/demo/** and choose **Release the visitors**. The supplied gobble clip plays once at 50% volume when you turn them on. Stop them with **Gather the visitors**. The clip is stored in `demo/assets/gobble1.mp3`; sound is wired to the demo button, so the library itself remains silent.

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

## Pilgrims and mixed visitors

Add slim pixel-art pilgrims with black coats, tall buckled hats, white collars, boots, and carried muskets:

```js
const flock = createTurkeys({ characters: ['turkey', 'pilgrim'] });
flock.start();
flock.spawn('pilgrim'); // Invite a particular character immediately
```

Use `characters: ['pilgrim']` for pilgrims alone. The default remains `['turkey']`.
When the list includes turkeys, each fresh start begins with a turkey. Later arrivals choose randomly from the configured list, sharing the same visitor cap. An explicit `spawn(character)` request honors the character you choose.
Pilgrims walk and hop between ledges, with stepping boots and a gently bobbing carried
musket. With turkeys nearby, pilgrims turn toward the nearest one, rotate their
muskets up or down to track it, and occasionally attempt a cartoon shot. Each shot
has a tiny flash, drifting smoke, a moving pellet, recoil, and a reload pause.
Missed turkeys give a startled flap. A musket ball that hits a turkey replaces it with a pixel-art roast on a white platter. Turkeys retain their wing flaps. `pilgrimSVG()` exports the decorative artwork
for previews, just like `turkeySVG()`.

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
  poopInterval: [12000, 26000], // Occasional turkey droppings; false disables
  poopLifetime: 6000,         // Droppings fade away after this many active ms
  shotInterval: [6500, 12000], // Pilgrim shot attempts; false disables
  musketRange: 360,           // Maximum target distance, CSS px
  shotAccuracy: .65,          // Chance of an accurate shot, 0–1
  roastLifetime: 8000,        // Roast stays on the ledge, then fades out
  size: 30,                  // CSS px
  speed: 20,                 // Walking px per second
  jumpDistance: 130,         // Maximum ledge distance, px
  jumpHeight: 72,            // Maximum vertical ledge separation, px
  respectReducedMotion: true,
});
```

Turkeys use exposed, painted surfaces: contrasting filled boxes, visible solid top
borders, and the upper text line of transparent elements. Text ledges follow the
text's width and font ascent, excluding container padding and unused margins.
Covered spans, insufficient headroom, rounded corners, hidden content, and rotated
or scaled elements are skipped. Empty layout boxes and borders or text matching
their backdrop do not create perches.

Candidates include headings, paragraphs, buttons, links, cards and other `div`
elements, sections, navigation, headers, footers, list items, inputs, code blocks,
tables, horizontal rules, and elements marked `data-turkey-perch`. The marker and
`perchSelector` select candidates; they never bypass visibility checks. Images need
a visible border or contrasting background; transparent image silhouettes are not
inferred. The bottom of the viewport remains the fallback walking surface.
Override `perchSelector` to pick a smaller set:

```js
createTurkeys({ perchSelector: '[data-turkey-perch], button' }).start();
```

Add `data-turkey-ignore` to an element to exclude it and its descendants, or supply your own `excludeSelector`. Invalid numbers, ranges, or selectors throw early.

Turkeys occasionally pause to leave a tiny pixel dropping behind them. Droppings
stay attached to their ledge during scrolling, fade away after six active seconds,
and disappear if their ledge goes away. Pausing, hidden tabs, and reduced-motion
preferences freeze their lifetimes too. Only turkeys do this; pilgrims keep walking.
Set `poopInterval: false` to disable. `stop()` and `destroy()` remove every dropping.
At most 60 droppings are kept per flock.

Pilgrims only target live turkeys within `musketRange` and an aiming elevation of
±65 degrees. Shots follow the direction of the musket when it fires, so a moving
turkey can dodge them. About 65% of shots aim accurately by default; others have a
wider angular spread. Actual swept ball collisions determine hits, including
moving turkeys. A hit replaces the live sprite with a stationary roast, disables
its walking and droppings, and removes it from future targeting. An airborne
roast falls to the first visible ledge below it. Roasts fade after eight active
seconds and share the visitor cap. `roastSVG()` exports the platter artwork.
Attempts, aiming,
reloads, pellets, and smoke all freeze when paused, motion-blocked, or hidden;
`stop()` clears every effect. At most 32 shot effects are retained per flock.

## Behavior and limits

- Movement runs in one `requestAnimationFrame` loop per flock; sprite animation and styles are isolated in Shadow DOM.
- Positions use viewport coordinates. Scroll, resize, DOM changes, and periodic geometry checks update the ledges. A visitor whose ledge disappears is moved to the viewport floor.
- Lifetimes and arrivals freeze in hidden tabs and during manual pauses. Reduced-motion requests hide and freeze the flock, including when the preference changes live.
- Ledges use conservative paint checks and hit-test samples along the edge and above it. Text is treated as a line roof, not individual glyph contours. This is playful decoration, not pixel-perfect collision physics: image alpha, gradients without a solid fill, pseudo-elements, masks, iframe contents, and shadow-root contents are not inferred. Rotated or scaled elements are skipped. Painted pointer-transparent overlays matching the candidate selector reserve their rectangular area conservatively.
- Each geometry scan considers at most 1,500 candidates, 6,000 text nodes, and 8,000 edge samples. Use a narrow selector on very large pages. Visitors and droppings are revalidated against the exposed span, so a newly covered or removed perch cannot remain a walking surface.
- The overlay uses a high z-index; browser top-layer dialogs and popovers can still appear above it. Host styles using `!important` or strict Content Security Policies may need integration-specific changes. The library injects inline styles; include it in your CSP plan if your site restricts these.
- Supported target: modern browsers with ES modules, Shadow DOM, MutationObserver, and `MediaQueryList.addEventListener`.

## Development

```sh
npm run build  # Build module + classic script, no build dependencies
npm test       # Option validation and distribution checks
npm run dev    # Serve the demo and browser test page on port 4173
```

Open `/test/browser.html` on the dev server to run lifecycle, jumping, geometry, scroll, dynamic-page, and cleanup checks in a real browser. `/test/perches.html` covers visible text, padding, borders, fills, rounded corners, clipping, overlays, and arrival placement. `/test/muskets.html` checks aiming, mirrored rotation, firing, effect cleanup, pauses, and target selection. `/test/roasts.html` checks ball travel, hits, misses, roast replacement, expiry, and cleanup. The test result is also available as `window.testResults`. Reduced-motion and responsive layout checks can be performed with browser emulation.

MIT licensed.
