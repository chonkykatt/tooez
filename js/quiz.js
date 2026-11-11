/* TOOEZ — quiz runner (practice / test) + result analysis */
'use strict';
(() => {
const { $, $$, esc, icon, pct, fmtMs, LETTERS, TTS } = X;
const CONF = [['sure', 'Chắc'], ['unsure', 'Phân vân'], ['guess', 'Lụi']];
const confName = k => (CONF.find(c => c[0] === k) || [0, '—'])[1];
X.confName = confName;

X.runQuiz = (view, o) => {
  let items = o.items;
  const mode = o.mode || 'practice'; // practice | test
  const pre = o.preset || {};
  // phiên làm dở: lưu theo đường dẫn hiện tại, quay lại là làm tiếp đúng câu đang dừng
  const sKey = o.reviewing || o.noResume ? null : (o.sessKey || X.hereKey());
  const sv = sKey && !o.fresh && X.sessGet(sKey);
  let restored = null;
  if (sv && sv.kind === 'quiz' && sv.mode === mode) {
    const its = sv.items || (sv.ids || []).map(id => X.itemById[id]);
    if (its.length && its.every(Boolean)) { items = its; o.items = its; restored = sv; }
  }
  const st = { i: 0, ans: pre.ans ? [...pre.ans] : items.map(() => null), conf: pre.conf ? [...pre.conf] : items.map(() => null), ms: items.map(() => 0), checked: items.map(() => false), showText: false, t0: Date.now(), qStart: Date.now(), timeLeft: o.timeLimit || 0, done: false };
  if (restored) { Object.assign(st, { i: Math.min(restored.i, items.length - 1), ans: restored.ans, conf: restored.conf, ms: restored.ms || st.ms, checked: restored.checked || st.checked, timeLeft: restored.timeLeft ?? st.timeLeft, t0: Date.now() - (restored.elapsed || 0), qStart: Date.now() }); setTimeout(() => X.toast(`Làm tiếp từ câu ${st.i + 1}/${items.length}`), 50); }
  const persist = () => { if (!sKey || st.done) return; const allIn = items.every(it => it.id && X.itemById[it.id] === it);
    X.sessSet(sKey, { kind: 'quiz', mode, title: o.title, n: items.length, i: st.i, ans: st.ans, conf: st.conf, ms: st.ms, checked: st.checked, timeLeft: st.timeLeft, elapsed: Date.now() - st.t0, ...(allIn ? { ids: items.map(it => it.id) } : { items }) }); };
  let timer = null;
  const total = items.length;
  if (o.reviewing) { st.checked = items.map(() => mode === 'practice'); }

  view.innerHTML = `<div class="page wide"><div class="qz">
    <div class="qz-top">
      <button class="icon-btn" data-k="exit" title="Thoát">${icon('x')}</button>
      <div style="min-width:0"><div class="kicker">${esc(o.kicker || '')}</div><div class="h3" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.title || '')}</div></div>
      <div class="bar"><i style="width:0"></i></div>
      <span class="count mono" id="qz-n"></span>
      <span class="qz-timer" id="qz-t"></span>
    </div>
    <div id="qz-main"></div>
    ${mode === 'test' ? '<div class="sheet" id="qz-sheet"></div>' : ''}
  </div></div>`;

  const main = $('#qz-main', view);
  $('[data-k=exit]', view).onclick = () => { if (mode === 'test' && st.ans.some(a => a !== null) && !confirm('Thoát bài? Bài làm dở sẽ bị bỏ.')) return; stop(); sKey && X.sessDel(sKey); location.hash = o.back || '#/today'; };

  const stop = () => { clearInterval(timer); TTS.stop(); };
  X.onLeave(() => { stamp(); persist(); stop(); });
  if (o.reviewing) { /* no timer while reviewing */ }
  else if (o.timeLimit) {
    timer = setInterval(() => {
      st.timeLeft--; const el = $('#qz-t', view);
      if (el) { el.textContent = fmtMs(st.timeLeft * 1000); el.classList.toggle('warn', st.timeLeft < 60); }
      if (st.timeLeft <= 0) { clearInterval(timer); X.toast('Hết giờ — nộp bài'); finish(); }
    }, 1000);
  } else {
    timer = setInterval(() => { const el = $('#qz-t', view); if (el) el.textContent = fmtMs(Date.now() - st.t0); }, 1000);
  }

  const setOf = it => it.set ? items.filter(x => x.set === it.set) : null;

  function audioBox(it) {
    if (!it.audio || !it.audio.length) return '';
    const isP2 = it.kind === 'p2', canPeek = TTS.missing(); // không có giọng đọc thì cho xem chữ
    return `<div class="audio-box"><button class="play" data-k="play" title="Nghe (phím Space)">${icon('play')}</button>
      <div><div style="font-weight:600">${isP2 ? 'Nghe câu hỏi và 3 câu trả lời' : it.ao ? 'Nghe 4 câu (A)-(D), chọn câu tả đúng tranh' : it.audio.length > 1 ? `Nghe ${it.part === 4 ? 'bài nói' : 'hội thoại'}` : 'Nghe'}</div>
      <div class="lines" id="qz-line">Bấm để phát - giọng đọc của trình duyệt</div></div>
      ${(isP2 || it.ao || it.hideq) && canPeek ? `<button class="btn sm ghost" style="margin-left:auto;color:#fff" data-k="txt">${icon('eye')} ${st.showText ? 'Ẩn chữ' : 'Hiện chữ'}</button>` : ''}</div>`;
  }

  function render() {
    persist();
    const it = items[st.i];
    const set = setOf(it);
    const passage = it.passage ? `<div class="passage" id="qz-pass">${it.setTitle ? `<div class="kicker" style="margin-bottom:10px">${esc(it.setTitle)}</div>` : ''}${it.passage}</div>` : '';
    const chosen = st.ans[st.i], checked = st.checked[st.i];
    const reveal = checked || (mode === 'test' && o.reviewing);
    const hideP2 = (it.kind === 'p2' || it.ao) && !st.showText && !reveal;
    const opts = it.options.map((op, k) => {
      let cls = '';
      if (reveal) { if (k === it.answer) cls = 'ok'; else if (k === chosen) cls = 'bad'; }
      else if (k === chosen) cls = 'sel';
      const why = reveal && it.optWhy && it.optWhy[k] ? `<span class="why">${esc(it.optWhy[k])}${it.optVi && it.optVi[k] ? ' - ' + esc(it.optVi[k]) : ''}</span>` : '';
      return `<button class="opt ${cls}" data-o="${k}"><span class="L">${LETTERS[k]}</span><span>${hideP2 ? '<span class="hid">(nghe)</span>' : esc(op)}${why}</span></button>`;
    }).join('');
    const showPrompt = !(it.kind === 'p2' && !st.showText && !reveal) && !(it.hideq === 'prompt' && !st.showText && !reveal);
    const fb = checked ? `<div class="fb ${chosen === it.answer ? 'ok' : 'bad'}">${X.xi(chosen === it.answer ? 'happy' : 'sad', 54)}<div><b class="h">${chosen === it.answer ? ['Chuẩn luôn!', 'Chính xác!', 'Đúng rồi!', 'Quá đỉnh!'][st.i % 4] : `Chưa đúng, đáp án là ${LETTERS[it.answer]}`}</b>${it.explain ? `<div>${it.explain.includes('<') ? it.explain : esc(it.explain)}</div>` : ''}
      ${it.audio && it.audio.length > 1 && it.kind !== 'p2' && !it.ao ? `<div class="transcript">${it.audio.map(l => `<p><b>${l.s === 'M' ? 'M' : l.s === 'W' ? 'W' : ''}:</b> ${esc(l.t)}</p>`).join('')}${it.transcriptVi ? `<p class="muted small">${esc(it.transcriptVi)}</p>` : ''}</div>` : ''}</div></div>` : '';
    const confRow = !checked ? `<div class="conf"><span class="lbl">Mức chắc chắn:</span>${CONF.map(([k, n], j) => `<button data-c="${k}" class="${(st.conf[st.i] || (mode === 'test' ? '' : 'sure')) === k ? 'on' : ''}">${n} <kbd>${'QWE'[j]}</kbd></button>`).join('')}</div>` : '';
    const actions = mode === 'practice'
      ? `<div class="qz-actions">${!checked ? `<button class="btn pri" data-k="check" ${chosen === null ? 'disabled' : ''}>Kiểm tra <kbd style="background:transparent;color:inherit;border-color:#555">Enter</kbd></button>` : `<button class="btn pri" data-k="next">${st.i < total - 1 ? 'Câu tiếp' : 'Xem kết quả'} ${icon('arrow')}</button>`}
          ${checked && chosen !== it.answer ? '<span class="small muted">Câu này đã vào Sổ lỗi để chữa sau.</span>' : ''}</div>`
      : `<div class="qz-actions"><button class="btn" data-k="prev" ${st.i === 0 ? 'disabled' : ''}>${icon('back')} Trước</button>
          <button class="btn pri" data-k="next">${st.i < total - 1 ? 'Câu tiếp' : 'Nộp bài'} ${icon('arrow')}</button>
          ${st.i < total - 1 && !o.reviewing ? '<button class="btn ghost" data-k="submit" style="margin-left:auto">Nộp bài</button>' : ''}</div>`;
    const card = `<div class="q-card">
      ${it.part ? `<div class="row" style="margin-bottom:6px"><span class="pill">${X.partOf(it.part).n}${it.num ? ' - Câu ' + it.num : ''}</span>${it.skill ? `<span class="pill syn">${esc(it.skill)}</span>` : ''}${set && set.length > 1 ? `<span class="pill">${set.indexOf(it) + 1}/${set.length} trong bài</span>` : ''}</div>` : ''}
      ${audioBox(it)}
      ${it.img ? `<div class="wimg on lab-pic q-pic"><img src="${it.img}" alt=""></div>` : it.context && !(it.hideq === 'context' && !st.showText && !reveal) ? `<div class="q-ctx">${esc(it.context)}</div>` : ''}
      ${showPrompt ? `<div class="q-prompt">${(it.kind === 'p2' || it.hideq === 'prompt' && it.part === 2) && reveal ? X.hiQ(it.prompt) : esc(it.prompt)}</div>${(it.kind === 'p2' || it.hideq === 'prompt' && it.part === 2) && reveal ? X.hiLegend : ''}${(reveal || mode === 'practice' && checked) && it.vi ? `<div class="q-vi">${esc(it.vi)}</div>` : ''}` : `<div class="q-prompt muted">${esc(it.ask || 'Nghe câu hỏi, chọn câu trả lời đúng.')}</div>`}
      <div class="opts">${opts}</div>
      ${confRow}${fb}${actions}
      <div class="small faint" style="margin-top:14px">Phím tắt: <kbd>1</kbd>-<kbd>4</kbd> chọn - <kbd>Q</kbd><kbd>W</kbd><kbd>E</kbd> mức chắc chắn - <kbd>Enter</kbd> tiếp${it.audio ? ' - <kbd>Space</kbd> nghe' : ''}</div>
    </div>`;
    main.innerHTML = `<div class="qz-body ${passage ? 'split' : ''}">${passage}${card}</div>`;
    if (passage && reveal && it.evidence) it.evidence.forEach(id => { const e = $(`[data-ev="${id}"]`, main); if (e) { e.classList.add('ev'); if (id === it.evidence[0]) e.scrollIntoView({ block: 'center' }); } });
    if (passage && it.kind === 'p6') { const b = $(`.blank[data-n="${it.num}"]`, main); if (b) { b.classList.add('cur'); b.scrollIntoView({ block: 'center' }); } }
    $('.bar>i', view).style.width = pct(st.ans.filter(a => a !== null).length, total) + '%';
    $('#qz-n', view).textContent = `${st.i + 1}/${total}`;
    if (mode === 'test') renderSheet();
    bind(it);
    st.qStart = Date.now();
    if ((it.kind === 'p2' || it.ao || it.hideq) && !checked && !(mode === 'test' && o.reviewing) && !st.played?.[st.i]) { (st.played ||= {})[st.i] = 1; setTimeout(() => playAudio(it), 300); }
  }

  function renderSheet() {
    const sh = $('#qz-sheet', view); if (!sh) return;
    sh.innerHTML = items.map((it, k) => {
      let c = st.ans[k] !== null ? 'ans' : '';
      if (o.reviewing) c = st.ans[k] === it.answer ? 'ok' : 'bad';
      return `<button class="${c} ${k === st.i ? 'cur' : ''}" data-j="${k}">${it.num || k + 1}</button>`;
    }).join('');
    $$('button', sh).forEach(b => b.onclick = () => { stamp(); st.i = +b.dataset.j; render(); });
  }

  async function playAudio(it) {
    const btn = $('[data-k=play]', main);
    if (btn && btn.dataset.on) { TTS.stop(); btn.dataset.on = ''; btn.innerHTML = icon('play'); return; }
    if (btn) { btn.dataset.on = 1; btn.innerHTML = icon('stop'); }
    if (!TTS.voices.length && !('speechSynthesis' in window)) X.toast('Trình duyệt không hỗ trợ giọng đọc');
    await TTS.play(it.audio, k => { const el = $('#qz-line', main); if (el) el.textContent = k < 0 ? 'Bấm để nghe lại' : (it.kind === 'p2' ? (k === 0 ? 'Câu hỏi…' : `Đáp án ${LETTERS[k - 1]}…`) : it.ao ? `Câu ${LETTERS[k]}…` : `Đang phát ${k + 1}/${it.audio.length}`); });
    const b2 = $('[data-k=play]', main); if (b2) { b2.dataset.on = ''; b2.innerHTML = icon('play'); }
  }

  function stamp() { st.ms[st.i] += Date.now() - st.qStart; st.qStart = Date.now(); }

  function choose(k) {
    if (st.checked[st.i] || o.reviewing) return;
    st.ans[st.i] = k;
    if (!st.conf[st.i]) st.conf[st.i] = 'sure';
    render();
  }
  function check() {
    const it = items[st.i]; if (st.ans[st.i] === null) return;
    stamp(); st.checked[st.i] = true; TTS.stop();
    const ok = st.ans[st.i] === it.answer;
    X.logAttempt(it, ok, st.ms[st.i], st.conf[st.i], o.ctx);
    if (!ok && !o.noErrorLog) X.addError(it, st.ans[st.i], st.conf[st.i], o.ctx);
    if (ok && st.conf[st.i] === 'guess' && !o.noErrorLog) X.addError(it, st.ans[st.i], 'guess', o.ctx);
    st.combo = ok ? (st.combo || 0) + 1 : 0;
    if (ok) X.addXP(2);
    o.onCheck && o.onCheck(it, ok);
    render();
    X.react && X.react(ok, $(ok ? '.opt.ok' : '.opt.bad', main), st.combo);
  }
  function next() {
    if (mode === 'practice') {
      if (!st.checked[st.i]) return check();
      if (st.i < total - 1) { st.i++; render(); } else finish();
    } else {
      if (o.reviewing && st.i === total - 1) return finish();
      stamp();
      if (st.i < total - 1) { st.i++; render(); } else if (o.reviewing) { o.onExitReview && o.onExitReview(); } else finish();
    }
  }
  function finish() {
    if (o.reviewing) { stop(); return o.onExitReview && o.onExitReview(); }
    if (st.done) return; st.done = true; stop(); sKey && X.sessDel(sKey);
    if (mode === 'test') {
      stamp();
      items.forEach((it, k) => {
        const ok = st.ans[k] === it.answer;
        X.logAttempt(it, ok, st.ms[k], st.conf[k], o.ctx);
        if (st.ans[k] !== null && !ok && !o.noErrorLog) X.addError(it, st.ans[k], st.conf[k], o.ctx);
        if (ok && st.conf[k] === 'guess' && !o.noErrorLog) X.addError(it, st.ans[k], 'guess', o.ctx);
      });
    }
    const rows = items.map((it, k) => ({ item: it, chosen: st.ans[k], ok: st.ans[k] === it.answer, ms: st.ms[k], conf: st.conf[k] }));
    const res = { total, correct: rows.filter(r => r.ok).length, ms: Date.now() - st.t0, rows, at: Date.now() };
    if (mode === 'test') X.addXP(res.correct + 10, 'Hoàn thành bài');
    o.onFinish && o.onFinish(res);
  }
  function bind(it) {
    $$('.opt', main).forEach(b => b.onclick = () => choose(+b.dataset.o));
    $$('[data-c]', main).forEach(b => b.onclick = () => { st.conf[st.i] = b.dataset.c; render(); });
    const on = (k, f) => { const b = $(`[data-k=${k}]`, main); if (b) b.onclick = f; };
    on('check', check); on('next', next); on('prev', () => { stamp(); st.i--; render(); });
    on('submit', () => { const n = st.ans.filter(a => a === null).length; if (n && !confirm(`Còn ${n} câu chưa làm. Nộp bài?`)) return; finish(); });
    on('play', () => playAudio(it));
    on('txt', () => { st.showText = !st.showText; render(); });
    document.onkeydown = e => {
      if (e.target.matches('input,textarea')) return;
      const k = e.key.toLowerCase();
      if (/^[1-4]$/.test(k) && +k <= it.options.length) choose(+k - 1);
      else if ('qwe'.includes(k) && k.length === 1 && !st.checked[st.i] && !o.reviewing) { st.conf[st.i] = CONF['qwe'.indexOf(k)][0]; render(); }
      else if (k === 'enter') { e.preventDefault(); next(); }
      else if (k === ' ' && it.audio) { e.preventDefault(); playAudio(it); }
      else if (k === 'arrowright' && mode === 'test') next();
      else if (k === 'arrowleft' && mode === 'test' && st.i > 0) { stamp(); st.i--; render(); }
    };
  }
  render();
};

/* ---------------- flow: quiz -> result -> review ---------------- */
X.quizFlow = (view, o, r = {}) => {
  const run = () => X.runQuiz(view, { ...o, onFinish: res => { r.onDone && r.onDone(res); show(res); } });
  const show = res => X.showResult(view, res, { ...r, canReview: true, title: o.title, kicker: r.kicker || o.kicker,
    onReview: () => X.runQuiz(view, { ...o, mode: o.mode, reviewing: true, timeLimit: 0, preset: { ans: res.rows.map(x => x.chosen), conf: res.rows.map(x => x.conf) }, onExitReview: () => show(res) }),
    retry: r.retry === false ? null : () => { if (o.reshuffle) o.items = o.reshuffle(); run(); } });
  run();
};

/* ---------------- result analysis ---------------- */
X.showResult = (view, res, o = {}) => {
  const rows = res.rows;
  const answered = rows.filter(r => r.chosen !== null);
  // by skill
  const by = {};
  rows.forEach(r => { const k = r.item.skill || 'Khác'; (by[k] ||= { n: 0, ok: 0, ms: 0 }); by[k].n++; by[k].ok += r.ok; by[k].ms += r.ms; });
  const skillRows = Object.entries(by).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
  const bySk = {};
  if (X.skillsOf) rows.forEach(r => X.skillsOf(r.item).forEach(k => { (bySk[k] ||= { n: 0, ok: 0 }); bySk[k].n++; bySk[k].ok += r.ok; }));
  const skRows = Object.entries(bySk).filter(([k]) => X.skillById[k] && X.skillById[k].layer !== 3).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 6);
  // confidence matrix
  const cm = (c, ok) => rows.filter(r => (r.conf || 'sure') === c && r.chosen !== null && r.ok === ok).length;
  const sureWrong = cm('sure', false), guessRight = cm('guess', true);
  // position within set (Part 3/4/6/7)
  const pos = {};
  rows.filter(r => r.item.pos).forEach(r => { const p = Math.min(r.item.pos, 5); (pos[p] ||= { n: 0, bad: 0 }); pos[p].n++; if (!r.ok) pos[p].bad++; });
  // halves (endurance)
  const half = Math.floor(rows.length / 2);
  const h1 = rows.slice(0, half), h2 = rows.slice(half);
  const acc1 = pct(h1.filter(r => r.ok).length, h1.length), acc2 = pct(h2.filter(r => r.ok).length, h2.length);
  const wrong = rows.filter(r => !r.ok);
  const score = pct(res.correct, res.total);
  if (score >= 80) setTimeout(() => { X.sfx && X.sfx.win(); X.rain && X.rain(50); }, 200);
  const insights = [];
  if (sureWrong >= 2) insights.push(`<b>${sureWrong} câu chắc mà vẫn sai.</b> Đây là lỗ hổng thật (hiểu sai quy tắc hoặc dính bẫy), ưu tiên chữa trước.`);
  if (guessRight >= 1) insights.push(`<b>${guessRight} câu lụi trúng.</b> Điểm này không bền, các câu đó đã vào Sổ lỗi để học lại.`);
  if (rows.length >= 10 && acc1 - acc2 >= 15) insights.push(`<b>Nửa sau đúng ${acc2}% so với ${acc1}% nửa đầu.</b> Dấu hiệu hụt sức hoặc thiếu thời gian, cần luyện sức bền và phân bổ giờ.`);
  const posBad = Object.entries(pos).filter(([, v]) => v.n >= 3).sort((a, b) => b[1].bad / b[1].n - a[1].bad / a[1].n)[0];
  if (posBad && posBad[1].bad / posBad[1].n >= 0.5 && Object.keys(pos).length > 1) insights.push(`<b>Câu thứ ${posBad[0]} trong mỗi bài sai ${posBad[1].bad}/${posBad[1].n}.</b> Thường là câu hỏi hành động tiếp theo, suy luận hoặc nối thông tin cuối bài.`);
  if (skillRows.length > 1 && skillRows[0][1].n >= 2 && skillRows[0][1].ok / skillRows[0][1].n < 0.6) insights.push(`<b>Dạng yếu nhất: ${esc(skillRows[0][0])}</b> (${skillRows[0][1].ok}/${skillRows[0][1].n}).`);
  const unanswered = rows.length - answered.length;
  if (unanswered) insights.push(`<b>${unanswered} câu bỏ trống.</b>`);

  view.innerHTML = `<div class="page">
    <div class="kicker">${esc(o.kicker || 'Kết quả')}</div>
    <div class="hello">${X.xi(score >= 80 ? 'happy' : score >= 50 ? 'think' : 'sad', 92)}<div><h1 class="h1">${esc(o.title || '')}</h1><p class="lead">${score >= 90 ? 'Xuất sắc! Soi kỹ vẫn không thấy hổng.' : score >= 80 ? 'Tốt lắm, giữ phong độ này.' : score >= 50 ? 'Ổn rồi, xem phần phân tích bên dưới để biết sửa chỗ nào.' : 'Chưa sao, Tooez đã ghi lại hết câu sai vào Sổ lỗi.'}</p></div></div>
    <div class="card sec" style="margin-top:18px"><div class="res-head">
      <div class="big-score">${res.correct}<small>/${res.total}</small></div>
      <div><div class="row"><span class="pill ${score >= 80 ? 'sage' : score >= 60 ? 'gold' : 'red'}">${score}% chính xác</span><span class="pill">${fmtMs(res.ms)}</span><span class="pill">${fmtMs(res.ms / Math.max(1, res.total))}/câu</span>${o.passMark ? `<span class="pill ${score >= o.passMark ? 'sage' : 'ember'}">${score >= o.passMark ? 'Đạt' : `Cần ${o.passMark}% để đạt`}</span>` : ''}</div>
      <div class="bar sage" style="margin-top:12px;max-width:420px"><i style="width:${score}%"></i></div></div>
    </div></div>
    ${insights.length ? `<div class="card sec ink"><div class="kicker" style="color:#9A9DA8">Soi nhanh</div><ul style="margin:10px 0 0;padding-left:18px">${insights.map(s => `<li style="margin:6px 0">${s}</li>`).join('')}</ul></div>` : ''}
    <div class="grid g2 sec">
      <div class="card"><div class="h3" style="margin-bottom:10px">Theo dạng câu</div>
        <table class="dt"><tr><th>Dạng</th><th class="num">Đúng</th><th class="num">TB/câu</th></tr>
        ${skillRows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num"><span class="pill ${v.ok / v.n >= .8 ? 'sage' : v.ok / v.n >= .5 ? 'gold' : 'red'}">${v.ok}/${v.n}</span></td><td class="num">${fmtMs(v.ms / v.n)}</td></tr>`).join('')}</table></div>
      ${skRows.length ? `<div class="card"><div class="h3" style="margin-bottom:4px">Theo kỹ năng</div><div class="small muted" style="margin-bottom:8px">Một câu có thể luyện nhiều kỹ năng. <a href="#/skills">Xem Bản đồ kỹ năng</a></div>
        ${skRows.map(([k, v]) => `<div class="hbar"><span>${esc(X.skillById[k].n)}</span><div class="bar ${v.ok / v.n >= .7 ? 'sage' : 'ember'}"><i style="width:${pct(v.ok, v.n)}%"></i></div><span class="mono small">${v.ok}/${v.n}</span></div>`).join('')}</div>` : ''}
      <div class="card"><div class="h3" style="margin-bottom:10px">Chắc chắn × Đúng sai</div>
        <div class="cmatrix">
          <div class="c"><span class="small muted">Chắc - đúng</span><b>${cm('sure', true)}</b></div>
          <div class="c" style="background:var(--red-soft)"><span class="small muted">Chắc - sai</span><b>${sureWrong}</b></div>
          <div class="c"><span class="small muted">Phân vân - đúng</span><b>${cm('unsure', true)}</b></div>
          <div class="c"><span class="small muted">Phân vân - sai</span><b>${cm('unsure', false)}</b></div>
          <div class="c" style="background:var(--gold-soft)"><span class="small muted">Lụi - đúng</span><b>${guessRight}</b></div>
          <div class="c"><span class="small muted">Lụi - sai</span><b>${cm('guess', false)}</b></div>
        </div>
        ${Object.keys(pos).length > 1 ? `<div class="h3" style="margin:18px 0 8px">Sai theo vị trí câu trong bài</div>${Object.entries(pos).map(([p, v]) => `<div class="hbar"><span>Câu thứ ${p}</span><div class="bar ember"><i style="width:${pct(v.bad, v.n)}%"></i></div><span class="mono small">${v.bad}/${v.n}</span></div>`).join('')}` : ''}
      </div>
    </div>
    <div class="row sec">
      ${wrong.length ? `<a class="btn syn" href="#/errors">${icon('err')} Chữa ${wrong.length} câu sai trong Sổ lỗi</a>` : ''}
      ${o.canReview ? `<button class="btn" data-k="review">${icon('eye')} Xem lại từng câu</button>` : ''}
      ${o.retry ? `<button class="btn" data-k="retry">${icon('refresh')} Làm lại</button>` : ''}
      ${o.next ? `<a class="btn pri" href="${o.next.href}">${esc(o.next.label)} ${icon('arrow')}</a>` : `<a class="btn ${wrong.length ? '' : 'pri'}" href="${o.back || '#/today'}">Xong</a>`}
    </div>
    ${wrong.length ? `<div class="sec"><div class="sec-h"><h2 class="h2">Câu sai</h2><span class="muted small">Đọc lời giải, rồi vào Sổ lỗi ghi nguyên nhân và quy tắc rút ra.</span></div>
      ${wrong.map(r => `<div class="err"><div class="top"><span class="pill">${X.partOf(r.item.part).n}${r.item.num ? ' - ' + r.item.num : ''}</span>${r.item.skill ? `<span class="pill syn">${esc(r.item.skill)}</span>` : ''}${r.conf ? `<span class="pill ${r.conf === 'sure' ? 'red' : ''}">${confName(r.conf)}</span>` : ''}</div>
        ${r.item.context ? `<div class="q-ctx small">${esc(r.item.context)}</div>` : ''}<div class="q">${esc(r.item.prompt)}</div>
        <div class="ans"><span class="y">Bạn chọn: ${r.chosen === null ? '(bỏ trống)' : LETTERS[r.chosen] + '. ' + esc(r.item.options[r.chosen])}</span><span class="c">Đáp án: ${LETTERS[r.item.answer]}. ${esc(r.item.options[r.item.answer])}</span></div>
        ${r.item.explain ? `<div class="small muted">${r.item.explain.includes('<') ? r.item.explain : esc(r.item.explain)}</div>` : ''}</div>`).join('')}</div>` : ''}
  </div>`;
  const b = $('[data-k=review]', view); if (b && o.onReview) b.onclick = o.onReview;
  const rt = $('[data-k=retry]', view); if (rt && o.retry) rt.onclick = o.retry;
};
})();
