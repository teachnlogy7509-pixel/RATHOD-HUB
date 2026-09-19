/* RATHOD HUB • YPT-style public focus leaderboard + colorful anime avatars */
(function(){
'use strict';
if(window.__RH_YPT_FOCUS__) return;
window.__RH_YPT_FOCUS__ = 1;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const uid = () => { try { return String(window.user?.id || ''); } catch (e) { return ''; } };
const db = () => { try { return window.db || null; } catch (e) { return null; } };
const toast = (text, ok=false) => { try { if (typeof window.toast === 'function') return window.toast(text, ok); } catch (e) {} console.log(text); };

const AVATAR_LIBRARY = {
  avatar_scholar: { name:'Haru', accent:'#FF9F1C', glow:'#FFD166', hair:'#1F2937', shirt:'#F6C453', skin:'#F3D2B6', bg1:'#2B1607', bg2:'#120F0C', accessory:'book', gender:'boy' },
  avatar_medic: { name:'Aiko', accent:'#FF7A59', glow:'#FFC6B3', hair:'#5A3E36', shirt:'#FFF7F4', skin:'#F3D0B5', bg1:'#2A130F', bg2:'#120D0C', accessory:'plus', gender:'girl' },
  avatar_girl_muse: { name:'Yuna', accent:'#FF6FB5', glow:'#FFC2E2', hair:'#33224D', shirt:'#FFD7EA', skin:'#F1CEB4', bg1:'#2A1021', bg2:'#140D13', accessory:'star', gender:'girl' },
  avatar_scientist: { name:'Luna', accent:'#52B6FF', glow:'#B9E6FF', hair:'#101828', shirt:'#E6F4FF', skin:'#F2D0B4', bg1:'#0C1828', bg2:'#0A1017', accessory:'flask', gender:'girl' },
  avatar_warrior: { name:'Ren', accent:'#8B5CF6', glow:'#D8B4FE', hair:'#2B2B2B', shirt:'#DDD6FE', skin:'#EEC39E', bg1:'#171126', bg2:'#0E0A15', accessory:'bolt', gender:'boy' },
  avatar_boy_ace: { name:'Leo', accent:'#10B981', glow:'#A7F3D0', hair:'#2B1B12', shirt:'#D1FAE5', skin:'#EFC7A8', bg1:'#0D201B', bg2:'#09110E', accessory:'leaf', gender:'boy' },
  avatar_phoenix: { name:'Sakura', accent:'#F97316', glow:'#FDBA74', hair:'#2C1E2A', shirt:'#FFE7D6', skin:'#F4CCB0', bg1:'#291409', bg2:'#120F0C', accessory:'flame', gender:'girl' },
  avatar_rare_doctor_f: { name:'Kiara', accent:'#F43F5E', glow:'#FDA4AF', hair:'#3B2E5C', shirt:'#FFF1F3', skin:'#F2C9AD', bg1:'#2A0F1A', bg2:'#130C10', accessory:'heart', gender:'girl' },
  avatar_boy_focus: { name:'Arjun', accent:'#06B6D4', glow:'#A5F3FC', hair:'#111827', shirt:'#DCF9FF', skin:'#EAC09E', bg1:'#0B1D23', bg2:'#091015', accessory:'target', gender:'boy' },
  avatar_rare_scientist_f: { name:'Mira', accent:'#7C3AED', glow:'#C4B5FD', hair:'#261C44', shirt:'#EEE7FF', skin:'#F0CAB0', bg1:'#160F2C', bg2:'#0C0915', accessory:'moon', gender:'girl' },
  avatar_boy_blaze: { name:'Kian', accent:'#FB7185', glow:'#FBCFE8', hair:'#1F2937', shirt:'#FFE4EA', skin:'#EDC29E', bg1:'#29111A', bg2:'#130D12', accessory:'spark', gender:'boy' },
  avatar_girl_mint: { name:'Hina', accent:'#14B8A6', glow:'#99F6E4', hair:'#3A264D', shirt:'#D7FFF8', skin:'#F3D1B7', bg1:'#0E201D', bg2:'#0A1110', accessory:'gem', gender:'girl' },
  avatar_rare_queen_f: { name:'Tara', accent:'#EAB308', glow:'#FDE68A', hair:'#1E1B4B', shirt:'#FFF7CC', skin:'#F0C7AA', bg1:'#241C07', bg2:'#14100A', accessory:'crown', gender:'girl' },
  avatar_boy_noir: { name:'Zayn', accent:'#94A3B8', glow:'#E2E8F0', hair:'#09090B', shirt:'#E5E7EB', skin:'#E9BC98', bg1:'#171717', bg2:'#0A0A0A', accessory:'diamond', gender:'boy' },
  avatar_girl_rose: { name:'Riya', accent:'#EC4899', glow:'#F9A8D4', hair:'#4C1D95', shirt:'#FFE0F1', skin:'#EFC8AE', bg1:'#260F1F', bg2:'#120C11', accessory:'rose', gender:'girl' },
  avatar_boy_sky: { name:'Dev', accent:'#38BDF8', glow:'#BAE6FD', hair:'#3F2C1F', shirt:'#E0F2FE', skin:'#EDC7A5', bg1:'#0D1D2A', bg2:'#0B1015', accessory:'wing', gender:'boy' },
  avatar_boy_storm: { name:'Max', accent:'#A855F7', glow:'#DDD6FE', hair:'#1F2937', shirt:'#F3E8FF', skin:'#E9BF9A', bg1:'#160F24', bg2:'#0C0A12', accessory:'storm', gender:'boy' },
  avatar_girl_neon: { name:'Naina', accent:'#22C55E', glow:'#BBF7D0', hair:'#25113A', shirt:'#E8FFE8', skin:'#F1CEB3', bg1:'#0D1F16', bg2:'#09110D', accessory:'music', gender:'girl' }
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
function pct(v){ return `${Math.max(0, Math.min(100, Number(v) || 0))}%`; }
function date(v){ try { return new Date(`${v}T00:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); } catch (e) { return v || ''; } }
function initials(name){ return String(name || 'A').trim().slice(0,1).toUpperCase(); }
function host(){ return $('section-focus') || $('section-studypower') || $('section-focusroom') || document.querySelector('[data-section="focus"]'); }
function parseJsonMaybe(value){ if (Array.isArray(value) || !value) return value; if (typeof value === 'string') { try { return JSON.parse(value); } catch (e) { return []; } } return value; }

function accessorySvg(kind, accent){
  switch(kind){
    case 'plus': return `<path d="M186 66h16v12h-16v16h-12V78h-16V66h16V50h12z" fill="${accent}"/>`;
    case 'star': return `<path d="M188 46l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2 6-12z" fill="${accent}"/>`;
    case 'flask': return `<path d="M177 46h16v10l-5 12 16 27c4 6 0 13-7 13h-24c-7 0-11-7-7-13l16-27-5-12V46z" fill="${accent}" opacity="0.95"/>`;
    case 'bolt': return `<path d="M186 46l-12 24h12l-10 22 28-28h-12l8-18z" fill="${accent}"/>`;
    case 'leaf': return `<path d="M192 46c-18 4-28 16-30 35 18 1 33-7 42-27-1-3-4-6-12-8z" fill="${accent}"/>`;
    case 'flame': return `<path d="M184 48c9 10 12 18 9 26-2 5-7 11-15 15 2-8-1-15-8-21 4 0 8-7 14-20z" fill="${accent}"/>`;
    case 'heart': return `<path d="M188 50c8 0 14 6 14 14 0 15-14 23-26 33-12-10-26-18-26-33 0-8 6-14 14-14 5 0 9 2 12 6 3-4 7-6 12-6z" fill="${accent}"/>`;
    case 'target': return `<circle cx="188" cy="68" r="19" stroke="${accent}" stroke-width="8" fill="none"/><circle cx="188" cy="68" r="8" fill="${accent}"/>`;
    case 'moon': return `<path d="M196 48c-4 2-8 8-8 17 0 11 8 20 18 22-4 3-10 5-16 5-16 0-28-12-28-27s12-27 28-27c2 0 4 0 6 1z" fill="${accent}"/>`;
    case 'spark': return `<path d="M188 46l4 13 13 4-13 4-4 13-4-13-13-4 13-4 4-13z" fill="${accent}"/>`;
    case 'gem': return `<path d="M188 46l18 18-18 24-18-24 18-18z" fill="${accent}"/>`;
    case 'crown': return `<path d="M168 84l6-32 14 16 14-16 6 32z" fill="${accent}"/><rect x="166" y="84" width="44" height="10" rx="5" fill="${accent}"/>`;
    case 'diamond': return `<path d="M188 46l18 22-18 22-18-22 18-22z" fill="${accent}"/>`;
    case 'rose': return `<path d="M188 50c11 0 18 7 18 17 0 13-14 24-18 27-4-3-18-14-18-27 0-10 7-17 18-17z" fill="${accent}"/><path d="M188 77v18" stroke="#5B3415" stroke-width="4" stroke-linecap="round"/>`;
    case 'wing': return `<path d="M170 73c13-22 29-29 42-27-4 21-18 39-39 47 2-6 1-12-3-20z" fill="${accent}"/>`;
    case 'storm': return `<path d="M172 74c0-14 9-24 22-24 12 0 21 9 21 20 0 10-8 19-18 19h-20l10-15h-15z" fill="${accent}"/>`;
    case 'music': return `<path d="M200 48v32a10 10 0 1 1-8-10V57l-18 5v20a10 10 0 1 1-8-10V53z" fill="${accent}"/>`;
    default: return `<rect x="174" y="52" width="28" height="38" rx="6" fill="${accent}"/><path d="M180 60h16M180 68h16M180 76h12" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  }
}

function avatarSvgForId(itemId){
  const t = AVATAR_LIBRARY[itemId];
  if (!t) return '';
  const hair2 = t.gender === 'girl' ? t.hair : '#0F172A';
  const blush = t.gender === 'girl' ? '#F9A8D4' : '#FDBA74';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none">
    <defs>
      <linearGradient id="bg" x1="32" y1="28" x2="224" y2="228"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(128 108) rotate(90) scale(92)"><stop offset="0" stop-color="${t.glow}" stop-opacity="0.70"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity="0.35"/></filter>
    </defs>
    <rect width="256" height="256" rx="48" fill="url(#bg)"/>
    <circle cx="58" cy="58" r="26" fill="${t.accent}" opacity="0.22"/>
    <circle cx="198" cy="196" r="32" fill="${t.accent}" opacity="0.16"/>
    <circle cx="128" cy="112" r="86" fill="url(#glow)"/>
    ${accessorySvg(t.accessory, t.accent)}
    <ellipse cx="128" cy="220" rx="54" ry="16" fill="#000" opacity="0.22"/>
    <g filter="url(#shadow)">
      <path d="M74 196c12 17 32 26 54 26 23 0 42-9 54-26l-8-38H82z" fill="${t.accent}"/>
      <rect x="78" y="148" width="100" height="58" rx="26" fill="${t.shirt}"/>
      <path d="M95 153c-20 10-31 27-34 48l28-18 10-28z" fill="${t.shirt}"/>
      <path d="M161 153c20 10 31 27 34 48l-28-18-10-28z" fill="${t.shirt}"/>
      <circle cx="128" cy="95" r="38" fill="${t.skin}"/>
      <path d="M88 93c4-31 25-50 40-50 27 0 45 18 48 49-13-8-24-12-46-12-17 0-28 4-42 13z" fill="${t.hair}"/>
      <path d="M92 98c7-18 23-31 36-34 18-5 34 1 46 15-8-22-24-35-46-35-19 0-34 11-36 54z" fill="${hair2}" opacity="0.85"/>
      ${t.gender === 'girl' ? `<path d="M89 100c2 30 8 49 17 63-22-7-31-28-31-52 0-9 4-17 14-26z" fill="${t.hair}" opacity="0.95"/><path d="M167 100c-2 30-8 49-17 63 22-7 31-28 31-52 0-9-4-17-14-26z" fill="${t.hair}" opacity="0.95"/>` : `<path d="M91 100c7-12 18-19 35-21 19-2 33 2 42 12-3-15-18-28-40-28-17 0-32 11-37 37z" fill="${t.hair}" opacity="0.55"/>`}
      <circle cx="113" cy="97" r="4.2" fill="#1F2937"/>
      <circle cx="143" cy="97" r="4.2" fill="#1F2937"/>
      <circle cx="100" cy="106" r="5" fill="${blush}" opacity="0.45"/>
      <circle cx="156" cy="106" r="5" fill="${blush}" opacity="0.45"/>
      <path d="M117 114c7 6 15 6 22 0" stroke="#8B5E3C" stroke-width="4" stroke-linecap="round"/>
      <path d="M111 124c5 11 10 16 17 16 7 0 13-5 17-16" stroke="${t.skin}" stroke-width="10" stroke-linecap="round"/>
      <rect x="101" y="150" width="54" height="32" rx="8" fill="#fff" opacity="0.92"/>
      <path d="M128 150v32" stroke="#CBD5E1" stroke-width="2"/>
      <path d="M110 158h12M134 158h12M110 166h9M137 166h9" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>
    </g>
    <path d="M46 84c19-29 43-45 74-51" stroke="${t.accent}" stroke-width="9" stroke-linecap="round" opacity="0.88"/>
    <path d="M180 56c16 11 28 24 36 43" stroke="${t.accent}" stroke-width="9" stroke-linecap="round" opacity="0.88"/>
    <path d="M60 196c16 18 35 29 60 35" stroke="${t.accent}" stroke-width="7" stroke-linecap="round" opacity="0.82"/>
    <path d="M194 187c-15 20-33 34-62 40" stroke="${t.accent}" stroke-width="7" stroke-linecap="round" opacity="0.82"/>
  </svg>`;
}
function avatarDataUri(itemId){
  const svg = avatarSvgForId(itemId);
  return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';
}
function avatarHtml(item, size='h-14 w-14', extra=''){
  const src = avatarDataUri(item?.avatar_item_id || item?.item_id || '');
  if (src) return `<img src="${src}" alt="" class="${size} rounded-[18px] object-cover ${extra}">`;
  if (item?.pfp_url) return `<img src="${esc(item.pfp_url)}" alt="" class="${size} rounded-[18px] object-cover ${extra}">`;
  return `<div class="grid ${size} place-items-center rounded-[18px] bg-white/10 text-sm font-black text-white ${extra}">${esc(initials(item?.name))}</div>`;
}

function ensureCard(){
  let card = $('rh-ypt-focus-card');
  if (card) return card;
  const parent = host();
  if (!parent) return null;
  card = document.createElement('div');
  card.id = 'rh-ypt-focus-card';
  card.className = 'mt-6 rounded-[30px] border border-orange-300/16 bg-[#111111] p-5 shadow-[0_24px_70px_rgba(0,0,0,.34)]';
  card.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="text-[9px] font-black uppercase tracking-[.24em] text-orange-300">Study together • motivate each other</div>
        <h3 class="mt-1 text-xl font-black text-white">🔥 3-Day Focus Room</h3>
        <p id="rh-ypt-cycle-label" class="mt-1 text-xs text-slate-400">YPT-style room with colorful anime avatar unlocks.</p>
      </div>
      <button id="rh-ypt-refresh" type="button" class="rounded-xl border border-orange-300/18 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-100">Refresh</button>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Students</div><b id="rh-ypt-students" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Total focus</div><b id="rh-ypt-total" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Your rank</div><b id="rh-ypt-rank" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Focus 3 days</div><b id="rh-ypt-3day-focus" class="mt-1 block text-lg text-white">—</b></div>
    </div>
    <div id="rh-ypt-current-avatar" class="mt-4 rounded-[24px] border border-orange-300/14 bg-[#171717] p-4">Avatar data load ho raha hai…</div>
    <div id="rh-ypt-board" class="mt-4 space-y-2"><div class="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">Leaderboard load ho raha hai…</div></div>
    <div class="mt-4 rounded-[24px] border border-orange-300/14 bg-[#171717] p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[9px] font-black uppercase tracking-[.22em] text-orange-300">Earned anime avatars</div>
          <h4 class="mt-1 text-lg font-black text-white">10 girls • 8 boys • colorful</h4>
          <p class="mt-1 text-xs text-slate-400">Locked overlay, progress bar, aur study-based unlocks YPT style.</p>
        </div>
        <div class="text-right">
          <div class="text-[9px] uppercase tracking-wider text-slate-500">Window</div>
          <b class="text-sm text-white">Last 3 days</b>
        </div>
      </div>
      <div id="rh-ypt-avatar-grid" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"></div>
    </div>
    <p class="mt-3 text-[10px] leading-4 text-slate-500">Top 3 ko special glow milega. Current user card orange highlight me rahega. Avatar unlock only study se hoga.</p>`;
  parent.appendChild(card);
  $('rh-ypt-refresh').onclick = refreshAll;
  return card;
}

function subjectHtml(subjects){
  return (Array.isArray(subjects) ? subjects : []).slice(0, 4).map(s => `<span class="inline-flex items-center gap-1 rounded-full border border-orange-300/10 bg-orange-500/10 px-2 py-1 text-[10px] text-orange-100"><b>${esc(s.subject || 'Other')}</b><span class="text-orange-300">${fmtShort(s.seconds)}</span></span>`).join('') || '<span class="text-[10px] text-slate-500">Subject data nahi hai</span>';
}

function rankGlow(rank){
  if (rank === 1) return 'shadow-[0_0_0_1px_rgba(251,191,36,.42),0_0_34px_rgba(251,191,36,.18)] border-amber-300/40 bg-amber-500/10';
  if (rank === 2) return 'shadow-[0_0_0_1px_rgba(226,232,240,.35),0_0_26px_rgba(226,232,240,.10)] border-slate-200/30 bg-slate-200/5';
  if (rank === 3) return 'shadow-[0_0_0_1px_rgba(251,146,60,.32),0_0_24px_rgba(251,146,60,.12)] border-orange-300/35 bg-orange-500/8';
  return 'border-white/8 bg-black/15';
}

function row(item){
  const mine = String(item.user_id) === uid();
  const rank = Number(item.rank || 0);
  const wrapper = mine
    ? 'border-orange-300/45 bg-orange-500/10 shadow-[0_0_0_1px_rgba(251,146,60,.25),0_0_28px_rgba(251,146,60,.12)]'
    : rankGlow(rank);
  const badge = rank <= 3 ? `<span class="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${rank===1?'text-amber-300':rank===2?'text-slate-200':'text-orange-300'}">Top ${rank}</span>` : '';
  return `<div class="rounded-[24px] border ${wrapper} p-3 transition-all">
    <div class="flex items-start gap-3">
      <div class="grid h-8 min-w-8 place-items-center rounded-full ${mine ? 'bg-orange-400/20 text-orange-100' : 'bg-white/10 text-slate-200'} text-xs font-black">${esc(item.rank)}</div>
      <div class="relative">${avatarHtml(item,'h-16 w-16','shadow-lg')}<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/82 px-2 py-0.5 text-[9px] font-black text-orange-300">${fmtShort(item.total_seconds)}</span></div>
      <div class="min-w-0 flex-1 pt-1">
        <div class="flex flex-wrap items-center gap-2"><b class="truncate text-sm text-white">${esc(item.name || 'Aspirant')}</b>${mine ? '<span class="rounded-full bg-orange-400/18 px-2 py-0.5 text-[9px] font-black text-orange-100">YOU</span>' : ''}${badge}</div>
        <div class="mt-2 flex flex-wrap gap-1">${subjectHtml(item.subjects)}</div>
      </div>
      <div class="text-right pt-1"><b class="block text-sm ${mine ? 'text-orange-100' : 'text-white'}">${fmt(item.total_seconds)}</b><span class="text-[9px] text-slate-500">${esc(item.session_count)} sessions</span></div>
    </div>
  </div>`;
}

function rewardCard(item){
  const unlocked = !!item.unlocked;
  const equipped = !!item.equipped;
  const locked = !unlocked;
  const remaining = Number(item.remaining_seconds || 0);
  const progress = Number(item.progress_percent || 0);
  const btn = equipped
    ? '<button type="button" disabled class="rounded-xl border border-orange-300/20 bg-orange-500/15 px-3 py-2 text-[11px] font-black text-orange-100">Using now</button>'
    : unlocked
      ? `<button type="button" data-ypt-avatar-equip="${esc(item.item_id)}" class="rounded-xl border border-orange-300/20 bg-orange-500/15 px-3 py-2 text-[11px] font-black text-orange-100">Choose</button>`
      : `<div class="rounded-xl border border-slate-700 bg-black/30 px-3 py-2 text-[11px] font-black text-slate-300">${fmtShort(remaining)} left</div>`;
  return `<div class="rounded-[24px] border ${equipped ? 'border-orange-300/42 bg-orange-500/10 shadow-[0_0_0_1px_rgba(251,146,60,.25),0_0_28px_rgba(251,146,60,.12)]' : unlocked ? 'border-white/10 bg-black/20' : 'border-white/8 bg-black/25'} p-3">
    <div class="flex items-start gap-3">
      <div class="relative h-[96px] w-[96px] overflow-hidden rounded-[22px] border ${locked ? 'border-white/10' : 'border-orange-300/20'} bg-[#121212] p-1">
        ${avatarHtml(item,'h-full w-full','')}
        ${locked ? '<div class="absolute inset-0 bg-black/48 backdrop-blur-[1px]"></div>' : ''}
        <div class="absolute left-2 top-2 rounded-full ${locked ? 'bg-black/78 text-slate-200' : equipped ? 'bg-orange-500/22 text-orange-100' : 'bg-emerald-500/18 text-emerald-100'} px-2 py-1 text-[9px] font-black uppercase tracking-wider">${locked ? 'Locked' : equipped ? 'Active' : 'Unlocked'}</div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2"><b class="truncate text-sm text-white">${esc(item.name || 'Avatar')}</b><span class="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-300">${esc(item.tier_label || '')}</span></div>
        <p class="mt-1 text-[11px] leading-4 text-slate-400">${esc(item.rule_text || '')}</p>
        <p class="mt-1 text-[10px] text-slate-500">${esc(item.description || 'Colorful anime avatar')}</p>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/8"><div class="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200" style="width:${pct(progress)}"></div></div>
        <div class="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span>${locked ? 'Progress to unlock' : 'Unlocked'}</span><span>${Math.round(progress)}%</span></div>
        <div class="mt-3 flex items-center justify-between gap-3"><span class="text-[11px] font-black ${locked ? 'text-slate-300' : 'text-orange-200'}">Target • ${Number(item.target_hours || 0)}h</span>${btn}</div>
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
  ensureCard();
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
  ensureCard();
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
    const avatars = (parseJsonMaybe(status.avatars) || []).map(a => ({ ...a, avatar_item_id: a.item_id }));
    const totalSeconds = Number(status.total_seconds || 0);
    const equipped = avatars.find(x => x.equipped) || null;
    const next = avatars.find(x => !x.unlocked) || null;
    $('rh-ypt-3day-focus').textContent = fmt(totalSeconds);

    const summaryTop = equipped
      ? `<div class="flex items-center gap-4">${avatarHtml(equipped,'h-20 w-20','')}<div><div class="text-[10px] font-black uppercase tracking-wider text-orange-300">Current anime avatar</div><b class="text-base text-white">${esc(equipped.name)}</b><p class="mt-1 text-[11px] text-slate-400">Unlocked by study. Focus room me yehi avatar dikh raha hoga.</p></div></div>`
      : `<div><div class="text-[10px] font-black uppercase tracking-wider text-orange-300">First unlock target</div><b class="text-base text-white">24 hours in 3 days</b><p class="mt-1 text-[11px] text-slate-400">Abhi ${fmtShort(Math.max(86400 - totalSeconds, 0))} aur focus chahiye pehla colorful avatar unlock karne ke liye.</p></div>`;

    const nextBlock = next
      ? `<div class="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3"><div class="flex items-center justify-between gap-3"><div><div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Next unlock</div><b class="text-sm text-white">${esc(next.name)} • ${Number(next.target_hours || 0)}h</b><p class="mt-1 text-[11px] text-slate-400">${esc(next.rule_text || '')}</p></div><div class="text-right"><b class="block text-sm text-orange-200">${fmtShort(Number(next.remaining_seconds || 0))}</b><span class="text-[10px] text-slate-500">remaining</span></div></div></div>`
      : `<div class="mt-4 rounded-2xl border border-orange-300/15 bg-orange-500/10 p-3 text-xs text-orange-100">Sabhi current avatars unlock ho gaye ✅</div>`;

    $('rh-ypt-current-avatar').innerHTML = summaryTop + nextBlock;
    $('rh-ypt-avatar-grid').innerHTML = avatars.length ? avatars.map(rewardCard).join('') : '<div class="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">Avatar milestones abhi ready nahi hain.</div>';
    bindRewardButtons();
  } catch (e) {
    console.warn('YPT avatar rewards skipped', e);
    $('rh-ypt-current-avatar').innerHTML = '<div class="text-xs text-rose-100">Avatar milestone load nahi hua.</div>';
    $('rh-ypt-avatar-grid').innerHTML = '<div class="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-xs text-rose-100">Study-based anime avatar setup pending hai.</div>';
  }
}

async function refreshAll(){ await Promise.all([loadLeaderboard(), loadAvatarRewards()]); }
function boot(){ ensureCard(); setTimeout(refreshAll, 900); setInterval(() => { if (document.visibilityState !== 'hidden') refreshAll(); }, 60000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAll(); }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
