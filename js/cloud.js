/* TOOEZ - tài khoản: đăng nhập Google hoặc email + mật khẩu (Supabase), lưu tiến độ lên mạng.
   Không đăng nhập vẫn học bình thường, tiến độ nằm trong trình duyệt như cũ.
   Đăng nhập: tiến độ trên máy gộp với bản trên tài khoản, sau đó cứ có thay đổi là tự lưu lên (khoảng 20 giây một lần,
   và ngay khi rời trang). Máy khác đăng nhập cùng tài khoản sẽ kéo về và gộp, không mất bài nào.
   Dữ liệu lưu dạng nén trong bảng public.progress, mỗi người một dòng, chỉ chính người đó đọc / ghi được (RLS). */
'use strict';
(() => {
const C = window.TOOEZ_CLOUD || {};
const { $, esc, icon } = X;
if (!C.url || !C.key) { X.cloud = { on: false }; return; }

let sb = null, user = null, lastStamp = null, pushedRev = -1, busy = false, ready = false;
const st = { state: 'off', at: 0, msg: '' };   // off | sync | ok | err
const APP = /Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|musical_ly|TikTok|\bLine\//i.test(navigator.userAgent || '');

/* ---------- nén / giải nén (tiến độ có thể vài trăm KB, nén còn khoảng 1/8) ---------- */
const b64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = t => { const s = atob(t), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
const gz = async txt => {
  if (!window.CompressionStream) return 'j:' + txt;
  const buf = await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  return 'g:' + b64(new Uint8Array(buf));
};
const ungz = async t => {
  if (t.startsWith('j:')) return t.slice(2);
  return new Response(new Blob([unb64(t.slice(2))]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
};

/* ---------- đọc / ghi bản trên tài khoản ---------- */
const head = async () => { const { data, error } = await sb.from('progress').select('stamp').eq('user_id', user.id).maybeSingle(); if (error) throw error; return data; };
const pull = async () => { const { data, error } = await sb.from('progress').select('blob,stamp').eq('user_id', user.id).maybeSingle(); if (error) throw error; return data; };
const decode = async r => JSON.parse(await ungz(r.blob));
const blank = S => !S.profile.name && (S.attempts || []).length < 5 && !Object.keys(S.words || {}).length;
const fillProfile = rp => { if (!rp) return; const p = X.S().profile; Object.keys(rp).forEach(k => { if ((p[k] === '' || p[k] == null) && rp[k] !== '' && rp[k] != null) p[k] = rp[k]; }); };
const refresh = () => { X.renderSide && X.renderSide(); X.onSync && X.onSync(); paintCards(); };
const setSt = (state, msg) => { st.state = state; st.msg = msg || ''; if (state === 'ok') st.at = Date.now(); paintCards(); X.renderSide && X.renderSide(); };
const errMsg = e => { const m = String((e && (e.message || e.error_description)) || e || '');
  if (/fetch|network|Failed/i.test(m)) return 'Mất mạng, có mạng lại sẽ tự lưu.';
  if (/Invalid login/i.test(m)) return 'Sai email hoặc mật khẩu.';
  if (/Email not confirmed/i.test(m)) return 'Email chưa được xác nhận. Mở hộp thư (cả mục Spam) và bấm link xác nhận.';
  if (/already registered|already been registered/i.test(m)) return 'Email này đã có tài khoản. Chuyển sang Đăng nhập, hoặc dùng Quên mật khẩu.';
  if (/at least|Password should/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.';
  if (/rate limit|too many/i.test(m)) return 'Thử quá nhiều lần, đợi vài phút rồi thử lại.';
  if (/relation|does not exist|schema cache/i.test(m)) return 'Chưa tạo bảng lưu tiến độ trên Supabase.';
  return m || 'Có lỗi, thử lại sau.'; };

// lần đầu đăng nhập trên máy này: gộp tiến độ trên máy với bản trên tài khoản
async function firstSync() {
  setSt('sync');
  try {
    const r = await pull(), S = X.S();
    const other = S.cloudUid && S.cloudUid !== user.id;   // máy dùng chung: dữ liệu trên máy là của tài khoản khác
    if (r) {
      const remote = await decode(r);
      if (other || blank(S)) X.importData(remote); else { X.mergeData(remote); fillProfile(remote.profile); }
      lastStamp = r.stamp;
    } else if (other) X.resetAll();
    X.S().cloudUid = user.id; X.save();
    await new Promise(res => setTimeout(res, 200));
    await upload();
    refresh();
    if (r && !other) X.toast('Đã gộp tiến độ trên máy này với tài khoản');
  } catch (e) { console.warn(e); setSt('err', errMsg(e)); }
}
async function upload() {
  const rev = X.S()._rev, stamp = Date.now();
  const blob = await gz(X.exportData());
  const { error } = await sb.from('progress').upsert({ user_id: user.id, blob, stamp, updated_at: new Date(stamp).toISOString() });
  if (error) throw error;
  lastStamp = stamp; pushedRev = rev; setSt('ok');
}
// máy khác vừa lưu → kéo về gộp; máy này có thay đổi → đẩy lên
async function syncNow(checkRemote) {
  if (!user || busy || !ready) return;
  const changed = X.S()._rev !== pushedRev;
  if (!changed && !checkRemote) return;
  busy = true;
  try {
    const h = await head();
    if (h && h.stamp !== lastStamp) { const r = await pull(); if (r) { X.mergeData(await decode(r)); lastStamp = r.stamp; refresh(); } }
    if (X.S()._rev !== pushedRev) await upload(); else setSt('ok');
  } catch (e) { console.warn(e); setSt('err', errMsg(e)); }
  finally { busy = false; }
}

/* ---------- đăng nhập / đăng xuất ---------- */
const backTo = () => location.origin + location.pathname;
const remember = () => { try { sessionStorage.setItem('tooez.back', location.hash || '#/today'); } catch (e) {} };
async function google() {
  if (!sb) return X.toast('Đang tải phần đăng nhập, bấm lại sau 1-2 giây');
  if (APP) return X.modal(`<div class="h3">Mở bằng Chrome hoặc Safari để đăng nhập Google</div><p class="small muted" style="margin:8px 0 14px">Google không cho đăng nhập trong trình duyệt của Zalo / Facebook. Bấm dấu <b>⋯</b> ở góc trên, chọn <b>Mở bằng trình duyệt</b>, rồi đăng nhập ở đó. Hoặc dùng email + mật khẩu ngay tại đây.</p><div class="row"><button class="btn pri" id="cl-em">Dùng email</button><button class="btn ghost" id="cl-x">Đóng</button></div>`,
    (m, close) => { $('#cl-x', m).onclick = close; $('#cl-em', m).onclick = () => { close(); emailBox(); }; });
  remember();
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: backTo(), queryParams: { prompt: 'select_account' } } });
  if (error) X.toast(esc(errMsg(error)), 4000);
}
function emailBox(tab = 'in') {
  X.modal(`<div class="row" style="margin-bottom:6px"><div class="h3 grow">Đăng nhập để lưu tiến độ</div><button class="icon-btn" id="cl-x" title="Đóng">${icon('x')}</button></div>
    <p class="small muted" style="margin:0 0 14px">Một tài khoản dùng cho mọi máy. Bài đã làm trên máy này được giữ và gộp vào tài khoản.</p>
    <button class="btn pri lg" id="cl-g" style="width:100%;justify-content:center">Tiếp tục với Google</button>
    <div class="cl-or small faint"><span>hoặc dùng email</span></div>
    <div class="seg" id="cl-tab" style="margin-bottom:14px"><button data-t="in">Đăng nhập</button><button data-t="up">Tạo tài khoản</button><button data-t="fg">Quên mật khẩu</button></div>
    <div class="field"><label>Email</label><input class="inp" id="cl-mail" type="email" autocomplete="email" inputmode="email" placeholder="ban@gmail.com"></div>
    <div class="field" id="cl-pw-f"><label>Mật khẩu</label><input class="inp" id="cl-pw" type="password" autocomplete="current-password" placeholder="Ít nhất 6 ký tự"></div>
    <div class="small" id="cl-msg" style="min-height:20px;margin:6px 0"></div>
    <div class="row"><button class="btn" id="cl-go"></button></div>`, (m, close) => {
    const msg = (t, ok) => { const el = $('#cl-msg', m); el.innerHTML = t; el.style.color = ok ? 'var(--sage)' : 'var(--red)'; };
    const setTab = t => { tab = t; m.querySelectorAll('#cl-tab button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      $('#cl-pw-f', m).style.display = t === 'fg' ? 'none' : ''; $('#cl-pw', m).autocomplete = t === 'up' ? 'new-password' : 'current-password';
      $('#cl-go', m).textContent = t === 'in' ? 'Đăng nhập' : t === 'up' ? 'Tạo tài khoản' : 'Gửi link đặt lại mật khẩu'; msg(''); };
    setTab(tab);
    m.querySelectorAll('#cl-tab button').forEach(b => b.onclick = () => setTab(b.dataset.t));
    $('#cl-x', m).onclick = close; $('#cl-g', m).onclick = () => { close(); google(); };
    const go = async () => {
      const email = $('#cl-mail', m).value.trim(), password = $('#cl-pw', m).value;
      if (!/^\S+@\S+\.\S+$/.test(email)) return msg('Nhập đúng địa chỉ email.');
      if (tab !== 'fg' && password.length < 6) return msg('Mật khẩu cần ít nhất 6 ký tự.');
      if (!sb) return msg('Đang tải phần đăng nhập, bấm lại sau 1-2 giây.');
      const b = $('#cl-go', m); b.disabled = true;
      try {
        if (tab === 'in') { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; close(); }
        else if (tab === 'up') { remember(); const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: backTo() } }); if (error) throw error;
          if (data.session) close(); else msg('Đã tạo tài khoản. Mở email (cả mục Spam), bấm link xác nhận, rồi quay lại đây đăng nhập.', true); }
        else { remember(); const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: backTo() }); if (error) throw error; msg('Đã gửi link đặt lại mật khẩu vào email (xem cả mục Spam).', true); }
      } catch (e) { msg(esc(errMsg(e))); } finally { b.disabled = false; }
    };
    $('#cl-go', m).onclick = go; m.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') go(); });
  });
}
function newPassword() {
  X.modal(`<div class="h3">Đặt mật khẩu mới</div><div class="field" style="margin-top:12px"><label>Mật khẩu mới</label><input class="inp" id="cl-np" type="password" autocomplete="new-password" placeholder="Ít nhất 6 ký tự"></div>
    <div class="small" id="cl-msg" style="min-height:20px;margin:6px 0;color:var(--red)"></div><button class="btn pri" id="cl-ok">Lưu mật khẩu</button>`, (m, close) => {
    $('#cl-ok', m).onclick = async () => { const pw = $('#cl-np', m).value; if (pw.length < 6) return ($('#cl-msg', m).textContent = 'Mật khẩu cần ít nhất 6 ký tự.');
      const { error } = await sb.auth.updateUser({ password: pw }); if (error) return ($('#cl-msg', m).textContent = errMsg(error)); close(); X.toast('Đã đổi mật khẩu'); };
  });
}
async function signOut() {
  X.modal(`<div class="h3">Đăng xuất</div><p class="small muted" style="margin:8px 0 14px">Tiến độ vẫn còn trên tài khoản. Nếu đây là máy dùng chung (máy trường, máy bạn bè), nên xóa luôn khỏi máy này.</p>
    <div class="row"><button class="btn" id="cl-keep">Đăng xuất, giữ trên máy này</button><button class="btn pri" id="cl-wipe">Đăng xuất và xóa khỏi máy này</button></div>`, (m, close) => {
    const out = async wipe => { close(); X.toast('Đang lưu lần cuối…'); try { await syncNow(true); } catch (e) {}
      await sb.auth.signOut(); if (wipe) X.resetAll(); /* giữ lại: dữ liệu vẫn gắn với tài khoản cũ, người khác đăng nhập trên máy này sẽ không bị trộn bài */ X.toast('Đã đăng xuất'); X.go(wipe ? '#/about' : location.hash || '#/today'); X.render(); };
    $('#cl-keep', m).onclick = () => out(false); $('#cl-wipe', m).onclick = () => out(true);
  });
}

