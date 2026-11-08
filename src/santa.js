import { childSVG, santaSVG, giftSVG } from './santa-art.js';
import { createPerchScan, affectsPerches, trackPerches } from './perches.js';
import { stepSleigh } from './sleigh-physics.js';
import { createSnow } from './snow.js';
import { createSleighAnimator } from './santa-animation.js';
import { SCENE_STYLES } from './styles.js';
import { stepSantaFlight } from './santa-flight.js';
import { createSantaControls } from './santa-controls.js';
import { createSantaGifts } from './santa-gifts.js';
import { createSantaThreat } from './santa-threat.js';
import { stepSantaCrash } from './santa-crash.js';
export { childSVG, santaSVG, giftSVG };

const santaDefaults = {
  maxChildren: 6, size: 28, sleighSize: 184 * 2 / 3, spawnInterval: [5000, 10000],
  visitInterval: [8000, 15000], lifetime: [60000, 100000], giftLifetime: 4000, respawnDelay: 3500, snow: true,
  respectReducedMotion: true, interactive: true, flightSpeed: 320,
  cowboy: false, cowboySize: 48, cowboyShotInterval: [3500, 6500], cowboyAccuracy: .65,
  perchSelector: 'h1,h2,h3,p,button,a,article,section,nav,header,footer,li,div,pre,blockquote,table,hr,[data-turkey-perch],[data-santa-perch]',
  excludeSelector: '[data-turkey-ignore],[data-santa-ignore]',
};
const SANTA_STYLES = `
:host([hidden]){visibility:hidden!important}
.child,.sleigh,.gift{position:absolute;top:0;left:0;pointer-events:none;will-change:transform}
svg{display:block;width:100%;height:100%;overflow:visible;image-rendering:pixelated}
.child{z-index:2}.sleigh{z-index:20}.gift{z-index:2}
.sleigh{bottom:auto;padding:0;border:0;background:transparent;line-height:0}
.sleigh.game-character{pointer-events:auto;cursor:pointer}.sleigh svg{pointer-events:none}.sleigh:disabled{pointer-events:none}
.sleigh[data-hit="true"]{filter:brightness(1.5) drop-shadow(0 0 3px #f5d979)}
.santa-crash-dust{position:absolute;top:0;left:0;z-index:22;width:42px;height:16px;pointer-events:none}
.santa-impact{position:absolute;top:0;left:0;z-index:23;width:20px;height:20px;pointer-events:none}
.flying-gift{position:absolute;top:0;left:0;z-index:19;width:12px;height:12px;pointer-events:none}
.santa-hud{position:absolute;z-index:22;top:12px;left:12px;max-width:calc(100vw - 24px);box-sizing:border-box;padding:10px 12px;background:#303b30;color:#fff5d8;font:11px/1.6 ui-monospace,monospace;pointer-events:none;border:1px solid #c8ae68;border-radius:3px}
.santa-hud[hidden]{display:none}.santa-hud>span{display:block}.santa-score{color:#f5d979}
.child-arm{transform-box:view-box;transform-origin:19px 24px}
.arm-left{transform-origin:5px 24px}
.christmas-snow{position:absolute;inset:0;pointer-events:none;z-index:1}
`;

