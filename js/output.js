/* TOOEZ - "Nói và viết ra": luyện tạo ra (output) thay vì chỉ nhận vào.
   Cơ sở: thứ tự mình nói / viết ra thì nhớ lâu hơn thứ được đưa sẵn (generation effect), và lúc phải tự diễn đạt
   mới thấy mình còn thiếu chỗ nào (output hypothesis). 5 dạng, đều chấm tự động, không cần AI:
     sayw  nhìn nghĩa → NÓI ra từ           (micro, nhận giọng của trình duyệt)
     says  nghe câu (chữ ẩn) → NÓI lại câu   (nhớ rồi nói, không phải đọc theo)
     tr    câu tiếng Việt → GÕ câu tiếng Anh có dùng từ   (chấm theo từ khoá, chấp nhận cách viết khác)
     para  câu trong bài → GÕ lại bằng từ đồng nghĩa      (đúng cách đề TOEIC viết lại)
     own   TỰ ĐẶT CÂU với từ, tự đối chiếu câu mẫu theo checklist, lưu vào Sổ câu
   Dùng ở: Lab #/output, vòng 7 trong trò chơi Kho từ vựng, cuối bài Nhớ 1 phát, trang từng từ. */
'use strict';
(() => {
const { $, $$, esc, icon, shuffle, TTS } = X;
const S = () => X.S();

/* ---------- so khớp chữ ---------- */
const NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
const CONTR = { "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "it's": 'it is', "that's": 'that is', "there's": 'there is', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot', "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "i'll": 'i will', "we'll": 'we will', "you'll": 'you will', "let's": 'let us', "i've": 'i have', "we've": 'we have', "couldn't": 'could not', "wouldn't": 'would not' };
const toks = s => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' -]+/g, ' ').replace(/-/g, ' ').split(/\s+/).filter(Boolean)
  .flatMap(w => (CONTR[w] || w).split(' ')).map(w => w.replace(/^'+|'+$/g, '')).map(w => (w in NUM ? String(NUM[w]) : w)).filter(Boolean);
// gốc từ đơn giản: bỏ đuôi s / es / ed / ing / ly để "submitted" khớp "submit"
const stem = w => w.length <= 4 ? w : w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s|ly)$/, '').replace(/(.)\1$/, '$1').replace(/e$/, '');
const STOP = new Set('a an the of to in on at for by with and or but is are was were be been being am do does did will would can could should may might must have has had i you he she we they it its my your his her our their this that these those there here as from into about than then so if not no yes very all any some each every our me him them us also just only up out over under after before because while when where which who whom what how'.split(' '));
const content = s => toks(s).filter(w => !STOP.has(w) && w.length > 1);
// cụm cần có (từ đang học): mọi từ có nghĩa trong cụm đều phải xuất hiện (cho phép đổi dạng)
const hasPhrase = (text, phrase) => { const T = toks(text).map(stem), P = toks(String(phrase).replace(/…|\.\.\./g, ' ').replace(/\b(someone|something|sb|sth|one's)\b/g, ' ')).filter(w => !STOP.has(w) || toks(phrase).length <= 2).map(stem);
  return P.length > 0 && P.every(p => T.includes(p)); };
// điểm nói: số từ của câu mẫu nói đúng theo thứ tự (dãy con chung dài nhất)
const lcs = (a, b) => { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
  const hit = new Set(); for (let i = m, j = n; i > 0 && j > 0;) { if (a[i - 1] === b[j - 1]) { hit.add(i - 1); i--; j--; } else if (d[i - 1][j] >= d[i][j - 1]) i--; else j--; }
  return hit; };
const scoreSay = (target, alts) => { const T = toks(target).map(stem); let best = { r: 0, hit: new Set(), said: '' };
  (alts || []).forEach(a => { const hit = lcs(T, toks(a).map(stem)), r = T.length ? hit.size / T.length : 0; if (r > best.r || !best.said) best = { r, hit, said: a }; });
  return best; };
// mask = chưa cho xem đáp án: từ nói thiếu hiện thành ____ để lần sau tự nhớ ra
const markTarget = (target, hit, mask) => { let k = -1; return esc(target).split(/(\s+)/).map(p => { if (!p.trim()) return p; const n = toks(p).length; if (!n) return p; const ok = [...Array(n)].every(() => hit.has(++k)); return ok ? `<span class="ot-ok">${p}</span>` : mask ? '<span class="ot-gap">____</span>' : `<span class="ot-miss">${p}</span>`; }).join(''); };

/* ---------- micro: nhận giọng nói của trình duyệt ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
X.canSpeak = !!SR;
let rec = null;
const stopRec = () => { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } };
// nghe một lượt; onPart(chữ tạm) để hiện chữ đang nói; trả về các cách máy nghe được (tốt nhất trước)
const listen = onPart => new Promise((res, rej) => {
  if (!SR) return rej(new Error('nosr'));
  stopRec(); TTS.stop();
  const r = rec = new SR(); r.lang = 'en-US'; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
  let alts = [], done = false;
  const end = v => { if (done) return; done = true; clearTimeout(t); if (rec === r) rec = null; v instanceof Error ? rej(v) : res(v); };
  const t = setTimeout(() => { try { r.stop(); } catch (e) {} }, 15000);
  r.onresult = e => { const last = e.results[e.results.length - 1]; const said = [...e.results].map(x => x[0].transcript).join(' ');
    if (onPart) onPart(said); if (last.isFinal) alts = [...last].map(x => [...e.results].slice(0, -1).map(y => y[0].transcript).concat(x.transcript).join(' ')); };
  r.onerror = e => end(new Error(e.error || 'err'));
  r.onend = () => end(alts.length ? alts : []);
  try { r.start(); } catch (e) { end(e); }
});
const micErr = e => ({ 'not-allowed': 'Trình duyệt chưa cho dùng micro. Bấm vào biểu tượng ổ khoá cạnh địa chỉ web → cho phép Micro, rồi thử lại.', 'service-not-allowed': 'Trình duyệt chưa cho dùng micro. Bấm vào biểu tượng ổ khoá cạnh địa chỉ web → cho phép Micro, rồi thử lại.',
  'no-speech': 'Chưa nghe thấy gì. Bấm 🎤 rồi nói to, rõ hơn nhé.', 'audio-capture': 'Không tìm thấy micro trên máy.', network: 'Nhận giọng nói cần có mạng. Kiểm tra mạng rồi thử lại.', nosr: 'Trình duyệt này chưa hỗ trợ nhận giọng nói. Dùng Chrome, Edge hoặc Safari nhé.' })[e && e.message] || 'Không nghe được, thử lại nhé.';

/* ---------- nguồn từ ---------- */
const head = w => w.w.split(' / ')[0].replace(/\.\.\.|…/g, '').replace(/\s+/g, ' ').trim();
const REEL = () => window.REEL || [];
// ưu tiên từ đã học và đến hạn ôn, rồi tới từ đã học, rồi từ Nhớ 1 phát
const pool = () => { const st = S(), now = Date.now(); const learned = Object.entries(st.words || {}).map(([id, s]) => [X.wordById[id], s]).filter(([w]) => w && w.vi);
  const due = learned.filter(([, s]) => s.due <= now).map(([w]) => w), rest = learned.filter(([, s]) => s.due > now).map(([w]) => w);
  const reel = REEL().map(r => X.VOCAB.find(x => x.w.toLowerCase() === r.w.toLowerCase())).filter(Boolean);
  const seen = new Set(); return [...shuffle(due), ...shuffle(rest), ...shuffle(reel)].filter(w => !seen.has(w.id) && seen.add(w.id)); };
const exOf = w => { const r = REEL().find(x => x.w.toLowerCase() === w.w.toLowerCase()); return [...(w.ex || []), ...(r ? r.ex : [])].filter((e, i, a) => a.indexOf(e) === i); };
const colOf = w => { const r = REEL().find(x => x.w.toLowerCase() === w.w.toLowerCase()); return [...(w.col || []), ...(r ? r.col.map(c => c.split(' - ')[0]) : [])].slice(0, 4); };

/* ---------- Sổ câu: câu học sinh tự đặt ---------- */
const mySents = () => { const st = S(); return st.mySents || (st.mySents = []); };
const saveSent = (w, s, chk) => { const L = mySents(); L.unshift({ wid: w.id, w: w.w, s, chk, at: Date.now() }); /* khoá đồng bộ theo at: một từ có thể có nhiều câu */ if (L.length > 500) L.length = 500; X.save(); };
X.mySentsOf = id => mySents().filter(x => x.wid === id);

/* ---------- 1 bài: vẽ vào el, xong gọi done({ok, self}) ---------- */
const fb = (ok, html) => `<div class="ot-fb ${ok ? 'good' : 'bad'}">${html}</div>`;
X.outTask = (el, t, done) => {
  stopRec(); TTS.stop();
  const w = t.w, next = (ok, self) => { stopRec(); TTS.stop(); done && done({ ok, self }); };
  const nextBtn = (ok, self, label) => `<button class="btn pri" id="ot-next">${label || 'Tiếp'} ${icon('arrow')}</button>`;
  const bindNext = (ok, self) => { const b = $('#ot-next', el); if (b) { b.onclick = () => next(ok, self); b.focus(); } };
  const micBtn = '<button class="btn syn lg ot-mic" id="ot-mic">🎤 Bấm rồi nói</button>';
  const noMic = '<div class="small muted">Trình duyệt này chưa nghe được giọng nói (dùng Chrome, Edge hoặc Safari). Bạn có thể gõ thay:</div>';
  const typeRow = ph => `<div class="row ot-type" style="gap:8px;flex-wrap:wrap"><input class="inp" id="ot-in" placeholder="${ph}" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn pri" id="ot-ok">Kiểm tra</button></div>`;

  // ---- NÓI: từ hoặc câu
  if (t.t === 'sayw' || t.t === 'says') {
    const target = t.t === 'sayw' ? head(w) : t.s, need = t.t === 'sayw' ? 1 : 0.8;
    el.innerHTML = `<div class="ot">${t.t === 'sayw'
      ? `<div class="kicker">Nhìn nghĩa, nói ra từ tiếng Anh</div><div class="ot-prompt">${esc(w.vi)}</div><div class="small muted">${esc(w.pos || '')}${w.syn && w.syn.length ? ' · gần nghĩa: ' + esc(w.syn.slice(0, 2).join(', ')) : ''}</div>`
      : `<div class="kicker">Nghe câu, rồi tự nói lại (chữ đang ẩn)</div><div class="ot-prompt sm">${t.vi ? esc(t.vi) : 'Nghe kỹ, nhớ ý, rồi nói lại cả câu'}</div><button class="btn sm" id="ot-hear">${icon('vol')} Nghe câu</button>`}
      <div class="ot-live" id="ot-live"></div>${X.canSpeak ? micBtn : noMic + typeRow('Gõ câu / từ của bạn…')}<div id="ot-fb"></div>
      <div class="row ot-foot" style="gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn ghost sm" id="ot-hint">Gợi ý</button><button class="btn ghost sm" id="ot-skip">Bỏ qua</button></div></div>`;
    let tries = 0, hint = 0;
    const show = (ok, best) => { const res = $('#ot-fb', el);
      res.innerHTML = fb(ok, `${ok ? '✓ Chuẩn rồi!' : tries >= 2 ? 'Chưa khớp. Đây là câu đúng:' : 'Gần được rồi, thử lại nhé.'}
        <div class="ot-target">${markTarget(target, best.hit, !ok && tries < 2)}</div>${best.said ? `<div class="small muted">Máy nghe được: “${esc(best.said)}”</div>` : ''}
        ${ok || tries >= 2 ? `<div class="row" style="gap:8px;justify-content:center;margin-top:8px"><button class="btn sm" data-say2="${esc(target)}">${icon('vol')} Nghe mẫu</button>${nextBtn()}</div>` : ''}`);
      $$('[data-say2]', res).forEach(b => b.onclick = () => TTS.speak(b.dataset.say2, { role: 'W' }));
      if (ok || tries >= 2) { $$('#ot-mic,#ot-ok,#ot-hint,#ot-skip', el).forEach(b => b.disabled = true); bindNext(ok && !hint, false); if (ok) TTS.speak(target, { role: 'W' }); } };
    const judge = alts => { tries++; const best = scoreSay(target, alts); const ok = best.r >= need; show(ok, best); };
    if ($('#ot-hear', el)) { $('#ot-hear', el).onclick = () => TTS.speak(target, { role: 'W' }); setTimeout(() => { if (el.isConnected) TTS.speak(target, { role: 'W' }); }, 300); }
    const mic = $('#ot-mic', el);
    if (mic) mic.onclick = async () => { mic.disabled = true; mic.classList.add('on'); mic.textContent = '🎤 Đang nghe… nói đi'; $('#ot-live', el).textContent = '';
      try { const alts = await listen(s => { $('#ot-live', el).textContent = s; }); if (!el.isConnected) return; if (!alts.length) throw new Error('no-speech'); judge(alts); }
      catch (e) { if (el.isConnected) $('#ot-fb', el).innerHTML = fb(false, esc(micErr(e))); }
      finally { if (el.isConnected && !$('#ot-next', el)) { mic.disabled = false; mic.classList.remove('on'); mic.textContent = '🎤 Nói lại'; } } };
    const ok = $('#ot-ok', el), inp = $('#ot-in', el);
    if (ok) { ok.onclick = () => inp.value.trim() && judge([inp.value]); inp.onkeydown = e => { if (e.key === 'Enter') ok.click(); }; }
    $('#ot-hint', el).onclick = () => { hint++; const tt = target.split(' '); $('#ot-live', el).textContent = 'Gợi ý: ' + tt.map((x, i) => i < hint ? x : x[0] + '…').join(' '); };
    $('#ot-skip', el).onclick = () => { tries = 2; show(false, { hit: new Set(), said: '' }); };
    return;
  }

  // ---- GÕ: dịch ngược / viết lại / tự đặt câu
  if (t.t === 'tr') {
    el.innerHTML = `<div class="ot"><div class="kicker">Dịch sang tiếng Anh, dùng từ <b>${esc(t.k)}</b></div><div class="ot-prompt sm">${esc(t.vi)}</div>
      ${typeRow('Gõ câu tiếng Anh…')}<div id="ot-fb"></div>${X.canSpeak ? '<div class="small muted" style="margin-top:6px">Hoặc <button class="linkish" id="ot-say">🎤 nói câu</button></div>' : ''}</div>`;
    const keys = [...new Set(content(t.en))], inp = $('#ot-in', el);
    const judge = v => {
      const U = new Set(toks(v).map(stem)), hit = keys.filter(k => U.has(stem(k))), r = keys.length ? hit.length / keys.length : 0, hasKey = hasPhrase(v, t.k), ok = hasKey && r >= 0.6;
      const model = esc(t.en).split(/(\s+)/).map(p => { const k = toks(p)[0]; return k && keys.includes(k) && !hit.includes(k) ? `<span class="ot-miss">${p}</span>` : p; }).join('');
      $('#ot-fb', el).innerHTML = fb(ok, `${ok ? '✓ Đúng ý rồi!' : !hasKey ? `Câu cần dùng từ <b>${esc(t.k)}</b> (đổi dạng cũng được).` : 'Còn thiếu vài ý.'}
        <div class="small" style="margin-top:6px">Câu mẫu: <span class="ot-target">${model}</span></div>${ok ? '' : '<div class="small muted">Chữ gạch đỏ là ý câu bạn chưa có.</div>'}
        <div class="row" style="gap:8px;justify-content:center;margin-top:8px"><button class="btn sm" data-say2="${esc(t.en)}">${icon('vol')} Nghe mẫu</button>${ok ? '' : '<button class="btn ghost sm" id="ot-self">Câu mình đúng ý, chỉ viết khác</button>'}${nextBtn()}</div>`);
      $$('[data-say2]', el).forEach(b => b.onclick = () => TTS.speak(b.dataset.say2, { role: 'W' }));
      inp.disabled = true; $('#ot-ok', el).disabled = true; bindNext(ok, false);
      const sb = $('#ot-self', el); if (sb) sb.onclick = () => next(true, true);
    };
    $('#ot-ok', el).onclick = () => inp.value.trim() && judge(inp.value); inp.onkeydown = e => { if (e.key === 'Enter') $('#ot-ok', el).click(); }; inp.focus();
    const sy = $('#ot-say', el); if (sy) sy.onclick = async () => { try { const a = await listen(s => { inp.value = s; }); if (a.length) inp.value = a[0]; } catch (e) { $('#ot-fb', el).innerHTML = fb(false, esc(micErr(e))); } };
    return;
  }

  if (t.t === 'para') {
    const P = t.p, A = P.ok[0];
    el.innerHTML = `<div class="ot"><div class="kicker">Đề sẽ viết lại câu này thế nào? Gõ cách nói khác cho phần tô màu</div>
      <div class="ot-prompt sm">${esc(P.src).replace(esc(P.a), `<mark>${esc(P.a)}</mark>`)}</div>
      <div class="ot-dst">${esc(P.dst).replace('___', '<span class="rl-blank">______</span>')}</div>
      ${typeRow('Gõ từ / cụm thay cho phần tô màu…')}<div id="ot-fb"></div><div class="row ot-foot" style="gap:8px;justify-content:center"><button class="btn ghost sm" id="ot-hint">Gợi ý</button></div></div>`;
    const inp = $('#ot-in', el); let hint = 0;
    const judge = v => { const ok = P.ok.some(o => toks(v).join(' ') === toks(o).join(' ') || toks(v).map(stem).join(' ') === toks(o).map(stem).join(' ')) || (toks(v).length > 3 && P.ok.some(o => hasPhrase(v, o)));
      const isSame = toks(v).join(' ') === toks(P.a).join(' ');
      $('#ot-fb', el).innerHTML = fb(ok, `${ok ? '✓ Đúng kiểu đề hay viết lại!' : isSame ? 'Đó vẫn là từ trong bài. Đề TOEIC hầu như không lặp lại y nguyên, hãy đổi cách nói.' : 'Chưa phải cách đề hay dùng.'}
        <div class="small" style="margin-top:6px">Đáp án hay gặp: <b>${P.ok.map(esc).join(' / ')}</b></div><div class="small">${esc(P.dst).replace('___', `<b>${esc(A)}</b>`)}</div>
        <div class="row" style="gap:8px;justify-content:center;margin-top:8px">${nextBtn()}</div>`);
      inp.disabled = true; $('#ot-ok', el).disabled = true; $('#ot-hint', el).disabled = true; bindNext(ok && !hint, false); };
    $('#ot-ok', el).onclick = () => inp.value.trim() && judge(inp.value); inp.onkeydown = e => { if (e.key === 'Enter') $('#ot-ok', el).click(); }; inp.focus();
    $('#ot-hint', el).onclick = () => { hint++; inp.placeholder = A.split(' ').map(x => x[0] + '_'.repeat(Math.max(1, x.length - 1))).join(' '); inp.focus(); };
    return;
  }

  if (t.t === 'own') {
    const ex = exOf(w), col = colOf(w);
    el.innerHTML = `<div class="ot"><div class="kicker">Tự đặt câu</div><div class="ot-prompt"><b>${esc(head(w))}</b> <span class="small muted">${esc(w.pos || '')}</span></div><div class="small muted">${esc(w.vi)}</div>
      <div class="small" style="margin:8px 0">Viết một câu về công việc, du lịch, mua bán… của chính bạn. Câu càng gần đời mình càng nhớ lâu.</div>
      <textarea class="inp ot-area" id="ot-in" rows="3" placeholder="vd. My company will ${esc(head(w))} …" spellcheck="true"></textarea>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn pri" id="ot-ok">Xong, đối chiếu</button>${X.canSpeak ? '<button class="btn" id="ot-say">🎤 Nói câu</button>' : ''}</div><div id="ot-fb"></div></div>`;
    const inp = $('#ot-in', el); inp.focus();
    const sy = $('#ot-say', el); if (sy) sy.onclick = async () => { sy.disabled = true; sy.textContent = '🎤 Đang nghe…'; try { const a = await listen(s => { inp.value = s; }); if (a.length) inp.value = a[0][0].toUpperCase() + a[0].slice(1) + (/[.!?]$/.test(a[0]) ? '' : '.'); } catch (e) { $('#ot-fb', el).innerHTML = fb(false, esc(micErr(e))); } finally { sy.disabled = false; sy.textContent = '🎤 Nói câu'; } };
    $('#ot-ok', el).onclick = () => { const v = inp.value.trim();
      if (!hasPhrase(v, head(w))) { $('#ot-fb', el).innerHTML = fb(false, `Câu chưa có từ <b>${esc(head(w))}</b> (đổi dạng cũng được, vd. thêm -s, -ed).`); return; }
      if (toks(v).length < 5) { $('#ot-fb', el).innerHTML = fb(false, 'Câu hơi ngắn. Viết ít nhất 5 từ, có ai làm gì, ở đâu hoặc khi nào nhé.'); return; }
      inp.disabled = true; $('#ot-ok', el).disabled = true; if (sy) sy.disabled = true;
      $('#ot-fb', el).innerHTML = `<div class="ot-fb good"><div class="small"><b>Câu mẫu để đối chiếu:</b></div>${ex.slice(0, 2).map(e => `<div class="small">• ${esc(e)}</div>`).join('') || '<div class="small muted">Từ này chưa có câu mẫu.</div>'}
        ${col.length ? `<div class="small" style="margin-top:4px"><b>Hay đi với:</b> ${col.map(esc).join(' · ')}</div>` : ''}
        <div class="small" style="margin-top:8px"><b>Tự kiểm tra câu của bạn:</b></div>
        <label class="ot-chk"><input type="checkbox" data-c="mean"> Dùng đúng nghĩa (${esc(w.vi.split(/[;,]/)[0])})</label>
        <label class="ot-chk"><input type="checkbox" data-c="pos"> Đúng loại từ (${esc(w.pos || '?')}) và đúng dạng (số nhiều, thì quá khứ…)</label>
        <label class="ot-chk"><input type="checkbox" data-c="col"> Đi đúng giới từ / cụm hay đi kèm</label>
        <div class="row" style="gap:8px;justify-content:center;margin-top:8px"><button class="btn pri" id="ot-save">Lưu vào Sổ câu ${icon('arrow')}</button></div></div>`;
      $('#ot-save', el).onclick = () => { const chk = $$('[data-c]', el).filter(c => c.checked).map(c => c.dataset.c); saveSent(w, v, chk); next(chk.length === 3, true); };
    };
    return;
  }
};

/* ---------- tạo bài ---------- */
X.outMake = (kind, w) => {
  if (kind === 'sayw') return { t: 'sayw', w };
  if (kind === 'says') { const s = exOf(w).find(e => e.split(' ').length <= 14); return s ? { t: 'says', w, s } : { t: 'sayw', w }; }
  if (kind === 'own') return { t: 'own', w };
  return null;
};
const makeSet = (mode, n = 10) => {
  const P = pool(), out = [];
  const tr = shuffle(window.OUT_TR || []), pa = shuffle(window.OUT_PARA || []);
  const learnedReel = new Set(P.map(w => w.w.toLowerCase()));
  // câu dịch ngược: ưu tiên câu của từ đã học
  const trS = [...tr.filter(x => learnedReel.has(x.k)), ...tr.filter(x => !learnedReel.has(x.k))];
  const kinds = mode === 'mix' ? (X.canSpeak ? ['sayw', 'tr', 'para', 'says', 'tr', 'para', 'sayw', 'own', 'para', 'tr'] : ['tr', 'para', 'tr', 'para', 'own', 'tr', 'para', 'tr', 'para', 'own'])
    : Array(n).fill(mode === 'say' ? null : mode);
  let wi = 0, ti = 0, pi = 0;
  for (let i = 0; i < n; i++) {
    let k = kinds[i % kinds.length]; if (mode === 'say') k = i % 2 ? 'says' : 'sayw'; if (mode === 'own' && i >= 5) break;
    if (k === 'tr' && trS[ti]) { const x = trS[ti++]; out.push({ t: 'tr', vi: x.vi, en: x.en, k: x.k, w: X.VOCAB.find(v => v.w.toLowerCase() === x.k) }); continue; }
    if (k === 'para' && pa[pi]) { out.push({ t: 'para', p: pa[pi++] }); continue; }
    const w = P[wi++ % Math.max(1, P.length)]; if (!w) continue;
    out.push(X.outMake(k === 'tr' || k === 'para' ? 'sayw' : k, w));
  }
  return out.filter(Boolean);
};

/* ---------- chạy một chuỗi bài trong khung có sẵn ---------- */
X.outRun = (box, tasks, o = {}) => {
  let i = 0, ok = 0; const res = [];
  const one = () => {
    if (i >= tasks.length) return o.done ? o.done({ ok, n: tasks.length, res }) : null;
    const t = tasks[i];
    box.innerHTML = `${o.head ? `<div class="ot-step">${i + 1}/${tasks.length}</div>` : ''}<div id="ot-slot"></div>`;
    X.outTask($('#ot-slot', box), t, r => {
      res.push(r); if (r.ok) ok++;
      const wid = t.w && t.w.id; if (wid && X.wordById[wid] && t.t !== 'para') X.srsReview(wid, r.ok ? (r.self ? 2 : 3) : 1, t.t === 'own' ? 'use' : t.t === 'tr' ? 'use' : 'say');
      if (X.addXP) X.addXP(r.ok ? 6 : 2, 'Nói và viết ra');
      i++; one(); });
  };
  one();
};

/* ---------- Lab: Nói và viết ra ---------- */
const MODES = [
  { k: 'mix', n: 'Trộn cả 4 dạng', d: '10 bài: nói từ, dịch ngược, viết lại, tự đặt câu', ic: '⚡' },
  { k: 'say', n: 'Nói ra', d: 'Nhìn nghĩa nói ra từ; nghe câu rồi nói lại khi chữ đã ẩn', ic: '🎤', mic: 1 },
  { k: 'tr', n: 'Dịch ngược Việt → Anh', d: 'Gõ câu tiếng Anh có dùng từ đã học', ic: '🔁' },
  { k: 'para', n: 'Viết lại như đề', d: 'Đổi từ trong bài sang cách đáp án hay viết lại', ic: '✏️' },
  { k: 'own', n: 'Tự đặt câu', d: '5 từ đã học, mỗi từ một câu của riêng bạn, lưu vào Sổ câu', ic: '📝' },
];
X.route(/^\/output(?:\/(\w+))?$/, (view, mode) => {
  if (mode === 'so') return soCau(view);
  const M = MODES.find(m => m.k === mode);
  if (!M) {
    const n = mySents().length;
    view.innerHTML = `<div class="page">${X.stepHead ? X.stepHead('luyen') : ''}<a href="#/lab" class="small">${icon('back')} Lab phản xạ</a>
      <div class="kicker syn" style="margin-top:16px">Nói và viết ra</div><h1 class="h1">Tự tạo ra thì mới nhớ lâu</h1>
      <p class="lead">Chọn đáp án là <b>nhận vào</b>. Tự nói, tự viết là <b>tạo ra</b>: phải lôi từ ra khỏi đầu, ghép thành câu, nên nhớ sâu hơn và lộ ngay chỗ mình còn hổng. Từ dùng trong bài lấy từ những từ bạn đã học và đến hạn ôn.</p>
      ${X.canSpeak ? '' : '<div class="card sec small">Trình duyệt này chưa nghe được giọng nói, phần Nói sẽ cho gõ thay. Muốn luyện nói, mở bằng Chrome, Edge hoặc Safari.</div>'}
      <div class="rl-grid sec">${MODES.map(m => `<a class="card link ot-mode" href="#/output/${m.k}"><div class="ot-ic">${m.ic}</div><b>${m.n}</b><div class="small muted">${m.d}</div></a>`).join('')}</div>
      <div class="sec-h sec"><h2 class="h2">Sổ câu của bạn</h2><a class="small" href="#/output/so">${n} câu đã đặt ${icon('arrow')}</a></div>
      ${X.canSpeak ? '<p class="small faint">Phần nhận giọng nói dùng dịch vụ có sẵn của trình duyệt (Chrome gửi tiếng nói đến Google để chuyển thành chữ). TOOEZ không lưu lại tiếng nói của bạn.</p>' : ''}</div>`;
    return;
  }
  const tasks = makeSet(M.k);
  view.innerHTML = `<div class="page ot-page"><div class="qz-top"><a class="icon-btn" href="#/output">${icon('x')}</a><div><div class="kicker">Nói và viết ra</div><div class="h3">${M.ic} ${M.n}</div></div></div><div id="ot-box" class="card"></div></div>`;
  if (!tasks.length) { $('#ot-box', view).innerHTML = '<div class="empty">Chưa có từ để luyện. Học vài từ trong Kho từ vựng hoặc Nhớ 1 phát trước nhé.</div>'; return; }
  X.outRun($('#ot-box', view), tasks, { head: 1, done: r => {
    $('#ot-box', view).innerHTML = `<div class="ot" style="text-align:center"><div class="kicker">Xong lượt này</div><div class="h1" style="margin:6px 0">${r.ok}/${r.n}</div>
      <div class="small muted">bài tự nói / tự viết đúng. Từ làm sai sẽ quay lại sớm hơn trong lịch ôn.</div>
      <div class="row" style="gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap"><a class="btn pri" href="#/output/${M.k}" id="ot-again">Lượt mới</a><a class="btn" href="#/output/so">Xem Sổ câu</a><a class="btn ghost" href="#/output">Chọn dạng khác</a></div></div>`;
    $('#ot-again', view).onclick = e => { e.preventDefault(); X.render(); };
  } });
});

function soCau(view) {
  const L = mySents();
  view.innerHTML = `<div class="page"><a href="#/output" class="small">${icon('back')} Nói và viết ra</a><div class="kicker syn" style="margin-top:16px">Sổ câu</div><h1 class="h1">${L.length} câu bạn tự đặt</h1>
    <p class="lead">Đọc lại câu của chính mình là cách ôn từ nhanh nhất. Câu nào chưa tick đủ 3 ô kiểm tra thì nên sửa lại hoặc nhờ coach xem giúp.</p>
    ${L.length ? `<div class="ot-list">${L.map((x, i) => `<div class="card ot-row"><div><a href="#/vocab/w/${esc(x.wid)}"><b>${esc(x.w)}</b></a> <span class="small faint">${new Date(x.at).toLocaleDateString('vi-VN')}</span>${(x.chk || []).length === 3 ? ' <span class="pill sage">✓ đã tự kiểm</span>' : ' <span class="pill gold">nên xem lại</span>'}</div>
      <div class="ot-s">${esc(x.s)}</div><div class="row" style="gap:6px"><button class="btn sm" data-say="${esc(x.s)}">${icon('vol')} Nghe</button><button class="btn ghost sm" data-del="${i}">Xoá</button></div></div>`).join('')}</div>`
      : `<div class="empty">Chưa có câu nào. <a href="#/output/own">Tự đặt câu đầu tiên</a></div>`}</div>`;
  $$('[data-say]', view).forEach(b => b.onclick = () => TTS.speak(b.dataset.say, { role: 'W' }));
  $$('[data-del]', view).forEach(b => b.onclick = () => { if (!confirm('Xoá câu này khỏi Sổ câu?')) return; L.splice(+b.dataset.del, 1); X.save(); X.render(); });
}
})();
