import { BALL_GRAVITY, projectilePoint, segmentHitTime } from './ballistics.js';
import { giftSVG } from './santa-art.js';

/** Gift projectiles share the preview's ballistic equation and sweep their hits. */
export function createSantaGifts({ scenery, surfaces, children, deliver }) {
  let gifts = [];
  function remove(gift) { gift.element.remove(); }
  return {
    toss(shot, elapsed) {
      const element = document.createElement('div'); element.className = 'flying-gift'; element.innerHTML = giftSVG();
      element.dataset.outcome = 'flying'; scenery.append(element);
      gifts.push({ element, muzzle: shot.muzzle, vx: shot.dx * shot.speed, vy: shot.dy * shot.speed,
        gravity: BALL_GRAVITY, born: elapsed, checkedAge: 0, landed: null });
      element.style.transform = `translate3d(${shot.muzzle.x - 6}px,${shot.muzzle.y - 6}px,0)`;
      if (gifts.length > 16) remove(gifts.shift());
    },
    update(elapsed) {
      gifts = gifts.filter(gift => {
        if (gift.landed) {
          const surface = surfaces().find(s => s.anchor === gift.landed.anchor && s.part === gift.landed.part);
          const remaining = 1800 - (elapsed - gift.landed.at);
          if (!surface || remaining <= 0) { remove(gift); return false; }
          const x = surface.originLeft + gift.landed.offset;
          gift.element.style.transform = `translate3d(${x - 6}px,${surface.y - 12}px,0)`;
          gift.element.style.opacity = Math.min(1, remaining / 600); return true;
        }
        const age = elapsed - gift.born;
        const from = projectilePoint(gift, gift.checkedAge), to = projectilePoint(gift, age);
        let first = Infinity, landing = null, recipient = null;
        if (to.y > from.y) for (const surface of surfaces()) {
          if (from.y + 6 > surface.y + .1 || to.y + 6 < surface.y) continue;
          const time = Math.max(0, (surface.y - 6 - from.y) / (to.y - from.y));
          const x = from.x + (to.x - from.x) * time;
          // Page content must never obstruct a delivery. Only the floor or a
          // waiting child's nearby landing spot can stop a tossed present.
          const receivingSpot = children().some(child => !child.received && !child.element.hidden &&
            Math.abs(child.surface.y - surface.y) < 3 && Math.abs(child.x + child.width / 2 - x) <= 32);
          if ((surface.part === 'floor' || receivingSpot) && x >= surface.left && x <= surface.right && time < first) { first = time; landing = { surface, x }; }
        }
        for (const child of children()) {
          if (child.received || child.element.hidden) continue;
          const x = child.previousX ?? child.x, y = child.previousY ?? child.surface.y;
          const time = segmentHitTime(from, { x: to.x - (child.x - x), y: to.y - (child.surface.y - y) },
            { left: x - 10, right: x + child.width + 10, top: y - child.height - 6, bottom: y + 6 });
          if (time !== null && time <= first) { first = time; recipient = child; }
        }
        if (!recipient && landing) recipient = children().find(child => !child.received && !child.element.hidden &&
          Math.abs(child.surface.y - landing.surface.y) < 3 && Math.abs(child.x + child.width / 2 - landing.x) <= 32);
        if (recipient) { gift.element.dataset.outcome = 'delivered'; deliver(recipient); remove(gift); return false; }
        if (landing) {
          gift.element.dataset.outcome = 'miss';
          gift.landed = { anchor: landing.surface.anchor, part: landing.surface.part, offset: landing.x - landing.surface.originLeft, at: elapsed };
          gift.element.style.transform = `translate3d(${landing.x - 6}px,${landing.surface.y - 12}px,0)`; return true;
        }
        if (age > 5000 || to.x < -24 || to.x > innerWidth + 24 || to.y > innerHeight + 24 || to.y < -innerHeight) {
          gift.element.dataset.outcome = 'miss'; remove(gift); return false;
        }
        gift.element.style.transform = `translate3d(${to.x - 6}px,${to.y - 6}px,0) rotate(${(age * .18).toFixed(1)}deg)`;
        gift.checkedAge = age; return true;
      });
    },
    destroy() { gifts.forEach(remove); gifts = []; },
    get count() { return gifts.length; },
  };
}
