// Mã file audio của một câu. PHẢI giống hệt TTS.key2 trong js/core.js: web tự tính mã để tải thẳng file,
// không cần hỏi server. Đổi bảng giọng (VOICES) hoặc cách đặt mã → tăng VER để không phát nhầm file cũ.
export const VER = 'v2';
export const norm = t => String(t).replace(/\s+/g, ' ').trim();
// cyrb53: băm 53 bit, đủ để 1 triệu câu gần như không bao giờ trùng mã (FNV 32 bit cũ thì có)
const cyrb53 = (s, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
export const keyOf = (role, text) => VER + '/' + cyrb53(role + '|' + norm(text)).toString(16).padStart(14, '0');
