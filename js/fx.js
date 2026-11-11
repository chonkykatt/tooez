/* TOOEZ — fun layer: mascot Tooez (mèo), confetti, sounds, XP fly, shake, celebration */
'use strict';
(() => {
const S = () => X.S();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Mascot Tooez: mèo cam đeo băng đô, kính tròn, ôm sổ và bút chì ---------- */
const CAT_EYES = {
  idle: '<circle cx="40" cy="61" r="3"/><circle cx="68" cy="61" r="3"/>',
  happy: '<path d="M34.5 63q5.5-7 11 0M62.5 63q5.5-7 11 0"/>',
  sad: '<path d="M35 59q5 5.5 10 0M63 59q5 5.5 10 0"/>',
  think: '<circle cx="40" cy="61" r="3"/><path d="M63 61h10"/>',
  wow: '<circle cx="40" cy="61" r="4.6"/><circle cx="68" cy="61" r="4.6"/>',
};
const CAT_MOUTH = {
  idle: '<path class="ct-mline" d="M49.5 71q4.5 4 9 0"/>',
  happy: '<path class="ct-mouth" d="M48 69.5h12q-1 8.5-6 8.5t-6-8.5z"/>',
  sad: '<path class="ct-mline" d="M49.5 74q4.5-4 9 0"/>',
  think: '<path class="ct-mline" d="M50 72h8"/>',
  wow: '<ellipse class="ct-mouth" cx="54" cy="73" rx="3.6" ry="4.4"/>',
};
X.xi = (mood = 'idle', size = 96, extra = '') => `<svg class="xi cat xi-${mood} ${extra}" width="${size}" height="${size * 1.12}" viewBox="0 0 108 121" overflow="visible" aria-hidden="true">
  <ellipse class="xi-shadow" cx="54" cy="116" rx="30" ry="4"/>
  <g class="xi-body">
    <path class="ct-tail" d="M88 104C100 106 106 98 104 87"/>
    <path class="ct-tail2" d="M88 104C100 106 106 98 104 87"/>
    <path class="ct-tailstripe" d="M99 103.5l-2-5M103.5 96l-4.5-2"/>
    <path class="ct-fur" d="M21 42 25 13 45 27z"/><path class="ct-fur" d="M87 42 83 13 63 27z"/>
    <path class="ct-ear" d="M26 34 28 20 38 28z"/><path class="ct-ear" d="M82 34 80 20 70 28z"/>
    <path class="ct-fur" d="M17 56C17 33 33 23 54 23s37 10 37 33l1 34c0 14-11 21-25 21H41c-14 0-25-7-25-21z"/>
    <path class="ct-stripe" d="M45 27q2 5 2 9M54 25v10M63 27q-2 5-2 9M17 63h8M17 70h7M91 63h-8M91 70h-7"/>
    <ellipse class="ct-belly" cx="54" cy="95" rx="22" ry="14"/>
    <path class="ct-band" d="M18 42q36-16 72 0v8q-36-15-72 0z"/>
    <path class="ct-band ct-tie" d="M88 43 101 36 103 44zM88 46 100 54 95 58z"/>
    <g class="ct-paw"><circle cx="54" cy="40" r="2.1"/><circle cx="51" cy="37" r="1.1"/><circle cx="54" cy="36" r="1.1"/><circle cx="57" cy="37" r="1.1"/></g>
    <path class="ct-mask" d="M25 56q0-9 10-9h38q10 0 10 9v10q0 16-29 16T25 66z"/>
    <path class="ct-glare" d="M31 55q2-4 6-5"/>
    <g class="xi-eyes ct-eyes">${CAT_EYES[mood] || CAT_EYES.idle}</g>
    <g class="ct-glasses"><circle cx="40" cy="61" r="10.5"/><circle cx="68" cy="61" r="10.5"/><path d="M50.5 60h7M29.5 60h-4M78.5 60h4"/></g>
    ${CAT_MOUTH[mood] || CAT_MOUTH.idle}
    <g class="ct-book"><path d="M17 83l15-3 14 5v18l-14-4-15 3z"/><path class="ct-bookline" d="M32 80v19"/><circle class="ct-bookpaw" cx="40" cy="93" r="2.6"/></g>
    <circle class="ct-fur" cx="21" cy="94" r="6"/>
    <g class="ct-pencil"><path class="ct-pe-er" d="M86.27 68.65L90.93 70.55L91.63 71.70L90.42 74.67L83.75 71.94L84.97 68.98z"/><path class="ct-pe-bd" d="M83.75 71.94L90.42 74.67L89.66 76.52L83.00 73.79z"/><path class="ct-pe-y" d="M83.00 73.79L89.66 76.52L83.03 92.71L76.37 89.99z"/><path class="ct-pe-st" d="M84.99 75.25L78.78 90.43M87.21 76.16L81.00 91.34"/><path class="ct-pe-w" d="M76.37 89.99L83.03 92.71L76.86 98.29z"/><path class="ct-pe-l" d="M76.85 95.48L78.85 96.29L76.86 98.29z"/></g>
    <circle class="ct-fur ct-rpaw" cx="86" cy="88" r="6"/>
    <g class="ct-lucky"><path class="ct-collar" d="M27 81q27 11 54 0l1 6q-28 11-56 0z"/><circle class="ct-bell" cx="54" cy="91" r="4.6"/><path class="ct-bellslit" d="M51.5 92.5h5M54 92.5v2.2"/>
      <g class="ct-coin"><ellipse cx="25" cy="93" rx="12" ry="13.5"/><ellipse class="ct-coin-in" cx="25" cy="93" rx="8.6" ry="10"/><text x="25" y="95.6" text-anchor="middle">950+</text></g>
      <g class="ct-wave"><path class="ct-fur" d="M80 80C83 68 86 58 90 50l10 4c-3 9-7 19-11 29z"/><circle class="ct-fur" cx="95" cy="47" r="8"/><path class="ct-pawpad" d="M92 45.5h0M95 44h0M98 45.5h0"/></g></g>
    <g class="ct-spark"><path d="M8 34l7 6M4 46l9 1"/></g>
  </g></svg>`;
X.xiSay = (mood, text, size = 84) => `<div class="xi-say">${X.xi(mood, size)}<div class="bubble">${text}</div></div>`;

/* ---------- sound (WebAudio, no files) ---------- */
let ac;
const tone = (seq) => {
  if (S().profile.sound === false) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    let t = ac.currentTime;
    seq.forEach(([f, d, type = 'sine', v = 0.12]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.7;
    });
  } catch (e) {}
};
X.sfx = {
  ok: () => tone([[784, .09, 'triangle'], [1175, .16, 'triangle']]),
  bad: () => tone([[220, .12, 'square', .06], [165, .18, 'square', .05]]),
  tap: () => tone([[660, .04, 'sine', .05]]),
  combo: () => tone([[880, .07, 'triangle'], [1109, .07, 'triangle'], [1319, .14, 'triangle']]),
  win: () => tone([[523, .1, 'triangle'], [659, .1, 'triangle'], [784, .1, 'triangle'], [1047, .3, 'triangle', .14]]),
};

/* ---------- kèn chiến thắng cho "xin vía": trống cuộn → kèn "ten ten tennn" → hợp âm lớn + chũm chọe + tiếng xu leng keng ---------- */
X.fanfare = () => {
  if (S().profile.sound === false) return;
  let A; try { A = ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (A.state === 'suspended') A.resume(); } catch (e) { return; }
  const t0 = A.currentTime + 0.05, out = A.createDynamicsCompressor(); out.threshold.value = -14; out.ratio.value = 4;
  const master = A.createGain(); master.gain.value = 0.9; out.connect(master); master.connect(A.destination);
  // vang nhẹ cho kèn nghe như trong khán phòng
  const rv = A.createConvolver(), len = A.sampleRate * 1.8, ir = A.createBuffer(2, len, A.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  rv.buffer = ir; const wet = A.createGain(); wet.gain.value = 0.28; rv.connect(wet); wet.connect(out);
  const noiseBuf = (() => { const b = A.createBuffer(1, A.sampleRate * 2, A.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  // tiếng kèn đồng: 2 sóng răng cưa lệch nhẹ + lọc mở dần + rung giọng
  const brass = (f, t, dur, v = 0.16) => {
    const g = A.createGain(), lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(f * 1.2, t); lp.frequency.linearRampToValueAtTime(f * 7, t + 0.08); lp.frequency.exponentialRampToValueAtTime(f * 3.5, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.035); g.gain.setValueAtTime(v, t + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    const vib = A.createOscillator(), vg = A.createGain(); vib.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(dur, 0.6)); vib.connect(vg);
    [-6, 6].forEach(cent => { const o = A.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cent; vg.connect(o.frequency); o.connect(lp); o.start(t); o.stop(t + dur + 0.3); });
    vib.start(t); vib.stop(t + dur + 0.3); lp.connect(g); g.connect(out); g.connect(rv);
  };
  const drum = (t, v = 0.5, f = 110) => { const o = A.createOscillator(), g = A.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.35);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.55); };
  const snare = (t, v = 0.12) => { const n = A.createBufferSource(), g = A.createGain(), hp = A.createBiquadFilter(); n.buffer = noiseBuf; hp.type = 'highpass'; hp.frequency.value = 1800;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); n.connect(hp); hp.connect(g); g.connect(out); n.start(t, Math.random()); n.stop(t + 0.1); };
  const cymbal = (t, v = 0.35, dur = 2.2) => { const n = A.createBufferSource(), g = A.createGain(), hp = A.createBiquadFilter(); n.buffer = noiseBuf; hp.type = 'highpass'; hp.frequency.value = 5000;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(hp); hp.connect(g); g.connect(out); g.connect(rv); n.start(t); n.stop(t + dur); };
  const bell = (f, t, v = 0.08) => { [1, 2.76, 5.4].forEach((m, i) => { const o = A.createOscillator(), g = A.createGain(); o.type = 'sine'; o.frequency.value = f * m;
    g.gain.setValueAtTime(v / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9 / (i + 1)); o.connect(g); g.connect(out); g.connect(rv); o.start(t); o.stop(t + 1); }); };
  // 1) trống cuộn dồn dập 0.7 giây
  for (let i = 0; i < 16; i++) snare(t0 + i * 0.045, 0.05 + i * 0.008);
  const T = t0 + 0.72;
  // 2) "ten ten ten tennn": G4 G4 G4 → C5 (giữ lâu), bè dưới E4/C4
  const N = { C4: 261.63, E4: 329.63, G4: 392, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, G3: 196, C3: 130.81 };
  [[0, 0.13], [0.16, 0.13], [0.32, 0.13]].forEach(([d, l]) => { brass(N.G4, T + d, l, 0.15); brass(N.E4, T + d, l, 0.09); snare(T + d, 0.1); });
  brass(N.C5, T + 0.5, 0.42, 0.17); brass(N.G4, T + 0.5, 0.42, 0.1); drum(T + 0.5, 0.45);
  // 3) leo lên E5 → G5 rồi hợp âm Đô trưởng thật dài
  brass(N.E5, T + 0.98, 0.2, 0.15); brass(N.C5, T + 0.98, 0.2, 0.09); snare(T + 0.98, 0.1);
  const H = T + 1.22;
  [[N.G5, 0.15], [N.E5, 0.12], [N.C5, 0.12], [N.G4, 0.1], [N.C4, 0.1], [N.C3, 0.12]].forEach(([f, v]) => brass(f, H, 1.7, v));
  drum(H, 0.7, 90); drum(H + 0.25, 0.4, 90); cymbal(H, 0.32, 2.6);
  // 4) xu rơi leng keng trên nền hợp âm
  [N.C6, 1318.5, 1568, 2093, 1568, 2093, 2637].forEach((f, i) => bell(f, H + 0.15 + i * 0.11, 0.06));
};

/* ---------- confetti burst ---------- */
const COLORS = ['#6D4AFF', '#FF5C7A', '#FFC83D', '#22C7A9', '#4CC3FF'];
X.burst = (el, n = 22, spread = 1) => {
  if (reduce) return;
  const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'); p.className = 'cf ' + (i % 3 === 0 ? 'cf-c' : i % 3 === 1 ? 'cf-s' : 'cf-t');
    p.style.background = COLORS[i % COLORS.length]; p.style.left = cx + 'px'; p.style.top = cy + 'px';
    document.body.appendChild(p);
    const a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 120) * spread;
    const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 60 * spread;
    p.animate([{ transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 140}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
  }
};
X.rain = (n = 90) => { if (reduce) return; for (let i = 0; i < n; i++) setTimeout(() => { const p = document.createElement('i'); p.className = 'cf ' + (i % 2 ? 'cf-s' : 'cf-c'); p.style.background = COLORS[i % 5]; p.style.left = Math.random() * innerWidth + 'px'; p.style.top = '-12px'; document.body.appendChild(p); p.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(${innerHeight + 40}px) rotate(${Math.random() * 900}deg) translateX(${(Math.random() - .5) * 200}px)` }], { duration: 1600 + Math.random() * 1400, easing: 'ease-in' }).onfinish = () => p.remove(); }, i * 18); };

/* ---------- XP fly to sidebar ---------- */
X.xpFly = (n, from) => {
  if (reduce || !n) return;
  const tgt = document.querySelector('.mini-stats .xpc') || document.querySelector('.topbar');
  const r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const t = tgt ? tgt.getBoundingClientRect() : { left: 20, top: innerHeight - 40, width: 0, height: 0 };
  const b = document.createElement('div'); b.className = 'xpfly'; b.textContent = '+' + n + ' XP';
  b.style.left = r.left + r.width / 2 + 'px'; b.style.top = r.top + 'px'; document.body.appendChild(b);
  b.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-30px) scale(1.15)', opacity: 1, offset: .3 }, { transform: `translate(${t.left - r.left - r.width / 2}px, ${t.top - r.top}px) scale(.5)`, opacity: .2 }], { duration: 1000, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { b.remove(); if (tgt) { tgt.classList.remove('pop'); void tgt.offsetWidth; tgt.classList.add('pop'); } };
};
X.shake = el => { if (!el || reduce) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
X.pop = el => { if (!el || reduce) return; el.classList.remove('popin'); void el.offsetWidth; el.classList.add('popin'); };

/* ---------- answer feedback hook (used by quiz, lab, vocab game) ---------- */
X.react = (ok, el, combo) => {
  el = el || document.querySelector('.opt.ok, .mt.ok, .lines-pick .ok') || document.activeElement;
  if (ok) { X.sfx.ok(); X.burst(el, combo >= 5 ? 34 : 18); if (combo && combo % 5 === 0) { setTimeout(X.sfx.combo, 160); X.comboFlash(combo); } }
  else { X.sfx.bad(); X.shake(el && el.closest ? (el.closest('.q-card,.card,.vcard') || el) : el); }
};
X.comboFlash = n => { const d = document.createElement('div'); d.className = 'comboflash'; d.innerHTML = `<b>${n}</b><span>liên tiếp!</span>`; document.body.appendChild(d); setTimeout(() => d.remove(), 1200); };

/* ---------- big celebration overlay ---------- */
X.celebrate = ({ title, sub, stars = 0, xp = 0, btn = 'Tiếp tục', href = null, onClose } = {}) => {
  X.sfx.win(); X.rain(110);
  const d = document.createElement('div'); d.className = 'celebrate';
  d.innerHTML = `<div class="cel-card">${X.xi('happy', 120, 'jump')}<h2>${title}</h2>${stars ? `<div class="cel-stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${.25 + i * .18}s">★</span>`).join('')}</div>` : ''}
    ${sub ? `<p>${sub}</p>` : ''}${xp ? `<div class="cel-xp">+${xp} XP</div>` : ''}<button class="btn pri lg" id="cel-ok">${btn}</button></div>`;
  document.body.appendChild(d);
  const close = () => { d.remove(); onClose && onClose(); if (href) location.hash = href; };
  d.querySelector('#cel-ok').onclick = close; d.onclick = e => { if (e.target === d) close(); };
};

window.addEventListener('hashchange', () => document.querySelectorAll('.celebrate').forEach(e => e.remove()));
/* hook XP gains: fly from last clicked element */
let lastEl = null;
document.addEventListener('pointerdown', e => { lastEl = e.target.closest('button, a, .opt') || e.target; if (e.target.closest('button, .opt, .st, .urow, .stc, .mt')) X.sfx.tap(); }, true);
const _add = X.addXP;
X.addXP = (n, why) => { _add(n, why); if (n) X.xpFly(n, lastEl); };
})();
