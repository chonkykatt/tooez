/* TOOEZ — Skill Map: mastery per skill, Skill × Part matrix, skill practice */
'use strict';
(() => {
const { $, $$, esc, icon, pct, shuffle } = X;
const S = () => X.S();
const SK = window.SKILLS || [], LY = window.LAYERS || [];
X.SKILLS = SK; X.skillById = Object.fromEntries(SK.map(s => [s.id, s]));
const itemSkills = {};
X.skillsOf = it => { if (!it) return []; if (itemSkills[it.id]) return itemSkills[it.id]; const r = SK.filter(s => s.sel && (() => { try { return s.sel(it); } catch (e) { return false; } })()).map(s => s.id); itemSkills[it.id] = r; return r; };
X.skillItems = id => { const s = X.skillById[id]; return s && s.sel ? X.BANK.filter(i => { try { return s.sel(i); } catch (e) { return false; } }) : []; };
const TARGET = { p2: 20000, p34: 35000, p5: 20000, p6: 30000, p7: 70000, mcq: 15000 };
const BAND = acc => acc == null ? ['—', 'Chưa đủ dữ liệu', ''] : acc >= 85 ? ['Vững', 'Kiểm tra lại sau vài ngày để chắc nhớ lâu', 'sage'] : acc >= 70 ? ['Khá', 'Luyện trộn nhiều dạng', 'syn'] : acc >= 50 ? ['Đang lên', 'Luyện riêng dạng này', 'gold'] : ['Yếu', 'Học lại nền tảng của kỹ năng', 'red'];
X.skillBand = BAND;

X.skillStats = (id, partFilter) => {
  const s = X.skillById[id]; const A = S().attempts;
  if (s.derived === 'speed') { const a = A.filter(x => x.ok && X.itemById[x.i]).slice(-80); if (a.length < 5) return { acc: null, n: a.length }; const fast = a.filter(x => x.ms <= (TARGET[X.itemById[x.i].kind] || 15000)).length; return { acc: pct(fast, a.length), n: a.length }; }
  if (s.derived === 'calib') { const a = A.filter(x => x.c === 'sure').slice(-80); if (a.length < 5) return { acc: null, n: a.length }; return { acc: pct(a.filter(x => x.ok).length, a.length), n: a.length }; }
  if (s.derived === 'selffix') { const e = S().errors; if (e.length < 3) return { acc: null, n: e.length }; return { acc: pct(e.filter(x => x.status === 'fixed').length * 1 + e.filter(x => x.status === 'review').length * 0.5, e.length), n: e.length }; }
  const a = A.filter(x => { const it = X.itemById[x.i]; if (!it) { if (id === 'vocab' && String(x.i).startsWith('v:')) return !partFilter || x.p === partFilter; return false; } if (partFilter && it.part !== partFilter) return false; return X.skillsOf(it).includes(id); }).slice(-40);
  if (a.length < (partFilter ? 3 : 5)) return { acc: null, n: a.length };
  return { acc: pct(a.filter(x => x.ok).length, a.length), n: a.length };
};

X.route(/^\/skills$/, view => {
  const parts = [1, 2, 3, 4, 5, 6, 7];
  const cnt = {}; X.BANK.forEach(i => X.skillsOf(i).forEach(s => { const k = s + '|' + i.part; cnt[k] = (cnt[k] || 0) + 1; }));
  view.innerHTML = `<div class="page wide">${X.progTabs('skills')}<div class="kicker">Bản đồ kỹ năng</div><h1 class="h1">Bạn đang vững ở đâu, hổng ở đâu</h1>
    <p class="lead">Dạng câu hỏi khác kỹ năng. Câu “suy luận” là một dạng câu, còn “suy luận từ bằng chứng” là kỹ năng dùng ở Part 3, 4 và 7. Mỗi câu bạn làm được tính vào mọi kỹ năng nó luyện, nên bản đồ này cho thấy năng lực thật, không chỉ điểm từng Part.</p>
    <div class="card sec lv-card"><div class="lv-h"><b>Cách đọc mức độ</b><span class="small muted">Tính trên 40 lần làm gần nhất</span></div>
      <div class="lv-grid">${[['red', 'Yếu', 'dưới 50%', 'Học lại phần nền'], ['gold', 'Đang lên', '50-69%', 'Luyện riêng dạng này'], ['syn', 'Khá', '70-84%', 'Luyện trộn nhiều dạng'], ['sage', 'Vững', 'từ 85%', 'Vài ngày sau kiểm tra lại']].map(([c, n, r, t]) => `<div class="lv lv-${c}"><div class="lv-top"><b>${n}</b><span>${r}</span></div><div class="lv-t">${t}</div></div>`).join('')}</div></div>
    ${LY.map(L => `<div class="sec"><div class="sec-h"><div><div class="kicker">Tầng ${L.k} - ${esc(L.en)}</div><h2 class="h2">${esc(L.n)}</h2></div><span class="small muted" style="max-width:520px;text-align:right">${esc(L.d)}</span></div>
      <div class="grid g3">${SK.filter(s => s.layer === L.k).map(s => { const st = X.skillStats(s.id), b = BAND(st.acc), n = s.sel ? X.skillItems(s.id).length : 0;
        return `<div class="card skc"><div class="row"><b class="grow">${esc(s.n)}</b>${st.acc != null ? `<span class="pill ${b[2]}">${b[0]} - ${st.acc}%</span>` : '<span class="pill">Chưa đủ dữ liệu</span>'}</div>
          <div class="small faint">${esc(s.en)} - Part ${s.parts.map(p => p === 3 ? '3' : p).join(', ')}</div><div class="small muted" style="margin:6px 0 10px">${esc(s.d)}</div>
          <div class="bar ${b[2] === 'sage' ? 'sage' : b[2] === 'red' || b[2] === 'gold' ? 'ember' : ''}"><i style="width:${st.acc || 0}%"></i></div>
          <div class="row small" style="margin-top:8px"><span class="faint">${st.n} lần làm${n ? ` - ${n} câu trong kho` : ''}</span><span class="grow"></span>${n ? `<a class="btn sm ${st.acc != null && st.acc < 70 ? 'pri' : ''}" href="#/skill/${s.id}">Luyện 10 câu</a>` : s.id === 'selffix' ? '<a class="btn sm" href="#/errors">Mở Sổ lỗi</a>' : s.id === 'speed' ? '<a class="btn sm" href="#/lab">Lab tốc độ</a>' : '<a class="btn sm" href="#/tests">Làm đề</a>'}</div></div>`; }).join('')}</div></div>`).join('')}
    <div class="card sec"><div class="h3" style="margin-bottom:4px">Ma trận kỹ năng × Part</div><div class="small muted" style="margin-bottom:12px">Ô màu là độ chính xác của kỹ năng đó trong Part đó. Ô “-” là Part không kiểm tra kỹ năng này trực tiếp. Ô “+” là có câu luyện nhưng bạn chưa làm đủ.</div>
      <div class="ktw"><table class="kt mx"><tr><th>Kỹ năng</th>${parts.map(p => `<th>P${p}</th>`).join('')}</tr>
      ${SK.filter(s => s.layer <= 2).map(s => `<tr><td>${esc(s.n)}</td>${parts.map(p => { if (!cnt[s.id + '|' + p]) return '<td class="na">-</td>'; const st = X.skillStats(s.id, p); if (st.acc == null) return `<td class="nd" title="${cnt[s.id + '|' + p]} câu">+</td>`; const b = BAND(st.acc); return `<td class="c-${b[2]}"><a href="#/skill/${s.id}/${p}">${st.acc}</a></td>`; }).join('')}</tr>`).join('')}</table></div></div>
  </div>`;
});

X.route(/^\/skill\/(\w+)(?:\/(\d))?$/, (view, id, part) => {
  const s = X.skillById[id]; if (!s) return X.go('#/skills');
  const pool = X.skillItems(id).filter(i => !part || i.part === +part);
  if (!pool.length) return X.go('#/skills');
  const build = () => {
    const out = [], seen = new Set();
    // prioritise items never done or done wrong
    const st = S().itemStats; const pr = shuffle(pool).sort((a, b) => ((st[a.id]?.lastOk ?? -1) - (st[b.id]?.lastOk ?? -1)));
    for (const it of pr) { if (out.length >= 10) break; if (it.set && it.kind !== 'mcq') { if (seen.has(it.set)) continue; seen.add(it.set); out.push(...pool.filter(x => x.set === it.set).sort((a, b) => (a.pos || 0) - (b.pos || 0))); } else out.push(it); }
    return out.slice(0, 14);
  };
  X.quizFlow(view, { title: `${s.n}${part ? ' - Part ' + part : ''}`, kicker: 'Luyện theo kỹ năng', items: build(), mode: 'practice', listen: id === 'p2', ctx: 'skill:' + id, back: '#/skills', reshuffle: build }, { back: '#/skills' });
});
})();
