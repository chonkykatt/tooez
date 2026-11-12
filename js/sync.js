/* Giữ tiến độ khi đổi địa chỉ web, đổi trình duyệt, hoặc mở trong Zalo / Facebook.
   Tiến độ lưu theo từng (trình duyệt + địa chỉ web). Mở link trong Zalo, Messenger, hay ở một địa chỉ khác
   (bản GitHub, link bản thử của Netlify) là một "ngăn" riêng, nên trông như mất hết.
   File này: (1) nhắc khi đang ở chỗ dễ mất, (2) làm link "mang tiến độ theo" để gộp sang chỗ chính. */
(function () {
  const MAIN = 'tooez.netlify.app';
  const MAIN_URL = 'https://' + MAIN + '/';
  const S = () => X.S(), icon = X.icon;
  const host = location.hostname;
  const local = !/^https?:$/.test(location.protocol) || /^(localhost|127\.|\[::1\]|.*\.local$)/.test(host);
  const ua = navigator.userAgent || '';
  const APP = /Zalo/i.test(ua) ? 'Zalo' : /FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(ua) ? 'Facebook / Messenger' : /Instagram/i.test(ua) ? 'Instagram'
    : /musical_ly|TikTok|Bytedance/i.test(ua) ? 'TikTok' : /\bLine\//.test(ua) ? 'LINE' : '';
  const otherHost = !local && host !== MAIN;
  const amount = s => (s.attempts || []).length + Object.keys(s.words || {}).length + Object.keys(s.lessons || {}).length;

  /* ---- đóng gói tiến độ vào link (nén gzip nếu trình duyệt hỗ trợ) ---- */
  const b64 = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = t => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const pack = async txt => {
    const raw = new TextEncoder().encode(txt);
    if (window.CompressionStream) { const buf = await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer(); return 'g' + b64(new Uint8Array(buf)); }
    return 'r' + b64(raw);
  };
  const unpack = async t => {
    const bytes = unb64(t.slice(1));
    if (t[0] === 'g') return await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return new TextDecoder().decode(bytes);
  };
  X.progressLink = async () => MAIN_URL + '#/nhan?d=' + await pack(X.exportData());

  const copy = async txt => {
    try { await navigator.clipboard.writeText(txt); return true; } catch (e) {}
    const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
  };

  // nút "Mang sang máy / trình duyệt khác" ở trang Hồ sơ
  X.shareProgress = async () => {
    if (!amount(S())) { X.toast('Chưa có tiến độ nào để mang đi.'); return; }
    let link; try { link = await X.progressLink(); } catch (e) { X.toast('Trình duyệt này chưa làm được link. Dùng nút Tải file sao lưu nhé.'); return; }
    X.modal(`<h3 class="h3" style="margin-top:0">Mang tiến độ sang chỗ khác</h3>
      <p class="small">Link dưới đây chứa toàn bộ tiến độ của bạn. Mở link ở trình duyệt hoặc máy muốn dùng (Chrome, Safari…), TOOEZ sẽ <b>gộp</b> bài ở đây vào bài ở đó, không mất bài nào.</p>
      <p class="small muted">Có thể tự gửi link cho mình qua Zalo / email rồi mở bằng trình duyệt. Link chỉ chứa tiến độ học, đừng gửi cho người khác.</p>
      <div class="row btn-row" style="margin-top:12px"><button class="btn pri" id="sp-copy">${icon('share')} Sao chép link</button>${navigator.share ? `<button class="btn" id="sp-share">Gửi đi…</button>` : ''}<button class="btn ghost" id="sp-x">Đóng</button></div>`,
      (m, close) => {
        m.querySelector('#sp-copy').onclick = async () => { X.toast(await copy(link) ? 'Đã sao chép. Dán vào thanh địa chỉ của trình duyệt kia.' : 'Không sao chép được, dùng nút Gửi đi hoặc Tải file sao lưu.', 3200); };
        const sh = m.querySelector('#sp-share'); if (sh) sh.onclick = () => navigator.share({ title: 'Tiến độ TOOEZ', url: link }).catch(() => {});
        m.querySelector('#sp-x').onclick = close;
      });
  };

  /* ---- trang nhận: #/nhan?d=... ---- */
  X.route(/^\/nhan\?d=([\w-]+)$/, async (view, d) => {
    view.innerHTML = `<div class="card" style="max-width:560px;margin:40px auto"><p class="muted">Đang đọc tiến độ…</p></div>`;
    let data;
    try { data = JSON.parse(await unpack(d)); if (!data || !data.v) throw 0; }
    catch (e) { view.innerHTML = `<div class="card" style="max-width:560px;margin:40px auto"><h2 class="h2">Link không đọc được</h2><p class="small">Có thể link bị cắt mất một đoạn khi gửi. Thử sao chép lại, hoặc dùng file sao lưu (Hồ sơ → Khôi phục từ file).</p><a class="btn" href="#/today">Về trang chính</a></div>`; return; }
    const n = (data.attempts || []).length, w = Object.keys(data.words || {}).length, xp = (data.xp && data.xp.total) || 0, here = amount(S());
    view.innerHTML = `<div class="card" style="max-width:560px;margin:40px auto">
      <h2 class="h2" style="margin-top:0">Nhận tiến độ mang sang</h2>
      <p>Trong link có <b>${n.toLocaleString('vi-VN')}</b> lượt làm câu hỏi, <b>${w.toLocaleString('vi-VN')}</b> từ đã học, <b>${xp.toLocaleString('vi-VN')}</b> XP${data.profile && data.profile.name ? ` của <b>${X.esc(data.profile.name)}</b>` : ''}.</p>
      <p class="small muted">${here ? 'Ở trình duyệt này cũng đã có tiến độ. Bấm Gộp: giữ cả hai, bài nào cũng không mất.' : 'Trình duyệt này chưa có tiến độ nào.'}</p>
      <div class="row btn-row"><button class="btn pri" id="nh-ok">${icon('check')} Gộp vào đây</button><a class="btn ghost" href="#/today">Bỏ qua</a></div></div>`;
    view.querySelector('#nh-ok').onclick = () => {
      X.mergeData(data); X.toast('Đã nhận tiến độ. Từ giờ cứ học ở đây nhé.', 3200);
      try { history.replaceState(null, '', location.pathname + location.search + '#/today'); } catch (e) {}
      X.render();
    };
  });

  /* ---- dải nhắc ở đầu trang ---- */
  const seen = k => { try { return sessionStorage.getItem('tooez.note.' + k); } catch (e) { return null; } };
  const mark = k => { try { sessionStorage.setItem('tooez.note.' + k, '1'); } catch (e) {} };
  const show = () => {
    if (document.getElementById('keep-note')) return;
    let k = '', html = '', act = '';
    if (APP) {
      k = 'app';
      html = `<b>Bạn đang mở TOOEZ trong ${APP}.</b> Tiến độ học ở đây dễ bị xóa và không sang được Chrome hay Safari. Bấm nút <b>⋯</b> ở góc trên, chọn <b>Mở bằng trình duyệt</b>.`;
      act = amount(S()) ? `<button class="btn sm" id="kn-go">Mang tiến độ theo</button>` : '';
    } else if (otherHost) {
      k = 'host';
      html = `<b>Đây không phải địa chỉ chính của TOOEZ.</b> Tiến độ lưu riêng theo từng địa chỉ web. Hãy học ở <b>${MAIN}</b> để không bị mất bài.`;
      act = `<button class="btn sm" id="kn-move">${amount(S()) ? 'Chuyển tiến độ sang ' + MAIN : 'Mở ' + MAIN}</button>`;
    }
    if (!k || seen(k)) return;
    const bar = document.createElement('div'); bar.id = 'keep-note'; bar.className = 'keep-note';
    bar.innerHTML = `<div class="kn-t small">${html}</div><div class="kn-a">${act}<button class="btn sm ghost" id="kn-x" aria-label="Đóng">${icon('x')}</button></div>`;
    const v = document.getElementById('view'); v ? v.parentNode.insertBefore(bar, v) : document.body.insertBefore(bar, document.body.firstChild);
    bar.querySelector('#kn-x').onclick = () => { mark(k); bar.remove(); };
    const go = bar.querySelector('#kn-go'); if (go) go.onclick = () => X.shareProgress();
    const mv = bar.querySelector('#kn-move'); if (mv) mv.onclick = async () => {
      if (!amount(S())) { location.href = MAIN_URL; return; }
      try { location.href = await X.progressLink(); } catch (e) { location.href = MAIN_URL; }
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
})();