/* ---------- giao diện: đăng nhập luôn nằm ở chỗ dễ thấy (đầu menu, thanh trên cùng trên điện thoại, đầu trang Hôm nay) ---------- */
const login = () => emailBox();
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'vừa xong' : s < 3600 ? Math.round(s / 60) + ' phút trước' : new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); };
const stLine = () => st.state === 'sync' ? 'Đang lưu…' : st.state === 'err' ? `<span style="color:var(--red)">${esc(st.msg)}</span>` : st.at ? 'Đã lưu ' + ago(st.at) : 'Đã đăng nhập';
const hadSession = (() => { try { return !!localStorage.getItem('tooez.auth'); } catch (e) { return false; } })();
const ini = () => esc(((user && ((user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email)) || '?').trim()[0].toUpperCase());
const avatar = cls => { const pic = user && user.user_metadata && user.user_metadata.avatar_url; return `<span class="acct-av ${cls || ''}">${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : ini()}</span>`; };
const dd = (label, cls) => `<details class="lg-dd ${cls || ''}"><summary class="btn pri sm">${label} <span class="lg-car">▾</span></summary><div class="lg-menu"><button data-cl="google">Đăng nhập bằng Google</button><button data-cl="email">Đăng nhập bằng email</button></div></details>`;
function accountCard() {
  if (!ready && hadSession) return `<div class="card sec acct" id="cl-card"><div class="h3">Tài khoản</div><div class="small muted">Đang đăng nhập…</div></div>`;
  if (user) return `<div class="card sec acct" id="cl-card"><div class="row" style="gap:14px;flex-wrap:wrap">${avatar('lg')}<div class="grow" style="min-width:200px"><div class="h3">Tiến độ đang được lưu trên tài khoản</div>
    <div class="small muted">${esc(user.email || '')} - ${stLine()}</div></div><button class="btn sm" id="cl-sync">${icon('refresh')} Lưu ngay</button><button class="btn sm ghost" id="cl-out">Đăng xuất</button></div></div>`;
  return loginHero('cl-card');
}
function loginHero(id) {
  return `<div class="card sec acct row" id="${id}" style="gap:12px;flex-wrap:wrap"><div class="grow"><div class="h3">Tài khoản</div><div class="small muted">Chưa đăng nhập</div></div>${dd('Đăng nhập để lưu tiến độ')}</div>`;
}
function bindCard(root) {
  root.querySelectorAll('[data-cl]').forEach(b => b.onclick = () => {
    const k = b.dataset.cl; const d = b.closest('details'); if (d) d.open = false;
    if (k === 'google') return google();
    if (k === 'email') return login();
    if (k === 'later') { try { sessionStorage.setItem('tooez.later', '1'); } catch (e) {} const h = $('#cl-hero'); if (h) h.remove(); }
  });
  const on = (id, f) => { const b = root.querySelector('#' + id); if (b) b.onclick = f; };
  on('cl-out', signOut); on('cl-sync', () => syncNow(true));
}
function paintCards() {
  const c = $('#cl-card'); if (c) { c.outerHTML = accountCard(); bindCard(document); }
  const h = $('#cl-hero'); if (h && user) h.remove();
}
const later = () => { try { return sessionStorage.getItem('tooez.later'); } catch (e) { return null; } };
const prevAfter = X.afterRender;
X.afterRender = (h, view) => {
  prevAfter && prevAfter(h, view);
  const page = view.querySelector('.page'); if (!page) return;
  if (h === '/settings') { const h1 = page.querySelector('h1'); if (h1) { h1.insertAdjacentHTML('afterend', accountCard()); bindCard(page); } }
  // đầu trang Hôm nay (và màn chào lần đầu): khung đăng nhập to, nằm trên cùng
  if (h === '/today' && !user && !(hadSession && !ready)) {
    const hello = page.querySelector('.hello');
    if (page.querySelector('#ob-name')) { page.insertAdjacentHTML('afterbegin', `<div class="lg-corner" id="cl-hero"><span class="small muted">Đã học ở máy khác?</span>${dd('Đăng nhập')}</div>`); bindCard(page); }
    else if (hello) { hello.insertAdjacentHTML('beforeend', `<div class="lg-corner in-hello" id="cl-hero">${dd('Đăng nhập để lưu tiến độ')}</div>`); bindCard(page); }
  }
};
// menu bên trái: ô tài khoản ngay dưới logo; điện thoại: nút Đăng nhập trên thanh trên cùng
const prevSide = X.renderSide;
X.renderSide = (...a) => {
  prevSide && prevSide(...a);
  const brand = document.querySelector('#side .brand');
  if (brand) brand.insertAdjacentHTML('afterend', user
    ? (admin ? `<a class="acct-side soan-link" href="#/soan">✏️ <b>Soạn đề</b></a>` : '') + `<a class="acct-side on" href="#/settings" title="Tài khoản">${avatar()}<span class="grow"><b>${esc((user.email || '').split('@')[0])}</b><small><i class="dot ${st.state === 'err' ? 'bad' : ''}"></i>${st.state === 'err' ? 'Chưa lưu được' : st.state === 'sync' ? 'Đang lưu…' : 'Tiến độ đã lưu'}</small></span></a>`
    : hadSession && !ready ? `<div class="acct-side"><small class="muted">Đang đăng nhập…</small></div>`
    : `<div class="acct-side off">${dd('Đăng nhập để lưu tiến độ', 'full')}</div>`);
  const side = document.querySelector('#side'); if (side) bindCard(side);
  const tb = document.querySelector('.topbar');
  if (tb) {
    let b = tb.querySelector('#tb-acct'); if (!b) { b = document.createElement('span'); b.id = 'tb-acct'; tb.appendChild(b); }
    b.innerHTML = user ? `<a href="#/settings" title="Tài khoản">${avatar('sm')}</a>` : hadSession && !ready ? '' : dd('Đăng nhập', 'right');
    bindCard(b);
  }
};

document.addEventListener('click', e => { document.querySelectorAll('details.lg-dd[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }); });
let admin = false;
// tài khoản có trong bảng public.admins thì được vào trang Soạn đề
const checkAdmin = async () => { admin = false; if (!user) return; try { const { data } = await sb.rpc('is_admin'); admin = data === true; } catch (e) { admin = false; } if (admin) { X.renderSide && X.renderSide(); if (/^\/soan/.test(X.hereKey())) X.render(); } };
X.cloud = { on: true, user: () => user, google, login, signOut, syncNow, sb: () => sb, admin: () => admin, ready: () => ready };

/* ---------- khởi động ---------- */
const lib = () => new Promise((res, rej) => { if (window.supabase && window.supabase.createClient) return res();
  const s = document.createElement('script'); s.src = 'js/vendor/supabase-2.118.0.js'; s.onload = res; s.onerror = () => rej(new Error('lib')); document.head.appendChild(s); });
(async () => {
  try { await lib(); } catch (e) { console.warn('Không tải được thư viện đăng nhập'); return; }
  const q = new URLSearchParams(location.search);
  const errDesc = q.get('error_description');
  sb = window.supabase.createClient(C.url, C.key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, storageKey: 'tooez.auth' } });
  let recovery = false;
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === 'PASSWORD_RECOVERY') { recovery = true; setTimeout(newPassword, 300); }
    const u = session ? session.user : null;
    if ((u && u.id) !== (user && user.id)) { user = u; if (ready) { if (user) { setTimeout(firstSync, 0); setTimeout(checkAdmin, 0); X.toast('Đã đăng nhập: ' + esc(user.email || '')); } else { admin = false; setSt('off'); refresh(); } } }
  });
  const { data } = await sb.auth.getSession();
  user = data.session ? data.session.user : null;
  // dọn ?code=... trên thanh địa chỉ và quay về đúng trang trước khi đi đăng nhập
  if (q.has('code') || errDesc || q.has('error')) {
    let back = ''; try { back = sessionStorage.getItem('tooez.back') || ''; sessionStorage.removeItem('tooez.back'); } catch (e) {}
    history.replaceState(null, '', location.pathname + (back || location.hash || '#/today'));
    if (errDesc) X.toast(esc(errDesc), 5000);
    if (!recovery) X.render();
  }
  ready = true;
  if (user) { firstSync(); checkAdmin(); } else { refresh(); paintCards(); }
  if (!user && hadSession && X.hereKey() === '/today') X.render();
  setInterval(() => syncNow(false), 20000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') syncNow(false); else syncNow(true); });
  window.addEventListener('online', () => syncNow(true));
})();
})();
