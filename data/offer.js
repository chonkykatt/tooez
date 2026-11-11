/* TOOEZ - thông tin coaching, liên hệ, donate.
   Đây là file DUY NHẤT cần sửa khi đổi giá, gói, kênh liên hệ, thông tin nhận ủng hộ.
   Để trống '' thì mục đó tự ẩn trên web. */
window.OFFER = {
  // Kênh liên hệ. Zalo: 'https://zalo.me/09xxxxxxxx'. Form: link Google Form. Có kênh nào điền kênh đó.
  contact: {
    tiktok: 'https://www.tiktok.com/@toeic_tooez',
    zalo: 'https://zalo.me/0947483685',
    zaloQr: 'img/zalo-qr.png',   // mã QR Zalo cho người xem trên máy tính
    messenger: '',
    form: '',
    email: '',
  },

  // Các gói coaching. price để '' sẽ hiện "Liên hệ".
  packages: [
    { id: 'diag', icon: '🩺', name: 'Kiểm tra đầu vào', tag: 'Nên thử đầu tiên', price: '', unit: '',
      for: 'Muốn biết chính xác điểm hiện tại và mình hổng chỗ nào.',
      gets: ['Làm một đề full test như thi thật: 200 câu Nghe và Đọc, 120 phút', 'Coach chấm và cùng bạn xem kết quả từng Part', 'Call 30-45 phút về điểm mạnh, điểm yếu', '3 lỗ hổng nên ưu tiên và bài nên làm ngay trên TOOEZ'] },
    { id: 'plan', icon: '🗺️', name: 'Lộ trình riêng', tag: '', price: '', unit: '',
      for: 'Tự học ổn rồi, chỉ cần tấm bản đồ đúng đường.',
      gets: ['Lộ trình từng tuần đến ngày thi, theo điểm hiện tại và mục tiêu', 'Ghi rõ tuần nào học Unit, Lab, đề nào', 'Điều chỉnh lại một lần giữa chặng'] },
    { id: 'weekly', icon: '📅', name: 'Kèm theo tuần', tag: 'Có người nhắc', price: '', unit: '',
      for: 'Hay bỏ dở giữa chừng, cần người giao bài và nhắc.',
      gets: ['Giao bài mỗi tuần, nhắc khi bị chậm', 'Cùng xem Sổ lỗi, chữa những câu sai lặp lại', 'Check-in ngắn mỗi tuần, chỉnh kế hoạch theo kết quả', 'Hỏi đáp qua tin nhắn trong tuần'] },
    { id: 'intensive', icon: '🎯', name: 'Cấp tốc đến ngày thi', tag: 'Về đích', price: '', unit: '',
      for: 'Sắp thi rồi, cần tăng tốc về đích.',
      gets: ['Học 1-1 hoặc nhóm nhỏ, lịch dày hơn', 'Thi thử full test, chữa đề và phân tích lỗi sai', 'Chiến thuật chia thời gian và giữ bình tĩnh ngày thi'] },
  ],

  // Câu chuyện học viên THẬT. Chỉ thêm khi học viên đồng ý chia sẻ. Để trống thì mục này không hiện.
  // Ví dụ: { name: 'Minh A.', from: '450', to: '705', weeks: 10, quote: 'Câu học viên tự nói.' }
  cases: [],

  // Ủng hộ Tooez. Bỏ ảnh QR vào img/donate-qr.png (ảnh chụp mã VietQR hoặc Momo). Không có ảnh thì tự ẩn.
  donate: {
    qr: 'img/donate-qr.png',
    bank: '',       // ví dụ: 'Vietcombank'
    account: '',    // số tài khoản
    holder: '',     // tên chủ tài khoản
    note: 'UNG HO TOOEZ',
    momo: '',       // số Momo hoặc link
    kofi: '',       // link Ko-fi / Buy Me a Coffee cho người ở nước ngoài
    goals: [
      ['🌐', 'Duy trì web, miễn phí cho mọi người'],
      ['🧪', 'Thêm bài Lab và đề luyện mới'],
      ['🔎', 'Phân tích lỗi sai kỹ hơn'],
      ['🎧', 'Giọng đọc hay hơn, chạy được trên nhiều trình duyệt hơn'],
    ],
  },

  // Bảng cảm ơn trên trang Giới thiệu. Thêm người mới lên ĐẦU danh sách.
  // Ví dụ: { name: 'Minh Anh', msg: 'Cảm ơn TOOEZ, mình vừa lên 750!', date: '11/2026' }  (msg, date có thể bỏ trống)
  donors: [],

  // Mức gợi ý trên khung ủng hộ. Muốn bỏ mức nào thì xóa dòng đó.
  tiers: [
    { amount: '20.000đ', icon: '🐟', t: 'Một hộp pate cho Tooez' },
    { amount: '50.000đ', icon: '☕', t: 'Một buổi tối viết thêm bài', pick: true },
    { amount: '100.000đ', icon: '📝', t: 'Góp vào một bộ đề mới' },
  ],

  // Ô "Xin vía 950+". Bỏ ảnh chứng chỉ vào img/cert.jpg (chụp thẳng, rõ điểm). Chưa có ảnh thì web hiện khung điểm thay thế.
  vibe: { cert: 'img/cert.jpg', score: '950+', caption: 'Chứng chỉ TOEIC của người làm TOOEZ' },

  // Trang "Về Tooez". Sửa thành câu chuyện của bạn.
  story: [
    'Nhiều bạn học TOEIC rất chăm mà điểm vẫn đứng yên. Thường không phải do thiếu tài liệu, mà do chưa biết mình hay sai ở đâu và luyện chưa đủ để thành phản xạ.',
    'TOOEZ làm đúng việc đó: đề từng Part để biết mình đang ở đâu, Sổ lỗi để gọi tên từng lỗi sai, Lab phản xạ để luyện đến khi quen tay.',
    'Tự học trên TOOEZ là miễn phí. Ai muốn được kèm sát hơn thì có coach. Thấy web có ích thì rủ bạn bè vào học cùng, hoặc mua cho mèo Tooez một hộp pate là quý lắm rồi 🐟',
  ],

  // Đếm lượt truy cập (không bắt buộc). Tạo tài khoản miễn phí ở goatcounter.com, điền mã vào đây.
  // Ví dụ tạo ra trang tooez.goatcounter.com thì điền 'tooez'. Để trống thì web không đếm gì.
  analytics: { goatcounter: '' },
};
