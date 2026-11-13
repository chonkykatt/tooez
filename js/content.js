/* TOOEZ - nội dung sửa trên web (trang Soạn đề, chỉ admin). Bản sửa lưu ở Supabase, bảng public.content_edits:
     kind 'item' : sửa một câu có sẵn (id = id câu) hoặc thêm câu mới vào đề (data._new = 1)
     kind 'pic'  : sửa ảnh Part 1 (id = tên ảnh): ảnh mới, câu tả, nghĩa, câu nhiễu soạn tay, ẩn ảnh
     kind 'exam' : đổi danh sách câu của một đề (thêm câu mới vào đề Part 1, 2, 5)
   Chạy 2 lần: ngay lúc mở web dùng bản đã lưu trong máy (để trang hiện đúng ngay), rồi tải bản mới nhất ở nền. */
'use strict';
(function () {
  const C = window.TOOEZ_CLOUD || {}, KEY = 'tooez.content';
  const ORIG = {};   // bản gốc của các trường đã bị sửa, để trang Soạn đề cho xem / khôi phục
  let rows = [], X_resolve = null;
  try { rows = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { rows = []; }
  const all = () => [...(window.BANK || []), ...(window.EXAM_EXTRA || [])];
  const byId = id => all().find(i => i.id === id);
  function applyItem(id, d) {
    if (d._new) {
      let it = byId(id);
      if (!it) { it = Object.assign({ id, src: 'admin' }, d); delete it._new; (window.EXAM_EXTRA || (window.EXAM_EXTRA = [])).push(it); if (window.X && X.itemById) X.itemById[id] = it; }
      else Object.assign(it, d);
      return;
    }
    const it = byId(id) || (window.X && X.itemById && X.itemById[id]); if (!it) return;
    const o = ORIG[id] || (ORIG[id] = {});
    Object.keys(d).forEach(k => { if (!(k in o)) o[k] = it[k] === undefined ? null : JSON.parse(JSON.stringify(it[k])); it[k] = d[k]; });
  }
  function applyPic(slug, d) {
    const E = window.IMGEX || (window.IMGEX = {});
    const o = ORIG['pic:' + slug] || (ORIG['pic:' + slug] = JSON.parse(JSON.stringify(E[slug] || {})));
    E[slug] = Object.assign({}, o, E[slug] || {}, d);
    if (d.ex === '') delete E[slug].ex;
  }
  function applyExam(id, d) {
    const e = (window.EXAMS || []).find(x => x.id === id); if (!e) return;
    const o = ORIG['exam:' + id] || (ORIG['exam:' + id] = JSON.parse(JSON.stringify(e)));
    Object.assign(e, d);
  }
  /* kind 'obj': sửa một mục bất kỳ trong dữ liệu (Lab, Lộ trình, thẻ học, từ vựng…). id = "TÊN|đường.dẫn"
     ví dụ "LABS|para-pairs.items.3", "VOCAB|#P1-0001" (#id = tìm phần tử có id đó trong mảng).
     kind 'add': thêm mục mới vào một mảng, id = "TÊN|đường.dẫn.tới.mảng", data = { list: [...] } */
  // đường dẫn luôn dùng số thứ tự GỐC trong mảng (trước khi ẩn mục nào), nên ẩn bớt mục không làm lệch các bản sửa khác
  const REM = new WeakMap();
  const toReal = (a, oi) => { const r = REM.get(a); if (!r) return oi; if (r.includes(oi)) return -1; return oi - r.filter(x => x < oi).length; };
  const toOrig = (a, ri) => { const r = (REM.get(a) || []).slice().sort((x, y) => x - y); let i = ri; for (const x of r) if (x <= i) i++; return i; };
  const seg = (o, k) => { if (o == null) return undefined; if (Array.isArray(o)) { if (k[0] === '#') return o.find(x => x && x.id === k.slice(1)); if (/^\d+$/.test(k)) { const i = toReal(o, +k); return i < 0 ? undefined : o[i]; } } return o[k]; };
  const resolve = path => { const [root, rest] = path.split('|'); let o = window[root], parent = null, key = null; for (const k of (rest ? rest.split('.') : [])) { parent = o; key = k; o = seg(o, k); if (o === undefined) return {}; } return { o, parent, key }; };
  X_resolve = resolve;
  function applyObj(id, d) {
    const { o, parent, key } = resolve(id); if (!o || typeof o !== 'object') return false;
    if (!ORIG['obj:' + id]) ORIG['obj:' + id] = JSON.parse(JSON.stringify(o));
    if (d._hidden) { if (Array.isArray(parent)) { const ri = parent.indexOf(o), oi = key[0] === '#' ? toOrig(parent, ri) : +key; parent.splice(ri, 1); REM.set(parent, [...(REM.get(parent) || []), oi]); } return true; }
    Object.keys(d).forEach(k => { if (d[k] === null) delete o[k]; else o[k] = d[k]; });
    return true;
  }
  function applyAdd(id, d) {
    const { o } = resolve(id); if (!Array.isArray(o)) return false;
    (d.list || []).forEach(x => { if (!o.some(y => y && y._adm && y._adm === x._adm)) o.push(JSON.parse(JSON.stringify(x))); });
    return true;
  }
  const DONE = new Set();   // mỗi bản sửa chỉ áp dụng 1 lần (dữ liệu nạp muộn thì lần sau mới áp được)
  // nội dung soạn trên web được phép có HTML định dạng (đậm, bảng…) nhưng không được có script / sự kiện / link javascript:
  const BAD_TAG = /<\s*\/?\s*(script|iframe|object|embed|link|meta|style|base|form|svg|math)\b[^>]*>/gi;
  const clean = v => typeof v === 'string' ? v.replace(BAD_TAG, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/(href|src)\s*=\s*(["']?)\s*(javascript|vbscript|data:text)/gi, '$1=$2#')
    : Array.isArray(v) ? v.map(clean) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) : v;
  const safeUrl = u => typeof u === 'string' && /^(https:\/\/|img\/|audio\/)/.test(u) ? u : '';
  function apply(list) {
    list = list.map(r => { const d = clean(r.data || {}); if (d && typeof d === 'object') { if ('img' in d) d.img = safeUrl(d.img); if ('u' in d) d.u = safeUrl(d.u); } return Object.assign({}, r, { data: d }); });
    const pics = [];
    const run = r => { const sig = r.kind + '|' + r.id + '|' + JSON.stringify(r.data); if (DONE.has(sig)) return; let ok = true;
      try { if (r.kind === 'aud') { (window.TOOEZ_AUD || (window.TOOEZ_AUD = {}))[r.id] = r.data.u; return DONE.add(sig); } if (r.kind === 'item') applyItem(r.id, r.data); else if (r.kind === 'pic') applyPic(r.id, r.data); else if (r.kind === 'exam') applyExam(r.id, r.data); else if (r.kind === 'add') ok = applyAdd(r.id, r.data); else if (r.kind === 'obj') ok = applyObj(r.id, r.data); } catch (e) { ok = false; console.warn('content', r.id, e); }
      if (ok) { DONE.add(sig); if (r.kind === 'pic') pics.push(r.id); } };
    const hide = r => r.kind === 'obj' && r.data && r.data._hidden;
    list.filter(r => !hide(r)).forEach(run);
    // ẩn mục: làm sau cùng, từ cuối mảng lên để không lệch chỗ
    list.filter(hide).sort((a, b) => (+(b.id.split('.').pop()) || 0) - (+(a.id.split('.').pop()) || 0)).forEach(run);
    if (pics.length && window.X && X.picSync && X.VOCAB) X.picSync(pics);   // dữ liệu đã dựng xong rồi mới tải được bản sửa ảnh → cập nhật lại
  }
  apply(rows);
  window.TOOEZ_CONTENT = {
    rows: () => rows, orig: id => ORIG[id], apply,
    reapply: test => rows.filter(r => r.kind === 'item' && test(r.id)).forEach(r => applyItem(r.id, r.data)), resolve: p => X_resolve(p), origIndex: (a, i) => toOrig(a, i),
    find: id => rows.find(r => r.id === id),
    // tải bản mới nhất (ai cũng đọc được), có thay đổi thì áp dụng và vẽ lại trang
    refresh: async () => {
      if (!C.url || !C.key) return false;
      try {
        const r = await fetch(C.url + '/rest/v1/content_edits?select=id,kind,data,updated_at&order=updated_at.asc', { headers: { apikey: C.key, Authorization: 'Bearer ' + C.key } });
        if (!r.ok) return false;
        const fresh = await r.json();
        const changed = JSON.stringify(fresh) !== JSON.stringify(rows);
        if (changed) {
          // câu bị bỏ sửa: trả về bản gốc
          const ids = new Set(fresh.map(x => x.kind + ':' + x.id));
          rows.filter(x => !ids.has(x.kind + ':' + x.id)).forEach(x => {
            if (x.kind === 'item') { const it = byId(x.id), o = ORIG[x.id]; if (it && o) Object.keys(o).forEach(k => { if (o[k] === null) delete it[k]; else it[k] = o[k]; }); delete ORIG[x.id]; }
            if (x.kind === 'pic' && ORIG['pic:' + x.id]) { window.IMGEX[x.id] = ORIG['pic:' + x.id]; delete ORIG['pic:' + x.id]; }
            if (x.kind === 'exam' && ORIG['exam:' + x.id]) { const e = window.EXAMS.find(z => z.id === x.id); if (e) Object.assign(e, ORIG['exam:' + x.id]); delete ORIG['exam:' + x.id]; }
          });
          rows = fresh; apply(rows);
          try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch (e) {}
        }
        return changed;
      } catch (e) { return false; }
    },
    set: list => { rows = list; try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch (e) {} },
  };
})();
