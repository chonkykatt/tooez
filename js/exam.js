/* TOOEZ — Đề thi từng Part: làm như thi thật, chấm, rồi chữa từng câu.
   Nghe (Part 1-4): audio chạy một lượt, không nghe lại, hết giờ chờ thì tự sang câu sau.
   Đọc (Part 5-7): đếm ngược cả Part, đi lại tự do giữa các câu, có phiếu trả lời. */
'use strict';
(() => {
const { $, $$, esc, icon, pct, fmtMs, fmtDate, LETTERS, TTS } = X;
const S = () => X.S();
const G = p => (window.EXAM_GUIDE || {})[p] || { real: '', rules: [], fix: [] };
(window.EXAM_EXTRA || []).forEach(it => { X.itemById[it.id] = it; });   // chỉ dùng trong đề, không trộn vào Lab
X.EXAMS = window.EXAMS || [];
const exById = id => X.EXAMS.find(e => e.id === id);
const LISTEN = p => p <= 4;

X.examItems = e => {
  let its;
  if (e.ids) its = e.ids.map(id => X.itemById[id]);
  else if (e.test) its = X.BANK.filter(i => i.test === e.test).sort((a, b) => a.num - b.num);
  else its = e.sets.flatMap(sid => [...X.BANK.filter(i => i.set === sid), ...(window.EXAM_EXTRA || []).filter(i => i.set === sid)].sort((a, b) => (a.pos || 0) - (b.pos || 0)));
  return its.filter(Boolean).filter(i => !(e.drop || []).includes(i.id));
};
const pagesOf = its => { const out = []; its.forEach((it, k) => { const last = out[out.length - 1]; if (it.set && last && last.set === it.set) last.idx.push(k); else out.push({ set: it.set || null, idx: [k] }); }); return out; };
const docName = it => { const h = [...String(it.passage || '').matchAll(/<h4>([^<]+)<\/h4>/g)].map(m => m[1].trim().toLowerCase());
  if (!h.length) { const m = String(it.setTitle || '').match(/refer to the following (.+?)\.?$/i); return m ? m[1] : (it.part === 6 ? 'text' : 'document'); }
  const uniq = [...new Set(h)]; return uniq.length === 1 && h.length > 1 ? uniq[0] + 's' : h.join(h.length > 2 ? ', ' : ' and ').replace(/, ([^,]+)$/, ', and $1'); };
const history = id => (S().tests[id] || []);
X.examTitle = id => { const e = exById(id); return e ? `Part ${e.part} - ${e.n}` : null; };

/* ---------------- danh sách đề ---------------- */
X.route(/^\/tests$/, view => {
  const parts = [1, 2, 3, 4, 5, 6, 7];
  const done = X.EXAMS.filter(e => history(e.id).length).length;
  view.innerHTML = `<div class="page">${X.stepHead('do')}<div class="kicker">Đề thi từng Part</div><h1 class="h1">Làm như thi thật, rồi chữa đến nơi đến chốn</h1>
    <p class="lead">Mỗi đề đúng số câu, đúng thứ tự và đúng nhịp của đề thật. Phần nghe chạy một lượt, không nghe lại. Phần đọc đếm ngược theo thời gian nên dành cho Part đó. Làm xong là có điểm, phân tích dạng sai và hướng dẫn chữa từng câu.</p>
    <div class="card tint sec ex-how"><div class="h3">Nên làm đề khi nào?</div>
      <div class="grid g3" style="margin-top:10px">
        <div><b>1. Trước khi học một Part</b><div class="small muted">Làm Đề 1 để biết điểm xuất phát và dạng câu hay sai. Sai nhiều cũng không sao, đây là dữ liệu để học đúng chỗ.</div></div>
        <div><b>2. Chữa ngay sau khi làm</b><div class="small muted">Dùng phần "Chữa từng câu": nghe lại hoặc đọc lại, tìm bằng chứng, gọi tên nguyên nhân. Câu sai tự vào Sổ lỗi.</div></div>
        <div><b>3. Làm Đề 2 sau 2-3 tuần học</b><div class="small muted">So điểm với Đề 1 để biết Lộ trình và Lab có đang hiệu quả không.</div></div></div>
      <div class="small faint" style="margin-top:10px">${done ? `Bạn đã làm ${done}/${X.EXAMS.length} đề.` : 'Chưa làm đề nào. Gợi ý: bắt đầu bằng Part 2 Đề 1 (khoảng 10 phút).'} Kết quả đề được dùng cho Bản đồ kỹ năng, Sổ lỗi và gợi ý ở trang Hôm nay.</div></div>
    ${parts.map(p => { const es = X.EXAMS.filter(e => e.part === p); if (!es.length) return ''; const pp = X.partOf(p);
      return `<div class="sec"><div class="sec-h"><div><div class="kicker">${LISTEN(p) ? 'Nghe' : 'Đọc'}</div><h2 class="h2">Part ${p} - ${esc({ 3: 'Hội thoại', 4: 'Bài nói' }[p] || pp.vi || '')}</h2></div><span class="small muted ex-real">${esc(G(p).real)}</span></div>
        <div class="grid g2">${es.map(e => { const its = X.examItems(e), h = history(e.id), last = h[h.length - 1], best = h.length ? Math.max(...h.map(x => x.score)) : null, ses = X.sessGet('/exam/' + e.id);
          return `<a class="card link ex-card" href="#/exam/${e.id}"><div class="row"><b class="ex-n">${esc(e.n)}</b><span class="pill">${its.length} câu - ${e.start}-${e.start + its.length - 1}</span><span class="pill">${LISTEN(p) ? 'audio ~' + estMin(e, its) + ' phút' : e.time + ' phút'}</span></div>
            <div class="row small" style="margin-top:8px">${last ? `<span class="pill ${last.score >= 80 ? 'sage' : last.score >= 60 ? 'gold' : 'red'}">Lần gần nhất ${last.score}%</span><span class="faint">${h.length} lần - tốt nhất ${best}% - ${fmtDate(last.at)}</span>` : ses ? '<span class="pill gold">Đang làm dở</span>' : '<span class="faint">Chưa làm</span>'}<span class="grow"></span><span class="btn sm ${last ? '' : 'pri'}">${last ? 'Làm lại' : ses ? 'Làm tiếp' : 'Làm đề'}</span></div></a>`; }).join('')}</div></div>`; }).join('')}
    <div class="card sec"><div class="h3">Làm đề giấy hoặc đề ở ngoài?</div><p class="small muted" style="margin:6px 0 10px">Chữa theo đúng các bước trong phần "Cách tự chữa" của mỗi Part (mở một đề bất kỳ để xem). Câu sai thì ghi vào Sổ lỗi bằng tay: số câu, dạng, mình chọn gì, vì sao sai, quy tắc rút ra. Hệ thống sẽ nhắc làm lại đúng lúc.</p><a class="btn sm" href="#/errors/add">${icon('err')} Ghi lỗi từ đề ngoài</a></div>
  </div>`;
});
const estMin = (e, its) => Math.max(1, Math.round(its.length * (e.part === 1 ? 32 : e.part === 2 ? 22 : 38) / 60));

/* ---------------- giới thiệu một đề ---------------- */
X.route(/^\/exam\/([\w-]+)$/, (view, id) => {
  const e = exById(id); if (!e) return X.go('#/tests');
  const items = X.examItems(e), g = G(e.part), sv = X.sessGet('/exam/' + id), h = history(id);
  view.innerHTML = `<div class="page"><a href="#/tests" class="small">${icon('back')} Đề thi từng Part</a>
    <div class="kicker" style="margin-top:14px">Part ${e.part} - ${LISTEN(e.part) ? 'Nghe' : 'Đọc'}</div><h1 class="h1">${esc(X.examTitle(id))}</h1>
    <div class="grid g2 sec">
      <div class="card"><div class="row"><span class="pill">${items.length} câu (${e.start}-${e.start + items.length - 1})</span><span class="pill">${LISTEN(e.part) ? 'Audio khoảng ' + estMin(e, items) + ' phút' : 'Đếm ngược ' + e.time + ' phút'}</span>${h.length ? `<span class="pill">Đã làm ${h.length} lần</span>` : ''}</div>
        <div class="h3" style="margin:14px 0 6px">Đề thật thế nào</div><p class="small muted">${esc(g.real)}</p>
        <div class="h3" style="margin:14px 0 6px">Luật trong đề này</div><ul class="small ex-ul">${(LISTEN(e.part) ? ['Audio phát một lượt. Không tua lại, không nghe lại.', 'Hết giờ chờ thì tự sang câu sau. Kịp chọn thì cứ chọn, không kịp thì đoán rồi đi tiếp như thi thật.', 'Chữ chỉ hiện ở phần chữa. Đeo tai nghe, ngồi chỗ yên tĩnh.', 'Có nút Tạm dừng khi bị gián đoạn. Bấm Tiếp tục thì câu đang làm phát lại từ đầu.'] : ['Đồng hồ đếm ngược cho cả Part. Hết giờ thì tự nộp.', 'Đi lại tự do giữa các câu bằng phiếu trả lời bên dưới.', 'Đáp án chỉ hiện sau khi nộp.']).map(x => `<li>${esc(x)}</li>`).join('')}
          <li>Mỗi câu có thể đánh dấu <b>Phân vân</b> hoặc <b>Lụi</b>. Câu lụi trúng vẫn được tính là cần ôn lại.</li></ul></div>
      <div class="card"><div class="h3" style="margin-bottom:6px">Mẹo làm Part ${e.part}</div><ul class="small ex-ul">${g.rules.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${LISTEN(e.part) && TTS.missing() ? `<div class="card tint small" style="margin-top:12px;padding:12px">${icon('vol')} Trình duyệt này chưa có giọng đọc tiếng Anh nên không phát được audio. Mở bằng Microsoft Edge, Chrome hoặc Safari để làm như thi thật. Nếu vẫn làm ở đây, chữ sẽ hiện thay cho audio.</div>` : ''}</div></div>
    <div class="row sec">${sv ? `<button class="btn pri lg" id="ex-cont">Làm tiếp từ câu ${e.start + (sv.k || 0)} ${icon('arrow')}</button><button class="btn lg" id="ex-go">Làm lại từ đầu</button>` : `<button class="btn pri lg" id="ex-go">Bắt đầu làm bài ${icon('arrow')}</button>`}</div></div>`;
  $('#ex-go', view).onclick = () => { X.sessDel('/exam/' + id); runExam(view, e, items); };
  const c = $('#ex-cont', view); if (c) c.onclick = () => runExam(view, e, items, sv);
});

/* ---------------- làm bài ---------------- */
function runExam(view, e, items, sv) {
  const listen = LISTEN(e.part), pages = pagesOf(items), N = k => e.start + k;
  const st = { ans: items.map(() => null), conf: items.map(() => 'sure'), ms: items.map(() => 0), pi: 0, left: (e.time || 0) * 60, t0: Date.now(), tok: 0, paused: false, done: false, shown: Date.now() };
  if (sv) Object.assign(st, { ans: sv.ans, conf: sv.conf, ms: sv.ms || st.ms, pi: sv.pi || 0, left: sv.left ?? st.left, t0: Date.now() - (sv.elapsed || 0) });
  const textMode = listen && TTS.missing();
  const sKey = '/exam/' + e.id;
  const persist = () => { if (!st.done) X.sessSet(sKey, { kind: 'exam', title: X.examTitle(e.id), n: items.length, i: pages[st.pi].idx[0], k: pages[st.pi].idx[0], num: e.start + pages[st.pi].idx[0], last: e.start + items.length - 1, pi: st.pi, ans: st.ans, conf: st.conf, ms: st.ms, left: st.left, elapsed: Date.now() - st.t0 }); };
  let timer = null;
  const stamp = () => { const now = Date.now(), p = pages[st.pi]; if (p) p.idx.forEach(k => { st.ms[k] += (now - st.shown) / p.idx.length; }); st.shown = now; };
  const stopAll = () => { st.tok++; clearInterval(timer); TTS.stop(); };
  X.onLeave(() => { stamp(); persist(); stopAll(); });

  view.innerHTML = `<div class="page wide"><div class="qz ex-run">
    <div class="qz-top"><button class="icon-btn" id="ex-x" title="Thoát">${icon('x')}</button>
      <div style="min-width:0"><div class="kicker">Đề thi - Part ${e.part}</div><div class="h3">${esc(X.examTitle(e.id))}</div></div>
      <div class="bar"><i style="width:0"></i></div><span class="count mono" id="ex-c"></span><span class="qz-timer" id="ex-t"></span></div>
    ${textMode ? '<div class="card tint small" style="margin-bottom:12px">Không có giọng đọc trên trình duyệt này, nên chữ hiện thay cho audio. Kết quả vẫn được tính.</div>' : ''}
    <div id="ex-main"></div><div class="sheet ex-sheet" id="ex-sheet"></div></div></div>`;
  const main = $('#ex-main', view);
  $('#ex-x', view).onclick = () => { if (!confirm('Thoát đề? Bài làm được lưu lại, lần sau làm tiếp được.')) return; stamp(); persist(); stopAll(); location.hash = '#/tests'; };

  if (!listen) {
    timer = setInterval(() => { st.left--; const el = $('#ex-t', view); if (el) { el.textContent = fmtMs(Math.max(0, st.left) * 1000); el.classList.toggle('warn', st.left < 120); } if (st.left <= 0) { clearInterval(timer); X.toast('Hết giờ, bài đã được nộp'); finish(); } if (st.left % 15 === 0) persist(); }, 1000);
  } else timer = setInterval(() => { const el = $('#ex-t', view); if (el) el.textContent = fmtMs(Date.now() - st.t0); }, 1000);

  const optBtns = (k, it, bubbles) => `<div class="${bubbles ? 'ex-bub' : 'opts'}" data-q="${k}">${it.options.map((op, j) => `<button class="${bubbles ? 'bub' : 'opt'} ${st.ans[k] === j ? 'sel' : ''}" data-k="${k}" data-o="${j}"><span class="L">${LETTERS[j]}</span>${bubbles ? '' : `<span>${esc(op)}</span>`}</button>`).join('')}</div>`;
  const confRow = k => `<div class="ex-conf" data-cq="${k}">${[['sure', 'Chắc'], ['unsure', 'Phân vân'], ['guess', 'Lụi']].map(([c, n]) => `<button data-ck="${k}" data-c="${c}" class="${st.conf[k] === c ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  const qBlock = (k, opt = {}) => { const it = items[k];
    return `<div class="ex-q" id="exq-${k}"><div class="ex-qn"><b>${N(k)}.</b> ${opt.noPrompt ? '<span class="muted">Mark your answer on your answer sheet.</span>' : esc(it.prompt)}</div>${optBtns(k, it, opt.bubbles)}${confRow(k)}</div>`; };

  function render() {
    const p = pages[st.pi], its = p.idx.map(k => items[k]), it = its[0], k0 = p.idx[0], k1 = p.idx[p.idx.length - 1];
    let body = '';
    if (e.part === 1) body = `<div class="ex-pic"><img src="${esc(it.img || '')}" alt=""></div>${qBlock(k0, { noPrompt: true, bubbles: true })}`;
    else if (e.part === 2) body = `<div class="ex-p2">${X.xi('think', 70, 'static')}</div>${qBlock(k0, { noPrompt: true, bubbles: true })}`;
    else if (listen) { const g = its.find(x => x.passage);
      body = `<div class="ex-dir">Questions ${N(k0)}-${N(k1)} refer to the following ${e.part === 3 ? 'conversation' : 'talk'}${g ? ' and graphic' : ''}.</div>${g ? `<div class="ex-graphic passage">${g.passage}</div>` : ''}${p.idx.map(k => qBlock(k)).join('')}`; }
    else if (e.part === 5) body = qBlock(k0);
    else body = `<div class="qz-body split"><div class="passage" id="ex-pass"><div class="kicker" style="margin-bottom:10px">Questions ${N(k0)}-${N(k1)} refer to the following ${esc(docName(it))}.</div>${it.passage || ''}</div><div>${p.idx.map(k => qBlock(k)).join('')}</div></div>`;
    const tx = textMode && it.audio ? `<div class="transcript">${it.audio.map(l => `<p>${['M', 'W', 'M2'].includes(l.s) ? `<b>${l.s}:</b> ` : ''}${esc(l.t)}</p>`).join('')}</div>` : '';
    const ctl = listen && !textMode
      ? `<div class="ex-ctl"><span class="ex-status" id="ex-st">${icon('vol')} Đang chuẩn bị…</span><span class="grow"></span><button class="btn sm" id="ex-pause">${st.paused ? 'Tiếp tục' : 'Tạm dừng'}</button><button class="btn sm ghost" id="ex-skip">Sang câu tiếp ${icon('arrow')}</button></div>`
      : `<div class="qz-actions"><button class="btn" id="ex-prev" ${st.pi === 0 ? 'disabled' : ''}>${icon('back')} Trước</button><button class="btn pri" id="ex-next">${st.pi < pages.length - 1 ? 'Câu tiếp' : 'Nộp bài'} ${icon('arrow')}</button>${st.pi < pages.length - 1 ? '<button class="btn ghost" id="ex-sub" style="margin-left:auto">Nộp bài</button>' : ''}</div>`;
    main.innerHTML = `<div class="q-card ex-card-q">${body}${tx}${ctl}</div>`;
    if (e.part === 6) { const b = $(`.blank[data-n="${it.num}"]`, main); if (b) b.classList.add('cur'); }
    sheet(); bind();
    $('.bar>i', view).style.width = pct(st.ans.filter(a => a !== null).length, items.length) + '%';
    $('#ex-c', view).textContent = `${N(k0)}${k1 > k0 ? '-' + N(k1) : ''} / ${N(items.length - 1)}`;
    st.shown = Date.now(); persist();
    if (listen && !textMode && !st.paused) play();
  }
  function sheet() {
    const cur = pages[st.pi].idx;
    $('#ex-sheet', view).innerHTML = items.map((it, k) => `<button class="${st.ans[k] !== null ? 'ans' : ''} ${cur.includes(k) ? 'cur' : ''}" data-j="${k}" ${listen ? 'disabled' : ''}>${N(k)}</button>`).join('');
    if (!listen) $$('#ex-sheet button', view).forEach(b => b.onclick = () => { stamp(); st.pi = pages.findIndex(p => p.idx.includes(+b.dataset.j)); render(); });
  }
  function bind() {
    $$('[data-o]', main).forEach(b => b.onclick = () => { const k = +b.dataset.k, j = +b.dataset.o; st.ans[k] = j; $$(`[data-k="${k}"]`, main).forEach(x => x.classList.toggle('sel', +x.dataset.o === j)); X.sfx && X.sfx.tap(); persist();
      $('.bar>i', view).style.width = pct(st.ans.filter(a => a !== null).length, items.length) + '%'; const sb = $(`#ex-sheet [data-j="${k}"]`, view); if (sb) sb.classList.add('ans'); });
    $$('[data-ck]', main).forEach(b => b.onclick = () => { const k = +b.dataset.ck; st.conf[k] = b.dataset.c; $$(`[data-ck="${k}"]`, main).forEach(x => x.classList.toggle('on', x === b)); });
    const on = (s, f) => { const b = $(s, main); if (b) b.onclick = f; };
    on('#ex-prev', () => { stamp(); st.pi--; render(); });
    on('#ex-next', () => { stamp(); if (st.pi < pages.length - 1) { st.pi++; render(); } else submit(); });
    on('#ex-sub', submit);
    on('#ex-skip', () => { st.tok++; TTS.stop(); advance(); });
    on('#ex-pause', () => { if (st.paused) { st.paused = false; render(); } else { st.paused = true; st.tok++; TTS.stop(); $('#ex-pause', main).textContent = 'Tiếp tục'; status('Đang tạm dừng. Bấm Tiếp tục để phát lại câu này từ đầu.'); } });
    document.onkeydown = ev => { if (ev.target.matches('input,textarea')) return; const k = ev.key.toLowerCase(); const p = pages[st.pi];
      if (/^[1-4]$/.test(k) && p.idx.length === 1) { const b = $(`[data-k="${p.idx[0]}"][data-o="${+k - 1}"]`, main); if (b) b.click(); }
      else if (!listen && k === 'arrowright' && st.pi < pages.length - 1) { stamp(); st.pi++; render(); }
      else if (!listen && k === 'arrowleft' && st.pi > 0) { stamp(); st.pi--; render(); } };
  }
  function submit() { const n = st.ans.filter(a => a === null).length; if (n && !confirm(`Còn ${n} câu chưa chọn. Nộp bài?`)) return; finish(); }
  const status = t => { const el = $('#ex-st', main); if (el) el.innerHTML = t; };
  const wait = (sec, tk, label) => new Promise(res => { let s = sec; status(`${label} <b class="mono">${s}s</b>`); const iv = setInterval(() => { if (tk !== st.tok) { clearInterval(iv); return res(false); } s--; if (s <= 0) { clearInterval(iv); res(true); } else status(`${label} <b class="mono">${s}s</b>`); }, 1000); });
  const say = (t, tk) => tk === st.tok ? TTS.speak(t, { sex: 'M', role: 'N' }) : Promise.resolve();
  async function play() {
    const tk = ++st.tok, p = pages[st.pi], it = items[p.idx[0]];
    await new Promise(r => setTimeout(r, 450)); if (tk !== st.tok) return;
    if (e.part <= 2) {
      status(`${icon('vol')} Đang phát câu ${N(p.idx[0])}…`);
      await say(`Number ${N(p.idx[0])}.`, tk); if (tk !== st.tok) return;
      await TTS.play(it.audio || []); if (tk !== st.tok) return;
      if (!await wait(5, tk, 'Chọn đáp án')) return;
    } else {
      status(`${icon('vol')} Đang phát ${e.part === 3 ? 'hội thoại' : 'bài nói'}…`);
      await say(`Questions ${N(p.idx[0])} through ${N(p.idx[p.idx.length - 1])} refer to the following ${e.part === 3 ? 'conversation' : 'talk'}.`, tk); if (tk !== st.tok) return;
      await TTS.play(it.audio || []); if (tk !== st.tok) return;
      for (const k of p.idx) {
        $$('.ex-q', main).forEach(q => q.classList.toggle('now', q.id === 'exq-' + k));
        status(`${icon('vol')} Câu ${N(k)}…`); await say(`Number ${N(k)}. ${items[k].prompt}`, tk); if (tk !== st.tok) return;
        if (!await wait(items[k].passage ? 12 : 8, tk, `Câu ${N(k)}: chọn đáp án`)) return;
      }
    }
    advance();
  }
  function advance() { stamp(); if (st.pi < pages.length - 1) { st.pi++; render(); } else finish(); }
  function finish() {
    if (st.done) return; st.done = true; stamp(); stopAll(); X.sessDel(sKey);
    const ctx = 'exam:' + e.id;
    items.forEach((it, k) => { const ok = st.ans[k] === it.answer; X.logAttempt(it, ok, st.ms[k], st.conf[k], ctx);
      if (st.ans[k] !== null && !ok) X.addError(it, st.ans[k], st.conf[k], ctx); if (ok && st.conf[k] === 'guess') X.addError(it, st.ans[k], 'guess', ctx); });
    const rows = items.map((it, k) => ({ item: { ...it, num: N(k) }, chosen: st.ans[k], ok: st.ans[k] === it.answer, ms: st.ms[k], conf: st.conf[k] }));
    const res = { total: items.length, correct: rows.filter(r => r.ok).length, ms: Date.now() - st.t0, rows, at: Date.now() };
    (S().tests[e.id] ||= []).push({ at: res.at, score: pct(res.correct, res.total), n: res.total, ms: res.ms, mode: 'exam', ans: st.ans, conf: st.conf });
    X.addXP(res.correct + 15, 'Hoàn thành đề'); X.save();
    showRes(view, e, items, res);
  }
  render();
}

/* ---------------- kết quả + hướng dẫn chữa ---------------- */
function showRes(view, e, items, res) {
  X.showResult(view, res, { title: X.examTitle(e.id), kicker: 'Đề thi - Part ' + e.part, back: '#/tests', canReview: true,
    onReview: () => review(view, e, items, res), retry: () => { X.sessDel('/exam/' + e.id); runExam(view, e, items); } });
  const g = G(e.part), h = history(e.id), prev = h.length > 1 ? h[h.length - 2] : null, sc = pct(res.correct, res.total);
  // dạng yếu nhất → việc nên làm tiếp
  const by = {}; res.rows.forEach(r => { (X.skillsOf ? X.skillsOf(r.item) : []).forEach(k => { const s = X.skillById && X.skillById[k]; if (!s || !s.sel) return; (by[k] ||= { n: 0, ok: 0 }); by[k].n++; by[k].ok += r.ok; }); });
  const weak = Object.entries(by).filter(([, v]) => v.n >= 2 && v.ok / v.n < 0.75).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 3);
  const pk = X.partOf(e.part).k, wrong = res.rows.filter(r => !r.ok).length;
  const other = X.EXAMS.find(x => x.part === e.part && x.id !== e.id);
  const html = `<div class="card sec ex-fix"><div class="row" style="align-items:flex-start;gap:16px">${X.xi(sc >= 80 ? 'happy' : 'think', 64)}<div class="grow">
      <div class="kicker">Bước tiếp theo: chữa đề</div><h2 class="h2">${wrong ? `Chữa ${wrong} câu sai theo 5 bước` : 'Không sai câu nào. Vẫn nên xem lại các câu Phân vân và Lụi.'}</h2>
      ${prev ? `<div class="small" style="margin:4px 0 8px">So với lần trước (${prev.score}%): <b class="${sc >= prev.score ? 'up' : 'down'}">${sc >= prev.score ? '+' : ''}${sc - prev.score} điểm %</b></div>` : ''}
      <ol class="ex-steps">${g.fix.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
      <div class="row" style="margin-top:12px"><button class="btn pri" id="ex-rv">${icon('eye')} Chữa từng câu</button><a class="btn" href="#/errors">${icon('err')} Mở Sổ lỗi</a></div>
      <div class="small faint" style="margin-top:8px">Phần chữa dùng được cho cả đề ngoài: làm đề giấy xong, chữa theo đúng 5 bước này.</div></div></div></div>
    <div class="card sec"><div class="h3" style="margin-bottom:8px">Việc nên làm sau đề này</div><div class="grid g3 ex-next">
      ${weak.length ? weak.map(([k, v]) => `<a class="card link flat" href="#/skill/${k}"><div class="kicker">Dạng yếu - ${v.ok}/${v.n}</div><b>${esc(X.skillById[k].n)}</b><span class="small muted">Luyện 10 câu đúng dạng này</span></a>`).join('') : ''}
      <a class="card link flat" href="#/path/${pk}"><div class="kicker">Bước 2 - Học</div><b>Lộ trình ${esc(X.partOf(e.part).n)}</b><span class="small muted">Học các unit còn thiếu của Part này</span></a>
      <a class="card link flat" href="#/lab"><div class="kicker">Bước 3 - Luyện</div><b>Lab phản xạ</b><span class="small muted">Luyện tốc độ cho dạng còn chậm</span></a>
      ${other ? `<a class="card link flat" href="#/exam/${other.id}"><div class="kicker">Bước 1 - Đo lại</div><b>${esc(X.examTitle(other.id))}</b><span class="small muted">Làm sau 2-3 tuần để xem tiến bộ</span></a>` : ''}</div></div>`;
  const first = $('.page .card.sec', view); if (first) first.insertAdjacentHTML('afterend', html);
  const b = $('#ex-rv', view); if (b) b.onclick = () => review(view, e, items, res);
}

