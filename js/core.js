/* TOOEZ — core: store, utils, icons, voice, SRS, XP, path model, router */
'use strict';
const X = (window.X = {});

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const now = () => Date.now();
const DAY = 864e5;
const today = (t = now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fmtMs = ms => { const s = Math.round(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`; };
const fmtDate = t => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const LETTERS = 'ABCD';
Object.assign(X, { $, $$, esc, shuffle, sample, pct, now, DAY, today, fmtMs, fmtDate, LETTERS });

/* ---------------- icons (inline SVG paths) ---------------- */
const IC = {
  today: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  path: '<path d="M4 19h4V5H4zM10 19h4V9h-4zM16 19h4v-7h-4z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  lab: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
  words: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
  err: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  test: '<path d="M9 4h6v3H9z"/><path d="M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/><path d="m9 14 2 2 4-4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  check: '<path d="M5 12.5 10 17 19 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  flame: '<path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4s.5 2 2 2.5C10 9 12 3 12 3z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  read: '<path d="M2 6s3-2 10-2 10 2 10 2v14s-3-2-10-2-10 2-10 2z"/><path d="M12 4v16"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8"/><path d="M20 3v5h-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  coach: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14a6 6 0 0 1 3 6"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24">${IC[n] || ''}</svg>`;
X.icon = icon;

/* ---------------- store ---------------- */
const KEY = 'toeic-xray.v1';
const DEF = () => ({
  v: 1, created: now(),
  profile: { name: '', current: '', target: '', examDate: '', dailyGoal: 60, newWords: 10, focus: ['nen', 'p2', 'p34'], accent: 'en-US', rate: 1 },
  xp: { total: 0, days: {} },
  lessons: {}, stations: {}, itemStats: {}, attempts: [],
  words: {}, errors: [], labs: {}, tests: {}, seenTips: {},
});
let S;
try { S = Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = DEF(); }
S.profile = Object.assign(DEF().profile, S.profile || {});
let saveT;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); } }, 120); };
X.S = () => S; X.save = save;
X.resetAll = () => { S = DEF(); localStorage.setItem(KEY, JSON.stringify(S)); };
X.exportData = () => JSON.stringify(S);
// xin trình duyệt đừng tự xóa dữ liệu khi máy đầy bộ nhớ hoặc lâu không mở (không phải trình duyệt nào cũng đồng ý)
try { navigator.storage && navigator.storage.persist && navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }); } catch (e) {}
X.importData = txt => { const d = JSON.parse(txt); if (!d || !d.v) throw new Error('File không đúng định dạng'); S = Object.assign(DEF(), d); save(); };

/* ---------------- XP, streak ---------------- */
X.addXP = (n, why) => {
  if (!n) return;
  S.xp.total += n; const d = today(); S.xp.days[d] = (S.xp.days[d] || 0) + n; save();
  const goal = S.profile.dailyGoal, t = S.xp.days[d];
  if (t >= goal && t - n < goal) X.toast(`${icon('flame')} Đạt mục tiêu hôm nay! <span class="xp">${t} XP</span>`, 3200);
  else if (why) X.toast(`${why} <span class="xp">+${n} XP</span>`);
  X.renderSide && X.renderSide();
};
X.xpToday = () => S.xp.days[today()] || 0;
X.streak = () => {
  // consecutive study days; one rest day allowed per 7 days without breaking the streak
  let n = 0, lastRest = -99, t = now();
  if (!S.xp.days[today(t)]) t -= DAY;
  for (let i = 0; i < 500; i++) {
    if (S.xp.days[today(t - i * DAY)]) n++;
    else if (n > 0 && i - lastRest >= 7) lastRest = i;
    else break;
  }
  return n;
};

/* ---------------- attempts & item stats ---------------- */
X.logAttempt = (item, ok, ms, conf, ctx) => {
  S.attempts.push({ t: now(), i: item.id, p: item.part, s: item.skill || '', ok: ok ? 1 : 0, ms: Math.round(ms || 0), c: conf || '', x: ctx || '' });
  if (S.attempts.length > 6000) S.attempts.splice(0, S.attempts.length - 6000);
  const st = (S.itemStats[item.id] ||= { n: 0, ok: 0 });
  st.n++; if (ok) st.ok++; st.last = now(); st.lastOk = ok ? 1 : 0;
  save();
};

