/* RATHOD HUB • VIP focus app final fix */
(function(){
'use strict';
if(window.__RH_FOCUS_TIMER_PREMIUM__) return;
window.__RH_FOCUS_TIMER_PREMIUM__ = 1;

const db = () => { try { return window.db || null; } catch (e) { return null; } };
const uid = () => { try { return String(window.user?.id || ''); } catch (e) { return ''; } };
const STORAGE_KEY = 'rh_focus_planner_tasks_v2';
const SUBJECT_CARDS = [
  { name:'Botany', note:'Plants + NCERT flowcharts', session:60, icon:'🌿', glow:'#22c55e' },
  { name:'Zoology', note:'Human + animal systems', session:60, icon:'🦋', glow:'#10b981' },
  { name:'Chemistry', note:'Reactions + revision', session:50, icon:'🧪', glow:'#f59e0b' },
  { name:'Physics', note:'Numericals + concepts', session:60, icon:'⚡', glow:'#38bdf8' },
  { name:'Revision', note:'Rapid recap + weak topics', session:45, icon:'🔁', glow:'#a855f7' }
];
const FALLBACK_MEMBERS = [
  { name:'StudyMate', total_seconds:45123, icon:'👑', glow:'#f59e0b' },
  { name:'Dreamer', total_seconds:40123, icon:'🌙', glow:'#8b5cf6' },
  { name:'Candy', total_seconds:35123, icon:'🍬', glow:'#ec4899' },
  { name:'Focus', total_seconds:30123, icon:'🔥', glow:'#f97316' },
  { name:'Miya', total_seconds:25123, icon:'🌸', glow:'#f472b6' },
  { name:'Note', total_seconds:22123, icon:'📚', glow:'#22c55e' },
  { name:'Targin', total_seconds:18123, icon:'✨', glow:'#facc15' },
  { name:'Mind', total_seconds:14823, icon:'🧠', glow:'#60a5fa' }
];
let appState = { activeTab:'timer', rank:'—', focus3day:'0h 0m', nextText:'VIP progress', dailyGoal:'0h 0m', members:[], loading:false };

function textOf(el){ return String(el?.textContent || '').trim(); }
function fmtShort(sec){ sec=Math.max(0,Number(sec)||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }
function fmtHours(sec){ return `${(Math.max(0,Number(sec)||0)/3600).toFixed(1)}h`; }
function todayLabel(){ try { return new Date().toLocaleDateString(undefined,{ weekday:'short', month:'numeric', day:'numeric' }); } catch(e){ return 'Today'; } }
function liveClock(){ try { return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }); } catch(e){ return '--:--'; } }
function plannerStore(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; } }
function savePlanner(tasks){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch(e){} }

