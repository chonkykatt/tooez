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
  if (APP) return X.modal(`<div class="h3">Mở bằng Chrome hoặc Safari để đăng nhập Google</div><p class="small muted" style="margin:8px 0 14px">Google không cho đăng nhập trong trình duyệt của Zalo / Facebook. Bấm dấu <b>⋯</b> ở góc trên, chọn <b>Mở bằng trình duyệt</b>, rồi đăng nhập ở đó. Hoặc dùng email + mật khẩu ngay tại đây.</p><div class="row"><button class="btn pri" id="cl-em">Dùng email</button><button class="btn ghost" id="cl-x">Đóng</button></div>`,
    (m, close) => { $('#cl-x', m).onclick = close; $('#cl-em', m).onclick = () => { close(); emailBox(); }; });
  remember();
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: backTo(), queryParams: { prompt: 'select_account' } } });
  if (error) X.toast(esc(errMsg(error)), 4000);
}
function emailBox(tab = 'in') {
  X.modal(`<div class="row" style="margin-bottom:12px"><div class="h3 grow">Tài khoản TOOEZ</div><button class="icon-btn" id="cl-x" title="Đóng">${icon('x')}</button></div>
    <div class="seg" id="cl-tab" style="margin-bottom:14px"><button data-t="in">Đăng nhập</button><button data-t="up">Tạo tài khoản</button><button data-t="fg">Quên mật khẩu</button></div>
    <div class="field"><label>Email</label><input class="inp" id="cl-mail" type="email" autocomplete="email" inputmode="email" placeholder="ban@gmail.com"></div>
    <div class="field" id="cl-pw-f"><label>Mật khẩu</label><input class="inp" id="cl-pw" type="password" autocomplete="current-password" placeholder="Ít nhất 6 ký tự"></div>
    <div class="small" id="cl-msg" style="min-height:20px;margin:6px 0"></div>
    <div class="row"><button class="btn pri" id="cl-go"></button><span class="grow"></span><button class="btn ghost sm" id="cl-g">Dùng Google</button></div>`, (m, close) => {
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
      const b = $('#cl-go', m); b.disabled = true;
      try {
        if (tab === 'in') { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; close(); }
        else if (tab === 'up') { remember(); const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: backTo() } }); if (error) throw error;
          if (data.session) close(); else msg('Đã tạo tài khoản. Mở email (cả mục Spam), bấm link xác nhận, rồi quay lại đây đăng nhập.', true); }
        else { remember(); const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: backTo() }); if (error) throw error; msg('Đã gửi link đặt lại mật khẩu vào email (xem cả mục Spam).', true); }
      } catch (e) { msg(esc(errMsg(e))); } finally { b.disabled = false; }
    };
    $('#cl-go', m).onclick = go; m.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') go(); });
    setTimeout(() => $('#cl-mail', m).focus(), 50);
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

