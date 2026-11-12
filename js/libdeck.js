/* TOOEZ — Thư viện Part 1 dạng thẻ (core mindset + phương pháp + chủ đề học nhanh) */
'use strict';
(() => {
const { $, $$, esc, icon } = X;
const S = () => X.S();
X.libData = pk => pk === 'p1' ? window.P1LIB : (window.LIBDECK || {})[pk];
const deckHref = (pk, id) => pk === 'p1' ? `#/p1lib/${id}` : `#/deck/${pk}/${id}`;
const pic = name => name ? `<div class="wimg on deck-img"><img src="img/p1/${name}.jpg" alt="" onerror="this.parentNode.remove()"></div>` : '';
const sayBtn = t => `<button class="say sm" data-say="${esc(t)}" title="Nghe">${icon('play')}</button>`;
const doneKey = (pk, id) => pk === 'p1' ? 'p1lib-' + id : `lib-${pk}-${id}`;

/* Phần đầu trang Part 1 trong Thư viện */
X.libTop = pk => {
  const d = X.libData(pk); if (!d) return '';
  const c = d.core;
  return `<div class="core-hero">
      <div class="core-mind"><div class="kicker">Core mindset</div>${c.mind ? `<div class="core-q">${esc(c.mind)}</div>` : ''}</div>
      <div class="core-formula">${c.formula.map(([a, b], i) => `${i ? '<span class="cf-plus">+</span>' : ''}<div class="cf-chip"><b>${esc(a)}</b><small>${esc(b)}</small></div>`).join('')}<span class="cf-plus">=</span><div class="cf-chip ok"><b>${esc(c.result ? c.result[0] : 'Đáp án đúng')}</b><small>${esc(c.result ? c.result[1] : 'không sai chỗ nào')}</small></div></div>
      <div class="small" style="margin-top:10px"><b>${esc(c.rule)}</b></div>
      <div class="core-note small">Đây là cách nghĩ và mẹo gợi ý, không phải luật cứng. Mẹo giúp bạn loại nhanh khi bí; đừng lạm dụng, quyết định cuối cùng luôn dựa vào nghĩa và bằng chứng trong bài.</div>
    </div>
    <div class="kicker" style="margin:22px 0 10px">${esc(c.stepsTitle || 'Phương pháp 4 bước')}</div>
    <div class="steps4">${c.steps.map(([ic, t, b], i) => `<div class="st4"><div class="st4-n">${i + 1}</div><div class="st4-ic">${ic}</div><div class="st4-t">${esc(t)}</div><div class="small muted">${esc(b)}</div></div>`).join('')}</div>
    <h2 class="h2" style="margin:28px 0 10px">Học nhanh từng chủ đề</h2>
    <div class="grid g3">${d.topics.map(t => { const dn = S().lessons[doneKey(pk, t.id)];
      return `<a class="card link topic-card ${dn ? 'done' : ''}" href="${deckHref(pk, t.id)}"><div class="row"><span class="tc-ic">${t.icon}</span><span class="grow"></span>${dn ? `<span class="pill sage">${icon('check')} Đã học</span>` : `<span class="pill">${t.cards.length} thẻ</span>`}</div>
        <div class="h3" style="font-family:var(--f-display);font-size:17px;margin-top:8px">${esc(t.t)}</div><div class="small muted">${esc(t.hook)}</div></a>`; }).join('')}</div>`;
};

/* Một chủ đề: lần lượt từng thẻ */
const deckRoute = (view, pk, id) => {
  const d = X.libData(pk), T = d && d.topics.find(t => t.id === id); if (!T) return X.go('#/library/' + pk);
  const part = X.PARTS.find(p => p.k === pk) || { n: 'Part' };
  let i = 0, ok = 0, checks = 0;
  let answered = {};
  // mở từ Thư viện thì quay về Thư viện; mở từ Lộ trình / Hôm nay thì quay về unit
  const ph = X.prevHash || ''; if (/^\/(library)/.test(ph)) X.deckBack = null; else if (!/^\/(deck|p1lib)\//.test(ph)) X.deckBack = (X.deckDone && X.deckDone(pk, id) || {}).back || null;
  const fromLib = !X.deckBack, backHref = X.deckBack || '#/library/' + pk;
  const sKey = X.hereKey(), sv = X.sessGet(sKey);
  if (sv && sv.kind === 'deck') { i = Math.min(sv.i, T.cards.length - 1); ok = sv.ok || 0; checks = sv.checks || 0; answered = sv.answered || {}; setTimeout(() => X.toast(`Làm tiếp từ thẻ ${i + 1}/${T.cards.length}`), 50); }
  const persist = () => X.sessSet(sKey, { kind: 'deck', title: T.t, n: T.cards.length, i, ok, checks, answered });
  const READ = ['p5', 'p6', 'p7'].includes(pk);   // phần đọc: không có nút nghe, ví dụ hiện chữ + tô sáng
  const hl = x => esc(x).replace(/\[\[(.+?)\]\]/g, '<mark class="hlx">$1</mark>');
  const card = C => {
    switch (C.t) {
      case 'idea': return `${pic(C.img)}<h2 class="deck-h">${esc(C.h)}</h2>${C.big ? `<div class="deck-big">${esc(C.big)}</div>` : ''}${C.b ? `<div class="deck-b">${C.b}</div>` : ''}`;
      case 'hook': return `<div class="deck-hook"><div class="deck-bulb">💡</div><h2 class="deck-h">${esc(C.h)}</h2><div class="deck-b">${C.b}</div></div>`;
      case 'rows': return `${pic(C.img)}<h2 class="deck-h">${esc(C.h)}</h2><div class="deck-rows">${C.rows.map(r => `<div class="dr"><b>${esc(r[0])}</b><span>${hl(r[1])}${READ && r[2] ? `<span class="dr-ex">${hl(r[2])}</span>` : ''}</span>${!READ && r[2] ? sayBtn(r[2]) : ''}</div>`).join('')}</div>${C.b ? `<div class="deck-b small rows-b">${C.b}</div>` : ''}`;
      case 'vs': return `${pic(C.img)}<h2 class="deck-h">${esc(C.h)}</h2>
        <div class="vs ok" ${READ ? '' : `data-say="${esc(C.ok[0])}"`}><span class="vs-tag">✓</span><div><b>${hl(C.ok[0])}</b><div class="small">${esc(C.ok[1])}</div></div></div>
        ${(C.also || []).map(([s, w]) => `<div class="vs ok" ${READ ? '' : `data-say="${esc(s)}"`}><span class="vs-tag">✓</span><div><b>${hl(s)}</b><div class="small">${esc(w)}</div></div></div>`).join('')}
        ${(C.no || []).map(([s, w]) => `<div class="vs no" ${READ ? '' : `data-say="${esc(s)}"`}><span class="vs-tag">✗</span><div><b>${hl(s)}</b><div class="small">${esc(w)}</div></div></div>`).join('')}
        ${READ ? '' : '<div class="small faint" style="margin-top:6px">Bấm vào câu để nghe.</div>'}`;
      case 'tl': return `<h2 class="deck-h">${esc(C.h)}</h2><div class="tl">
        <div class="tl-row tl-head"><span></span><div class="tl-track"><span class="tl-z">Quá khứ</span><span class="tl-z now">Bây giờ</span><span class="tl-z">Tương lai</span></div></div>
        ${C.rows.map(r => `<div class="tl-row"><span class="tl-n"><b>${esc(r.n)}</b><small>${esc(r.f)}</small></span><div class="tl-track"><i class="tl-now"></i>${r.a === r.b ? `<i class="tl-dot" style="left:${r.a}%"></i>` : `<i class="tl-bar${r.soft ? ' soft' : ''}" style="left:${r.a}%;width:${r.b - r.a}%"></i>`}${r.m != null ? `<i class="tl-mark" style="left:${r.m}%" title="mốc"></i>` : ''}<span class="tl-ex">${hl(r.ex)}</span></div></div>`).join('')}
        </div>${C.b ? `<div class="deck-b small rows-b">${C.b}</div>` : ''}`;
      case 'passage': {
        const ph = x => hl(x).replace(/\{\{(\w+)\|(.+?)\}\}/g, '<span class="ph" data-h="$1">$2</span>');
        const blk = d => d.k === 'chat' ? `<div class="pc"${d.id ? ` data-h="${d.id}"` : ''}><span class="pc-who">${esc(d.who)}</span><span class="pc-time">${esc(d.time)}</span><div>${ph(d.t)}</div></div>`
          : `<div class="pb pb-${d.k}"${d.id ? ` data-h="${d.id}"` : ''}>${d.k === 'li' ? '• ' : ''}${ph(d.t)}</div>`;
        return `<div class="kicker">Bài mẫu - bấm “Bước tiếp” để xem từng bước</div><h2 class="deck-h">${esc(C.h)}</h2>
        <div class="psg"><div class="psg-docs">${C.docs.map(dc => `<div class="psg-doc">${dc.label ? `<div class="psg-lab">${esc(dc.label)}</div>` : ''}${dc.blocks.map(blk).join('')}</div>`).join('')}</div>
        <div class="psg-panel"><div class="psg-n"></div><div class="psg-q"></div><div class="psg-t"></div>
        <div class="row" style="margin-top:10px"><button class="btn sm" id="ps-prev">${icon('back')} Bước trước</button><span class="grow"></span><button class="btn sm pri" id="ps-next">Bước tiếp ${icon('arrow')}</button></div></div></div>`;
      }
      case 'gtable': return `<div class="kicker">Ví dụ câu hỏi có hình</div><h2 class="deck-h">${esc(C.h)}</h2>
        <div class="gt-q">${esc(C.q)}</div>
        <div class="gt-wrap"><table class="gt"><tr>${C.cols.map((c, j) => `<th class="${j === C.ear[1] ? 'gt-ear-col' : ''}${j === C.ans[1] ? ' gt-ans-col' : ''}">${esc(c)}${j === C.ear[1] ? ' <span class="gt-tag ear">👂 bài nói nhắc cột này</span>' : ''}${j === C.ans[1] ? ' <span class="gt-tag ans">✓ đáp án ở cột này</span>' : ''}</th>`).join('')}</tr>
        ${C.rows.map((r, i) => `<tr class="${i === C.ans[0] ? 'gt-hit' : ''}">${r.map((x, j) => `<td class="${i === C.ear[0] && j === C.ear[1] ? 'gt-ear' : ''}${i === C.ans[0] && j === C.ans[1] ? 'gt-ans' : ''}">${esc(x)}</td>`).join('')}</tr>`).join('')}</table></div>
        <button class="vs ok gt-say" data-say="${esc(C.say)}"><span class="vs-tag">▶</span><div><div class="small muted">Bài nói</div><b>“${esc(C.say)}”</b></div></button>
        <ol class="gt-steps">${C.steps.map(x => `<li>${x}</li>`).join('')}</ol>`;
      case 'check': return `${pic(C.img)}<div class="kicker">Thử ngay${C.ao ? ' - nghe, không nhìn chữ' : C.dlg || C.hideq ? ' - nghe, chữ hiện sau khi chọn' : ''}</div><h2 class="deck-h">${esc(C.q)}</h2>
        ${C.say || C.ao || C.dlg ? `<button class="btn sm" id="dk-play">${icon('play')} Nghe ${C.dlg ? 'lại đoạn hội thoại' : C.ao ? (C.say ? 'lại câu hỏi và các đáp án' : 'lại các đáp án') : 'lại'}</button>` : ''}
        <div class="opts">${C.o.map((o, k) => `<button class="opt" data-o="${k}"><span class="L">${'ABCD'[k]}</span><span class="dk-ot">${C.ao ? '<span class="faint">(nghe)</span>' : esc(o)}</span></button>`).join('')}</div><div id="dk-fb"></div>`;
    }
    return '';
  };
  const draw = () => {
    X.TTS.stop(); persist();
    const C = T.cards[i], last = i === T.cards.length - 1, need = C.t === 'check' && answered[i] === undefined;
    view.innerHTML = `<div class="page"><div class="deck">
      <div class="qz-top"><a class="icon-btn" href="${backHref}">${icon('x')}</a><div><div class="kicker">${esc(part.n)} - ${fromLib ? 'Sổ tay' : 'Lộ trình'}</div><div class="h3">${T.icon} ${esc(T.t)}</div></div>
        <div class="dots">${T.cards.map((_, k) => `<i class="${k < i ? 'on' : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
      <div class="q-card deck-card">${card(C)}</div>
      <div class="row" style="margin-top:14px"><button class="btn" id="dk-prev" ${i ? '' : 'disabled'}>${icon('back')} Trước</button><span class="grow"></span>
        <button class="btn pri" id="dk-next" ${need ? 'disabled' : ''}>${last ? 'Xong chủ đề' : 'Tiếp'} ${icon('arrow')}</button></div></div></div>`;
    $$('[data-say]', view).forEach(b => b.onclick = e => { e.stopPropagation(); X.say(b.dataset.say); });
    if (C.t === 'passage') {
      let k = 0; const N = C.steps.length;
      const show = () => { const st = C.steps[k];
        $$('[data-h]', view).forEach(e => { e.classList.toggle('on', (st.on || []).includes(e.dataset.h)); e.classList.toggle('done', (st.ok || []).includes(e.dataset.h)); });
        $('.psg', view).classList.toggle('focus', !!(st.on && st.on.length));
        $('.psg-n', view).textContent = `Bước ${k + 1}/${N}`; $('.psg-q', view).innerHTML = st.q ? hl(st.q) : ''; $('.psg-q', view).style.display = st.q ? '' : 'none';
        $('.psg-t', view).innerHTML = st.t; $('#ps-prev', view).disabled = !k; $('#ps-next', view).disabled = k === N - 1;
        const f = $('[data-h].on', view); if (f && window.innerWidth < 760) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
      $('#ps-prev', view).onclick = () => { if (k) { k--; show(); } }; $('#ps-next', view).onclick = () => { if (k < N - 1) { k++; show(); } }; show();
    }
    if (C.t === 'check') {
      const lines = [...(C.dlg ? C.dlg.map(([s, t]) => ({ s, t })) : []), ...(C.say ? [{ s: C.sp || 'W', t: C.say }] : []), ...(C.ao ? C.o.map((o, j) => ({ s: 'M', t: `(${'ABCD'[j]}) ${o}` })) : [])];
      const pl = $('#dk-play', view); if (pl) { pl.onclick = () => X.TTS.play(lines); if (answered[i] === undefined) setTimeout(() => X.TTS.play(lines), 300); }
      const show = k => {
        if (C.ao) $$('.dk-ot', view).forEach((e, j) => { e.textContent = C.o[j]; });
        $$('.opt', view).forEach((b, j) => { b.disabled = true; if (j === C.a) b.classList.add('ok'); else if (j === k) b.classList.add('bad'); });
        $('#dk-fb', view).innerHTML = (C.dlg || (C.hideq && C.say) ? `<div class="dk-q"><div class="kicker">Bạn vừa nghe</div>${(C.dlg || [[C.sp || 'W', C.say]]).map(([s, t]) => `<p class="dk-line"><b>${s === 'M' ? 'Man' : 'Woman'}:</b> ${esc(t)}</p>`).join('')}</div>` : '') + (C.ao && C.say ? `<div class="dk-q"><div class="kicker">Câu bạn vừa nghe</div><div class="q-prompt">${X.hiQ(C.say)}</div>${X.hiLegend}</div>` : '') + `<div class="fb ${k === C.a ? 'ok' : 'bad'}"><b class="h">${k === C.a ? 'Chuẩn!' : 'Chưa đúng.'}</b><div>${esc(C.why)}</div></div>`;
        $('#dk-next', view).disabled = false;
      };
      if (answered[i] !== undefined) show(answered[i]);
      $$('.opt', view).forEach(b => b.onclick = () => {
        const k = +b.dataset.o; answered[i] = k; checks++; if (k === C.a) ok++; persist();
        X.react && X.react(k === C.a, b); show(k);
      });
    }
    $('#dk-prev', view).onclick = () => { i--; draw(); };
    $('#dk-next', view).onclick = () => { if (!last) { i++; draw(); return; } finish(); };
    document.onkeydown = e => { if (e.key === 'ArrowRight' || e.key === 'Enter') { const n = $('#dk-next', view); if (n && !n.disabled) n.click(); } else if (e.key === 'ArrowLeft' && i) { i--; draw(); } };
  };
  const finish = () => {
    X.sessDel(sKey);
    const first = !S().lessons[doneKey(pk, id)];
    S().lessons[doneKey(pk, id)] = Date.now(); X.save();
    if (first) X.addXP(5, 'Học xong chủ đề');
    const idx = d.topics.indexOf(T), nx = d.topics[idx + 1];
    const pd = !fromLib && X.deckDone && X.deckDone(pk, id);   // mở từ Lộ trình: học xong thì luyện ngay đúng dạng này
    X.celebrate ? X.celebrate({ title: 'Xong chủ đề!', sub: `${T.t}${checks ? ` - đúng ${ok}/${checks} câu thử` : ''}`, stars: checks ? (ok === checks ? 3 : ok ? 2 : 1) : 3, xp: first ? 5 : 0, btn: pd ? pd.label : nx ? `Tiếp: ${nx.t}` : 'Về Sổ tay', href: pd ? pd.href : nx ? deckHref(pk, nx.id) : '#/library/' + pk }) : X.go(pd ? pd.href : '#/library/' + pk);
  };
  draw();
};
X.route(/^\/p1lib\/([\w-]+)$/, (view, id) => deckRoute(view, 'p1', id));
X.route(/^\/deck\/(\w+)\/([\w-]+)$/, (view, pk, id) => deckRoute(view, pk, id));
})();
