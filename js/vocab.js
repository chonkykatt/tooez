/* TOOEZ — Kho từ vựng: list, word page, learn, SRS review, rich journey */
'use strict';
(() => {
const { $, $$, esc, icon, pct, shuffle, sample, today, fmtDate, DAY, TTS } = X;
const S = () => X.S();
const mdots = lvl => `<span class="mdots" title="${X.LEVELS[lvl || 0]}">${[1, 2, 3, 4].map(i => `<b class="${(lvl || 0) >= i ? 'on' : ''}"></b>`).join('')}</span>`;
const sayBtn = t => `<button class="say" data-say="${esc(t)}" title="Nghe">${icon('vol')}</button>`;
const bindSay = root => $$('[data-say]', root).forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); X.say(b.dataset.say); });
const speakable = w => w.w.replace(/\.\.\.|…/g, ' ').split(' / ')[0];

/* ---------------- list ---------------- */
const F = { part: 'all', lvl: 'all', q: '', star: false, page: 0 };
X.route(/^\/vocab$/, view => {
  const s = S();
  const due = X.wordDue().length;
  const learned = Object.keys(s.words).length;
  view.innerHTML = `<div class="page">${X.stepHead('hoc')}<div class="kicker">Kho từ vựng</div><h1 class="h1">${X.VOCAB.length.toLocaleString('vi-VN')} từ và cụm theo Part</h1>
    <p class="lead">Một kho chung, mỗi từ gắn với Part và chủ đề trong giáo trình. Biết nghĩa chưa đủ: từ chỉ tính là <b>thành thạo</b> khi bạn nhận ra khi nghe, hiểu trong câu, tự gõ lại được và vẫn nhớ sau 3 tuần.</p>
    <div class="grid g3 sec">
      <div class="card"><div class="stat"><div class="v">${due}</div><div class="l">từ đến hạn ôn</div></div><a class="btn ${due ? 'pri' : ''} sm" style="margin-top:12px" href="#/vocab/review">${icon('refresh')} Ôn ngay</a></div>
      <div class="card"><div class="stat"><div class="v">${learned}</div><div class="l">từ đã học - ${Object.values(s.words).filter(w => w.lvl >= 3).length} nhớ chủ động</div></div><a class="btn ${due ? '' : 'pri'} sm" style="margin-top:12px" href="#/vocab/learn">${icon('plus')} Học ${s.profile.newWords} từ mới</a></div>
      <a class="card link ink" id="vc-deep" href="#/vocab/deep/${((X.VOCAB.filter(w => w.star)[Math.floor(Math.random() * Math.max(1, X.VOCAB.filter(w => w.star).length))] || X.VOCAB[0] || {}).id || '')}"><div class="kicker" style="color:#9A9DA8">Học sâu một từ</div><div class="h2" style="margin:6px 0">Thử với một từ ngẫu nhiên</div><div class="small muted">Mỗi từ có trang học riêng: đoán nghĩa, nghe, nhớ lại, đo tốc độ. Bấm vào thẻ này, hoặc bấm vào bất kỳ từ nào trong kho để học sâu từ đó.</div></a>
    </div>
    <div class="sec-h sec"><h2 class="h2">Học theo nhóm nghĩa</h2><span class="small muted">Mỗi nhóm 4-25 từ cùng chủ đề, học như một game 6 vòng</span></div>
    <div class="seg" id="vgp">${X.PARTS.map(p => `<button data-v="${p.k}">${p.n}</button>`).join('')}</div>
    <div class="grid g3" id="vgroups" style="margin-top:14px"></div>
    <div class="sec-h sec"><h2 class="h2">Tra từ</h2></div>
    <div class="vtools"><input class="inp" id="vq" placeholder="Tìm từ hoặc nghĩa…" style="max-width:260px" value="${esc(F.q)}">
      <div class="seg" id="vpart"><button data-v="all">Tất cả</button>${[1, 2, 3, 5, 6, 7].map(n => `<button data-v="${n}">P${n === 3 ? '3-4' : n}</button>`).join('')}</div>
      <div class="seg" id="vlvl"><button data-v="all">Mọi mức</button><button data-v="new">Chưa học</button><button data-v="weak">Đang học</button><button data-v="strong">Đã nhớ</button></div>
      <label class="row small" style="gap:6px"><input type="checkbox" id="vstar" ${F.star ? 'checked' : ''}> Chỉ từ hay gặp ★</label></div>
    <div class="vlist" id="vl"></div><div class="row" style="justify-content:center;margin-top:14px" id="vpg"></div></div>`;
  const setSeg = (id, v) => $$(`#${id} button`, view).forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  const drawGroups = pk => {
    setSeg('vgp', pk); F.gp = pk;
    const parts = X.PARTS.find(p => p.k === pk).parts; const G = {};
    X.VOCAB.forEach(w => { if (w.parts[0] !== parts[0] && !(pk === 'p5' && w.topic.startsWith('Kho mở rộng'))) return; if (pk !== 'p5' && w.topic.startsWith('Kho mở rộng')) return; const k = w.group + '@' + w.topic; (G[k] ||= []).push(w); });
    $('#vgroups', view).innerHTML = Object.entries(G).map(([k, ws]) => { const [g, t] = k.split('@'); const L = ws.filter(w => s.words[w.id]).length, M = ws.filter(w => (s.words[w.id]?.lvl || 0) >= 3).length;
      return `<a class="card link vgroup" href="#/vocab/learn/${encodeURIComponent(k)}">${ws.some(X.hasImgSlot) ? `<div class="vg-imgs" data-g="${esc(k)}"></div>` : ''}<div class="small faint">${esc(t)}</div><div class="h3" style="font-family:var(--f-display);font-size:16px;margin:3px 0 8px">${esc(g)}</div><div class="bar thin sage"><i style="width:${pct(L, ws.length)}%"></i></div><div class="row small" style="margin-top:6px"><span class="muted">${L}/${ws.length} đã học - ${M} nhớ chủ động</span><span class="grow"></span><span class="btn sm ${L < ws.length ? 'pri' : ''}">${L < ws.length ? 'Học' : 'Ôn'}</span></div></a>`; }).join('');
    // ảnh minh họa (Part 1): dải ảnh nhỏ trên mỗi nhóm
    $$('.vg-imgs', view).forEach(el => { const ws = (G[el.dataset.g] || []).filter(X.hasImgSlot);
      X.imgPrefetch(ws).then(() => { if (!el.isConnected) return; const has = ws.filter(X.imgNow);
        el.innerHTML = has.length ? has.slice(0, 4).map(w => `<img src="${X.imgNow(w)}" alt="${esc(w.w)}" title="${esc(w.w)}">`).join('') + `<span class="vg-imgc" title="Số từ đã có ảnh">${has.length}/${ws.length}<small>ảnh</small></span>` : `<span class="vg-imgc">📷 0/${ws.length} ảnh</span>`; el.classList.toggle('has', has.length > 0); }); });
  };
  $$('#vgp button', view).forEach(b => b.onclick = () => drawGroups(b.dataset.v));
  drawGroups(F.gp || (s.profile.focus.find(k => X.PARTS.some(p => p.k === k)) || 'p1'));
  setSeg('vpart', F.part); setSeg('vlvl', F.lvl);
  const draw = () => {
    let L = X.VOCAB;
    if (F.part !== 'all') L = L.filter(w => w.parts.includes(+F.part));
    if (F.star) L = L.filter(w => w.star);
    if (F.lvl !== 'all') L = L.filter(w => { const r = s.words[w.id]; return F.lvl === 'new' ? !r : F.lvl === 'weak' ? r && r.lvl < 3 : r && r.lvl >= 3; });
    if (F.q) { const q = F.q.toLowerCase(); L = L.filter(w => w.w.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q)); }
    const per = 60, pages = Math.ceil(L.length / per); F.page = Math.min(F.page, Math.max(0, pages - 1));
    $('#vl', view).innerHTML = L.slice(F.page * per, F.page * per + per).map(w => { const r = s.words[w.id];
      return `<a class="vrow" href="#/vocab/w/${w.id}">${sayBtn(speakable(w))}<span class="w">${esc(w.w)}${w.star ? ' <span style="color:var(--gold)">★</span>' : ''}</span><span class="vi">${esc(w.vi)}</span><span class="tp">P${w.parts.join(', P')} - ${esc(w.topics[0] || '')}</span><span>${r ? mdots(r.lvl) : '<span class="small faint">chưa học</span>'}</span></a>`; }).join('') || '<div class="empty" style="border:0">Không có từ phù hợp.</div>';
    $('#vpg', view).innerHTML = pages > 1 ? `<button class="btn sm" ${F.page === 0 ? 'disabled' : ''} data-pg="-1">${icon('back')}</button><span class="small muted">Trang ${F.page + 1}/${pages} - ${L.length} từ</span><button class="btn sm" ${F.page >= pages - 1 ? 'disabled' : ''} data-pg="1">${icon('arrow')}</button>` : `<span class="small muted">${L.length} từ</span>`;
    $$('[data-pg]', view).forEach(b => b.onclick = () => { F.page += +b.dataset.pg; draw(); window.scrollTo(0, 300); });
    bindSay(view);
  };
  $('#vq', view).oninput = e => { F.q = e.target.value.trim(); F.page = 0; draw(); };
  $$('#vpart button', view).forEach(b => b.onclick = () => { F.part = b.dataset.v; F.page = 0; setSeg('vpart', F.part); draw(); });
  $$('#vlvl button', view).forEach(b => b.onclick = () => { F.lvl = b.dataset.v; F.page = 0; setSeg('vlvl', F.lvl); draw(); });
  $('#vstar', view).onchange = e => { F.star = e.target.checked; F.page = 0; draw(); };
  draw();
});

