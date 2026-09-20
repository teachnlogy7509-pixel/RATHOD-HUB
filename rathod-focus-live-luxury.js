/* RATHOD HUB focus live luxury sync */
(function(){
'use strict';
if(window.__RH_FOCUS_LIVE_LUXURY__) return;
window.__RH_FOCUS_LIVE_LUXURY__ = 1;

const state = { members: [], running:false, baseSeconds:null, baseAt:0, lastShown:null, observer:null };
const db = () => { try { return window.db || null; } catch(e){ return null; } };
const textOf = el => String(el?.textContent || '').trim();
const section = () => document.getElementById('section-focus');
const fmtShort = sec => { sec = Math.max(0, Number(sec)||0); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h ? `${h}h ${m}m` : `${m}m`; };
const fmtHours = sec => `${(Math.max(0, Number(sec)||0)/3600).toFixed(1)}h`;
const initials = name => String(name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const parseTimer = text => { const m = String(text||'').match(/^(\d{2}):(\d{2}):(\d{2})$/); return m ? Number(m[1])*3600 + Number(m[2])*60 + Number(m[3]) : null; };
const formatTimer = total => { total = Math.max(0, Number(total)||0); const h=String(Math.floor(total/3600)).padStart(2,'0'); const m=String(Math.floor((total%3600)/60)).padStart(2,'0'); const s=String(total%60).padStart(2,'0'); return `${h}:${m}:${s}`; };

function injectStyle(){
  if(document.getElementById('rh-focus-live-luxury-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-live-luxury-style';
  style.textContent = `
    #section-focus .rh-focus-shell{border:1px solid rgba(232,204,122,.30)!important;background:linear-gradient(180deg,rgba(24,20,15,.94),rgba(10,10,10,.92))!important;box-shadow:0 28px 70px rgba(0,0,0,.35),0 0 0 1px rgba(232,204,122,.08) inset!important}
    #section-focus .rh-focus-vipBar{background:linear-gradient(135deg,#22180e 0%,#4a3620 38%,#876229 70%,#e2bd67 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 20px 48px rgba(226,189,103,.14)!important}
    #section-focus .rh-focus-body{background:linear-gradient(180deg,rgba(18,16,13,.96),rgba(10,10,10,.94))!important}
    #section-focus .rh-focus-gold-chip{border-color:rgba(232,204,122,.34)!important;background:linear-gradient(90deg,rgba(232,204,122,.18),rgba(255,255,255,.04))!important;color:#f7e7b6!important}
    #section-focus .rh-focus-sourceTimer,#section-focus .rh-focus-sourceControl,#section-focus .rh-focus-panel,#section-focus .rh-focus-bookCard,#section-focus .rh-focus-mini,#section-focus .rh-focus-member,#section-focus .rh-focus-planRow,#section-focus .rh-focus-luxe-card,#section-focus .rh-focus-achievement-card{border:1px solid rgba(232,204,122,.18)!important;background:linear-gradient(180deg,rgba(23,19,14,.96),rgba(12,11,10,.94))!important;box-shadow:0 18px 42px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.04)!important}
    #section-focus .rh-focus-panelOrange{background:radial-gradient(circle at top,rgba(226,189,103,.10),transparent 36%),linear-gradient(180deg,rgba(18,16,13,.96),rgba(13,15,22,.94))!important;border-color:rgba(232,204,122,.26)!important}
    #section-focus .rh-focus-inlineBtn,#section-focus .rh-focus-softBtn,#section-focus .rh-focus-tab,#section-focus .rh-focus-taskChip{background:rgba(247,231,182,.06)!important;border:1px solid rgba(232,204,122,.20)!important;color:#f7e7b6!important}
    #section-focus .rh-focus-tab.active{background:linear-gradient(90deg,rgba(204,162,80,.28),rgba(232,204,122,.14))!important;border-color:rgba(232,204,122,.36)!important}
    #section-focus .rh-focus-bookStart,#section-focus .rh-focus-startBtn,#section-focus .rh-focus-plannerInput button,#section-focus .rh-luxury-primary{background:linear-gradient(90deg,#a6772c,#e9c569)!important;border:1px solid rgba(255,243,196,.18)!important;color:#23170a!important;box-shadow:0 14px 28px rgba(233,197,105,.20)!important}
    #section-focus .rh-focus-graphBar{background:linear-gradient(90deg,#a6772c,#e9c569)!important;box-shadow:0 0 16px rgba(233,197,105,.18)!important}
    #section-focus .rh-focus-miniLabel,#section-focus .rh-focus-member span,#section-focus .rh-focus-graphValue,#section-focus .rh-focus-bookTime,#section-focus .rh-focus-topClock{color:#f4ddb0!important}
    #section-focus .rh-focus-luxury-number{background:linear-gradient(180deg,#fff6dd,#f0cf7a 48%,#c9962d)!important;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}
    #section-focus .rh-focus-empty{display:grid;place-items:center;min-height:120px;border-radius:20px;color:#bfa56c;background:linear-gradient(180deg,rgba(23,19,14,.96),rgba(12,11,10,.94));border:1px solid rgba(232,204,122,.14)}
    #section-focus .rh-focus-member .rh-focus-avatar{background:linear-gradient(135deg,#c68f30,#f0cf7a)!important;color:#23170a!important}
  `;
  document.head.appendChild(style);
}

async function loadMembers(){
  const client = db();
  if(!client) return;
  try{
    const res = await client.rpc('get_ypt_focus_leaderboard',{ p_limit: 8 });
    state.members = Array.isArray(res?.data) ? res.data.map(r => ({ name: r.name || 'Member', total_seconds: Number(r.total_seconds || 0), rank: r.rank })) : [];
  }catch(e){}
}

function findSourceTimer(root){
  const explicit = root.querySelector('#focus-timer-display');
  if(explicit && /^\d{2}:\d{2}:\d{2}$/.test(textOf(explicit))) return explicit;
  const candidates = Array.from(root.querySelectorAll('*')).filter(el => /^\d{2}:\d{2}:\d{2}$/.test(textOf(el)) && !el.closest('#rh-focus-shell'));
  candidates.sort((a,b) => (parseFloat(getComputedStyle(b).fontSize)||0) - (parseFloat(getComputedStyle(a).fontSize)||0));
  return candidates[0] || null;
}

function vipTimer(){ return document.getElementById('rh-focus-vip-timer'); }
function setDisplayText(root, text){
  const vip = vipTimer();
  if(vip && vip.textContent !== text) vip.textContent = text;
  const source = findSourceTimer(root);
  if(source && textOf(source) !== text) source.textContent = text;
  window.__RH_FOCUS_VIP_LIVE_TEXT__ = text;
}
function currentDerivedSeconds(){
  if(state.baseSeconds == null) return null;
  if(!state.running) return state.baseSeconds;
  const elapsed = Math.floor((Date.now() - state.baseAt) / 1000);
  return Math.max(0, state.baseSeconds - elapsed);
}
function syncToSeconds(root, secs, preserveRun){
  if(secs == null) return;
  state.baseSeconds = secs;
  state.baseAt = Date.now();
  if(!preserveRun) state.running = false;
  const text = formatTimer(secs);
  state.lastShown = text;
  setDisplayText(root, text);
}
function syncFromSource(root, preserveRun){
  const source = findSourceTimer(root);
  const secs = parseTimer(textOf(source));
  if(secs == null) return;
  const current = currentDerivedSeconds();
  if(current == null || Math.abs(current - secs) > 1 || !state.running) syncToSeconds(root, secs, !!preserveRun);
}
function styleSource(root){ const source = findSourceTimer(root); if(source) source.classList.add('rh-focus-luxury-number'); const vip = vipTimer(); if(vip) vip.classList.add('rh-focus-luxury-number'); }
function startRunning(root){ syncFromSource(root, true); state.running = true; state.baseAt = Date.now(); }
function stopRunning(root){ state.running = false; setTimeout(() => syncFromSource(root, false), 120); }

function bindButtons(root){
  root.querySelectorAll('button').forEach(btn => {
    if(btn.dataset.rhLiveBound) return;
    btn.dataset.rhLiveBound = '1';
    const t = textOf(btn).toLowerCase();
    btn.addEventListener('click', () => {
      if(/start|pomodoro/.test(t)) setTimeout(() => startRunning(root), 80);
      if(/stop|pause/.test(t)) stopRunning(root);
      if(/reset/.test(t)) { state.running = false; setTimeout(() => syncFromSource(root, false), 80); }
    });
  });
}

function observeSourceTimer(root){
  const source = findSourceTimer(root);
  if(!source || source.dataset.rhObserved) return;
  source.dataset.rhObserved = '1';
  state.observer?.disconnect?.();
  state.observer = new MutationObserver(() => syncFromSource(root, state.running));
  state.observer.observe(source, { childList:true, subtree:true, characterData:true });
}

function renderLoop(){
  const root = section();
  const secs = currentDerivedSeconds();
  if(root && secs != null){
    const text = formatTimer(secs);
    if(text !== state.lastShown){
      state.lastShown = text;
      setDisplayText(root, text);
      if(secs <= 0) state.running = false;
    }
  }
  requestAnimationFrame(renderLoop);
}

function styleButtons(root){
  root.querySelectorAll('button').forEach(btn => {
    const t = textOf(btn).toLowerCase();
    if(/start|pomodoro/.test(t)) btn.classList.add('rh-luxury-primary');
    if(/stop|pause/.test(t)){
      btn.style.background = 'linear-gradient(90deg,#8d6929,#d9b459)';
      btn.style.color = '#20160a';
      btn.style.border = '1px solid rgba(255,243,196,.16)';
      btn.style.boxShadow = '0 12px 24px rgba(217,180,89,.18)';
    }
  });
}

function updateStudyGroup(root){
  const panel = Array.from(root.querySelectorAll('.rh-focus-panel')).find(el => /Study Group/i.test(textOf(el)));
  if(!panel) return;
  const grid = panel.querySelector('.rh-focus-groupGrid');
  if(!grid) return;
  if(!state.members.length){ grid.innerHTML = '<div class="rh-focus-empty">No live members yet</div>'; return; }
  grid.innerHTML = state.members.map((m,idx)=>`<div class="rh-focus-member ${idx<3?'top':''}"><div class="rh-focus-avatar">${initials(m.name)}</div><b>${m.name}</b><span>${fmtShort(m.total_seconds)}</span></div>`).join('');
  const count = Array.from(panel.querySelectorAll('span')).find(el => /online/i.test(textOf(el)));
  if(count) count.textContent = `${state.members.length} online`;
}

function updateGraph(root){
  const panel = Array.from(root.querySelectorAll('.rh-focus-panel')).find(el => /All Users Hours Graph/i.test(textOf(el)));
  if(!panel) return;
  const list = panel.querySelector('.rh-focus-graphList');
  if(!list) return;
  if(!state.members.length){ list.innerHTML = '<div class="rh-focus-empty">No leaderboard data yet</div>'; return; }
  const max = Math.max(...state.members.map(m => m.total_seconds),1);
  list.innerHTML = state.members.map(m => { const pct = Math.max(8, Math.round((m.total_seconds/max)*100)); return `<div class="rh-focus-graphRow"><div class="rh-focus-graphName">${m.name}</div><div class="rh-focus-graphTrack"><div class="rh-focus-graphBar" style="width:${pct}%"></div></div><div class="rh-focus-graphValue">${fmtHours(m.total_seconds)}</div></div>`; }).join('');
  const users = Array.from(panel.querySelectorAll('span')).find(el => /users/i.test(textOf(el)));
  if(users) users.textContent = `${state.members.length} users`;
}

function polishCards(root){
  Array.from(root.querySelectorAll('div')).forEach(el => {
    const txt = textOf(el);
    if(/Who's Studying\?|Last 7 Days|Achievements/i.test(txt) && /rounded|border/.test(String(el.className||''))) el.classList.add('rh-focus-luxe-card');
    if(/First Session|1 Hour|7 Day Streak|10 Hours|25 Sessions|25 Hours|50 Sessions|50 Hour Club/i.test(txt) && /rounded|border/.test(String(el.className||''))) el.classList.add('rh-focus-achievement-card');
  });
}

function run(){
  injectStyle();
  const root = section();
  if(!root) return;
  bindButtons(root);
  observeSourceTimer(root);
  syncFromSource(root, state.running);
  styleSource(root);
  styleButtons(root);
  updateStudyGroup(root);
  updateGraph(root);
  polishCards(root);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { setTimeout(run, 1000); setTimeout(loadMembers, 1200); }, { once:true });
else { setTimeout(run, 1000); setTimeout(loadMembers, 1200); }
setInterval(run, 1200);
setInterval(loadMembers, 15000);
requestAnimationFrame(renderLoop);
})();
