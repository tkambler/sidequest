import { visiblePerches } from './perches.js';
import { BALL_GRAVITY, projectilePoint, segmentHitTime } from './ballistics.js';
import { createCowboy, cowboySVG } from './cowboy.js';
export { cowboySVG };

/** Pixel artwork is vector-based: crisp at 30px, without external assets. */
export function turkeySVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26" shape-rendering="crispEdges" aria-hidden="true">
    <g fill="#5a4b30"><path d="M15 5h4v1h2v2h2v3h1v3h-1v3h-2v2h-5z"/></g>
    <path fill="#87734b" d="M16 6h3v2h3v3h-3V9h-3zm5 7h3v2h-3zm-1 4h2v2h-2z"/>
    <path fill="#3f3427" d="M13 8h4v2h3v8h-2v3H9v-2H6v-7h4z"/>
    <path fill="#68563b" d="M12 9h4v3h2v6h-3v3H9v-2H7v-6h3v-2h2z"/>
    <g class="wing"><path fill="#958364" d="M12 13h4v1h2v4h-2v2h-4v-1h-2v-3h2z"/><path fill="#b09c76" d="M13 14h3v2h-2v2h-3v-2h2z"/></g>
    <path fill="#4f5e72" d="M5 3h5v2h1v4H9v4H7v4H4v-3H3v-4h2z"/>
    <path fill="#78849a" d="M5 2h4v1h2v4H8v4H6v3H4v-3h1z"/>
    <path fill="#959db0" d="M5 2h2v2H5z"/><path fill="#272f3b" d="M7 4h2v2H7z"/>
    <path fill="#ce5140" d="M4 7h2v3H5v3H3v-2h1z"/><path fill="#eead41" d="M3 5h2v2H2V6h1z"/>
    <g class="foot foot-a" fill="#e9ad45"><path d="M9 21h1v3h-1zM7 24h4v1H7z"/></g>
    <g class="foot foot-b" fill="#e9ad45"><path d="M15 21h1v3h-1zM15 24h4v1h-4z"/></g>
  </svg>`;
}

/** A tiny prepared roast with a drumstick, garnish, and white platter. */
export function roastSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true"><g transform="translate(0 2)">
    <path fill="#98502b" d="M5 25v-7h1v-4h2v-3h3V9h9v1h3v2h2v4h1v6h-2v3z"/>
    <path fill="#bd672f" d="M5 23v-6h2v-4h2v-2h3V9h8v1h3v3h2v8h-2v3H8v-1z"/>
    <path fill="#d5813e" d="M8 16h2v-3h3v-2h6v1h3v3h2v5h-2v3H10v-1H8z"/>
    <path fill="#e39850" d="M10 14h2v-2h5v1h-4v2h-2v3H9v-2h1z"/>
    <path fill="#e6bf54" d="M24 13h2v-2h2V9h3v3h-2v2h-2v2h-3z"/>
    <path fill="#f8dd83" d="M28 9h3v2h-3zm-3 4h2v1h-2z"/>
    <path fill="#a9582b" d="M19 21v-4h2v-2h3v-1h3v3h-1v3h-2v3h-4v-2z"/>
    <path fill="#d98743" d="M19 19v-2h2v-2h4v3h-1v3h-3v1h-2z"/>
    <path fill="#608747" d="M4 26h3v-1h2v1h4v-1h2v1h5v-1h3v1h4v2H4z"/>
    <path fill="#d25236" d="M8 26h2v2H8zm8 0h2v2h-2zm7 0h2v2h-2z"/>
    <path fill="#d8ddd5" d="M2 28h28v2H4v-1H2z"/>
    <path fill="#fffdf0" d="M1 27h30v1h-1v1H2v-1H1z"/>
  </g></svg>`;
}

const defaults = {
  maxTurkeys: 5, spawnInterval: [7000, 14000], lifetime: [45000, 90000],
  poopInterval: [12000, 26000], poopLifetime: 6000,
  cowboy: true, cowboySize: 48, cowboySpeed: 420, autoShotInterval: [6500, 12000], autoShotAccuracy: .6, roastLifetime: 8000,
  size: 30, speed: 20, jumpDistance: 130, jumpHeight: 72,
  perchSelector: 'h1,h2,h3,p,button,a,img,article,section,nav,header,footer,li,input,div,pre,blockquote,table,hr,[data-turkey-perch]',
  excludeSelector: '[data-turkey-ignore]', respectReducedMotion: true,
};
const range = ([a, b]) => a + Math.random() * (b - a);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));

