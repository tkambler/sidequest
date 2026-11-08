# Sidequest

A dependency-free library of opt-in pixel-art games for any web page.
Choose **Cowboy & turkeys**, **Orc archer**, or **Santa & presents** in the demo.
Launch any mode with `start({ mode, ...options })`, with module and plain-script
support and no external artwork to load.

## Demo

```sh
npm run dev
```

Three yellow cards show turkey and cowboy, Santa and kids, and the orc together,
regardless of the selected game.
Open **http://localhost:4173/demo/**, choose a game, and use its start button. In
**Cowboy & turkeys**, choose **Release the visitors**. The supplied
gobble clip plays once at 50% volume. **Gather the visitors** removes the scene.
The startup sound lives in `demo/assets/gobble1.mp3`. Each turkey hit plays
`demo/assets/gobble2.mp3` once at **20% volume**, for player and autonomous shots.
Each fired shot also plays `demo/assets/revolver-single-shot.mp3` at **20% volume**.
Misses do not play the hit gobble. Audio is wired in the demo; the library itself stays silent.
Use the optional `onShot` and `onTurkeyHit` callbacks to add your own sounds or responses.

## Cowboy controls

- There is exactly one cowboy per flock, separate from the turkey visitor cap.
- He slowly patrols left and right along the viewport floor. When the nearest
  reachable turkey is more than 600 horizontal pixels away, he runs closer,
  closing to about 400 pixels before aiming. He occasionally pauses to aim at
  a turkey and take a shot. Some shots hit; others miss.
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
Shots are controlled by the player in control mode. Outside control mode, the cowboy occasionally shoots at reachable turkeys. Taking control cancels any pending autonomous shot and pursuit. Player movement
always takes precedence. Pausing freezes pursuit; expired or offscreen targets
are dropped. Setting `autoShotInterval: false` disables autonomous pursuit too. Both shot types produce an expanding pixel smoke puff at the muzzle.

## Add to any page

With the package in your project:

```js
import { start } from 'sidequest';
const game = start({ mode: 'turkeys' });
```


Copy `dist/sidequest.js` alongside your page and place this before `</body>`:

```html
<script src="./sidequest.js"></script>
<script>
  const game = Sidequest.start({ mode: 'turkeys' });
</script>
```

Or use an ES module:

```js
import { start } from './dist/sidequest.mjs';
let flock;
document.querySelector('#holiday-mode').addEventListener('click', () => {
  if (flock?.running) flock.stop();
  else if (flock) flock.start();
  else flock = start({ mode: 'turkeys' });
});
```

Only the cowboy accepts clicks during patrol; the rest of the overlay ignores
pointer events. Turkeys and effects stay out of the accessibility tree. The
cowboy is an accessible button. Nothing mounts until `start()`.

## API

`start({ mode, ...options })` launches immediately and returns the selected game's
controller. `mode` is required: `'turkeys'` (turkey and cowboy), `'orc'`, or `'santa'`
(Santa and children). Remaining options belong to that mode. Unknown modes throw
before mounting anything. Call it after `document.body` exists.

