// TOOEZ - tạo giọng cho mọi câu trong danh sách (từ collect.mjs) mà R2 chưa có.
// Chạy:  TTS_CI_TOKEN=... node tools/tts/generate.mjs [lines.json] [--dry]
//   --dry   chỉ đếm câu thiếu và số ký tự sẽ tốn, không tạo
// Tự dừng trước khi vượt hạn mức tháng: tự đếm ký tự đã gửi (bộ đếm trên server có thể đếm hụt khi chạy song song).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keyOf } from '../../tts-worker/src/key.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), DRY = args.includes('--dry');
const FILE = args.find(a => !a.startsWith('--')) || path.join(HERE, 'lines.json');
const URL_ = (process.env.TTS_URL || 'https://tts.2die429.com').replace(/\/$/, '');
const TOKEN = process.env.TTS_CI_TOKEN;
const PAR = +process.env.TTS_PARALLEL || 4;
if (!TOKEN) { console.error('Thiếu TTS_CI_TOKEN'); process.exit(2); }

const lines = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const H = { 'x-ci-token': TOKEN };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pool = async (list, n, fn) => { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const k = i++; await fn(list[k], k); } })); };

// 1. câu nào chưa có trên R2
const missing = [];
await pool(lines, 16, async x => {
  const r = await fetch(`${URL_}/a/${keyOf(x.role, x.text)}.mp3`, { method: 'HEAD' });
  if (r.status === 404) missing.push(x); else if (!r.ok) throw new Error(`HEAD ${r.status} cho ${x.role}|${x.text}`);
});
const need = missing.reduce((a, x) => a + x.text.length, 0);
const u = await (await fetch(URL_ + '/usage', { headers: H })).json();
const budget = u.cap - u.chars;
console.log(`Tổng ${lines.length} câu · thiếu ${missing.length} câu = ${need} ký tự · tháng ${u.month} đã dùng ${u.chars}/${u.cap}, còn ${budget}`);
if (DRY || !missing.length) process.exit(0);

// 2. tạo, dừng khi sắp chạm trần
let sent = 0, made = 0, fail = 0, stop = false; const errs = [];
const t0 = Date.now();
await pool(missing, PAR, async x => {
  if (stop) return;
  if (sent + x.text.length > budget) { stop = true; return; }
  sent += x.text.length;
  for (let tries = 0; tries < 4; tries++) {
    const r = await fetch(URL_ + '/ci', { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ role: x.role, text: x.text }) });
    if (r.ok) { made++; break; }
    const e = await r.text();
    if (r.status === 429 && /trần/.test(e)) { stop = true; errs.push(e); return; }
    if (r.status >= 500 || r.status === 429) { await sleep(1000 * 2 ** tries); continue; }   // Google bận / lỗi tạm: thử lại
    fail++; errs.push(`${r.status} ${x.role}|${x.text.slice(0, 60)}: ${e.slice(0, 200)}`); break;
  }
  if ((made + fail) % 200 === 0) console.log(`  ${made + fail}/${missing.length} · ${sent} ký tự · ${Math.round((Date.now() - t0) / 1000)} giây`);
});
console.log(`Xong: tạo ${made}, lỗi ${fail}, đã gửi ${sent} ký tự${stop ? ' · DỪNG vì sắp chạm trần tháng' : ''}`);
errs.slice(0, 20).forEach(e => console.log('  ' + e));
process.exit(fail || stop ? 1 : 0);
