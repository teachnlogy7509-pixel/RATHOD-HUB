/* RATHOD HUB SAFE UI FIX v7
   Stable PFP for Google Drive links, no duplicate badges, Community + Live Chat profile view.
   Runs after app boot; no features deleted. */
(function () {
  'use strict';
  if (window.__RH_SAFE_UI_FIX_V7__) return;
  window.__RH_SAFE_UI_FIX_V7__ = true;

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
  function cleanName(v){ return String(v||'Member').replace(/[🏅🥇🥈🥉👑✅✓🎖️⭐]+/g,'').replace(/\s+/g,' ').trim() || 'Member'; }
  function hide(el){ if(el) el.style.setProperty('display','none','important'); }
  function isAdmin(){ return !!(window.profile && window.profile.role === 'admin'); }
  function removeSplash(){ var s=$('rh-splash-screen'); if(!s)return; s.style.opacity='0'; s.style.pointerEvents='none'; setTimeout(function(){ if(s&&s.parentNode)s.parentNode.removeChild(s); },250); }
  window.triggerRhCelebration = window.triggerRhCelebration || function(){};

  function driveImg(url){
    url=String(url||'').trim(); if(!url) return '';
    var id='';
    try{
      var m=url.match(/drive\.google\.com\/(?:file\/d\/|thumbnail\?id=|uc\?[^#]*?id=)([A-Za-z0-9_-]{10,})/i) || url.match(/[?&]id=([A-Za-z0-9_-]{10,})/i);
      if(m&&m[1]) id=m[1];
    }catch(e){}
    return id ? 'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w256' : url;
  }
  function avatarHtml(p, cls){
    var u=driveImg(p&&p.pfp_url);
    return u ? '<img src="'+esc(u)+'" class="'+cls+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.outerHTML=\'<div class=&quot;grid h-full w-full place-items-center&quot;>👤</div>\'">' : '<div class="grid h-full w-full place-items-center">👤</div>';
  }

  var profiles=[], byId=new Map(), byName=new Map(), badges=new Map(), catalog=new Map(), loading=false;
  async function loadData(){
    if(!window.db||loading) return; loading=true;
    try{
      var pr=await db.from('profiles').select('id,name,pfp_url,role,xp,level').limit(1000);
      profiles=pr.data||[]; byId=new Map(); byName=new Map();
      profiles.forEach(function(p){ byId.set(String(p.id),p); byName.set(cleanName(p.name).toLowerCase(),p); });
      if(window.user&&window.profile) { byId.set(String(window.user.id), Object.assign({}, byId.get(String(window.user.id))||{}, window.profile)); byName.set(cleanName(window.profile.name).toLowerCase(), Object.assign({}, byId.get(String(window.user.id))||{}, window.profile)); }
      var ids=[...byId.keys()];
      if(ids.length){
        var rr=await Promise.all([db.from('badge_catalog').select('badge_id,name,icon,tier').limit(300), db.from('user_badges').select('user_id,badge_id,equipped,earned_at').in('user_id',ids)]);
        catalog=new Map((rr[0].data||[]).map(function(b){return [String(b.badge_id),b];})); badges=new Map();
        (rr[1].data||[]).forEach(function(b){var k=String(b.user_id),a=badges.get(k)||[];a.push(b);badges.set(k,a);});
      }
    }catch(e){ console.warn('RH profile load skipped', e&&e.message?e.message:e); }
    loading=false;
  }
  function profileByIdOrName(uid,name){ return byId.get(String(uid||'')) || byName.get(cleanName(name).toLowerCase()) || null; }
  function badgeInfo(id){ return catalog.get(String(id)) || {icon:'🏅',name:id||'Badge',tier:'Badge'}; }
  function nameBadges(uid,name){
    var p=profileByIdOrName(uid,name), id=uid || (p&&p.id), arr=badges.get(String(id||''))||[];
    var icons=arr.filter(function(b){return !!b.equipped;}).slice(0,5).map(function(b){return esc(badgeInfo(b.badge_id).icon);}).join('');
    return esc(cleanName((p&&p.name)||name))+' <span class="text-amber-300" title="Badges">'+(icons||'🏅')+'</span>';
  }

  window.openCommunityCollectionProfile=async function(uidOrName){
    await loadData(); var p=profileByIdOrName(uidOrName,uidOrName)||{id:uidOrName,name:uidOrName||'Student',xp:0,level:1}; var uid=String(p.id||uidOrName);
    var arr=(badges.get(uid)||[]).map(function(b){return Object.assign({},badgeInfo(b.badge_id),b);});
    var modal=$('rh-community-collection-modal'); if(!modal){modal=document.createElement('div');modal.id='rh-community-collection-modal';modal.className='fixed inset-0 z-[9999] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-md';document.body.appendChild(modal);}
    var grid=arr.length?arr.map(function(b){return '<div class="rounded-2xl border '+(b.equipped?'border-amber-400/50':'border-slate-800')+' bg-slate-900/80 p-3"><div class="text-2xl">'+esc(b.icon)+'</div><b class="mt-1 block text-xs">'+esc(b.name)+'</b><span class="text-[9px] text-slate-500">'+esc(b.tier||'Badge')+(b.equipped?' • Name badge':'')+'</span></div>';}).join(''):'<div class="col-span-2 rounded-2xl bg-slate-900 p-4 text-center text-xs text-slate-500">Abhi koi badge nahi.</div>';
    modal.innerHTML='<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-slate-950 p-5 shadow-2xl"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><div class="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">'+avatarHtml(p,'h-full w-full object-cover')+'</div><div><div class="font-black text-lg">'+nameBadges(uid,p.name)+'</div><div class="text-[10px] text-slate-500">Public Profile • Badge Collection</div></div></div><button id="rh-close-profile-modal" class="rounded-xl bg-slate-800 px-3 py-2 text-xs">✕</button></div><div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-black/30 p-3"><b class="block text-amber-300">'+esc(p.xp||0)+'</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-cyan-300">Level '+esc(p.level||1)+'</b><span class="text-[8px] text-slate-500">Level</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-violet-300">'+arr.length+'</b><span class="text-[8px] text-slate-500">Badges</span></div></div><h4 class="mt-5 text-sm font-black text-amber-300">🏅 All Badges</h4><div class="mt-3 grid grid-cols-2 gap-2">'+grid+'</div></div>';
    modal.classList.remove('hidden'); modal.classList.add('flex'); var c=$('rh-close-profile-modal'); if(c)c.onclick=function(){modal.classList.add('hidden');};
  };

  function setAvatar(container,p,cls){ if(container) container.innerHTML=avatarHtml(p,cls); }
  function enhancePeople(){
    document.querySelectorAll('#people-box > div').forEach(function(card){
      var follow=card.querySelector('button[onclick^="toggleFollow"]'); var m=follow&&String(follow.getAttribute('onclick')||'').match(/toggleFollow\('([^']+)'\)/); var nameEl=card.querySelector('b'); var raw=nameEl?cleanName(nameEl.textContent):''; var p=profileByIdOrName(m&&m[1],raw); if(!p)return; var uid=String(p.id);
      setAvatar(card.querySelector('.w-11.h-11'),p,'w-full h-full object-cover'); if(nameEl) nameEl.innerHTML=nameBadges(uid,p.name||raw);
      if(!card.querySelector('.rh-view-profile-btn')){var b=document.createElement('button');b.type='button';b.className='rh-view-profile-btn bg-amber-600 hover:bg-amber-500 text-white min-w-[92px] px-3 py-2 rounded-lg text-xs font-black';b.textContent='View Profile';b.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};if(follow&&follow.parentNode)follow.parentNode.insertBefore(b,follow);}
    });
  }
  function enhancePosts(){
    document.querySelectorAll('article[id^="community-post-"]').forEach(function(article){
      var nameEl=article.querySelector('div.min-w-0 b'); var raw=nameEl?cleanName(nameEl.textContent):''; var p=profileByIdOrName('',raw); if(!p)return; var uid=String(p.id);
      var av=article.querySelector('.w-11.h-11.rounded-full'); if(av){av.style.cursor='pointer';setAvatar(av,p,'w-full h-full object-cover');av.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};}
      if(nameEl){nameEl.style.cursor='pointer';nameEl.innerHTML=nameBadges(uid,p.name||raw);nameEl.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};}
      if(!article.querySelector('.rh-post-view-profile')){var v=document.createElement('button');v.type='button';v.className='rh-post-view-profile rounded-full bg-amber-600/20 border border-amber-400/30 px-3 py-1 text-[10px] font-black text-amber-200 ml-2';v.textContent='View Profile';v.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};var h=article.querySelector('div.min-w-0');if(h)h.appendChild(v);}
    });
  }
  function enhanceChat(){
    var box=$('chat-messages'); if(!box)return;
    box.querySelectorAll(':scope > div.flex').forEach(function(row){
      var nameEl=row.querySelector('b'); var raw=nameEl?cleanName(nameEl.textContent==='You'?(window.profile&&window.profile.name):nameEl.textContent):''; var p=profileByIdOrName('',raw); if(!p)return; var uid=String(p.id);
      var av=row.querySelector('.w-8.h-8.rounded-full'); if(av){av.style.cursor='pointer';setAvatar(av,p,'w-full h-full object-cover');av.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};}
      if(nameEl&&nameEl.textContent!=='You'){nameEl.style.cursor='pointer';nameEl.innerHTML=nameBadges(uid,p.name||raw);nameEl.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};}
    });
  }
  function coupon(){
    var vault=$('section-vault'); if(!vault||!window.db)return; var card=$('vault-coupon-display'); if(!card){card=document.createElement('div');card.id='vault-coupon-display';card.className='rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4 mb-4';card.innerHTML='<div class="flex items-center justify-between gap-3"><div><b class="text-cyan-200">🎟️ Latest Coupon Code</b><p class="mt-1 text-xs text-slate-400">Admin generate karega to sabko yahan code dikhega.</p></div><button type="button" id="vault-coupon-refresh" class="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black">Refresh</button></div><div id="vault-coupon-code" class="mt-3 rounded-xl bg-slate-950 p-3 text-sm font-black text-cyan-300">Loading...</div>';vault.insertBefore(card,vault.firstChild);var r=$('vault-coupon-refresh');if(r)r.onclick=coupon;}
    var out=$('vault-coupon-code'); db.from('hub_access_coupons').select('code,expires_at,created_at,active').eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle().then(function(res){out.innerHTML=res&&res.data&&res.data.code?'<span class="select-all">'+esc(res.data.code)+'</span><div class="mt-1 text-[10px] text-slate-500">Expires: '+esc(new Date(res.data.expires_at).toLocaleString())+'</div>':'Abhi koi coupon generate nahi hua / Supabase RLS read policy check required';}).catch(function(){out.textContent='Coupon RLS policy required: SQL file update run karo';});
  }
  function apply(){ hide($('coupon-access-card')); var pdf=$('pdf-quiz-form'),panel=pdf&&pdf.closest('.qb-card,.rounded-3xl,.rounded-2xl,div'); if(panel&&!isAdmin())hide(panel); coupon(); enhancePeople(); enhancePosts(); enhanceChat(); var tg=$('section-telegramscore'); if(tg&&!tg.classList.contains('hidden')&&document.querySelector('section[id^="section-"]:not(.hidden):not(#section-telegramscore)')) tg.classList.add('hidden'); }
  function hooks(){ if(!window.__RH_V7_SWITCH__&&typeof window.switchTab==='function'){var old=window.switchTab;window.__RH_V7_SWITCH__=true;window.switchTab=function(tab){if(tab==='aitutor')tab='ai';if(tab==='quiz')tab='neet720';var tg=$('section-telegramscore');if(tg&&tab!=='telegramscore')tg.classList.add('hidden');var r=old.call(this,tab);setTimeout(function(){loadData().then(apply);},120);return r;};} }
  ready(function(){ setTimeout(removeSplash,300); setTimeout(removeSplash,1800); hooks(); loadData().then(apply); setInterval(function(){hooks();loadData().then(apply);},2500); });
})();
