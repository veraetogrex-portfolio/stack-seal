// Stack Seal — github.com/veraetogrex-portfolio · zero dependencies
// Type the 6th digit: the cells slide into one stack, squeeze into a square
// and stamp an Ion seal whose light floods the page. Then the deploy ships.

const gate   = document.querySelector('#gate');
const row    = gate.querySelector('.cells');
const cells  = [...row.children];
const digits = cells.map(cell => cell.firstElementChild);
const input  = gate.querySelector('.code-input');
const hint   = gate.querySelector('.hint');
const scan   = gate.querySelector('.scan');
const foot   = gate.querySelector('.foot');
const seal   = gate.querySelector('.seal');
const stamp  = gate.querySelector('.stamp');
const tick   = stamp.querySelector('path');
const flood  = document.querySelector('.flood');
const shock  = document.querySelector('.shock');
const ship   = document.querySelector('.ship');

// The demo authenticator shows this code. Replace checkCode with a request to your backend.
const AUTH_CODE = '482913';
const checkCode = async code => code === AUTH_CODE;

const N = 6, PITCH = 102;           // cell 88 px + gap 14 px
const LAND = 380, STAGGER = 60;     // each cell lands 60 ms after the one before
const FOOT = 'Code from your authenticator app';
let busy = false;

// tiny tween: animate(ms, t => …, easing)
const ease = { linear: t => t, io: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2, in: t => t ** 3, out: t => 1 - (1 - t) ** 3, back: t => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2 };
const animate = (ms, fn, e = ease.io) => new Promise(done => {
  const t0 = performance.now();
  const step = now => { const p = Math.min(1, (now - t0) / ms); fn(e(p)); p < 1 ? requestAnimationFrame(step) : done(); };
  requestAnimationFrame(step);
});
const wait  = ms => new Promise(r => setTimeout(r, ms));
const clamp = v => Math.min(1, Math.max(0, v));
const lerp  = (a, b, t) => a + (b - a) * t;

function render(value) {
  cells.forEach((cell, i) => {
    const had = digits[i].textContent;
    digits[i].textContent = value[i] || '';
    cell.classList.toggle('is-filled', !!value[i]);
    cell.classList.toggle('is-focus', document.activeElement === input && i === Math.min(value.length, N - 1) && value.length < N);
    if (!had && value[i]) { cell.classList.remove('is-pop'); void cell.offsetWidth; cell.classList.add('is-pop'); }
  });
}

input.addEventListener('input', () => {
  if (busy) return;
  input.value = input.value.replace(/\D/g, '').slice(0, N);
  showError(false);
  render(input.value);
  if (input.value.length === N) submit(input.value);
});
input.addEventListener('focus', () => { if (!busy) { render(input.value); hint.classList.add('is-on'); } });
input.addEventListener('blur', () => render(input.value));
hint.addEventListener('pointerdown', e => e.preventDefault());        // keep focus in the field
hint.addEventListener('click', autofill);
gate.addEventListener('click', () => { if (!busy && gate.classList.contains('is-sealed')) reset(); });

async function autofill() {
  if (busy) return;
  busy = true;
  for (let i = 1; i <= N; i++) { input.value = AUTH_CODE.slice(0, i); render(input.value); await wait(110); }
  busy = false;
  submit(input.value);
}

async function submit(code) {
  busy = true;
  input.blur();
  hint.classList.remove('is-on');
  // 1 · check: a Pulse bar scans under the cells
  scan.classList.add('is-on');
  foot.style.opacity = 0;
  const [ok] = await Promise.all([checkCode(code), wait(450)]);
  scan.classList.remove('is-on');
  ok ? await stackAndSeal() : await reject();
  busy = false;
}

const offsets = () => cells.map((_, i) => (i - (N - 1) / 2) * PITCH);   // each cell's distance from the centre

