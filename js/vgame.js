/* TOOEZ — Vocabulary game (6 rounds) + generic deep journey for any word */
'use strict';
(() => {
const { $, $$, esc, icon, pct, shuffle, sample, TTS } = X;
const S = () => X.S();
const say = t => X.say(t);
const head = w => w.w.split(' / ')[0].replace(/\.\.\.|…/g, '').trim();
const normA = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const typeOk = (inp, w) => { const n = normA(inp); return !!n && w.w.split(/\s*\/\s*|;\s*/).some(v => normA(v) === n); };
const blank = (sent, w) => { if (/→/.test(sent) || (window.CLOZE && window.CLOZE[w.id] === 0)) return null; const k = head(w); const stem = k.length > 5 ? k.slice(0, k.length - 2) : k; const re = new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*`, 'i'); return re.test(sent) ? sent.replace(re, '_____') : null; };

/* Distractors for fill-in-the-blank: must NOT fit the sentence.
   1) never same semantic group, never a synonym/collocate of the target;
   2) prefer a different part of speech (grammatically impossible in the blank);
   3) otherwise a word from a different topic (semantically impossible). */
const POS1 = p => /^n|danh/.test(p) ? 'n' : /^(v|phr v)/.test(p) ? 'v' : /^adj/.test(p) ? 'adj' : /^adv/.test(p) ? 'adv' : /^(prep|conj|det|pron)/.test(p) ? 'fn' : '';
const POSS = p => new Set(String(p || '').toLowerCase().split('/').map(x => POS1(x.trim())).filter(Boolean));
X.clozeDistract = (w, n) => {
  const tgt = head(w).toLowerCase(), tp = POSS(w.pos);
  const bad = new Set([tgt, ...(w.syn || []).map(x => x.toLowerCase()), ...(w.fam || []).map(f => String(f.f).toLowerCase())]);
  const ok = x => x.id !== w.id && x.kind === 'word' && x.group !== w.group && !bad.has(head(x).toLowerCase()) && !(x.syn || []).some(y => y.toLowerCase() === tgt) && head(x).split(' ').length <= 3;
  const pool = X.VOCAB.filter(ok);
  const disjoint = x => { const xp = POSS(x.pos); return xp.size > 0 && tp.size > 0 && [...xp].every(k => !tp.has(k)); };
  const samePartOtherPos = pool.filter(x => disjoint(x) && x.parts.some(p => w.parts.includes(p)));
  const otherPos = pool.filter(disjoint);
  const out = sample(samePartOtherPos, n);
  if (out.length < n) out.push(...sample(otherPos.filter(x => !out.includes(x)), n - out.length));
  if (out.length < n) out.push(...sample(pool.filter(x => !out.includes(x) && x.topic !== w.topic && x.parts.every(p => !w.parts.includes(p))), n - out.length));
  return out;
};
/* ---- Phương án nhiễu "có nghề": cùng kiểu, cùng dạng, nhìn qua thấy hợp lý, phải hiểu mới loại được ---- */
const lev = (a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const lc = x => String(x || '').toLowerCase().replace(/\.\.\.|…|\?/g, '').trim();
const related = (w, x) => { const A = new Set([w.w, ...(w.syn || []), ...(w.fam || []).map(f => f.f)].map(lc)), B = [x.w, ...(x.syn || []), ...(x.fam || []).map(f => f.f)].map(lc); return B.some(b => A.has(b)); };
const nWords = t => String(t).trim().split(/\s+/).length;
const uniq = arr => { const seen = new Set(); return arr.filter(t => { const k = lc(t); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
/* mode: 'cloze' (điền vào câu: chuỗi từ), 'syn' (cách nói khác: chuỗi), 'mean' (nghĩa tiếng Việt), 'sound' (nghe: từ na ná) */
X.smartOpts = (w, n, mode) => {
  const tp = POSS(w.pos), same = x => { const xp = POSS(x.pos); return tp.size ? [...xp].some(k => tp.has(k)) : String(x.pos) === String(w.pos); };
  const base = X.VOCAB.filter(x => x.id !== w.id && x.kind === w.kind && !related(w, x));
  const sharePart = x => x.parts.some(p => w.parts.includes(p));
  const rank = (arr, f) => shuffle(arr).sort((a, b) => f(b) - f(a));
  let out = [];
  if (mode === 'syn') {
    const right = w.syn[0], L = nWords(right);
    const ant = (w.ant || []).filter(a => nWords(a) <= L + 2).slice(0, 1);       // trái nghĩa: hay bị chọn nhầm khi đọc vội
    // cùng nhóm thì phải khác chủ đề (tránh gần nghĩa), khác nhóm thì phải cùng từ loại và cùng Part
    const cands = base.filter(x => x.syn && x.syn.length && same(x) && (x.group === w.group ? x.topic !== w.topic : sharePart(x)))
      .map(x => x.syn[0]).filter(t => Math.abs(nWords(t) - L) <= 2);
    // ưu tiên phương án cùng "dáng": cùng là câu hỏi / câu nói, cùng từ mở đầu, độ dài gần nhau
    const q = /\?\s*$/.test(right), w0 = right.split(/\s+/)[0].toLowerCase();
    const shape = t => (/\?\s*$/.test(t) === q ? 3 : 0) + (t.split(/\s+/)[0].toLowerCase() === w0 ? 2 : 0) - Math.abs(nWords(t) - L) * 0.5;
    out = uniq([...ant, ...rank(cands, shape)]).filter(t => lc(t) !== lc(right));
    return out.slice(0, n);
  }
  if (mode === 'mean') {
    const c = rank(base.filter(x => x.vi && x.vi !== w.vi && same(x)), x => (x.topic === w.topic ? 2 : 0) + (sharePart(x) ? 1 : 0));
    return uniq(c.map(x => x.vi)).slice(0, n);
  }
  const k = head(w);
  if (mode === 'cloze' && window.CLOZE && window.CLOZE[w.id]) return shuffle(window.CLOZE[w.id]).slice(0, n);
  const look = rank(base.filter(x => x.kind === 'word' && lev(head(x), k) <= Math.max(2, Math.floor(k.length / 3))), x => -lev(head(x), k)).map(x => head(x));
  if (mode === 'sound') {
    const rest = rank(base.filter(same), x => (x.topic === w.topic ? 2 : 0) + (head(x)[0] === k[0] ? 1 : 0)).map(x => head(x));
    return uniq([...look, ...rest]).filter(t => lc(t) !== lc(k)).slice(0, n);
  }
  // cloze: 1 dạng khác của chính từ đó (bẫy từ loại kiểu Part 5) + 1 từ na ná + còn lại cùng từ loại, khác chủ đề (nghĩa không hợp câu)
  // chỉ dùng bẫy từ loại khi câu mẫu dùng đúng nguyên dạng từ (không phải leaning, extended...) và dạng kia khác từ loại hẳn
  const exact = (w.ex || []).concat(w.col || []).some(e => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(e));
  const usedForms = new Set(((w.ex || []).concat(w.col || []).join(' ').toLowerCase().match(/[a-z]+/g)) || []);
  const forms = exact ? (w.fam || []).filter(f => f.f && !/\s/.test(f.f) && lc(f.f) !== lc(k) && !usedForms.has(lc(f.f)) && ![...POSS(f.pos)].some(q => tp.has(q))).map(f => f.f) : [];
  const samePos = rank(base.filter(x => same(x) && x.topic !== w.topic && x.group !== w.group && nWords(head(x)) <= 3), x => sharePart(x) ? 1 : 0).map(x => head(x));
  const look1 = /\s/.test(k) ? [] : look.filter(t => !usedForms.has(lc(t)) && !/\s/.test(t));   // cụm động từ: không dùng cụm na ná (pick up / pick out dễ cùng đúng)
  out = uniq([...forms.slice(0, 1), ...look1.slice(0, 1), ...samePos]).filter(t => lc(t) !== lc(k));
  if (out.length < n) out = uniq(out.concat(rank(base.filter(x => x.topic !== w.topic && x.group !== w.group), () => 0).map(x => head(x)))).filter(t => lc(t) !== lc(k));
  if (out.length < n) out = uniq(out.concat(rank(base.filter(x => x.topic !== w.topic || x.group !== w.group), () => 0).map(x => head(x)))).filter(t => lc(t) !== lc(k));
  return out.slice(0, n);
};
X.clozeHint = w => `<button class="btn sm ghost" type="button" onclick="this.outerHTML=this.dataset.h" data-h="${esc(w.def ? `Gợi ý: <i>${esc(w.def)}</i>` : `Gợi ý: ${esc(w.vi)}`)}">Cần gợi ý?</button>`;

const ROUNDS = [
  { k: 'discover', n: 'Khám phá', d: 'Đoán từ trong câu rồi xem thẻ từ', ab: 'Đoán từ ngữ cảnh' },
  { k: 'match', n: 'Ghép nghĩa', d: 'Ghép từ với định nghĩa', ab: 'Hiểu nghĩa' },
  { k: 'listen', n: 'Nghe', d: 'Nghe và chọn đúng từ', ab: 'Nhận ra khi nghe' },
  { k: 'react', n: 'Phản xạ', d: '4 giây mỗi từ, giữ combo', ab: 'Phản xạ' },
  { k: 'apply', n: 'Vận dụng', d: 'Điền vào câu, cụm, cách nói khác', ab: 'Vận dụng' },
  { k: 'recall', n: 'Nhớ lại', d: 'Nhìn nghĩa, tự gõ lại từ', ab: 'Nhớ chủ động' },
];

X.vocabGame = (view, words, o = {}) => {
  // phiên làm dở: nhớ bộ từ và vòng đang chơi; quay lại sẽ vào đúng vòng đó
  const sKey = X.hereKey(), sv = X.sessGet(sKey);
  if (sv && sv.kind === 'vg') { const ws = sv.ids.map(id => X.wordById[id]); if (ws.every(Boolean)) words = ws; }
  if (!words.length) { view.innerHTML = `<div class="page"><div class="empty">Không có từ cho trạm này.</div></div>`; return; }
  const st = { r: 0, combo: 0, best: 0, xp: 0, score: Object.fromEntries(ROUNDS.map(r => [r.k, [0, 0]])), wrong: {}, t0: Date.now() };
  if (sv && sv.kind === 'vg' && words.length === sv.ids.length) Object.assign(st, { r: sv.r, xp: sv.xp || 0, score: sv.score || st.score, wrong: sv.wrong || {} });
  const persist = () => X.sessSet(sKey, { kind: 'vg', title: (o.title || 'Từ vựng') + ' - vòng ' + (st.r + 1) + '/6', n: 0, i: 0, ids: words.map(w => w.id), r: st.r, xp: st.xp, score: st.score, wrong: st.wrong });
  const distract = (w, n, field) => { const pool = X.VOCAB.filter(x => x.id !== w.id && x[field] && x[field] !== w[field] && x.kind === w.kind); const near = pool.filter(x => x.parts.some(p => w.parts.includes(p)) && x.topic === w.topic); return sample(near.length >= n ? near : pool, n); };
  const mark = (rk, ok, w) => { X.logAttempt({ id: 'v:' + w.id, part: w.parts[0], skill: 'Từ vựng' }, ok, 0, '', 'vgame:' + rk); st.score[rk][1]++; X.react && setTimeout(() => X.react(ok, null, ok ? st.combo + 1 : 0), 10); if (ok) { st.score[rk][0]++; st.combo++; st.best = Math.max(st.best, st.combo); const g = 1 + (st.combo % 5 === 0 ? 2 : 0); st.xp += g; X.addXP(g); } else { st.combo = 0; st.wrong[w.id] = (st.wrong[w.id] || 0) + 1; } hud(); };
  const hud = () => { const h = $('#vg-hud', view); if (h) h.innerHTML = `<span class="combo ${st.combo >= 3 ? 'hot' : ''}">${icon('bolt')} combo ×${st.combo}</span><span class="mono small">+${st.xp} XP</span>`; };
  const shell = (body, sub) => {
    view.innerHTML = `<div class="page"><div class="qz" style="max-width:820px">
      <div class="qz-top"><a class="icon-btn" href="${o.back || '#/vocab'}">${icon('x')}</a><div><div class="kicker">${esc(o.title || 'Từ vựng')}</div><div class="h3">Vòng ${st.r + 1}/6 - ${ROUNDS[st.r].n}</div></div>
        <div class="rounds">${ROUNDS.map((r, i) => `<i class="${i < st.r ? 'on' : i === st.r ? 'cur' : ''}" title="${r.n}"></i>`).join('')}</div><span id="vg-hud" class="row" style="gap:10px"></span></div>
      ${sub ? `<div class="small muted" style="margin:-8px 0 14px">${sub}</div>` : ''}<div id="vg-b">${body}</div></div></div>`;
    hud(); return $('#vg-b', view);
  };
  const nextRound = () => { TTS.stop(); st.r++; if (st.r >= ROUNDS.length) return finish(); runRound(); };
  const intro = () => {
    shell(`<div class="card vg-intro">${X.xiSay('wow', `${words.length} từ mới, 6 vòng chơi. Đúng liên tiếp 5 câu là có combo đó!`, 76)}<div class="kicker syn" style="margin-top:6px">${words.length} từ trong lượt này</div><div class="netw" style="margin:12px 0 18px">${words.map(w => `<span data-chip="${w.id}">${esc(w.w)}</span>`).join('')}</div>
      <div class="vg-steps">${ROUNDS.map((r, i) => `<div><b>${i + 1}. ${r.n}</b><span class="small muted">${r.d}</span></div>`).join('')}</div>
      <p class="small muted" style="margin-top:14px">Đúng liên tiếp để giữ combo. Cứ 5 câu đúng liền nhau được thêm XP. Hết 6 vòng, các từ tự vào lịch ôn.</p>
      <button class="btn pri lg" id="vg-go" style="margin-top:8px">Bắt đầu ${icon('arrow')}</button></div>`);
    st.r = 0; X.imgPrefetch && X.imgPrefetch(words).then(() => words.forEach(w => { const u = X.imgNow(w), el = $(`[data-chip="${w.id}"]`, view); if (u && el && !el.querySelector('img')) el.insertAdjacentHTML('afterbegin', `<img class="chip-img" src="${u}" alt="">`); })); $('#vg-go', view).onclick = runRound; document.onkeydown = e => { if (e.key === 'Enter') runRound(); };
  };

  /* generic MCQ step runner for a list of questions */
  const mcqSeq = (rk, qs, done, opts = {}) => {
    let i = 0;
    const one = () => {
      if (i >= qs.length) return done();
      const q = qs[i]; let ans = false, tm = null;
      const b = shell(`<div class="card vcard">${q.html}<div class="opts" style="text-align:left;margin-top:18px">${q.opts.map((x, k) => `<button class="opt" data-o="${k}"><span class="L">${k + 1}</span><span>${esc(x)}</span></button>`).join('')}</div>${opts.time ? '<div class="cd" style="margin-top:14px"><i id="vg-cd"></i></div>' : ''}<div id="vg-fb"></div></div>`, `${i + 1}/${qs.length}`);
      $$('[data-say]', b).forEach(x => x.onclick = () => say(x.dataset.say));
      if (q.say) setTimeout(() => say(q.say), 150);
      const pick = k => {
        if (ans) return; ans = true; clearInterval(tm); const ok = k === q.a; mark(rk, ok, q.w);
        $$('[data-o]', b).forEach((x, j) => { x.disabled = true; if (j === q.a) x.classList.add('ok'); else if (j === k) x.classList.add('bad'); });
        $('#vg-fb', b).innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}" style="text-align:left"><b class="h">${ok ? 'Đúng' : k < 0 ? 'Hết giờ' : 'Chưa đúng'}</b><b>${esc(q.w.w)}</b> ${q.w.ipa ? `<span class="ipa">${esc(q.w.ipa)}</span>` : ''} = ${esc(q.w.vi)}${q.after ? `<div class="small" style="margin-top:4px">${q.after}</div>` : ''}</div>`;
        if (!ok || q.sayAfter) say(head(q.w));
        const go = () => { i++; one(); };
        if (ok && opts.auto) setTimeout(() => { if (qs[i] === q) go(); }, 700);
        else { $('#vg-fb', b).insertAdjacentHTML('beforeend', `<div class="row" style="justify-content:center;margin-top:12px"><button class="btn pri" id="vg-n">Tiếp ${icon('arrow')}</button></div>`); $('#vg-n', b).onclick = go; document.onkeydown = e => { if (e.key === 'Enter') go(); }; }
      };
      $$('[data-o]', b).forEach(x => x.onclick = () => pick(+x.dataset.o));
      document.onkeydown = e => { if (/^[1-4]$/.test(e.key) && !ans) pick(+e.key - 1); };
      if (opts.time) { const t0 = Date.now(), bar = $('#vg-cd', b); tm = setInterval(() => { const left = 1 - (Date.now() - t0) / (opts.time * 1000); if (bar) bar.style.width = Math.max(0, left * 100) + '%'; if (left <= 0) pick(-1); }, 50); X.onLeave(() => clearInterval(tm)); }
    };
    one();
  };

  function runRound() {
    persist();
    const R = ROUNDS[st.r].k;
    if (R === 'discover') return discover();
    if (R === 'match') return match();
    if (R === 'listen') return mcqSeq('listen', shuffle(words).map(w => { const op = shuffle([head(w), ...X.smartOpts(w, 3, 'sound')]); return { w, html: `<button class="btn syn lg" data-say="${esc(head(w))}">${icon('vol')} Nghe lại</button><div class="small faint" style="margin-top:8px">Nghe rồi chọn từ bạn nghe thấy. Các từ còn lại nghe na ná, chú ý âm cuối.</div>`, say: head(w), opts: op, a: op.indexOf(head(w)) }; }), nextRound);
    if (R === 'react') return mcqSeq('react', shuffle(words).map(w => { const im = X.imgNow && X.imgNow(w); if (im) { const ds = distract(w, 3, 'w'); const op = shuffle([w, ...ds]); return { w, html: `<div class="kicker">Nhìn ảnh, chọn từ</div><div class="wimg on" style="margin-top:10px"><img src="${im}" alt=""></div>`, opts: op.map(x => x.w), a: op.indexOf(w) }; } const op = shuffle([w.vi, ...X.smartOpts(w, 3, 'mean')]); return { w, html: `<div class="hw">${esc(w.w)}</div>`, opts: op, a: op.indexOf(w.vi) }; }), nextRound, { time: 5, auto: true });
    if (R === 'apply') return mcqSeq('apply', shuffle(words).map(applyQ), nextRound);
    if (R === 'recall') return recall();
  }

  function discover() {
    let i = 0;
    const one = () => {
      if (i >= words.length) return nextRound();
      const w = words[i];
      const sent = (w.ex || []).map(e => blank(e, w)).find(Boolean);
      const showCard = guessed => {
        const b = shell(`<div class="card wcard">
          ${guessed !== undefined ? `<div class="fb ${guessed ? 'ok' : 'bad'}" style="margin-bottom:14px">${guessed ? 'Đoán đúng từ ngữ cảnh.' : 'Chưa đúng, nhưng đoán trước giúp nhớ lâu hơn.'}</div>` : ''}
          <div class="row" style="justify-content:center">${w.pos ? `<span class="pill">${esc(w.pos)}</span>` : ''}${w.cefr ? `<span class="pill">${esc(w.cefr)}</span>` : ''}${w.star ? '<span class="pill gold">★ hay gặp</span>' : ''}</div>
          <div data-wimg="${w.id}" class="wimg"></div><div class="hw">${esc(w.w)}</div><div class="row" style="justify-content:center"><button class="say" data-say="${esc(head(w))}">${icon('vol')}</button>${w.ipa ? `<span class="ipa">${esc(w.ipa)}</span>` : ''}<button class="btn sm ghost" id="wc-slow">chậm</button></div>
          ${w.def ? `<div class="layer"><span class="kicker">English</span><div>${esc(w.def)}</div></div>` : ''}
          <div class="layer vi ${w.def ? 'hidden' : ''}" id="wc-vi"><span class="kicker">Tiếng Việt</span><div><b>${esc(w.vi)}</b></div></div>
          ${w.def ? '<button class="btn sm" id="wc-reveal">Hiện nghĩa tiếng Việt</button>' : ''}
          ${w.ex && w.ex[0] ? `<p class="ex"><button class="say" data-say="${esc(w.ex[0])}">${icon('vol')}</button> <i>${esc(w.ex[0])}</i></p>` : ''}
          ${w.col && w.col.length ? `<div class="netw" style="justify-content:center">${w.col.slice(0, 4).map(c => `<span data-say="${esc(c)}" style="cursor:pointer">${esc(c)}</span>`).join('')}</div>` : ''}
          ${w.para ? `<div class="small muted" style="margin-top:10px">Đề hay nói lại: ${esc(w.para)}</div>` : ''}
          ${w.note ? `<div class="small" style="margin-top:8px;color:var(--ember)">${esc(w.note)}</div>` : ''}
          <div class="row" style="justify-content:center;margin-top:18px"><button class="btn pri" id="wc-n">${i < words.length - 1 ? 'Từ tiếp' : 'Sang vòng Ghép nghĩa'} ${icon('arrow')}</button></div></div>`, `Từ ${i + 1}/${words.length}`);
        $$('[data-say]', b).forEach(x => x.onclick = () => say(x.dataset.say));
        const sl = $('#wc-slow', b); if (sl) sl.onclick = () => { TTS.stop(); TTS.speak(head(w), { rate: 0.6 }); };
        const rv = $('#wc-reveal', b); if (rv) rv.onclick = () => { $('#wc-vi', b).classList.remove('hidden'); rv.remove(); };
        X.imgFill && X.imgFill(b); say(head(w));
        $('#wc-n', b).onclick = () => { i++; one(); }; document.onkeydown = e => { if (e.key === 'Enter') { i++; one(); } };
      };
      if (!sent) return showCard();
      const op = shuffle([w, ...X.smartOpts(w, 2, 'cloze').map(t => ({ w: t }))]);
      const b = shell(`<div class="card vcard"><div class="kicker">Đoán từ còn thiếu trong câu</div>${X.imgNow && X.imgNow(w) ? `<div class="wimg on" style="margin-top:12px"><img src="${X.imgNow(w)}" alt=""></div>` : ''}<div class="q-prompt" style="margin:14px 0 6px">${esc(sent)}</div><div class="small muted" style="margin-bottom:14px">${X.clozeHint(w)}</div>
        <div class="opts" style="text-align:left">${op.map((x, k) => `<button class="opt" data-o="${k}"><span class="L">${k + 1}</span><span>${esc(x.w)}</span></button>`).join('')}</div></div>`, `Từ ${i + 1}/${words.length}`);
      const pick = k => { const ok = op[k] === w; mark('discover', ok, w); showCard(ok); };
      $$('[data-o]', b).forEach(x => x.onclick = () => pick(+x.dataset.o));
      document.onkeydown = e => { if (/^[1-3]$/.test(e.key)) pick(+e.key - 1); };
    };
    one();
  }

  function match() {
    const set = shuffle(words).slice(0, 6);
    const left = shuffle(set), right = shuffle(set);
    const useDef = set.filter(w => w.def).length >= set.length - 1;
    let sel = null, done = 0, miss = 0;
    const b = shell(`<div class="card"><div class="small muted" style="margin-bottom:12px">Bấm một từ bên trái rồi bấm ${useDef ? 'định nghĩa' : 'nghĩa'} khớp bên phải.</div>
      <div class="match"><div>${left.map(w => `<button class="mt" data-l="${w.id}">${esc(w.w)}</button>`).join('')}</div><div>${right.map(w => `<button class="mt r" data-r="${w.id}">${esc(useDef && w.def ? w.def : w.vi)}</button>`).join('')}</div></div></div>`, `${set.length} cặp`);
    const tryPair = (l, r) => {
      const w = set.find(x => x.id === l.dataset.l);
      if (l.dataset.l === r.dataset.r) { l.classList.add('ok'); r.classList.add('ok'); l.disabled = r.disabled = true; done++; mark('match', true, w); say(head(w)); if (done === set.length) setTimeout(nextRound, 700); }
      else { miss++; mark('match', false, w); [l, r].forEach(x => { x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); }); }
      $$('.mt', b).forEach(x => x.classList.remove('sel')); sel = null;
    };
    $$('[data-l]', b).forEach(l => l.onclick = () => { $$('[data-l]', b).forEach(x => x.classList.remove('sel')); l.classList.add('sel'); sel = l; });
    $$('[data-r]', b).forEach(r => r.onclick = () => { if (sel) tryPair(sel, r); else X.toast('Chọn một từ bên trái trước'); });
  }

  function applyQ(w) {
    const op = shuffle([w, ...X.smartOpts(w, 3, 'cloze').map(t => ({ w: t }))]);
    const exs = (w.ex || []).map(e => [e, blank(e, w)]).filter(x => x[1]);
    const cols = (w.col || []).map(c => [c, blank(c, w)]).filter(x => x[1]);
    if (exs.length) return { w, html: `<div class="kicker">Điền vào câu</div><div class="q-prompt" style="margin-top:12px">${esc(exs[0][1])}</div>`, opts: op.map(x => x.w), a: op.indexOf(w), after: `<i>${esc(exs[0][0])}</i>`, sayAfter: true };
    if (cols.length) { const c = sample(cols, 1)[0]; return { w, html: `<div class="kicker">Hoàn thành cụm từ</div><div class="q-prompt" style="margin-top:12px">${esc(c[1])}</div>`, opts: op.map(x => x.w), a: op.indexOf(w), after: `<i>${esc(c[0])}</i>` }; }
    if (w.syn && w.syn.length && X.smartOpts(w, 3, 'syn').length >= 3) { const op2 = shuffle([w.syn[0], ...X.smartOpts(w, 3, 'syn')]); return { w, html: `<div class="kicker">Cách nói khác</div><div class="hw" style="font-size:30px">${esc(w.w)}</div><div class="small muted">Đề có thể viết lại thành?</div>`, opts: op2, a: op2.indexOf(w.syn[0]) }; }
    { const o3 = shuffle([w, ...X.VOCAB.filter(x => x.id !== w.id && x.kind === w.kind && x.topic === w.topic && x.vi !== w.vi && !related(w, x)).sort(() => Math.random() - .5).slice(0, 3)]);
      return { w, html: `<div class="kicker">Chọn từ đúng nghĩa</div><div class="mean">${esc(w.vi)}</div>`, opts: o3.map(x => x.w), a: o3.indexOf(w) }; }
  }

  function recall() {
    const list = shuffle(words); let i = 0;
    const one = () => {
      if (i >= list.length) return nextRound();
      const w = list[i]; const k = head(w);
      if (w.kind === 'phrase' || k.length > 26) { // long phrase → choose
        return mcqSeq('recall', [(() => { const ds = distract(w, 3, 'w'); const op = shuffle([w, ...ds]); return { w, html: `<div class="kicker">Nhớ lại</div><div class="mean">${esc(w.vi)}</div>`, opts: op.map(x => x.w), a: op.indexOf(w) }; })()], () => { i++; one(); });
      }
      let done = false; const t0 = Date.now();
      const b = shell(`<div class="card vcard"><div class="kicker">Nhớ lại - không nhìn đáp án</div><div class="mean">${esc(w.vi)}</div>${w.def ? `<div class="small muted">${esc(w.def)}</div>` : ''}
        <div class="small faint" style="margin:10px 0">Gợi ý: <b class="mono">${esc(k[0])}${k.slice(1).replace(/[a-z]/gi, '_').split('').join(' ')}</b></div>
        <input class="inp type-in" id="rc-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="gõ từ…"><div class="row" style="justify-content:center;margin-top:14px"><button class="btn" id="rc-skip">Không nhớ</button><button class="btn pri" id="rc-ok">Kiểm tra</button></div><div id="vg-fb"></div></div>`, `${i + 1}/${list.length}`);
      const inp = $('#rc-in', b); inp.focus();
      const chk = give => {
        if (done) return; done = true; const ok = !give && typeOk(inp.value, w); mark('recall', ok, w);
        if (ok) { w._fast = Date.now() - t0 < 7000; }
        inp.style.borderColor = ok ? 'var(--sage)' : 'var(--red)'; say(k);
        $('#vg-fb', b).innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}" style="text-align:left"><b class="h">${ok ? 'Đúng' : 'Đáp án'}</b><b>${esc(w.w)}</b> ${w.ipa ? `<span class="ipa">${esc(w.ipa)}</span>` : ''}</div><div class="row" style="justify-content:center;margin-top:12px"><button class="btn pri" id="vg-n">Tiếp ${icon('arrow')}</button></div>`;
        $('#vg-n', b).onclick = () => { i++; one(); }; setTimeout(() => { document.onkeydown = e => { if (e.key === 'Enter') { i++; one(); } }; }, 50);
      };
      $('#rc-ok', b).onclick = () => chk(false); $('#rc-skip', b).onclick = () => chk(true);
      document.onkeydown = e => { if (e.key === 'Enter' && !done) chk(false); };
    };
    one();
  }

  function finish() {
    X.sessDel(sKey);
    // write to SRS: grade by mistakes
    words.forEach(w => {
      const miss = st.wrong[w.id] || 0;
      const g = miss === 0 ? (w._fast ? 4 : 3) : miss === 1 ? 2 : 1;
      const r = X.srsReview(w.id, g, 'en2vi'); if (miss === 0) { r.types = [...new Set([...(r.types || []), 'listen', 'type'])]; r.lvl = Math.max(r.lvl, w.kind === 'word' ? 3 : 2); } else if (miss === 1) r.lvl = Math.max(r.lvl, 2); if (!r.first) r.first = Date.now();
    });
    X.save();
    const tot = Object.values(st.score).reduce((a, [o, n]) => [a[0] + o, a[1] + n], [0, 0]);
    const acc = pct(tot[0], tot[1]);
    o.onDone && o.onDone({ acc, words });
    const weak = words.filter(w => st.wrong[w.id] >= 2);
    if (acc >= 70) { X.sfx.win(); X.rain(70); }
    view.innerHTML = `<div class="page"><div class="qz" style="max-width:820px"><div class="kicker">${esc(o.title || 'Từ vựng')} - Kết quả</div><div class="hello">${X.xi(acc >= 80 ? 'happy' : acc >= 50 ? 'think' : 'sad', 96)}<h1 class="h1">${acc}% chính xác, combo cao nhất ×${st.best}</h1></div>
      <div class="card sec"><div class="h3" style="margin-bottom:10px">Không phải một điểm số. Sáu năng lực.</div>
        ${ROUNDS.map(r => { const [ok, n] = st.score[r.k]; return `<div class="hbar"><span>${r.ab}</span><div class="bar sage"><i style="width:${pct(ok, n)}%"></i></div><span class="mono small">${n ? pct(ok, n) : '—'}</span></div>`; }).join('')}</div>
      <div class="card sec"><div class="h3" style="margin-bottom:10px">${words.length} từ đã vào lịch ôn</div><div class="netw">${words.map(w => `<a href="#/vocab/w/${w.id}"><span style="${st.wrong[w.id] >= 2 ? 'border-color:var(--ember);color:var(--ember)' : ''}">${esc(w.w)}</span></a>`).join('')}</div>
        ${weak.length ? `<p class="small muted" style="margin-top:10px">Từ viền cam sai từ 2 lần, sẽ quay lại sớm hơn. Bấm vào từ để học sâu.</p>` : ''}</div>
      <div class="row sec">${o.next ? `<a class="btn pri" href="${o.next.href}">${esc(o.next.label)} ${icon('arrow')}</a>` : ''}<button class="btn" id="vg-again">Lượt từ mới</button><a class="btn ghost" href="${o.back || '#/vocab'}">Xong</a></div></div></div>`;
    $('#vg-again', view).onclick = () => X.render();
  }
  if (sv && sv.kind === 'vg' && st.r > 0) { setTimeout(() => X.toast(`Làm tiếp từ vòng ${st.r + 1}/6`), 50); runRound(); } else intro();
};