function ensureStyle(){
  if(document.getElementById('rh-focus-vip-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-vip-style';
  style.textContent = `
    .rh-focus-root{position:relative;overflow:hidden;border:1px solid rgba(251,191,36,.12)!important;background:radial-gradient(circle at top right,rgba(249,115,22,.12),transparent 28%),radial-gradient(circle at top left,rgba(251,191,36,.10),transparent 24%),linear-gradient(180deg,#151515,#0f0f10)!important;box-shadow:0 30px 90px rgba(0,0,0,.42)!important}
    .rh-focus-gold-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;border:1px solid rgba(251,191,36,.18);background:linear-gradient(90deg,rgba(251,191,36,.14),rgba(255,255,255,.03));font-size:10px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:#fde68a;box-shadow:0 0 24px rgba(251,191,36,.08)}
    .rh-focus-gold-title{background:linear-gradient(90deg,#fff6cc,#fbbf24,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent!important;text-shadow:none!important}
    .rh-focus-shell{margin-top:18px;border-radius:30px;overflow:hidden;border:1px solid rgba(251,191,36,.16);background:linear-gradient(180deg,#111111,#0f0f10);box-shadow:0 24px 70px rgba(0,0,0,.30)}
    .rh-focus-vipBar{padding:18px 18px 12px;background:linear-gradient(135deg,#0e0f13 0%,#22170d 32%,#7c3f10 68%,#f97316 100%);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 48px rgba(249,115,22,.18);position:relative}
    .rh-focus-vipBar:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(251,191,36,.16),transparent 35%,transparent 68%,rgba(255,255,255,.05));pointer-events:none}
    .rh-focus-vipTop{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:800;position:relative;z-index:1}.rh-focus-vipSubject{display:flex;align-items:center;gap:10px}
    .rh-focus-vipTimer{margin-top:18px;font-size:52px;line-height:1;font-weight:900;letter-spacing:.05em;position:relative;z-index:1;text-shadow:0 0 18px rgba(255,255,255,.08)}
    .rh-focus-topMeta{display:flex;gap:10px;align-items:center}.rh-focus-topClock{padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:11px}
    .rh-focus-tabs{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;position:relative;z-index:1}.rh-focus-tab{appearance:none;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff7ed;font-size:13px;padding:9px 14px;border-radius:999px;cursor:pointer;font-weight:700}.rh-focus-tab.active{background:linear-gradient(90deg,rgba(251,191,36,.22),rgba(249,115,22,.28));border-color:rgba(251,191,36,.34);box-shadow:0 0 0 1px rgba(251,191,36,.10) inset}
    .rh-focus-body{padding:18px;background:linear-gradient(180deg,#111111,#0e0e0f);min-height:260px}
    .rh-focus-grid{display:grid;grid-template-columns:1.2fr .85fr;gap:18px}
    .rh-focus-panel{border:1px solid rgba(251,191,36,.12)!important;border-radius:26px!important;background:linear-gradient(180deg,#171717,#111111)!important;box-shadow:0 18px 44px rgba(0,0,0,.24)!important}
    .rh-focus-panelOrange{border-color:rgba(251,124,48,.28)!important;box-shadow:0 18px 44px rgba(251,124,48,.10)!important;background:radial-gradient(circle at top,rgba(249,115,22,.10),transparent 32%),linear-gradient(180deg,#0b0d14,#111827)!important}
    .rh-focus-sourceTimer,.rh-focus-sourceControl{border:1px solid rgba(251,191,36,.14)!important;border-radius:28px!important;background:linear-gradient(180deg,#121214,#0c0d12)!important;box-shadow:0 20px 50px rgba(0,0,0,.28),0 0 0 1px rgba(251,191,36,.04) inset!important;position:relative;overflow:hidden}
    .rh-focus-sourceTimer:before,.rh-focus-sourceControl:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(249,115,22,.10),transparent 28%),radial-gradient(circle at top left,rgba(251,191,36,.08),transparent 22%);pointer-events:none}
    .rh-focus-sourceTimer *,.rh-focus-sourceControl *{position:relative;z-index:1}
    .rh-focus-sourceControl input,.rh-focus-sourceControl select{background:#0f1117!important;border:1px solid rgba(251,191,36,.12)!important;color:#fff!important;border-radius:14px!important}
    .rh-focus-sourceControl label,.rh-focus-sourceControl [class*='text-slate-400'],.rh-focus-sourceTimer [class*='text-slate-400']{color:#d1d5db!important}
    .rh-focus-startBtn{background:linear-gradient(90deg,#ff9f2a,#ff6e1d)!important;color:#fff!important;border:0!important;box-shadow:0 14px 30px rgba(255,110,29,.22)!important}.rh-focus-softBtn{background:#1b1b1d!important;border:1px solid rgba(255,255,255,.10)!important;color:#f8fafc!important}
    .rh-focus-cardTitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.rh-focus-cardTitle b{font-size:24px;color:#fff}.rh-focus-cardTitle span{font-size:12px;color:#9ca3af}
    .rh-focus-inlineActions{display:flex;gap:8px;flex-wrap:wrap}.rh-focus-inlineBtn{appearance:none;border:1px solid rgba(251,191,36,.18);background:rgba(251,191,36,.10);color:#fde68a;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer}
    .rh-focus-booksGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.rh-focus-bookCard{position:relative;overflow:hidden;padding:18px;border-radius:24px;border:1px solid rgba(251,191,36,.16);background:linear-gradient(180deg,#1a1a1a,#131313);box-shadow:0 16px 34px rgba(0,0,0,.22)}.rh-focus-bookCard:before{content:"";position:absolute;inset:auto -20px -20px auto;width:120px;height:120px;background:radial-gradient(circle,var(--glow),transparent 70%);opacity:.22;pointer-events:none}.rh-focus-bookTop{display:flex;align-items:center;justify-content:space-between;gap:12px}.rh-focus-bookIcon{width:52px;height:52px;border-radius:18px;display:grid;place-items:center;font-size:24px;background:linear-gradient(135deg,var(--glow),#ffffff22);box-shadow:0 0 0 1px rgba(255,255,255,.06) inset,0 10px 24px color-mix(in srgb,var(--glow) 34%, transparent)}.rh-focus-bookName{font-size:22px;font-weight:900;color:#fff}.rh-focus-bookNote{margin-top:8px;font-size:13px;color:#d1d5db}.rh-focus-bookFoot{margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}.rh-focus-bookTime{font-size:13px;font-weight:800;color:#fde68a}.rh-focus-bookStart{appearance:none;border:0;background:linear-gradient(90deg,var(--glow),#f59e0b);color:#fff;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 10px 22px color-mix(in srgb,var(--glow) 28%, transparent)}
    .rh-focus-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:18px}.rh-focus-mini{position:relative;overflow:hidden;border-radius:24px;padding:18px;border:1px solid rgba(251,191,36,.10);background:linear-gradient(180deg,#171717,#111111)}.rh-focus-mini:before{content:"";position:absolute;inset:auto -10px -24px auto;width:110px;height:110px;background:radial-gradient(circle,rgba(251,124,48,.12),transparent 68%);pointer-events:none}.rh-focus-miniLabel{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#9ca3af}.rh-focus-miniValue{display:block;margin-top:10px;font-size:34px;line-height:1;font-weight:900;color:#fff}.rh-focus-miniMeta{display:block;margin-top:8px;font-size:12px;color:#cbd5e1}
    .rh-focus-graphList{display:grid;gap:12px}.rh-focus-graphRow{display:grid;grid-template-columns:120px 1fr 64px;gap:12px;align-items:center}.rh-focus-graphName{font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rh-focus-graphTrack{height:14px;border-radius:999px;background:#1f2937;overflow:hidden}.rh-focus-graphBar{height:100%;border-radius:999px;background:linear-gradient(90deg,#fb7c30,#fbbf24);box-shadow:0 0 16px rgba(251,124,48,.18)}.rh-focus-graphValue{font-size:12px;font-weight:800;color:#fbcc9d;text-align:right}
    .rh-focus-groupGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.rh-focus-member{position:relative;overflow:hidden;padding:12px 8px;border-radius:22px;border:1px solid rgba(251,191,36,.10);background:linear-gradient(180deg,#191919,#141414);text-align:center}.rh-focus-member:before{content:"";position:absolute;inset:auto -18px -18px auto;width:100px;height:100px;background:radial-gradient(circle,var(--member-glow),transparent 72%);opacity:.24;pointer-events:none}.rh-focus-member.top{border-color:rgba(251,124,48,.38);box-shadow:0 0 0 1px rgba(251,124,48,.12) inset}.rh-focus-avatar{width:58px;height:58px;border-radius:20px;margin:0 auto 10px;display:grid;place-items:center;font-weight:900;color:#111827;font-size:24px;background:linear-gradient(135deg,var(--member-glow),#fbbf24);box-shadow:0 12px 24px rgba(251,124,48,.22)}.rh-focus-member b{display:block;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rh-focus-member span{display:block;margin-top:4px;font-size:12px;color:#fb923c}
    .rh-focus-hidden{display:none!important}
    .rh-focus-plannerInput{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.rh-focus-plannerInput input{flex:1;min-width:220px;background:#0f172a;border:1px solid rgba(255,255,255,.10);color:#fff;padding:12px 14px;border-radius:16px}.rh-focus-plannerInput button{appearance:none;border:0;background:linear-gradient(90deg,#ff9f2a,#ff6e1d);color:#fff;padding:12px 16px;border-radius:16px;font-weight:800;cursor:pointer}.rh-focus-taskDone{text-decoration:line-through;opacity:.6}.rh-focus-taskActions{display:flex;gap:8px}.rh-focus-taskChip{appearance:none;border:1px solid rgba(255,255,255,.10);background:#1b1b1d;color:#fff;padding:7px 10px;border-radius:999px;font-size:12px;cursor:pointer}.rh-focus-planList{display:grid;gap:12px}.rh-focus-planRow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 14px;border-radius:20px;background:linear-gradient(180deg,#1a1a1a,#151515);border:1px solid rgba(251,191,36,.10)}.rh-focus-planLeft{display:flex;align-items:center;gap:12px;min-width:0}.rh-focus-planDot{width:22px;height:22px;border-radius:999px;background:#fb7c30;display:grid;place-items:center;color:#fff;font-weight:900;flex:0 0 22px}.rh-focus-planTitle{font-size:18px;font-weight:700;color:#fff}.rh-focus-planSub{display:block;margin-top:4px;font-size:12px;color:#9ca3af}
    @media (max-width:1024px){.rh-focus-grid,.rh-focus-metrics,.rh-focus-booksGrid{grid-template-columns:1fr}.rh-focus-groupGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.rh-focus-vipTimer{font-size:40px}.rh-focus-graphRow{grid-template-columns:88px 1fr 52px}}
  `;
  document.head.appendChild(style);
}

function findSection(){ return document.getElementById('section-focus'); }
function findRoot(section){ return Array.from(section.querySelectorAll('div')).find(el => String(el.innerText || '').includes('RATHOD HUB FOCUS')) || null; }
function findTitleEl(root){ return Array.from(root?.querySelectorAll('h1,h2,h3,h4,b') || []).find(el => textOf(el).toLowerCase().includes('rathod hub focus')) || null; }
function currentTimerText(section){ return window.__RH_FOCUS_VIP_LIVE_TEXT__ || textOf(Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)))) || '00:00:00'; }
function selectedSubject(section){ const s = section.querySelector('select'); return s?.value || s?.options?.[s.selectedIndex]?.text || 'Botany'; }
function findTimerPanel(section){ const timer = Array.from(section.querySelectorAll('*')).find(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el))); return timer?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || timer?.parentElement?.parentElement || null; }
function findControlPanel(section){ return section.querySelector('select')?.closest('div.rounded-3xl,div.rounded-[32px],div.rounded-[28px]') || section.querySelector('select')?.parentElement?.parentElement || null; }
function findStats(section){ const nodes = Array.from(section.querySelectorAll('div')); return { today:nodes.find(el => String(el.innerText || '').toLowerCase().includes('today') && String(el.innerText || '').toLowerCase().includes('study time')) || null, streak:nodes.find(el => String(el.innerText || '').toLowerCase().includes('consecutive study days')) || null, sessions:nodes.find(el => String(el.innerText || '').toLowerCase().includes('completed sessions')) || null }; }

