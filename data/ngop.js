/* Ba bộ đoạn ba (câu 186-200) để luyện cách "ăn câu nhanh trước, nhai câu khó sau".
   tier: f = ăn nhanh, m = vừa, s = phải nhai (nối nhiều bài)
   ev: id các đoạn bằng chứng trong docs (thẻ <mark data-ev="...">) */
window.NGOP_SETS = [
{
  id: 'foxglove', title: 'Foxglove Craft Supply', kind: 'Bài báo + Phiếu đăng ký + Bảng hướng dẫn', first: 186,
  docs: [
    { name: 'Bài báo', html: `<h4>Foxglove Craft Supply Invites Shoppers to the Workbench</h4>
<p>September 20 — For more than forty years, Foxglove Craft Supply has sold yarn, paint, clay, and countless other materials to the makers of Denbury. In all that time, however, <mark data-ev="a1">the shop has never once offered guided classes of its own</mark>. That is about to change. <mark data-ev="a2">Beginning next month, the store will run The Maker Sessions, a series of hands-on workshops</mark> in which shoppers can learn a new craft from start to finish and walk out with something they have made themselves.</p>
<p>Delia Faust, who manages events at the store, said the idea came from customers themselves. "People buy the supplies and then tell us they are not quite sure where to begin," she said. "We wanted to give them a place to sit down, try something, and leave with a finished piece they made by hand."</p>
<p>To introduce the program, Foxglove will hold a free preview afternoon on Saturday, October 5, when visitors can watch short demonstrations and ask questions at no cost. The paid sessions themselves begin on Saturday, October 19. Places are limited, and customers are encouraged to reserve a spot in advance, either through the store's Web page or at the customer desk.</p>` },
    { name: 'Phiếu đăng ký', html: `<h4>The Maker Sessions — Registration Form</h4>
<p>Name: Rosalind Pryce<br>Date: October 6<br>E-mail: r.pryce@brightmail.com<br>Telephone: (555) 0148</p>
<p><b>Please check your preferred session time (one only):</b><br>[ ] Saturday, October 19 — 10:00 a.m.<br>[x] Saturday, October 19 — 2:00 p.m.<br>[ ] Saturday, October 26 — 10:00 a.m.<br>[ ] Saturday, October 26 — 2:00 p.m.</p>
<p><b>Please rate your crafting experience</b> (1 = I have never tried, 5 = very experienced):<br><mark data-ev="b1">( 1 )</mark> 2 3 4 5</p>
<p><b>What do you hope to make or learn?</b><br>I would love to learn how to <mark data-ev="b2">make my own scented candles</mark> to give as gifts. I have never made anything like this by hand before, so <mark data-ev="b3">I am really starting from the very beginning</mark>.</p>
<p><b>How did you hear about The Maker Sessions?</b><br><mark data-ev="b4">My aunt has been attending candle-making and pottery workshops for years</mark> and is always talking about how much she enjoys them. When she heard that Foxglove was finally starting its own, she told me right away that I should sign up.</p>` },
    { name: 'Bảng hướng dẫn', html: `<h4>The Maker Sessions: Fall Workshop Guide</h4>
<p>Not sure which workshop to choose? The guide below sets out this fall's four sessions side by side, so you can see at a glance which one suits you best. <mark data-ev="c1">Every session in The Maker Sessions includes all the materials you will need</mark>, so you can simply show up and start creating.</p>
<div class="ktw"><table class="kt"><thead><tr><th>Session</th><th>What you make</th><th>Recommended level</th><th>Length</th></tr></thead><tbody>
<tr><td><mark data-ev="c2">Hand-Poured Candles</mark></td><td><mark data-ev="c2">Scented pillar candles</mark></td><td><mark data-ev="c2">Beginner</mark></td><td>90 minutes</td></tr>
<tr><td>Sculptural Candle Techniques</td><td>Layered decorative candles</td><td>Advanced</td><td>2.5 hours</td></tr>
<tr><td>Introduction to Pottery</td><td>A small clay bowl</td><td>Beginner</td><td>2 hours</td></tr>
<tr><td>Handmade Gift Cards</td><td>A set of greeting cards</td><td>Intermediate</td><td>90 minutes</td></tr></tbody></table></div>` }
  ],
  qs: [
    { n: 186, q: 'What is the purpose of the article?', o: ['To announce that two shops have combined', 'To introduce a newly hired manager', 'To promote a new kind of service the store is offering', 'To explain how to reserve craft materials online'], a: 2, tier: 'f',
      sig: 'Hỏi mục đích bài → đọc 2-3 câu đầu là đủ.', ev: ['a1', 'a2'],
      why: 'Câu đầu nói cửa hàng <b>chưa từng mở lớp</b>, câu sau báo <b>sắp mở chuỗi workshop</b>. Workshop = “a new kind of service”.',
      trap: 'B: Delia Faust là người quản lý sự kiện có sẵn, bài không nói mới tuyển. D: bài nói đặt chỗ học (reserve a spot), không phải đặt nguyên liệu.' },
    { n: 187, q: 'What does Ms. Pryce suggest in the registration form?', o: ['She has taken a craft workshop before', 'She is new to crafting', 'She prefers a morning session', 'She found out about the program from the store\'s Web page'], a: 1, tier: 'm',
      sig: '“suggest” = suy ra từ 1 bài. Câu hỏi nhắc “registration form” → chỉ đọc phiếu.', ev: ['b1', 'b3'],
      why: 'Cô tự chấm kinh nghiệm <b>1</b> (= chưa từng thử) và viết “starting from the very beginning” → mới bắt đầu.',
      trap: 'A: người đi workshop nhiều năm là <b>bà dì</b>, không phải cô. C: cô tích ô <b>2:00 p.m.</b> (buổi chiều). D: cô biết qua bà dì.' },
    { n: 188, q: 'What is most likely true about Ms. Pryce\'s aunt?', o: ['She is also a beginner at crafts', 'She works at a Foxglove store', 'She lives outside Denbury', 'She attended workshops run by other providers'], a: 3, tier: 's',
      sig: '“most likely” + một người chỉ xuất hiện ở phiếu, nhưng đáp án cần thêm thông tin ở bài báo → câu nối 2 bài.', ev: ['b4', 'a1'],
      why: 'Phiếu: bà dì đi workshop <b>nhiều năm</b>. Bài báo: Foxglove <b>chưa từng</b> mở lớp. Vậy các lớp bà dì đi là của <b>nơi khác</b>.',
      trap: 'A: đi học nhiều năm thì không phải người mới. B, C: không bài nào nói tới. Đáp án đúng nằm ở chỗ ghép 2 bài, không có sẵn câu nào ghi thẳng.' },
    { n: 189, q: 'Which session would be most suitable for Ms. Pryce?', o: ['Introduction to Pottery', 'Sculptural Candle Techniques', 'Handmade Gift Cards', 'Hand-Poured Candles'], a: 3, tier: 's',
      sig: '“most suitable for + tên người” + có bảng → lấy điều kiện của người ở phiếu, mang sang lọc bảng.', ev: ['b2', 'b1', 'c2'],
      why: 'Hai điều kiện từ phiếu: muốn làm <b>nến thơm</b> và là <b>người mới</b>. Lọc bảng: chỉ “Hand-Poured Candles” vừa là nến thơm vừa ở mức Beginner.',
      trap: 'B: cũng là nến nhưng mức <b>Advanced</b>, chỉ khớp 1 điều kiện. A: mức Beginner nhưng làm gốm. Phương án chỉ khớp 1 điều kiện là bẫy kinh điển của câu nối bài.' },
    { n: 190, q: 'What is indicated about all of the sessions in the table?', o: ['They are suitable for beginners', 'They provide the materials that participants need', 'They last ninety minutes', 'They are intended for experienced crafters only'], a: 1, tier: 'm',
      sig: '“all of the sessions” → đọc câu giới thiệu ngay trên bảng; với từng phương án chỉ cần tìm 1 dòng trái ngược là loại.', ev: ['c1'],
      why: '“Every session … includes all the materials you will need” → mọi buổi đều có sẵn nguyên liệu.',
      trap: 'A: có buổi Advanced và Intermediate. C: chỉ 2 buổi dài 90 phút. D: có buổi Beginner. Mỗi phương án sai bị một dòng của bảng bác bỏ.' }
  ]
},
{
  id: 'cadwell', title: 'Cadwell Business Association', kind: 'E-mail + Trang phỏng vấn + Quảng cáo', first: 191,
  docs: [
    { name: 'E-mail', html: `<p>To: All Members<br>From: Louise Trevino<br>Date: 4 March<br>Subject: March skills workshop</p>
<p>Dear Members,</p>
<p>The Cadwell Business Association is pleased to invite you to our next member skills workshop, to be held at 6:30 P.M. on Thursday, 20 March, in the Marrick Conference Room at our main office. The session is free for all members, and <mark data-ev="a3">no prior preparation is required</mark>.</p>
<p><b>What to expect:</b></p><ul><li>A ninety-minute session on planning and managing daily operations</li><li>A guided exercise based on real workplace examples</li><li>A question-and-answer period with the presenter</li><li><mark data-ev="a2">A printed planning toolkit for every participant to take home</mark></li></ul>
<p>This month's session will be led by Desmond Attah, who <mark data-ev="a4">served as operations director for eighteen years at Hartigan and Vale</mark>. Alongside that work, <mark data-ev="a1">he co-runs a small print shop with his sister</mark>, and <mark data-ev="a5">he gives three hours each week to the Bright Futures Coding Club</mark>.</p>
<p>To reserve a place, please reply to this message no later than Monday, 17 March, so that we can confirm seating.</p><p>Kind regards,<br>Louise Trevino</p>` },
    { name: 'Trang phỏng vấn', html: `<p><i>http://www.summitskills.co - Meet Our Presenters</i></p>
<p><b>Interviewer:</b> Welcome, Desmond. Could you tell our members a little about your professional background?</p>
<p><b>Desmond Attah:</b> Of course. <mark data-ev="b1">I spent nearly two decades as an operations director at a commercial insurance provider</mark>, where I was responsible for coordinating the daily workflow across several busy departments.</p>
<p><b>Interviewer:</b> And where did your training begin?</p>
<p><b>Desmond Attah:</b> I completed a diploma in business administration at the Corley Institute, which gave me a solid foundation long before I ever managed a team.</p>
<p><b>Interviewer:</b> What will you focus on in your workshop for members?</p>
<p><b>Desmond Attah:</b> I will show participants simple, practical ways to plan their working day and keep projects on schedule, all without relying on extra software.</p>` },
    { name: 'Quảng cáo', html: `<h4>Bright Futures Coding Club</h4>
<p>Do you know a young person who is eager to learn how technology really works? Join a growing program that helps them build genuine skills, one session at a time. Sessions run every Saturday morning throughout the school term.</p>
<p><b>How it works:</b></p><ul><li>Open to students between the ages of 11 and 16</li><li>No experience or equipment required</li><li>Every student is paired with a friendly mentor</li><li>Places are offered on a first-come basis</li></ul>
<p>Last year we welcomed more than 300 young people to our sessions. <mark data-ev="c2">The Bright Futures Coding Club is run entirely by volunteers</mark>, and <mark data-ev="c1">our aim is simple: to help young people in our community gain practical coding skills</mark> that open doors to future study and work.</p>
<p>To take part, or to offer your time as a mentor, sign up at www.brightfuturesclub.org.</p>` }
  ],
  qs: [
    { n: 191, q: 'What does the e-mail indicate about Mr. Attah?', o: ['He runs a business with a family member.', 'He is currently employed at an insurance company.', 'He recently started his own print shop.', 'He earned his diploma together with a relative.'], a: 0, tier: 'm',
      sig: '“indicate about + tên người” → khoanh đoạn có tên người đó (đoạn cuối e-mail), so từng phương án.', ev: ['a1'],
      why: '“co-runs a small print shop with his sister”: sister = <b>a family member</b>, co-runs a shop = <b>runs a business</b>. Đáp án đổi từ hết, đây là dấu hiệu đáp án đúng.',
      trap: 'B: “served … for eighteen years” là chuyện đã qua, không nói hiện vẫn làm. C: bài không nói “recently”. D: bằng cấp ở bài 2, không có người thân.' },
    { n: 192, q: 'What will happen at the workshop?', o: ['Attendees must prepare a task beforehand.', 'Participants will receive printed materials to keep.', 'Refreshments will be served to guests.', 'Each attendee will give a short presentation.'], a: 1, tier: 'f',
      sig: 'Có danh sách “What to expect” → dò 4 gạch đầu dòng.', ev: ['a2', 'a3'],
      why: '“A printed planning toolkit for every participant to take home” = tài liệu in được mang về.',
      trap: 'A: e-mail nói ngược lại, “no prior preparation is required”. C, D: không có trong danh sách.' },
    { n: 193, q: 'What type of business is Hartigan and Vale?', o: ['A professional training academy', 'A business membership association', 'A commercial insurance company', 'A commercial printing company'], a: 2, tier: 's',
      sig: 'Tên công ty chỉ có ở e-mail, nhưng loại hình công ty lại nằm ở bài khác → câu nối 2 bài.', ev: ['a4', 'b1'],
      why: 'E-mail: làm giám đốc vận hành <b>18 năm ở Hartigan and Vale</b>. Phỏng vấn: <b>gần 20 năm</b> làm giám đốc vận hành ở <b>một công ty bảo hiểm thương mại</b>. Cùng một công việc → Hartigan and Vale là công ty bảo hiểm.',
      trap: 'B là Cadwell (hội đang mời), D là tiệm in của anh với em gái, A là Corley Institute nơi học. Ba phương án sai đều là tên có thật trong bài, gắn nhầm chỗ.' },
    { n: 194, q: 'According to the advertisement, what is a goal of the Bright Futures Coding Club?', o: ['To donate equipment to local schools', 'To provide career counseling to students', 'To help young people build practical skills', 'To raise money for community projects'], a: 2, tier: 'f',
      sig: '“According to the advertisement” + “goal” → tìm chữ aim / goal / mission trong quảng cáo.', ev: ['c1'],
      why: '“our aim is simple: to help young people … gain practical coding skills”. aim = goal.',
      trap: 'B: “future study and work” chỉ là kết quả, không phải tư vấn nghề. A: “No equipment required” nói học sinh không cần mang máy, không phải tặng thiết bị.' },
    { n: 195, q: 'What most likely is Mr. Attah\'s connection to the Bright Futures Coding Club?', o: ['He is a paid staff member.', 'He is a financial donor.', 'He founded the club.', 'He is a volunteer.'], a: 3, tier: 's',
      sig: '“most likely” + tên người ở e-mail + tên câu lạc bộ ở quảng cáo → nối 2 bài.', ev: ['a5', 'c2'],
      why: 'E-mail: anh dành <b>3 giờ mỗi tuần</b> cho câu lạc bộ. Quảng cáo: câu lạc bộ <b>do tình nguyện viên điều hành hoàn toàn</b>. Vậy anh là tình nguyện viên.',
      trap: 'A: đã “entirely by volunteers” thì không có nhân viên hưởng lương. B, C: không bài nào nói anh góp tiền hay sáng lập.' }
  ]
},
{
  id: 'fernbrook', title: 'Fernbrook Tool Library', kind: 'E-mail + Bảng điểm nhận đồ + Phiếu đặt', first: 196,
  docs: [
    { name: 'E-mail', html: `<p>From: Harriet Voss, Membership Coordinator<br>To: Trevor Aldington<br>Subject: Welcome to the Fernbrook Tool Library<br>Date: March 12</p>
<p>Dear Mr. Aldington,</p>
<p>Thank you for joining the Fernbrook Tool Library, a member-supported service that lends everyday equipment such as power drills, extension ladders, garden tools, and floor-cleaning machines. The library operates from a small workshop on Halbern Row in the Wexford district, and <mark data-ev="a1">members may reserve items online at any time</mark>. The rules described below apply to every reservation, so please read them carefully before placing your first request.</p>
<p>Each item may be borrowed for a maximum of fourteen days, after which it must be returned or renewed. For every loan, we hold a refundable deposit equal to twenty percent of the item's replacement value until the item comes back, and items returned after the due date are subject to an overdue charge of two dollars per item per day. Because short loans require additional handling, <mark data-ev="a2">any reservation covering fewer than three days must be approved in advance by a staff coordinator</mark>.</p>
<p>Your membership also carries several benefits. Members in good standing may borrow up to five items at one time at no additional charge, and <mark data-ev="a3">every member receives one free equipment-safety workshop each year</mark>.</p>
<p><mark data-ev="a4">If you intend to collect your items outside our staffed opening hours, please make sure you have activated your locker access code</mark> before arriving, as our counter staff will not be present to assist you.</p>
<p>Kind regards,<br>Harriet Voss</p>` },
    { name: 'Bảng điểm nhận đồ', html: `<div class="ktw"><table class="kt"><thead><tr><th>Collection Point</th><th>Weekday Hours</th><th>Weekend Hours</th><th>After-Hours Locker</th><th>Same-Day Booking Cutoff</th></tr></thead><tbody>
<tr><td>Halbern Row Workshop</td><td>9:00 A.M. - 5:00 P.M.</td><td>Closed</td><td>No</td><td>2:00 P.M.</td></tr>
<tr><td><mark data-ev="b2">Maple Street Depot</mark></td><td><mark data-ev="b2">10:00 A.M. - 6:00 P.M.</mark></td><td>9:00 A.M. - 1:00 P.M.</td><td><mark data-ev="b2">Yes</mark></td><td>3:00 P.M.</td></tr>
<tr><td><mark data-ev="b1">Kingsley Park Shed</mark></td><td><mark data-ev="b1">8:00 A.M.</mark> - 4:00 P.M.</td><td>8:00 A.M. - 12:00 P.M.</td><td>Yes</td><td>1:00 P.M.</td></tr>
<tr><td>Dorwin Court Annex</td><td>11:00 A.M. - 7:00 P.M.</td><td>Closed</td><td>No</td><td>4:00 P.M.</td></tr></tbody></table></div>` },
    { name: 'Phiếu đặt', html: `<h4>Fernbrook Tool Library - Reservation Summary</h4>
<p>Member: Trevor Aldington<br>Reservation Reference: TL-40518<br><mark data-ev="c3">Collection Point: Maple Street Depot</mark><br><mark data-ev="c1">Pickup Date and Time: Thursday, April 18 at 7:30 P.M.</mark><br><mark data-ev="c4">Return Date: Saturday, April 20</mark><br><mark data-ev="c2">Status: Confirmed online - short-loan request approved by coordinator</mark></p>
<p><b>Reserved Items and Deposits</b><br>- Cordless drill: $18.00<br>- Extension ladder: $24.00<br>- Pressure washer: $30.00<br>Total deposit held: $72.00</p>
<p>Please retain this summary. Questions may be sent to members@fernbrooktoollibrary.org.</p>` }
  ],
  qs: [
    { n: 196, q: 'According to the e-mail, how may members obtain the items they want?', o: ['By booking them through the Web site whenever they wish', 'By paying a regular membership fee', 'By visiting a large central store to select them', 'By reserving them at least three days ahead'], a: 0, tier: 'f',
      sig: '“According to the e-mail” + “how … obtain” → tìm động từ reserve / borrow trong đoạn đầu.', ev: ['a1'],
      why: '“reserve items online at any time” = “booking … through the Web site whenever they wish”.',
      trap: 'D: con số 3 ngày có trong bài nhưng nói về <b>độ dài lượt mượn</b>, không phải đặt trước bao lâu. C: bài nói “a small workshop”, không phải “large central store”.' },
    { n: 197, q: 'According to the e-mail, what is included with membership?', o: ['A price reduction for returning items early', 'Unlimited borrowing of any number of items', 'One free safety training session each year', 'A waived deposit for good-standing members'], a: 2, tier: 'f',
      sig: '“included with membership” → tìm chữ membership / benefits (đoạn 3).', ev: ['a3'],
      why: '“one free equipment-safety workshop each year” = “one free safety training session each year”.',
      trap: 'B: chỉ được tối đa <b>5 món</b>, không phải không giới hạn. D: tiền cọc giữ với <b>mọi</b> lượt mượn. A: không có ưu đãi trả sớm.' },
    { n: 198, q: 'According to the table, which collection point opens earliest on weekdays?', o: ['Kingsley Park Shed', 'Halbern Row Workshop', 'Maple Street Depot', 'Dorwin Court Annex'], a: 0, tier: 'f',
      sig: 'Câu tra bảng: chỉ nhìn đúng 1 cột (Weekday Hours), so giờ mở cửa.', ev: ['b1'],
      why: 'Giờ mở cửa ngày thường: Kingsley 8:00, Halbern 9:00, Maple 10:00, Dorwin 11:00 → Kingsley sớm nhất.',
      trap: 'Đừng nhìn nhầm cột Weekend hay giờ đóng cửa. Câu tra bảng gần như cho điểm, chỉ cần nhìn đúng cột.' },
    { n: 199, q: 'How did the Fernbrook Tool Library accommodate Mr. Aldington\'s reservation?', o: ['It reduced the deposit charged on his reserved items', 'It gave special approval for a loan of fewer than three days', 'It permitted a loan period longer than the usual maximum', 'It provided a free safety workshop with his booking'], a: 1, tier: 's',
      sig: '“accommodate” = cho ngoại lệ → tìm luật ở e-mail rồi đối chiếu phiếu đặt.', ev: ['a2', 'c1', 'c4', 'c2'],
      why: 'Phiếu: nhận thứ Năm 18/4, trả thứ Bảy 20/4 = <b>2 ngày</b>. Luật: dưới 3 ngày phải được điều phối viên <b>duyệt trước</b>. Phiếu ghi “short-loan request approved by coordinator”.',
      trap: 'A: cọc $72 = đúng 20% như thường lệ, không giảm. C: 2 ngày thì ngắn hơn, không dài hơn mức tối đa 14 ngày. D: không nhắc trong phiếu.' },
    { n: 200, q: 'What is suggested about Mr. Aldington\'s planned pickup?', o: ['He reserved his items in person at the depot', 'He will arrive during the depot\'s weekend hours', 'He will take part in a training session when he collects', 'He will need to use his locker access code'], a: 3, tier: 's',
      sig: 'Câu cuối bộ ba thường nối cả 3 bài: giờ hẹn (phiếu) + giờ mở cửa (bảng) + luật (e-mail).', ev: ['c1', 'c3', 'b2', 'a4'],
      why: 'Phiếu: nhận ở <b>Maple Street</b> lúc <b>7:30 tối thứ Năm</b>. Bảng: ngày thường Maple đóng cửa <b>6:00 P.M.</b> và có tủ khóa. E-mail: nhận ngoài giờ có nhân viên thì phải dùng <b>mã tủ khóa</b>.',
      trap: 'B: thứ Năm là ngày thường, không phải cuối tuần. A: phiếu ghi “Confirmed online”, tức là đặt online.' }
  ]
}];
