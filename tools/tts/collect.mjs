// TOOEZ - gom MỌI câu web sẽ đọc to (vai + câu), để tạo giọng sẵn trước khi học sinh bấm loa.
// Chạy:  node tools/tts/collect.mjs [file-ra.json]      (cần Chrome; đặt CHROME_PATH nếu không ở chỗ mặc định)
// Ba nguồn, gộp lại và bỏ trùng:
//   1. duyệt dữ liệu: câu hỏi, lời dẫn đề, lượt Lab (chạy nhiều lần vì có ngẫu nhiên), thẻ từ, từ vựng, Nhớ 1 phát, Đọc trước, Nói và viết ra
//   2. mở từng trang: lấy chữ trong các nút loa (data-say...) và câu bấm-để-nghe trong bài học
//   3. nghe lén TTS.speak trong lúc mở trang: câu nào web thật sự gửi đi đọc thì ghi lại
// Kèm thống kê: bao nhiêu file Kokoro cũ (data/audio-index.js) được tìm lại → biết danh sách có sót không.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.argv[2] || path.join(ROOT, 'tools/tts/lines.json');
const CHROME = process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
const LAB_RUNS = +process.env.LAB_RUNS || 40;   // số lần tạo lượt cho mỗi Lab (để gom hết các tổ hợp ngẫu nhiên)

// ---- máy chủ tĩnh tạm thời cho thư mục repo
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(d);
  });
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage(); await page.setViewport({ width: 1400, height: 900 });
page.on('dialog', d => d.dismiss());
const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 160)));
await page.goto(BASE + '/#/about', { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 2500));

// ---- công cụ chung trong trang: thêm câu (tách "(A) ..." thành "A." + câu, như TTS.files), nghe lén TTS.speak
await page.evaluate(() => {
  const out = window.__tts = new Map(), norm = X.TTS.norm;
  window.__add = (role, t, src) => {
    if (t == null) return; t = norm(String(t)); if (!/[A-Za-z]/.test(t)) return;
    const m = t.match(/^\(?([A-D])[).]\s+(.+)$/);
    (m ? [m[1] + '.', m[2]] : [t]).forEach(x => { const k = role + '|' + x; if (!out.has(k)) out.set(k, { role, text: x, src }); });
  };
  X.TTS.speak = async (t, o = {}) => { window.__add(o.role || (o.sex === 'M' ? 'M' : 'W'), t, 'speak'); };   // giống cách TTS.speak chọn vai
  X.TTS.play = async (lines = []) => { lines.forEach(L => window.__add(L.s || 'W', L.t, 'speak')); return true; };
});

