/* ===== Letter Quest — Roblox-style alphabet obby ===== */
'use strict';

// ---------- Storage ----------
const SAVE_KEY = 'letterquest.v1';
const AVATAR_SKINS = ['#fcd34d', '#fdba74', '#d4a373', '#a16207', '#f9a8d4', '#93c5fd'];
let DB = load();
function load() {
  try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.players) return d; } catch (e) {}
  return { players: [], active: null, accent: 'US', sound: true };
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); } catch (e) {} }
function today() { return new Date().toISOString().slice(0, 10); }
function newPlayer(name, skin, shirt) {
  return {
    id: Date.now().toString(36), name, created: today(),
    avatar: { skin, shirt, hat: '', pet: '' },
    coins: 0, gems: 0, xp: 0, stars: {}, bosses: [], items: [], badges: [],
    streak: { last: '', count: 0 },
    daily: { date: '', questId: '', progress: { stages: 0, traced: 0, correct: 0 }, claimed: false },
    stats: { correct: 0, wrong: 0, traced: 0, coinsEarned: 0, rushBest: 0 },
  };
}
function P() { return DB.players.find(p => p.id === DB.active); }

// ---------- Utils ----------
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const rnd = a => a[Math.floor(Math.random() * a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

// ---------- Audio: speech (UK / US) + sound effects ----------
const Speech = {
  voices: [],
  init() {
    if (!('speechSynthesis' in window)) return;
    const loadV = () => { this.voices = speechSynthesis.getVoices(); };
    loadV(); speechSynthesis.onvoiceschanged = loadV;
  },
  available() { return 'speechSynthesis' in window; },
  voiceFor(accent) {
    const lang = accent === 'UK' ? 'en-GB' : 'en-US';
    const vs = this.voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()));
    // prefer high quality / natural voices
    const pref = ['Google', 'Natural', 'Premium', 'Enhanced', 'Samantha', 'Daniel', 'Karen', 'Moira', 'Alex'];
    vs.sort((a, b) => pref.findIndex(p => b.name.includes(p)) - pref.findIndex(p => a.name.includes(p)));
    return vs[0] || this.voices.find(v => v.lang.startsWith('en')) || null;
  },
  say(text, accent = DB.accent, rate = 0.85) {
    if (!this.available()) return Promise.resolve();
    return new Promise(res => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.voiceFor(accent);
      if (v) u.voice = v;
      u.lang = accent === 'UK' ? 'en-GB' : 'en-US';
      u.rate = rate; u.pitch = 1.05;
      u.onend = res; u.onerror = res;
      speechSynthesis.speak(u);
      setTimeout(res, 4000);
    });
  },
  // Letter name: "zed" (UK) vs "zee" (US); other letters are read as letter names.
  letterName(L, accent = DB.accent) {
    const d = LETTER_MAP[L];
    if (accent === 'UK' && d.nameWordUK) return this.say(d.nameWordUK, accent);
    if (accent === 'US' && d.nameWordUS) return this.say(d.nameWordUS, accent);
    return this.say(L + '.', accent, 0.8);
  },
  word(L, accent = DB.accent) { return this.say(LETTER_MAP[L].word, accent); },
  async letterIntro(L, accent = DB.accent) {
    const d = LETTER_MAP[L];
    await this.letterName(L, accent);
    await sleep(250);
    await this.say(`${d.word}.`, accent);
  },
};
Speech.init();

const SFX = {
  ctx: null,
  get() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return this.ctx; },
  tone(f, dur = 0.12, type = 'square', vol = 0.15, when = 0) {
    const c = this.get(); if (!c || !DB.sound) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, c.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + when); o.stop(c.currentTime + when + dur + 0.02);
  },
  correct() { this.tone(660, .1); this.tone(880, .12, 'square', .15, .1); this.tone(1320, .18, 'square', .15, .2); },
  wrong() { this.tone(220, .18, 'sawtooth', .12); this.tone(160, .25, 'sawtooth', .12, .15); },
  coin() { this.tone(1500, .06, 'sine', .12); this.tone(2000, .12, 'sine', .12, .06); },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .2, 'triangle', .18, i * .12)); this.tone(1319, .5, 'triangle', .2, .5); },
  click() { this.tone(500, .05, 'sine', .08); },
  pop() { this.tone(900, .05, 'triangle', .1); },
};

// ---------- Confetti ----------
function confetti(n = 120) {
  const cv = $('#confetti'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#ffc53d', '#2fbf88', '#4c8dff', '#ff6b6b', '#8b5cf6', '#f2960a', '#fff'];
  const ps = Array.from({ length: n }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * 200, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, s: 6 + Math.random() * 8, c: rnd(cols), r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3 }));
  let t = 0;
  (function frame() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); });
    if (++t < 160) requestAnimationFrame(frame); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}
function toast(msg) { const t = el(`<div class="badge-toast">${msg}</div>`); $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3100); }
function coinFly(x, y, n = 3) { for (let i = 0; i < n; i++) { const c = el('<div class="coin-fly">🪙</div>'); c.style.left = (x + (Math.random() - .5) * 60) + 'px'; c.style.top = y + 'px'; c.style.animationDelay = i * 80 + 'ms'; document.body.appendChild(c); setTimeout(() => c.remove(), 1200); } }

