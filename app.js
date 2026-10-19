/* ============================================================
   Touchstone 2 — Final Version (Grammar Tab Added)
   ============================================================ */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const attr = s => String(s ?? '').replace(/"/g, '&quot;');

const THEMES = {
  auto:     { name:'خودکار', swatch:['#f4f6fb','#4f46e5','#0f1524'] },
  midnight: { name:'نیمه‌شب', swatch:['#1a2138','#f59e0b','#f1f5f9'] },
  graphite: { name:'گرافیت',  swatch:['#1c1c22','#06b6d4','#f4f4f5'] },
  forest:   { name:'جنگل',    swatch:['#16281f','#d4a017','#f0f5f1'] },
  wine:     { name:'شرابی',   swatch:['#2d1520','#e11d48','#fdf2f4'] },
  obsidian: { name:'اُبسیدیَن', swatch:['#121212','#dc2626','#fafafa'] },
  paper:    { name:'کاغذی',    swatch:['#fffcf5','#c2410c','#1e293b'] },
  nordic:   { name:'نوردیک',   swatch:['#ffffff','#0369a1','#0f172a'] },
  sepia:    { name:'سپیا',     swatch:['#faf3e3','#4d6a2a','#2c2416'] }
};

const state = {
  topics: [],
  lesson: null,
  grammarData: null, // Holds the separate grammar JSON
  tab: 'home',
  cards: (JSON.parse(localStorage.getItem('ts2_cards') || '[]') || []).map(c => ({
    t: c.t, fa: c.fa, ease: c.ease ?? 2.5, ivl: c.ivl ?? 0, reps: c.reps ?? 0, due: c.due ?? Date.now()
  }))
};
let review = null;
let pSession = null;
let qIndex = 0;
let qRevealed = false;
let qAnimDir = 'left';

/* ============================================================
   TIME & STREAK
   ============================================================ */
let timeLog = JSON.parse(localStorage.getItem('ts2_time_log') || '{}');
let completionsLog = JSON.parse(localStorage.getItem('ts2_completions') || '{}');
let lastActivity = Date.now();

function getTodayStr(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function trackActivity(){ lastActivity = Date.now(); }
['click', 'keydown', 'touchstart', 'scroll'].forEach(evt => document.addEventListener(evt, trackActivity, { passive: true }));

setInterval(() => {
  if (document.hidden) return;
  if (Date.now() - lastActivity < 60000) {
    const today = getTodayStr();
    timeLog[today] = (timeLog[today] || 0) + 15;
    localStorage.setItem('ts2_time_log', JSON.stringify(timeLog));
    if (state.tab === 'home') {
      const t = $('#dashTimeToday');
      if (t) t.textContent = formatTime(timeLog[today]);
    }
  }
}, 15000);

function trackCompletion(){
  const today = getTodayStr();
  completionsLog[today] = (completionsLog[today] || 0) + 1;
  localStorage.setItem('ts2_completions', JSON.stringify(completionsLog));
}
function formatTime(secs){
  if (!secs) return '0 دقیقه';
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m} دقیقه`;
  return `${Math.floor(m / 60)} ساعت و ${m % 60} دقیقه`;
}
function getStreak(){
  let streak = 0;
  let d = new Date();
  while (true) {
    const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if ((timeLog[str]||0) >= 600 && (completionsLog[str]||0) >= 1) { streak++; d.setDate(d.getDate() - 1); }
    else {
      if (streak === 0 && str === getTodayStr()) {
        d.setDate(d.getDate() - 1);
        const yStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if ((timeLog[yStr]||0) >= 600 && (completionsLog[yStr]||0) >= 1) { streak++; d.setDate(d.getDate() - 1); continue; }
      }
      break;
    }
  }
  return streak;
}

/* ============================================================
   THEME & MANIFEST
   ============================================================ */
function applyTheme(name){
  if (name === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem('ts2_theme', name);
  const t = THEMES[name];
  if (t){ const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', t.swatch[0]); }
  if (sheetMode === 'settings') openSettings();
}
function currentTheme(){ return localStorage.getItem('ts2_theme') || 'auto'; }

async function boot(){
  applyTheme(currentTheme());
  try {
    const r = await fetch('data/topics.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    state.topics = await r.json();
    renderTab(state.tab);
    if (state.topics.length) {
      const lastId = localStorage.getItem('ts2_last_lesson') || state.topics[0].id;
      await loadLesson(lastId, false);
    }
  } catch (e){
    $('#content').innerHTML = `<div class="placeholder"><span class="icon">⚠️</span>فایل topics.json لود نشد.<br><small>${esc(e.message)}</small></div>`;
  }
}

async function loadLesson(id, switchTab = true){
  const meta = state.topics.find(t => t.id === id);
  if (!meta) return;
  const r = await fetch(meta.file);
  state.lesson = await r.json();
  state.grammarData = null; // reset on lesson change
  localStorage.setItem('ts2_last_lesson', id);
  renderHeader();
  if (switchTab){ state.tab = 'speaking'; setActiveTab('speaking'); }
  renderTab(state.tab);
}

function renderHeader(){
  const L = state.lesson;
  if (!L) return;
  $('#hdEmoji').textContent = L.emoji || '📘';
  $('#hdTitle').textContent = L.title || '';
  $('#hdSub').textContent = `Unit ${L.unit} · Lesson ${L.lesson}`;
}

/* ============================================================
   ROUTING
   ============================================================ */
function setActiveTab(name){ $$('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name)); }
$$('#tabs button').forEach(b => {
  b.onclick = () => {
    state.tab = b.dataset.tab;
    if (state.tab !== 'cards') review = null;
    if (state.tab !== 'practice' && state.tab !== 'grammar') pSession = null;
    setActiveTab(state.tab); renderTab(state.tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});
function renderTab(name){
  const R = { home: renderHome, speaking: renderQuestions, grammar: renderGrammar, cards: renderCards, practice: renderPractice }[name];
  if (R) R();
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome(){
  if (!state.topics.length) return showPlaceholder('📘', 'هنوز درسی اضافه نشده.');
  const today = getTodayStr(), timeToday = formatTime(timeLog[today] || 0);
  const streak = getStreak(), due = dueCount(), L = state.lesson;

  let html = '';
  if (L) {
    html += `<button class="continue-card" data-continue="1">
      <span class="cc-label">ادامه یادگیری</span>
      <div class="cc-title">${esc(L.emoji)} ${esc(L.title)}</div>
      <span class="cc-btn">رفتن به سوالات ←</span>
    </button>`;
  }
  html += `<div class="dash-grid">
    <div class="dash-box"><div class="dash-icon">⏱</div><div class="dash-val" id="dashTimeToday">${timeToday}</div><div class="dash-lbl">مطالعه امروز</div></div>
    <div class="dash-box"><div class="dash-icon">🔥</div><div class="dash-val">${streak} روز</div><div class="dash-lbl">زنجیره</div></div>
    <div class="dash-box" style="cursor:pointer" data-go="cards"><div class="dash-icon">🎴</div><div class="dash-val">${due} کارت</div><div class="dash-lbl">مرور امروز</div></div>
  </div>
  <button class="btn btn-ghost btn-block" id="openStats" style="margin-bottom:22px">📊 مشاهده آمار کامل</button>
  <div class="home-section"><h2>درس‌ها</h2>`;

  state.topics.forEach(t => {
    const active = L?.id === t.id ? ' active' : '';
    html += `<button class="lesson-row${active}" data-lesson="${esc(t.id)}">
      <span class="lesson-emoji">${esc(t.emoji || '📘')}</span>
      <div class="lesson-body"><div class="lesson-title">${esc(t.title)}</div><div class="lesson-sub">Unit ${t.unit} · Lesson ${t.lesson}</div></div>
    </button>`;
  });
  html += `</div>`;
  $('#content').innerHTML = html;

  if ($('#openStats')) $('#openStats').onclick = openStats;
  const cBtn = $('[data-continue]');
  if (cBtn) cBtn.onclick = () => { state.tab = 'speaking'; setActiveTab('speaking'); renderTab('speaking'); };
  $$('[data-go]').forEach(el => { el.onclick = () => { state.tab = el.dataset.go; setActiveTab(el.dataset.go); renderTab(el.dataset.go); }; });
  $$('[data-lesson]').forEach(b => { b.onclick = () => loadLesson(b.dataset.lesson); });
}

function openStats(){
  const today = getTodayStr(), timeToday = formatTime(timeLog[today] || 0);
  let totalSecs = 0; Object.values(timeLog).forEach(v => totalSecs += v);
  let totalComps = 0; Object.values(completionsLog).forEach(v => totalComps += v);
  const streak = getStreak(), cardsMastered = state.cards.filter(c => (c.ivl || 0) >= 6).length;

  openSheet(`
    <div class="settings-title">📊 آمار شما</div><p class="settings-sub">فعالیت شما</p>
    <div style="padding:0 10px">
      <div class="stats-row"><span class="stats-lbl">زمان فعال امروز</span><span class="stats-val">${timeToday}</span></div>
      <div class="stats-row"><span class="stats-lbl">کل زمان مطالعه</span><span class="stats-val">${formatTime(totalSecs)}</span></div>
      <div class="stats-row"><span class="stats-lbl">فعالیت‌ها</span><span class="stats-val">${totalComps}</span></div>
      <div class="stats-row"><span class="stats-lbl">زنجیره فعلی</span><span class="stats-val">${streak} روز</span></div>
      <div class="stats-row"><span class="stats-lbl">کارت‌های تثبیت شده</span><span class="stats-val">${cardsMastered}</span></div>
    </div>
    <div class="sheet-actions"><button class="btn btn-primary" onclick="closeSheet()">بستن</button></div>
  `, 'stats');
}

/* ============================================================
   SPEAKING (was Questions)
   ============================================================ */
function renderQuestions(){
  if (!state.lesson) return showPlaceholder('💬', 'اول یک درس را انتخاب کن.');
  const qs = state.lesson.questions || [];
  if (!qs.length) return showPlaceholder('💬', 'این درس هنوز سؤالی ندارد.');

  qIndex = 0;
  qRevealed = false;
  qAnimDir = 'left';

  $('#content').innerHTML = `
    <div class="q-carousel">
      <div class="q-top-bar">
        <div class="q-counter" id="qCounter">1 / ${qs.length}</div>
        <button class="btn btn-ghost btn-sm" data-speak-q>🔊 پرسش</button>
      </div>
      <div class="q-prog-track"><i class="q-prog-fill" id="qProg" style="width: ${100/qs.length}%"></i></div>
      
      <div class="q-card-single" id="qCardContainer">
        <h2 class="q-single-title" id="qTitle"></h2>
        <div class="q-single-answer" id="qAnswer" hidden></div>
        <div style="margin-top:auto; padding-top:24px;">
          <button class="btn btn-primary btn-block" id="qRevealBtn">نمایش پاسخ</button>
        </div>
      </div>

      <div class="q-nav-bar">
        <button class="btn btn-ghost" id="qPrev">→ قبلی</button>
        <button class="btn btn-ghost" id="qNext">بعدی ←</button>
      </div>
    </div>`;

  drawSingleQ(false);

  const card = $('#qCardContainer');
  let startX = 0, startY = 0;
  card.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].screenX;
    startY = e.changedTouches[0].screenY;
  }, { passive: true });
  card.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - startX;
    const dy = e.changedTouches[0].screenY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 60) navQ(-1);
      if (dx < -60) navQ(1);
    }
  }, { passive: true });

  $('#qRevealBtn').onclick = () => {
    qRevealed = !qRevealed;
    if (qRevealed) trackCompletion();
    drawSingleQ(false, true);
  };
  $('#qPrev').onclick = () => navQ(-1);
  $('#qNext').onclick = () => navQ(1);
  $('[data-speak-q]').onclick = () => speak(qs[qIndex].q);
}

function navQ(dir) {
  const qs = state.lesson.questions;
  qIndex += dir;
  if (qIndex < 0) qIndex = 0;
  if (qIndex >= qs.length) qIndex = qs.length - 1;
  qRevealed = false;
  qAnimDir = dir > 0 ? 'left' : 'right';
  drawSingleQ(true);
}

function drawSingleQ(isNav = false, toggleAns = false) {
  const qs = state.lesson.questions;
  const q = qs[qIndex];
  
  $('#qCounter').textContent = `${qIndex + 1} / ${qs.length}`;
  $('#qProg').style.width = `${((qIndex + 1) / qs.length) * 100}%`;
  
  $('#qTitle').textContent = q.q;
  
  const ansEl = $('#qAnswer');
  if (qRevealed) {
    ansEl.innerHTML = parseAnswer(q.a);
    ansEl.hidden = false;
    $('#qRevealBtn').textContent = 'بستن پاسخ';
    $('#qRevealBtn').className = 'btn btn-ghost btn-block';
  } else {
    ansEl.innerHTML = '';
    ansEl.hidden = true;
    $('#qRevealBtn').textContent = 'نمایش پاسخ';
    $('#qRevealBtn').className = 'btn btn-primary btn-block';
  }

  $('#qPrev').disabled = (qIndex === 0);
  $('#qNext').disabled = (qIndex === qs.length - 1);
  
  const card = $('#qCardContainer');
  if (isNav) {
    card.classList.remove('slide-left', 'slide-right');
    void card.offsetWidth;
    card.classList.add(qAnimDir === 'left' ? 'slide-left' : 'slide-right');
  }
}

function showPlaceholder(icon, text){ $('#content').innerHTML = `<div class="placeholder"><span class="icon">${icon}</span>${text}</div>`; }

function parseAnswer(text){
  const tokens = [];
  const re = /\{\{([^}]+?)(?:::([^}]+?))?\}\}|\[\[([^\]|]+?)\|([^\]]+?)\]\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null){
    if (m.index > last) tokens.push({ type:'plain', text: text.slice(last, m.index) });
    if (m[0].startsWith('{{')) tokens.push({ type:'grammar', phrase: m[1], key: m[2] || '' });
    else tokens.push({ type:'chunk', eng: m[3], fa: m[4] });
    last = re.lastIndex;
  }
  if (last < text.length) tokens.push({ type:'plain', text: text.slice(last) });

  return tokens.map(t => {
    if (t.type === 'grammar') return `<span class="grammar" data-phrase="${attr(t.phrase)}" data-key="${attr(t.key)}">${esc(t.phrase)}</span>`;
    if (t.type === 'chunk') return `<span class="chunk" data-fa="${attr(t.fa)}">${esc(t.eng)}</span>`;
    return esc(t.text).replace(/([A-Za-z]+(?:['’][A-Za-z]+)?)/g, '<span class="w">$1</span>');
  }).join('');
}

document.addEventListener('click', e => {
  const g = e.target.closest('.grammar');
  if (g){ openGrammar(g.dataset.key, g.dataset.phrase); return; }
  const c = e.target.closest('.chunk');
  if (c){ openChunk(c.textContent.trim(), c.dataset.fa); return; }
  const w = e.target.closest('.w');
  if (w){ openWord(w.textContent.trim()); return; }
});

/* ============================================================
   GRAMMAR TAB
   ============================================================ */
async function renderGrammar() {
  if (!state.lesson) return showPlaceholder('📖', 'اول یک درس را انتخاب کن.');
  if (pSession && pSession.mode === 'grammar') return renderPracticeRunner();

  if (!state.grammarData) {
    if (!state.lesson.grammar_file) {
      return showPlaceholder('📖', 'برای این درس فایل گرامر تعریف نشده است.');
    }
    $('#content').innerHTML = `<div class="placeholder"><span class="icon">⏳</span>در حال بارگذاری گرامر...</div>`;
    
    try {
      const r = await fetch(state.lesson.grammar_file);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      state.grammarData = await r.json();
    } catch (e) {
      return showPlaceholder('⚠️', 'خطا در بارگذاری فایل گرامر.<br><small>' + esc(e.message) + '</small>');
    }
  }

  const G = state.grammarData;
  
  // Render the explanation and the "Start Test" button
  let html = `<div class="grammar-explain">
    <h2 class="ge-title">${esc(G.title)}</h2>
    ${G.explanation.map(ex => `
      <div class="ge-section">
        <div class="ge-heading">${esc(ex.heading)}</div>
        <div class="ge-text">${ex.text}</div>
      </div>
    `).join('')}
  </div>
  <button class="btn btn-primary btn-block" id="startGrammarTest" style="padding:16px; font-size:14px">
    📝 شروع آزمون گرامر (${G.test.length} سوال)
  </button>`;

  $('#content').innerHTML = html;

  $('#startGrammarTest').onclick = () => {
    pSession = {
      mode: 'grammar', // special mode to route back here
      index: 0, score: 0, answered: false,
      items: G.test.map(x => ({
        ...x, 
        _options: x.k === 'tap' ? shuffle([...x.o]) : null, 
        _bank: x.k === 'drag' ? shuffle([...x.w]) : null, 
        _drop: []
      }))
    };
    renderPracticeRunner();
  };
}

/* ============================================================
   PRACTICE (Exercise Tab)
   ============================================================ */
function renderPractice(){
  if (!state.lesson) return showPlaceholder('⚡', 'اول یک درس را انتخاب کن.');
  if (pSession) return renderPracticeRunner();

  $('#content').innerHTML = `
    <div class="hint" style="background:var(--brand-soft);color:var(--brand-dark);padding:12px;border-radius:12px;font-size:12.5px;margin-bottom:16px;font-weight:700">یک تمرین را انتخاب کن:</div>
    <div class="p-grid">
      <div class="p-card" data-mode="words"><span class="icon">📚</span><div class="name">لغات (کلمات)</div><div class="sub">${(state.lesson.practice||[]).length} سوال</div></div>
      <div class="p-card" data-mode="match"><span class="icon">🔗</span><div class="name">تطبیق لغات</div><div class="sub">بازی حافظه</div></div>
      <div class="p-card" data-mode="listen"><span class="icon">🎧</span><div class="name">گوش کن</div><div class="sub">تمرین شنیداری</div></div>
    </div>`;

  $$('[data-mode]').forEach(c => {
    c.onclick = () => {
      pSession = { mode: c.dataset.mode, index: 0, score: 0, answered: false, items: [] };
      if (pSession.mode === 'words') startWordsPractice();
      else if (pSession.mode === 'match') startMatchPractice();
      else if (pSession.mode === 'listen') startListenPractice();
      renderPracticeRunner();
    };
  });
}

function shuffle(arr){
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function startWordsPractice(){
  pSession.items = (state.lesson.practice || []).map(x => ({ ...x, _options: x.k === 'tap' ? shuffle([...x.o]) : null, _bank: x.k === 'drag' ? shuffle([...x.w]) : null, _drop: [] }));
}
function startMatchPractice(){
  const vocab = state.lesson.words ? Object.entries(state.lesson.words).map(([k,v]) => ({t: k, fa: v})) : [];
  if(vocab.length === 0) return showPlaceholder('⚠️', 'کلمه‌ای برای تطبیق وجود ندارد.');
  const items = shuffle(vocab).slice(0, 5);
  pSession.matchPairs = items.length; pSession.matched = 0;
  pSession.left = items.map(v => ({ text: v.t, id: v.t }));
  pSession.right = shuffle(items.map(v => ({ text: v.fa, id: v.t })));
  pSession.selLeft = null; pSession.selRight = null;
}
function startListenPractice(){
  const vocab = state.lesson.words ? Object.entries(state.lesson.words).map(([k,v]) => ({t: k, fa: v})) : [];
  if(vocab.length === 0) return showPlaceholder('⚠️', 'کلمه‌ای برای تمرین وجود ندارد.');
  const items = shuffle(vocab).slice(0, 5);
  pSession.items = items.map(v => {
    const wrongs = shuffle(vocab.filter(x => x.t !== v.t)).slice(0, 3).map(x => x.t);
    return { answer: v.t, options: shuffle([v.t, ...wrongs]) };
  });
}

function renderPracticeRunner(){
  if (pSession.mode === 'match') return renderMatchUI();
  const s = pSession;
  if (s.index >= s.items.length) return renderPracticeSummary();
  
  const item = s.items[s.index];
  const pct = Math.round(s.index / s.items.length * 100);
  const title = s.mode === 'words' ? 'لغات' : s.mode === 'grammar' ? 'آزمون گرامر' : 'گوش کن';

  let body = '';
  if (s.mode === 'listen') {
    body = `<div style="text-align:center;margin-bottom:20px"><button class="btn btn-primary" id="playSound" style="padding:16px 30px;border-radius:50%;font-size:24px">🔊</button></div>
      <div class="p-options">${item.options.map(o => {
        let cls = 'p-opt'; if (s.answered) { if (o === item.answer) cls += ' correct'; else if (o === s.selected) cls += ' wrong'; }
        return `<button class="${cls}" data-opt="${attr(o)}" ${s.answered ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>`;
  } else if (item.k === 'tap') {
    body = `<div class="p-options">${item._options.map(o => {
      let cls = 'p-opt'; if (s.answered){ if (o === item.a) cls += ' correct'; else if (o === s.selected) cls += ' wrong'; }
      return `<button class="${cls}" data-opt="${attr(o)}" ${s.answered ? 'disabled' : ''}>${esc(o)}</button>`;
    }).join('')}</div>`;
  } else if (item.k === 'type') {
    body = `<input class="p-input" id="pInput" type="text" value="${s.answered ? attr(s.userAnswer) : ''}" placeholder="Type your answer..." autocomplete="off" spellcheck="false" ${s.answered ? 'disabled' : ''}>`;
  } else if (item.k === 'drag') {
    body = `<div class="p-drop${s.answered ? (s.correct ? ' correct' : ' wrong') : ''}" id="pDrop">${item._drop.map((w, i) => `<button class="p-word in-drop" data-drop-idx="${i}" ${s.answered ? 'disabled' : ''}>${esc(w)}</button>`).join('')}</div>
      <div class="p-bank" id="pBank">${item._bank.map((w, i) => item._drop.includes(w) ? `<span class="p-word" style="visibility:hidden">${esc(w)}</span>` : `<button class="p-word" data-bank-idx="${i}" ${s.answered ? 'disabled' : ''}>${esc(w)}</button>`).join('')}</div>`;
  }

  let feedback = '';
  if (s.answered){
    const correctAns = s.mode === 'listen' ? item.answer : item.a;
    feedback = `<div class="p-feedback ${s.correct ? 'ok' : 'no'}">${s.correct ? '✓ درست!' : '✗ جواب درست: ' + esc(correctAns)}${item.fb ? `<div style="margin-top:4px;font-size:12px;opacity:.9">${esc(item.fb)}</div>` : ''}</div>`;
  }

  $('#content').innerHTML = `
    <div class="p-runner">
      <div class="p-top"><div class="p-counter">${title} · ${s.index + 1} از ${s.items.length}</div><button class="p-exit" id="pExit">✕</button></div>
      <div class="p-progress"><i style="width:${pct}%"></i></div>
      ${s.mode !== 'listen' ? `<div class="p-q">${formatQ(item)}</div>` : `<div style="height:10px"></div>`}
      ${body}${feedback}
      <div class="p-actions">${s.answered ? `<button class="btn btn-primary btn-block" id="pNext">${s.index + 1 >= s.items.length ? 'پایان' : 'سوال بعدی'}</button>` : `<button class="btn btn-primary btn-block" id="pCheck" disabled>بررسی</button>`}</div>
    </div>`;

  if (s.mode === 'listen' && !s.answered) { setTimeout(() => speak(item.answer), 300); $('#playSound').onclick = () => speak(item.answer); }
  if (s.answered){ $('#pNext').onclick = () => { s.index++; s.answered = false; s.selected = null; s.userAnswer = ''; renderPracticeRunner(); }; }
  else { bindPracticeInputs(item); }
  
  // Route exit button based on context
  $('#pExit').onclick = () => { 
    pSession = null; 
    if (s.mode === 'grammar') renderGrammar(); else renderPractice(); 
  };
}
function formatQ(item){ return esc(item.q).replace(/____/g, '<span class="blank">____</span>'); }

function bindPracticeInputs(item){
  const s = pSession;
  if (s.mode === 'listen' || item.k === 'tap'){
    $$('[data-opt]').forEach(b => { b.onclick = () => { s.selected = b.dataset.opt; $$('[data-opt]').forEach(x => x.classList.toggle('selected', x === b)); $('#pCheck').disabled = false; }; });
  } else if (item.k === 'type'){
    const inp = $('#pInput');
    inp.oninput = () => { $('#pCheck').disabled = !inp.value.trim(); };
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) checkPractice(); };
  } else if (item.k === 'drag'){
    $$('[data-bank-idx]').forEach(b => { b.onclick = () => { const w = item._bank[+b.dataset.bankIdx]; if (!item._drop.includes(w)){ item._drop.push(w); renderPracticeRunner(); } }; });
    $$('[data-drop-idx]').forEach(b => { b.onclick = () => { item._drop.splice(+b.dataset.dropIdx, 1); renderPracticeRunner(); }; });
    $('#pCheck').disabled = item._drop.length === 0;
  }
  $('#pCheck').onclick = checkPractice;
}

function checkPractice(){
  const s = pSession, item = s.items[s.index];
  let ok = false, correctAnswer = '';
  if (s.mode === 'listen') { correctAnswer = item.answer; ok = s.selected === item.answer; }
  else if (item.k === 'tap') { correctAnswer = item.a; ok = s.selected === item.a; }
  else if (item.k === 'type') { correctAnswer = item.a; const inp = $('#pInput'); s.userAnswer = inp.value.trim(); ok = s.userAnswer.toLowerCase() === correctAnswer.toLowerCase(); }
  else if (item.k === 'drag') { correctAnswer = item.a; s.userAnswer = item._drop.join(' '); ok = s.userAnswer.replace(/\s+/g, ' ').trim().toLowerCase() === correctAnswer.replace(/\s+/g, ' ').trim().toLowerCase(); }

  s.answered = true; s.correct = ok;
  if (ok) { s.score++; speak(correctAnswer); trackCompletion(); }
  renderPracticeRunner();
}

function renderMatchUI() {
  const s = pSession;
  if (s.matched === s.matchPairs) return renderPracticeSummary();
  const pct = Math.round(s.matched / s.matchPairs * 100);
  const leftHtml = s.left.map(x => `<div class="match-item ltr${x.done ? ' done' : (s.selLeft && s.selLeft.id === x.id ? ' sel' : '')}" data-side="l" data-id="${esc(x.id)}">${esc(x.text)}</div>`).join('');
  const rightHtml = s.right.map(x => `<div class="match-item rtl${x.done ? ' done' : (s.selRight && s.selRight.id === x.id ? ' sel' : '')}" data-side="r" data-id="${esc(x.id)}">${esc(x.text)}</div>`).join('');

  $('#content').innerHTML = `
    <div class="p-runner">
      <div class="p-top"><div class="p-counter">تطبیق لغات</div><button class="p-exit" id="pExit">✕</button></div>
      <div class="p-progress"><i style="width:${pct}%"></i></div>
      <div class="match-grid">
        <div style="display:flex;flex-direction:column;gap:10px">${leftHtml}</div>
        <div style="display:flex;flex-direction:column;gap:10px">${rightHtml}</div>
      </div>
      <div id="matchFb" style="text-align:center;font-size:13px;color:var(--text-soft)">یک کلمه و معنی آن را انتخاب کنید</div>
    </div>`;

  $('#pExit').onclick = () => { pSession = null; renderPractice(); };
  $$('.match-item').forEach(el => {
    el.onclick = () => {
      if (el.classList.contains('done')) return;
      const side = el.dataset.side, id = el.dataset.id;
      if (side === 'l') s.selLeft = { id }; else s.selRight = { id };
      if (s.selLeft && s.selRight) {
        if (s.selLeft.id === s.selRight.id) {
          s.left.find(x => x.id === s.selLeft.id).done = true; s.right.find(x => x.id === s.selRight.id).done = true;
          s.matched++; s.selLeft = null; s.selRight = null; speak(id); trackCompletion();
          setTimeout(() => renderPracticeRunner(), 400);
        } else {
          $('#matchFb').textContent = 'اشتباه بود!'; $('#matchFb').style.color = 'var(--danger)';
          const selectedEls = $$('.match-item.sel'); selectedEls.forEach(x => x.classList.add('wrong'));
          setTimeout(() => { selectedEls.forEach(x => x.classList.remove('wrong', 'sel')); s.selLeft = null; s.selRight = null; $('#matchFb').textContent = 'یک کلمه و معنی آن را انتخاب کنید'; $('#matchFb').style.color = 'var(--text-soft)'; }, 600);
        }
      } else { renderPracticeRunner(); }
    };
  });
}

function renderPracticeSummary(){
  const s = pSession;
  let total = s.mode === 'match' ? s.matchPairs : s.items.length;
  let score = s.mode === 'match' ? s.matched : s.score;
  const pct = total === 0 ? 0 : Math.round(score / total * 100);
  const msg = pct === 100 ? 'عالی بود! 🎉' : pct >= 70 ? 'خیلی خوب بود! 👏' : 'ادامه بده، بهتر می‌شی. 💪';

  $('#content').innerHTML = `
    <div class="p-summary">
      <div style="font-size:44px;margin-bottom:8px">${pct >= 70 ? '🏆' : '📘'}</div>
      <div class="big">${score} / ${total}</div>
      <div style="font-size:14px;color:var(--text-soft);margin-bottom:6px">${pct}%</div>
      <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:22px">${msg}</div>
      <button class="btn btn-primary btn-block" id="pBack" style="margin-bottom:10px">دوباره</button>
      <button class="btn btn-ghost btn-block" id="pExit2">بازگشت</button>
    </div>`;
  
  $('#pBack').onclick = () => {
    pSession.index = 0; pSession.score = 0; pSession.answered = false;
    if (s.mode === 'match') startMatchPractice(); else if (s.mode === 'listen') startListenPractice(); else if (s.mode === 'words') startWordsPractice(); 
    renderPracticeRunner();
  };
  
  $('#pExit2').onclick = () => { 
    pSession = null; 
    if (s.mode === 'grammar') renderGrammar(); else renderPractice(); 
  };
}

/* ============================================================
   FLASHCARDS
   ============================================================ */
function dueCount(){ return state.cards.filter(c => (c.due || 0) <= Date.now()).length; }

function renderCards(){
  if (review) return renderReview();
  if (!state.cards.length) return showPlaceholder('🎴', 'هنوز فلش‌کارتی نساختی.<br>روی کلمه‌ها یا عبارت‌های پاسخ‌ها بزن و ذخیره کن.');
  
  const due = dueCount();
  let html = `<div class="cards-head">
    <div><div class="cards-count">${state.cards.length} کارت</div><div class="cards-due">${due > 0 ? `${due} کارت برای مرور امروز` : 'همه‌چیز مرور شده ✓'}</div></div>
    ${due > 0 ? `<button class="btn btn-primary" id="startReview">شروع مرور</button>` : ''}
  </div>`;
  state.cards.slice().reverse().forEach(c => {
    html += `<div class="card-item">
      <div class="card-body" data-speak="${esc(c.t)}"><div class="card-en">${esc(c.t)}</div><div class="card-fa">${esc(c.fa)}</div></div>
      <button class="card-del" data-del="${esc(c.t)}" aria-label="حذف">✕</button>
    </div>`;
  });
  html += `<button class="btn btn-ghost btn-block" id="clearCards" style="margin-top:14px">🗑️ پاک کردن همه</button>`;
  $('#content').innerHTML = html;

  if (due > 0) $('#startReview').onclick = startReview;
  $('#clearCards').onclick = () => { if (confirm('همه‌ی کارت‌ها پاک شوند؟')){ state.cards = []; saveCards(); renderCards(); } };
  $$('[data-del]').forEach(b => { b.onclick = () => { state.cards = state.cards.filter(c => c.t !== b.dataset.del); saveCards(); renderCards(); }; });
  $$('[data-speak]').forEach(b => { b.onclick = () => speak(b.dataset.speak); });
}

function startReview(){
  const queue = state.cards.filter(c => (c.due || 0) <= Date.now()).sort((a, b) => (a.due || 0) - (b.due || 0));
  review = { queue: [...queue], total: queue.length, done: 0, shown: false };
  renderReview();
}

function renderReview(){
  if (!review.queue.length){
    $('#content').innerHTML = `<div class="empty"><span class="icon">🎉</span><div style="font-size:17px;font-weight:800;color:var(--text);margin-bottom:6px">تمام شد!</div>${review.done} کارت مرور شد.<button class="btn btn-primary btn-block" id="reviewDone" style="margin-top:18px">بازگشت</button></div>`;
    $('#reviewDone').onclick = () => { review = null; renderCards(); };
    return;
  }
  const card = review.queue[0], pct = review.total ? Math.round(review.done / review.total * 100) : 0;
  $('#content').innerHTML = `
    <div class="review-progress"><i style="width:${pct}%"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:12px;color:var(--text-soft);font-weight:700">
      <span>${review.done} از ${review.total}</span><button class="btn btn-ghost btn-sm" id="exitReview">✕ خروج</button>
    </div>
    <div class="review-card" id="reviewCard" role="button" tabindex="0">
      ${review.shown ? `<div class="review-back-en">${esc(card.t)}</div><div class="review-back-fa">${esc(card.fa)}</div>` : `<div class="review-front">${esc(card.t)}</div><div class="review-hint">برای دیدن معنی، لمس کن</div>`}
    </div>
    ${review.shown ? `<div class="rating-buttons">
      <button class="rating-btn again" data-rate="0"><span class="rt">😞</span>دوباره</button>
      <button class="rating-btn hard"  data-rate="3"><span class="rt">😐</span>سخت</button>
      <button class="rating-btn good"  data-rate="4"><span class="rt">🙂</span>خوب</button>
      <button class="rating-btn easy"  data-rate="5"><span class="rt">😎</span>راحت</button>
    </div>` : ''}`;

  $('#exitReview').onclick = () => { review = null; renderCards(); };
  const cardEl = $('#reviewCard');
  cardEl.onclick = () => { if (!review.shown){ review.shown = true; speak(card.t); renderReview(); } };
  cardEl.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if (!review.shown){ review.shown = true; speak(card.t); renderReview(); } } };
  $$('[data-rate]').forEach(b => { b.onclick = () => rateCard(+b.dataset.rate); });
}

