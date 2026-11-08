import { stepHorizontalMotion, strideDuration } from './movement.js';
import { riflePose, chargeVelocity, previewTrajectory, autoAimPose } from './ballistics.js';


export function createRanger({ root, size, speed, fire, targets, autoShotInterval, autoShotAccuracy, artwork, kind, weapon, pursue }) {
  const height = size * 42 / 40;
  const element = document.createElement('button');
  element.type = 'button'; element.className = `game-character ${kind}`; element.innerHTML = artwork();
  element.style.width = `${size}px`; element.style.height = `${height}px`;
  element.setAttribute('aria-pressed', 'false');
  element.setAttribute('aria-label', `Take control of ${kind}. A and D move. Hold mouse to charge, release to fire. Click ${kind} again or press Escape to leave control mode.`);
  const shield = document.createElement('div'); shield.className = `game-shield ${kind}-shield`; shield.hidden = true; shield.setAttribute('aria-hidden', 'true');
  const meter = document.createElement('div'); meter.className = 'charge-meter'; meter.hidden = true;
  meter.setAttribute('role', 'meter'); meter.setAttribute('aria-label', 'Shot power'); meter.setAttribute('aria-valuemin', '0'); meter.setAttribute('aria-valuemax', '100'); meter.setAttribute('aria-valuenow', '0');
  meter.innerHTML = '<span class="charge-fill"></span>';
  const hint = document.createElement('div'); hint.className = `game-hint ${kind}-hint`; hint.hidden = true;
  hint.textContent = `A / D move · Hold to charge · Release to fire · Click ${kind} or Esc to exit`;
  const preview = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  preview.classList.add('trajectory-preview'); preview.setAttribute('aria-hidden', 'true');
  preview.setAttribute('focusable', 'false'); preview.setAttribute('hidden', '');
  preview.innerHTML = '<path class="trajectory-outline"/><path class="trajectory-line"/><circle class="trajectory-tip"/>';
  const outline = preview.querySelector('.trajectory-outline'), line = preview.querySelector('.trajectory-line');
  const tip = preview.querySelector('.trajectory-tip');
  root.append(shield, preview, element, meter, hint);
  const abort = new AbortController();
  const listen = (node, event, handler) => node.addEventListener(event, handler, { capture: true, passive: false, signal: abort.signal });
  const keys = new Set();
  let x = Math.max(0, (innerWidth - size) * .35), direction = 1, controlled = false, suspended = false;
  let elapsed = 0, chargeStart = null, pointerId = null, exitPress = false, lastShot = -Infinity;
  let autoAim = null, nextAuto = null, recovery = null, movementVelocity = 0;
  let pursuit = null, pursuitId = null;
  let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const consume = event => { if (event.cancelable) event.preventDefault(); event.stopImmediatePropagation(); };
  const isRider = event => event.composedPath().includes(element);
  const scheduleAuto = () => autoShotInterval === false ? Infinity :
    elapsed + autoShotInterval[0] + Math.random() * (autoShotInterval[1] - autoShotInterval[0]);
  function cancelCharge() { chargeStart = null; pointerId = null; exitPress = false; }
  function setControl(value) {
    controlled = value; cancelCharge(); keys.clear(); movementVelocity = 0; shield.hidden = !value;
    autoAim = null; recovery = null; pursuit = null; pursuitId = null; nextAuto = scheduleAuto();
    element.dataset.controlled = String(value); element.setAttribute('aria-pressed', String(value));
    element.setAttribute('aria-label', value ? `Leave ${kind} control mode` : `Take control of ${kind}. A and D move. Hold mouse to charge, release to fire. Click ${kind} again or press Escape to leave control mode.`);
    if (value) element.focus({ preventScroll: true });
    render();
  }
  listen(element, 'click', event => { consume(event); if (!suspended) setControl(!controlled); });
  listen(window, 'pointermove', event => { mouse = { x: event.clientX, y: event.clientY }; if (controlled) consume(event); });
  listen(window, 'pointerdown', event => {
    if (!controlled) return;
    consume(event); if (suspended) return;
    mouse = { x: event.clientX, y: event.clientY };
    if (isRider(event)) { cancelCharge(); exitPress = true; return; }
    if (event.button !== 0 || pointerId !== null) return;
    chargeStart = elapsed; pointerId = event.pointerId;
  });
  listen(window, 'pointerup', event => {
    if (!controlled) return;
    consume(event);
    if (suspended || exitPress || event.pointerId !== pointerId) { cancelCharge(); return; }
    mouse = { x: event.clientX, y: event.clientY };
    if (chargeStart !== null) {
      const power = Math.min(1, Math.max(0, (elapsed - chargeStart) / 1500));
      const pose = riflePose(x, innerHeight, size, direction, mouse);
      fire({ ...pose, power, speed: chargeVelocity(power) });
      element.dataset.lastPower = power.toFixed(3); element.dataset.lastShotMode = 'player'; lastShot = elapsed;
    }
    cancelCharge(); render();
  });
  listen(window, 'pointercancel', event => { if (controlled) { consume(event); cancelCharge(); } });
  for (const type of ['click', 'dblclick', 'auxclick', 'contextmenu', 'mousedown', 'mouseup']) {
    listen(window, type, event => {
      if (!controlled) return;
      consume(event);
      if (type === 'click' && isRider(event)) setControl(false);
    });
  }
  listen(window, 'keydown', event => {
    if (!controlled) return;
    if (event.key === 'Escape') { consume(event); setControl(false); return; }
    if (suspended || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'a' || key === 'd') { consume(event); keys.add(key); }
    else if (event.key === 'Tab') { consume(event); element.focus({ preventScroll: true }); }
  });
  listen(window, 'keyup', event => {
    const key = event.key.toLowerCase();
    if (controlled && (key === 'a' || key === 'd')) { consume(event); keys.delete(key); }
  });
  listen(window, 'blur', () => { keys.clear(); movementVelocity = 0; cancelCharge(); element.dataset.walking = 'false'; render(); });
  function updateAuto() {
    if (controlled || suspended) return;
    if (nextAuto === null) nextAuto = scheduleAuto();
    if (pursuit) return;
    if (!autoAim && !recovery && elapsed >= nextAuto) {
      nextAuto = scheduleAuto();
      const power = .65 + Math.random() * .35;
      const candidates = targets().filter(target => Math.hypot(target.x - (x + size / 2), target.y - (innerHeight - height / 2)) > size)
        .sort((a, b) => Math.hypot(a.x - x, a.y - innerHeight) - Math.hypot(b.x - x, b.y - innerHeight));
      for (const target of candidates) {
        const facing = target.x < x + size / 2 ? -1 : 1;
        const accurate = Math.random() < autoShotAccuracy;
        const distance = Math.hypot(target.x - (x + size / 2), target.y - (innerHeight - height / 2));
        const spread = accurate ? (Math.random() - .5) * .008 :
          Math.max(.09, Math.atan2(target.radius * 3, distance)) * (Math.random() < .5 ? -1 : 1);
        const pose = autoAimPose(x, innerHeight, size, facing, target, power, spread);
        if (pose) { direction = facing; autoAim = { id: target.id, power, spread, pose, fireAt: elapsed + 600 }; break; }
      }
    }
    if (autoAim) {
      const target = targets().find(target => target.id === autoAim.id);
      const pose = target && autoAimPose(x, innerHeight, size, direction, target, autoAim.power, autoAim.spread);
      if (!pose) { autoAim = null; nextAuto = scheduleAuto(); return; }
      autoAim.pose = pose;
      if (elapsed >= autoAim.fireAt) {
        fire({ ...pose, power: autoAim.power });
        lastShot = elapsed; element.dataset.lastPower = autoAim.power.toFixed(3); element.dataset.lastShotMode = 'auto';
        recovery = { pose, until: elapsed + 180 }; autoAim = null; nextAuto = scheduleAuto();
      }
    }
    if (recovery && elapsed >= recovery.until) recovery = null;
  }
  function render() {
    x = Math.max(0, Math.min(x, Math.max(0, innerWidth - size)));
    element.style.transform = `translate3d(${x}px,0,0)`;
    element.querySelector('svg').style.transform = `scaleX(${direction})`;
    const pose = controlled ? riflePose(x, innerHeight, size, direction, mouse) : autoAim?.pose ?? recovery?.pose ?? { angle: -8 };
    element.dataset.action = controlled ? 'control' : pursuit ? 'run' : autoAim ? 'aim' : recovery ? 'fire' : 'patrol';
    element.querySelector(`.${weapon}`).setAttribute('transform', `rotate(${pose.angle} 19 23)`);
    const flash = element.querySelector('.muzzle-flash');
    if (flash) flash.style.display = elapsed - lastShot < 120 ? 'block' : 'none';
    const charging = controlled && !suspended && chargeStart !== null;
    const power = charging ? Math.min(1, (elapsed - chargeStart) / 1500) : 0;
    element.dataset.charging = String(charging);
    const points = charging ? previewTrajectory(pose, power, innerWidth, innerHeight) : [];
    preview.toggleAttribute('hidden', points.length < 2);
    if (points.length >= 2) {
      preview.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      const path = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
      outline.setAttribute('d', path); line.setAttribute('d', path);
      preview.style.opacity = String(.65 + power * .35);
      tip.setAttribute('cx', points.at(-1).x.toFixed(2));
      tip.setAttribute('cy', points.at(-1).y.toFixed(2)); tip.setAttribute('r', String(2 + power));
    }
    meter.hidden = !controlled || suspended; hint.hidden = !controlled || suspended;
    meter.style.left = `${x + size / 2 - 22}px`; meter.style.bottom = `${height + 8}px`;
    meter.firstElementChild.style.width = `${power * 100}%`;
    meter.setAttribute('aria-valuenow', String(Math.round(power * 100)));
    hint.style.left = `${Math.max(8, Math.min(x + size / 2 - 130, innerWidth - Math.min(260, innerWidth - 16) - 8))}px`;
    hint.style.bottom = `${height + 22}px`;
  }
  render();
  return {
    update(dt, now) {
      elapsed = now;
      let velocity = 0;
      pursuit = !controlled && !suspended && !recovery && autoShotInterval !== false && pursue
        ? pursue({ x, bottom: innerHeight, width: innerWidth, size, targets: targets(), targetId: pursuitId }) : null;
      pursuitId = pursuit?.id ?? null;
      if (pursuit) autoAim = null;
      updateAuto();
      if (controlled) {
        const input = Number(keys.has('d')) - Number(keys.has('a'));
        const motion = stepHorizontalMotion({ x, velocity: movementVelocity }, input, dt, innerWidth - size, speed);
        x = motion.x; movementVelocity = motion.velocity; velocity = movementVelocity;
        if (Math.abs(velocity) > .1) direction = Math.sign(velocity);
      } else if (pursuit) {
        const motion = stepHorizontalMotion({ x, velocity: movementVelocity }, pursuit.direction, dt, innerWidth - size, speed * .65);
        x = motion.x; movementVelocity = motion.velocity; velocity = movementVelocity;
        if (Math.abs(velocity) > .1) direction = Math.sign(velocity);
      } else {
        movementVelocity = 0;
        if (!autoAim && !recovery) {
          velocity = direction * 16; x += velocity * dt / 1000;
          if (x <= 0 || x >= innerWidth - size) direction *= -1;
        }
      }
      const pace = Math.min(1, Math.abs(velocity) / speed);
      element.dataset.velocity = velocity.toFixed(2);
      element.dataset.walking = String(Math.abs(velocity) > .5 && !suspended);
      element.style.setProperty('--stride-duration', `${strideDuration(velocity).toFixed(3)}s`);
      element.style.setProperty('--stride-distance', `${(.5 + pace * 1.5).toFixed(2)}px`);
      render();
    },
    suspend(value) { suspended = value; if (value) { cancelCharge(); keys.clear(); movementVelocity = 0; element.dataset.walking = 'false'; autoAim = null; recovery = null; pursuit = null; pursuitId = null; nextAuto = scheduleAuto(); } render(); },
    destroy() { abort.abort(); element.remove(); shield.remove(); meter.remove(); hint.remove(); preview.remove(); },
    get controlled() { return controlled; },
  };
}
