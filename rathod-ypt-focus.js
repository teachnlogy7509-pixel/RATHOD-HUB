/* RATHOD HUB • YPT-style public focus leaderboard + earned anime avatars */
(function(){
'use strict';
if(window.__RH_YPT_FOCUS__) return;
window.__RH_YPT_FOCUS__ = 1;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid = () => { try { return String(window.user?.id || ''); } catch (e) { return ''; } };
const db = () => { try { return window.db || null; } catch (e) { return null; } };
const toast = (text, ok=false) => { try { if (typeof window.toast === 'function') return window.toast(text, ok); } catch (e) {} console.log(text); };
const AVATAR_ASSETS = {
  avatar_scholar: 'assets/ypt-avatars/studymate.svg',
  avatar_medic: 'assets/ypt-avatars/targin.svg',
  avatar_scientist: 'assets/ypt-avatars/luna.svg',
  avatar_warrior: 'assets/ypt-avatars/max.svg',
  avatar_phoenix: 'assets/ypt-avatars/river.svg'
};

function fmt(sec){
  sec = Math.max(0, Number(sec) || 0);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function fmtShort(sec){
  sec = Math.max(0, Number(sec) || 0);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}
function date(v){ try { return new Date(`${v}T00:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); } catch (e) { return v || ''; } }
function initials(name){ return String(name || 'A').trim().slice(0,1).toUpperCase(); }
function host(){ return $('section-focus') || $('section-studypower') || $('section-focusroom') || document.querySelector('[data-section="focus"]'); }
function parseJsonMaybe(value){ if (Array.isArray(value) || !value) return value; if (typeof value === 'string') { try { return JSON.parse(value); } catch (e) { return []; } } return value; }
function avatarAsset(item){ return item?.avatar_asset || AVATAR_ASSETS[item?.avatar_item_id] || AVATAR_ASSETS[item?.item_id] || ''; }
function avatarHtml(item, size='h-11 w-11', extra=''){
  const asset = avatarAsset(item);
  if (asset) return `<img src="${esc(asset)}" alt="" class="${size} rounded-2xl object-cover ${extra}">`;
  if (item?.pfp_url) return `<img src="${esc(item.pfp_url)}" alt="" class="${size} rounded-2xl object-cover ${extra}">`;
  return `<div class="grid ${size} place-items-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-sm font-black text-white ${extra}">${esc(initials(item?.name))}</div>`;
}

function ensureCard(){
  let card = $('rh-ypt-focus-card');
  if (card) return card;
  const parent = host();
  if (!parent) return null;
  card = document.createElement('div');
  card.id = 'rh-ypt-focus-card';
  card.className = 'mt-6 rounded-[28px] border border-orange-400/20 bg-[#111111] p-5 shadow-2xl';
  card.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="text-[9px] font-black uppercase tracking-[.22em] text-orange-300">Study together • motivate each other</div>
        <h3 class="mt-1 text-xl font-black text-white">🔥 3-Day Focus Room</h3>
        <p id="rh-ypt-cycle-label" class="mt-1 text-xs text-slate-400">Live focus room + YPT-style earned anime avatars.</p>
      </div>
      <button id="rh-ypt-refresh" type="button" class="rounded-xl border border-orange-300/20 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-100">Refresh</button>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Students</div><b id="rh-ypt-students" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Total focus</div><b id="rh-ypt-total" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Your rank</div><b id="rh-ypt-rank" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Focus 3 days</div><b id="rh-ypt-3day-focus" class="mt-1 block text-lg text-white">—</b></div>
    </div>
    <div id="rh-ypt-current-avatar" class="mt-4 rounded-[24px] border border-orange-300/15 bg-[#171717] p-4">Avatar data load ho raha hai…</div>
    <div id="rh-ypt-board" class="mt-4 space-y-2"><div class="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">Leaderboard load ho raha hai…</div></div>
    <div class="mt-4 rounded-[24px] border border-orange-300/15 bg-[#171717] p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[9px] font-black uppercase tracking-[.22em] text-orange-300">Earned anime avatars</div>
          <h4 class="mt-1 text-lg font-black text-white">Study more, unlock more</h4>
          <p class="mt-1 text-xs text-slate-400">24h se start. Unrealistic 72h target hata diya hai.</p>
        </div>
        <div class="text-right">
          <div class="text-[9px] uppercase tracking-wider text-slate-500">Window</div>
          <b class="text-sm text-white">Last 3 days</b>
        </div>
      </div>
      <div id="rh-ypt-avatar-grid" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"></div>
    </div>
    <p class="mt-3 text-[10px] leading-4 text-slate-500">Focus leaderboard 30-day cycle par hai. Avatar unlock progress sirf last 3 days focus se decide hota hai.</p>`;
  parent.appendChild(card);
  $('rh-ypt-refresh').onclick = refreshAll;
  return card;
}

function subjectHtml(subjects){
  return (Array.isArray(subjects) ? subjects : []).slice(0, 6).map(s => `<span class="inline-flex items-center gap-1 rounded-full border border-orange-300/10 bg-orange-500/10 px-2 py-1 text-[10px] text-orange-100"><b>${esc(s.subject || 'Other')}</b><span class="text-orange-300">${fmtShort(s.seconds)}</span></span>`).join('') || '<span class="text-[10px] text-slate-500">Subject data nahi hai</span>';
}

function row(item){
  const mine = String(item.user_id) === uid();
  return `<div class="rounded-[22px] border ${mine ? 'border-orange-300/40 bg-orange-500/10' : 'border-white/8 bg-black/15'} p-3">
    <div class="flex items-start gap-3">
      <div class="grid h-7 min-w-7 place-items-center rounded-full bg-white/10 text-xs font-black text-orange-200">${esc(item.rank)}</div>
      <div class="relative">${avatarHtml(item,'h-14 w-14','shadow-lg')}<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-black text-orange-300">${fmtShort(item.total_seconds)}</span></div>
      <div class="min-w-0 flex-1 pt-1">
        <div class="flex flex-wrap items-center gap-2"><b class="truncate text-sm text-white">${esc(item.name || 'Aspirant')}</b>${mine ? '<span class="rounded-full bg-orange-400/15 px-2 py-0.5 text-[9px] font-black text-orange-200">YOU</span>' : ''}</div>
        <div class="mt-2 flex flex-wrap gap-1">${subjectHtml(item.subjects)}</div>
      </div>
      <div class="text-right pt-1"><b class="block text-sm text-orange-200">${fmt(item.total_seconds)}</b><span class="text-[9px] text-slate-500">${esc(item.session_count)} sessions</span></div>
    </div>
  </div>`;
}

function rewardCard(item){
  const unlocked = !!item.unlocked;
  const equipped = !!item.equipped;
  const locked = !unlocked;
  const remaining = Number(item.remaining_seconds || 0);
  const btn = equipped
    ? '<button type="button" disabled class="rounded-xl border border-orange-300/20 bg-orange-500/15 px-3 py-2 text-[11px] font-black text-orange-100">Using now</button>'
    : unlocked
      ? `<button type="button" data-ypt-avatar-equip="${esc(item.item_id)}" class="rounded-xl border border-orange-300/20 bg-orange-500/15 px-3 py-2 text-[11px] font-black text-orange-100">Choose</button>`
      : `<div class="rounded-xl border border-slate-700 bg-black/30 px-3 py-2 text-[11px] font-black text-slate-400">${fmtShort(remaining)} left</div>`;
  return `<div class="rounded-[24px] border ${equipped ? 'border-orange-300/40 bg-orange-500/10' : unlocked ? 'border-white/10 bg-black/20' : 'border-white/8 bg-black/25'} p-3">
    <div class="flex items-start gap-3">
      <div class="relative h-[92px] w-[92px] overflow-hidden rounded-[22px] border ${locked ? 'border-white/8 opacity-70 grayscale' : 'border-orange-300/20'} bg-[#121212] p-1">
        ${avatarHtml(item,'h-full w-full','')}
        <div class="absolute left-2 top-2 rounded-full ${locked ? 'bg-black/70 text-slate-300' : 'bg-orange-500/20 text-orange-100'} px-2 py-1 text-[9px] font-black uppercase tracking-wider">${locked ? 'Locked' : equipped ? 'Active' : 'Unlocked'}</div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2"><b class="truncate text-sm text-white">${esc(item.name || 'Avatar')}</b><span class="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-300">${esc(item.tier_label || '')}</span></div>
        <p class="mt-1 text-[11px] leading-4 text-slate-400">${esc(item.rule_text || '')}</p>
        <p class="mt-1 text-[10px] text-slate-500">${esc(item.description || 'Anime reward avatar')}</p>
        <div class="mt-3 flex items-center justify-between gap-3"><span class="text-[11px] font-black ${locked ? 'text-slate-400' : 'text-orange-200'}">Target • ${Number(item.target_hours || 0)}h</span>${btn}</div>
      </div>
    </div>
  </div>`;
}

function bindRewardButtons(){
  document.querySelectorAll('[data-ypt-avatar-equip]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const itemId = btn.getAttribute('data-ypt-avatar-equip');
      if (!itemId) return;
      const client = db();
      if (!client) return;
      const old = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Choosing...';
      try {
        const res = await client.rpc('equip_focus_avatar', { p_item_id: itemId });
        if (res.error) throw res.error;
        toast('Anime avatar choose ho gaya ✅', true);
        await refreshAll();
      } catch (e) {
        toast(e.message || 'Avatar choose nahi hua');
        btn.disabled = false;
        btn.textContent = old;
      }
    });
  });
}

async function loadLeaderboard(){
  const card = ensureCard();
  if (!card) return;
  const client = db();
  if (!client) {
    $('rh-ypt-board').innerHTML = '<div class="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-xs text-amber-100">Study leaderboard login ke baad available hoga.</div>';
    return;
  }
  try {
    const [cycleRes, boardRes] = await Promise.all([
      client.rpc('get_ypt_focus_cycle'),
      client.rpc('get_ypt_focus_leaderboard', { p_limit: 100 })
    ]);
    if (cycleRes.error) throw cycleRes.error;
    if (boardRes.error) throw boardRes.error;
    const cycle = Array.isArray(cycleRes.data) ? cycleRes.data[0] : cycleRes.data;
    const rows = Array.isArray(boardRes.data) ? boardRes.data : [];
    $('rh-ypt-cycle-label').textContent = cycle ? `Current cycle: ${date(cycle.cycle_start)} – ${date(cycle.cycle_end)} • leaderboard 30-day focus par` : '30-day cycle active';
    $('rh-ypt-students').textContent = rows.length;
    $('rh-ypt-total').textContent = fmtShort(rows.reduce((n, x) => n + Number(x.total_seconds || 0), 0));
    const mine = rows.find(x => String(x.user_id) === uid());
    $('rh-ypt-rank').textContent = mine ? `#${mine.rank}` : '—';
    $('rh-ypt-board').innerHTML = rows.length ? rows.map(row).join('') : '<div class="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">Is cycle mein abhi study session nahi hai.</div>';
  } catch (e) {
    console.warn('YPT leaderboard load skipped', e);
    $('rh-ypt-board').innerHTML = '<div class="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-xs text-rose-100">Leaderboard load nahi hua.</div>';
  }
}

async function loadAvatarRewards(){
  const card = ensureCard();
  if (!card) return;
  const client = db();
  if (!client || !uid()) {
    $('rh-ypt-3day-focus').textContent = '—';
    $('rh-ypt-current-avatar').innerHTML = '<div class="text-xs text-amber-100">Login ke baad YPT-style avatar progress dikhega.</div>';
    $('rh-ypt-avatar-grid').innerHTML = '<div class="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">Login ke baad focus karke anime avatars unlock kar sakte ho.</div>';
    return;
  }
  try {
    const res = await client.rpc('get_focus_avatar_status');
    if (res.error) throw res.error;
    const status = Array.isArray(res.data) ? res.data[0] : (res.data || {});
    const avatars = (parseJsonMaybe(status.avatars) || []).map(a => ({ ...a, avatar_asset: AVATAR_ASSETS[a.item_id] || '' }));
    const totalSeconds = Number(status.total_seconds || 0);
    const equipped = avatars.find(x => x.equipped) || null;
    const next = avatars.find(x => !x.unlocked) || null;
    $('rh-ypt-3day-focus').textContent = fmt(totalSeconds);

    const summaryTop = equipped
      ? `<div class="flex items-center gap-4">${avatarHtml(equipped,'h-20 w-20','')}<div><div class="text-[10px] font-black uppercase tracking-wider text-orange-300">Current anime avatar</div><b class="text-base text-white">${esc(equipped.name)}</b><p class="mt-1 text-[11px] text-slate-400">Unlocked by study. Focus room me yehi avatar dikh raha hoga.</p></div></div>`
      : `<div><div class="text-[10px] font-black uppercase tracking-wider text-orange-300">First unlock target</div><b class="text-base text-white">24 hours in 3 days</b><p class="mt-1 text-[11px] text-slate-400">Abhi ${fmtShort(Math.max(86400 - totalSeconds, 0))} aur focus chahiye pehla anime avatar unlock karne ke liye.</p></div>`;

    const nextBlock = next
      ? `<div class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3"><div class="flex items-center justify-between gap-3"><div><div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Next unlock</div><b class="text-sm text-white">${esc(next.name)} • ${Number(next.target_hours || 0)}h</b><p class="mt-1 text-[11px] text-slate-400">${esc(next.rule_text || '')}</p></div><div class="text-right"><b class="block text-sm text-orange-200">${fmtShort(Number(next.remaining_seconds || 0))}</b><span class="text-[10px] text-slate-500">remaining</span></div></div></div>`
      : `<div class="mt-4 rounded-2xl border border-orange-300/15 bg-orange-500/10 p-3 text-xs text-orange-100">Sabhi current anime avatars unlock ho gaye ✅</div>`;

    $('rh-ypt-current-avatar').innerHTML = summaryTop + nextBlock;
    $('rh-ypt-avatar-grid').innerHTML = avatars.length ? avatars.map(rewardCard).join('') : '<div class="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">Avatar milestones abhi ready nahi hain.</div>';
    bindRewardButtons();
  } catch (e) {
    console.warn('YPT avatar rewards skipped', e);
    $('rh-ypt-current-avatar').innerHTML = '<div class="text-xs text-rose-100">Avatar milestone load nahi hua.</div>';
    $('rh-ypt-avatar-grid').innerHTML = '<div class="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-xs text-rose-100">Study-based anime avatar setup pending hai.</div>';
  }
}

async function refreshAll(){
  await Promise.all([loadLeaderboard(), loadAvatarRewards()]);
}

function boot(){
  ensureCard();
  setTimeout(refreshAll, 900);
  setInterval(() => { if (document.visibilityState !== 'hidden') refreshAll(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAll(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