/* ---------------- error log ---------------- */
X.CAUSES = [
  ['vocab', 'Từ vựng'], ['grammar', 'Ngữ pháp'], ['listen', 'Nghe không ra'], ['read', 'Đọc hiểu sai'], ['colloc', 'Collocation'],
  ['para', 'Không nhận ra paraphrase'], ['infer', 'Suy luận'], ['trap', 'Dính bẫy'], ['speed', 'Hết giờ / chậm'], ['careless', 'Ẩu'],
];
X.causeName = k => (X.CAUSES.find(c => c[0] === k) || [0, k || '—'])[1];
X.addError = (item, chosen, conf, src) => {
  const ex = S.errors.find(e => e.item === item.id && e.status !== 'fixed');
  if (ex) { ex.times = (ex.times || 1) + 1; ex.chosen = chosen; ex.conf = conf; ex.at = now(); save(); return ex; }
  const e = { id: 'e' + now().toString(36) + Math.random().toString(36).slice(2, 5), item: item.id, part: item.part, skill: item.skill || '', chosen, conf: conf || '', src: src || '', at: now(), status: 'open', cause: '', note: '', rule: '', box: 0, due: 0, times: 1, lucky: conf === 'guess' && chosen === item.answer };
  S.errors.unshift(e); save(); return e;
};
// lỗi "đến hạn" tính theo ngày: hẹn ngày nào thì cả ngày hôm đó đều làm được, không phải đợi đúng giờ
X.inDays = n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return +d; };
X.errDue = e => e.status === 'review' && e.due <= new Date().setHours(23, 59, 59, 999);
X.errorCounts = () => {
  const open = S.errors.filter(e => e.status === 'open').length;
  const due = S.errors.filter(X.errDue).length;
  return { open, due, todo: open + due };
};

/* ---------------- SRS (FSRS-lite) ---------------- */
// grade: 1 again, 2 hard, 3 good, 4 easy
X.srsReview = (wid, grade, type) => {
  const w = (S.words[wid] ||= { s: 0, d: 5, due: 0, reps: 0, lapses: 0, lvl: 0, types: [] });
  const t = now();
  if (!w.reps) w.s = [0.02, 0.6, 1.5, 4][grade - 1];
  else if (grade === 1) { w.s = Math.max(0.02, w.s * 0.25); w.lapses++; w.d = Math.min(10, w.d + 1); }
  else {
    const f = { 2: 0.6, 3: 1.5, 4: 2.6 }[grade] * (1 + (10 - w.d) / 20);
    const elapsed = w.last ? (t - w.last) / DAY : 0, ratio = Math.min(1.5, Math.max(0.4, elapsed / Math.max(w.s, 0.02)));
    w.s = Math.min(365, w.s * (1 + f * ratio));
    if (grade === 4) w.d = Math.max(1, w.d - 0.5);
  }
  w.reps++; w.last = t; w.due = t + w.s * DAY;
  if (grade > 1 && type && !w.types.includes(type)) w.types.push(type);
  // levels: 1 nhận ra, 2 hiểu (2 kiểu bài), 3 nhớ chủ động (gõ lại đúng), 4 thành thạo (S>=21 ngày & đã nhớ chủ động)
  let lvl = grade > 1 ? Math.max(1, w.lvl) : Math.min(w.lvl, 2);
  if (w.types.length >= 2 && grade > 1) lvl = Math.max(lvl, 2);
  if (type === 'type' && grade > 1) lvl = Math.max(lvl, 3);
  if (lvl >= 3 && w.s >= 21) lvl = 4;
  w.lvl = lvl; save(); return w;
};
X.wordDue = () => Object.entries(S.words).filter(([, w]) => w.reps && w.due <= now()).map(([id]) => id);
X.LEVELS = ['Mới', 'Nhận ra', 'Hiểu', 'Nhớ chủ động', 'Thành thạo'];

