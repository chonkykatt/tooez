/* TOOEZ - khởi động (tách khỏi index.html để chính sách bảo mật CSP chặn được mọi script viết thẳng trong trang) */
'use strict';
  // make sure rich-journey words exist in the bank
  Object.values(window.RICH || {}).forEach(W => {
    if (!X.VOCAB.some(w => w.w.toLowerCase() === W.headword)) {
      const w = { id: 'w-' + W.headword, w: W.headword, vi: W.meaning.vietnamese, def: W.meaning.english, ipa: W.ipaUS, pos: 'v', parts: [5, 7], topics: ['Tài chính, chi phí', 'Kho mở rộng'], group: 'Tài chính, chi phí', topic: 'Kho mở rộng', fam: [], ant: [], ex: W.contexts.slice(0, 2).map(c => c.sentence), col: W.collocations.correct.map(c => W.headword + ' ' + c), star: true, kind: 'word', syn: ['pay back'] };
      X.VOCAB.push(w); X.wordById[w.id] = w;
    }
  });
  document.getElementById('menu').onclick = () => document.getElementById('side').classList.toggle('open');
  document.getElementById('side-bg').onclick = () => document.getElementById('side').classList.remove('open');
  // thay cho các onerror / onclick viết thẳng trong HTML (CSP không cho chạy)
  document.addEventListener('error', e => { const im = e.target; if (!im || im.tagName !== 'IMG' || !im.dataset.fail) return; const f = im.dataset.fail;
    if (f.startsWith('rm:')) { const box = im.closest(f.slice(3)); if (box) box.remove(); } else if (f === 'rmparent') { if (im.parentNode) im.parentNode.remove(); } else if (f === 'noimg') { if (im.parentNode) im.parentNode.classList.add('noimg'); im.remove(); } }, true);
  document.addEventListener('click', e => { const h = e.target.closest && e.target.closest('[data-hint]'); if (h) { h.outerHTML = h.dataset.h; return; }
    const l = e.target.closest && e.target.closest('[data-cl-login]'); if (l) { e.preventDefault(); X.cloud && X.cloud.login && X.cloud.login(); } });
  X.render();
