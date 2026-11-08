/** A hit disables lift: momentum, gravity and a nose-down tumble take over. */
export function stepSantaCrash(body, dt, { width, height, size }) {
  const gravity = 900;
  body.x += body.vx * dt;
  body.y += body.vy * dt + .5 * gravity * dt * dt;
  body.vx *= Math.exp(-.7 * dt); body.vy += gravity * dt;
  const right = Math.max(0, width - size);
  if (body.x < 0 || body.x > right) body.vx = 0;
  body.x = Math.max(0, Math.min(right, body.x));
  body.bank += (body.direction * 40 - body.bank) * (1 - Math.exp(-3 * dt));
  // Account for the tilted artwork so its lowest corner meets the floor.
  const angle = body.bank * Math.PI / 180;
  const bottom = (89 * Math.abs(Math.sin(angle)) + 44.5 * Math.cos(angle) - 44.5) * size / 178;
  if (body.y + bottom >= height) {
    body.y = height - bottom; body.vx = body.vy = 0; return true;
  }
  return false;
}