/* ---------------- data access ---------------- */
X.PARTS = [
  { k: 'p1', n: 'Part 1', name: 'Photographs', vi: 'Mô tả tranh', parts: [1] },
  { k: 'p2', n: 'Part 2', name: 'Question-Response', vi: 'Hỏi đáp', parts: [2] },
  { k: 'p34', n: 'Part 3-4', name: 'Conversations & Talks', vi: 'Hội thoại - Bài nói', parts: [3, 4] },
  { k: 'p5', n: 'Part 5', name: 'Incomplete Sentences', vi: 'Điền câu', parts: [5] },
  { k: 'p6', n: 'Part 6', name: 'Text Completion', vi: 'Điền đoạn văn', parts: [6] },
  { k: 'p7', n: 'Part 7', name: 'Reading Comprehension', vi: 'Đọc hiểu', parts: [7] },
];
X.partOf = n => X.PARTS.find(p => p.parts.includes(+n)) || X.PARTS[0];
X.BANK = window.BANK || [];
// Part 1 dạng đề thật: chỉ nghe 4 câu (A)-(D), chữ hiện sau khi làm xong
X.BANK.forEach(i => { if (i.src === 'p1case') { i.ao = 1; i.audio = i.options.map((o, k) => ({ s: 'M', t: `(${'ABCD'[k]}) ${o}` })); } }); X.VOCAB = window.VOCAB || []; X.LABS = window.LABS || {}; X.UNITS = window.UNITS || {};
// Bài nghe: câu nằm trong audio thì không in sẵn ra, chọn xong mới hiện (và tô từ quan trọng)
X.BANK.forEach(i => {
  if (!(i.part <= 4) || !i.audio || !i.audio.length) return;
  if (i.src === 'qtype') { i.hideq = 'prompt'; i.ask = 'Nghe câu, chọn đúng dạng câu.'; }
  else if (i.src === 'phrase' && i.tag === 'func') { i.hideq = 'prompt'; i.ask = 'Nghe cụm câu, chọn đúng chức năng.'; }
  else if (i.src === 'nghe-p34' && /^Nghe: /.test(i.context || '')) i.hideq = 'context';
});
X.itemById = Object.fromEntries(X.BANK.map(i => [i.id, i]));
X.wordById = Object.fromEntries(X.VOCAB.map(w => [w.id, w]));

const loaded = {};
X.loadKnowledge = pk => new Promise((res, rej) => {
  const v = 'K_' + pk.toUpperCase();
  if (window[v]) return res(window[v]);
  if (loaded[pk]) return loaded[pk].then(res, rej);
  loaded[pk] = new Promise((r2, j2) => { const s = document.createElement('script'); s.src = `data/k/${pk}.js`; s.onload = () => r2(window[v]); s.onerror = j2; document.head.appendChild(s); });
  loaded[pk].then(res, rej);
});

