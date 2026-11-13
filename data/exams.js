/* TOOEZ - Đề thi từng Part: làm như thi thật (đúng số câu, đúng thứ tự, bấm giờ), chấm xong chữa từng câu.
   Mỗi đề là danh sách id câu trong kho (data/bank.js) + vài bài viết thêm ở dưới (EXAM_EXTRA) để đủ số câu như đề thật.
   Part 1 dùng câu "Đối chiếu tranh" (id p1pic-<mã từ>), tạo từ ảnh trong img/p1. */
window.EXAM_EXTRA = [
  /* ---------- Part 3: bài có bảng (graphic) ---------- */
  ...[
    { prompt: 'What is the woman planning?', options: ['A training workshop', 'A job interview', 'A client dinner', 'A product launch'], answer: 0, skill: 'Mục đích',
      explain: 'Câu 1: “We\'re holding a <b>training workshop</b>.” Đáp án nhắc lại đúng ý, không cần paraphrase.' },
    { prompt: 'Look at the graphic. How much will the woman pay per hour?', options: ['$30', '$45', '$60', '$85'], answer: 2, skill: 'Câu hỏi đồ họa', graphic: 1,
      explain: 'Người đàn ông gợi ý “the room that <b>holds twenty-five</b>”, cô ấy đồng ý “I\'ll take that one”. Dòng sức chứa 25 là phòng Oak, giá $60. Bẫy: nghe “twenty people” rồi tìm số 20 trong bảng (không có), hoặc chọn phòng gần 20 nhất là Maple (15 người, không đủ chỗ).' },
    { prompt: 'What will the man send the woman?', options: ['A form for ordering refreshments', 'A map of the building', 'A revised invoice', 'A list of projectors'], answer: 0, skill: 'Việc tiếp theo',
      explain: 'Câu cuối: “I\'ll e-mail you <b>a form to choose the refreshments</b>.” Bẫy “projectors”: có nhắc máy chiếu, nhưng là thứ phòng nào cũng có, không phải thứ được gửi.' },
  ].map((q, i) => ({ id: 'ex-c12-' + i, src: 'exam', part: 3, block: 'A', kind: 'p34', set: 'ex-c12', setTitle: 'Đặt phòng đào tạo', pos: i + 1, ...q,
    passage: q.graphic ? '<table class="gtable"><caption>Meeting Room Rates</caption><tr><th>Room</th><th>Seats</th><th>Price per hour</th></tr><tr><td>Cedar</td><td>8</td><td>$30</td></tr><tr><td>Maple</td><td>15</td><td>$45</td></tr><tr><td>Oak</td><td>25</td><td>$60</td></tr><tr><td>Pine</td><td>40</td><td>$85</td></tr></table>' : undefined,
    audio: [
      { s: 'W', t: 'Hi, I\'d like to reserve a meeting room for next Tuesday morning. We\'re holding a training workshop.' },
      { s: 'M', t: 'Sure. How many people will be attending?' },
      { s: 'W', t: 'About twenty. Oh, and we\'ll need a projector.' },
      { s: 'M', t: 'All of our rooms have projectors. For twenty people, the room that holds twenty-five would work best.' },
      { s: 'W', t: 'Great, I\'ll take that one. Could you also arrange coffee for the group?' },
      { s: 'M', t: 'Of course. I\'ll e-mail you a form to choose the refreshments.' },
    ] })),
  /* ---------- Part 3: câu trích ngụ ý ---------- */
  ...[
    { prompt: 'What are the speakers mainly discussing?', options: ['Preparing a presentation of sales results', 'Hiring staff for a new office', 'Planning a business trip to Asia', 'Reducing company expenses'], answer: 0, skill: 'Ý chính',
      explain: 'Cả bài nói về số liệu doanh số (“sales figures”) và slide cho cuộc họp hội đồng (“presenting them at Friday\'s board meeting”, “the slides”). Bẫy “Asia”: Asia là khu vực có doanh số, không ai đi Asia.' },
    { prompt: 'Why does the woman say, "I\'m flying to the Denver office tomorrow"?', options: ['To explain why she cannot meet a deadline', 'To invite the man to join her', 'To ask for a travel reimbursement', 'To suggest moving the board meeting'], answer: 0, skill: 'Ý định / ngụ ý',
      explain: 'Ngay trước đó: slide phải nộp “by Wednesday”. Cô ấy đáp “Wednesday?” rồi nói mình đi Denver đến thứ Năm mới về, tức là không kịp hạn. Người đàn ông hiểu đúng ý đó nên nhận làm slide thay. Câu ngụ ý luôn phải đọc theo câu ngay trước và câu ngay sau.' },
    { prompt: 'What does the woman say she will do tonight?', options: ['Send some notes', 'Book a flight', 'Review the slides', 'Call Mr. Hale'], answer: 0, skill: 'Việc tiếp theo',
      explain: 'Câu cuối: “I\'ll <b>send you my notes</b> tonight.” Bẫy “Review the slides”: cô ấy sẽ xem slide online, nhưng là sau khi anh ấy làm xong, không phải tối nay.' },
  ].map((q, i) => ({ id: 'ex-c13-' + i, src: 'exam', part: 3, block: 'A', kind: 'p34', set: 'ex-c13', setTitle: 'Hạn nộp slide', pos: i + 1, ...q,
    audio: [
      { s: 'M', t: 'Rita, the sales figures for the Asia region came in this morning. They\'re well above our forecast.' },
      { s: 'W', t: 'That\'s great news. Are we still presenting them at Friday\'s board meeting?' },
      { s: 'M', t: 'Yes, but Mr. Hale wants the slides two days early, so by Wednesday.' },
      { s: 'W', t: 'Wednesday? I\'m flying to the Denver office tomorrow, and I won\'t be back until Thursday.' },
      { s: 'M', t: 'Hmm. Then I\'ll put the slides together, and you can review them online.' },
      { s: 'W', t: 'Thanks. I\'ll send you my notes tonight.' },
    ] })),
  /* ---------- Part 4: bài nói có lịch trình (graphic) ---------- */
  ...[
    { prompt: 'Who most likely is the speaker?', options: ['A tour guide', 'A safety inspector', 'A factory owner', 'A sales clerk'], answer: 0, skill: 'Người nói',
      explain: 'Câu 1: “I\'m Paula, and <b>I\'ll be your guide today</b>.” Bẫy “safety inspector”: có từ inspection, nhưng đó là lý do phòng thí nghiệm đóng cửa.' },
    { prompt: 'Look at the graphic. What time was the canceled stop scheduled to begin?', options: ['9:30', '10:00', '10:45', '11:30'], answer: 2, skill: 'Câu hỏi đồ họa', graphic: 1,
      explain: 'Bài nói: “The <b>quality lab</b> is closed this morning… we\'ll skip that stop.” Trên lịch, Quality lab bắt đầu lúc 10:45. Câu đồ họa không bao giờ hỏi thứ đọc được ngay trên bảng: nghe tên điểm dừng, rồi nhìn sang cột giờ.' },
    { prompt: 'What will listeners receive at the end of the tour?', options: ['A discount coupon', 'A free bicycle', 'A visitor badge', 'A factory map'], answer: 0, skill: 'Chi tiết',
      explain: 'Câu cuối: “everyone will receive <b>a coupon for ten percent off</b>” → discount coupon. Bẫy “visitor badge”: có nhắc, nhưng là thứ phải đeo từ đầu, không phải quà cuối buổi.' },
  ].map((q, i) => ({ id: 'ex-t10-' + i, src: 'exam', part: 4, block: 'A', kind: 'p34', set: 'ex-t10', setTitle: 'Tham quan nhà máy', pos: i + 1, ...q,
    passage: q.graphic ? '<table class="gtable"><caption>Lakeside Factory Tour</caption><tr><th>Time</th><th>Stop</th></tr><tr><td>9:30</td><td>Welcome video</td></tr><tr><td>10:00</td><td>Assembly line</td></tr><tr><td>10:45</td><td>Quality lab</td></tr><tr><td>11:30</td><td>Gift shop</td></tr></table>' : undefined,
    audio: [
      { s: 'S', t: 'Good morning, everyone, and welcome to the Lakeside Bicycle factory. I\'m Paula, and I\'ll be your guide today.' },
      { s: 'S', t: 'Before we start, please make sure your visitor badge is clearly visible at all times.' },
      { s: 'S', t: 'Now, there\'s been one change to the schedule you received. The quality lab is closed this morning for an inspection, so we\'ll skip that stop.' },
      { s: 'S', t: 'Instead, we\'ll spend more time at the assembly line, where you can watch the frames being painted.' },
      { s: 'S', t: 'And at the end of the tour, everyone will receive a coupon for ten percent off in our gift shop.' },
    ] })),
  /* ---------- Part 7: bộ 3 bài ---------- */
  ...(() => {
    const P = '<h4>Web page</h4><p class="ptitle">Greenfield Hotel Group: Summer Hiring Day</p><p><span data-ev="e1-1">Greenfield Hotel Group will hold a hiring day on Saturday, June 14, from 10 A.M. to 4 P.M. at our Riverside location, 200 Harbor Road.</span> <span data-ev="e1-2">Open positions include front desk agents, kitchen staff, and event coordinators.</span> <span data-ev="e1-3">Applicants for event coordinator positions must have at least two years of experience in event planning.</span> <span data-ev="e1-4">All applicants should bring a printed résumé.</span> <span data-ev="e1-5">Those who register online by June 10 will receive a free parking pass.</span></p>'
      + '<h4>E-mail</h4><p class="meta"><b>From:</b> Sana Malik - <b>To:</b> careers@greenfieldhotels.com - <b>Date:</b> June 8 - <b>Subject:</b> Hiring day</p><p><span data-ev="e1-6">Hello, I registered online yesterday for the hiring day on June 14, and I plan to apply for an event coordinator position.</span> <span data-ev="e1-7">I organized conferences for a university for three years before moving to this city last month.</span> <span data-ev="e1-8">However, I have a family commitment on the afternoon of June 14 and would need to leave by 1 P.M.</span> <span data-ev="e1-9">Could you tell me whether interviews for my position will be held before then?</span></p><p>Sana Malik</p>'
      + '<h4>E-mail</h4><p class="meta"><b>From:</b> Lena Ortiz, Recruiting Team - <b>To:</b> Sana Malik - <b>Date:</b> June 9 - <b>Subject:</b> RE: Hiring day</p><p><span data-ev="e1-10">Dear Ms. Malik, thank you for registering.</span> <span data-ev="e1-11">Interviews for event coordinators are scheduled from 1:30 to 4 P.M. in the Harbor Room.</span> <span data-ev="e1-12">However, we can arrange an earlier interview for you at 11:30 A.M. with Mr. Torres, our events manager.</span> <span data-ev="e1-13">Please confirm by replying to this e-mail, and remember to bring the item mentioned on our Web page.</span></p><p>Lena Ortiz</p>';
    return [
      { prompt: 'What is indicated about the hiring day?', options: ['It will last for two days.', 'It will be held at the Riverside location.', 'It is open only to experienced workers.', 'It requires online registration.'], answer: 1, skill: 'Chi tiết / NOT true', evidence: ['e1-1'],
        optWhy: ['Sai chi tiết: chỉ một ngày, thứ Bảy 14/6.', 'Bài 1, câu 1: “at our Riverside location”. Đáp án nhắc lại gần như nguyên văn.', 'Cực đoan hóa: chỉ vị trí event coordinator cần 2 năm kinh nghiệm, không phải mọi người.', 'Suy diễn quá đà: đăng ký online chỉ để nhận vé gửi xe miễn phí, không bắt buộc.'] },
      { prompt: 'What is suggested about Ms. Malik?', options: ['She will receive a free parking pass.', 'She has never worked in event planning.', 'She lives near Harbor Road.', 'She wants a kitchen position.'], answer: 0, skill: 'Liên kết văn bản', evidence: ['e1-6', 'e1-5'],
        optWhy: ['Ghép 2 bài: bài 2 nói cô ấy đăng ký online “yesterday” (ngày 7/6), bài 1 nói ai đăng ký trước 10/6 được vé gửi xe miễn phí.', 'Đảo nghĩa: cô ấy đã tổ chức hội nghị 3 năm.', 'Không có thông tin: Harbor Road là địa chỉ sự kiện, không phải nhà cô ấy.', 'Sai chi tiết: cô ấy ứng tuyển event coordinator.'] },
      { prompt: 'Why does Ms. Malik meet the requirement for the position she wants?', options: ['She has more than two years of relevant experience.', 'She recently moved to the city.', 'She registered before June 10.', 'She is available in the afternoon.'], answer: 0, skill: 'Liên kết văn bản', evidence: ['e1-7', 'e1-3'],
        optWhy: ['Bài 1: cần “at least two years of experience in event planning”. Bài 2: “organized conferences… for three years”. Tổ chức hội nghị = event planning.', 'Đúng thông tin nhưng không phải điều kiện tuyển dụng.', 'Đăng ký sớm chỉ được vé gửi xe, không liên quan yêu cầu công việc.', 'Đảo nghĩa: buổi chiều cô ấy bận.'] },
      { prompt: 'What does Ms. Ortiz offer to do?', options: ['Schedule an interview earlier in the day', 'Reimburse Ms. Malik\'s travel costs', 'Change the location of the event', 'Send a parking pass by mail'], answer: 0, skill: 'Đề nghị / yêu cầu', evidence: ['e1-12'],
        optWhy: ['Bài 3: “we can arrange an earlier interview for you at 11:30 A.M.”', 'Không có thông tin.', 'Không có thông tin: chỉ đổi giờ, không đổi địa điểm.', 'Không có thông tin.'] },
      { prompt: 'What does Ms. Ortiz remind Ms. Malik to bring?', options: ['A printed résumé', 'A reference letter', 'A photo ID', 'A parking pass'], answer: 0, skill: 'Liên kết văn bản', evidence: ['e1-13', 'e1-4'],
        optWhy: ['Bài 3 chỉ nói “the item mentioned on our Web page”. Quay lại bài 1: “All applicants should bring a printed résumé.”', 'Không có thông tin.', 'Không có thông tin.', 'Bẫy trùng chữ: parking pass có trong bài 1, nhưng là thứ người đăng ký sớm được nhận, không phải thứ mang theo.'] },
    ].map((q, i) => ({ id: 'ex-p7t-' + i, src: 'exam', part: 7, block: 'B', kind: 'p7', set: 'ex-p7t', setTitle: 'Bộ 3 bài - Ngày tuyển dụng', pos: i + 1, passage: P, explain: q.optWhy[q.answer], ...q }));
  })(),
];

