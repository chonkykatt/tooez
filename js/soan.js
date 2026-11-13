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
  if (kind !== 'aud') audCheck(true);   // vừa sửa xong: tự tạo audio cho câu mới / câu đã đổi chữ
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
    <div class="seg sec wrap" id="sd-tab">${[['de', 'Đề thi'], ['lo', 'Lộ trình'], ['lab', 'Lab phản xạ'], ['the', 'Thẻ học'], ['tu', 'Từ vựng'], ['anh', 'Ảnh Part 1'], ['khac', 'Khác'], ['tim', 'Tìm câu']].map(([k, n]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div id="sd-main" class="sec"></div></div>`;
  $$('#sd-tab button', view).forEach(b => b.onclick = () => X.go('#/soan/' + b.dataset.t));
  const main = $('#sd-main', view);
  audCheck(false);
  if (tab === 'de') return examTab(main, arg);
  if (tab === 'anh') return picTab(main, arg);
  if (tab === 'tim') return searchTab(main);
  if (tab === 'cau') return itemForm(main, decodeURIComponent(arg || ''));
  if (tab === 'lo') return pathTab(main, arg && decodeURIComponent(arg));
  if (tab === 'lab') return labTab(main, arg && decodeURIComponent(arg));
  if (tab === 'the') return deckTab(main, arg && decodeURIComponent(arg));
  if (tab === 'tu') return vocabTab(main, arg && decodeURIComponent(arg));
  if (tab === 'khac') return otherTab(main);
  if (tab === 'arr') return arrPage(main, decodeURIComponent(arg || ''));
  if (tab === 'obj') return objForm(main, decodeURIComponent(arg || ''));
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

/* ================= Sửa mọi dạng bài: form tự sinh theo dữ liệu ================= */
const enc = s => encodeURIComponent(s);
const R = p => CT().resolve(p);
const LBL = { q: 'Câu hỏi / đề', a: 'Đáp án', o: 'Các lựa chọn (mỗi dòng 1 lựa chọn)', opts: 'Các lựa chọn (mỗi dòng 1 lựa chọn)', options: 'Các lựa chọn (mỗi dòng 1 lựa chọn)', answer: 'Đáp án đúng (0 = A, 1 = B…)',
  why: 'Giải thích', explain: 'Giải thích', reveal: 'Giải thích sau khi trả lời', rule: 'Quy tắc', h: 'Tiêu đề thẻ', b: 'Nội dung', big: 'Dòng chữ to', t: 'Tiêu đề / nội dung', title: 'Tiêu đề', vi: 'Nghĩa tiếng Việt',
  w: 'Từ', ipa: 'Phiên âm', def: 'Định nghĩa tiếng Anh', ex: 'Câu ví dụ (mỗi dòng 1 câu)', goal: 'Mục tiêu', hook: 'Câu móc nhớ', prompt: 'Đề', en: 'Câu tiếng Anh', mark: 'Câu có đánh dấu (HTML)', tag: 'Nhãn', d: 'Hội thoại',
  same: 'Cùng nghĩa? (true/false)', lines: 'Các dòng (mỗi dòng 1 câu)', time: 'Thời gian (giây)', desc: 'Mô tả', pair: 'Cặp từ', distinction: 'Phân biệt', example: 'Ví dụ', type: 'Loại', say: 'Tooez nói', ok: 'Khi làm đúng', no: 'Khi làm sai', fast: 'Mẹo nhanh', limit: 'Khi nào không đúng', try: 'Thử ngay', g: 'Nhóm / bảng', rows: 'Các dòng bảng', html: 'Nội dung (HTML)', name: 'Tên' };
const titleOf = o => { if (o == null) return ''; if (typeof o !== 'object') return String(o); for (const k of ['q', 'prompt', 'w', 'h', 't', 'title', 'en', 'pair', 'a', 'name', 'id']) if (typeof o[k] === 'string' && o[k]) return o[k].replace(/<[^>]+>/g, '').slice(0, 110); if (o.q && typeof o.q === 'object') return titleOf(o.q); return JSON.stringify(o).slice(0, 100); };
const isLines = v => Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object' && !Array.isArray(x) && 's' in x && 't' in x && Object.keys(x).length <= 3);
const isStrArr = v => Array.isArray(v) && v.every(x => typeof x === 'string');
// vẽ các ô nhập theo kiểu dữ liệu; object lồng nhau (vd. câu hỏi kiểm tra trong thẻ) được mở ra thành ô con
function fieldsHtml(o, pre = '', depth = 0) {
  return Object.keys(o).filter(k => typeof o[k] !== 'function' && k[0] !== '_' && !(k === 'id' && !pre) && !(!pre && ['cards', 'topics', 'items', 'extra', 'units', 'skills', 'voc', 'lib', 'core'].includes(k) && typeof o[k] === 'object')).map(k => {
    const v = o[k], key = pre + k, lab = `${LBL[k] || k}${pre ? ` <span class="faint">(${esc(pre.slice(0, -1))})</span>` : ''}`;
    if (typeof v === 'string') return `<div class="field"><label>${lab}</label>${v.length > 70 || /[<\n]/.test(v) ? `<textarea class="inp" data-f="${key}" data-t="s" style="min-height:${v.length > 300 ? 180 : 90}px">${esc(v)}</textarea>` : `<input class="inp" data-f="${key}" data-t="s" value="${esc(v)}">`}</div>`;
    if (typeof v === 'number') return `<div class="field"><label>${(k === 'a' || k === 'answer') && Array.isArray(o.o || o.opts || o.options) ? 'Đáp án đúng: số thứ tự lựa chọn (0 = dòng đầu tiên, 1 = dòng thứ hai…)' : lab}</label><input class="inp" type="number" data-f="${key}" data-t="n" value="${v}" style="max-width:160px"></div>`;
    if (typeof v === 'boolean') return `<label class="row small field" style="gap:8px"><input type="checkbox" data-f="${key}" data-t="b" ${v ? 'checked' : ''}> ${lab}</label>`;
    if (isLines(v)) return `<div class="field"><label>${lab} - mỗi dòng "W: câu"</label><textarea class="inp mono" data-f="${key}" data-t="l" style="min-height:120px">${esc(toLines(v))}</textarea></div>`;
    if (isStrArr(v)) return `<div class="field"><label>${lab}${LBL[k] && /mỗi dòng/.test(LBL[k]) ? '' : ' <span class="faint">- mỗi dòng 1 mục</span>'}</label><textarea class="inp" data-f="${key}" data-t="a" style="min-height:${Math.min(220, 40 + v.length * 26)}px">${esc(v.join('\n'))}</textarea></div>`;
    if (v && typeof v === 'object' && !Array.isArray(v) && depth < 2) return `<div class="sd-sub">${fieldsHtml(v, key + '.', depth + 1)}</div>`;
    return `<div class="field"><label>${lab} <span class="faint">- dạng JSON, giữ đúng dấu ngoặc và dấu phẩy</span></label><textarea class="inp mono" data-f="${key}" data-t="j" style="min-height:120px">${esc(JSON.stringify(v, null, 1))}</textarea></div>`;
  }).join('');
}
function readFields(root, base) {
  const out = {};   // chỉ lưu các trường có trên form (mảng con như cards / items sửa ở trang riêng)
  for (const el of $$('[data-f]', root)) {
    const path = el.dataset.f.split('.'), t = el.dataset.t; let v;
    if (t === 's') v = el.value; else if (t === 'n') v = +el.value; else if (t === 'b') v = el.checked;
    else if (t === 'l') v = fromLines(el.value); else if (t === 'a') v = el.value.split('\n').map(x => x.trim()).filter(Boolean);
    else { try { v = JSON.parse(el.value); } catch (e) { throw new Error(`Ô "${el.dataset.f}" sai định dạng JSON`); } }
    if (path.length > 1 && !out[path[0]]) out[path[0]] = JSON.parse(JSON.stringify(base[path[0]]));
    let o = out; path.slice(0, -1).forEach(k => { o = o[k]; }); o[path[path.length - 1]] = v;
  }
  delete out.id; return out;
}
// form sửa một mục bất kỳ: path = "TÊN|đường.dẫn"
function objForm(main, path, back) {
  const { o } = R(path);
  if (!o || typeof o !== 'object') { main.innerHTML = '<p class="muted">Không tìm thấy mục này (có thể đã bị ẩn).</p>'; return; }
  const up = back || (/\.\d+$|\.#[^.]+$/.test(path) ? '#/soan/arr/' + enc(path.replace(/\.(\d+|#[^.]+)$/, '')) : null);
  const ed = CT().rows().find(r => r.kind === 'obj' && r.id === path);
  main.innerHTML = `${up ? `<a href="${up}" class="small">${icon('back')} Danh sách</a>` : ''}
    <div class="row" style="margin:10px 0;gap:8px;flex-wrap:wrap"><span class="pill mono">${esc(path)}</span>${ed ? '<span class="pill gold">đã sửa</span>' : ''}</div>
    <div class="card sd-form" style="max-width:860px">${fieldsHtml(o)}
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn pri" id="o-save">Lưu</button>${ed ? '<button class="btn" id="o-rev">Về bản gốc</button>' : ''}${/\.(\d+|#[^.]+)$/.test(path) ? '<button class="btn ghost" id="o-hide">Ẩn mục này</button>' : ''}<span class="small" id="o-msg"></span></div></div>`;
  const msg = (t, ok) => { const el = $('#o-msg', main); el.textContent = t; el.style.color = ok ? 'var(--sage)' : 'var(--red)'; };
  $('#o-save', main).onclick = async () => {
    let d; try { d = readFields(main, o); } catch (e) { return msg(e.message); }
    try { msg('Đang lưu…', true); await save('obj', path, d); msg('Đã lưu.', true); X.toast('Đã lưu'); } catch (e) { msg(errText(e)); }
  };
  const rv = $('#o-rev', main); if (rv) rv.onclick = async () => { if (!confirm('Bỏ chỗ đã sửa, quay về bản gốc?')) return; try { await unsave('obj', path); location.reload(); } catch (e) { msg(errText(e)); } };
  const hd = $('#o-hide', main); if (hd) hd.onclick = async () => { if (!confirm('Ẩn mục này khỏi bài luyện? (Hiện lại được ở mục "Đã ẩn" của danh sách)')) return; try { await save('obj', path, { _hidden: 1 }); X.toast('Đã ẩn'); location.hash = up || '#/soan'; } catch (e) { msg(errText(e)); } };
}
// danh sách các mục trong một mảng + thêm mục mới + mục đã ẩn
function arrPage(main, path, head, back) {
  const { o } = R(path);
  if (!Array.isArray(o)) { main.innerHTML = '<p class="muted">Không tìm thấy danh sách này.</p>'; return; }
  const key = (x, i) => x && x.id ? '#' + x.id : String(CT().origIndex(o, i));
  const hidden = CT().rows().filter(r => r.kind === 'obj' && r.data && r.data._hidden && r.id.replace(/\.(\d+|#[^.]+)$/, '') === path);
  main.innerHTML = `${back ? `<a href="${back}" class="small">${icon('back')} Quay lại</a>` : ''}${head || ''}
    <div class="row" style="gap:10px;margin:10px 0"><span class="small muted">${o.length} mục</span><span class="grow"></span>${o.length && typeof o[0] === 'object' ? `<button class="btn pri sm" id="a-add">${icon('plus')} Thêm mục</button>` : ''}</div>
    <div class="sd-list">${o.map((x, i) => `<a class="sd-row" href="#/soan/obj/${enc(path + '.' + key(x, i))}"><b class="mono">${i + 1}</b><span class="grow">${esc(titleOf(x))}</span>${CT().rows().some(r => r.id === path + '.' + key(x, i)) ? '<span class="pill gold">đã sửa</span>' : ''}${x && x._adm ? '<span class="pill syn">mới</span>' : ''}</a>`).join('')}</div>
    ${hidden.length ? `<div class="sec"><div class="h3" style="margin-bottom:6px">Đã ẩn</div>${hidden.map(r => `<div class="sd-row off"><span class="grow">${esc(titleOf(CT().orig('obj:' + r.id) || r.id))}</span><button class="btn sm" data-un="${esc(r.id)}">Hiện lại</button></div>`).join('')}</div>` : ''}`;
  $$('[data-un]', main).forEach(b => b.onclick = async () => { try { await unsave('obj', b.dataset.un); location.reload(); } catch (e) { X.toast(esc(errText(e))); } });
  const add = $('#a-add', main); if (add) add.onclick = async () => {
    const blank = v => typeof v === 'string' ? '' : typeof v === 'number' ? 0 : typeof v === 'boolean' ? false : Array.isArray(v) ? (isStrArr(v) ? v.map(() => '') : isLines(v) ? [{ s: 'W', t: '' }] : JSON.parse(JSON.stringify(v))) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) : v;
    const tpl = blank(JSON.parse(JSON.stringify(o[o.length - 1], (k, v) => typeof v === 'function' ? undefined : v)));
    if (o[0] && o[0].id) tpl.id = 'adm' + Date.now().toString(36);
    tpl._adm = 'a' + Date.now().toString(36);
    const prev = CT().rows().find(r => r.kind === 'add' && r.id === path);
    try { await save('add', path, { list: [...((prev && prev.data.list) || []), tpl] }); const i = o.findIndex(x => x && x._adm === tpl._adm); X.go('#/soan/obj/' + enc(path + '.' + key(o[i], i))); } catch (e) { X.toast(esc(errText(e)), 4000); }
  };
}
const card = (href, t, sub) => `<a class="sd-row" href="${href}"><span class="grow"><b>${esc(t)}</b>${sub ? ` <span class="small muted">${esc(sub)}</span>` : ''}</span>${icon('arrow')}</a>`;
function pathTab(main, arg) {
  const P = window.PATH;
  if (!arg) { main.innerHTML = `<p class="small muted">Chọn Part → bài → sửa thẻ kiến thức, câu kiểm tra trong thẻ, hoặc câu luyện / kiểm tra cuối bài.</p><div class="sd-list">${Object.entries(P).map(([k, p]) => card('#/soan/lo/' + k, p.title, `${p.units.length} bài`)).join('')}</div>`; return; }
  const [pk, uid] = arg.split('~'), part = P[pk];
  if (!uid) { main.innerHTML = `<a href="#/soan/lo" class="small">${icon('back')} Lộ trình</a><h2 class="h2" style="margin:8px 0">${esc(part.title)}</h2><div class="sd-list">${part.units.map((u, i) => card(`#/soan/lo/${pk}~${u.id}`, `${i + 1}. ${u.t}`, u.vi)).join('')}</div>`; return; }
  const u = part.units.find(x => x.id === uid); if (!u) { main.innerHTML = '<p class="muted">Không thấy bài này.</p>'; return; }
  const drill = X.unitDrillOf && u.drill ? X.unitDrillOf(u) : [];
  main.innerHTML = `<a href="#/soan/lo/${pk}" class="small">${icon('back')} ${esc(part.title)}</a><h2 class="h2" style="margin:8px 0">${esc(u.t)}</h2>
    <div class="sd-list">${card('#/soan/obj/' + enc(`PATH|${pk}.units.#${uid}`), 'Tên bài, mục tiêu', 'tiêu đề, nghĩa, “Sau bài này bạn sẽ…”')}
    ${u.cards ? card('#/soan/arr/' + enc(`PATH|${pk}.units.#${uid}.cards`), 'Thẻ kiến thức + câu hỏi trong thẻ', `${u.cards.length} thẻ`) : ''}
    ${u.deck ? card('#/soan/the/' + enc((pk === 'p1' ? 'P1LIB' : 'LIBDECK|' + pk) + '~' + u.deck), 'Thẻ học của bài (Thư viện)', u.deck) : ''}</div>
    <div class="sec"><div class="h3">Câu luyện tập và kiểm tra của bài (${drill.length} câu trong kho)</div><div class="small muted" style="margin:4px 0 8px">Trạm Luyện và Kiểm tra bốc ngẫu nhiên từ các câu này.</div>
    <div class="sd-list">${drill.slice(0, 300).map(it => `<a class="sd-row ${it._hidden ? 'off' : ''}" href="#/soan/cau/${enc(it.id)}"><span class="pill">Part ${it.part}</span><span class="grow">${esc(String(it.prompt || '').slice(0, 110))}</span>${edited(it.id) ? '<span class="pill gold">đã sửa</span>' : ''}</a>`).join('')}</div></div>`;
}
function labTab(main, id) {
  if (!id) { main.innerHTML = `<p class="small muted">Mọi bài trong Lab phản xạ. Bấm vào bài để sửa từng câu.</p><div class="sd-list">${Object.entries(X.LABS).map(([k, l]) => card('#/soan/lab/' + enc(k), l.title, `${l.part ? 'Part ' + l.part + ' - ' : ''}${l.kind === 'bank' ? 'câu trong kho' : l.kind === 'pic' ? 'ảnh Part 1' : (l.items || []).length + (l.extra || []).length + ' mục'}`)).join('')}</div>`; return; }
  const L = X.LABS[id];
  if (L.kind === 'pic') { main.innerHTML = `<a href="#/soan/lab" class="small">${icon('back')} Lab phản xạ</a><h2 class="h2" style="margin:8px 0">${esc(L.title)}</h2><p>Bài này tự tạo câu từ ảnh Part 1. Sửa ảnh, câu tả đúng và câu nhiễu ở <a href="#/soan/anh"><b>Ảnh Part 1</b></a>.</p>`; return; }
  if (L.kind === 'bank') { const its = X.BANK.filter(i => Object.entries(L.filter || {}).every(([k, v]) => i[k] === v)).concat((window.BANK || []).filter(i => i._hidden && Object.entries(L.filter || {}).every(([k, v]) => i[k] === v)));
    main.innerHTML = `<a href="#/soan/lab" class="small">${icon('back')} Lab phản xạ</a><h2 class="h2" style="margin:8px 0">${esc(L.title)}</h2><div class="sd-list">${its.map(it => `<a class="sd-row ${it._hidden ? 'off' : ''}" href="#/soan/cau/${enc(it.id)}"><span class="grow">${esc(String(it.prompt || '').slice(0, 110))} <span class="faint small">${esc((it.options || [])[it.answer] || '')}</span></span>${it._hidden ? '<span class="pill red">đã ẩn</span>' : edited(it.id) ? '<span class="pill gold">đã sửa</span>' : ''}</a>`).join('')}</div>`; return; }
  const head = `<h2 class="h2" style="margin:8px 0">${esc(L.title)}</h2><div class="sd-list" style="margin-bottom:8px">${card('#/soan/obj/' + enc('LABS|' + id), 'Tên bài, mô tả', L.desc || '')}${L.extra ? card('#/soan/arr/' + enc(`LABS|${id}.extra`), 'Mục thêm (extra)', L.extra.length + ' mục') : ''}</div><div class="h3">Các câu</div>`;
  arrPage(main, `LABS|${id}.items`, head, '#/soan/lab');
}
function deckTab(main, arg) {
  if (!arg) { const L = window.LIBDECK || {};
    main.innerHTML = `<p class="small muted">Thẻ học trong Thư viện (trạm Học của Lộ trình dùng chung các thẻ này).</p><div class="sd-list">${card('#/soan/the/P1LIB', 'Part 1', (window.P1LIB.topics || []).length + ' chủ đề')}${Object.keys(L).map(k => card('#/soan/the/' + enc('LIBDECK|' + k), 'Part ' + k.slice(1).replace('34', '3-4'), L[k].topics.length + ' chủ đề')).join('')}</div>`; return; }
  const [root, tid] = arg.split('~'), D = R(root).o;
  if (!tid) { main.innerHTML = `<a href="#/soan/the" class="small">${icon('back')} Thẻ học</a><div class="sd-list" style="margin-top:10px">${D.core ? card('#/soan/obj/' + enc(root + (root.includes('|') ? '.' : '|') + 'core'), 'Bài mở đầu (cách nghĩ + quy trình)', '') : ''}${D.topics.map(t => card('#/soan/the/' + enc(root + '~' + t.id), t.t, (t.cards || []).length + ' thẻ')).join('')}</div>`; return; }
  const base = root + (root.includes('|') ? '.' : '|') + 'topics.#' + tid;
  arrPage(main, base + '.cards', `<div class="sd-list" style="margin:8px 0">${card('#/soan/obj/' + enc(base), 'Tên chủ đề, câu móc nhớ', '')}</div><div class="h3">Các thẻ</div>`, '#/soan/the/' + enc(root));
}
function vocabTab(main, id) {
  if (id) { const w = X.wordById[id]; objForm(main, 'VOCAB|#' + id, '#/soan/tu');
    const cz = (window.CLOZE || {})[id];
    if (Array.isArray(cz)) { main.insertAdjacentHTML('beforeend', `<div class="card sec" style="max-width:860px"><div class="field"><label>Phương án nhiễu cho dạng "Điền vào câu" (mỗi dòng 1 từ)</label><textarea class="inp" id="cz">${esc(cz.join('\n'))}</textarea></div><button class="btn" id="cz-save">Lưu phương án nhiễu</button></div>`);
      $('#cz-save', main).onclick = async () => { try { await save('obj', 'CLOZE', Object.assign({}, (CT().rows().find(r => r.kind === 'obj' && r.id === 'CLOZE') || {}).data || {}, { [id]: $('#cz', main).value.split('\n').map(x => x.trim()).filter(Boolean) })); X.toast('Đã lưu'); } catch (e) { X.toast(esc(errText(e))); } }; }
    return; }
  main.innerHTML = `<input class="inp" id="vq" placeholder="Gõ từ tiếng Anh hoặc nghĩa…" style="max-width:420px"><div class="sd-list" id="vr" style="margin-top:12px"></div>`;
  const run = q => { const r = q.length < 2 ? [] : X.VOCAB.filter(w => (w.w + ' ' + (w.vi || '')).toLowerCase().includes(q)).slice(0, 80);
    $('#vr', main).innerHTML = q.length < 2 ? `<div class="small muted">${X.VOCAB.length} từ trong kho. Gõ ít nhất 2 ký tự.</div>` : r.map(w => `<a class="sd-row" href="#/soan/tu/${enc(w.id)}"><b>${esc(w.w)}</b><span class="grow small muted">${esc(w.vi || '')}</span>${edited('VOCAB|#' + w.id) ? '<span class="pill gold">đã sửa</span>' : ''}</a>`).join('') || '<div class="small muted">Không thấy từ nào.</div>'; };
  run(''); $('#vq', main).oninput = ev => run(ev.target.value.trim().toLowerCase());
}
function otherTab(main) {
  main.innerHTML = `<div class="sd-list">${card('#/soan/arr/' + enc('CONF'), 'Cặp từ dễ nhầm', (window.CONF || []).length + ' cặp')}
    ${(window.AHA || []).map((g, i) => card('#/soan/arr/' + enc(`AHA|${i}.items`), 'Aha! - ' + g.g, (g.items || []).length + ' thẻ')).join('')}
    ${(window.NGOP_SETS || []).map((s, i) => card('#/soan/obj/' + enc(`NGOP_SETS|${i}`), 'Bị ngộp Part 7 - ' + s.title, 'đoạn văn, câu hỏi')).join('')}
    ${card('#/soan/arr/' + enc('RICH_LIST'), 'Từ học sâu 13 bước', 'xem trong Từ vựng')}</div>`;
  main.querySelector('[href$="RICH_LIST"]').remove();
}

/* ================= Tự tạo audio cho chỗ vừa sửa (giọng Kokoro giống audio có sẵn, chạy ngay trong trình duyệt) =================
   Lần đầu tải mô hình giọng đọc khoảng 90 MB (trình duyệt nhớ lại cho các lần sau). Mỗi câu thành 1 file mp3 nhỏ,
   tải lên kho "content" của Supabase, học sinh nghe được ngay ở lần mở web tiếp theo. */
const VO = { M2: 'bm_daniel', SM: 'bm_lewis', W: 'af_heart', M: 'am_michael', Q: 'af_sarah', A: 'bm_george', S: 'bf_emma', K: 'bf_isabella', N: 'am_fenrir' };
const cleanTxt = t => String(t).replace(/\$(\d(?:[\d,]*\d)?)(?:\.(\d+))?(\s(?:million|billion|thousand))?/g, (m, d, c, sc) => `${d.replace(/,/g, '')}${sc || ''} dollars${c && +c ? ' and ' + (+c) + ' cents' : ''}`)
  .replace(/(?<=[a-z])\s*\/\s*(?=[a-z])/g, ' or ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const splitL = t => { const m = X.TTS.norm(t).match(/^\(?([A-D])[).]\s+(.+)$/); return m ? [m[1] + '.', m[2]] : [X.TTS.norm(t)]; };
// gom mọi câu cần đọc trên web, trả về những câu chưa có file
async function scanMissing() {
  const T = X.TTS, o = new Map();
  const add = (s, t) => { if (!t || !/[A-Za-z]/.test(t)) return; splitL(t).forEach(x => { if (!T.fileFor(s, x)) o.set(s + '|' + x, { role: s, text: x, key: T.key(s, x) }); }); };
  allItems().forEach(i => (i.audio || []).forEach(a => add(a.s, a.t)));
  X.EXAMS.filter(e => e.part <= 4).forEach(e => { const its = X.examItems(e);
    if (e.part >= 3) { let k = 0; while (k < its.length) { const set = its[k].set; let j = k; while (j + 1 < its.length && its[j + 1].set === set) j++; add('N', `Questions ${e.start + k} through ${e.start + j} refer to the following ${e.part === 3 ? 'conversation' : 'talk'}.`); k = j + 1; }
      its.forEach((it, k) => add('N', `Number ${e.start + k}. ${it.prompt}`)); } else its.forEach((it, k) => add('N', `Number ${e.start + k}.`)); });
  // ảnh Part 1: câu đọc được sinh ngẫu nhiên từ câu tả + câu nhiễu → chỉ quét khi đã sửa ảnh (mất vài giây)
  if (CT().rows().some(r => r.kind === 'pic')) for (const l of Object.values(X.LABS).filter(l => l.kind === 'pic')) for (let i = 0; i < 12; i++) {
    try { (X.picRounds(l) || []).forEach(r => (r.audio || []).forEach(a => add(a.s, a.t))); } catch (e) {}
    await new Promise(r => setTimeout(r, 0)); }
  return [...o.values()];
}
let KOK = null;
async function kokoro(prog) {
  if (KOK) return KOK;
  const m = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js');
  KOK = await m.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'wasm', progress_callback: p => { if (p && p.status === 'progress' && /onnx/.test(p.file || '')) prog(`Đang tải giọng đọc ${Math.round(p.progress || 0)}% (chỉ lần đầu)`); } });
  return KOK;
}
const lame = () => window.lamejs ? Promise.resolve(window.lamejs) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/vendor/lame-1.2.1.min.js'; s.onload = () => res(window.lamejs); s.onerror = rej; document.head.appendChild(s); });
async function toMp3(f32, sr) {
  const L = await lame(); let a = 0, b = f32.length - 1; while (a < b && Math.abs(f32[a]) < 0.004) a++; while (b > a && Math.abs(f32[b]) < 0.004) b--;
  const pad = n => new Float32Array(Math.round(sr * n)), body = f32.subarray(Math.max(0, a - sr * 0.02), Math.min(f32.length, b + sr * 0.04));
  const all = new Float32Array(pad(.08).length + body.length + pad(.12).length); all.set(body, pad(.08).length);
  const i16 = new Int16Array(all.length); for (let i = 0; i < all.length; i++) i16[i] = Math.max(-1, Math.min(1, all[i])) * 32767;
  const enc = new L.Mp3Encoder(1, sr, 48), out = [];
  for (let i = 0; i < i16.length; i += 1152) { const buf = enc.encodeBuffer(i16.subarray(i, i + 1152)); if (buf.length) out.push(new Uint8Array(buf)); }
  const fl = enc.flush(); if (fl.length) out.push(new Uint8Array(fl));
  return new Blob(out, { type: 'audio/mpeg' });
}
let audBusy = false;
async function makeAudio(list, bar) {
  if (audBusy || !list.length) return; audBusy = true;
  const say = t => { bar.innerHTML = t; };
  try {
    const tts = await kokoro(say);
    let done = 0, rowsBuf = [];
    const flush = async () => { if (!rowsBuf.length) return; const { error } = await sb().from('content_edits').upsert(rowsBuf); if (error) throw error; CT().set([...CT().rows().filter(r => !(r.kind === 'aud' && rowsBuf.some(x => x.id === r.id))), ...rowsBuf]); CT().apply(rowsBuf); rowsBuf = []; };
    for (const it of list) {
      say(`🔊 Đang tạo audio ${done + 1}/${list.length}: <span class="faint">${esc(it.text.slice(0, 60))}</span>`);
      const r = await tts.generate(cleanTxt(it.text), { voice: VO[it.role] || 'af_heart', speed: 0.95 });
      const blob = await toMp3(r.audio, r.sampling_rate);
      const path = `aud/${it.key}.mp3`;
      const up = await sb().storage.from('content').upload(path, blob, { contentType: 'audio/mpeg', upsert: true }); if (up.error) throw up.error;
      rowsBuf.push({ id: it.key, kind: 'aud', data: { u: sb().storage.from('content').getPublicUrl(path).data.publicUrl }, updated_at: new Date().toISOString() });
      done++; if (rowsBuf.length >= 10) await flush();
    }
    await flush(); say(`✅ Đã tạo xong audio cho ${done} câu. Học sinh nghe được từ lần mở web tiếp theo.`);
    if (++audRounds < 4) setTimeout(async () => { if ((await scanMissing()).length) audCheck(true); }, 500);   // trong lúc tạo lại có chỗ mới sửa
  } catch (e) { console.warn(e); say(`<span style="color:var(--red)">Chưa tạo được audio: ${esc(errText(e))}. Thử lại bằng nút “Tạo audio còn thiếu”, hoặc dùng trình duyệt Chrome / Edge trên máy tính.</span>`); }
  finally { audBusy = false; }
}
// thanh trạng thái audio ở đầu trang Soạn đề
function audBar() { let b = document.getElementById('sd-aud'); if (!b) { const m = document.getElementById('sd-main'); if (!m) return null; m.insertAdjacentHTML('beforebegin', '<div class="card tint small sd-aud" id="sd-aud"></div>'); b = document.getElementById('sd-aud'); } return b; }
let audT = 0, audRounds = 0;
function audCheck(auto) {
  clearTimeout(audT); audT = setTimeout(async () => { const b = audBar(); if (!b || audBusy) return; b.innerHTML = '🔊 Đang kiểm tra audio…'; const miss = await scanMissing(); if (audBusy) return;
    if (!miss.length) { b.innerHTML = '🔊 Mọi câu đều đã có audio.'; return; }
    b.innerHTML = `🔊 Có <b>${miss.length}</b> câu chưa có audio (đang tạm đọc bằng giọng trình duyệt). <button class="btn sm pri" id="sd-mk">Tạo audio còn thiếu</button>`;
    $('#sd-mk', b).onclick = () => makeAudio(miss, b);
    if (auto) makeAudio(miss, b); }, 300);
}

window.__scanAudio = () => scanMissing();   // để kiểm tra
// dữ liệu nạp muộn (Lộ trình dựng lại, Bị ngộp…): áp dụng nốt các bản sửa chưa áp được lúc đầu
CT() && CT().apply(CT().rows());
// mở web: tải bản sửa mới nhất ở nền, có thay đổi thì vẽ lại trang đang xem
setTimeout(() => CT() && CT().refresh().then(ch => { if (ch && !X.hereKey().startsWith('/soan')) X.render(); }), 300);
})();