/* ---------------- path model ---------------- */
// Each Part = units; each unit = lesson stations + one practice station (+ Part final check)
const norm = s => String(s || '').toLowerCase().replace(/^[\d.\sA-G]+\s*/, '').replace(/\s+/g, ' ').trim();
X.unitWords = u => {
  const titles = new Set(u.lessons.map(l => norm(l.title)));
  return X.VOCAB.filter(w => w.topics.some(t => titles.has(norm(t))));
};
X.unitItems = (pk, u) => {
  const parts = X.PARTS.find(p => p.k === pk).parts;
  if (u.blocks && u.blocks.length) return X.BANK.filter(i => parts.includes(i.part) && u.blocks.includes(i.block) && !i.test);
  if (u.id === 'p1-m' || u.id === 'p1-m2') return X.BANK.filter(i => i.lab === 'p1-asp');
  if (u.id === 'p2-ma' || u.id === 'p2-mc') return X.BANK.filter(i => i.part === 2);
  return [];
};
X.TESTS = [
  { id: 'p2-all', pk: 'p2', title: 'Part 2 - 25 câu nghe', desc: '25 câu ngẫu nhiên từ 123 câu Part 2, làm ở chế độ nghe, không nhìn chữ. Mỗi lần là một đề khác.', filter: i => i.part === 2, mins: 8, listen: true, random: 25 },
  { id: 'p34-all', pk: 'p34', title: 'Part 3-4 - 10 bài nghe', desc: '10 hội thoại và bài nói ngẫu nhiên, mỗi bài 3 câu. Đọc trước câu hỏi, nghe một lần.', filter: i => i.kind === 'p34', mins: 15, maxQ: 30 },
  { id: 'p5-t1', pk: 'p5', title: 'Part 5 - Bài tập 30 câu', desc: 'Từ loại, đại từ, động từ, từ nối, mệnh đề quan hệ, từ vựng. Bấm giờ 12 phút.', filter: i => i.test === 'p5-t1', mins: 12, order: 'num' },
  { id: 'p5-t2', pk: 'p5', title: 'Part 5 - Đề mẫu 101-130', desc: 'Đúng dạng thi thật: 20 câu làm bằng quy tắc, 10 câu phải hiểu nghĩa.', filter: i => i.test === 'p5-t2', mins: 12, order: 'num' },
  { id: 'p6-t1', pk: 'p6', title: 'Part 6 - Đề 131-146', desc: '4 đoạn, 16 câu. Ghi manh mối nằm ở đâu: trong câu, câu trước, câu sau.', filter: i => i.test === 'p6-t1', mins: 10, order: 'num' },
  { id: 'p7x', pk: 'p7', title: 'Part 7 - 8 bài đọc có hồ sơ bẫy', desc: '35 câu. Sau khi trả lời, câu bằng chứng trong bài được tô sáng và mỗi đáp án sai được gọi tên bẫy.', filter: i => i.test === 'p7x', mins: 35 },
  { id: 'p7-t1', pk: 'p7', title: 'Part 7 - Đoạn đơn, kép, ba', desc: '18 câu (147-154, 176-180, 186-190). Áp quy trình 5 bước, gạch bằng chứng.', filter: i => i.test === 'p7-t1', mins: 19, order: 'num' },
  { id: 'mix', pk: '', title: 'Mini test tổng hợp', desc: '20 câu ngẫu nhiên từ Part 2, 5, 6, 7. Mỗi lần làm là một đề khác.', filter: i => [2, 5, 6, 7].includes(i.part) && i.kind !== 'p6' && i.kind !== 'p7', mins: 12, random: 20 },
];
X.FINAL = { p1: 'p1-final', p2: 'p2-all', p34: 'p34-all', p5: 'p5-t2', p6: 'p6-t1', p7: 'p7-t1' };

X.buildPath = pk => {
  const units = X.UNITS[pk] || [];
  const out = [];
  units.forEach((u, ui) => {
    const sts = u.lessons.map(l => ({ id: 'L:' + l.id, type: 'lesson', ref: l.id, title: l.title, unit: u.id }));
    const items = X.unitItems(pk, u), words = X.unitWords(u);
    if (items.length >= 3 || words.length >= 6) sts.push({ id: 'P:' + u.id, type: 'prac', ref: u.id, title: `Luyện: ${u.title.replace(/^Khối [A-Z] - /, '')}`, unit: u.id, items: items.length, words: words.length });
    out.push({ ...u, no: ui + 1, stations: sts });
  });
  out.push({ id: pk + '-final', title: 'Kiểm tra cuối Part', no: out.length + 1, blocks: [], lessons: [], stations: [{ id: 'T:' + X.FINAL[pk], type: 'test', ref: X.FINAL[pk], title: 'Bài kiểm tra Part', unit: pk + '-final' }] });
  // lock state: sequential
  let open = true, cur = null;
  out.forEach(u => u.stations.forEach(s => {
    s.done = X.stationDone(s);
    s.locked = !open && !s.done;
    if (!s.done && open && !cur) { cur = s; s.cur = true; open = false; }
  }));
  return out;
};
X.stationDone = s => s.type === 'lesson' ? !!S.lessons[s.ref] : !!(S.stations[s.id] && S.stations[s.id].done);
X.pathStats = pk => {
  const units = X.buildPath(pk); const all = units.flatMap(u => u.stations);
  const done = all.filter(s => s.done).length;
  const parts = X.PARTS.find(p => p.k === pk).parts;
  const att = S.attempts.filter(a => parts.includes(a.p)).slice(-60);
  const acc = att.length ? pct(att.filter(a => a.ok).length, att.length) : null;
  const score = Math.round(pct(done, all.length) * 0.6 + (acc ?? 0) * 0.4);
  return { total: all.length, done, acc, score, n: att.length, next: all.find(s => s.cur), level: X.levelOf(score) };
};
X.LV = ['Mờ', 'Phác thảo', 'Rõ nét', 'Sắc nét', 'Xuyên thấu'];
X.levelOf = sc => Math.min(4, Math.floor(sc / 20));
X.lvlHtml = sc => { const l = X.levelOf(sc); return `<span class="lvl"><i>${[0, 1, 2, 3, 4].map(i => `<b class="${i <= l && sc > 0 ? 'on' : ''}"></b>`).join('')}</i>${X.LV[l]}</span>`; };

