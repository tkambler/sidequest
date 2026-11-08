/** Articulation uses the scene's active clock, so pause/visibility freeze every part. */
export function createSleighAnimator(svg) {
  const sled = svg.querySelector('.santa-sled'), hands = svg.querySelector('.santa-hands');
  const eyes = svg.querySelector('.santa-eyes'), eyelids = svg.querySelector('.santa-eyelids');
  const deer = [...svg.querySelectorAll('.reindeer')].map(element => ({
    element, legs: [...element.querySelectorAll('.deer-leg')],
  }));
  const reins = svg.querySelector('.flex-reins');
  svg.querySelector('.reference-reins').setAttribute('display', 'none');
  reins.removeAttribute('display');
  let blend = 0, lagX = 0, lagY = 0, lagVX = 0, lagVY = 0;
  return {
    update(dt, elapsed, body) {
      const grounded = body.state === 'landed' || body.state === 'crashing' || body.state === 'crashed';
      const speed = Math.hypot(body.vx, body.vy);
      const flight = grounded ? 0 : Math.min(1, speed / 100);
      blend += (flight - blend) * Math.min(1, dt * 8);
      const phase = elapsed / 1000 * 10;
      // A damped spring lets the sleigh trail the team instead of sharing its bob.
      const targetX = -Math.min(2.4, Math.abs(body.vx) * .012) * blend;
      const targetY = (Math.max(-2, Math.min(2, body.vy * .012)) - 1.1 + Math.sin(phase - 1.1) * .45) * blend;
      lagVX += ((targetX - lagX) * 40 - lagVX * 12) * dt;
      lagVY += ((targetY - lagY) * 40 - lagVY * 12) * dt;
      lagX += lagVX * dt; lagY += lagVY * dt;
      sled.setAttribute('transform', `translate(${lagX.toFixed(3)} ${lagY.toFixed(3)})`);
      // Both hands stay on the reins, following the tension by less than one pixel.
      const handY = Math.sin(elapsed / 850) * (.12 + .24 * blend);
      const armAngle = Math.sin(elapsed / 1200) * .12;
      hands.setAttribute('transform', `translate(0 ${handY.toFixed(3)}) rotate(${armAngle.toFixed(3)} 20 43)`);
      // Tiny glances and an occasional short blink share the pauseable scene clock.
      eyes.setAttribute('transform', `translate(${(.22 * Math.sin(elapsed / 1800)).toFixed(3)} 0)`);
      const blinking = (elapsed + 3400) % 5600 < 110;
      eyes.setAttribute('display', blinking ? 'none' : 'inline');
      eyelids.setAttribute('display', blinking ? 'inline' : 'none');
      const offsets = deer.map((item, index) => {
        const gait = phase + index * 1.15;
        const x = Math.cos(gait) * .65 * blend;
        const y = (-1.8 + Math.sin(gait) * 1.1) * blend;
        item.element.setAttribute('transform', `translate(${x.toFixed(3)} ${y.toFixed(3)})`);
        for (const leg of item.legs) {
          const front = leg.classList.contains('leg-front'), back = leg.classList.contains('leg-back');
          const pivotX = (index ? 37 : 0) + (front ? 118 : back ? 95 : leg.classList.contains('leg-far') ? 104 : 125);
          const offset = front || leg.classList.contains('leg-far') ? Math.PI : 0;
          const angle = Math.sin(gait + offset) * 16 * blend;
          leg.setAttribute('transform', `rotate(${angle.toFixed(2)} ${pivotX} 71)`);
        }
        return { x, y };
      });
      // Reins flex between independently moving hands and harnesses.
      const armRadians = armAngle * Math.PI / 180;
      const sx = 20 + 40 * Math.cos(armRadians) - 6 * Math.sin(armRadians) + lagX;
      const sy = 43 + 40 * Math.sin(armRadians) + 6 * Math.cos(armRadians) + lagY + handY;
      const a = offsets[0], b = offsets[1];
      reins.setAttribute('d', `M${sx.toFixed(2)} ${sy.toFixed(2)} Q86 ${(66 + lagY).toFixed(2)} ${(122 + a.x).toFixed(2)} ${(51 + a.y).toFixed(2)} M${sx.toFixed(2)} ${(sy + 4).toFixed(2)} Q106 ${(78 + lagY).toFixed(2)} ${(159 + b.x).toFixed(2)} ${(52 + b.y).toFixed(2)}`);
    },
  };
}
