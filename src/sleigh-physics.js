/** Acceleration-limited steering with braking distance and damped final approach.
 * Coordinates are CSS pixels; velocity is px/s, acceleration px/s².
 * Gravity is balanced by magical lift in flight; landing uses spring damping.
 */
export function stepSleigh(body, target, dt, landing = false) {
  const dx = target.x - body.x, dy = target.y - body.y;
  const distance = Math.hypot(dx, dy);
  const maxAcceleration = landing ? 230 : 330;
  const speed = Math.min(landing ? 210 : 350, Math.sqrt(2 * maxAcceleration * distance) * .65);
  let ax, ay;
  if (distance < 65 && landing) {
    ax = dx * 9 - body.vx * 6;
    ay = dy * 9 - body.vy * 6;
  } else {
    ax = ((distance ? dx / distance * speed : 0) - body.vx) * 3;
    ay = ((distance ? dy / distance * speed : 0) - body.vy) * 3;
  }
  const force = Math.hypot(ax, ay);
  if (force > maxAcceleration) { ax *= maxAcceleration / force; ay *= maxAcceleration / force; }
  body.vx += ax * dt; body.vy += ay * dt;
  body.x += body.vx * dt; body.y += body.vy * dt;
  body.bank = (body.bank || 0) + (Math.max(-12, Math.min(12, ax * .025 + body.vy * .025)) - (body.bank || 0)) * Math.min(1, dt * 4);
  return distance < 1.5 && Math.hypot(body.vx, body.vy) < 5;
}