/* ---------------- voice (Web Speech) ---------------- */
const TTS = (X.TTS = { voices: [], token: 0 });
const loadVoices = () => { TTS.voices = (speechSynthesis.getVoices() || []).filter(v => /^en[-_]/i.test(v.lang)); };
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
// Rank voices: natural/neural > premium/enhanced > Google network > others. Robotic legacy voices last.
const FEMALE = /\b(aria|jenny|ava|emma|michelle|ana|sonia|libby|maisie|natasha|clara|sara|jane|nancy|amber|ashley|cora|elizabeth|monica|zoe|joelle|noelle|allison|susan|samantha|karen|moira|tessa|victoria|serena|kate|zira|hazel|fiona|catherine|nicky|female|google us english|google uk english female)\b/i;
const MALE = /\b(guy|davis|andrew|brian|christopher|eric|roger|steffan|ryan|thomas|william|liam|evan|nathan|tom|aaron|alex|daniel|fred|oliver|arthur|rishi|lee|gordon|male|david|mark|google uk english male)\b/i;
const ROBOT = /\b(fred|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|princess|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i;
TTS.score = v => {
  if (!v) return 0; const n = v.name;
  let s = 10;
  if (/natural|neural|online/i.test(n)) s = 100;
  else if (/premium/i.test(n)) s = 90;
  else if (/enhanced|siri/i.test(n)) s = 70;
  else if (/^google/i.test(n)) s = 55;
  else if (/samantha|daniel|karen|moira|alex/i.test(n)) s = 35;
  if (ROBOT.test(n)) s = 1;
  return s;
};
TTS.quality = () => { const best = Math.max(0, ...TTS.voices.map(TTS.score)); return best >= 90 ? 'natural' : best >= 55 ? 'good' : 'robot'; };
TTS.ranked = () => [...TTS.voices].sort((a, b) => TTS.score(b) - TTS.score(a) || a.name.localeCompare(b.name));
TTS.pick = (sex, lang) => {
  const pref = sex === 'M' ? S.profile.voiceM : S.profile.voiceW;
  if (pref) { const v = TTS.voices.find(x => x.name === pref); if (v && !lang) return v; }
  lang = lang || S.profile.accent;
  const re = sex === 'M' ? MALE : FEMALE, other = sex === 'M' ? FEMALE : MALE;
  const rank = v => TTS.score(v) * 10 + (re.test(v.name) ? 5 : other.test(v.name) ? -5 : 0) + (v.lang.replace('_', '-').startsWith(lang) ? 300 : v.lang.replace('_', '-').startsWith('en-US') || v.lang.replace('_', '-').startsWith('en-GB') ? 100 : 0);
  const list = [...TTS.voices].sort((a, b) => rank(b) - rank(a));
  return list[0] || null;
};
// Trình duyệt không có giọng tiếng Anh (Opera, Opera GX, một số bản Firefox/Linux): báo rõ thay vì im lặng
TTS.isOpera = /\bOPR\/|Opera/.test(navigator.userAgent);
TTS.missing = () => !TTS.hasFiles() && (!('speechSynthesis' in window) || !TTS.voices.length);
let ttsWarned = false;
TTS.warn = () => {
  if (ttsWarned || window.__noTTSWarn) return; ttsWarned = true;
  const who = TTS.isOpera ? 'Opera không có sẵn giọng đọc tiếng Anh' : 'Trình duyệt này chưa có giọng đọc tiếng Anh';
  X.modal && X.modal(`<div class="row" style="gap:14px;align-items:flex-start">${X.xi ? X.xi('sad', 64) : ''}<div><h2 class="h2" style="margin:0 0 6px">Không phát được âm thanh</h2>
    <p class="muted" style="margin:0 0 10px">${who}, nên các bài nghe sẽ im lặng.</p>
    <p style="margin:0 0 10px">Mở web bằng <b>Microsoft Edge</b> (giọng tự nhiên nhất), <b>Google Chrome</b> hoặc <b>Safari</b>, rồi vào lại đúng trang này. Tiến độ học lưu theo từng trình duyệt: muốn chuyển tiến độ thì vào <b>Hồ sơ → Tải file sao lưu</b> ở trình duyệt cũ, rồi nạp file đó ở trình duyệt mới.</p></div></div>`);
};
/* ---- Audio thu sẵn (giọng neural, file mp3 trong thư mục audio/): có file thì phát file, không có mới dùng giọng của trình duyệt.
   Mỗi câu = vai đọc + câu chữ, băm FNV-1a thành tên file. Danh sách file có sẵn nằm trong data/audio-index.js (window.AUDIO_HAVE). */
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
TTS.norm = t => String(t).replace(/\s+/g, ' ').trim();
TTS.key = (role, text) => fnv(role + '|' + TTS.norm(text));
let HAVE = null;
const have = () => HAVE || (HAVE = new Set(String(window.AUDIO_HAVE || '').split(/\s+/).filter(Boolean)));
TTS.hasFiles = () => have().size > 0;
TTS.fileFor = (role, text) => { const k = TTS.key(role, text); return have().has(k) ? 'audio/' + k + '.mp3' : null; };
// một thẻ audio dùng chung: iPhone chỉ cho phát tiếp nếu thẻ đã được "mở khóa" bằng một lần chạm
const AEL = typeof Audio !== 'undefined' ? new Audio() : null;
if (AEL) { AEL.preload = 'auto'; document.addEventListener('pointerdown', function unlock() { try { AEL.muted = true; const p = AEL.play(); p && p.catch(() => {}); AEL.pause(); AEL.muted = false; } catch (e) {} document.removeEventListener('pointerdown', unlock, true); }, true); }
const playSrc = (src, rate) => new Promise(res => {
  if (!AEL) return res(false);
  let done = false; const fin = ok => { if (!done) { done = true; AEL.onended = AEL.onerror = null; res(ok); } };
  AEL.onended = () => fin(true); AEL.onerror = () => fin(false);
  AEL.src = src; AEL.playbackRate = rate; AEL.defaultPlaybackRate = rate;
  const p = AEL.play(); if (p && p.catch) p.catch(() => fin(false));
  setTimeout(() => fin(true), 30000);
});
// "(A) The man is..." / "A. Yes, ..." → đọc chữ cái và câu bằng hai file riêng, nên một câu dùng được cho mọi thứ tự đáp án
const splitLetter = t => { const m = TTS.norm(t).match(/^\(?([A-D])[).]\s+(.+)$/); return m ? [m[1] + '.', m[2]] : [TTS.norm(t)]; };
TTS.files = (role, text) => { const parts = splitLetter(text), srcs = parts.map(p => TTS.fileFor(role, p)); return srcs.every(Boolean) ? srcs : null; };
TTS.speak = async (text, opt = {}) => {
  const role = opt.role || (opt.sex === 'M' ? 'M' : 'W'), srcs = S.profile.useFiles === false ? null : TTS.files(role, text);
  if (srcs) { const tk = TTS.token, rate = (opt.rate || 1) * (S.profile.rate || 1);
    for (let i = 0; i < srcs.length; i++) { if (tk !== TTS.token) return; const ok = await playSrc(srcs[i], rate); if (!ok) return TTS.speakVoice(text, opt); if (i < srcs.length - 1) await new Promise(r => setTimeout(r, 150)); }
    return; }
  if (window.__audioMiss) window.__audioMiss.push(role + '|' + TTS.norm(text));
  return TTS.speakVoice(text, opt);
};
TTS.speakVoice = (text, opt = {}) => new Promise(res => {
  if (TTS.missing()) { if (!('speechSynthesis' in window) || TTS.voicesTried) TTS.warn(); else setTimeout(() => { TTS.voicesTried = true; loadVoices(); if (TTS.missing()) TTS.warn(); }, 1200); return setTimeout(res, 300); }
  const u = new SpeechSynthesisUtterance(text);
  const v = opt.voice || TTS.pick(opt.sex || 'W', opt.lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = S.profile.accent;
  u.rate = (opt.rate || 1) * (S.profile.rate || 1);
  let done = false; const fin = () => { if (!done) { done = true; res(); } };
  u.onend = u.onerror = fin;
  setTimeout(fin, 4000 + text.length * 120);   // phòng khi trình duyệt không bao giờ báo đọc xong
  speechSynthesis.speak(u);
});
TTS.stop = () => { TTS.token++; if ('speechSynthesis' in window) speechSynthesis.cancel(); if (AEL && !AEL.paused) { try { AEL.pause(); } catch (e) {} } };
// lines: [{s:'M'|'W'|'Q'|'A'|'N', t}]
TTS.play = async (lines, onLine) => {
  TTS.stop(); const tk = TTS.token;
  const sexOf = { M: 'M', W: 'W', Q: 'W', A: 'M', N: 'W' };
  const langs = ['en-US', 'en-GB', 'en-AU'];
  const qLang = S.profile.accent;
  for (let i = 0; i < lines.length; i++) {
    if (tk !== TTS.token) return false;
    onLine && onLine(i);
    const L = lines[i];
    const lang = L.s === 'A' ? (langs.find(l => l !== qLang) || qLang) : qLang;
    await TTS.speak(L.t, { sex: sexOf[L.s] || 'W', lang: L.s === 'A' ? lang : undefined, role: L.s || 'W' });
    await new Promise(r => setTimeout(r, L.s === 'A' || L.s === 'Q' ? 650 : 250));
  }
  onLine && onLine(-1);
  return tk === TTS.token;
};
X.say = t => { TTS.stop(); TTS.speak(t, { sex: 'W' }); };

/* ---------------- toast & modal ---------------- */
let toastT;
X.toast = (html, ms = 2200) => {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = html; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
};
X.modal = (html, onMount) => {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  const close = () => bg.remove();
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  document.body.appendChild(bg); onMount && onMount(bg.firstChild, close); return close;
};

/* ---------------- router ---------------- */
const routes = [];
X.route = (re, fn) => routes.push([re, fn]);
/* ---- Phiên đang làm dở: lưu theo đường dẫn, đi chỗ khác quay lại vẫn làm tiếp ---- */
X.sessGet = k => { const r = (X.S().resume || {})[k]; return r && Date.now() - r.at < 7 * 864e5 ? r : null; };
X.sessSet = (k, v) => { const s = X.S(); s.resume = s.resume || {}; s.resume[k] = Object.assign({}, v, { at: Date.now() }); X.save(); };
X.sessDel = k => { const s = X.S(); if (s.resume && s.resume[k]) { delete s.resume[k]; X.save(); } };
X.hereKey = () => location.hash.slice(1) || '/today';
X.go = h => { if (location.hash === h) X.render(); else location.hash = h; };
let cleanup = null;
X.onLeave = fn => { cleanup = fn; };
X.render = () => {
  TTS.stop(); if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  document.onkeydown = null;
  const h = location.hash.slice(1) || '/about';   // mở web lần nào cũng gặp trang Giới thiệu trước
  if (h !== X.curHash) { X.prevHash = X.curHash; X.curHash = h; }
  const view = $('#view');
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) { view.innerHTML = ''; window.scrollTo(0, 0); fn(view, ...m.slice(1).map(v => v === undefined ? undefined : decodeURIComponent(v))); X.renderSide(h); X.afterRender && X.afterRender(h, view); X.markScroll && setTimeout(() => X.markScroll(view), 60); return; }
  }
  X.go('#/today');
};
window.addEventListener('hashchange', X.render);

