// Artwork coordinates: the hand pivots at (18,24); the muzzle ends at (33,27).
const restAngle = Math.atan2(3, 15) * 180 / Math.PI;
export function aimAt(pilgrim, turkey, size) {
  const targetX = turkey.x + size / 2, targetY = turkey.y - size * .55;
  const direction = targetX < pilgrim.x + size / 2 ? -1 : 1;
  const pivotX = pilgrim.x + size * (direction === 1 ? 18 : 16) / 34;
  const pivotY = pilgrim.y - size * 10 / 34;
  const dx = targetX - pivotX, dy = targetY - pivotY;
  const elevation = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI;
  return { direction, angle: elevation - restAngle, elevation,
    distance: Math.hypot(dx, dy), pivotX, pivotY, targetX, targetY };
}
export function muzzleAt(aim, size, angle) {
  const radians = angle * Math.PI / 180;
  return {
    x: aim.pivotX + aim.direction * (15 * Math.cos(radians) - 3 * Math.sin(radians)) * size / 34,
    y: aim.pivotY + (15 * Math.sin(radians) + 3 * Math.cos(radians)) * size / 34,
  };
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