// ---------- Avatar ----------
function avatarHTML(av, cls = '') {
  const hat = av.hat ? (SHOP.find(i => i.id === av.hat) || {}).emoji || '' : '';
  const pet = av.pet ? (SHOP.find(i => i.id === av.pet) || {}).emoji || '' : '';
  return `<div class="avatar ${cls}">
    ${hat ? `<div class="hat">${hat}</div>` : ''}
    <div class="egg-body" style="background:${av.skin}">
      <span class="eye l"></span><span class="eye r"></span>
      <span class="cheek l"></span><span class="cheek r"></span>
      <div class="belly" style="background:${av.shirt}"></div>
    </div>
    ${pet ? `<div class="pet">${pet}</div>` : ''}</div>`;
}

// ---------- Progression helpers ----------
function levelOf(xp) { let lv = 0; LEVELS.forEach((l, i) => { if (xp >= l.xp) lv = i; }); return lv; }
function levelInfo(p) {
  const lv = levelOf(p.xp), cur = LEVELS[lv], next = LEVELS[lv + 1];
  const pct = next ? Math.round((p.xp - cur.xp) / (next.xp - cur.xp) * 100) : 100;
  return { lv, title: cur.title, cn: cur.cn, pct, next };
}
function worldUnlocked(p, w) { return w.id === 0 || p.bosses.includes(w.id - 1); }
function letterUnlocked(p, w, idx) { if (!worldUnlocked(p, w)) return false; if (idx === 0) return true; return !!p.stars[w.letters[idx - 1]]; }
function bossUnlocked(p, w) { return w.letters.every(L => p.stars[L]); }

function addCoins(p, n, srcEl) {
  p.coins += n; p.stats.coinsEarned += n; SFX.coin();
  if (srcEl) { const r = srcEl.getBoundingClientRect(); coinFly(r.left + r.width / 2, r.top + r.height / 2, Math.min(6, Math.ceil(n / 10))); }
  const pill = $('#coinPill'); if (pill) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  refreshBar();
}
function addXP(p, n) {
  const before = levelOf(p.xp); p.xp += n;
  if (levelOf(p.xp) > before) { const li = levelInfo(p); SFX.win(); toast(`🎉 Level Up! ${li.title} · ${li.cn}`); }
}
function checkBadges(p) {
  BADGES.forEach(b => { if (!p.badges.includes(b.id) && b.test(p)) { p.badges.push(b.id); p.gems += 1; toast(`${b.emoji} New badge: ${b.name} · ${b.cn} (+1 💎)`); SFX.win(); } });
  save();
}
function touchStreak(p) {
  const t = today();
  if (p.streak.last === t) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  p.streak.count = p.streak.last === y ? p.streak.count + 1 : 1;
  p.streak.last = t;
  if (p.streak.count > 1) toast(`🔥 ${p.streak.count} day streak! 连续 ${p.streak.count} 天`);
}
function ensureDaily(p) {
  const t = today();
  if (p.daily.date !== t) { p.daily = { date: t, questId: rnd(DAILY_QUESTS).id, progress: { stages: 0, traced: 0, correct: 0 }, claimed: false }; }
  return DAILY_QUESTS.find(q => q.id === p.daily.questId);
}
function dailyBump(p, key, n = 1) { ensureDaily(p); p.daily.progress[key] += n; }

// ---------- Screens ----------
function show(id) { $$('.screen').forEach(s => s.classList.remove('active')); $('#' + id).classList.add('active'); window.scrollTo(0, 0); }
function refreshBar() {
  const p = P(); if (!p) return;
  $$('.coinsVal').forEach(e => e.textContent = p.coins);
  $$('.gemsVal').forEach(e => e.textContent = p.gems);
}

// ----- Player select -----
function renderPlayers() {
  const box = $('#playerList'); box.innerHTML = '';
  DB.players.forEach(p => {
    const c = el(`<div class="player-card">${avatarHTML(p.avatar)}<div class="name">${p.name}</div><div class="sub">⭐ ${Object.values(p.stars).reduce((a, b) => a + b, 0)} · 🪙 ${p.coins} · Lv.${levelOf(p.xp) + 1}</div></div>`);
    c.onclick = () => { SFX.click(); DB.active = p.id; save(); goHome(); };
    box.appendChild(c);
  });
  if (DB.players.length < 4) { const a = el('<div class="player-card add">＋ New Player<br>新玩家</div>'); a.onclick = openCreate; box.appendChild(a); }
  show('screen-players');
}
function openCreate() {
  let skin = AVATAR_SKINS[0], shirt = '#4c8dff';
  const shirts = ['#4c8dff', '#ff6b6b', '#f472b6', '#2fbf88', '#8b5cf6', '#f2960a'];
  const d = el(`<div class="dialog-bg"><div class="dialog">
    <h2>Create Player · 创建玩家</h2>
    <div id="prevAv">${avatarHTML({ skin, shirt })}</div>
    <input type="text" id="newName" maxlength="12" placeholder="Name 名字">
    <p class="sub">Skin 皮肤</p><div class="swatches" id="skinSw"></div>
    <p class="sub">Shirt 衣服</p><div class="swatches" id="shirtSw"></div>
    <div class="row mt" style="justify-content:center"><button class="btn gray" id="cancelC">Cancel</button><button class="btn green" id="okC">Go! 开始</button></div>
  </div></div>`);
  document.body.appendChild(d);
  const redraw = () => { d.querySelector('#prevAv').innerHTML = avatarHTML({ skin, shirt }); };
  const mk = (list, cur, setter, box) => { box.innerHTML = ''; list.forEach(c => { const s = el(`<div style="background:${c}" class="${c === cur ? 'on' : ''}"></div>`); s.onclick = () => { setter(c); mk(list, c, setter, box); redraw(); }; box.appendChild(s); }); };
  mk(AVATAR_SKINS, skin, v => skin = v, d.querySelector('#skinSw'));
  mk(shirts, shirt, v => shirt = v, d.querySelector('#shirtSw'));
  d.querySelector('#cancelC').onclick = () => d.remove();
  d.querySelector('#okC').onclick = () => {
    const name = d.querySelector('#newName').value.trim() || 'Player';
    const p = newPlayer(name, skin, shirt); DB.players.push(p); DB.active = p.id; save(); d.remove(); goHome();
  };
  setTimeout(() => d.querySelector('#newName').focus(), 50);
}