// Part 2: tô từ quan trọng trong câu hỏi (từ để hỏi / trợ động từ đầu câu, "or", câu đuôi, từ nội dung)
X.hiQ = (text) => {
  const STOP = new Set('the a an this that these those there their they them then than with from into onto about your yours you our ours we us his her hers him she he its it is are was were be been being have has had do does did will would can could should shall may might must not and but for of on in at to by as so if or me my mine i am very just also any some what when where who whom whose why how which over out please really still well going get got let lets'.split(' '));
  const t = String(text);
  const OPEN = /^(?:How (?:long|often|much|many|soon|far|about|come)|What time|What kind of|Which \w+|Why (?:don['’]t|didn['’]t|not)(?: \w+)?|Would you (?:like|mind)|Do you (?:want|mind|know|think)|Could you|Can you|Will you|Should (?:I|we)|Who|Whose|Whom|What|When|Where|Why|How|(?:Have|Has|Had|Did|Do|Does|Is|Are|Was|Were|Will|Can|Could|Shall|Should|Would|Won['’]t|Can['’]t)(?:n['’]t)?)(?=[\s'’?,]|$)(?:['’](?:s|re|ve|ll|d))?/i;
  const m = t.match(OPEN);
  let head = m ? m[0] : '', rest = t.slice(head.length), emb = '';
  // câu hỏi lồng: Do you know / Can you tell me / Any idea… + từ Wh phía sau mới là trọng tâm
  const E = /^(?:Do you know|Do you happen to know|Can you tell me|Could you tell me|Have you heard|Any idea|Do you remember|Would you know|Did they say|Did (?:he|she) say)/i;
  if (E.test(head + rest)) { const hm = (head + rest).match(E)[0]; const r2 = (head + rest).slice(hm.length).match(/^\s+(?:who|whose|what|when|where|why|how(?: long| much| many| soon)?|which|whether|if)(?:['’]s|['’]re)?/i);
    if (r2) { head = hm; emb = r2[0]; rest = (t.slice(hm.length)).slice(emb.length); } }
  const tag = rest.match(/,\s*(?:\w+n['’]t|won['’]t|can['’]t|isn['’]t|aren['’]t|don['’]t|doesn['’]t|didn['’]t|haven['’]t|hasn['’]t|is|are|do|does|did|will|have|has|right)\s+\w+\?$/i);
  let body = tag ? rest.slice(0, tag.index) : rest, tail = tag ? tag[0] : '';
  body = esc(body).replace(/[A-Za-z][A-Za-z'’-]*/g, w => / or /.test(' ' + w.toLowerCase() + ' ') ? `<mark class="q1">${w}</mark>` : (w.length >= 4 && !STOP.has(w.toLowerCase().replace(/['’].*/, '')) || /n['’]t$/i.test(w) || /^not$/i.test(w)) ? `<span class="kw">${w}</span>` : w);
  return `<span class="hq">${head ? `<mark class="q1">${esc(head)}</mark>` : ''}${emb ? ` <mark class="q1">${esc(emb.trim())}</mark>` : ''}${body}${tail ? `<mark class="q1">${esc(tail)}</mark>` : ''}</span>`;
};
X.hiLegend = '<div class="small muted hq-leg"><mark class="q1">Vàng</mark> quyết định kiểu trả lời - <span class="kw">gạch chân</span> từ nội dung chính</div>';
