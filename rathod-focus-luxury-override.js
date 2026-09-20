/* Luxury override for focus timer, stats, achievements, and live sync */
(function(){
'use strict';
if(window.__RH_FOCUS_LUXURY_OVERRIDE__) return;
window.__RH_FOCUS_LUXURY_OVERRIDE__ = 1;

function injectStyle(){
  if(document.getElementById('rh-focus-luxury-override-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-focus-luxury-override-style';
  style.textContent = `
    #section-focus{position:relative}
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
    #section-focus .rh-focus-luxury-number{background:linear-gradient(180deg,#fff6dd,#f0cf7a 48%,#c9962d)!important;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important;text-shadow:none!important}
    #section-focus .rh-focus-luxe-card{border-radius:24px!important;backdrop-filter:blur(12px)!important}
    #section-focus .rh-focus-achievement-card{border-radius:20px!important}
  `;
  document.head.appendChild(style);
}

function textOf(el){ return String(el?.textContent || '').trim(); }
function section(){ return document.getElementById('section-focus'); }
function timerText(root){
  const el = Array.from(root.querySelectorAll('*')).find(node => /^\d{2}:\d{2}:\d{2}$/.test(textOf(node)));
  return el ? textOf(el) : null;
}

function styleTimerDisplays(root){
  const timerEls = Array.from(root.querySelectorAll('*')).filter(node => /^\d{2}:\d{2}:\d{2}$/.test(textOf(node)) || node.id === 'focus-timer-display');
  timerEls.forEach(el => {
    el.classList.add('rh-focus-luxury-number');
    el.style.fontWeight = '900';
    el.style.letterSpacing = '.04em';
  });
  root.querySelectorAll('[class*="text-red"], .text-red-500, .text-red-400').forEach(el => {
    if(/\d{2}:\d{2}:\d{2}/.test(textOf(el)) || el.id === 'focus-timer-display'){
      el.classList.add('rh-focus-luxury-number');
      el.style.color = 'transparent';
      el.style.webkitTextFillColor = 'transparent';
    }
  });
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

function syncVipTimer(root){
  const vip = document.getElementById('rh-focus-vip-timer');
  const source = timerText(root);
  if(vip && source) vip.textContent = source;
}

function luxePanels(root){
  Array.from(root.querySelectorAll('div,section')).forEach(el => {
    const txt = textOf(el);
    if(/Who's Studying\?|Last 7 Days|Achievements/i.test(txt) && /rounded|border/.test(String(el.className||''))) el.classList.add('rh-focus-luxe-card');
    if(/UNLOCKED/i.test(txt) && /rounded|border/.test(String(el.className||''))) el.classList.add('rh-focus-achievement-card');
  });
}

function run(){
  injectStyle();
  const root = section();
  if(!root) return;
  syncVipTimer(root);
  styleTimerDisplays(root);
  styleButtons(root);
  luxePanels(root);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(run, 900), { once:true });
else setTimeout(run, 900);
setInterval(run, 1000);
})();
