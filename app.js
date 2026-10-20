/* ============================================================
   Touchstone 2 — Final Version (Grammar Tab Added)
   ============================================================ */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const attr = s => String(s ?? '').replace(/"/g, '&quot;');

/* Minimal stroke icons used inside rendered screens */
const svg = (d, w = 18) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  clock:  svg('<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.8"/>'),
  flame:  svg('<path d="M12 3s5 4.2 5 8.6a5 5 0 0 1-10 0C7 8.6 12 3 12 3Z"/><path d="M12 20.4a2.6 2.6 0 0 0 2.6-2.6c0-1.6-2.6-4-2.6-4s-2.6 2.4-2.6 4A2.6 2.6 0 0 0 12 20.4Z"/>'),
  cards:  svg('<rect x="3.4" y="7.6" width="12" height="12.6" rx="2.4"/><path d="M7.4 4.8h9.2a3 3 0 0 1 3 3v8.2"/>'),
  chart:  svg('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15.5V11"/><path d="M12.5 15.5V7.5"/><path d="M17 15.5v-3"/>', 16),
  arrow:  svg('<path d="M15 6l-6 6 6 6"/>', 16),
  play:   svg('<path d="M9 6.5v11l9-5.5-9-5.5Z"/>', 16),
  refresh: svg('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>', 16),
  book:   svg('<path d="M12 6.5C10.6 5 8.6 4.4 6 4.4c-1 0-1.9.1-2.5.3v13.6c.6-.2 1.5-.3 2.5-.3 2.6 0 4.6.6 6 2.1"/><path d="M12 6.5c1.4-1.5 3.4-2.1 6-2.1 1 0 1.9.1 2.5.3v13.6c-.6-.2-1.5-.3-2.5-.3-2.6 0-4.6.6-6 2.1"/><path d="M12 6.5v13.6"/>', 22),
  links:  svg('<path d="M10 13.6a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.2 1.2"/><path d="M14 10.4a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.2-1.2"/>', 22),
  audio:  svg('<path d="M4 14.5v-5a1.5 1.5 0 0 1 1.5-1.5h2.2L12 4.4v15.2L7.7 16H5.5A1.5 1.5 0 0 1 4 14.5Z"/><path d="M16 8.6a4.6 4.6 0 0 1 0 6.8"/><path d="M18.6 6a8 8 0 0 1 0 12"/>', 22),
  close:  svg('<path d="M6.5 6.5l11 11"/><path d="M17.5 6.5l-11 11"/>', 17),
  alert:  svg('<path d="M12 4.5 21 19.5H3L12 4.5Z"/><path d="M12 10v4.2"/><path d="M12 17h.01"/>', 34)
};

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
  gCards: null,      // Flattened grammar carousel cards
  gIndex: 0,
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
    setActiveTab(state.tab);
    requestAnimationFrame(moveTabPill);
  } catch (e){
    showErrorState('فهرست درس‌ها لود نشد', `دسترسی به فایل topics.json ممکن نشد (${e.message}). اتصال اینترنت را بررسی کنید.`, 'تلاش دوباره', () => boot());
  }
}

async function loadLesson(id, switchTab = true){
  const meta = state.topics.find(t => t.id === id);
  if (!meta) return showErrorState('درس پیدا نشد', 'این درس در فهرست درس‌ها وجود ندارد.', 'بازگشت به خانه', () => switchTabTo('home'));
  try {
    const r = await fetch(meta.file);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (!data || !Array.isArray(data.questions)) throw new Error('ساختار فایل درس معتبر نیست');
    state.lesson = data;
    state.grammarData = null; // reset on lesson change
    state.gCards = null;
    state.gIndex = 0;
    localStorage.setItem('ts2_last_lesson', id);
    renderHeader();
    if (switchTab) switchTabTo('speaking');
    else renderTab(state.tab);
  } catch (e){
    state.lesson = null;
    state.grammarData = null;
    state.gCards = null;
    showErrorState('درس بارگذاری نشد', `فایل «${meta.title}» در دسترس نیست یا خراب است.`, 'تلاش دوباره', () => loadLesson(id, switchTab));
  }
}

function renderHeader(){
  const L = state.lesson;
  $('#hdEmoji').textContent = L?.emoji || '📘';
  const title = $('#hdTitle'), sub = $('#hdSub');
  title.textContent = L?.title || 'درس‌ها';
  title.setAttribute('dir', 'ltr');
  sub.textContent = L ? `درس ${L.unit} · ${L.lesson}` : 'درس را انتخاب کنید';
  sub.setAttribute('dir', 'rtl');
}

