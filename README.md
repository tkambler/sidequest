# Sidequest

A dependency-free library of opt-in pixel-art games for any web page. Tiny pixel-art turkeys explore
visible ledges, flap, hop, and occasionally leave little droppings. One cowboy
patrols the bottom of the viewport. Click him to take control.

No runtime dependencies or external artwork. Supports modules and a plain script.

## Demo

```sh
npm run dev
```

Open **http://localhost:4173/demo/** and choose **Release the visitors**. The supplied
gobble clip plays once at 50% volume. **Gather the visitors** removes the scene.
The startup sound lives in `demo/assets/gobble1.mp3`. Each turkey hit plays
`demo/assets/gobble2.mp3` once at **20% volume**, for player and autonomous shots.
Each fired shot also plays `demo/assets/revolver-single-shot.mp3` at **20% volume**.
Misses do not play the hit gobble. Audio is wired in the demo; the library itself stays silent.
Use the optional `onShot` and `onTurkeyHit` callbacks to add your own sounds or responses.

## Cowboy controls

- There is exactly one cowboy per flock, separate from the turkey visitor cap.
- He slowly patrols left and right along the viewport floor and occasionally pauses to aim at a turkey and take a shot. Some shots hit; others miss.
- Click the cowboy to enter control mode. **A / D** move him, and the rifle follows
  your mouse in any direction, including behind him. Movement builds speed with
  acceleration, coasts briefly on release, and brakes before reversing. His leg
  animation quickens with actual speed and slows as he comes to rest.
- Hold the primary mouse button to charge the shot. The meter above the cowboy
  fills over **1.5 seconds**. Release to fire one ball. A longer charge gives the
  ball more speed and range; gravity bends its flight.
- While charging, a dotted gold arc extends from the barrel and grows with power.
  It tracks the mouse and previews the opening portion of the ball's flight using
  the same speed and gravity as the real shot. The small endpoint dot marks the
  end of the preview, not a guaranteed impact. The guide stops at the viewport
  edge or floor and disappears when you release, cancel, pause, or leave control.
- Page clicks, double clicks, auxiliary clicks, and context menus are blocked in
  control mode. A transparent input shield also covers embedded page content.
- **Click the cowboy again or press Escape** to return to patrol. That click does not fire. The
  same cowboy button supports keyboard activation and has a visible focus ring.
- Losing focus, pausing, hiding the tab, or enabling reduced motion cancels any
  charge and clears held keys. No surprise shot fires when you return.

Balls use swept collision checks against moving turkeys. A hit replaces the live
sprite with a stationary roast on a platter. An airborne roast falls to a visible
ledge below. Roasts fade after eight active seconds and free their visitor slot.
Shots are controlled by the player in control mode. Outside control mode, the cowboy occasionally shoots at reachable turkeys. Taking control cancels any pending autonomous shot. Both shot types produce an expanding pixel smoke puff at the muzzle.

## Add to any page

With the package in your project, import either game:

```js
import { createTurkeys, createOrcGame } from 'sidequest';
```


Copy `dist/sidequest.js` alongside your page and place this before `</body>`:

```html
<script src="./sidequest.js"></script>
<script>
  const flock = Sidequest.createTurkeys();
  // Start from your own holiday toggle:
  flock.start();
</script>
```

Or use an ES module:

```js
import { createTurkeys } from './dist/sidequest.mjs';
const flock = createTurkeys();
document.querySelector('#holiday-mode').addEventListener('click', () => {
  if (flock.running) flock.stop();
  else flock.start();
});
```

Only the cowboy accepts clicks during patrol; the rest of the overlay ignores
pointer events. Turkeys and effects stay out of the accessibility tree. The
cowboy is an accessible button. Nothing mounts until `start()`.

## API

```js
flock.start();    // Start a new scene, or resume an already running one
flock.spawn();    // Invite a turkey immediately; returns success/failure
flock.pause();    // Freeze the scene and cancel held controls
flock.resume();
flock.stop();     // Remove DOM, observers, effects, and every input listener
flock.start();    // Fresh scene, fresh cowboy in patrol mode
flock.destroy(); // Stop permanently; future start() calls throw
flock.count;     // Turkeys + roasts, excluding the cowboy
flock.running;
flock.paused;
flock.controlled;// Whether the cowboy is under player control
```

`start`, `stop`, `pause`, and `resume` return the flock for chaining. Call `start()`
after `document.body` exists. Each instance owns its own scene and cleans it up.
`turkeySVG()`, `cowboySVG()`, and `roastSVG()` export self-contained decorative
SVG strings for previews. TypeScript declarations are included.

## Options

