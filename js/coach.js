/* TOOEZ - Học cùng coach, Về Tooez & ủng hộ, đếm lượt (tùy chọn). Nội dung lấy từ data/offer.js */
'use strict';
(() => {
const { $, $$, esc, icon } = X;
const S = () => X.S();
const O = () => window.OFFER || {};

/* ---------- đếm lượt (chỉ chạy khi có mã GoatCounter) ---------- */
const gc = (O().analytics || {}).goatcounter;
X.track = (name, title) => {
  try { if (gc && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: title || name, event: true }); } catch (e) {}
};
if (gc) {
  window.goatcounter = { no_onload: true };
  const sc = document.createElement('script'); sc.async = true; sc.src = 'https://gc.zgo.at/count.js';
  sc.dataset.goatcounter = `https://${gc}.goatcounter.com/count`;
  sc.onload = () => {
    const pv = () => { try { window.goatcounter.count({ path: (location.hash.slice(1) || '/today').replace(/\/[^/]*\d[^/]*$/, '/:id') }); } catch (e) {} };
    pv(); window.addEventListener('hashchange', pv);
    // người quay lại: lần đầu thấy là ngày khác hôm nay, mỗi ngày đếm một lần
    try {
      const k = 'tooez.seen', v = JSON.parse(localStorage.getItem(k) || '{}'), d = new Date().toISOString().slice(0, 10);
      if (!v.first) v.first = d;
      if (v.first !== d && v.last !== d) X.track('quay-lai', 'Người dùng quay lại');
      v.last = d; localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  };
  document.head.appendChild(sc);
}
document.addEventListener('click', e => { const a = e.target.closest('[data-track]'); if (a) X.track(a.dataset.track); });

/* ---------- liên hệ ---------- */
const CH = [['zalo', 'Zalo'], ['messenger', 'Messenger'], ['tiktok', 'TikTok'], ['form', 'Điền form'], ['email', 'Email']];
const chHref = (k, v) => k === 'email' ? 'mailto:' + v : v;
const contactBtns = (pri = true) => CH.filter(([k]) => (O().contact || {})[k]).map(([k, n], i) =>
  `<a class="btn ${pri && i === 0 ? 'pri' : ''}" target="_blank" rel="noopener" data-track="lien-he-${k}" href="${esc(chHref(k, O().contact[k]))}">${n}</a>`).join('');
const pkgName = id => ((O().packages || []).find(p => p.id === id) || {}).name || '';
const msgText = pkg => {
  const p = S().profile;
  return `Chào TOOEZ, mình muốn hỏi về ${pkg ? 'gói "' + pkgName(pkg) + '"' : 'coaching'}.\n`
    + `- Điểm hiện tại: ${p.current || '(chưa biết)'}\n- Mục tiêu: ${p.target || '?'}\n`
    + `- Ngày thi: ${p.examDate ? new Date(p.examDate).toLocaleDateString('vi-VN') : '(chưa chốt)'}`;
};

/* ---------- khối donate dùng chung ---------- */
X.donateBox = (compact) => {
  const d = O().donate || {}; if (!d) return '';
  const bankLine = d.account ? `<div class="dn-bank"><div><span class="muted small">Ngân hàng</span><b>${esc(d.bank)}</b></div><div><span class="muted small">Số tài khoản</span><b class="mono dn-copy" data-copy="${esc(d.account)}" title="Bấm để chép">${esc(d.account)}</b></div>${d.holder ? `<div><span class="muted small">Chủ tài khoản</span><b>${esc(d.holder)}</b></div>` : ''}${d.note ? `<div><span class="muted small">Nội dung</span><b class="mono">${esc(d.note)}</b></div>` : ''}</div>` : '';
  const links = [d.momo ? `<a class="btn sm" target="_blank" rel="noopener" data-track="donate-momo" href="${esc(/^https?:/.test(d.momo) ? d.momo : '#')}">${/^https?:/.test(d.momo) ? 'Momo' : 'Momo: ' + esc(d.momo)}</a>` : '',
    d.kofi ? `<a class="btn sm" target="_blank" rel="noopener" data-track="donate-kofi" href="${esc(d.kofi)}">☕ Ko-fi</a>` : ''].join('');
  const qr = d.qr ? `<figure class="dn-qrbox"><div class="dn-qr"><img src="${esc(d.qr)}" alt="Mã QR ủng hộ" onerror="this.closest('.dn-qrbox').remove()"></div><figcaption>Quét bằng app ngân hàng nào cũng được</figcaption></figure>` : '';
  const extra = bankLine || links ? `<div class="dn-extra">${bankLine}${links ? `<div class="row" style="margin-top:10px">${links}</div>` : ''}</div>` : (!d.qr ? `<div class="small faint">Thông tin nhận ủng hộ sẽ sớm cập nhật.</div>` : '');
  return `<div class="card donate ${compact ? 'compact' : ''}">
    <div class="dn-main">
      <div class="dn-head">${X.xi('happy', compact ? 48 : 60, 'static')}<div><div class="kicker">Ủng hộ TOOEZ</div><div class="h3">Nếu TOOEZ giúp được bạn, mua cho mèo Tooez một hộp pate nhé 🐟</div>
        <div class="small muted" style="margin-top:4px">Không bắt buộc đâu, không ủng hộ vẫn học thoải mái. Mỗi hộp pate giúp TOOEZ có thêm bài mới.</div></div></div>
      ${compact ? `<a class="small" href="#/about" style="display:inline-block;margin-top:12px">Ủng hộ để làm gì nhỉ? ${icon('arrow')}</a>` : `<div class="dn-goals-t small muted">Phần ủng hộ sẽ dùng để</div><ul class="dn-goals">${(d.goals || []).map(([ic, t]) => `<li><span>${ic}</span>${esc(t)}</li>`).join('')}</ul>`}
      ${extra}
    </div>
    ${qr}
  </div>`;
};
document.addEventListener('click', e => { const c = e.target.closest('.dn-copy'); if (c) { navigator.clipboard && navigator.clipboard.writeText(c.dataset.copy); X.toast('Đã chép số tài khoản'); X.track('donate-chep-stk'); } });

/* ---------- ghi chú thương hiệu ---------- */
X.tmNote = () => `<p class="tm-note">TOEIC® là thương hiệu đã đăng ký của ETS (Educational Testing Service). TOOEZ là dự án học tập độc lập, không liên kết, không được ETS tài trợ hay chứng nhận.</p>`;

/* ---------- lời mời nhẹ (dùng ở Lab, Hôm nay) ---------- */
X.coachNudge = (text, cta = 'Gặp coach') =>
  `<a class="coach-nudge" href="#/coach" data-track="nudge">${X.xi('think', 34, 'static')}<span class="grow">${esc(text)}</span><b>${esc(cta)} ${icon('arrow')}</b></a>`;

/* ---------- trang Học cùng coach ---------- */
X.route(/^\/coach$/, view => {
  const o = O(), pk = o.packages || [];
  X.track('xem-coach', 'Xem trang coaching');
  view.innerHTML = `<div class="page coach-pg">
    <div class="coach-hero card tint"><div class="grow"><div class="kicker">Học cùng coach 🤝</div>
      <h1 class="h1"><span class="ln">Tự học miễn phí mãi mãi.</span><span class="ln">Cần người kèm sát thì có coach.</span></h1>
      <p class="lead">Coach không chỉ giảng bài. Coach giúp bạn biết mình cần học gì, học thế nào cho trúng, và đi cùng bạn đến ngày thi.</p>
      <div class="pill" style="margin-top:8px">Chỉ dạy TOEIC 2 kỹ năng Nghe - Đọc (Listening & Reading)</div>
      <div class="row" style="margin-top:14px"><a class="btn pri" href="#coach-contact" id="ch-go">Nhắn coach ${icon('arrow')}</a><a class="btn ghost" href="#coach-pk" id="ch-pk-go">Xem các gói</a></div></div>
      <div class="coach-hero-cat">${X.xi('happy', 120)}</div></div>

    <div class="sec"><h2 class="h2" style="margin-bottom:12px">3 cách học cùng TOOEZ</h2><div class="grid g3 tiers">
      <div class="card tier"><div class="tier-n">01</div><div class="kicker">Tự học</div><div class="tier-p">0đ</div><ul>${['Toàn bộ Lộ trình, Lab phản xạ, Đề luyện', 'Kho từ vựng, Thư viện kiến thức', 'Sổ lỗi và Bản đồ kỹ năng để tự đánh giá', 'Tiến độ lưu ngay trên máy, không cần đăng ký'].map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="btn sm" href="#/today">Học ngay</a></div>
      <div class="card tier hot"><div class="tier-n">02</div><div class="kicker">Học cùng coach</div><div class="tier-p">Theo gói</div><ul>${['Kiểm tra trình độ đầu vào', 'Lộ trình riêng theo mục tiêu và ngày thi', 'Chữa đề thi thử, phân tích lỗi sai', 'Theo dõi tiến độ và nhắc học mỗi tuần', 'Kèm 1-1 hoặc nhóm nhỏ'].map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="btn sm pri" href="#coach-pk" id="ch-pk-go2">Xem gói</a></div>
      <div class="card tier"><div class="tier-n">03</div><div class="kicker">Ủng hộ</div><div class="tier-p">Tùy tâm</div><ul>${['Ủng hộ bao nhiêu cũng được', 'Không ủng hộ vẫn học thoải mái', 'Góp ý tính năng bạn muốn có', 'Tham gia cộng đồng TOOEZ trên TikTok'].map(x => `<li>${esc(x)}</li>`).join('')}</ul><a class="btn sm" href="#/about">Ủng hộ TOOEZ</a></div>
    </div></div>

    <div class="sec" id="coach-pk"><h2 class="h2" style="margin-bottom:4px">Các gói coaching</h2><p class="small muted" style="margin-bottom:12px">Chưa biết chọn gói nào? Cứ nhắn, coach hỏi vài câu rồi gợi ý gói hợp nhất. Nếu bạn chưa cần thì coach cũng nói thật.</p>
      <div class="grid g2 pk-grid">${pk.map(p => `<div class="card pk"><div class="row"><span class="pk-ic">${p.icon}</span><div class="grow"><div class="h3">${esc(p.name)}</div><div class="small muted">${esc(p.for)}</div></div>${p.tag ? `<span class="pill gold">${esc(p.tag)}</span>` : ''}</div>
        <ul class="pk-list">${p.gets.map(g => `<li>${icon('check')}<span>${esc(g)}</span></li>`).join('')}</ul>
        <div class="row pk-foot">${p.price ? `<div class="pk-price"><b>${esc(p.price)}</b>${p.unit ? `<span class="muted small"> / ${esc(p.unit)}</span>` : ''}</div>` : ''}<span class="grow"></span><button class="btn sm pri" data-pk="${p.id}" data-track="chon-goi-${p.id}">Hỏi gói này</button></div></div>`).join('')}</div></div>

    <div class="sec"><h2 class="h2" style="margin-bottom:12px">Bắt đầu thế nào?</h2><div class="steps4">${[['💬', 'Nhắn coach', 'Gửi điểm hiện tại, mục tiêu, ngày thi. Tin nhắn đã soạn sẵn ở dưới.'], ['🩺', 'Kiểm tra', 'Làm một đề full test như thi thật để biết điểm hiện tại và chỗ đang hổng.'], ['🗺️', 'Chọn đường đi', 'Coach gợi ý gói hợp với bạn. Bạn tự quyết, không ép.'], ['🚀', 'Bắt đầu học', 'Vẫn học trên TOOEZ, coach theo dõi và chỉnh kế hoạch mỗi tuần.']].map(([ic, t, b], i) => `<div class="st4"><div class="st4-n">${i + 1}</div><div class="st4-ic">${ic}</div><div class="st4-t">${esc(t)}</div><div class="small muted">${esc(b)}</div></div>`).join('')}</div></div>

    <div class="sec grid g2">
      <div class="card"><div class="h3" style="margin-bottom:8px">Gọi coach nếu bạn đang...</div><ul class="pk-list">${['Học mãi mà điểm vẫn đứng yên', 'Hay bỏ dở giữa chừng, cần người nhắc', 'Sắp thi rồi, chưa biết dồn sức vào đâu', 'Muốn có người chữa đề, giảng lỗi sai'].map(g => `<li>${icon('check')}<span>${esc(g)}</span></li>`).join('')}</ul></div>
      <div class="card"><div class="h3" style="margin-bottom:8px">Chưa cần coach đâu nếu bạn...</div><ul class="pk-list no">${['Tự học đều và điểm Lab, Unit tăng đều đều', 'Biết rõ mình yếu Part nào và đang luyện đúng chỗ', 'Còn nhiều thời gian và thích tự khám phá'].map(g => `<li>${icon('arrow')}<span>${esc(g)}</span></li>`).join('')}</ul><div class="small muted" style="margin-top:8px">Vậy cứ học miễn phí thôi, lúc nào bí thì nhắn.</div></div></div>

    ${(o.cases || []).length ? `<div class="sec"><h2 class="h2" style="margin-bottom:12px">Học viên nói gì</h2><div class="grid g3">${o.cases.map(c => `<div class="card case"><div class="case-sc"><b>${esc(c.from)}</b><span>→</span><b>${esc(c.to)}</b></div>${c.weeks ? `<div class="small muted">sau ${esc(c.weeks)} tuần</div>` : ''}<p class="small" style="margin-top:8px">“${esc(c.quote)}”</p><div class="small faint">${esc(c.name)}</div></div>`).join('')}</div></div>` : ''}

    <div class="sec"><h2 class="h2" style="margin-bottom:12px">Câu hỏi hay gặp</h2>${[
      ['Học với coach thì có phải bỏ TOOEZ không?', 'Không. Bạn vẫn học trên TOOEZ như bình thường. Coach dùng Lộ trình, Lab, Sổ lỗi để giao bài, nên bài nào bạn làm cũng được tính.'],
      ['Coach có hứa chắc điểm không?', 'Không ai hứa trước được điểm thi. Coach giúp bạn luyện đúng chỗ yếu, đều đặn, và đổi cách khi thấy chưa ổn.'],
      ['Gửi tiến độ cho coach thế nào?', 'Vào Hồ sơ, bấm "Tải file sao lưu" rồi gửi file cho coach. Coach mở ra là thấy Sổ lỗi với kết quả của bạn.'],
      ['Chưa biết điểm hiện tại thì sao?', 'Không sao. Gói Kiểm tra đầu vào là một đề full test như thi thật, làm xong là biết điểm hiện tại và chỗ cần ưu tiên.'],
      ['Có dạy TOEIC Nói - Viết không?', 'Không. TOOEZ và coach chỉ tập trung TOEIC 2 kỹ năng Nghe - Đọc (Listening & Reading), thang điểm 10-990.'],
    ].map(([q, a]) => `<details class="card faq"><summary><b>${esc(q)}</b></summary><p class="small muted">${esc(a)}</p></details>`).join('')}</div>

    <div class="sec card tint" id="coach-contact"><div class="kicker">Nhắn coach</div><h2 class="h2">Tin nhắn soạn sẵn, sửa thêm rồi gửi nhé</h2>
      <div class="field" style="margin-top:12px"><label>Bạn đang để ý gói nào?</label><div class="seg" id="ch-pkseg"><button data-v="" class="on">Chưa biết nữa</button>${pk.map(p => `<button data-v="${p.id}">${esc(p.name)}</button>`).join('')}</div></div>
      <textarea class="inp" id="ch-msg" rows="6" style="margin-top:10px;width:100%;font-family:inherit"></textarea>
      <div class="ch-send"><div class="grow"><div class="row btn-row" style="margin-top:10px;flex-wrap:wrap"><button class="btn" id="ch-copy">${icon('check')} Chép tin nhắn</button><span class="small muted br-sep">rồi gửi qua</span>${contactBtns()}</div></div>
        ${(o.contact || {}).zaloQr ? `<div class="ch-zqr"><div class="dn-qr"><img src="${esc(o.contact.zaloQr)}" alt="Mã QR Zalo" onerror="this.closest('.ch-zqr').remove()"></div><div class="small muted">Đang dùng máy tính?<br>Quét bằng Zalo trên điện thoại</div></div>` : ''}</div>
      ${S().profile.current || S().profile.target ? '' : `<div class="small faint" style="margin-top:8px">Mẹo: điền điểm hiện tại, mục tiêu, ngày thi ở <a href="#/settings">Hồ sơ</a> để tin nhắn tự điền sẵn.</div>`}</div>
    ${X.tmNote()}
  </div>`;
  const msg = $('#ch-msg', view); let pkSel = '';
  const fill = () => { msg.value = msgText(pkSel); };
  fill();
  const pickPk = id => { pkSel = id; $$('#ch-pkseg button', view).forEach(b => b.classList.toggle('on', b.dataset.v === id)); fill(); };
  $$('#ch-pkseg button', view).forEach(b => b.onclick = () => pickPk(b.dataset.v));
  const toContact = () => $('#coach-contact', view).scrollIntoView({ behavior: 'smooth', block: 'start' });
  $$('[data-pk]', view).forEach(b => b.onclick = () => { pickPk(b.dataset.pk); toContact(); });
  ['#ch-go'].forEach(s => $(s, view).onclick = e => { e.preventDefault(); toContact(); });
  ['#ch-pk-go', '#ch-pk-go2'].forEach(s => $(s, view).onclick = e => { e.preventDefault(); $('#coach-pk', view).scrollIntoView({ behavior: 'smooth' }); });
  $('#ch-copy', view).onclick = () => { navigator.clipboard && navigator.clipboard.writeText(msg.value); X.toast('Đã chép, dán vào Zalo gửi coach nhé'); X.track('chep-tin-nhan'); };
});

/* ---------- trang Giới thiệu (trang đầu tiên) ---------- */
// thứ tự có chủ đích: cho giá trị trước (học gì, xin vía) rồi mới ngỏ lời ủng hộ; ủng hộ có mức cụ thể, có bảng cảm ơn, không ép
const donateBig = () => {
  const d = O().donate || {}, tiers = O().tiers || [], donors = O().donors || [], s = S();
  const qn = s.attempts.length, wn = Object.keys(s.words).length;
  const got = qn >= 20 || wn >= 10 ? `<div class="dn-got">${X.xi('happy', 40, 'static')}<span>Bạn đã làm <b>${qn}</b> câu${wn ? ` và học <b>${wn}</b> từ` : ''} trên TOOEZ. Nếu thấy có ích, góp một chút để web chạy tiếp nhé.</span></div>` : '';
  const bank = d.account ? `<div class="dn-bank"><div><span class="muted small">Ngân hàng</span><b>${esc(d.bank)}</b></div><div><span class="muted small">Số tài khoản</span><b class="mono dn-copy" data-copy="${esc(d.account)}" title="Bấm để chép">${esc(d.account)}</b></div>${d.holder ? `<div><span class="muted small">Chủ tài khoản</span><b>${esc(d.holder)}</b></div>` : ''}</div>` : '';
  return `<div class="card dn2" id="ung-ho">
    <div class="dn2-l">
      <div class="kicker">Ủng hộ TOOEZ ❤️</div>
      <h2 class="h2">TOOEZ miễn phí cho mọi người, nhờ những bạn ủng hộ</h2>
      <p class="small muted">Không bắt buộc. Không ủng hộ vẫn dùng đầy đủ mọi tính năng.</p>
      ${got}
      ${tiers.length ? `<div class="dn-tiers">${tiers.map(t => `<div class="dn-tier ${t.pick ? 'pick' : ''}"><span class="dn-ti">${t.icon}</span><b>${esc(t.amount)}</b><span class="small">${esc(t.t)}</span></div>`).join('')}</div><div class="small faint">Bao nhiêu cũng quý, mức trên chỉ để bạn dễ chọn.</div>` : ''}
      <div class="dn-how"><b>Muốn có tên trên Bảng cảm ơn?</b> Ghi tên bạn vào nội dung chuyển khoản, ví dụ <span class="mono dn-copy" data-copy="${esc((d.note || 'UNG HO TOOEZ') + ' TEN BAN')}">${esc(d.note || 'UNG HO TOOEZ')} TÊN BẠN</span>.</div>
      ${bank}
      <div class="dn-goals-t small muted">Tiền ủng hộ dùng để</div><ul class="dn-goals">${(d.goals || []).map(([ic, t]) => `<li><span>${ic}</span>${esc(t)}</li>`).join('')}</ul>
    </div>
    <div class="dn2-r">
      ${d.qr ? `<figure class="dn-qrbox"><div class="dn-qr big"><img src="${esc(d.qr)}" alt="Mã QR ủng hộ" onerror="this.closest('.dn-qrbox').remove()"></div><figcaption>Quét bằng app ngân hàng nào cũng được</figcaption></figure>` : ''}
      <div class="thanks"><div class="thanks-h">${icon('heart')} Bảng cảm ơn</div>
        ${donors.length ? `<ul>${donors.slice(0, 40).map(x => `<li><b>${esc(x.name)}</b>${x.msg ? `<span class="small muted">“${esc(x.msg)}”</span>` : ''}${x.date ? `<span class="small faint">${esc(x.date)}</span>` : ''}</li>`).join('')}</ul>${donors.length > 40 ? `<div class="small faint">và ${donors.length - 40} bạn nữa ❤️</div>` : ''}`
          : `<div class="small muted">Bảng đang chờ cái tên đầu tiên. Ghi tên trong nội dung chuyển khoản là tên bạn sẽ ở đây.</div>`}</div>
    </div></div>`;
};
const vibeCard = () => {
  const v = O().vibe || {}, n = S().luck || 0;
  return `<div class="card vibe" id="xin-via">
    <figure class="vibe-cert"><img src="${esc(v.cert || 'img/cert.jpg')}" alt="Chứng chỉ TOEIC" onerror="this.parentNode.classList.add('noimg');this.remove()"><div class="vibe-ph"><b>${esc(v.score || '950+')}</b><span>TOEIC Listening & Reading</span></div><figcaption>${esc(v.caption || '')}</figcaption></figure>
    <div class="vibe-r"><div class="kicker">Xin vía ${esc(v.score || '950+')} ✨</div><h2 class="h2">Ấn vào mèo để xin vía điểm cao</h2>
      <p class="small muted">Tooez sẽ hóa mèo may mắn và truyền vía cho bạn. Xin bao nhiêu lần cũng được, nhưng nhớ là vía chỉ phát huy khi đi kèm chăm học 😼</p>
      <button class="vibe-cat" id="vibe-go" aria-label="Xin vía">${X.xi('happy', 150, 'vibe-xi')}<span class="vibe-tap">Ấn để xin vía</span></button>
      <div class="small faint" id="vibe-n">${n ? `Bạn đã xin vía ${n} lần` : 'Chưa xin lần nào'}</div></div></div>`;
};
const BLESS = ['Nghe đâu trúng đó, Part 2 không lọt câu nào', 'Part 5 nhìn là ra từ loại', 'Part 7 tìm bằng chứng nhanh như chớp', 'Đề dễ, giọng đọc rõ, phòng thi mát', 'Câu nào phân vân cũng chọn trúng', 'Không lụi câu nào mà vẫn kịp giờ', 'Tai thính như mèo, mắt tinh như cú', 'Ngày thi tỉnh táo, làm đến câu 200 vẫn sung'];
X.luckFx = () => {
  const s = S(); s.luck = (s.luck || 0) + 1; X.save(); X.track && X.track('xin-via');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const v = O().vibe || {};
  const d = document.createElement('div'); d.className = 'luckfx';
  d.innerHTML = `<div class="lk-flash"></div><div class="lk-rays"></div><div class="lk-core">
    <div class="lk-cat">${X.xi('happy', 220, 'lucky')}</div>
    <div class="lk-t">Vía ${esc(v.score || '950+')} đã vào người!</div>
    <div class="lk-b">${esc(BLESS[(s.luck - 1) % BLESS.length])}</div>
    <div class="lk-n">Lần xin vía thứ ${s.luck}</div>
    <div class="lk-btns"><button class="btn pri lg" id="lk-ok">Nhận vía ✨</button><button class="btn lg" id="lk-pate">Mua pate cảm ơn Tooez 🐟</button></div></div>`;
  document.body.appendChild(d);
  // âm thanh: tiếng chuông leng keng rồi kèn chiến thắng
  try { X.fanfare(); } catch (e) {}
  if (!reduce) {
    const W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2.3;
    const kinds = ['coin', 'coin', 'star', 'star', 'cf', 'cf', 'fish'];
    for (let i = 0; i < 150; i++) setTimeout(() => {
      const k = kinds[i % kinds.length], p = document.createElement('i'); p.className = 'lk-p lk-' + k;
      if (k === 'coin') p.textContent = '950'; else if (k === 'star') p.textContent = '✦'; else if (k === 'fish') p.textContent = '🐟';
      if (k === 'cf') p.style.background = ['#FF5C7A', '#FFC83D', '#6D4AFF', '#22C7A9', '#fff'][i % 5];
      p.style.left = cx + 'px'; p.style.top = cy + 'px'; d.appendChild(p);
      const a = Math.random() * Math.PI * 2, r = 160 + Math.random() * Math.max(W, H) * 0.6;
      p.animate([{ transform: 'translate(-50%,-50%) scale(.2) rotate(0)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r * .55}px), calc(-50% + ${Math.sin(a) * r * .55}px)) scale(1.15) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .45 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r + 260}px)) scale(.9) rotate(${Math.random() * 900}deg)`, opacity: 0 }],
        { duration: 1700 + Math.random() * 1500, easing: 'cubic-bezier(.15,.7,.35,1)' }).onfinish = () => p.remove();
    }, i < 70 ? i * 6 : 500 + i * 14);
    X.rain && setTimeout(() => X.rain(120), 700);
  }
  const close = () => { d.classList.add('out'); setTimeout(() => d.remove(), 350); const n = document.getElementById('vibe-n'); if (n) n.textContent = `Bạn đã xin vía ${S().luck} lần`; };
  d.querySelector('#lk-ok').onclick = close;
  d.querySelector('#lk-pate').onclick = () => { close(); const t = document.getElementById('ung-ho'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); else location.hash = '#/about'; X.track && X.track('via-sang-ung-ho'); };
  d.onclick = e => { if (e.target === d || e.target.classList.contains('lk-rays')) close(); };
};

X.route(/^\/about$/, view => {
  const o = O(), s = S(), p = s.profile;
  X.track('xem-about', 'Xem trang Giới thiệu');
  if (!s.seenTips.intro) { s.seenTips.intro = 1; X.save(); }
  const old = !!p.name;
  view.innerHTML = `<div class="page about-pg">
    <div class="card tint intro-hero"><div class="grow"><div class="kicker">TOOEZ - Luyện TOEIC Nghe - Đọc</div>
      <h1 class="h1">Biết mình sai ở đâu,<br>luyện đúng chỗ đó.</h1>
      <p class="lead">Làm đề từng Part như thi thật, chữa từng câu sai, rồi luyện lại đến khi thành phản xạ. Có chú mèo Tooez học cùng bạn mỗi ngày.</p>
      <div class="intro-chips"><span>${icon('check')} Miễn phí 100%</span><span>${icon('check')} Không cần tài khoản</span><span>${icon('check')} Tiến độ lưu trên máy bạn</span></div>
      <div class="row" style="margin-top:18px;flex-wrap:wrap"><button class="btn pri lg" id="ab-start">${old ? `Học tiếp, ${esc(p.name)}` : 'Bắt đầu học'} ${icon('arrow')}</button><a class="btn lg" href="#ung-ho" id="ab-dn" data-track="intro-ung-ho">❤️ Ủng hộ TOOEZ</a></div></div>
      <div class="intro-cat">${X.xi('happy', 150)}</div></div>

    <div class="sec">${vibeCard()}</div>

    <div class="sec"><div class="sec-h"><div><div class="kicker">Học thế nào cho khoa học?</div><h2 class="h2">4 bước, lặp lại mỗi tuần</h2></div></div>
      <div class="flow-big">${X.FLOW.map(f => `<a class="card link fb4" href="${f.href}"><div class="row"><span class="flow4-n ${f.c}">${f.no}</span><b class="fb4-n">${f.n}</b><span class="pill">${esc(f.page)}</span></div>
        <div class="small">${esc(f.what)}</div><div class="small muted"><b>Khi nào:</b> ${esc(f.when)}</div></a>`).join('')}</div>
      <div class="small muted" style="margin-top:10px">Bước 4 xong thì quay lại Bước 1: làm đề tiếp theo của Part đó để xem điểm đã lên chưa. <b>Hôm nay</b> luôn gợi ý sẵn việc tiếp theo, nên không cần nhớ.</div></div>

    <div class="sec">${donateBig()}</div>

    <div class="sec grid g2">
      <div class="card about-story"><div class="h3" style="margin-bottom:8px">Câu chuyện của TOOEZ</div>${(o.story || []).map(x => `<p class="small">${esc(x)}</p>`).join('')}
        <a class="btn sm" target="_blank" rel="noopener" data-track="about-tiktok" href="${esc((o.contact || {}).tiktok || '#')}">Theo dõi TOOEZ trên TikTok</a></div>
      <div class="card"><div class="h3">Cần người kèm sát?</div><p class="small muted" style="margin:6px 0 10px">Coach giúp bạn biết cần học gì, chữa đề cùng bạn và nhắc học mỗi tuần. Tự học vẫn miễn phí mãi mãi.</p>
        <a class="btn sm" href="#/coach" data-track="intro-coach">Xem cách học cùng coach</a>
        <div class="h3" style="margin-top:18px">Góp ý cho TOOEZ</div><p class="small muted" style="margin:6px 0 10px">Bài nào khó hiểu, chỗ nào lỗi, muốn thêm gì? Nhắn mình nhé.</p><div class="row">${contactBtns(false) || ''}</div></div>
    </div>
    ${X.tmNote()}
  </div>`;
  $('#ab-start', view).onclick = () => { S().seenTips.intro = 1; X.save(); X.track('intro-bat-dau'); X.go('#/today'); };
  $('#ab-dn', view).onclick = e => { e.preventDefault(); $('#ung-ho', view).scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  $('#vibe-go', view).onclick = () => { const c = $('#vibe-go .xi', view); c.classList.add('spin'); setTimeout(() => { c.classList.remove('spin'); c.classList.add('lucky'); X.luckFx(); setTimeout(() => c.classList.remove('lucky'), 5000); }, 520); };
});
})();
