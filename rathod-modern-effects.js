/* RATHOD HUB SAFE UI FIX v5
   Fixes: Vault coupon display, community profile badges, medal/badge visibility,
   and Telegram Score staying visible under other tabs. No feature is deleted. */
(function () {
  'use strict';
  if (window.__RH_SAFE_UI_FIX_V5__) return;
  window.__RH_SAFE_UI_FIX_V5__ = true;

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
  function hide(el){ if(el) el.style.setProperty('display','none','important'); }
  function show(el){ if(el) el.style.removeProperty('display'); }
  function isAdmin(){ return !!(window.profile && window.profile.role === 'admin'); }

  // Keep app opening even if any later patch has an issue.
  function removeSplash(){
    var splash = $('rh-splash-screen');
    if(!splash) return;
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(function(){ if(splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 250);
  }
  window.triggerRhCelebration = window.triggerRhCelebration || function(){};

  var profileMap = new Map();
  var badgeMap = new Map();
  var catalogMap = new Map();
  var loading = false;

  async function loadProfileBadgeData(){
    if(!window.db || loading) return;
    loading = true;
    try{
      var profilesRes = await db.from('profiles').select('id,name,pfp_url,role,xp,level').limit(500);
      var profiles = profilesRes.data || [];
      profileMap = new Map(profiles.map(function(p){ return [String(p.id), p]; }));
      if(Array.isArray(window.people)) window.people.forEach(function(p){ profileMap.set(String(p.id), Object.assign({}, profileMap.get(String(p.id)) || {}, p)); });

      var ids = Array.from(profileMap.keys());
      if(ids.length){
        var out = await Promise.all([
          db.from('badge_catalog').select('badge_id,name,icon,tier').limit(300),
          db.from('user_badges').select('user_id,badge_id,equipped,earned_at').in('user_id', ids)
        ]);
        catalogMap = new Map((out[0].data || []).map(function(b){ return [String(b.badge_id), b]; }));
        badgeMap = new Map();
        (out[1].data || []).forEach(function(b){ var k=String(b.user_id); var a=badgeMap.get(k)||[]; a.push(b); badgeMap.set(k,a); });
      }
    }catch(e){ console.warn('RATHOD badge/profile load skipped', e && e.message ? e.message : e); }
    loading = false;
  }

  function badgeInfo(id){ return catalogMap.get(String(id)) || { badge_id:id, icon:'🏅', name:id || 'Badge', tier:'Badge' }; }
  function nameWithBadges(uid, fallback){
    var badges = badgeMap.get(String(uid)) || [];
    var equipped = badges.filter(function(b){ return !!b.equipped; }).slice(0, 5);
    var icons = equipped.map(function(b){ return esc(badgeInfo(b.badge_id).icon); }).join('');
    return esc(fallback || 'Member') + ' <span class="text-amber-300" title="Badges">' + (icons || '🏅') + '</span>';
  }

  window.openCommunityCollectionProfile = async function(uid){
    await loadProfileBadgeData();
    var p = Object.assign({id:uid, name:'Student', xp:0, level:1}, profileMap.get(String(uid)) || {});
    var badges = (badgeMap.get(String(uid)) || []).map(function(b){ return Object.assign({}, badgeInfo(b.badge_id), b); });
    var modal = $('rh-community-collection-modal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'rh-community-collection-modal';
      modal.className = 'fixed inset-0 z-[9999] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-md';
      document.body.appendChild(modal);
    }
    var avatar = p.pfp_url ? '<img src="'+esc(p.pfp_url)+'" class="h-full w-full object-cover" onerror="this.outerHTML=\'<div class=&quot;grid h-full place-items-center text-2xl&quot;>👤</div>\'">' : '<div class="grid h-full place-items-center text-2xl">👤</div>';
    var grid = badges.length ? badges.map(function(b){
      return '<div class="rounded-2xl border '+(b.equipped?'border-amber-400/50':'border-slate-800')+' bg-slate-900/80 p-3"><div class="text-2xl">'+esc(b.icon)+'</div><b class="mt-1 block text-xs">'+esc(b.name)+'</b><span class="text-[9px] text-slate-500">'+esc(b.tier||'Badge')+(b.equipped?' • Name badge':'')+'</span></div>';
    }).join('') : '<div class="col-span-2 rounded-2xl bg-slate-900 p-4 text-center text-xs text-slate-500">Abhi koi badge nahi.</div>';
    modal.innerHTML = '<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-slate-950 p-5 shadow-2xl"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><div class="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">'+avatar+'</div><div><div class="font-black text-lg">'+nameWithBadges(uid,p.name)+'</div><div class="text-[10px] text-slate-500">Public Profile • Badge Collection</div></div></div><button id="rh-close-profile-modal" class="rounded-xl bg-slate-800 px-3 py-2 text-xs">✕</button></div><div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-black/30 p-3"><b class="block text-amber-300">'+esc(p.xp||0)+'</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-cyan-300">Level '+esc(p.level||1)+'</b><span class="text-[8px] text-slate-500">Level</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-violet-300">'+badges.length+'</b><span class="text-[8px] text-slate-500">Badges</span></div></div><h4 class="mt-5 text-sm font-black text-amber-300">🏅 All Badges</h4><div class="mt-3 grid grid-cols-2 gap-2">'+grid+'</div></div>';
    show(modal); modal.classList.remove('hidden'); modal.classList.add('flex');
    var close = $('rh-close-profile-modal'); if(close) close.onclick = function(){ modal.classList.add('hidden'); };
  };

  async function latestCoupon(){
    // Supabase SQL file uses hub_access_coupons, older code sometimes used hub_coupons.
    try{
      var r1 = await db.from('hub_access_coupons').select('code,expires_at,created_at,active').eq('active', true).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(r1 && r1.data && r1.data.code) return r1.data;
    }catch(e1){}
    try{
      var r2 = await db.from('hub_coupons').select('code,expires_at,created_at').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(r2 && r2.data && r2.data.code) return r2.data;
    }catch(e2){}
    return null;
  }

  async function ensureVaultCoupon(){
    var vault = $('section-vault'); if(!vault) return;
    var card = $('vault-coupon-display');
    if(!card){
      card = document.createElement('div');
      card.id = 'vault-coupon-display';
      card.className = 'rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4 mb-4';
      card.innerHTML = '<div class="flex items-center justify-between gap-3"><div><b class="text-cyan-200">🎟️ Latest Coupon Code</b><p class="mt-1 text-xs text-slate-400">Admin generate karega to sabko yahan code dikhega.</p></div><button type="button" id="vault-coupon-refresh" class="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black">Refresh</button></div><div id="vault-coupon-code" class="mt-3 rounded-xl bg-slate-950 p-3 text-sm font-black text-cyan-300">Loading...</div>';
      vault.insertBefore(card, vault.firstChild);
      var ref = $('vault-coupon-refresh'); if(ref) ref.onclick = ensureVaultCoupon;
    }
    var out = $('vault-coupon-code'); if(!out || !window.db) return;
    var c = await latestCoupon();
    if(c && c.code) out.innerHTML = '<span class="select-all">'+esc(c.code)+'</span><div class="mt-1 text-[10px] text-slate-500">Expires: '+esc(new Date(c.expires_at).toLocaleString())+'</div>';
    else out.textContent = 'Abhi koi coupon generate nahi hua / RLS read policy check required';
  }

  function enhanceCommunity(){
    // People tab
    document.querySelectorAll('#people-box > div').forEach(function(card){
      var follow = card.querySelector('button[onclick^="toggleFollow"]');
      var m = follow && String(follow.getAttribute('onclick')||'').match(/toggleFollow\('([^']+)'\)/);
      var uid = m && m[1]; if(!uid) return;
      var p = profileMap.get(String(uid)) || {};
      var av = card.querySelector('.w-11.h-11'); if(av && p.pfp_url) av.innerHTML = '<img src="'+esc(p.pfp_url)+'" class="w-full h-full object-cover">';
      var nm = card.querySelector('b'); if(nm) nm.innerHTML = nameWithBadges(uid, p.name || nm.textContent);
      if(!card.querySelector('.rh-view-profile-btn')){
        var b=document.createElement('button'); b.type='button'; b.className='rh-view-profile-btn bg-amber-600 hover:bg-amber-500 text-white min-w-[92px] px-3 py-2 rounded-lg text-xs font-black'; b.textContent='View Profile'; b.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};
        if(follow && follow.parentNode) follow.parentNode.insertBefore(b, follow);
      }
    });
    // All posts
    document.querySelectorAll('article[id^="community-post-"]').forEach(function(article){
      var postId=(article.id||'').replace('community-post-','');
      var post=(window.posts||[]).find(function(x){return String(x.id)===String(postId);}); if(!post||!post.author_id) return;
      var uid=String(post.author_id), p=Object.assign({name:post.author,pfp_url:post.pfp_url}, profileMap.get(uid)||{});
      var av=article.querySelector('.w-11.h-11.rounded-full'); if(av){av.style.cursor='pointer'; if(p.pfp_url) av.innerHTML='<img src="'+esc(p.pfp_url)+'" class="w-full h-full object-cover">'; av.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};}
      var nm=article.querySelector('div.min-w-0 b'); if(nm){nm.style.cursor='pointer'; nm.innerHTML=nameWithBadges(uid,p.name||post.author||nm.textContent); nm.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};}
      if(!article.querySelector('.rh-post-view-profile')){var v=document.createElement('button');v.type='button';v.className='rh-post-view-profile rounded-full bg-amber-600/20 border border-amber-400/30 px-3 py-1 text-[10px] font-black text-amber-200 ml-2';v.textContent='View Profile';v.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);};var h=article.querySelector('div.min-w-0');if(h)h.appendChild(v);}
    });
  }

  function hideTelegramScore(){ var s=$('section-telegramscore'); if(s) s.classList.add('hidden'); }

  function smallUi(){
    hide($('coupon-access-card'));
    var ai=$('btn-aitutor'); if(ai) ai.setAttribute('onclick',"switchTab('ai')");
    var q=$('btn-quiz'); if(q) q.setAttribute('onclick',"switchTab('neet720')");
    var pdf=$('pdf-quiz-form'), panel=pdf && pdf.closest('.qb-card,.rounded-3xl,.rounded-2xl,div'); if(panel && !isAdmin()) hide(panel);
    ensureVaultCoupon(); enhanceCommunity();
  }

  function patchSwitch(){
    if(window.__RH_V5_SWITCH_PATCHED__) return;
    if(typeof window.switchTab !== 'function') return;
    var old = window.switchTab;
    window.__RH_V5_SWITCH_PATCHED__ = true;
    window.switchTab = function(tab){
      if(tab !== 'telegramscore') hideTelegramScore();
      if(tab === 'aitutor') tab = 'ai';
      if(tab === 'quiz') tab = 'neet720';
      var r = old.call(this, tab);
      setTimeout(function(){ loadProfileBadgeData().then(smallUi); }, 150);
      return r;
    };
  }

  ready(function(){
    setTimeout(removeSplash, 300); setTimeout(removeSplash, 1800);
    patchSwitch(); loadProfileBadgeData().then(smallUi);
    setInterval(function(){ patchSwitch(); loadProfileBadgeData().then(smallUi); }, 2500);
  });
})();