```js
const flock = start({ mode: 'turkeys' }); // Launch immediately
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

The controller methods `start`, `stop`, `pause`, and `resume` return the flock
for chaining. Initial geometry discovery runs across animation
frames; `spawn()` returns false until it finishes, and automatic arrivals wait
for it too. Each instance owns its own scene and cleans it up.
`turkeySVG()`, `cowboySVG()`, and `roastSVG()` export self-contained decorative
SVG strings for previews. TypeScript declarations infer the controller and options
from `mode`. The older `createTurkeys`, `createOrcGame`, and `createSantaGame`
exports remain available for compatibility; they create idle controllers.

## Options

```js
const flock = start({
  mode: 'turkeys',
  maxTurkeys: 5,
  spawnInterval: [7000, 14000],
  lifetime: [45000, 90000],    // Live turkey lifetime, active ms
  poopInterval: [12000, 26000], // false disables droppings
  poopLifetime: 6000,
  cowboy: true,              // false for decorative turkeys only
  cowboySize: 48,            // Cowboy sprite width, CSS px
  autoShotInterval: [6500, 12000], // false disables autonomous shots and pursuit
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
`excludeSelector` can replace it. Mutations within excluded subtrees do not
trigger geometry discovery, so include animated decorative overlays in that
selector. Select existing host elements with arbitrary CSS selectors to narrow
geometry discovery without adding attributes, wrappers, or styles to your page.
Images need a border or contrasting background.

## Behavior and limits

- Turkey and orc geometry discovery coalesces mutation and scroll bursts, starting
  ordinary refreshes at most four times per active second. Initial discovery
  retries promptly if interrupted. Each scan advances in roughly 2 ms chunks on
  animation frames; a single DOM operation can exceed that cooperative budget.
  Existing geometry remains in use until fresh results are ready; layout changes
  cancel unfinished snapshots. Periodic scans catch changes without mutations.
  Rendering, physics and input continue between discovery chunks.
- Known turkey perches follow page scrolling, nested scroll containers and
  element translations every animation frame, keeping birds, airborne paths and
  droppings attached. Rectangle reads are shared across spans on the same element;
  following an existing perch does not rediscover it. Full discovery still handles
  visibility, size, clipping, removal, and newly available ledges.
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
as `window.testResults`. `/test/pursuit.html` covers running into firing range,
real hits, control handoff, pause/resume, and canceled targets. `/test/scroll.html`
verifies frame-by-frame card/title attachment through page, nested, horizontal
and translated scrolling. `/test/performance.html` checks incremental discovery,
scan coalescing, ignored animation subtrees, cleanup and restarted discovery for
turkeys and orcs.

MIT licensed.

## Orc archer game

The demo's **Choose your game** picker offers a separate **Orc archer** mode.
The cowboy and turkey game remains available. Switching games removes the old
scene and starts the selected one if a game was already running.

```js
import { start } from './dist/sidequest.mjs';
const game = start({ mode: 'orc' });
```

For a plain script, use `Sidequest.start({ mode: 'orc' })` from the same `sidequest.js`
bundle. `orcSVG()` exports the green, horned, armored archer artwork.

One orc patrols the viewport floor, occasionally aiming and firing a flaming
arrow at an exposed page element. He varies targets, favoring elements he has
not shot recently and skipping unreachable ones. Accurate shots compensate for gravity;
inaccurate ones aim wide. Arrows pass through intervening elements and only
collide with their intended target. Player shots target the visible surface under
the mouse on release. Actual arrow collisions decide whether that target ignites. Collision bounds reuse the turkey perch scan: visible fills, top border
strips, and text ink bounds, excluding empty container padding and transparent
border interiors. Text uses line bounds rather than individual glyph pixels.
A hit creates three tiny pixel flames attached to the impact point.
They follow scrolling, resizing, and element movement, then burn out. The page's
DOM, styles, and content are never altered by a hit. Removed or hidden targets
lose their flames. Repeated hits refresh a fire instead of stacking unlimited
flames on the same element.

Click the orc to take control with the same A/D movement, momentum, mouse aiming,
charged shots, trajectory guide, and input isolation as the cowboy. Click again
or press Escape to return to autonomous patrol. Orc mode does not play cowboy
or turkey sound effects. Each arrow fired in the demo plays
`demo/assets/arrow-swish.mp3` at **40% volume**, for both player and autonomous shots.

```js
start({
  mode: 'orc',
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

## Santa & presents

Choose **Santa & presents** in the demo and click **Start Christmas**. Boys and
girls occasionally appear on exposed page ledges or the viewport floor, waving
for a present. Santa flies in from either side, brakes into a gentle landing
beside each waiting child, and leaves a wrapped gift. Santa keeps both hands on
the reins with a tiny arm movement, makes subtle eye glances, and occasionally
blinks;
the children wave both hands. The reindeer gallop in flight, with offset strides
and a gentle bob, while the sleigh trails on a damped spring and the reins flex.
Legs settle when the team lands. He gains altitude between
stops and flies away after the deliveries. Acceleration-limited steering,
velocity, braking distance, and damped final approach give the sleigh momentum.
Children who already have a present do not receive another. Each child and
their present fade away four active seconds after delivery.

Small pixel snowflakes drift across the screen and build tiny, bounded piles
on exposed surfaces. Blue-gray edges keep the snow visible on light pages.
Snow, children, and gifts are decorative overlays. Santa is a button for optional
pilot control; page interactions work during automatic deliveries. The page's
own markup is preserved, and children and gifts follow moving ledges.

```js
import { start } from './dist/sidequest.mjs';
const christmas = start({
  mode: 'santa',
  maxChildren: 6,
  size: 28,                     // Child height, CSS pixels
  sleighSize: 184 * 2 / 3,               // Sleigh + reindeer width, CSS pixels
  spawnInterval: [5000, 10000],
  visitInterval: [8000, 15000],   // Before first visit and between trips
  lifetime: [60000, 100000],     // Waiting child lifetime, active ms
  giftLifetime: 4000,            // Child and gift leave after delivery
  snow: true,
  interactive: true,            // Click Santa to pilot; false for decoration
  flightSpeed: 320,             // Player flight, CSS px/second
  respectReducedMotion: true,
});
christmas.spawn();               // Alternates boy/girl; false if no room
christmas.spawn('girl');
christmas.pause();
christmas.resume();
christmas.stop();                // Removes the entire scene, including snow
```

Plain-script builds expose `Sidequest.start({ mode: 'santa' })`. The controller supports
`start`, `pause`, `resume`, `stop`, `destroy`, and the read-only properties
`running`, `paused`, `count`, `waitingCount`, `giftCount`, `delivering`,
`controlled`, `deliveredCount`, and `airborneGiftCount`.
`childSVG('boy' | 'girl')`, `santaSVG()`, and `giftSVG()` provide self-contained
pixel artwork without external image requests. The build also produces
`dist/santa-sleigh.svg`, a standalone vector of Santa, his sleigh, and both
reindeer, traced from the supplied reference with the trailing snow removed.

`perchSelector` narrows ledge discovery; `[data-santa-perch]` is included by
default. `excludeSelector` defaults to
`'[data-turkey-ignore],[data-santa-ignore]'`. Ledges need room for a child,
gift, and sleigh, so narrow surfaces are skipped. Visible space can limit the
number of children below `maxChildren`. Reduced motion hides and freezes the
scene by default; hiding the tab or pausing freezes all active lifetimes,
deliveries, waving, and snow. Stop/restart creates a fresh scene. Removing a
ledge relocates its visitors to the viewport floor. Snow piles are limited to
100 small patches, each at most six pixels deep, and disappear with their ledge
or when they leave the viewport.

`/test/santa.html` checks full delivery trips, waving, gifts, moving ledges,
pausing, snow rendering, cleanup, and restart with a deterministic frame clock.
Unit tests verify bounded sleigh acceleration and settled landings at multiple
frame rates.

### Pilot Santa

Click Santa while he is visiting to take control of the sleigh. **W / A / S / D**
fly with acceleration, coasting, braking, and banking. **W** climbs and **S**
descends; lower the team onto a wide ledge to land. The team stays within the
viewport while you pilot. **Click Santa again or press Escape** to return to
automatic deliveries. Enter also exits control; the Santa button supports
keyboard activation and a visible focus ring.

Aim with the mouse, **hold the primary mouse button to charge for up to 1.5
seconds, then release to toss a present**. A dotted gold arc previews the
opening flight using the same gravity and launch speed as the real gift.
**Space** can also charge/release a toss toward the current aim. A short toss
works well beside a child. Tossed gifts pass through page elements, so headings, cards, and other content
cannot obstruct a delivery. A present reaching a waiting child, or landing close
beside them on their ledge, counts as a delivery. The child celebrates and the
usual four-second departure timer begins. Missed gifts land briefly or leave
the screen, then disappear. The HUD keeps a cumulative delivery count.

Automatic deliveries pause while you pilot. Page clicks and ordinary keyboard
input are captured during control, including over embedded content. Pausing,
hiding the tab, reduced motion, or losing focus clears held controls and any
charge; resuming never releases an unintended gift. Enabling reduced motion
also exits pilot mode, so the hidden scene cannot capture page input. Stop/destroy removes all
input listeners and control UI. `interactive: false` keeps Santa decorative.
`flightSpeed` defaults to 320 CSS pixels per second. `controlled`,
`deliveredCount`, and `airborneGiftCount` expose the current state; the delivery
counter resets when the scene stops. `/test/santa-controls.html` covers player
flight, throwing, input isolation, handoff, and cleanup in a browser.

### Optional cowboy opponent

The Christmas game has no cowboy by default. Set `cowboy: true` to add the turkey game's cowboy. He patrols the viewport
floor, runs closer when Santa is too far away, aims his rifle, and fires real
ballistic shots at the sleigh. Some shots miss, and flying away from a shot can
avoid it. His bullets target only Santa's team; children, gifts, and page content
are unaffected. The cowboy stays autonomous in this mode and cannot take over
Santa's controls.

A hit produces pixel sparks and sends Santa's team into a gravity-driven crash.
Pilot control and any held charge are canceled immediately, restoring page input.
The team tumbles past page ledges to the viewport floor, lands with a dust puff,
and disappears. After **3.5 active seconds**, a fresh Santa flies in and resumes
automatic deliveries to waiting children. He returns even if no child is waiting
yet. Click him again to resume piloting. Completed deliveries and waiting children
are preserved, and each crash counts once. The cowboy stops targeting the downed
team. Crash, disappearance, recovery, cowboy movement, aiming, and shots all share
the scene's pause/visibility clock and are removed by stop/destroy.

```js
start({
  mode: 'santa',
  cowboy: true,                    // Opt in; defaults to false
  cowboySize: 48,
  cowboyShotInterval: [3500, 6500], // false disables shots and pursuit
  cowboyAccuracy: .65,
  respawnDelay: 3500,             // Active ms after the crash disappears
  onShot() { /* Optional sound */ },
});
```

`crashing` and `recovering` report the crash/recovery state.
`hitCount` and `cowboyShotCount` report totals for the current scene and reset
when it stops. The library remains silent. `/test/santa-cowboy.html` checks the
optional opponent and hit reactions.