function premiumizeSourcePanels(section){
  const timer = findTimerPanel(section);
  const control = findControlPanel(section);
  if(timer) timer.classList.add('rh-focus-sourceTimer');
  if(control) control.classList.add('rh-focus-sourceControl');
  Array.from(section.querySelectorAll('button')).forEach(btn => {
    const t = textOf(btn).toLowerCase();
    if(/start/.test(t) || /pomodoro/.test(t)) btn.classList.add('rh-focus-startBtn');
    else btn.classList.add('rh-focus-softBtn');
  });
}

function ensureGoldHeader(section){
  const root = findRoot(section); if(!root) return null;
  root.classList.add('rh-focus-root');
  const title = findTitleEl(root); if(title) title.classList.add('rh-focus-gold-title');
  if(!root.querySelector('.rh-focus-gold-chip')){ const chip=document.createElement('div'); chip.className='rh-focus-gold-chip'; chip.textContent='Yeolpumta Style'; root.insertBefore(chip, root.firstChild); }
  return root;
}

function ensureShell(section){
  let shell = document.getElementById('rh-focus-shell');
  if(shell) return shell;
  shell = document.createElement('div');
  shell.id = 'rh-focus-shell';
  shell.className = 'rh-focus-shell';
  shell.innerHTML = `
    <div class="rh-focus-vipBar">
      <div class="rh-focus-vipTop"><div class="rh-focus-vipSubject"><span>👑</span><span id="rh-focus-vip-subject">Botany</span></div><div class="rh-focus-topMeta"><span id="rh-focus-top-clock" class="rh-focus-topClock">--:--</span><span>VIP Mode</span></div></div>
      <div id="rh-focus-vip-timer" class="rh-focus-vipTimer">00:00:00</div>
      <div class="rh-focus-tabs">
        <button type="button" class="rh-focus-tab active" data-rh-focus-tab="timer">Timer</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="books">Books</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="insights">Insights</button>
        <button type="button" class="rh-focus-tab" data-rh-focus-tab="planner">Planner</button>
      </div>
    </div>
    <div id="rh-focus-body" class="rh-focus-body"></div>`;
  ensureGoldHeader(section)?.appendChild(shell);
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => btn.addEventListener('click', () => { appState.activeTab = btn.getAttribute('data-rh-focus-tab') || 'timer'; renderApp(section); }));
  return shell;
}

