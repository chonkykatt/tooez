/* Đếm lượt ghé (GoatCounter) + bé mèo nhỏ ở góc: "X bạn cùng chăm chỉ luyện TOEIC tuần này".
   Web dùng #/đường-dẫn nên tự gửi lượt xem mỗi lần đổi trang. Không đếm máy của admin và bản chạy thử trên máy. */
(function () {
  const GC = 'https://tooez.goatcounter.com';
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const local = !/^https?:$/.test(location.protocol) || /^(localhost|127\.|\[::1\]|.*\.local$)/.test(location.hostname);
  const admin = /admin/.test(location.search) || ls('tooez.admin');
  const path = () => '/' + ((location.hash.slice(1) || '/about').replace(/^\//, '').replace(/\/(?:[\w-]*\d[\w-]*)$/, '/:id'));
  if (!local && !admin) {
    window.goatcounter = { no_onload: true };
    const s = document.createElement('script');
    s.async = true; s.src = 'https://gc.zgo.at/count.js'; s.dataset.goatcounter = GC + '/count';
    s.onload = () => { try { window.goatcounter.count({ path: path() }); } catch (e) {} };
    document.head.appendChild(s);
    window.addEventListener('hashchange', () => { try { window.goatcounter.count && window.goatcounter.count({ path: path() }); } catch (e) {} });
  }

  /* ---- bé mèo ở góc ---- */
  const cat = `<svg viewBox="0 0 40 36" width="22" height="20" aria-hidden="true"><path d="M6 14 4 2l10 7M34 14l2-12-10 7" fill="#FFA640" stroke="#221A4D" stroke-width="2.4" stroke-linejoin="round"/><path d="M7 5.5 8 11l4-2.6M33 5.5 32 11l-4-2.6" fill="#FF9DB0"/><ellipse cx="20" cy="21" rx="15" ry="12.5" fill="#FFA640" stroke="#221A4D" stroke-width="2.4"/><ellipse cx="20" cy="26" rx="7" ry="4.6" fill="#FFF4E2"/><path d="M15 9.5v4M20 8.5v4.5M25 9.5v4" stroke="#E07A1F" stroke-width="2" stroke-linecap="round"/><g class="lv-eye"><circle cx="14" cy="20" r="2" fill="#221A4D"/><circle cx="26" cy="20" r="2" fill="#221A4D"/></g><path d="M18 25q2 2 4 0" fill="none" stroke="#221A4D" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="25" r="2.2" fill="#FFB8C6"/><circle cx="30" cy="25" r="2.2" fill="#FFB8C6"/></svg>`;
  let box = null, text = null;
  const fmt = n => Number(String(n).replace(/[^\d]/g, '')) || 0;
  const get = q => fetch(GC + '/counter/TOTAL.json' + q, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => j ? fmt(j.count) : 0).catch(() => 0);
  const load = async () => {
    if (local) return null;
    const w = await get('?start=week');
    if (w >= 10) return `<b>${w.toLocaleString('vi-VN')}</b> bạn cùng luyện TOEIC tuần này`;
    const t = await get('');
    if (t >= 30) return `<b>${t.toLocaleString('vi-VN')}</b> lượt ghé luyện cùng TOOEZ`;
    return null;
  };
  const MSG0 = 'Mèo luyện TOEIC cùng bạn nè';
  // Máy tính: nằm cuối thanh bên trái (không bao giờ che nội dung). Điện thoại: bé mèo + con số trên thanh tiêu đề, chạm để xem câu đầy đủ.
  const MOB = matchMedia('(max-width:980px)');
  let full = MSG0, num = '';
  const build = () => {
    box = document.createElement('div'); box.className = 'lv';
    box.innerHTML = `<button class="lv-cat" aria-label="Bé mèo TOOEZ">${cat}<i class="lv-dot"></i></button><span class="lv-t">${MSG0}</span><b class="lv-n"></b>`;
    text = box.querySelector('.lv-t');
    box.onclick = () => { if (MOB.matches) X.toast(full, 3000); else { box.classList.remove('hi'); void box.offsetWidth; box.classList.add('hi'); } };
    load().then(h => { if (h && text) { full = h; text.innerHTML = h; const m = h.match(/<b>([^<]+)<\/b>/); num = m ? m[1] : ''; box.querySelector('.lv-n').textContent = num; box.classList.toggle('has-n', !!num); } });
  };
  const place = () => {
    if (!box) build();
    if (MOB.matches) { const tb = document.querySelector('.topbar'); if (tb && box.parentNode !== tb) tb.insertBefore(box, tb.querySelector('.tb-by')); box.classList.add('lv-mob'); box.classList.remove('lv-side'); }
    else { toSide(); box.classList.add('lv-side'); box.classList.remove('lv-mob'); }
  };
  // ngay dưới logo: luôn nhìn thấy, không che nội dung
  const toSide = () => { const sd = document.getElementById('side'), br = sd && sd.querySelector('.brand'); if (!sd || !br) return; if (br.nextSibling !== box) sd.insertBefore(box, br.nextSibling); };
  const sync = () => { if (!document.body) return; place(); };
  // thanh bên được vẽ lại mỗi lần đổi trang → gắn lại bé mèo
  const watch = () => { const sd = document.getElementById('side'); if (sd) new MutationObserver(() => { if (!MOB.matches && box) toSide(); }).observe(sd, { childList: true }); };
  MOB.addEventListener ? MOB.addEventListener('change', sync) : MOB.addListener(sync);
  window.addEventListener('hashchange', sync);
  const start = () => { sync(); watch(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
