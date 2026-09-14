/* RATHOD HUB SAFE STARTUP FIX v4
   Keeps the app opening first. Adds UI fixes only after the page is ready. */
(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function byId(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function hide(el) { if (el) el.style.setProperty('display', 'none', 'important'); }
  function isAdmin() { return !!(window.profile && window.profile.role === 'admin'); }

  function removeSplash() {
    var splash = byId('rh-splash-screen');
    if (!splash) return;
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 300);
  }

  window.triggerRhCelebration = window.triggerRhCelebration || function () {};

  var profileCache = new Map();
  var badgeCache = new Map();
  var catalogCache = new Map();
  var profileLoading = false;

  async function loadProfilesAndBadges() {
    if (!window.db || profileLoading) return;
    profileLoading = true;
    try {
      var profilesRes = await db.from('profiles').select('id,name,pfp_url,role,xp,level').limit(500);
      var profiles = profilesRes.data || [];
      profileCache = new Map(profiles.map(function (p) { return [String(p.id), p]; }));
      if (Array.isArray(window.people)) {
        window.people.forEach(function (p) { profileCache.set(String(p.id), Object.assign({}, profileCache.get(String(p.id)) || {}, p)); });
      }
      var ids = Array.from(profileCache.keys());
      if (ids.length) {
        var result = await Promise.all([
          db.from('badge_catalog').select('badge_id,name,icon,tier').limit(300),
          db.from('user_badges').select('user_id,badge_id,equipped,earned_at').in('user_id', ids)
        ]);
        catalogCache = new Map((result[0].data || []).map(function (b) { return [String(b.badge_id), b]; }));
        badgeCache = new Map();
        (result[1].data || []).forEach(function (b) {
          var key = String(b.user_id);
          var arr = badgeCache.get(key) || [];
          arr.push(b);
          badgeCache.set(key, arr);
        });
      }
    } catch (e) {
      console.warn('RATHOD profile/badge load skipped:', e && e.message ? e.message : e);
    }
    profileLoading = false;
  }

  function badgeInfo(id) {
    return catalogCache.get(String(id)) || { badge_id: id, icon: '🏅', name: id || 'Badge', tier: 'Badge' };
  }

  function nameHtml(uid, fallbackName) {
    var badges = badgeCache.get(String(uid)) || [];
    var equipped = badges.filter(function (b) { return !!b.equipped; }).slice(0, 3);
    var icons = equipped.map(function (b) { return esc(badgeInfo(b.badge_id).icon); }).join('');
    return esc(fallbackName || 'Member') + ' <span class="text-amber-300">' + (icons || '🏅') + '</span>';
  }

  window.openCommunityCollectionProfile = async function (uid) {
    await loadProfilesAndBadges();
    var p = Object.assign({ id: uid, name: 'Student' }, profileCache.get(String(uid)) || {});
    var badges = (badgeCache.get(String(uid)) || []).map(function (b) { return Object.assign({}, badgeInfo(b.badge_id), b); });
    var modal = byId('rh-community-collection-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'rh-community-collection-modal';
      modal.className = 'fixed inset-0 z-[9999] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-md';
      document.body.appendChild(modal);
    }
    var avatar = p.pfp_url ? '<img src="' + esc(p.pfp_url) + '" class="h-full w-full object-cover">' : '<div class="grid h-full place-items-center text-2xl">👤</div>';
    var badgeGrid = badges.length ? badges.map(function (b) {
      return '<div class="rounded-2xl border ' + (b.equipped ? 'border-amber-400/50' : 'border-slate-800') + ' bg-slate-900/80 p-3"><div class="text-2xl">' + esc(b.icon) + '</div><b class="mt-1 block text-xs">' + esc(b.name) + '</b><span class="text-[9px] text-slate-500">' + esc(b.tier || 'Badge') + (b.equipped ? ' • Name badge' : '') + '</span></div>';
    }).join('') : '<div class="col-span-2 rounded-2xl bg-slate-900 p-4 text-center text-xs text-slate-500">Abhi koi badge nahi.</div>';
    modal.innerHTML = '<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-slate-950 p-5 shadow-2xl"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><div class="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">' + avatar + '</div><div><div class="font-black text-lg">' + nameHtml(uid, p.name) + '</div><div class="text-[10px] text-slate-500">Public Profile • Badge Collection</div></div></div><button id="rh-close-profile-modal" class="rounded-xl bg-slate-800 px-3 py-2 text-xs">✕</button></div><div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-black/30 p-3"><b class="block text-amber-300">' + esc(p.xp || 0) + '</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-cyan-300">Level ' + esc(p.level || 1) + '</b><span class="text-[8px] text-slate-500">Level</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-violet-300">' + badges.length + '</b><span class="text-[8px] text-slate-500">Badges</span></div></div><h4 class="mt-5 text-sm font-black text-amber-300">🏅 All Badges</h4><div class="mt-3 grid grid-cols-2 gap-2">' + badgeGrid + '</div></div>';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    var close = byId('rh-close-profile-modal');
    if (close) close.onclick = function () { modal.classList.add('hidden'); };
  };

  function enhanceCommunity() {
    // People tab cards
    document.querySelectorAll('#people-box > div').forEach(function (card) {
      var followBtn = card.querySelector('button[onclick^="toggleFollow"]');
      var m = followBtn && String(followBtn.getAttribute('onclick') || '').match(/toggleFollow\('([^']+)'\)/);
      var uid = m && m[1];
      if (!uid) return;
      var p = profileCache.get(String(uid)) || {};
      var avatar = card.querySelector('.w-11.h-11');
      if (avatar && p.pfp_url && !avatar.querySelector('img')) avatar.innerHTML = '<img src="' + esc(p.pfp_url) + '" class="w-full h-full object-cover">';
      var name = card.querySelector('b');
      if (name) name.innerHTML = nameHtml(uid, p.name || name.textContent);
      if (!card.querySelector('.rh-view-profile-btn')) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rh-view-profile-btn bg-amber-600 hover:bg-amber-500 text-white min-w-[92px] px-3 py-2 rounded-lg text-xs font-black';
        btn.textContent = 'View Profile';
        btn.onclick = function (e) { e.stopPropagation(); window.openCommunityCollectionProfile(uid); };
        if (followBtn && followBtn.parentNode) followBtn.parentNode.insertBefore(btn, followBtn);
      }
    });

    // All posts author PFP/name
    document.querySelectorAll('article[id^="community-post-"]').forEach(function (article) {
      var postId = (article.id || '').replace('community-post-', '');
      var post = (window.posts || []).find(function (x) { return String(x.id) === String(postId); });
      if (!post || !post.author_id) return;
      var uid = String(post.author_id);
      var p = Object.assign({ name: post.author, pfp_url: post.pfp_url }, profileCache.get(uid) || {});
      var avatar = article.querySelector('.w-11.h-11.rounded-full');
      if (avatar) {
        avatar.style.cursor = 'pointer';
        if (p.pfp_url) avatar.innerHTML = '<img src="' + esc(p.pfp_url) + '" class="w-full h-full object-cover">';
        avatar.onclick = function (e) { e.stopPropagation(); window.openCommunityCollectionProfile(uid); };
      }
      var name = article.querySelector('div.min-w-0 b');
      if (name) {
        name.style.cursor = 'pointer';
        name.innerHTML = nameHtml(uid, p.name || post.author || name.textContent);
        name.onclick = function (e) { e.stopPropagation(); window.openCommunityCollectionProfile(uid); };
      }
      if (!article.querySelector('.rh-post-view-profile')) {
        var view = document.createElement('button');
        view.type = 'button';
        view.className = 'rh-post-view-profile rounded-full bg-amber-600/20 border border-amber-400/30 px-3 py-1 text-[10px] font-black text-amber-200 ml-2';
        view.textContent = 'View Profile';
        view.onclick = function (e) { e.stopPropagation(); window.openCommunityCollectionProfile(uid); };
        var holder = article.querySelector('div.min-w-0');
        if (holder) holder.appendChild(view);
      }
    });
  }

  async function showVaultCoupon() {
    var vault = byId('section-vault');
    if (!vault) return;
    var card = byId('vault-coupon-display');
    if (!card) {
      card = document.createElement('div');
      card.id = 'vault-coupon-display';
      card.className = 'rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4 mb-4';
      card.innerHTML = '<div class="flex items-center justify-between gap-3"><div><b class="text-cyan-200">🎟️ Latest Coupon Code</b><p class="mt-1 text-xs text-slate-400">Admin generate karega to sabko yahan code dikhega.</p></div><button type="button" id="vault-coupon-refresh" class="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black">Refresh</button></div><div id="vault-coupon-code" class="mt-3 rounded-xl bg-slate-950 p-3 text-sm font-black text-cyan-300">Loading...</div>';
      vault.insertBefore(card, vault.firstChild);
      var refresh = byId('vault-coupon-refresh');
      if (refresh) refresh.onclick = showVaultCoupon;
    }
    var out = byId('vault-coupon-code');
    if (!out || !window.db) return;
    try {
      var res = await db.from('hub_coupons').select('code,expires_at,created_at').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (res.data && res.data.code) out.innerHTML = '<span class="select-all">' + esc(res.data.code) + '</span><div class="mt-1 text-[10px] text-slate-500">Expires: ' + esc(new Date(res.data.expires_at).toLocaleString()) + '</div>';
      else out.textContent = 'Abhi koi coupon generate nahi hua';
    } catch (e) {
      out.textContent = 'Coupon table/RLS setup check required';
    }
  }

  function applySmallUiFixes() {
    hide(byId('coupon-access-card'));
    hide(byId('btn-studypower'));
    hide(document.querySelector('.rh-feature[onclick="switchTab(\'studypower\')"]'));
    var aiTutor = byId('btn-aitutor'); if (aiTutor) aiTutor.setAttribute('onclick', "switchTab('ai')");
    var aiLearning = byId('btn-quiz'); if (aiLearning) aiLearning.setAttribute('onclick', "switchTab('neet720')");
    var aiFeature = document.querySelector('.rh-feature[onclick="switchTab(\'quiz\')"]'); if (aiFeature) aiFeature.setAttribute('onclick', "switchTab('neet720')");
    var pdf = byId('pdf-quiz-form');
    var panel = pdf && pdf.closest('.qb-card,.rounded-3xl,.rounded-2xl,div');
    if (panel && !isAdmin()) hide(panel);
    showVaultCoupon();
    enhanceCommunity();
  }

  function hookSwitchTab() {
    if (window.__RH_SWITCH_PATCHED__) return;
    var old = window.switchTab;
    if (typeof old !== 'function') return;
    window.__RH_SWITCH_PATCHED__ = true;
    window.switchTab = function (tab) {
      if (tab === 'aitutor') tab = 'ai';
      if (tab === 'quiz') tab = 'neet720';
      if (tab === 'studypower') tab = 'home';
      var r = old.call(this, tab);
      setTimeout(function () { loadProfilesAndBadges().then(applySmallUiFixes); }, 150);
      return r;
    };
  }

  onReady(function () {
    setTimeout(removeSplash, 300);
    setTimeout(removeSplash, 1800);
    hookSwitchTab();
    loadProfilesAndBadges().then(applySmallUiFixes);
    setInterval(function () {
      hookSwitchTab();
      loadProfilesAndBadges().then(applySmallUiFixes);
    }, 3000);
  });
})();
