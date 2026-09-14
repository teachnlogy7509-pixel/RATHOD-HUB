/**
 * RATHOD HUB - ULTRA-PREMIUM MOBILE APP INTERACTIVITY & ANIMATION ENGINE
 * Powers smooth screen transitions, animated counters, celebration confetti,
 * splash screen dismissal, and touch spring micro-interactions.
 */

(function () {
  'use strict';

  // 1. Dismiss Splash Screen Gracefully
  function initSplashDismissal() {
    const splash = document.getElementById('rh-splash-screen');
    if (!splash) return;

    setTimeout(() => {
      splash.classList.add('rh-splash-fade-out');
      setTimeout(() => {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 500);
    }, 1500);
  }

  // 2. Animated Number Counters (for XP, Streaks, Questions)
  function animateValue(element, start, end, duration, prefix = '', suffix = '') {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeProgress * (end - start) + start);
      element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  // 3. Trigger Confetti Celebration
  window.triggerRhCelebration = function () {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#ef2b2b', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 60; i++) particles.push({x:canvas.width/2,y:canvas.height/2,vx:(Math.random()-.5)*16,vy:(Math.random()-.7)*18,size:Math.random()*8+4,color:colors[Math.floor(Math.random()*colors.length)],rotation:Math.random()*360,vRot:(Math.random()-.5)*10,opacity:1});
    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.rotation += p.vRot; p.opacity -= 0.015;
        if (p.opacity > 0) { alive = true; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate((p.rotation*Math.PI)/180); ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,p.opacity); ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); ctx.restore(); }
      });
      frame++;
      if (alive && frame < 90) requestAnimationFrame(render); else if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    requestAnimationFrame(render);
  };

  // 4. Hook Tab Switcher for Smooth Transitions, Dock Active State & Counter Animation
  function hookTabAnimations() {
    if (window._rhTabHooked) return;
    window._rhTabHooked = true;
    function updateDockActive(tab) {
      const mapping = { home: 'mob-home', materials: 'mob-materials', focus: 'mob-focus', chatroom: 'mob-chat' };
      const activeId = mapping[tab];
      document.querySelectorAll('.rh-dock-item').forEach((item) => item.classList.toggle('rh-active', !!activeId && item.id === activeId));
    }
    const originalSwitchTab = window.switchTab;
    if (typeof originalSwitchTab === 'function') {
      window.switchTab = function (tab) {
        originalSwitchTab(tab); updateDockActive(tab);
        try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); document.documentElement.scrollTop=0; document.body.scrollTop=0; const appEl=document.getElementById('app'); if(appEl)appEl.scrollTop=0; const contentEl=document.querySelector('.rh-content'); if(contentEl)contentEl.scrollTop=0; } catch (_) {}
        if (tab === 'home') setTimeout(() => { const xpEl=document.getElementById('home-xp'); if (xpEl && xpEl.textContent) { const val=parseInt(xpEl.textContent.replace(/[^\d]/g,''),10)||0; if(val>0) animateValue(xpEl,0,val,600,'',' XP'); } },150);
      };
    }
  }

  // 5. Lightweight Ultra VIP polish
  function initVipExperience() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function enhance(root = document) {
      const hero = root.querySelector?.('.rh-home-hero');
      if (hero && !hero.dataset.vipReady) {
        hero.dataset.vipReady = '1'; hero.classList.add('rh-vip-hero');
        const kicker = hero.querySelector('.rh-hero-kicker');
        if (kicker && !hero.querySelector('.rh-vip-chip')) { const chip=document.createElement('div'); chip.className='rh-vip-chip'; chip.innerHTML='<span>◆</span> RATHOD ELITE EXPERIENCE'; kicker.before(chip); }
        if (!reduceMotion) { const field=document.createElement('div'); field.className='rh-vip-particles'; field.setAttribute('aria-hidden','true'); field.innerHTML=Array.from({length:5},(_,i)=>`<i style="--i:${i}"></i>`).join(''); hero.prepend(field); }
      }
      root.querySelectorAll?.('.rh-metric-capsule,.rh-subject-chip,.rh-feature,.rh-rail-card,.rh-featured-action-card,.qb-card,#study-rooms-box > div').forEach((card) => {
        if (card.dataset.vipCard) return; card.dataset.vipCard='1'; card.classList.add('rh-vip-card');
        if (finePointer) card.addEventListener('pointermove',(e)=>{ const r=card.getBoundingClientRect(); card.style.setProperty('--mx',`${e.clientX-r.left}px`); card.style.setProperty('--my',`${e.clientY-r.top}px`); },{passive:true});
      });
    }
    enhance(); let queued=false;
    const observer=new MutationObserver(()=>{ if(queued)return; queued=true; requestAnimationFrame(()=>{queued=false; enhance();}); });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { initSplashDismissal(); hookTabAnimations(); initVipExperience(); });
  else { initSplashDismissal(); hookTabAnimations(); initVipExperience(); }
})();

