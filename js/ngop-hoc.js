/* "Làm cùng Tooez": 3 bộ đoạn ba, hỗ trợ giảm dần.
   Bộ 1: Tooez dẫn từng bước nhỏ. Bộ 2: tự làm, kẹt thì bấm Gợi ý. Bộ 3: tự làm hẳn.
   Sai 2 câu liền thì câu sau tự lùi một mức hỗ trợ; đúng nhiều thì khen và giữ mức. */
(function () {
const { $, $$, esc } = X, icon = X.icon, S = X.S;
const SETS = window.NGOP_SETS || [], STEPS = window.NGOP_STEPS || {};
const TIER = { f: ['Ăn nhanh', 'sage'], m: ['Vừa', 'gold'], s: ['Phải nhai', 'ember'] };
const tierPill = k => `<span class="pill ${TIER[k][1]}">${TIER[k][0]}</span>`;
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const PRAISE = ['Chuẩn luôn!', 'Đúng chỗ rồi!', 'Mắt tinh ghê!', 'Đó, đâu cần đọc hết bài.', 'Giỏi quá!', 'Đúng rồi nè!', 'Ngon lành!'];
const NUDGE = ['Gần rồi, thử chỗ khác nhé.', 'Chưa phải câu này, nhìn lại gợi ý nhé.', 'Không sao, thử lại nè.'];
// mức hỗ trợ ban đầu cho từng câu (cung = làm cùng, goi = tự làm có gợi ý, tu = tự làm hẳn)
const PLAN = { 186: 'cung', 187: 'cung', 188: 'cung', 189: 'cung', 190: 'goi', 191: 'goi', 192: 'tu', 193: 'goi', 194: 'tu', 195: 'goi', 196: 'tu', 197: 'tu', 198: 'tu', 199: 'tu', 200: 'tu' };
const DOWN = { tu: 'goi', goi: 'cung', cung: 'cung' };
const MODE_NAME = { cung: 'Làm cùng Tooez', goi: 'Bạn làm, Tooez gợi ý', tu: 'Bạn tự làm' };
const SET_INTRO = [
  'Bộ đầu tiên mình làm cùng nhau. Bạn không cần đọc hết bài: mình chỉ chỗ nào, bạn bấm chỗ đó. Từng bước nhỏ thôi, sai cũng không sao.',
  'Bộ thứ hai: bạn cầm lái, mình ngồi cạnh. Kẹt chỗ nào thì bấm <b>Gợi ý</b>, mình chỉ từng bước một.',
  'Bộ cuối: bạn tự làm hẳn. Nhớ thứ tự: đọc câu hỏi, tìm từ khóa, đi từ phương án. Mình chỉ đứng xem và cổ vũ thôi!',
];
const order = st => st.qs.map((q, i) => i).sort((a, b) => 'fms'.indexOf(st.qs[a].tier) - 'fms'.indexOf(st.qs[b].tier) || a - b);
const QUEUE = SETS.flatMap((st, si) => order(st).map(qi => ({ si, qi })));
const J = () => { const s = S(); s.ngop = s.ngop || { steps: {}, sets: {} }; s.ngop.hoc = s.ngop.hoc || { done: {} }; return s.ngop.hoc; };

/* biến một đoạn bài thành đoạn trích bấm được: câu thường và câu bằng chứng đều là ô bấm */
const tplOf = html => { const t = document.createElement('template'); t.innerHTML = html; return t.content; };
const splitText = (node, out) => {
  // tách câu, không dùng lookbehind để chạy được cả trên Safari cũ
  const bits = node.textContent.split(/([.!?:]\s+)/), parts = [];
  for (let i = 0; i < bits.length; i += 2) parts.push(bits[i] + (bits[i + 1] || ''));
  parts.forEach(part => {
    if (!part.trim()) { out.appendChild(document.createTextNode(part)); return; }
    const sp = document.createElement('span'); sp.className = 'ng-tk'; sp.textContent = part; out.appendChild(sp);
  });
};
const tokenize = el => {
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 3) { const f = document.createDocumentFragment(); splitText(n, f); n.replaceWith(f); }
    else if (n.nodeType === 1 && n.tagName === 'MARK') { const sp = document.createElement('span'); sp.className = 'ng-tk'; sp.dataset.ev = n.dataset.ev; sp.innerHTML = n.innerHTML; n.replaceWith(sp); }
    else if (n.nodeType === 1 && n.tagName !== 'BR') tokenize(n);
  });
};
const excerpt = (st, doc, evs) => {
  const root = tplOf(st.docs[doc].html), blocks = [], seen = new Set();
  evs.forEach(ev => { const m = root.querySelector(`mark[data-ev="${ev}"]`); if (!m) return; const b = m.closest('table') || m.closest('li') || m.closest('p'); if (b && !seen.has(b)) { seen.add(b); blocks.push(b); } });
  // đoạn quá ngắn thì kèm đoạn liền trước cho có ô để chọn
  const div = document.createElement('div'); div.className = 'ng-ex-doc';
  blocks.forEach(b => {
    if (b.tagName === 'TABLE') {
      const t = b.cloneNode(true); t.querySelectorAll('tbody tr').forEach(tr => { tr.classList.add('ng-tk-row'); const m = tr.querySelector('mark'); if (m) tr.dataset.ev = [...tr.querySelectorAll('mark')].map(x => x.dataset.ev).join(' '); tr.querySelectorAll('mark').forEach(x => x.replaceWith(...x.childNodes)); });
      const w = document.createElement('div'); w.className = 'ktw'; t.className = 'kt'; w.appendChild(t); div.appendChild(w); return;
    }
    if (b.tagName === 'LI') { const ul = b.parentNode.cloneNode(true); tokenize(ul); div.appendChild(ul); return; }
    const p = b.cloneNode(true); tokenize(p); div.appendChild(p);
  });
  return div;
};