// ---- 1. duyệt dữ liệu
const dataStats = await page.evaluate(async runs => {
  const add = window.__add, line = (a, src) => a && add(a.s || 'W', a.t, src), N = {};
  const count = (src, f) => { const b = window.__tts.size; try { f(); } catch (e) { console.warn(src, e); } N[src] = window.__tts.size - b; };
  const items = [...(X.BANK || []), ...(window.EXAM_EXTRA || [])];
  count('câu hỏi', () => items.forEach(i => (i.audio || []).forEach(a => line(a, 'item'))));
  count('lời dẫn đề', () => [...X.EXAMS, ...(X.PT || [])].filter(e => e.part <= 4).forEach(e => { const its = X.examItems(e);
    if (e.part >= 3) { let k = 0; while (k < its.length) { const set = its[k].set; let j = k; while (j + 1 < its.length && its[j + 1].set === set) j++;
      add('N', `Questions ${e.start + k} through ${e.start + j} refer to the following ${e.part === 3 ? 'conversation' : 'talk'}.`, 'exam'); k = j + 1; }
      its.forEach((it, k) => add('N', `Number ${e.start + k}. ${it.prompt}`, 'exam')); }
    else its.forEach((it, k) => add('N', `Number ${e.start + k}.`, 'exam')); }));
  count('Lab', () => Object.values(X.LABS || {}).forEach(L => { for (let i = 0; i < runs; i++) {
    let rs = []; try { rs = L.kind === 'pic' ? X._dev.picRounds(L) : X._dev.rounds(L); } catch (e) {}
    (rs || []).forEach(R => { (R.audio || []).forEach(a => { line(a, 'lab'); if (a.s === 'W' || a.s === 'M') add(a.s === 'W' ? 'M' : 'W', a.t, 'lab'); }); if (R.say) add('W', R.say, 'lab'); (R.lines || []).forEach(a => line(a, 'lab')); }); } }));
  // thư viện, thẻ từ...: duyệt đệ quy, nhận lời thoại ở mọi dạng (audio [{s,t}], dlg [[s,t]], say + sp, đáp án đọc to ao + o)
  const ROLES = new Set(['W', 'M', 'Q', 'N', 'A', 'S', 'SM', 'K', 'M2']);
  const walk = (o, src, d = 0) => { if (!o || typeof o !== 'object' || d > 12) return;
    if (Array.isArray(o)) { o.forEach(x => walk(x, src, d + 1)); return; }
    if (ROLES.has(o.s) && typeof o.t === 'string') add(o.s, o.t, src);
    if (Array.isArray(o.dlg)) o.dlg.forEach(x => Array.isArray(x) && ROLES.has(x[0]) && add(x[0], x[1], src));
    if (typeof o.say === 'string') add(ROLES.has(o.sp) ? o.sp : 'W', o.say, src);
    if (o.ao && Array.isArray(o.o)) o.o.forEach((x, j) => typeof x === 'string' && add('M', `(${'ABCD'[j]}) ${x}`, src));
    Object.values(o).forEach(v => v && typeof v === 'object' && walk(v, src, d + 1)); };
  count('thẻ từ + thư viện', () => ['LIBDECK', 'P1LIB', 'RICH', 'NGOP_SETS', 'NGOP_STEPS', 'AHA', 'CLOZE', 'UNITS', 'PATH', 'SKILLS', 'LAYERS', 'CONF'].forEach(k => walk(window[k], 'lib')));
  count('từ vựng', () => (X.VOCAB || []).forEach(w => { const sp = w.w.replace(/\.\.\.|…/g, ' ').split(' / ')[0];
    add('W', sp, 'vocab'); add('W', w.w.split(' / ')[0].replace(/\.\.\.|…/g, '').replace(/\s+/g, ' ').trim(), 'vocab'); (w.ex || []).forEach(e => add('W', typeof e === 'string' ? e : e.en, 'vocab')); }));
  count('Nhớ 1 phát', () => (window.REEL || []).forEach(w => { try { const R = X.reelLines(w); R.en.forEach(([s, t]) => add(s, t, 'reel')); (R.vi || []).forEach(t => add('VI', t, 'reel-vi')); } catch (e) {} }));
  count('Đọc trước', () => (window.DOCREAD || []).forEach(d => { (d.gl || []).forEach(g => add('W', g.t, 'doc'));
    d.paras.forEach(p => { p.en.split(/(?<=[.!?”])\s+(?=[A-Z“—])/).forEach(s => add('W', s, 'doc')); (p.en.match(/[A-Za-z][A-Za-z'’-]*/g) || []).forEach(w => w.length >= 3 && add('W', w.replace(/-$/, ''), 'doc')); }); }));
  count('Nói và viết ra', () => { (window.OUT_TR || []).forEach(x => add('W', x.en, 'out'));
    (window.OUT_PARA || []).forEach(x => Object.values(x).forEach(v => typeof v === 'string' && v.length < 300 && !/[à-ỹđ]/i.test(v) && add('W', v, 'out'))); });
  return N;
}, LAB_RUNS);

// ---- 2 + 3. mở từng trang, gom nút loa / câu bấm-để-nghe, và câu web tự đọc khi mở trang
const routes = await page.evaluate(() => {
  const H = ['/about', '/today', '/coach', '/errors', '/fulltest', '/lab', '/library', '/ngop', '/ngop/hoc', '/path', '/progress', '/settings', '/skills', '/tests', '/vocab', '/vocab/nho', '/output', '/output/so', '/doc'];
  X.EXAMS.forEach(e => H.push('/exam/' + e.id)); Object.keys(X.LABS).forEach(k => H.push('/lab/' + k));
  (X.PARTS || []).forEach(p => { H.push('/path/' + p.k, '/library/' + p.k); try { X.buildPath(p.k).forEach(u => { H.push('/unit/' + u.id); u.stations.forEach(s => H.push(s.type === 'lesson' ? '/lesson/' + s.ref : '/unit/' + u.id + '/' + s.k)); }); } catch (e) {} });
  (X.TESTS || []).forEach(t => H.push('/test/' + t.id)); (window.NGOP_SETS || []).forEach(s => s.id && H.push('/ngop/bo/' + s.id));
  (window.DOCREAD || []).forEach(d => H.push('/doc/' + d.id));
  return [...new Set(H)];
});
const seen = new Set(), queue = [...routes];
for (const h of queue) {
  if (seen.has(h)) continue; seen.add(h);
  await page.evaluate(x => { location.hash = '#' + x; }, h); await new Promise(r => setTimeout(r, 250));
  // bài học: khung có ngay nhưng nội dung tải sau → chờ tới khi có câu bấm-để-nghe
  if (/^\/lesson\//.test(h)) await page.waitForFunction(() => document.querySelector('#ls-body [data-sayt]'), { timeout: 4000 }).catch(() => {});
  else if (/^\/library/.test(h)) await new Promise(r => setTimeout(r, 600));
  const links = await page.evaluate(() => {
    document.querySelectorAll('[data-say],[data-sayw],[data-say2]').forEach(el => window.__add('W', el.dataset.say ?? el.dataset.sayw ?? el.dataset.say2, 'page'));
    document.querySelectorAll('[data-sayt]').forEach(el => window.__add('W', el.dataset.sayt, 'lesson'));
    // câu bấm-để-nghe trong bài học (views.js): cùng điều kiện lọc
    document.querySelectorAll('#ls-body td, #ls-body li, #ls-body p').forEach(el => { const t = el.textContent.trim();
      if (t.length > 3 && t.length < 160 && /^[A-Z"“'(]/.test(t) && !/[à-ỹđ]/i.test(t.replace(/\(.*?\)/g, ''))) window.__add('W', t.replace(/\(.*?\)/g, ''), 'lesson'); });
    return [...document.querySelectorAll('#view a[href^="#/"]')].map(a => a.getAttribute('href').slice(1));
  });
  links.filter(l => /^\/(lesson|unit|doc|output|library|ngop)/.test(l) && !seen.has(l)).forEach(l => queue.push(l));
}

// ---- kết quả + so với file Kokoro cũ
const res = await page.evaluate(() => {
  const H = new Set(String(window.AUDIO_HAVE || '').split(/\s+/).filter(Boolean)), L = [...window.__tts.values()];
  const found = new Set(L.map(x => X.TTS.key(x.role, x.text)).filter(k => H.has(k)));
  const bySrc = {}; L.forEach(x => { bySrc[x.src] = (bySrc[x.src] || 0) + 1; });
  return { lines: L.sort((a, b) => (a.role + a.text).localeCompare(b.role + b.text)), oldTotal: H.size, oldFound: found.size, bySrc };
});
const chars = res.lines.reduce((a, x) => a + x.text.length, 0);
fs.writeFileSync(OUT, JSON.stringify(res.lines.map(({ role, text }) => ({ role, text }))));
console.log(JSON.stringify({ pages: seen.size, lines: res.lines.length, chars, oldFound: `${res.oldFound}/${res.oldTotal}`, data: dataStats, bySrc: res.bySrc, roles: res.lines.reduce((o, x) => (o[x.role] = (o[x.role] || 0) + 1, o), {}), pageErrors: errs.length, out: path.relative(ROOT, OUT) }, null, 1));
await browser.close(); server.close();