// ----- Home -----
function goHome() {
  const p = P(); if (!p) return renderPlayers();
  touchStreak(p); const q = ensureDaily(p); checkBadges(p); save();
  const li = levelInfo(p);
  const stars = Object.values(p.stars).reduce((a, b) => a + b, 0);
  $('#homeHero').innerHTML = `${avatarHTML(p.avatar, 'dance')}<div class="info">
    <h1>${p.name}</h1><div class="sub">Lv.${li.lv + 1} ${li.title} · ${li.cn}</div>
    <div class="xpbar"><div style="width:${li.pct}%"></div></div>
    <div class="sub">${li.next ? `${p.xp} / ${li.next.xp} XP` : 'MAX'} · ⭐ ${stars}/78 · 🔥 ${p.streak.count} day</div></div>`;
  const prog = Math.min(q.target, p.daily.progress[q.key]);
  const done = prog >= q.target;
  $('#dailyQuest').innerHTML = `<span style="font-size:28px">📜</span><div style="flex:1"><b>Daily Quest · 每日任务</b><div class="sub">${q.text} · ${q.cn}</div>
    <div class="bar" style="margin-top:6px"><div style="width:${prog / q.target * 100}%"></div></div></div>
    ${p.daily.claimed ? '<span>✅</span>' : done ? `<button class="btn yellow small" id="claimDaily">+${q.reward} 🪙</button>` : `<b>${prog}/${q.target}</b>`}`;
  const cd = $('#claimDaily'); if (cd) cd.onclick = e => { p.daily.claimed = true; addCoins(p, q.reward, e.target); addXP(p, 20); save(); goHome(); };
  const rushUnlocked = p.bosses.length >= 1;
  $('#rushBtn').disabled = !rushUnlocked; $('#rushBtn').querySelector('small').textContent = rushUnlocked ? `Best ${p.stats.rushBest}` : '🔒 Beat Boss 1';
  $$('.accent-toggle button').forEach(b => b.classList.toggle('on', b.dataset.acc === DB.accent));
  refreshBar(); show('screen-home');
}

// ----- Map -----
function renderMap() {
  const p = P(); const box = $('#worlds'); box.innerHTML = '';
  WORLDS.forEach(w => {
    const unlocked = worldUnlocked(p, w);
    const wd = el(`<div class="world ${unlocked ? '' : 'locked'}" style="background:${w.bg}"><h2>${w.emoji} ${w.name} <span class="sub" style="color:#334155">${w.cn}</span>${unlocked ? '' : ' 🔒'}</h2><div class="stages"></div></div>`);
    const st = wd.querySelector('.stages');
    w.letters.forEach((L, i) => {
      const ok = letterUnlocked(p, w, i), s = p.stars[L] || 0;
      const d = el(`<div class="stage ${ok ? '' : 'locked'}">${L}<small style="font-size:20px">${L.toLowerCase()}</small><div class="stars">${s ? '⭐'.repeat(s) : ok ? '' : '🔒'}</div></div>`);
      if (ok) d.onclick = () => { SFX.click(); startStage(L, w); };
      st.appendChild(d);
    });
    const bok = bossUnlocked(p, w), bdone = p.bosses.includes(w.id);
    const b = el(`<div class="stage boss ${bok ? '' : 'locked'} ${bdone ? 'done' : ''}">👾<div class="stars">${bdone ? 'DONE' : 'BOSS'}</div>${bok ? '' : '<div class="lock">🔒</div>'}</div>`);
    if (bok) b.onclick = () => { SFX.click(); startBoss(w); };
    st.appendChild(b);
    st.appendChild(el(`<div class="chest">${bdone ? '📭' : '🎁'}</div>`));
    box.appendChild(wd);
  });
  refreshBar(); show('screen-map');
}