function setSubjectValue(section, subject){
  const select = section.querySelector('select');
  if(!select) return false;
  const option = Array.from(select.options || []).find(o => String(o.value||o.textContent||'').toLowerCase() === subject.toLowerCase() || String(o.textContent||'').toLowerCase() === subject.toLowerCase());
  if(!option) return false;
  select.value = option.value;
  select.dispatchEvent(new Event('change', { bubbles:true }));
  return true;
}
function startFocusForSubject(section, subject){
  setSubjectValue(section, subject);
  const startBtn = Array.from(section.querySelectorAll('button')).find(btn => /start/i.test(textOf(btn)) && !/pomodoro/i.test(textOf(btn)));
  if(startBtn) startBtn.click();
  appState.activeTab = 'timer';
  renderApp(section);
}
function quickSetDuration(section, minutes){ const input = section.querySelector('input[type="number"]'); if(input){ input.value = String(minutes); input.dispatchEvent(new Event('input', { bubbles:true })); input.dispatchEvent(new Event('change', { bubbles:true })); } }

function renderGroupPanel(){
  const members = (appState.members.length ? appState.members : FALLBACK_MEMBERS).map((m, i) => ({ ...FALLBACK_MEMBERS[i % FALLBACK_MEMBERS.length], ...m }));
  return `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>Study Group</b><span>Study together • motivate each other</span></div><span>${members.length} online</span></div><div class="rh-focus-groupGrid">${members.slice(0,8).map((m,idx)=>`<div class="rh-focus-member ${idx<3?'top':''}" style="--member-glow:${m.glow}"><div class="rh-focus-avatar">${m.icon}</div><b>${m.name}</b><span>${fmtShort(m.total_seconds || 0)}</span></div>`).join('')}</div></div>`;
}

