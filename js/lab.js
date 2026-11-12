/* TOOEZ — Lab phản xạ */
'use strict';
(() => {
const { $, $$, esc, icon, pct, fmtMs, shuffle, sample, today, LETTERS, TTS } = X;
const S = () => X.S();
const GROUPS = [['1', 'Part 1 - Tranh'], ['2', 'Part 2 - Hỏi đáp'], ['3-4', 'Part 3-4 - Nghe hiểu'], ['5', 'Part 5'], ['6', 'Part 6 - Điền đoạn văn'], ['7', 'Part 7 - Đọc'], ['3-4-7', 'Paraphrase - dùng cho cả Nghe và Đọc']];
const KIND_TAG = { pairs: 'Phản xạ', same: 'Paraphrase', reflex: 'Phản xạ', scan: 'Đọc lướt', implied: 'Ngụ ý', graphic: 'Đồ họa', hunt: 'Định hướng', locate: 'Scan', cards: 'Flashcard', bank: 'Câu hỏi', pic: 'Nhìn tranh' };
const bankCount = l => X.BANK.filter(i => Object.entries(l.filter || {}).every(([k, v]) => i[k] === v)).length;
const sizeOf = l => l.kind === 'bank' ? bankCount(l) : l.kind === 'pic' ? picWords(l).length : (l.items || []).length + (l.extra || []).length;

/* ---- Part 1 picture labs: dữ liệu lấy trực tiếp từ Kho từ vựng + ảnh trong img/p1 ---- */
const PIC_LABS = [
  { id: 'p1-pic-word', kind: 'pic', mode: 'word', part: '1', time: 5, title: 'Nhìn tranh, chọn từ', desc: 'Chia theo nhóm: người, hành động, trang phục, địa điểm, vị trí, đồ vật, trạng thái. Thấy ảnh là gọi được tên trong 5 giây.' },
  { id: 'p1-pic-asp', kind: 'pic', mode: 'asp', part: '1', time: 7, title: 'Nghe 1 câu: đúng hay sai với tranh?', desc: 'Action - State - Passive bằng tai: “is being” khi tranh không có người, đổi động từ, câu bị động vẫn đúng. Không có chữ.' },
  { id: 'p1-pic-listen', kind: 'pic', mode: 'listen', part: '1', time: 0, title: 'Nghe tả tranh A-D', desc: 'Như đề thật: nhìn ảnh, nghe 4 câu, không có chữ. Có đủ bẫy: is being, sai động từ, có trong ảnh nhưng sai ý.' },
];
const LAB_HIDE = new Set(['p1-words', 'p1-asp']);   // bản chữ cũ, đã thay bằng bản tranh
const P1_CATS = [['', 'Tất cả'], ['Hành động và trạng thái của người', 'Hành động'], ['Trang phục và đồ mang theo', 'Trang phục'], ['Địa điểm và bối cảnh', 'Địa điểm'], ['Vị trí và bố cục', 'Vị trí'], ['Đồ vật theo bối cảnh', 'Đồ vật'], ['Trạng thái của vật', 'Trạng thái vật']];

/* ---- ngữ pháp câu tả tranh: tạo câu đúng (bị động) và bẫy ---- */
const IRR = { do: 'done', hold: 'held', sweep: 'swept', put: 'put', cut: 'cut', hang: 'hung', lead: 'led', set: 'set', ride: 'ridden', take: 'taken', give: 'given', read: 'read', sell: 'sold', buy: 'bought', drive: 'driven', throw: 'thrown', build: 'built', feed: 'fed', dig: 'dug', lay: 'laid', shake: 'shaken', write: 'written', draw: 'drawn', hit: 'hit', bring: 'brought', sew: 'sewn', show: 'shown', spread: 'spread', grind: 'ground', fly: 'flown' };
const NO_PASS = /^(wearing|holding|having|sitting|standing|waiting|walking|looking|facing|leaning|playing|watching|talking|riding|crossing|browsing|attending|entering|exiting|approaching|boarding|addressing|leaving|visiting|admiring|greeting|helping|using|reaching|raising|shaking|pointing|giving|answering)$/;
// động từ gần nghĩa: không dùng để làm bẫy "sai hành động" cho nhau
const VCLUS = [/^(wip|clear|sweep|mopp|clean|scrubb|polish|vacuum|wash|dust)/, /^(repair|fix|inspect|examin|check|adjust|install|test|servic)/, /^(look|review|read|brows|study|watch|examin|check|scann)/, /^(carry|hold|lift|mov|push|pull|load|unload|deliver|transport)/, /^(talk|convers|discuss|chat|speak|meet)/, /^(arrang|organiz|stack|sort|stock|display|set)/, /^(cut|chopp|slic|trimm|saw)/, /^(pour|serv|fill)/, /^(writ|sign|fill|tak)/, /^(eat|din|drink|sipp)/, /^(paint|decorat)/, /^(build|construct|assembl)/, /^(select|choos|pick|buy|purchas|shop)/];
const sameClus = (a, b) => VCLUS.some(r => r.test(a) && r.test(b));
let VSET = null;
const v3OfIng = ing => {
  VSET = VSET || new Set(X.VOCAB.map(w => w.w.toLowerCase()));
  let b = ing.slice(0, -3), dbl = false;
  if (/([bdgmnprt])\1$/.test(b)) { b = b.slice(0, -1); dbl = true; }
  else if (!VSET.has(b) && (VSET.has(b + 'e') || /(c|v|z|at|ur|ag|in|ar|ac|as)$/.test(b))) b += 'e';
  if (IRR[b]) return IRR[b];
  if (dbl) return b + b.slice(-1) + 'ed';
  if (/e$/.test(b)) return b + 'd';
  if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ied';
  return b + 'ed';
};
const PREP = '(?:on|in|into|onto|at|to|from|with|across|along|down|up|under|over|behind|near|next|for|by|off|inside|outside|around|through|toward|beside|against|out)';
const RX_ACT = new RegExp(`^(?:A|An|The|Some|Two|Several|They|He|She|[A-Z]\\w*) ?[\\w ]*? (is|are) (\\w+ing) (a|an|the|some|his|her|their|two) ([a-z ]+?)((?: ${PREP}\\b.*)?)\\.$`);
const passiveOf = ex => {
  const m = ex.match(RX_ACT); if (!m || NO_PASS.test(m[2]) || / of$/.test(m[4])) return null;
  const obj = m[4].trim();
  if (/\b(away|back|while|together|apart|up|down|out|off|around)\b/.test(obj) || /\bwhile\b/.test(m[5] || '')) return null;   // cụm có trạng từ chen giữa: đổi bị động dễ sai
  const head = obj.split(' of ')[0].split(' ').pop(), pl = /s$/.test(head) && !/(ss|us)$/.test(head);
  const det = m[3] === 'a' || m[3] === 'an' ? (m[3] === 'an' ? 'An' : 'A') : pl ? (m[3] === 'some' || m[3] === 'two' ? 'Some' : 'The') : 'The';
  return `${det} ${obj} ${pl ? 'are' : 'is'} being ${v3OfIng(m[2])}${m[5] || ''}.`;
};
const PERSON = /\b(man|men|woman|women|person|people|someone|boy|girl|child|children|kid|worker|workers|chef|cook|customer|guest|hand|hands|couple|group|crowd|staff|employee|tourist|visitor|he|she|they|his|her|their|server|waiter|shopper|diner|passenger|pedestrian|player|musician|hiker|mechanic|vendor|businesswoman|businessman|adult|individual|gardener|carpenter|janitor|clerk|technician|student)s?\b/i;
const noPerson = w => { const alt = (window.IMGALT || {})[X.imgSlug(w)]; return !!alt && !PERSON.test(alt) && !PERSON.test(w.ex[0] || ''); };
// bẫy "is being": tranh không có người mà câu nói vật đang bị làm
const beingTrap = (w, ex) => {
  if (!noPerson(w) || / being /.test(ex)) return null;
  const NOTP = /^(between|deserted|cluttered|abandoned|left|stopped|unoccupied|occupied|empty|open|even|golden|wooden|broken|fallen|frozen|hidden|reserved|equipped|seated|located|crowded|lined|covered|gathered)$/;
  let m = ex.match(/^(.+?) (has|have) been (\w+) (.*)$/); if (m && !NOTP.test(m[3])) return `${m[1]} ${m[2] === 'has' ? 'is' : 'are'} being ${m[3]} ${m[4]}`;
  m = ex.match(/^(.+?) (is|are) (\w+(?:ed|en)|set|put|hung|laid|left|built|held|spread) (.*)$/);
  if (m && !/^(seated|interested|located|crowded|filled|surrounded|lined|covered|displayed|shaded|illuminated|reflected|dressed|scattered|between|deserted|cluttered|abandoned|left|stopped|unoccupied|occupied|empty|open|even|often|golden|wooden|broken|fallen|frozen|hidden|reserved|equipped)$/.test(m[3])) return `${m[1]} ${m[2]} being ${m[3]} ${m[4]}`;
  return null;
};
// Câu sai kiểu đề thật: một câu tự nhiên, cùng kiểu chủ ngữ (người / vật) nhưng tả cảnh khác.
// Không ghép động từ ngẫu nhiên vào tân ngữ (kiểu "mowing a bag") vì đề thật không bao giờ ra câu vô nghĩa như vậy.
const subjOf = t => { const m = String(t).match(/^(.+?) (?:is|are|has|have) /); return m ? m[1] : ''; };
const isPersonSubj = t => PERSON.test(subjOf(t));
const sameSubjTrap = (w, ex, pool, scene, avoid) => {
  const wantP = isPersonSubj(ex), head = (subjOf(ex).split(' ').pop() || '').toLowerCase();
  const exS = stems(ex);
  const c = pool.filter(x => { const t = x.ex && x.ex[0]; if (!t || t === ex || (avoid || []).includes(t)) return false;
    return x !== w && x.group !== w.group && isPersonSubj(t) === wantP && !overlap(stems(t), scene) && !overlap(stems(t), exS); });
  const same = c.filter(x => (subjOf(x.ex[0]).split(' ').pop() || '').toLowerCase() === head);
  const pick = shuffle(same.length ? same : c)[0];
  return pick ? pick.ex[0] : null;
};
// Bẫy kiểu đề thật cho "Nghe tả tranh A-D": giữ nguyên cảnh trong ảnh, chỉ lệch một chỗ
// 1) vật CÓ trong ảnh + hành động không ai làm; 2) đổi giới từ vị trí; 3) động từ gần âm; 4) tranh không người mà nói "Someone is…"
const NV = [['door', 'opening'], ['window', 'opening'], ['table', 'wiping'], ['tables', 'wiping'], ['chair', 'moving'], ['chairs', 'stacking'], ['shelf', 'dusting'], ['shelves', 'dusting'],
  ['box', 'opening'], ['boxes', 'opening'], ['car', 'washing'], ['cars', 'washing'], ['truck', 'washing'], ['bicycle', 'riding'], ['bike', 'riding'], ['plants', 'watering'], ['plant', 'watering'], ['flowers', 'watering'],
  ['floor', 'sweeping'], ['laptop', 'closing'], ['computer', 'turning off'], ['phone', 'talking on'], ['cup', 'filling'], ['documents', 'signing'], ['papers', 'signing'], ['folder', 'opening'],
  ['bag', 'packing'], ['suitcase', 'packing'], ['jacket', 'taking off', 1], ['coat', 'taking off', 1], ['menu', 'reading'], ['ladder', 'climbing'], ['wall', 'painting'], ['fence', 'painting'],
  ['screen', 'pointing at'], ['board', 'writing on'], ['whiteboard', 'writing on'], ['boat', 'rowing'], ['street', 'crossing'], ['stairs', 'climbing'], ['staircase', 'climbing'], ['book', 'reading'], ['books', 'putting away'],
  ['umbrella', 'opening'], ['cart', 'pushing'], ['counter', 'wiping'], ['sink', 'cleaning'], ['bench', 'painting'], ['tree', 'trimming'], ['trees', 'planting'], ['lawn', 'mowing'], ['grass', 'mowing'], ['map', 'folding'],
  ['camera', 'adjusting'], ['microphone', 'adjusting'], ['tools', 'putting away'], ['equipment', 'repairing'], ['machine', 'repairing'], ['printer', 'repairing'], ['curtains', 'closing'], ['lamp', 'turning on'],
  ['dishes', 'washing'], ['plates', 'stacking'], ['food', 'serving'], ['drinks', 'serving'], ['package', 'opening'], ['packages', 'opening'], ['luggage', 'weighing'], ['bus', 'boarding'], ['train', 'boarding']];
// gần âm: chỉ đổi khi vật phía sau hợp với động từ mới (tránh "folding a microphone")
const FOLDABLE = /\b(papers?|documents?|map|newspaper|towels?|clothes|shirts?|napkins?|letters?|sheets?|blankets?|brochures?|flyers?)\b/, WASHABLE = /\b(cars?|dishes|windows?|vehicles?|plates|cups|floor|truck)\b/, PAINTABLE = /\b(walls?|fences?|bench|door|house|building|room|ceiling)\b/;
const SOUND = [[/\bholding\b/, 'folding', FOLDABLE], [/\bfolding\b/, 'holding'], [/\bwashing\b/, 'watching'], [/\bwatching\b/, 'washing', WASHABLE], [/\bpainting\b/, 'pointing at'], [/\bpointing at\b/, 'painting', PAINTABLE]];
// đổi vị trí: "on/under" chỉ với vật có mặt trên lẫn gầm (bàn, kệ…), tránh "under the beach"
const SURF = '(?:a |an |the |some )?(?:\\w+ )?(?:table|tables|desk|desks|shelf|shelves|counter|bench|chair|chairs|cart|bed|sofa|couch)\\b';
const PSWAP = [[' on top of ', ' underneath '], [' in front of ', ' behind '], [' behind ', ' in front of '], [' above ', ' below '], [' below ', ' above '],
  [' into ', ' out of '], [' out of ', ' into '], [' toward ', ' away from '], [' towards ', ' away from '], [' inside ', ' outside '], [' outside ', ' inside '], [' upstairs', ' downstairs'], [' up ', ' down '], [' down ', ' up '],
  [' under ', ' on ', SURF], [' on ', ' under ', SURF]];
const POSS = s => /\b(man|boy|gentleman|he)\b/i.test(s) && !/\b(men|people|women)\b/i.test(s) ? 'his' : /^(an?|the) /i.test(s) && !/\b(men|people|women|couple)\b/i.test(s) ? 'her' : 'their';
const stemOf = v => v.split(' ')[0].replace(/ing$/, '').replace(/(.)\1$/, '$1');
function sceneTraps(w, ex) {
  const alt = ((window.IMGALT || {})[X.imgSlug(w)] || '').toLowerCase(), low = ex.toLowerCase(), out = [];
  const m = ex.match(/^(.+?) (is|are) (\w+ing)\b/), person = isPersonSubj(ex) && m;
  const subj = person ? m[1] : 'Someone', be = person ? m[2] : 'is', none = !person && noPerson(w);
  const used = new Set(); const curV = m ? stemOf(m[3]) : '';
  const posed = /\b(sitting|seated|standing|lying|kneeling|crouching|leaning)\b/.test(low);
  const SOLO = /^(phone|laptop|computer|cup|bag|suitcase|menu|book|umbrella|camera|microphone|map|folder|bicycle|bike|lamp)$/;
  if (person || none) shuffle(NV.slice()).forEach(([n, v, own]) => {
    if (out.length >= 2 || used.has(n.replace(/s$/, '')) || (be === 'are' && SOLO.test(n))) return;
    const re = new RegExp(`\\b${n}\\b`); if (!re.test(alt) && !re.test(low)) return;
    const st = stemOf(v); if (st === curV || alt.includes(st) || low.includes(st)) return;
    used.add(n.replace(/s$/, '')); out.push({ t: `${subj} ${be} ${v} ${own && person ? (/\bwoman|girl|lady\b/i.test(subj) ? 'her' : POSS(subj)) : 'the'} ${n}.`, why: none ? 'tranh không có người' : 'có trong tranh, sai hành động' });
  });
  for (const [a, b, need] of PSWAP) { if (!low.includes(a)) continue; if (/^ (up|down) $/.test(a) && !/\b(walking|climbing|going|heading|running|coming|riding|looking|carrying \w+) (up|down) (?:a |an |the |some )?(?:\w+ )?(stairs|staircase|steps|ladder|escalator|hill|slope|ramp)\b/i.test(ex)) continue; if (/^ (into|out of) $/.test(a) && !/\b(walking|coming|going|getting|moving|running|stepping|poured|pouring|driving|heading|carrying|climbing)\b/i.test(ex)) continue; if (posed && /^ (in front of|behind) $/.test(a) && /\b(desk|computer|laptop|monitor|screen|counter|table)\b/i.test(ex)) continue; if (need && (posed || !new RegExp(a.replace(/ /g, '\\s') + need.replace(/^\(\?:/, '(?:'), 'i').test(ex))) continue;
    const t = ex.replace(new RegExp(a.replace(/ /g, '\\s'), 'i'), b); if (t !== ex) { out.push({ t, why: 'sai vị trí' }); break; } }
  if (person) for (const [re, v, ok] of SOUND) if (re.test(ex) && (!ok || ok.test(ex.split(re)[1] || ''))) { out.push({ t: ex.replace(re, v).replace(/pointing at at /, 'pointing at '), why: 'gần âm' }); break; }
  return out;
}
// "Nhìn tranh, chọn từ": bỏ nhóm Người và những từ một tấm ảnh không phân biệt được (gần nghĩa, chung chung, hành động khó thấy trong ảnh tĩnh)
const PIC_CONFUSE = new Set(('gather|pose|head|approach|reach|hand|distribute|raise|address|converse|discuss|attend|review|examine|inspect|browse|look through|select|pick out|purchase|wait on|serve|dine|admire|perform|operate|construct|assemble|install|adjust|exercise|stroll|crouch|get off|exit|enter|'
  + 'attire|garment|outfit|protective gear|roll up|put on|take off|'
  + 'workstation|corridor|doorway|terrace|register|stall|booth|plaza|path|dock|harbor|shore|waterfront|terminal|vessel|traffic|loading dock|workshop|yard|'
  + 'document|paperwork|utensil|tableware|beverage|refreshments|greenery|plant|sculpture|vehicle|container|cargo|tool|machinery|furniture|light fixture|artwork|ceiling').split('|'));
const COPRESENT = new Set('stand|sit|lean|bend|kneel|lie|walk|hold|carry|wear|look|wait|smile|talk|face|use'.split('|'));
const picWordOk = w => w.topic !== 'Chủ thể là người' && !PIC_CONFUSE.has(w.w.toLowerCase());
const picSlot = l => X.VOCAB.filter(w => X.hasImgSlot && X.hasImgSlot(w) && (l.mode === 'word' ? picWordOk(w) && (!l.cat || w.topic === l.cat) : w.ex && w.ex[0]));
let picReady = false;
const picWords = l => { const ws = picSlot(l); return picReady ? ws.filter(w => X.imgNow(w)) : ws; };
const POS1 = p => /^n/.test(p) ? 'n' : /^(v|phr)/.test(p) ? 'v' : /^adj/.test(p) ? 'adj' : /^prep/.test(p) ? 'prep' : 'x';
// Từ "chung chung" không dùng để so trùng
const GEN = new Set('some the a an is are was were be being been has have of on in at to for by with and or its it their his her this that these those there man men woman women people person someone one two several they he she next near'.split(' '));
const stems = t => new Set(String(t || '').toLowerCase().match(/[a-z]+/g)?.filter(x => x.length > 2 && !GEN.has(x)).map(x => x.slice(0, 5)) || []);
const overlap = (A, B) => { for (const x of A) if (B.has(x)) return true; return false; };
// Nội dung thật của ảnh: mô tả Pexels + câu mẫu + từ chính
const sceneOf = w => stems([(window.IMGALT || {})[X.imgSlug(w)] || '', ...(w.ex || []).slice(0, 2), w.w].join(' '));
const picDistract = (w, pool, n, key) => {
  const bad = new Set([w.w.toLowerCase(), ...(w.syn || []).map(x => String(x).toLowerCase()), ...(w.fam || []).map(x => String(x.w || x).toLowerCase())]);
  const scene = sceneOf(w);
  // phương án nhiễu: không trùng nghĩa, không phải thứ có trong ảnh, và (với câu) không chung từ nội dung nào với ảnh
  const PO = ['Địa điểm và bối cảnh', 'Đồ vật theo bối cảnh'];
  // với "chọn từ": nhiễu phải là từ cụ thể, nhìn ảnh là biết sai; bỏ từ tư thế chung (ảnh nào cũng có thể có) và từ gần nghĩa
  const wordOk = x => picWordOk(x) && !abstractPic(x) && !COPRESENT.has(x.w.toLowerCase()) && !(POS1(w.pos) === 'v' && sameClus(x.w.toLowerCase(), w.w.toLowerCase()));
  const ok = x => x !== w && !bad.has(x.w.toLowerCase()) && (key ? x.group !== w.group : (x.group !== w.group || w.topic === 'Hành động và trạng thái của người')) && !(PO.includes(w.topic) && PO.includes(x.topic) && x.topic !== w.topic) && !(!key && PO.includes(w.topic) && x.topic === 'Trang phục và đồ mang theo') && (key || wordOk(x)) && !overlap(stems(x.w), scene) && (!key || x.ex && x.ex[0] && !overlap(stems(x.ex[0]), scene));
  const sameT = !key && ['Hành động và trạng thái của người', 'Đồ vật theo bối cảnh', 'Địa điểm và bối cảnh'].includes(w.topic);
  const a = shuffle(pool.filter(x => ok(x) && POS1(x.pos) === POS1(w.pos) && (sameT || x.topic !== w.topic)));
  const b = shuffle(pool.filter(x => ok(x) && x.topic !== w.topic && !a.includes(x)));
  return [...a, ...b].slice(0, n);
};
const picImg = w => `<div class="wimg on lab-pic"><img src="${X.imgNow(w)}" alt=""></div>`;
const ABSTRACT_W = /^(distance|background|foreground|scenery|structure|item|equipment|device|merchandise|produce|individual|surround|overlook|extend|lead|span|stretch|line|row|face|display)$/;
const abstractPic = w => /^(adj|adv|prep)/.test(w.pos || '') || w.topic === 'Vị trí và bố cục' || w.topic === 'Trạng thái của vật' || ABSTRACT_W.test(w.w);
X.picRounds = L => picRounds(L);
const sayAll = (op, ok) => op.map((t, k) => `<div${k === ok ? ' style="font-weight:700"' : ' class="muted"'}>(${'ABCD'[k]}) ${esc(t.t)}${t.why ? ` <span class="pill ${k === ok ? 'sage' : 'red'}" style="font-weight:600">${t.why}</span>` : ''}</div>`).join('');
X._dev = { picRounds: L => picRounds(L), rounds: L => rounds(L) };   // chỉ dùng cho công cụ tạo audio
function picRounds(L) {
  let ws = picWords(L).filter(w => X.imgNow(w)); const pool = X.VOCAB.filter(X.hasImgSlot);
  if (L.mode === 'word' && L.cat) ws = ws.filter(w => w.topic === L.cat);
  const out = [];
  ws.forEach(w => {
    const ex = w.ex && w.ex[0], scene = sceneOf(w);
    const after = `<b>${esc(w.w)}</b> ${w.ipa ? `<span class="faint">${esc(w.ipa)}</span> ` : ''}- ${esc(w.vi)}${ex ? `<div style="margin-top:4px"><i>${esc(ex)}</i></div>` : ''}`;
    if (L.mode === 'word' && ex && abstractPic(w)) {
      // từ chỉ vị trí / trạng thái / tính chất: một mình từ đó không tả được ảnh → chọn câu tả đúng ảnh
      const same = pool.filter(x => x.ex && x.ex[0] && x.ex[0] !== ex && abstractPic(x));
      let ds = picDistract(w, same, 3, 'ex').map(x => x.ex[0]);
      if (ds.length < 3) ds = ds.concat(picDistract(w, pool.filter(x => x.ex && x.ex[0] && x.ex[0] !== ex && !ds.includes(x.ex[0])), 3 - ds.length, 'ex').map(x => x.ex[0]));
      const op = shuffle([ex, ...ds]);
      return out.push({ key: w.id, q: picImg(w) + '<div class="small muted" style="text-align:center">Từ vị trí / trạng thái phải đặt trong câu mới tả được ảnh. Chọn câu tả đúng.</div>', opts: op, a: op.indexOf(ex), after, say: ex, time: 9 });
    }
    if (L.mode === 'word') {
      const op = shuffle([w, ...picDistract(w, pool, 3)]);
      return out.push({ key: w.id, q: picImg(w), opts: op.map(x => x.w), a: op.indexOf(w), after, say: w.w });
    }
    if (!ex) return;
    const pas = passiveOf(ex), bt = beingTrap(w, ex), sw = sameSubjTrap(w, ex, pool, scene);
    if (L.mode === 'asp') {
      const cand = [{ t: ex, ok: true, why: 'Đúng: tả đúng điều thấy trong tranh.' }];
      if (pas) cand.push({ t: pas, ok: true, why: 'Đúng: câu bị động “is being + V3” vẫn đúng vì trong tranh CÓ người đang làm.' });
      if (bt) cand.push({ t: bt, ok: false, why: 'Sai: tranh không có ai đang làm, nên không thể “is/are being + V3”. Vật chỉ ở trạng thái.' });
      if (sw) cand.push({ t: sw, ok: false, why: isPersonSubj(ex) ? 'Sai: câu nghe rất tự nhiên nhưng người trong tranh không làm việc này.' : 'Sai: câu tả một cảnh khác, không phải cảnh trong tranh.' });
      if (cand.length < 2) return;
      const T = cand.filter(c => c.ok), F = cand.filter(c => !c.ok);
      const c = F.length && Math.random() < 0.55 ? F[Math.floor(Math.random() * F.length)] : T[Math.floor(Math.random() * T.length)];
      return out.push({ key: w.id, q: picImg(w) + '<div class="small muted" style="text-align:center">Nghe câu mô tả. Câu này đúng hay sai với tranh?</div>', opts: ['Đúng với tranh', 'Sai với tranh'], a: c.ok ? 0 : 1,
        audio: [{ s: Math.random() < .5 ? 'M' : 'W', t: c.t }], after: `<div>“${esc(c.t)}”</div><div style="margin-top:6px">${c.why}</div>${c.t !== ex ? `<div class="small muted" style="margin-top:6px">Câu gốc: ${esc(ex)}</div>` : ''}` });
    }
    // listen A-D: đáp án đúng (đôi khi ở dạng bị động) + bẫy ngữ pháp + câu của tranh khác
    const right = pas && Math.random() < 0.35 ? { t: pas, why: 'bị động vẫn đúng' } : { t: ex };
    // ưu tiên bẫy giữ nguyên cảnh trong ảnh (giống đề thật), thiếu mới lấy câu của cảnh khác
    const near = [...sceneTraps(w, ex), bt && { t: bt, why: 'bẫy is being' }].filter(Boolean);
    const traps = []; const seen = new Set([right.t, ex, pas].filter(Boolean));
    shuffle(near).forEach(t => { if (traps.length < 3 && !seen.has(t.t)) { traps.push(t); seen.add(t.t); } });
    if (traps.length < 3 && sw && !seen.has(sw)) { traps.push({ t: sw, why: isPersonSubj(ex) ? 'sai hành động' : 'không có trong tranh' }); seen.add(sw); }
    if (traps.length < 3) { const sw2 = sameSubjTrap(w, ex, pool, scene, [...seen]); if (sw2) { traps.push({ t: sw2, why: isPersonSubj(ex) ? 'sai hành động' : 'không có trong tranh' }); seen.add(sw2); } }
    const others = traps.length < 3 ? picDistract(w, pool.filter(x => x.ex && x.ex[0] && !seen.has(x.ex[0])), 3 - traps.length, 'ex').map(x => ({ t: x.ex[0], why: 'không có trong tranh' })) : [];
    const op = shuffle([right, ...traps, ...others].slice(0, 4)); if (op.length < 4) return;
    const k = op.indexOf(right);
    out.push({ key: w.id, q: picImg(w) + '<div class="small muted" style="text-align:center">Nghe 4 câu rồi chọn câu tả đúng ảnh.</div>', opts: op.map(() => ''), a: k,
      audio: op.map((t, j) => ({ s: j % 2 ? 'M' : 'W', t: `(${'ABCD'[j]}) ${t.t}` })), after: sayAll(op, k) + `<div style="margin-top:8px">${after}</div>` });
  });
  return out;
}
const prefetchPic = () => (X.imgPrefetch ? X.imgPrefetch(X.VOCAB.filter(X.hasImgSlot)) : Promise.resolve()).then(() => { picReady = true; });
X.LABS = Object.assign(Object.fromEntries(PIC_LABS.map(l => [l.id, l])), X.LABS);

// Part 1 "Đối chiếu tranh" trong Lộ trình, Đề luyện, Bản đồ kỹ năng: dùng tranh thật thay cho câu tả tranh bằng chữ.
// Sinh 1 lần lúc mở web (ảnh lấy theo data/imgex.js), xáo theo hạt giống cố định để mỗi lần mở web đáp án vẫn giữ nguyên thứ tự.
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
X.buildP1Pic = () => { if (X.p1PicCount != null) return X.p1PicCount; if (!X.imgAssume) return 0; X.imgAssume();
  const R = Math.random; Math.random = seeded(20261112);
  let rounds = []; try { rounds = picRounds({ mode: 'listen', part: '1', kind: 'pic' }); } catch (e) { rounds = []; } finally { Math.random = R; }
  if (rounds.length < 20) return (X.p1PicCount = 0);
  const items = rounds.map(r => ({ id: 'p1pic-' + r.key, src: 'p1pic', part: 1, block: '', skill: 'Đối chiếu tranh', kind: 'mcq', tag: 'case', ao: 1,
    img: X.imgNow(X.wordById[r.key]), prompt: 'Câu nào tả đúng tranh?', options: r.audio.map(x => x.t.replace(/^\([A-D]\) /, '')), answer: r.a, audio: r.audio, explain: r.after, optVi: [] }));
  for (let i = X.BANK.length - 1; i >= 0; i--) if (X.BANK[i].src === 'p1case') X.BANK.splice(i, 1);   // bản chữ cũ: vẫn giữ trong itemById cho Sổ lỗi cũ
  items.forEach(it => { X.BANK.push(it); X.itemById[it.id] = it; });
  return (X.p1PicCount = items.length);
};

X.route(/^\/lab$/, view => {
  const s = S();
  const labs = Object.values(X.LABS).filter(l => !LAB_HIDE.has(l.id) && (l.kind === 'pic' || sizeOf(l) > 0));
  view.innerHTML = `<div class="page">${X.stepHead('luyen')}<div class="kicker">Lab phản xạ</div><h1 class="h1">Luyện cho đến khi không cần dịch</h1>
    <p class="lead">Bài ngắn, nhiều lượt. Mỗi module có hai chế độ: <b>Chính xác</b> (không giới hạn giờ, có giải thích) để hiểu, rồi <b>Tốc độ</b> (đếm ngược từng câu) để thành phản xạ. Nhanh mà sai thì chưa tính là giỏi.</p>
    ${GROUPS.map(([g, gn]) => { const ls = labs.filter(l => String(l.part) === g); if (!ls.length) return '';
      return `<div class="sec"><div class="sec-h"><h2 class="h2">${gn}</h2></div><div class="grid g-auto">${ls.map(l => { const r = s.labs[l.id];
        return `<a class="card link lab-card" href="#/lab/${l.id}"><div class="row"><span class="pill syn">${KIND_TAG[l.kind] || ''}</span><span class="pill">${sizeOf(l)} câu</span></div>
          <div class="h3" style="font-family:var(--f-display);font-size:17px">${esc(l.title)}</div><div class="small muted">${esc(l.desc || '')}</div>
          <div class="row small">${r ? `<span class="pill ${r.acc >= 85 ? 'sage' : r.acc >= 60 ? 'gold' : 'red'}">Gần nhất ${r.acc}%</span><span class="faint">${r.runs} lượt${r.ms ? ' - ' + fmtMs(r.ms) + '/câu' : ''}</span>` : '<span class="faint">Chưa luyện</span>'}</div></a>`; }).join('')}</div></div>`; }).join('')}
  </div>`;
  prefetchPic().then(() => $$('.lab-card', view).forEach(a => { const l = X.LABS[a.getAttribute('href').split('/').pop()]; if (l && l.kind === 'pic') { const p = $$('.pill', a)[1]; if (p) p.textContent = sizeOf(l) + ' ảnh'; } }));
});

X.route(/^\/lab\/([\w-]+)(?:\/(\w+))?$/, (view, id, sub) => {
  const L = X.LABS[id]; if (!L) return X.go('#/lab');
  if (L.kind === 'bank') return runBank(view, L);
  if (L.kind === 'cards') return runCards(view, L);
  const r = S().labs[id];
  const timed = L.time || L.kind === 'locate' || L.kind === 'graphic';
  if (L.kind === 'pic') prefetchPic().then(() => { const n = sizeOf(L), el = $('#lb-n', view); if (el) el.textContent = n ? n + ' ảnh trong kho' : 'Chưa có ảnh nào trong img/p1'; const g = $('#lb-go', view); if (g && !n) g.disabled = true; });
  view.innerHTML = `<div class="page"><a href="#/lab" class="small">${icon('back')} Lab phản xạ</a>
    <div class="kicker" style="margin-top:14px">${esc(KIND_TAG[L.kind] || '')} - Part ${esc(L.part)}</div><h1 class="h1">${esc(L.title)}</h1><p class="lead">${esc(L.desc || '')}</p>
    ${X.resumeCard('/lab/' + L.id, () => prefetchPic().then(() => run(view, L, null, null, X.sessGet('/lab/' + L.id))))}
    <div class="card sec" style="max-width:640px">
      <div class="field"><label>Chế độ</label><div class="seg" id="lb-mode"><button data-m="acc" class="${r && r.acc >= 85 && timed ? '' : 'on'}">Chính xác - có giải thích</button>${timed ? `<button data-m="speed" class="${r && r.acc >= 85 ? 'on' : ''}">Tốc độ - đếm ngược</button>` : ''}</div></div>
      ${L.mode === 'word' ? `<div class="field" style="margin-top:12px"><label>Nhóm từ</label><div class="seg wrap" id="lb-cat">${P1_CATS.map(([c, n]) => `<button data-c="${esc(c)}" class="${(L.cat || '') === c ? 'on' : ''}">${n}</button>`).join('')}</div></div>` : ''}
      <div class="small muted" style="margin-top:10px"><span id="lb-n">${L.kind === 'pic' ? 'Đang tải ảnh…' : sizeOf(L) + ' câu trong kho'}</span> - mỗi lượt tối đa 15 câu, xáo ngẫu nhiên.${r ? ` Lần gần nhất đúng ${r.acc}%.` : ''}</div>
      <div class="row" style="margin-top:18px"><button class="btn pri lg" id="lb-go">Bắt đầu ${icon('arrow')}</button>${r && r.wrong && r.wrong.length ? `<button class="btn" id="lb-wrong">${icon('refresh')} Ôn ${r.wrong.length} câu sai</button>` : ''}</div>
      <div class="small faint" style="margin-top:14px">Phím <kbd>1</kbd>-<kbd>4</kbd> để chọn, <kbd>Enter</kbd> sang câu tiếp.</div></div></div>`;
  $$('#lb-mode button', view).forEach(b => b.onclick = () => { $$('#lb-mode button', view).forEach(x => x.classList.toggle('on', x === b)); });
  const mode = () => $('#lb-mode button.on', view).dataset.m;
  $$('#lb-cat button', view).forEach(b => b.onclick = () => { $$('#lb-cat button', view).forEach(x => x.classList.toggle('on', x === b)); L.cat = b.dataset.c; const el = $('#lb-n', view); if (el) el.textContent = sizeOf(L) + ' ảnh trong nhóm'; });
  $('#lb-go', view).onclick = () => prefetchPic().then(() => run(view, L, mode(), null));
  const w = $('#lb-wrong', view); if (w) w.onclick = () => prefetchPic().then(() => run(view, L, mode(), r.wrong));
});

/* build rounds for a module: each round = {key, q (html), opts[], a, after (html), time, audio, lines} */
function rounds(L) {
  if (L.kind === 'pic') return picRounds(L);
  const items = L.items || [];
  // Lab phần nghe (Part 2, 3-4): câu tiếng Anh đọc to, chữ chỉ hiện sau khi chọn
  const LISTEN = ['2', '3-4'].includes(String(L.part)) && (L.kind === 'reflex' || L.kind === 'pairs');
  const clean = t => String(t).replace(/["“”]/g, '').replace(/…/g, '...').trim();
  const asListen = rs => !LISTEN ? rs : rs.map((r, i) => { const src = (L.kind === 'pairs' ? items[i] : items[i]) || {};
    const words = clean(src.q || '').split(/\s+/).length; return Object.assign(r, { time: (L.time || 6) + Math.ceil(words * 0.4) + 1, q: '<div class="flash listen-flash">🎧 Nghe rồi chọn</div>', audio: [{ s: 'W', t: clean(src.q || '') }], after: `<div><b>Bạn vừa nghe:</b> “${esc(clean(src.q || ''))}”</div>` + (r.after ? `<div style="margin-top:6px">${r.after}</div>` : '') }); });
  switch (L.kind) {
    case 'pairs': {
      const all = [...new Set(items.map(x => x.a))];
      const rs = asListen(items.map((x, i) => { const opts = shuffle([x.a, ...sample(all.filter(a => a !== x.a), 3)]); return { key: 'p' + i, q: `<div class="flash">${esc(x.q)}</div>`, opts, a: opts.indexOf(x.a), after: `${esc(x.q)} → <b>${esc(x.a)}</b>` }; }));
      (L.extra || []).forEach((x, i) => rs.push({ key: 'e' + i, q: `<div class="flash">${esc(x.q)}</div><div class="small muted" style="text-align:center;margin-top:-18px">Chọn từ cùng nghĩa</div>`, opts: x.opts, a: x.a, after: `${esc(x.q)} ≈ <b>${esc(x.opts[x.a])}</b>` }));
      return rs;
    }
    case 'same': return items.map((x, i) => ({ key: 's' + i, q: `<div class="grid g2" style="margin:10px 0"><div class="card tint"><div class="kicker">Câu 1</div><div class="q-prompt">${esc(x.a)}</div></div><div class="card tint"><div class="kicker">Câu 2</div><div class="q-prompt">${esc(x.b)}</div></div></div>`, opts: ['Cùng nghĩa', 'Khác nghĩa'], a: x.same ? 0 : 1, after: x.same ? 'Hai câu cùng một ý, chỉ đổi cách nói.' : 'Hai câu khác ý. Trùng từ không có nghĩa là trùng nghĩa.' }));
    case 'reflex': return asListen(items.map((x, i) => ({ key: 'r' + i, q: `<div class="flash">${esc(x.q)}</div>`, opts: x.opts, a: x.a, after: x.reveal ? `Đoạn tiếp theo: <i>${esc(x.reveal)}</i>` : '' })));
    case 'scan': {
      const all = items.map(x => x.vi);
      return items.map((x, i) => { const opts = shuffle([x.vi, ...sample(all.filter(v => v !== x.vi), 3)]); return { key: 'c' + i, scan: true, q: `<div class="flash" style="font-size:20px"><span class="flash-line">${x.mark}</span></div>`, opts, a: opts.indexOf(x.vi), after: `<span class="pill syn">${esc(x.cat)}</span> <span class="pill">Part ${x.p}</span><div style="margin-top:6px"><b>Nghe ở đâu:</b> ${esc(x.sig)}</div>` }; });
    }
    case 'implied': {
      const keys = Object.keys(L.fn);
      return items.map((x, i) => { const opts = shuffle([x.a, ...sample(keys.filter(k => k !== x.a), 3)]); const who = x.who === 'M' ? 'người đàn ông' : 'người phụ nữ';
        return { key: 'i' + i, q: `<div class="dlg">${x.d.map(([s, t]) => `<p><b>${s === 'M' ? 'Man' : 'Woman'}:</b> ${esc(t)}</p>`).join('')}<p><b>${x.who === 'M' ? 'Man' : 'Woman'}:</b> “${esc(x.q)}”</p></div><div class="q-prompt" style="margin-top:14px">Why does the ${x.who === 'M' ? 'man' : 'woman'} say, “${esc(x.q)}”?</div>`,
          opts: opts.map(k => L.fn[k][0]), a: opts.indexOf(x.a), after: `Câu trích có chức năng: <b>${esc(L.fn[x.a][1])}</b>. Ngụ ý luôn phải dựa vào câu ngay trước nó.`, audio: [...x.d.map(([s, t]) => ({ s, t })), { s: x.who, t: x.q }] }; });
    }
    case 'graphic': return items.map((x, i) => { const other = 1 - (x.listen || 0); return { key: 'g' + i, q: `<table class="gtable"><caption>${esc(x.g.title)}</caption><tr>${x.g.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${x.g.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table><div class="q-prompt" style="margin-top:14px">${esc(x.q)}</div>`,
      opts: x.g.rows.map(r => r[other]), a: x.ans, after: `Nghe: “${esc(x.ex)}” → dòng <b>${esc(x.g.rows[x.ans][x.listen || 0])}</b> → cột còn lại: <b>${esc(x.g.rows[x.ans][other])}</b>`, audio: [{ s: 'W', t: x.ex }] }; });
    case 'hunt': return items.map((x, i) => x.opts ? { key: 'h' + i, q: `<div class="flash">${esc(x.q)}</div>`, opts: x.opts, a: x.ai, after: '' } : (() => { const o = L.opts; const pick = shuffle([o.find(z => z.k === x.a), ...sample(o.filter(z => z.k !== x.a), 3)]); return { key: 'h' + i, q: `<div class="flash">${esc(x.q)}</div>`, opts: pick.map(z => `${z.icon} ${z.label}`), a: pick.findIndex(z => z.k === x.a), after: '' }; })());
    case 'locate': return items.map((x, i) => ({ key: 'l' + i, locate: true, q: `<div class="q-prompt">${esc(x.q)}</div><div class="small muted">Bấm vào dòng chứa bằng chứng.</div>`, opts: x.lines, a: x.correct, time: x.time, after: '' }));
  }
  return [];
}

function run(view, L, mode, only, resume) {
  const sKey = '/lab/' + L.id;
  let rs;
  const st = { i: 0, ok: 0, ms: 0, wrong: [], t: 0, answered: false };
  if (resume && resume.rs) { rs = resume.rs; mode = resume.mode; only = resume.only || null; Object.assign(st, { i: resume.i, ok: resume.ok, ms: resume.ms, wrong: resume.wrong || [], combo: 0 }); }
  else { X.sessDel(sKey); rs = shuffle(rounds(L)); if (only) rs = rs.filter(r => only.includes(r.key)); rs = rs.slice(0, 15); }
  const persist = () => { if (st.i < rs.length) X.sessSet(sKey, { kind: 'lab', title: L.title, n: rs.length, i: st.i, mode, only, rs, ok: st.ok, ms: st.ms, wrong: st.wrong }); };
  let tm = null;
  const stop = () => { clearInterval(tm); TTS.stop(); };
  X.onLeave(stop);
  const draw = () => {
    stop();
    if (st.i >= rs.length) return end();
    persist();
    const R = rs[st.i]; st.answered = false;
    const lim = mode === 'speed' ? (R.time || L.time || 6) : 0;
    view.innerHTML = `<div class="page"><div class="qz">
      <div class="qz-top"><a class="icon-btn" href="#/lab/${L.id}" data-quit="1">${icon('x')}</a><div><div class="kicker">${esc(L.title)}</div><div class="h3">${mode === 'speed' ? 'Tốc độ' : 'Chính xác'}</div></div><div class="bar"><i style="width:${pct(st.i, rs.length)}%"></i></div><span class="count">${st.i + 1}/${rs.length} - đúng ${st.ok}</span></div>
      <div class="q-card">${lim ? '<div class="cd"><i id="lb-cd"></i></div>' : ''}
        ${R.audio ? `<div class="audio-box"><button class="play" id="lb-play">${icon('play')}</button><div><b>Nghe</b><div class="lines">Bấm để nghe lại</div></div></div>` : ''}
        <div id="lb-q">${R.q}</div>
        <div class="${R.locate ? 'lines-pick' : 'opts'}" id="lb-opts">${R.opts.map((o, k) => R.locate ? `<button data-o="${k}">${esc(o)}</button>` : `<button class="opt" data-o="${k}"><span class="L">${LETTERS[k] || k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>
        <div id="lb-fb"></div></div></div></div>`;
    $$('[data-o]', view).forEach(b => b.onclick = () => answer(+b.dataset.o));
    const qb = $('[data-quit]', view); if (qb) qb.onclick = () => X.sessDel(sKey);
    const pl = $('#lb-play', view); if (pl) { pl.onclick = () => TTS.play(R.audio); setTimeout(() => TTS.play(R.audio), 250); }
    // bài nghe: giấu lời thoại cho đến khi chọn xong (như đề thật)
    if (R.audio) $$('#lb-q .dlg', view).forEach(d => { d.classList.add('dlg-hide'); d.insertAdjacentHTML('beforebegin', '<div class="dlg-ph">🎧 Nghe đoạn hội thoại. Lời thoại hiện sau khi bạn chọn.</div>'); });
    st.t = Date.now();
    if (R.scan && mode === 'speed') setTimeout(() => { const f = $('.flash', view); if (f && !st.answered) f.classList.add('hidden-q'); }, (L.time || 1.5) * 1000 * 1.6);
    if (lim) {
      const bar = $('#lb-cd', view), t0 = Date.now();
      tm = setInterval(() => { const left = 1 - (Date.now() - t0) / (lim * 1000); if (bar) bar.style.width = Math.max(0, left * 100) + '%'; if (left <= 0) { clearInterval(tm); if (!st.answered) answer(-1); } }, 50);
    }
    document.onkeydown = e => { const k = e.key; if (/^[1-9]$/.test(k) && +k <= R.opts.length && !st.answered) answer(+k - 1); else if (k === 'Enter' && st.answered) { st.i++; draw(); } };
  };
  const answer = k => {
    if (st.answered) return; st.answered = true; clearInterval(tm);
    const R = rs[st.i], ok = k === R.a, ms = Date.now() - st.t;
    st.ms += ms; if (ok) { st.ok++; st.combo = (st.combo || 0) + 1; } else { st.wrong.push(R.key); st.combo = 0; }
    $$('[data-o]', view).forEach((b, j) => { b.disabled = true; if (j === R.a) b.classList.add('ok'); else if (j === k) b.classList.add('bad'); });
    const f = $('.flash', view); if (f) f.classList.remove('hidden-q');
    $$('#lb-q .dlg-hide', view).forEach(d => d.classList.remove('dlg-hide')); $$('#lb-q .dlg-ph', view).forEach(d => d.remove());
    X.react && X.react(ok, $$('[data-o]', view)[ok ? R.a : Math.max(0, k)], st.combo);
    const fb = $('#lb-fb', view);
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><b class="h">${ok ? `Đúng - ${(ms / 1000).toFixed(1)}s` : k === -1 ? 'Hết giờ' : 'Chưa đúng'}</b>${R.after ? `<div>${R.after}</div>` : ''}</div>
      <div class="qz-actions"><button class="btn pri" id="lb-next">${st.i < rs.length - 1 ? 'Tiếp' : 'Xem kết quả'} ${icon('arrow')}</button><span class="small faint"><kbd>Enter</kbd></span></div>`;
    $('#lb-next', view).onclick = () => { st.i++; draw(); };
    if (ok) X.addXP(1);
    X.sessSet(sKey, { kind: 'lab', title: L.title, n: rs.length, i: st.i + 1, mode, only, rs, ok: st.ok, ms: st.ms, wrong: st.wrong });
    if (R.say && !R.audio) setTimeout(() => TTS.speak(R.say), 200);
    if (mode === 'speed' && ok && !R.after) setTimeout(() => { if (rs[st.i] === R) { st.i++; draw(); } }, 650);
  };
  const end = () => {
    stop(); X.sessDel(sKey);
    const acc = pct(st.ok, rs.length), avg = st.ms / Math.max(1, rs.length);
    const rec = (S().labs[L.id] ||= { runs: 0, best: 0 });
    rec.runs++; rec.acc = acc; rec.best = Math.max(rec.best, acc); rec.ms = Math.round(avg); rec.lastAt = Date.now();
    const prevWrong = new Set(rec.wrong || []); if (only) only.forEach(k => prevWrong.delete(k)); st.wrong.forEach(k => prevWrong.add(k)); rec.wrong = [...prevWrong];
    X.save(); X.addXP(5, 'Xong một lượt Lab'); X.track && X.track('lab-xong', 'Xong một lượt Lab');
    if (acc >= 85) { X.sfx.win(); X.rain(60); }
    view.innerHTML = `<div class="page"><div class="kicker">${esc(L.title)} - ${mode === 'speed' ? 'Tốc độ' : 'Chính xác'}</div><div class="hello">${X.xi(acc >= 85 ? 'happy' : acc >= 60 ? 'think' : 'sad', 92)}<h1 class="h1">${st.ok}/${rs.length} đúng</h1></div>
      <div class="card sec" style="max-width:640px"><div class="row"><span class="pill ${acc >= 85 ? 'sage' : acc >= 60 ? 'gold' : 'red'}">${acc}%</span><span class="pill">${(avg / 1000).toFixed(1)}s/câu</span><span class="pill">Tốt nhất ${rec.best}%</span></div>
      <p class="muted" style="margin:14px 0">${acc >= 85 ? (mode === 'speed' ? 'Đã thành phản xạ. Quay lại sau vài ngày để kiểm tra độ bền.' : 'Đã chắc. Chuyển sang chế độ Tốc độ.') : acc >= 60 ? 'Khá. Ôn lại câu sai rồi làm thêm một lượt.' : 'Chưa chắc. Làm chế độ Chính xác, đọc kỹ giải thích từng câu.'}</p>
      <div class="row">${st.wrong.length ? `<button class="btn syn" id="lb-rw">${icon('refresh')} Ôn ${st.wrong.length} câu sai</button>` : ''}<button class="btn" id="lb-again">Lượt mới</button><a class="btn ${st.wrong.length ? '' : 'pri'}" href="#/lab">Về Lab</a></div></div>${X.coachNudge && (acc < 60 || rec.runs % 4 === 0) ? `<div style="max-width:640px;margin-top:14px">${X.coachNudge(acc < 60 ? 'Dạng này hơi khó nhằn? Coach có thể cùng bạn xem Sổ lỗi và tìm ra chỗ hổng gốc.' : 'Luyện đều đấy! Muốn có lộ trình riêng đến ngày thi thì coach giúp được.')}</div>` : ''}</div>`;
    const rw = $('#lb-rw', view); if (rw) rw.onclick = () => run(view, L, 'acc', st.wrong);
    $('#lb-again', view).onclick = () => run(view, L, mode, null);
  };
  draw();
}

function runBank(view, L) {
  const items = () => shuffle(X.BANK.filter(i => Object.entries(L.filter).every(([k, v]) => i[k] === v))).slice(0, 15);
  X.quizFlow(view, { title: L.title, kicker: 'Lab phản xạ', items: items(), mode: 'practice', listen: L.filter.part === 2, ctx: 'lab:' + L.id, back: '#/lab', reshuffle: items },
    { back: '#/lab', onDone: res => { const rec = (S().labs[L.id] ||= { runs: 0, best: 0 }); rec.runs++; rec.acc = pct(res.correct, res.total); rec.best = Math.max(rec.best, rec.acc); rec.ms = Math.round(res.ms / res.total); rec.lastAt = Date.now(); X.save(); } });
}

function runCards(view, L) {
  const cards = shuffle(L.items); let i = 0, known = 0; const again = [];
  const draw = () => {
    if (i >= cards.length) {
      const rec = (S().labs[L.id] ||= { runs: 0, best: 0 }); rec.runs++; rec.acc = pct(known, cards.length); rec.best = Math.max(rec.best, rec.acc); rec.lastAt = Date.now(); X.save(); X.addXP(5, 'Xong bộ thẻ');
      view.innerHTML = `<div class="page"><div class="kicker">${esc(L.title)}</div><h1 class="h1">Nhớ ${known}/${cards.length} thẻ</h1><div class="row sec">${again.length ? '<button class="btn syn" id="fc-again">Ôn lại thẻ chưa nhớ</button>' : ''}<a class="btn" href="#/lab">Về Lab</a></div></div>`;
      const a = $('#fc-again', view); if (a) a.onclick = () => { cards.splice(0, cards.length, ...again); again.length = 0; i = 0; known = 0; draw(); };
      return;
    }
    const c = cards[i];
    view.innerHTML = `<div class="page"><div class="qz" style="max-width:640px"><div class="qz-top"><a class="icon-btn" href="#/lab">${icon('x')}</a><div><div class="kicker">${esc(L.title)}</div></div><div class="bar"><i style="width:${pct(i, cards.length)}%"></i></div><span class="count">${i + 1}/${cards.length}</span></div>
      <div class="flip" id="fc"><div class="in"><div class="fa"><span class="pill syn">${esc(c.tag)}</span><div class="h1" style="margin-top:14px">${esc(c.prompt)}</div><div class="small faint">Bấm để lật</div></div>
      <div class="fb2"><div class="h1">${esc(c.answer)}</div><div style="color:#C9CBD3;margin-top:10px;max-width:440px">${esc(c.rule)}</div></div></div></div>
      <div class="row" style="justify-content:center;margin-top:18px" id="fc-b"><button class="btn" data-g="0">Chưa nhớ</button><button class="btn pri" data-g="1">Nhớ rồi</button></div></div></div>`;
    $('#fc', view).onclick = e => e.currentTarget.classList.toggle('on');
    $$('[data-g]', view).forEach(b => b.onclick = () => { if (+b.dataset.g) known++; else again.push(c); i++; draw(); });
    document.onkeydown = e => { if (e.key === ' ') { e.preventDefault(); $('#fc', view).classList.toggle('on'); } };
  };
  draw();
}
})();
