// TOOEZ - xem các câu học sinh gặp mà chưa có giọng Chirp (web đã báo về /miss), và tạo bù nếu muốn.
// Chạy:  TTS_CI_TOKEN=... node tools/tts/misses.mjs          liệt kê
//        TTS_CI_TOKEN=... node tools/tts/misses.mjs --gen    tạo giọng cho tất cả (tạo xong thì máy chủ tự xoá khỏi danh sách)
//        TTS_CI_TOKEN=... node tools/tts/misses.mjs --clear  xoá cả danh sách (khi toàn câu rác)
// Không tự tạo trong CI: danh sách này do trình duyệt bất kỳ gửi lên, nên người xem qua trước rồi mới tạo.
const URL_ = (process.env.TTS_URL || 'https://tts.2die429.com').replace(/\/$/, '');
const TOKEN = process.env.TTS_CI_TOKEN;
if (!TOKEN) { console.error('Thiếu TTS_CI_TOKEN'); process.exit(2); }
const H = { 'x-ci-token': TOKEN };

const m = await (await fetch(URL_ + '/misses', { headers: H })).json();
console.log(`${m.count} câu bị lọt:`);
m.items.sort((a, b) => a.at.localeCompare(b.at)).forEach(x => console.log(`  ${x.at.slice(0, 16)}  ${x.role.padEnd(3)} ${x.text}${x.page ? '   (' + x.page + ')' : ''}`));
if (process.argv.includes('--clear')) { console.log(await (await fetch(URL_ + '/misses', { method: 'DELETE', headers: H })).text()); process.exit(0); }
if (!process.argv.includes('--gen') || !m.count) process.exit(0);

let made = 0, fail = 0;
for (const x of m.items) {
  const r = await fetch(URL_ + '/ci', { method: 'POST', headers: { ...H, 'content-type': 'application/json' }, body: JSON.stringify({ role: x.role, text: x.text }) });
  if (r.ok) made++; else { fail++; console.log(`  lỗi ${r.status}: ${x.role}|${x.text.slice(0, 60)} ${(await r.text()).slice(0, 120)}`); if (r.status === 429) break; }
}
console.log(`Tạo ${made}, lỗi ${fail}`);
