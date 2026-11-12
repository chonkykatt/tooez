/* TOOEZ — views: today, path, lesson, library, station, tests, errors, progress, settings */
'use strict';
(() => {
const { $, $$, esc, icon, pct, fmtMs, fmtDate, shuffle, sample, today, DAY, LETTERS } = X;
const S = () => X.S();

/* ---------------- 4 bước học: dùng chung cho Giới thiệu, Hôm nay và đầu mỗi trang ---------------- */
X.FLOW = [
  { k: 'do', no: 1, n: 'Đo', page: 'Đề thi từng Part', href: '#/tests', ic: 'test', c: 'fl-sky',
    what: 'Làm một đề Part như thi thật: đúng số câu, bấm giờ, chấm và chữa từng câu.', when: 'Trước khi học một Part, và làm lại sau 2-3 tuần để đo tiến bộ.' },
  { k: 'hoc', no: 2, n: 'Học', page: 'Lộ trình + Kho từ vựng', href: '#/path', ic: 'path', c: 'fl-syn',
    what: 'Học từng chủ đề của Part: học thẻ → luyện đúng dạng → kiểm tra. Từ vựng học và ôn riêng mỗi ngày.', when: 'Mỗi ngày, theo thứ tự chủ đề. Đạt 80% thì sang chủ đề sau.' },
  { k: 'luyen', no: 3, n: 'Luyện', page: 'Lab phản xạ', href: '#/lab', ic: 'lab', c: 'fl-sun',
    what: 'Luyện riêng một dạng câu nhiều lượt, đến khi vừa nhanh vừa đúng.', when: 'Sau khi học xong unit, hoặc khi đề và Sổ lỗi chỉ ra dạng còn yếu.' },
  { k: 'chua', no: 4, n: 'Chữa', page: 'Sổ lỗi', href: '#/errors', ic: 'err', c: 'fl-ember',
    what: 'Gọi tên nguyên nhân từng câu sai, viết quy tắc rút ra, làm lại đúng 2 lần cách ngày.', when: 'Cuối mỗi buổi học, và ngay sau khi chữa đề.' },
];
// dải nhỏ đầu trang: trang này là bước mấy, dùng khi nào, xong thì sang đâu
X.stepHead = k => { const f = X.FLOW.find(x => x.k === k); if (!f) return ''; const nx = X.FLOW[f.no % 4];
  return `<div class="stephd"><span class="stephd-no ${f.c}">Bước ${f.no} - ${f.n}</span><span class="grow small"><b>Dùng khi:</b> ${esc(f.when)}</span><a class="small" href="${nx.href}">Xong thì sang Bước ${nx.no} - ${nx.n} ${icon('arrow')}</a></div>`; };
X.flowStrip = (cur) => `<div class="flow4">${X.FLOW.map(f => `<a class="flow4-s ${cur === f.k ? 'on' : ''}" href="${f.href}"><span class="flow4-n ${f.c}">${f.no}</span><b>${f.n}</b><small>${esc(f.page)}</small></a>`).join('<span class="flow4-ar">→</span>')}</div>`;

// Tiến độ và Bản đồ kỹ năng là một mục, hai tab
X.progTabs = cur => `<div class="part-tabs ptabs2"><a class="part-tab ${cur === 'all' ? 'on' : ''}" href="#/progress"><b>Tổng quan</b><small>Điểm từng Part, từ vựng, lịch học</small></a><a class="part-tab ${cur === 'skills' ? 'on' : ''}" href="#/skills"><b>Bản đồ kỹ năng</b><small>Vững ở đâu, hổng ở đâu</small></a></div>`;
/* ---------------- sidebar ---------------- */
// thứ tự = thứ tự học: Đo → Học → Luyện → Chữa, rồi tới phần xem lại và tra cứu
const NAV = [
  ['/about', 'heart', 'Giới thiệu & ủng hộ'], ['/today', 'today', 'Hôm nay', 'Bắt đầu'],
  ['/tests', 'test', 'Đề thi từng Part', '1 - Đo'],
  ['/path', 'path', 'Lộ trình', '2 - Học'], ['/vocab', 'words', 'Kho từ vựng'],
  ['/lab', 'lab', 'Lab phản xạ', '3 - Luyện'],
  ['/errors', 'err', 'Sổ lỗi', '4 - Chữa'],
  ['/progress', 'chart', 'Tiến độ & kỹ năng', 'Theo dõi & tra cứu'], ['/library', 'book', 'Sổ tay ôn nhanh'], ['/coach', 'coach', 'Học cùng coach'], ['/settings', 'user', 'Hồ sơ'],
];
const navOn = (h, r) => h.startsWith(r) || (r === '/path' && (h.startsWith('/unit') || h.startsWith('/st/'))) || (r === '/progress' && h.startsWith('/skill')) || (r === '/tests' && h.startsWith('/exam')) || (r === '/library' && (h.startsWith('/p1lib') || h.startsWith('/deck') || h.startsWith('/lesson')));
X.renderSide = (h = location.hash.slice(1)) => {
  const side = $('#side'); if (!side) return;
  const ec = X.errorCounts(), due = X.wordDue().length;
  const cnt = { '/errors': ec.todo, '/vocab': due };
  side.innerHTML = `<div class="brand"><div class="brand-mark cat-mark">${X.xi('happy', 34, 'static').replace('viewBox="0 0 108 121"', 'viewBox="13 9 82 80"')}</div><div><b>TOOEZ</b><small class="brand-tag">Luyện TOEIC Nghe - Đọc</small><small class="brand-by">made with 🧡 by <a href="https://www.tiktok.com/@toeic_tooez" target="_blank" rel="noopener">@toeic_tooez</a></small></div></div>
    <nav class="nav">${NAV.map(([r, ic, n, sep]) => `${sep ? `<div class="nav-sep">${sep}</div>` : ''}<a href="#${r}" class="${navOn(h, r) ? 'on' : ''}">${icon(ic)}<span>${n}</span>${cnt[r] ? `<span class="cnt ${r === '/vocab' ? 'soft' : ''}">${cnt[r]}</span>` : ''}</a>`).join('')}</nav>
    <div class="side-foot"><div class="mini-stats"><span class="streak-flame" title="Chuỗi ngày học">${icon('flame')} ${X.streak()}</span><span class="xpc" title="XP hôm nay / mục tiêu">${icon('bolt')} ${X.xpToday()}/${S().profile.dailyGoal}</span></div></div>`;
  $$('a', side).forEach(a => a.addEventListener('click', () => side.classList.remove('open')));
};

/* dải nút cuộn ngang (tab Part, nút chọn): mờ ở mép phải khi còn nội dung chưa thấy, cuộn hết thì thôi mờ */
X.markScroll = root => (root || document).querySelectorAll('.part-tabs, .seg.wrap').forEach(el => {
  const upd = () => el.classList.toggle('hscroll-more', el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  upd(); if (!el.dataset.hs) { el.dataset.hs = 1; el.addEventListener('scroll', upd, { passive: true }); } });
window.addEventListener('resize', () => X.markScroll && X.markScroll());

/* ---------------- sao lưu tiến độ ---------------- */
X.downloadBackup = () => { const s = S(), p = s.profile; s.lastBackup = Date.now(); X.save();
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([X.exportData()], { type: 'application/json' })); a.download = `tooez-${(p.name || 'hoc-vien').replace(/\s+/g, '-')}-${today()}.json`; a.click(); X.toast('Đã tải file sao lưu. Giữ file này, đổi máy hay lỡ mất dữ liệu thì mở lại ở Hồ sơ.'); };
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// nhắc sao lưu: khi đã có kha khá dữ liệu mà lâu chưa sao lưu (iPhone/iPad nhắc sớm hơn vì Safari có thể tự xóa dữ liệu web lâu không mở)
const backupTip = s => { const n = s.attempts.length + Object.keys(s.words).length; if (n < 30) return '';
  const gap = isIOS ? 7 : 14, last = Math.max(s.lastBackup || 0, s.seenTips.backup || 0); if (Date.now() - last < gap * DAY) return '';
  return `<div class="card tint row" id="bk-tip" style="margin-top:16px">${icon('dl')}<div class="grow small"><b>Sao lưu tiến độ của bạn.</b> Tiến độ chỉ lưu trong trình duyệt này${isIOS ? '. Trên iPhone/iPad, Safari có thể tự xóa dữ liệu nếu bạn không mở TOOEZ khoảng một tuần' : ', đổi máy hay xóa dữ liệu trình duyệt là mất'}. Tải một file sao lưu cho chắc.</div><button class="btn sm pri" id="bk-go">Tải file sao lưu</button><button class="btn sm ghost" id="bk-x">Để sau</button></div>`; };
document.addEventListener('click', e => { if (e.target.id === 'bk-go') { X.downloadBackup(); document.getElementById('bk-tip')?.remove(); } if (e.target.id === 'bk-x') { S().seenTips.backup = Date.now(); X.save(); document.getElementById('bk-tip')?.remove(); } });

/* ---------------- TODAY ---------------- */
X.route(/^\/today$/, view => {
  const s = S(), p = s.profile;
  if (!p.name) { if (!s.seenTips.intro) return X.go('#/about'); return onboarding(view); }
  const xp = X.xpToday(), goal = p.dailyGoal, ec = X.errorCounts(), due = X.wordDue().length;
  const focus = (p.focus.length ? p.focus : ['nen', 'p2']).filter(k => window.PATH[k]).map(k => ({ k, ...X.pathStats(k) }));
  const next = focus.find(f => f.next) || null;
  const newLeft = Math.max(0, p.newWords - Object.values(s.words).filter(w => w.first && today(w.first) === today()).length);
  const labToday = Object.entries(s.labs).filter(([, l]) => l.lastAt && today(l.lastAt) === today()).sort((a, b) => b[1].lastAt - a[1].lastAt)[0];
  const labSugg = labToday && X.LABS[labToday[0]] ? { id: labToday[0], title: X.LABS[labToday[0]].title, why: `Đã luyện hôm nay - đúng ${labToday[1].acc}%` } : suggestLab();
  const d = today();
  const done = { exam: Object.values(s.tests || {}).flat().some(x => today(x.at) === today()), path: Object.entries(s.stations).some(([k, x]) => k.startsWith('U:') && x.done && today(x.done) === d),
    words: due === 0 && Object.values(s.words).some(w => w.last && today(w.last) === d), errors: ec.todo === 0 && s.errors.length > 0,
    lab: Object.values(s.labs).some(l => l.lastAt && today(l.lastAt) === d) };
  const days = p.examDate ? Math.ceil((new Date(p.examDate) - Date.now()) / DAY) : null;
  const hr = new Date().getHours();
  const exSug = X.examSuggest && X.examSuggest();
  const MI = { exam: ['fl-sky', 'test'], path: ['c-syn', 'path'], words: ['c-sun', 'words'], errors: ['c-ember', 'err'], lab: ['c-sky', 'lab'] };
  const missions = [
    ...(exSug ? [{ k: 'exam', t: `Đo: ${X.examTitle(exSug.e.id)}`, d: exSug.why, href: `#/exam/${exSug.e.id}`, btn: 'Làm đề' }] : []),
    { k: 'path', t: next ? `Lộ trình: ${next.next.title}` : 'Lộ trình: chọn Part để học', d: next ? `${X.trackName(next.k)} - ${{ learn: 'Học', vocab: 'Từ vựng', drill: 'Luyện', check: 'Kiểm tra unit' }[next.next.type] || ''}` : 'Đặt Part trọng tâm trong Hồ sơ', href: next ? stationHref(next.next) : '#/path', btn: 'Học' },
    { k: 'words', t: due ? `Ôn ${due} từ đến hạn` : newLeft ? `Học ${newLeft} từ mới` : 'Từ vựng: xong phần hôm nay', d: 'Ôn đúng lúc sắp quên, nhớ lâu hơn đọc lại', href: due ? '#/vocab/review' : '#/vocab/learn', btn: due ? 'Ôn' : 'Học' },
    { k: 'errors', t: ec.todo ? `Chữa ${ec.todo} lỗi trong Sổ lỗi` : 'Sổ lỗi: không còn lỗi chờ chữa', d: ec.open ? `${ec.open} lỗi chưa ghi nguyên nhân - ${ec.due} câu đến hạn làm lại` : 'Làm sai câu nào, câu đó tự vào đây', href: '#/errors', btn: 'Chữa' },
    { k: 'lab', t: `Lab: ${labSugg.title}`, d: labSugg.why, href: `#/lab/${labSugg.id}`, btn: 'Luyện' },
  ];
  view.innerHTML = `<div class="page">
    <div class="hello">${X.xi(xp >= goal ? 'happy' : 'idle', 104)}<div><div class="kicker">${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <h1 class="h1">${hr < 11 ? 'Chào buổi sáng' : hr < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'}, ${esc(p.name)}!</h1>
    <p class="lead">${xp >= goal ? 'Xong mục tiêu hôm nay rồi. Làm thêm phần nào cũng là cộng thêm.' : xp ? `Còn ${goal - xp} XP nữa là xong mục tiêu hôm nay.` : 'Mấy việc nhỏ bên dưới, làm theo thứ tự là xong ngày học.'}</p></div></div>
    ${!X.TTS.hasFiles() && X.TTS.voices.length && X.TTS.quality() === 'robot' && !s.seenTips.voice ? `<div class="card tint row" id="vtip" style="margin-top:16px">${icon('vol')}<div class="grow small"><b>Giọng đọc trên máy này đang nghe như robot.</b> Mở web bằng Microsoft Edge hoặc cài giọng Premium miễn phí là nghe tự nhiên ngay.</div><a class="btn sm pri" href="#/settings">Xem cách</a><button class="btn sm ghost" id="vtip-x">Ẩn</button></div>` : ''}
    ${backupTip(s)}
    <div class="flow-today"><span class="small muted">Cách học trên TOOEZ, lặp lại mỗi tuần:</span>${X.flowStrip(exSug && exSug.first ? 'do' : 'hoc')}</div>
    <div class="hero-today">
      <div class="card"><div class="sec-h" style="margin-bottom:4px"><h2 class="h2">Nhiệm vụ hôm nay</h2><span class="kicker">${missions.filter(m => done[m.k]).length}/${missions.length}</span></div>
        <div class="mission">${missions.map((m, mi) => `<div class="m ${done[m.k] ? 'done' : ''}"><span class="mi ${MI[m.k][0]}">${done[m.k] ? icon('check') : icon(MI[m.k][1])}</span><div class="grow"><div class="t">${esc(m.t)}</div><div class="d">${esc(m.d)}</div></div><a class="btn sm ${done[m.k] ? '' : 'pri'}" href="${m.href}">${m.btn}</a></div>`).join('')}</div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card row" style="gap:18px"><div class="ring" style="--p:${Math.min(100, pct(xp, goal))};--c:var(--ember)"><span>${xp}</span></div>
          <div><div class="stat"><div class="v">${X.streak()} ngày</div><div class="l">chuỗi học liên tục - ${xp}/${goal} XP hôm nay</div></div></div></div>
        <div class="grid g2" style="gap:14px">
          <a class="card link stat" href="#/vocab"><div class="v">${Object.values(s.words).filter(w => w.lvl >= 3).length}</div><div class="l">từ nhớ chủ động</div></a>
          <a class="card link stat" href="#/errors"><div class="v">${s.errors.filter(e => e.status === 'fixed').length}</div><div class="l">lỗi đã chữa xong</div></a>
        </div>
        ${days !== null ? `<div class="card tint exam-cd ${days <= 14 ? 'soon' : ''}">
          <div class="ecd-n">${days > 0 ? `<b>${days}</b><span>ngày nữa thi</span>` : '<b>0</b><span>đã qua ngày thi</span>'}</div>
          <div class="ecd-info"><div><span class="muted">Ngày thi</span><b>${esc(new Date(p.examDate).toLocaleDateString('vi-VN'))}</b></div>
            <div><span class="muted">Mục tiêu</span><b>${esc(p.current || '?')} <span class="ecd-arrow">→</span> ${esc(p.target || '?')}</b></div></div></div>${days >= 7 && days <= 30 && X.coachNudge ? X.coachNudge('Sắp thi rồi. Muốn có người cùng chốt chiến thuật và chữa đề?', 'Gói cấp tốc') : ''}` : ''}
      </div>
    </div>
    <div class="sec"><div class="sec-h"><h2 class="h2">Độ nét từng Part</h2><a href="#/progress" class="small">Xem chi tiết</a></div>
      <div class="grid g3">${X.PARTS.map(pp => { const st = X.pathStats(pp.k); return `<a class="card link" href="#/path/${pp.k}"><div class="row"><b class="grow" style="font-family:var(--f-display);font-size:17px">${pp.n}</b>${s.profile.focus.includes(pp.k) ? '<span class="pill syn">Trọng tâm</span>' : ''}</div>
        <div class="small muted">${pp.vi} - ${st.passed}/${st.units} bài - ${st.stars}★${st.acc !== null ? ` - đúng ${st.acc}%` : ''}</div><div class="bar thin" style="margin:10px 0 8px"><i style="width:${pct(st.done, st.total)}%"></i></div>${X.lvlHtml(st.score)}</a>`; }).join('')}</div></div>
  </div>`;
});

document.addEventListener('click', e => { if (e.target.id === 'vtip-x') { X.S().seenTips.voice = 1; X.save(); const t = document.getElementById('vtip'); if (t) t.remove(); } });
function suggestLab() {
  const s = S(); const labs = Object.values(X.LABS).filter(l => l.kind !== 'cards');
  const focusParts = s.profile.focus.map(k => k.replace('p', '').replace('34', '3-4'));
  const scored = labs.map(l => { const r = s.labs[l.id]; const inFocus = focusParts.some(f => String(l.part).includes(f[0])); return { l, sc: (r ? (r.acc ?? 50) : 0) - (inFocus ? 40 : 0) + (r && r.lastAt && today(r.lastAt) === today() ? 100 : 0) }; }).sort((a, b) => a.sc - b.sc);
  const l = scored[0].l, r = s.labs[l.id];
  return { id: l.id, title: l.title, why: r ? `Lần trước đúng ${r.acc}%, luyện lại để thành phản xạ` : 'Chưa luyện module này' };
}

function onboarding(view) {
  view.innerHTML = `<div class="page">${X.xiSay('happy', 'Chào bạn! Mình là <b>Tooez</b>, chú mèo học bá đi cùng bạn. Mình sẽ tìm chỗ hổng và giao bài mỗi ngày.', 110)}<h1 class="h1" style="margin-top:10px">Chào mừng đến TOOEZ!</h1>
    <p class="lead">Chẩn đoán trước, luyện đúng chỗ yếu, đo bằng năng lực thật chứ không đếm số bài đã làm. Điền vài thông tin để hệ thống sắp nhiệm vụ mỗi ngày cho bạn.</p>
    <div class="card sec" style="max-width:640px"><div class="grid g2">
      <div class="field"><label>Tên của bạn</label><input class="inp" id="ob-name" placeholder="VD: Doanh"></div>
      <div class="field"><label>Ngày thi dự kiến</label><input class="inp" id="ob-date" type="date"></div>
      <div class="field"><label>Điểm hiện tại (ước tính)</label><input class="inp" id="ob-cur" placeholder="VD: 600"></div>
      <div class="field"><label>Điểm mục tiêu</label><input class="inp" id="ob-tar" placeholder="VD: 800"></div>
    </div>
    <div class="field" style="margin-top:14px"><label>Bạn muốn ưu tiên gì? <span class="faint" style="font-weight:500">Nên chọn Nền tảng + 1-2 Part</span></label>
      <div id="ob-focus">${[['Nền tảng chung', X.TRACKS.filter(t => t.layer < 3), 'g2'], ['Theo Part', X.TRACKS.filter(t => t.layer === 3), 'g3']].map(([h, ts, g]) => `<div class="pick-h">${h}</div><div class="pick ${g}">${ts.map(p => `<button type="button" data-k="${p.k}" class="pick-o ${['nen', 'p2', 'p34'].includes(p.k) ? 'on' : ''}"><span class="pick-ck">${icon('check')}</span><b>${esc(p.n)}</b><small>${esc(p.vi)}</small></button>`).join('')}</div>`).join('')}</div></div>
    <div class="field" style="margin-top:6px"><label>Mỗi ngày học khoảng</label><div class="seg" id="ob-goal"><button data-v="30">20 phút</button><button data-v="60" class="on">40 phút</button><button data-v="100">60+ phút</button></div></div>
    <div class="row" style="margin-top:22px"><button class="btn pri lg" id="ob-go">Bắt đầu học ${icon('arrow')}</button></div></div></div>`;
  $$('#ob-focus button', view).forEach(b => b.onclick = () => b.classList.toggle('on'));
  $$('#ob-goal button', view).forEach(b => b.onclick = () => { $$('#ob-goal button', view).forEach(x => x.classList.remove('on')); b.classList.add('on'); });
  $('#ob-go', view).onclick = () => {
    const name = $('#ob-name', view).value.trim(); if (!name) { $('#ob-name', view).focus(); return; }
    const p = S().profile; p.name = name; p.examDate = $('#ob-date', view).value; p.current = $('#ob-cur', view).value.trim(); p.target = $('#ob-tar', view).value.trim();
    p.focus = $$('#ob-focus button.on', view).map(b => b.dataset.k); if (!p.focus.length) p.focus = ['p2'];
    p.dailyGoal = +$('#ob-goal button.on', view).dataset.v; X.save(); X.render();
  };
}

/* ---------------- PATH (see path.js) ---------------- */
const stationHref = st => X.stationHref(st);
/* ---------------- LESSON ---------------- */
const lessonIndex = () => {
  const idx = {};
  for (const [pk, us] of Object.entries(X.UNITS)) us.forEach(u => u.lessons.forEach((l, i) => { idx[l.id] = { pk, unit: u, i }; }));
  return idx;
};
X.route(/^\/lesson\/(.+)$/, async (view, id) => {
  const idx = lessonIndex(), meta = idx[id];
  if (!meta) return X.go('#/library');
  view.innerHTML = '<div class="page"><div class="muted">Đang tải bài…</div></div>';
  const K = await X.loadKnowledge(meta.pk);
  const L = K.find(l => l.id === id);
  const part = X.PARTS.find(p => p.k === meta.pk);
  // bài tiếp theo trong cùng Part (theo thứ tự Thư viện), hết thì về Thư viện
  const allL = ((X.libUnits && X.libUnits(meta.pk)) || X.UNITS[meta.pk] || []).flatMap(u => u.lessons.map(l => ({ id: l.id, title: l.title, unit: u })));
  const nx = allL[allL.findIndex(l => l.id === id) + 1];
  const nextSt = nx ? { href: '#/lesson/' + nx.id, label: 'Bài tiếp', t: nx.title.replace(/^[A-G]?\d+(\.\d+)*\.\s*/, '') } : { href: '#/library/' + meta.pk, label: 'Về Sổ tay' };
  const done = !!S().lessons[id];
  // Bài đọc thuộc Thư viện: mặc định quay về Thư viện của Part. Chỉ khi mở từ một unit trong Lộ trình mới quay về unit đó.
  const ph = X.prevHash || ''; if (/^\/(unit|st|path)\//.test(ph)) X.lessonBack = ph; else if (!/^\/lesson\//.test(ph)) X.lessonBack = null;
  const fromLib = !X.lessonBack;
  view.innerHTML = `<div class="page"><div class="lesson"><article>
    ${fromLib ? `<a href="#/library/${meta.pk}" class="small">${icon('back')} Sổ tay ôn nhanh - ${part.n}</a>` : `<a href="#${X.lessonBack}" class="small">${icon('back')} Về Lộ trình - ${part.n}</a>`}
    ${(() => { const ul = allL.filter(l => l.unit.id === meta.unit.id), k = ul.findIndex(l => l.id === id); return `<div class="kicker" style="margin-top:14px">Bài ${k >= 0 ? k + 1 : meta.i + 1}/${k >= 0 ? ul.length : meta.unit.lessons.length}</div>`; })()}
    <h1 class="h1">${esc(L.title.replace(/^[A-G]?\d+(\.\d+)*\.\s*/, ''))}</h1>
    <div class="prose" id="ls-body">${L.html}</div>
    <div class="lesson-foot">
      <div class="lf-top">${done ? `<span class="pill sage">${icon('check')} Đã học</span>` : ''}<div><b class="lf-t">${done ? 'Đọc lại bất cứ lúc nào.' : 'Đọc xong thì đánh dấu đã học nhé.'}</b><div class="small muted">Mẹo: đọc to các ví dụ tiếng Anh, bấm vào câu tiếng Anh để nghe.</div></div></div>
      <div class="lf-bot"><div class="small muted lf-next">${nextSt.t ? `Tiếp theo: <b>${esc(nextSt.t)}</b>` : ''}</div>
        <div class="lf-btns">${!done ? '<button class="btn pri" id="ls-done">Đã học xong <span class="xp-chip">+5 XP</span></button>' : ''}<a class="btn ${done ? 'pri' : ''}" href="${nextSt.href}" id="ls-next">${nextSt.label} ${icon('arrow')}</a></div></div></div>
  </article><aside class="toc" id="ls-toc"></aside></div></div>`;
  // toc
  const hs = $$('#ls-body h2, #ls-body h3', view);
  hs.forEach((h, i) => h.id = 'h' + i);
  $('#ls-toc', view).innerHTML = hs.length > 2 ? `<div class="kicker" style="margin-bottom:8px">Trong bài</div>${hs.map((h, i) => `<a href="javascript:void 0" data-h="${i}" style="${h.tagName === 'H3' ? 'padding-left:22px' : ''}">${esc(h.textContent.slice(0, 48))}</a>`).join('')}` : '';
  $$('#ls-toc a', view).forEach(a => a.onclick = () => $('#h' + a.dataset.h, view).scrollIntoView({ behavior: 'smooth', block: 'start' }));
  // click english sentences to hear
  $$('#ls-body td, #ls-body li, #ls-body p', view).forEach(el => {
    const t = el.textContent.trim();
    if (t.length > 3 && t.length < 160 && /^[A-Z"“'(]/.test(t) && !/[à-ỹđ]/i.test(t.replace(/\(.*?\)/g, ''))) { el.style.cursor = 'pointer'; el.title = 'Bấm để nghe'; el.dataset.sayt = t.replace(/\(.*?\)/g, ''); el.addEventListener('click', () => X.say(t.replace(/\(.*?\)/g, ''))); }
  });
  const btn = $('#ls-done', view);
  if (btn) btn.onclick = () => {
    S().lessons[id] = Date.now(); X.save(); X.addXP(5, 'Hoàn thành bài đọc');
    // chỉ đánh dấu và cộng XP, ở lại trang; người học tự bấm "Bài tiếp" khi sẵn sàng
    btn.remove();
    const top = $('.lf-top', view), b = top && top.querySelector('.lf-t'); if (b) b.textContent = 'Đọc lại bất cứ lúc nào.';
    if (top) top.insertAdjacentHTML('afterbegin', `<span class="pill sage">${icon('check')} Đã học</span>`);
    const nb = $('#ls-next', view); if (nb) nb.classList.add('pri');
  };
});

/* ---------------- LIBRARY ---------------- */
// Thư viện chỉ giữ phương pháp, tư duy làm bài, bẫy. Từ vựng nằm ở Kho từ vựng.
const LIB_SKIP_U = new Set(['p1-u2', 'p1-u3', 'p1-u4', 'p1-u5', 'p1-u6', 'p1-u7', 'p1-u8', 'p1-u9', 'p2-mb', 'p2-u3', 'p2-u4', 'p34-u6']);
const LIB_SKIP_L = /^(Nền tảng tư duy Part 1|Collocation Part 1|Vocabulary lab|10\.4\.|D4\. Giới từ đi cùng|F2\. Cụm từ hay đi cùng|F4\. Trạng từ từ vựng|F7\. Kho từ|E2\. Cụm mở đầu|E3\. Cụm kết thúc|E2\. Động từ đồng nghĩa|E3\. Danh từ đồng nghĩa|E4\. Tính từ và cụm trạng thái|E2\. Từ vựng chủ đề|C6\. Từ vựng theo chủ đề)/;
X.libUnits = pk => (X.UNITS[pk] || []).filter(u => !LIB_SKIP_U.has(u.id)).map(u => ({ ...u, lessons: u.lessons.filter(l => !LIB_SKIP_L.test(l.title)) })).filter(u => u.lessons.length);
X.route(/^\/library(?:\/(\w+))?$/, (view, pk) => {
  pk = pk || 'aha';
  const tabs = `<div class="part-tabs"><a class="part-tab ${pk === 'aha' ? 'on' : ''}" href="#/library/aha"><b>Aha!</b><small>${(window.AHA || []).reduce((a, g) => a + g.items.length, 0)} insight</small></a>${X.PARTS.map(p => `<a class="part-tab ${p.k === pk ? 'on' : ''}" href="#/library/${p.k}"><b>${p.n}</b><small>${((X.libData && X.libData(p.k) || {}).topics || []).length} chủ đề</small></a>`).join('')}</div>`;
  const head = `<div class="stephd"><span class="stephd-no" style="background:var(--ink-soft)">Xem lại</span><span class="grow small">Chỗ ôn nhanh, không phải chỗ học. Học chính theo thứ tự ở <a href="#/path">Lộ trình</a>; vào đây để lướt lại một chủ đề đã học, ví dụ trước hôm thi.</span></div><div class="kicker">Sổ tay ôn nhanh</div><h1 class="h1">Xem lại cách làm bài và những cú “Aha!”</h1>
    <p class="lead">Mở chủ đề nào là xem lại thẻ ngay, không có bài luyện hay kiểm tra. Từ vựng ôn ở <a href="#/vocab">Kho từ vựng</a>.</p>`;
  if (pk === 'aha') return drawAha(view, head + tabs);
  const part = X.PARTS.find(p => p.k === pk) || X.PARTS[0];
  const p1 = X.libTop && X.libData && X.libData(part.k);
  view.innerHTML = `<div class="page">${head}${tabs}${p1 ? `<div style="margin-top:18px" id="lib-top">${X.libTop(part.k)}</div>` : ''}
    ${p1 ? `<details class="lib-full" ${['p1', 'p2', 'p34', 'p5', 'p6', 'p7'].includes(part.k) ? 'hidden' : 'style="margin-top:30px"'}><summary><b>Bản đọc đầy đủ</b> <span class="small muted">tài liệu gốc, đọc khi cần tra cứu sâu</span></summary>` : ''}
    <div class="row" style="margin:16px 0"><input class="inp" id="lib-q" placeholder="Tìm trong tên bài của ${part.n}…" style="max-width:380px"></div>
    <div id="lib-list" class="grid g2"></div>${p1 ? '</details>' : ''}</div>`;
  const draw = q => {
    $('#lib-list', view).innerHTML = X.libUnits(part.k).map(u => {
      const ls = u.lessons.filter(l => !q || l.title.toLowerCase().includes(q));
      if (!ls.length) return '';
      return `<div class="card"><div class="h3" style="font-family:var(--f-display);font-size:17px;margin-bottom:8px">${esc(u.title)}</div>${ls.map(l => `<a href="#/lesson/${l.id}" class="row" style="padding:6px 0;border-top:1px solid var(--line);color:var(--ink)">${S().lessons[l.id] ? `<span style="color:var(--sage)">${icon('check')}</span>` : `<span class="faint">${icon('read')}</span>`}<span class="grow small">${esc(l.title)}</span></a>`).join('')}</div>`;
    }).join('') || '<div class="empty">Không tìm thấy bài.</div>';
  };
  draw(''); $('#lib-q', view).oninput = e => draw(e.target.value.trim().toLowerCase());
  // Sổ tay: danh sách chủ đề lên đầu, phần "cách nghĩ + 4 bước" gập lại (đã học ở Bài 1 của Lộ trình)
  const top = $('#lib-top', view), h2 = top && [...top.querySelectorAll('h2')].find(h => /Học nhanh/.test(h.textContent));
  if (top && h2) {
    h2.textContent = 'Chủ đề để xem lại'; h2.style.marginTop = '6px';
    const det = document.createElement('details'); det.className = 'card lib-core'; det.innerHTML = '<summary><b>Cách nghĩ và phương pháp 4 bước</b> <span class="small muted">- Bài 1 trong Lộ trình</span></summary>';
    const body = document.createElement('div'); body.style.marginTop = '14px'; det.appendChild(body);
    [...top.children].forEach(c => { if (c === h2 || h2.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) return; body.appendChild(c); });
    top.appendChild(det);
  }
});
function drawAha(view, top) {
  const G = window.AHA || [];
  S().aha = S().aha || {};
  view.innerHTML = `<div class="page">${top}
    <div class="row" style="gap:12px;margin:16px 0">${X.xi('wow', 56)}<div class="small muted grow">Mỗi thẻ là một cách nghĩ bạn có thể áp dụng, kèm lúc nào mẹo đó không đúng. Mẹo giúp loại nhanh khi bí; quyết định cuối cùng vẫn dựa vào nghĩa và bằng chứng.</div></div>
    ${G.map((g, gi) => `<h2 class="h2" style="margin:22px 0 10px">${esc(g.g)}</h2><div class="grid g2">${g.items.map((c, ci) => {
      const k = gi + '-' + ci, done = S().aha[k];
      return `<div class="card aha ${done ? 'done' : ''}" data-k="${k}">
        <div class="row" style="align-items:flex-start;gap:10px"><span class="aha-bulb">${done ? '✓' : '💡'}</span><div class="grow"><div class="aha-t">${esc(c.t)}</div></div></div>
        <div class="aha-body" hidden>
          <p class="small" style="margin:10px 0"><b>Vì sao:</b> ${esc(c.why)}</p>
          <div class="aha-ex">${c.ex.map(e => `<div>${esc(e)}</div>`).join('')}</div>
          ${c.limit ? `<div class="aha-limit small"><b>Đừng lạm dụng:</b> ${esc(c.limit)}</div>` : ''}
          <div class="aha-try"><div class="small"><b>Thử ngay:</b> ${esc(c.try.q)}</div><div class="aha-opts">${c.try.o.map((o, oi) => `<button class="opt" data-o="${oi}">${esc(o)}</button>`).join('')}</div><div class="aha-fb small"></div></div>
        </div>
        <button class="btn ghost sm aha-open" style="margin-top:8px">${done ? 'Xem lại' : 'Mở thẻ'}</button></div>`;
    }).join('')}</div>`).join('')}</div>`;
  view.querySelectorAll('.card.aha').forEach(card => {
    const [gi, ci] = card.dataset.k.split('-').map(Number), c = G[gi].items[ci];
    const body = $('.aha-body', card), ob = $('.aha-open', card);
    ob.onclick = () => { body.hidden = !body.hidden; ob.textContent = body.hidden ? 'Mở thẻ' : 'Thu gọn'; };
    card.querySelectorAll('.aha-opts .opt').forEach(b => b.onclick = () => {
      if (card.dataset.ans) return; card.dataset.ans = 1;
      const ok = +b.dataset.o === c.try.a;
      card.querySelectorAll('.aha-opts .opt').forEach((x, i) => x.classList.add(i === c.try.a ? 'ok' : (x === b ? 'bad' : 'dim')));
      $('.aha-fb', card).innerHTML = `<b>${ok ? 'Aha, chuẩn!' : 'Chưa đúng.'}</b> ${esc(c.try.why)}`;
      if (X.react) X.react(ok, b);
      if (ok && !S().aha[card.dataset.k]) { S().aha[card.dataset.k] = Date.now(); X.save(); X.addXP(3, 'Aha!'); card.classList.add('done'); $('.aha-bulb', card).textContent = '✓'; }
    });
  });
}

/* ---------------- PRACTICE STATION ---------------- */
X.vocabQuizItems = (words, n) => {
  const pool = X.VOCAB.filter(w => w.kind === 'word');
  return sample(words, n).map(w => {
    const dis = sample(pool.filter(x => x.id !== w.id && x.vi !== w.vi && x.parts.some(p => w.parts.includes(p))), 3);
    const opts = shuffle([w, ...dis]);
    const rev = Math.random() < .5;
    return { id: 'v:' + w.id, part: w.parts[0], skill: 'Từ vựng chủ đề', kind: 'mcq', word: w.id,
      prompt: rev ? `“${w.vi}” là từ nào?` : w.w, vi: rev ? '' : '', options: opts.map(x => rev ? x.w : x.vi), answer: opts.indexOf(w),
      explain: `<b>${esc(w.w)}</b> = ${esc(w.vi)}${w.ex[0] ? `<br><i>${esc(w.ex[0])}</i>` : w.col[0] ? `<br><i>${esc(w.col[0])}</i>` : ''}` };
  });
};
X.route(/^\/practice\/(.+)$/, (view, uid) => {
  let pk, unit; for (const [k, us] of Object.entries(X.UNITS)) { const u = us.find(x => x.id === uid); if (u) { pk = k; unit = u; } }
  if (!unit) return X.go('#/path');
  const sid = 'P:' + uid;
  const build = () => {
    const items = shuffle(X.unitItems(pk, unit)).slice(0, 10);
    const words = X.unitWords(unit);
    const vq = X.vocabQuizItems(words, Math.max(0, Math.min(words.length, 12 - items.length)));
    return [...items, ...vq];
  };
  const items = build();
  const path = X.buildPath(pk).flatMap(u => u.stations), si = path.findIndex(s => s.id === sid), nextSt = path[si + 1];
  X.quizFlow(view, { title: 'Luyện: ' + unit.title, kicker: X.PARTS.find(p => p.k === pk).n + ' - Trạm luyện', items, mode: 'practice', ctx: 'path', back: '#/path/' + pk, reshuffle: build,
    listen: false },
    { passMark: 80, back: '#/path/' + pk,
      onDone: res => { const sc = pct(res.correct, res.total); const r = (S().stations[sid] ||= { tries: 0 }); r.tries++; r.best = Math.max(r.best || 0, sc); if (sc >= 80 && !r.done) { r.done = Date.now(); X.addXP(10, 'Đạt trạm luyện'); } X.save(); },
      get next() { return S().stations[sid]?.done && nextSt ? { href: stationHref(nextSt), label: 'Trạm tiếp' } : null; } });
});

/* ---------------- TESTS ---------------- */
X.testItems = t => {
  if (t.id === 'p1-final') return [...X.BANK.filter(i => i.part === 1), ...X.vocabQuizItems(X.VOCAB.filter(w => w.parts.includes(1) && w.star), 12)];
  let its = X.BANK.filter(t.filter);
  if (t.order === 'num') its.sort((a, b) => a.num - b.num);
  else if (t.random) its = sample(its, t.random);
  else if (t.maxQ) {
    const sets = {}; its.forEach(i => (sets[i.set || i.id] ||= []).push(i));
    const out = []; for (const g of shuffle(Object.values(sets))) { if (out.length >= t.maxQ) break; out.push(...g.sort((a, b) => (a.pos || 0) - (b.pos || 0))); }
    its = out;
  }
  else {
    // keep sets together
    const sets = {}; its.forEach(i => (sets[i.set || i.id] ||= []).push(i));
    its = shuffle(Object.values(sets)).map(g => g.sort((a, b) => (a.pos || 0) - (b.pos || 0))).flat();
  }
  return its;
};
const allTests = () => [{ id: 'p1-final', pk: 'p1', title: 'Part 1 - Kiểm tra tổng hợp', desc: 'Action/State/Passive và từ vựng tranh hay gặp nhất (★).', mins: 8 }, ...X.TESTS];
X.route(/^\/tests-old$/, view => {
  const s = S();
  view.innerHTML = `<div class="page"><div class="kicker">Đề luyện</div><h1 class="h1">Làm bài như thi thật</h1>
    <p class="lead">Bấm giờ, không xem đáp án giữa chừng. Mỗi câu đánh dấu <b>chắc / phân vân / lụi</b>. Kết quả tách được câu "chắc mà sai" (lỗ hổng thật) với câu "lụi trúng" (điểm không bền).</p>
    <div class="grid g2 sec">${allTests().map(t => { const h = s.tests[t.id] || []; const last = h[h.length - 1]; const n = X.testItems(t).length;
      return `<div class="card lab-card"><div class="row"><span class="pill">${t.pk ? X.PARTS.find(p => p.k === t.pk).n : 'Tổng hợp'}</span><span class="pill">${n} câu - ${t.mins} phút</span>${last ? `<span class="pill ${last.score >= 80 ? 'sage' : 'gold'}">Lần gần nhất ${last.score}%</span>` : ''}</div>
        <div class="h3" style="font-family:var(--f-display);font-size:18px">${esc(t.title)}</div><div class="small muted">${esc(t.desc)}</div>
        <div class="row"><a class="btn pri sm" href="#/test/${t.id}">Làm bài</a>${h.length ? `<span class="small faint">${h.length} lần - tốt nhất ${Math.max(...h.map(x => x.score))}%</span>` : ''}</div></div>`; }).join('')}</div>
    <div class="card tint sec"><div class="h3">Làm đề trên giấy hoặc đề ngoài?</div><p class="small muted" style="margin:6px 0 10px">Ghi từng câu sai vào Sổ lỗi bằng tay: số câu, dạng, mình chọn gì, vì sao sai, quy tắc rút ra. Hệ thống sẽ nhắc ôn lại đúng lúc.</p><a class="btn sm" href="#/errors/add">${icon('plus')} Thêm lỗi từ đề ngoài</a></div></div>`;
});
X.route(/^\/test\/(.+)$/, (view, id) => {
  const t = allTests().find(x => x.id === id); if (!t) return X.go('#/tests');
  const items = X.testItems(t);
  const pk = t.pk;
  view.innerHTML = `<div class="page"><a href="#/tests" class="small">${icon('back')} Đề luyện</a><div class="kicker" style="margin-top:14px">${pk ? X.PARTS.find(p => p.k === pk).n : 'Tổng hợp'}</div><h1 class="h1">${esc(t.title)}</h1><p class="lead">${esc(t.desc)}</p>
    <div class="card sec" style="max-width:620px"><div class="row"><span class="pill">${items.length} câu</span><span class="pill">${t.mins} phút</span>${t.listen ? '<span class="pill syn">Có audio</span>' : ''}</div>
    <ul class="small muted" style="padding-left:18px;margin:14px 0"><li>Làm hết rồi mới xem đáp án. Có thể quay lại câu trước.</li><li>Mỗi câu chọn mức chắc chắn. Câu lụi cứ đánh <b>Lụi</b>, đừng ngại.</li>${t.listen ? '<li>Bật loa. Câu hỏi tự phát, bấm Space để nghe lại.</li>' : ''}</ul>
    ${X.resumeCard(X.hereKey(), () => start(X.sessGet(X.hereKey()).mode))}
    <div class="seg" id="t-mode"><button data-m="test" class="on">Thi thật - bấm giờ</button><button data-m="practice">Luyện - xem đáp án từng câu</button></div>
    <div class="row" style="margin-top:18px"><button class="btn pri lg" id="t-go">Bắt đầu ${icon('arrow')}</button></div></div></div>`;
  $$('#t-mode button', view).forEach(b => b.onclick = () => { $$('#t-mode button', view).forEach(x => x.classList.remove('on')); b.classList.add('on'); });
  $('#t-go', view).onclick = () => start($('#t-mode button.on', view).dataset.m, true);
  function start(mode, fresh) {
    const isPath = Object.values(X.FINAL).includes(id);
    if (fresh) X.sessDel(X.hereKey());
    X.quizFlow(view, { title: t.title, kicker: 'Đề luyện', items, mode, timeLimit: mode === 'test' ? t.mins * 60 : 0, listen: !!t.listen, ctx: 'test:' + id, back: '#/tests', reshuffle: () => X.testItems(t) },
      { back: '#/tests', passMark: isPath ? 70 : null,
        onDone: res => { const sc = pct(res.correct, res.total); (S().tests[id] ||= []).push({ at: res.at, score: sc, n: res.total, ms: res.ms, mode });
          if (isPath) { const pkk = Object.keys(X.FINAL).find(k => X.FINAL[k] === id); const r = (S().stations['T:' + id] ||= { tries: 0 }); r.tries++; r.best = Math.max(r.best || 0, sc); if (sc >= 70 && !r.done) { r.done = Date.now(); X.addXP(30, `Hoàn thành ${X.PARTS.find(p => p.k === pkk).n}`); } }
          X.save(); } });
  }
});

/* ---------------- ERRORS (Sổ lỗi) ---------------- */
// ví dụ gợi ý trong ô "Mình đã nghĩ gì" và "Quy tắc rút ra", theo đúng Part của câu sai
const PH = {
  1: ['VD: thấy cái bàn trong tranh nên chọn câu có "table"', 'VD: chữ có trong ảnh chưa đủ, phải khớp cả hành động và vị trí'],
  2: ['VD: nghe thấy "meeting" giống câu hỏi nên chọn luôn', 'VD: đáp án lặp từ câu hỏi → nghi bẫy, ưu tiên câu trả lời gián tiếp'],
  3: ['VD: nghe được "Friday" nên chọn đáp án có Friday', 'VD: đáp án đúng thường nói lại bằng từ khác, đừng săn chữ giống y'],
  4: ['VD: không nghe kịp câu sau "however" nên đoán', 'VD: sau "however / unfortunately" là chỗ đặt đáp án, tập trung nghe đoạn đó'],
  5: ['VD: thấy "the" nên chọn danh từ, không nhìn chữ sau chỗ trống', 'VD: nhìn cả hai bên chỗ trống: trước danh từ cần tính từ'],
  6: ['VD: chỉ đọc câu có chỗ trống, không đọc câu trước', 'VD: câu chọn cả câu phải nối được với câu ngay sau'],
  7: ['VD: thấy chữ giống trong bài nên chọn, chưa tìm câu bằng chứng', 'VD: tìm được câu bằng chứng rồi mới chọn, đáp án trùng chữ dễ là bẫy'],
};
X.route(/^\/errors(?:\/(\w+))?$/, (view, tab) => {
  if (tab === 'add') return addErrorForm(view);
  if (tab === 'retry') return retryErrors(view);
  const s = S(); tab = tab || 'open';
  const open = s.errors.filter(e => e.status === 'open'), rev = s.errors.filter(e => e.status === 'review'), fixed = s.errors.filter(e => e.status === 'fixed');
  const dueN = rev.filter(X.errDue).length;
  const list = tab === 'open' ? open : tab === 'review' ? rev : fixed;
  const byCause = {}; s.errors.filter(e => e.cause).forEach(e => byCause[e.cause] = (byCause[e.cause] || 0) + 1);
  const maxC = Math.max(1, ...Object.values(byCause));
  view.innerHTML = `<div class="page">${X.stepHead('chua')}<div class="kicker">Sổ lỗi</div><h1 class="h1">Sai ở đâu, vì sao, sửa thế nào</h1>
    <p class="lead">Mọi câu sai (và câu lụi trúng) tự vào đây. Mỗi lỗi cần 3 bước: <b>gọi tên nguyên nhân</b> → <b>viết quy tắc rút ra</b> → <b>làm lại đúng 2 lần, cách nhau vài ngày</b>. Xong thì lỗi mới được tính là đã chữa.</p>
    <div class="grid g4 sec">
      <div class="card stat"><div class="v" style="color:var(--ember)">${open.length}</div><div class="l">chưa chẩn đoán</div></div>
      <div class="card stat"><div class="v">${dueN}</div><div class="l">đến hạn làm lại</div></div>
      <div class="card stat"><div class="v">${rev.length}</div><div class="l">đang theo dõi</div></div>
      <div class="card stat"><div class="v" style="color:var(--sage)">${fixed.length}</div><div class="l">đã chữa xong</div></div>
    </div>
    ${Object.keys(byCause).length ? `<div class="card sec"><div class="h3" style="margin-bottom:8px">Nguyên nhân hay gặp nhất của bạn</div>${Object.entries(byCause).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="hbar"><span>${esc(X.causeName(k))}</span><div class="bar ember"><i style="width:${pct(v, maxC)}%"></i></div><span class="mono small">${v}</span></div>`).join('')}</div>` : ''}
    <div class="row sec"><div class="seg">${[['open', `Cần chẩn đoán (${open.length})`], ['review', `Làm lại (${rev.length})`], ['fixed', `Đã chữa (${fixed.length})`]].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>
      <span class="grow"></span>${dueN ? `<a class="btn syn" href="#/errors/retry">${icon('refresh')} Làm lại ${dueN} câu đến hạn</a>` : ''}<a class="btn" href="#/errors/add">${icon('plus')} Thêm lỗi từ đề ngoài</a></div>
    ${tab === 'review' && rev.length ? `<div class="card tint sec err-how"><div class="h3">Làm lại hoạt động thế nào?</div><div class="err-steps"><div><i class="n">1</i><span>Lỗi đã chẩn đoán xong sẽ vào đây, hẹn <b>ngày mai</b> làm lại.</span></div><div><i class="n">2</i><span>Đến ngày, bấm <b>“Làm lại câu đến hạn”</b>. Làm đúng thì hẹn lần 2 sau <b>3 ngày</b>.</span></div><div><i class="n">3</i><span>Đúng đủ <b>2/2 lần</b> là lỗi chuyển sang <b>Đã chữa</b>. Sai thì quay về 0/2, hẹn lại ngày mai.</span></div></div><div class="small muted" style="margin-top:8px">Cách nhau vài ngày mới làm lại là để kiểm tra bạn nhớ thật, không phải nhớ đáp án vừa xem.</div></div>` : ''}
    <div id="err-list" style="margin-top:16px">${list.length ? list.map(errCard).join('') : `<div class="empty">${X.xi(tab === 'fixed' ? 'think' : 'happy', 70)}<br>${tab === 'open' ? 'Không còn lỗi chờ chẩn đoán. Làm bài trong Lộ trình hoặc Đề luyện, câu sai sẽ tự vào đây.' : tab === 'review' ? 'Chưa có lỗi nào đang chờ làm lại.' : 'Chưa có lỗi nào được chữa xong.'}</div>`}</div></div>`;
  $$('.seg button[data-t]', view).forEach(b => b.onclick = () => X.go('#/errors/' + b.dataset.t));
  bindErrCards(view);
});
function errCard(e) {
  const it = X.itemById[e.item];
  const q = it ? it.prompt : e.manual?.q || '';
  const yours = it ? (e.chosen != null ? `${LETTERS[e.chosen]}. ${it.options[e.chosen]}` : '(bỏ trống)') : e.manual?.yours || '';
  const right = it ? `${LETTERS[it.answer]}. ${it.options[it.answer]}` : e.manual?.right || '';
  const nextTxt = e.status === 'review' ? (X.errDue(e) ? 'làm lại hôm nay' : `làm lại ngày ${fmtDate(e.due)}`) : '';
  return `<div class="err" data-id="${e.id}"><div class="top"><span class="pill">${X.partOf(e.part).n}${it?.num ? ' - câu ' + it.num : e.manual?.ref ? ' - ' + esc(e.manual.ref) : ''}</span>${e.skill ? `<span class="pill syn">${esc(e.skill)}</span>` : ''}
    ${e.lucky ? '<span class="pill gold">Lụi trúng</span>' : e.conf === 'sure' ? '<span class="pill red">Chắc mà sai</span>' : e.conf ? `<span class="pill">${X.confName(e.conf)}</span>` : ''}
    ${e.times > 1 ? `<span class="pill ember">Sai ${e.times} lần</span>` : ''}${e.status === 'review' ? `<span class="pill ${X.errDue(e) ? 'syn' : ''}" title="Cần làm đúng 2 lần ở 2 ngày khác nhau">Đúng ${e.box}/2 - ${nextTxt}</span>` : ''}<span class="grow"></span><span class="small faint">${fmtDate(e.at)}</span></div>
    ${it?.context ? `<div class="q-ctx small">${esc(it.context)}</div>` : ''}
    ${it?.passage ? `<details class="small" style="margin-bottom:8px"><summary class="muted" style="cursor:pointer">Xem đoạn văn</summary><div class="passage" style="max-height:260px;margin-top:8px">${it.passage}</div></details>` : ''}
    <div class="q">${esc(q)}</div>
    <div class="ans"><span class="${e.lucky ? '' : 'y'}">Bạn chọn: ${esc(yours)}</span><span class="c">Đáp án: ${esc(right)}</span></div>
    ${it?.explain ? `<div class="small muted">${it.explain.includes('<') ? it.explain : esc(it.explain)}</div>` : ''}
    ${e.status === 'open' ? `<div style="margin-top:12px"><div class="small" style="font-weight:600">1. Vì sao sai?</div><div class="causes">${X.CAUSES.map(([k, n]) => `<button data-cause="${k}" class="${e.cause === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="grid g2"><div class="field"><label>2. Mình đã nghĩ gì khi chọn?</label><textarea class="inp" data-f="note" placeholder="${esc(PH[(it && it.part) || 2][0])}">${esc(e.note)}</textarea></div>
      <div class="field"><label>3. Quy tắc rút ra (lần sau gặp sẽ làm gì)</label><textarea class="inp" data-f="rule" placeholder="${esc(PH[(it && it.part) || 2][1])}">${esc(e.rule)}</textarea></div></div>
      <div class="row" style="margin-top:16px"><button class="btn pri sm" data-k="diag">Lưu chẩn đoán - làm lại sau 1 ngày</button><button class="btn ghost sm" data-k="del">Xóa</button></div></div>`
    : `${e.cause || e.rule ? `<div class="card tint" style="margin-top:10px;padding:12px 14px"><div class="small"><b>Nguyên nhân:</b> ${esc(X.causeName(e.cause))}</div>${e.note ? `<div class="small"><b>Đã nghĩ:</b> ${esc(e.note)}</div>` : ''}${e.rule ? `<div class="small"><b>Quy tắc:</b> ${esc(e.rule)}</div>` : ''}</div>` : ''}`}
  </div>`;
}
function bindErrCards(view) {
  $$('.err', view).forEach(card => {
    const e = S().errors.find(x => x.id === card.dataset.id); if (!e) return;
    $$('[data-cause]', card).forEach(b => b.onclick = () => { e.cause = b.dataset.cause; $$('[data-cause]', card).forEach(x => x.classList.toggle('on', x === b)); X.save(); });
    $$('[data-f]', card).forEach(t => t.oninput = () => { e[t.dataset.f] = t.value; X.save(); });
    const d = $('[data-k=diag]', card);
    if (d) d.onclick = () => {
      if (!e.cause) return X.toast('Chọn nguyên nhân trước');
      if ((e.rule || '').trim().length < 5) return X.toast('Viết quy tắc rút ra (một câu ngắn là đủ)');
      e.status = 'review'; e.box = 0; e.due = X.inDays(1); X.save(); X.addXP(3, 'Đã chẩn đoán lỗi'); X.render();
    };
    const del = $('[data-k=del]', card);
    if (del) del.onclick = () => { if (confirm('Xóa lỗi này khỏi sổ?')) { S().errors = S().errors.filter(x => x !== e); X.save(); X.render(); } };
  });
}
function retryErrors(view) {
  const due = S().errors.filter(X.errDue);
  const withItem = due.filter(e => X.itemById[e.item]), manual = due.filter(e => !X.itemById[e.item]);
  if (!due.length) return X.go('#/errors/review');
  if (!withItem.length) return manualRetry(view, manual);
  const items = withItem.map(e => X.itemById[e.item]);
  X.runQuiz(view, { title: 'Làm lại câu sai', kicker: 'Sổ lỗi', items, mode: 'practice', ctx: 'retry', back: '#/errors', noErrorLog: true,
    onCheck: (it, ok) => { const e = withItem.find(x => x.item === it.id); if (!e) return;
      if (ok) { e.box++; if (e.box >= 2) { e.status = 'fixed'; e.fixedAt = Date.now(); X.addXP(5, 'Chữa xong một lỗi'); } else e.due = X.inDays(3); }
      else { e.box = 0; e.times++; e.due = X.inDays(1); } X.save(); },
    onFinish: () => manual.length ? manualRetry(view, manual) : X.go('#/errors/review') });
}
function manualRetry(view, list) {
  let i = 0;
  const draw = () => {
    if (i >= list.length) { X.toast('Xong lượt ôn lỗi'); return X.go('#/errors/review'); }
    const e = list[i];
    view.innerHTML = `<div class="page"><div class="kicker">Sổ lỗi - Ôn lỗi từ đề ngoài ${i + 1}/${list.length}</div><h1 class="h1">Còn nhớ quy tắc không?</h1>
      <div class="card sec" style="max-width:700px"><div class="row"><span class="pill">${X.partOf(e.part).n}</span>${e.skill ? `<span class="pill syn">${esc(e.skill)}</span>` : ''}</div>
      <div class="q-prompt" style="margin-top:10px">${esc(e.manual?.q || e.manual?.ref || '')}</div>
      <p class="muted">Tự nói ra: vì sao lần trước sai, và quy tắc đúng là gì. Rồi mở đáp án để so.</p>
      <div id="mr-ans" style="display:none" class="card tint"><div class="small"><b>Đáp án đúng:</b> ${esc(e.manual?.right || '')}</div><div class="small"><b>Nguyên nhân:</b> ${esc(X.causeName(e.cause))}</div><div class="small"><b>Quy tắc:</b> ${esc(e.rule)}</div></div>
      <div class="row" style="margin-top:16px" id="mr-btns"><button class="btn pri" id="mr-show">Mở đáp án</button></div></div></div>`;
    $('#mr-show', view).onclick = () => { $('#mr-ans', view).style.display = 'block'; $('#mr-btns', view).innerHTML = '<button class="btn" data-g="0">Chưa nhớ</button><button class="btn pri" data-g="1">Nhớ đúng</button>';
      $$('[data-g]', view).forEach(b => b.onclick = () => { if (+b.dataset.g) { e.box++; if (e.box >= 2) { e.status = 'fixed'; e.fixedAt = Date.now(); X.addXP(5); } else e.due = X.inDays(3); } else { e.box = 0; e.due = X.inDays(1); } X.save(); i++; draw(); }); };
  };
  draw();
}
function addErrorForm(view) {
  view.innerHTML = `<div class="page"><a href="#/errors" class="small">${icon('back')} Sổ lỗi</a><h1 class="h1" style="margin-top:12px">Thêm lỗi từ đề ngoài</h1>
    <p class="lead">Dùng khi làm đề trên giấy, đề sách, hoặc bài coach giao. Ghi càng cụ thể, lần ôn sau càng có ích.</p>
    <div class="card sec" style="max-width:760px"><div class="grid g3">
      <div class="field"><label>Part</label><select class="inp" id="ae-part">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option value="${n}">Part ${n}</option>`).join('')}</select></div>
      <div class="field"><label>Đề / số câu</label><input class="inp" id="ae-ref" placeholder="VD: ETS Test 6 - câu 45"></div>
      <div class="field"><label>Dạng câu</label><input class="inp" id="ae-skill" placeholder="VD: Câu ngụ ý" list="ae-skills"><datalist id="ae-skills">${[...new Set(X.BANK.map(i => i.skill).filter(Boolean))].map(s => `<option value="${esc(s)}">`).join('')}</datalist></div></div>
      <div class="field" style="margin-top:12px"><label>Câu hỏi / tình huống (chép ngắn gọn)</label><textarea class="inp" id="ae-q" placeholder="VD: Why does the woman say, 'That's the third time this month'?"></textarea></div>
      <div class="grid g2" style="margin-top:12px"><div class="field"><label>Mình đã chọn</label><input class="inp" id="ae-y"></div><div class="field"><label>Đáp án đúng</label><input class="inp" id="ae-r"></div></div>
      <div class="field" style="margin-top:12px"><label>Vì sao sai?</label><div class="causes" id="ae-cause">${X.CAUSES.map(([k, n]) => `<button data-c="${k}">${n}</button>`).join('')}</div></div>
      <div class="field" style="margin-top:6px"><label>Mức chắc chắn lúc làm</label><div class="seg" id="ae-conf"><button data-c="sure" class="on">Chắc</button><button data-c="unsure">Phân vân</button><button data-c="guess">Lụi</button></div></div>
      <div class="field" style="margin-top:12px"><label>Quy tắc rút ra</label><textarea class="inp" id="ae-rule"></textarea></div>
      <div class="row" style="margin-top:16px"><button class="btn pri" id="ae-save">Lưu vào Sổ lỗi</button><button class="btn" id="ae-more">Lưu và thêm câu khác</button></div></div></div>`;
  let cause = '';
  $$('#ae-cause button', view).forEach(b => b.onclick = () => { cause = b.dataset.c; $$('#ae-cause button', view).forEach(x => x.classList.toggle('on', x === b)); });
  $$('#ae-conf button', view).forEach(b => b.onclick = () => { $$('#ae-conf button', view).forEach(x => x.classList.toggle('on', x === b)); });
  const saveIt = more => {
    const q = $('#ae-q', view).value.trim(), ref = $('#ae-ref', view).value.trim();
    if (!q && !ref) return X.toast('Ghi câu hỏi hoặc số câu');
    if (!cause) return X.toast('Chọn nguyên nhân');
    const rule = $('#ae-rule', view).value.trim();
    S().errors.unshift({ id: 'm' + Date.now().toString(36), item: null, part: +$('#ae-part', view).value, skill: $('#ae-skill', view).value.trim(), conf: $('#ae-conf button.on', view).dataset.c, src: 'manual', at: Date.now(),
      status: rule ? 'review' : 'open', cause, note: '', rule, box: 0, due: Date.now() + DAY * 0.9, times: 1, manual: { q, ref, yours: $('#ae-y', view).value.trim(), right: $('#ae-r', view).value.trim() } });
    X.save(); X.addXP(2);
    if (more) { X.toast('Đã lưu'); addErrorForm(view); } else X.go('#/errors/' + (rule ? 'review' : 'open'));
  };
  $('#ae-save', view).onclick = () => saveIt(false); $('#ae-more', view).onclick = () => saveIt(true);
}

/* ---------------- PROGRESS ---------------- */
X.route(/^\/progress$/, view => {
  const s = S();
  const att = s.attempts;
  const bySkill = {};
  att.forEach(a => { if (!a.s || a.s === 'Từ vựng chủ đề') return; const k = `${a.p}|${a.s}`; (bySkill[k] ||= { p: a.p, s: a.s, n: 0, ok: 0, ms: 0 }); bySkill[k].n++; bySkill[k].ok += a.ok; bySkill[k].ms += a.ms; });
  const skills = Object.values(bySkill).filter(x => x.n >= 2).sort((a, b) => a.ok / a.n - b.ok / b.n);
  const wl = [0, 0, 0, 0, 0]; Object.values(s.words).forEach(w => wl[w.lvl || 0]++);
  const learned = Object.keys(s.words).length;
  // heatmap 16 weeks
  const start = Date.now() - (16 * 7 - 1) * DAY - new Date().getDay() * DAY;
  const cells = []; for (let t = start; t <= Date.now(); t += DAY) { const v = s.xp.days[today(t)] || 0; cells.push(`<i class="${v >= 80 ? 'l4' : v >= 40 ? 'l3' : v >= 15 ? 'l2' : v > 0 ? 'l1' : ''}" title="${today(t)}: ${v} XP"></i>`); }
  const conf = { sure: [0, 0], unsure: [0, 0], guess: [0, 0] }; att.forEach(a => { if (conf[a.c]) { conf[a.c][0]++; conf[a.c][1] += a.ok; } });
  const B = badges();
  view.innerHTML = `<div class="page">${X.progTabs('all')}<div class="kicker">Tiến độ</div><h1 class="h1">Năng lực đo được</h1>
    <p class="lead">Không đếm số bài đã làm. Đo độ chính xác, tốc độ, mức chắc chắn và khả năng nhớ sau nhiều ngày.</p>
    <div class="grid g4 sec">
      <div class="card stat"><div class="v">${s.xp.total}</div><div class="l">XP tích lũy</div></div>
      <div class="card stat"><div class="v">${X.streak()}</div><div class="l">ngày học liên tục</div></div>
      <div class="card stat"><div class="v">${att.length}</div><div class="l">câu đã làm - đúng ${pct(att.filter(a => a.ok).length, att.length)}%</div></div>
      <div class="card stat"><div class="v">${wl[3] + wl[4]}</div><div class="l">từ nhớ chủ động / ${learned} đã học</div></div>
    </div>
    <div class="card sec"><div class="h3" style="margin-bottom:12px">Độ nét từng Part</div>
      <table class="dt"><tr><th>Part</th><th>Tiến độ</th><th class="num">Đúng</th><th class="num">TB/câu</th><th>Độ nét</th></tr>
      ${X.PARTS.map(p => { const st = X.pathStats(p.k); const a = att.filter(x => p.parts.includes(x.p)); return `<tr><td><a href="#/path/${p.k}"><b>${p.n}</b></a> <span class="small muted">${p.vi}</span></td><td style="width:28%"><div class="bar thin"><i style="width:${pct(st.done, st.total)}%"></i></div><span class="small faint">${st.passed}/${st.units} bài - ${st.stars}★</span></td><td class="num">${a.length ? pct(a.filter(x => x.ok).length, a.length) + '%' : '—'}</td><td class="num">${a.length ? fmtMs(a.reduce((m, x) => m + x.ms, 0) / a.length) : '—'}</td><td>${X.lvlHtml(st.score)}</td></tr>`; }).join('')}</table></div>
    <div class="grid g2 sec">
      <div class="card"><div class="h3" style="margin-bottom:10px">Dạng câu cần ưu tiên</div>${skills.length ? `<table class="dt"><tr><th>Dạng</th><th class="num">Đúng</th><th class="num">TB</th></tr>${skills.slice(0, 10).map(x => `<tr><td><span class="pill">P${x.p}</span> ${esc(x.s)}</td><td class="num"><span class="pill ${x.ok / x.n >= .85 ? 'sage' : x.ok / x.n >= .5 ? 'gold' : 'red'}">${pct(x.ok, x.n)}%</span></td><td class="num">${fmtMs(x.ms / x.n)}</td></tr>`).join('')}</table>
        <p class="small muted" style="margin-top:10px">&lt;50%: học lại nền tảng - 50-69%: luyện dạng cụ thể - 70-84%: luyện trộn - 85%+: kiểm tra trí nhớ sau vài ngày.</p>` : '<div class="empty">Làm thêm bài để có dữ liệu theo dạng câu.</div>'}</div>
      <div class="grid" style="gap:16px">
        <div class="card"><div class="h3" style="margin-bottom:10px">Từ vựng theo mức</div>${X.LEVELS.map((n, i) => `<div class="hbar"><span>${n}</span><div class="bar sage"><i style="width:${pct(wl[i], Math.max(1, learned))}%"></i></div><span class="mono small">${wl[i]}</span></div>`).join('')}</div>
        <div class="card"><div class="h3" style="margin-bottom:10px">Độ tin cậy khi làm bài</div>${[['sure', 'Chắc'], ['unsure', 'Phân vân'], ['guess', 'Lụi']].map(([k, n]) => `<div class="hbar"><span>${n} - ${conf[k][0]} câu</span><div class="bar"><i style="width:${pct(conf[k][1], conf[k][0])}%"></i></div><span class="mono small">${conf[k][0] ? pct(conf[k][1], conf[k][0]) + '%' : '—'}</span></div>`).join('')}
        <p class="small muted" style="margin-top:8px">Câu "chắc" nên đúng trên 90%. Thấp hơn nghĩa là đang hiểu sai mà không biết.</p></div>
      </div></div>
    <div class="card sec"><div class="sec-h"><div class="h3">16 tuần gần nhất</div><span class="small faint">mỗi ô là một ngày</span></div><div class="heat">${cells.join('')}</div></div>
    <div class="sec"><h2 class="h2" style="margin-bottom:12px">Cột mốc</h2><div class="badges">${B.map(b => `<div class="badge ${b.on ? 'on' : ''}"><span class="bi">${icon(b.ic)}</span><div><b class="small">${b.t}</b><div class="small muted">${b.d}</div></div></div>`).join('')}</div></div>
    ${Object.keys(s.tests).length ? `<div class="card sec"><div class="h3" style="margin-bottom:8px">Lịch sử đề</div><table class="dt"><tr><th>Đề</th><th>Ngày</th><th class="num">Điểm</th><th class="num">Thời gian</th></tr>${Object.entries(s.tests).flatMap(([id, h]) => h.map(x => ({ id, ...x }))).sort((a, b) => b.at - a.at).slice(0, 15).map(x => `<tr><td>${esc((allTests().find(t => t.id === x.id) || {}).title || (X.examTitle && X.examTitle(x.id)) || x.id)}</td><td>${fmtDate(x.at)}</td><td class="num">${x.score}%</td><td class="num">${fmtMs(x.ms)}</td></tr>`).join('')}</table></div>` : ''}
  </div>`;
});
function badges() {
  const s = S(), st = X.streak(), fixed = s.errors.filter(e => e.status === 'fixed').length, active = Object.values(s.words).filter(w => w.lvl >= 3).length;
  const partsDone = X.PARTS.filter(p => { const x = X.pathStats(p.k); return x.done === x.total; }).length;
  return [
    { ic: 'flame', t: 'Chuỗi 7 ngày', d: 'Học 7 ngày liên tục', on: st >= 7 }, { ic: 'flame', t: 'Chuỗi 30 ngày', d: 'Một tháng không bỏ', on: st >= 30 },
    { ic: 'err', t: 'Thợ chữa lỗi', d: 'Chữa xong 20 lỗi', on: fixed >= 20 }, { ic: 'words', t: '100 từ chủ động', d: 'Gõ lại đúng 100 từ', on: active >= 100 },
    { ic: 'target', t: 'Không lụi', d: '50 câu "chắc" đúng liên tiếp', on: (() => { let n = 0, m = 0; s.attempts.forEach(a => { if (a.c === 'sure') { n = a.ok ? n + 1 : 0; m = Math.max(m, n); } }); return m >= 50; })() },
    { ic: 'scan', t: 'Xuyên thấu', d: 'Hoàn thành một Part', on: partsDone >= 1 },
  ];
}

/* ---------------- SETTINGS ---------------- */
X.route(/^\/settings$/, view => {
  const p = S().profile;
  view.innerHTML = `<div class="page"><div class="kicker">Hồ sơ</div><h1 class="h1">Thông tin và cài đặt</h1>
    <div class="grid g2 sec">
      <div class="card"><div class="h3" style="margin-bottom:12px">Mục tiêu</div><div class="grid g2">
        <div class="field"><label>Tên</label><input class="inp" data-p="name" value="${esc(p.name)}"></div>
        <div class="field"><label>Ngày thi</label><input class="inp" type="date" data-p="examDate" value="${esc(p.examDate)}"></div>
        <div class="field"><label>Điểm hiện tại</label><input class="inp" data-p="current" value="${esc(p.current)}"></div>
        <div class="field"><label>Điểm mục tiêu</label><input class="inp" data-p="target" value="${esc(p.target)}"></div>
        <div class="field"><label>Mục tiêu XP mỗi ngày</label><input class="inp" type="number" min="10" step="10" data-p="dailyGoal" value="${p.dailyGoal}"></div>
        <div class="field"><label>Từ mới mỗi ngày</label><input class="inp" type="number" min="0" max="40" data-p="newWords" value="${p.newWords}"></div></div>
        <div class="field" style="margin-top:12px"><label>Ưu tiên (lộ trình hiện trong Hôm nay)</label><div class="pick g2 compact" id="st-focus">${X.TRACKS.map(x => `<button type="button" data-k="${x.k}" class="pick-o ${p.focus.includes(x.k) ? 'on' : ''}"><span class="pick-ck">${icon('check')}</span><b>${esc(x.n)}</b></button>`).join('')}</div></div></div>
      <div class="card"><div class="h3" style="margin-bottom:12px">Giọng đọc</div>
        <div class="field" style="margin-bottom:12px"><label>Nguồn giọng</label><div class="seg" id="st-src">${[['auto', 'Tự động'], ['files', 'Giọng TOOEZ'], ['browser', 'Giọng trình duyệt']].map(([k, n]) => `<button data-v="${k}" class="${(p.voiceSrc || 'auto') === k ? 'on' : ''}">${n}</button>`).join('')}</div>
          <div class="small muted" style="margin-top:6px">Tự động: dùng giọng Natural có sẵn nếu bạn mở bằng Microsoft Edge, trình duyệt khác dùng giọng TOOEZ thu sẵn.</div></div>
        <div id="st-vq"></div>
        <div class="field"><label>Giọng chính</label><div class="seg" id="st-acc">${[['en-US', 'Mỹ'], ['en-GB', 'Anh'], ['en-AU', 'Úc']].map(([k, n]) => `<button data-v="${k}" class="${p.accent === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
        <div class="grid g2" style="margin-top:12px"><div class="field"><label>Giọng nữ</label><select class="inp" id="st-vw"></select></div><div class="field"><label>Giọng nam</label><select class="inp" id="st-vm"></select></div></div>
        <div class="field" style="margin-top:12px"><label>Tốc độ: <span id="st-rv">${p.rate}×</span></label><input type="range" min="0.75" max="1.3" step="0.05" value="${p.rate}" id="st-rate"></div>
        <label class="row small" style="margin-top:12px;gap:8px"><input type="checkbox" id="st-sound" ${p.sound === false ? '' : 'checked'}> Âm thanh hiệu ứng (ting khi đúng, bụp khi sai)</label>
        <div class="row" style="margin-top:12px"><button class="btn sm" id="st-test">${icon('vol')} Nghe thử hội thoại</button><span class="small muted" id="st-vc"></span></div>
        <details style="margin-top:14px"><summary class="small" style="cursor:pointer;font-weight:700;color:var(--syn)">Cách có giọng đọc tự nhiên hơn (miễn phí)</summary>
          <div class="small muted" style="margin-top:8px;line-height:1.7">
          <b>Cách nhanh nhất:</b> mở web bằng <b>Microsoft Edge</b> (Windows hay Mac đều được). Edge có sẵn giọng “Natural” như Aria, Jenny, Guy, Sonia, Ryan, web tự chọn.<br>
          <b>Mac:</b> Cài đặt hệ thống → Trợ năng → Nội dung được đọc → Giọng hệ thống → Quản lý giọng → tải giọng tiếng Anh có chữ <b>(Premium)</b> hoặc <b>(Enhanced)</b>, ví dụ Ava, Zoe, Evan (Mỹ), Jamie, Serena (Anh). Tải xong mở lại trình duyệt.<br>
          <b>iPhone/iPad:</b> Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → English → tải giọng Premium/Enhanced.<br>
          <b>Chrome:</b> dùng được giọng “Google US English / UK English”, khá hơn giọng mặc định nhưng chưa tự nhiên bằng Edge.</div></details></div>
    </div>
    <div class="card sec"><div class="h3" style="margin-bottom:6px">Ảnh minh họa Part 1 <span class="pill">coach</span></div>
      <p class="small muted" style="margin:0 0 12px">Danh sách ảnh cần tải cho từ vựng Part 1, tên file phải đặt, và từ nào đã có ảnh.</p>
      ${/admin/.test(location.search) || (() => { try { return localStorage.getItem('tooez.admin'); } catch (e) { return 0; } })() ? `<a class="btn sm" href="#/images">${icon('scan')} Mở danh sách ảnh</a>` : ''}</div>
    <div class="card sec"><div class="h3" style="margin-bottom:6px">Dữ liệu học tập</div>
      <p class="small muted" style="margin:0 0 12px">Tiến độ đang lưu trên trình duyệt của máy này. Sao lưu ra file để chuyển máy hoặc gửi coach xem.</p>
      <div class="row btn-row"><button class="btn" id="st-exp">${icon('dl')} Tải file sao lưu</button><label class="btn">Khôi phục từ file<input type="file" accept=".json" id="st-imp" hidden></label><span class="grow"></span><button class="btn ghost" id="st-reset" style="color:var(--red)">Xóa toàn bộ tiến độ</button></div><div class="small faint" style="margin-top:8px">Đang học cùng coach? Gửi file sao lưu cho coach để coach xem Sổ lỗi và kết quả của bạn.</div></div>
    <div class="sec">${X.donateBox ? X.donateBox(true) : ''}</div>${X.tmNote ? X.tmNote() : ''}</div>`;
  $$('[data-p]', view).forEach(i => i.onchange = () => { p[i.dataset.p] = i.type === 'number' ? +i.value : i.value.trim(); X.save(); X.renderSide(); X.toast('Đã lưu'); });
  $$('#st-focus button', view).forEach(b => b.onclick = () => { b.classList.toggle('on'); p.focus = $$('#st-focus button.on', view).map(x => x.dataset.k); X.save(); });
  $$('#st-src button', view).forEach(b => b.onclick = () => { $$('#st-src button', view).forEach(x => x.classList.toggle('on', x === b)); p.voiceSrc = b.dataset.v; X.save(); X.TTS.speak('Could you send me the revised schedule by Friday?', { sex: 'W' }); });
  $$('#st-acc button', view).forEach(b => b.onclick = () => { $$('#st-acc button', view).forEach(x => x.classList.toggle('on', x === b)); p.accent = b.dataset.v; X.save(); });
  $('#st-sound', view).onchange = e => { p.sound = e.target.checked; X.save(); if (p.sound) X.sfx.ok(); };
  $('#st-rate', view).oninput = e => { p.rate = +e.target.value; $('#st-rv', view).textContent = p.rate + '×'; X.save(); };
  const drawVoices = () => {
    const T = X.TTS, q = T.quality(), ranked = T.ranked();
    const lab = { natural: ['sage', 'Giọng tự nhiên', 'Máy này có giọng chất lượng cao, web đang dùng nó.'], good: ['gold', 'Giọng khá', 'Nghe được, nhưng mở bằng Microsoft Edge sẽ tự nhiên hơn nhiều.'], robot: ['red', 'Giọng robot', 'Máy chưa có giọng tốt. Xem hướng dẫn bên dưới, mất 2 phút.'] }[q];
    $('#st-vq', view).innerHTML = ranked.length ? `<div class="card tint" style="padding:12px 14px;margin-bottom:12px"><span class="pill ${lab[0]}">${lab[1]}</span> <span class="small muted">${lab[2]}</span></div>` : '<div class="small muted" style="margin-bottom:10px">Đang tải danh sách giọng…</div>';
    const opts = cur => `<option value="">Tự chọn giọng tốt nhất</option>` + ranked.map(v => `<option value="${esc(v.name)}" ${v.name === cur ? 'selected' : ''}>${esc(v.name)} - ${esc(v.lang)}${T.score(v) >= 90 ? ' ★' : ''}</option>`).join('');
    $('#st-vw', view).innerHTML = opts(p.voiceW); $('#st-vm', view).innerHTML = opts(p.voiceM);
  };
  drawVoices(); if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', drawVoices);
  X.onLeave(() => { if ('speechSynthesis' in window) speechSynthesis.removeEventListener('voiceschanged', drawVoices); });
  $('#st-vw', view).onchange = e => { p.voiceW = e.target.value; X.save(); X.TTS.speak('Hello, this is the female voice.', { sex: 'W' }); };
  $('#st-vm', view).onchange = e => { p.voiceM = e.target.value; X.save(); X.TTS.speak('Hello, this is the male voice.', { sex: 'M' }); };
  $('#st-test', view).onclick = () => { const w = X.TTS.pick('W'), m = X.TTS.pick('M'); $('#st-vc', view).textContent = w ? `Nữ: ${w.name} - Nam: ${m ? m.name : '—'}` : 'Không thấy giọng tiếng Anh'; X.TTS.play([{ s: 'W', t: 'Could you send me the revised schedule by Friday?' }, { s: 'M', t: "Sure, I'll e-mail it this afternoon." }]); };
  $('#st-exp', view).onclick = () => X.downloadBackup();
  $('#st-imp', view).onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { X.importData(t); X.toast('Đã khôi phục'); X.render(); } catch (err) { X.toast(err.message); } }); };
  $('#st-reset', view).onclick = () => { if (confirm('Xóa toàn bộ tiến độ trên máy này? Không hoàn tác được.')) { X.resetAll(); location.hash = '#/today'; location.reload(); } };
});
})();
