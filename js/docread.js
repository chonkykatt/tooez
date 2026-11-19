/* TOOEZ - "Đọc trước, học sau": học từ mới từ một bài đọc Part 7 thật thay vì nhìn danh sách từ.
   1 Đọc bài, bấm chọn từ / cụm chưa biết (nghĩa đúng theo ngữ cảnh bài này + nghĩa hay gặp khác)
   2 Vòng học: mỗi từ phải đúng liên tiếp đủ số lần (lần cuối tự gõ lại vào đúng câu trong bài), sai thì đếm lại
   3 Quay lại bài: tự dịch từng đoạn rồi so bản mẫu; trả lời câu hỏi Part 7, chấm xong tô màu và nối các cặp paraphrase câu hỏi ↔ bài
   4 Lưu từ vào lịch ôn ngắt quãng (spaced repetition), đến hạn web tự nhắc ở Hôm nay và Kho từ vựng
   Dữ liệu bài: data/docread.js (window.DOCREAD), câu hỏi lấy từ kho đề theo mã bộ. */
'use strict';
(() => {
const { $, $$, esc, icon, shuffle, TTS } = X;
const S = () => X.S();
const DOCS = () => window.DOCREAD || [];
const allQ = () => [...(window.BANK || []), ...(window.EXAM_EXTRA || [])];
const qsOf = d => d.qs ? d.qs.map(q => Object.assign({ set: d.id, part: 7, kind: 'p7' }, q)) : allQ().filter(q => q.set === d.set);

/* ---------- từ tự học ở bài đọc mà Kho từ vựng chưa có: đưa vào kho để lịch ôn dùng được ---------- */
const drWords = () => { const st = S(); return st.drWords || (st.drWords = {}); };
const inject = w => { if (!X.wordById[w.id]) { X.VOCAB.push(w); X.wordById[w.id] = w; } };
Object.values(drWords()).forEach(inject);

/* ---------- tra nghĩa từ đơn trong Kho từ vựng (cho từ bài chưa ghi nghĩa riêng) ---------- */
let LEX = null;
const STOP = new Set('a an the of to in on at for by with and or but is are was were be been am do does did will would can could should may might must have has had i you he she we they it its my your his her our their this that these those there here as from into about than then so if not no yes very all any some each every me him them us also just only up out over under after before because while when where which who whom what how one two three four five six seven eight nine ten mr ms mrs dear'.split(' '));
const lex = () => { if (LEX) return LEX; LEX = new Map(); X.VOCAB.forEach(w => { if (!w.vi) return; w.w.toLowerCase().split(/\s*\/\s*/).forEach(h => { if (!/\s/.test(h) && !LEX.has(h)) LEX.set(h, w); }); }); return LEX; };
const lookup = raw => { const w = raw.toLowerCase().replace(/[’']s$/, '').replace(/[’']/g, "'"); if (w.length < 3 || STOP.has(w)) return null; const L = lex();
  const tries = [w, w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, ''), w.replace(/ied$/, 'y'), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'), w.replace(/d$/, ''), w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/(.)\1ing$/, '$1'), w.replace(/(.)\1ed$/, '$1'), w.replace(/ly$/, '')];
  for (const t of tries) if (t.length >= 3 && L.has(t)) return L.get(t); return null; };

/* ---------- cắt bài thành từng đoạn chữ: cụm có nghĩa riêng (gl) ưu tiên, còn lại là từ đơn tra trong kho ---------- */
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const segs = (text, gl) => {
  const used = new Array(text.length).fill(false), hits = [];
  [...gl.map((g, i) => [g, i])].sort((a, b) => b[0].t.length - a[0].t.length).forEach(([g, gi]) => {
    const re = new RegExp('(^|[^A-Za-z])(' + reEsc(g.t) + ')(?![A-Za-z])', 'g'); let m;
    while ((m = re.exec(text))) { const s = m.index + m[1].length, e = s + m[2].length; if (used.slice(s, e).some(Boolean)) continue; for (let k = s; k < e; k++) used[k] = true; hits.push({ s, e, g: gi }); }
  });
  const re = /[A-Za-z][A-Za-z'’-]*/g; let m;
  while ((m = re.exec(text))) { const s = m.index, e = s + m[0].length; if (used.slice(s, e).some(Boolean)) continue; const v = lookup(m[0].replace(/-$/, '')); if (v) hits.push({ s, e, v: v.id }); }
  hits.sort((a, b) => a.s - b.s);
  const out = []; let p = 0; hits.forEach(h => { if (h.s > p) out.push({ t: text.slice(p, h.s) }); out.push(Object.assign({ t: text.slice(h.s, h.e) }, h)); p = h.e; }); if (p < text.length) out.push({ t: text.slice(p) });
  return out;
};
const sentOf = (text, s) => { const parts = text.split(/(?<=[.!?”])\s+(?=[A-Z“—])/); let p = 0; for (const x of parts) { const i = text.indexOf(x, p); if (s >= i && s < i + x.length) return x; p = i + x.length; } return text; };

/* ---------- 1 mục từ được chọn ---------- */
const itemOf = (d, pi, seg) => {
  const text = d.paras[pi].en, sent = sentOf(text, seg.s);
  if (seg.g != null) { const g = d.gl[seg.g], v = lookup(g.t); return { key: 'g:' + g.t.toLowerCase(), t: seg.t, mean: g.ctx, other: g.other, sent, vid: v && !/\s/.test(g.t) ? v.id : null }; }
  const v = X.wordById[seg.v]; return { key: 'v:' + v.id, t: seg.t, mean: v.vi, other: '', sent, vid: v.id, gen: 1 };
};

/* ---------- trạng thái từng bài ---------- */
// at = mốc lần sửa cuối: khi đồng bộ giữa các máy, bản mới hơn thay cả bài (không trộn danh sách từ / vòng học cũ vào, không làm "Làm lại" bị hoàn tác)
let curP = null;
const prog = id => { const st = S(); st.dr = st.dr || {}; return (curP = st.dr[id] || (st.dr[id] = { sel: {}, stage: 'read', at: Date.now() })); };
const drSave = () => { if (curP) curP.at = Date.now(); X.save(); };

/* ---------- danh sách bài ---------- */
X.route(/^\/doc$/, view => {
  const L = DOCS();
  view.innerHTML = `<div class="page">${X.stepHead ? X.stepHead('hoc') : ''}<a href="#/vocab" class="small">${icon('back')} Kho từ vựng</a>
    <div class="kicker syn" style="margin-top:16px">Đọc trước, học sau</div><h1 class="h1">Học từ mới ngay trong bài đọc Part 7</h1>
    <p class="lead">Không phải nhìn danh sách từ. Đọc một bài thật, bấm vào từ mình chưa biết, học cho đến khi nhớ hẳn, rồi quay lại tự dịch bài và trả lời câu hỏi như đề thi. Từ đã học tự vào lịch ôn.</p>
    <div class="dr-steps"><div><b>1</b>Đọc, bấm chọn từ chưa biết</div><div><b>2</b>Vòng học đến khi nhớ hẳn</div><div><b>3</b>Tự dịch, trả lời câu hỏi, xem paraphrase</div><div><b>4</b>Lịch ôn tự nhắc</div></div>
    <div class="rl-grid sec">${L.map(d => { const p = (S().dr || {})[d.id] || {}, n = Object.keys(p.sel || {}).length;
      return `<a class="card link dr-card ${p.done ? 'ok' : ''}" href="#/doc/${esc(d.id)}"><div class="kicker">${esc(d.kind)}</div><b>${esc(d.title)}</b><div class="small muted">${d.paras.reduce((a, x) => a + x.en.split(/\s+/).length, 0)} từ · ${qsOf(d).length} câu hỏi${d.lvl ? ` · <span class="pill gold">${esc(d.lvl)}</span>` : ''}</div>
        <div class="small">${p.done ? `<span class="pill sage">✓ Đã học ${n} từ</span>` : n ? `<span class="pill gold">Đang học: ${n} từ</span>` : ''}</div></a>`; }).join('')}</div></div>`;
});

/* ---------- 1 bài ---------- */
X.route(/^\/doc\/([\w-]+)(?:\/(\w+))?$/, (view, id, stage) => {
  const d = DOCS().find(x => x.id === id); if (!d) return X.go('#/doc');
  const P = prog(id), Q = qsOf(d).sort((a, b) => (a.pos || 0) - (b.pos || 0));
  const SG = d.paras.map(p => segs(p.en, d.gl));
  const steps = ['read', 'learn', 'back', 'done'], stName = { read: '1 · Đọc & chọn từ', learn: '2 · Học từ', back: '3 · Quay lại bài', done: '4 · Lưu & ôn' };
  const cur = steps.includes(stage) ? stage : 'read';
  const head = `<div class="qz-top"><a class="icon-btn" href="#/doc">${icon('x')}</a><div><div class="kicker">Đọc trước, học sau · ${esc(d.kind)}</div><div class="h3">${esc(d.title)}</div></div></div>
    <div class="dr-tabs">${steps.map(s => `<span class="${s === cur ? 'on' : steps.indexOf(s) < steps.indexOf(cur) ? 'past' : ''}">${stName[s]}</span>`).join('')}</div>`;
  const items = () => Object.values(P.sel);
  if (cur === 'read') return readStage(view, d, P, SG, head);
  if (!items().length) return X.go('#/doc/' + id);
  if (cur === 'learn') return learnStage(view, d, P, head);
  if (cur === 'back') return backStage(view, d, P, Q, head);
  return doneStage(view, d, P, head);
});

/* ---------- bước 1: đọc & chọn ---------- */
function readStage(view, d, P, SG, head) {
  const n = () => Object.keys(P.sel).length;
  const paint = () => {
    view.innerHTML = `<div class="page dr-page">${head}
      <p class="small muted" style="margin:8px 0 14px">Đọc hết bài một lượt. Bấm vào <span class="dr-w demo">từ</span> hoặc <span class="dr-w g demo">cụm từ</span> bạn chưa chắc nghĩa: nghĩa hiện ra đúng theo bài này. Bấm “Chọn học” cho những từ muốn học.</p>
      <div class="card dr-passage" id="dr-pass">${d.paras.map((p, pi) => `<p>${SG[pi].map((s, si) => s.g != null || s.v ? `<span class="dr-w ${s.g != null ? 'g' : ''} ${P.sel[keyOf(d, s)] ? 'sel' : ''}" data-p="${pi}" data-s="${si}">${esc(s.t)}</span>` : esc(s.t)).join('')}</p>`).join('')}</div>
      <div class="dr-bar"><span><b id="dr-n">${n()}</b> từ đã chọn</span><button class="btn pri" id="dr-go" ${n() ? '' : 'disabled'}>Học ${n()} từ này ${icon('arrow')}</button></div>
      <div id="dr-pop" class="dr-pop" hidden></div></div>`;
    $$('.dr-w[data-p]', view).forEach(el => el.onclick = e => { e.stopPropagation(); pop(el); });
    $('#dr-go', view).onclick = () => { P.stage = 'learn'; P.loop = null; drSave(); X.go(`#/doc/${d.id}/learn`); };
    $('.dr-page', view).onclick = e => { if (!e.target.closest('.dr-pop')) $('#dr-pop', view).hidden = true; };
  };
  const pop = el => {
    const pi = +el.dataset.p, s = SG[pi][+el.dataset.s], it = itemOf(d, pi, s), on = !!P.sel[it.key], box = $('#dr-pop', view);
    box.innerHTML = `<div class="row" style="justify-content:space-between;gap:8px"><b class="dr-pw">${esc(it.t)}</b><button class="icon-btn sm" data-say>${icon('vol')}</button></div>
      <div class="dr-pm">${s.g != null ? '<span class="pill syn">Nghĩa trong bài này</span> ' : '<span class="pill">Nghĩa thường gặp</span> '}${esc(it.mean)}</div>
      ${it.other ? `<div class="small dr-po">Nghĩa hay gặp khác: ${esc(it.other)}</div>` : ''}${s.g == null ? '<div class="small faint">Bài này chưa ghi nghĩa riêng cho từ này, đây là nghĩa trong Kho từ vựng.</div>' : ''}
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn ${on ? '' : 'pri'} sm" data-tog>${on ? 'Bỏ chọn' : '+ Chọn học'}</button></div>`;
    const r = el.getBoundingClientRect(), pr = $('#dr-pass', view).getBoundingClientRect();
    box.hidden = false; box.style.left = Math.max(8, Math.min(r.left - pr.left, pr.width - 300)) + 'px'; box.style.top = (r.bottom - pr.top + 8 + $('#dr-pass', view).offsetTop) + 'px';
    $('[data-say]', box).onclick = () => TTS.speak(it.t, { role: 'W' });
    $('[data-tog]', box).onclick = () => { if (P.sel[it.key]) delete P.sel[it.key]; else P.sel[it.key] = it; drSave(); box.hidden = true;
      $$('.dr-w[data-p]', view).forEach(x => x.classList.toggle('sel', !!P.sel[keyOf(d, SG[+x.dataset.p][+x.dataset.s])]));
      $('#dr-n', view).textContent = Object.keys(P.sel).length; const b = $('#dr-go', view); b.disabled = !Object.keys(P.sel).length; b.innerHTML = `Học ${Object.keys(P.sel).length} từ này ${icon('arrow')}`; };
  };
  paint();
}
const keyOf = (d, s) => s.g != null ? 'g:' + d.gl[s.g].t.toLowerCase() : 'v:' + s.v;

/* ---------- bước 2: vòng học đến khi nhớ hẳn ----------
   Mỗi từ có chuỗi đúng liên tiếp s. s = 0: thấy từ trong câu → chọn nghĩa; giữa: nhìn nghĩa → chọn từ / nghe → chọn nghĩa;
   lần cuối: tự gõ từ vào chỗ trống trong câu của bài. Sai → s về 0. Mỗi 5 câu có 1 lượt nối 4 cặp. */
const SEQ = n => n === 2 ? ['ctx', 'cloze'] : n === 4 ? ['ctx', 'mean', 'listen', 'cloze'] : ['ctx', 'mix', 'cloze'];
const RN = { ctx: 'Hiểu nghĩa trong câu', mean: 'Chọn đúng từ theo nghĩa', listen: 'Nghe rồi chọn nghĩa', mix: 'Chọn từ theo nghĩa hoặc nghe chọn nghĩa', cloze: 'Tự gõ lại từ trong câu' };
function learnStage(view, d, P, head) {
  const IT = Object.values(P.sel), byKey = k => P.sel[k];
  let T = P.loop;
  const fresh = () => { const ids = shuffle(IT.map(x => x.key)); T = P.loop = { target: P.target || 3, total: ids.length, waiting: ids, active: [], done: [], st: Object.fromEntries(ids.map(k => [k, { s: 0, w: 0 }])), n: 0, last: null, q: null, started: false };
    nextQ(); };
  // bài đang học dở mà danh sách từ đã đổi → học lại từ đầu
  if (!T || T.total !== IT.length || IT.some(x => !T.st[x.key])) fresh();
  const save = () => { P.loop = T; drSave(); };
  function refill() { while (T.active.length < 6 && T.waiting.length) T.active.push(T.waiting.shift()); }
  function others(k, field) { const me = byKey(k), seen = new Set([me[field].toLowerCase()]), out = [];
    const pool = [...shuffle(IT.filter(x => x.key !== k)), ...shuffle(d.gl.map(g => ({ t: g.t, mean: g.ctx }))), ...shuffle(X.VOCAB.filter(v => v.vi).slice(0, 400)).map(v => ({ t: v.w.split(' / ')[0], mean: v.vi }))];
    for (const x of pool) { if (out.length >= 3) break; const v = (x[field] || '').toLowerCase(); if (!v || seen.has(v)) continue; seen.add(v); out.push(x[field]); }
    return shuffle([me[field], ...out]); }
  function nextQ() {
    refill(); if (!T.active.length) { T.q = null; T.finished = true; return; }
    T.n++;
    if (T.n % 5 === 0) { const c = shuffle(T.active.filter(k => T.st[k].s < T.target - 1)); if (c.length >= 4) { const ks = c.slice(0, 4); T.q = { type: 'match', left: ks, right: shuffle(ks.slice()), done: [], errs: [] }; T.last = null; return; } }
    let pool = T.active.length > 1 ? T.active.filter(k => k !== T.last) : T.active.slice();
    pool = shuffle(pool).sort((a, b) => T.st[a].s - T.st[b].s);
    const k = pool[Math.floor(Math.random() * Math.min(3, pool.length))]; T.last = k;
    const r = SEQ(T.target)[T.st[k].s] || 'cloze', type = r === 'mix' ? (Math.random() < 0.5 ? 'mean' : 'listen') : r;
    T.q = { type, k, hint: 0, opts: type === 'ctx' || type === 'listen' ? others(k, 'mean') : type === 'mean' ? others(k, 't') : null };
  }
  // trả về kết quả để báo cho học sinh: qua vòng / thuộc / dùng gợi ý nên chưa qua / sai về vòng 1
  function grade(k, ok, recall, hinted) { const st = T.st[k], was = st.s;
    if (ok) { if (recall) { if (!hinted) st.s++; } else st.s = Math.min(st.s + 1, T.target - 1); if (st.s >= T.target) { T.active = T.active.filter(x => x !== k); T.done.push(k); } }
    else { st.s = 0; st.w++; }
    return { ok, was, now: st.s, hinted: ok && recall && hinted, done: st.s >= T.target, reset: !ok && was > 0 }; }
  const roundMsg = (k, g) => { const N = T.target, nm = SEQ(N)[g.now];
    if (!g.ok) return g.reset ? `Sai một bước nên từ này <b>quay lại vòng 1/${N}</b>, học lại từ đầu.` : `Từ này vẫn ở vòng 1/${N}.`;
    if (g.done) return `Đã đúng đủ ${N}/${N} vòng liên tiếp → <b>tính là thuộc</b>.`;
    if (g.hinted) return `Đúng, nhưng đã dùng gợi ý nên chưa được qua vòng ${g.was + 1}/${N}. Làm lại vòng này lần sau.`;
    if (g.now === g.was) return `Đúng! Vẫn cần qua vòng ${g.now + 1}/${N} (${RN[nm]}).`;
    return `Đã qua vòng ${g.was + 1}/${N}. Lần tới gặp từ này: vòng ${g.now + 1} · ${RN[nm]}.`; };
  const hl = (sent, t) => { const i = sent.toLowerCase().indexOf(t.toLowerCase()); return i < 0 ? esc(sent) : esc(sent.slice(0, i)) + `<mark>${esc(sent.slice(i, i + t.length))}</mark>` + esc(sent.slice(i + t.length)); };
  const blank = (sent, t, hint) => { const i = sent.toLowerCase().indexOf(t.toLowerCase()); const b = `<span class="rl-blank">${esc(hint ? t.slice(0, hint) : t[0])}${'_'.repeat(Math.max(2, t.length - (hint || 1)))}</span>`; return i < 0 ? b + ' — ' + esc(sent) : esc(sent.slice(0, i)) + b + esc(sent.slice(i + t.length)); };
  const dots = k => `<div class="dr-dots">${Array.from({ length: T.target }, (_, i) => `<i class="${i < T.st[k].s ? 'f' : ''}"></i>`).join('')}</div>`;
  const line = it => `<div class="dr-ans"><b>${esc(it.t)}</b> <span>${esc(it.mean)}</span> <button class="icon-btn sm" data-sayw="${esc(it.t)}">${icon('vol')}</button></div>`;

  const intro = () => { const lv = T.target;
    view.innerHTML = `<div class="page dr-page">${head}<div class="card"><div class="kicker">Trước khi học ${T.total} từ đã chọn</div><h2 class="h2" style="margin:4px 0 8px">Chọn độ khó</h2>
      <p class="small">Mỗi từ phải đi qua các vòng theo thứ tự. <b>Đúng liền một mạch hết các vòng mới tính là thuộc.</b> Sai ở bất kỳ vòng nào thì từ đó <b>quay lại vòng 1</b> và học lại từ đầu. Các từ được trộn lẫn với nhau, cứ vài câu lại có một lượt nối 4 từ với nghĩa.</p>
      <div class="dr-lv">${[2, 3, 4].map(n => `<button class="dr-lvb ${n === lv ? 'on' : ''}" data-lv="${n}"><b>${n} vòng</b><span class="small muted">${{ 2: 'Nhanh', 3: 'Vừa (nên chọn)', 4: 'Khó, nhớ lâu nhất' }[n]}</span><ol>${SEQ(n).map(r => `<li>${RN[r]}</li>`).join('')}</ol></button>`).join('')}</div>
      <p class="small faint">Vòng cuối luôn là tự gõ lại từ vào chỗ trống trong câu của bài. Dùng nút “Gợi ý chữ cái” thì câu đó đúng cũng không được qua vòng. Có thể đổi độ khó lúc đang học.</p>
      <button class="btn pri lg" id="dr-start">Bắt đầu học ${icon('arrow')}</button></div></div>`;
    $$('[data-lv]', view).forEach(b => b.onclick = () => { T.target = P.target = +b.dataset.lv; save(); intro(); });
    $('#dr-start', view).onclick = () => { T.started = true; nextQ(); T.n = 1; save(); paint(); }; };
  const paint = () => {
    if (T.started === false) return intro();
    if (T.finished) { P.stage = 'back'; save(); return X.go(`#/doc/${d.id}/back`); }
    const q = T.q, pct = Math.round(T.done.length / T.total * 100);
    let h = `<div class="page dr-page">${head}<div class="card"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span>Đã thuộc <b>${T.done.length}</b>/${T.total} từ</span>
      <span class="small muted">Độ khó <select id="dr-tg">${[2, 3, 4].map(n => `<option value="${n}" ${n === T.target ? 'selected' : ''}>${n} vòng</option>`).join('')}</select> <button class="btn ghost sm" id="dr-rule">Luật học?</button></span></div>
      <div class="bar sage" style="margin-top:8px"><i style="width:${pct}%"></i></div><div class="small faint" style="margin-top:4px">Câu ${T.n} · đang học ${T.active.length} từ · còn ${T.waiting.length} từ chờ</div></div><div class="card dr-q" id="dr-q">`;
    if (q.type === 'match') {
      h += `<div class="kicker">Nối từ với nghĩa trong bài</div><div class="dr-match"><div>${q.left.map(k => `<button class="dr-mb ${q.done.includes(k) ? 'done' : ''}" data-l="${esc(k)}" ${q.done.includes(k) ? 'disabled' : ''}>${esc(byKey(k).t)}</button>`).join('')}</div>
        <div>${q.right.map(k => `<button class="dr-mb ${q.done.includes(k) ? 'done' : ''}" data-r="${esc(k)}" ${q.done.includes(k) ? 'disabled' : ''}>${esc(byKey(k).mean)}</button>`).join('')}</div></div><div id="dr-fb"></div>`;
    } else {
      const it = byKey(q.k);
      const label = { ctx: 'Từ được tô màu trong câu này nghĩa là gì?', mean: 'Từ nào trong bài có nghĩa này?', listen: 'Nghe rồi chọn nghĩa đúng', cloze: 'Gõ lại từ còn thiếu trong câu của bài' }[q.type];
      const prompt = q.type === 'ctx' ? `<div class="dr-sent">${hl(it.sent, it.t)}</div>` : q.type === 'mean' ? `<div class="ot-prompt">${esc(it.mean)}</div>` : q.type === 'listen' ? `<button class="btn syn lg" data-hear>${icon('vol')} Nghe</button>` : `<div class="dr-sent">${blank(it.sent, it.t, q.hint)}</div><div class="small muted">${esc(it.mean)}</div>`;
      h += `<div class="small faint">Vòng ${T.st[q.k].s + 1}/${T.target} của từ này · ${RN[SEQ(T.target)[T.st[q.k].s] || 'cloze']}</div><div class="kicker">${label}</div>${prompt}${dots(q.k)}`;
      if (q.opts) h += `<div class="dr-opts">${q.opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
      else h += `<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><input class="inp" id="dr-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ / cụm từ…" style="flex:1;min-width:200px"><button class="btn pri" id="dr-ok">Kiểm tra</button></div>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost sm" id="dr-hint">Gợi ý chữ cái</button><button class="btn ghost sm" id="dr-give">Không nhớ</button></div>${q.hint ? '<div class="small faint">Đã dùng gợi ý: đúng câu này sẽ không được tính là nhớ.</div>' : ''}`;
      h += `<div id="dr-fb"></div>`;
    }
    view.innerHTML = h + `</div></div>`;
    $('#dr-rule', view).onclick = () => { T.started = false; save(); intro(); };
    $('#dr-tg', view).onchange = e => { T.target = P.target = +e.target.value; Object.values(T.st).forEach(s => s.s = Math.min(s.s, T.target - 1)); save(); paint(); };
    bind();
    if (q.type === 'listen') setTimeout(() => TTS.speak(byKey(q.k).t, { role: 'W' }), 200);
  };
  const showFb = (g, it, extra) => { const ok = g.ok, fb = $('#dr-fb', view); const dd = $('.dr-dots', view); if (dd) dd.outerHTML = dots(it.key); fb.innerHTML = `<div class="ot-fb ${ok ? 'good' : 'bad'}" role="status"><b>${ok ? (g.done ? '✓ Đúng! Từ này đã thuộc.' : '✓ Đúng rồi!') : '✗ Sai rồi'}</b>${extra || ''}<div class="small" style="margin:4px 0">${roundMsg(it.key, g)}</div>${ok ? '' : '<div class="small" style="margin-top:4px">Đáp án đúng:</div>'}${line(it)}<div class="small" style="margin-top:4px">${hl(it.sent, it.t)}</div><button class="btn pri" id="dr-next" style="margin-top:8px">Câu tiếp ${icon('arrow')}</button></div>`;
    $$('[data-sayw]', fb).forEach(b => b.onclick = () => TTS.speak(b.dataset.sayw, { role: 'W' })); const t0 = Date.now(), nx = $('#dr-next', view); nx.onclick = () => { if (Date.now() - t0 < 350) return; nextQ(); save(); paint(); }; setTimeout(() => nx.focus(), 0); fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  const bind = () => {
    const q = T.q;
    if (q.type === 'match') {
      let sel = null;
      $$('[data-l]', view).forEach(b => b.onclick = () => { $$('[data-l]', view).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b.dataset.l; });
      $$('[data-r]', view).forEach(b => b.onclick = () => { if (!sel) return; const L = $(`[data-l="${CSS.escape(sel)}"]`, view);
        if (b.dataset.r === sel) { q.done.push(sel); [L, b].forEach(x => { x.classList.add('done'); x.disabled = true; x.classList.remove('sel'); }); TTS.speak(byKey(sel).t, { role: 'W' }); }
        else { if (!q.errs.includes(sel)) q.errs.push(sel); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 500); }
        sel = null;
        if (q.done.length === q.left.length) { q.left.forEach(k => grade(k, !q.errs.includes(k), false)); const fb = $('#dr-fb', view);
          fb.innerHTML = `<div class="ot-fb ${q.errs.length ? 'bad' : 'good'}"><b>${q.errs.length ? `Nối xong, sai ${q.errs.length} từ` : '✓ Nối đúng hết!'}</b>${q.errs.length ? `<div class="small" style="margin:4px 0">Các từ nối sai quay lại vòng 1/${T.target}. Nghĩa đúng:</div>` : `<div class="small" style="margin:4px 0">Cả 4 từ đều được cộng 1 vòng.</div>`}${q.errs.map(k => line(byKey(k))).join('')}<button class="btn pri" id="dr-next" style="margin-top:8px">Câu tiếp ${icon('arrow')}</button></div>`;
          $('#dr-next', view).onclick = () => { nextQ(); save(); paint(); }; } });
      return;
    }
    const it = byKey(q.k), hear = $('[data-hear]', view); if (hear) hear.onclick = () => TTS.speak(it.t, { role: 'W' });
    if (q.opts) { const right = q.type === 'mean' ? it.t : it.mean;
      $$('.opt', view).forEach(b => b.onclick = () => { const ok = q.opts[+b.dataset.i] === right; $$('.opt', view).forEach(x => { x.disabled = true; if (q.opts[+x.dataset.i] === right) x.classList.add('ok'); }); if (!ok) b.classList.add('bad');
        const g = grade(q.k, ok, false); if (ok) TTS.speak(it.t, { role: 'W' }); showFb(g, it, ok ? '' : `<div class="small">Bạn chọn: “${esc(q.opts[+b.dataset.i])}”</div>`); save(); }); return; }
    const inp = $('#dr-in', view); inp.focus();
    const norm = s => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z' -]/g, '').replace(/\s+/g, ' ').trim();
    let checked = false;
    const check = () => { if (checked) return; if (!inp.value.trim()) { $('#dr-fb', view).innerHTML = '<div class="small" style="color:var(--red)">Gõ đáp án vào ô trước rồi bấm Kiểm tra (không nhớ thì bấm “Không nhớ”).</div>'; inp.focus(); return; }
      checked = true; const ok = norm(inp.value) === norm(it.t), g = grade(q.k, ok, true, q.hint > 0); inp.disabled = true; $('#dr-ok', view).disabled = $('#dr-hint', view).disabled = $('#dr-give', view).disabled = true;
      if (ok) TTS.speak(it.sent, { role: 'W' }); showFb(g, it, ok ? '' : `<div class="small">Bạn gõ: “${esc(inp.value)}”</div>`); save(); };
    $('#dr-ok', view).onclick = check; inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } };
    $('#dr-hint', view).onclick = () => { q.hint = Math.min(it.t.length - 1, (q.hint || 1) + 1); save(); paint(); };
    $('#dr-give', view).onclick = () => { if (checked) return; checked = true; const g = grade(q.k, false, true); inp.disabled = true; $('#dr-ok', view).disabled = $('#dr-hint', view).disabled = $('#dr-give', view).disabled = true; showFb(g, it); save(); };
  };
  save(); paint();
}

/* ---------- bước 3: quay lại bài: tự dịch + câu hỏi có nối paraphrase ---------- */
// tô các đoạn [s, e) trong text, không chồng nhau; cls(i) = class của đoạn thứ i
const markRanges = (text, R) => { R = R.filter(r => r.s >= 0).sort((a, b) => a.s - b.s); let out = '', p = 0;
  R.forEach(r => { if (r.s < p) return; out += esc(text.slice(p, r.s)) + `<mark class="${r.cls}" ${r.attr || ''}>${esc(text.slice(r.s, r.e))}</mark>`; p = r.e; }); return out + esc(text.slice(p)); };
const findCI = (text, s) => text.toLowerCase().indexOf(s.toLowerCase());
let drLines = null, drRO = null, drRaf = 0;
const drRedraw = () => { if (drRaf) return; drRaf = requestAnimationFrame(() => { drRaf = 0; if (drLines && document.getElementById('dr-lines')) drLines(); }); };
window.addEventListener('scroll', drRedraw, true); window.addEventListener('resize', drRedraw);
const drWatch = el => { if (drRO) drRO.disconnect(); drRO = null; if (el && window.ResizeObserver) { drRO = new ResizeObserver(drRedraw); drRO.observe(el); } };
function backStage(view, d, P, Q, head) {
  P.ans = P.ans || {}; P.tr = P.tr || {};
  const IT = Object.values(P.sel), wide = () => window.innerWidth >= 980;
  let act = P.lastQ || '';   // chỉ vẽ đường nối cho câu đang xem (câu vừa chấm, hoặc câu đang rê chuột vào) cho đỡ rối
  const passageHTML = () => {
    // cặp paraphrase của các câu đã chấm: mỗi câu một màu, đánh số cặp
    const pairs = []; Q.forEach((q, qi) => { if (P.ans[q.id] == null) return; (d.links[q.id] || []).forEach(([a, b], li) => pairs.push({ q: q.id, qi, li, a, b })); });
    return d.paras.map((p, pi) => { const R = [];
      pairs.forEach(x => { const i = findCI(p.en, x.b); if (i >= 0 && !R.some(r => i < r.e && i + x.b.length > r.s)) R.push({ s: i, e: i + x.b.length, cls: `pl pl${x.qi % 5}`, attr: `data-pp="${x.q}-${x.li}"` }); });
      IT.forEach(it => { const i = findCI(p.en, it.t); if (i >= 0 && !R.some(r => i < r.e && i + it.t.length > r.s)) R.push({ s: i, e: i + it.t.length, cls: 'dr-learned' }); });
      return `<p>${markRanges(p.en, R)}</p>`; }).join('');
  };
  const qText = (q, txt, where) => { if (P.ans[q.id] == null) return esc(txt); const R = []; (d.links[q.id] || []).forEach(([a], li) => { const i = txt.indexOf(a); if (i >= 0 && !R.some(r => i < r.e && i + a.length > r.s)) R.push({ s: i, e: i + a.length, cls: `pl pl${Q.indexOf(q) % 5}`, attr: `data-pq="${q.id}-${li}"` }); }); return markRanges(txt, R); };
  const qHTML = (q, qi) => { const a = P.ans[q.id];
    return `<div class="card dr-qq" data-q="${esc(q.id)}"><div class="small faint">Câu ${qi + 1}/${Q.length}${q.skill ? ' · ' + esc(q.skill) : ''}</div><div class="dr-qp">${qText(q, q.prompt)}</div>
      <div class="dr-qo">${q.options.map((o, i) => `<button class="opt ${a != null ? (i === q.answer ? 'ok' : i === a ? 'bad' : '') : ''}" data-o="${i}" ${a != null ? 'disabled' : ''}><b>${'ABCD'[i]}</b> ${qText(q, o)}</button>`).join('')}</div>
      ${a != null ? `<div class="ot-fb ${a === q.answer ? 'good' : 'bad'}"><b>${a === q.answer ? '✓ Đúng' : `Chưa đúng, đáp án là ${'ABCD'[q.answer]}`}</b>${(d.links[q.id] || []).length ? `<div class="small" style="margin:6px 0">Cặp paraphrase (cùng màu ở câu hỏi và bài):</div>${(d.links[q.id] || []).map(([x, y], li) => `<div class="dr-pair" data-jump="${q.id}-${li}"><mark class="pl pl${qi % 5}">${esc(x)}</mark> ⟷ <mark class="pl pl${qi % 5}">${esc(y)}</mark></div>`).join('')}` : ''}
        ${q.explain ? `<details class="small" style="margin-top:6px"><summary>Giải thích</summary><div>${q.explain}</div></details>` : ''}</div>` : ''}</div>`; };
  const trHTML = () => d.paras.map((p, pi) => { const t = P.tr[pi] || {};
    return `<div class="card dr-tr"><p class="dr-tren">${markRanges(p.en, IT.map(it => { const i = findCI(p.en, it.t); return { s: i, e: i + it.t.length, cls: 'dr-learned' }; }).filter((r, i, a) => r.s >= 0 && !a.slice(0, i).some(x => r.s < x.e && r.e > x.s)))}</p>
      <textarea class="inp" data-tr="${pi}" rows="2" placeholder="Bản dịch của bạn…">${esc(t.v || '')}</textarea>
      <div class="row" style="gap:8px;margin-top:6px"><button class="btn sm" data-show="${pi}">${t.shown ? 'Ẩn bản mẫu' : 'So với bản dịch mẫu'}</button></div>${t.shown ? `<div class="dr-trvi">${esc(p.vi)}</div>` : ''}</div>`; }).join('');
  const paint = () => {
    const mode = P.backMode || 'tr';
    const nAns = Q.filter(q => P.ans[q.id] != null).length, nOk = Q.filter(q => P.ans[q.id] === q.answer).length;
    view.innerHTML = `<div class="page dr-page dr-wide">${head}
      <div class="seg" id="dr-mode" style="margin:10px 0"><button data-v="tr" class="${mode === 'tr' ? 'on' : ''}">Tự dịch bài</button><button data-v="qa" class="${mode === 'qa' ? 'on' : ''}">Trả lời câu hỏi (${nAns}/${Q.length})</button></div>
      ${mode === 'tr' ? `<p class="small muted">Dịch từng đoạn sang tiếng Việt bằng lời của bạn (từ vừa học được gạch chân), rồi so với bản dịch mẫu. Không cần giống từng chữ, chỉ cần đúng ý.</p>${trHTML()}
        <div class="dr-bar"><span></span><button class="btn pri" id="dr-toqa">Sang trả lời câu hỏi ${icon('arrow')}</button></div>`
      : `<div class="dr-split" id="dr-split"><div class="card dr-passage dr-left" id="dr-pass">${passageHTML()}</div><div class="dr-right">${Q.map(qHTML).join('')}
          ${nAns === Q.length ? `<div class="card" style="text-align:center"><div class="h2">${nOk}/${Q.length} câu đúng</div><button class="btn pri" id="dr-fin" style="margin-top:10px">Lưu từ vào lịch ôn ${icon('arrow')}</button></div>` : ''}</div><svg class="dr-lines" id="dr-lines"></svg></div>`}</div>`;
    $$('#dr-mode button', view).forEach(b => b.onclick = () => { P.backMode = b.dataset.v; drSave(); backStage(view, d, P, Q, head); });
    if (mode === 'tr') {
      $$('[data-tr]', view).forEach(t => t.oninput = () => { P.tr[t.dataset.tr] = Object.assign(P.tr[t.dataset.tr] || {}, { v: t.value }); drSave(); });
      $$('[data-show]', view).forEach(b => b.onclick = () => { const k = b.dataset.show; P.tr[k] = Object.assign(P.tr[k] || {}, { shown: !(P.tr[k] || {}).shown }); drSave(); paint(); });
      $('#dr-toqa', view).onclick = () => { P.backMode = 'qa'; drSave(); paint(); window.scrollTo(0, 0); };
      return;
    }
    $$('[data-o]', view).forEach(b => b.onclick = () => { const q = Q.find(x => x.id === b.closest('[data-q]').dataset.q); P.ans[q.id] = +b.dataset.o; P.lastQ = act = q.id; drSave();
      if (X.recordAnswer) try { X.recordAnswer(q, +b.dataset.o); } catch (e) {}
      paint(); const el = $(`[data-q="${CSS.escape(q.id)}"]`, view); if (el && !wide()) el.scrollIntoView({ block: 'nearest' }); });
    $$('[data-q]', view).forEach(c => c.onmouseenter = () => { if (P.ans[c.dataset.q] != null && act !== c.dataset.q) { act = c.dataset.q; lines(); } });
    const fin = $('#dr-fin', view); if (fin) fin.onclick = () => { P.stage = 'done'; drSave(); X.go(`#/doc/${d.id}/done`); };
    // bấm 1 cặp → nháy chỗ tương ứng trong bài
    $$('[data-jump],[data-pq]', view).forEach(el => el.onclick = () => { const k = el.dataset.jump || el.dataset.pq, t = $(`[data-pp="${k}"]`, view); if (!t) return; if (!wide()) t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); });
    lines(); drWatch($('#dr-split', view));
  };
  // vẽ đường nối giữa cụm ở câu hỏi và cụm ở bài (màn hình rộng, 2 cột).
  // Đi từ mép phải khung bài đọc sang mép trái ô đáp án, ngang với từng cụm → không gạch qua chữ.
  // Khung bài đọc dính (sticky) còn lớp vẽ cuộn theo trang, nên cuộn / đổi cỡ là phải vẽ lại.
  const lines = () => { const svg = $('#dr-lines', view), wrap = $('#dr-split', view); if (!svg || !wrap) return; svg.innerHTML = '';
    if (!wide()) return; const W = wrap.getBoundingClientRect(), L = $('#dr-pass', view).getBoundingClientRect(), H = wrap.scrollHeight;
    svg.setAttribute('width', W.width); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W.width} ${H}`);
    const NS = 'http://www.w3.org/2000/svg', mk = (tag, at) => { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); svg.appendChild(e); return e; };
    $$('[data-pq]', view).filter(a => a.dataset.pq.startsWith(act + '-')).forEach(a => { const b = $(`[data-pp="${a.dataset.pq}"]`, view); if (!b) return;
      const first = el => el.getClientRects()[0] || el.getBoundingClientRect(), ra = first(a), rb = first(b), box = (a.closest('.opt') || a.closest('.dr-qq') || a).getBoundingClientRect();
      const yb = rb.top + rb.height / 2; if (yb < L.top + 4 || yb > L.bottom - 4) return;   // cụm trong bài đang bị cuộn khuất khỏi khung bài đọc
      const x1 = L.right - W.left, y1 = yb - W.top, x2 = box.left - W.left, y2 = ra.top + ra.height / 2 - W.top, mx = (x1 + x2) / 2;
      const col = (getComputedStyle(a).getPropertyValue('--plc') || '').trim() || '#6D4AFF';
      mk('path', { d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, fill: 'none', stroke: col, 'stroke-width': '1.6', opacity: '.75' });
      [[x1, y1], [x2, y2]].forEach(([cx, cy]) => mk('circle', { cx, cy, r: '3.5', fill: col, opacity: '.9' }));
    }); };
  // một bộ lắng nghe dùng chung cho cả trang (không gắn lại mỗi lần vẽ, không tự gỡ khi đang ở bước Tự dịch)
  drLines = lines;
  paint();
}

/* ---------- bước 4: lưu vào lịch ôn ---------- */
function doneStage(view, d, P, head) {
  const IT = Object.values(P.sel);
  if (!P.saved) {
    IT.forEach(it => { let id = it.vid;
      if (!id) { const k = it.key.replace(/^g:/, ''), slug = 'DR-' + k.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const w = drWords()[slug] || { id: slug, w: it.t.toLowerCase() === it.t ? it.t : it.t.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase()), pos: '', ipa: '', vi: it.mean + (it.other ? ` (khác: ${it.other})` : ''), def: '', ex: [it.sent], col: [], syn: [], fam: [], ant: [], note: 'Học từ bài đọc: ' + d.title, parts: [7], topics: ['Từ học qua bài đọc'], group: 'Từ học qua bài đọc', topic: 'Từ học qua bài đọc', kind: /\s/.test(it.t) ? 'phrase' : 'word', freq: 2, star: false };
        drWords()[slug] = w; inject(w); id = slug; }
      it.sid = id; X.srsReview(id, 3, 'type'); });
    P.saved = Date.now(); P.done = Date.now(); X.addXP && X.addXP(10 + IT.length * 2, 'Đọc trước, học sau'); drSave();
  }
  const ws = S().words || {}, fmt = t => new Date(t).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
  view.innerHTML = `<div class="page dr-page">${head}<div class="card" style="text-align:center"><div class="kicker syn">Xong bài này</div><div class="h1" style="margin:6px 0">${IT.length} từ đã vào lịch ôn</div>
    <p class="small muted">Lịch ôn ngắt quãng: từ nào nhớ tốt thì lần ôn sau giãn xa hơn (1 ngày → 3 ngày → 1 tuần…), từ nào quên sẽ quay lại sớm. Đến hạn, mục <b>Kho từ vựng</b> và trang <b>Hôm nay</b> sẽ báo số từ cần ôn.</p></div>
    <div class="card"><table class="dr-sched"><tbody>${IT.map(it => { const w = X.wordById[it.sid || it.vid], r = w && ws[w.id]; return `<tr><td><b>${esc(it.t)}</b></td><td class="small">${esc(it.mean)}</td><td class="small faint">${r && r.due ? 'ôn lại ' + fmt(r.due) : ''}</td></tr>`; }).join('')}</tbody></table></div>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px"><a class="btn pri" href="#/doc">Đọc bài khác ${icon('arrow')}</a><a class="btn" href="#/output">Nói và viết với từ vừa học</a><button class="btn ghost" id="dr-redo">Học lại bài này</button></div></div>`;
  $('#dr-redo', view).onclick = () => { const st = S(); st.dr[d.id] = { sel: {}, stage: 'read', at: Date.now() }; curP = null; X.save(); X.go('#/doc/' + d.id); };
}
})();