function renderTimerTab(section, body){
  body.innerHTML = `
    <div class="rh-focus-grid">
      <div class="rh-focus-panel rh-focus-panelOrange" style="padding:18px">
        <div class="rh-focus-cardTitle"><div><b>Live Timer</b><span>Current subject and clock</span></div><span id="rh-focus-live-clock">${liveClock()}</span></div>
        <div class="rh-focus-metrics" style="margin-bottom:0">
          <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Current Subject</span><b class="rh-focus-miniValue">${selectedSubject(section)}</b><span class="rh-focus-miniMeta">Ready for focus</span></div>
          <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Current Time</span><b class="rh-focus-miniValue" id="rh-focus-clock-card">${liveClock()}</b><span class="rh-focus-miniMeta">Kitna baj raha hai abhi</span></div>
        </div>
      </div>
      <div class="rh-focus-panel" style="padding:18px">
        <div class="rh-focus-cardTitle"><div><b>Quick Actions</b><span>Fast controls</span></div><span>${currentTimerText(section)}</span></div>
        <div class="rh-focus-inlineActions"><button type="button" class="rh-focus-inlineBtn" data-rh-duration="25">25 min</button><button type="button" class="rh-focus-inlineBtn" data-rh-duration="50">50 min</button><button type="button" class="rh-focus-inlineBtn" data-rh-duration="60">1 hour</button><button type="button" class="rh-focus-inlineBtn" data-rh-quick-subject="Physics">Phy Start</button><button type="button" class="rh-focus-inlineBtn" data-rh-quick-subject="Botany">Botany</button><button type="button" class="rh-focus-inlineBtn" data-rh-quick-subject="Chemistry">Chem Start</button></div>
      </div>
    </div>
    <div style="margin-top:18px">${renderGroupPanel()}</div>`;
  body.querySelectorAll('[data-rh-duration]').forEach(btn => btn.addEventListener('click', () => quickSetDuration(section, btn.getAttribute('data-rh-duration'))));
  body.querySelectorAll('[data-rh-quick-subject]').forEach(btn => btn.addEventListener('click', () => startFocusForSubject(section, btn.getAttribute('data-rh-quick-subject') || 'Physics')));
}