/* ---------------- word page ---------------- */
X.route(/^\/vocab\/w\/([\w-]+)$/, (view, id) => {
  const w = X.wordById[id]; if (!w) return X.go('#/vocab');
  const r = S().words[id];
  const rel = X.VOCAB.filter(x => x.id !== w.id && x.topics.some(t => w.topics.includes(t))).slice(0, 14);
  view.innerHTML = `<div class="page"><a href="#/vocab" class="small">${icon('back')} Kho từ vựng</a>
    <div class="word-hero" style="margin-top:18px"><div class="hw">${esc(w.w)}</div>${sayBtn(speakable(w))}${w.star ? '<span class="pill gold">★ hay gặp</span>' : ''}${w.parts.map(p => `<span class="pill">Part ${p}</span>`).join('')}</div>
    <div data-wimg="${w.id}" class="wimg hero"></div>${w.exVi ? `<div class="wimg-cap small"><i>${esc(w.ex[0])}</i> - ${esc(w.exVi)}${w.exCtx ? `<div class="muted">${esc(w.exCtx)}</div>` : ''}</div>` : ''}
    ${w.ipa ? `<div class="ipa" style="margin-top:8px">${typeof w.ipa === 'string' ? esc(w.ipa) : `US ${esc(w.ipa.us)} - UK ${esc(w.ipa.uk)}`}${w.pos ? ` - ${esc(w.pos)}` : ''}${w.cefr ? ` - ${esc(w.cefr)}` : ''}</div>` : ''}
    ${w.def ? `<div class="muted" style="margin-top:6px">${esc(w.def)}</div>` : ''}
    <div class="h2" style="margin-top:10px;font-weight:500">${w.senses ? w.senses.map(s2 => `<span class="pill" style="vertical-align:middle">${esc(s2.pos)}</span> ${esc(s2.vi)}`).join('<br>') : esc(w.vi)}</div>
    <div class="grid g2 sec">
      <div class="card"><div class="kicker" style="margin-bottom:8px">Trong ngữ cảnh</div>
        ${w.ex.length ? w.ex.map(e => `<p class="row" style="margin:6px 0">${sayBtn(e.replace(/\(.*?\)/g, ''))}<span>${esc(e)}</span></p>`).join('') : '<p class="muted small">Chưa có câu ví dụ trong giáo trình.</p>'}
        ${w.col.length ? `<div class="kicker" style="margin:14px 0 8px">Cụm hay đi cùng</div><div class="netw">${w.col.map((c, i) => `<span title="${esc(w.colVi ? w.colVi[i] : '')}">${esc(c)}${w.colVi && w.colVi[i] ? ` <small class="faint">- ${esc(w.colVi[i])}</small>` : ''}</span>`).join('')}</div>` : ''}
        ${w.fam && w.fam.length ? `<div class="kicker" style="margin:14px 0 8px">Họ từ</div><table class="dt">${w.fam.map(f => `<tr><td><b>${esc(f.f)}</b></td><td><span class="pill">${esc(f.pos)}</span></td><td class="muted">${esc(f.vi || '')}</td></tr>`).join('')}</table>` : ''}
        ${w.syn && w.syn.length ? `<div class="kicker" style="margin:14px 0 8px">Đồng nghĩa</div><div class="netw">${w.syn.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
        ${w.topics.length ? `<div class="kicker" style="margin:14px 0 6px">Chủ đề</div><div class="small muted">${w.topics.map(esc).join(' - ')}</div>` : ''}</div>
      <div class="card"><div class="kicker" style="margin-bottom:8px">Mức độ của bạn</div>
        ${r ? `<div class="row">${mdots(r.lvl)}<b>${X.LEVELS[r.lvl]}</b></div><div class="small muted" style="margin-top:6px">Đã ôn ${r.reps} lần - sai ${r.lapses} lần - ôn lại ${r.due <= Date.now() ? 'hôm nay' : 'ngày ' + fmtDate(r.due)}</div>` : '<div class="muted">Chưa học từ này.</div>'}
        <div class="small muted" style="margin-top:14px;line-height:1.8">${X.LEVELS.slice(1).map((n, i) => `<div>${mdots(i + 1)} ${n}${['', ': chọn đúng nghĩa khi đọc hoặc nghe', ': đúng ở 2 kiểu bài khác nhau', ': tự gõ lại đúng từ', ': vẫn nhớ sau 3 tuần'][i + 1]}</div>`).join('')}</div>
        <div class="row" style="margin-top:14px"><a class="btn pri sm" href="#/vocab/deep/${w.id}">${icon('scan')} Học sâu từ này</a><button class="btn sm" id="w-learn">${r ? 'Ôn nhanh' : 'Học nhanh'}</button></div>
        ${w.note ? `<div class="card tint" style="margin-top:14px;padding:12px 14px"><div class="small"><b>Lưu ý:</b> ${esc(w.note)}</div></div>` : ''}${w.para ? `<div class="small muted" style="margin-top:10px"><b>Đề hay nói lại:</b> ${esc(w.para)}</div>` : ''}${w.ant && w.ant.length ? `<div class="small muted" style="margin-top:6px"><b>Trái nghĩa:</b> ${w.ant.map(esc).join(', ')}</div>` : ''}</div>
    </div>
    ${rel.length ? `<div class="sec"><div class="kicker" style="margin-bottom:10px">Cùng chủ đề</div><div class="netw">${rel.map(x => `<a href="#/vocab/w/${x.id}"><span>${esc(x.w)}</span></a>`).join('')}</div></div>` : ''}</div>`;
  bindSay(view); X.imgFill && X.imgFill(view);
  $('#w-learn', view).onclick = () => session(view, [w], r ? 'review' : 'learn');
});

/* ---------------- exercises ---------------- */
const pool = () => X.VOCAB;
function exerciseFor(w, rec) {
  const lvl = rec ? rec.lvl : 0;
  const types = [];
  const short = w.kind === 'word' && w.w.length <= 28 && !/[.?!]/.test(w.w);
  const ex = window.CLOZE && window.CLOZE[w.id] === 0 ? null : (w.ex || []).find(e => !/→/.test(e) && e.toLowerCase().includes(w.w.toLowerCase().split(' / ')[0]) && w.w.length > 2);
  if (lvl <= 1) types.push('en2vi', 'en2vi', 'listen');
  else if (lvl === 2) { types.push('vi2en', 'listen'); if (ex) types.push('cloze'); if (short) types.push('type'); }
  else { if (short) types.push('type', 'type'); types.push('vi2en'); if (ex) types.push('cloze'); }
  const t = types[Math.random() * types.length | 0];
  const near = pool().filter(x => x.id !== w.id && x.vi !== w.vi && x.w !== w.w && x.parts.some(p => w.parts.includes(p)) && x.kind === w.kind);
  const dis = sample(near.length >= 3 ? near : pool().filter(x => x.id !== w.id), 3);
  const opts = shuffle([w, ...dis]);
  if (t === 'en2vi') return { t, prompt: `<div class="hw">${esc(w.w)}</div>${sayBtn(speakable(w))}`, opts: opts.map(x => x.vi), a: opts.indexOf(w), say: speakable(w) };
  if (t === 'vi2en') return { t, prompt: `<div class="mean">${esc(w.vi)}</div><div class="small faint">Chọn từ tiếng Anh</div>`, opts: opts.map(x => x.w), a: opts.indexOf(w) };
  if (t === 'listen') return { t, prompt: `<button class="btn syn lg" id="ex-play">${icon('vol')} Nghe</button><div class="small faint" style="margin-top:8px">Nghe rồi chọn nghĩa đúng</div>`, opts: opts.map(x => x.vi), a: opts.indexOf(w), say: speakable(w), auto: true };
  if (t === 'cloze') { const key = w.w.split(' / ')[0]; const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); const sent = ex.replace(/\(.*?\)/g, '').replace(re, '______');
    const cz = window.CLOZE && window.CLOZE[w.id], o2 = cz ? shuffle([w.w, ...cz]) : opts.map(x => x.w);   // phương án viết tay: cùng dạng, chỉ một từ hợp câu
    return { t, prompt: `<div class="mean" style="font-family:var(--f-display)">${esc(sent)}</div><div class="small faint">Chọn từ điền vào chỗ trống</div>`, opts: o2, a: o2.indexOf(w.w), after: ex }; }
  return { t: 'type', prompt: `<div class="mean">${esc(w.vi)}</div><div class="small faint">Gõ từ tiếng Anh - gợi ý: <b class="mono">${esc(w.w[0])}${'_'.repeat(Math.max(0, w.w.split(' / ')[0].length - 1)).replace(/(.)/g, '$1 ')}</b></div>`, answer: w.w };
}
const normAns = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const typeOk = (inp, w) => { const n = normAns(inp); return n && w.split(/\s*\/\s*|,\s*/).some(v => normAns(v) === n); };

/* ---------------- session (learn or review) ---------------- */
function session(view, words, kind) {
  const queue = [];
  if (kind === 'learn') words.forEach(w => queue.push({ w, show: true }));
  words.forEach(w => queue.push({ w }));
  if (kind === 'learn') shuffle(words).forEach(w => queue.push({ w, second: true }));
  let i = 0, ok = 0, n = 0; const t0 = Date.now(); const missed = new Set(), requeued = new Set();
  const draw = () => {
    TTS.stop();
    if (i >= queue.length) return finish();
    const q = queue[i], w = q.w, rec = S().words[w.id];
    const head = `<div class="qz-top"><a class="icon-btn" href="#/vocab">${icon('x')}</a><div><div class="kicker">${kind === 'learn' ? 'Học từ mới' : 'Ôn từ vựng'}</div></div><div class="bar"><i style="width:${pct(i, queue.length)}%"></i></div><span class="count">${i + 1}/${queue.length}</span></div>`;
    if (q.show) {
      view.innerHTML = `<div class="page"><div class="qz">${head}<div class="card vcard"><div class="row" style="justify-content:center">${w.parts.map(p => `<span class="pill">Part ${p}</span>`).join('')}${w.star ? '<span class="pill gold">★ hay gặp</span>' : ''}</div>
        <div class="hw">${esc(w.w)}</div>${sayBtn(speakable(w))}<div class="mean">${esc(w.vi)}</div>
        ${w.ex[0] ? `<p class="muted">${sayBtn(w.ex[0].replace(/\(.*?\)/g, ''))} <i>${esc(w.ex[0])}</i></p>` : ''}${w.col.length ? `<div class="netw" style="justify-content:center">${w.col.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}${w.syn ? `<p class="small muted">Đề hay viết lại: ${w.syn.map(esc).join(', ')}</p>` : ''}
        <div class="small faint" style="margin-top:8px">${esc(w.topics[0] || '')}</div>
        <div class="row" style="justify-content:center;margin-top:20px"><button class="btn pri lg" id="vs-n">Đã xem ${icon('arrow')}</button></div></div></div></div>`;
      bindSay(view); X.say(speakable(w));
      $('#vs-n', view).onclick = () => { i++; draw(); }; document.onkeydown = e => { if (e.key === 'Enter') { i++; draw(); } };
      return;
    }
    const ex = exerciseFor(w, kind === 'learn' && !q.second ? null : rec);
    const st = Date.now();
    view.innerHTML = `<div class="page"><div class="qz">${head}<div class="card vcard"><div class="kicker">${{ en2vi: 'Chọn nghĩa', vi2en: 'Chọn từ', listen: 'Nghe', cloze: 'Điền vào câu', type: 'Nhớ chủ động' }[ex.t]}</div>
      <div style="margin:14px 0">${ex.prompt}</div>
      ${ex.t === 'type' ? `<input class="inp type-in" id="vs-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="gõ từ…"><div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="vs-skip">Không nhớ</button><button class="btn pri" id="vs-ok">Kiểm tra</button></div>`
        : `<div class="opts" style="text-align:left">${ex.opts.map((o, k) => `<button class="opt" data-o="${k}"><span class="L">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>`}
      <div id="vs-fb"></div></div></div></div>`;
    bindSay(view);
    const pl = $('#ex-play', view); if (pl) pl.onclick = () => X.say(ex.say);
    if (ex.auto) setTimeout(() => X.say(ex.say), 200);
    let done = false;
    const grade = (good, typed) => {
      if (done) return; done = true;
      const ms = Date.now() - st; n++;
      if (good) ok++; else missed.add(w.id);
      let g = good ? (ms > 9000 ? 2 : 3) : 1; if (good && typed && ms < 7000) g = 4;
      if (!(kind === 'learn' && !q.second)) { const r = X.srsReview(w.id, g, ex.t); if (!r.first) r.first = Date.now(); }
      else if (!S().words[w.id]) { S().words[w.id] = { s: 0, d: 5, due: 0, reps: 0, lapses: 0, lvl: 0, types: [], first: Date.now() }; X.save(); }
      if (good) X.addXP(1);
      if (!good && kind === 'review' && !requeued.has(w.id)) { requeued.add(w.id); queue.push({ w, second: true }); }
      $$('[data-o]', view).forEach((b, k) => { b.disabled = true; if (k === ex.a) b.classList.add('ok'); });
      $('#vs-fb', view).innerHTML = `<div class="fb ${good ? 'ok' : 'bad'}" style="text-align:left"><b class="h">${good ? 'Đúng' : 'Chưa đúng'}</b><b>${esc(w.w)}</b> = ${esc(w.vi)}${ex.after ? `<div><i>${esc(ex.after)}</i></div>` : ''}</div><div class="row" style="justify-content:center;margin-top:14px"><button class="btn pri" id="vs-n">Tiếp ${icon('arrow')}</button></div>`;
      if (!good || ex.t === 'type') X.say(speakable(w));
      $('#vs-n', view).onclick = () => { i++; draw(); };
      setTimeout(() => { document.onkeydown = e => { if (e.key === 'Enter') { i++; draw(); } }; }, 50);
    };
    if (ex.t === 'type') {
      const inp = $('#vs-in', view); inp.focus();
      const chk = () => { const good = typeOk(inp.value, ex.answer); if (!good) inp.style.borderColor = 'var(--red)'; else inp.style.borderColor = 'var(--sage)'; grade(good, true); };
      $('#vs-ok', view).onclick = chk; $('#vs-skip', view).onclick = () => grade(false, true);
      document.onkeydown = e => { if (e.key === 'Enter' && !done) chk(); };
    } else {
      $$('[data-o]', view).forEach(b => b.onclick = () => { const k = +b.dataset.o; if (k !== ex.a) b.classList.add('bad'); grade(k === ex.a); });
      document.onkeydown = e => { if (/^[1-4]$/.test(e.key) && !done) { const k = +e.key - 1; const b = $$('[data-o]', view)[k]; if (b) b.click(); } };
    }
  };
  const finish = () => {
    if (kind === 'learn') words.forEach(w => { const r = S().words[w.id]; if (r && !r.reps) X.srsReview(w.id, missed.has(w.id) ? 2 : 3, 'en2vi'); });
    X.addXP(kind === 'learn' ? 5 : 3, kind === 'learn' ? 'Học xong từ mới' : 'Ôn xong');
    const left = X.wordDue().length;
    view.innerHTML = `<div class="page"><div class="kicker">${kind === 'learn' ? 'Học từ mới' : 'Ôn từ vựng'}</div><h1 class="h1">${ok}/${n} lượt đúng - ${Math.round((Date.now() - t0) / 60000) || 1} phút</h1>
      <p class="lead">${kind === 'learn' ? 'Các từ này sẽ quay lại vào ngày mai. Ôn đúng lúc sắp quên giúp nhớ lâu gấp nhiều lần đọc lại.' : left ? `Còn ${left} từ đến hạn.` : 'Đã ôn hết từ đến hạn hôm nay.'}</p>
      <div class="row sec">${left ? `<a class="btn pri" href="#/vocab/review" id="again">Ôn tiếp ${left} từ</a>` : ''}<a class="btn" href="#/vocab/learn">Học thêm từ mới</a><a class="btn ${left ? '' : 'pri'}" href="#/today">Về Hôm nay</a></div></div>`;
    const ag = $('#again', view); if (ag) ag.onclick = e => { e.preventDefault(); X.render(); };
  };
  draw();
}

X.route(/^\/vocab\/review$/, view => {
  const ids = X.wordDue();
  if (!ids.length) {
    view.innerHTML = `<div class="page"><div class="kicker">Ôn từ vựng</div><h1 class="h1">Không có từ nào đến hạn.</h1><p class="lead">Từ đã học sẽ quay lại đúng lúc sắp quên. Trong lúc chờ, học thêm từ mới hoặc luyện Lab.</p><div class="row sec"><a class="btn pri" href="#/vocab/learn">Học từ mới</a><a class="btn" href="#/lab">Lab phản xạ</a></div></div>`;
    return;
  }
  const words = ids.sort((a, b) => S().words[a].due - S().words[b].due).slice(0, 25).map(id => X.wordById[id]).filter(Boolean);
  session(view, words, 'review');
});

X.route(/^\/vocab\/learn(?:\/(.+))?$/, (view, grp) => {
  const s = S(); const n = Math.max(4, Math.min(10, s.profile.newWords || 8));
  if (grp) { const [g, t] = grp.split('@'); const ws = X.VOCAB.filter(w => w.group === g && w.topic === t); const fresh = ws.filter(w => !s.words[w.id]); const pick = (fresh.length ? fresh : ws.sort((a, b) => (s.words[a.id]?.lvl || 0) - (s.words[b.id]?.lvl || 0))).slice(0, n);
    return X.vocabGame(view, shuffle(pick), { title: g, back: '#/vocab', onDone: () => {} }); }
  const focusParts = s.profile.focus.flatMap(k => (X.PARTS.find(p => p.k === k) || { parts: [] }).parts); if (!focusParts.length) focusParts.push(1, 2, 3, 4, 5, 6, 7);
  const cand = X.VOCAB.filter(w => !s.words[w.id] && w.parts.some(p => focusParts.includes(p))).sort((a, b) => (b.freq || 0) - (a.freq || 0));
  if (!cand.length) return X.go('#/vocab');
  // keep one semantic group together
  const g0 = cand[0]; const same = cand.filter(w => w.group === g0.group && w.topic === g0.topic);
  const words = [...same, ...cand.filter(w => !same.includes(w))].slice(0, n);
  X.vocabGame(view, words, { title: `${g0.group}`, back: '#/vocab', onDone: () => {} });
});

/* ---------------- rich journey (reimburse template) ---------------- */
X.route(/^\/vocab\/journey\/(.+)$/, (view, key) => {
  const W = (window.RICH || {})[key]; if (!W) return X.go('#/vocab');
  const sec = (n, stage, title, body, dark) => `<section class="jsec ${dark ? 'dark' : ''}"><div><div class="n">${n}</div><div class="stg">${stage}</div></div><div><h3>${title}</h3>${body}</div></section>`;
  const mastery = { predict: 0, colloc: 0, compare: 0, recall: 0, speed: 0, listen: 0 };
  view.innerHTML = `<div class="page"><a href="#/vocab" class="small">${icon('back')} Kho từ vựng</a>
    <div class="kicker syn" style="margin-top:18px">Học sâu một từ - 13 bước</div>
    <div class="word-hero"><div class="hw" style="font-size:64px">${esc(W.headword)}</div>${sayBtn(W.headword)}</div>
    <div class="ipa" style="margin:8px 0 6px">US ${esc(W.ipaUS)} - UK ${esc(W.ipaUK)}</div>
    <p class="lead">Không học nghĩa trước. Đoán, nhìn, nghe, nối với từ khác, rồi mới kéo ra từ trí nhớ và đo tốc độ nhận ra.</p>
    ${sec('01', 'Attention', 'Đoán trước khi được cho biết', `<div class="q-prompt">${esc(W.prediction.sentence)}</div><div class="row" style="margin-top:12px" id="j-pred">${shuffle([W.prediction.answer, 'refund', 'compensate', 'charge']).map(o => `<button class="btn" data-v="${o}">${o}</button>`).join('')}</div><div id="j-pred-fb" class="small" style="margin-top:10px"></div>`)}
    ${sec('02', 'Encoding', 'Nhìn chuỗi tình huống trước khi xem định nghĩa', `<div class="chain">${W.visual.map((v, i) => `<div class="s"><div class="kicker">${i + 1}</div>${esc(v)}</div>${i < W.visual.length - 1 ? icon('arrow') : ''}`).join('')}</div>`)}
    ${sec('03', 'Encoding', 'Nghe hình dạng âm của từ', `<div class="row"><button class="btn" data-say="${esc(W.headword)}">${icon('vol')} Bình thường</button><button class="btn" id="j-slow">${icon('vol')} Chậm</button><span class="ipa">${esc(W.ipaUS)}</span></div><p class="small muted">Trọng âm rơi vào âm tiết thứ hai: re-<b>IM</b>-burse.</p>`)}
    ${sec('04', 'Encoding', 'Nghĩa, thu hẹp qua 3 lượt', `<p><span class="pill">English</span> ${esc(W.meaning.english)}</p><p><span class="pill">Simple</span> ${esc(W.meaning.simple)}</p><p><span class="pill syn">Tiếng Việt</span> <b>${esc(W.meaning.vietnamese)}</b></p>`)}
    ${sec('05', 'Association', 'Một từ không bao giờ đứng một mình', `<div class="netw"><span class="c">${esc(W.network.center)}</span>${W.network.nodes.map(n => `<span>${esc(n)}</span>`).join('')}</div>`)}
    ${sec('06', 'Association', 'Nó thật sự đi với từ nào?', `<p class="small muted">Chọn tất cả cụm đúng, rồi bấm kiểm tra.</p><div class="netw" id="j-col">${shuffle([...W.collocations.correct.map(c => [c, 1]), ...W.collocations.incorrect.map(c => [c, 0])]).map(([c, ok]) => `<button class="btn sm" data-ok="${ok}">reimburse ${esc(c)}</button>`).join('')}</div><button class="btn pri sm" style="margin-top:12px" id="j-col-ck">Kiểm tra</button><div id="j-col-fb" class="small" style="margin-top:8px"></div>`)}
    ${sec('07', 'Association', 'Cùng một từ, sáu căn phòng khác nhau', `<div class="grid g2">${W.contexts.map(c => `<div class="card flat" style="padding:14px"><span class="pill">${esc(c.tag)}</span><p style="margin:8px 0 0">${esc(c.sentence)} ${sayBtn(c.sentence)}</p></div>`).join('')}</div>`)}
    ${sec('08', 'Association', 'Refund, reimburse hay compensate?', W.compare.map((c, i) => `<div class="card flat" style="margin-bottom:10px;padding:14px"><p style="margin:0 0 8px">${esc(c.situation)}</p><div class="row" data-cmp="${i}">${['refund', 'reimburse', 'compensate'].map(o => `<button class="btn sm" data-v="${o}">${o}</button>`).join('')}</div><div class="small muted" style="margin-top:8px;display:none">${esc(c.note)}</div></div>`).join(''))}
    ${sec('09', 'Retrieval', 'Nghe trước khi đọc', `${W.listening.map((l, i) => `<div class="row" style="margin:8px 0"><button class="btn sm" data-li="${i}" style="background:transparent;color:var(--paper);border-color:#444">${icon('play')} Câu ${i + 1}</button><span class="small" style="color:#9A9DA8" id="j-li-${i}">bấm để nghe, đoán câu rồi mới hiện chữ</span></div>`).join('')}`, true)}
    ${sec('10', 'Retrieval', 'Kéo ra từ trí nhớ, không nhìn', `<p>Gõ từ có nghĩa: <b>${esc(W.recall.prompt)}</b></p><div class="row"><input class="inp" id="j-rc" style="max-width:260px" autocomplete="off"><button class="btn pri" id="j-rc-ck">Kiểm tra</button><button class="btn ghost" id="j-rc-h">Gợi ý</button></div><div id="j-rc-fb" class="small" style="margin-top:8px"></div>`)}
    ${sec('11', 'Retrieval', 'Để nó trôi qua mắt', `${W.reading.map(r => `<p style="margin:6px 0">${esc(r).replace(/(reimburs\w*)/gi, '<mark>$1</mark>')}</p>`).join('')}`)}
    ${sec('12', 'Automatic Recognition', 'Nhận ra nhanh đến mức nào?', `<p class="small muted">Một từ hiện lên. Nếu là <b>reimburse</b> (mọi dạng) thì bấm <kbd>Space</kbd>, không phải thì bỏ qua. 10 lượt.</p><div class="flash" id="j-sp" style="border:1px solid var(--line);border-radius:12px">Sẵn sàng</div><button class="btn pri" id="j-sp-go">Bắt đầu</button> <span id="j-sp-fb" class="small"></span>`)}
    ${sec('13', 'Consolidation', 'Không phải một điểm số. Sáu năng lực.', `<div id="j-m"></div><button class="btn syn" style="margin-top:14px" id="j-save">Đưa reimburse vào lịch ôn</button>`)}
  </div>`;
  bindSay(view);
  const drawM = () => { $('#j-m', view).innerHTML = [['predict', 'Đoán từ ngữ cảnh'], ['colloc', 'Collocation'], ['compare', 'Phân biệt từ gần nghĩa'], ['listen', 'Nhận ra khi nghe'], ['recall', 'Nhớ chủ động'], ['speed', 'Tốc độ nhận ra']].map(([k, n]) => `<div class="hbar"><span>${n}</span><div class="bar sage"><i style="width:${mastery[k]}%"></i></div><span class="mono small">${mastery[k]}</span></div>`).join(''); };
  drawM();
  $$('#j-pred button', view).forEach(b => b.onclick = () => { const ok = b.dataset.v === W.prediction.answer; b.classList.add(ok ? 'syn' : ''); $('#j-pred-fb', view).innerHTML = ok ? '✓ Đúng. Ngữ cảnh "company … employees … travel expenses" đã đủ để đoán.' : `Chưa đúng. Công ty trả lại tiền cho nhân viên đã chi → <b>${W.prediction.answer}</b>.`; mastery.predict = ok ? 100 : 40; drawM(); });
  $('#j-slow', view).onclick = () => { TTS.stop(); TTS.speak(W.headword, { rate: 0.6 }); };
  $$('#j-col button', view).forEach(b => b.onclick = () => b.classList.toggle('pri'));
  $('#j-col-ck', view).onclick = () => { const bs = $$('#j-col button', view); const good = bs.filter(b => (b.dataset.ok === '1') === b.classList.contains('pri')).length; bs.forEach(b => b.style.borderColor = b.dataset.ok === '1' ? 'var(--sage)' : 'var(--red)'); mastery.colloc = pct(good, bs.length); $('#j-col-fb', view).textContent = `${good}/${bs.length} đúng. Viền xanh = cụm đúng.`; drawM(); };
  let cmpOk = 0;
  $$('[data-cmp]', view).forEach(row => $$('button', row).forEach(b => b.onclick = () => { const c = W.compare[+row.dataset.cmp]; const ok = b.dataset.v === c.answer; if (ok) cmpOk++; $$('button', row).forEach(x => { x.disabled = true; if (x.dataset.v === c.answer) x.classList.add('syn'); }); row.nextElementSibling.style.display = 'block'; mastery.compare = pct(cmpOk, W.compare.length); drawM(); }));
  let heard = 0;
  $$('[data-li]', view).forEach(b => b.onclick = async () => { const l = W.listening[+b.dataset.li]; TTS.stop(); await TTS.speak(l.text, { rate: l.rate }); $('#j-li-' + b.dataset.li, view).textContent = l.text; heard++; mastery.listen = pct(heard, W.listening.length); drawM(); });
  let hint = 0;
  $('#j-rc-h', view).onclick = () => { $('#j-rc-fb', view).textContent = W.recall.hints[Math.min(hint++, W.recall.hints.length - 1)]; };
  $('#j-rc-ck', view).onclick = () => { const ok = typeOk($('#j-rc', view).value, W.recall.answer); $('#j-rc-fb', view).innerHTML = ok ? '✓ Đúng' : `Đáp án: <b>${W.recall.answer}</b>`; mastery.recall = ok ? Math.max(40, 100 - hint * 20) : 20; drawM(); };
  $('#j-sp-go', view).onclick = () => {
    const words = shuffle(['reimburse', 'reimbursed', 'reimbursement', 'refund', 'reimburse', 'remind', 'release', 'reimbursing', 'resemble', 'reimburse']);
    let k = 0, hit = 0, ms = 0, shownAt = 0, pressed = false; const el = $('#j-sp', view);
    const step = () => {
      if (k > 0) { const prev = words[k - 1], target = /^reimburs/.test(prev); if (target === pressed) hit++; }
      if (k >= words.length) { document.onkeydown = null; mastery.speed = pct(hit, words.length); el.textContent = `${hit}/${words.length} đúng`; $('#j-sp-fb', view).textContent = ms ? `Phản xạ trung bình ${(ms / Math.max(1, words.filter(w => /^reimburs/.test(w)).length)).toFixed(0)} ms` : ''; drawM(); return; }
      pressed = false; el.textContent = words[k]; shownAt = Date.now(); k++; setTimeout(step, 1100);
    };
    document.onkeydown = e => { if (e.key === ' ') { e.preventDefault(); if (!pressed) { pressed = true; ms += Date.now() - shownAt; el.style.background = 'var(--syn-soft)'; setTimeout(() => el.style.background = '', 150); } } };
    step();
  };
  $('#j-save', view).onclick = () => { const w = X.VOCAB.find(x => x.w.toLowerCase() === W.headword); if (w && !S().words[w.id]) X.srsReview(w.id, 3, 'en2vi'); X.addXP(10, 'Học sâu xong một từ'); X.toast('Đã đưa vào lịch ôn'); };
});
X.RICH = true;
})();