async function stackAndSeal() {
  const dx = offsets();

  // 2 · slide to the centre one after another, each landing on top of the previous one
  const total = LAND + STAGGER * (N - 1);
  cells.forEach((cell, i) => cell.style.zIndex = 10 + i);
  await animate(total, t => cells.forEach((cell, i) => {
    const q = clamp((t * total - i * STAGGER) / LAND), e = ease.io(q);
    const hop = -26 * Math.sin(Math.PI * q), tilt = (i % 2 ? 4 : -4) * Math.sin(Math.PI * q);
    cell.style.transform = `translate(${-dx[i] * e}px, ${hop - 3 * i * e}px) rotate(${tilt}deg) scale(${1 - .04 * e})`;
    cell.style.borderColor = `rgba(${lerp(255, 124, e)}, ${lerp(255, 108, e)}, 255, ${.3 + .5 * e})`;
    digits[i].style.opacity = 1 - clamp(q * 1.6);
  }), ease.linear);

  // 3 · the stack squeezes into one square stamp
  stamp.style.opacity = 1;
  await animate(260, t => {
    cells.forEach((cell, i) => { cell.style.transform = `translate(${-dx[i]}px, ${-3 * i * (1 - t)}px) scale(.96)`; cell.style.opacity = 1 - t; });
    stamp.style.width = lerp(88, 148, t) + 'px';
    stamp.style.height = lerp(104, 148, t) + 'px';
    stamp.style.borderRadius = lerp(16, 34, t) + 'px';
  }, ease.in);
  await animate(180, t => { const k = Math.sin(Math.PI * t); stamp.style.scale = `${1 + .08 * k} ${1 - .1 * k}`; }, ease.out);

  // 4 · sealed: Ion tick, new title, and the seal's light floods the page
  const at = seal.getBoundingClientRect();
  document.body.style.setProperty('--seal-x', at.left + 'px');
  document.body.style.setProperty('--seal-y', at.top + 'px');
  gate.classList.add('is-sealed');
  animate(1300, t => {
    flood.style.scale = .05 + .95 * ease.out(Math.min(1, t * 1.6));
    flood.style.opacity = t < .12 ? t / .12 : 1 - .62 * (t - .12) / .88;
  }, ease.linear);
  animate(900, t => {
    shock.style.width = shock.style.height = 160 + 2300 * t + 'px';
    shock.style.opacity = t < .08 ? t / .08 : (1 - t) / .92;
  }, ease.out);
  await animate(380, t => tick.style.strokeDashoffset = 100 - 100 * t, ease.out);
  foot.textContent = 'Approved · 2FA · just now';
  foot.style.opacity = 1;
  await wait(200);

  // 5 · ship it: a progress line from Pulse to Ion
  await shipIt();
}

async function shipIt() {
  const bar = ship.querySelector('.ship-bar b'), pct = ship.querySelector('.ship-pct');
  const regionsEl = ship.querySelector('.ship-regions'), regions = ['eu-west', 'us-east', 'ap-south'];
  ship.classList.add('is-on');
  await wait(300);
  await animate(1000, t => {
    bar.style.scale = `${t} 1`;
    pct.textContent = Math.round(t * 100) + '%';
    const k = Math.min(2, Math.floor(t * 3));
    regionsEl.textContent = regions.map((r, i) => i < k ? r + ' ✓' : i === k ? r + ' …' : r).join(' · ');
  });
  ship.classList.add('is-live');
  ship.querySelector('.ship-label span').textContent = 'v1.0.3 is live';
  regionsEl.textContent = regions.map(r => r + ' ✓').join(' · ');
}

async function reject() {
  const dx = offsets();
  // the stack refuses to close: cells lean in, spring back and shake
  await animate(260, t => cells.forEach((cell, i) => cell.style.transform = `translateX(${-dx[i] * .22 * t}px) scale(${1 - .05 * t})`), ease.out);
  await animate(300, t => cells.forEach((cell, i) => cell.style.transform = `translateX(${-dx[i] * .22 * (1 - t)}px) scale(${.95 + .05 * t})`), ease.back);
  cells.forEach(cell => { cell.style.transform = ''; cell.classList.add('is-err'); });
  row.classList.remove('is-shake'); void row.offsetWidth; row.classList.add('is-shake');
  showError(true);
  await wait(900);
  cells.forEach(cell => cell.classList.remove('is-err'));
  input.value = '';
  input.focus();
  render('');
}

function showError(on) {
  foot.classList.toggle('is-err', on);
  foot.textContent = on ? 'Code expired' : FOOT;
  foot.style.opacity = 1;
}

function reset() {
  gate.classList.remove('is-sealed');
  ship.classList.remove('is-on', 'is-live');
  ship.querySelector('.ship-bar b').style.scale = '0 1';
  ship.querySelector('.ship-pct').textContent = '0%';
  ship.querySelector('.ship-label span').textContent = 'Shipping v1.0.3';
  ship.querySelector('.ship-regions').textContent = 'eu-west · us-east · ap-south';
  cells.forEach((cell, i) => { cell.style.cssText = ''; digits[i].style.opacity = ''; });
  stamp.style.cssText = '';
  tick.style.strokeDashoffset = 100;
  flood.style.opacity = shock.style.opacity = 0;
  input.value = '';
  showError(false);
  render('');
}