// ---------- Stage engine ----------
let S = null; // current stage state
function startStage(L, w) {
  const d = LETTER_MAP[L];
  S = { L, w, boss: false, tasks: [], i: 0, mistakes: 0, taskMistakes: 0 };
  S.tasks = [
    { t: 'meet' }, { t: 'find', target: L, kind: 'upper' }, { t: 'find', target: L, kind: 'lower' },
    { t: 'listen', target: L }, { t: 'trace', ch: L }, { t: 'trace', ch: L.toLowerCase() }, { t: 'phonics', target: L },
  ];
  runTask();
}
function startBoss(w) {
  S = { L: null, w, boss: true, tasks: [], i: 0, mistakes: 0, taskMistakes: 0 };
  const types = ['find', 'listen', 'phonics', 'match'];
  S.tasks = shuffle(w.letters.flatMap(L => [{ t: rnd(types), target: L, kind: rnd(['upper', 'lower']) }, { t: rnd(types), target: L, kind: rnd(['upper', 'lower']) }])).slice(0, 8);
  S.tasks.push({ t: 'trace', ch: rnd(w.letters) });
  runTask();
}
function renderProgress() {
  const box = $('#progress'); box.innerHTML = '';
  S.tasks.forEach((t, i) => box.appendChild(el(`<div class="${i < S.i ? 'done' : i === S.i ? 'cur' : ''}"></div>`)));
  const t = S.tasks[S.i], reveal = t && (t.t === 'meet' || t.t === 'trace');
  $('#stageTitle').textContent = S.boss ? `👾 ${S.w.name} BOSS` : `${reveal ? `${S.L} ${S.L.toLowerCase()}` : '❓'} · ${S.w.emoji} ${S.w.name}`;
}
function runTask() {
  if (S.i >= S.tasks.length) return finishStage();
  S.taskMistakes = 0;
  renderProgress(); show('screen-stage');
  const t = S.tasks[S.i], area = $('#taskArea'); area.innerHTML = '';
  ({ meet: taskMeet, find: taskFind, match: taskFind, listen: taskListen, trace: taskTrace, phonics: taskPhonics })[t.t](t, area);
}
function nextTask(reward = 10) {
  const p = P();
  if (reward) { addCoins(p, reward, $('#taskArea')); addXP(p, 5); }
  save(); S.i++; setTimeout(runTask, 500);
}
function markAnswer(btn, ok, onRight) {
  const p = P();
  if (ok) {
    btn.classList.add('ok'); SFX.correct(); p.stats.correct++; dailyBump(p, 'correct');
    $('#feedback').textContent = rnd(['Great! 🎉', 'Awesome! 🌟', 'Yes! 👍', 'Super! 🚀', 'Nice! 😎']);
    $$('.choice').forEach(c => c.style.pointerEvents = 'none');
    onRight();
  } else {
    btn.classList.add('bad'); SFX.wrong(); p.stats.wrong++; S.mistakes++; S.taskMistakes++;
    $('#feedback').textContent = rnd(['Try again! 再试试', 'Almost! 差一点', 'Hmm... 🤔']);
    setTimeout(() => btn.classList.remove('bad'), 500);
    if (S.taskMistakes >= 2) hintCorrect();
  }
}
function hintCorrect() { $$('.choice[data-ok="1"]').forEach(c => { c.style.animation = 'bump .6s infinite'; }); }

