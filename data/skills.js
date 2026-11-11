/* TOOEZ — Skill Map: 4 tầng kỹ năng. Mỗi kỹ năng có bộ lọc câu hỏi (sel) để đo thành thạo.
   Dạng câu hỏi ≠ kỹ năng: một câu hỏi có thể luyện nhiều kỹ năng, một kỹ năng xuất hiện ở nhiều Part. */
window.LAYERS = [
  { k: 1, n: 'Nền tảng', en: 'Foundation', d: 'Từ vựng, ngữ pháp, âm, cấu trúc câu. Thiếu tầng này thì mẹo nào cũng không đủ.' },
  { k: 2, n: 'Hiểu', en: 'Core Comprehension', d: 'Paraphrase, ngữ cảnh, ý chính, chi tiết, suy luận, kết nối thông tin. Dùng chung cho cả Nghe và Đọc.' },
  { k: 3, n: 'Theo Part', en: 'Part-specific', d: 'Cách xử lý riêng của từng Part: dạng câu, bẫy đặc trưng, chiến thuật.' },
  { k: 4, n: 'Làm bài', en: 'Performance', d: 'Tốc độ, nhận diện đáp án nhiễu, độ tin cậy khi chọn, tự chữa lỗi.' },
];
const _re = (r, f = 'skill') => i => r.test(i[f] || '');
window.SKILLS = [
  // ---- Tầng 1
  { id: 'wordform', layer: 1, n: 'Từ loại và họ từ', en: 'Word forms & families', d: 'Nhìn đuôi và vị trí để chọn đúng danh, động, tính, trạng từ.', parts: [5, 6], sel: i => i.cat === 'wordform' || i.tag === 'suffix' || i.src === 'otv' },
  { id: 'vocab', layer: 1, n: 'Từ vựng và từ dễ nhầm', en: 'Vocabulary & confusables', d: 'Hiểu nghĩa trong ngữ cảnh, phân biệt từ gần nghĩa, từ đa nghĩa.', parts: [1, 2, 5, 6, 7], sel: i => i.tag === 'confuse' || i.cat === 'vocab' || i.lab === 'para-vocab' || /^v:/.test(i.id) },
  { id: 'grammar', layer: 1, n: 'Động từ và cấu trúc câu', en: 'Verbs & sentence structure', d: 'Tìm chủ ngữ, động từ chính; chọn thì, chủ/bị động, mệnh đề.', parts: [1, 5, 6], sel: i => ['verb', 'rel', 'compare'].includes(i.cat) || i.lab === 'p1-asp' },
  { id: 'funcwords', layer: 1, n: 'Đại từ, giới từ, liên từ', en: 'Function words', d: 'Chọn từ nối, giới từ, đại từ theo thứ đứng sau chỗ trống.', parts: [5, 6], sel: i => ['pron', 'prep', 'conn'].includes(i.cat) },
  { id: 'sound', layer: 1, n: 'Phân biệt âm khi nghe', en: 'Sound discrimination', d: 'Nghe ra từ gần âm, không bị đánh lừa bởi từ nghe quen tai.', parts: [1, 2], sel: i => i.tag === 'sound' },
  // ---- Tầng 2
  { id: 'para', layer: 2, n: 'Nhận diện paraphrase', en: 'Paraphrase recognition', d: 'Nhận ra cùng một ý được nói bằng từ khác: từ, cụm, cả câu.', parts: [1, 2, 3, 4, 7], sel: i => i.tag === 'para' || /Paraphrase|paraphrase|Diễn đạt lại/.test(i.skill || '') },
  { id: 'context', layer: 2, n: 'Ngữ cảnh và chức năng câu nói', en: 'Context & communicative function', d: 'Hiểu câu nói đang làm gì: từ chối, gợi ý, trả lời gián tiếp, phàn nàn.', parts: [2, 3, 4, 6], sel: i => i.tag === 'func' || i.tag === 'implied' || i.qt === 'stmt' || (i.kind === 'p2' && i.indirect) },
  { id: 'main', layer: 2, n: 'Ý chính và mục đích', en: 'Main idea & purpose', d: 'Nắm chủ đề, mục đích, người nói, nơi chốn từ phần mở đầu.', parts: [3, 4, 7], sel: i => /Mục đích|Ý chính|bối cảnh/.test(i.skill || '') || i.cat === 'main' },
  { id: 'detail', layer: 2, n: 'Chi tiết và định vị thông tin', en: 'Detail & scanning', d: 'Tìm đúng chỗ chứa đáp án bằng từ neo, không chọn thông tin cũ.', parts: [3, 4, 7], sel: i => /Chi tiết|Scan|Vấn đề|Sửa thông tin|đổi ý/.test(i.skill || '') || i.cat === 'detail' },
  { id: 'infer', layer: 2, n: 'Suy luận', en: 'Inference', d: 'Rút ra điều không viết thẳng nhưng có bằng chứng; loại suy diễn quá đà.', parts: [3, 4, 7], sel: i => /Suy luận|NOT|Ý định|Thái độ/.test(i.skill || '') || i.tag === 'implied' || i.cat === 'action' },
  { id: 'connect', layer: 2, n: 'Kết nối thông tin', en: 'Information integration', d: 'Ghép thông tin giữa bài nghe và bảng, giữa 2-3 văn bản.', parts: [3, 4, 7], sel: i => i.tag === 'graphic' || /bài 1|bài 2|Cầu nối|Liên kết|nối 2/.test(i.skill || '') },
  { id: 'cohesion', layer: 2, n: 'Liên kết văn bản', en: 'Discourse & cohesion', d: 'Hiểu quan hệ giữa các câu: từ nối, từ chỉ về trước, điền câu.', parts: [6, 7], sel: i => (i.part === 6 && /ngữ cảnh|Điền cả câu|Connector|Insertion/.test(i.skill || '')) || /Chèn câu|Điền câu/.test(i.skill || '') },
  // ---- Tầng 3
  { id: 'p1', layer: 3, n: 'Part 1 - Đối chiếu tranh', en: 'Photo matching', d: 'Kiểm tra đủ 4 mảnh: người, hành động/trạng thái, đồ vật, vị trí.', parts: [1], sel: i => i.part === 1 && (i.tag === 'case' || i.lab === 'p1-asp' || i.tag === 'para') },
  { id: 'p2', layer: 3, n: 'Part 2 - Dạng câu hỏi và phản hồi', en: 'Question-response', d: 'Bắt 3 từ đầu, loại đáp án sai dạng, chọn phản hồi tự nhiên.', parts: [2], sel: i => i.kind === 'p2' || i.tag === 'qtype' },
  { id: 'p34', layer: 3, n: 'Part 3-4 - Đọc trước câu hỏi, theo dõi bài nghe', en: 'Previewing & tracking', d: 'Đọc trước 3 câu hỏi, nghe đúng người, đúng đoạn.', parts: [3, 4], sel: i => i.tag === 'preread' || i.kind === 'p34' },
  { id: 'p5', layer: 3, n: 'Part 5 - Phân tích câu', en: 'Sentence analysis', d: 'Xác định chức năng chỗ trống, giải không cần dịch cả câu.', parts: [5], sel: i => i.part === 5 && ['doc-p5', 'old-p5'].includes(i.src) },
  { id: 'p6', layer: 3, n: 'Part 6 - Đọc đoạn và điền', en: 'Text completion', d: 'Dùng câu trước, câu sau, ngày tháng để chọn thì và câu điền.', parts: [6], sel: i => i.kind === 'p6' },
  { id: 'p7', layer: 3, n: 'Part 7 - Chiến lược câu hỏi', en: 'Reading question strategy', d: 'Gọi tên dạng câu, tìm bằng chứng, so nghĩa thay vì so chữ.', parts: [7], sel: i => i.kind === 'p7' || i.tag === 'radar' },
  // ---- Tầng 4
  { id: 'distractor', layer: 4, n: 'Nhận diện đáp án nhiễu', en: 'Distractor analysis', d: 'Câu có lời giải gọi tên bẫy: lặp từ, gần âm, sai đối tượng, thông tin cũ.', parts: [1, 2, 3, 4, 5, 6, 7], sel: i => !!(i.optWhy && i.optWhy.some(w => /Bẫy|bẫy|Lặp|Gần âm|Sai|trùng|Ngược/.test(w || ''))) || /Bẫy|bẫy/.test(i.skill || '') },
  { id: 'speed', layer: 4, n: 'Tốc độ xử lý', en: 'Speed', d: 'Tỷ lệ câu trả lời đúng trong thời gian chuẩn của dạng câu đó.', parts: [1, 2, 3, 4, 5, 6, 7], derived: 'speed' },
  { id: 'calib', layer: 4, n: 'Độ tin cậy khi chọn', en: 'Confidence calibration', d: 'Câu đánh dấu “chắc” thì phải đúng. Chắc mà sai là lỗ hổng không tự thấy.', parts: [1, 2, 3, 4, 5, 6, 7], derived: 'calib' },
  { id: 'selffix', layer: 4, n: 'Tự chữa lỗi', en: 'Error analysis', d: 'Lỗi trong Sổ lỗi được gọi tên nguyên nhân, viết quy tắc và làm lại đúng.', parts: [1, 2, 3, 4, 5, 6, 7], derived: 'selffix' },
];
