import { createTurkeys, turkeySVG, cowboySVG } from '../src/turkeys.js';
document.querySelector('.specimen-bird').innerHTML = `<span>${turkeySVG()}</span><span>${cowboySVG()}</span>`;
document.querySelector('.brand-bird').innerHTML = turkeySVG();
const hitGobble = new Audio(new URL('./assets/gobble2.mp3', import.meta.url));
hitGobble.preload = 'none';
hitGobble.volume = .2;
const shotSound = new Audio(new URL('./assets/revolver-single-shot.mp3', import.meta.url));
shotSound.preload = 'none';
shotSound.volume = .2;
const makeFlock = () => createTurkeys({
  onShot() {
    shotSound.pause();
    shotSound.currentTime = 0;
    void shotSound.play().catch(() => {});
  },
  onTurkeyHit() {
    hitGobble.pause();
    hitGobble.currentTime = 0;
    void hitGobble.play().catch(() => {});
  }, maxTurkeys: 6, spawnInterval: [3500, 7000], lifetime: [60000, 100000] });
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
  const message = media.matches ? 'Reduced motion is on. The visitors will stay tucked away.' :
    flock.controlled ? 'A / D move. Hold mouse to charge, release to fire. Click the cowboy or press Escape to leave control mode.' :
      flock.running ? 'They’re loose! Click the cowboy at the bottom of the screen to take control.' :
        'Your visitors are waiting in the wings.';
  if (status.textContent !== message) status.textContent = message;
}
toggle.addEventListener('click', () => {
  if (flock.running) {
    flock.stop();
    gobble.pause();
    gobble.currentTime = 0;
    hitGobble.pause();
    hitGobble.currentTime = 0;
    shotSound.pause();
    shotSound.currentTime = 0;
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