function renderBooksTab(section, body){
  body.innerHTML = `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>Premium Focus Books</b><span>Direct subject start</span></div><span>${SUBJECT_CARDS.length} subjects</span></div><div class="rh-focus-booksGrid">${SUBJECT_CARDS.map(card=>`<div class="rh-focus-bookCard" style="--glow:${card.glow}"><div class="rh-focus-bookTop"><div class="rh-focus-bookIcon">${card.icon}</div><div class="rh-focus-bookTime">${card.session} min</div></div><div class="rh-focus-bookName">${card.name}</div><div class="rh-focus-bookNote">${card.note}</div><div class="rh-focus-bookFoot"><span class="rh-focus-bookTime">Premium Start</span><button type="button" class="rh-focus-bookStart" data-rh-book-subject="${card.name}" data-rh-book-minutes="${card.session}">Start Now</button></div></div>`).join('')}</div></div>`;
  body.querySelectorAll('[data-rh-book-subject]').forEach(btn => btn.addEventListener('click', () => { const subject = btn.getAttribute('data-rh-book-subject') || 'Physics'; const minutes = parseInt(btn.getAttribute('data-rh-book-minutes') || '50',10) || 50; quickSetDuration(section, minutes); startFocusForSubject(section, subject); }));
}

function renderInsightsTab(body){
  const members = (appState.members.length ? appState.members : FALLBACK_MEMBERS).map((m, i) => ({ ...FALLBACK_MEMBERS[i % FALLBACK_MEMBERS.length], ...m }));
  const max = Math.max(...members.map(m => Number(m.total_seconds || 0)),1);
  body.innerHTML = `
    <div class="rh-focus-metrics">
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Daily Goal</span><b class="rh-focus-miniValue">${appState.dailyGoal}</b><span class="rh-focus-miniMeta">Today's study time</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Your Rank</span><b class="rh-focus-miniValue">${appState.rank}</b><span class="rh-focus-miniMeta">Live leaderboard standing</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">3-Day Focus</span><b class="rh-focus-miniValue">${appState.focus3day}</b><span class="rh-focus-miniMeta">${appState.nextText}</span></div>
      <div class="rh-focus-mini"><span class="rh-focus-miniLabel">Study Together</span><b class="rh-focus-miniValue">${members.length}</b><span class="rh-focus-miniMeta">Active focus members</span></div>
    </div>
    <div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>All Users Hours Graph</b><span>Sabhi users ka focus hours</span></div><span>${members.length} users</span></div><div class="rh-focus-graphList">${members.map(m=>{const sec=Number(m.total_seconds||0);const pct=Math.max(8,Math.round((sec/max)*100));return `<div class="rh-focus-graphRow"><div class="rh-focus-graphName">${m.name||'Member'}</div><div class="rh-focus-graphTrack"><div class="rh-focus-graphBar" style="width:${pct}%"></div></div><div class="rh-focus-graphValue">${fmtHours(sec)}</div></div>`}).join('')}</div></div>`;
}

