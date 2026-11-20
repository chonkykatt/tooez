// TOOEZ - máy chủ giọng đọc (Cloudflare Worker + R2), chạy ở tts.2die429.com
//   GET  /a/<mã>.mp3  phát file đã có (ai cũng đọc được). Cloudflare nhớ file ở máy chủ gần người dùng, trình duyệt giữ 1 năm.
//   POST /gen         tạo giọng cho câu học sinh tự gõ: cần đăng nhập Supabase + Turnstile, mỗi người có hạn mức mỗi ngày
//   POST /ci          GitHub Actions / admin tạo giọng cho nội dung viết sẵn (khóa CI_TOKEN)
//   GET  /voices, /usage   tra danh sách giọng của Google, số ký tự đã dùng (khóa CI_TOKEN)
// Mọi lần gọi Google đều qua bộ đếm tháng: chạm CAP_CHARS là dừng, vì Google không tự dừng khi hết phần miễn phí.
import { keyOf, norm } from './key.js';

// mỗi vai một giọng, giữ đủ giọng Mỹ / Anh / Úc như đề thật. Đổi bảng này → tăng VER trong key.js
export const VOICES = {
  W: 'en-US-Chirp3-HD-Aoede',     // nữ, Mỹ (vai chính)
  M: 'en-US-Chirp3-HD-Charon',    // nam, Mỹ (vai chính)
  Q: 'en-US-Chirp3-HD-Kore',      // nữ, Mỹ (đọc câu hỏi)
  N: 'en-US-Chirp3-HD-Orus',      // nam, Mỹ (giọng dẫn: "Number 32...")
  A: 'en-GB-Chirp3-HD-Fenrir',    // nam, Anh
  S: 'en-GB-Chirp3-HD-Leda',      // nữ, Anh
  SM: 'en-GB-Chirp3-HD-Iapetus',  // nam, Anh (thứ hai)
  K: 'en-AU-Chirp3-HD-Zephyr',    // nữ, Úc
  M2: 'en-AU-Chirp3-HD-Umbriel',  // nam, Úc
  VI: 'vi-VN-Chirp3-HD-Aoede',    // tiếng Việt (lời dẫn của Nhớ 1 phát), cùng giọng với W
};
const MAX_GEN = 200, MAX_CI = 1000;

const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...h } });
const month = () => new Date().toISOString().slice(0, 7), today = () => new Date().toISOString().slice(0, 10);
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

// ---- CORS: chỉ web TOOEZ (kể cả link preview của Netlify) và máy dev được gọi /gen
const originOk = (env, o) => !!o && String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  .some(p => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$').test(o));
const cors = (env, req) => { const o = req.headers.get('origin'); return { 'access-control-allow-origin': originOk(env, o) ? o : '*', vary: 'origin', 'access-control-expose-headers': 'x-key, x-cache, x-voice' }; };

// ---- bộ đếm (lưu trong R2)
const readNum = async (env, k) => { const o = await env.AUD.get(k); return o ? +(await o.json()).n || 0 : 0; };
const addNum = async (env, k, d) => env.AUD.put(k, JSON.stringify({ n: (await readNum(env, k)) + d, at: new Date().toISOString() }));
const capOf = env => +env.CAP_CHARS || 900000;

// ---- Google TTS
async function synth(env, role, text) {
  const name = VOICES[role]; if (!name) throw Object.assign(new Error('vai không hợp lệ'), { status: 400 });
  const used = await readNum(env, `usage/${month()}.json`);
  if (used + text.length > capOf(env)) throw Object.assign(new Error(`chạm trần ${capOf(env)} ký tự tháng ${month()}`), { status: 429 });
  const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GOOGLE_TTS_KEY },
    body: JSON.stringify({ input: { text }, voice: { languageCode: name.slice(0, 5), name }, audioConfig: { audioEncoding: 'MP3' } }),
  });
  if (!r.ok) throw Object.assign(new Error('Google ' + r.status + ': ' + (await r.text()).slice(0, 300)), { status: 502 });
  return { bytes: b64((await r.json()).audioContent), voice: name };
}
// tạo rồi cất vào R2; trả bytes để gửi luôn cho người đang chờ
async function make(env, ctx, role, text, key) {
  const { bytes, voice } = await synth(env, role, text);
  ctx.waitUntil(Promise.all([
    env.AUD.put(key + '.mp3', bytes, { httpMetadata: { contentType: 'audio/mpeg' }, customMetadata: { role, voice, text: text.slice(0, 1000) } }),
    addNum(env, `usage/${month()}.json`, text.length),
  ]));
  return { bytes, voice };
}

// ---- đăng nhập Supabase + Turnstile (cho /gen)
async function userOf(env, req) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''); if (!tok) return null;
  const r = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { apikey: env.SUPABASE_ANON, authorization: 'Bearer ' + tok } });
  if (!r.ok) return null; const u = await r.json(); return u && u.id ? u : null;
}
async function turnstileOk(env, token, ip) {
  if (!token) return false;
  const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', token); if (ip) f.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f });
  return r.ok && !!(await r.json()).success;
}