function rateCard(quality){
  const c = review.queue.shift();
  Object.assign(c, sm2(c, quality));
  saveCards(); review.done++; review.shown = false; trackCompletion(); renderReview();
}

function sm2(c, q){
  let ease = c.ease ?? 2.5, ivl = c.ivl ?? 0, reps = c.reps ?? 0;
  if (q < 3){ reps = 0; ivl = 1; } else { ivl = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(ivl * ease); reps++; }
  ease = Math.max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return { ease, ivl, reps, due: Date.now() + ivl * 86400000 };
}
function saveCards(){ localStorage.setItem('ts2_cards', JSON.stringify(state.cards)); }
function addCard(t, fa){
  if (state.cards.some(c => c.t.toLowerCase() === t.toLowerCase())){ toast('قبلاً اضافه شده ✓'); return; }
  state.cards.push({ t, fa, ease: 2.5, ivl: 0, reps: 0, due: Date.now() });
  saveCards(); trackCompletion(); toast('ذخیره شد ✓');
}

/* ============================================================
   SHEET & API
   ============================================================ */
let sheetMode = null;
function openSheet(html, mode){ $('#sheetBody').innerHTML = html; $('#sheet').classList.add('show'); $('#backdrop').classList.add('show'); sheetMode = mode || 'generic'; }
function closeSheet(){ $('#sheet').classList.remove('show'); $('#backdrop').classList.remove('show'); sheetMode = null; }
$('#backdrop').onclick = closeSheet; $('#sheetClose').onclick = closeSheet;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