X.route(/^\/ngop\/hoc$/, view => {
  const j = J();
  let idx = QUEUE.findIndex(x => !j.done[SETS[x.si].qs[x.qi].n]); if (idx < 0) idx = QUEUE.length;
  let timer = 0, idleT = 0; const introDone = new Set();
  X.onLeave(() => { clearInterval(timer); clearTimeout(idleT); });
  const modeFor = n => {
    let m = PLAN[n] || 'tu';
    // sai 2 câu liền ngay trước → lùi một mức
    const prev = QUEUE.slice(0, QUEUE.findIndex(x => SETS[x.si].qs[x.qi].n === n)).map(x => j.done[SETS[x.si].qs[x.qi].n]).filter(Boolean).slice(-2);
    if (prev.length === 2 && prev.every(r => !r.ok)) m = DOWN[m];
    return m;
  };
  const stats = () => { const d = Object.values(j.done); return { n: d.length, ok: d.filter(r => r.ok).length, solo: d.filter(r => r.ok && r.mode !== 'cung' && !r.hint).length }; };
  const progress = () => { const t = stats(); return `<div class="ng-prog"><div class="ng-prog-bar"><i style="width:${Math.round(t.n / QUEUE.length * 100)}%"></i></div>
    <div class="small muted">${t.n}/${QUEUE.length} câu · đúng ${t.ok} · <b>tự làm đúng ${t.solo}</b></div></div>`; };

  const finish = () => {
    const t = stats();
    view.innerHTML = `<div class="page ng-pg"><a class="small" href="#/ngop">${icon('back')} Bị ngộp Part 3, 4, 7?</a>
      <div class="card tint" style="margin-top:14px">${X.xiSay('wow', `Xong cả 15 câu đoạn ba rồi! Bạn đúng <b>${t.ok}/15</b>, trong đó <b>${t.solo} câu tự làm</b> không cần gợi ý. Câu 186-200 là phần nhiều người bỏ cuộc nhất, và bạn vừa đi hết nó.`)}</div>
      <div class="grid g3" style="margin-top:16px">${SETS.map(st => { const ok = st.qs.filter(q => (j.done[q.n] || {}).ok).length; return `<div class="card"><div class="kicker">Câu ${st.first}-${st.first + 4}</div><b>${esc(st.title)}</b><div class="h2" style="margin:6px 0 0">${ok}/5</div></div>`; }).join('')}</div>
      <div class="card" style="margin-top:16px"><b>Làm gì tiếp?</b><ul class="small ng-ul"><li>1-2 ngày nữa làm lại 3 bộ này ở chế độ tự làm, để não nhớ lâu cách làm.</li><li>Sau đó làm đề Part 7 đầy đủ, nhớ thứ tự: câu nhanh trước, luật 90 giây.</li></ul>
        <div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn pri" href="#/ngop/bo/foxglove">Tự làm lại từng bộ ${icon('arrow')}</a><a class="btn" href="#/exam/x7-1">Đề Part 7</a><button class="btn ghost" id="hc-reset">Làm cùng lại từ đầu</button></div></div></div>`;
    if (!j.fin) { j.fin = Date.now(); X.save(); X.celebrate && X.celebrate({ title: 'Xong 15 câu đoạn ba!', sub: `Tự làm đúng ${t.solo} câu`, stars: t.ok >= 12 ? 3 : t.ok >= 8 ? 2 : 1, xp: 0 }); }
    $('#hc-reset', view).onclick = () => { S().ngop.hoc = { done: {} }; X.save(); X.render(); };
  };

  const setIntro = (si, go) => {
    const st = SETS[si];
    view.innerHTML = `<div class="page ng-pg"><a class="small" href="#/ngop">${icon('back')} Bị ngộp Part 3, 4, 7?</a>${progress()}
      <div class="card tint ng-intro"><div class="kicker">Bộ ${si + 1}/3 · câu ${st.first}-${st.first + 4}</div><h1 class="h2" style="margin:4px 0 12px">${esc(st.title)}</h1>
      ${X.xiSay(si ? 'happy' : 'think', SET_INTRO[si])}
      <p class="small muted" style="margin-top:12px">${esc(st.kind)}. Thứ tự làm: câu nhanh trước, câu phải nhai sau: ${order(st).map(i => `<b>${st.qs[i].n}</b>`).join(' → ')}</p>
      <button class="btn pri lg" id="hc-go">${si ? 'Bắt đầu' : 'Làm cùng Tooez'} ${icon('arrow')}</button></div></div>`;
    $('#hc-go', view).onclick = go;
  };

  const showQuestion = (forceMode) => {
    clearInterval(timer); clearTimeout(idleT);
    if (idx >= QUEUE.length) return finish();
    const { si, qi } = QUEUE[idx], st = SETS[si], q = st.qs[qi], spec = STEPS[q.n] || { steps: [] };
    const firstOfSet = !QUEUE.slice(0, idx).some(x => x.si === si);
    if (firstOfSet && !forceMode && !introDone.has(si)) { introDone.add(si); return setIntro(si, () => showQuestion()); }
    const mode = forceMode || modeFor(q.n);
    const steps = (mode === 'cung' ? [{ t: 'tier' }] : []).concat(spec.steps);
    const R = { mode, step: -1, hint: false, wrongTaps: 0, answered: false, start: Date.now(), out: new Set() };
    const downgraded = mode !== PLAN[q.n] && !forceMode;
    view.innerHTML = `<div class="page ng-pg"><a class="small" href="#/ngop">${icon('back')} Bị ngộp Part 3, 4, 7?</a>${progress()}
      <div class="ng-work"><div class="ng-qcol"><div class="card ng-qcard">
        <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="small"><b>Câu ${q.n}</b> · Bộ ${si + 1}/3 ${mode === 'cung' ? '' : tierPill(q.tier)}</span><span class="pill ${mode === 'cung' ? 'syn' : mode === 'goi' ? 'gold' : 'sage'}">${MODE_NAME[mode]}</span></div>
        <div class="h3" style="margin:12px 0 0">${esc(q.q)}</div>
        <div id="hc-coach" class="ng-coach"></div><div id="hc-step"></div>
        <div class="opts" id="hc-opts">${q.o.map((o, k) => `<button class="opt" data-k="${k}"><span class="L">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>
        <div id="hc-tools" class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"></div><div id="hc-fb"></div>
      </div></div>
      <div class="ng-docs card"><div class="small muted" style="margin-bottom:8px">Cả bài ở đây để tra khi cần. Không cần đọc hết.</div><div class="seg ng-tabs">${st.docs.map((d, i) => `<button data-d="${i}" class="${i ? '' : 'on'}">Bài ${i + 1}: ${esc(d.name)}</button>`).join('')}</div>
        ${st.docs.map((d, i) => `<div class="ng-doc prose" data-doc="${i}" ${i ? 'hidden' : ''}>${d.html}</div>`).join('')}</div></div></div>`;
    const showDoc = i => { $$('.ng-tabs button', view).forEach(b => b.classList.toggle('on', +b.dataset.d === i)); $$('.ng-doc', view).forEach(d => d.hidden = +d.dataset.doc !== i); };
    $$('.ng-tabs button', view).forEach(b => b.onclick = () => showDoc(+b.dataset.d));
    const lightMain = evs => evs.forEach(e => $$(`.ng-doc mark[data-ev="${e}"]`, view).forEach(m => m.classList.add('on')));
    const coach = (html, mood = 'think') => { const c = $('#hc-coach', view); c.innerHTML = X.xiSay(mood, html, 58); X.pop && X.pop(c.querySelector('.bubble')); };
    const optsOn = on => $$('#hc-opts .opt', view).forEach(b => { if (!R.out.has(+b.dataset.k)) b.disabled = !on; });
    const idle = (msg) => { clearTimeout(idleT); idleT = setTimeout(() => { if (!R.answered) coach(msg, 'think'); }, 22000); };

    const tools = () => {
      const tl = $('#hc-tools', view); if (R.answered) { tl.innerHTML = ''; return; }
      if (mode === 'cung') { tl.innerHTML = ''; return; }
      const left = steps.length - (R.step + 1);
      tl.innerHTML = left > 0 ? `<button class="btn sm ${mode === 'goi' ? '' : 'ghost'}" id="hc-hint">${icon('eye')} ${R.step < 0 ? 'Gợi ý' : 'Gợi ý tiếp'}${R.step < 0 ? '' : ` (còn ${left})`}</button>` : '';
      const h = $('#hc-hint', view); if (h) h.onclick = () => { R.hint = true; nextStep(); };
    };

    const doneStep = (msg) => {
      coach(`<b>${pickOne(PRAISE)}</b> ${msg || ''}`, 'happy');
      const box = $('#hc-step', view);
      if (mode === 'cung') {
        box.insertAdjacentHTML('beforeend', `<button class="btn pri" id="hc-next" style="margin-top:12px">${R.step + 1 < steps.length ? 'Bước tiếp' : 'Chọn đáp án'} ${icon('arrow')}</button>`);
        $('#hc-next', view).onclick = nextStep; $('#hc-next', view).focus({ preventScroll: true });
      } else { tools(); optsOn(true); }
    };

    const nextStep = () => {
      R.step++; R.wrongTaps = 0; const box = $('#hc-step', view); box.innerHTML = '';
      if (R.step >= steps.length) { // tới lúc chọn đáp án
        coach(mode === 'cung' ? 'Giờ bạn đã có đủ thông tin. <b>Chọn đáp án</b> nhé!' : 'Hết gợi ý rồi, chọn đáp án nhé. Bạn làm được mà!', 'happy');
        optsOn(true); tools(); idle('Nhìn lại các bước vừa làm, đáp án nằm ở đó đó.'); return;
      }
      const s = steps[R.step]; optsOn(mode !== 'cung'); tools();
      const num = `<div class="ng-stepno small muted">Bước ${R.step + 1}/${steps.length}</div>`;
      if (s.t === 'tier') {
        coach('Trước khi đọc bài, nhìn câu hỏi và đoán: câu này thuộc loại nào?');
        box.innerHTML = num + `<div class="ng-picks">${'fms'.split('').map(k => `<button class="btn" data-t="${k}">${TIER[k][0]}</button>`).join('')}</div>`;
        $$('[data-t]', box).forEach(b => b.onclick = () => {
          $$('[data-t]', box).forEach(x => x.disabled = true); b.classList.add(b.dataset.t === q.tier ? 'ok' : 'no');
          box.insertAdjacentHTML('beforeend', `<div class="small ng-sig" style="margin-top:8px">${tierPill(q.tier)} ${esc(q.sig)}</div>`);
          doneStep(b.dataset.t === q.tier ? 'Đoán đúng loại câu rồi.' : 'Câu này thuộc loại khác một chút, xem dấu hiệu bên dưới nhé.');
        });
        return;
      }
      if (s.t === 'info') { coach(s.say); box.innerHTML = num; doneStep(''); return; }
      if (s.t === 'pick') {
        coach(s.say);
        box.innerHTML = num + `<div class="ng-picks col">${s.o.map((o, k) => `<button class="btn" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
        $$('[data-k]', box).forEach(b => b.onclick = () => {
          if (+b.dataset.k === s.a) { $$('[data-k]', box).forEach(x => x.disabled = true); b.classList.add('ok'); X.sfx && X.sfx.ok && X.sfx.ok(); doneStep(s.ok); }
          else { b.classList.add('no'); b.disabled = true; X.shake && X.shake(b); coach(pickOne(NUDGE)); }
        });
        idle('Đọc lại câu Tooez hỏi, chọn ý hợp lý nhất nhé.'); return;
      }
      if (s.t === 'tap') {
        coach(s.say);
        const ex = excerpt(st, s.doc, s.ev);
        box.innerHTML = num + `<div class="small muted" style="margin:4px 0 6px">Đoạn trích từ <b>Bài ${s.doc + 1}: ${esc(st.docs[s.doc].name)}</b>. Bấm vào đúng câu / dòng:</div>`;
        box.appendChild(ex); showDoc(s.doc);
        const isHit = el => (el.dataset.ev || '').split(' ').some(e => s.ev.includes(e));
        $$('.ng-tk, .ng-tk-row', ex).forEach(el => el.onclick = e => {
          e.stopPropagation(); if (ex.classList.contains('solved')) return;
          if (isHit(el)) { ex.classList.add('solved'); el.classList.add('hit'); lightMain(s.ev); doneStep(s.ok); }
          else {
            el.classList.add('miss'); setTimeout(() => el.classList.remove('miss'), 700); R.wrongTaps++;
            if (R.wrongTaps >= 2) { $$('.ng-tk, .ng-tk-row', ex).filter(isHit).forEach(x => x.classList.add('glow')); coach('Câu đang nhấp nháy đó, bấm vào nhé. Lần sau là bạn tự thấy thôi.'); }
            else coach(pickOne(NUDGE));
          }
        });
        idle('Đọc từng câu trong đoạn trích, câu nào có ý Tooez hỏi thì bấm vào.'); return;
      }
      if (s.t === 'elim') {
        coach(s.say); box.innerHTML = num; R.elim = { s, n: 0 }; optsOn(true);
        idle('Phương án nào nói điều bài không hề nhắc, hoặc nói ngược với bài, thì gạch đi.');
      }
    };

    $$('#hc-opts .opt', view).forEach(b => b.onclick = () => {
      const k = +b.dataset.k; if (R.answered || R.out.has(k)) return;
      const cur = steps[R.step];
      if (cur && cur.t === 'elim' && R.elim && R.elim.n < cur.need && (mode === 'cung' || cur.k.includes(k))) {
        if (cur.k.includes(k)) { R.out.add(k); b.classList.add('out'); b.disabled = true; R.elim.n++; coach(cur.notes[k], 'happy');
          if (R.elim.n >= cur.need) { R.elim = null; setTimeout(() => doneStep(`Đã gạch ${cur.need} phương án sai.`), 900); } }
        else if (k === q.a) { X.shake && X.shake(b); coach('Khoan đã! Phương án này <b>chưa sai</b> đâu, giữ lại nhé. Gạch những cái chắc chắn sai thôi.'); }
        else { X.shake && X.shake(b); coach('Cái này chưa chắc sai, để đó. Tìm cái sai rõ ràng hơn nhé.'); }
        return;
      }
      if (mode === 'cung' && R.step < steps.length) return;
      // trả lời
      R.answered = true; clearTimeout(idleT); const ok = k === q.a, ms = Date.now() - R.start;
      $$('#hc-opts .opt', view).forEach(x => { const kk = +x.dataset.k; x.disabled = true; if (kk === q.a) x.classList.add('ok'); else if (kk === k) x.classList.add('bad'); });
      X.react && X.react(ok, b); lightMain(q.ev);
      const prev = j.done[q.n]; if (!prev) j.done[q.n] = { ok, mode, hint: R.hint, ms, at: Date.now() };
      X.save(); if (ok && !prev) X.addXP && X.addXP(mode === 'tu' && !R.hint ? 5 : 3, mode === 'cung' ? 'Làm cùng Tooez' : 'Tự làm câu đoạn ba');
      const t = stats();
      const solo = ok && mode !== 'cung' && !R.hint;
      const cheer = !ok ? 'Không sao đâu, câu sai là chỗ mình học được nhiều nhất. Xem lại cách làm bên dưới nhé.'
        : mode === 'cung' ? pickOne(['Làm cùng nhau xong một câu rồi! Bạn thấy không, chỉ cần đi từng bước nhỏ.', 'Xong rồi! Thấy chưa, không cần đọc hết cả bài.', 'Tuyệt! Bạn vừa làm đúng cách của người làm nhanh.'])
        : solo && t.solo === 1 ? '<b>Câu đầu tiên bạn tự làm đúng!</b> Đây là lúc đáng nhớ đó.'
        : solo ? pickOne(['Tự làm mà vẫn đúng, giỏi quá!', 'Bạn đang làm như người thi thật rồi đó!', 'Phản xạ đang hình thành rồi!', `Đã tự làm đúng ${t.solo} câu rồi!`])
        : 'Đúng rồi! Lần sau thử ít gợi ý hơn một chút nhé.';
      coach(cheer, ok ? 'happy' : 'think');
      if (solo && t.solo === 1) X.burst && X.burst(b);
      $('#hc-fb', view).innerHTML = `<div class="ng-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Chính xác!' : `Đáp án đúng là ${'ABCD'[q.a]}.`}</b> <span class="small muted">${Math.round(ms / 1000)} giây</span>
        <p class="small" style="margin:8px 0 4px">${q.why}</p><p class="small muted" style="margin:0 0 8px"><b>Bẫy:</b> ${q.trap}</p>
        ${spec.fast ? `<div class="ng-fast small"><b>${icon('bolt')} Cách làm nhanh:</b> ${spec.fast}</div>` : ''}
        <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="btn pri" id="hc-nextq">${idx + 1 < QUEUE.length ? 'Câu tiếp theo' : 'Xem tổng kết'} ${icon('arrow')}</button>
        ${!ok || (mode !== 'cung' && R.hint) ? `<button class="btn" id="hc-replay">Làm lại cùng Tooez từng bước</button>` : ''}</div></div>`;
      tools();
      $('#hc-nextq', view).onclick = () => { idx++; showQuestion(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      const rp = $('#hc-replay', view); if (rp) rp.onclick = () => { showQuestion('cung'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      $('#hc-fb', view).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // mở đầu câu
    if (mode === 'cung') { coach(forceMode === 'cung' ? 'Mình làm lại câu này cùng nhau từng bước nhé.' : downgraded ? 'Câu này mình làm cùng nhau nhé, từng bước một. Bạn chỉ cần bấm theo.' : (idx === 0 ? 'Mình bắt đầu nhé! Câu nào mình cũng chia thành vài bước nhỏ, bạn chỉ cần bấm theo.' : 'Câu này cũng làm cùng nhau nhé.'), 'happy'); optsOn(false); setTimeout(nextStep, forceMode ? 300 : 900); }
    else {
      const t = stats();
      coach(downgraded ? 'Câu này bạn tự thử trước, kẹt thì có <b>Gợi ý</b> ngay bên dưới nhé.'
        : mode === 'goi' ? pickOne(['Lượt này bạn tự thử trước nhé. Kẹt thì bấm <b>Gợi ý</b>, mình chỉ từng bước.', 'Bạn làm trước, mình ở ngay đây. Nhớ: tìm từ khóa trong câu hỏi trước.'])
        : t.solo ? pickOne(['Tự làm tiếp nào, bạn làm được mà!', 'Câu này bạn tự xử lý nhé, mình tin bạn.', 'Bình tĩnh, đọc câu hỏi trước, tìm từ khóa.']) : 'Giờ bạn tự làm hẳn nhé! Đọc câu hỏi, đoán loại câu, rồi tìm đúng chỗ cần đọc.', 'happy');
      optsOn(true); tools(); idle(mode === 'goi' ? 'Kẹt hả? Bấm <b>Gợi ý</b> nhé, không mất gì đâu.' : 'Cần thì bấm Gợi ý nhé. Còn không thì đi từ phương án: phương án nào kiểm tra nhanh nhất?');
    }
  };

  showQuestion();
});
})();