/* Thứ tự câu trong đề = thứ tự trong ids. start = số câu đầu tiên như đề thật.
   time: phút làm bài (chỉ Part đọc). Part nghe chạy theo audio, không giới hạn giờ. */
window.EXAMS = [
  { id: 'x1-1', part: 1, n: 'Đề 1', start: 1, ids: ['P1-0071', 'P1-0061', 'P1-0063', 'P1-0087', 'P1-0312', 'P1-0320'].map(i => 'p1pic-' + i) },
  { id: 'x1-2', part: 1, n: 'Đề 2', start: 1, ids: ['P1-0077', 'P1-0066', 'P1-0090', 'P1-0060', 'P1-0222', 'P1-0233'].map(i => 'p1pic-' + i) },
  { id: 'x2-1', part: 2, n: 'Đề 1', start: 7, ids: ['doc-p2-52fe8fd7', 'n2-10', 'n2-25', 'doc-p2-e1b87229', 'n2-19', 'n2-1', 'doc-p2-bd3d2c5f', 'n2-7', 'doc-p2-c29a6494', 'n2-14', 'n2-21', 'doc-p2-65c78689', 'n2-2', 'n2-63', 'doc-p2-e936a6c5', 'n2-15', 'n2-28', 'doc-p2-ebd7d2cf', 'n2-6', 'n2-33', 'doc-p2-0cf71718', 'doc-p2-7d3a3bc0', 'n2-40', 'n2-39', 'n2-57'] },
  { id: 'x2-2', part: 2, n: 'Đề 2', start: 7, ids: ['n2-3', 'doc-p2-c25e8aae', 'n2-74', 'doc-p2-32367bdf', 'n2-64', 'n2-23', 'doc-p2-5efdbeb6', 'n2-16', 'n2-52', 'n2-9', 'n2-18', 'doc-p2-d58e0f50', 'n2-45', 'n2-84', 'n2-22', 'n2-58', 'doc-p2-c8f5f567', 'n2-48', 'n2-34', 'n2-11', 'doc-p2-03285391', 'n2-66', 'n2-97', 'doc-p2-154d1d4d', 'n2-56'] },
  { id: 'x3-1', part: 3, n: 'Đề 1', start: 32, sets: ['conv-c1', 'conv-c2', 'conv-c3', 'ex-c13', 'conv-c4', 'conv-c5', 'conv-c6', 'conv-c7', 'conv-c8', 'conv-c9', 'conv-c10', 'conv-c11', 'ex-c12'] },
  { id: 'x4-1', part: 4, n: 'Đề 1', start: 71, sets: ['conv-t1', 'conv-t2', 'conv-t3', 'conv-t4', 'conv-t5', 'conv-t6', 'conv-t7', 'conv-t8', 'conv-t9', 'ex-t10'] },
  { id: 'x5-1', part: 5, n: 'Đề 1', start: 101, time: 11, test: 'p5-t2' },
  { id: 'x5-2', part: 5, n: 'Đề 2', start: 101, time: 11, test: 'p5-t1' },
  { id: 'x6-1', part: 6, n: 'Đề 1', start: 131, time: 9, test: 'p6-t1' },
  { id: 'x7-1', part: 7, n: 'Đề 1', start: 147, time: 55, sets: ['p7-set1', 'p7-set2', 'p7-set3', 'p7x-p1', 'p7x-p2', 'p7x-p3', 'p7x-p6', 'p7x-p7', 'p7x-p8', 'p7-set4', 'p7x-p4', 'p7-set5', 'p7x-p5', 'ex-p7t'], drop: ['p7x-p6-3'] },
];