function openChunk(eng, fa){
  const inCards = state.cards.some(c => c.t.toLowerCase() === eng.toLowerCase());
  openSheet(`
    <div class="sheet-head"><div class="sheet-word">${esc(eng)}</div></div>
    <div class="sheet-meaning">${esc(fa)}</div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" id="shSpeak">🔊 شنیدن</button>
      <button class="btn ${inCards ? 'btn-ghost' : 'btn-primary'}" id="shAdd" ${inCards ? 'disabled' : ''}>${inCards ? '✓ ذخیره شده' : '＋ ذخیره'}</button>
    </div>`, 'chunk');
  $('#shSpeak').onclick = () => speak(eng);
  if (!inCards) $('#shAdd').onclick = () => { addCard(eng, fa); closeSheet(); };
}

async function openWord(raw){
  const L = state.lesson; if (!L) return;
  const key = raw.toLowerCase();
  let meaning = (L.words || {})[key];
  if (!meaning) { const cache = JSON.parse(localStorage.getItem('ts2_auto_dict') || '{}'); meaning = cache[key]; }

  const inCards = state.cards.some(c => c.t.toLowerCase() === key);
  openSheet(`
    <div class="sheet-head"><div class="sheet-word">${esc(raw)}</div></div>
    <div class="sheet-meaning" id="shMeaning">${meaning ? esc(meaning) : '<span style="color:var(--text-soft);font-size:13px">در حال دریافت از اینترنت...</span>'}</div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" id="shSpeak">🔊 شنیدن</button>
      <button class="btn ${inCards ? 'btn-ghost' : 'btn-primary'}" id="shAdd" ${inCards || !meaning ? 'disabled' : ''}>${inCards ? '✓ ذخیره شده' : '＋ ذخیره'}</button>
    </div>`, 'word');
  $('#shSpeak').onclick = () => speak(raw);

  if (!meaning) {
    meaning = await fetchTranslation(key);
    if (meaning) {
      $('#shMeaning').textContent = meaning; const addBtn = $('#shAdd');
      addBtn.disabled = false; addBtn.textContent = '＋ ذخیره';
      addBtn.onclick = () => { addCard(raw, meaning); closeSheet(); };
    } else { $('#shMeaning').innerHTML = '<span style="color:var(--danger);font-size:13px">معنی ثبت نشده.</span>'; }
  } else { if (!inCards) $('#shAdd').onclick = () => { addCard(raw, meaning); closeSheet(); }; }
}