/* ---------------- chữa từng câu ---------------- */
function review(view, e, items, res) {
  const pages = pagesOf(items), N = k => e.start + k, listen = LISTEN(e.part);
  let pi = Math.max(0, pages.findIndex(p => p.idx.some(k => !res.rows[k].ok)));
  const errOf = it => S().errors.find(x => x.item === it.id && x.status !== 'fixed');
  view.innerHTML = `<div class="page wide"><div class="qz ex-run"><div class="qz-top"><button class="icon-btn" id="rv-x" title="Về kết quả">${icon('back')}</button>
    <div style="min-width:0"><div class="kicker">Chữa đề - Part ${e.part}</div><div class="h3">${esc(X.examTitle(e.id))}</div></div><span class="grow"></span>
    <label class="small row" style="gap:6px"><input type="checkbox" id="rv-only"> Chỉ câu sai, phân vân, lụi</label></div>
    <div id="rv-main"></div><div class="sheet ex-sheet" id="rv-sheet"></div></div></div>`;
  const main = $('#rv-main', view);
  const back = () => { TTS.stop(); showRes(view, e, items, res); };
  $('#rv-x', view).onclick = back;
  const need = k => !res.rows[k].ok || res.rows[k].conf !== 'sure';
  const quote = it => [...String(it.explain || '').matchAll(/[“"]([^”"]{8,})[”"]/g)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/…/g, '').trim().toLowerCase().slice(0, 40));
  function qRev(k) {
    const it = items[k], r = res.rows[k], er = errOf(it);
    const opts = it.options.map((op, j) => `<div class="opt ${j === it.answer ? 'ok' : j === r.chosen ? 'bad' : ''}"><span class="L">${LETTERS[j]}</span><span>${esc(op)}${it.optWhy && it.optWhy[j] ? `<span class="why">${esc(it.optWhy[j])}</span>` : ''}</span></div>`).join('');
    const prompt = e.part === 1 ? 'Câu nào tả đúng tranh?' : it.prompt;
    return `<div class="ex-q rv ${r.ok ? 'is-ok' : 'is-bad'}"><div class="ex-qn"><b>${N(k)}.</b> ${e.part === 2 ? X.hiQ(it.prompt) : esc(prompt)}
        <span class="pill ${r.ok ? 'sage' : 'red'}">${r.chosen === null ? 'Bỏ trống' : r.ok ? 'Đúng' : 'Sai'}</span>${r.conf !== 'sure' ? `<span class="pill gold">${X.confName(r.conf)}</span>` : ''}${it.skill ? `<span class="pill syn">${esc(it.skill)}</span>` : ''}<span class="small faint">${fmtMs(r.ms)}</span></div>
      ${e.part === 2 ? X.hiLegend : ''}${it.vi ? `<div class="q-vi">${esc(it.vi)}</div>` : ''}
      <div class="opts">${opts}</div>
      ${it.explain ? `<div class="ex-exp"><b>Vì sao:</b> ${it.explain.includes('<') ? it.explain : esc(it.explain)}</div>` : ''}
      ${er ? `<div class="ex-cause"><span class="small"><b>Bạn sai vì:</b></span>${X.CAUSES.map(([c, n]) => `<button data-er="${er.id}" data-cause="${c}" class="${er.cause === c ? 'on' : ''}">${n}</button>`).join('')}<a class="small" href="#/errors">Viết quy tắc trong Sổ lỗi ${icon('arrow')}</a></div>` : ''}</div>`;
  }
  function render() {
    TTS.stop();
    const p = pages[pi], its = p.idx.map(k => items[k]), it = its[0], k0 = p.idx[0], k1 = p.idx[p.idx.length - 1];
    const qs = its.flatMap(quote);
    const tx = it.audio && it.audio.length ? `<div class="ex-tx"><div class="row"><b class="grow">Transcript</b><button class="btn sm" id="rv-play">${icon('play')} Nghe lại cả bài</button></div>
      ${it.audio.map((l, i) => { const hit = qs.some(q => l.t.toLowerCase().replace(/[’']/g, "'").includes(q.replace(/[’']/g, "'").slice(0, 30))); return `<p class="${hit ? 'ev' : ''}"><button class="say" data-line="${i}" title="Nghe câu này">${icon('vol')}</button>${['M', 'W', 'M2'].includes(l.s) ? `<b>${l.s}:</b> ` : ''}${esc(l.t)}</p>`; }).join('')}
      ${it.transcriptVi ? `<p class="small muted">${esc(it.transcriptVi)}</p>` : ''}<div class="small faint">Dòng tô vàng là chỗ chứa đáp án. Bước 1 của cách chữa: nghe lại khi chưa nhìn chữ, rồi mới đọc transcript.</div></div>` : '';
    let left = '';
    if (e.part === 1) left = `<div class="ex-pic"><img src="${esc(it.img || '')}" alt=""></div>`;
    else if (it.passage && !listen) left = `<div class="passage" id="rv-pass">${it.passage}</div>`;
    else if (it.passage) left = `<div class="ex-graphic passage">${it.passage}</div>`;
    const split = !listen && it.passage;
    main.innerHTML = `<div class="q-card">${listen && e.part >= 3 ? `<div class="ex-dir">Questions ${N(k0)}-${N(k1)}</div>` : ''}
      ${split ? `<div class="qz-body split">${left}<div>${p.idx.map(qRev).join('')}</div></div>` : `${left}${tx}${p.idx.map(qRev).join('')}`}
      ${split ? '' : ''}<div class="qz-actions"><button class="btn" id="rv-prev" ${pi === 0 ? 'disabled' : ''}>${icon('back')} Trước</button><button class="btn pri" id="rv-next">${pi < pages.length - 1 ? 'Câu tiếp' : 'Xong, về kết quả'} ${icon('arrow')}</button></div></div>`;
    if (split) its.forEach(x => (x.evidence || []).forEach(id => { const el = $(`[data-ev="${id}"]`, main); if (el) el.classList.add('ev'); }));
    if (e.part === 6) { const b = $(`.blank[data-n="${it.num}"]`, main); if (b) b.classList.add('cur'); }
    $('#rv-sheet', view).innerHTML = items.map((x, k) => `<button class="${res.rows[k].ok ? 'ok' : 'bad'} ${p.idx.includes(k) ? 'cur' : ''}" data-j="${k}">${N(k)}</button>`).join('');
    $$('#rv-sheet button', view).forEach(b => b.onclick = () => { pi = pages.findIndex(pp => pp.idx.includes(+b.dataset.j)); render(); });
    $('#rv-prev', main).onclick = () => { pi = step(-1); render(); };
    $('#rv-next', main).onclick = () => { if (pi >= pages.length - 1 || step(1) === pi) return back(); pi = step(1); render(); };
    const pl = $('#rv-play', main); if (pl) pl.onclick = () => TTS.play(it.audio);
    $$('[data-line]', main).forEach(b => b.onclick = () => TTS.play([it.audio[+b.dataset.line]]));
    $$('[data-er]', main).forEach(b => b.onclick = () => { const er = S().errors.find(x => x.id === b.dataset.er); if (!er) return; er.cause = b.dataset.cause; X.save(); $$(`[data-er="${er.id}"]`, main).forEach(x => x.classList.toggle('on', x === b)); X.toast('Đã ghi nguyên nhân vào Sổ lỗi'); });
    window.scrollTo(0, 0);
  }
  const only = () => $('#rv-only', view).checked;
  const step = d => { let j = pi + d; while (j >= 0 && j < pages.length && only() && !pages[j].idx.some(need)) j += d; return j < 0 || j >= pages.length ? pi : j; };
  $('#rv-only', view).onchange = () => { if (only() && !pages[pi].idx.some(need)) { const j = step(1); if (j !== pi) pi = j; } render(); };
  render();
}

/* số liệu đề cho trang Hôm nay: Part trọng tâm nào chưa có đề, hoặc đề gần nhất đã quá 21 ngày */
X.examSuggest = () => {
  const s = S(), focus = (s.profile.focus || []).map(k => X.PARTS.find(p => p.k === k)).filter(Boolean).flatMap(p => p.parts);
  const parts = [...new Set(focus.length ? focus : [2, 5])];
  for (const p of parts) { const es = X.EXAMS.filter(e => e.part === p); if (!es.length) continue;
    const runs = es.flatMap(e => history(e.id).map(h => ({ e, ...h }))).sort((a, b) => b.at - a.at);
    if (!runs.length) return { e: es[0], why: `Chưa có điểm Part ${p}. Làm để biết điểm xuất phát`, first: true };
    if (Date.now() - runs[0].at > 21 * 864e5) { const nx = es.find(x => !history(x.id).length) || es[0]; return { e: nx, why: `Lần đo gần nhất ${runs[0].score}%, đã hơn 3 tuần. Đo lại xem tiến bộ chưa` }; }
  }
  return null;
};
})();
