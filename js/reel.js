/* TOOEZ - "Nhớ 1 phát": học một từ qua 10 bước, tự chạy như một video ngắn, có giọng đọc.
   1 Mở đầu → 2 Đoán chỗ trống (đếm ngược) → 3 Từ + phiên âm UK/US → 4 Nghĩa Việt/Anh + hình → 5 Ví dụ → 6 Dạng từ
   → 7 Cụm từ đi kèm → 8 Phân biệt từ dễ nhầm → 9 Tình huống thật → 10 Nhớ lại (gõ từ, vào lịch ôn).
   Dữ liệu: data/reel.js (window.REEL), sửa được ở Soạn đề. Giọng Việt: file thu sẵn (vai VI), không có thì dùng giọng tiếng Việt của máy. */
'use strict';
(() => {
const { $, $$, esc, icon, TTS } = X;
const S = () => X.S();
const REEL = () => window.REEL || [];
const HOOK = 'Đây là cách ghi nhớ từ vựng hiệu quả nhất, dựa trên cách não học ngoại ngữ. Cùng thử nhé!';
const ASK = 'Mọi người đoán xem chỗ trống là gì?';
const REC = 'Bạn đã nhớ chưa? Chúng ta vừa học từ gì nhỉ?';
X.REEL_VI = () => [HOOK, ASK, REC];   // để công cụ tạo audio biết các câu tiếng Việt dùng chung
const STEPS = ['Mở đầu', 'Đoán từ', 'Phát âm', 'Nghĩa', 'Ví dụ', 'Dạng từ', 'Cụm từ', 'Phân biệt', 'Tình huống', 'Nhớ lại'];
const KEY = 'tooez.reel';
// từ đã học xong: lưu trong tiến độ (đăng nhập thì đồng bộ giữa các máy)
const done = () => { const st = S(); if (!st.reelDone) { st.reelDone = {}; try { Object.assign(st.reelDone, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {} } return st.reelDone; };
const markDone = id => { done()[id] = Date.now(); X.save(); };
// "word (pos) - nghĩa" / "cụm - nghĩa" → [trái, phải]
const split = s => { const i = String(s).indexOf(' - '); return i < 0 ? [String(s), ''] : [s.slice(0, i), s.slice(i + 3)]; };
const head = s => split(s)[0].replace(/\s*\(.*?\)\s*$/, '').trim();
const stem = w => w.w.toLowerCase().replace(/(e|y)$/, '').slice(0, Math.max(4, w.w.length - 2));
const hl = (t, w) => esc(t).replace(new RegExp('\\b(' + stem(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*)', 'gi'), '<mark>$1</mark>');
const hint = a => a.split('').map((c, i) => /[a-z]/i.test(c) ? (i === 0 || i % 3 === 0 ? c : '_') : c).join(' ');
const full = w => w.cloze.replace(/_{2,}/, w.ans);
const blankHtml = (w, show) => esc(w.cloze).replace(/_{2,}/, show ? `<b class="rl-ans">${esc(w.ans)}</b>` : `<span class="rl-blank">${esc(hint(w.ans))}</span>`);
const typeOk = (v, a) => v.trim().toLowerCase().replace(/[^a-z]/g, '') === a.toLowerCase().replace(/[^a-z]/g, '');
// mọi câu sẽ được đọc (để tạo sẵn file audio và để trang Soạn đề biết câu nào chưa có audio)
const colSay = c => split(c)[0].replace(/\s*\/\s*/g, ', ');
const cmpWord = c => split(c)[0].replace(/\s*\(.*$/, '');
const formSay = f => head(f).split(/\s*\/\s*/);
X.reelLines = w => ({
  en: [['A', w.w], ['W', w.w], ['W', full(w)], ['W', w.en], ['W', "Time's up!"], ...w.ex.map((e, i) => [i % 2 ? 'M' : 'W', e]), ...w.forms.flatMap(f => formSay(f).map(x => ['W', x])),
    ...w.col.map(c => ['W', colSay(c)]), ...w.cmp.map(c => ['W', cmpWord(c)]), ...w.talk.map(l => [l.s === 'M' ? 'M' : 'W', l.t])],
  vi: [HOOK, ASK, REC, w.vi, ...w.cmp.map(c => split(c)[1])],
});
const wordOf = R => { let w = X.VOCAB.find(x => x.w.toLowerCase() === R.w.toLowerCase());
  if (!w) { w = { id: 'w-' + R.id, w: R.w, vi: R.vi, def: R.en, ipa: R.us, pos: R.pos, parts: [5, 7], topics: ['Kho mở rộng'], group: 'Kho mở rộng', topic: 'Kho mở rộng', fam: [], ant: [], ex: R.ex.slice(0, 2), col: R.col.map(head), star: true, kind: 'word', syn: [] }; X.VOCAB.push(w); X.wordById[w.id] = w; }
  return w; };

/* ---- âm thanh ---- */
let viV = null;
const viVoice = () => viV || (viV = ('speechSynthesis' in window ? speechSynthesis.getVoices() : []).find(v => /^vi/i.test(v.lang)) || null);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sayVi = async text => {
  if (TTS.fileFor('VI', text)) return TTS.speak(text, { role: 'VI', forceFile: true });
  const v = viVoice(); if (!v) return sleep(900 + text.length * 45);   // không có giọng Việt: đủ thời gian để đọc phụ đề
  const tk = TTS.token;
  return new Promise(res => { const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; u.rate = 1.05; let t = setTimeout(res, 4000 + text.length * 120);
    u.onend = u.onerror = () => { clearTimeout(t); res(); }; if (tk !== TTS.token) return res(); try { speechSynthesis.cancel(); } catch (e) {} speechSynthesis.speak(u); });
};
const sayEn = (text, role = 'W') => TTS.speak(text, { role, sex: role === 'M' || role === 'A' ? 'M' : 'W', lang: role === 'A' ? 'en-GB' : 'en-US' });
// tiếng tích tắc / hết giờ (tự tạo, không cần file)
let AC = null;
const beep = (f, d, vol = 0.12) => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; o.type = 'square'; g.gain.setValueAtTime(vol, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d); } catch (e) {} };

/* ---- danh sách từ ---- */
X.route(/^\/vocab\/nho$/, view => {
  const d = done(), list = REEL(), next = list.find(w => !d[w.id]) || list[0];
  view.innerHTML = `<div class="page">${X.stepHead ? X.stepHead('hoc') : ''}<a href="#/vocab" class="small">${icon('back')} Kho từ vựng</a>
    <div class="kicker syn" style="margin-top:16px">Nhớ 1 phát</div><h1 class="h1">Mỗi từ một "video" 10 bước, xem xong là nhớ</h1>
    <p class="lead">Đoán từ trong câu, nghe phát âm Anh - Mỹ, hiểu nghĩa, nghe 4 câu ví dụ, các dạng từ, cụm từ đi kèm, phân biệt với từ dễ nhầm, xem người thật nói từ đó, rồi tự nhớ lại. Từ học xong tự vào lịch ôn.</p>
    ${next ? `<a class="btn pri" href="#/vocab/nho/${esc(next.id)}">${icon('play')} ${d[next.id] ? 'Học lại' : 'Học từ tiếp theo'}: ${esc(next.w)}</a>` : ''}
    <div class="sec-h sec"><h2 class="h2">${list.length} từ TOEIC hay gặp</h2><span class="small muted">${Object.keys(d).filter(k => list.some(w => w.id === k)).length} từ đã học</span></div>
    <div class="rl-grid">${list.map(w => `<a class="card link rl-w ${d[w.id] ? 'ok' : ''}" href="#/vocab/nho/${esc(w.id)}"><b>${esc(w.w)}</b> <span class="pill">${esc(w.pos)}</span>${d[w.id] ? ' <span class="pill sage">✓</span>' : ''}<div class="small muted">${esc(w.vi.split(/[,;.]/)[0])}</div></a>`).join('')}</div></div>`;
});

/* ---- YouGlish: tìm video YouTube có người nói từ đó (miễn phí, cần ghi rõ nguồn và link điều khoản YouTube) ---- */
let ygLoad = null, YGW = null;
const ygReady = () => ygLoad || (ygLoad = new Promise((res, rej) => {
  if (window.YG && window.YG.Widget) return res();
  window.onYouglishAPIReady = () => res();
  const sc = document.createElement('script'); sc.src = 'https://youglish.com/public/emb/widget.js'; sc.async = true; sc.onerror = () => { ygLoad = null; rej(new Error('yg')); }; document.head.appendChild(sc);
  setTimeout(() => rej(new Error('timeout')), 12000);
}));
const closeYG = () => { if (YGW) { try { YGW.close(); } catch (e) {} YGW = null; } };
function openYG(q, r, done, acc) {
  const el = document.getElementById('rl-yg-' + r); if (!el) return done('fail');
  closeYG(); el.innerHTML = '';
  let heard = false, nextMode = false; const msg = () => document.getElementById('rl-yg-msg');
  const to = setTimeout(() => done('fail'), 15000);
  ygReady().then(() => {
    if (!el.isConnected) return;
    YGW = new YG.Widget(el.id, { width: Math.min(400, el.clientWidth || 360), components: 24, autoStart: 1, restrictionMode: 1, backgroundColor: '#221A4D', panelsBackgroundColor: '#2E2560', textColor: '#FFFFFF', captionColor: '#FFFFFF', keywordColor: '#FFC83D', markerColor: '#FFC83D', linkColor: '#B9B2E8', titleColor: '#FFFFFF', queryColor: '#FFC83D', events: {
      onFetchDone: e => { clearTimeout(to); if (!e.totalResult) { done('fail'); return; } const m = msg(); if (m) m.innerHTML = `Có <b>${e.totalResult.toLocaleString('vi-VN')}</b> video người bản xứ nói “${esc(q)}”. Nghe câu này <span class="faint">(video chưa chạy thì bấm vào video)</span>:`; },
      onCaptionConsumed: () => { if (!heard && !nextMode) { heard = true; try { YGW.pause(); } catch (e) {} done('ok'); } },
      onError: () => { clearTimeout(to); done('fail'); },
    } });
    YGW.fetch(q, 'english', acc || 'us');
    const re = document.getElementById('rl-yg-re'), nx = document.getElementById('rl-yg-nx');
    if (re) re.onclick = () => { nextMode = true; TTS.stop(); try { YGW.replay(); } catch (e) {} };
    if (nx) nx.onclick = () => { nextMode = true; TTS.stop(); try { YGW.next(); } catch (e) {} };
    $$('[data-acc]').forEach(b => b.onclick = () => { nextMode = true; try { YGW.fetch(q, 'english', b.dataset.acc); } catch (e) {} });
  }).catch(() => { clearTimeout(to); done('fail'); });
}

/* ---- trình phát 10 bước ---- */
X.route(/^\/vocab\/nho\/([\w-]+)$/, (view, id) => {
  const list = REEL(), w = list.find(x => x.id === id); if (!w) return X.go('#/vocab/nho');
  const nextW = list[(list.indexOf(w) + 1) % list.length];
  let step = 0, run = 0, paused = false, guessed = null;
  view.innerHTML = `<div class="rl-wrap"><div class="rl" id="rl">
      <div class="rl-bar">${STEPS.map((s, i) => `<i data-i="${i}" title="${s}"><b></b></i>`).join('')}</div>
      <div class="rl-top"><span class="rl-lab" id="rl-lab"></span><a class="rl-x" href="#/vocab/nho" title="Thoát" aria-label="Thoát">✕</a></div>
      <div class="rl-body" id="rl-body"></div>
      <div class="rl-ctl"><button id="rl-prev" title="Bước trước">◀</button><button id="rl-pp" title="Dừng / chạy">⏸</button><button id="rl-re" title="Xem lại bước này">⟲</button><button id="rl-next" title="Bước sau">▶</button></div>
    </div></div>`;
  const body = $('#rl-body', view);
  const alive = r => r === run && view.isConnected && $('#rl', view);
  const STOP = {};
  const chk = r => { if (!alive(r)) throw STOP; };
  const bar = () => $$('.rl-bar i', view).forEach((el, i) => { el.className = i < step ? 'done' : i === step ? 'on' : ''; });
  const pop = (sel, cls = 'in') => { const el = $(sel, body); if (el) el.classList.add(cls); return el; };
  const say = async (r, fn, text, role) => { chk(r); await fn(text, role); chk(r); };
  const wait = async (r, ms) => { await sleep(ms); chk(r); };
  const R = {
    // 1. Mở đầu
    0: async r => {
      body.innerHTML = `<div class="rl-c rl-hook"><div class="rl-big">ĐÂY LÀ CÁCH GHI NHỚ TỪ VỰNG<br><span class="syn">HIỆU QUẢ NHẤT!!</span></div><div class="rl-mid">Dựa trên cách não học ngoại ngữ.<br>Cùng thử nhé!</div></div>`;
      await say(r, sayVi, HOOK); await wait(r, 300);
    },
    // 2. Đoán chỗ trống, đếm ngược 3-2-1
    1: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-q">MỌI NGƯỜI ĐOÁN XEM<br>CHỖ TRỐNG LÀ GÌ?</div>
        <div class="rl-sent">${blankHtml(w, false)}</div>
        <div class="rl-guess"><input class="inp" id="rl-in" placeholder="Gõ từ bạn đoán…" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn pri sm" id="rl-ok">Chốt</button></div>
        <div class="rl-count" id="rl-cd"></div></div>`;
      const inp = $('#rl-in', body);
      const check = () => { guessed = typeOk(inp.value, w.ans); inp.disabled = true; $('#rl-ok', body).disabled = true; $('#rl-cd', body).innerHTML = guessed ? '<span class="rl-good">Chuẩn luôn! 🎯</span>' : `<span class="muted">Đã chốt: “${esc(inp.value)}”</span>`; };
      $('#rl-ok', body).onclick = check; inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) check(); };
      await say(r, sayVi, ASK);
      // cho thời gian nghĩ, 3 giây cuối đếm ngược
      for (let t = 0; t < 30 && guessed === null; t++) { await wait(r, 100); }
      for (const n of [3, 2, 1]) { if (guessed === null) $('#rl-cd', body).innerHTML = `<span class="rl-n">${n}</span>`; beep(880, 0.08); await wait(r, 1000); }
      if (guessed === null && inp.value.trim()) check();
      inp.disabled = true;
      $('#rl-cd', body).insertAdjacentHTML('beforeend', '<div class="rl-up">TIME\'S UP!</div>'); beep(520, 0.35, 0.15);
      await say(r, sayEn, "Time's up!"); await wait(r, 500);
    },
    // 3. Hiện từ + phiên âm, đọc giọng Anh và Mỹ nhiều lần, câu ngữ cảnh vẫn ở dưới
    2: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-word">${esc(w.w)} <span class="rl-pos">(${esc(w.pos)})</span></div>
        <div class="rl-ipa"><span id="rl-uk">🇬🇧 UK ${esc(w.uk)}</span><span id="rl-us">🇺🇸 US ${esc(w.us)}</span></div>
        <div class="rl-sent sm">${blankHtml(w, true)}</div>${guessed === true ? '<div class="rl-good small">Bạn đoán đúng ngay từ đầu 👏</div>' : ''}</div>`;
      for (let k = 0; k < 2; k++) {
        $('#rl-uk', body).classList.add('on'); await say(r, sayEn, w.w, 'A'); $('#rl-uk', body).classList.remove('on'); await wait(r, 450);
        $('#rl-us', body).classList.add('on'); await say(r, sayEn, w.w, 'W'); $('#rl-us', body).classList.remove('on'); await wait(r, 450);
      }
      pop('.rl-sent'); await say(r, sayEn, full(w), 'W'); await wait(r, 400);
    },
    // 4. Nghĩa tiếng Việt + tiếng Anh + hình minh hoạ
    3: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-word sm">${esc(w.w)}</div>
        ${w.pic && w.pic.length ? '' : (w.note ? `<div class="small muted">${esc(w.note)}</div>` : '')}<div class="rl-story">${(w.pic || []).map((p, i) => { const m = String(p).match(/^(\S+)\s+(.*)$/) || ['', '🖼️', p]; return `<div class="rl-f" data-f="${i}"><div class="e">${esc(m[1])}</div><div class="small">${esc(m[2])}</div></div>`; }).join('<span class="rl-arr">→</span>')}</div>
        <div class="rl-mean vi" id="rl-vi"><span class="pill syn">Tiếng Việt</span> ${esc(w.vi)}</div>
        <div class="rl-mean en" id="rl-en"><span class="pill">English</span> ${esc(w.en)}</div></div>`;
      const frames = $$('.rl-f', body); frames.forEach((f, i) => setTimeout(() => f.classList.add('in'), 200 + i * 700));
      pop('#rl-vi'); await say(r, sayVi, w.vi); await wait(r, 300);
      pop('#rl-en'); await say(r, sayEn, w.en, 'W'); await wait(r, 600);
    },
    // 5. Ví dụ: 4 câu, đọc từng câu
    4: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-h">Ví dụ:</div>${w.ex.length ? '' : '<div class="muted">Từ điển chưa có câu ví dụ cho từ này. Xem người thật dùng từ ở bước 9 nhé.</div>'}${w.ex.map((e, i) => `<div class="rl-ex" data-x="${i}">${hl(e, w)}</div>`).join('')}</div>`;
      for (let i = 0; i < w.ex.length; i++) { const el = $(`[data-x="${i}"]`, body); el.classList.add('in', 'now'); await say(r, sayEn, w.ex[i], i % 2 ? 'M' : 'W'); el.classList.remove('now'); await wait(r, 450); }
    },
    // 6. Các dạng từ
    5: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-h">Các dạng của <b>${esc(w.w)}</b></div>${w.forms.length ? '' : '<div class="muted small">Từ này không có dạng khác hay gặp.</div>'}<div class="rl-form in"><b>${esc(w.w)}</b> <span class="pill">${esc(w.pos)}</span><div class="small">${esc(w.vi.split(/[;.]/)[0])}</div></div>
        ${w.forms.map((f, i) => { const [a, b] = split(f); return `<div class="rl-form" data-m="${i}"><b>${esc(a)}</b><div class="small">${esc(b)}</div></div>`; }).join('')}</div>`;
      for (let i = 0; i < w.forms.length; i++) { const el = $(`[data-m="${i}"]`, body); el.classList.add('in', 'now'); const words = formSay(w.forms[i]); for (const x of words) await say(r, sayEn, x, 'W'); el.classList.remove('now'); await wait(r, 600); }
      await wait(r, 400);
    },
    // 7. Cụm từ đi kèm, hiện lần lượt
    6: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-h">Hay đi với</div>${w.col.length ? '' : '<div class="muted">Chưa có cụm từ hay gặp cho từ này.</div>'}${w.col.map((c, i) => { const [a, b] = split(c); return `<div class="rl-col" data-c="${i}"><b>${hl(a, w)}</b><div class="small">${esc(b)}</div></div>`; }).join('')}</div>`;
      for (let i = 0; i < w.col.length; i++) { const el = $(`[data-c="${i}"]`, body); el.classList.add('in', 'now'); await say(r, sayEn, colSay(w.col[i]), 'W'); el.classList.remove('now'); await wait(r, 500); }
    },
    // 8. Phân biệt các từ dễ nhầm, giải thích tiếng Việt
    7: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-h">Phân biệt: ${w.cmp.map(c => esc(head(c).replace(/\s*\(.*$/, ''))).join(', ')}</div>${w.cmp.map((c, i) => { const [a, b] = split(c); return `<div class="rl-cmp ${i === 0 ? 'me' : ''}" data-p="${i}"><b>${esc(a)}</b><div>${esc(b)}</div></div>`; }).join('')}</div>`;
      for (let i = 0; i < w.cmp.length; i++) { const el = $(`[data-p="${i}"]`, body), [a, b] = split(w.cmp[i]); el.classList.add('in', 'now'); await say(r, sayEn, cmpWord(w.cmp[i]), 'W'); await wait(r, 200); await say(r, sayVi, b); el.classList.remove('now'); await wait(r, 400); }
    },
    // 9. Tình huống thật: người thật nói từ này (YouGlish, video YouTube có phụ đề); không tải được thì nghe hội thoại mẫu
    8: async r => {
      const talk = w.talk.length ? w.talk : w.ex.map((t, k) => ({ s: k % 2 ? 'M' : 'W', t }));
      const talkHtml = () => `<div class="rl-talk">${talk.map((l, i) => `<div class="rl-b ${l.s === 'M' ? 'm' : 'w'}" data-t="${i}"><span class="who">${l.s === 'M' ? '🧑‍💼' : '👩‍💼'}</span><span class="tx">${hl(l.t, w)}</span></div>`).join('')}</div>`;
      const playTalk = async () => { for (let i = 0; i < talk.length; i++) { const el = $(`[data-t="${i}"]`, body); el.classList.add('in', 'now'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); await say(r, sayEn, talk[i].t, talk[i].s === 'M' ? 'M' : 'W'); el.classList.remove('now'); await wait(r, 350); } await wait(r, 400); };
      body.innerHTML = `<div class="rl-c"><div class="rl-h">Trong đời thật</div>
        <div class="seg rl-seg" id="rl-seg"><button data-v="yg" class="on">🎬 Người thật nói</button>${talk.length ? `<button data-v="talk">💬 ${w.talk.length ? 'Hội thoại mẫu' : 'Nghe câu mẫu'}</button>` : ''}</div>
        <div id="rl-yg-box"><div class="small muted" id="rl-yg-msg">Đang tìm video có người nói “${esc(w.w)}”…</div><div id="rl-yg-${r}" class="rl-yg"></div>
          <div class="row rl-yg-ctl" style="gap:6px;justify-content:center;flex-wrap:wrap"><button class="btn sm" id="rl-yg-re">⟲ Nghe lại câu</button><button class="btn sm" id="rl-yg-nx">Video khác ▸</button><button class="btn sm" data-acc="us">🇺🇸</button><button class="btn sm" data-acc="uk">🇬🇧</button></div>
          <a class="btn sm rl-yg-open" href="https://youglish.com/pronounce/${encodeURIComponent(w.w)}/english/us" target="_blank" rel="noopener">Xem thêm trên YouGlish ↗</a>
          <div class="rl-yg-legal">Video từ YouTube qua YouGlish · <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">Điều khoản YouTube</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Quyền riêng tư Google</a></div></div>
        <div id="rl-talk-box" hidden>${w.scene ? `<div class="small muted" style="margin-bottom:6px">${esc(w.scene)}</div>` : ''}${talkHtml()}</div></div>`;
      const seg = v => { $$('#rl-seg button', body).forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('#rl-yg-box', body).hidden = v !== 'yg'; $('#rl-talk-box', body).hidden = v !== 'talk'; };
      const toTalk = async () => { closeYG(); if (!talk.length) { $('#rl-yg-msg', body).textContent = 'Không mở được video lúc này (mạng chặn YouTube?). Bấm ▶ để sang bước cuối.'; return; } seg('talk'); await playTalk(); };
      let manual = false;
      const res = await new Promise(done => {
        $$('#rl-seg button', body).forEach(b => b.onclick = () => { manual = true; if (b.dataset.v === 'talk') { closeYG(); seg('talk'); TTS.stop(); done('talk'); } else { seg('yg'); TTS.stop(); openYG(w.w, r, done, 'us'); } });
        openYG(w.w, r, done, 'us');
      });
      chk(r);
      if (res === 'talk') { if (!manual) seg('talk'); await playTalk(); return; }
      if (res === 'fail') return toTalk();
      // đã nghe xong một câu có từ đó: dừng video một chút rồi sang bước cuối (bấm "Video khác" để xem tiếp, khi đó bước này đứng yên chờ bạn bấm ▶)
      await wait(r, 1200); closeYG();
    },
    // 10. Nhớ lại: gõ lại từ, rồi vào lịch ôn
    9: async r => {
      body.innerHTML = `<div class="rl-c"><div class="rl-q">BẠN ĐÃ NHỚ CHƯA?<br>CHÚNG TA VỪA HỌC TỪ GÌ NHỈ?</div>
        <div class="rl-sent">${esc(w.cloze).replace(/_{2,}/, '<span class="rl-blank">______</span>')}</div><div class="small muted" style="margin-top:6px">${esc(w.vi)}</div>
        <div class="rl-guess"><input class="inp" id="rl-in" placeholder="Gõ từ vừa học…" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn pri sm" id="rl-ok">Kiểm tra</button><button class="btn ghost sm" id="rl-h">Gợi ý</button></div>
        <div id="rl-fb" class="rl-fb"></div></div>`;
      $('#rl-pp', view).disabled = true;
      const inp = $('#rl-in', body); let hints = 0, tries = 0;
      const finish = ok => {
        const wd = wordOf(w); X.srsReview(wd.id, ok ? (hints ? 2 : 3) : 1, 'vi2en'); markDone(w.id); X.addXP && X.addXP(ok ? 10 : 5, 'Nhớ 1 phát: ' + w.w);
        $('.rl-guess', body).remove(); $('.rl-sent', body).remove();
        $('#rl-fb', body).innerHTML = `${ok ? '<div class="rl-good">✓ Nhớ rồi đó!</div>' : `<div>Từ cần nhớ là <b class="rl-ans">${esc(w.ans)}</b></div>`}
          <div class="rl-sent sm">${blankHtml(w, true)}</div><div class="small muted">Đã đưa <b>${esc(w.w)}</b> vào lịch ôn. Vài hôm nữa nó sẽ quay lại để bạn nhớ lâu.</div>
          <div class="row" style="gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap"><a class="btn pri" href="#/vocab/nho/${esc(nextW.id)}">Từ tiếp theo: ${esc(nextW.w)} ${icon('arrow')}</a><button class="btn" id="rl-again">Xem lại từ đầu</button><a class="btn ghost" href="#/vocab/nho">Danh sách</a></div>`;
        $('#rl-again', body).onclick = () => go(0); body.scrollTop = 0;
        sayEn(full(w), 'W');
      };
      const check = () => { if (!inp.value.trim()) return; tries++; if (typeOk(inp.value, w.ans) || typeOk(inp.value, w.w)) return finish(true);
        if (tries >= 2) return finish(false); $('#rl-fb', body).innerHTML = '<span class="muted">Chưa đúng, thử lại một lần nữa nhé.</span>'; inp.select(); };
      $('#rl-ok', body).onclick = check; inp.onkeydown = e => { if (e.key === 'Enter') check(); };
      $('#rl-h', body).onclick = () => { hints++; inp.placeholder = hint(w.ans); $('#rl-fb', body).innerHTML = `<span class="muted">Gợi ý: ${esc(hint(w.ans))}</span>`; inp.focus(); };
      await say(r, sayVi, REC); if (alive(r)) inp.focus();
    },
  };
  const go = async i => {
    TTS.stop(); closeYG(); const r = ++run; step = Math.max(0, Math.min(STEPS.length - 1, i)); paused = false; $('#rl-pp', view).textContent = '⏸'; $('#rl-pp', view).disabled = false;
    $('#rl-lab', view).textContent = `${step + 1}/10 · ${STEPS[step]}`; bar(); body.scrollTop = 0;
    if (step <= 1) guessed = null;
    try { await R[step](r); } catch (e) { if (e !== STOP) console.warn('reel', e); return; }
    if (alive(r) && step < STEPS.length - 1) go(step + 1);
  };
  $('#rl-next', view).onclick = () => go(step + 1);
  $('#rl-prev', view).onclick = () => go(step - 1);
  $('#rl-re', view).onclick = () => go(step);
  $('#rl-pp', view).onclick = () => { if (paused) return go(step); paused = true; run++; TTS.stop(); if (YGW) { try { YGW.pause(); } catch (e) {} } $('#rl-pp', view).textContent = '▶'; $('#rl-lab', view).textContent = `${step + 1}/10 · ${STEPS[step]} · đang dừng`; };
  $$('.rl-bar i', view).forEach(el => el.onclick = () => go(+el.dataset.i));
  const key = e => { if (!view.isConnected || !$('#rl', view)) return document.removeEventListener('keydown', key); if (/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') go(step + 1); else if (e.key === 'ArrowLeft') go(step - 1); else if (e.key === ' ') { e.preventDefault(); $('#rl-pp', view).click(); } };
  document.addEventListener('keydown', key);
  go(0);
});
})();
