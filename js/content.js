/* TOOEZ - nội dung sửa trên web (trang Soạn đề, chỉ admin). Bản sửa lưu ở Supabase, bảng public.content_edits:
     kind 'item' : sửa một câu có sẵn (id = id câu) hoặc thêm câu mới vào đề (data._new = 1)
     kind 'pic'  : sửa ảnh Part 1 (id = tên ảnh): ảnh mới, câu tả, nghĩa, câu nhiễu soạn tay, ẩn ảnh
     kind 'exam' : đổi danh sách câu của một đề (thêm câu mới vào đề Part 1, 2, 5)
   Chạy 2 lần: ngay lúc mở web dùng bản đã lưu trong máy (để trang hiện đúng ngay), rồi tải bản mới nhất ở nền. */
'use strict';
(function () {
  const C = window.TOOEZ_CLOUD || {}, KEY = 'tooez.content';
  const ORIG = {};   // bản gốc của các trường đã bị sửa, để trang Soạn đề cho xem / khôi phục
  let rows = [];
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
  function apply(list) {
    list.forEach(r => { try { if (r.kind === 'item') applyItem(r.id, r.data); else if (r.kind === 'pic') applyPic(r.id, r.data); else if (r.kind === 'exam') applyExam(r.id, r.data); } catch (e) { console.warn('content', r.id, e); } });
  }
  apply(rows);
  window.TOOEZ_CONTENT = {
    rows: () => rows, orig: id => ORIG[id], apply,
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
