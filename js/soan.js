/* TOOEZ - trang Soạn đề (#/soan), chỉ tài khoản admin vào được.
   Sửa câu hỏi, đáp án, lời chữa, đoạn văn, transcript, ảnh của đề thi và ảnh Part 1; thêm câu mới vào đề.
   Bản sửa lưu vào Supabase (bảng content_edits, ảnh ở kho "content"), học sinh tải về khi mở web. */
'use strict';
(() => {
const { $, $$, esc, icon, LETTERS } = X;
const CT = () => window.TOOEZ_CONTENT;
const sb = () => X.cloud && X.cloud.sb && X.cloud.sb();
const SPK = ['W', 'M', 'M2', 'S', 'Q', 'A', 'N'];
const toLines = a => (a || []).map(l => `${l.s}: ${l.t}`).join('\n');
const fromLines = t => t.split('\n').map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(W|M2|M|S|Q|A|N)\s*:\s*(.+)$/); return m ? { s: m[1], t: m[2] } : { s: 'W', t: x }; });
const allItems = () => [...X.BANK, ...(window.EXAM_EXTRA || [])];
const edited = id => !!(CT() && CT().rows().some(r => r.id === id));

// lưu một bản sửa lên Supabase rồi áp dụng ngay
async function save(kind, id, data) {
  const { error } = await sb().from('content_edits').upsert({ id, kind, data, updated_at: new Date().toISOString() });
  if (error) throw error;
  const rows = CT().rows().filter(r => !(r.id === id && r.kind === kind)); rows.push({ id, kind, data, updated_at: new Date().toISOString() });
  CT().set(rows); CT().apply([{ id, kind, data }]);
  if (kind === 'item' && data._new && !X.itemById[id]) X.itemById[id] = allItems().find(i => i.id === id);
}
async function unsave(kind, id) {
  const { error } = await sb().from('content_edits').delete().eq('id', id).eq('kind', kind);
  if (error) throw error;
  await CT().refresh();
}
async function upload(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `img/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const { error } = await sb().storage.from('content').upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
  return sb().storage.from('content').getPublicUrl(path).data.publicUrl;
}
const errText = e => { const m = String((e && e.message) || e); return /row-level|permission|not allowed|Unauthorized|JWT/i.test(m) ? 'Tài khoản này chưa có quyền admin trên Supabase.' : /relation|does not exist|schema cache/i.test(m) ? 'Chưa tạo bảng content_edits trên Supabase (chạy đoạn SQL Soạn đề).' : /Bucket not found/i.test(m) ? 'Chưa tạo kho ảnh "content" trên Supabase.' : m; };

/* ---------------- khung trang + kiểm tra quyền ---------------- */
X.route(/^\/soan(?:\/(\w+))?(?:\/([^/]+))?$/, (view, tab, arg) => {
  tab = tab || 'de';
  const head = `<div class="page wide"><div class="kicker">Admin</div><h1 class="h1">Soạn đề</h1>`;
  if (!X.cloud || !X.cloud.on) { view.innerHTML = head + '<p class="lead">Chưa bật đăng nhập (js/cloud-config.js).</p></div>'; return; }
  if (!X.cloud.ready()) { view.innerHTML = head + '<p class="lead">Đang kiểm tra đăng nhập…</p></div>'; setTimeout(() => X.hereKey().startsWith('/soan') && X.render(), 800); return; }
  if (!X.cloud.user()) { view.innerHTML = head + `<p class="lead">Đăng nhập bằng tài khoản admin để soạn đề.</p><button class="btn pri" id="sd-login">Đăng nhập</button></div>`; $('#sd-login', view).onclick = () => X.cloud.login(); return; }
  if (!X.cloud.admin()) { view.innerHTML = head + `<p class="lead">Tài khoản <b>${esc(X.cloud.user().email || '')}</b> chưa có quyền soạn đề.</p><p class="small muted">Vào Supabase → SQL Editor, chạy: <code>insert into public.admins(email) values ('email-của-bạn');</code> rồi tải lại trang.</p></div>`; return; }
  view.innerHTML = head + `<p class="lead">Sửa xong bấm Lưu là học sinh thấy ở lần mở web tiếp theo, không cần đưa lại thư mục lên Netlify.</p>
    <div class="seg sec" id="sd-tab">${[['de', 'Đề thi'], ['anh', 'Ảnh Part 1'], ['tim', 'Tìm câu bất kỳ']].map(([k, n]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div id="sd-main" class="sec"></div></div>`;
  $$('#sd-tab button', view).forEach(b => b.onclick = () => X.go('#/soan/' + b.dataset.t));
  const main = $('#sd-main', view);
  if (tab === 'de') return examTab(main, arg);
  if (tab === 'anh') return picTab(main, arg);
  if (tab === 'tim') return searchTab(main);
  if (tab === 'cau') return itemForm(main, decodeURIComponent(arg || ''));
});

/* ---------------- Đề thi ---------------- */
function examTab(main, id) {
  const ex = X.EXAMS, e = ex.find(x => x.id === id) || ex[0];
  const its = X.examItems(e).concat(allItems().filter(i => i._hidden && (e.sets ? e.sets.includes(i.set) : (e.ids || []).includes(i.id))));
  main.innerHTML = `<div class="row" style="gap:10px;flex-wrap:wrap"><select class="inp" id="sd-ex" style="max-width:280px">${ex.map(x => `<option value="${x.id}" ${x === e ? 'selected' : ''}>Part ${x.part} - ${esc(x.n)}</option>`).join('')}</select>
      <span class="small muted">${its.length} câu</span><span class="grow"></span><button class="btn pri sm" id="sd-add">${icon('plus')} Thêm câu vào đề này</button></div>
    <div class="sd-list" style="margin-top:12px">${its.map((it, k) => `<a class="sd-row ${it._hidden ? 'off' : ''}" href="#/soan/cau/${encodeURIComponent(it.id)}"><b class="mono">${e.start + k}</b>${it.img ? `<img src="${esc(it.img)}" alt="">` : ''}<span class="grow">${esc(String(it.prompt || '').slice(0, 110))}${it.setTitle && (k === 0 || its[k - 1].set !== it.set) ? ` <span class="pill">${esc(it.setTitle)}</span>` : ''}</span>${it._hidden ? '<span class="pill red">đã ẩn</span>' : edited(it.id) ? '<span class="pill gold">đã sửa</span>' : ''}${it.src === 'admin' ? '<span class="pill syn">câu mới</span>' : ''}</a>`).join('')}</div>`;
  $('#sd-ex', main).onchange = ev => X.go('#/soan/de/' + ev.target.value);
  $('#sd-add', main).onclick = () => newItem(main, e);
}
function newItem(main, e) {
  const sets = e.sets ? [...new Set(e.sets)] : null;
  X.modal(`<div class="h3">Thêm câu vào Part ${e.part} - ${esc(e.n)}</div>
    ${sets ? `<div class="field" style="margin-top:12px"><label>Thuộc bộ (cùng audio / đoạn văn)</label><select class="inp" id="nw-set"><option value="__new">Bộ mới (audio / đoạn văn riêng)</option>${sets.map(s => { const f = allItems().find(i => i.set === s); return `<option value="${s}">${esc(f && f.setTitle || s)}</option>`; }).join('')}</select></div>
      <div class="field" id="nw-tf"><label>Tên bộ mới</label><input class="inp" id="nw-title" placeholder="VD: Đặt phòng khách sạn"></div>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn pri" id="nw-ok">Tạo câu</button><button class="btn ghost" id="nw-x">Hủy</button></div>`, (m, close) => {
    const sel = $('#nw-set', m); if (sel) sel.onchange = () => { $('#nw-tf', m).style.display = sel.value === '__new' ? '' : 'none'; };
    $('#nw-x', m).onclick = close;
    $('#nw-ok', m).onclick = async () => {
      const id = 'adm-' + Date.now().toString(36), its = X.examItems(e), P = e.part;
      const it = { _new: 1, part: P, block: '', skill: '', prompt: P === 1 ? 'Câu nào tả đúng tranh?' : P === 2 ? '' : P >= 5 ? '' : 'Question?', options: P === 2 ? ['', '', ''] : ['', '', '', ''], answer: 0, explain: '',
        kind: P === 1 ? 'mcq' : P === 2 ? 'p2' : P <= 4 ? 'p34' : P === 5 ? 'p5' : P === 6 ? 'p6' : 'p7' };
      if (P === 1) Object.assign(it, { tag: 'case', ao: 1, audio: [] });
      if (P === 2) it.audio = [];
      let examPatch = null;
      if (sets) {
        let set = sel.value, title = '';
        if (set === '__new') { set = 'adm-set-' + Date.now().toString(36); title = ($('#nw-title', m).value || 'Bộ mới').trim(); examPatch = { sets: [...e.sets, set] }; }
        const mates = allItems().filter(i => i.set === set);
        Object.assign(it, { set, setTitle: title || (mates[0] && mates[0].setTitle) || '', pos: mates.length + 1 });
        if (mates[0]) ['audio', 'passage', 'graphic'].forEach(k => { if (mates[0][k] !== undefined) it[k] = JSON.parse(JSON.stringify(mates[0][k])); });
        else if (P <= 4) it.audio = [];
        else it.passage = '<p></p>';
        if (P === 6) { it.num = e.start + its.length; it.prompt = 'Câu ' + it.num; }
      } else if (e.test) { Object.assign(it, { test: e.test, num: e.start + its.length }); examPatch = null; }
      else examPatch = { ids: [...(e.ids || []), id] };
      try { await save('item', id, it); if (examPatch) await save('exam', e.id, examPatch); close(); X.go('#/soan/cau/' + id); }
      catch (err) { X.toast(esc(errText(err)), 4000); }
    };
  });
}

/* ---------------- Sửa một câu ---------------- */
function itemForm(main, id) {
  const it = X.itemById[id] || allItems().find(i => i.id === id);
  if (!it) { main.innerHTML = '<p class="muted">Không tìm thấy câu này.</p>'; return; }
  const P = it.part, n = (it.options || []).length || 4;
  const ex = X.EXAMS.find(e => X.examItems(e).includes(it) || (e.sets || []).includes(it.set) || (e.ids || []).includes(it.id));
  const back = ex ? '#/soan/de/' + ex.id : '#/soan/tim';
  const mates = it.set ? allItems().filter(i => i.set === it.set && i !== it) : [];
  const hasAudio = P <= 4 || (it.audio && it.audio.length), hasPassage = it.passage !== undefined || P >= 6 || it.graphic;
  main.innerHTML = `<a href="${back}" class="small">${icon('back')} ${ex ? `Part ${ex.part} - ${esc(ex.n)}` : 'Tìm câu'}</a>
    <div class="row" style="margin:10px 0;gap:8px;flex-wrap:wrap"><span class="pill">Part ${P}</span><span class="pill mono">${esc(id)}</span>${it.setTitle ? `<span class="pill">${esc(it.setTitle)}</span>` : ''}${edited(id) ? '<span class="pill gold">đã sửa</span>' : ''}${it._hidden ? '<span class="pill red">đang ẩn</span>' : ''}</div>
    <div class="grid g2 sd-form">
      <div class="card">
        ${P === 1 || it.img !== undefined ? `<div class="field"><label>Ảnh</label><div class="sd-img">${it.img ? `<img src="${esc(it.img)}" alt="" id="f-imgp">` : '<div class="muted small" id="f-imgp">Chưa có ảnh</div>'}</div><input type="file" accept="image/*" id="f-img"><input type="hidden" id="f-imgv" value="${esc(it.img || '')}"></div>`
          : `<div class="field"><label>Ảnh (không bắt buộc)</label><input type="file" accept="image/*" id="f-img"><input type="hidden" id="f-imgv" value=""><div id="f-imgp"></div></div>`}
        ${hasPassage ? `<div class="field"><label>${P === 3 || P === 4 ? 'Bảng / biểu đồ (HTML)' : 'Đoạn văn (HTML)'}${mates.length ? ` <span class="faint">- sửa ở đây là sửa cho cả ${mates.length + 1} câu cùng bộ</span>` : ''}</label><textarea class="inp mono" id="f-pass" style="min-height:200px">${esc(it.passage || '')}</textarea></div>` : ''}
        ${hasAudio ? `<div class="field"><label>Transcript audio - mỗi dòng "W: câu" (W nữ, M nam, M2 nam 2, S người nói, Q câu hỏi, A đáp án)${mates.length ? ` <span class="faint">- chung cho cả bộ</span>` : ''}</label><textarea class="inp mono" id="f-aud" style="min-height:260px">${esc(toLines(it.audio))}</textarea><div class="small faint">Audio sửa mới sẽ đọc bằng giọng của trình duyệt cho đến khi có file thu sẵn.</div></div>` : ''}
      </div>
      <div class="card">
        <div class="field"><label>Câu hỏi</label><input class="inp" id="f-q" value="${esc(it.prompt || '')}"></div>
        <div class="field"><label>Đáp án - chấm vào đáp án đúng</label>${Array.from({ length: n }, (_, k) => `<div class="row sd-opt"><input type="radio" name="f-ans" value="${k}" ${it.answer === k ? 'checked' : ''}><b>${LETTERS[k]}</b><input class="inp" data-o="${k}" value="${esc((it.options || [])[k] || '')}"></div>`).join('')}</div>
        <div class="field"><label>Dạng câu (skill)</label><input class="inp" id="f-sk" value="${esc(it.skill || '')}"></div>
        <div class="field"><label>Lời chữa (hiện sau khi làm, được dùng thẻ &lt;b&gt;)</label><textarea class="inp" id="f-exp" style="min-height:140px">${esc(it.explain || '')}</textarea></div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn pri" id="f-save">Lưu</button>${edited(id) && it.src !== 'admin' ? '<button class="btn" id="f-rev">Về bản gốc</button>' : ''}<button class="btn ghost" id="f-hide">${it._hidden ? 'Hiện lại câu này' : 'Ẩn câu này'}</button><span class="small" id="f-msg"></span></div>
      </div></div>`;
  const msg = (t, ok) => { const el = $('#f-msg', main); el.textContent = t; el.style.color = ok ? 'var(--sage)' : 'var(--red)'; };
  $('#f-img', main).onchange = async ev => { const f = ev.target.files[0]; if (!f) return; msg('Đang tải ảnh…', true);
    try { const url = await upload(f); $('#f-imgv', main).value = url; $('#f-imgp', main).outerHTML = `<img src="${esc(url)}" alt="" id="f-imgp" style="max-width:100%;border-radius:10px">`; msg('Đã tải ảnh, bấm Lưu để áp dụng.', true); } catch (e) { msg(errText(e)); } };
  $('#f-save', main).onclick = async () => {
    const opts = $$('[data-o]', main).map(i => i.value.trim()), ans = +(($('[name=f-ans]:checked', main) || {}).value ?? -1);
    if (ans < 0) return msg('Chọn đáp án đúng.');
    if (opts.some(o => !o) && P !== 2) return msg('Điền đủ các đáp án.');
    const d = Object.assign(JSON.parse(JSON.stringify(CT().find(id)?.data || {})), { prompt: $('#f-q', main).value.trim(), options: opts, answer: ans, explain: $('#f-exp', main).value.trim(), skill: $('#f-sk', main).value.trim() });
    const img = $('#f-imgv', main).value; if (img) d.img = img;
    const pass = $('#f-pass', main), aud = $('#f-aud', main);
    if (pass) d.passage = pass.value; if (aud) d.audio = fromLines(aud.value);
    if (P === 1 && aud && d.audio.length !== n) d.audio = opts.map((o, k) => ({ s: k % 2 ? 'M' : 'W', t: `(${LETTERS[k]}) ${o}` }));   // Part 1: 4 câu tả đọc lần lượt
    try {
      $('#f-save', main).disabled = true; msg('Đang lưu…', true);
      await save('item', id, d);
      // đoạn văn / audio dùng chung: cập nhật luôn các câu cùng bộ
      for (const m of mates) { const md = {}; if (pass) md.passage = d.passage; if (aud && P !== 1) md.audio = d.audio; if (Object.keys(md).length) await save('item', m.id, Object.assign(JSON.parse(JSON.stringify(CT().find(m.id)?.data || {})), md)); }
      msg('Đã lưu.', true); X.toast('Đã lưu câu này');
    } catch (e) { msg(errText(e)); } finally { $('#f-save', main).disabled = false; }
  };
  const rv = $('#f-rev', main); if (rv) rv.onclick = async () => { if (!confirm('Bỏ mọi chỗ đã sửa của câu này, quay về bản gốc?')) return; try { await unsave('item', id); X.toast('Đã về bản gốc'); location.reload(); } catch (e) { msg(errText(e)); } };
  $('#f-hide', main).onclick = async () => { const cur = CT().find(id)?.data || {}; const d = Object.assign({}, cur, { _hidden: it._hidden ? 0 : 1 }); try { await save('item', id, d); X.toast(d._hidden ? 'Đã ẩn câu này khỏi đề' : 'Đã hiện lại'); X.render(); } catch (e) { msg(errText(e)); } };
}

/* ---------------- Ảnh Part 1 ---------------- */
function picTab(main, slug) {
  const E = window.IMGEX || {};
  if (slug) return picForm(main, decodeURIComponent(slug));
  const keys = Object.keys(E);
  main.innerHTML = `<div class="row" style="gap:10px"><input class="inp" id="pk-q" placeholder="Lọc theo từ hoặc câu tả…" style="max-width:360px"><span class="small muted">${keys.length} ảnh - dùng cho Lab "Nhìn tranh", Lộ trình Part 1 và đề Part 1</span></div><div class="sd-pics" id="pk-g"></div>`;
  const draw = q => { $('#pk-g', main).innerHTML = keys.filter(k => !q || (k + ' ' + (E[k].ex || '')).toLowerCase().includes(q)).map(k => `<a class="sd-pic ${E[k].bad ? 'off' : ''}" href="#/soan/anh/${encodeURIComponent(k)}"><img loading="lazy" src="${esc(E[k].img || 'img/p1/' + k + '.jpg')}" alt=""><b>${esc(k)}</b><span>${esc(E[k].ex || '')}</span>${edited(k) ? '<i class="pill gold">đã sửa</i>' : ''}</a>`).join(''); };
  draw(''); $('#pk-q', main).oninput = ev => draw(ev.target.value.trim().toLowerCase());
}
function picForm(main, slug) {
  const e = (window.IMGEX || {})[slug] || {}, img = e.img || 'img/p1/' + slug + '.jpg';
  main.innerHTML = `<a href="#/soan/anh" class="small">${icon('back')} Ảnh Part 1</a><h2 class="h2" style="margin:10px 0">${esc(slug)}</h2>
    <div class="grid g2 sd-form"><div class="card"><div class="sd-img"><img src="${esc(img)}" alt="" id="p-prev"></div><div class="field" style="margin-top:10px"><label>Đổi ảnh</label><input type="file" accept="image/*" id="p-file"><input type="hidden" id="p-img" value="${esc(e.img || '')}"></div></div>
    <div class="card">
      <div class="field"><label>Câu tả đúng (phải có từ “${esc(slug.replace(/-/g, ' '))}”)</label><input class="inp" id="p-ex" value="${esc(e.ex || '')}"></div>
      <div class="field"><label>Nghĩa tiếng Việt</label><input class="inp" id="p-vi" value="${esc(e.vi || '')}"></div>
      <div class="field"><label>Ghi chú thêm (không bắt buộc)</label><input class="inp" id="p-ctx" value="${esc(e.ctx || '')}"></div>
      <div class="field"><label>Câu nhiễu soạn tay - mỗi dòng 1 câu SAI với ảnh này, càng gần cảnh trong ảnh càng tốt (sai hành động, sai vị trí, bẫy “is being”…)</label><textarea class="inp" id="p-tr" style="min-height:110px" placeholder="A man is putting on a striped shirt.&#10;A striped shirt is hanging on a rack.&#10;A man is folding his arms behind his back.">${esc((e.traps || []).join('\n'))}</textarea></div>
      <label class="row small" style="gap:8px"><input type="checkbox" id="p-bad" ${e.bad ? 'checked' : ''}> Ẩn ảnh này (ảnh không rõ / không hợp)</label>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn pri" id="p-save">Lưu</button>${edited(slug) ? '<button class="btn" id="p-rev">Về bản gốc</button>' : ''}<span class="small" id="p-msg"></span></div>
    </div></div>`;
  const msg = (t, ok) => { const el = $('#p-msg', main); el.textContent = t; el.style.color = ok ? 'var(--sage)' : 'var(--red)'; };
  $('#p-file', main).onchange = async ev => { const f = ev.target.files[0]; if (!f) return; msg('Đang tải ảnh…', true); try { const url = await upload(f); $('#p-img', main).value = url; $('#p-prev', main).src = url; msg('Đã tải ảnh, bấm Lưu để áp dụng.', true); } catch (er) { msg(errText(er)); } };
  $('#p-save', main).onclick = async () => {
    const ex = $('#p-ex', main).value.trim(); if (!ex) return msg('Cần có câu tả đúng.');
    const d = { ex, vi: $('#p-vi', main).value.trim(), ctx: $('#p-ctx', main).value.trim(), traps: $('#p-tr', main).value.split('\n').map(x => x.trim()).filter(Boolean), bad: $('#p-bad', main).checked ? 'Ẩn bởi admin' : '' };
    const im = $('#p-img', main).value; if (im) d.img = im;
    try { await save('pic', slug, d); const w = X.VOCAB.find(v => X.imgSlug(v) === slug); if (w && X.imgForget) X.imgForget(w); msg('Đã lưu.', true); X.toast('Đã lưu ảnh này'); } catch (er) { msg(errText(er)); }
  };
  const rv = $('#p-rev', main); if (rv) rv.onclick = async () => { if (!confirm('Bỏ chỗ đã sửa của ảnh này?')) return; try { await unsave('pic', slug); location.reload(); } catch (er) { msg(errText(er)); } };
}

/* ---------------- Tìm câu ---------------- */
function searchTab(main) {
  main.innerHTML = `<input class="inp" id="sq" placeholder="Gõ vài chữ trong câu hỏi, đáp án hoặc mã câu…" style="max-width:520px"><div class="sd-list" id="sr" style="margin-top:12px"></div>`;
  const run = q => { if (q.length < 3) { $('#sr', main).innerHTML = '<div class="small muted">Gõ ít nhất 3 ký tự.</div>'; return; }
    const r = allItems().filter(i => (i.id + ' ' + (i.prompt || '') + ' ' + (i.options || []).join(' ')).toLowerCase().includes(q)).slice(0, 60);
    $('#sr', main).innerHTML = r.map(i => `<a class="sd-row" href="#/soan/cau/${encodeURIComponent(i.id)}"><span class="pill">Part ${i.part}</span><span class="grow">${esc(String(i.prompt || '').slice(0, 100))} <span class="faint small">${esc((i.options || []).slice(0, 2).join(' / ').slice(0, 60))}</span></span>${edited(i.id) ? '<span class="pill gold">đã sửa</span>' : ''}</a>`).join('') || '<div class="small muted">Không thấy câu nào.</div>'; };
  run(''); $('#sq', main).oninput = ev => run(ev.target.value.trim().toLowerCase());
}

// mở web: tải bản sửa mới nhất ở nền, có thay đổi thì vẽ lại trang đang xem
setTimeout(() => CT() && CT().refresh().then(ch => { if (ch && !X.hereKey().startsWith('/soan')) X.render(); }), 300);
})();