/** A Christmas scene with optional player flight and its own lifecycle and clock. */
export function createSantaGame(options = {}) {
  const config = { ...santaDefaults, ...options };
  for (const key of ['size', 'sleighSize', 'giftLifetime', 'flightSpeed', 'cowboySize', 'respawnDelay']) if (!Number.isFinite(config[key]) || config[key] <= 0) throw new TypeError(`${key} must be positive`);
  if (!Number.isInteger(config.maxChildren) || config.maxChildren < 1) throw new TypeError('maxChildren must be a positive integer');
  for (const key of ['spawnInterval', 'visitInterval', 'lifetime']) {
    const value = config[key];
    if (!Array.isArray(value) || value.length !== 2 || !value.every(n => Number.isFinite(n) && n > 0) || value[1] < value[0]) throw new TypeError(`${key} must be [min, max] positive milliseconds`);
  }
  for (const key of ['snow', 'respectReducedMotion', 'interactive', 'cowboy']) if (typeof config[key] !== 'boolean') throw new TypeError(`${key} must be a boolean`);
  const shots = config.cowboyShotInterval;
  if (shots !== false && (!Array.isArray(shots) || shots.length !== 2 || !shots.every(n => Number.isFinite(n) && n > 0) || shots[1] < shots[0])) throw new TypeError('cowboyShotInterval must be false or [min, max] positive milliseconds');
  if (!Number.isFinite(config.cowboyAccuracy) || config.cowboyAccuracy < 0 || config.cowboyAccuracy > 1) throw new TypeError('cowboyAccuracy must be between 0 and 1');
  if (config.onShot !== undefined && typeof config.onShot !== 'function') throw new TypeError('onShot must be a function');
  const random = ([a, b]) => a + Math.random() * (b - a);
  const limit = (n, lo, hi) => Math.max(lo, Math.min(n, hi));
  const childWidth = config.size * .6, giftSize = 16;
  const slotWidth = childWidth + giftSize + config.sleighSize + 16;
  const floor = {};
  let host, root, scenery, media, observer, resizeObserver, pendingScan, snow, sleigh, controls, gifts, threat, crashDust;
  let running = false, paused = false, destroyed = false, frame = 0, last = 0, elapsed = 0;
  let dirty = true, lastScan = -Infinity, nextScan = 0, nextSpawn = 0, nextVisit = 0, serial = 0, deliveredCount = 0, hitCount = 0, respawnAt = null;
  let surfaces = [], children = [], snowSurfaces = [];
  const reduced = () => config.respectReducedMotion && media?.matches;
  const blocked = () => paused || document.hidden || reduced();
  const invalidate = () => { dirty = true; pendingScan = null; };
  const visible = child => child.surface.y >= config.size && child.surface.y <= innerHeight &&
    child.x >= 0 && child.x + childWidth <= innerWidth && (child.surface.element === floor || child.surface.element.isConnected);

  function scan(perches) {
    const ground = { element: floor, anchor: floor, part: 'floor', left: 0, right: innerWidth, y: innerHeight, originLeft: 0 };
    snowSurfaces = [ground, ...perches];
    surfaces = snowSurfaces.filter(s => s.right - s.left >= Math.min(slotWidth, innerWidth));
    for (const child of children) {
      const replacement = surfaces.find(s => s.anchor === child.surface.anchor && s.part === child.surface.part &&
        child.x >= s.left && child.x + childWidth + giftSize <= s.right);
      child.surface = replacement || ground;
      child.x = limit(child.x, child.surface.left, child.surface.right - childWidth - giftSize);
    }
    if (sleigh?.manualSurface) {
      const old = sleigh.manualSurface;
      sleigh.manualSurface = snowSurfaces.find(s => s.anchor === old.anchor && s.part === old.part && sleigh.x >= s.left && sleigh.x + config.sleighSize <= s.right) || null;
      if (sleigh.manualSurface) sleigh.y = sleigh.manualSurface.y;
    }
    dirty = false; lastScan = elapsed; nextScan = elapsed + 1200;
  }
  function spawn(variant) {
    if (variant !== undefined && variant !== 'boy' && variant !== 'girl') throw new TypeError('spawn() accepts boy or girl');
    if (!running || blocked() || children.length >= config.maxChildren || !surfaces.length) return false;
    const available = surfaces.filter(s => s.y >= config.size && s.y <= innerHeight);
    // Reserve room for both the child and a landed sleigh; avoid overlapping visitors.
    const spots = available.flatMap(surface => {
      const width = Math.min(slotWidth, innerWidth - 8);
      const spots = [];
      for (let x = Math.max(0, surface.left) + 4; x + width <= Math.min(innerWidth, surface.right); x += width) {
        if (children.every(c => Math.abs(c.surface.y - surface.y) > config.size || Math.abs(c.x - x) >= width)) spots.push({ surface, x });
      }
      return spots;
    });
    if (!spots.length) return false;
    const spot = spots[Math.floor(Math.random() * spots.length)];
    variant ||= serial++ % 2 ? 'girl' : 'boy';
    const element = document.createElement('div'); element.className = 'child';
    element.dataset.variant = variant; element.dataset.gift = 'false';
    element.style.cssText = `width:${childWidth}px;height:${config.size}px`;
    element.innerHTML = childSVG(variant); scenery.append(element);
    children.push({ ...spot, element, width: childWidth, height: config.size, born: elapsed, lifetime: random(config.lifetime), received: false, phase: Math.random() * 6 });
    paintChildren(); return true;
  }
  function paintChildren() {
    children = children.filter(child => {
      // A waiting child stays for the current delivery, even if its lifetime elapses.
      if (elapsed - child.born > child.lifetime && sleigh?.target !== child) {
        child.element.remove(); child.gift?.remove(); return false;
      }
      const y = child.surface.y;
      const celebration = child.received ? Math.max(0, 1 - (elapsed - child.delivered) / 700) : 0;
      const hop = Math.sin(celebration * Math.PI) * 4;
      const isVisible = visible(child);
      child.element.hidden = !isVisible;
      child.element.style.transform = `translate3d(${child.x}px,${y - config.size - hop}px,0)`;
      const fade = child.received ? Math.min(1, Math.max(0, (child.lifetime - (elapsed - child.born)) / 600)) : 1;
      child.element.style.opacity = Math.min(1, (elapsed - child.born) / 500) * fade;
      const wave = child.received ? (celebration ? -155 : -12) : -145 + Math.sin(elapsed / 180 + child.phase) * 24;
      child.element.querySelector('.arm-wave').style.transform = `rotate(${wave}deg)`;
      const leftWave = child.received ? (celebration ? 155 : 12) : 145 - Math.sin(elapsed / 180 + child.phase + .65) * 24;
      child.element.querySelector('.arm-left').style.transform = `rotate(${leftWave}deg)`;
      if (child.gift) {
        child.gift.hidden = !isVisible;
        child.gift.style.transform = `translate3d(${child.x + childWidth + 4}px,${y - giftSize}px,0)`;
        child.gift.style.opacity = Math.min(1, (elapsed - child.delivered) / 350) * fade;
      }
      return true;
    });
  }
  function deliver(child) {
    if (child.received || !children.includes(child)) return;
    const gift = document.createElement('div'); gift.className = 'gift'; gift.innerHTML = giftSVG();
    gift.style.cssText = `width:${giftSize}px;height:${giftSize}px`; scenery.append(gift);
    child.gift = gift; child.received = true; child.delivered = elapsed;
    child.element.dataset.gift = 'true'; child.born = elapsed; child.lifetime = config.giftLifetime;
    deliveredCount++;
  }
  function hitSanta(shot) {
    if (!sleigh || sleigh.state === 'crashing' || sleigh.state === 'crashed') return false;
    hitCount++; sleigh.hitUntil = elapsed + 1000; sleigh.element.dataset.hit = 'true';
    sleigh.state = 'crashing'; sleigh.element.dataset.state = 'crashing'; sleigh.target = null; sleigh.manualSurface = null;
    sleigh.vx += Math.sign(shot.vx) * 70; sleigh.vy = Math.max(60, sleigh.vy);
    if (config.interactive) sleigh.element.disabled = true;
    controls?.exit(); // Cancels held thrust/charge and releases page input immediately.
    return true;
  }
  function groundImpact(s) {
    crashDust?.element.remove();
    const element = document.createElement('div'); element.className = 'santa-crash-dust';
    element.innerHTML = '<svg viewBox="0 0 24 9" shape-rendering="crispEdges" aria-hidden="true"><path fill="#9e907d" d="M1 6h3V4h3V2h4v3h3V1h4v3h3v3h2v2H0V7h1z"/><path fill="#d9cfba" d="M3 6h3V4h3v2h3v1h3V4h3v2h3v2H3z"/></svg>';
    scenery.append(element); crashDust = { element, x: s.x + config.sleighSize / 2, born: elapsed };
  }
  function paintCrashDust() {
    if (!crashDust) return;
    const age = elapsed - crashDust.born;
    if (age >= 650) { crashDust.element.remove(); crashDust = null; return; }
    crashDust.element.style.transform = `translate3d(${crashDust.x - 21}px,${innerHeight - 16 - age * .012}px,0) scale(${1 + age / 650})`;
    crashDust.element.style.opacity = 1 - age / 650;
  }
  function changeControl(value) {
    if (!sleigh || !running || sleigh.state === 'crashing' || sleigh.state === 'crashed') return;
    sleigh.manualSurface = null;
    if (value) {
      sleigh.target = null; sleigh.state = 'manual';
      sleigh.x = limit(sleigh.x, 0, Math.max(0, innerWidth - config.sleighSize));
      sleigh.y = limit(sleigh.y, Math.min(innerHeight, config.sleighSize * 90 / 178 + 3), innerHeight);
    } else {
      const target = waiting()[0];
      if (target) { sleigh.target = target; sleigh.state = 'approach'; } else depart();
    }
  }
  const waiting = () => children.filter(c => !c.received && visible(c));
  function landingPoint(child) {
    return { x: limit(child.x + childWidth + giftSize + 10, 0, Math.max(0, innerWidth - config.sleighSize)), y: child.surface.y };
  }
  function launch(force = false) {
    const target = waiting()[0];
    if (!target && !force) return;
    const fromLeft = Math.random() < .5;
    const element = document.createElement(config.interactive ? 'button' : 'div');
    element.className = config.interactive ? 'game-character sleigh' : 'sleigh';
    if (config.interactive) { element.type = 'button'; element.setAttribute('aria-pressed', 'false'); element.setAttribute('aria-label', 'Pilot Santa. WASD flies; hold and release to toss a present.'); }
    else element.setAttribute('aria-hidden', 'true');
    element.innerHTML = santaSVG();
    element.style.cssText = `width:${config.sleighSize}px;height:${config.sleighSize * 91 / 178}px`;
    root.append(element);
    sleigh = { element, x: fromLeft ? -config.sleighSize - 10 : innerWidth + 10,
      y: Math.max(config.sleighSize, Math.min(innerHeight * .3, (target?.surface.y ?? innerHeight * .65) - 130)), vx: fromLeft ? 120 : -120,
      vy: 0, bank: 0, state: target ? 'approach' : 'returning', target, until: 0, direction: fromLeft ? 1 : -1,
      animator: createSleighAnimator(element.querySelector('svg')) };
  }
  function depart() {
    sleigh.state = 'takeoff'; sleigh.target = null;
    sleigh.exitDirection = sleigh.x < innerWidth / 2 ? 1 : -1;
    sleigh.until = elapsed + 1000; // Gain altitude before accelerating toward the edge.
    sleigh.liftPoint = { x: sleigh.x + sleigh.exitDirection * 55, y: Math.max(35, sleigh.y - 130) };
  }
  function updateSleigh(dt) {
    if (!sleigh) {
      if (respawnAt !== null) {
        if (elapsed >= respawnAt) { respawnAt = null; launch(true); }
      } else if (elapsed >= nextVisit && waiting().length) launch();
      return;
    }
    const s = sleigh;
    if (!controls?.controlled && (s.state === 'approach' || s.state === 'landed') && (!children.includes(s.target) || !visible(s.target))) {
      const next = waiting()[0];
      if (next) { s.target = next; s.state = 'approach'; } else depart();
    }
    if (s.state === 'crashing') {
      if (stepSantaCrash(s, dt, { width: innerWidth, height: innerHeight, size: config.sleighSize })) {
        s.state = 'crashed'; s.until = elapsed + 350; groundImpact(s);
      }
    } else if (s.state === 'crashed') {
      if (elapsed >= s.until) {
        s.element.remove(); sleigh = null; respawnAt = elapsed + config.respawnDelay; return;
      }
    } else if (s.state === 'returning') {
      const target = waiting()[0];
      if (target) { s.target = target; s.state = 'approach'; }
      else if (stepSleigh(s, { x: Math.max(0, (innerWidth - config.sleighSize) / 2), y: Math.max(config.sleighSize, innerHeight * .35) }, dt)) depart();
    } else if (controls?.controlled) {
      stepSantaFlight(s, controls.input, dt, { width: innerWidth, height: innerHeight, size: config.sleighSize, speed: config.flightSpeed, surfaces: snowSurfaces });
    } else if (s.state === 'approach') {
      const point = landingPoint(s.target);
      if (stepSleigh(s, point, dt, true)) {
        Object.assign(s, point, { vx: 0, vy: 0, bank: 0, state: 'landed', until: elapsed + 1600 });
      }
    } else if (s.state === 'landed') {
      Object.assign(s, landingPoint(s.target));
      if (elapsed >= s.until - 850 && !s.target.received) {
        deliver(s.target);
      }
      if (elapsed >= s.until) {
        const next = waiting()[0];
        if (next) { s.target = next; s.state = 'hop'; s.until = elapsed + 900;
          s.liftPoint = { x: s.x, y: Math.max(35, s.y - 95) }; }
        else depart();
      }
    } else if (s.state === 'hop' || s.state === 'takeoff') {
      stepSleigh(s, s.liftPoint, dt);
      if (elapsed >= s.until) s.state = s.state === 'hop' ? 'approach' : 'exit';
    } else if (s.state === 'exit') {
      stepSleigh(s, { x: s.exitDirection > 0 ? innerWidth + config.sleighSize * 3 : -config.sleighSize * 3,
        y: Math.max(20, innerHeight * .12) }, dt);
      if (s.x > innerWidth + config.sleighSize || s.x < -config.sleighSize * 1.5) {
        s.element.remove(); sleigh = null; nextVisit = elapsed + random(config.visitInterval); return;
      }
    }
    if (s.state !== 'crashing' && s.state !== 'crashed' && Math.abs(s.vx) > 12) s.direction = Math.sign(s.vx);
    s.element.dataset.hit = String(elapsed < (s.hitUntil || 0));
    s.element.dataset.state = s.state;
    s.animator.update(dt, elapsed, s);
    // The reference reindeer face right; flip the entire team for leftward flight.
    s.element.style.transform = `translate3d(${s.x}px,${s.y - config.sleighSize * 90 / 178}px,0) rotate(${s.bank.toFixed(2)}deg) scaleX(${s.direction})`;
  }
  function tick(now) {
    frame = 0;
    if (!running || blocked()) { last = 0; return; }
    const dt = last ? Math.min(50, now - last) : 0; last = now; elapsed += dt;
    if (sleigh) sleigh.previousPose = { x: sleigh.x, y: sleigh.y, bank: sleigh.bank, direction: sleigh.direction };
    for (const child of children) { child.previousX = child.x; child.previousY = child.surface.y; }
    if (snowSurfaces.length) {
      snowSurfaces[0].right = innerWidth; snowSurfaces[0].y = innerHeight;
      const movement = trackPerches(snowSurfaces);
      for (const child of children) child.x += movement.get(child.surface)?.x || 0;
      const shift = movement.get(sleigh?.manualSurface);
      if (controls?.controlled && sleigh?.manualSurface) { sleigh.x += shift?.x || 0; sleigh.y = sleigh.manualSurface.y; }
    }
    if (!pendingScan && ((dirty && elapsed - lastScan >= 250) || elapsed >= nextScan)) {
      pendingScan = createPerchScan({ perchSelector: config.perchSelector, excludeSelector: config.excludeSelector,
        size: Math.max(config.size, config.sleighSize * 91 / 178), overlay: host });
      if (lastScan !== -Infinity) lastScan = elapsed;
      nextScan = elapsed + 1200;
    }
    if (pendingScan) { const perches = pendingScan.step(); if (perches) { scan(perches); pendingScan = null; } }
    if (surfaces.length && elapsed >= nextSpawn) { spawn(); nextSpawn = elapsed + random(config.spawnInterval); }
    paintChildren(); updateSleigh(dt / 1000); threat?.update(dt, elapsed); paintCrashDust(); gifts?.update(elapsed); controls?.update(elapsed); snow?.update(dt / 1000, elapsed, snowSurfaces);
    frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!running) return;
    controls?.suspend(Boolean(blocked()), Boolean(reduced()));
    threat?.suspend(Boolean(blocked()));
    host.hidden = Boolean(reduced()); host.dataset.paused = String(blocked());
    if (blocked()) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else if (!frame) { dirty = true; pendingScan = null; frame = requestAnimationFrame(tick); }
  }
  const api = {
    start() {
      if (destroyed) throw new Error('This Santa game has been destroyed');
      if (running) { paused = false; wake(); return api; }
      if (!document.body) throw new Error('Call start() after document.body exists');
      document.querySelector(config.perchSelector); document.querySelector(config.excludeSelector);
      media = matchMedia('(prefers-reduced-motion: reduce)');
      host = document.createElement('sidequest-santa');
      host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483647!important;overflow:hidden!important;display:block!important;';
      root = host.attachShadow({ mode: 'open' }); root.innerHTML = `<style>${SCENE_STYLES}${SANTA_STYLES}</style>`;
      scenery = document.createElement('div'); scenery.setAttribute('aria-hidden', 'true'); root.append(scenery); document.body.append(host);
      gifts = createSantaGifts({ scenery, surfaces: () => snowSurfaces, children: () => children, deliver });
      if (config.interactive) controls = createSantaControls({ root, body: () => sleigh, size: config.sleighSize, change: changeControl, toss: shot => gifts.toss(shot, elapsed), score: () => deliveredCount, danger: () => config.cowboy ? hitCount : null });
      if (config.cowboy) threat = createSantaThreat({ root, scenery, body: () => sleigh, size: config.sleighSize, cowboySize: config.cowboySize, interval: config.cowboyShotInterval, accuracy: config.cowboyAccuracy, hit: hitSanta,
        onShot: () => { try { config.onShot?.(); } catch (error) { console.error('Santa onShot failed', error); } } });
      if (config.snow) snow = createSnow(root);
      observer = new MutationObserver(records => { if (records.some(record => affectsPerches(record, host, config.excludeSelector))) invalidate(); });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
      if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(invalidate); resizeObserver.observe(document.body); }
      window.addEventListener('resize', invalidate); window.addEventListener('scroll', invalidate, true);
      document.addEventListener('visibilitychange', wake); media.addEventListener('change', wake);
      running = true; paused = false; elapsed = 0; last = 0; lastScan = -Infinity; nextScan = 0;
      nextSpawn = 0; nextVisit = random(config.visitInterval); serial = 0; deliveredCount = 0; hitCount = 0; respawnAt = null; dirty = true; wake(); return api;
    },
    spawn,
    pause() { paused = true; wake(); return api; },
    resume() { if (running) { paused = false; wake(); } return api; },
    stop() {
      running = false; paused = false; cancelAnimationFrame(frame); frame = 0; last = 0;
      observer?.disconnect(); resizeObserver?.disconnect(); pendingScan = null;
      window.removeEventListener('resize', invalidate); window.removeEventListener('scroll', invalidate, true);
      document.removeEventListener('visibilitychange', wake); media?.removeEventListener('change', wake);
      threat?.destroy(); threat = null; hitCount = 0; respawnAt = null;
      crashDust?.element.remove(); crashDust = null;
      controls?.destroy(); controls = null; gifts?.destroy(); gifts = null; deliveredCount = 0;
      snow?.destroy(); snow = null; host?.remove(); sleigh = null; children = []; surfaces = []; snowSurfaces = []; return api;
    },
    destroy() { api.stop(); destroyed = true; },
    get running() { return running; }, get paused() { return paused; },
    get count() { return children.length; }, get waitingCount() { return children.filter(c => !c.received).length; },
    get giftCount() { return children.filter(c => c.received).length; },
    get delivering() { return Boolean(sleigh); },
    get controlled() { return controls?.controlled ?? false; },
    get deliveredCount() { return deliveredCount; },
    get crashing() { return sleigh?.state === 'crashing' || sleigh?.state === 'crashed'; },
    get recovering() { return respawnAt !== null; },
    get hitCount() { return hitCount; },
    get cowboyShotCount() { return threat?.shotCount ?? 0; },
    get airborneGiftCount() { return gifts?.count ?? 0; },
  };
  return api;
}