// -- Task: meet the letter
function taskMeet(t, area) {
  const d = LETTER_MAP[S.L];
  area.innerHTML = `<div class="prompt">Meet the letter!<span class="cn">认识新字母</span></div>
    <div class="bigletter" style="color:${S.w.color}">${S.L}<small>${S.L.toLowerCase()}</small></div>
    <div class="center" style="font-size:64px">${d.emoji}</div>
    <div class="center" style="font-size:28px;font-weight:800">${d.word} <span class="sub">${d.cn}</span></div>
    <div class="center sub">Letter name: 🇬🇧 ${d.nameUK} · 🇺🇸 ${d.nameUS} &nbsp;|&nbsp; Sound: ${d.sound}</div>
    <div class="row mt" style="justify-content:center">
      <button class="btn small" id="sayUK">🇬🇧 UK</button><button class="btn small purple" id="sayUS">🇺🇸 US</button>
      <button class="btn small yellow" id="sayWord">🔊 ${d.word}</button></div>
    <div class="center mt"><button class="btn green big" id="meetNext">Let's go! 出发 ➜</button></div>`;
  $('#sayUK').onclick = () => Speech.letterIntro(S.L, 'UK');
  $('#sayUS').onclick = () => Speech.letterIntro(S.L, 'US');
  $('#sayWord').onclick = () => Speech.word(S.L);
  $('#meetNext').onclick = () => nextTask(5);
  Speech.letterIntro(S.L);
}
// -- Task: find the letter (upper / lower) & match
function taskFind(t, area) {
  const L = t.target, lower = t.kind === 'lower';
  const target = lower ? L.toLowerCase() : L;
  const pool = LETTERS.map(x => x.L).filter(x => x !== L);
  // Include confusable letters when possible
  const conf = { b: 'dpq', d: 'bpq', p: 'bdq', q: 'bdp', m: 'nw', n: 'mu', u: 'nv', v: 'uw', i: 'jl', l: 'i', E: 'F', F: 'E', M: 'NW', N: 'M', O: 'QC', Q: 'O', C: 'GO', G: 'C', V: 'WU', W: 'VM' }[target] || '';
  const opts = shuffle([target, ...pick(pool, 5)].map(x => (x === target ? x : (lower ? x.toLowerCase() : x))));
  const isMatch = t.t === 'match';
  const shown = isMatch ? (lower ? L : L.toLowerCase()) : null;
  const d = LETTER_MAP[L];
  area.innerHTML = `<div class="prompt">${isMatch ? `Find the ${lower ? 'small' : 'big'} letter for <span style="font-size:44px;color:var(--yellow)">${shown}</span>` : lower ? `Find the small letter for <span style="font-size:44px;color:var(--yellow)">${L}</span>` : `Listen! Find the big letter for <span style="font-size:44px">${d.emoji}</span>`}
    <span class="cn">${isMatch ? `找到 ${shown} 的${lower ? '小写' : '大写'}` : lower ? `找到 ${L} 的小写` : `听一听，找到「${d.cn}」${d.ends ? '结尾' : '开头'}的大写字母`}</span></div>
    <div class="row" style="justify-content:center"><button class="btn small" id="sayL">🔊 Listen</button></div>
    <div class="choices"></div><div class="feedback" id="feedback"></div>`;
  $('#sayL').onclick = () => Speech.letterName(L);
  if (!isMatch && !lower) setTimeout(() => Speech.letterName(L), 300);
  const box = area.querySelector('.choices');
  opts.forEach(o => { const c = el(`<div class="choice" data-ok="${o === target ? 1 : 0}">${o}</div>`); c.onclick = () => markAnswer(c, o === target, () => nextTask()); box.appendChild(c); });
  void conf;
}
// -- Task: listen and pick
function taskListen(t, area) {
  const L = t.target;
  const opts = shuffle([L, ...pick(LETTERS.map(x => x.L).filter(x => x !== L), 3)]);
  area.innerHTML = `<div class="prompt">Listen! Which letter is it?<span class="cn">听一听，是哪个字母？</span></div>
    <div class="center"><button class="btn big yellow" id="playL">🔊</button></div>
    <div class="row mt" style="justify-content:center"><span class="accent-toggle"><button data-acc="UK" class="${DB.accent === 'UK' ? 'on' : ''}">🇬🇧 UK</button><button data-acc="US" class="${DB.accent === 'US' ? 'on' : ''}">🇺🇸 US</button></span></div>
    <div class="choices"></div><div class="feedback" id="feedback"></div>`;
  const play = () => Speech.letterName(L);
  $('#playL').onclick = play;
  area.querySelectorAll('.accent-toggle button').forEach(b => b.onclick = () => { setAccent(b.dataset.acc); area.querySelectorAll('.accent-toggle button').forEach(x => x.classList.toggle('on', x === b)); play(); });
  const box = area.querySelector('.choices');
  opts.forEach(o => { const c = el(`<div class="choice" data-ok="${o === L ? 1 : 0}">${o}<small style="font-size:30px;margin-left:4px">${o.toLowerCase()}</small></div>`); c.onclick = () => markAnswer(c, o === L, () => nextTask()); box.appendChild(c); });
  if (!Speech.available()) $('#feedback').textContent = '⚠️ 此浏览器不支持语音，请换 Chrome / Safari';
  setTimeout(play, 300);
}
// -- Task: phonics (which picture starts with the letter)
function taskPhonics(t, area) {
  const L = t.target, d = LETTER_MAP[L];
  const others = pick(LETTERS.filter(x => x.L !== L), 2);
  const opts = shuffle([d, ...others]);
  const ends = !!d.ends;
  area.innerHTML = `<div class="prompt">Which one ${ends ? 'ends' : 'starts'} with <span style="color:var(--yellow)">${L} ${L.toLowerCase()}</span>?<span class="cn">哪一个是 ${L} ${ends ? '结尾' : '开头'}的？ (${d.sound}) 点图片可以听发音</span></div>
    <div class="choices"></div><div class="feedback" id="feedback"></div>`;
  const box = area.querySelector('.choices');
  opts.forEach(o => {
    const c = el(`<div class="choice pic" data-ok="${o.L === L ? 1 : 0}">${o.emoji}<span>${o.cn}</span></div>`);
    c.onclick = () => { Speech.word(o.L); markAnswer(c, o.L === L, () => { box.querySelectorAll('.choice').forEach((x, i) => x.querySelector('span').textContent = opts[i].word); nextTask(); }); };
    box.appendChild(c);
  });
}
// -- Task: trace the letter
function taskTrace(t, area) {
  const ch = t.ch, strokes = STROKES[ch];
  area.innerHTML = `<div class="prompt">Trace the letter <span style="color:var(--yellow)">${ch}</span><span class="cn">跟着数字顺序描写字母 ${ch}（先看演示，再用手指写）</span></div>
    <div class="trace-wrap"><canvas class="trace" id="traceCv" width="320" height="320"></canvas>
    <div class="row mt" style="justify-content:center">
      <button class="btn small purple" id="demoBtn">▶ Show me 演示</button>
      <button class="btn small gray" id="clearBtn">🧽 Clear 清除</button>
      <button class="btn green" id="checkBtn">✓ Done 完成</button></div>
    <div class="feedback" id="feedback"></div></div>`;
  const cv = $('#traceCv'), ctx = cv.getContext('2d');
  const sz = cv.width, sc = sz / 100;
  let user = [], cur = null, drawing = false, demoTimer = null, demoPos = null;
  const guide = strokes.flatMap(s => densify(s, 2));
  function base() {
    ctx.clearRect(0, 0, sz, sz); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, sz, sz);
    // guide lines
    ctx.lineWidth = 2; [10, 45, 80].forEach((y, i) => { ctx.strokeStyle = i === 2 ? '#8a84ab' : '#eaf0fb'; ctx.setLineDash(i === 1 ? [6, 6] : []); ctx.beginPath(); ctx.moveTo(0, y * sc); ctx.lineTo(sz, y * sc); ctx.stroke(); }); ctx.setLineDash([]);
    // ghost letter
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#e3ddff'; ctx.lineWidth = 26 * sc / 3.2;
    strokes.forEach(s => poly(s));
    ctx.strokeStyle = '#b7a6ff'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); strokes.forEach(s => poly(s)); ctx.setLineDash([]);
    // numbered start dots + arrows
    strokes.forEach((s, i) => {
      const [x, y] = s[0]; ctx.fillStyle = '#f2960a'; ctx.beginPath(); ctx.arc(x * sc, y * sc, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i + 1, x * sc, y * sc);
    });
    // user ink
    ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 14; user.forEach(s => poly(s)); if (cur) poly(cur);
    if (demoPos) { ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(demoPos[0] * sc, demoPos[1] * sc, 12, 0, 7); ctx.fill(); }
  }
  function poly(s) { if (s.length < 2) { if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0][0] * sc, s[0][1] * sc, ctx.lineWidth / 2, 0, 7); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); } return; } ctx.beginPath(); ctx.moveTo(s[0][0] * sc, s[0][1] * sc); for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0] * sc, s[i][1] * sc); ctx.stroke(); }
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100]; }
  cv.onpointerdown = e => { e.preventDefault(); stopDemo(); drawing = true; cur = [pos(e)]; cv.setPointerCapture(e.pointerId); base(); };
  cv.onpointermove = e => { if (!drawing) return; cur.push(pos(e)); base(); };
  cv.onpointerup = cv.onpointercancel = e => { if (!drawing) return; drawing = false; user.push(cur); cur = null; base(); SFX.pop(); };
  $('#clearBtn').onclick = () => { user = []; $('#feedback').textContent = ''; base(); };
  function stopDemo() { if (demoTimer) { clearTimeout(demoTimer); demoTimer = null; } demoPos = null; }
  function demo() {
    stopDemo(); const pts = strokes.flatMap((s, i) => densify(s, 3).map(p => [p, i])); let k = 0;
    const step = () => { if (k >= pts.length) { demoPos = null; base(); return; } demoPos = pts[k][0]; base(); k++; demoTimer = setTimeout(step, k % 1 === 0 && k < pts.length && pts[k][1] !== pts[k - 1][1] ? 400 : 18); };
    step();
  }
  $('#demoBtn').onclick = demo;
  $('#checkBtn').onclick = () => {
    const ink = user.flatMap(s => densify(s, 2));
    if (ink.length < 5) { $('#feedback').textContent = 'Draw the letter first! 先写一写 ✍️'; return; }
    const near = (a, b, d) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 <= d * d;
    const cov = guide.filter(g => ink.some(p => near(p, g, 11))).length / guide.length;
    const prec = ink.filter(p => guide.some(g => near(p, g, 14))).length / ink.length;
    const strict = S.boss ? 0.7 : 0.6;
    if (cov >= strict && prec >= 0.55) {
      const p = P(); p.stats.traced++; dailyBump(p, 'traced'); SFX.correct(); confetti(40);
      $('#feedback').textContent = cov > 0.85 ? 'Perfect writing! ✍️🌟' : 'Nice writing! ✍️👍';
      $('#checkBtn').disabled = true; nextTask(15);
    } else {
      S.mistakes++; S.taskMistakes++; SFX.wrong();
      $('#feedback').textContent = cov < strict ? 'Trace the whole letter 描完整个字母 🙂' : 'Stay on the blue line 沿着蓝线写 🙂';
      if (S.taskMistakes >= 3) { const sk = el('<button class="btn small gray mt">Skip 跳过</button>'); sk.onclick = () => nextTask(0); $('#feedback').appendChild(sk); }
      user = []; setTimeout(base, 600);
    }
  };
  base(); setTimeout(demo, 400);
}
function densify(s, step) {
  if (s.length === 1) return [s[0]];
  const out = [];
  for (let i = 0; i < s.length - 1; i++) {
    const [x1, y1] = s[i], [x2, y2] = s[i + 1], d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d / step));
    for (let k = 0; k < n; k++) out.push([x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n]);
  }
  out.push(s[s.length - 1]); return out;
}