/** Creates an idle flock. Call start() after the page's body exists. */
export function createTurkeys(options = {}) {
  const config = { ...defaults, ...options };
  for (const key of ['size', 'speed', 'jumpDistance', 'jumpHeight', 'poopLifetime', 'roastLifetime', 'cowboySize', 'cowboySpeed']) {
    if (!Number.isFinite(config[key]) || config[key] <= 0) throw new TypeError(`${key} must be positive`);
  }
  if (!Number.isFinite(config.autoShotAccuracy) || config.autoShotAccuracy < 0 || config.autoShotAccuracy > 1) throw new TypeError('autoShotAccuracy must be between 0 and 1');
  if (config.onShot !== undefined && typeof config.onShot !== 'function') throw new TypeError('onShot must be a function');
  if (config.onTurkeyHit !== undefined && typeof config.onTurkeyHit !== 'function') throw new TypeError('onTurkeyHit must be a function');
  if (typeof config.cowboy !== 'boolean') throw new TypeError('cowboy must be a boolean');
  if (!Number.isInteger(config.maxTurkeys) || config.maxTurkeys < 1) throw new TypeError('maxTurkeys must be a positive integer');
  for (const key of ['spawnInterval', 'lifetime', 'poopInterval', 'autoShotInterval']) {
    if (['poopInterval', 'autoShotInterval'].includes(key) && config[key] === false) continue;
    const v = config[key];
    if (!Array.isArray(v) || v.length !== 2 || !v.every(n => Number.isFinite(n) && n > 0) || v[1] < v[0]) throw new TypeError(`${key} must be [min, max] positive milliseconds`);
  }
  let host, shadow, scenery, rider, frame = 0, observer, resizeObserver, media;
  let running = false, paused = false, destroyed = false, dirty = true;
  let last = 0, elapsed = 0, nextSpawn = 0, nextScan = 0, surfaces = [], birds = [], droppings = [], shots = [];
  const floor = {};
  const reduced = () => config.respectReducedMotion && media?.matches;
  const invalidate = () => { dirty = true; };
  const blocked = () => document.hidden || paused || reduced();

  function scan() {
    surfaces = [{ element: floor, anchor: floor, part: 'floor', left: 0, right: innerWidth, y: innerHeight, originLeft: 0 }, ...visiblePerches({ ...config, overlay: host })];
    const matching = (old, x, size = config.size) => surfaces.find(s =>
      s.anchor === old.anchor && s.part === old.part && x >= s.left && x + size <= s.right);
    for (const bird of birds) {
      if (bird.flight) {
        const target = matching(bird.flight.target, bird.flight.toX);
        if (target) bird.flight.target = target;
        else { bird.flight = null; bird.surface = surfaces[0]; }
      }
      const surface = matching(bird.surface, bird.x);
      bird.surface = surface || surfaces[0];
      if (!bird.flight) {
        bird.x = clamp(bird.x, bird.surface.left, bird.surface.right - config.size);
        bird.y = bird.surface.y;
      }
    }
    // Keep little souvenirs attached to the same ledge as it moves or scrolls.
    droppings = droppings.filter(dropping => {
      const surface = surfaces.find(s => s.anchor === dropping.surface.anchor && s.part === dropping.surface.part &&
        s.originLeft + dropping.offset >= s.left && s.originLeft + dropping.offset + 5 <= s.right);
      if (!surface) { dropping.element.remove(); return false; }
      dropping.surface = surface;
      return true;
    });
    dirty = false;
  }

  function addBird(character) {
    if (character !== undefined && character !== 'turkey') {
      throw new TypeError('spawn() only adds turkeys');
    }
    if (!running || blocked() || birds.length >= config.maxTurkeys) return false;
    if (dirty) scan();
    const surface = surfaces[Math.floor(Math.random() * surfaces.length)];
    const element = document.createElement('div');
    element.className = 'bird';
    element.style.width = `${config.size}px`;
    element.style.height = `${config.size}px`;
    character = 'turkey';
    element.dataset.character = character;
    element.innerHTML = turkeySVG();
    scenery.append(element);
    const bird = {
      element, character, surface, x: range([surface.left, surface.right - config.size]), y: surface.y,
      direction: Math.random() < .5 ? -1 : 1, action: 'idle', until: elapsed + range([500, 1800]),
      born: elapsed, lifetime: range(config.lifetime), flight: null,
      nextPoop: character === 'turkey' && config.poopInterval ? elapsed + range(config.poopInterval) : Infinity,
    };
    birds.push(bird);
    paint(bird);
    return true;
  }

  function poop(bird) {
    const element = document.createElement('div');
    element.className = 'dropping';
    element.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 4" shape-rendering="crispEdges"><path fill="#65503a" d="M2 0h1v1h1v1h1v2H0V2h1V1h1z"/><path fill="#ab9673" d="M2 0h1v1H2z"/></svg>';
    scenery.append(element);
    const x = bird.x + config.size * (bird.direction === 1 ? .25 : .75);
    droppings.push({ element, surface: bird.surface, offset: x - bird.surface.originLeft, born: elapsed });
    if (droppings.length > 60) droppings.shift().element.remove();
    bird.nextPoop = elapsed + range(config.poopInterval);
    bird.action = 'poop';
    bird.until = elapsed + 450;
  }

  function paintDroppings() {
    droppings = droppings.filter(dropping => {
      const remaining = config.poopLifetime - (elapsed - dropping.born);
      if (remaining <= 0) { dropping.element.remove(); return false; }
      const x = clamp(dropping.surface.originLeft + dropping.offset, dropping.surface.left, dropping.surface.right - 5);
      dropping.element.style.transform = `translate3d(${x.toFixed(2)}px,${(dropping.surface.y - 4).toFixed(2)}px,0)`;
      dropping.element.style.opacity = Math.min(1, remaining / Math.min(800, config.poopLifetime));
      return true;
    });
  }

  function fire({ muzzle, dx, dy, power, speed }) {
    if (!running || blocked()) return;
    const element = document.createElement('div'); element.className = 'shot';
    element.innerHTML = '<i class="pellet"></i><i class="smoke"></i>';
    element.dataset.outcome = 'flying'; element.dataset.power = power.toFixed(3);
    element.firstElementChild.style.transform = `translate3d(${muzzle.x - 1.5}px,${muzzle.y - 1.5}px,0)`;
    element.lastElementChild.style.transform = `translate3d(${muzzle.x - 3}px,${muzzle.y - 3}px,0) scale(.75)`;
    element.lastElementChild.style.opacity = '.9';
    scenery.append(element);
    shots.push({ element, born: elapsed, muzzle, checkedAge: 0, hit: false,
      vx: dx * speed, vy: dy * speed, gravity: BALL_GRAVITY, duration: 3000 });
    if (shots.length > 32) shots.shift().element.remove();
    try { config.onShot?.(); } catch (error) { console.error('TinyTurkeys onShot failed', error); }
  }

  function roast(turkey) {
    turkey.character = 'roast';
    turkey.action = 'roast';
    turkey.nextPoop = Infinity;
    turkey.lifetime = elapsed - turkey.born + config.roastLifetime;
    turkey.element.dataset.character = 'roast';
    turkey.element.innerHTML = roastSVG();
    // An airborne roast drops onto the first visible ledge beneath it.
    const landing = surfaces.filter(s => s.y >= turkey.y && turkey.x >= s.left && turkey.x + config.size <= s.right)
      .sort((a, b) => a.y - b.y)[0] || surfaces[0];
    turkey.flight = landing.y > turkey.y ? {
      fromX: turkey.x, fromY: turkey.y, target: landing,
      toX: clamp(turkey.x, landing.left, landing.right - config.size), started: elapsed,
      duration: Math.max(160, Math.sqrt(2 * (landing.y - turkey.y) / 900) * 1000), falling: true,
    } : null;
    turkey.surface = landing;
    paint(turkey);
  }

  function paintShots() {
    shots = shots.filter(shot => {
      const age = elapsed - shot.born;
      const position = ms => projectilePoint(shot, ms);
      const from = position(shot.checkedAge), to = position(Math.min(age, shot.duration));
      if (!shot.hit && shot.checkedAge < shot.duration) {
        let victim = null, first = Infinity;
        for (const turkey of birds) {
          if (turkey.character !== 'turkey') continue;
          const x = turkey.previousX ?? turkey.x, y = turkey.previousY ?? turkey.y;
          // Sweep relative to the turkey's motion too, avoiding tunneling on slow frames.
          const time = segmentHitTime(from, { x: to.x - (turkey.x - x), y: to.y - (turkey.y - y) }, {
            left: x + config.size * .15 - 1.5, right: x + config.size * .85 + 1.5,
            top: y - config.size * .85 - 1.5, bottom: y - config.size * .1 + 1.5,
          });
          if (time !== null && time < first) { victim = turkey; first = time; }
        }
        if (victim) {
          roast(victim); shot.hit = true; shot.element.dataset.outcome = 'hit';
          try { config.onTurkeyHit?.(); } catch (error) { console.error('TinyTurkeys onTurkeyHit failed', error); }
        }
      }
      shot.checkedAge = Math.min(age, shot.duration);
      if (age > 0 && (to.x < -16 || to.x > innerWidth + 16 || to.y > innerHeight + 4 || to.y < -innerHeight)) shot.duration = Math.min(shot.duration, age);
      if (!shot.hit && age >= shot.duration) shot.element.dataset.outcome = 'miss';
      if (age >= Math.max(shot.hit ? 0 : shot.duration, 850)) { shot.element.remove(); return false; }
      const pellet = shot.element.firstElementChild, smoke = shot.element.lastElementChild;
      pellet.style.transform = `translate3d(${to.x - 1.5}px,${to.y - 1.5}px,0)`;
      pellet.style.opacity = !shot.hit && age < shot.duration ? '1' : '0';
      const velocity = Math.hypot(shot.vx, shot.vy) || 1;
      smoke.style.transform = `translate3d(${shot.muzzle.x - 3 + shot.vx / velocity * age * .012}px,${shot.muzzle.y - 3 + shot.vy / velocity * age * .006 - age * .018}px,0) scale(${.75 + age / 400})`;
      smoke.style.opacity = Math.max(0, 1 - age / 850) * .9;
      return true;
    });
  }

  function decide(bird) {
    const candidates = surfaces.filter(s => {
      const targetX = clamp(bird.x, s.left, s.right - config.size);
      return s !== bird.surface && Math.abs(s.y - bird.y) <= config.jumpHeight &&
        Math.hypot(targetX - bird.x, s.y - bird.y) <= config.jumpDistance;
    });
    if (candidates.length && Math.random() < .5) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      bird.flight = { fromX: bird.x, fromY: bird.y, target,
        toX: clamp(bird.x + range([-25, 25]), target.left, target.right - config.size), started: elapsed, duration: range([550, 850]) };
      bird.action = 'jump';
      bird.direction = bird.flight.toX < bird.x ? -1 : 1;
    } else {
      const roll = Math.random();
      bird.action = roll < .65 ? 'walk' : roll < .85 && bird.character === 'turkey' ? 'flap' : 'idle';
      if (Math.random() < .25) bird.direction *= -1;
      bird.until = elapsed + range([700, 2800]);
    }
  }

  function paint(bird) {
    bird.element.dataset.action = bird.action;
    // Mirror the artwork to face its direction of travel.
    bird.element.style.transform = `translate3d(${bird.x.toFixed(2)}px,${(bird.y - config.size).toFixed(2)}px,0)`;
    bird.element.firstElementChild.style.transform = `scaleX(${bird.character === 'roast' ? 1 : -bird.direction})`;
    const remaining = bird.lifetime - (elapsed - bird.born);
    bird.element.style.opacity = Math.max(0, Math.min(1, (elapsed - bird.born) / 400, remaining / 800));
  }

  function tick(now) {
    frame = 0;
    if (!running || blocked()) { last = 0; return; }
    const dt = last ? Math.min(now - last, 50) : 0;
    last = now;
    elapsed += dt;
    rider?.update(dt, elapsed);
    if (dirty || elapsed >= nextScan) { scan(); nextScan = elapsed + 1200; }
    if (elapsed >= nextSpawn) { addBird(); nextSpawn = elapsed + range(config.spawnInterval); }
    birds = birds.filter(bird => {
      if (elapsed - bird.born >= bird.lifetime) { bird.element.remove(); return false; }
      bird.previousX = bird.x; bird.previousY = bird.y;
      if (bird.flight) {
        const f = bird.flight, t = clamp((elapsed - f.started) / f.duration, 0, 1);
        f.toX = clamp(f.toX, f.target.left, f.target.right - config.size);
        bird.x = f.fromX + (f.toX - f.fromX) * t;
        bird.y = f.fromY + (f.target.y - f.fromY) * (f.falling ? t * t : t) - (f.falling ? 0 : 4 * config.jumpHeight * .65 * t * (1 - t));
        if (t === 1) { dirty = true; bird.surface = f.target; bird.flight = null; bird.action = bird.character === 'roast' ? 'roast' : 'idle'; bird.until = elapsed + 500; }
      } else if (bird.character !== 'roast') {
        if (elapsed >= bird.nextPoop) poop(bird);
        else if (elapsed >= bird.until) decide(bird);
        if (bird.action === 'walk') {
          bird.x += bird.direction * config.speed * dt / 1000;
          const lo = bird.surface.left, hi = bird.surface.right - config.size;
          if (bird.x <= lo || bird.x >= hi) { bird.x = clamp(bird.x, lo, hi); bird.direction *= -1; bird.until = elapsed; }
        }
      }
      paint(bird);
      return true;
    });
    paintDroppings();
    paintShots();
    frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!running) return;
    const isBlocked = blocked();
    rider?.suspend(isBlocked);
    host.hidden = Boolean(reduced());
    host.style.animationPlayState = isBlocked ? 'paused' : 'running';
    host.dataset.paused = String(isBlocked);
    if (isBlocked) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else if (!frame) { dirty = true; frame = requestAnimationFrame(tick); }
  }

  const api = {
    start() {
      if (destroyed) throw new Error('This flock has been destroyed');
      if (running) { paused = false; wake(); return api; }
      if (!document.body) throw new Error('Call start() after document.body exists');
      // Fail early for malformed selectors, before adding any DOM or listeners.
      document.querySelector(config.perchSelector);
      document.querySelector(config.excludeSelector);
      media = window.matchMedia('(prefers-reduced-motion: reduce)');
      host = document.createElement('tiny-turkeys');
      host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483647!important;overflow:hidden!important;display:block!important;';
      shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>
        :host([hidden]){visibility:hidden!important} .bird{position:absolute;left:0;top:0;pointer-events:none;will-change:transform;contain:layout style}
        svg{width:100%;height:100%;overflow:visible;image-rendering:pixelated;display:block}
        .cowboy{all:initial;box-sizing:border-box;position:absolute;bottom:0;left:0;z-index:20;display:block;cursor:pointer;pointer-events:auto;touch-action:none;user-select:none}
        .cowboy:focus-visible{outline:none;filter:drop-shadow(0 0 3px #e4b655)}
        .cowboy[data-controlled="true"]{filter:drop-shadow(0 0 2px #e4b655)}
        .cowboy svg{pointer-events:none}
        .cowboy-shield{position:absolute;inset:0;z-index:10;pointer-events:auto;cursor:crosshair;touch-action:none}
        .cowboy-shield[hidden],.charge-meter[hidden],.cowboy-hint[hidden]{display:none}
        .trajectory-preview{position:absolute;inset:0;z-index:11;pointer-events:none;overflow:hidden}
        .trajectory-preview[hidden]{display:none}
        .trajectory-preview path{fill:none;stroke-linecap:round;stroke-dasharray:3 8}
        .trajectory-outline{stroke:#40372a;stroke-width:4;opacity:.45}
        .trajectory-line{stroke:#e9bd5c;stroke-width:2}
        .trajectory-tip{fill:#f4cf73;stroke:#51402b;stroke-width:1}
        .charge-meter{box-sizing:border-box;position:absolute;z-index:21;width:44px;height:6px;border:1px solid #403c2c;background:#f4efda;pointer-events:none}
        .charge-fill{display:block;height:100%;background:#d69a32}
        .cowboy-hint{border-radius:3px;position:absolute;z-index:21;box-sizing:border-box;width:260px;max-width:calc(100vw - 16px);padding:5px 7px;background:#303b30;color:#fff5d8;font:10px/1.4 ui-monospace,monospace;pointer-events:none;text-align:center}
        [data-walking="true"] .leg-a{animation:cowboy-step var(--stride-duration,.68s) steps(2,end) infinite}
        [data-walking="true"] .leg-b{animation:cowboy-step var(--stride-duration,.68s) steps(2,end) infinite;animation-delay:calc(var(--stride-duration,.68s) * -.5)}
        @keyframes cowboy-step{50%{transform:translateX(var(--stride-distance,1px)) translateY(-1px)}}
        .shot,.pellet,.smoke{position:absolute;left:0;top:0;pointer-events:none}
        .shot{z-index:19}
        .pellet{width:3px;height:3px;border-radius:1px;background:#493b2d;box-shadow:1px 0 #e0cda0}
        .smoke{width:7px;height:6px;background:#c1b9a8;box-shadow:3px -3px #ded8ca,-3px 1px #a39d90;transform-origin:center}
        .dropping{position:absolute;left:0;top:0;width:5px;height:4px;pointer-events:none}
        [data-action="poop"] svg{translate:0 1px}
        .wing{transform-box:fill-box;transform-origin:80% 30%} .foot{transform-box:fill-box;transform-origin:center}
        [data-action="walk"] .foot-a{animation:step .24s steps(2,end) infinite}
        [data-action="walk"] .foot-b{animation:step .24s steps(2,end) -.12s infinite}
        [data-action="flap"] .wing,[data-action="jump"] .wing{animation:flap .16s steps(2,end) infinite}
        :host([data-paused="true"]) *{animation-play-state:paused!important}
        @keyframes step{50%{transform:translateY(-2px) rotate(20deg)}}
        @keyframes flap{50%{transform:rotate(-65deg) translateY(-2px)}}
      </style>`;
      document.body.append(host);
      scenery = document.createElement('div'); scenery.setAttribute('aria-hidden', 'true'); shadow.append(scenery);
      if (config.cowboy) rider = createCowboy({ root: shadow, size: config.cowboySize, speed: config.cowboySpeed, fire,
        autoShotInterval: config.autoShotInterval, autoShotAccuracy: config.autoShotAccuracy,
        targets: () => birds.filter(bird => bird.character === 'turkey' && elapsed - bird.born < bird.lifetime)
          .map(bird => ({ id: bird, x: bird.x + config.size / 2, y: bird.y - config.size * .55, radius: config.size * .35 })) });
      observer = new MutationObserver(records => {
        if (records.some(r => r.target !== host)) invalidate();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(invalidate);
        resizeObserver.observe(document.body);
      }
      window.addEventListener('resize', invalidate);
      window.addEventListener('scroll', invalidate, true);
      document.addEventListener('visibilitychange', wake);
      media.addEventListener('change', wake);
      running = true; paused = false; dirty = true; last = 0; nextSpawn = elapsed;
      wake();
      return api;
    },
    spawn: addBird,
    pause() { paused = true; wake(); return api; },
    resume() { if (running) { paused = false; wake(); } return api; },
    stop() {
      running = false; paused = false;
      cancelAnimationFrame(frame); frame = 0; last = 0;
      observer?.disconnect(); resizeObserver?.disconnect();
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('scroll', invalidate, true);
      document.removeEventListener('visibilitychange', wake);
      media?.removeEventListener('change', wake);
      rider?.destroy(); rider = null; host?.remove(); birds = []; surfaces = []; droppings = []; shots = [];
      return api;
    },
    destroy() { api.stop(); destroyed = true; },
    get controlled() { return rider?.controlled ?? false; },
    get count() { return birds.length; },
    get running() { return running; },
    get paused() { return paused; },
  };
  return api;
}