/* ============================================================
   ROUTING
   ============================================================ */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function haptic(ms = 8){ try { if (!reduceMotion && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

function moveTabPill(){
  const pill = $('#tabPill'), active = $('#tabs .tab.is-active');
  if (!pill || !active) return;
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
}

function setActiveTab(name){
  $$('#tabs .tab').forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  moveTabPill();
}
window.addEventListener('resize', () => requestAnimationFrame(moveTabPill));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveTabPill());
function switchTabTo(name, opts = {}){
  if (!name) return;
  state.tab = name;
  if (name !== 'cards') review = null;
  cancelAdvance();
  if (name !== 'practice' && name !== 'grammar') pSession = null;
  setActiveTab(name);
  renderTab(name);
  if (opts.scroll !== false) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}
$$('#tabs .tab').forEach(b => {
  b.onclick = () => switchTabTo(b.dataset.tab);
});
function renderTab(name){
  const R = { home: renderHome, speaking: renderQuestions, grammar: renderGrammar, cards: renderCards, practice: renderPractice }[name];
  if (R) R();
}

/* Friendly, non-crashing error screen with a retry action */
function showErrorState(title, hint, actionLabel, onAction){
  $('#content').innerHTML = `<div class="error-state screen">
    <div class="error-icon">${ICONS.alert}</div>
    <div class="error-title">${esc(title)}</div>
    <div class="error-hint">${esc(hint)}</div>
    <button class="btn btn-primary btn-block" id="errRetry">${esc(actionLabel)}</button>
  </div>`;
  const btn = $('#errRetry');
  if (btn && onAction) btn.onclick = () => { haptic(5); onAction(); };
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome(){
  if (!state.topics.length) return showPlaceholder('📘', 'هنوز درسی اضافه نشده.');
  const today = getTodayStr(), timeToday = formatTime(timeLog[today] || 0);
  const streak = getStreak(), due = dueCount(), L = state.lesson;

  let html = '<div class="screen">';
  if (L) {
    html += `<button class="continue-card" data-continue="1">
      <span class="cc-label">ادامه یادگیری</span>
      <div class="cc-title">${esc(L.emoji)} ${esc(L.title)}</div>
      <span class="cc-btn">ادامه بده ${ICONS.arrow}</span>
    </button>`;
  }
  html += `<div class="dash-grid">
    <div class="dash-box"><div class="dash-icon">${ICONS.clock}</div><div class="dash-val" id="dashTimeToday">${timeToday}</div><div class="dash-lbl">مطالعه امروز</div></div>
    <div class="dash-box"><div class="dash-icon">${ICONS.flame}</div><div class="dash-val">${streak} روز</div><div class="dash-lbl">زنجیره</div></div>
    <div class="dash-box" data-go="cards"><div class="dash-icon">${ICONS.cards}</div><div class="dash-val">${due} کارت</div><div class="dash-lbl">مرور امروز</div></div>
  </div>
  <button class="btn btn-ghost btn-block" id="openStats">${ICONS.chart} مشاهده آمار کامل</button>
  <div class="home-section"><h2>درس‌ها</h2>`;

  state.topics.forEach(t => {
    const active = L?.id === t.id ? ' active' : '';
    html += `<button class="lesson-row${active}" data-lesson="${esc(t.id)}">
      <span class="lesson-emoji">${esc(t.emoji || '📘')}</span>
      <div class="lesson-body"><div class="lesson-title" dir="ltr">${esc(t.title)}</div><div class="lesson-sub" dir="rtl">درس ${t.unit} · ${t.lesson}</div></div>
    </button>`;
  });
  html += `</div></div>`;
  $('#content').innerHTML = html;
  haptic(4);

  if ($('#openStats')) $('#openStats').onclick = openStats;
  const cBtn = $('[data-continue]');
  if (cBtn) cBtn.onclick = () => switchTabTo('speaking');
  $$('[data-go]').forEach(el => { el.onclick = () => switchTabTo(el.dataset.go); });
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
    <div class="q-carousel screen">
      <div class="q-top-bar">
        <div class="q-counter" id="qCounter">1 / ${qs.length}</div>
        <button class="btn btn-ghost btn-sm" data-speak-q>${ICONS.play} پرسش</button>
      </div>
      <div class="q-prog-track"><i class="q-prog-fill" id="qProg" style="width: ${100/qs.length}%"></i></div>
      <div class="q-card-single" id="qCardContainer">
        <h2 class="q-single-title" id="qTitle" dir="ltr"></h2>
        <div class="q-single-answer" id="qAnswer" data-open="false" dir="ltr" hidden></div>
        <div class="q-reveal-wrap">
          <button class="btn btn-primary btn-block" id="qRevealBtn">نمایش پاسخ</button>
        </div>
      </div>
      <div class="q-nav-bar">
        <button class="btn btn-ghost" id="qPrev">قبلی</button>
        <button class="btn btn-ghost" id="qNext">بعدی</button>
      </div>
    </div>`;

  drawSingleQ(false);

  // Snappy horizontal swipe with live drag feedback
  const card = $('#qCardContainer');
  let startX = 0, startY = 0, dragging = false, dx = 0;
  card.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    dragging = true; startX = e.clientX; startY = e.clientY; dx = 0;
    card.classList.add('dragging');
  }, { passive: true });
  card.addEventListener('pointermove', e => {
    if (!dragging) return;
    dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx) + 10){ dragging = false; card.classList.remove('dragging'); card.style.transform = ''; card.style.opacity = ''; return; }
    card.style.transform = `translateX(${dx * .55}px)`;
    card.style.opacity = String(Math.max(.6, 1 - Math.abs(dx) / 560));
  }, { passive: true });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    card.classList.remove('dragging');
    card.style.transform = ''; card.style.opacity = '';
    if (Math.abs(dx) > 72){
      haptic(8);
      if (dx > 0) navQ(-1); else navQ(1);
    }
    dx = 0;
  };
  card.addEventListener('pointerup', endDrag, { passive: true });
  card.addEventListener('pointercancel', endDrag, { passive: true });
  card.addEventListener('pointerleave', endDrag, { passive: true });

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
    ansEl.innerHTML = `<div class="qa-inner">${parseAnswer(q.a)}
      <div id="sentTr" class="sent-tr" dir="rtl" hidden></div>
      <button id="trBtn" dir="rtl" class="btn btn-ghost btn-block tr-btn">🌐 ترجمه متن</button></div>`;
    ansEl.hidden = false;
    ansEl.dataset.open = 'false';
    void ansEl.offsetHeight; // flush styles so the reveal transitions
    ansEl.dataset.open = 'true';
    $('#trBtn').onclick = () => { haptic(4); toggleTranslate(q.a); };
    $('#qRevealBtn').textContent = 'بستن پاسخ';
    $('#qRevealBtn').className = 'btn btn-ghost btn-block';
    haptic(6);
  } else {
    ansEl.dataset.open = 'false';
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

/* --- Sentence-level parsing for sample answers ---
   Raw answer is a run of sentences. Each sentence may contain {{grammar}}
   highlights and [[English|فارسی]] chunks. We split on sentence enders while
   keeping the terminator, so each sentence is a self-contained unit. */
function splitSentences(text){
  const parts = [];
  let cur = '';
  for (const ch of String(text || '')){
    cur += ch;
    if (ch === '.' || ch === '!' || ch === '?') { parts.push(cur); cur = ''; }
  }
  if (cur.trim()) parts.push(cur);
  return parts.map(s => s.trim()).filter(Boolean);
}

// Plain English of a sentence with all {{}} / [[]] markup resolved to words.
function sentenceEnglish(raw){
  return String(raw || '')
    .replace(/\{\{([^}]+?)(?:::[^}]+)?\}\}/g, '$1')
    .replace(/\[\[([^\]|]+?)\|[^\]]+?\]\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Gloss of a sentence built from its inline [[English|فارسی]] chunks, if any.
function chunkGloss(raw){
  const inline = [];
  const re = /\[\[([^\]|]+?)\|([^\]]+?)\]\]/g;
  let m;
  while ((m = re.exec(raw)) !== null) inline.push(m[2]);
  return inline.length ? inline.join('، ') : null;
}

function sentenceCache(){ try { return JSON.parse(localStorage.getItem('ts2_sent_cache') || '{}'); } catch { return {}; } }
function cacheSentence(en, fa){
  const cache = sentenceCache();
  cache[en] = fa;
  try { localStorage.setItem('ts2_sent_cache', JSON.stringify(cache)); } catch {}
}

async function ensureSentenceTranslation(en){
  const known = sentenceCache()[en];
  if (known) return known;
  const fa = await fetchTranslation(en);
  if (fa) cacheSentence(en, fa);
  return fa;
}

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

// Nearest [.!?] scanning one direction from index i; returns bound or sentStart/sentEnd.
function scanBound(text, i, dir, sentStart, sentEnd){
  for (let j = i; j >= sentStart && j < sentEnd; j += dir){
    if ('.!?'.includes(text[j])) return j;
  }
  return dir < 0 ? sentStart - 1 : sentEnd;
}

// Resolve the full sentence (bounded by [.!?]) around the tapped word inside an answer.
function sentenceAround(el){
  const host = el.closest('.q-single-answer');
  if (!host) return '';
  const text = host.textContent.replace(/\s+/g, ' ').trim();
  const word = el.textContent.trim();
  const pos = text.indexOf(word);
  if (pos < 0) return text;
  const wordEnd = pos + word.length;
  const sentStart = scanBound(text, pos - 1, -1, 0, text.length) + 1;
  const sentEnd = scanBound(text, wordEnd, 1, 0, text.length);
  return text.slice(sentStart, sentEnd + 1).trim();
}

// Tap a word twice quickly → whole sentence meaning. A single tap still opens the
// word sheet, but only after a short delay so the second tap can cancel it.
let _tapTimer = null, _tapWord = null;
function tapWord(w){
  if (_tapWord === w && _tapTimer){
    clearTimeout(_tapTimer); _tapTimer = null; _tapWord = null;
    showSentenceMeaning(w);
    return;
  }
  clearTimeout(_tapTimer);
  _tapWord = w;
  _tapTimer = setTimeout(() => {
    _tapTimer = null; _tapWord = null;
    openWord(w.textContent.trim());
  }, 300);
}

async function showSentenceMeaning(w){
  const en = sentenceAround(w);
  if (!en) return;
  const cache = JSON.parse(localStorage.getItem('ts2_sent_cache') || '{}');
  const known = cache[en];
  openSheet(`
    <div class="sheet-head"><div class="sheet-label">جمله</div><div class="sheet-word" dir="ltr">${esc(en)}</div></div>
    <div class="sheet-meaning" id="sentFa" dir="rtl">${known ? esc(known) : '<span style="color:var(--text-soft);font-size:13px">در حال دریافت ترجمه...</span>'}</div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" id="sentSpeak">🔊 شنیدن</button>
      <button class="btn btn-ghost" id="sentSave">＋ ذخیره</button>
    </div>`, 'sent');
  $('#sentSpeak').onclick = () => speak(en);
  $('#sentSave').onclick = () => { addCard(en, known || ''); closeSheet(); };
  if (!known){
    const fa = await ensureSentenceTranslation(en);
    const el = $('#sentFa');
    if (!el) return;
    if (fa){ el.textContent = fa; const b = $('#sentSave'); b.onclick = () => { addCard(en, fa); closeSheet(); }; }
    else el.innerHTML = '<span style="color:var(--danger);font-size:13px">ترجمه‌ای پیدا نشد.</span>';
  }
}

// Translate the whole answer: reuse inline chunk translations where present,
// fall back to the translation API per sentence. Toggles the block on/off.
async function toggleTranslate(raw){
  const box = $('#sentTr'), btn = $('#trBtn');
  if (!box) return;
  if (!box.hidden){ box.hidden = true; box.innerHTML = ''; if (btn) btn.classList.remove('on'); return; }

  box.hidden = false; if (btn) btn.classList.add('on');
  const sentences = splitSentences(raw);
  box.innerHTML = `<div class="sent-tr-head">ترجمه کل متن</div>` +
    sentences.map((_, i) => `<div class="sent-tr-item" id="stItem${i}"><span class="sent-tr-loading">...</span></div>`).join('');

  // One sentence at a time so text appears as it arrives; full-sentence
  // translation first, the inline chunk gloss only as a fallback.
  for (let i = 0; i < sentences.length; i++){
    if ($('#sentTr') !== box) return; // user navigated away mid-fetch
    const en = sentenceEnglish(sentences[i]);
    let fa = await ensureSentenceTranslation(en);
    if (!fa) fa = chunkGloss(sentences[i]);
    const slot = document.getElementById(`stItem${i}`);
    if (!slot) return;
    slot.textContent = fa || '—';
    if (!fa) slot.classList.add('muted');
  }
}

document.addEventListener('click', e => {
  const g = e.target.closest('.grammar');
  if (g){ openGrammar(g.dataset.key, g.dataset.phrase); return; }
  const c = e.target.closest('.chunk');
  if (c){ openChunk(c.textContent.trim(), c.dataset.fa); return; }
  const w = e.target.closest('.w');
  if (w){ tapWord(w); return; }
});

/* ============================================================
   GRAMMAR TAB
   ============================================================ */
async function renderGrammar() {
  if (!state.lesson) return showPlaceholder('📖', 'اول یک درس را انتخاب کن.');
  if (pSession && pSession.mode === 'grammar') return renderPracticeRunner();

  if (!state.grammarData) {
    if (state.lesson.grammar_notes) return renderGrammarNotes(state.lesson.grammar_notes);
    if (!state.lesson.grammar_file) return showPlaceholder('📖', 'گرامر این درس هنوز اضافه نشده است.');

    $('#content').innerHTML = `<div class="placeholder"><span class="icon">⏳</span>در حال بارگذاری گرامر...</div>`;
    try {
      const r = await fetch(state.lesson.grammar_file, { cache: 'no-store' });
      if (r.status === 404) return showPlaceholder('📖', 'گرامر این درس هنوز اضافه نشده است.');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      state.grammarData = await r.json();
      state.gCards = buildGrammarCards(state.grammarData);
      state.gIndex = 0;
    } catch (e) {
      return showPlaceholder('⚠️', 'خطا در بارگذاری فایل گرامر.<br><small>' + esc(e.message) + '</small>');
    }
  }

  if (!state.gCards) { state.gCards = buildGrammarCards(state.grammarData); state.gIndex = 0; }
  if (!state.gCards.length) return showPlaceholder('📖', 'محتوای گرامر این درس خالی است.');
  renderGrammarCard(0, false);
}

// Flatten a grammar file into one card per screen: teach, mini_test (2 items), each final item, summary
function buildGrammarCards(G){
  const cards = [];
  const addFinal = items => {
    const prepared = (items || []).map(prepGrammarItem);
    prepared.forEach((item, i) => cards.push({ type:'final', item, pos:i + 1, total: prepared.length }));
    if (prepared.length) cards.push({ type:'summary', total: prepared.length });
  };

  if (Array.isArray(G.steps) && G.steps.length) {
    G.steps.forEach(step => {
      if (!step || !step.type) return;
      if (step.type === 'teach') {
        cards.push({ type:'teach', title: step.title || '', content: step.content_fa || '', examples: Array.isArray(step.examples) ? step.examples : [] });
      } else if (step.type === 'mini_test') {
        const items = (step.items || []).map(prepGrammarItem);
        if (items.length) cards.push({ type:'mini', items });
      } else if (step.type === 'final_test') {
        addFinal(step.items);
      }
    });
  } else if (Array.isArray(G.explanation)) {
    // Legacy format: explanation[] + test[]
    G.explanation.forEach(ex => cards.push({ type:'teach', title: ex.heading || G.title || '', content: ex.text || '', examples: [] }));
    addFinal(G.test);
  }
  return cards;
}

function prepGrammarItem(x){
  const item = { ...x, answered:false, correct:false, selected:null, userAnswer:'', _drop:[] };
  if (item.k === 'tap' && Array.isArray(item.o)) item._options = shuffle([...item.o]);
  if (item.k === 'drag' && Array.isArray(item.w)) item._bank = shuffle([...item.w]);
  return item;
}

function grammarNextEnabled(card){
  if (!card) return false;
  if (card.type === 'teach') return true;
  if (card.type === 'mini') return card.items.length > 0 && card.items.every(i => i.answered);
  if (card.type === 'final') return !!card.item.answered;
  return false;
}

function grammarSummaryHTML(cards){
  const finals = cards.filter(c => c.type === 'final');
  const score = finals.filter(c => c.item.correct).length;
  const total = finals.length;
  const pct = total ? Math.round(score / total * 100) : 0;
  const msg = pct === 100 ? 'بی‌نقص بود! 🎉' : pct >= 70 ? 'خیلی خوب بود! 👏' : pct >= 40 ? 'خوب پیش رفتی، دوباره امتحان کن. 💪' : 'نگران نباش، با مرور بهتر می‌شی. 📘';

  return `<div class="g-summary">
    <div class="g-summary-emoji">${pct >= 70 ? '🏆' : '📘'}</div>
    <div class="g-score">${score} / ${total}</div>
    <div class="g-score-sub">${pct}% درست</div>
    <div class="g-score-msg">${msg}</div>
    <button class="btn btn-primary btn-block" id="gRestart">مرور دوباره درس</button>
    <button class="btn btn-ghost btn-block" id="gToSpeaking">برگشت به سوالات</button>
  </div>`;
}

function renderGrammarCard(dir = 0, animate = false){
  const cards = state.gCards;
  if (!cards || !cards.length) return;
  if (state.gIndex < 0) state.gIndex = 0;
  if (state.gIndex > cards.length - 1) state.gIndex = cards.length - 1;

  const i = state.gIndex, card = cards[i], total = cards.length;
  if (card.type === 'summary' && !card.tracked) { card.tracked = true; trackCompletion(); }

  const badge = card.type === 'teach' ? 'آموزش'
    : card.type === 'mini' ? 'تست کوتاه'
    : card.type === 'final' ? `آزمون نهایی · ${card.pos} از ${card.total}`
    : 'نتیجه';

  let body = '';
  if (card.type === 'teach') {
    body = `<div class="g-step-label">${esc(card.title)}</div>
      <div class="g-fa" dir="rtl">${card.content}</div>
      ${card.examples.length ? `<div class="g-examples">${card.examples.map(ex => `
        <div class="g-ex" data-gspeak="${attr(ex.en)}">
          <div class="g-ex-en" dir="ltr">${esc(ex.en)}</div>
          <div class="g-ex-fa" dir="rtl">${esc(ex.fa || '')}</div>
        </div>`).join('')}</div>` : ''}`;
  } else if (card.type === 'mini') {
    body = `<div class="g-step-label">تست کوتاه</div>
      <div class="g-hint">به هر دو سوال جواب بده تا به مرحله بعد بروی.</div>
      ${card.items.map((item, idx) => grammarItemHTML(item, idx)).join('')}`;
  } else if (card.type === 'final') {
    body = `<div class="g-step-label">سوال ${card.pos} از ${card.total}</div>
      ${grammarItemHTML(card.item, 0)}`;
  } else {
    body = grammarSummaryHTML(cards);
  }

  const nextEnabled = grammarNextEnabled(card);
  const nextLabel = card.type === 'summary' ? 'پایان' : 'بعدی ←';
  const pct = Math.round((i + 1) / total * 100);
  const anim = animate ? (dir < 0 ? ' slide-right' : ' slide-left') : '';

  $('#content').innerHTML = `
    <div class="g-carousel screen">
      <div class="g-top-bar">
        <div class="g-counter">${i + 1} / ${total}</div>
        <div class="g-badge g-badge-${card.type}">${badge}</div>
      </div>
      <div class="g-prog-track"><i class="g-prog-fill" style="width:${pct}%"></i></div>
      <div class="g-card${anim}" id="gCard">${body}</div>
      <div class="q-nav-bar">
        <button class="btn btn-ghost" id="gPrev" ${i === 0 ? 'disabled' : ''}>→ قبلی</button>
        <button class="btn btn-primary" id="gNext" ${nextEnabled ? '' : 'disabled'}>${nextLabel}</button>
      </div>
    </div>`;

  bindGrammarCard(card);

  $('#gPrev').onclick = () => grammarGo(-1);
  $('#gNext').onclick = () => grammarGo(1);

  if (card.type === 'summary') {
    $('#gRestart').onclick = () => {
      state.gCards = buildGrammarCards(state.grammarData);
      state.gIndex = 0;
      renderGrammarCard(0, false);
    };
    $('#gToSpeaking').onclick = () => switchTabTo('speaking');
  }

  // Pointer swipe with live drag feedback (touch + mouse/pen)
  const gc = $('#gCard');
  let sx = 0, sy = 0, gdx = 0, gdragging = false;
  gc.addEventListener('pointerdown', e => {
    if (e.target.closest('button, input, a')) return;
    gdragging = true; sx = e.clientX; sy = e.clientY; gdx = 0;
    gc.classList.add('dragging');
  }, { passive: true });
  gc.addEventListener('pointermove', e => {
    if (!gdragging) return;
    gdx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dy) > Math.abs(gdx) + 10){ gdragging = false; gc.classList.remove('dragging'); gc.style.transform = ''; gc.style.opacity = ''; return; }
    gc.style.transform = `translateX(${gdx * .5}px)`;
    gc.style.opacity = String(Math.max(.6, 1 - Math.abs(gdx) / 600));
  }, { passive: true });
  const gEnd = () => {
    if (!gdragging) return;
    gdragging = false;
    gc.classList.remove('dragging');
    gc.style.transform = ''; gc.style.opacity = '';
    if (Math.abs(gdx) > 70){
      haptic(8);
      if (gdx > 0) grammarGo(-1); else grammarGo(1);
    }
    gdx = 0;
  };
  gc.addEventListener('pointerup', gEnd, { passive: true });
  gc.addEventListener('pointercancel', gEnd, { passive: true });
  gc.addEventListener('pointerleave', gEnd, { passive: true });
}

function grammarGo(dir){
  const cards = state.gCards;
  const target = state.gIndex + dir;
  if (target < 0 || target > cards.length - 1) return;
  if (dir > 0 && !grammarNextEnabled(cards[state.gIndex])) return;
  state.gIndex = target;
  renderGrammarCard(dir, true);
  window.scrollTo({ top:0, behavior:'smooth' });
}

function grammarItemHTML(item, idx){
  let body = '';
  if (item.k === 'tap') {
    body = `<div class="p-options g-options">${(item._options || item.o || []).map(o => {
      let cls = 'p-opt';
      if (item.answered) { if (o === item.a) cls += ' correct'; else if (o === item.selected) cls += ' wrong'; }
      else if (o === item.selected) cls += ' selected';
      return `<button class="${cls}" dir="ltr" data-gopt="${attr(o)}" ${item.answered ? 'disabled' : ''}>${esc(o)}</button>`;
    }).join('')}</div>`;
  } else if (item.k === 'type') {
    body = `<input class="p-input g-input" dir="ltr" id="gInput-${idx}" type="text" value="${item.answered || item.userAnswer ? attr(item.userAnswer) : ''}" placeholder="پاسخ را بنویس..." autocomplete="off" spellcheck="false" ${item.answered ? 'disabled' : ''}>`;
  } else if (item.k === 'drag') {
    body = `<div class="p-drop${item.answered ? (item.correct ? ' correct' : ' wrong') : ''}">${item._drop.map((w, i) => `<button class="p-word in-drop" data-gdrop="${i}" ${item.answered ? 'disabled' : ''}>${esc(w)}</button>`).join('')}</div>
      <div class="p-bank">${item._bank.map((w, i) => item._drop.includes(w) ? `<span class="p-word" style="visibility:hidden">${esc(w)}</span>` : `<button class="p-word" data-gbank="${i}" ${item.answered ? 'disabled' : ''}>${esc(w)}</button>`).join('')}</div>`;
  }

  const fb = item.answered
    ? `<div class="p-feedback ${item.correct ? 'ok' : 'no'}">${item.correct ? '✓ درست!' : '✗ جواب درست: <span class="g-ans" dir="ltr">' + esc(item.a) + '</span>'}${item.fb ? `<div class="g-fb-tip">${esc(item.fb)}</div>` : ''}</div>`
    : '';

  const prompt = item.k === 'drag'
    ? (item.q ? formatQ(item) : 'کلمات را به ترتیب درست بچین:')
    : formatQ(item);
  const promptClass = item.k === 'drag' && !item.q ? 'p-q g-q g-q-fa' : 'p-q g-q';
  const promptDir = item.k === 'drag' && !item.q ? 'rtl' : 'ltr';

  return `<div class="g-item" data-gitem="${idx}">
    <div class="${promptClass}" dir="${promptDir}">${prompt}</div>
    ${body}${fb}
    ${item.answered ? '' : `<button class="btn btn-primary btn-block g-check" data-gcheck="${idx}" disabled>بررسی</button>`}
  </div>`;
}

function grammarItemReady(item, root){
  if (item.k === 'tap') return !!item.selected;
  if (item.k === 'type') { const inp = root.querySelector('input'); return !!(inp && inp.value.trim()); }
  if (item.k === 'drag') return item._drop.length > 0;
  return false;
}

function bindGrammarCard(card){
  const items = card.type === 'mini' ? card.items : card.type === 'final' ? [card.item] : [];

  items.forEach((item, idx) => {
    const root = document.querySelector(`[data-gitem="${idx}"]`);
    if (!root) return;
    const enable = () => {
      const b = root.querySelector('[data-gcheck]');
      if (b) b.disabled = !grammarItemReady(item, root);
    };

    root.querySelectorAll('[data-gopt]').forEach(b => {
      b.onclick = () => {
        item.selected = b.dataset.gopt;
        root.querySelectorAll('[data-gopt]').forEach(x => x.classList.toggle('selected', x === b));
        haptic(6);
        enable();
      };
    });

    if (item.k === 'type') {
      const inp = root.querySelector('input');
      if (inp) {
        inp.oninput = () => { item.userAnswer = inp.value; enable(); };
        inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) checkGrammarItem(card, idx); };
      }
    }

    root.querySelectorAll('[data-gbank]').forEach(b => {
      b.onclick = () => {
        const w = item._bank[+b.dataset.gbank];
        if (!item._drop.includes(w)) { item._drop.push(w); renderGrammarCard(0, false); }
      };
    });
    root.querySelectorAll('[data-gdrop]').forEach(b => {
      b.onclick = () => { item._drop.splice(+b.dataset.gdrop, 1); renderGrammarCard(0, false); };
    });

    const check = root.querySelector('[data-gcheck]');
    if (check) check.onclick = () => checkGrammarItem(card, idx);
    enable();
  });

  document.querySelectorAll('[data-gspeak]').forEach(el => { el.onclick = () => speak(el.dataset.gspeak); });
}

function checkGrammarItem(card, idx){
  const item = card.type === 'mini' ? card.items[idx] : card.item;
  const root = document.querySelector(`[data-gitem="${idx}"]`);
  if (!item || item.answered) return;

  let ok = false;
  if (item.k === 'tap') {
    ok = item.selected === item.a;
  } else if (item.k === 'type') {
    const inp = root.querySelector('input');
    item.userAnswer = inp ? inp.value.trim() : '';
    ok = item.userAnswer.toLowerCase() === String(item.a).toLowerCase();
  } else if (item.k === 'drag') {
    item.userAnswer = item._drop.join(' ');
    ok = item.userAnswer.replace(/\s+/g, ' ').trim().toLowerCase() === String(item.a).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  item.answered = true;
  item.correct = ok;
  haptic(ok ? 14 : 22);
  if (ok) speak(item.a);
  renderGrammarCard(0, false);
}

function renderGrammarNotes(notes){
  const items = Object.values(notes).filter(n => n && (n.label || n.tip));
  if (!items.length) return showPlaceholder('📖', 'گرامر این درس هنوز اضافه نشده است.');

  $('#content').innerHTML = `<div class="grammar-explain">
    <h2 class="ge-title">گرامر این درس</h2>
    ${items.map(n => `
      <div class="ge-section">
        <div class="ge-heading">${esc(n.label || '')}</div>
        <div class="ge-text">${esc(n.tip || '')}</div>
      </div>
    `).join('')}
  </div>`;
}

/* ============================================================
   PRACTICE (Exercise Tab)
   ============================================================ */
function renderPractice(){
  if (!state.lesson) return showPlaceholder('⚡', 'اول یک درس را انتخاب کن.');
  if (pSession) return renderPracticeRunner();

  $('#content').innerHTML = `
    <div class="screen">
      <div class="home-section" style="margin-top:2px"><h2>یک تمرین را انتخاب کن</h2></div>
      <div class="p-grid">
        <button class="p-card" data-mode="words">
          <span class="icon">${ICONS.book}</span>
          <span class="p-card-text"><span class="name">لغات</span><span class="sub">${(state.lesson.practice||[]).length} سوال</span></span>
        </button>
        <button class="p-card" data-mode="match">
          <span class="icon">${ICONS.links}</span>
          <span class="p-card-text"><span class="name">تطبیق لغات</span><span class="sub">بازی حافظه</span></span>
        </button>
        <button class="p-card" data-mode="listen">
          <span class="icon">${ICONS.audio}</span>
          <span class="p-card-text"><span class="name">گوش کن</span><span class="sub">تمرین شنیداری</span></span>
        </button>
      </div>
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
        return `<button class="${cls}" dir="ltr" data-opt="${attr(o)}" ${s.answered ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>`;
  } else if (item.k === 'tap') {
    body = `<div class="p-options">${item._options.map(o => {
      let cls = 'p-opt'; if (s.answered){ if (o === item.a) cls += ' correct'; else if (o === s.selected) cls += ' wrong'; }
      return `<button class="${cls}" dir="ltr" data-opt="${attr(o)}" ${s.answered ? 'disabled' : ''}>${esc(o)}</button>`;
    }).join('')}</div>`;
  } else if (item.k === 'type') {
    body = `<input class="p-input" dir="ltr" id="pInput" type="text" value="${s.answered ? attr(s.userAnswer) : ''}" placeholder="پاسخ را بنویس..." autocomplete="off" spellcheck="false" ${s.answered ? 'disabled' : ''}>`;
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
    <div class="p-runner screen">
      <div class="p-top"><div class="p-counter">${title} · ${s.index + 1} از ${s.items.length}</div><button class="p-exit" id="pExit" aria-label="خروج">${ICONS.close}</button></div>
      <div class="p-progress"><i style="width:${pct}%"></i></div>
      ${s.mode !== 'listen' ? `<div class="p-q" dir="ltr">${formatQ(item)}</div>` : `<div style="height:10px"></div>`}
      ${body}${feedback}
      <div class="p-actions">${s.answered ? `<button class="btn btn-primary btn-block" id="pNext">${s.index + 1 >= s.items.length ? 'پایان' : 'سوال بعدی'}</button>` : `<button class="btn btn-primary btn-block" id="pCheck" disabled>بررسی</button>`}</div>
    </div>`;

  if (s.mode === 'listen' && !s.answered) { setTimeout(() => speak(item.answer), 300); $('#playSound').onclick = () => speak(item.answer); }
  if (s.answered){ $('#pNext').onclick = () => { s.index++; s.answered = false; s.selected = null; s.userAnswer = ''; renderPracticeRunner(); }; if (s.correct) scheduleAdvance(); }
  else { bindPracticeInputs(item); }
  
  // Route exit button based on context
  $('#pExit').onclick = () => { 
    cancelAdvance();
    pSession = null; 
    if (s.mode === 'grammar') renderGrammar(); else renderPractice(); 
  };
}
function bindPracticeInputs(item){
  const s = pSession;
  if (s.mode === 'listen' || item.k === 'tap'){
    $$('[data-opt]').forEach(b => { b.onclick = () => { s.selected = b.dataset.opt; haptic(5); $$('[data-opt]').forEach(x => x.classList.toggle('selected', x === b)); $('#pCheck').disabled = false; }; });
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

function formatQ(item){ return esc(item.q).replace(/____/g, '<span class="blank">____</span>'); }

// Auto-advance after a correct answer in the Exercise tab: the ✓ feedback stays
// on screen briefly, then we move to the next question (or the summary).
let _advTimer = null;
function scheduleAdvance(){
  clearTimeout(_advTimer);
  _advTimer = setTimeout(() => {
    const s = pSession;
    if (!s || !s.correct) return;           // user may have navigated away
    s.index++; s.answered = false; s.selected = null; s.userAnswer = '';
    renderPracticeRunner();
  }, 1300);
}
function cancelAdvance(){ clearTimeout(_advTimer); _advTimer = null; }

function checkPractice(){
  cancelAdvance();
  const s = pSession, item = s.items[s.index];
  let ok = false, correctAnswer = '';
  if (s.mode === 'listen') { correctAnswer = item.answer; ok = s.selected === item.answer; }
  else if (item.k === 'tap') { correctAnswer = item.a; ok = s.selected === item.a; }
  else if (item.k === 'type') { correctAnswer = item.a; const inp = $('#pInput'); s.userAnswer = inp.value.trim(); ok = s.userAnswer.toLowerCase() === correctAnswer.toLowerCase(); }
  else if (item.k === 'drag') { correctAnswer = item.a; s.userAnswer = item._drop.join(' '); ok = s.userAnswer.replace(/\s+/g, ' ').trim().toLowerCase() === correctAnswer.replace(/\s+/g, ' ').trim().toLowerCase(); }

  s.answered = true; s.correct = ok;
  haptic(ok ? 12 : 26);
  if (ok) { s.score++; speak(correctAnswer); trackCompletion(); }
  renderPracticeRunner();
}

function renderMatchUI() {
  const s = pSession;
  if (s.matched === s.matchPairs) return renderPracticeSummary();
  const pct = Math.round(s.matched / s.matchPairs * 100);
  const leftHtml = s.left.map(x => `      <div class="match-item ltr${x.done ? ' done' : (s.selLeft && s.selLeft.id === x.id ? ' sel' : '')}" dir="ltr" data-side="l" data-id="${esc(x.id)}">${esc(x.text)}</div>`).join('');
  const rightHtml = s.right.map(x => `<div class="match-item rtl${x.done ? ' done' : (s.selRight && s.selRight.id === x.id ? ' sel' : '')}" dir="rtl" data-side="r" data-id="${esc(x.id)}">${esc(x.text)}</div>`).join('');

  $('#content').innerHTML = `
    <div class="p-runner">
      <div class="p-top"><div class="p-counter">تطبیق لغات</div><button class="p-exit" id="pExit" aria-label="خروج">${ICONS.close}</button></div>
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
    <div class="p-summary screen">
      <div class="g-summary-emoji">${pct >= 70 ? '🏆' : '📘'}</div>
      <div class="big">${score} / ${total}</div>
      <div class="g-score-sub">${pct}% درست</div>
      <div class="g-score-msg">${msg}</div>
      <button class="btn btn-primary btn-block" id="pBack">دوباره</button>
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
  let html = `<div class="screen"><div class="cards-head">
    <div><div class="cards-count">${state.cards.length} کارت</div><div class="cards-due">${due > 0 ? `${due} کارت برای مرور امروز` : 'همه‌چیز مرور شده ✓'}</div></div>
    ${due > 0 ? `<button class="btn btn-primary btn-sm" id="startReview">شروع مرور</button>` : ''}
  </div>`;
  state.cards.slice().reverse().forEach(c => {
    html += `<div class="card-item">
      <div class="card-body" data-speak="${esc(c.t)}"><div class="card-en" dir="ltr">${esc(c.t)}</div><div class="card-fa" dir="rtl">${esc(c.fa)}</div></div>
      <button class="card-del" data-del="${esc(c.t)}" aria-label="حذف">${ICONS.close}</button>
    </div>`;
  });
  html += `<button class="btn btn-ghost btn-block" id="clearCards">🗑️ پاک کردن همه</button></div>`;
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
    $('#content').innerHTML = `<div class="empty screen"><span class="icon">🎉</span><div style="font-size:1.05rem;font-weight:800;margin-bottom:6px">تمام شد!</div><div style="color:var(--text-2);font-size:.86rem">${review.done} کارت مرور شد.</div><button class="btn btn-primary btn-block" id="reviewDone" style="margin-top:18px">بازگشت</button></div>`;
    $('#reviewDone').onclick = () => { review = null; renderCards(); };
    return;
  }
  const card = review.queue[0], pct = review.total ? Math.round(review.done / review.total * 100) : 0;
  $('#content').innerHTML = `
    <div class="screen">
      <div class="review-progress"><i style="width:${pct}%"></i></div>
      <div class="review-top">
        <span>${review.done} از ${review.total}</span>
        <button class="btn btn-ghost btn-sm" id="exitReview">${ICONS.close} خروج</button>
      </div>
      <div class="review-card${review.shown ? ' flipped' : ''}" id="reviewCard" role="button" tabindex="0" aria-label="فلش‌کارت؛ برای دیدن معنی لمس کنید">
        <div class="flip-inner">
          <div class="face face-front">
            <div class="review-front" dir="ltr">${esc(card.t)}</div>
            <div class="review-hint" dir="rtl">برای دیدن معنی، لمس کن</div>
          </div>
          <div class="face face-back">
            <div class="review-back-en" dir="ltr">${esc(card.t)}</div>
            <div class="review-back-fa" dir="rtl">${esc(card.fa)}</div>
          </div>
        </div>
      </div>
      <div class="rating-buttons" id="ratings" dir="rtl" ${review.shown ? '' : 'hidden'}>
        <button class="rating-btn again" data-rate="0">دوباره</button>
        <button class="rating-btn hard"  data-rate="3">سخت</button>
        <button class="rating-btn good"  data-rate="4">خوب</button>
        <button class="rating-btn easy"  data-rate="5">راحت</button>
      </div>
    </div>`;

  $('#exitReview').onclick = () => { haptic(5); review = null; renderCards(); };
  const cardEl = $('#reviewCard');
  const reveal = () => {
    if (review.shown) return;
    review.shown = true;
    cardEl.classList.add('flipped');
    const ratings = $('#ratings');
    if (ratings) ratings.hidden = false;
    haptic(10);
    speak(card.t);
  };
  cardEl.onclick = reveal;
  cardEl.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); reveal(); } };
  $$('[data-rate]').forEach(b => { b.onclick = () => { haptic(8); rateCard(+b.dataset.rate); }; });
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
function openSheet(html, mode){
  $('#sheetBody').innerHTML = html;
  $('#sheet').classList.add('show');
  $('#backdrop').classList.add('show');
  document.body.dataset.locked = '1';
  sheetMode = mode || 'generic';
  haptic(5);
}
function closeSheet(){
  $('#sheet').classList.remove('show');
  $('#backdrop').classList.remove('show');
  delete document.body.dataset.locked;
  sheetMode = null;
}
$('#backdrop').onclick = closeSheet;
$('#sheetClose').onclick = () => { haptic(4); closeSheet(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

// Drag the sheet down to dismiss
(() => {
  const sheet = $('#sheet'), grip = $('#sheetGrip');
  let startY = 0, dy = 0, dragging = false;
  const down = e => { dragging = true; startY = e.clientY; dy = 0; sheet.classList.add('dragging'); };
  const move = e => { if (!dragging) return; dy = Math.max(0, e.clientY - startY); sheet.style.transform = `translateY(${dy}px)`; };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('dragging');
    sheet.style.transform = '';
    if (dy > 92){ haptic(6); closeSheet(); }
    dy = 0;
  };
  grip.addEventListener('pointerdown', down);
  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', up);
  grip.addEventListener('pointercancel', up);
})();

// Pull-to-refresh: a light, tactile refresh of the current tab
(() => {
  const ptr = $('#ptr');
  let startY = null, pulling = false, dist = 0;
  window.addEventListener('touchstart', e => {
    const sheetOpen = $('#sheet').classList.contains('show');
    if (window.scrollY > 2 || sheetOpen){ startY = null; return; }
    startY = e.touches[0].clientY; dist = 0;
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (startY === null) return;
    dist = e.touches[0].clientY - startY;
    if (dist > 8){
      pulling = true;
      ptr.classList.add('pull');
      ptr.style.transform = `translate(-50%, ${Math.min(dist * .52, 56) - 46}px)`;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => {
    if (!pulling){ startY = null; return; }
    ptr.classList.remove('pull');
    ptr.style.transform = '';
    if (dist > 92){ ptr.classList.add('spin'); haptic(10); renderTab(state.tab); setTimeout(() => ptr.classList.remove('spin'), 650); }
    pulling = false; startY = null; dist = 0;
  }, { passive: true });
})();

function openChunk(eng, fa){
  const inCards = state.cards.some(c => c.t.toLowerCase() === eng.toLowerCase());
  openSheet(`
    <div class="sheet-head"><div class="sheet-word" dir="ltr">${esc(eng)}</div></div>
    <div class="sheet-meaning" dir="rtl">${esc(fa)}</div>
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
    <div class="sheet-head"><div class="sheet-word" dir="ltr">${esc(raw)}</div></div>
    <div class="sheet-meaning" id="shMeaning" dir="rtl">${meaning ? esc(meaning) : '<span style="color:var(--text-soft);font-size:13px">در حال دریافت از اینترنت...</span>'}</div>
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
    <div class="sheet-head"><div class="sheet-label">الگوی گرامری</div><div class="sheet-word" dir="ltr">${esc(phrase)}</div></div>
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