```js
const flock = createTurkeys({
  maxTurkeys: 5,
  spawnInterval: [7000, 14000],
  lifetime: [45000, 90000],    // Live turkey lifetime, active ms
  poopInterval: [12000, 26000], // false disables droppings
  poopLifetime: 6000,
  cowboy: true,              // false for decorative turkeys only
  cowboySize: 48,            // Cowboy sprite width, CSS px
  autoShotInterval: [6500, 12000], // false disables autonomous shots
  autoShotAccuracy: .6,       // Chance of accurate aim outside control mode
  cowboySpeed: 420,          // Maximum player speed, px/second; patrol is 16 px/second
  roastLifetime: 8000,
  size: 30,                 // Turkey sprite size, CSS px
  speed: 20,                // Turkey walking speed, px/second
  jumpDistance: 130,
  jumpHeight: 72,
  respectReducedMotion: true,
});
```

Turkeys use contrasting filled edges, visible solid top borders, and exposed
upper text lines. Text perches exclude padding and unused margins. Covered spans,
rounded corners, insufficient headroom, invisible text, and rotated or scaled
surfaces are skipped. The viewport floor remains a fallback.

Override `perchSelector` to narrow candidates, for example
`'[data-turkey-perch],button,h1,h2'`. The `data-turkey-perch` marker never bypasses
visibility checks. `data-turkey-ignore` excludes an element and its descendants;
`excludeSelector` can replace it. Images need a border or contrasting background.

## Behavior and limits

- A single animation loop per flock handles movement, charges, ball flight,
  collisions, and fading. Lifetimes freeze when the scene is paused or hidden.
- The cowboy stays at the viewport floor through scrolling and resizing. Movement
  clamps at both edges, including on narrow screens.
- Droppings follow their ledge, fade after six active seconds, and disappear if
  their ledge goes away. At most 60 droppings and 32 shot effects are retained.
- Perches are conservative approximations, not pixel-perfect glyph contours.
  Image alpha, gradients without a fill, masks, pseudo-elements, iframe contents,
  and shadow-root contents are not inferred. Geometry scans consider at most
  1,500 candidate elements, 6,000 text nodes, and 8,000 edge samples.
- Styles are isolated in Shadow DOM. Strict CSPs may need integration changes
  because the library injects inline styles. Browser top-layer UI can appear
  above the overlay. Previously registered window capture handlers may observe
  an input before the library blocks its propagation.
- Modern browsers with ES modules, Shadow DOM, Pointer Events, AbortController,
  canvas text measurement, and MediaQueryList.addEventListener are supported.

## Development

```sh
npm run build
npm test
npm run dev
```

Browser checks: `/test/browser.html` for turkey lifecycle and movement,
`/test/perches.html` for visible surfaces, and `/test/cowboy.html` for control,
page input isolation, movement physics, speed-based leg animation, charging, aiming, hits, and cleanup. `/test/auto.html` covers autonomous hits, misses, and barrel smoke. Results are available
as `window.testResults`.

MIT licensed.

## Orc archer game

The demo's **Choose your game** picker offers a separate **Orc archer** mode.
The cowboy and turkey game remains available. Switching games removes the old
scene and starts the selected one if a game was already running.

```js
import { createOrcGame } from './dist/sidequest.mjs';
const game = createOrcGame();
game.start();
```

For a plain script, use `Sidequest.createOrcGame()` from the same `sidequest.js`
bundle. `orcSVG()` exports the green, horned, armored archer artwork.

One orc patrols the viewport floor, occasionally aiming and firing a flaming
arrow at an exposed page element. Accurate shots compensate for gravity;
inaccurate ones aim wide. Actual arrow collisions decide whether the element
ignites. A hit creates three tiny pixel flames attached to the impact point.
They follow scrolling, resizing, and element movement, then burn out. The page's
DOM, styles, and content are never altered by a hit. Removed or hidden targets
lose their flames. Repeated hits refresh a fire instead of stacking unlimited
flames on the same element.

Click the orc to take control with the same A/D movement, momentum, mouse aiming,
charged shots, trajectory guide, and input isolation as the cowboy. Click again
or press Escape to return to autonomous patrol. Orc mode does not play cowboy
or turkey sound effects.

```js
createOrcGame({
  size: 48,
  speed: 420,
  autoShotInterval: [3000, 6500], // false for manual shots only
  autoShotAccuracy: .6,
  targetSelector: '[data-orc-target],button,h1,h2', // Optional narrower candidates
  excludeSelector: '[data-orc-ignore],[data-turkey-ignore]',
  fireLifetime: 10000, // Active milliseconds
  maxFires: 8,
  maxArrows: 16,
  respectReducedMotion: true,
  onShot: ({ power }) => {},
  onElementHit: element => {},
}).start();
```

`start`, `pause`, `resume`, `stop`, and `destroy` have the same lifecycle semantics
as the turkey game. Read `running`, `paused`, `controlled`, `arrowCount`, and
`fireCount` for status. Pauses, hidden tabs, and reduced-motion preferences freeze
the game and cancel held controls. `stop()` removes the archer, arrows, fire,
listeners, observers, and click shield. A conservative visible-surface detector
chooses targets; invisible boxes, unsupported painted shapes, and shadow-root
contents are not inferred. Arrows can hit a visible intervening target along
their trajectory. `/test/orc.html` checks the game in a real browser.