function bindPlannerActions(section, body){
  const input = body.querySelector('#rh-focus-planner-input');
  const addBtn = body.querySelector('#rh-focus-planner-add');
  const renderList = () => renderPlannerTab(section, body);
  addBtn?.addEventListener('click', () => {
    const value = String(input?.value || '').trim();
    if(!value) return;
    const tasks = plannerStore();
    tasks.unshift({ id: Date.now().toString(36), text:value, done:false, subject:selectedSubject(section), date:new Date().toISOString().slice(0,10) });
    savePlanner(tasks);
    renderList();
  });
  body.querySelectorAll('[data-rh-task-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-rh-task-toggle');
    const tasks = plannerStore().map(t => t.id === id ? { ...t, done: !t.done } : t);
    savePlanner(tasks); renderList();
  }));
  body.querySelectorAll('[data-rh-task-delete]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-rh-task-delete');
    savePlanner(plannerStore().filter(t => t.id !== id)); renderList();
  }));
}
function renderPlannerTab(section, body){
  const subject = selectedSubject(section);
  const date = new Date().toISOString().slice(0,10);
  const tasks = plannerStore().filter(t => t.date === date);
  body.innerHTML = `<div class="rh-focus-panel" style="padding:18px"><div class="rh-focus-cardTitle"><div><b>${subject}</b><span>Planner</span></div><span>${currentTimerText(section)}</span></div><div class="rh-focus-plannerInput"><input id="rh-focus-planner-input" type="text" placeholder="Aaj kya karna hai? likho..."><button id="rh-focus-planner-add" type="button">Add Task</button></div><div class="rh-focus-planList">${tasks.length?tasks.map((t,i)=>`<div class="rh-focus-planRow"><div class="rh-focus-planLeft"><div class="rh-focus-planDot">${i+1}</div><div><div class="rh-focus-planTitle ${t.done?'rh-focus-taskDone':''}">${t.text}</div><span class="rh-focus-planSub">${t.subject || subject}</span></div></div><div class="rh-focus-taskActions"><button type="button" class="rh-focus-taskChip" data-rh-task-toggle="${t.id}">${t.done?'Undo':'Done'}</button><button type="button" class="rh-focus-taskChip" data-rh-task-delete="${t.id}">Delete</button></div></div>`).join(''):'<div class="rh-focus-planRow"><div class="rh-focus-planLeft"><div class="rh-focus-planDot">+</div><div><div class="rh-focus-planTitle">No task added yet</div><span class="rh-focus-planSub">Aaj kya karna hai yaha add karo</span></div></div></div>'}</div></div>`;
  bindPlannerActions(section, body);
}