/* RATHOD HUB safe UI routing + Community collection profile patch. No feature deleted. */
(function(){
  if(window._rhCommunityCollectionPatch)return; window._rhCommunityCollectionPatch=true;
  function $(id){return document.getElementById(id)}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function isAdmin(){return window.profile&&window.profile.role==='admin'}
  function hide(el){if(el)el.style.display='none'} function show(el){if(el)el.style.display=''}
  function badgeInfo(id){let b=(window.badgeCatalog||[]).find(x=>String(x.badge_id)===String(id));return b||{badge_id:id,icon:'🏅',name:id,tier:'Badge'}}
  async function badgeData(uid){let out={badges:[],reward:null}; if(!window.db||!uid)return out; try{let now=new Date().toISOString();let r=await Promise.all([db.from('user_badges').select('badge_id,equipped,earned_at').eq('user_id',uid),db.from('league_rewards').select('council_role,badge,name_color,access_expires_at').eq('user_id',uid).gt('access_expires_at',now).order('created_at',{ascending:false}).limit(1).maybeSingle()]);out.badges=r[0].data||[];out.reward=r[1].data||null}catch(e){out.error=e.message||String(e)} return out}
  window.openCommunityCollectionProfile=async function(uid){
    let p=(window.people||[]).find(x=>String(x.id)===String(uid))||{id:uid,name:'Student'}; let d=await badgeData(uid); let badges=d.badges.map(x=>Object.assign({},badgeInfo(x.badge_id),x));
    let modal=$('rh-community-collection-modal'); if(!modal){modal=document.createElement('div');modal.id='rh-community-collection-modal';modal.className='fixed inset-0 z-[9999] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-md';document.body.appendChild(modal)}
    modal.innerHTML=`<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-slate-950 p-5 shadow-2xl"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><div class="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">${p.pfp_url?`<img src="${esc(p.pfp_url)}" class="h-full w-full object-cover">`:'<div class="grid h-full place-items-center text-2xl">👤</div>'}</div><div><div class="font-black text-lg">${esc(p.name||'Student')} ${d.reward?'<span class="text-sky-400">✓</span>':''}</div><div class="text-[10px] text-slate-500">Public Badge Collection</div></div></div><button onclick="document.getElementById('rh-community-collection-modal').classList.add('hidden')" class="rounded-xl bg-slate-800 px-3 py-2 text-xs">✕</button></div><div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-black/30 p-3"><b class="block text-amber-300">${esc(p.xp||p.season_xp||0)}</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-cyan-300">Level ${esc(p.level||p.league_level||1)}</b><span class="text-[8px] text-slate-500">Level</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-violet-300">${badges.length}</b><span class="text-[8px] text-slate-500">Badges</span></div></div>${d.reward?`<div class="mt-3 rounded-full bg-sky-500/10 px-3 py-2 text-center text-xs font-black text-sky-300">${esc(d.reward.badge||'League Badge')}</div>`:''}<h4 class="mt-5 text-sm font-black text-amber-300">🏅 All Badges</h4><div class="mt-3 grid grid-cols-2 gap-2">${badges.length?badges.map(b=>`<div class="rounded-2xl border ${b.equipped?'border-amber-400/50':'border-slate-800'} bg-slate-900/80 p-3"><div class="text-2xl">${esc(b.icon)}</div><b class="mt-1 block text-xs">${esc(b.name)}</b><span class="text-[9px] text-slate-500">${esc(b.tier||'Badge')}${b.equipped?' • Name badge':''}</span></div>`).join(''):'<div class="col-span-2 rounded-2xl bg-slate-900 p-4 text-center text-xs text-slate-500">Abhi koi badge nahi.</div>'}</div>${d.error?`<div class="mt-3 text-xs text-amber-300">Badge data load issue: ${esc(d.error)}</div>`:''}</div>`;
    modal.classList.remove('hidden'); modal.classList.add('flex');
  };
  function enhancePeople(){document.querySelectorAll('#people-box > div').forEach((card,i)=>{if(card.dataset.rhProfileClick)return;let p=(window.people||[])[i];if(!p)return;card.dataset.rhProfileClick='1';card.style.cursor='pointer';card.title='Profile / Badge Collection';let b=card.querySelector('b');if(b&&!b.dataset.badgeAdded){b.dataset.badgeAdded='1';b.innerHTML=b.innerHTML+' <span class="text-amber-300">🏅</span>'}card.addEventListener('click',e=>{if(e.target.closest('button'))return;window.openCommunityCollectionProfile(p.id)})})}
  function apply(){hide($('coupon-access-card'));hide($('btn-studypower'));hide(document.querySelector(".rh-feature[onclick=\"switchTab('studypower')\"]"));let a=$('btn-aitutor');if(a)a.setAttribute('onclick',"switchTab('ai')");let q=$('btn-quiz');if(q)q.setAttribute('onclick',"switchTab('neet720')");let f=document.querySelector(".rh-feature[onclick=\"switchTab('quiz')\"]");if(f)f.setAttribute('onclick',"switchTab('neet720')");let pdf=$('pdf-quiz-form'),panel=pdf&&pdf.closest('.qb-card,.rounded-3xl,.rounded-2xl,div');if(panel){if(isAdmin()){let host=$('admin-controls-host')||$('section-adminpanel');if(host&&!$('admin-pdf-quiz-host')){let w=document.createElement('div');w.id='admin-pdf-quiz-host';w.className='space-y-3';w.appendChild(panel);host.appendChild(w)}show(panel)}else hide(panel)}enhancePeople()}
  let old=window.switchTab; window.switchTab=function(tab){if(tab==='aitutor')tab='ai';if(tab==='quiz')tab='neet720';if(tab==='studypower')tab='home';let r=old?old.call(this,tab):undefined;setTimeout(apply,150);setTimeout(enhancePeople,500);return r};
  let rp=window.renderPeople;if(typeof rp==='function')window.renderPeople=function(){let r=rp.apply(this,arguments);setTimeout(enhancePeople,100);return r};
  setInterval(apply,1200); if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
