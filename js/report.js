/* TOOEZ - Báo cáo sau bài chuẩn đầu vào 200 câu + lộ trình theo tuần tới ngày thi.
   Mọi con số tính từ nhãn của từng câu trong data/placement.js (dạng câu, bẫy, paraphrase, vị trí trong đoạn)
   và bản ghi gọn S().placement[i] = { a: đáp án đã chọn, c: s/u/g (chắc/phân vân/lụi), t: giây, aim, date, min }. */
'use strict';
(() => {
const { $, $$, esc, icon, pct } = X;
const S = () => X.S();
const PN = { 1: 'Mô tả tranh', 2: 'Hỏi đáp', 3: 'Hội thoại', 4: 'Bài nói', 5: 'Điền câu', 6: 'Điền đoạn văn', 7: 'Đọc hiểu' };
const QT = {   // tên dạng câu theo Part
  1: { person: 'Tranh một người', people: 'Tranh nhiều người', object: 'Tranh tả vật, cảnh' },
  2: { wh: 'Câu hỏi WH- (Who, When, Where...)', yn: 'Câu hỏi Yes/No', tag: 'Câu hỏi đuôi', choice: 'Câu hỏi lựa chọn (A or B)', stmt: 'Câu trần thuật', req: 'Lời nhờ, gợi ý, đề nghị' },
  3: { main: 'Chủ đề, mục đích', who: 'Người nói, nơi chốn', detail: 'Chi tiết', req: 'Yêu cầu, gợi ý, đề nghị', next: 'Việc sẽ làm tiếp', graphic: 'Kết hợp bảng biểu', implied: 'Hàm ý câu nói (ngụ ý)' },
  5: { wordform: 'Từ loại', vocab: 'Từ vựng', grammar: 'Ngữ pháp' },
  6: { conn: 'Từ nối, liên từ', pron: 'Đại từ', verb: 'Thì của động từ', vocab: 'Từ vựng', wordform: 'Từ loại', participle: 'Phân từ, rút gọn', insert: 'Điền cả câu' },
  7: { main: 'Ý chính, mục đích', detail: 'Chi tiết', infer: 'Suy luận', not: 'Câu NOT / TRUE', syn: 'Từ đồng nghĩa', insert: 'Chèn câu [1]-[4]', implied: 'Hàm ý (tin nhắn)', connect: 'Ghép thông tin 2-3 văn bản' },
};
QT[4] = QT[3];
const GP = { adj: 'tính từ', adv: 'trạng từ', noun: 'danh từ', verb: 'động từ', pron: 'đại từ', tense: 'thì', prep: 'giới từ', participle: 'phân từ', conn: 'liên từ, câu điều kiện', passive: 'bị động', rel: 'mệnh đề quan hệ', compare: 'so sánh', agree: 'hòa hợp chủ ngữ - động từ', gerund: 'V-ing sau giới từ' };
const TRAP = { rep: 'lặp từ / từ quen tai', sound: 'từ gần âm', type: 'sai dạng câu hỏi', spk: 'nhầm người nói', old: 'chi tiết có trong bài nhưng sai chỗ', lit: 'hiểu theo nghĩa đen', opp: 'ngược ý', act: 'sai hành động, vật', being: '"is being" khi không ai làm', assoc: 'từ liên tưởng cùng chủ đề' };
const L = (k, t) => `<b>${'ABCD'[k] || '-'}</b>${t ? ' ' + esc(t) : ''}`;
const fmtD = d => { const x = new Date(d); return `${x.getDate()}/${x.getMonth() + 1}`; };
const has = h => !/#\/doc/.test(h) || !!window.DOCREAD;   // tính năng chưa có ở bản đang chạy thì bỏ link

/* ================= tính số liệu ================= */
function analyze(rec) {
  const items = X.ptItems();
  if (items.length !== 200) return null;
  const R = items.map((it, k) => { const ch = rec.a[k]; return { it, k, n: it.num, ch: ch == null ? null : ch, ok: ch === it.answer, c: rec.c[k] || '', t: rec.t[k] || 0, tr: ch != null && ch !== it.answer && it.trap ? it.trap[ch] || null : null }; });
  const by = f => R.filter(f), acc = rs => rs.length ? rs.filter(r => r.ok).length / rs.length : 0, wr = rs => rs.filter(r => !r.ok);
  const part = p => by(r => r.it.part === p);
  const parts = [1, 2, 3, 4, 5, 6, 7].map(p => { const rs = part(p); return { p, n: rs.length, ok: rs.filter(r => r.ok).length }; });
  const rawL = parts.filter(x => x.p <= 4).reduce((a, x) => a + x.ok, 0), rawR = parts.filter(x => x.p >= 5).reduce((a, x) => a + x.ok, 0);
  const estL = X.convScore(rawL, 'L'), estR = X.convScore(rawR, 'R'), est = estL + estR;
  // điểm mục tiêu → số câu đúng cần ở mỗi phần (Nghe thường cao hơn Đọc khoảng 30-60 điểm ở mức 600-850)
  const aim = rec.aim || 700, tL = Math.min(495, Math.round((aim / 2 + Math.min(40, Math.max(10, (aim - 400) / 10))) / 5) * 5), tR = Math.max(5, aim - tL);
  const need = (score, k) => { for (let x = 0; x <= 100; x++) if (X.convScore(x, k) >= score) return x; return 100; };
  const nL = need(tL, 'L'), nR = need(tR, 'R');
  const qtRows = p => { const g = {}; part(p).forEach(r => { const k = r.it.qt; (g[k] ||= []).push(r); }); return Object.entries(g).map(([k, rs]) => ({ k, name: (QT[p] || {})[k] || k, n: rs.length, ok: rs.filter(r => r.ok).length, wrong: wr(rs) })); };
  // ---- các nhóm kỹ năng xuyên Part
  const pp = by(r => r.it.pp), implied = by(r => r.it.qt === 'implied');
  const p34 = by(r => r.it.part === 3 || r.it.part === 4);
  const posW = [1, 2, 3].map(q => wr(p34.filter(r => r.it.pos === q)).length), posN = [1, 2, 3].map(q => p34.filter(r => r.it.pos === q).length);
  const lastSets = p34.filter(r => (r.it.part === 3 && r.it.setN >= 10) || (r.it.part === 4 && r.it.setN >= 8));
  const p7 = part(7), p7a = p7.filter(r => r.n < 186), p7z = p7.filter(r => r.n >= 186);
  const tAvg = rs => rs.length ? rs.reduce((a, r) => a + r.t, 0) / rs.length : 0;
  const trapW = R.filter(r => r.tr && ['rep', 'sound', 'type', 'spk', 'assoc'].includes(r.tr));
  const rel = by(r => (r.it.part === 5 && r.it.clue && r.it.qt === 'vocab') || (r.it.part === 6 && (r.it.qt === 'conn' || r.it.qt === 'insert')) || (r.it.part === 7 && (r.it.qt === 'insert' || r.it.qt === 'connect')) || (r.it.part === 5 && r.it.gp === 'conn'));
  const gram = by(r => (r.it.part === 5 && r.it.qt !== 'vocab') || (r.it.part === 6 && ['pron', 'verb', 'wordform', 'participle'].includes(r.it.qt)));
  const p2 = part(2), multi = p7.filter(r => r.it.doc !== 'single');
  const conf = { sureW: R.filter(r => r.c === 's' && !r.ok), guess: R.filter(r => r.c === 'g'), guessOk: R.filter(r => r.c === 'g' && r.ok), unsure: R.filter(r => r.c === 'u'), marked: R.filter(r => r.c).length, blank: R.filter(r => r.ch == null) };
  const endLost = Math.max(0, posW[2] - (posW[0] + posW[1]) / 2) + Math.max(0, Math.round((acc(p7a) - acc(p7z)) * p7z.length));
  const groups = { pp, implied, p2, rel, gram, multi, p34, p7, p7a, p7z, lastSets };
  return { rec, items, R, parts, rawL, rawR, estL, estR, est, aim, tL, tR, nL, nR, qtRows, posW, posN, tAvg, trapW, conf, endLost, acc, wr, part, groups };
}

/* ================= chuyên đề: chọn lỗi lớn nhất ================= */
const TOPICS = {
  para: { t: 'Nhận ra paraphrase: nghe và đọc theo Ý, không theo TỪ', short: 'Không nhận ra cách nói lại (paraphrase)',
    rs: A => A.groups.pp, why: (A, w, n) => `Trong bài có <b>${n}</b> câu mà đáp án đúng là cách nói khác của đúng câu trong bài nghe / bài đọc. Bạn sai <b>${w}</b> câu loại này. Đề thật có khoảng 60-70 câu như vậy, nhiều nhất ở Part 3, 4 và 7.`,
    steps: ['Đọc câu hỏi, gạch ý cần tìm (ai làm gì, vì sao, ở đâu). Gạch Ý, không chỉ gạch từ.', 'Đoán trước đáp án có thể bị nói lại thế nào: từ chung hơn (copier → equipment), đổi từ loại (delayed → postponed), đổi cả câu (sold our last copy → has run out).', 'Đến đoạn chứa thông tin, tóm lại bằng 2-3 chữ tiếng Việt trong đầu: "hết hàng", "miễn phí ship".', 'So 4 đáp án với Ý vừa tóm. Đáp án lặp nguyên từ trong bài thì kiểm tra kỹ, vì nó hay là bẫy.', 'Chữa bài: ghi cặp "câu trong bài ↔ đáp án" vào sổ, ôn lại theo nhóm nghĩa.'],
    table: ['Kiểu nói lại', 'Trong bài', 'Đáp án', [['Cụ thể → chung', 'the copier, the printer', 'some equipment'], ['Hành động → mục đích', 'sign up for a membership', 'join the facility'], ['Phủ định → khẳng định', "won't connect to the network", 'cannot access a network'], ['Đổi từ đồng nghĩa', 'the flight was delayed', 'has been postponed'], ['Gom cả câu thành một ý', 'started as one stall... now has three shops', 'it has grown over time'], ['Đổi vai câu', 'take the delivery charge off your bill', 'waive a delivery fee']]],
    learn: [['#/unit/c1', 'Bài học: Giải mã paraphrase', 'Học 6 kiểu nói lại hay gặp'], ['#/lab/para-pairs', 'Lab: Paraphrase Sprint', 'Mỗi ngày 10 phút'], ['#/lab/p34-pairs', 'Lab: Cặp paraphrase Part 3-4', 'Luyện nghe theo ý'], ['#/unit/p7u10', 'Bài học: Đáp án "đổi áo" Part 7', ''], ['#/skill/para', 'Đo kỹ năng paraphrase', 'Xem tỉ lệ đúng tăng theo tuần']] },
  implied: { t: 'Câu ngụ ý: câu này đang LÀM gì, không phải câu này NÓI gì', short: 'Hiểu sai câu ngụ ý (hàm ý)',
    rs: A => A.groups.implied, why: (A, w, n) => `Dạng "What does the man imply when he says...", "Why does the speaker say...". Bài có ${n} câu, bạn sai <b>${w}</b>. Đề thật có khoảng 7-8 câu dạng này (2-3 ở Part 3, 3 ở Part 4, 2 ở Part 7), tức 35-40 điểm.`,
    steps: ['Đọc câu hỏi, gạch câu trích dẫn, ghi nghĩa đen 1-3 chữ bên cạnh.', 'Nghe hoặc đọc câu NGAY TRƯỚC: người kia vừa mời, hỏi, gợi ý hay phàn nàn? Câu trích dẫn là phản ứng với câu đó.', 'Nghe hoặc đọc câu NGAY SAU: có because, so, but, that\'s why không? Đó là lời giải thích.', 'Gọi tên chức năng: từ chối, đồng ý, cảnh báo, trấn an, thúc giục, gợi ý, sửa thông tin, lo lắng.', 'Loại đáp án hiểu theo nghĩa đen và đáp án lặp nguyên từ trong câu trích dẫn. Chọn đáp án mô tả đúng chức năng.'],
    table: ['Câu nói', 'Ngữ cảnh trước nó', 'Ngụ ý thật', [['"I\'ve got a presentation at ten."', 'Phải chờ 1 tiếng', 'Không chờ được'], ['"The caterer needs the number by noon."', 'Nhiều người chưa trả lời', 'Phải làm ngay'], ['"Our staff there already have the list."', 'Lo lỡ chuyến nối', 'Trấn an'], ['"It\'s designed for people with no technical background."', 'Lo học hệ thống mới', 'Dễ thôi, đừng lo'], ['"My cousin runs a print shop."', 'Bên in bị trễ', 'Gợi ý chỗ khác giúp được'], ['"It was just replaced last month."', 'Lời mời dịch vụ', 'Từ chối: không cần']]],
    learn: [['#/unit/p3u6', 'Bài học: Câu ngụ ý và thái độ', ''], ['#/lab/implied', 'Lab: Câu ngụ ý', '15 câu mỗi tuần, nói to 5 bước'], ['#/unit/c2', 'Bài học: Ngữ cảnh và chức năng câu nói', ''], ['#/lab/p34-attitude', 'Lab: Thái độ và hành động tiếp theo', ''], ['#/unit/p7u8', 'Bài học: Ý định người viết, tin nhắn', 'Dạng ngụ ý ở Part 7']] },
  p2: { t: 'Part 2: bẫy quen tai và câu trả lời gián tiếp', short: 'Chọn đáp án quen tai ở Part 2',
    rs: A => A.groups.p2, why: (A, w, n) => { const ind = A.groups.p2.filter(r => r.it.indirect), tw = A.groups.p2.filter(r => r.tr).length; return `Part 2 đúng <b>${n - w}/${n}</b>. Câu có đáp án gián tiếp đúng ${ind.filter(r => r.ok).length}/${ind.length}. Trong ${w} câu sai, <b>${tw}</b> lần bạn chọn đúng phương án gài bẫy (lặp từ, gần âm, sai dạng câu hỏi).`; },
    steps: ['Bắt 3-4 từ đầu câu hỏi: Who / When / Where, Do / Is, hay câu trần thuật, lời nhờ.', 'Loại ngay đáp án sai dạng: câu WH mà trả lời Yes/No; câu hỏi lựa chọn mà trả lời Yes.', 'Nghi ngờ đáp án lặp lại từ hoặc có âm giống từ trong câu hỏi (jam / jamming, slid / slides).', 'Giữ lại đáp án gián tiếp: "Let me check", "That hasn\'t been decided", "It\'s already booked".', 'Chọn câu nào là một phản hồi tự nhiên của người thật trong tình huống đó.'],
    table: ['Kiểu trả lời gián tiếp', 'Ví dụ', 'Ý thật', [['Chưa biết, để kiểm tra', 'Let me check its Web site.', 'Chưa có câu trả lời'], ['Chưa quyết định', "That hasn't been decided yet.", 'Hợp với mọi câu WH'], ['Từ chối kèm lý do', "It's already booked that afternoon.", 'Không đồng ý gợi ý'], ['Sửa thông tin', "Actually, my flight's on Sunday.", 'Ý người hỏi chưa đúng'], ['Hỏi lại', 'Have you met her yet?', 'Tiếp chuyện'], ['Ngụ ý lựa chọn', "It's only five minutes from here.", 'Chọn đi bộ']]],
    learn: [['#/unit/p2u9', 'Bài học: Trả lời gián tiếp', ''], ['#/unit/p2u10', 'Bài học: Bẫy gần âm và lặp từ', ''], ['#/lab/p2-responses', 'Lab: Câu trả lời gián tiếp', 'Mỗi ngày 10 phút'], ['#/lab/p2-100', 'Lab: 100 câu Part 2 có phân tích bẫy', ''], ['#/lab/p2-listen', 'Lab: Phản xạ nghe Part 2', '']] },
  end: { t: 'Giữ nhịp đến câu cuối của mỗi đoạn và cuối bài', short: 'Rơi điểm ở cuối đoạn, cuối bài',
    rs: A => [...A.groups.p34.filter(r => r.it.pos === 3), ...A.groups.p7z], why: A => `Ở Part 3-4, câu hỏi thứ 1 sai <b>${A.posW[0]}</b>/${A.posN[0]}, câu thứ 2 sai <b>${A.posW[1]}</b>/${A.posN[1]}, câu thứ 3 sai <b>${A.posW[2]}</b>/${A.posN[2]}. Part 7: 39 câu đầu đúng ${pct(A.groups.p7a.filter(r => r.ok).length, A.groups.p7a.length)}%, 15 câu cuối đúng ${pct(A.groups.p7z.filter(r => r.ok).length, A.groups.p7z.length)}%. Điểm rơi ở cuối là do sức bền và cách giữ nhịp, không phải do thiếu kiến thức.`,
    steps: ['Trong lúc audio đọc đoạn hướng dẫn và 3 câu hỏi của đoạn trước, đọc trước 3 câu hỏi của đoạn sắp nghe.', 'Nghe đến chữ cuối cùng. Câu hỏi thứ 3 (việc sẽ làm, lời đề nghị, bảng biểu) thường nằm ở 1-2 câu thoại cuối.', 'Chỉ chuyển sang đọc câu hỏi đoạn sau khi đoạn đang nghe đã kết thúc. Không kịp thì đoán, rồi đi tiếp.', 'Part 7 chia giờ: Part 5 ~11 phút, Part 6 ~9 phút, còn ~55 phút cho Part 7. Đặt mốc: câu 176 trước phút 45 của phần Đọc.', 'Luyện theo khối có bấm giờ: 45 phút nghe liền, 75 phút đọc liền, mỗi tuần ít nhất một lần.'],
    table: ['Dấu hiệu', 'Vì sao mất điểm', 'Sửa bằng', [['Sai câu 3 của đoạn', 'Buông tai trước khi hết đoạn', 'Nghe đến chữ cuối'], ['Sai đoạn cuối Part 4', 'Hết tập trung cuối phần Nghe', 'Luyện khối 45 phút'], ['Lụi 10-15 câu cuối Part 7', 'Hết giờ', 'Chia giờ, mốc câu 176'], ['Đọc câu hỏi đoạn sau quá sớm', 'Mất thông tin cuối đoạn trước', 'Chờ hết đoạn rồi mới chuyển']]],
    learn: [['#/unit/p3u1', 'Bài học: Đọc trước câu hỏi', ''], ['#/lab/scan34', 'Lab: Đọc lướt câu hỏi Part 3-4', 'Tăng tốc đọc trước'], ['#/lab/signals', 'Lab: Tín hiệu trong bài nghe', ''], ['#/unit/p7u2', 'Bài học: Đọc câu hỏi trước (Part 7)', ''], ['#/tests', 'Đề từng Part có bấm giờ', 'Mỗi tuần 1 khối đề']] },
  rel: { t: 'Quan hệ giữa các câu: từ nối, manh mối ngữ cảnh, câu điền', short: 'Không dùng quan hệ giữa các câu, các vế',
    rs: A => A.groups.rel, why: (A, w, n) => `Nhóm câu phải hiểu quan hệ giữa hai câu hoặc hai vế (từ nối Part 6, câu từ vựng có manh mối Part 5, chèn câu, ghép văn bản): đúng <b>${n - w}/${n}</b>. Những câu chỉ cần nhìn một chỗ trống thì bạn làm tốt hơn hẳn.`,
    steps: ['Đọc hết câu chứa chỗ trống VÀ câu ngay trước nó. Đừng chọn khi mới đọc nửa câu.', 'Gọi tên quan hệ giữa hai ý: nguyên nhân - kết quả, đối lập, bổ sung, điều kiện, ví dụ, thời gian.', 'Chọn từ nối đúng nhóm quan hệ (bảng dưới). Câu từ vựng: tìm manh mối như because, so, after dấu phẩy, dấu chấm phẩy.', 'Câu điền cả câu: tìm từ móc nối (this, these, also, however, the same) với câu trước và câu sau.', 'Đọc lại cả đoạn với đáp án vừa chọn, nghe có trôi không.'],
    table: ['Quan hệ', 'Từ nối hay gặp', 'Bẫy hay gặp', [['Nguyên nhân → kết quả', 'As a result, Consequently, Therefore', 'Nevertheless'], ['Đối lập', 'However, Although, Even so', 'In addition'], ['Bổ sung', 'In addition, Also, Moreover', 'However'], ['Điều kiện', 'if, provided that, as long as, Should you...', 'unless (ngược nghĩa)'], ['Ví dụ', 'For instance, For example', 'In other words'], ['Thay thế', 'Instead, Alternatively', 'Otherwise']]],
    learn: [['#/unit/p6u3', 'Bài học: Từ nối giữa hai câu', ''], ['#/lab/p6-trans', 'Lab: Từ nối, gọi tên chức năng', 'Mỗi ngày 10 phút'], ['#/lab/p6-insert', 'Lab: Điền cả câu, tìm móc nối', ''], ['#/unit/p5u7', 'Bài học: Câu từ vựng, không đoán mò', 'Tìm manh mối trong câu'], ['#/lab/p6-link', 'Lab: Nối câu với câu', '']] },
  gram: { t: 'Vá lỗ hổng ngữ pháp Part 5-6', short: 'Lỗ hổng ngữ pháp, từ loại',
    rs: A => A.groups.gram, why: (A, w, n) => { const g = {}; A.wr(A.groups.gram).forEach(r => { const k = r.it.gp || r.it.qt; g[k] = (g[k] || 0) + 1; }); return `Câu ngữ pháp và từ loại ở Part 5-6 đúng <b>${n - w}/${n}</b>. Sai nhiều nhất: ${Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${GP[k] || (QT[6][k] || k).toLowerCase()} (${v})`).join(', ')}. Đây là nhóm có quy tắc rõ ràng, vá nhanh nhất.`; },
    steps: ['Nhìn 4 đáp án trước: cùng gốc từ khác đuôi → câu từ loại; khác thì / dạng → câu động từ; đại từ, giới từ, liên từ → câu từ chức năng.', 'Xác định chỗ trống đứng ở đâu: trước danh từ, sau mạo từ, sau động từ, đầu câu...', 'Câu động từ: hỏi 4 câu: câu đã có động từ chính chưa? chủ ngữ số ít hay nhiều? chủ động hay bị động (sau có tân ngữ không)? thời gian nào?', 'Áp quy tắc, chọn trong 10-20 giây. Không chắc thì chọn tạm, đánh dấu Phân vân, đi tiếp.', 'Chữa bài: viết lại quy tắc một dòng cho mỗi câu sai và làm lại sau 3 ngày.'],
    table: ['Điểm ngữ pháp', 'Dấu hiệu', 'Quy tắc', [['Từ loại', 'a / the + ___ + danh từ', 'tính từ'], ['Bị động', 'sau chỗ trống không có tân ngữ, có by', 'be + V3'], ['Phân từ rút gọn', 'câu đã có động từ chính', 'V3 (bị động) / V-ing (chủ động)'], ['Đại từ', 'trước danh từ / làm tân ngữ / tự làm', 'her / them / themselves'], ['MĐQH', 'sau dấu phẩy, chỉ vật / sở hữu', 'which / whose'], ['Thì', 'since, next month, by the time', 'HTHT / tương lai / QKHT']]],
    learn: [['#/unit/p5u1', 'Bài học: Từ loại và hậu tố', ''], ['#/unit/p5u3', 'Bài học: Động từ: thì, chủ-vị, bị động', ''], ['#/unit/p5u4', 'Bài học: Đại từ và từ hạn định', ''], ['#/lab/p5-pattern', 'Lab: Khuôn Part 5', 'Mỗi ngày 15 câu'], ['#/lab/p5-cards', 'Lab: Flashcard ngữ pháp', '']] },
  multi: { t: 'Part 7: đọc nhiều văn bản và ghép thông tin', short: 'Yếu ở đoạn kép, đoạn ba của Part 7',
    rs: A => A.groups.multi, why: (A, w, n) => { const s = A.groups.p7.filter(r => r.it.doc === 'single'); return `Đơn văn bản đúng ${s.filter(r => r.ok).length}/${s.length} (${pct(s.filter(r => r.ok).length, s.length)}%), nhiều văn bản chỉ đúng <b>${n - w}/${n}</b> (${pct(n - w, n)}%). Câu sai chủ yếu là câu phải ghép 2 dữ kiện ở 2 văn bản khác nhau.`; },
    steps: ['Đọc câu hỏi trước, đoán nó nằm ở văn bản nào: câu 1-2 thường ở bài 1, câu cuối thường ở bài 2-3.', 'Câu có tên riêng, con số, ngày, điều kiện → khả năng cao phải ghép 2 bài. Gạch dữ kiện ở bài này rồi tìm "nửa còn lại" ở bài kia.', 'Bảng, form, lịch: đọc tiêu đề cột trước, không đọc hết từng ô.', 'Câu NOT: đánh dấu 3 đáp án tìm thấy, còn lại là đáp án.', 'Giữ nhịp: mỗi cụm 5 câu khoảng 5-6 phút. Quá thời gian thì đoán, đánh dấu, làm câu sau.'],
    table: ['Kiểu ghép', 'Bài 1 cho', 'Bài 2 cho', [['Điều kiện + trường hợp', 'giảm giá cho nhóm từ 50 người', 'nhóm có 35 người'], ['Ngày + quy định', 'nộp trong 60 ngày', 'trả 10/2, nộp 20/3'], ['Bảng + mô tả', 'lớp thứ Bảy là Baking Bread', 'gợi ý "lớp cuối tuần"'], ['Loại vé + quyền lợi', 'Q&A chỉ cho vé cả lễ hội', 'anh ấy dùng vé ngày']]],
    learn: [['#/unit/p7u11', 'Bài học: Đoạn kép, đoạn ba', ''], ['#/lab/p7-locate', 'Lab: Định vị bằng chứng', ''], ['#/lab/p7-hunt', 'Lab: Bạn đang săn gì?', 'Đọc câu hỏi trước'], ['#/doc', 'Đọc trước, học sau', 'Đọc bài dài, học từ trong bài'], ['#/lab/p7-trap', 'Lab: Bẫy thông tin cũ', '']] },
};
const topicScore = (A, k) => { const rs = TOPICS[k].rs(A), w = A.wr(rs).length; return { k, w, n: rs.length, gap: k === 'end' ? A.endLost : w - 0.15 * rs.length }; };

/* ================= lộ trình ================= */
// mỗi hạng mục: việc theo tuần (link tới bài học, Lab, đề trên web)
const TASKS = {
  para: [['#/unit/c1', 'Học: Giải mã paraphrase'], ['#/lab/para-pairs', 'Lab Paraphrase Sprint, mỗi ngày 10 phút'], ['#/lab/p34-pairs', 'Lab cặp paraphrase Part 3-4'], ['#/lab/p34-para', 'Lab paraphrase khi nghe'], ['#/unit/p7u10', 'Học: đáp án "đổi áo" Part 7'], ['#/lab/para-restate', 'Lab diễn đạt lại cả câu']],
  implied: [['#/unit/p3u6', 'Học: Câu ngụ ý và thái độ'], ['#/lab/implied', 'Lab Câu ngụ ý, nói to 5 bước'], ['#/unit/c2', 'Học: Chức năng câu nói'], ['#/lab/p34-attitude', 'Lab thái độ, hành động tiếp theo']],
  p2: [['#/unit/p2u9', 'Học: Trả lời gián tiếp'], ['#/lab/p2-responses', 'Lab câu trả lời gián tiếp'], ['#/unit/p2u10', 'Học: Bẫy gần âm, lặp từ'], ['#/lab/p2-100', 'Lab 100 câu Part 2 có phân tích bẫy'], ['#/lab/p2-listen', 'Lab phản xạ nghe Part 2']],
  end: [['#/unit/p3u1', 'Học: Đọc trước câu hỏi Part 3-4'], ['#/lab/scan34', 'Lab đọc lướt câu hỏi'], ['#/lab/signals', 'Lab tín hiệu trong bài nghe'], ['#/unit/p7u2', 'Học: Đọc câu hỏi trước Part 7']],
  rel: [['#/unit/p6u3', 'Học: Từ nối giữa hai câu'], ['#/lab/p6-trans', 'Lab từ nối, gọi tên chức năng'], ['#/unit/p6u5', 'Học: Điền cả câu'], ['#/lab/p6-insert', 'Lab điền cả câu'], ['#/unit/p5u7', 'Học: Câu từ vựng Part 5'], ['#/lab/p6-link', 'Lab nối câu với câu']],
  gram: [['#/unit/p5u3', 'Học: Động từ, thì, bị động'], ['#/lab/p5-pattern', 'Lab khuôn Part 5, 15 câu/ngày'], ['#/unit/p5u1', 'Học: Từ loại và hậu tố'], ['#/unit/p5u4', 'Học: Đại từ, từ hạn định'], ['#/unit/p5u6', 'Học: Mệnh đề quan hệ, so sánh'], ['#/lab/p5-cards', 'Lab flashcard ngữ pháp']],
  multi: [['#/unit/p7u11', 'Học: Đoạn kép, đoạn ba'], ['#/lab/p7-locate', 'Lab định vị bằng chứng'], ['#/doc', 'Đọc trước, học sau: 1 bài dài'], ['#/lab/p7-hunt', 'Lab bạn đang săn gì'], ['#/unit/p7u5', 'Học: Câu NOT / TRUE']],
  p1: [['#/unit/p1u4', 'Học: Trạng thái của vật'], ['#/lab/p1-asp', 'Lab Action - State - Passive'], ['#/lab/p1-words', 'Lab từ vựng tranh']],
  graphic: [['#/unit/p3u8', 'Học: Câu hỏi đồ họa'], ['#/lab/graphic', 'Lab câu hỏi đồ họa']],
  spk: [['#/lab/scan34', 'Lab đọc trước câu hỏi: khoanh man / woman']],
};
const DAILY = [['#/vocab/review', 'Ôn từ đến hạn (Kho từ vựng)', 'mỗi ngày'], ['#/errors/retry', 'Làm lại câu trong Sổ lỗi', '2-3 lần/tuần']];
function plan(A, order, start) {
  const rec = A.rec, today = new Date(start || Date.now()); today.setHours(0, 0, 0, 0);
  const end = rec.date ? new Date(rec.date + 'T00:00:00') : new Date(+today + 56 * 864e5);
  const days = Math.max(7, Math.round((end - today) / 864e5)), W = Math.min(16, Math.max(1, Math.ceil(days / 7)));
  const per = { 30: 2, 60: 3, 90: 4, 120: 4, 180: 5 }[rec.min] || 3;
  const p1n = Math.max(1, Math.round(W * 0.3)), p3n = W >= 3 ? Math.max(1, Math.round(W * 0.25)) : 0, p2n = Math.max(0, W - p1n - p3n);
  // hạng mục ưu tiên: lỗi lớn nhất + nhóm "vá nhanh" (Part 2, ngữ pháp, từ nối) học trước
  const quick = order.filter(k => ['p2', 'gram', 'rel', 'p1'].includes(k)), main = order.filter(k => !quick.includes(k));
  const queue = { 1: [order[0], ...quick.filter(k => k !== order[0]), ...main], 2: [...main, ...quick], 3: [] };
  const used = {}, take = k => { const L = TASKS[k] || []; const i = (used[k] = (used[k] || 0)) % L.length; used[k]++; return L[i]; };
  const parts = [1, 2, 3, 4, 5, 6, 7].map(p => ({ p, a: A.parts[p - 1].ok / A.parts[p - 1].n })).sort((a, b) => a.a - b.a);
  const ex2 = p => X.EXAMS.find(e => e.part === p && !(S().tests[e.id] || []).length) || X.EXAMS.find(e => e.part === p);
  const weeks = [];
  for (let w = 0; w < W; w++) {
    const ph = w < p1n ? 1 : w < p1n + p2n ? 2 : 3, from = new Date(+today + w * 7 * 864e5), to = new Date(Math.min(+end, +today + (w * 7 + 6) * 864e5));
    const tasks = [];
    if (ph < 3) { const q = queue[ph].filter(k => TASKS[k]); for (let i = 0; tasks.length < per && i < 12; i++) { const k = q[(w + i) % q.length]; const t = take(k); if (t && !tasks.some(x => x[0] === t[0]) && has(t[0])) tasks.push([...t, k]); } }
    else { tasks.push(['#/tests', 'Làm 2-3 đề từng Part có bấm giờ, chữa theo 5 bước', 'mock']); const t = take(order[0]); if (t) tasks.push([...t, order[0]]); tasks.push(['#/errors', 'Ôn toàn bộ Sổ lỗi, đọc lại quy tắc đã viết', 'err']); }
    // mốc đo lại: giữa lộ trình và trước ngày thi
    let check = null;
    if (W >= 3 && w === Math.floor(W / 2) - (W >= 6 ? 1 : 0)) { const e = ex2(parts[0].p); if (e) check = [`#/exam/${e.id}`, `Đo lại Part ${e.part} (Part yếu nhất) bằng ${e.n}`]; }
    if (W >= 4 && w === W - 2) { const e = ex2(parts[1].p); if (e) check = [`#/exam/${e.id}`, `Thi thử: ${X.examTitle(e.id)}, rồi các Part còn lại cùng tuần`]; }
    weeks.push({ w: w + 1, ph, from, to, tasks, check });
  }
  return { W, days, weeks, p1n, p2n, p3n, end };
}

/* ================= vẽ ================= */
const bar = (v, max, cls = '', mark) => `<div class="rp-bar ${cls}"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></i>${mark != null ? `<b class="rp-mark" style="left:${Math.min(100, mark)}%"></b>` : ''}</div>`;
const tone = a => a >= 0.8 ? 'sage' : a >= 0.6 ? 'gold' : a >= 0.4 ? 'ember' : 'red';
const nums = rs => rs.length ? rs.map(r => `<a class="rp-n" data-q="${r.n}">${r.n}${r.c === 'g' ? '<sup>L</sup>' : ''}</a>`).join(' ') : '<span class="faint">—</span>';
function ring(est, aim) {
  const R = 52, C = 2 * Math.PI * R, f = est / 990, a = aim / 990;
  return `<svg class="rp-ring" viewBox="0 0 128 128"><circle cx="64" cy="64" r="${R}" class="bg"/><circle cx="64" cy="64" r="${R}" class="fg" stroke-dasharray="${C * f} ${C}" transform="rotate(-90 64 64)"/>
    <line x1="64" y1="${64 - R - 8}" x2="64" y2="${64 - R + 8}" class="aim" transform="rotate(${a * 360} 64 64)"/><text x="64" y="62" class="v">${est}</text><text x="64" y="80" class="s">mục tiêu ${aim}</text></svg>`;
}
function heat(A) {
  return `<div class="rp-heat">${[1, 2, 3, 4, 5, 6, 7].map(p => `<div class="rp-hp"><div class="small faint">P${p}</div><div class="rp-hc">${A.part(p).map(r => `<i class="${r.ch == null ? 'b' : r.ok ? (r.c === 'g' ? 'okg' : 'ok') : r.c === 's' ? 'bad sure' : 'bad'}" title="Câu ${r.n}: ${r.ch == null ? 'bỏ trống' : r.ok ? 'đúng' : 'sai'}${r.c === 'g' ? ' (lụi)' : r.c === 's' ? ' (chắc)' : ''}"></i>`).join('')}</div></div>`).join('')}</div>
    <div class="rp-legend small"><span><i class="ok"></i> Đúng</span><span><i class="okg"></i> Đúng nhưng lụi</span><span><i class="bad"></i> Sai</span><span><i class="bad sure"></i> Chắc mà sai</span><span><i class="b"></i> Bỏ trống</span></div>`;
}
const qtTable = (A, p) => `<table class="dt rp-t"><tr><th>Dạng câu</th><th class="num">Đúng</th><th style="width:30%"></th><th>Câu sai</th></tr>${A.qtRows(p).sort((a, b) => a.ok / a.n - b.ok / b.n).map(x => `<tr><td>${esc(x.name)}</td><td class="num"><span class="pill ${tone(x.ok / x.n)}">${x.ok}/${x.n}</span></td><td>${bar(x.ok, x.n, tone(x.ok / x.n))}</td><td class="small">${nums(x.wrong)}</td></tr>`).join('')}</table>`;
const wrongList = (rs, cols = 'trap') => rs.length ? `<table class="dt rp-t small"><tr><th>Câu</th><th>Đáp án đúng</th><th>Bạn chọn</th><th>${cols === 'pp' ? 'Cặp paraphrase' : 'Vì sao sai'}</th></tr>${rs.map(r => `<tr><td><a class="rp-n" data-q="${r.n}">${r.n}</a></td><td>${L(r.it.answer, r.it.part <= 2 ? '' : r.it.options[r.it.answer])}</td><td>${r.ch == null ? '<span class="faint">bỏ trống</span>' : L(r.ch, r.it.part <= 2 ? '' : r.it.options[r.ch])}</td><td>${cols === 'pp' && r.it.pp ? `“${esc(r.it.pp[0])}” → <b>${esc(r.it.pp[1])}</b>` : r.tr ? `<span class="pill red">Bẫy: ${TRAP[r.tr]}</span>` : r.it.part === 2 && r.it.indirect ? 'Đáp án đúng là câu trả lời gián tiếp' : '<span class="faint">xem lời giải</span>'}</td></tr>`).join('')}</table>` : '';

function partSection(A, p) {
  const P = A.parts[p - 1], a = P.ok / P.n, rs = A.part(p), w = A.wr(rs);
  let extra = '';
  if (p === 2) { const ind = rs.filter(r => r.it.indirect), dir = rs.filter(r => !r.it.indirect), g = rs.filter(r => r.c === 'g'), notG = w.filter(r => r.c !== 'g');
    extra = `<div class="rp-kv"><div><b>${ind.filter(r => r.ok).length}/${ind.length}</b><span>Đáp án gián tiếp</span></div><div><b>${dir.filter(r => r.ok).length}/${dir.length}</b><span>Đáp án trực tiếp</span></div><div><b>${w.filter(r => r.tr).length}/${w.length}</b><span>Câu sai do chọn bẫy</span></div><div><b>${notG.length}</b><span>Sai mà không đánh dấu lụi</span></div></div>
      ${wrongList(w)}<p class="small">${g.length ? `Bạn đánh dấu lụi ${g.length} câu, trúng ${g.filter(r => r.ok).length}. ` : ''}${notG.length ? `<b>${notG.length} câu sai mà bạn không đánh dấu lụi</b> (${notG.map(r => r.n).join(', ')}): tưởng nghe được nhưng vẫn chọn sai. Đây là lỗi nhận diện bẫy, nặng hơn lỗi đoán.` : ''}</p>`; }
  if (p === 3 || p === 4) { const r34 = rs, pw = [1, 2, 3].map(q => A.wr(r34.filter(r => r.it.pos === q)).length), pn = [1, 2, 3].map(q => r34.filter(r => r.it.pos === q).length), mx = Math.max(1, ...pw);
    const last = r34.filter(r => r.it.setN >= (p === 3 ? 10 : 8)), ppw = w.filter(r => r.it.pp), spk = r34.filter(r => r.it.spk && r.it.qt !== 'main');
    extra = `<div class="rp-cols"><div><div class="small muted" style="margin-bottom:6px">Câu sai theo vị trí trong mỗi đoạn</div><div class="rp-vbars">${pw.map((v, i) => `<div><b>${v}</b><i style="height:${v / mx * 90 + 4}px" class="${i === 2 && v > pw[0] ? 'hot' : ''}"></i><span>Câu ${i + 1}<br><small>/${pn[i]}</small></span></div>`).join('')}</div></div>
      <div class="rp-kv col"><div><b>${A.wr(last).length}/${last.length}</b><span>Sai ở ${p === 3 ? '3' : '2'} đoạn cuối Part ${p}</span></div>${spk.length ? `<div><b>${spk.filter(r => r.ok).length}/${spk.length}</b><span>Câu hỏi về một người cụ thể (man / woman)</span></div>` : ''}<div><b>${ppw.length}</b><span>Câu sai vì không nhận ra paraphrase</span></div></div></div>
      ${ppw.length ? `<div class="small muted" style="margin:10px 0 4px">Lỗi paraphrase ở Part ${p}: đáp án nói lại đúng ý vừa nghe bằng từ khác</div>${wrongList(ppw, 'pp')}` : ''}${w.filter(r => r.tr === 'spk').length ? `<p class="small">Nhầm người nói ở câu ${w.filter(r => r.tr === 'spk').map(r => r.n).join(', ')}: phương án bạn chọn là việc của người kia. Khi đọc trước câu hỏi, khoanh rõ <b>man / woman</b>.</p>` : ''}`; }
  if (p === 5) { const vc = rs.filter(r => r.it.qt === 'vocab' && r.it.clue), vw = A.wr(vc), gw = w.filter(r => r.it.qt !== 'vocab');
    extra = `${vw.length ? `<p class="small"><b>${vw.length}/${vc.length} câu từ vựng có sẵn manh mối trong câu mà vẫn sai</b> (${vw.map(r => r.n).join(', ')}). Lỗi thường là chọn theo cảm giác "đọc thuận miệng" trước khi đọc hết câu.</p>` : ''}${gw.length ? `<p class="small">Ngữ pháp, từ loại cần vá: ${gw.map(r => `<a class="rp-n" data-q="${r.n}">${r.n}</a> ${GP[r.it.gp] || ''}`).join(' · ')}</p>` : ''}`; }
  if (p === 6) { const rl = rs.filter(r => r.it.rel), nr = rs.filter(r => !r.it.rel);
    extra = `<div class="rp-kv"><div><b>${rl.filter(r => r.ok).length}/${rl.length}</b><span>Câu cần hiểu quan hệ giữa các câu</span></div><div><b>${nr.filter(r => r.ok).length}/${nr.length}</b><span>Câu chỉ cần nhìn chỗ trống</span></div></div>`; }
  if (p === 7) { const s = rs.filter(r => r.it.doc === 'single'), m = rs.filter(r => r.it.doc !== 'single'), a1 = rs.filter(r => r.n < 186), a2 = rs.filter(r => r.n >= 186);
    extra = `<div class="rp-kv"><div><b>${pct(s.filter(r => r.ok).length, s.length)}%</b><span>Đơn văn bản (147-175)</span></div><div><b>${pct(m.filter(r => r.ok).length, m.length)}%</b><span>Nhiều văn bản (176-200)</span></div><div><b>${a2.filter(r => r.ok).length}/${a2.length}</b><span>15 câu cuối (186-200)</span></div><div><b>${Math.round(A.tAvg(a1))}s → ${Math.round(A.tAvg(a2))}s</b><span>Thời gian / câu: đầu → cuối</span></div></div>
      ${a2.filter(r => r.c === 'g' || r.ch == null).length >= 4 ? `<p class="small">Bạn lụi hoặc bỏ trống ${a2.filter(r => r.c === 'g' || r.ch == null).length} câu cuối: dấu hiệu hết giờ. Part 7 cần chia giờ chứ chưa chắc đã kém hiểu.</p>` : ''}${wrongList(w.filter(r => r.n < 186 && r.it.pp), 'pp')}`; }
  return `<details class="card sec rp-part" ${a < 0.6 ? 'open' : ''}><summary><div class="row" style="gap:10px;width:100%"><b>Part ${p} - ${PN[p]}</b><span class="pill ${tone(a)}">${P.ok}/${P.n} (${pct(P.ok, P.n)}%)</span><span class="grow"></span><span class="small faint">Bấm để ${a < 0.6 ? 'thu gọn' : 'xem chi tiết'}</span></div></summary>
    <div class="rp-pbody">${qtTable(A, p)}${extra}<div class="row" style="margin-top:10px"><button class="btn sm" data-rv="${p}">${icon('eye')} Chữa từng câu Part ${p}</button></div></div></details>`;
}

function render(view, idx) {
  const list = S().placement || [];
  if (!list.length) { view.innerHTML = `<div class="page"><div class="card sec" style="max-width:620px;margin:40px auto;text-align:center">${X.xi('think', 80)}<h1 class="h1">Chưa có báo cáo</h1><p class="muted">Làm bài chuẩn 200 câu một lần để có báo cáo phân tích và lộ trình riêng.</p><a class="btn pri lg" href="#/fulltest">Làm bài chuẩn ${icon('arrow')}</a></div></div>`; return; }
  const i = idx == null ? list.length - 1 : Math.max(0, Math.min(list.length - 1, idx)), rec = list[i], A = analyze(rec);
  if (!A) { view.innerHTML = '<div class="page"><p>Không tải được dữ liệu bài chuẩn.</p></div>'; return; }
  const sc = Object.keys(TOPICS).map(k => topicScore(A, k)).sort((a, b) => b.gap - a.gap), top = sc[0], T = TOPICS[top.k];
  const order = sc.filter(x => x.gap > 0.5).map(x => x.k); if (!order.length) order.push('multi', 'para');
  const PL = plan(A, order), gapPts = Math.max(0, A.aim - A.est);
  // điểm mạnh: dạng câu ≥ 80% (ít nhất 3 câu)
  const strong = [1, 2, 3, 4, 5, 6, 7].flatMap(p => A.qtRows(p).filter(x => x.n >= 3 && x.ok / x.n >= 0.8).map(x => `Part ${p}: ${x.name.toLowerCase()} (${x.ok}/${x.n})`)).slice(0, 5);
  const allPP = A.groups.pp, ppW = A.wr(allPP);
  // 4 mẫu lỗi xuyên suốt
  const pats = [
    { k: 'para', n: ppW.length, name: 'Không nhận ra paraphrase (nghe, đọc theo từ chứ chưa theo ý)', ev: nums(ppW), fix: 'Sổ paraphrase: sau mỗi bài, gạch cặp "câu trong bài ↔ đáp án". Học từ theo cụm đồng nghĩa.' },
    { k: 'end', n: Math.round(A.endLost), name: 'Rơi điểm ở cuối (câu 3 mỗi đoạn, cuối Part 4, cuối Part 7)', ev: `Câu 3 Part 3-4 sai ${A.posW[2]}/${A.posN[2]} · 15 câu cuối Part 7 đúng ${A.groups.p7z.filter(r => r.ok).length}/15`, fix: 'Nghe đến chữ cuối rồi mới chuyển. Luyện khối 45 phút nghe, 75 phút đọc. Chia giờ Part 7.' },
    { k: 'trap', n: A.trapW.length, name: 'Chọn đáp án "quen tai, quen mắt": lặp từ, gần âm, sai dạng câu, nhầm người nói', ev: nums(A.trapW), fix: 'Quy tắc "lặp từ thì nghi ngờ". Khoanh man / woman trong câu hỏi. Hỏi lại: chi tiết này có trả lời đúng câu hỏi không?' },
    { k: 'rel', n: A.wr(A.groups.rel).length + A.wr(A.groups.implied).length, name: 'Không dùng quan hệ giữa các câu, các vế (từ nối, manh mối, ngụ ý)', ev: nums([...A.wr(A.groups.rel), ...A.wr(A.groups.implied)].sort((a, b) => a.n - b.n)), fix: 'Trước khi chọn, đọc hết câu và câu kề bên. Học từ nối theo quan hệ ý.' },
    { k: 'gram', n: A.wr(A.groups.gram).length, name: 'Lỗ hổng ngữ pháp, từ loại (Part 5-6)', ev: nums(A.wr(A.groups.gram)), fix: 'Học theo khuôn câu, mỗi câu sai viết lại 1 quy tắc và làm lại sau 3 ngày.' },
  ].sort((a, b) => b.n - a.n).slice(0, 4);
  const maxP = Math.max(1, ...pats.map(x => x.n));
  const rate = ({ 30: 8, 60: 14, 90: 18, 120: 22, 180: 26 }[rec.min] || 14) * (A.est < 500 ? 1.2 : A.est > 800 ? 0.6 : 1);
  const canGain = Math.round(rate * PL.days / 7), verdict = !gapPts ? ['Đã đạt mục tiêu', 'sage', 'Điểm ước tính đã bằng hoặc vượt mục tiêu. Lộ trình tập trung giữ phong độ và vá các dạng còn sai để có khoảng an toàn.'] : canGain >= gapPts * 1.15 ? ['Khả thi', 'sage', 'Nếu học đều theo lộ trình, mục tiêu nằm trong tầm tay.'] : canGain >= gapPts * 0.85 ? ['Sát nút, cần học đều', 'gold', 'Đạt được nếu không bỏ buổi và tự học đúng thời gian đã đặt.'] : ['Khó trong thời gian này', 'red', `Với ${rec.min} phút/ngày, khoảng ${PL.days} ngày thường tăng được ~${canGain} điểm, trong khi cần thêm ~${gapPts}. Nên tăng thời gian tự học hoặc lùi ngày thi khoảng ${Math.max(2, Math.ceil((gapPts - canGain) / rate))} tuần.`];
  const lv = (a, t) => `<span class="pill ${tone(a)}">${t}</span>`;
  const nLcur = A.rawL, nRcur = A.rawR;
  const quickRows = [
    ['Paraphrase (Part 3, 4, 7)', ppW.length, A.groups.pp.length, 'Trung bình', 'para'], ['Part 2: bẫy và câu gián tiếp', A.wr(A.groups.p2).length, 25, 'Dễ', 'p2'], ['Câu ngụ ý (Part 3, 4, 7)', A.wr(A.groups.implied).length, A.groups.implied.length, 'Trung bình', 'implied'],
    ['Từ nối, manh mối, câu điền (Part 5-7)', A.wr(A.groups.rel).length, A.groups.rel.length, 'Dễ - trung bình', 'rel'], ['Ngữ pháp, từ loại (Part 5-6)', A.wr(A.groups.gram).length, A.groups.gram.length, 'Dễ', 'gram'], ['Part 7 nhiều văn bản + tốc độ', A.wr(A.groups.multi).length, A.groups.multi.length, 'Trung bình - khó', 'multi'],
  ].map(([n, w, t, d, k]) => ({ n, w, t, d, k, gain: Math.max(0, Math.round(w - 0.15 * t)), pr: order.indexOf(k) })).sort((a, b) => b.gain - a.gain);
  const phName = { 1: 'Vá lỗi nhanh + bắt đầu chuyên đề', 2: 'Trục chính: lỗi lớn nhất + tốc độ', 3: 'Tăng tốc, thi thử, ôn Sổ lỗi' };
  const topR = A.wr(T.rs(A)).slice(0, 8);

  view.innerHTML = `<div class="page rp">
    <div class="row rp-top"><div><div class="kicker">Báo cáo bài chuẩn đầu vào · ${new Date(rec.at).toLocaleDateString('vi-VN')}</div><h1 class="h1" style="margin:4px 0">Bạn đang ở đâu, cần làm gì để tới ${A.aim}</h1></div><span class="grow"></span>
      ${list.length > 1 ? `<select id="rp-pick" class="small">${list.map((x, j) => `<option value="${j}" ${j === i ? 'selected' : ''}>Lần ${j + 1} - ${new Date(x.at).toLocaleDateString('vi-VN')}</option>`).join('')}</select>` : ''}<button class="btn sm" id="rp-print">${icon('dl')} In / lưu PDF</button></div>

    <div class="card sec rp-hero"><div class="rp-hero-g">${ring(A.est, A.aim)}<div>
      <div class="rp-big">${A.rawL + A.rawR}<small>/200 câu đúng</small></div>
      <div class="row" style="gap:8px;margin:6px 0 10px"><span class="pill syn">Ước tính ~${A.est}/990</span><span class="pill">Nghe ${A.rawL}/100 · ~${A.estL}</span><span class="pill">Đọc ${A.rawR}/100 · ~${A.estR}</span></div>
      <div class="small">${gapPts ? `Còn cách mục tiêu <b>${gapPts} điểm</b>: cần khoảng <b>+${Math.max(0, A.nL - A.rawL)} câu Nghe</b> và <b>+${Math.max(0, A.nR - A.rawR)} câu Đọc</b>.` : 'Đã đạt mục tiêu.'} Ngày thi: <b>${rec.date ? new Date(rec.date + 'T00:00:00').toLocaleDateString('vi-VN') : 'chưa đặt'}</b> (còn ${PL.days} ngày) · Tự học ${rec.min} phút/ngày · <a href="#" id="rp-edit">Sửa mục tiêu</a></div>
      <div class="small faint" style="margin-top:6px">Quy đổi theo bảng phổ biến, sai số khoảng ±30-50 điểm.</div></div></div>
      <div id="rp-editbox" hidden class="pt-form" style="margin-top:12px"></div></div>

    <div class="card sec"><div class="h2" style="margin-bottom:8px">Tóm tắt</div><ul class="rp-sum">
      <li><b>${A.rawL + A.rawR}/200 câu đúng (${pct(A.rawL + A.rawR, 200)}%).</b> Nghe ${A.rawL}/100, Đọc ${A.rawR}/100, ước tính ~${A.est}/990.</li>
      ${strong.length ? `<li><b>Điểm mạnh:</b> ${strong.join('; ')}.</li>` : ''}
      ${pats.filter(x => x.n > 0).map((x, j) => `<li><b>Lỗi số ${j + 1}:</b> ${esc(x.name.toLowerCase())}. <span class="muted">${x.n} câu.</span></li>`).join('')}
      ${A.conf.sureW.length ? `<li><b>${A.conf.sureW.length} câu bạn đánh dấu "Chắc" nhưng sai</b> (${A.conf.sureW.slice(0, 15).map(r => r.n).join(', ')}${A.conf.sureW.length > 15 ? '…' : ''}): lỗ hổng mà bạn không tự thấy, ưu tiên chữa trước.</li>` : ''}
      <li><b>Chuyên đề cần khắc phục trước tiên:</b> ${esc(T.short.toLowerCase())} (xem Mục 4).</li></ul></div>

    <div class="sec-h sec"><div><div class="kicker">1</div><h2 class="h2">Tổng quan điểm số</h2></div><span class="small muted">Vạch đứng = tỉ lệ đúng cần đạt để tới ${A.aim}</span></div>
    <div class="card"><table class="dt rp-t"><tr><th>Part</th><th class="num">Đúng</th><th style="width:40%">So với mục tiêu</th><th>Nhận xét</th></tr>
      ${A.parts.map(x => { const a = x.ok / x.n, tg = x.p <= 4 ? A.nL : A.nR; return `<tr><td><b>Part ${x.p}</b> <span class="small muted rp-pn">${PN[x.p]}</span></td><td class="num">${x.ok}/${x.n}</td><td>${bar(x.ok, x.n, tone(a), tg)}</td><td>${lv(a, a * 100 >= tg ? 'Đạt mức mục tiêu' : `Thiếu ~${Math.max(1, Math.round((tg / 100 - a) * x.n))} câu`)}</td></tr>`; }).join('')}
      <tr class="rp-sum-row"><td><b>Nghe</b></td><td class="num"><b>${A.rawL}/100</b></td><td>${bar(A.rawL, 100, 'syn', A.nL)}</td><td class="small">Cần ~${A.nL}/100 (≈${A.tL} điểm)</td></tr>
      <tr class="rp-sum-row"><td><b>Đọc</b></td><td class="num"><b>${A.rawR}/100</b></td><td>${bar(A.rawR, 100, 'syn', A.nR)}</td><td class="small">Cần ~${A.nR}/100 (≈${A.tR} điểm)</td></tr></table>
      <div class="small muted" style="margin:14px 0 6px">Bản đồ 200 câu (mỗi ô là một câu, theo thứ tự đề)</div>${heat(A)}</div>

    <div class="sec-h sec"><div><div class="kicker">2</div><h2 class="h2">Phân tích từng Part, tới từng câu</h2></div><span class="small muted">Số có chữ <sup>L</sup> là câu bạn đánh dấu lụi. Bấm số câu để xem lời giải.</span></div>
    ${[1, 2, 3, 4, 5, 6, 7].map(p => partSection(A, p)).join('')}

    <div class="sec-h sec"><div><div class="kicker">3</div><h2 class="h2">Các mẫu lỗi xuyên suốt cả bài</h2></div></div>
    <div class="card"><div class="rp-pats">${pats.map((x, j) => `<div class="rp-pat"><div class="row" style="gap:10px"><span class="rp-no">${j + 1}</span><b class="grow">${esc(x.name)}</b><span class="pill ${x.n >= 8 ? 'red' : x.n >= 4 ? 'ember' : 'gold'}">${x.n} câu</span></div>${bar(x.n, maxP, x.n >= 8 ? 'red' : 'ember')}<div class="small"><span class="muted">Bằng chứng:</span> ${x.ev}</div><div class="small"><span class="muted">Cách sửa:</span> ${esc(x.fix)}</div></div>`).join('')}</div>
      <p class="small" style="margin-top:10px">Các lỗi này phần lớn chung một gốc: xử lý ngôn ngữ ở mức <b>từ</b> thay vì mức <b>ý</b>. Sửa được gốc này thì cả Nghe lẫn Đọc cùng lên.</p>
      <div class="h3" style="margin:16px 0 6px">Độ tin cậy khi chọn</div>
      <div class="rp-kv"><div><b>${A.conf.marked}/200</b><span>Câu có đánh dấu Chắc / Phân vân / Lụi</span></div><div><b>${A.conf.sureW.length}</b><span>Chắc mà sai</span></div><div><b>${A.conf.guessOk.length}/${A.conf.guess.length}</b><span>Lụi trúng</span></div><div><b>${A.conf.unsure.filter(r => r.ok).length}/${A.conf.unsure.length}</b><span>Phân vân mà đúng</span></div></div>
      ${A.conf.marked < 100 ? '<p class="small faint">Lần sau nhớ đánh dấu mức chắc chắn cho mọi câu, báo cáo sẽ tách được lỗi "tưởng đúng" với lỗi đoán chính xác hơn.</p>' : ''}</div>

    <div class="sec-h sec"><div><div class="kicker">4</div><h2 class="h2">Chuyên đề: ${esc(T.t)}</h2></div><span class="pill red">Lỗi lớn nhất của bạn</span></div>
    <div class="card rp-topic"><div class="rp-why">${T.why(A, top.w, top.n)}</div>
      ${topR.length ? `<div class="h3" style="margin:14px 0 6px">Mổ xẻ các câu bạn sai</div><table class="dt rp-t small"><tr><th>Câu</th><th>Đề hỏi</th><th>Đáp án đúng</th><th>Bạn chọn</th><th>Chìa khóa</th></tr>${topR.map(r => `<tr><td><a class="rp-n" data-q="${r.n}">${r.n}</a></td><td>${r.it.part === 1 ? 'Tranh Part 1' : esc(r.it.prompt.replace(/<br>.*/, '').slice(0, 140))}</td><td>${L(r.it.answer, r.it.part <= 2 ? r.it.options[r.it.answer] : r.it.options[r.it.answer])}</td><td>${r.ch == null ? '<span class="faint">bỏ trống</span>' : L(r.ch, r.it.options[r.ch])}${r.tr ? `<div><span class="pill red">${TRAP[r.tr]}</span></div>` : ''}</td><td>${r.it.explain}</td></tr>`).join('')}</table>` : ''}
      <div class="rp-cols" style="margin-top:14px"><div><div class="h3" style="margin-bottom:6px">Quy trình 5 bước</div><ol class="rp-steps">${T.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <div><div class="h3" style="margin-bottom:6px">Bảng tra nhanh</div><table class="dt rp-t small"><tr>${T.table.slice(0, 3).map(h => `<th>${esc(h)}</th>`).join('')}</tr>${T.table[3].map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div></div>
      <div class="h3" style="margin:16px 0 6px">Luyện chuyên đề này trên Tooez</div><div class="grid g3 ex-next">${T.learn.filter(([h]) => has(h)).map(([h, t, d]) => `<a class="card link flat" href="${h}"><b>${esc(t)}</b><span class="small muted">${esc(d || 'Mở bài')}</span></a>`).join('')}</div>
      <p class="small" style="margin-top:10px"><b>Mục tiêu:</b> nhóm câu này đạt ≥ 70% ở lần đo lại giữa lộ trình và ≥ 85% trước ngày thi.</p></div>

    <div class="sec-h sec"><div><div class="kicker">5</div><h2 class="h2">Khoảng cách tới ${A.aim} và thứ tự ưu tiên</h2></div></div>
    <div class="card"><table class="dt rp-t"><tr><th>Mốc</th><th class="num">Nghe (đúng/100)</th><th class="num">Đọc (đúng/100)</th><th class="num">Điểm ước tính</th></tr>
      <tr><td>Hiện tại</td><td class="num">${nLcur}</td><td class="num">${nRcur}</td><td class="num">~${A.est}</td></tr><tr><td><b>Mục tiêu ${A.aim}</b></td><td class="num"><b>~${A.nL}</b></td><td class="num"><b>~${A.nR}</b></td><td class="num"><b>~${A.tL + A.tR}</b></td></tr>
      <tr><td>Cần tăng</td><td class="num">+${Math.max(0, A.nL - nLcur)}</td><td class="num">+${Math.max(0, A.nR - nRcur)}</td><td class="num">+${gapPts}</td></tr></table>
      <div class="h3" style="margin:16px 0 6px">Lấy lại điểm theo từng hạng mục</div>
      <table class="dt rp-t"><tr><th>Hạng mục</th><th class="num">Đang sai</th><th class="num">Lấy lại được</th><th>Độ khó</th><th>Ưu tiên</th></tr>${quickRows.map(x => `<tr><td>${esc(x.n)}</td><td class="num">${x.w}/${x.t}</td><td class="num"><b>+${x.gain}</b></td><td class="small">${x.d}</td><td>${x.pr === 0 ? '<span class="pill red">1 · chuyên đề</span>' : x.pr > 0 && x.pr < 3 && x.gain >= 3 ? '<span class="pill ember">2 · tuần 1-4</span>' : x.gain >= 3 ? '<span class="pill gold">3 · giữa lộ trình</span>' : '<span class="pill sage">Duy trì</span>'}</td></tr>`).join('')}</table>
      <p class="small faint">"Lấy lại được" = số câu sai trừ đi mức sai chấp nhận được (15%). Không cần đúng tuyệt đối mọi dạng để tới mục tiêu.</p></div>

    <div class="sec-h sec"><div><div class="kicker">6</div><h2 class="h2">Mục tiêu có khả thi không?</h2></div><span class="pill ${verdict[1]}">${verdict[0]}</span></div>
    <div class="card"><div class="rp-kv"><div><b>${PL.days} ngày</b><span>Tới ngày thi</span></div><div><b>+${gapPts}</b><span>Điểm cần thêm</span></div><div><b>~${canGain}</b><span>Thường tăng được với ${rec.min} phút/ngày</span></div><div><b>${PL.W} tuần</b><span>Lộ trình</span></div></div>
      <p>${esc(verdict[2])}</p><ul class="small ex-ul"><li>Cơ sở: phần lớn câu sai thuộc nhóm kỹ năng có quy tắc (paraphrase, bẫy, từ nối, giữ nhịp), sửa nhanh hơn học lại từ đầu.</li><li>Điều kiện: học đủ thời gian mỗi ngày, chữa mọi câu sai trong Sổ lỗi, làm đúng các mốc đo lại.</li>
      ${PL.W >= 3 ? `<li>Mốc kiểm tra: giữa lộ trình (tuần ${Math.max(1, Math.floor(PL.W / 2) - (PL.W >= 6 ? 1 : 0)) + 1}) điểm Part yếu nhất nên tăng ≥ 10 điểm %. Nếu không tăng, nên cân nhắc lùi ngày thi 2-4 tuần.</li>` : ''}</ul></div>

    <div class="sec-h sec"><div><div class="kicker">7</div><h2 class="h2">Lộ trình ${PL.W} tuần tới ngày thi</h2></div><button class="btn pri sm" id="rp-apply">${icon('check')} Dùng lộ trình này</button></div>
    <div class="card"><div class="rp-phases">${[1, 2, 3].filter(ph => PL.weeks.some(w => w.ph === ph)).map(ph => `<span class="rp-ph ph${ph}">Giai đoạn ${ph}: ${phName[ph]} · ${PL.weeks.filter(w => w.ph === ph).length} tuần</span>`).join('')}</div>
      <div class="small muted" style="margin:8px 0 12px">Việc hằng ngày, mọi tuần: ${DAILY.map(([h, t, d]) => `<a href="${h}">${esc(t)}</a> (${d})`).join(' · ')}</div>
      <div class="rp-tl">${PL.weeks.map(w => `<div class="rp-wk ph${w.ph}"><div class="rp-wh"><b>Tuần ${w.w}</b><span class="small muted">${fmtD(w.from)} - ${fmtD(w.to)}</span></div><div class="rp-wt">${w.tasks.map(([h, t, k]) => `<a class="rp-task" href="${h}">${icon('arrow')} ${esc(t)}${k && TOPICS[k] && k === top.k ? ' <span class="pill red">chuyên đề</span>' : ''}</a>`).join('')}${w.check ? `<a class="rp-task chk" href="${w.check[0]}">${icon('target')} ${esc(w.check[1])}</a>` : ''}</div></div>`).join('')}
        <div class="rp-wk end"><div class="rp-wh"><b>Ngày thi</b><span class="small muted">${PL.end.toLocaleDateString('vi-VN')}</span></div><div class="rp-wt small">Tuần cuối: ngủ đủ, làm nhẹ 1 đề Part 2 + Part 5 để giữ nhịp, đọc lại các quy tắc trong Sổ lỗi.</div></div></div></div>
    <div class="row sec"><a class="btn" href="#/errors">${icon('err')} Sổ lỗi</a><a class="btn" href="#/tests">Đề từng Part</a><a class="btn" href="#/today">Về Hôm nay</a></div></div>`;

  // ---- tương tác
  const pk = $('#rp-pick', view); if (pk) pk.onchange = () => X.go('#/report/' + pk.value);
  $('#rp-print', view).onclick = () => { $$('details.rp-part', view).forEach(d => d.open = true); setTimeout(() => window.print(), 60); };
  $$('[data-rv]', view).forEach(b => b.onclick = () => X.ptReview(view, +b.dataset.rv, rec, () => render(view, i)));
  $$('.rp-n[data-q]', view).forEach(b => b.onclick = () => { const n = +b.dataset.q, it = A.items[n - 1]; X.ptReview(view, it.part, rec, () => render(view, i)); setTimeout(() => { const sb = $(`#rv-sheet [data-j="${n - X.PT.find(e => e.part === it.part).start}"]`, view); if (sb) sb.click(); }, 30); });
  $('#rp-edit', view).onclick = ev => { ev.preventDefault(); const box = $('#rp-editbox', view); box.hidden = !box.hidden;
    box.innerHTML = `<label><span class="small">Điểm mục tiêu</span><select id="rp-aim">${[450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950].map(v => `<option ${v === rec.aim ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label><span class="small">Ngày thi</span><input type="date" id="rp-date" value="${esc(rec.date || '')}"></label><label><span class="small">Tự học mỗi ngày</span><select id="rp-min">${[[30, '30 phút'], [60, '1 tiếng'], [90, '1 tiếng 30'], [120, '2 tiếng'], [180, '3 tiếng']].map(([v, n]) => `<option value="${v}" ${v === rec.min ? 'selected' : ''}>${n}</option>`).join('')}</select></label><button class="btn pri sm" id="rp-save">Cập nhật</button>`;
    $('#rp-save', view).onclick = () => { rec.aim = +$('#rp-aim', view).value; rec.date = $('#rp-date', view).value; rec.min = +$('#rp-min', view).value; Object.assign(S().profile, { aim: rec.aim, examDate: rec.date, studyMin: rec.min }); X.save(); render(view, i); }; };
  $('#rp-apply', view).onclick = () => {
    const P = S().profile, map = { para: 'p34', implied: 'p34', end: 'p34', p2: 'p2', rel: 'p6', gram: 'p5', multi: 'p7' };
    const pick = [...new Set(order.map(k => map[k]).filter(Boolean))].slice(0, 2);
    P.focus = [...(P.focus || []).filter(k => k === 'nen' || k === 'hieu'), ...pick]; P.ptPlan = { at: Date.now(), rec: i }; X.save();
    X.toast('Đã lưu. Trang Hôm nay sẽ nhắc việc của tuần này.'); };
}
document.addEventListener('click', e => { const t = e.target.closest('.pt-today [data-href]'); if (t) { e.preventDefault(); e.stopPropagation(); location.hash = t.dataset.href; } }, true);
X.route(/^\/report(?:\/(\d+))?$/, (view, n) => render(view, n == null ? null : +n));

/* việc tuần này cho trang Hôm nay (nếu học sinh đã bấm "Dùng lộ trình này") */
X.ptWeek = () => {
  const P = S().profile, list = S().placement || []; if (!P.ptPlan || !list.length) return null;
  const rec = list[Math.min(list.length - 1, P.ptPlan.rec || 0)], A = analyze(rec); if (!A) return null;
  const order = Object.keys(TOPICS).map(k => topicScore(A, k)).sort((a, b) => b.gap - a.gap).filter(x => x.gap > 0.5).map(x => x.k);
  const PL = plan(A, order.length ? order : ['multi'], P.ptPlan.at); const w = Math.min(PL.W - 1, Math.max(0, Math.floor((Date.now() - P.ptPlan.at) / (7 * 864e5))));
  return { w: PL.weeks[w], W: PL.W, top: TOPICS[order[0]] ? TOPICS[order[0]].short : '' };
};
})();
