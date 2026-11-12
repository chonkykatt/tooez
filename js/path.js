/* TOOEZ — Master Path engine: Part → Unit → 4 stations (Hiểu - Từ vựng - Luyện - Kiểm tra) */
'use strict';
(() => {
const { $, $$, esc, icon, pct, shuffle, sample, fmtMs, LETTERS } = X;
const S = () => X.S();
const P = window.PATH || {};
const ST = [
  { k: 'learn', n: 'Học', d: 'Thẻ kiến thức: khái niệm, ví dụ, thử ngay', ic: 'read', min: 3 },
  { k: 'vocab', n: 'Từ vựng', d: 'Game 6 vòng: khám phá → ghép → nghe → phản xạ → vận dụng → nhớ lại', ic: 'words', min: 6 },
  { k: 'drill', n: 'Luyện', d: '10 câu đúng dạng, có giải thích từng câu', ic: 'bolt', min: 5 },
  { k: 'check', n: 'Kiểm tra', d: 'Không xem đáp án giữa chừng. Đạt 80% để mở bài sau', ic: 'target', min: 4 },
];
X.PATH_ST = ST;

/* ---------- data helpers ---------- */
X.TRACKS = [
  { k: 'nen', n: 'Nền tảng', vi: 'Từ vựng - ngữ pháp - âm', layer: 1, parts: [1, 2, 3, 4, 5, 6, 7] },
  { k: 'hieu', n: 'Hiểu', vi: 'Paraphrase - ngữ cảnh - suy luận', layer: 2, parts: [1, 2, 3, 4, 5, 6, 7] },
  ...X.PARTS.map(p => ({ ...p, layer: 3 })),
];
/* ---------- Lộ trình theo Part = các chủ đề "Học nhanh" của Thư viện ----------
   Học theo thứ tự khoa học: (0) Cách nghĩ + phương pháp của Part → mỗi chủ đề: học thẻ (khái niệm → ví dụ → thử ngay)
   → luyện đúng dạng đó → kiểm tra 80% → chủ đề sau. Từ vựng học riêng ở Kho từ vựng, không chen vào lộ trình. */
const DECK = pk => pk === 'p1' ? window.P1LIB : (window.LIBDECK || {})[pk];
const PART_OF = { p1: [1], p2: [2], p34: [3, 4], p5: [5], p6: [6], p7: [7] };
const txt = i => [i.skill, i.sub, i.prompt, (i.options || []).join(' '), i.explain].join(' ');
const q0 = i => ((i.audio && i.audio[0] && i.audio[0].t) || i.prompt || '').trim();
const isP2 = i => i.part === 2 && i.kind === 'p2';
const DRILL = {
  p1: { frame: i => i.tag === 'case', asp: i => i.lab === 'p1-asp' || (i.tag === 'case' && /being|been|bị động|trạng thái/i.test(txt(i))), evidence: i => i.tag === 'case', patterns: i => i.tag === 'case',
    position: i => i.part === 1 && /\b(next to|beside|on top of|under|between|in front of|behind|above|along|across|against|among|near)\b/i.test((i.options || []).join(' ')),
    general: i => i.part === 1 && i.tag === 'para', traps: i => i.part === 1 && (i.tag === 'confuse' || i.tag === 'case'), sound: i => i.part === 1 && i.tag === 'sound' },
  p2: { wh: i => i.qt === 'wh' || /^A[1-6]$/.test(i.sub || '') || (isP2(i) && /^(who|what|when|where|why|how|which|whose)\b/i.test(q0(i))),
    yesno: i => ['yn', 'neg', 'tag'].includes(i.qt) || i.sub === 'A7' || (isP2(i) && /^(do|does|did|is|are|was|were|have|has|can|will|should|isn't|aren't|don't|doesn't|didn't|haven't|hasn't|won't|wasn't)\b/i.test(q0(i))),
    request: i => ['req', 'sugg', 'invite'].includes(i.qt) || (isP2(i) && /^(could you|can you|would you|why don't|how about|would you like|let's|do you want|shall)\b/i.test(q0(i))),
    statement: i => i.qt === 'stmt' || (isP2(i) && !/\?\s*$/.test(q0(i))), alt: i => i.qt === 'alt' || i.sub === 'A8' || (isP2(i) && /\bor\b/i.test(q0(i)) && /\?\s*$/.test(q0(i))),
    indirect: i => !!i.indirect || i.lab === 'p2-100', traps: i => i.part === 2 && (i.tag === 'sound' || i.tag === 'confuse') },
  p34: { preread: i => i.tag === 'preread', order: i => [3, 4].includes(i.part) && i.kind === 'p34', signals: i => i.lab === 'p34-clues' || ['action', 'main', 'detail'].includes(i.cat),
    para: i => [3, 4].includes(i.part) && (i.tag === 'para' || i.lab === 'p34-para'), implied: i => i.tag === 'implied' || i.cat === 'implied', graphic: i => i.tag === 'graphic' || i.cat === 'graphic',
    p4: i => i.part === 4, traps: i => ['p34-traps', 'p34-answerdiff', 'p34-attitude'].includes(i.lab) },
  p5: { wordform: i => i.part === 5 && (i.cat === 'wordform' || i.tag === 'suffix' || /^A/.test(i.sub || '') || i.skill === 'Từ loại'), verb: i => i.part === 5 && (i.cat === 'verb' || /^B/.test(i.sub || '') || i.skill === 'Động từ'),
    pron: i => i.part === 5 && (i.cat === 'pron' || /^C/.test(i.sub || '') || /Đại từ|KHỐI C/.test(i.skill || '')), conn: i => i.part === 5 && (['conn', 'prep'].includes(i.cat) || /^D/.test(i.sub || '') || /Giới từ|KHỐI D/.test(i.skill || '')),
    rel: i => i.part === 5 && (i.cat === 'rel' || /^E/.test(i.sub || '') || /Mệnh đề|KHỐI E/.test(i.skill || '')), vocab: i => i.part === 5 && (i.cat === 'vocab' || i.tag === 'confuse' || /^F/.test(i.sub || '') || /Từ vựng|KHỐI F/.test(i.skill || '')) },
  p6: { tense: i => i.part === 6 && (i.lab === 'p6-tense' || i.cat === 'verb'), conn: i => i.part === 6 && (i.lab === 'p6-link' || i.cat === 'conn'), ref: i => i.part === 6 && (i.cat === 'pron' || i.lab === 'p6-link'),
    links: i => i.part === 6 && (i.lab === 'p6-link' || /Cần ngữ cảnh|Context/.test(i.skill || '')), insert: i => i.part === 6 && (i.lab === 'p6-insert' || /Điền cả câu|Insertion/.test(i.skill || '')),
    types: i => i.part === 6 && i.kind === 'p6', vocab: i => i.part === 6 && (i.cat === 'vocab' || /Vocabulary/.test(i.skill || '')) },
  p7: { qtypes: i => i.tag === 'radar', anchor: i => i.part === 7 && /Chi tiết|Scan/.test(i.skill || ''), not: i => i.part === 7 && /NOT/.test(i.skill || ''), infer: i => i.part === 7 && /Suy luận/.test(i.skill || ''),
    syn: i => i.part === 7 && (i.lab === 'para-vocab' || /đồng nghĩa/i.test(i.skill || '')), multi: i => i.part === 7 && /bài \d|Cầu nối|Liên kết văn bản/.test(i.skill || ''),
    para: i => i.part === 7 && (i.lab === 'para-restate' || i.tag === 'para'), chat: i => i.part === 7 && /Ý định|Mục đích/.test(i.skill || ''), insert: i => i.part === 7 && /Chèn|Điền câu/.test(i.skill || ''),
    traps: i => i.part === 7 && (i.lab === 'p7-trap' || /Bẫy|Loại trừ/.test(i.skill || '')) },
};
const realFmt = pk => i => PART_OF[pk].includes(i.part) && (pk === 'p1' ? i.tag === 'case' : pk === 'p2' ? isP2(i) : i.kind !== 'mcq');   // câu đúng dạng đề thật
Object.keys(PART_OF).forEach(pk => {
  const d = DECK(pk); if (!d || !P[pk]) return;
  const fin = P[pk].units.find(u => u.final), partAll = i => PART_OF[pk].includes(i.part);
  const size = f => X.BANK.filter(i => { try { return f(i); } catch (e) { return false; } }).length;
  const drillOf = id => { const f = (DRILL[pk] || {})[id]; if (f && size(f) >= 6) return f; return size(realFmt(pk)) >= 6 ? realFmt(pk) : partAll; };
  P[pk].units = [
    { id: pk + '_core', core: true, t: 'Cách nghĩ và phương pháp', vi: 'Bắt đầu từ đây', goal: (d.core && (d.core.mind || d.core.rule)) || 'Hiểu Part này chấm gì và làm theo quy trình nào.', drill: partAll },
    ...d.topics.map(t => ({ id: pk + '_' + t.id.replace(/-/g, '_'), deck: t.id, icon: t.icon, t: t.t, vi: `${t.cards.length} thẻ kiến thức`, goal: t.hook, drill: drillOf(t.id) })),
    ...(fin ? [fin] : []),
  ];
});
// Tầng bổ trợ (Nền tảng, Hiểu): giữ nội dung, bỏ trạm từ vựng
X.trackName = k => (X.TRACKS.find(t => t.k === k) || { n: k }).n;
const unitById = {}; Object.entries(P).forEach(([pk, part]) => part.units.forEach((u, i) => { u.pk = pk; u.no = i + 1; unitById[u.id] = u; }));
X.unitById = unitById;
X.unitWordsOf = u => {
  const out = [];
  (u.voc || []).forEach(s => { const [g, t] = s.split('@'); X.VOCAB.forEach(w => { if (w.group === g && w.topic === t) out.push(w); }); });
  return out;
};
X.unitDrillOf = u => X.BANK.filter(i => { try { return u.drill(i); } catch (e) { return false; } });
const stationsOf = u => u.final ? ['check'] : u.core ? ['learn'] : ST.map(s => s.k).filter(k => k !== 'vocab').filter(k => k !== 'learn' || u.deck || (u.cards && u.cards.length));
X.stationsOf = stationsOf;
const deckKey = u => u.pk === 'p1' ? 'p1lib-' + u.deck : `lib-${u.pk}-${u.deck}`;
const rec = (uid, k) => { const r = S().stations['U:' + uid + ':' + k]; if (r) return r; const u = unitById[uid]; if (k === 'learn' && u && u.deck && S().lessons[deckKey(u)]) return { done: S().lessons[deckKey(u)], best: 100 }; return null; };
const setRec = (uid, k, patch) => { const id = 'U:' + uid + ':' + k; S().stations[id] = Object.assign(S().stations[id] || { tries: 0 }, patch); X.save(); return S().stations[id]; };
const passed = u => { const r = rec(u.id, u.core ? 'learn' : 'check'); return !!(r && r.done); };
const stars = u => { if (u.core) return passed(u) ? 3 : 0; const r = rec(u.id, 'check'); if (!r || !r.best) return 0; return r.best >= 100 ? 3 : r.best >= 90 ? 2 : r.best >= 80 ? 1 : 0; };
X.unitStars = stars;
const unlocked = u => { const units = P[u.pk].units; const i = units.indexOf(u); return i === 0 || passed(units[i - 1]) || !!rec(u.id, 'learn') || units.slice(0, i).every(passed); };
const UL = pk => PART_OF[pk] ? 'Bài' : 'Unit';
const stHref = (u, k) => k === 'learn' && u.deck ? (u.pk === 'p1' ? `#/p1lib/${u.deck}` : `#/deck/${u.pk}/${u.deck}`) : `#/st/${u.id}/${k}`;
X.unitOfDeck = (pk, id) => (P[pk] ? P[pk].units.find(u => u.deck === id) : null);

/* override path stats used by Today / Progress */
X.pathStats = pk => {
  const units = (P[pk] || { units: [] }).units;
  let total = 0, done = 0, next = null;
  units.forEach(u => stationsOf(u).forEach(k => { total++; const r = rec(u.id, k); if (r && r.done) done++; else if (!next && unlocked(u)) next = { title: `${u.t} - ${ST.find(s => s.k === k).n}`, type: k, href: stHref(u, k) }; }));
  const tr = X.TRACKS.find(p => p.k === pk) || { parts: [1, 2, 3, 4, 5, 6, 7] };
  const skillIds = (units.flatMap(u => u.skills || []));
  const att = (tr.layer < 3 ? S().attempts.filter(a => { const it = X.itemById[a.i]; return it && X.skillsOf && X.skillsOf(it).some(x => skillIds.includes(x)); }) : S().attempts.filter(a => tr.parts.includes(a.p))).slice(-60);
  const acc = att.length ? pct(att.filter(a => a.ok).length, att.length) : null;
  const score = Math.round(pct(done, total) * 0.6 + (acc ?? 0) * 0.4);
  return { total, done, acc, score, n: att.length, next, level: X.levelOf(score), units: units.length, passed: units.filter(passed).length, stars: units.reduce((a, u) => a + stars(u), 0) };
};
X.stationHref = st => st.href || '#/path';

/* ---------- PART view ---------- */
const layerTabs = cur => `<div class="layers">${[3, 1, 2].map(L => { const ly = (window.LAYERS || [])[L - 1];
  const tabs = L === 4 ? [{ k: 'perf', n: 'Làm bài', vi: 'Đề - tốc độ - sổ lỗi' }] : X.TRACKS.filter(t => t.layer === L);
  return `<div class="lycol ${L === 3 ? 'wide' : ''}"><div class="kicker">${L === 3 ? 'Học chính - theo Part' : 'Bổ trợ - ' + esc(ly ? ly.n : '')}</div><div class="part-tabs" style="margin:6px 0 0">${tabs.map(t => { const s2 = t.k === 'perf' ? null : X.pathStats(t.k);
    return `<a class="part-tab ${t.k === cur ? 'on' : ''}" href="#/path/${t.k}"><b>${esc(t.n)}</b><small>${s2 ? `${s2.passed}/${s2.units} bài - ${s2.stars}★` : esc(t.vi)}</small>${s2 ? `<div class="bar thin"><i style="width:${pct(s2.done, s2.total)}%"></i></div>` : ''}</a>`; }).join('')}</div></div>`; }).join('')}</div>`;
X.route(/^\/path\/perf$/, view => X.go('#/tests'));
X.route(/^\/path\/perf-old$/, view => {
  const s = S(), tests = Object.values(s.tests).flat(), ec = X.errorCounts();
  view.innerHTML = `<div class="page"><div class="kicker">Lộ trình</div><h1 class="h1">Tầng 4 - Làm bài</h1>
    <p class="lead">Biết mà làm chậm, làm ẩu, hay chọn theo cảm giác thì vẫn mất điểm. Tầng này luyện tốc độ, độ chính xác dưới áp lực giờ, nhận diện bẫy và tự chữa lỗi.</p>
    ${layerTabs('perf')}
    <div class="grid g2 sec">
      <a class="card link lab-card" href="#/tests"><div class="kicker syn">Mô phỏng thi</div><div class="h2">Đề luyện bấm giờ</div><div class="small muted">Đề Part 2, 3-4, 5, 6, 7 và mini test trộn. Kết quả tách câu chắc-sai, lụi-trúng, sai theo vị trí câu, hụt sức nửa sau.</div><div class="row small"><span class="pill">${tests.length} lần làm</span></div></a>
      <a class="card link lab-card" href="#/lab"><div class="kicker syn">Tốc độ và phản xạ</div><div class="h2">Lab phản xạ</div><div class="small muted">Chế độ Tốc độ đếm ngược từng câu: đọc lướt câu hỏi, paraphrase, định vị bằng chứng, radar dạng câu.</div><div class="row small"><span class="pill">${Object.keys(X.LABS).length} module</span></div></a>
      <a class="card link lab-card" href="#/errors"><div class="kicker syn">Error Intelligence</div><div class="h2">Sổ lỗi</div><div class="small muted">Gọi tên nguyên nhân, viết quy tắc, làm lại đúng 2 lần cách ngày. Thống kê nguyên nhân sai hay gặp nhất của bạn.</div><div class="row small"><span class="pill ${ec.todo ? 'ember' : ''}">${ec.todo} lỗi chờ xử lý</span></div></a>
      <a class="card link lab-card" href="#/skills"><div class="kicker syn">Chẩn đoán</div><div class="h2">Bản đồ kỹ năng</div><div class="small muted">Mức thành thạo theo kỹ năng, không theo Part: tốc độ, độ tin cậy khi chọn, nhận diện đáp án nhiễu, và ma trận kỹ năng × Part.</div><div class="row small"><span class="pill">${X.SKILLS.length} kỹ năng</span></div></a>
    </div></div>`;
});
X.route(/^\/path(?:\/(\w+))?$/, (view, pk) => {
  pk = P[pk] ? pk : (S().profile.focus.find(k => P[k] && k !== 'nen' && k !== 'hieu') || 'p1');
  const part = P[pk], st = X.pathStats(pk);
  const curU = part.units.find(u => unlocked(u) && !passed(u));
  view.innerHTML = `<div class="page">
    ${X.stepHead('hoc')}<div class="kicker">Lộ trình</div><h1 class="h1">${esc(part.title)}</h1>
    <p class="lead">${part.layer === 1 ? 'Năng lực tiếng Anh nền dùng cho cả 7 Part. Học song song với Part, mỗi tuần vài unit.' : part.layer === 2 ? 'Kỹ năng hiểu dùng chung cho Nghe và Đọc. Học một lần ở đây, Part 2, 3, 4, 6, 7 đều dùng lại.' : 'Cách xử lý riêng của Part này.'} ${PART_OF[pk] ? `Bắt đầu bằng bài 1 (cách nghĩ và phương pháp), rồi học lần lượt ${part.units.length - 2} chủ đề, cuối cùng là bài tổng hợp. Mỗi chủ đề khoảng 15 phút: <b>học thẻ</b> (khái niệm, ví dụ, thử ngay) → <b>luyện</b> đúng dạng đó → <b>kiểm tra</b>, đạt 80% thì sang chủ đề sau. Từ vựng học riêng ở Kho từ vựng.` : `${part.units.length} unit, mỗi unit: kiến thức → luyện → kiểm tra. Qua 80% thì unit sau mở.`}</p>
    ${layerTabs(pk)}
    <div class="card tint row sec" style="margin-top:18px"><div class="grow">${X.lvlHtml(st.score)} <span class="muted small">- ${st.passed}/${st.units} bài đã qua - ${st.stars}/${st.units * 3} sao${st.acc !== null ? ` - đúng ${st.acc}% gần đây` : ''}</span></div>
      ${curU ? `<a class="btn pri" href="#/unit/${curU.id}">Tiếp tục: ${UL(pk)} ${curU.no} - ${esc(curU.t)} ${icon('arrow')}</a>` : '<span class="pill sage">Đã qua toàn bộ Part</span>'}</div>
    <div class="utrack">${part.units.map(u => unitRow(u, u === curU)).join('')}</div></div>`;
  $$('.urow.lock', view).forEach(a => a.onclick = e => { e.preventDefault(); X.toast('Qua bài kiểm tra của bài trước để mở bài này.'); });
});
function unitRow(u, cur) {
  const lock = !unlocked(u), sts = stationsOf(u), sc = stars(u);
  const doneN = sts.filter(k => rec(u.id, k)?.done).length;
  return `<a class="urow ${lock ? 'lock' : ''} ${cur ? 'cur' : ''} ${passed(u) ? 'done' : ''} ${u.final ? 'final' : ''}" style="--uc:${['var(--syn)','var(--ember)','var(--sky)','var(--gold)','var(--mint)'][(u.no - 1) % 5]}" href="${lock ? 'javascript:void 0' : '#/unit/' + u.id}">${cur ? `<span class="peek">${X.xi('wow', 60)}</span>` : ''}
    <span class="unum">${passed(u) ? icon('check') : lock ? icon('lock') : u.final ? '★' : u.no}</span>
    <span class="ubody"><span class="ut">${esc(u.t)}</span><span class="uv">${esc(u.vi)}</span><span class="ug">${esc(u.goal)}</span></span>
    <span class="umeta"><span class="sdots">${sts.map(k => `<i class="${rec(u.id, k)?.done ? 'on' : ''}" title="${ST.find(s => s.k === k).n}"></i>`).join('')}</span>
      <span class="ustars">${[1, 2, 3].map(i => `<b class="${i <= sc ? 'on' : ''}">★</b>`).join('')}</span><span class="small faint">${u.final ? 'Tổng hợp' : `~${sts.reduce((a, k) => a + ST.find(s => s.k === k).min, 0)} phút`}</span></span></a>`;
}

/* Aha! đi kèm từng bài: insight liên quan nhất của đúng Part đó (+ tư duy chung) */
const AHA_PICK = { p1: { asp: 'being', evidence: 'nhìn thấy', frame: 'nhìn thấy' }, p2: { indirect: 'thẳng', request: 'Why don', traps: 'Lỡ mất', statement: 'thẳng' },
  p34: { order: 'thứ tự', signals: 'but', implied: 'ngụ ý', preread: 'Đọc có mục đích', traps: 'but' }, p5: { wordform: 'vị trí', conn: 'Giới từ', vocab: 'So nghĩa', verb: 'vị trí' },
  p6: { tense: 'Thì', insert: 'điền cả câu', links: 'điền cả câu', conn: 'Giới từ' }, p7: { qtypes: 'câu hỏi trước', anchor: 'câu hỏi trước', multi: 'Bài kép', para: 'So nghĩa', syn: 'So nghĩa' } };
const AHA_G = { p1: 'Part 1', p2: 'Part 2', p34: 'Part 3-4', p5: 'Part 5', p6: 'Part 6', p7: 'Part 7' };
const ahaFor = u => {
  const G = window.AHA || [], all = G.flatMap((g, gi) => g.items.map((c, ci) => ({ ...c, g: g.g, k: gi + '-' + ci })));
  const mine = all.filter(c => AHA_G[u.pk] && c.g.startsWith(AHA_G[u.pk])), gen = all.filter(c => /chung/i.test(c.g));
  if (u.core) return gen.filter(c => /chắc|giãn cách/i.test(c.t)).slice(0, 2);
  const kw = (AHA_PICK[u.pk] || {})[u.deck], hit = kw && all.find(c => (c.t + ' ' + c.why).includes(kw));
  const pool = [...mine, ...gen], n = P[u.pk].units.indexOf(u);
  return [hit || pool[n % pool.length]].filter(Boolean);
};
const ahaHtml = u => { const L = ahaFor(u); return L.length ? `<div class="sec"><div class="kicker" style="margin-bottom:8px">💡 Aha! cho bài này</div>${L.map(c => `<div class="card aha-u"><div class="aha-t">${esc(c.t)}</div><div class="small">${c.why}</div>${c.ex && c.ex.length ? `<div class="small muted" style="margin-top:6px">${c.ex.map(esc).join('<br>')}</div>` : ''}${c.limit ? `<div class="small" style="margin-top:6px"><b>Khi nào không đúng:</b> ${esc(c.limit)}</div>` : ''}</div>`).join('')}<div class="small muted" style="margin-top:8px">Xem tất cả ở <a href="#/library/aha">Sổ tay ôn nhanh</a>.</div></div>` : ''; };
/* ---------- UNIT view ---------- */
X.route(/^\/unit\/(\w+)$/, (view, uid) => {
  const u = unitById[uid]; if (!u) return X.go('#/path');
  const part = P[u.pk], sts = stationsOf(u), words = X.unitWordsOf(u), drill = X.unitDrillOf(u);
  const nextK = sts.find(k => !rec(u.id, k)?.done) || 'check';
  const learnedW = words.filter(w => S().words[w.id]).length;
  const nextU = part.units[part.units.indexOf(u) + 1];
  view.innerHTML = `<div class="page"><a href="#/path/${u.pk}" class="small">${icon('back')} ${esc(part.title)}</a>
    <div class="uhero"><div class="kicker" style="margin-top:16px">${UL(u.pk)} ${u.no}/${part.units.length}</div><h1 class="h1">${esc(u.t)}</h1><div class="h2" style="font-weight:500;color:var(--ink-soft)">${esc(u.vi)}</div>
      <div class="goal">${icon('target')}<div><div class="kicker syn">Sau bài này bạn sẽ</div><div style="font-size:17px;font-weight:600;margin-top:2px">${esc(u.goal)}</div></div></div>
      ${(() => { const ids = u.skills || (() => { const c = {}; drill.forEach(i => (X.skillsOf ? X.skillsOf(i) : []).forEach(k => { if (X.skillById[k].layer < 3) c[k] = (c[k] || 0) + 1; })); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]); })();
        return ids.length ? `<div class="row small" style="margin-bottom:12px"><span class="muted">Kỹ năng luyện:</span>${ids.map(k => X.skillById[k] ? `<a class="pill syn" href="#/skills">${esc(X.skillById[k].n)}</a>` : '').join('')}</div>` : ''; })()}
      <div class="row"><span class="ustars big">${[1, 2, 3].map(i => `<b class="${i <= stars(u) ? 'on' : ''}">★</b>`).join('')}</span><span class="small muted">${stars(u) ? `Điểm kiểm tra tốt nhất ${rec(u.id, 'check').best}%` : '80% = 1 sao - 90% = 2 sao - 100% = 3 sao'}</span></div></div>
    <div class="stlist">${sts.map((k, i) => { const s = ST.find(x => x.k === k), r = rec(u.id, k);
      const meta = k === 'vocab' ? `${learnedW}/${words.length} từ đã học - mỗi lượt 8 từ` : k === 'drill' ? `${drill.length} câu trong kho` : k === 'learn' ? (u.core ? 'Cách nghĩ + quy trình 4 bước' : `${u.deck ? ((DECK(u.pk).topics.find(t => t.id === u.deck) || {}).cards || []).length : u.cards.length} thẻ - khái niệm, ví dụ, thử ngay`) : u.final ? `${Math.min(drill.length, finalSize(u))} câu` : `10 câu`;
      return `<a class="stc ${r?.done ? 'done' : ''} ${k === nextK ? 'next' : ''}" style="--sc:${{ learn: 'var(--sky)', vocab: 'var(--gold)', drill: 'var(--ember)', check: 'var(--syn)' }[k]}" href="${stHref(u, k)}"><span class="sn">${r?.done ? icon('check') : i + 1}</span><span class="grow"><b>${s.n}</b><span class="small muted"> - ${meta}${r?.best != null ? ` - tốt nhất ${r.best}%` : ''}</span><div class="small faint">${s.d}</div></span><span class="btn sm ${k === nextK ? 'pri' : ''}">${r?.done ? 'Làm lại' : 'Bắt đầu'}</span></a>`; }).join('')}</div>
    ${PART_OF[u.pk] && !u.final ? ahaHtml(u) : ''}
    ${u.lib && u.lib.length ? `<div class="small muted sec">Muốn đọc kỹ hơn: ${u.lib.map(l => `<a href="#/lesson/${l}">bài đọc thêm</a>`).join(', ')}.</div>` : ''}
    ${passed(u) && nextU ? `<div class="row sec"><a class="btn pri" href="#/unit/${nextU.id}">${UL(u.pk)} ${nextU.no}: ${esc(nextU.t)} ${icon('arrow')}</a></div>` : ''}</div>`;
});
const finalSize = u => u.pk === 'p2' ? 25 : u.pk === 'p5' ? 30 : u.pk === 'p6' ? 16 : u.pk === 'p34' ? 24 : 20;

/* ---------- STATIONS ---------- */
X.route(/^\/st\/(\w+)\/(\w+)$/, (view, uid, k) => {
  const u = unitById[uid]; if (!u) return X.go('#/path');
  if (k === 'learn' && u.core) return runCore(view, u);
  if (k === 'learn' && u.deck) return X.go(stHref(u, 'learn'));
  if (k === 'learn') return runCards(view, u);
  if (k === 'vocab') return X.vocabGame(view, pickWords(u), { title: `${u.t} - Từ vựng`, back: '#/unit/' + u.id, onDone: res => { const sc = res.acc; const r = setRec(u.id, 'vocab', { tries: (rec(u.id, 'vocab')?.tries || 0) + 1, best: Math.max(rec(u.id, 'vocab')?.best || 0, sc) }); if (!r.done) { r.done = Date.now(); X.addXP(10, 'Xong game từ vựng'); X.save(); } }, next: { href: stHref(u, 'drill'), label: 'Sang trạm Luyện' } });
  if (k === 'drill') return runDrill(view, u);
  if (k === 'check') return runCheck(view, u);
  X.go('#/unit/' + uid);
});

function pickWords(u) {
  const ws = X.unitWordsOf(u);
  const fresh = ws.filter(w => !S().words[w.id]).sort((a, b) => (b.freq || 0) - (a.freq || 0));
  if (fresh.length) return shuffle(fresh.slice(0, 16)).slice(0, 8);
  return ws.sort((a, b) => (S().words[a.id].lvl - S().words[b.id].lvl) || (S().words[a.id].due - S().words[b.id].due)).slice(0, 8);
}

function runCore(view, u) {
  const part = X.PARTS.find(p => p.k === u.pk) || { n: P[u.pk].title }, nu = P[u.pk].units[1];
  view.innerHTML = `<div class="page"><a href="#/path/${u.pk}" class="small">${icon('back')} Lộ trình ${esc(part.n)}</a>
    <div class="kicker" style="margin-top:14px">Bài 1 - đọc trước khi học chủ đề</div><h1 class="h1">${esc(part.n)}: cách nghĩ và phương pháp</h1>
    <p class="lead">Nắm khung tư duy này trước, các chủ đề sau chỉ là áp dụng nó cho từng dạng câu.</p>
    <div id="core-box" style="margin-top:14px">${X.libTop ? X.libTop(u.pk) : ''}</div>
    <div class="row sec"><button class="btn pri lg" id="core-ok">Đã hiểu, sang chủ đề 1 ${icon('arrow')}</button></div></div>`;
  const box = $('#core-box', view), st4 = $('.steps4', box);
  if (st4) { let n = st4.nextElementSibling; while (n) { const nx = n.nextElementSibling; n.remove(); n = nx; } }
  $('#core-ok', view).onclick = () => { const r = setRec(u.id, 'learn', { best: 100 }); if (!r.done) { r.done = Date.now(); X.addXP(5, 'Xong bài mở đầu'); X.save(); } X.go(nu ? '#/unit/' + nu.id : '#/path/' + u.pk); };
}
X.deckDone = (pk, id) => { const u = X.unitOfDeck(pk, id); return u ? { href: stHref(u, 'drill'), label: 'Luyện ngay chủ đề này', back: '#/unit/' + u.id } : null; };
function runCards(view, u) {
  let i = 0, ok = 0; const cards = u.cards;
  const sKey = X.hereKey(), sv = X.sessGet(sKey);
  if (sv && sv.kind === 'cards') { i = Math.min(sv.i, cards.length - 1); ok = sv.ok || 0; setTimeout(() => X.toast(`Làm tiếp từ thẻ ${i + 1}/${cards.length}`), 50); }
  const draw = () => {
    if (i < cards.length) X.sessSet(sKey, { kind: 'cards', title: u.t + ' - Kiến thức', n: cards.length, i, ok });
    if (i >= cards.length) {
      X.sessDel(sKey);
      const r = setRec(u.id, 'learn', { best: pct(ok, cards.length) }); if (!r.done) { r.done = Date.now(); X.addXP(5, 'Xong phần Kiến thức'); X.save(); }
      if (ok === cards.length) { X.sfx.win(); X.rain(40); }
      view.innerHTML = `<div class="page"><div class="qz" style="max-width:720px"><div class="kicker">${esc(u.t)} - Kiến thức</div><div class="hello">${X.xi(ok === cards.length ? 'happy' : 'think', 92)}<h1 class="h1">Đúng ${ok}/${cards.length} câu kiểm tra</h1></div>
        <p class="lead">${ok === cards.length ? 'Nắm được ý chính rồi. Sang phần từ vựng để có đủ “nguyên liệu” khi làm bài.' : 'Đọc lại thẻ chưa đúng nếu cần, rồi sang phần từ vựng.'}</p>
        <div class="row sec"><a class="btn pri" href="${stHref(u, stationsOf(u).includes('vocab') ? 'vocab' : 'drill')}">Trạm tiếp ${icon('arrow')}</a><button class="btn" id="cr-again">Xem lại thẻ</button><a class="btn ghost" href="#/unit/${u.id}">Về unit</a></div></div></div>`;
      $('#cr-again', view).onclick = () => { i = 0; ok = 0; draw(); };
      return;
    }
    const c = cards[i]; let answered = false;
    view.innerHTML = `<div class="page"><div class="qz" style="max-width:720px">
      <div class="qz-top"><a class="icon-btn" href="#/unit/${u.id}">${icon('x')}</a><div><div class="kicker">${esc(u.t)} - Kiến thức</div></div><div class="bar"><i style="width:${pct(i, cards.length)}%"></i></div><span class="count">${i + 1}/${cards.length}</span></div>
      <div class="kcard2"><div class="kicker syn">Thẻ ${i + 1}</div><h2 class="h2" style="margin:6px 0 12px">${esc(c.h)}</h2><div class="kb">${c.b}</div>
        ${c.ex && c.ex.length ? `<div class="kex">${c.ex.map(e => `<button class="exl" data-say="${esc(e.replace(/<[^>]+>/g, '').replace(/^[✓✗]\s*/, ''))}">${icon('vol')}<span>${e}</span></button>`).join('')}</div>` : ''}</div>
      ${c.q ? `<div class="q-card" style="margin-top:16px"><div class="kicker">Kiểm tra nhanh</div><div class="q-prompt">${esc(c.q.q)}</div><div class="opts">${c.q.o.map((o, k) => `<button class="opt" data-o="${k}"><span class="L">${LETTERS[k]}</span><span>${esc(o)}</span></button>`).join('')}</div><div id="cr-fb"></div></div>` : ''}
      <div class="qz-actions"><button class="btn pri" id="cr-n" ${c.q ? 'disabled' : ''}>${i < cards.length - 1 ? 'Thẻ tiếp' : 'Xong'} ${icon('arrow')}</button></div></div></div>`;
    $$('[data-say]', view).forEach(b => b.onclick = () => X.say(b.dataset.say));
    $$('[data-o]', view).forEach(b => b.onclick = () => {
      if (answered) return; answered = true; const k = +b.dataset.o, good = k === c.q.a; if (good) { ok++; X.addXP(1); }
      $$('[data-o]', view).forEach((x, j) => { if (j === c.q.a) x.classList.add('ok'); else if (j === k) x.classList.add('bad'); });
      $('#cr-fb', view).innerHTML = `<div class="fb ${good ? 'ok' : 'bad'}">${X.xi(good ? 'happy' : 'sad', 52)}<div><b class="h">${good ? 'Chính xác!' : 'Chưa đúng.'}</b><div>${esc(c.q.why || '')}</div></div></div>`;
      X.react(good, $$('[data-o]', view)[good ? c.q.a : k], 0);
      $('#cr-n', view).disabled = false;
    });
    $('#cr-n', view).onclick = () => { i++; draw(); };
    document.onkeydown = e => { if (/^[1-4]$/.test(e.key)) { const b = $$('[data-o]', view)[+e.key - 1]; if (b) b.click(); } else if (e.key === 'Enter' && !$('#cr-n', view).disabled) { i++; draw(); } };
  };
  draw();
}

function fillItems(u, n, pool) {
  let items = shuffle(pool);
  // keep sets together for passage-based items
  const out = []; const seen = new Set();
  for (const it of items) {
    if (out.length >= n) break;
    if (it.set && it.kind !== 'mcq') { if (seen.has(it.set)) continue; seen.add(it.set); const g = X.BANK.filter(x => x.set === it.set && pool.includes(x)).sort((a, b) => (a.pos || 0) - (b.pos || 0)); out.push(...g); }
    else out.push(it);
  }
  if (out.length < Math.min(6, n)) {
    const ws = X.unitWordsOf(u); if (ws.length >= 4) out.push(...X.vocabQuizItems(ws, Math.min(ws.length, n - out.length)));
  }
  return out.slice(0, n + 4);
}

function runDrill(view, u) {
  const pool = X.unitDrillOf(u);
  const build = () => fillItems(u, 10, pool);
  const listen = u.pk === 'p2';
  X.quizFlow(view, { title: `${u.t} - Luyện`, kicker: `${UL(u.pk)} ${u.no} - Luyện`, items: build(), mode: 'practice', listen, ctx: 'path:' + u.id, back: '#/unit/' + u.id, reshuffle: build },
    { back: '#/unit/' + u.id, onDone: res => { const sc = pct(res.correct, res.total); const r = setRec(u.id, 'drill', { tries: (rec(u.id, 'drill')?.tries || 0) + 1, best: Math.max(rec(u.id, 'drill')?.best || 0, sc) }); if (!r.done) { r.done = Date.now(); X.addXP(10, 'Xong trạm Luyện'); X.save(); } },
      next: { href: stHref(u, 'check'), label: 'Làm bài kiểm tra' } });
}

function runCheck(view, u) {
  const pool = X.unitDrillOf(u);
  const n = u.final ? finalSize(u) : 10;
  const build = () => {
    let its = fillItems(u, u.final ? n : 8, pool);
    if (!u.final) { const ws = X.unitWordsOf(u); if (ws.length >= 4) its = [...its.slice(0, 8), ...X.vocabQuizItems(ws, 2)]; }
    return its;
  };
  const items = build();
  const mins = Math.max(3, Math.round(items.reduce((a, i) => a + (i.kind === 'p7' ? 75 : i.kind === 'p34' ? 40 : i.kind === 'p6' ? 35 : 25), 0) / 60));
  view.innerHTML = `<div class="page"><a href="#/unit/${u.id}" class="small">${icon('back')} ${esc(u.t)}</a><div class="kicker" style="margin-top:14px">Kiểm tra</div><h1 class="h1">${esc(u.t)}</h1>
    <div class="card sec" style="max-width:620px"><div class="row"><span class="pill">${items.length} câu</span><span class="pill">${mins} phút</span><span class="pill syn">Đạt từ 80%</span></div>
    <ul class="small muted" style="padding-left:18px;margin:14px 0"><li>Làm hết rồi mới xem đáp án, có thể quay lại câu trước.</li><li>Đánh dấu <b>chắc / phân vân / lụi</b> cho từng câu. Câu lụi trúng vẫn vào Sổ lỗi.</li><li>80% = 1 sao và mở unit sau - 90% = 2 sao - 100% = 3 sao.</li></ul>
    ${X.resumeCard(X.hereKey(), () => go())}<button class="btn pri lg" id="ck-go">Bắt đầu ${icon('arrow')}</button></div></div>`;
  $('#ck-go', view).onclick = () => { X.sessDel(X.hereKey()); go(); };
  const go = () => X.quizFlow(view, { title: `${u.t} - Kiểm tra`, kicker: `${UL(u.pk)} ${u.no} - Kiểm tra`, items, mode: 'test', timeLimit: mins * 60, listen: u.listen || u.pk === 'p2', ctx: 'check:' + u.id, back: '#/unit/' + u.id, reshuffle: build },
    { back: '#/unit/' + u.id, passMark: 80,
      onDone: res => { const sc = pct(res.correct, res.total); const before = stars(u); const r = setRec(u.id, 'check', { tries: (rec(u.id, 'check')?.tries || 0) + 1, best: Math.max(rec(u.id, 'check')?.best || 0, sc) });
        if (sc >= 80 && !r.done) { r.done = Date.now(); X.addXP(25); X.save(); }
        const after = stars(u); if (after > before) setTimeout(() => X.celebrate({ title: before ? 'Lên sao rồi!' : `Qua ${UL(u.pk)} ${u.no}!`, sub: `${esc(u.t)} - ${sc}% chính xác`, stars: after, xp: before ? 0 : 25, btn: 'Xem kết quả' }), 300); },
      get next() { const nu = P[u.pk].units[P[u.pk].units.indexOf(u) + 1]; return passed(u) && nu ? { href: '#/unit/' + nu.id, label: `${UL(u.pk)} ${nu.no}: ${nu.t}` } : null; } });
}
})();
