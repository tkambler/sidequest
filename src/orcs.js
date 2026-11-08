import { createRanger } from './ranger.js';
import { orcSVG, flameSVG, arrowSVG } from './orc-art.js';
import { SCENE_STYLES, ORC_STYLES } from './styles.js';
import { visiblePerches } from './perches.js';
import { BALL_GRAVITY, projectilePoint, segmentHitTime } from './ballistics.js';
export { orcSVG };

const orcDefaults = {
  size: 48, speed: 420, autoShotInterval: [3000, 6500], autoShotAccuracy: .6,
  fireLifetime: 10000, maxFires: 8, maxArrows: 16, respectReducedMotion: true,
  targetSelector: 'h1,h2,h3,p,button,a,img,article,section,nav,header,footer,li,input,div,pre,blockquote,table,hr,[data-orc-target]',
  excludeSelector: '[data-orc-ignore],[data-turkey-ignore]',
};

/** A separate orc game. No turkeys or cowboy are mounted by this factory. */
export function createOrcGame(options = {}) {
  const config = { ...orcDefaults, ...options };
  for (const key of ['size', 'speed', 'fireLifetime']) {
    if (!Number.isFinite(config[key]) || config[key] <= 0) throw new TypeError(`${key} must be positive`);
  }
  for (const key of ['maxFires', 'maxArrows']) {
    if (!Number.isInteger(config[key]) || config[key] < 1) throw new TypeError(`${key} must be a positive integer`);
  }
  const interval = config.autoShotInterval;
  if (interval !== false && (!Array.isArray(interval) || interval.length !== 2 || !interval.every(n => Number.isFinite(n) && n > 0) || interval[1] < interval[0])) throw new TypeError('autoShotInterval must be false or [min, max] positive milliseconds');
  if (!Number.isFinite(config.autoShotAccuracy) || config.autoShotAccuracy < 0 || config.autoShotAccuracy > 1) throw new TypeError('autoShotAccuracy must be between 0 and 1');
  for (const key of ['onShot', 'onElementHit']) if (config[key] !== undefined && typeof config[key] !== 'function') throw new TypeError(`${key} must be a function`);
  let host, root, scenery, archer, media, observer, resizeObserver;
  let running = false, paused = false, destroyed = false, frame = 0, last = 0, elapsed = 0, dirty = true, nextScan = 0;
  let targets = [], arrows = [], fires = [];
  const invalidate = () => { dirty = true; };
  const reduced = () => config.respectReducedMotion && media?.matches;
  const blocked = () => paused || document.hidden || reduced();
  const callback = (name, ...args) => { try { config[name]?.(...args); } catch (error) { console.error(`Orc game ${name} failed`, error); } };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));

  function scan() {
    targets = visiblePerches({ perchSelector: config.targetSelector, excludeSelector: config.excludeSelector, size: 20, overlay: host }).map(surface => {
      const rect = surface.element.getBoundingClientRect();
      const bottom = surface.part === 'box' ? Math.min(innerHeight, rect.bottom) : Math.min(rect.bottom, surface.y + parseFloat(getComputedStyle(surface.element).fontSize) * .85);
      const top = surface.y;
      return { id: surface.anchor, surface, element: surface.element,
        box: { left: surface.left, right: surface.right, top, bottom: Math.max(top + 2, bottom) },
        x: (surface.left + surface.right) / 2, y: top + Math.min(10, Math.max(1, (bottom - top) / 2)), radius: Math.max(16, Math.min(90, Math.max(surface.right - surface.left, bottom - top) / 2)) };
    });
    fires = fires.filter(fire => {
      if (!targets.some(target => target.element === fire.target.element)) { fire.element.remove(); return false; }
      return true;
    });
    dirty = false; nextScan = elapsed + 1000;
  }
  function shoot({ muzzle, dx, dy, speed, power }) {
    if (!running || blocked()) return;
    const element = document.createElement('div'); element.className = 'flaming-arrow';
    element.innerHTML = arrowSVG(); element.dataset.outcome = 'flying';
    const shot = { element, muzzle, vx: dx * speed, vy: dy * speed, gravity: BALL_GRAVITY, born: elapsed, checkedAge: 0 };
    element.style.transform = `translate3d(${muzzle.x - 20}px,${muzzle.y - 6}px,0) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
    scenery.append(element); arrows.push(shot);
    if (arrows.length > config.maxArrows) { const old = arrows.shift(); old.element.remove(); }
    callback('onShot', { power });
  }
  function ignite(target, point) {
    const rect = target.element.getBoundingClientRect();
    let fire = fires.find(item => item.target.element === target.element);
    if (!fire) {
      const element = document.createElement('div'); element.className = 'element-fire';
      element.innerHTML = `<i class="fire-tongue">${flameSVG()}</i><i class="fire-tongue">${flameSVG()}</i><i class="fire-tongue">${flameSVG()}</i>`;
      scenery.append(element); fire = { element }; fires.push(fire);
      if (fires.length > config.maxFires) fires.shift().element.remove();
    }
    Object.assign(fire, { target, born: elapsed, offsetX: clamp(point.x - rect.left, 0, rect.width), offsetY: clamp(point.y - rect.top, 0, rect.height) });
    callback('onElementHit', target.element);
  }
  function paintArrows() {
    arrows = arrows.filter(arrow => {
      const age = elapsed - arrow.born;
      const from = projectilePoint(arrow, arrow.checkedAge), to = projectilePoint(arrow, age);
      let victim = null, first = Infinity;
      for (const target of targets) {
        const time = segmentHitTime(from, to, target.box);
        if (time === null || time >= first) continue;
        const point = { x: from.x + (to.x - from.x) * time, y: from.y + (to.y - from.y) * time };
        // Read just inside the struck face; never ignite a hidden underlying box.
        const hit = document.elementsFromPoint(point.x + Math.sign(arrow.vx) * .5, point.y + Math.sign(to.y - from.y) * .5).find(element => element !== host);
        if (hit && (hit === target.element || target.element.contains(hit))) { first = time; victim = { target, point }; }
      }
      if (victim) {
        arrow.element.dataset.outcome = 'hit'; ignite(victim.target, victim.point); arrow.element.remove(); return false;
      }
      arrow.checkedAge = age;
      if (age >= 3000 || to.x < -24 || to.x > innerWidth + 24 || to.y > innerHeight + 12 || to.y < -innerHeight) {
        arrow.element.dataset.outcome = 'miss'; arrow.element.remove(); return false;
      }
      arrow.element.style.transform = `translate3d(${to.x - 20}px,${to.y - 6}px,0) rotate(${Math.atan2(arrow.vy + BALL_GRAVITY * age / 1000, arrow.vx) * 180 / Math.PI}deg)`;
      return true;
    });
  }
  function paintFires() {
    fires = fires.filter(fire => {
      const remaining = config.fireLifetime - (elapsed - fire.born);
      if (remaining <= 0 || !fire.target.element.isConnected) { fire.element.remove(); return false; }
      const rect = fire.target.element.getBoundingClientRect();
      fire.element.style.transform = `translate3d(${rect.left + clamp(fire.offsetX, 0, rect.width) - 15}px,${rect.top + clamp(fire.offsetY, 0, rect.height) - 18}px,0)`;
      fire.element.style.opacity = Math.min(1, remaining / Math.min(900, config.fireLifetime));
      return true;
    });
  }
  function tick(now) {
    frame = 0;
    if (!running || blocked()) { last = 0; return; }
    const dt = last ? Math.min(50, now - last) : 0; last = now; elapsed += dt;
    if (dirty || elapsed >= nextScan) scan();
    archer.update(dt, elapsed); paintArrows(); paintFires();
    frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!running) return;
    const frozen = blocked(); archer.suspend(frozen);
    host.hidden = Boolean(reduced()); host.dataset.paused = String(frozen);
    if (frozen) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else if (!frame) { dirty = true; frame = requestAnimationFrame(tick); }
  }
  const api = {
    start() {
      if (destroyed) throw new Error('This orc game has been destroyed');
      if (running) { paused = false; wake(); return api; }
      if (!document.body) throw new Error('Call start() after document.body exists');
      document.querySelector(config.targetSelector); document.querySelector(config.excludeSelector);
      media = matchMedia('(prefers-reduced-motion: reduce)');
      host = document.createElement('sidequest-orcs'); host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483647!important;overflow:hidden!important;display:block!important;';
      root = host.attachShadow({ mode: 'open' }); root.innerHTML = `<style>${SCENE_STYLES}${ORC_STYLES}</style>`;
      scenery = document.createElement('div'); scenery.setAttribute('aria-hidden', 'true'); root.append(scenery); document.body.append(host);
      archer = createRanger({ root, size: config.size, speed: config.speed, artwork: orcSVG, kind: 'orc', weapon: 'bow', fire: shoot,
        targets: () => targets, autoShotInterval: config.autoShotInterval, autoShotAccuracy: config.autoShotAccuracy });
      observer = new MutationObserver(invalidate);
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ['style', 'class', 'hidden', 'open'] });
      if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(invalidate); resizeObserver.observe(document.body); }
      window.addEventListener('resize', invalidate); window.addEventListener('scroll', invalidate, true);
      document.addEventListener('visibilitychange', wake); media.addEventListener('change', wake);
      running = true; paused = false; elapsed = 0; last = 0; dirty = true; wake(); return api;
    },
    pause() { paused = true; wake(); return api; },
    resume() { if (running) { paused = false; wake(); } return api; },
    stop() {
      running = false; paused = false; cancelAnimationFrame(frame); frame = 0; last = 0;
      observer?.disconnect(); resizeObserver?.disconnect();
      window.removeEventListener('resize', invalidate); window.removeEventListener('scroll', invalidate, true);
      document.removeEventListener('visibilitychange', wake); media?.removeEventListener('change', wake);
      archer?.destroy(); archer = null; host?.remove(); targets = []; arrows = []; fires = []; return api;
    },
    destroy() { api.stop(); destroyed = true; },
    get running() { return running; }, get paused() { return paused; }, get controlled() { return archer?.controlled ?? false; },
    get fireCount() { return fires.length; }, get arrowCount() { return arrows.length; },
  };
  return api;
}
