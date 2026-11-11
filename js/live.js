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
  const SHOW = /^\/(about|today|path(\/\w+)?|library(\/\w+)?|tests|skills|progress|errors(\/\w+)?|vocab|lab|settings)$/;
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
  const build = () => {
    box = document.createElement('div'); box.className = 'lv' + (ls('tooez.livemin') ? ' min' : '');
    box.innerHTML = `<button class="lv-cat" aria-label="Bé mèo TOOEZ">${cat}<i class="lv-dot"></i></button><span class="lv-t">${MSG0}</span><button class="lv-x" aria-label="Thu nhỏ">×</button>`;
    text = box.querySelector('.lv-t');
    box.querySelector('.lv-x').onclick = () => { box.classList.add('min'); ls('tooez.livemin', '1'); };
    box.querySelector('.lv-cat').onclick = () => { const m = box.classList.toggle('min'); ls('tooez.livemin', m ? '1' : ''); if (!m) { box.classList.remove('hi'); void box.offsetWidth; box.classList.add('hi'); } };
    document.body.appendChild(box);
    if (!box.classList.contains('min') && matchMedia('(max-width:980px)').matches) setTimeout(() => box && box.classList.add('min'), 5000);   // điện thoại: hiện 5 giây rồi thu về bé mèo
    load().then(h => { if (h && text) text.innerHTML = h; });
  };
  const sync = () => {
    const h = location.hash.slice(1) || '/about';
    if (!box) { if (!document.body) return; build(); }
    box.hidden = !SHOW.test(h);
  };
  window.addEventListener('hashchange', sync);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
})();
