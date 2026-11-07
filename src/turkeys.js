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

const defaults = {
  maxTurkeys: 5, spawnInterval: [7000, 14000], lifetime: [45000, 90000],
  size: 30, speed: 20, jumpDistance: 130, jumpHeight: 72,
  perchSelector: 'h1,h2,h3,p,button,a,img,article,section,nav,header,footer,li,input,[data-turkey-perch]',
  excludeSelector: '[data-turkey-ignore]', respectReducedMotion: true,
};
const range = ([a, b]) => a + Math.random() * (b - a);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));

/** Creates an idle flock. Call start() after the page's body exists. */
export function createTurkeys(options = {}) {
  const config = { ...defaults, ...options };
  for (const key of ['size', 'speed', 'jumpDistance', 'jumpHeight']) {
    if (!Number.isFinite(config[key]) || config[key] <= 0) throw new TypeError(`${key} must be positive`);
  }
  if (!Number.isInteger(config.maxTurkeys) || config.maxTurkeys < 1) throw new TypeError('maxTurkeys must be a positive integer');
  for (const key of ['spawnInterval', 'lifetime']) {
    const v = config[key];
    if (!Array.isArray(v) || v.length !== 2 || !v.every(n => Number.isFinite(n) && n > 0) || v[1] < v[0]) throw new TypeError(`${key} must be [min, max] positive milliseconds`);
  }
  let host, shadow, frame = 0, observer, resizeObserver, media;
  let running = false, paused = false, destroyed = false, dirty = true;
  let last = 0, elapsed = 0, nextSpawn = 0, nextScan = 0, surfaces = [], birds = [];
  const floor = {};
  const reduced = () => config.respectReducedMotion && media?.matches;
  const invalidate = () => { dirty = true; };
  const blocked = () => document.hidden || paused || reduced();

  function scan() {
    const width = window.innerWidth, height = window.innerHeight;
    const result = [{ element: floor, left: 0, right: width, y: height }];
    // Cap geometry reads on very large documents. Explicit perches can narrow the search.
    const nodes = document.querySelectorAll(config.perchSelector);
    for (let i = 0; i < Math.min(nodes.length, 1500); i++) {
      const element = nodes[i];
      if (element === host || element.closest(config.excludeSelector)) continue;
      const rect = element.getBoundingClientRect();
      const left = Math.max(0, rect.left), right = Math.min(width, rect.right);
      if (right - left < config.size + 8 || rect.top < config.size || rect.top > height || rect.bottom <= rect.top) continue;
      const style = getComputedStyle(element);
      if (style.visibility !== 'visible' || Number(style.opacity) === 0) continue;
      // Check that the top edge is actually exposed rather than hidden behind a modal.
      const hit = document.elementFromPoint((left + right) / 2, rect.top + 1);
      if (!hit || !(element === hit || element.contains(hit))) continue;
      result.push({ element, left, right, y: rect.top });
    }
    surfaces = result;
    for (const bird of birds) {
      if (bird.flight) {
        const target = surfaces.find(s => s.element === bird.flight.target.element);
        if (target) bird.flight.target = target;
        else { bird.flight = null; bird.surface = surfaces[0]; }
      }
      const surface = surfaces.find(s => s.element === bird.surface.element);
      bird.surface = surface || surfaces[0];
      if (!bird.flight) {
        bird.x = clamp(bird.x, bird.surface.left, bird.surface.right - config.size);
        bird.y = bird.surface.y;
      }
    }
    dirty = false;
  }

  function addBird() {
    if (!running || blocked() || birds.length >= config.maxTurkeys) return false;
    if (dirty) scan();
    const surface = surfaces[Math.floor(Math.random() * surfaces.length)];
    const element = document.createElement('div');
    element.className = 'bird';
    element.style.width = `${config.size}px`;
    element.style.height = `${config.size}px`;
    element.innerHTML = turkeySVG();
    shadow.append(element);
    const bird = {
      element, surface, x: range([surface.left, surface.right - config.size]), y: surface.y,
      direction: Math.random() < .5 ? -1 : 1, action: 'idle', until: elapsed + range([500, 1800]),
      born: elapsed, lifetime: range(config.lifetime), flight: null,
    };
    birds.push(bird);
    paint(bird);
    return true;
  }

  function decide(bird) {
    const candidates = surfaces.filter(s => {
      const targetX = clamp(bird.x, s.left, s.right - config.size);
      return s.element !== bird.surface.element && Math.abs(s.y - bird.y) <= config.jumpHeight &&
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
      bird.action = roll < .65 ? 'walk' : roll < .85 ? 'flap' : 'idle';
      if (Math.random() < .25) bird.direction *= -1;
      bird.until = elapsed + range([700, 2800]);
    }
  }

  function paint(bird) {
    bird.element.dataset.action = bird.action;
    // Artwork faces left; mirror only the SVG so movement coordinates remain stable.
    bird.element.style.transform = `translate3d(${bird.x.toFixed(2)}px,${(bird.y - config.size).toFixed(2)}px,0)`;
    bird.element.firstElementChild.style.transform = `scaleX(${-bird.direction})`;
    const remaining = bird.lifetime - (elapsed - bird.born);
    bird.element.style.opacity = Math.max(0, Math.min(1, (elapsed - bird.born) / 400, remaining / 800));
  }

  function tick(now) {
    frame = 0;
    if (!running || blocked()) { last = 0; return; }
    const dt = last ? Math.min(now - last, 50) : 0;
    last = now;
    elapsed += dt;
    if (dirty || elapsed >= nextScan) { scan(); nextScan = elapsed + 1200; }
    if (elapsed >= nextSpawn) { addBird(); nextSpawn = elapsed + range(config.spawnInterval); }
    birds = birds.filter(bird => {
      if (elapsed - bird.born >= bird.lifetime) { bird.element.remove(); return false; }
      if (bird.flight) {
        const f = bird.flight, t = clamp((elapsed - f.started) / f.duration, 0, 1);
        f.toX = clamp(f.toX, f.target.left, f.target.right - config.size);
        bird.x = f.fromX + (f.toX - f.fromX) * t;
        bird.y = f.fromY + (f.target.y - f.fromY) * t - 4 * config.jumpHeight * .65 * t * (1 - t);
        if (t === 1) { bird.surface = f.target; bird.flight = null; bird.action = 'idle'; bird.until = elapsed + 500; }
      } else {
        if (elapsed >= bird.until) decide(bird);
        if (bird.action === 'walk') {
          bird.x += bird.direction * config.speed * dt / 1000;
          const lo = bird.surface.left, hi = bird.surface.right - config.size;
          if (bird.x <= lo || bird.x >= hi) { bird.x = clamp(bird.x, lo, hi); bird.direction *= -1; bird.until = elapsed; }
        }
      }
      paint(bird);
      return true;
    });
    frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!running) return;
    const isBlocked = blocked();
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
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483647!important;overflow:hidden!important;display:block!important;';
      shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>
        :host([hidden]){visibility:hidden!important} .bird{position:absolute;left:0;top:0;pointer-events:none;will-change:transform;contain:layout style}
        svg{width:100%;height:100%;overflow:visible;image-rendering:pixelated;display:block}
        .wing{transform-box:fill-box;transform-origin:80% 30%} .foot{transform-box:fill-box;transform-origin:center}
        [data-action="walk"] .foot-a{animation:step .24s steps(2,end) infinite}
        [data-action="walk"] .foot-b{animation:step .24s steps(2,end) -.12s infinite}
        [data-action="flap"] .wing,[data-action="jump"] .wing{animation:flap .16s steps(2,end) infinite}
        :host([data-paused="true"]) *{animation-play-state:paused!important}
        @keyframes step{50%{transform:translateY(-2px) rotate(20deg)}}
        @keyframes flap{50%{transform:rotate(-65deg) translateY(-2px)}}
      </style>`;
      document.body.append(host);
      observer = new MutationObserver(records => {
        if (records.some(r => r.target !== host)) invalidate();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
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
      host?.remove(); birds = []; surfaces = [];
      return api;
    },
    destroy() { api.stop(); destroyed = true; },
    get count() { return birds.length; },
    get running() { return running; },
    get paused() { return paused; },
  };
  return api;
}