/* ---------------- deep journey for ANY word ---------------- */
X.route(/^\/vocab\/deep\/([\w-]+)$/, (view, id) => {
  const w = X.wordById[id]; if (!w) return X.go('#/vocab');
  const R = window.RICH && window.RICH[w.w.toLowerCase()]; if (R) return X.go('#/vocab/journey/' + encodeURIComponent(w.w.toLowerCase()));
  const k = head(w);
  const sec = (n, stage, title, body, dark) => `<section class="jsec ${dark ? 'dark' : ''}"><div><div class="n">${n}</div><div class="stg">${stage}</div></div><div><h3>${title}</h3>${body}</div></section>`;
  const M = { predict: null, colloc: null, compare: null, listen: null, recall: null, speed: null };
  const near = X.VOCAB.filter(x => x.id !== w.id && x.kind === w.kind && x.topic === w.topic);
  const sentRaw = (w.ex || []).find(e => blank(e, w)); const sent = sentRaw ? blank(sentRaw, w) : null;
  const predOpts = shuffle([w, ...X.smartOpts(w, 3, 'cloze').map(t => ({ w: t, id: 'x' + t }))]);
  const colOk = (w.col || []).slice(0, 3), colBad = sample(X.VOCAB.filter(x => x.id !== w.id && x.col && x.col.length).flatMap(x => x.col.filter(c => !blank(c, w))), 2);
  const conf = (window.CONF || []).filter(c => c.pair.toLowerCase().split('/').map(s => s.trim()).includes(k.toLowerCase()));
  const look = sample(X.VOCAB.filter(x => x.id !== w.id && x.kind === 'word' && x.w.slice(0, 2).toLowerCase() === k.slice(0, 2).toLowerCase()), 5).map(x => head(x));
  let n = 0; const N = () => String(++n).padStart(2, '0');
  view.innerHTML = `<div class="page"><a href="#/vocab/w/${w.id}" class="small">${icon('back')} ${esc(w.w)}</a>
    <div class="kicker syn" style="margin-top:18px">Học sâu một từ</div>
    <div class="word-hero"><div class="hw" style="font-size:58px">${esc(w.w)}</div><button class="say" data-say="${esc(k)}">${icon('vol')}</button>${w.pos ? `<span class="pill">${esc(w.pos)}</span>` : ''}${w.cefr ? `<span class="pill">${esc(w.cefr)}</span>` : ''}</div>
    ${w.ipa ? `<div class="ipa" style="margin:8px 0 6px">${esc(w.ipa)}</div>` : ''}
    <p class="lead" style="margin-bottom:10px">Không học nghĩa trước. Đoán, nghe, nối với từ khác, rồi mới kéo ra từ trí nhớ và đo tốc độ nhận ra.</p>
    ${sent ? sec(N(), 'Attention', 'Đoán trước khi được cho biết', `<div class="q-prompt">${esc(sent)}</div><div class="small muted" style="margin-top:6px">${X.clozeHint(w)}</div><div class="row" style="margin-top:12px" id="j-pred">${predOpts.map(x => `<button class="btn" data-v="${x.id}">${esc(x.w)}</button>`).join('')}</div><div id="j-pred-fb" class="small" style="margin-top:10px"></div>`) : ''}
    ${sec(N(), 'Encoding', 'Nghe hình dạng âm của từ', `<div class="row"><button class="btn" data-say="${esc(k)}">${icon('vol')} Bình thường</button><button class="btn" id="j-slow">${icon('vol')} Chậm</button>${w.ipa ? `<span class="ipa">${esc(w.ipa)}</span>` : ''}</div>`)}
    ${sec(N(), 'Encoding', 'Nghĩa, thu hẹp qua từng lớp', `${w.def ? `<p><span class="pill">English</span> ${esc(w.def)}</p>` : ''}${w.note ? `<p><span class="pill">Ghi chú</span> ${esc(w.note)}</p>` : ''}<p id="j-vi" class="${w.def ? 'blurred' : ''}"><span class="pill syn">Tiếng Việt</span> <b>${esc(w.vi)}</b></p>${w.def ? '<button class="btn sm" id="j-vi-b">Hiện nghĩa tiếng Việt</button>' : ''}`)}
    ${(w.fam && w.fam.length) || (w.syn && w.syn.length) || (w.ant && w.ant.length) ? sec(N(), 'Association', 'Một từ không bao giờ đứng một mình', `<div class="netw"><span class="c">${esc(w.w)}</span>${(w.fam || []).map(f => `<span title="họ từ">${esc(f.f)} <small class="faint">${esc(f.pos)}</small></span>`).join('')}${(w.syn || []).map(s => `<span title="đồng nghĩa" style="border-color:var(--sage)">≈ ${esc(s)}</span>`).join('')}${(w.ant || []).map(s => `<span title="trái nghĩa" style="border-color:var(--ember)">≠ ${esc(s)}</span>`).join('')}</div><p class="small muted" style="margin-top:8px">Viền xanh: đồng nghĩa - viền cam: trái nghĩa - chữ nhỏ: từ loại trong họ từ.</p>`) : ''}
    ${colOk.length && colBad.length ? sec(N(), 'Association', 'Nó thật sự đi với từ nào?', `<p class="small muted">Chọn tất cả cụm có thật, rồi bấm kiểm tra.</p><div class="netw" id="j-col">${shuffle([...colOk.map(c => [c, 1]), ...colBad.map(c => [c, 0])]).map(([c, ok]) => `<button class="btn sm" data-ok="${ok}">${esc(c)}</button>`).join('')}</div><button class="btn pri sm" style="margin-top:12px" id="j-col-ck">Kiểm tra</button><div id="j-col-fb" class="small" style="margin-top:8px"></div>`) : ''}
    ${conf.length || w.para ? sec(N(), 'Association', 'Dễ nhầm và cách đề nói lại', `${conf.map(c => `<div class="card flat" style="padding:14px;margin-bottom:8px"><b>${esc(c.pair)}</b> <span class="ipa">${esc(c.ipa || '')}</span><div class="small">${esc(c.distinction || '')}</div>${c.example ? `<div class="small muted"><i>${esc(c.example)}</i></div>` : ''}</div>`).join('')}${w.para ? `<p><span class="pill">Paraphrase</span> ${esc(w.para)}</p>` : ''}`) : ''}
    ${w.ex && w.ex.length ? sec(N(), 'Retrieval', 'Nghe trước khi đọc', w.ex.map((e, i) => `<div class="row" style="margin:8px 0"><button class="btn sm" data-li="${i}" style="background:transparent;color:var(--paper);border-color:#444">${icon('play')} Câu ${i + 1}</button><span class="small" style="color:#9A9DA8" id="j-li-${i}">nghe, tự đoán câu, rồi mới hiện chữ</span></div>`).join(''), true) : ''}
    ${w.kind === 'word' && k.length <= 26 ? sec(N(), 'Retrieval', 'Kéo ra từ trí nhớ', `<p>Gõ từ có nghĩa: <b>${esc(w.vi)}</b></p><div class="row"><input class="inp" id="j-rc" style="max-width:260px" autocomplete="off" autocapitalize="off"><button class="btn pri" id="j-rc-ck">Kiểm tra</button></div><div id="j-rc-fb" class="small" style="margin-top:8px"></div>`) : ''}
    ${look.length >= 3 && w.kind === 'word' ? sec(N(), 'Automatic Recognition', 'Nhận ra nhanh đến mức nào?', `<p class="small muted">Từ hiện liên tục. Gặp <b>${esc(k)}</b> thì bấm <kbd>Space</kbd>, từ khác thì bỏ qua. 10 lượt.</p><div class="flash" id="j-sp" style="border:1px solid var(--line);border-radius:12px">Sẵn sàng</div><button class="btn pri" id="j-sp-go">Bắt đầu</button> <span id="j-sp-fb" class="small"></span>`) : ''}
    ${sec(N(), 'Consolidation', 'Không phải một điểm số. Sáu năng lực.', `<div id="j-m"></div><button class="btn syn" style="margin-top:14px" id="j-save">Đưa vào lịch ôn</button>`)}
  </div>`;
  $$('[data-say]', view).forEach(b => b.onclick = () => say(b.dataset.say));
  const drawM = () => { $('#j-m', view).innerHTML = [['predict', 'Đoán từ ngữ cảnh'], ['colloc', 'Collocation'], ['listen', 'Nghe'], ['recall', 'Nhớ chủ động'], ['speed', 'Tốc độ nhận ra']].map(([kk, nm]) => `<div class="hbar"><span>${nm}</span><div class="bar sage"><i style="width:${M[kk] || 0}%"></i></div><span class="mono small">${M[kk] == null ? '—' : M[kk]}</span></div>`).join(''); };
  drawM();
  $$('#j-pred button', view).forEach(b => b.onclick = () => { const ok = b.dataset.v === w.id; $$('#j-pred button', view).forEach(x => { x.disabled = true; if (x.dataset.v === w.id) x.classList.add('syn'); }); $('#j-pred-fb', view).innerHTML = ok ? '✓ Đúng, ngữ cảnh đã đủ để đoán.' : `Đáp án: <b>${esc(w.w)}</b>. <i>${esc(sentRaw)}</i>`; M.predict = ok ? 100 : 40; drawM(); say(sentRaw); });
  const sl = $('#j-slow', view); if (sl) sl.onclick = () => { TTS.stop(); TTS.speak(k, { rate: 0.6 }); };
  const vb = $('#j-vi-b', view); if (vb) vb.onclick = () => { $('#j-vi', view).classList.remove('blurred'); vb.remove(); };
  $$('#j-col button', view).forEach(b => b.onclick = () => b.classList.toggle('pri'));
  const cc = $('#j-col-ck', view); if (cc) cc.onclick = () => { const bs = $$('#j-col button', view); const good = bs.filter(b => (b.dataset.ok === '1') === b.classList.contains('pri')).length; bs.forEach(b => b.style.borderColor = b.dataset.ok === '1' ? 'var(--sage)' : 'var(--red)'); M.colloc = pct(good, bs.length); $('#j-col-fb', view).textContent = `${good}/${bs.length} đúng. Viền xanh là cụm có thật.`; drawM(); };
  let heard = 0;
  $$('[data-li]', view).forEach(b => b.onclick = async () => { const e = w.ex[+b.dataset.li]; TTS.stop(); await TTS.speak(e); $('#j-li-' + b.dataset.li, view).textContent = e; heard++; M.listen = pct(heard, w.ex.length); drawM(); });
  const rc = $('#j-rc-ck', view); if (rc) rc.onclick = () => { const ok = typeOk($('#j-rc', view).value, w); $('#j-rc-fb', view).innerHTML = ok ? '✓ Đúng' : `Đáp án: <b>${esc(w.w)}</b>`; M.recall = ok ? 100 : 20; drawM(); say(k); };
  const sp = $('#j-sp-go', view); if (sp) sp.onclick = () => {
    const seq = shuffle([k, k, k, k, ...look, ...look].slice(0, 10)); let i = 0, hit = 0, pressed = false; const el = $('#j-sp', view);
    const step = () => { if (i > 0) { if ((seq[i - 1] === k) === pressed) hit++; } if (i >= seq.length) { document.onkeydown = null; M.speed = pct(hit, seq.length); el.textContent = `${hit}/${seq.length} đúng`; drawM(); return; } pressed = false; el.textContent = seq[i]; i++; setTimeout(step, 1000); };
    document.onkeydown = e => { if (e.key === ' ') { e.preventDefault(); if (!pressed) { pressed = true; el.style.background = 'var(--syn-soft)'; setTimeout(() => el.style.background = '', 150); } } };
    step();
  };
  $('#j-save', view).onclick = () => { const vals = Object.values(M).filter(v => v != null); const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 60; X.srsReview(w.id, avg >= 85 ? 3 : avg >= 50 ? 2 : 1, M.recall === 100 ? 'type' : 'en2vi'); X.addXP(8, 'Học sâu xong một từ'); X.toast('Đã đưa vào lịch ôn'); };
});
})();