function renderApp(section){
  const shell = ensureShell(section); if(!shell) return;
  const subject = selectedSubject(section); const timer = currentTimerText(section);
  shell.querySelector('#rh-focus-vip-subject').textContent = `${subject} • ${todayLabel()}`;
  shell.querySelector('#rh-focus-vip-timer').textContent = timer;
  shell.querySelector('#rh-focus-top-clock').textContent = liveClock();
  shell.querySelectorAll('[data-rh-focus-tab]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-rh-focus-tab') === appState.activeTab));
  const body = shell.querySelector('#rh-focus-body'); if(!body) return;
  if(appState.activeTab === 'books') renderBooksTab(section, body);
  else if(appState.activeTab === 'insights') renderInsightsTab(body);
  else if(appState.activeTab === 'planner') renderPlannerTab(section, body);
  else renderTimerTab(section, body);
}

async function loadData(section){
  if(appState.loading) return;
  const client = db(); if(!client || !uid()) return;
  appState.loading = true;
  try{
    const [boardRes, statusRes] = await Promise.all([client.rpc('get_ypt_focus_leaderboard',{ p_limit: 12 }),client.rpc('get_focus_avatar_status')]);
    const rows = Array.isArray(boardRes?.data) ? boardRes.data : [];
    const mine = rows.find(x => String(x.user_id) === uid());
    const raw = Array.isArray(statusRes?.data) ? statusRes.data[0] : (statusRes?.data || {});
    const totalSeconds = Number(raw.total_seconds || 0);
    const avatars = Array.isArray(raw.avatars) ? raw.avatars : [];
    const next = avatars.find(x => !x.unlocked);
    const todayCard = findStats(section).today;
    appState.rank = mine ? `#${mine.rank}` : '—';
    appState.focus3day = fmtShort(totalSeconds);
    appState.nextText = next ? `Next unlock • ${Number(next.target_hours || 0)}h target` : 'All VIP avatars unlocked';
    appState.members = rows.map((r,i) => ({ name:r.name || 'Aspirant', total_seconds:Number(r.total_seconds || 0), icon:FALLBACK_MEMBERS[i % FALLBACK_MEMBERS.length].icon, glow:FALLBACK_MEMBERS[i % FALLBACK_MEMBERS.length].glow }));
    appState.dailyGoal = textOf(todayCard?.querySelector('b')) || appState.dailyGoal;
  }catch(e){ console.warn('focus vip load skipped', e); }
  finally{ appState.loading = false; renderApp(section); }
}

function bindSubject(section){ const sel=section.querySelector('select'); if(!sel||sel.dataset.boundVip) return; sel.dataset.boundVip='1'; sel.addEventListener('change',()=>renderApp(section)); }
function hideUnused(section){ const stats=findStats(section); if(stats.streak) stats.streak.classList.add('rh-focus-hidden'); if(stats.sessions) stats.sessions.classList.add('rh-focus-hidden'); }
function softRefresh(){ const section = findSection(); if(!section) return; bindSubject(section); hideUnused(section); premiumizeSourcePanels(section); loadData(section); }

function boot(){
  ensureStyle();
  const section = findSection(); if(!section) return;
  ensureGoldHeader(section); ensureShell(section); bindSubject(section); hideUnused(section); premiumizeSourcePanels(section); renderApp(section); loadData(section);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1200), { once:true }); else setTimeout(boot, 1200);
setInterval(() => { if(document.visibilityState !== 'hidden') softRefresh(); }, 15000);
setInterval(() => { document.getElementById('rh-focus-top-clock') && (document.getElementById('rh-focus-top-clock').textContent = liveClock()); document.getElementById('rh-focus-clock-card') && (document.getElementById('rh-focus-clock-card').textContent = liveClock()); document.getElementById('rh-focus-live-clock') && (document.getElementById('rh-focus-live-clock').textContent = liveClock()); }, 1000);
})();