/* ---------- giao diện ---------- */
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'vừa xong' : s < 3600 ? Math.round(s / 60) + ' phút trước' : new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); };
const stLine = () => st.state === 'sync' ? 'Đang đồng bộ…' : st.state === 'err' ? `<span style="color:var(--red)">${esc(st.msg)}</span>` : st.at ? 'Đã lưu ' + ago(st.at) : 'Đã đăng nhập';
function accountCard() {
  if (!ready) return `<div class="card sec acct" id="cl-card"><div class="h3">Tài khoản</div><div class="small muted">Đang kiểm tra đăng nhập…</div></div>`;
  if (user) return `<div class="card sec acct" id="cl-card"><div class="row" style="gap:14px;flex-wrap:wrap"><span class="acct-ic">${icon('check')}</span><div class="grow" style="min-width:200px"><div class="h3">Tiến độ đang được lưu trên tài khoản</div>
    <div class="small muted">${esc(user.email || '')} - ${stLine()}</div></div><button class="btn sm" id="cl-sync">${icon('refresh')} Lưu ngay</button><button class="btn sm ghost" id="cl-out">Đăng xuất</button></div></div>`;
  return `<div class="card sec acct tint" id="cl-card"><div class="row" style="gap:14px;flex-wrap:wrap"><div class="grow" style="min-width:220px"><div class="h3">Đăng nhập để không mất tiến độ</div>
    <div class="small muted">Hiện tiến độ chỉ nằm trong trình duyệt này. Đăng nhập là lưu lên mạng: đổi điện thoại, đổi trình duyệt, mở trong Zalo vẫn còn nguyên. Bài đã làm trên máy này sẽ được giữ và gộp vào tài khoản.</div></div>
    <div class="row" style="gap:8px"><button class="btn pri" id="cl-google">Đăng nhập bằng Google</button><button class="btn" id="cl-email">Dùng email</button></div></div></div>`;
}
function bindCard(root) {
  const on = (id, f) => { const b = root.querySelector('#' + id); if (b) b.onclick = f; };
  on('cl-google', google); on('cl-email', () => emailBox()); on('cl-out', signOut); on('cl-sync', () => syncNow(true));
  on('cl-tip-x', () => { X.S().seenTips.cloud = Date.now(); X.save(); const t = $('#cl-tip'); if (t) t.remove(); });
}
function paintCards() {
  const c = $('#cl-card'); if (c) { c.outerHTML = accountCard(); bindCard(document); }
}
const prevAfter = X.afterRender;
X.afterRender = (h, view) => {
  prevAfter && prevAfter(h, view);
  const page = view.querySelector('.page'); if (!page) return;
  if (h === '/settings') { const h1 = page.querySelector('h1'); if (h1) { h1.insertAdjacentHTML('afterend', accountCard()); bindCard(page); } }
  if (h === '/today' && ready && !user) {
    const S = X.S(), n = (S.attempts || []).length;
    if (n >= 10 && !(S.seenTips.cloud && Date.now() - S.seenTips.cloud < 7 * 864e5)) {
      const hello = page.querySelector('.hello');
      if (hello) { hello.insertAdjacentHTML('afterend', `<div class="card tint row" id="cl-tip" style="margin-top:16px;gap:12px;flex-wrap:wrap">${icon('flame')}<div class="grow small" style="min-width:200px"><b>Bạn đã làm ${n} câu.</b> Đăng nhập để tiến độ không mất khi đổi máy hay xóa dữ liệu trình duyệt.</div><button class="btn sm pri" id="cl-google">Google</button><button class="btn sm" id="cl-email">Email</button><button class="btn sm ghost" id="cl-tip-x">Để sau</button></div>`); bindCard(page); }
    }
  }
};
const prevSide = X.renderSide;
X.renderSide = (...a) => {
  prevSide && prevSide(...a);
  const foot = document.querySelector('#side .side-foot'); if (!foot || !ready) return;
  foot.insertAdjacentHTML('afterbegin', user
    ? `<a class="acct-chip" href="#/settings" title="${esc(user.email || '')}"><span class="dot ${st.state === 'err' ? 'bad' : ''}"></span><span class="grow">${st.state === 'err' ? 'Chưa lưu được' : st.state === 'sync' ? 'Đang lưu…' : 'Đã lưu lên tài khoản'}</span></a>`
    : `<a class="acct-chip off" href="#/settings"><span class="dot"></span><span class="grow">Chưa đăng nhập - <b>Lưu tiến độ</b></span></a>`);
};

X.cloud = { on: true, user: () => user, google, emailBox, signOut, syncNow };

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
    if ((u && u.id) !== (user && user.id)) { user = u; if (ready) { if (user) { setTimeout(firstSync, 0); X.toast('Đã đăng nhập: ' + esc(user.email || '')); } else { setSt('off'); refresh(); } } }
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
  if (user) firstSync(); else { refresh(); paintCards(); }
  if (!user && X.hereKey() === '/today') X.render();
  setInterval(() => syncNow(false), 20000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') syncNow(false); else syncNow(true); });
  window.addEventListener('online', () => syncNow(true));
})();
})();
