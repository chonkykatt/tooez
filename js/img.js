/* TOOEZ — ảnh minh họa cho từ vựng Part 1.
   Ảnh đặt trong thư mục img/p1/, tên file = tên từ viết thường, khoảng trắng thành dấu gạch ngang.
   Ví dụ: "pedestrian" → img/p1/pedestrian.jpg - "try on" → img/p1/try-on.jpg
   Nhận .jpg .jpeg .png .webp. Không có ảnh thì web tự bỏ qua, không báo lỗi. */
(() => {
  const EXT = ['jpg', 'jpeg', 'png', 'webp'];
  const cache = {};   // id -> url | null | Promise
  X.imgSlug = w => String(w.w || w).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  X.imgFile = w => X.imgSlug(w) + '.jpg';
  X.hasImgSlot = w => !!w && (w.parts || []).includes(1) && !/^(det|pron|adv)/.test(w.pos || '');
  const tryLoad = src => new Promise(res => { const im = new Image(); im.onload = () => res(src); im.onerror = () => res(null); im.src = src; });
  // Câu mẫu viết theo đúng ảnh (data/imgex.js). Ảnh bị đánh dấu "bad" thì tạm ẩn, dùng câu mẫu chung.
  X.imgEx = w => { const e = (window.IMGEX || {})[X.imgSlug(w)]; return e && !e.bad ? e : null; };
  X.imgBad = w => { const e = (window.IMGEX || {})[X.imgSlug(w)]; return e && e.bad ? e.bad : null; };
  (X.VOCAB || []).forEach(w => { if (!X.hasImgSlot(w)) return; const e = X.imgEx(w); if (!e) return;
    w.exGeneric = w.ex; w.ex = [e.ex, ...(w.ex || []).filter(x => x !== e.ex)]; w.exVi = e.vi; w.exCtx = e.ctx || ''; });
  X.imgProbe = w => {
    if (!X.hasImgSlot(w) || X.imgBad(w)) return Promise.resolve(null);
    if (cache[w.id] !== undefined) return Promise.resolve(cache[w.id]);
    const own = ((window.IMGEX || {})[X.imgSlug(w)] || {}).img; if (own) return Promise.resolve(cache[w.id] = own);   // ảnh tải lên từ trang Soạn đề
    const base = 'img/p1/' + X.imgSlug(w) + '.';
    const p = EXT.reduce((acc, e) => acc.then(u => u || tryLoad(base + e)), Promise.resolve(null)).then(u => (cache[w.id] = u));
    cache[w.id] = p; return p;
  };
  X.imgNow = w => { const c = w && cache[w.id]; return typeof c === 'string' ? c : null; };   // sync, after probe
  X.imgPrefetch = words => Promise.all(words.map(X.imgProbe));
  // Ảnh có câu mẫu trong data/imgex.js thì chắc chắn có file: đánh dấu sẵn, không cần tải thử
  X.imgAssume = () => (X.VOCAB || []).forEach(w => { if (cache[w.id] === undefined && X.hasImgSlot(w) && X.imgEx(w)) cache[w.id] = X.imgEx(w).img || 'img/p1/' + X.imgSlug(w) + '.jpg'; });
  X.imgForget = w => { delete cache[w.id]; };
  // ảnh / câu tả vừa đổi trên trang Soạn đề (kể cả khi bản sửa tải về sau lúc mở web): cập nhật từ vựng và dựng lại câu Part 1 dạng tranh
  X.picSync = slugs => {
    (X.VOCAB || []).forEach(w => { if (!X.hasImgSlot(w) || !slugs.includes(X.imgSlug(w))) return; const e = X.imgEx(w); delete cache[w.id];
      const gen = w.exGeneric || w.ex || []; if (!w.exGeneric) w.exGeneric = gen;
      if (e) { w.ex = [e.ex, ...gen.filter(x => x !== e.ex)]; w.exVi = e.vi; w.exCtx = e.ctx || ''; } else { w.ex = gen.slice(); delete w.exVi; } });
    X.imgAssume();
    if (X.rebuildP1Pic) X.rebuildP1Pic();
  };
  // <div data-wimg="ID"></div> → ảnh nếu có
  X.imgFill = root => (root || document).querySelectorAll('[data-wimg]').forEach(el => {
    const w = X.wordById[el.dataset.wimg]; if (!w) return;
    X.imgProbe(w).then(u => { if (!u || !el.isConnected) return; el.innerHTML = `<img src="${u}" alt="${esc(w.w)}" loading="lazy">`; el.classList.add('on'); });
  });

  /* Trang kiểm tra ảnh: #/images */
  X.route(/^\/images$/, view => {
    const words = X.VOCAB.filter(X.hasImgSlot);
    const groups = {}; words.forEach(w => (groups[w.group] = groups[w.group] || []).push(w));
    view.innerHTML = `<div class="page"><a href="#/settings" class="small">${icon('back')} Hồ sơ</a>
      <div class="kicker" style="margin-top:14px">Dành cho coach</div><h1 class="h1">Ảnh minh họa từ vựng Part 1</h1>
      <p class="lead">Mỗi từ dưới đây cần một ảnh. Lưu ảnh vào thư mục <b class="mono">img/p1/</b> (nằm cạnh file index.html), đặt đúng tên ở cột “Tên file”. Tải lại trang là ảnh hiện ra.</p>
      <div class="card" style="margin:14px 0"><div class="row" style="gap:18px;flex-wrap:wrap"><div><b id="im-have" style="font-size:28px;font-family:var(--f-display)">…</b><span class="muted"> / ${words.length} từ đã có ảnh</span></div>
        <div class="seg" id="im-f"><button class="on" data-f="all">Tất cả</button><button data-f="miss">Còn thiếu</button><button data-f="star">Thiếu - ★ hay gặp</button><button data-f="bad">Nên thay</button></div>
        <span class="grow"></span><button class="btn sm" id="im-csv">${icon('dl')} Tải danh sách (CSV)</button></div>
        <div class="small muted" style="margin-top:10px;line-height:1.7">Ảnh ngang, đúng cảnh trong câu mẫu, rộng khoảng 800px, dưới 300KB. Nên lấy ở Pexels, Unsplash, Pixabay (miễn phí, được dùng cho học tập), hoặc tự tạo bằng AI theo câu mẫu. Đuôi .jpg, .png, .webp đều được.</div></div>
      <div id="im-list"></div></div>`;
    let f = 'all';
    const row = w => `<tr data-id="${w.id}"><td class="im-th"><div data-wimg="${w.id}" class="wimg sm"></div></td><td><b>${esc(w.w)}</b>${w.star ? ' <span class="pill gold">★</span>' : ''}<div class="small muted">${esc(w.vi)}</div></td>
      <td><code class="im-fn" title="Bấm để chép">${X.imgFile(w)}</code></td><td class="small">${X.imgBad(w) ? `<span class="pill ember">Nên thay ảnh</span> ${esc(X.imgBad(w))}<div class="faint">Thay ảnh xong, xóa dòng “${X.imgSlug(w)}” trong data/imgex.js.</div>` : w.ex[0] ? `<i>${esc(w.ex[0])}</i>` : '<span class="faint">—</span>'}</td>
      <td><a class="small" target="_blank" rel="noopener" href="https://www.pexels.com/search/${encodeURIComponent(w.w)}/">Tìm ảnh</a></td></tr>`;
    const draw = () => {
      $('#im-list', view).innerHTML = Object.entries(groups).map(([g, ws]) => {
        const ls = ws.filter(w => f === 'all' || (f === 'bad' ? !!X.imgBad(w) : !X.imgNow(w) && !X.imgBad(w) && (f === 'miss' || w.star))); if (!ls.length) return '';
        return `<h2 class="h2" style="margin:20px 0 8px">${esc(g)} <span class="small muted">${ws.filter(X.imgNow).length}/${ws.length}</span></h2><div class="card" style="padding:0;overflow-x:auto"><table class="dt im-t"><thead><tr><th></th><th>Từ</th><th>Tên file</th><th>Ảnh cần tìm (câu mẫu)</th><th></th></tr></thead><tbody>${ls.map(row).join('')}</tbody></table></div>`;
      }).join('') || '<div class="empty">Đủ ảnh rồi.</div>';
      X.imgFill(view);
      $$('.im-fn', view).forEach(c => c.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(c.textContent); X.toast('Đã chép ' + c.textContent); });
    };
    X.imgPrefetch(words).then(() => { const el = $('#im-have', view); if (el) el.textContent = words.filter(X.imgNow).length; draw(); });
    draw();
    $$('#im-f button', view).forEach(b => b.onclick = () => { $$('#im-f button', view).forEach(x => x.classList.toggle('on', x === b)); f = b.dataset.f; draw(); });
    $('#im-csv', view).onclick = () => {
      const q = s => '"' + String(s || '').replace(/"/g, '""') + '"';
      const lines = [['Nhóm', 'Từ', 'Nghĩa', 'Tên file', 'Ảnh cần tìm (câu mẫu)', 'Hay gặp', 'Đã có ảnh'].map(q).join(',')]
        .concat(words.map(w => [w.group, w.w, w.vi, X.imgFile(w), w.ex[0] || '', w.star ? '★' : '', X.imgNow(w) ? 'có' : ''].map(q).join(',')));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' })); a.download = 'anh-part1.csv'; a.click();
    };
  });
  if (X.buildP1Pic) X.buildP1Pic();
})();
