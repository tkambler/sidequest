import { chargeVelocity, previewTrajectory } from './ballistics.js';
import { santaThrowPose } from './santa-flight.js';

/** Owns input capture and the pilot HUD; the scene owns physics and the clock. */
export function createSantaControls({ root, body, size, change, toss, score, danger = () => null }) {
  const shield = document.createElement('div'); shield.className = 'game-shield'; shield.hidden = true; shield.setAttribute('aria-hidden', 'true');
  const hud = document.createElement('div'); hud.className = 'santa-hud'; hud.hidden = true;
  hud.innerHTML = '<strong>Flying with Santa</strong><span class="santa-score" role="status" aria-live="polite"></span><span class="santa-danger" role="status" aria-live="polite"></span><span>W / A / S / D fly · Mouse aims<br>Hold to charge, release to toss · Esc returns to autopilot</span>';
  const meter = document.createElement('div'); meter.className = 'charge-meter'; meter.hidden = true;
  meter.setAttribute('role', 'meter'); meter.setAttribute('aria-label', 'Present toss power');
  meter.setAttribute('aria-valuemin', '0'); meter.setAttribute('aria-valuemax', '100'); meter.innerHTML = '<span class="charge-fill"></span>';
  const preview = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  preview.classList.add('trajectory-preview'); preview.setAttribute('hidden', ''); preview.setAttribute('aria-hidden', 'true');
  preview.innerHTML = '<path class="trajectory-outline"/><path class="trajectory-line"/><circle class="trajectory-tip"/>';
  root.append(shield, preview, meter, hud);
  const keys = new Set(), abort = new AbortController();
  const listen = (node, type, fn) => node.addEventListener(type, fn, { capture: true, passive: false, signal: abort.signal });
  let controlled = false, suspended = false, elapsed = 0, chargeStart = null, pointerId = null, keyboardCharge = false, previousFocus;
  let mouse = { x: innerWidth / 2, y: innerHeight / 2 }, lastToss = -Infinity;
  const consume = e => { if (e.cancelable) e.preventDefault(); e.stopImmediatePropagation(); };
  const isSanta = e => Boolean(body() && e.composedPath().includes(body().element));
  const cancel = () => { chargeStart = null; pointerId = null; keyboardCharge = false; keys.clear(); };
  const power = () => chargeStart === null ? 0 : Math.min(1, Math.max(0, (elapsed - chargeStart) / 1500));
  function render() {
    const s = body(), charging = controlled && !suspended && chargeStart !== null;
    shield.hidden = !controlled; hud.hidden = !controlled || suspended; meter.hidden = !controlled || suspended;
    if (s) {
      s.element.dataset.controlled = String(controlled); s.element.dataset.charging = String(charging);
      s.element.setAttribute('aria-pressed', String(controlled));
      const crashing = s.state === 'crashing' || s.state === 'crashed';
      s.element.disabled = crashing;
      s.element.setAttribute('aria-label', crashing ? 'Santa is crashing. He will return soon.' : controlled ? 'Return Santa to automatic deliveries' : 'Pilot Santa. WASD flies. Aim with the mouse, hold and release to toss a present. Escape returns to automatic deliveries.');
      meter.style.left = `${Math.max(4, Math.min(innerWidth - 48, s.x + size / 2 - 22))}px`;
      meter.style.top = `${Math.max(4, s.y - size * 91 / 178 - 10)}px`;
    }
    const p = power(); meter.firstElementChild.style.width = `${p * 100}%`; meter.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    const count = score(), label = `${count} ${count === 1 ? 'present' : 'presents'} delivered`;
    if (hud.querySelector('.santa-score').textContent !== label) hud.querySelector('.santa-score').textContent = label;
    const hits = danger(), warning = hits === null ? '' : `Dodge the cowboy · ${hits} ${hits === 1 ? 'hit' : 'hits'}`;
    if (hud.querySelector('.santa-danger').textContent !== warning) hud.querySelector('.santa-danger').textContent = warning;
    const points = charging && s ? previewTrajectory(santaThrowPose(s, size, mouse), p, innerWidth, innerHeight) : [];
    preview.toggleAttribute('hidden', points.length < 2);
    if (points.length > 1) {
      preview.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      const path = points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
      for (const node of preview.querySelectorAll('path')) node.setAttribute('d', path);
      const tip = preview.querySelector('circle'); tip.setAttribute('cx', points.at(-1).x); tip.setAttribute('cy', points.at(-1).y); tip.setAttribute('r', 2 + p);
    }
  }
  function setControl(value) {
    if (value && (suspended || !body() || body().state === 'crashing' || body().state === 'crashed')) return;
    if (value === controlled) return;
    if (value) previousFocus = document.activeElement;
    controlled = value; cancel(); change(value);
    if (value) body().element.focus({ preventScroll: true });
    else if (previousFocus?.isConnected && root.activeElement === body()?.element) previousFocus.focus({ preventScroll: true });
    render();
  }
  function release() {
    const s = body();
    if (controlled && !suspended && s && chargeStart !== null && elapsed - lastToss >= 220) {
      const strength = power(); toss({ ...santaThrowPose(s, size, mouse), power: strength, speed: chargeVelocity(strength) });
      lastToss = elapsed; s.element.dataset.lastPower = strength.toFixed(3);
    }
    chargeStart = null; pointerId = null; keyboardCharge = false; render();
  }
  listen(root, 'click', e => { if (isSanta(e)) { consume(e); if (!suspended) setControl(!controlled); } });
  listen(window, 'pointermove', e => { mouse = { x: e.clientX, y: e.clientY }; if (controlled) consume(e); });
  listen(window, 'pointerdown', e => {
    if (!controlled) return; consume(e);
    if (suspended || isSanta(e)) { chargeStart = null; pointerId = null; return; }
    if (e.button !== 0 || pointerId !== null || keyboardCharge) return;
    mouse = { x: e.clientX, y: e.clientY }; chargeStart = elapsed; pointerId = e.pointerId;
  });
  listen(window, 'pointerup', e => {
    if (!controlled) return; consume(e);
    if (suspended || isSanta(e)) { chargeStart = null; pointerId = null; render(); return; }
    if (e.pointerId !== pointerId) return;
    mouse = { x: e.clientX, y: e.clientY }; release();
  });
  listen(window, 'pointercancel', e => { if (controlled) { consume(e); cancel(); render(); } });
  for (const type of ['click', 'dblclick', 'auxclick', 'contextmenu', 'mousedown', 'mouseup']) listen(window, type, e => {
    if (!controlled) return; consume(e); if (type === 'click' && isSanta(e)) setControl(false);
  });
  listen(window, 'keydown', e => {
    if (!controlled) return;
    if (e.key === 'Escape' || e.key === 'Enter') { consume(e); setControl(false); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    consume(e); if (suspended) return;
    const key = e.key.toLowerCase();
    if ('wasd'.includes(key) && key.length === 1) keys.add(key);
    if (e.key === 'Tab') body()?.element.focus({ preventScroll: true });
    if ((e.code === 'Space' || e.key === ' ') && !e.repeat && chargeStart === null) { keyboardCharge = true; chargeStart = elapsed; }
  });
  listen(window, 'keyup', e => {
    if (!controlled) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    consume(e); keys.delete(e.key.toLowerCase()); if ((e.code === 'Space' || e.key === ' ') && keyboardCharge) release();
  });
  listen(window, 'blur', () => { cancel(); const s = body(); if (controlled && s) s.vx = s.vy = 0; render(); });
  return {
    update(now) { elapsed = now; render(); },
    exit() { setControl(false); },
    suspend(value, releaseControl = false) { suspended = value; if (value) { cancel(); const s = body(); if (controlled && s) s.vx = s.vy = 0; } if (releaseControl) setControl(false); render(); },
    get input() { return { x: Number(keys.has('d')) - Number(keys.has('a')), y: Number(keys.has('s')) - Number(keys.has('w')) }; },
    get controlled() { return controlled; },
    destroy() { setControl(false); abort.abort(); shield.remove(); preview.remove(); meter.remove(); hud.remove(); },
  };
}
