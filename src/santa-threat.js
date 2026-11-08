import { createCowboy } from './cowboy.js';
import { BALL_GRAVITY, projectilePoint, segmentHitTime } from './ballistics.js';

/** Separate occupied regions avoid registering hits in the air above the reins. */
export function santaHitBoxes(body, size) {
  const scale = size / 178, angle = body.bank * Math.PI / 180;
  return [[6, 5, 82, 89], [90, 37, 177, 89]].map(([left, top, right, bottom]) => {
    const points = [[left, top], [right, top], [left, bottom], [right, bottom]].map(([x, y]) => {
      const dx = (x - 89) * scale * body.direction, dy = (y - 45.5) * scale;
      return { x: body.x + size / 2 + dx * Math.cos(angle) - dy * Math.sin(angle),
        y: body.y - 90 * scale + 45.5 * scale + dx * Math.sin(angle) + dy * Math.cos(angle) };
    });
    return { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
      top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) };
  });
}

/** Sweep relative to the moving team, using both frames' bounds during banking. */
export function santaShotHit(from, to, previous, current, size) {
  const before = santaHitBoxes(previous, size), after = santaHitBoxes(current, size);
  let first = null;
  for (let i = 0; i < before.length; i++) {
    const a = before[i], b = after[i];
    const dx = (b.left + b.right - a.left - a.right) / 2, dy = (b.top + b.bottom - a.top - a.bottom) / 2;
    const padX = Math.max(0, (b.right - b.left - a.right + a.left) / 2) + 2;
    const padY = Math.max(0, (b.bottom - b.top - a.bottom + a.top) / 2) + 2;
    const time = segmentHitTime(from, { x: to.x - dx, y: to.y - dy },
      { left: a.left - padX, right: a.right + padX, top: a.top - padY, bottom: a.bottom + padY });
    if (time !== null && (first === null || time < first)) first = time;
  }
  return first;
}

/** Reuses the turkey game's cowboy, pursuit, aiming and ballistic shot physics. */
export function createSantaThreat({ root, scenery, body, size, cowboySize, interval, accuracy, hit, onShot }) {
  let elapsed = 0, shots = [], sparks = [], totalShots = 0;
  const cowboy = createCowboy({ root, size: cowboySize, speed: 420, interactive: false,
    autoShotInterval: interval, autoShotAccuracy: accuracy,
    targets: () => {
      const s = body(); if (!s || s.state === 'crashing' || s.state === 'crashed') return [];
      const box = santaHitBoxes(s, size)[0], x = (box.left + box.right) / 2, y = (box.top + box.bottom) / 2;
      return x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight ? [{ id: s, x, y, radius: Math.max(10, size * .18) }] : [];
    },
    fire(shot) {
      const element = document.createElement('div'); element.className = 'shot cowboy-shot'; element.setAttribute('aria-hidden', 'true');
      element.innerHTML = '<i class="pellet"></i><i class="smoke"></i>'; element.dataset.outcome = 'flying';
      scenery.append(element); shots.push({ ...shot, element, born: elapsed, checkedAge: 0, hit: false, ended: false,
        vx: shot.dx * shot.speed, vy: shot.dy * shot.speed, gravity: BALL_GRAVITY });
      if (shots.length > 24) shots.shift().element.remove();
      totalShots++; onShot?.();
    },
  });
  function impact(point) {
    const element = document.createElement('div'); element.className = 'santa-impact'; element.setAttribute('aria-hidden', 'true');
    element.innerHTML = '<svg viewBox="0 0 20 20" shape-rendering="crispEdges"><path fill="#f7d66b" d="M9 0h2v5H9zM9 15h2v5H9zM0 9h5v2H0zM15 9h5v2h-5zM3 3h3v3H3zM14 3h3v3h-3zM3 14h3v3H3zM14 14h3v3h-3z"/><path fill="#fff8de" d="M8 7h4v6H8zM6 9h8v2H6z"/></svg>';
    scenery.append(element); sparks.push({ element, point, born: elapsed });
    if (sparks.length > 8) sparks.shift().element.remove();
  }
  return {
    update(dt, now) {
      elapsed = now; cowboy.update(dt, now);
      shots = shots.filter(shot => {
        const age = elapsed - shot.born, from = projectilePoint(shot, shot.checkedAge), to = projectilePoint(shot, Math.min(age, 4000));
        const s = body();
        if (!shot.hit && !shot.ended && s && s.state !== 'crashing' && s.state !== 'crashed') {
          const time = santaShotHit(from, to, s.previousPose || s, s, size);
          if (time !== null) {
            shot.hit = true; shot.element.dataset.outcome = 'hit';
            if (hit(shot)) impact({ x: from.x + (to.x - from.x) * time, y: from.y + (to.y - from.y) * time });
          }
        }
        shot.checkedAge = Math.min(age, 4000);
        if (!shot.hit && (age >= 4000 || to.x < -16 || to.x > innerWidth + 16 || to.y > innerHeight + 4 || to.y < -innerHeight)) {
          shot.ended = true; shot.element.dataset.outcome = 'miss';
        }
        if ((shot.hit || shot.ended) && age >= 850) { shot.element.remove(); return false; }
        const pellet = shot.element.firstElementChild, smoke = shot.element.lastElementChild;
        pellet.style.transform = `translate3d(${to.x - 1.5}px,${to.y - 1.5}px,0)`;
        pellet.style.opacity = shot.hit || shot.ended ? '0' : '1';
        const direction = Math.hypot(shot.vx, shot.vy) || 1;
        smoke.style.transform = `translate3d(${shot.muzzle.x - 3 + shot.vx / direction * age * .012}px,${shot.muzzle.y - 3 + shot.vy / direction * age * .006 - age * .018}px,0) scale(${.75 + age / 400})`;
        smoke.style.opacity = Math.max(0, 1 - age / 850) * .9;
        return true;
      });
      sparks = sparks.filter(spark => {
        const age = elapsed - spark.born;
        if (age >= 450) { spark.element.remove(); return false; }
        spark.element.style.transform = `translate3d(${spark.point.x - 10}px,${spark.point.y - 10 - age * .008}px,0) scale(${.6 + age / 450})`;
        spark.element.style.opacity = 1 - age / 450; return true;
      });
    },
    suspend(value) { cowboy.suspend(value); },
    destroy() { cowboy.destroy(); shots.forEach(s => s.element.remove()); sparks.forEach(s => s.element.remove()); shots = []; sparks = []; },
    get shotCount() { return totalShots; },
  };
}