// -- Finish stage / boss
function finishStage() {
  const p = P();
  const stars = S.mistakes === 0 ? 3 : S.mistakes <= 2 ? 2 : 1;
  let bonus, gems = 0, xp;
  if (S.boss) {
    if (!p.bosses.includes(S.w.id)) p.bosses.push(S.w.id);
    bonus = 100 + stars * 30; gems = 3 + stars; xp = 80;
  } else {
    const prev = p.stars[S.L] || 0; p.stars[S.L] = Math.max(prev, stars);
    bonus = prev ? 10 + stars * 5 : 30 + stars * 10; xp = 30 + stars * 5;
    if (stars === 3 && prev < 3) gems = 1;
  }
  p.coins += bonus; p.stats.coinsEarned += bonus; p.gems += gems; addXP(p, xp); dailyBump(p, 'stages');
  save(); SFX.win(); confetti();
  const d = LETTER_MAP[S.L || S.w.letters[0]];
  $('#resultBox').innerHTML = `<div class="result">
    <h1>${S.boss ? '👾 Boss defeated! Boss 被打败了！' : `🎉 ${S.L} ${S.L.toLowerCase()} Complete! 通关！`}</h1>
    <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${i * .3}s">⭐</span>`).join('')}</div>
    ${avatarHTML(p.avatar, 'big dance')}
    <div class="reward-line">🪙 +${bonus} coins</div>
    ${gems ? `<div class="reward-line" style="color:#67e8f9">💎 +${gems} gems ${S.boss ? '· 🎁 Treasure chest opened! 宝箱打开了' : '· Perfect bonus 完美奖励'}</div>` : ''}
    <div class="reward-line" style="color:#a3e635">✨ +${xp} XP</div>
    <div class="sub">Mistakes 错误: ${S.mistakes}</div>
    <div class="row mt" style="justify-content:center">
      <button class="btn gray" id="resMap">🗺️ Map</button>
      ${!S.boss && stars < 3 ? '<button class="btn yellow" id="resRetry">🔁 Try for 3 ⭐</button>' : ''}
      <button class="btn green" id="resNext">Next ➜</button></div></div>`;
  void d;
  $('#resMap').onclick = renderMap;
  const rr = $('#resRetry'); if (rr) rr.onclick = () => startStage(S.L, S.w);
  $('#resNext').onclick = () => {
    if (S.boss) return renderMap();
    const idx = S.w.letters.indexOf(S.L);
    if (idx + 1 < S.w.letters.length) startStage(S.w.letters[idx + 1], S.w); else if (bossUnlocked(p, S.w)) startBoss(S.w); else renderMap();
  };
  checkBadges(p); refreshBar(); show('screen-result');
}

// ---------- Letter Rush mini game ----------
function startRush() {
  const p = P(); let score = 0, time = 30, cur = null, timer;
  show('screen-rush');
  const area = $('#rushArea');
  const round = () => {
    const done = Object.keys(p.stars); const poolL = done.length >= 4 ? done : LETTERS.map(x => x.L);
    const L = rnd(poolL), mode = rnd(['see', 'hear', 'lower']);
    const opts = shuffle([L, ...pick(poolL.filter(x => x !== L), Math.min(3, poolL.length - 1))]);
    cur = L;
    const dd = LETTER_MAP[L];
    area.innerHTML = `<div class="prompt">${mode === 'see' ? `Tap the letter for <span style="font-size:40px">${dd.emoji}</span> <small class="sub">${dd.cn}</small>` : mode === 'lower' ? `Tap small <span style="color:var(--yellow)">${L}</span>` : 'Tap what you hear 🔊'}</div><div class="choices"></div>`;
    if (mode === 'hear') Speech.letterName(L);
    const box = area.querySelector('.choices');
    opts.forEach(o => { const c = el(`<div class="choice">${mode === 'lower' ? o.toLowerCase() : mode === 'hear' ? o + o.toLowerCase() : o}</div>`);
      c.onclick = () => { if (o === cur) { score++; SFX.coin(); $('#rushScore').textContent = score; round(); } else { SFX.wrong(); c.classList.add('bad'); time = Math.max(0, time - 2); } }; box.appendChild(c); });
  };
  $('#rushTimer').textContent = time; $('#rushScore').textContent = 0;
  timer = setInterval(() => { time--; $('#rushTimer').textContent = time; if (time <= 0) { clearInterval(timer); end(); } }, 1000);
  $('#rushQuit').onclick = () => { clearInterval(timer); goHome(); };
  const end = () => {
    const coins = score * 3; p.coins += coins; p.stats.coinsEarned += coins; addXP(p, score * 2);
    const best = score > p.stats.rushBest; if (best) p.stats.rushBest = score;
    save(); SFX.win(); confetti(60);
    area.innerHTML = `<div class="result"><h1>⏱️ Time's up!</h1><div class="reward-line">Score ${score} ${best ? '🏆 New best!' : ''}</div><div class="reward-line">🪙 +${coins}</div>
      <div class="row mt" style="justify-content:center"><button class="btn gray" id="rHome">🏠 Home</button><button class="btn green" id="rAgain">🔁 Again</button></div></div>`;
    $('#rHome').onclick = goHome; $('#rAgain').onclick = startRush; checkBadges(p); refreshBar();
  };
  round();
}

// ---------- Shop ----------
function renderShop() {
  const p = P(); const box = $('#shopGrid'); box.innerHTML = '';
  $('#shopAvatar').innerHTML = avatarHTML(p.avatar, 'big');
  SHOP.forEach(it => {
    const owned = p.items.includes(it.id), worn = p.avatar[it.type] === it.id || (it.type === 'shirt' && p.avatar.shirt === it.color);
    const price = it.gems ? `${it.gems} 💎` : `${it.cost} 🪙`;
    const can = it.gems ? p.gems >= it.gems : p.coins >= it.cost;
    const d = el(`<div class="item ${owned ? 'owned' : ''} ${worn ? 'worn' : ''}">${it.emoji ? `<div class="ico">${it.emoji}</div>` : `<div class="swatch" style="background:${it.color}"></div>`}
      <div class="nm">${it.name}</div><div class="cn">${it.cn}</div>
      <button class="btn small ${owned ? (worn ? 'gray' : 'green') : can ? 'yellow' : 'gray'}" ${!owned && !can ? 'disabled' : ''}>${owned ? (worn ? 'Remove' : 'Wear 穿上') : price}</button></div>`);
    d.querySelector('button').onclick = e => {
      if (!owned) { if (it.gems) p.gems -= it.gems; else p.coins -= it.cost; p.items.push(it.id); SFX.win(); toast(`🛍️ Bought ${it.name}! 买到了`); confetti(40); }
      if (owned && worn) { if (it.type === 'shirt') p.avatar.shirt = '#4c8dff'; else p.avatar[it.type] = ''; }
      else { if (it.type === 'shirt') p.avatar.shirt = it.color; else p.avatar[it.type] = it.id; SFX.pop(); }
      checkBadges(p); save(); renderShop(); void e;
    };
    box.appendChild(d);
  });
  refreshBar(); show('screen-shop');
}

// ---------- Badges + leaderboard ----------
function renderBadges() {
  const p = P(); const box = $('#badgeGrid'); box.innerHTML = '';
  BADGES.forEach(b => box.appendChild(el(`<div class="badge ${p.badges.includes(b.id) ? '' : 'locked'}"><div class="ico">${b.emoji}</div><div class="nm">${b.name}</div><div class="cn">${b.cn}<br>${b.desc}</div></div>`)));
  const lb = $('#leaderboard'); lb.innerHTML = '';
  DB.players.slice().sort((a, b) => b.xp - a.xp).forEach((q, i) => lb.appendChild(el(`<div class="rowp"><span style="font-size:26px">${['🥇', '🥈', '🥉', '🏅'][i]}</span>${avatarHTML(q.avatar)}<div class="nm">${q.name}</div><div class="st">⭐ ${Object.values(q.stars).reduce((a, b) => a + b, 0)} · ${q.xp} XP · 🏆 ${q.badges.length}</div></div>`)));
  show('screen-badges');
}

// ---------- Alphabet chart (review all letters with both accents) ----------
function renderChart() {
  const box = $('#chartGrid'); box.innerHTML = '';
  LETTERS.forEach(d => { const c = el(`<div class="choice pic" style="height:120px"><div><b>${d.L}</b>${d.L.toLowerCase()} ${d.emoji}</div><span>${d.word}${d.ends ? ' (ends with x)' : ''}</span></div>`); c.onclick = () => Speech.letterIntro(d.L); box.appendChild(c); });
  show('screen-chart');
}

// ---------- Settings ----------
function setAccent(a) { DB.accent = a; save(); $$('.accent-toggle button').forEach(b => b.classList.toggle('on', b.dataset.acc === a)); }
function openParent() {
  const p = P();
  const d = el(`<div class="dialog-bg"><div class="dialog"><h2>👨‍👩‍👧‍👦 Parent · 家长</h2>
    <p class="sub">${p.name}：答对 ${p.stats.correct} 题 · 答错 ${p.stats.wrong} 题 · 描写 ${p.stats.traced} 次<br>连续学习 ${p.streak.count} 天 · 完成 ${Object.keys(p.stars).length}/26 个字母</p>
    <label class="row" style="justify-content:center"><input type="checkbox" id="sndChk" ${DB.sound ? 'checked' : ''}> 音效 Sound FX</label>
    <div class="row mt" style="justify-content:center">
      <button class="btn small yellow" id="giftBtn">🎁 奖励 50 金币</button>
      <button class="btn small red" id="delBtn">🗑️ 删除此玩家</button></div>
    <div class="mt"><button class="btn gray block" id="closeP">Close</button></div></div></div>`);
  document.body.appendChild(d);
  d.querySelector('#sndChk').onchange = e => { DB.sound = e.target.checked; save(); };
  d.querySelector('#giftBtn').onclick = () => { p.coins += 50; save(); refreshBar(); toast('🎁 家长奖励 +50 🪙'); };
  d.querySelector('#delBtn').onclick = () => { if (confirm(`确定删除 ${p.name} 的全部进度？`)) { DB.players = DB.players.filter(x => x.id !== p.id); DB.active = null; save(); d.remove(); renderPlayers(); } };
  d.querySelector('#closeP').onclick = () => d.remove();
}

// ---------- Wire up ----------
window.addEventListener('DOMContentLoaded', () => {
  $$('[data-go]').forEach(b => b.onclick = () => { SFX.click(); ({ home: goHome, map: renderMap, shop: renderShop, badges: renderBadges, chart: renderChart, players: renderPlayers, rush: startRush })[b.dataset.go](); });
  $$('.accent-toggle button').forEach(b => b.onclick = () => { setAccent(b.dataset.acc); Speech.say(b.dataset.acc === 'UK' ? 'Hello! British accent.' : 'Hello! American accent.', b.dataset.acc); });
  $('#parentBtn').onclick = openParent;
  $('#quitStage').onclick = () => { if (confirm('Quit this stage? 退出关卡？')) renderMap(); };
  document.body.addEventListener('pointerdown', () => { const c = SFX.get(); if (c && c.state === 'suspended') c.resume(); }, { once: true });
  if (DB.active && P()) goHome(); else renderPlayers();
});
