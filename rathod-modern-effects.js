/* RATHOD HUB SAFE UI FIX v6
   Fixes Google Drive PFP display in Community and Live Chat, plus profile/badge modal.
   No feature is deleted. */
(function () {
  'use strict';
  if (window.__RH_SAFE_UI_FIX_V6__) return;
  window.__RH_SAFE_UI_FIX_V6__ = true;

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
  function hide(el){ if(el) el.style.setProperty('display','none','important'); }
  function show(el){ if(el) el.style.removeProperty('display'); }
  function isAdmin(){ return !!(window.profile && window.profile.role === 'admin'); }
  function removeSplash(){ var s=$('rh-splash-screen'); if(!s)return; s.style.opacity='0'; s.style.pointerEvents='none'; setTimeout(function(){ if(s&&s.parentNode)s.parentNode.removeChild(s); },250); }
  window.triggerRhCelebration = window.triggerRhCelebration || function(){};

  // Google Drive image URLs cannot always render as raw file links. Convert every Drive link to preview/thumbnail.
  function driveImg(url){
    url = String(url || '').trim();
    if(!url) return '';
    try{
      var m = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/) || url.match(/\/uc\?export=(?:download|view)&id=([^&]+)/);
      if(m && m[1]) return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(m[1]) + '&sz=w256';
    }catch(e){}
    return url;
  }
  window.rhDriveImg = driveImg;

  var profileMap = new Map();
  var badgeMap = new Map();
  var catalogMap = new Map();
  var loading = false;

  async function loadProfileBadgeData(){
    if(!window.db || loading) return;
    loading = true;
    try{
      var profilesRes = await db.from('profiles').select('id,name,pfp_url,role,xp,level').limit(700);
      var profiles = profilesRes.data || [];
      profileMap = new Map(profiles.map(function(p){ return [String(p.id), p]; }));
      if(window.profile && window.user && window.user.id) profileMap.set(String(window.user.id), Object.assign({}, profileMap.get(String(window.user.id)) || {}, window.profile));
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
    }catch(e){ console.warn('RATHOD profile/badge load skipped', e && e.message ? e.message : e); }
    loading = false;
  }

  function badgeInfo(id){ return catalogMap.get(String(id)) || { badge_id:id, icon:'🏅', name:id || 'Badge', tier:'Badge' }; }
  function nameWithBadges(uid, fallback){
    var badges = badgeMap.get(String(uid)) || [];
    var equipped = badges.filter(function(b){ return !!b.equipped; }).slice(0, 5);
    var icons = equipped.map(function(b){ return esc(badgeInfo(b.badge_id).icon); }).join('');
    return esc(fallback || 'Member') + ' <span class="text-amber-300" title="Badges">' + (icons || '🏅') + '</span>';
  }
  function avatarHtml(p, cls){
    var u = driveImg(p && p.pfp_url);
    return u ? '<img src="'+esc(u)+'" class="'+cls+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<div class=&quot;grid h-full w-full place-items-center&quot;>👤</div>\'">' : '<div class="grid h-full w-full place-items-center">👤</div>';
  }

  window.openCommunityCollectionProfile = async function(uid){
    await loadProfileBadgeData();
    var p = Object.assign({id:uid, name:'Student', xp:0, level:1}, profileMap.get(String(uid)) || {});
    var badges = (badgeMap.get(String(uid)) || []).map(function(b){ return Object.assign({}, badgeInfo(b.badge_id), b); });
    var modal = $('rh-community-collection-modal');
    if(!modal){ modal=document.createElement('div'); modal.id='rh-community-collection-modal'; modal.className='fixed inset-0 z-[9999] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-md'; document.body.appendChild(modal); }
    var grid = badges.length ? badges.map(function(b){ return '<div class="rounded-2xl border '+(b.equipped?'border-amber-400/50':'border-slate-800')+' bg-slate-900/80 p-3"><div class="text-2xl">'+esc(b.icon)+'</div><b class="mt-1 block text-xs">'+esc(b.name)+'</b><span class="text-[9px] text-slate-500">'+esc(b.tier||'Badge')+(b.equipped?' • Name badge':'')+'</span></div>'; }).join('') : '<div class="col-span-2 rounded-2xl bg-slate-900 p-4 text-center text-xs text-slate-500">Abhi koi badge nahi.</div>';
    modal.innerHTML='<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-slate-950 p-5 shadow-2xl"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><div class="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">'+avatarHtml(p,'h-full w-full object-cover')+'</div><div><div class="font-black text-lg">'+nameWithBadges(uid,p.name)+'</div><div class="text-[10px] text-slate-500">Public Profile • Badge Collection</div></div></div><button id="rh-close-profile-modal" class="rounded-xl bg-slate-800 px-3 py-2 text-xs">✕</button></div><div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-black/30 p-3"><b class="block text-amber-300">'+esc(p.xp||0)+'</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-cyan-300">Level '+esc(p.level||1)+'</b><span class="text-[8px] text-slate-500">Level</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-violet-300">'+badges.length+'</b><span class="text-[8px] text-slate-500">Badges</span></div></div><h4 class="mt-5 text-sm font-black text-amber-300">🏅 All Badges</h4><div class="mt-3 grid grid-cols-2 gap-2">'+grid+'</div></div>';
    show(modal); modal.classList.remove('hidden'); modal.classList.add('flex'); var c=$('rh-close-profile-modal'); if(c)c.onclick=function(){modal.classList.add('hidden');};
  };

  function ensureVaultCoupon(){
    var vault=$('section-vault'); if(!vault) return; var card=$('vault-coupon-display');
    if(!card){ card=document.createElement('div'); card.id='vault-coupon-display'; card.className='rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4 mb-4'; card.innerHTML='<div class="flex items-center justify-between gap-3"><div><b class="text-cyan-200">🎟️ Latest Coupon Code</b><p class="mt-1 text-xs text-slate-400">Admin generate karega to sabko yahan code dikhega.</p></div><button type="button" id="vault-coupon-refresh" class="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black">Refresh</button></div><div id="vault-coupon-code" class="mt-3 rounded-xl bg-slate-950 p-3 text-sm font-black text-cyan-300">Loading...</div>'; vault.insertBefore(card,vault.firstChild); var r=$('vault-coupon-refresh'); if(r)r.onclick=ensureVaultCoupon; }
    var out=$('vault-coupon-code'); if(!out||!window.db)return;
    db.from('hub_access_coupons').select('code,expires_at,created_at,active').eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle().then(function(res){
      if(res && res.data && res.data.code) out.innerHTML='<span class="select-all">'+esc(res.data.code)+'</span><div class="mt-1 text-[10px] text-slate-500">Expires: '+esc(new Date(res.data.expires_at).toLocaleString())+'</div>'; else out.textContent='Abhi koi coupon generate nahi hua / Supabase RLS read policy check required';
    }).catch(function(){ out.textContent='Coupon table/RLS setup check required'; });
  }

  function enhanceCommunity(){
    document.querySelectorAll('#people-box > div').forEach(function(card){
      var follow=card.querySelector('button[onclick^="toggleFollow"]'); var m=follow&&String(follow.getAttribute('onclick')||'').match(/toggleFollow\('([^']+)'\)/); var uid=m&&m[1]; if(!uid)return;
      var p=profileMap.get(String(uid))||{}; var av=card.querySelector('.w-11.h-11'); if(av) av.innerHTML=avatarHtml(p,'w-full h-full object-cover'); var nm=card.querySelector('b'); if(nm) nm.innerHTML=nameWithBadges(uid,p.name||nm.textContent);
      if(!card.querySelector('.rh-view-profile-btn')){ var b=document.createElement('button'); b.type='button'; b.className='rh-view-profile-btn bg-amber-600 hover:bg-amber-500 text-white min-w-[92px] px-3 py-2 rounded-lg text-xs font-black'; b.textContent='View Profile'; b.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);}; if(follow&&follow.parentNode)follow.parentNode.insertBefore(b,follow); }
    });
    document.querySelectorAll('article[id^="community-post-"]').forEach(function(article){
      var postId=(article.id||'').replace('community-post-',''); var post=(window.posts||[]).find(function(x){return String(x.id)===String(postId);}); if(!post||!post.author_id)return; var uid=String(post.author_id); var p=Object.assign({name:post.author,pfp_url:post.pfp_url},profileMap.get(uid)||{});
      var av=article.querySelector('.w-11.h-11.rounded-full'); if(av){ av.style.cursor='pointer'; av.innerHTML=avatarHtml(p,'w-full h-full object-cover'); av.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);}; }
      var nm=article.querySelector('div.min-w-0 b'); if(nm){ nm.style.cursor='pointer'; nm.innerHTML=nameWithBadges(uid,p.name||post.author||nm.textContent); nm.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);}; }
      if(!article.querySelector('.rh-post-view-profile')){ var v=document.createElement('button'); v.type='button'; v.className='rh-post-view-profile rounded-full bg-amber-600/20 border border-amber-400/30 px-3 py-1 text-[10px] font-black text-amber-200 ml-2'; v.textContent='View Profile'; v.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);}; var h=article.querySelector('div.min-w-0'); if(h)h.appendChild(v); }
    });
  }

  function enhanceLiveChat(){
    var box=$('chat-messages'); if(!box) return;
    var rows = Array.isArray(window.chatMessages) ? window.chatMessages : [];
    box.querySelectorAll(':scope > div.flex').forEach(function(row, i){
      var msg = rows[i]; if(!msg || !msg.user_id) return;
      var uid=String(msg.user_id); var p=Object.assign({name:msg.name}, profileMap.get(uid)||{});
      var av=row.querySelector('.w-8.h-8.rounded-full');
      if(av){ av.style.cursor='pointer'; av.innerHTML=avatarHtml(p,'w-full h-full object-cover'); av.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);}; }
      var nm=row.querySelector('b'); if(nm && !nm.dataset.rhChatName){ nm.dataset.rhChatName='1'; nm.style.cursor='pointer'; nm.innerHTML=(uid===String(window.user&&window.user.id)?'You':nameWithBadges(uid,p.name||msg.name||nm.textContent)); nm.onclick=function(e){e.stopPropagation();window.openCommunityCollectionProfile(uid);}; }
    });
  }

  function hideTelegramScore(){ var s=$('section-telegramscore'); if(s) s.classList.add('hidden'); }
  function smallUi(){
    hide($('coupon-access-card')); var ai=$('btn-aitutor'); if(ai)ai.setAttribute('onclick',"switchTab('ai')"); var q=$('btn-quiz'); if(q)q.setAttribute('onclick',"switchTab('neet720')"); var pdf=$('pdf-quiz-form'), panel=pdf&&pdf.closest('.qb-card,.rounded-3xl,.rounded-2xl,div'); if(panel&&!isAdmin())hide(panel);
    ensureVaultCoupon(); enhanceCommunity(); enhanceLiveChat();
  }
  function patchSwitch(){
    if(window.__RH_V6_SWITCH_PATCHED__ || typeof window.switchTab !== 'function') return;
    var old=window.switchTab; window.__RH_V6_SWITCH_PATCHED__=true;
    window.switchTab=function(tab){ if(tab!=='telegramscore')hideTelegramScore(); if(tab==='aitutor')tab='ai'; if(tab==='quiz')tab='neet720'; var r=old.call(this,tab); setTimeout(function(){loadProfileBadgeData().then(smallUi);},150); return r; };
  }
  function patchRenderers(){
    if(!window.__RH_V6_RENDER_PATCHED__){
      var rp=window.renderPosts; if(typeof rp==='function') window.renderPosts=function(){var r=rp.apply(this,arguments);setTimeout(function(){loadProfileBadgeData().then(smallUi);},80);return r;};
      var rpe=window.renderPeople; if(typeof rpe==='function') window.renderPeople=function(){var r=rpe.apply(this,arguments);setTimeout(function(){loadProfileBadgeData().then(smallUi);},80);return r;};
      var rc=window.renderChatMessages; if(typeof rc==='function') window.renderChatMessages=function(){var r=rc.apply(this,arguments);setTimeout(function(){loadProfileBadgeData().then(smallUi);},80);return r;};
      window.__RH_V6_RENDER_PATCHED__=true;
    }
  }

  ready(function(){
    setTimeout(removeSplash,300); setTimeout(removeSplash,1800);
    patchSwitch(); patchRenderers(); loadProfileBadgeData().then(smallUi);
    setInterval(function(){ patchSwitch(); patchRenderers(); loadProfileBadgeData().then(smallUi); },2500);
  });
})();
