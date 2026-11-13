/* TOOEZ - nhắc phiên đang làm dở: thanh nhỏ ở đầu trang, bấm là làm tiếp đúng câu đang dừng */
'use strict';
(() => {
const { esc, icon } = X;
X.afterRender = (h, view) => {
  const all = Object.entries(X.S().resume || {}).filter(([k, v]) => v && Date.now() - v.at < 7 * 864e5 && k !== h);
  if (!all.length) return;
  if (!(h === '/today' || h === '/tests' || h === '/lab' || /^\/path(\/|$)/.test(h))) return;   // trang giới thiệu bài có nút riêng, không chen thanh nhắc
  const [k, v] = all.sort((a, b) => b[1].at - a[1].at)[0];
  const page = view.querySelector('.page'); if (!page || view.querySelector('.qz-top')) return;   // đang trong bài khác thì không chen vào
  const bar = document.createElement('div'); bar.className = 'resume-bar';
  bar.innerHTML = `${X.xi('think', 30, 'static')}<div class="grow"><b>Bạn đang làm dở:</b> ${esc(v.title || 'Bài luyện')}${v.num ? ` <span class="muted">- đang ở câu ${v.num}</span>` : v.n ? ` <span class="muted">- câu ${Math.min(v.i + 1, v.n)}/${v.n}</span>` : ''}</div>
    <a class="btn sm pri" href="#${k}" data-rs="go">Làm tiếp ${icon('arrow')}</a><button class="btn sm ghost" data-rs="drop" title="Bỏ bài đang làm dở">Bỏ</button>`;
  page.prepend(bar);
  bar.querySelector('[data-rs=drop]').onclick = () => { X.sessDel(k); bar.remove(); };
};
/* bấm ✕ trong bài = chủ động bỏ bài: xóa phiên làm dở */
document.addEventListener('click', e => { const b = e.target.closest('.qz-top .icon-btn'); if (b) X.sessDel(X.hereKey()); }, true);
/* thẻ "làm tiếp" cho trang giới thiệu bài (Lab, Đề, Kiểm tra unit) */
X.resumeCard = (key, onGo) => {
  const v = X.sessGet(key); if (!v) return '';
  setTimeout(() => { const b = document.getElementById('rs-go'); if (b) b.onclick = onGo; const d = document.getElementById('rs-drop'); if (d) d.onclick = () => { X.sessDel(key); const c = document.getElementById('rs-card'); if (c) c.remove(); }; }, 0);
  return `<div class="card resume-card" id="rs-card">${X.xi('think', 44, 'static')}<div class="grow"><b>Bạn đang làm dở bài này</b><div class="small muted">Dừng ở câu ${Math.min(v.i + 1, v.n || 1)}/${v.n || '?'}${v.mode === 'speed' ? ' - chế độ Tốc độ' : v.mode === 'test' ? ' - thi thật' : ''}. Làm tiếp từ chỗ đó, hoặc bắt đầu lượt mới ở dưới.</div></div>
    <button class="btn pri" id="rs-go">Làm tiếp ${icon('arrow')}</button><button class="btn ghost" id="rs-drop">Bỏ</button></div>`;
};
})();
/* Part 6-7 trên điện thoại: đoạn văn và câu hỏi chồng lên nhau, cuộn lồng nhau rất mệt.
   Thêm nút chuyển "Đoạn văn / Câu hỏi" ngay trên đầu, mỗi lúc chỉ hiện một phần, cuộn bằng cả trang. */
(() => {
  let pq = 'q';
  const mq = window.matchMedia('(max-width:980px)');
  const apply = (body, tog) => { body.classList.toggle('pq-q', pq === 'q'); body.classList.toggle('pq-p', pq === 'p'); tog.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.pq === pq)); };
  const scan = () => {
    document.querySelectorAll('.qz-body.split:not([data-pq])').forEach(body => {
      if (!body.querySelector(':scope>.passage')) return;
      body.dataset.pq = 1;
      const tog = document.createElement('div'); tog.className = 'pq-tog seg';
      tog.innerHTML = '<button type="button" data-pq="p">Đoạn văn</button><button type="button" data-pq="q">Câu hỏi</button>';
      body.before(tog); apply(body, tog);
      tog.onclick = e => { const b = e.target.closest('[data-pq]'); if (!b) return; pq = b.dataset.pq; apply(body, tog); if (mq.matches) tog.scrollIntoView({ block: 'start' }); };
    });
  };
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
