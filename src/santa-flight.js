/** Player steering: magical lift balances gravity, with thrust, drag and banking. */
export function stepSantaFlight(body, input, dt, { width, height, size, speed, surfaces }) {
  const magnitude = Math.max(1, Math.hypot(input.x, input.y));
  const tx = input.x / magnitude * speed, ty = input.y / magnitude * speed * .8;
  const ax = Math.max(-720, Math.min(720, (tx - body.vx) * 4));
  const ay = Math.max(-600, Math.min(600, (ty - body.vy) * 4));
  const previousY = body.y;
  body.x += body.vx * dt + ax * dt * dt / 2;
  body.y += body.vy * dt + ay * dt * dt / 2;
  body.vx += ax * dt; body.vy += ay * dt;
  const right = Math.max(0, width - size), top = Math.min(height, size * 90 / 178 + 3);
  if (body.x <= 0 || body.x >= right) body.vx = 0;
  body.x = Math.max(0, Math.min(right, body.x));
  if (body.y < top) { body.y = top; body.vy = Math.max(0, body.vy); }
  let landing = null;
  if (body.vy >= 0 && input.y >= 0) {
    landing = surfaces.filter(s => s.y >= top && previousY <= s.y + .5 && body.y >= s.y &&
      body.x >= s.left && body.x + size <= s.right).sort((a, b) => a.y - b.y)[0];
  }
  if (landing) { body.y = landing.y; body.vy = 0; }
  if (body.y >= height) { body.y = height; body.vy = Math.min(0, body.vy); }
  body.manualSurface = landing;
  body.state = landing ? 'landed' : 'manual';
  body.bank += ((landing ? 0 : Math.max(-10, Math.min(10, ax * .015 + body.vy * .02))) - body.bank) * Math.min(1, dt * 4);
  if (Math.abs(body.vx) > 8) body.direction = Math.sign(body.vx);
}

/** The hand's world position includes the team's facing and banking. */
export function santaThrowPose(body, size, mouse) {
  const scale = size / 178, angle = body.bank * Math.PI / 180;
  const x = (58 - 89) * scale * body.direction, y = (51 - 45.5) * scale;
  const muzzle = { x: body.x + size / 2 + x * Math.cos(angle) - y * Math.sin(angle),
    y: body.y - 90 * scale + 45.5 * scale + x * Math.sin(angle) + y * Math.cos(angle) };
  const dx = mouse.x - muzzle.x, dy = mouse.y - muzzle.y, length = Math.hypot(dx, dy);
  return { muzzle, dx: length > .001 ? dx / length : body.direction, dy: length > .001 ? dy / length : 0 };
}