async function fetchTranslation(word) {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|fa`);
    const data = await res.json();
    let translation = data.responseData?.translatedText;
    if (translation && !translation.includes("INVALID") && translation.toLowerCase() !== word.toLowerCase()) {
      const cache = JSON.parse(localStorage.getItem('ts2_auto_dict') || '{}');
      cache[word] = translation; localStorage.setItem('ts2_auto_dict', JSON.stringify(cache));
      return translation;
    }
  } catch (e) {}
  return null;
}

function openGrammar(key, phrase){
  // Simple fallback for tapping grammar in the speaking tab
  openSheet(`
    <div class="sheet-head"><div class="sheet-label">الگوی گرامری</div><div class="sheet-word">${esc(phrase)}</div></div>
    <div class="sheet-def" style="margin-top:10px">این یک الگوی گرامری است. برای توضیح کامل به تب گرامر (📖) بروید.</div>
    <div class="sheet-actions"><button class="btn btn-ghost" id="shSpeak">🔊 شنیدن</button></div>
  `, 'grammar'); 
  $('#shSpeak').onclick = () => speak(phrase);
}

/* ============================================================
   SETTINGS & TOAST
   ============================================================ */
$('#gear').onclick = openSettings;
function openSettings(){
  let html = `<div class="settings-title">ظاهر برنامه</div><p class="settings-sub">یک تم انتخاب کن</p><div class="theme-grid">`;
  Object.entries(THEMES).forEach(([key, t]) => {
    const active = key === currentTheme() ? ' active' : '';
    html += `<button class="theme-opt${active}" data-theme-pick="${key}"><span class="swatch"><i style="background:${t.swatch[0]}"></i><i style="background:${t.swatch[1]}"></i><i style="background:${t.swatch[2]}"></i></span><span class="theme-name">${esc(t.name)}</span></button>`;
  });
  html += `</div>`; openSheet(html, 'settings');
  $$('[data-theme-pick]').forEach(b => { b.onclick = () => applyTheme(b.dataset.themePick); });
}

let voice = null;
function pickVoice(){ const vs = speechSynthesis.getVoices(); voice = vs.find(v => /en-US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; }
if ('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text){
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.92; if (voice) u.voice = voice; speechSynthesis.speak(u); } catch(e){}
}

let toastTimer = null;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1600); }

boot();