/* "Bạn bị ngộp Part 3, 4 và 7?" - trang hướng dẫn chống ngộp + bài tập bộ đoạn ba có hướng dẫn từng bước */
(function () {
const { $, $$, esc } = X, icon = X.icon, S = X.S;
const SETS = window.NGOP_SETS || [];
const TIER = {
  f: { n: 'Ăn nhanh', c: 'sage', t: '20-40 giây' },
  m: { n: 'Vừa', c: 'gold', t: '40-70 giây' },
  s: { n: 'Phải nhai', c: 'ember', t: '60-120 giây' },
};
const tierPill = k => `<span class="pill ${TIER[k].c}">${TIER[k].n}</span>`;
const ng = () => { const s = S(); s.ngop = s.ngop || { steps: {}, sets: {} }; s.ngop.steps = s.ngop.steps || {}; s.ngop.sets = s.ngop.sets || {}; return s.ngop; };

/* ---------- bậc thang luyện tập ---------- */
const LADDER = {
  p7: [
    { k: 'p7-1', n: 'Chỉ làm câu hỏi mục đích', d: 'Mỗi bài chỉ đọc 2-3 câu đầu rồi trả lời “What is the purpose…?”. Mục tiêu: dưới 30 giây một câu. Đây là câu dễ ăn nhất Part 7, làm quen để thấy “à, không phải đọc hết”.', href: '#/lab/p7-radar', btn: 'Radar dạng câu Part 7' },
    { k: 'p7-2', n: 'Săn chi tiết: tên, số, ngày', d: 'Đọc câu hỏi, gạch 1 từ khóa (tên, số, ngày, địa điểm), rồi quét tìm đúng từ đó. Không đọc cả bài. Mục tiêu: dưới 45 giây một câu.', href: '#/lab/p7-locate', btn: 'Định vị bằng chứng' },
    { k: 'p7-3', n: 'Nhận ra đáp án đã đổi từ', d: 'Đáp án đúng hiếm khi chép nguyên câu trong bài. Luyện nhận ra “sister” = “a family member”, “aim” = “goal”. Đây là kỹ năng ăn điểm nhiều nhất.', href: '#/lab/para-pairs', btn: 'Paraphrase Sprint' },
    { k: 'p7-4', n: 'Câu NOT / TRUE và bẫy thông tin cũ', d: 'Với câu NOT: biến 4 phương án thành 4 câu đúng/sai nhỏ, đánh dấu ✓ từng cái. Luyện thêm bẫy “thông tin đã đổi”.', href: '#/lab/p7-trap', btn: 'Bẫy thông tin cũ' },
    { k: 'p7-5', n: 'Một bộ 5 câu, đi theo thứ tự thông minh', d: 'Làm 1 bộ đoạn ba có hướng dẫn: phân loại câu trước, làm câu nhanh trước, xem bằng chứng sau từng câu. Mục tiêu: 1 bộ trong 6-7 phút.', href: '#/ngop/bo/foxglove', btn: 'Làm bộ mẫu' },
    { k: 'p7-6', n: 'Đề Part 7 đầy đủ, bấm giờ', d: 'Khi bậc 5 đã thấy nhẹ: làm cả đề, giữ nhịp khoảng 1 phút mỗi câu, áp dụng luật 90 giây. Chữa từng câu sai trong Sổ lỗi.', href: '#/exam/x7-1', btn: 'Đề Part 7' },
  ],
  p34: [
    { k: 'p34-1', n: 'Đọc trước câu hỏi trong 8 giây', d: 'Chỉ luyện một việc: nhìn 3 câu hỏi, gạch 1-2 từ khóa mỗi câu, đoán bài sẽ nói gì. Chưa cần nghe.', href: '#/lab/scan34', btn: 'Đọc lướt câu hỏi Part 3-4' },
    { k: 'p34-2', n: 'Nghe tín hiệu: But, Actually, Unfortunately…', d: 'Đáp án hay nằm ngay sau các từ đổi hướng. Nghe quen những từ này thì bớt phải căng tai nghe từng chữ.', href: '#/lab/signals', btn: 'Tín hiệu trong bài nghe' },
    { k: 'p34-3', n: 'Một đoạn hội thoại, đủ 3 câu', d: 'Nghe 1 đoạn, trả lời ngay trong lúc nghe. Nghe lại để tìm câu chứa đáp án. Mỗi ngày 3-5 đoạn là đủ.', href: '#/lab/p34-conv', btn: '20 hội thoại có tín hiệu' },
    { k: 'p34-4', n: 'Câu ngụ ý và câu đồ họa', d: 'Hai dạng hay làm rối. Câu ngụ ý: nghe câu ngay trước câu được trích. Câu đồ họa: nhìn bảng trước, nghe cột còn lại.', href: '#/lab/implied', btn: 'Câu ngụ ý' },
    { k: 'p34-5', n: 'Nhiều đoạn liên tiếp, không dừng', d: 'Làm đề Part 3 hoặc Part 4 không dừng giữa chừng. Mục tiêu không phải đúng hết, mà là không bao giờ để một câu lỡ kéo mất đoạn sau.', href: '#/exam/x3-1', btn: 'Đề Part 3' },
  ],
};
const ladderHtml = (key, title) => {
  const st = ng().steps;
  return `<div class="card ng-ladder"><div class="h3" style="margin-bottom:10px">${title}</div>
    ${LADDER[key].map((s, i) => `<div class="ng-step ${st[s.k] ? 'done' : ''}" data-k="${s.k}">
      <button class="ng-tick" data-k="${s.k}" data-n="${i + 1}" aria-label="Đánh dấu đã qua bậc ${i + 1}">${st[s.k] ? icon('check') : i + 1}</button>
      <div class="grow"><b>Bậc ${i + 1}. ${esc(s.n)}</b><div class="small muted">${esc(s.d)}</div>
      <a class="btn sm" href="${s.href}">${esc(s.btn)} ${icon('arrow')}</a></div></div>`).join('')}
  </div>`;
};

/* ---------- trang chính ---------- */
X.route(/^\/ngop$/, view => {
  X.track && X.track('xem-ngop', 'Xem trang Bị ngộp Part 3, 4, 7');
  const sets = ng().sets;
  view.innerHTML = `<div class="page ng-pg">
  <div class="card tint ng-hero"><div class="grow">
    <div class="kicker">Dành cho bạn đang thấy Part 3, 4, 7 quá sức</div>
    <h1 class="h1">Bạn bị ngộp Part 3, 4 và 7?</h1>
    <p class="lead">Nhìn 3 bài dài với 5 câu hỏi mà muốn buông bút là chuyện rất bình thường. Đó là phản ứng của não khi nhận quá nhiều thứ cùng lúc, không phải dấu hiệu bạn kém. Trang này chỉ cách chia nhỏ đề ra để làm từng miếng một, câu nào ăn nhanh, câu nào phải nhai, và luyện từng bậc cho tới khi không còn sợ.</p>
  </div><div class="ng-cat">${X.xi('happy', 130)}</div></div>

  <div class="sec"><div class="h3" style="margin-bottom:10px">Bạn đang ngộp ở chỗ nào?</div>
    <div class="ng-jump">
      <a href="#ng-vi-sao" data-j>Vừa mở đề đã thấy sợ</a>
      <a href="#ng-p34" data-j>Part 3-4 nghe sót một câu là rối cả bộ</a>
      <a href="#ng-p7" data-j>Part 7 dài quá, đọc không kịp</a>
      <a href="#ng-nhai" data-j>Gặp câu khó là đứng hình</a>
      <a href="#ng-lui" data-j>Muốn lụi cho xong</a>
      <a href="#ng-bac" data-j>Muốn luyện từng bước</a>
    </div></div>

  <div class="sec" id="ng-vi-sao"><div class="kicker">1. Hiểu cái ngộp</div><h2 class="h2">Vì sao bị ngộp? Ba lý do có thật</h2>
    <div class="grid g3 ng-why">
      <div class="card"><div class="ng-num">4</div><b>Bộ nhớ làm việc rất nhỏ</b>
        <p class="small">Cùng một lúc, não chỉ giữ được khoảng <b>4 mẩu thông tin</b>. Một bộ đoạn ba có khoảng 600-800 chữ và 20 phương án. Nếu đọc hết 3 bài rồi mới xem câu hỏi thì chắc chắn tràn, và cảm giác tràn đó chính là “ngộp”.</p>
        <p class="small"><b>Cách gỡ:</b> mỗi lúc chỉ ôm <b>1 câu hỏi</b> và <b>1 đoạn</b> chứa đáp án.</p></div>
      <div class="card"><div class="ng-num">1+1</div><b>Lo lắng chiếm chỗ trong đầu</b>
        <p class="small">Khi lo, một phần bộ nhớ bận nghĩ “chết rồi, không kịp”. Phần còn lại để hiểu bài bị thu hẹp, nên càng lo càng đọc không vào. Không phải bạn dốt đi, mà là đầu đang phải làm hai việc một lúc.</p>
        <p class="small"><b>Cách gỡ:</b> các mẹo hạ nhịp ở mục 6 giúp giải phóng chỗ đó.</p></div>
      <div class="card"><div class="ng-num">0→1</div><b>Chưa có phản xạ</b>
        <p class="small">Người mới phải nghĩ từng bước: câu này hỏi gì, tìm ở đâu, đáp án nào đổi từ. Mỗi bước đều tốn sức. Luyện đủ thì các bước này thành phản xạ, giống đi xe đạp, và đầu rảnh ra để hiểu bài.</p>
        <p class="small"><b>Cách gỡ:</b> luyện tách từng kỹ năng nhỏ (mục 7), không cày đề full ngay.</p></div>
    </div></div>

  <div class="sec" id="ng-lui"><div class="kicker">2. Tính cho rõ</div><h2 class="h2">Cố thì được gì, nản thì mất gì</h2>
    <div class="grid g2">
      <div class="card"><b>Thử với 15 câu đoạn ba (186-200)</b><p class="small muted">Ví dụ lấy từ 3 bộ mẫu ở mục 8. Trong 15 câu đó có 6 câu ăn nhanh, 3 câu vừa, 6 câu phải nhai.</p>
        <div class="ng-bars">
          <div class="ng-bar"><span>Nản, lụi hết 15 câu</span><i style="--w:27%"></i><b>≈ 4 câu</b></div>
          <div class="ng-bar"><span>Chỉ làm 9 câu nhanh + vừa, lụi 6 câu nhai</span><i style="--w:60%"></i><b>≈ 9 câu</b></div>
          <div class="ng-bar"><span>Làm hết theo cách ở trang này</span><i style="--w:85%"></i><b>≈ 12-13 câu</b></div>
        </div>
        <p class="small">Chỉ cần không bỏ cuộc và làm 9 câu dễ là đã hơn lụi khoảng <b>5 câu</b>. Ở khoảng điểm giữa, mỗi câu đúng thêm thường tương đương khoảng <b>5 điểm Reading</b>, nên chênh lệch có thể tới khoảng 25 điểm, chỉ ở 15 câu cuối. Làm hết theo cách ở trang này thì chênh khoảng 9 câu, tức khoảng 45 điểm.</p>
        <p class="small muted">Đây là ước lượng: giả sử bạn đúng khoảng 85% số câu mình thực sự làm, lụi trúng 1/4. Bảng quy đổi điểm thật thay đổi theo từng đề.</p></div>
      <div class="card"><b>Những con số nên nhớ</b>
        <ul class="small ng-ul">
          <li>Part 7 có <b>54/100 câu</b> Reading, hơn nửa điểm đọc. Part 3 + Part 4 có <b>69/100 câu</b> Listening.</li>
          <li>TOEIC <b>không trừ điểm câu sai</b>. Để trống là chắc chắn mất. Hết giờ mà còn câu trống thì tô hết bằng cùng một chữ cái.</li>
          <li>Lụi thì trung bình trúng 1/4. <b>Đoán có cơ sở</b> (loại được 1-2 phương án sai rõ) thì lên 1/3 đến 1/2.</li>
          <li>Part 3-4: lỡ 1 câu mà cứ cố nhớ lại thì thường mất luôn bộ sau, tức là mất thêm 3 câu.</li>
        </ul>
        <b>Cái mất lớn hơn điểm số</b>
        <p class="small">Lụi thì bạn không biết mình sai vì đâu: thiếu từ, đọc chậm hay dính bẫy. Không có dữ liệu thì không biết luyện chỗ nào, và lần sau vẫn ngộp đúng chỗ đó. Mỗi lần buông ở chỗ khó, não cũng học thêm phản xạ “gặp khó thì bỏ”. Ngược lại, mỗi lần làm được một câu khó, phản xạ “mình làm được” mạnh thêm một chút. Cảm giác tự tin đến từ những lần tự làm được thật, chứ không phải từ việc tự nhủ “cố lên”.</p></div>
    </div></div>

  <div class="sec" id="ng-ban-do"><div class="kicker">3. Bản đồ câu hỏi</div><h2 class="h2">Câu nào ăn nhanh, câu nào phải nhai</h2>
    <p class="small muted" style="max-width:760px">Mọi câu đều ngang điểm nhau. Một câu mục đích 20 giây cũng được điểm bằng một câu nối 3 bài 2 phút. Vì vậy: <b>gom câu nhanh trước để lấy điểm chắc và lấy đà</b>, rồi mới dồn thời gian cho câu khó.</p>
    <div class="ktw"><table class="kt ng-map"><thead><tr><th>Loại</th><th>Part 7: dấu hiệu nhận ra</th><th>Part 3-4: dấu hiệu nhận ra</th><th>Cách làm</th></tr></thead><tbody>
      <tr><td>${tierPill('f')}<div class="small muted">${TIER.f.t}</div></td>
        <td class="small">“What is the purpose / main topic…?”<br>Hỏi tên, số, ngày, giá, địa điểm<br>“According to the table…”<br>“According to the e-mail, what is included…?”</td>
        <td class="small">“Who is the speaker / Where do they work?”<br>“What will the man do next?”<br>Hỏi giờ, ngày, số tiền</td>
        <td class="small">Mục đích: 2-3 câu đầu. Chi tiết: gạch 1 từ khóa rồi quét đúng từ đó. Hành động tiếp theo: nghe câu cuối.</td></tr>
      <tr><td>${tierPill('m')}<div class="small muted">${TIER.m.t}</div></td>
        <td class="small">“What is NOT mentioned / What is true…?”<br>“What is suggested / indicated about X?” (1 bài)<br>“The word X … is closest in meaning to”</td>
        <td class="small">“What problem does the woman mention?”<br>“What does the man ask for?”<br>Câu có tên người hoặc công ty</td>
        <td class="small">NOT: so từng phương án, đánh ✓/✗. Suggest: tìm câu nói gần như thẳng, chỉ đổi từ. Từ vựng: thay từng phương án vào câu.</td></tr>
      <tr><td>${tierPill('s')}<div class="small muted">${TIER.s.t}</div></td>
        <td class="small">Câu có tên người hoặc chi tiết xuất hiện ở 2 bài<br>“most likely / most suitable for…”<br>Câu chèn câu [1]-[4]<br>Câu cuối của bộ đoạn ba</td>
        <td class="small">“What does the woman mean when she says…?”<br>Câu có đồ họa (Look at the graphic)<br>Hỏi thái độ, lý do</td>
        <td class="small">Theo công thức nhai ở mục 4. Quá 90 giây thì đoán có cơ sở, đánh dấu, đi tiếp.</td></tr>
    </tbody></table></div></div>

  <div class="sec" id="ng-nhai"><div class="kicker">4. Câu khó</div><h2 class="h2">Câu khó thì nhai thế nào cho nuốt được</h2>
    <div class="grid g2 ng-recipes">
      <div class="card"><b>Câu nối 2-3 bài</b> ${tierPill('s')}
        <ol class="small"><li>Gạch <b>2 điều kiện</b> trong câu hỏi, thường là một người và một yêu cầu.</li><li>Tìm điều kiện 1 ở bài có tên người đó.</li><li>Mang nó sang bài kia (thường là bảng) để lọc.</li><li>Loại phương án chỉ khớp 1 điều kiện. Đó là bẫy quen thuộc nhất.</li></ol>
        <div class="ng-ex small"><b>Ví dụ câu 189:</b> Phiếu của chị Pryce cho 2 điều kiện: muốn làm <i>nến thơm</i> và <i>chưa từng thử</i>. Sang bảng thì chỉ “Hand-Poured Candles” khớp cả hai. “Sculptural Candle” cũng là nến nhưng ở mức Advanced, nên là bẫy.</div></div>
      <div class="card"><b>Câu cuối của bộ đoạn ba</b> ${tierPill('s')}
        <ol class="small"><li>Đoán trước: câu cuối hay cần cả 3 bài.</li><li>Lấy dữ kiện từ phiếu hoặc lịch: ngày, giờ, nơi.</li><li>Đối chiếu bảng: giờ mở cửa, có hay không có.</li><li>Áp luật trong e-mail: nếu… thì phải…</li></ol>
        <div class="ng-ex small"><b>Ví dụ câu 200:</b> Nhận đồ 7:30 tối thứ Năm ở Maple. Bảng ghi Maple đóng cửa 6:00 vào ngày thường. E-mail nói nhận ngoài giờ thì dùng mã tủ khóa. Vậy chọn D.</div></div>
      <div class="card"><b>Câu NOT / TRUE</b> ${tierPill('m')}
        <ol class="small"><li>Đừng đọc lại cả bài. Biến 4 phương án thành 4 câu đúng/sai nhỏ.</li><li>Mỗi câu nhỏ tìm 1 từ khóa trong bài, có thì ✓, trái thì ✗.</li><li>Câu NOT: phương án không tìm thấy hoặc trái với bài là đáp án.</li></ol>
        <div class="ng-ex small"><b>Ví dụ câu 190:</b> “all of the sessions”. Chỉ cần 1 dòng của bảng trái với phương án là loại được: có buổi Advanced, có buổi 2 tiếng. Còn lại câu “materials”.</div></div>
      <div class="card"><b>Câu “suggest / most likely”</b> ${tierPill('m')}
        <ol class="small"><li>Đáp án thường gần như được nói thẳng trong bài, chỉ đổi từ. Không cần suy diễn xa.</li><li>Loại phương án “đi quá đà”: always, only, all, never.</li><li>Loại phương án đúng nhưng nói về người khác (bẫy gán nhầm người).</li></ol>
        <div class="ng-ex small"><b>Ví dụ câu 187:</b> Người đi workshop nhiều năm là bà dì, không phải chị Pryce. Phương án A gán nhầm người.</div></div>
      <div class="card"><b>Câu chèn câu [1]-[4]</b> ${tierPill('s')}
        <ol class="small"><li>Đọc câu cần chèn và tìm “móc”: This, These, Such, However, also, In addition.</li><li>“This” chỉ cái gì? Nó phải đứng ngay sau câu nhắc tới cái đó.</li><li>Thử đọc câu trước và sau từng vị trí. Vị trí nào đọc trơn nhất thì chọn.</li></ol></div>
      <div class="card"><b>Câu ngụ ý Part 3-4</b> ${tierPill('s')}
        <ol class="small"><li>Trước khi nghe, đọc kỹ câu được trích.</li><li>Đáp án nằm ở <b>câu ngay trước</b> câu trích: người kia vừa nói gì.</li><li>Cùng một câu “I've got a meeting at three.” có thể là từ chối, xin lỗi hay giục, tùy câu trước.</li></ol></div>
    </div></div>

  <div class="sec" id="ng-p34"><div class="kicker">5. Part 3-4</div><h2 class="h2">Part 3-4: nghe theo nhịp, không chạy theo bài</h2>
    <div class="grid g3">
      <div class="card"><b>Trước khi nghe</b><ul class="small ng-ul">
        <li>Lúc máy đọc hướng dẫn đầu Part (khoảng 30 giây), đọc trước 3 câu của đoạn đầu tiên.</li>
        <li>Mỗi câu gạch 1-2 từ khóa: <i>man / woman</i>, việc gì, lúc nào.</li>
        <li>Đoán bối cảnh từ câu hỏi, ví dụ “hotel”, “order” → hội thoại ở khách sạn, về đơn hàng.</li></ul></div>
      <div class="card"><b>Trong lúc nghe</b><ul class="small ng-ul">
        <li>3 câu hỏi đi theo thứ tự lời thoại: câu 1 ở đầu, câu 3 ở cuối.</li>
        <li><b>Nghe tới đâu tô tới đó.</b> Đừng đợi nghe hết.</li>
        <li>Tai bắt các từ đổi hướng: But, Actually, Unfortunately, I'm afraid. Đáp án hay ở ngay sau.</li>
        <li>Đáp án đúng thường đổi từ: “running late” → “delayed”.</li></ul></div>
      <div class="card"><b>Khi lỡ một câu</b><ul class="small ng-ul">
        <li>Chọn ngay phương án nghi nhất, bỏ luôn câu đó.</li>
        <li>Trong lúc máy đọc câu hỏi của đoạn này (bạn đã tô xong), <b>đọc trước 3 câu của đoạn sau</b>.</li>
        <li>Luật vàng: <b>một câu lỡ không bao giờ được kéo theo đoạn sau</b>.</li>
        <li>Câu đồ họa: nhìn bảng trước. Phương án thường là 1 cột, bài sẽ nói tới cột kia.</li></ul></div>
    </div></div>

  <div class="sec" id="ng-p7"><div class="kicker">6. Part 7 và tâm lý phòng thi</div><h2 class="h2">Part 7: chia nhỏ thời gian, chia nhỏ bài</h2>
    <div class="grid g2">
      <div class="card"><b>Nhịp thời gian</b><ul class="small ng-ul">
        <li>Part 5 + 6 trong khoảng 18 phút, còn khoảng <b>55-57 phút cho Part 7</b>, tức khoảng <b>1 phút mỗi câu</b>.</li>
        <li>Một bộ đoạn ba 5 câu: khoảng 5-6 phút.</li>
        <li><b>Luật 90 giây:</b> một câu quá 90 giây thì đoán có cơ sở, đánh dấu, đi tiếp. Còn giờ thì quay lại.</li>
        <li>Đọc <b>câu hỏi trước</b>, rồi mới đọc bài, và chỉ đọc đoạn cần.</li></ul>
        <b>Trong mỗi bộ: 3 vòng</b><ol class="small"><li>Lướt 5 câu, đánh dấu Nhanh / Vừa / Nhai (khoảng 30 giây).</li><li>Làm hết câu Nhanh, rồi câu Vừa.</li><li>Dồn thời gian còn lại cho câu Nhai.</li></ol></div>
      <div class="card"><b>Khi thấy ngộp ngay trong phòng thi</b><ul class="small ng-ul">
        <li><b>Thở ra dài:</b> hít 2 hơi ngắn bằng mũi, thở ra thật dài bằng miệng. Làm 2 lần, mất khoảng 10 giây. Thở ra chậm giúp nhịp tim chậm lại.</li>
        <li><b>Gọi tên cảm giác cho đúng:</b> tim đập nhanh, tay lạnh là cơ thể đang dồn sức để tập trung. Nghiên cứu cho thấy người nghĩ “mình đang hồi hộp vì sẵn sàng” thường làm bài tốt hơn người cố ép mình bình tĩnh.</li>
        <li><b>Thu nhỏ tầm nhìn:</b> lấy giấy nháp che các câu khác, chỉ để lộ 1 câu. Tự nói: “Chỉ câu này thôi.”</li>
        <li><b>Sau một bộ làm tệ:</b> bộ mới là trang mới. Mọi câu đều ngang điểm, câu tiếp theo vẫn có điểm như thường.</li></ul>
        <b>Trước ngày thi</b><ul class="small ng-ul"><li>Viết ra giấy 10 phút những gì đang lo về bài thi. Một thí nghiệm với học sinh cho thấy cách này giúp điểm thi cải thiện, vì nỗi lo đã được “đặt xuống giấy” và không còn chiếm chỗ trong đầu.</li><li>Ngủ đủ. Thiếu ngủ làm bộ nhớ làm việc nhỏ đi rõ rệt.</li></ul></div>
    </div>
    <div class="card ng-guess"><b>Đoán có cơ sở khác lụi thế nào</b>
      <p class="small">Lụi là chọn bừa, trúng 1/4. Đoán có cơ sở là loại trước những phương án chắc chắn sai, rồi mới chọn trong số còn lại:</p>
      <div class="grid g4 small">
        <div><b>Trái với bài</b><br>Bài nói “no preparation”, phương án nói “must prepare”.</div>
        <div><b>Đúng nhưng của người khác</b><br>Chuyện của bà dì gán cho chị Pryce.</div>
        <div><b>Quá tuyệt đối</b><br>all, only, always, never mà bài không nói vậy.</div>
        <div><b>Chép nguyên từ trong bài</b><br>Phương án lặp y chữ trong bài thường là bẫy. Đáp án đúng hay đổi từ.</div>
      </div></div></div>

  <div class="sec" id="ng-bac"><div class="kicker">7. Luyện từng bước</div><h2 class="h2">Bậc thang luyện phản xạ</h2>
    <p class="small muted" style="max-width:760px">Mỗi ngày 15-20 phút, mỗi lần chỉ luyện một kỹ năng nhỏ. <b>Lên bậc</b> khi hai lần liên tiếp đúng khoảng 80%. Hôm nào mệt hay thấy khó thì <b>xuống lại 1 bậc</b>. Đó không phải thụt lùi mà là ôn cho chắc. Bấm vào số của từng bậc để đánh dấu đã qua.</p>
    <div class="grid g2">${ladderHtml('p7', 'Part 7')}${ladderHtml('p34', 'Part 3-4')}</div></div>

  <div class="sec" id="ng-thu"><div class="kicker">8. Thử ngay</div><h2 class="h2">Làm một bộ đoạn ba có người dẫn đường</h2>
    <p class="small muted" style="max-width:760px">Bước 1: phân loại 5 câu trong 30 giây. Bước 2: làm theo thứ tự câu nhanh trước. Sau mỗi câu, TOOEZ tô vàng đúng chỗ chứa đáp án trong bài và chỉ ra bẫy.</p>
    <div class="grid g3">${SETS.map(st => { const r = sets[st.id]; return `<a class="card link ng-set" href="#/ngop/bo/${st.id}">
      <div class="kicker">Câu ${st.first}-${st.first + 4}</div><div class="h3">${esc(st.title)}</div><div class="small muted">${esc(st.kind)}</div>
      <div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap">${st.qs.map(q => tierPill(q.tier)).join('')}</div>
      <div class="small" style="margin-top:10px">${r ? `${icon('check')} Đã làm: đúng <b>${r.ok}/5</b>, ${r.ms < 60000 ? Math.round(r.ms / 1000) + ' giây' : (Math.round(r.ms / 6000) / 10).toString().replace('.', ',') + ' phút'}` : 'Chưa làm'}</div></a>`; }).join('')}</div></div>

  <div class="sec"><div class="card tint ng-end">${X.xiSay('happy', 'Bạn không cần hết sợ rồi mới bắt đầu. Cứ làm một câu nhanh trước, nỗi sợ sẽ nhỏ lại theo từng câu làm được. Mỗi ngày một bậc nhỏ thôi, mình học cùng bạn.')}</div></div>

  <details class="sec ng-sci"><summary class="small"><b>Khoa học đằng sau các mẹo này</b></summary>
    <ul class="small muted">
      <li>Bộ nhớ làm việc chỉ giữ khoảng 4 mẩu thông tin: Cowan (2001), <i>Behavioral and Brain Sciences</i>.</li>
      <li>Chia nhỏ bài học và học qua ví dụ có lời giải giúp giảm quá tải: thuyết tải nhận thức của Sweller.</li>
      <li>Lo lắng chiếm chỗ của sự tập trung: thuyết kiểm soát chú ý, Eysenck và cộng sự (2007), <i>Emotion</i>.</li>
      <li>Viết ra nỗi lo trước bài thi giúp làm bài tốt hơn: Ramirez & Beilock (2011), <i>Science</i>.</li>
      <li>Coi hồi hộp là dấu hiệu sẵn sàng: Jamieson và cộng sự (2010); Brooks (2014), <i>Journal of Experimental Psychology: General</i>.</li>
      <li>Thở ra dài giúp hạ nhịp và cải thiện tâm trạng: Balban và cộng sự (2023), <i>Cell Reports Medicine</i>.</li>
      <li>Tự kiểm tra (làm câu hỏi) giúp nhớ lâu hơn đọc lại: Roediger & Karpicke (2006). Tự tin đến từ những lần tự làm được: Bandura.</li>
    </ul></details>
  </div>`;
  $$('[data-j]', view).forEach(a => a.onclick = e => { e.preventDefault(); const t = $(a.getAttribute('href'), view); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $$('.ng-tick', view).forEach(b => b.onclick = () => {
    const st = ng().steps, k = b.dataset.k; if (st[k]) delete st[k]; else { st[k] = Date.now(); X.addXP && X.addXP(5, 'Qua một bậc chống ngộp'); }
    X.save(); const row = b.closest('.ng-step'); row.classList.toggle('done', !!st[k]); b.innerHTML = st[k] ? icon('check') : b.dataset.n;
  });
});

/* ---------- bài tập 1 bộ đoạn ba ---------- */
X.route(/^\/ngop\/bo\/([\w-]+)$/, (view, id) => {
  const st = SETS.find(s => s.id === id); if (!st) { X.go('#/ngop'); return; }
  const order = st.qs.map((q, i) => i).sort((a, b) => 'fms'.indexOf(st.qs[a].tier) - 'fms'.indexOf(st.qs[b].tier) || a - b);
  const R = { guess: {}, ans: {}, ms: {}, t0: 0 };
  let timer = 0;
  X.onLeave(() => clearInterval(timer));
  const docsHtml = () => `<div class="ng-docs card"><div class="seg ng-tabs">${st.docs.map((d, i) => `<button data-d="${i}" class="${i ? '' : 'on'}">Bài ${i + 1}: ${esc(d.name)}</button>`).join('')}</div>
    ${st.docs.map((d, i) => `<div class="ng-doc prose" data-doc="${i}" ${i ? 'hidden' : ''}>${d.html}</div>`).join('')}</div>`;
  const showDoc = (root, i) => { $$('.ng-tabs button', root).forEach(b => b.classList.toggle('on', +b.dataset.d === i)); $$('.ng-doc', root).forEach(d => d.hidden = +d.dataset.doc !== i); };
  const docOf = (root, ev) => { const m = $(`.ng-doc mark[data-ev="${ev}"]`, root); return m ? +m.closest('.ng-doc').dataset.doc : 0; };
  const head = sub => `<a class="small" href="#/ngop">${icon('back')} Bị ngộp Part 3, 4, 7?</a>
    <div class="kicker" style="margin-top:12px">Bộ đoạn ba · câu ${st.first}-${st.first + 4}</div><h1 class="h2" style="margin:4px 0">${esc(st.title)}</h1><p class="small muted" style="margin:0">${esc(st.kind)}. ${sub}</p>`;

  // Bước 1: phân loại
  const step1 = () => {
    view.innerHTML = `<div class="page ng-pg">${head('Bước 1/2: chưa cần đọc bài, chỉ nhìn câu hỏi.')}
      <div class="card" style="margin-top:16px"><b>Câu nào ăn nhanh, câu nào phải nhai?</b>
        <p class="small muted">Chỉ đọc câu hỏi và đoán. Không cần đúng hết, mục đích là tập thói quen phân loại trước khi làm.</p>
        ${st.qs.map((q, i) => `<div class="ng-cls" data-i="${i}"><div class="grow"><b>${q.n}.</b> ${esc(q.q)}</div>
          <div class="seg">${'fms'.split('').map(k => `<button data-t="${k}">${TIER[k].n}</button>`).join('')}</div><div class="ng-cls-r small" hidden></div></div>`).join('')}
        <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap"><button class="btn pri" id="ng-check" disabled>Xem TOOEZ phân loại</button><button class="btn ghost" id="ng-skip">Bỏ qua, vào làm luôn</button></div>
      </div></div>`;
    $$('.ng-cls', view).forEach(row => $$('.seg button', row).forEach(b => b.onclick = () => {
      if (row.classList.contains('shown')) return;
      R.guess[row.dataset.i] = b.dataset.t; $$('.seg button', row).forEach(x => x.classList.toggle('on', x === b));
      $('#ng-check', view).disabled = Object.keys(R.guess).length < st.qs.length;
    }));
    $('#ng-skip', view).onclick = step2;
    $('#ng-check', view).onclick = () => {
      let hit = 0;
      $$('.ng-cls', view).forEach(row => { const q = st.qs[row.dataset.i], g = R.guess[row.dataset.i]; if (g === q.tier) hit++; row.classList.add('shown');
        const r = $('.ng-cls-r', row); r.hidden = false; r.innerHTML = `${g === q.tier ? icon('check') : '→'} ${tierPill(q.tier)} ${esc(q.sig)}`; });
      const b = $('#ng-check', view); b.textContent = `Khớp ${hit}/5. Bắt đầu làm: câu nhanh trước`; b.onclick = step2; $('#ng-skip', view).remove();
    };
  };

  // Bước 2: làm theo thứ tự thông minh
  const step2 = () => {
    R.t0 = Date.now();
    view.innerHTML = `<div class="page ng-pg">${head('Bước 2/2: làm theo thứ tự câu nhanh trước.')}
      <div class="ng-order small">${order.map(i => `<span class="ng-o" data-i="${i}">${st.qs[i].n}</span>`).join('')}</div>
      <div class="ng-work"><div class="ng-qcol"><div id="ng-q"></div></div>${docsHtml()}</div></div>`;
    $$('.ng-tabs button', view).forEach(b => b.onclick = () => showDoc(view, +b.dataset.d));
    showQ(0);
  };
  const showQ = pos => {
    clearInterval(timer);
    if (pos >= order.length) return step3();
    const i = order[pos], q = st.qs[i], box = $('#ng-q', view), start = Date.now();
    $$('.ng-o', view).forEach(o => o.classList.toggle('cur', +o.dataset.i === i));
    $$('.ng-doc mark.on', view).forEach(m => m.classList.remove('on'));
    box.innerHTML = `<div class="card ng-qcard"><div class="row" style="justify-content:space-between;gap:8px"><span class="small"><b>Câu ${q.n}</b> · ${pos + 1}/5 ${tierPill(q.tier)}</span><span class="ng-clock small" id="ng-clock">0s</span></div>
      <div class="ng-sig small">${icon('target')} ${esc(q.sig)}</div>
      <div class="h3" style="margin:10px 0 0">${esc(q.q)}</div>
      <div class="opts">${q.o.map((o, k) => `<button class="opt" data-k="${k}"><span class="L">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`).join('')}</div>
      <div id="ng-tip" class="small ng-tip" hidden></div><div id="ng-fb"></div></div>`;
    const clock = $('#ng-clock', box), tip = $('#ng-tip', box);
    timer = setInterval(() => {
      const s = Math.round((Date.now() - start) / 1000); clock.textContent = s + 's';
      clock.className = 'ng-clock small ' + (s >= 90 ? 'red' : s >= 60 ? 'warn' : '');
      if (s === 60) { tip.hidden = false; tip.innerHTML = 'Đã 1 phút. Đọc lại gợi ý ở trên, tìm đúng đoạn chứa từ khóa thôi.'; }
      if (s === 90) tip.innerHTML = '<b>Quá 90 giây rồi.</b> Trong thi thật: loại phương án sai rõ, chọn trong số còn lại, đi tiếp. Ở đây cứ chọn thử nhé.';
    }, 1000);
    $$('.opt', box).forEach(b => b.onclick = () => {
      if (R.ans[i] !== undefined) return;
      clearInterval(timer); const k = +b.dataset.k, ok = k === q.a; R.ans[i] = k; R.ms[i] = Date.now() - start;
      $$('.opt', box).forEach(x => { const kk = +x.dataset.k; x.disabled = true; if (kk === q.a) x.classList.add('ok'); else if (kk === k) x.classList.add('bad'); });
      X.react && X.react(ok, b);
      q.ev.forEach(e => $$(`.ng-doc mark[data-ev="${e}"]`, view).forEach(m => m.classList.add('on')));
      const docs = [...new Set(q.ev.map(e => docOf(view, e)))].sort();
      showDoc(view, docOf(view, q.ev[0]));
      const m0 = $(`.ng-doc mark[data-ev="${q.ev[0]}"]`, view);
      $('#ng-fb', box).innerHTML = `<div class="ng-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Chính xác!' : `Đáp án đúng là ${'ABCD'[q.a]}.`}</b> <span class="small muted">${Math.round(R.ms[i] / 1000)} giây</span>
        <p class="small" style="margin:8px 0 4px">${q.why}</p><p class="small muted" style="margin:0"><b>Bẫy:</b> ${q.trap}</p>
        <div class="row small" style="margin-top:10px;gap:6px;flex-wrap:wrap"><span>Bằng chứng ở:</span>${docs.map(d => `<button class="btn sm ghost" data-go="${d}">Bài ${d + 1}</button>`).join('')}</div>
        <button class="btn pri" id="ng-next" style="margin-top:12px">${pos < 4 ? 'Câu tiếp theo' : 'Xem kết quả'} ${icon('arrow')}</button></div>`;
      $$('[data-go]', box).forEach(x => x.onclick = () => { showDoc(view, +x.dataset.go); const m = $(`.ng-doc[data-doc="${x.dataset.go}"] mark.on`, view); m && m.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      if (m0 && window.innerWidth >= 960) m0.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#ng-next', box).onclick = () => { showQ(pos + 1); const qe = $('#ng-q', view); if (window.innerWidth < 960 && qe) qe.scrollIntoView({ behavior: 'smooth', block: 'start' }); else if (!qe) window.scrollTo(0, 0); };
    });
  };

  // Bước 3: tổng kết
  const step3 = () => {
    const ok = st.qs.filter((q, i) => R.ans[i] === q.a).length, ms = Object.values(R.ms).reduce((a, b) => a + b, 0);
    const byT = t => { const ix = st.qs.map((q, i) => i).filter(i => st.qs[i].tier === t); return { n: ix.length, ok: ix.filter(i => R.ans[i] === st.qs[i].a).length, s: Math.round(ix.reduce((a, i) => a + R.ms[i], 0) / 1000) }; };
    const prev = ng().sets[st.id]; ng().sets[st.id] = { ok: Math.max(ok, prev ? prev.ok : 0), ms, at: Date.now() }; X.save();
    X.addXP && X.addXP(ok * 3, 'Bộ đoạn ba có hướng dẫn');
    const next = SETS[(SETS.indexOf(st) + 1) % SETS.length];
    const msg = ok === 5 ? 'Trọn bộ! Bạn vừa làm xong một bộ đoạn ba, loại bài nhiều người sợ nhất.' : ok >= 3 ? 'Ổn rồi! Hơn hẳn mức lụi. Xem lại câu sai, nhìn chỗ tô vàng để biết lần sau tìm ở đâu.' : 'Không sao cả. Bạn vừa đi hết một bộ đoạn ba, phần khó nhất là bắt đầu thì đã xong. Làm lại sau 1-2 ngày, sẽ thấy nhẹ hơn hẳn.';
    view.innerHTML = `<div class="page ng-pg">${head('Kết quả')}
      <div class="card tint" style="margin-top:16px">${X.xiSay(ok >= 3 ? 'happy' : 'think', msg)}</div>
      <div class="grid g3" style="margin-top:16px">${'fms'.split('').map(t => { const b = byT(t); return b.n ? `<div class="card">${tierPill(t)}<div class="h2" style="margin:8px 0 0">${b.ok}/${b.n}</div><div class="small muted">${b.s} giây cho ${b.n} câu</div></div>` : ''; }).join('')}</div>
      <div class="card" style="margin-top:16px"><b>So với lụi</b><p class="small">Lụi cả bộ thì trung bình trúng <b>1,25 câu</b>. Bạn đúng <b>${ok} câu</b> trong ${ms < 60000 ? Math.round(ms / 1000) + ' giây' : (Math.round(ms / 6000) / 10).toString().replace('.', ',') + ' phút'}${ms > 420000 ? '. Thi thật nên giữ khoảng 5-6 phút một bộ, luyện thêm vài bộ là nhanh lên.' : ', đúng nhịp thi thật.'}</p>
        <p class="small muted">${byT('f').ok === byT('f').n ? 'Câu ăn nhanh lấy trọn rồi, phần còn lại chỉ là luyện thêm câu nối bài.' : 'Ưu tiên luyện cho chắc câu ăn nhanh trước, vì đó là điểm dễ lấy nhất.'}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn pri" href="#/ngop/bo/${next.id}">Bộ tiếp: ${esc(next.title)} ${icon('arrow')}</a><button class="btn" id="ng-again">Làm lại bộ này</button><a class="btn ghost" href="#/ngop">Về trang hướng dẫn</a></div></div></div>`;
    $('#ng-again', view).onclick = () => X.render();
  };
  step1();
});
})();
