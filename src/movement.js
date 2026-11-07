// Accelerate, coast, and brake in pixels/second; integrate ramps exactly so the
// feel stays consistent across frame rates.
export function stepHorizontalMotion(state, input, dt, maxX, maxSpeed) {
  const seconds = Math.max(0, dt) / 1000;
  input = Math.sign(input);
  const advance = (velocity, target, rate, time) => {
    const ramp = Math.min(time, Math.abs(target - velocity) / rate);
    const next = velocity + Math.sign(target - velocity) * rate * ramp;
    return { velocity: ramp < time ? target : next,
      distance: (velocity + next) * .5 * ramp + target * (time - ramp) };
  };
  let motion;
  if (input && state.velocity * input < 0) {
    const brakingTime = Math.min(seconds, Math.abs(state.velocity) / (maxSpeed * 10));
    const braking = advance(state.velocity, 0, maxSpeed * 10, brakingTime);
    const accelerating = advance(braking.velocity, input * maxSpeed, maxSpeed * 6, seconds - brakingTime);
    motion = { velocity: accelerating.velocity, distance: braking.distance + accelerating.distance };
  } else {
    motion = advance(state.velocity, input * maxSpeed, maxSpeed * (input ? 6 : 5), seconds);
  }
  maxX = Math.max(0, maxX);
  const x = Math.max(0, Math.min(maxX, state.x + motion.distance));
  const hitsWall = (x === 0 && motion.velocity < 0) || (x === maxX && motion.velocity > 0);
  return { x, velocity: hitsWall || Math.abs(motion.velocity) < .01 ? 0 : motion.velocity };
}

/** Keep stride cadence tied to actual travel speed, including custom speed caps. */
export function strideDuration(velocity) {
  return Math.max(.09, Math.min(.68, 30 / Math.max(1, Math.abs(velocity))));
}
