// Test Worker bằng Node với Google / Supabase / Turnstile / R2 giả. Chạy: npm test (trong tts-worker/)
import assert from 'node:assert/strict';
import W, { VOICES } from '../src/index.js';
import { keyOf } from '../src/key.js';

const store = new Map(), edge = new Map(), calls = [];
const obj = v => ({ arrayBuffer: async () => (typeof v === 'string' ? new TextEncoder().encode(v) : v).buffer, json: async () => JSON.parse(v), body: v });
const env = {
  CAP_CHARS: '200', USER_DAILY: '2', CI_TOKEN: 'ci', GOOGLE_TTS_KEY: 'g', TURNSTILE_SECRET: 't',
  SUPABASE_URL: 'https://sb.test', SUPABASE_ANON: 'anon', ALLOWED_ORIGINS: 'https://tooez.netlify.app,https://*--tooez.netlify.app',
  AUD: { get: async k => store.has(k) ? obj(store.get(k)) : null, head: async k => store.has(k) ? {} : null, put: async (k, v) => { store.set(k, v); } },
};
globalThis.caches = { default: { match: async r => edge.get(r.url)?.clone() || null, put: async (r, res) => { edge.set(r.url, res); } } };
globalThis.fetch = async (u, o = {}) => {
  u = String(u);
  if (u.includes('text:synthesize')) { const b = JSON.parse(o.body); calls.push('google:' + b.voice.name); return new Response(JSON.stringify({ audioContent: btoa('MP3:' + b.input.text) })); }
  if (u.startsWith('https://sb.test/auth/v1/user')) return o.headers.authorization === 'Bearer good' ? new Response(JSON.stringify({ id: 'u1' })) : new Response('{}', { status: 401 });
  if (u.includes('siteverify')) return new Response(JSON.stringify({ success: o.body.get('response') === 'ok' }));
  throw new Error('fetch lạ: ' + u);
};
const pend = [], ctx = { waitUntil: p => pend.push(p) };
const call = async (path, init = {}) => { const r = await W.fetch(new Request('https://tts.test' + path, init), env, ctx); await Promise.all(pend.splice(0)); return r; };
const post = (path, body, h = {}) => call(path, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(body) });
const WEB = { origin: 'https://tooez.netlify.app' }, PREV = { origin: 'https://deploy-preview-16--tooez.netlify.app' };
let ok = 0; const t = async (name, fn) => { await fn(); ok++; console.log('✓', name); };

await t('mã câu ổn định, đổi vai là đổi mã, khoảng trắng thừa không đổi mã', () => {
  assert.equal(keyOf('W', 'Hello  world '), keyOf('W', 'Hello world')); assert.notEqual(keyOf('W', 'Hi'), keyOf('M', 'Hi')); assert.match(keyOf('W', 'Hi'), /^v2\/[0-9a-f]{14}$/); });
await t('file chưa có → 404', async () => assert.equal((await call('/a/' + keyOf('W', 'Nope') + '.mp3')).status, 404));
await t('CI: sai khóa → 401', async () => assert.equal((await post('/ci', { role: 'W', text: 'Hi there.' }, { 'x-ci-token': 'x' })).status, 401));
await t('CI: vai lạ → 400', async () => assert.equal((await post('/ci', { role: 'Z', text: 'Hi there.' }, { 'x-ci-token': 'ci' })).status, 400));
await t('CI: tạo mới đúng giọng theo vai, lần hai không gọi Google', async () => {
  const r = await post('/ci', { role: 'A', text: 'Good morning, everyone.' }, { 'x-ci-token': 'ci' }); assert.equal(r.status, 201);
  assert.equal((await r.json()).voice, VOICES.A); assert.equal((await post('/ci', { role: 'A', text: 'Good morning, everyone.' }, { 'x-ci-token': 'ci' })).status, 200);
  assert.deepEqual(calls, ['google:' + VOICES.A]); });
await t('phát: lần đầu từ R2, lần sau từ bộ nhớ Cloudflare, có cache 1 năm', async () => {
  const p = '/a/' + keyOf('A', 'Good morning, everyone.') + '.mp3', a = await call(p), b = await call(p);
  assert.equal(a.headers.get('x-cache'), 'R2'); assert.equal(b.headers.get('x-cache'), 'EDGE'); assert.match(a.headers.get('cache-control'), /immutable/);
  assert.equal(await b.text(), 'MP3:Good morning, everyone.'); });
await t('gen: web lạ → 403', async () => assert.equal((await post('/gen', { text: 'I like tea.' }, { origin: 'https://evil.com', authorization: 'Bearer good' })).status, 403));
await t('gen: chưa đăng nhập → 401', async () => assert.equal((await post('/gen', { text: 'I like tea.', ts: 'ok' }, WEB)).status, 401));
await t('gen: Turnstile sai → 403', async () => assert.equal((await post('/gen', { text: 'I like tea.', ts: 'bad' }, { ...WEB, authorization: 'Bearer good' })).status, 403));
await t('gen: tiếng Việt / quá dài → 400', async () => {
  assert.equal((await post('/gen', { text: 'Xin chào các bạn', ts: 'ok' }, { ...WEB, authorization: 'Bearer good' })).status, 400);
  assert.equal((await post('/gen', { text: 'a'.repeat(201), ts: 'ok' }, { ...WEB, authorization: 'Bearer good' })).status, 400);
  assert.equal((await post('/gen', { text: '<script>', ts: 'ok' }, { ...WEB, authorization: 'Bearer good' })).status, 400); });
await t('gen: hợp lệ (cả link preview) → trả mp3 ngay, có CORS', async () => {
  const r = await post('/gen', { role: 'M', text: 'I like tea.', ts: 'ok' }, { ...PREV, authorization: 'Bearer good' });
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'audio/mpeg'); assert.equal(r.headers.get('access-control-allow-origin'), PREV.origin);
  assert.equal(r.headers.get('x-key'), keyOf('M', 'I like tea.')); });
await t('gen: câu đã có → không cần đăng nhập, không tốn lượt', async () => {
  const r = await post('/gen', { role: 'M', text: 'I like tea.' }, WEB); assert.equal(r.status, 200); assert.equal((await r.json()).exists, true); });
await t('gen: hết lượt trong ngày (2) → 429', async () => {
  const h = { ...WEB, authorization: 'Bearer good' };
  assert.equal((await post('/gen', { text: 'Second one here.', ts: 'ok' }, h)).status, 200);
  assert.equal((await post('/gen', { text: 'Third one here.', ts: 'ok' }, h)).status, 429); });
await t('trần ký tự tháng → 429, file đã có vẫn phát', async () => {
  const r = await post('/ci', { role: 'W', text: 'x'.repeat(150) + ' a' }, { 'x-ci-token': 'ci' }); assert.equal(r.status, 429);
  assert.equal((await call('/a/' + keyOf('A', 'Good morning, everyone.') + '.mp3')).status, 200); });
await t('/usage cần khóa, đếm đúng', async () => {
  assert.equal((await call('/usage')).status, 404);
  const u = await (await call('/usage', { headers: { 'x-ci-token': 'ci' } })).json(); assert.equal(u.chars, 'Good morning, everyone.'.length + 'I like tea.'.length + 'Second one here.'.length); });
console.log(`\n${ok} test đạt`);
