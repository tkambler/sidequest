import { createTurkeys, turkeySVG, pilgrimSVG } from '../src/turkeys.js';
const picker = document.querySelector('#characters');
const characters = () => picker.value === 'both' ? ['turkey', 'pilgrim'] : [picker.value];
function preview() {
  const choices = characters();
  document.querySelector('#snippet-characters').textContent = `[${choices.map(character => `'${character}'`).join(', ')}]`;
  const specimen = document.querySelector('.specimen-bird');
  specimen.classList.toggle('duo', choices.length === 2);
  specimen.innerHTML = choices.map(character => `<span>${character === 'pilgrim' ? pilgrimSVG() : turkeySVG()}</span>`).join('');
  document.querySelector('.annotation').innerHTML = choices.length === 2 ? 'a distinguished<br>little duo' : picker.value === 'pilgrim' ? 'hat, boots,<br>and places to be' : 'a distinguished<br>little gobbler';
}
preview();
document.querySelector('.brand-bird').innerHTML = turkeySVG();
const makeFlock = () => createTurkeys({ characters: characters(), maxTurkeys: 6, spawnInterval: [3500, 7000], lifetime: [60000, 100000] });
let flock = makeFlock();
window.demoFlock = flock;
const toggle = document.querySelector('#toggle');
const add = document.querySelector('#add');
const status = document.querySelector('#status');
const media = matchMedia('(prefers-reduced-motion: reduce)');
const gobble = new Audio(new URL('./assets/gobble1.mp3', import.meta.url));
gobble.preload = 'none';
gobble.volume = .5;
function update() {
  document.querySelector('#count').textContent = flock.count;
  add.disabled = !flock.running || media.matches || flock.count >= 6;
  if (media.matches) status.textContent = 'Reduced motion is on. The visitors will stay tucked away.';
  else if (flock.running) status.textContent = 'They’re loose! Watch the ledges, buttons, and headlines.';
  else status.textContent = 'Your visitors are waiting in the wings.';
}
toggle.addEventListener('click', () => {
  if (flock.running) {
    flock.stop();
    gobble.pause();
    gobble.currentTime = 0;
  } else {
    flock.start();
    gobble.currentTime = 0;
    // Play directly in the click handler so browser user-gesture rules allow it.
    void gobble.play().catch(() => {});
  }
  toggle.setAttribute('aria-pressed', String(flock.running));
  toggle.innerHTML = flock.running ? '<span class="button-icon" aria-hidden="true">↙</span> Gather the visitors <span aria-hidden="true">✓</span>' : '<span class="button-icon" aria-hidden="true">✦</span> Release the visitors <span aria-hidden="true">↗</span>';
  update();
});
picker.addEventListener('change', () => {
  const wasRunning = flock.running;
  flock.destroy();
  flock = makeFlock();
  window.demoFlock = flock;
  if (wasRunning) flock.start();
  preview();
  update();
});
add.addEventListener('click', () => { flock.spawn(); update(); });
media.addEventListener('change', update);
setInterval(update, 500);
update();
const snippet = () => `<script src="./turkeys.js"></script>\n<script>\n  const flock = TinyTurkeys.createTurkeys({\n    characters: [${characters().map(character => `'${character}'`).join(', ')}]\n  });\n  flock.start();\n</script>`;
document.querySelector('#copy').addEventListener('click', async event => {
  try {
    await navigator.clipboard.writeText(snippet());
    event.target.textContent = 'Copied!';
  } catch { event.target.textContent = 'Select code to copy'; }
  setTimeout(() => { event.target.textContent = 'Copy snippet'; }, 2200);
});