const textOk = (t, max) => t && t.length <= max && /[A-Za-z]/.test(t) && !/[<>{}\\]/.test(t);
// câu tự gõ: chỉ nhận chữ tiếng Anh (không dấu tiếng Việt), vì giọng đọc là giọng Anh
const englishOnly = t => !/[^\x20-\x7E‘’“”–—…]/.test(t);
const ciOk = (env, req) => !!env.CI_TOKEN && req.headers.get('x-ci-token') === env.CI_TOKEN;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), C = cors(env, req), p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { headers: { ...C, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, authorization, x-ci-token', 'access-control-max-age': '86400' } });
    try {
      // ---------- phát file
      const m = p.match(/^\/a\/(v\d+\/[0-9a-f]{14})\.mp3$/);
      if (m && (req.method === 'GET' || req.method === 'HEAD')) {
        const cache = caches.default, ck = new Request(url.origin + p);
        const hit = await cache.match(ck); if (hit) { const h = new Headers(hit.headers); Object.entries(C).forEach(([k, v]) => h.set(k, v)); h.set('x-cache', 'EDGE'); return new Response(req.method === 'HEAD' ? null : hit.body, { headers: h }); }
        const obj = await env.AUD.get(m[1] + '.mp3');
        if (!obj) return new Response('not found', { status: 404, headers: { ...C, 'cache-control': 'public, max-age=30' } });   // chưa có: chỉ nhớ 30 giây để khi tạo xong thì phát được ngay
        const buf = await obj.arrayBuffer(), base = { 'content-type': 'audio/mpeg', 'cache-control': 'public, max-age=31536000, immutable' };
        ctx.waitUntil(cache.put(ck, new Response(buf, { headers: base })));
        return new Response(req.method === 'HEAD' ? null : buf, { headers: { ...base, ...C, 'x-cache': 'R2' } });
      }

      // ---------- câu học sinh tự gõ
      if (p === '/gen' && req.method === 'POST') {
        if (!originOk(env, req.headers.get('origin'))) return json({ error: 'origin' }, 403, C);
        const b = await req.json().catch(() => ({})), role = VOICES[b.role] ? b.role : 'W', text = norm(b.text || '');
        if (!textOk(text, MAX_GEN) || !englishOnly(text)) return json({ error: `câu phải là tiếng Anh, tối đa ${MAX_GEN} ký tự` }, 400, C);
        const key = keyOf(role, text);
        if (await env.AUD.head(key + '.mp3')) return json({ key, exists: true }, 200, C);   // đã có: không tốn gì
        const u = await userOf(env, req); if (!u) return json({ error: 'cần đăng nhập' }, 401, C);
        if (!(await turnstileOk(env, b.ts, req.headers.get('cf-connecting-ip')))) return json({ error: 'turnstile' }, 403, C);
        const uk = `usage/u/${u.id}/${today()}.json`, n = await readNum(env, uk);
        if (n >= (+env.USER_DAILY || 50)) return json({ error: 'hết lượt hôm nay' }, 429, C);
        const { bytes, voice } = await make(env, ctx, role, text, key);
        ctx.waitUntil(addNum(env, uk, 1));
        return new Response(bytes, { headers: { ...C, 'content-type': 'audio/mpeg', 'x-key': key, 'x-voice': voice, 'cache-control': 'no-store' } });
      }

      // ---------- nội dung viết sẵn (GitHub Actions / admin)
      if (p === '/ci' && req.method === 'POST') {
        if (!ciOk(env, req)) return json({ error: 'unauthorized' }, 401);
        const b = await req.json().catch(() => ({})), role = b.role, text = norm(b.text || '');
        if (!VOICES[role]) return json({ error: 'vai không hợp lệ: ' + role }, 400);
        if (!textOk(text, MAX_CI)) return json({ error: `câu rỗng, quá ${MAX_CI} ký tự hoặc có ký tự lạ` }, 400);
        const key = keyOf(role, text);
        if (!b.force && await env.AUD.head(key + '.mp3')) return json({ key, exists: true });
        const { voice } = await make(env, ctx, role, text, key);
        return json({ key, voice, chars: text.length }, 201);
      }
      if (p === '/usage' && ciOk(env, req)) return json({ month: month(), chars: await readNum(env, `usage/${month()}.json`), cap: capOf(env) });
      if (p === '/voices' && ciOk(env, req)) {
        const out = {};
        for (const lc of (url.searchParams.get('lc') || 'en-US,en-GB,en-AU').split(',').slice(0, 6)) { const r = await fetch('https://texttospeech.googleapis.com/v1/voices?languageCode=' + lc, { headers: { 'x-goog-api-key': env.GOOGLE_TTS_KEY } });
          const j = await r.json(); out[lc] = (j.voices || []).filter(v => /Chirp3-HD/.test(v.name)).map(v => v.name + ' ' + v.ssmlGender); }
        const all = Object.values(out).flat().map(x => x.split(' ')[0]);
        return json({ missing: Object.entries(VOICES).filter(([, n]) => !all.includes(n)), voices: out });
      }
      return new Response('TOOEZ tts', { status: p === '/' ? 200 : 404, headers: C });
    } catch (e) {
      return json({ error: e.message }, e.status || 500, C);
    }
  },
};
