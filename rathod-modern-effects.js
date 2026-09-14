/* RATHOD HUB URGENT FIX
   Community posts/profile badge collection + Vault coupon display.
   This file is intentionally lightweight so cache updates reliably. */
(function(){
  'use strict';
  if(window.__RH_URGENT_FIX_V3__) return;
  window.__RH_URGENT_FIX_V3__ = true;

  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
  function safeUrl(v){ return String(v || '').replace(/["'<>]/g,''); }
  function isAdmin(){ return !!(window.profile && window.profile.role === 'admin'); }
  function hide(el){ if(el) el.style.setProperty('display','none','important'); }
  function show(el){ if(el) el.style.removeProperty('display'); }
  function profileId(){ return window.user && window.user.id; }

  var profileMap = new Map();
  var badgeMap = new Map();
  var rewardMap = new Map();
  var catalogMap = new Map();
  var loadingProfiles = false;

  async function loadCommunityProfileData(){
    if(!window.db || loadingProfiles) return;
    loadingProfiles = true;
    try{
      var profilesRes = await db.from('profiles').select('id,name,pfp_url,role,xp,level').limit(500);
      var profiles = profilesRes.data || [];
      profileMap = new Map(profiles.map(function(p){ return [String(p.id), p]; }));
      if(Array.isArray(window.people)){
        window.people.forEach(function(p){ profileMap.set(String(p.id), Object.assign({}, profileMap.get(String(p.id)) || {}, p)); });
      }
      var ids = Array.from(profileMap.keys());
      if(ids.length){
        var results = await Promise.all([
          db.from('badge_catalog').select('badge_id,name,icon,tier').limit(300),
          db.from('user_badges').select('user_id,badge_id,equipped,earned_at').in('user_id', ids),
          db.from('league_rewards').select('user_id,council_role,badge,name_color,access_expires_at').in('user_id', ids).gt('access_expires_at', new Date().toISOString()).order('created_at',{ascending:false})
        ]);
        catalogMap = new Map((results[0].data || []).map(function(b){ return [String(b.badge_id), b]; }));
        badgeMap = new Map();
        (results[1].data || []).forEach(function(b){ var k=String(b.user_id); var arr=badgeMap.get(k)||[]; arr.push(b); badgeMap.set(k,arr); });
        rewardMap = new Map();
        (results[2].data || []).forEach(function(r){ var k=String(r.user_id); if(!rewardMap.has(k)) rewardMap.set(k,r); });
      }
    }catch(e){ console.warn('RH profile/badge load failed', e); }
    loadingProfiles = false;
  }

  function badgeInfo(id){ return catalogMap.get(String(id)) || {badge_id:id, icon:'🏅', name:id || 'Badge', tier:'Badge'}; }
  function profileFor(id, fallback){ return Object.assign({}, fallback || {}, profileMap.get(String(id)) || {}); }
  function nameWithBadge(id, name){
    var badges = badgeMap.get(String(id)) || [];
    var equipped = badges.filter(function(b){ return !!b.equipped; }).slice(0,3);
    var icons = equipped.map(function(b){ return esc(badgeInfo(b.badge_id).icon); }).join('');
    var reward = rewardMap.get(String(id));
    return esc(name || 'Member') + (icons ? ' <span class="text-amber-300" title="Badges">'+icons+'</span>' : ' <span class="text-amber-300" title="Profile badges">🏅</span>') + (reward ? ' <span class="text-sky-400" title="'+esc(reward.badge || 'League badge')+'">✓</span>' : '');
  }

  window.openCommunityCollectionProfile = async function(uid){
    await loadCommunityProfileData();
    var p = profileFor(uid, {id:uid, name:'Student'});
    var badges = (badgeMap.get(String(uid)) || []).map(function(x){ return Object.assign({}, badgeInfo(x.badge_id), x); });
    var reward = rewardMap.get(String(uid));
    var modal = $('rh-community-collection-modal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'rh-community-collection-modal';
      modal.className = 'fixed inset-0 z-[9999] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-md';
      document.body.appendChild(modal);
    }
    modal.innerHTML = '<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-slate-950 p-5 shadow-2xl">'
      + '<div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3">'
      + '<div class="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">' + (p.pfp_url ? '<img src="'+safeUrl(p.pfp_url)+'" class="h-full w-full object-cover" onerror="this.outerHTML=\'<div class=&quot;grid h-full place-items-center text-2xl&quot;>👤</div>\'">' : '<div class="grid h-full place-items-center text-2xl">👤</div>') + '</div>'
      + '<div><div class="font-black text-lg">'+nameWithBadge(uid, p.name)+'</div><div class="text-[10px] text-slate-500">Public Profile • Badge Collection</div></div></div>'
      + '<button onclick="document.getElementById(\'rh-community-collection-modal\').classList.add(\'hidden\')" class="rounded-xl bg-slate-800 px-3 py-2 text-xs">✕</button></div>'
      + '<div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-black/30 p-3"><b class="block text-amber-300">'+esc(p.xp || 0)+'</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-cyan-300">Level '+esc(p.level || 1)+'</b><span class="text-[8px] text-slate-500">Level</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-violet-300">'+badges.length+'</b><span class="text-[8px] text-slate-500">Badges</span></div></div>'
      + (reward ? '<div class="mt-3 rounded-full bg-sky-500/10 px-3 py-2 text-center text-xs font-black text-sky-300">'+esc(reward.badge || 'League Badge')+'</div>' : '')
      + '<h4 class="mt-5 text-sm font-black text-amber-300">🏅 All Badges</h4><div class="mt-3 grid grid-cols-2 gap-2">'
      + (badges.length ? badges.map(function(b){ return '<div class="rounded-2xl border '+(b.equipped?'border-amber-400/50':'border-slate-800')+' bg-slate-900/80 p-3"><div class="text-2xl">'+esc(b.icon)+'</div><b class="mt-1 block text-xs">'+esc(b.name)+'</b><span class="text-[9px] text-slate-500">'+esc(b.tier || 'Badge')+(b.equipped?' • Name badge':'')+'</span></div>'; }).join('') : '<div class="col-span-2 rounded-2xl bg-slate-900 p-4 text-center text-xs text-slate-500">Abhi koi badge nahi.</div>')
      + '</div></div>';
    modal.classList.remove('hidden'); modal.classList.add('flex');
  };

  function enhancePeopleTab(){
    document.querySelectorAll('#people-box > div').forEach(function(card){
      var nameEl = card.querySelector('b');
      var btn = card.querySelector('button[onclick^="toggleFollow"]');
      var m = btn && String(btn.getAttribute('onclick')||'').match(/toggleFollow\('([^']+)'\)/);
      var uid = m && m[1]; if(!uid) return;
      var p = profileFor(uid, {});
      var avatar = card.querySelector('.w-11.h-11');
      if(avatar && p.pfp_url && !avatar.querySelector('img')) avatar.innerHTML = '<img src="'+safeUrl(p.pfp_url)+'" class="w-full h-full object-cover">';
      if(nameEl && !nameEl.dataset.rhBadgeName){ nameEl.dataset.rhBadgeName='1'; nameEl.innerHTML = nameWithBadge(uid, p.name || nameEl.textContent); }
      if(!card.querySelector('.rh-view-profile-btn')){
        var view = document.createElement('button'); view.type='button'; view.className='rh-view-profile-btn bg-amber-600 hover:bg-amber-500 text-white min-w-[92px] px-3 py-2 rounded-lg text-xs font-black'; view.textContent='View Profile'; view.onclick=function(e){ e.stopPropagation(); window.openCommunityCollectionProfile(uid); };
        if(btn) btn.parentNode.insertBefore(view, btn);
      }
      if(!card.dataset.rhOpenProfile){ card.dataset.rhOpenProfile='1'; card.style.cursor='pointer'; card.addEventListener('click', function(e){ if(e.target.closest('button')) return; window.openCommunityCollectionProfile(uid); }); }
    });
  }

  function enhancePostCards(){
    document.querySelectorAll('article[id^="community-post-"]').forEach(function(article){
      if(article.dataset.rhPostProfile) return;
      var deleteBtn = article.querySelector('button[onclick^="deletePost"]');
      var postId = (article.id || '').replace('community-post-','');
      var post = (window.posts || []).find(function(x){ return String(x.id) === String(postId); });
      if(!post || !post.author_id) return;
      var uid = String(post.author_id);
      var p = profileFor(uid, {name:post.author, pfp_url:post.pfp_url});
      var avatar = article.querySelector('.w-11.h-11.rounded-full');
      if(avatar){ avatar.style.cursor='pointer'; if(p.pfp_url) avatar.innerHTML = '<img src="'+safeUrl(p.pfp_url)+'" class="w-full h-full object-cover" onerror="this.outerHTML=\'<div class=&quot;h-full grid place-items-center&quot;>👤</div>\'">'; avatar.onclick=function(e){ e.stopPropagation(); window.openCommunityCollectionProfile(uid); }; }
      var nameEl = article.querySelector('div.min-w-0 > b.text-sm, div.min-w-0 b');
      if(nameEl){ nameEl.style.cursor='pointer'; nameEl.innerHTML = nameWithBadge(uid, p.name || post.author || nameEl.textContent); nameEl.onclick=function(e){ e.stopPropagation(); window.openCommunityCollectionProfile(uid); }; }
      if(!article.querySelector('.rh-post-view-profile')){
        var btn = document.createElement('button'); btn.type='button'; btn.className='rh-post-view-profile rounded-full bg-amber-600/20 border border-amber-400/30 px-3 py-1 text-[10px] font-black text-amber-200 ml-2'; btn.textContent='View Profile'; btn.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};
        var holder = article.querySelector('div.min-w-0 span.text-\[10px\]') || article.querySelector('div.min-w-0');
        if(holder) holder.parentNode.appendChild(btn);
      }
      article.dataset.rhPostProfile='1';
    });
  }

  async function loadLatestCoupon(){
    var out = $('vault-coupon-code');
    if(!out || !window.db) return;
    try{
      var r = await db.from('hub_coupons').select('code,expires_at,created_at').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(r.data && r.data.code) out.innerHTML = '<span class="select-all">'+esc(r.data.code)+'</span><div class="mt-1 text-[10px] text-slate-500">Expires: '+esc(new Date(r.data.expires_at).toLocaleString())+'</div>';
      else out.textContent = 'Abhi koi coupon generate nahi hua';
    }catch(e){ out.textContent = 'Coupon table/RLS setup check required'; }
  }

  function ensureVaultCoupon(){
    var vault = $('section-vault'); if(!vault) return;
    if(!$('vault-coupon-display')){
      var card = document.createElement('div');
      card.id='vault-coupon-display';
      card.className='rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4 mb-4';
      card.innerHTML='<div class="flex items-center justify-between gap-3"><div><b class="text-cyan-200">🎟️ Latest Coupon Code</b><p class="mt-1 text-xs text-slate-400">Admin generate karega to sabko yahan code dikhega.</p></div><button type="button" id="vault-coupon-refresh" class="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black">Refresh</button></div><div id="vault-coupon-code" class="mt-3 rounded-xl bg-slate-950 p-3 text-sm font-black text-cyan-300">Loading...</div>';
      vault.insertBefore(card, vault.firstChild);
      var rb=$('vault-coupon-refresh'); if(rb) rb.onclick=loadLatestCoupon;
    }
    loadLatestCoupon();
  }

  function applyLayout(){
    hide($('coupon-access-card'));
    hide($('btn-studypower'));
    hide(document.querySelector('.rh-feature[onclick="switchTab(\'studypower\')"]'));
    var aiTutor=$('btn-aitutor'); if(aiTutor) aiTutor.setAttribute('onclick',"switchTab('ai')");
    var aiLearning=$('btn-quiz'); if(aiLearning) aiLearning.setAttribute('onclick',"switchTab('neet720')");
    var aiFeature=document.querySelector('.rh-feature[onclick="switchTab(\'quiz\')"]'); if(aiFeature) aiFeature.setAttribute('onclick',"switchTab('neet720')");
    var pdf=$('pdf-quiz-form'), panel=pdf && pdf.closest('.qb-card,.rounded-3xl,.rounded-2xl,div');
    if(panel){ if(isAdmin()){ var host=$('admin-controls-host') || $('section-adminpanel'); if(host && !$('admin-pdf-quiz-host')){ var wrap=document.createElement('div'); wrap.id='admin-pdf-quiz-host'; wrap.className='space-y-3'; wrap.appendChild(panel); host.appendChild(wrap); } show(panel); } else hide(panel); }
    ensureVaultCoupon();
    enhancePeopleTab();
    enhancePostCards();
  }

  var oldSwitch = window.switchTab;
  window.switchTab = function(tab){
    if(tab==='aitutor') tab='ai';
    if(tab==='quiz') tab='neet720';
    if(tab==='studypower') tab='home';
    var r = oldSwitch ? oldSwitch.call(this, tab) : undefined;
    setTimeout(function(){ loadCommunityProfileData().then(applyLayout); }, 100);
    setTimeout(applyLayout, 600);
    return r;
  };
  var oldRenderPeople = window.renderPeople;
  if(typeof oldRenderPeople === 'function') window.renderPeople = function(){ var r=oldRenderPeople.apply(this, arguments); setTimeout(function(){ loadCommunityProfileData().then(applyLayout); },80); return r; };
  var oldRenderPosts = window.renderPosts;
  if(typeof oldRenderPosts === 'function') window.renderPosts = function(){ var r=oldRenderPosts.apply(this, arguments); setTimeout(function(){ loadCommunityProfileData().then(applyLayout); },80); return r; };
  var oldCreateCoupon = window.createHubCoupon;
  if(typeof oldCreateCoupon === 'function') window.createHubCoupon = async function(){ var r=await oldCreateCoupon.apply(this, arguments); setTimeout(loadLatestCoupon,500); return r; };

  function boot(){ loadCommunityProfileData().then(applyLayout); setTimeout(applyLayout,500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setInterval(function(){ loadCommunityProfileData().then(applyLayout); }, 2500);
})();