/* Luật làm bài và cách tự chữa, theo từng Part. Dùng ở trang giới thiệu đề và trang kết quả. */
window.EXAM_GUIDE = {
  1: { real: '6 câu (1-6). Mỗi câu nghe 4 câu tả (A)-(D) một lần, không in chữ, khoảng 5 giây để chọn.',
    rules: ['Nhìn tranh trước khi audio đọc: ai, đang làm gì, vật gì ở đâu.', 'Nghe hết cả 4 câu rồi mới chốt, vì câu sau có thể đúng hơn.', 'Câu nào có từ không thấy trong tranh thì loại ngay.'],
    fix: ['Nghe lại câu sai, chưa nhìn chữ. Ghi ra mình nghe được gì.', 'Mở chữ, so với lúc nãy: nghe sai từ nào (động từ, giới từ, being/been)?', 'Đối chiếu từng câu (A)-(D) với tranh, gọi tên lỗi: sai hành động, sai vị trí, có trong ảnh nhưng sai ý, "is being" khi không có người.', 'Ghi vào Sổ lỗi: kiểu bẫy + câu đúng. Đọc to câu đúng 3 lần (shadowing).', '2 ngày sau làm lại đúng câu đó.'] },
  2: { real: '25 câu (7-31). Nghe câu hỏi và 3 câu trả lời một lần, không in chữ, khoảng 5 giây để chọn.',
    rules: ['Tập trung 3-4 từ đầu câu hỏi: Who/When/Where, Do/Is, hay câu trần thuật.', 'Gặp từ lặp lại hoặc từ nghe giống từ trong câu hỏi thì cẩn thận, thường là bẫy.', 'Câu trả lời gián tiếp ("Let me check", "Ask Ms. Lee") rất hay là đáp án đúng.'],
    fix: ['Nghe lại câu hỏi. Ghi lại đúng từ để hỏi và ý chính.', 'Mở chữ: mình nghe sai câu hỏi hay nghe đúng mà chọn sai?', 'Gọi tên bẫy của đáp án mình chọn: lặp từ, gần âm, sai dạng câu hỏi (Yes/No cho câu Wh), sai thì, sai người.', 'Viết 1 câu trả lời đúng khác bằng lời của mình. Nếu viết được, bạn đã hiểu dạng này.', 'Ghi vào Sổ lỗi và làm lại sau 2 ngày.'] },
  3: { real: '39 câu (32-70), 13 đoạn hội thoại. Mỗi đoạn 3 câu hỏi in sẵn, sau đoạn hội thoại là 8 giây cho mỗi câu (bài có bảng: 12 giây).',
    rules: ['Đọc trước 3 câu hỏi trong lúc audio đọc đoạn trước. Gạch từ khóa: ai, làm gì, khi nào.', 'Đáp án thường đi theo thứ tự lời thoại: câu 1 ở đầu, câu 3 ở cuối.', 'Đáp án đúng hay nói lại bằng từ khác (paraphrase). Đáp án dùng y chang từ trong bài thường là bẫy.'],
    fix: ['Nghe lại cả đoạn, chưa nhìn chữ, trả lời lại 3 câu.', 'Mở transcript, tô câu chứa đáp án. Mình bỏ lỡ câu đó vì nghe không ra, không kịp, hay hiểu sai?', 'Ghi cặp paraphrase: từ trong bài → từ trong đáp án (vd. send you my notes → send some notes).', 'Với đáp án sai mình chọn: chỉ ra nó lấy từ đâu trong bài và sai chỗ nào.', 'Shadowing 2-3 câu chứa đáp án. Ghi vào Sổ lỗi, làm lại sau 2 ngày.'] },
  4: { real: '30 câu (71-100), 10 bài nói. Mỗi bài 3 câu hỏi in sẵn, sau bài nói là 8 giây cho mỗi câu (bài có bảng: 12 giây).',
    rules: ['Câu đầu bài thường cho biết loại bài và người nói (tin nhắn thoại, thông báo, quảng cáo...).', 'Nghe tín hiệu chuyển ý: however, unfortunately, instead, so please... Đáp án hay nằm ngay sau.', 'Câu hỏi đồ họa: nghe tên trong bài rồi nhìn sang cột còn lại của bảng.'],
    fix: ['Nghe lại cả bài, chưa nhìn chữ, trả lời lại 3 câu.', 'Mở transcript, tô câu chứa đáp án và tín hiệu đứng trước nó.', 'Ghi cặp paraphrase giữa bài nói và đáp án.', 'Câu đồ họa sai: mình đã đọc nhầm cột, hay nghe nhầm tên?', 'Shadowing câu chứa đáp án. Ghi vào Sổ lỗi, làm lại sau 2 ngày.'] },
  5: { real: '30 câu (101-130). Nên làm trong khoảng 10-11 phút, tức trung bình 20 giây một câu (câu từ loại 5-10 giây, câu từ vựng lâu hơn).',
    rules: ['Nhìn 4 đáp án trước: cùng gốc từ khác đuôi → câu từ loại, làm bằng quy tắc, khoảng 5-10 giây.', '4 từ khác nghĩa → câu từ vựng, phải đọc cả câu.', 'Không chắc thì chọn tạm, đánh dấu Phân vân, đi tiếp. Đừng mắc kẹt ở một câu.'],
    fix: ['Làm lại câu sai khi chưa xem đáp án, lần này không giới hạn giờ.', 'Xác định loại câu: từ loại, thì, đại từ, giới từ / liên từ, hay từ vựng.', 'Viết ra quy tắc làm câu đó (vd. "trước danh từ cần tính từ").', 'Với câu từ vựng: ghi cả cụm từ đi kèm (collocation), không ghi từ đơn lẻ.', 'Ghi vào Sổ lỗi, làm lại sau 2 ngày.'] },
  6: { real: '16 câu (131-146), 4 đoạn văn, mỗi đoạn 4 chỗ trống (có 1 câu chọn cả câu). Nên làm trong khoảng 8-9 phút.',
    rules: ['Câu ngữ pháp thì làm như Part 5, nhưng nhìn thêm câu trước để biết thì của động từ.', 'Câu chọn cả câu: đọc câu trước và câu sau chỗ trống, chọn câu nối được cả hai.', 'Từ nối (However, Therefore...) phải hợp quan hệ giữa hai câu: đối lập, kết quả hay thêm ý.'],
    fix: ['Đọc lại cả đoạn, làm lại câu sai.', 'Manh mối nằm ở đâu: trong câu, câu trước, hay câu sau? Gạch chân nó.', 'Câu chọn cả câu sai: đáp án mình chọn hỏng ở đâu (sai chủ đề, sai thì, không nối được câu sau)?', 'Ghi vào Sổ lỗi: loại câu + manh mối.', 'Làm lại cả đoạn sau 2 ngày.'] },
  7: { real: '54 câu (147-200): khoảng 29 câu đoạn đơn, 10 câu đoạn kép, 15 câu đoạn ba. Nên làm trong khoảng 55 phút.',
    rules: ['Đọc câu hỏi trước, gạch từ khóa, rồi mới đọc bài để tìm bằng chứng.', 'Câu NOT true / suy luận tốn giờ nhất, có thể để sau.', 'Đoạn kép, đoạn ba luôn có 1-2 câu phải ghép thông tin từ 2 bài.'],
    fix: ['Tìm lại câu bằng chứng trong bài và tô nó. Không tìm ra nghĩa là mình đang đoán.', 'So câu bằng chứng với đáp án đúng: chỗ nào được paraphrase?', 'Gọi tên bẫy của đáp án mình chọn: trùng chữ, sai chi tiết, cực đoan hóa, suy diễn quá đà, bỏ sót bài thứ hai.', 'Xem lại thời gian: câu nào tốn hơn 2 phút? Lần sau câu đó nên để lại sau.', 'Ghi vào Sổ lỗi, làm lại cả bộ sau 2 ngày.'] },
};
