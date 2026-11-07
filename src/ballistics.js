/** Shared by live balls and the charging trajectory preview. */
export const BALL_GRAVITY = 420;
export function projectilePoint(shot, ms) {
  const t = ms / 1000;
  return { x: shot.muzzle.x + shot.vx * t,
    y: shot.muzzle.y + shot.vy * t + .5 * shot.gravity * t * t };
}

/** Shot speed in CSS pixels/second, from a quick tap to a full charge. */
export function chargeVelocity(power) { return 260 + Math.max(0, Math.min(1, power)) * 900; }

/** Matches cowboySVG's rifle pivot (19,23) and muzzle (37,23), in a 40x42 viewBox. */
export function riflePose(x, bottom, size, direction, mouse) {
  const pivotX = x + (direction === 1 ? 19 : 21) * size / 40;
  const pivotY = bottom - (42 - 23) * size / 40;
  let dx = mouse.x - pivotX, dy = mouse.y - pivotY;
  if (Math.hypot(dx, dy) < .001) { dx = direction; dy = 0; }
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length, uy = dy / length;
  return { angle: Math.atan2(dy, dx * direction) * 180 / Math.PI,
    muzzle: { x: pivotX + ux * 18 * size / 40, y: pivotY + uy * 18 * size / 40 },
    dx: ux, dy: uy };
}

/** Entry time along a swept ball segment, or null when it misses the box. */
export function segmentHitTime(from, to, box) {
  let entry = 0, exit = 1;
  for (const [axis, min, max] of [['x', box.left, box.right], ['y', box.top, box.bottom]]) {
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < 1e-9) {
      if (from[axis] < min || from[axis] > max) return null;
    } else {
      const a = (min - from[axis]) / delta, b = (max - from[axis]) / delta;
      entry = Math.max(entry, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (entry > exit) return null;
    }
  }
  return entry;
}

/** Preview only the opening flight, extending farther as power builds. */
export function previewTrajectory(pose, power, width, height) {
  const strength = Math.max(0, Math.min(1, power));
  const speed = chargeVelocity(strength);
  const shot = { muzzle: pose.muzzle, vx: pose.dx * speed, vy: pose.dy * speed, gravity: BALL_GRAVITY };
  const duration = 220 + strength * 280;
  const inside = point => point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
  if (!inside(pose.muzzle)) return [];
  const points = [projectilePoint(shot, 0)];
  for (let i = 1; i <= 24; i++) {
    const point = projectilePoint(shot, duration * i / 24);
    if (!inside(point)) {
      const previous = points.at(-1);
      let fraction = 1;
      for (const [axis, limit] of [['x', width], ['y', height]]) {
        const delta = point[axis] - previous[axis];
        if (point[axis] < 0) fraction = Math.min(fraction, -previous[axis] / delta);
        if (point[axis] > limit) fraction = Math.min(fraction, (limit - previous[axis]) / delta);
      }
      points.push({ x: previous.x + (point.x - previous.x) * fraction,
        y: previous.y + (point.y - previous.y) * fraction });
      break;
    }
    points.push(point);
  }
  return points;
}

/** Low ballistic arc toward a target; null when the selected power cannot reach it. */
export function ballisticDirection(origin, target, speed) {
  const dx = target.x - origin.x, rise = origin.y - target.y, distance = Math.abs(dx);
  if (distance < .001) {
    if (rise > speed * speed / (2 * BALL_GRAVITY)) return null;
    return { dx: 0, dy: rise >= 0 ? -1 : 1 };
  }
  const discriminant = speed ** 4 - BALL_GRAVITY * (BALL_GRAVITY * distance ** 2 + 2 * rise * speed ** 2);
  if (discriminant < 0) return null;
  const angle = Math.atan((speed * speed - Math.sqrt(discriminant)) / (BALL_GRAVITY * distance));
  return { dx: Math.sign(dx) * Math.cos(angle), dy: -Math.sin(angle) };
}

/** Ballistic aim with a muzzle offset; spread rotates the barrel as well as the ball. */
export function autoAimPose(x, bottom, size, direction, target, power, spread = 0) {
  const pivot = { x: x + (direction === 1 ? 19 : 21) * size / 40, y: bottom - 19 * size / 40 };
  const length = 18 * size / 40, speed = chargeVelocity(power);
  let origin = pivot, aim;
  for (let i = 0; i < 4; i++) {
    aim = ballisticDirection(origin, target, speed);
    if (!aim) return null;
    origin = { x: pivot.x + aim.dx * length, y: pivot.y + aim.dy * length };
  }
  const dx = aim.dx * Math.cos(spread) - aim.dy * Math.sin(spread);
  const dy = aim.dx * Math.sin(spread) + aim.dy * Math.cos(spread);
  return { dx, dy, speed, angle: Math.atan2(dy, dx * direction) * 180 / Math.PI,
    muzzle: { x: pivot.x + dx * length, y: pivot.y + dy * length } };
}
