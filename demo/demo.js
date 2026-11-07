import { createTurkeys, turkeySVG } from '../src/turkeys.js';
document.querySelector('.specimen-bird').innerHTML = turkeySVG();
document.querySelector('.brand-bird').innerHTML = turkeySVG();
const flock = createTurkeys({ maxTurkeys: 6, spawnInterval: [3500, 7000], lifetime: [60000, 100000] });
window.demoFlock = flock;
const toggle = document.querySelector('#toggle');
const add = document.querySelector('#add');
const status = document.querySelector('#status');
const media = matchMedia('(prefers-reduced-motion: reduce)');
function update() {
  document.querySelector('#count').textContent = flock.count;
  add.disabled = !flock.running || media.matches || flock.count >= 6;
  if (media.matches) status.textContent = 'Reduced motion is on. The flock will stay tucked away.';
  else if (flock.running) status.textContent = 'They’re loose! Watch the ledges, buttons, and headlines.';
  else status.textContent = 'The flock is waiting in the wings.';
}
toggle.addEventListener('click', () => {
  if (flock.running) flock.stop(); else flock.start();
  toggle.setAttribute('aria-pressed', String(flock.running));
  toggle.innerHTML = flock.running ? '<span class="button-icon" aria-hidden="true">↙</span> Gather the turkeys <span aria-hidden="true">✓</span>' : '<span class="button-icon" aria-hidden="true">✦</span> Release the turkeys <span aria-hidden="true">↗</span>';
  update();
});
add.addEventListener('click', () => { flock.spawn(); update(); });
media.addEventListener('change', update);
setInterval(update, 500);
update();
const snippet = `<script src="./turkeys.js"></script>\n<script>\n  const flock = TinyTurkeys.createTurkeys();\n  flock.start();\n</script>`;
document.querySelector('#copy').addEventListener('click', async event => {
  try {
    await navigator.clipboard.writeText(snippet);
    event.target.textContent = 'Copied!';
  } catch { event.target.textContent = 'Select code to copy'; }
  setTimeout(() => { event.target.textContent = 'Copy snippet'; }, 2200);
});
