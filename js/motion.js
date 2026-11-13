/* TOOEZ · chuyển động giao diện (chỉ phần nhìn, không đụng logic học)
   - chuyển trang mượt khi đổi địa chỉ
   - thanh tiến độ và vòng tròn chạy từ 0 khi xuất hiện, số liệu đếm lên
   - tab có nền trượt theo lựa chọn
   - hộp thoại vào/ra mềm
   Dùng Web Animations API và CSS transition sẵn có của trình duyệt (cùng nền tảng mà thư viện Motion dùng), không cần tải thêm thư viện. */
(function () {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = document.getElementById('view');
  if (!view) return;
  const raf = f => requestAnimationFrame(() => requestAnimationFrame(f));

  /* ---------- tab trượt ---------- */
  const placeInd = seg => {
    const on = seg.querySelector(':scope > button.on');
    let ind = seg.querySelector(':scope > .seg-ind');
    if (!on) { if (ind) ind.style.opacity = '0'; return; }
    if (!on.offsetWidth) return;
    if (!ind) {
      ind = document.createElement('span'); ind.className = 'seg-ind'; ind.setAttribute('aria-hidden', 'true');
      seg.insertBefore(ind, seg.firstChild); seg.classList.add('has-ind'); ind.style.transition = 'none';
    }
    const w = on.offsetWidth, h = on.offsetHeight; if (!w) return;
    ind.style.opacity = '1'; ind.style.width = w + 'px'; ind.style.height = h + 'px';
    ind.style.transform = `translate(${on.offsetLeft}px,${on.offsetTop}px)`; ind.style.left = '0'; ind.style.top = '0';
    if (ind.style.transition === 'none') raf(() => { ind.style.transition = ''; });
  };
  const syncSegs = root => (root || document).querySelectorAll('.seg').forEach(seg => { if (seg.querySelectorAll(':scope > button').length > 1) placeInd(seg); });

  /* ---------- thanh tiến độ, vòng tròn, số đếm ---------- */
  const growBars = root => {
    if (reduce) return;
    root.querySelectorAll('.bar > i, .ng-bar i, .ng-prog-bar i').forEach(i => {
      if (i.dataset.grown) return; i.dataset.grown = '1';
      const w = i.style.width; if (!w || w === '0%' || w === '0px') return;
      i.style.transition = 'none'; i.style.width = '0'; void i.offsetWidth;
      i.style.transition = ''; raf(() => { i.style.width = w; });
    });
    root.querySelectorAll('.ring').forEach(r => {
      if (r.dataset.grown) return; r.dataset.grown = '1';
      const p = r.style.getPropertyValue('--p'); if (!p) return;
      r.style.transition = 'none'; r.style.setProperty('--p', '0'); void r.offsetWidth;
      r.style.transition = ''; raf(() => r.style.setProperty('--p', p));
    });
  };
  const countUp = root => {
    if (reduce) return;
    root.querySelectorAll('.stat .v, .big-score').forEach(el => {
      if (el.dataset.counted || el.children.length) return; el.dataset.counted = '1';
      const m = el.textContent.trim().match(/^(\d{1,6})(.*)$/); if (!m) return;
      const to = +m[1], suf = m[2]; if (to < 2) return;
      const t0 = performance.now(), dur = Math.min(900, 380 + to * 4);
      const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e) + suf; if (k < 1) requestAnimationFrame(step); };
      el.textContent = '0' + suf; requestAnimationFrame(step);
    });
  };

  /* ---------- chuyển trang ---------- */
  let lastHash = null, enterT = 0;
  const onRender = () => {
    const h = location.hash.replace(/\?.*$/, '');
    if (h !== lastHash) {
      lastHash = h;
      if (!reduce) { clearTimeout(enterT); view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter'); enterT = setTimeout(() => view.classList.remove('view-enter'), 700); }
    }
    growBars(view); countUp(view); syncSegs(view);
  };
  let pend = 0;
  const schedule = () => { if (pend) return; pend = requestAnimationFrame(() => { pend = 0; growBars(view); syncSegs(view); }); };
  new MutationObserver(muts => {
    if (muts.some(m => m.type === 'childList' && m.target === view)) onRender(); else schedule();
  }).observe(view, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', () => syncSegs(document));
  document.addEventListener('DOMContentLoaded', () => syncSegs(document));
  if (view.children.length) onRender();

  /* ---------- hộp thoại vào / ra ---------- */
  if (window.X && X.modal) {
    X.modal = (html, onMount) => {
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal">${html}</div>`;
      let gone = false;
      const close = () => { if (gone) return; gone = true; if (reduce) { bg.remove(); return; } bg.classList.add('out'); setTimeout(() => bg.remove(), 170); };
      bg.addEventListener('click', e => { if (e.target === bg) close(); });
      document.body.appendChild(bg); onMount && onMount(bg.firstChild, close); syncSegs(bg); return close;
    };
  }
})();
