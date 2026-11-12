/* Các bước nhỏ để Tooez "làm cùng" từng câu của 3 bộ đoạn ba (window.NGOP_SETS).
   t: 'tap'  = bấm vào đúng câu / dòng trong đoạn trích (doc: bài số mấy, ev: id bằng chứng chấp nhận)
      'pick' = chọn nhanh một ý nhỏ
      'elim' = gạch phương án sai chắc chắn (k: các phương án gạch được, need: cần gạch mấy cái)
      'info' = Tooez giải thích một mẹo, bấm "Hiểu rồi"
   Bước chọn loại câu (Ăn nhanh / Vừa / Phải nhai) và bước chọn đáp án được thêm tự động.
   fast: tóm tắt cách làm nhanh, hiện sau khi trả lời. */
window.NGOP_STEPS = {
  186: { fast: 'Câu mục đích: đọc 2-3 câu đầu, tìm câu nói “sắp làm gì mới”. Không cần đọc tiếp.', steps: [
    { t: 'tap', doc: 0, ev: ['a2', 'a1'], say: 'Hỏi mục đích thì chỉ cần mấy câu đầu bài báo. Bấm vào câu cho biết cửa hàng <b>sắp làm gì mới</b> nhé.', ok: 'Đúng câu này! “The store will run The Maker Sessions, a series of hands-on workshops”.' },
    { t: 'pick', say: '“A series of hands-on workshops” là gì?', o: ['Một dịch vụ mới: các lớp học thực hành', 'Một chi nhánh cửa hàng mới', 'Một mặt hàng mới'], a: 0, ok: 'Chuẩn! Lớp học là một <b>kiểu dịch vụ mới</b>, vì trước giờ cửa hàng chỉ bán đồ.' },
    { t: 'elim', say: 'Giờ gạch bớt phương án sai. Bấm vào <b>2 phương án</b> bạn chắc chắn sai.', k: [0, 1, 3], need: 2, notes: { 0: 'Đúng, bài không hề nói hai cửa hàng gộp lại.', 1: 'Đúng, Delia Faust là người quản lý sự kiện sẵn có, không phải mới tuyển.', 3: 'Đúng, bài nói đặt chỗ học (reserve a spot), không phải đặt mua nguyên liệu.' } },
  ] },
  187: { fast: 'Câu “suggest” về một người: chỉ đọc phần của người đó (ở đây là phiếu), tìm câu nói gần như thẳng.', steps: [
    { t: 'tap', doc: 1, ev: ['b1', 'b3'], say: 'Câu hỏi nói “in the registration form”, nên chỉ cần đọc phiếu. Bấm vào chỗ chị Pryce <b>tự chấm kinh nghiệm</b> của mình.', ok: 'Thấy rồi! Chị khoanh số <b>1</b>.' },
    { t: 'pick', say: 'Trên phiếu, mức 1 nghĩa là gì?', o: ['Chưa từng thử (I have never tried)', 'Rất có kinh nghiệm'], a: 0, ok: 'Đúng! Chị còn viết “starting from the very beginning”. Hai chỗ cùng nói một ý.' },
    { t: 'elim', say: 'Gạch <b>2 phương án</b> sai chắc chắn nào.', k: [0, 2, 3], need: 2, notes: { 0: 'Chuẩn! Người đi workshop nhiều năm là <b>bà dì</b>, không phải chị. Bẫy gán nhầm người.', 2: 'Chuẩn! Chị tích ô <b>2:00 p.m.</b>, là buổi chiều.', 3: 'Chuẩn! Chị biết chương trình qua bà dì.' } },
  ] },
  188: { fast: 'Câu nối 2 bài: lấy chuyện của người đó ở phiếu, ghép với một sự thật ở bài báo. Đáp án không có sẵn ở câu nào, phải ghép mới ra.', steps: [
    { t: 'tap', doc: 1, ev: ['b4'], say: 'Bà dì chỉ xuất hiện ở phiếu. Bấm vào câu nói về <b>bà dì</b> nhé.', ok: 'Đây rồi: bà đi workshop làm nến và gốm <b>nhiều năm</b> rồi.' },
    { t: 'pick', say: 'Đi học nhiều năm rồi, vậy bà dì có phải người mới không?', o: ['Không, bà có kinh nghiệm', 'Có, bà vẫn là người mới'], a: 0, ok: 'Đúng! Vậy phương án A loại được luôn.' },
    { t: 'tap', doc: 0, ev: ['a1'], say: 'Giờ sang bài báo. Bấm vào câu cho biết Foxglove <b>trước đây</b> có mở lớp hay không.', ok: 'Đúng câu này: Foxglove <b>chưa từng</b> mở lớp.' },
    { t: 'pick', say: 'Foxglove chưa từng mở lớp, mà bà dì đã đi học nhiều năm. Vậy bà học ở đâu?', o: ['Ở nơi khác, không phải Foxglove', 'Ở Foxglove'], a: 0, ok: 'Ghép được rồi đó! Đây chính là cách làm câu nối 2 bài.' },
  ] },
  189: { fast: 'Câu “most suitable for + người”: lấy 2 điều kiện của người đó, mang sang bảng lọc. Phương án chỉ khớp 1 điều kiện là bẫy.', steps: [
    { t: 'tap', doc: 1, ev: ['b2'], say: 'Điều kiện thứ nhất: chị Pryce muốn làm gì? Bấm vào chỗ chị viết.', ok: 'Điều kiện 1: <b>nến thơm</b> (scented candles).' },
    { t: 'pick', say: 'Điều kiện thứ hai: chị ở mức nào? (Nhớ câu trước không?)', o: ['Người mới (Beginner)', 'Trung bình (Intermediate)', 'Nâng cao (Advanced)'], a: 0, ok: 'Điều kiện 2: <b>Beginner</b>. Giờ mang 2 điều kiện sang bảng.' },
    { t: 'tap', doc: 2, ev: ['c2'], say: 'Bấm vào dòng trong bảng <b>vừa</b> làm nến thơm <b>vừa</b> dành cho Beginner.', ok: 'Chuẩn! Chỉ có một dòng khớp cả hai điều kiện.' },
    { t: 'elim', say: 'Gạch <b>2 phương án</b> chỉ khớp 1 điều kiện hoặc không khớp gì.', k: [0, 1, 2], need: 2, notes: { 0: 'Đúng! Beginner nhưng làm <b>gốm</b>, chỉ khớp 1 điều kiện.', 1: 'Đúng! Cũng là nến nhưng mức <b>Advanced</b>, đây là bẫy hay gặp nhất.', 2: 'Đúng! Không phải nến, lại ở mức Intermediate.' } },
  ] },
  190: { fast: 'Câu có “all”: chỉ cần 1 dòng trái ngược là loại được phương án. Thông tin chung cho cả bảng thường nằm ở câu ngay trên bảng.', steps: [
    { t: 'info', say: 'Mẹo: câu hỏi có chữ <b>all</b> thì mỗi phương án sai chỉ cần <b>một dòng</b> trái ngược là loại được. Không cần đọc hết bảng.' },
    { t: 'elim', say: 'Nhìn bảng và gạch <b>3 phương án</b> sai.', k: [0, 2, 3], need: 3, notes: { 0: 'Đúng! Có buổi Advanced và Intermediate, nên không phải buổi nào cũng hợp người mới.', 2: 'Đúng! Có buổi 2 tiếng và 2,5 tiếng.', 3: 'Đúng! Có buổi Beginner mà.' } },
    { t: 'tap', doc: 2, ev: ['c1'], say: 'Còn lại một phương án. Kiểm tra thử: bấm vào câu <b>ngay trên bảng</b> nói về nguyên liệu.', ok: 'Đó! “Every session … includes all the materials”. Chắc chắn luôn.' },
  ] },
  191: { fast: 'Câu “indicate about + người”: khoanh đoạn có tên người đó, đi từng phương án. Đáp án đúng thường đổi từ (sister → a family member).', steps: [
    { t: 'tap', doc: 0, ev: ['a1'], say: 'Tìm trong e-mail câu nói anh Attah làm gì <b>ngoài công việc chính</b>.', ok: 'Đây: anh cùng <b>em gái</b> điều hành một tiệm in nhỏ.' },
    { t: 'pick', say: '“His sister” và “co-runs a print shop” được đổi thành gì trong phương án?', o: ['a family member + runs a business', 'a coworker + works at a company'], a: 0, ok: 'Đúng! Đáp án đúng gần như luôn <b>đổi từ</b> như vậy.' },
    { t: 'elim', say: 'Gạch <b>2 phương án</b> sai.', k: [1, 2, 3], need: 2, notes: { 1: 'Đúng! “served … for eighteen years” là chuyện đã qua, không nói hiện vẫn làm.', 2: 'Đúng! Bài không hề nói “recently”.', 3: 'Đúng! Bằng cấp ở bài 2, không nhắc người thân.' } },
  ] },
  192: { fast: 'Có danh sách “What to expect” thì chỉ dò 4 gạch đầu dòng.', steps: [
    { t: 'tap', doc: 0, ev: ['a2'], say: 'E-mail có danh sách “What to expect”. Bấm vào gạch đầu dòng nói về thứ được <b>mang về</b>.', ok: 'Chuẩn! “A printed planning toolkit … to take home”.' },
    { t: 'elim', say: 'Gạch <b>1 phương án</b> mà e-mail nói ngược hẳn lại.', k: [0], need: 1, notes: { 0: 'Đúng! E-mail ghi “no prior preparation is required”, tức không cần chuẩn bị gì.' } },
  ] },
  193: { fast: 'Tên công ty ở bài này, loại hình công ty ở bài kia. Nối bằng chi tiết giống nhau (18 năm ≈ gần 20 năm, cùng chức giám đốc vận hành).', steps: [
    { t: 'tap', doc: 0, ev: ['a4'], say: 'Tên Hartigan and Vale nằm ở e-mail. Bấm vào câu có tên đó.', ok: 'Anh làm giám đốc vận hành ở đó <b>18 năm</b>. Nhưng chưa biết đó là công ty gì.' },
    { t: 'pick', say: 'Loại hình công ty phải tìm ở đâu?', o: ['Bài 2: chỗ anh tự kể về công việc', 'Bài 3: quảng cáo câu lạc bộ'], a: 0, ok: 'Đúng hướng! Anh kể lại sự nghiệp ở bài phỏng vấn.' },
    { t: 'tap', doc: 1, ev: ['b1'], say: 'Bấm vào câu anh kể về <b>gần 20 năm</b> làm giám đốc vận hành.', ok: '18 năm ≈ gần 20 năm, cùng chức vụ, và đó là một <b>công ty bảo hiểm thương mại</b>.' },
  ] },
  194: { fast: 'Câu “goal”: tìm chữ aim / goal / mission trong đúng bài được nhắc.', steps: [
    { t: 'tap', doc: 2, ev: ['c1'], say: 'Tìm chữ <b>aim</b> hoặc <b>goal</b> trong quảng cáo.', ok: 'Đây: “our aim is simple: to help young people … gain practical coding skills”.' },
  ] },
  195: { fast: 'Người ở e-mail + câu lạc bộ ở quảng cáo: lấy việc anh làm cho câu lạc bộ, ghép với cách câu lạc bộ vận hành.', steps: [
    { t: 'tap', doc: 0, ev: ['a5'], say: 'Anh Attah làm gì cho câu lạc bộ? Tìm trong e-mail.', ok: 'Anh dành <b>3 giờ mỗi tuần</b> cho câu lạc bộ.' },
    { t: 'tap', doc: 2, ev: ['c2'], say: 'Sang quảng cáo: câu lạc bộ do <b>ai</b> điều hành?', ok: 'Do <b>tình nguyện viên</b> điều hành hoàn toàn.' },
    { t: 'pick', say: 'Ghép hai ý lại: anh là…', o: ['Tình nguyện viên', 'Nhân viên hưởng lương', 'Người sáng lập'], a: 0, ok: 'Ghép chuẩn rồi!' },
  ] },
  196: { fast: 'Tìm động từ reserve / borrow ở đoạn đầu. Cẩn thận con số đúng trong bài nhưng nói chuyện khác.', steps: [
    { t: 'tap', doc: 0, ev: ['a1'], say: 'Tìm chữ <b>reserve</b> ở đoạn đầu e-mail.', ok: '“Reserve items online at any time” = đặt qua web lúc nào cũng được.' },
    { t: 'elim', say: 'Phương án D có số 3 ngày, cũng có trong bài. Có đúng không? Gạch nếu sai.', k: [3], need: 1, notes: { 3: 'Đúng! Số 3 ngày nói về <b>độ dài lượt mượn</b>, không phải đặt trước bao lâu.' } },
  ] },
  197: { fast: 'Câu “included with membership”: tìm chữ membership / benefits.', steps: [
    { t: 'tap', doc: 0, ev: ['a3'], say: 'Tìm đoạn nói về <b>quyền lợi hội viên</b> (benefits).', ok: '“One free equipment-safety workshop each year”.' },
  ] },
  198: { fast: 'Câu tra bảng: chỉ nhìn đúng 1 cột cần.', steps: [
    { t: 'tap', doc: 1, ev: ['b1'], say: 'Chỉ nhìn cột <b>Weekday Hours</b>. Bấm vào dòng mở cửa sớm nhất.', ok: '8:00 A.M., sớm nhất bảng.' },
  ] },
  199: { fast: '“Accommodate” = cho ngoại lệ. Tính số ngày ở phiếu, so với luật ở e-mail.', steps: [
    { t: 'tap', doc: 2, ev: ['c1', 'c4'], say: 'Phiếu: anh mượn từ ngày nào đến ngày nào?', ok: 'Nhận thứ Năm 18/4, trả thứ Bảy 20/4.' },
    { t: 'pick', say: 'Vậy lượt mượn dài mấy ngày?', o: ['2 ngày', '5 ngày', '14 ngày'], a: 0, ok: 'Đúng, <b>2 ngày</b>, khá ngắn.' },
    { t: 'tap', doc: 0, ev: ['a2'], say: 'E-mail có luật gì về lượt mượn <b>dưới 3 ngày</b>? Bấm vào câu đó.', ok: 'Dưới 3 ngày phải được điều phối viên <b>duyệt trước</b>, và phiếu ghi đã được duyệt.' },
  ] },
  200: { fast: 'Neo vào dòng giờ nhận đồ ở phiếu, rồi đi từ phương án: A, B, C loại bằng 1 dòng; D kiểm tra bằng dòng Maple trong bảng và luật tủ khóa ở e-mail.', steps: [
    { t: 'tap', doc: 2, ev: ['c1'], say: 'Neo vào phiếu trước: bấm vào dòng <b>giờ nhận đồ</b>.', ok: 'Thứ Năm, 7:30 tối, ở Maple Street.' },
    { t: 'pick', say: 'Thứ Năm là ngày thường hay cuối tuần?', o: ['Ngày thường', 'Cuối tuần'], a: 0, ok: 'Ngày thường, nên B loại luôn.' },
    { t: 'tap', doc: 1, ev: ['b2'], say: 'Bảng: bấm vào dòng của <b>Maple Street</b>.', ok: 'Ngày thường mở tới <b>6:00 P.M.</b>, có tủ khóa.' },
    { t: 'pick', say: 'Nhận lúc 7:30 tối thì là…', o: ['Ngoài giờ có nhân viên', 'Trong giờ có nhân viên'], a: 0, ok: 'Đúng, ngoài giờ rồi.' },
    { t: 'tap', doc: 0, ev: ['a4'], say: 'E-mail: nhận đồ ngoài giờ thì phải làm gì? Bấm vào câu đó.', ok: 'Phải kích hoạt <b>mã tủ khóa</b>. Ghép đủ 3 bài rồi đó!' },
  ] },
};
