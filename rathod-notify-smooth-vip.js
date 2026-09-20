/* VIP notification smoothing + background feature removal */
(function(){
'use strict';
if(window.__RH_NOTIFY_SMOOTH_VIP__) return;
window.__RH_NOTIFY_SMOOTH_VIP__ = 1;

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const LIMIT = 120;
const nowIso = () => new Date().toISOString();
const safeText = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const panel = () => document.getElementById('hub-notify-panel');
const badge = () => document.getElementById('hub-notify-badge');
const mobileSheet = () => document.getElementById('rh-mobile-notify-sheet');
const getUserId = () => window.user?.id || 'guest';
const keyStore = () => `rh_hub_notifications_${getUserId()}`;
const keySeen = () => `rh_hub_notification_seen_${getUserId()}`;

function ensureStyle(){
  if(document.getElementById('rh-notify-smooth-vip-style')) return;
  const style = document.createElement('style');
  style.id = 'rh-notify-smooth-vip-style';
  style.textContent = `
    #toast{top:84px!important;right:16px!important;left:auto!important;z-index:1400!important;background:linear-gradient(135deg,rgba(13,22,33,.97),rgba(48,10,18,.97))!important;border:1px solid rgba(250,204,21,.35)!important;color:#fff!important;box-shadow:0 18px 45px rgba(0,0,0,.34)!important}
    .rh-notify-wrap{position:static!important}
    .rh-notify-panel{position:fixed!important;top:78px!important;right:16px!important;left:auto!important;width:min(420px,calc(100vw - 24px))!important;max-height:min(76vh,580px)!important;background:linear-gradient(180deg,rgba(7,10,16,.98),rgba(14,17,26,.98))!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:22px!important;box-shadow:0 24px 70px rgba(0,0,0,.50)!important;backdrop-filter:blur(18px)!important;overflow:hidden!important;z-index:1300!important}
    .rh-notify-panel .rh-vip-head{padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0))}
    .rh-notify-panel .rh-vip-head b{font-size:14px;color:#fff;display:block}
    .rh-notify-panel .rh-vip-head p{font-size:10px;color:#94a3b8;margin-top:4px}
    .rh-notify-clear{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fca5a5;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:900}
    .rh-notify-list-vip{max-height:min(62vh,480px);overflow:auto;padding:10px}
    .rh-notify-item{position:relative;display:flex;gap:12px;width:100%;padding:12px 12px 12px 14px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.03);margin-bottom:10px;cursor:pointer;transition:.18s;text-align:left}
    .rh-notify-item:last-child{margin-bottom:0}
    .rh-notify-item:hover{transform:translateY(-1px);border-color:rgba(250,204,21,.22);background:rgba(255,255,255,.05)}
    .rh-notify-item.unread{border-color:rgba(250,204,21,.30);box-shadow:0 0 0 1px rgba(250,204,21,.10) inset;background:linear-gradient(135deg,rgba(245,158,11,.09),rgba(255,255,255,.03))}
    .rh-notify-icon{width:44px;height:44px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(245,158,11,.18),rgba(239,68,68,.12));border:1px solid rgba(250,204,21,.22);font-size:20px;flex:none}
    .rh-notify-content{min-width:0;flex:1}
    .rh-notify-content b{display:block;font-size:13px;color:#fff;line-height:1.35}
    .rh-notify-content p{font-size:11px;color:#d7dde7;line-height:1.6;margin-top:4px}
    .rh-notify-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
    .rh-notify-time{font-size:10px;color:#94a3b8}
    .rh-notify-pill{font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#fde68a;border:1px solid rgba(250,204,21,.22);background:rgba(250,204,21,.08);padding:4px 7px;border-radius:999px}
    .rh-notify-dot{position:absolute;right:12px;top:12px;width:9px;height:9px;border-radius:999px;background:#fbbf24;box-shadow:0 0 0 4px rgba(251,191,36,.10)}
    .rh-notify-empty{padding:30px 16px;text-align:center;color:#94a3b8;font-size:11px;line-height:1.7;border:1px dashed rgba(255,255,255,.10);border-radius:18px;background:rgba(255,255,255,.02)}
    .rh-notify-badge{background:linear-gradient(135deg,#f59e0b,#ef4444)!important;box-shadow:0 6px 18px rgba(239,68,68,.35)!important;border:2px solid #07090d!important}
    @media (max-width:640px){
      #toast{top:68px!important;right:10px!important;left:10px!important;max-width:none!important}
      .rh-notify-panel{top:66px!important;right:10px!important;left:10px!important;width:auto!important;max-height:70vh!important;border-radius:20px!important}
    }
  `;
  document.head.appendChild(style);
}

function getSeenSet(){
  try{return new Set(JSON.parse(localStorage.getItem(keySeen()) || '[]').map(String));}
  catch{return new Set();}
}
function saveSeenSet(set){
  try{localStorage.setItem(keySeen(), JSON.stringify(Array.from(set).slice(-500)));}
  catch{}
}
function markSeen(ids){
  const seen = getSeenSet();
  (ids || []).filter(Boolean).forEach(id => seen.add(String(id)));
  saveSeenSet(seen);
}
function isSeen(id){
  return getSeenSet().has(String(id));
}
function purgeNotifications(rows){
  const cutoff = Date.now() - THREE_DAYS_MS;
  return (Array.isArray(rows) ? rows : []).filter(Boolean).map(item => {
    const createdAt = item.created_at || item.createdAt || nowIso();
    return {
      ...item,
      id: String(item.id || (`local_${Date.now()}_${Math.random().toString(36).slice(2)}`)),
      created_at: createdAt,
      icon: item.icon || (typeof hubNotificationIcon === 'function' ? hubNotificationIcon(item.tag) : '🔔')
    };
  }).filter(item => {
    const ts = new Date(item.created_at).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, LIMIT);
}
function readStore(){
  try{return purgeNotifications(JSON.parse(localStorage.getItem(keyStore()) || '[]'));}
  catch{return [];}
}
function writeStore(list){
  try{localStorage.setItem(keyStore(), JSON.stringify(purgeNotifications(list)));}
  catch{}
}
function vipMarkup(){
  const items = purgeNotifications(typeof hubNotifications !== 'undefined' ? hubNotifications : []);
  if(!items.length){
    return '<div class="rh-notify-empty">Koi recent notification nahi hai.<br>Ab last 3 days ka history yahin visible rahega.</div>';
  }
  return items.map(item => {
    const unread = !isSeen(item.id);
    const tag = String(item.tag || 'update').replace(/_/g,' ');
    return `<button class="rh-notify-item ${unread ? 'unread' : ''}" onclick="openHubNotification('${safeText(item.id)}')">
      <div class="rh-notify-icon">${safeText(item.icon || '🔔')}</div>
      <div class="rh-notify-content">
        <b>${safeText(item.title || 'RATHOD HUB')}</b>
        <p>${safeText(item.body || '')}</p>
        <div class="rh-notify-meta">
          <span class="rh-notify-pill">${safeText(tag)}</span>
          <span class="rh-notify-time">${new Date(item.created_at || Date.now()).toLocaleString()}</span>
        </div>
      </div>
      ${unread ? '<span class="rh-notify-dot"></span>' : ''}
    </button>`;
  }).join('');
}
function unreadCount(){
  return purgeNotifications(typeof hubNotifications !== 'undefined' ? hubNotifications : []).filter(item => !isSeen(item.id)).length;
}
function renderVip(){
  if(typeof hubNotifications === 'undefined') return;
  hubNotifications = purgeNotifications(hubNotifications);
  writeStore(hubNotifications);
  const markup = vipMarkup();
  ['hub-notify-list','hub-notify-list-mobile'].forEach(id => {
    const el = document.getElementById(id);
    if(el){
      el.classList.add('rh-notify-list-vip');
      el.innerHTML = markup;
    }
  });
  const n = unreadCount();
  const b = badge();
  if(b){
    b.textContent = n > 99 ? '99+' : String(n);
    b.style.display = n ? 'flex' : 'none';
  }
  const p = panel();
  if(p){
    const existing = p.querySelector('.rh-vip-head');
    if(!existing){
      const header = document.createElement('div');
      header.className = 'rh-vip-head';
      header.innerHTML = `<div><b>🔔 VIP Notifications</b><p>Last 3 days ka clean history</p></div><button class="rh-notify-clear" onclick="clearHubNotifications()">Clear all</button>`;
      p.prepend(header);
    }
  }
}
function addOrMerge(item, opts={}){
  if(!item) return null;
  const id = String(item.id || (`local_${Date.now()}_${Math.random().toString(36).slice(2)}`));
  const list = purgeNotifications(typeof hubNotifications !== 'undefined' ? hubNotifications : []);
  const existing = list.findIndex(x => String(x.id) === id);
  const row = {
    id,
    title: item.title || 'RATHOD HUB',
    body: item.body || '',
    tag: item.tag || 'rathod-hub',
    action: item.action || '',
    metadata: item.metadata || {},
    created_at: item.created_at || nowIso(),
    icon: item.icon || (typeof hubNotificationIcon === 'function' ? hubNotificationIcon(item.tag) : '🔔')
  };
  if(existing >= 0) list[existing] = {...list[existing], ...row};
  else list.unshift(row);
  hubNotifications = purgeNotifications(list);
  writeStore(hubNotifications);
  renderVip();
  if(!opts.silent && typeof toast === 'function') toast(`${row.icon} ${row.title}`);
  return row;
}

window.loadHubNotificationStore = function(){
  if(typeof hubNotifications === 'undefined') return;
  hubNotifications = readStore();
  renderVip();
};
window.saveHubNotificationStore = function(){
  if(typeof hubNotifications === 'undefined') return;
  hubNotifications = purgeNotifications(hubNotifications);
  writeStore(hubNotifications);
  renderVip();
};
window.renderHubNotifications = renderVip;
window.hubNotificationMarkup = vipMarkup;
window.toggleHubNotifications = function(){
  const mobile = window.matchMedia('(max-width:640px)').matches;
  const el = mobile ? mobileSheet() : panel();
  if(!el) return;
  renderVip();
  el.classList.toggle('hidden');
  if(!el.classList.contains('hidden') && 'Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission().catch(()=>{});
  }
};
window.clearHubNotifications = function(){
  if(typeof hubNotifications === 'undefined') return;
  markSeen(hubNotifications.map(x => x.id));
  hubNotifications = [];
  writeStore([]);
  renderVip();
  if(typeof toast === 'function') toast('Notifications cleared ✓');
};
window.dismissHubNotification = function(id){
  if(typeof hubNotifications === 'undefined' || !id) return;
  markSeen([id]);
  hubNotifications = purgeNotifications(hubNotifications.filter(x => String(x.id) !== String(id)));
  writeStore(hubNotifications);
  renderVip();
};
window.openHubNotification = function(id){
  const current = (typeof hubNotifications !== 'undefined' ? hubNotifications : []).find(x => String(x.id) === String(id));
  if(!current) return;
  markSeen([id]);
  renderVip();
  panel()?.classList.add('hidden');
  mobileSheet()?.classList.add('hidden');
  if(current.action === 'community'){
    switchTab('community');
    if(current.metadata?.community_tab === 'people') return setCommunityFeed('people');
    const postId = current.metadata?.post_id;
    if(postId){
      communityOpenComments.add(String(postId));
      renderPosts();
      setTimeout(()=>document.getElementById(`community-post-${postId}`)?.scrollIntoView({behavior:'smooth',block:'center'}),150);
    }
    return;
  }
  if(['battle','livequiz'].includes(current.action) && current.metadata?.room){
    switchTab('battle');
    setTimeout(()=>qbJoinRoom(current.metadata.room),250);
    return;
  }
  const actions = {battle:()=>switchTab('battle'),livequiz:()=>switchTab('battle'),dailyquiz:()=>openDailyBattle(),materials:()=>switchTab('materials'),material:()=>switchTab('materials'),studyrooms:()=>switchTab('studyrooms'),event:()=>switchTab('hubevents'),hubevents:()=>switchTab('hubevents'),tests:()=>openLiveQuizSection('live-45q-panel'),test:()=>openLiveQuizSection('live-45q-panel'),treasure:()=>switchTab('treasure'),group:()=>switchTab('community'),bounty:()=>switchTab('community'),aicards:()=>switchTab('aicards'),dailyformula:()=>switchTab('dailyformula'),leaderboard:()=>switchTab('leaderboard'),game:()=>switchTab('games'),games:()=>switchTab('games'),rathodnew:()=>switchTab('rathodnew')};
  actions[current.action]?.();
};
window.showHubNotification = function(title,body,tag='rathod-hub',action='',opts={}){
  if(typeof hubNotificationIsForMe === 'function' && !hubNotificationIsForMe({metadata:opts.metadata})) return null;
  return addOrMerge({id: opts.id, title, body, tag, action, metadata: opts.metadata || {}, created_at: opts.created_at || nowIso(), icon: opts.icon}, opts);
};
window.normalizeHubNotificationRow = function(row){
  return {id: row.id, title: row.title || 'RATHOD HUB', body: row.body || '', tag: row.tag || 'rathod-hub', action: row.action || '', metadata: row.metadata || {}, created_at: row.created_at || nowIso()};
};
window.loadPersistedHubNotifications = async function(){
  try{
    const cutoff = new Date(Date.now() - THREE_DAYS_MS).toISOString();
    const {data,error} = await db.from('hub_notifications').select('id,title,body,tag,action,metadata,created_at,expires_at').gte('created_at', cutoff).gt('expires_at', nowIso()).order('created_at',{ascending:false}).limit(LIMIT);
    if(error) throw error;
    const rows = (data || []).filter(row => typeof hubNotificationIsForMe !== 'function' || hubNotificationIsForMe(row));
    const list = purgeNotifications([...(hubNotifications || []), ...rows.map(row => ({
      id: row.id,
      title: row.title,
      body: row.body,
      tag: row.tag,
      action: row.action,
      metadata: row.metadata || {},
      created_at: row.created_at,
      icon: typeof hubNotificationIcon === 'function' ? hubNotificationIcon(row.tag) : '🔔'
    }))]);
    hubNotifications = list;
    writeStore(list);
    renderVip();
  }catch(e){
    console.info('VIP notification history fallback active.', e?.message || e);
  }
};

function removeDynamicStudio(){
  const adminPanel = document.getElementById('admin-bg-panel');
  if(adminPanel) adminPanel.remove();
  document.querySelectorAll('button').forEach(btn => {
    const txt = (btn.textContent || '').toLowerCase();
    const oc = btn.getAttribute('onclick') || '';
    if(txt.includes('dynamic studio') || txt.includes('background') || oc.includes('admin-bg-panel')) btn.remove();
  });
  const vipBg = document.getElementById('rh-vip-launch-bg');
  if(vipBg) vipBg.remove();
  const layer = document.getElementById('hub-bg-layer');
  const overlay = document.getElementById('hub-bg-overlay');
  if(layer){
    layer.innerHTML = '';
    layer.style.backgroundImage = '';
    layer.style.filter = '';
    layer.style.opacity = '';
  }
  if(overlay) overlay.style.background = 'rgba(0,0,0,.2)';
}

function boot(){
  ensureStyle();
  removeDynamicStudio();
  if(typeof hubNotifications !== 'undefined'){
    hubNotifications = readStore();
    renderVip();
    window.loadPersistedHubNotifications?.();
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 700), {once:true});
else setTimeout(boot, 700);
setInterval(() => {
  removeDynamicStudio();
  if(typeof hubNotifications !== 'undefined'){
    hubNotifications = purgeNotifications(hubNotifications);
    writeStore(hubNotifications);
    renderVip();
  }
}, 60 * 1000);
window.addEventListener('resize', renderVip);
document.addEventListener('click', e => {
  const wrap = document.querySelector('.rh-notify-wrap');
  if(wrap && !wrap.contains(e.target)) panel()?.classList.add('hidden');
});
})();
