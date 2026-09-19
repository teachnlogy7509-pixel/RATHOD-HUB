/* RATHOD HUB • VIP YPT-style focus room + premium studicon vault */
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
  avatar_scholar: { name:'Haru Scholar', accent:'#F59E0B', glow:'#FCD34D', hair:'#1F2937', shirt:'#FFF6D8', skin:'#F3D2B6', bg1:'#2A1808', bg2:'#120E0A', accessory:'book', gender:'boy', category:'Boy' },
  avatar_medic: { name:'Aiko Medic', accent:'#FB7185', glow:'#FBCFE8', hair:'#5B4038', shirt:'#FFF5F7', skin:'#F1D0B6', bg1:'#2A1216', bg2:'#120C0E', accessory:'plus', gender:'girl', category:'Girl' },
  avatar_girl_muse: { name:'Yuna Muse', accent:'#EC4899', glow:'#F9A8D4', hair:'#342046', shirt:'#FFE8F4', skin:'#F0CDB3', bg1:'#281020', bg2:'#140C12', accessory:'star', gender:'girl', category:'Girl' },
  avatar_scientist: { name:'Luna Scientist', accent:'#38BDF8', glow:'#BAE6FD', hair:'#111827', shirt:'#EEF8FF', skin:'#F2D0B4', bg1:'#0B1B2A', bg2:'#0B1015', accessory:'flask', gender:'girl', category:'Girl' },
  avatar_warrior: { name:'Ren Warrior', accent:'#8B5CF6', glow:'#DDD6FE', hair:'#2B2B2B', shirt:'#F2ECFF', skin:'#EFC49F', bg1:'#171125', bg2:'#0D0A13', accessory:'bolt', gender:'boy', category:'Boy' },
  avatar_boy_ace: { name:'Leo Ace', accent:'#22C55E', glow:'#BBF7D0', hair:'#2B1B12', shirt:'#EBFFF0', skin:'#EEC6A7', bg1:'#0D2017', bg2:'#09110C', accessory:'leaf', gender:'boy', category:'Boy' },
  avatar_phoenix: { name:'Sakura Phoenix', accent:'#F97316', glow:'#FDBA74', hair:'#311C24', shirt:'#FFF1E8', skin:'#F4CCB0', bg1:'#2A150B', bg2:'#130E0B', accessory:'flame', gender:'girl', category:'Girl' },
  avatar_rare_doctor_f: { name:'Kiara Care', accent:'#F43F5E', glow:'#FDA4AF', hair:'#42295D', shirt:'#FFF3F5', skin:'#F2CAB0', bg1:'#261018', bg2:'#130C10', accessory:'heart', gender:'girl', category:'Girl' },
  avatar_boy_focus: { name:'Arjun Focus', accent:'#06B6D4', glow:'#A5F3FC', hair:'#0F172A', shirt:'#E9FCFF', skin:'#EAC09E', bg1:'#0A1D22', bg2:'#091013', accessory:'target', gender:'boy', category:'Boy' },
  avatar_rare_scientist_f: { name:'Mira Quantum', accent:'#7C3AED', glow:'#C4B5FD', hair:'#261B43', shirt:'#F4EFFF', skin:'#F0CAB0', bg1:'#160F2A', bg2:'#0C0913', accessory:'moon', gender:'girl', category:'Girl' },
  avatar_boy_blaze: { name:'Kian Blaze', accent:'#FF7A59', glow:'#FDBA74', hair:'#1E293B', shirt:'#FFF0EB', skin:'#EDC29E', bg1:'#29130F', bg2:'#140E0D', accessory:'spark', gender:'boy', category:'Boy' },
  avatar_girl_mint: { name:'Hina Mint', accent:'#14B8A6', glow:'#99F6E4', hair:'#37254A', shirt:'#E8FFF9', skin:'#F1D0B5', bg1:'#0C201D', bg2:'#09110F', accessory:'gem', gender:'girl', category:'Girl' },
  avatar_rare_queen_f: { name:'Tara Crown', accent:'#EAB308', glow:'#FDE68A', hair:'#1E1B4B', shirt:'#FFF9DE', skin:'#F0C7AA', bg1:'#251D08', bg2:'#141009', accessory:'crown', gender:'girl', category:'Girl' },
  avatar_boy_noir: { name:'Zayn Noir', accent:'#94A3B8', glow:'#E2E8F0', hair:'#09090B', shirt:'#F3F4F6', skin:'#E9BC98', bg1:'#171717', bg2:'#0A0A0A', accessory:'diamond', gender:'boy', category:'Boy' },
  avatar_girl_rose: { name:'Riya Rose', accent:'#EC4899', glow:'#F9A8D4', hair:'#4C1D95', shirt:'#FFE6F4', skin:'#EFC8AE', bg1:'#260F1F', bg2:'#120C11', accessory:'rose', gender:'girl', category:'Girl' },
  avatar_boy_sky: { name:'Dev Sky', accent:'#38BDF8', glow:'#BAE6FD', hair:'#3B2B1F', shirt:'#E8F7FF', skin:'#EDC7A5', bg1:'#0D1D2A', bg2:'#0B1015', accessory:'wing', gender:'boy', category:'Boy' },
  avatar_boy_storm: { name:'Max Storm', accent:'#A855F7', glow:'#DDD6FE', hair:'#1F2937', shirt:'#F7F1FF', skin:'#E9BF9A', bg1:'#160F24', bg2:'#0C0A12', accessory:'storm', gender:'boy', category:'Boy' },
  avatar_girl_neon: { name:'Naina Neon', accent:'#22C55E', glow:'#BBF7D0', hair:'#25113A', shirt:'#ECFFF1', skin:'#F1CEB3', bg1:'#0D1F16', bg2:'#09110D', accessory:'music', gender:'girl', category:'Girl' }
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
function premiumTag(itemId){ const x=AVATAR_LIBRARY[itemId]; return x?.category || 'VIP'; }
function premiumTier(itemId, fallback){
  if (['avatar_scholar','avatar_medic','avatar_girl_muse'].includes(itemId)) return 'VIP';
  if (['avatar_scientist','avatar_warrior','avatar_boy_ace'].includes(itemId)) return 'Elite';
  if (['avatar_phoenix','avatar_rare_doctor_f','avatar_boy_focus'].includes(itemId)) return 'Royal';
  if (['avatar_rare_scientist_f','avatar_boy_blaze','avatar_girl_mint'].includes(itemId)) return 'Mythic';
  if (['avatar_rare_queen_f','avatar_boy_noir','avatar_girl_rose'].includes(itemId)) return 'Legend';
  if (['avatar_boy_sky','avatar_boy_storm','avatar_girl_neon'].includes(itemId)) return 'Divine';
  return fallback || 'VIP';
}

function accessorySvg(kind, accent){
  switch(kind){
    case 'plus': return `<path d="M188 60h14v10h-14v14h-10V70h-14V60h14V46h10z" fill="${accent}"/>`;
    case 'star': return `<path d="M189 45l6 11 12 2-9 8 2 12-11-6-11 6 2-12-9-8 12-2 6-11z" fill="${accent}"/>`;
    case 'flask': return `<path d="M178 46h16v9l-5 12 16 26c4 6 0 13-7 13h-24c-7 0-11-7-7-13l16-26-5-12V46z" fill="${accent}"/>`;
    case 'bolt': return `<path d="M187 45l-11 23h11l-10 21 27-27h-11l7-17z" fill="${accent}"/>`;
    case 'leaf': return `<path d="M192 45c-17 4-28 16-29 35 18 1 32-7 41-26-1-4-4-7-12-9z" fill="${accent}"/>`;
    case 'flame': return `<path d="M184 48c9 10 11 18 9 25-2 5-7 11-15 14 2-7 0-14-7-21 4 0 8-7 13-18z" fill="${accent}"/>`;
    case 'heart': return `<path d="M188 49c8 0 14 6 14 14 0 14-14 22-25 31-12-9-25-17-25-31 0-8 6-14 14-14 5 0 9 2 11 6 3-4 7-6 11-6z" fill="${accent}"/>`;
    case 'target': return `<circle cx="188" cy="66" r="18" stroke="${accent}" stroke-width="8" fill="none"/><circle cx="188" cy="66" r="7" fill="${accent}"/>`;
    case 'moon': return `<path d="M196 47c-4 2-7 8-7 16 0 11 7 19 17 21-4 4-10 6-16 6-15 0-27-12-27-26s12-26 27-26c2 0 4 0 6 1z" fill="${accent}"/>`;
    case 'spark': return `<path d="M188 45l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12z" fill="${accent}"/>`;
    case 'gem': return `<path d="M188 46l17 17-17 23-17-23 17-17z" fill="${accent}"/>`;
    case 'crown': return `<path d="M169 82l6-31 13 15 13-15 6 31z" fill="${accent}"/><rect x="167" y="82" width="42" height="10" rx="5" fill="${accent}"/>`;
    case 'diamond': return `<path d="M188 46l17 21-17 21-17-21 17-21z" fill="${accent}"/>`;
    case 'rose': return `<path d="M188 49c10 0 17 7 17 16 0 13-13 23-17 26-4-3-17-13-17-26 0-9 7-16 17-16z" fill="${accent}"/><path d="M188 75v18" stroke="#5B3415" stroke-width="4" stroke-linecap="round"/>`;
    case 'wing': return `<path d="M170 72c13-21 28-28 40-27-4 21-17 38-38 45 2-6 1-12-2-18z" fill="${accent}"/>`;
    case 'storm': return `<path d="M173 72c0-13 9-23 21-23 12 0 20 9 20 19 0 10-8 18-18 18h-20l10-14h-13z" fill="${accent}"/>`;
    case 'music': return `<path d="M199 47v31a10 10 0 1 1-8-10V56l-17 4v20a10 10 0 1 1-8-10V52z" fill="${accent}"/>`;
    default: return `<rect x="176" y="50" width="26" height="34" rx="6" fill="${accent}"/><path d="M182 58h14M182 66h14M182 74h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  }
}

function avatarSvgForId(itemId){
  const t = AVATAR_LIBRARY[itemId];
  if (!t) return '';
  const blush = t.gender === 'girl' ? '#F9A8D4' : '#FDBA74';
  const extraHair = t.gender === 'girl'
    ? `<path d="M90 98c3 31 8 49 17 64-21-8-30-28-30-51 0-9 4-18 13-27z" fill="${t.hair}" opacity="0.96"/><path d="M166 98c-3 31-8 49-17 64 21-8 30-28 30-51 0-9-4-18-13-27z" fill="${t.hair}" opacity="0.96"/>`
    : `<path d="M92 98c7-12 18-19 35-21 18-2 32 2 41 12-3-15-18-28-40-28-17 0-31 11-36 37z" fill="${t.hair}" opacity="0.55"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none">
    <defs>
      <linearGradient id="bg" x1="32" y1="26" x2="224" y2="228"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(128 106) rotate(90) scale(92)"><stop offset="0" stop-color="${t.glow}" stop-opacity="0.82"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity="0.36"/></filter>
    </defs>
    <rect width="256" height="256" rx="44" fill="url(#bg)"/>
    <circle cx="58" cy="56" r="24" fill="${t.accent}" opacity="0.2"/>
    <circle cx="198" cy="196" r="30" fill="${t.accent}" opacity="0.14"/>
    <circle cx="128" cy="110" r="88" fill="url(#glow)"/>
    ${accessorySvg(t.accessory, t.accent)}
    <ellipse cx="128" cy="221" rx="53" ry="16" fill="#000" opacity="0.22"/>
    <g filter="url(#shadow)">
      <path d="M74 196c12 18 31 28 54 28 24 0 42-10 54-28l-8-37H82z" fill="${t.accent}"/>
      <rect x="78" y="148" width="100" height="58" rx="26" fill="${t.shirt}"/>
      <path d="M95 153c-19 10-30 27-34 48l28-18 10-28z" fill="${t.shirt}"/>
      <path d="M161 153c19 10 30 27 34 48l-28-18-10-28z" fill="${t.shirt}"/>
      <circle cx="128" cy="94" r="38" fill="${t.skin}"/>
      <path d="M88 92c4-31 24-50 40-50 27 0 45 18 48 48-13-8-24-12-46-12-17 0-29 4-42 14z" fill="${t.hair}"/>
      ${extraHair}
      <circle cx="113" cy="97" r="4.2" fill="#1F2937"/>
      <circle cx="143" cy="97" r="4.2" fill="#1F2937"/>
      <circle cx="100" cy="106" r="5" fill="${blush}" opacity="0.45"/>
      <circle cx="156" cy="106" r="5" fill="${blush}" opacity="0.45"/>
      <path d="M117 114c7 6 15 6 22 0" stroke="#8B5E3C" stroke-width="4" stroke-linecap="round"/>
      <path d="M112 124c5 11 10 16 16 16 7 0 12-5 17-16" stroke="${t.skin}" stroke-width="10" stroke-linecap="round"/>
      <rect x="100" y="150" width="56" height="32" rx="8" fill="#fff" opacity="0.94"/>
      <path d="M128 150v32" stroke="#CBD5E1" stroke-width="2"/>
      <path d="M110 158h12M134 158h12M110 166h9M137 166h9" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"/>
    </g>
    <path d="M46 82c19-29 43-44 74-50" stroke="${t.accent}" stroke-width="9" stroke-linecap="round" opacity="0.92"/>
    <path d="M181 54c15 10 28 24 35 42" stroke="${t.accent}" stroke-width="9" stroke-linecap="round" opacity="0.92"/>
    <path d="M60 196c16 18 35 29 60 34" stroke="${t.accent}" stroke-width="7" stroke-linecap="round" opacity="0.84"/>
    <path d="M194 187c-15 20-33 33-62 39" stroke="${t.accent}" stroke-width="7" stroke-linecap="round" opacity="0.84"/>
  </svg>`;
}
function avatarDataUri(itemId){ const svg = avatarSvgForId(itemId); return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : ''; }
function avatarHtml(item, size='h-[112px] w-[112px]', extra=''){
  const src = avatarDataUri(item?.avatar_item_id || item?.item_id || '');
  if (src) return `<img src="${src}" alt="" class="${size} object-contain ${extra}">`;
  if (item?.pfp_url) return `<img src="${esc(item.pfp_url)}" alt="" class="${size} rounded-[28px] object-cover ${extra}">`;
  return `<div class="grid ${size} place-items-center rounded-[28px] bg-white/10 text-lg font-black text-white ${extra}">${esc(initials(item?.name))}</div>`;
}

function ensureCard(){
  let card = $('rh-ypt-focus-card');
  if (card) return card;
  const parent = host();
  if (!parent) return null;
  card = document.createElement('div');
  card.id = 'rh-ypt-focus-card';
  card.className = 'mt-6 overflow-hidden rounded-[34px] border border-amber-200/12 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(244,114,182,.08),transparent_28%),linear-gradient(180deg,#131313,#0f0f0f)] p-5 shadow-[0_30px_90px_rgba(0,0,0,.42)]';
  card.innerHTML = `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.25em] text-amber-200">VIP Studicon Vault</div>
        <h3 class="mt-3 text-2xl font-black text-white">✨ Premium Focus Room</h3>
        <p id="rh-ypt-cycle-label" class="mt-1 text-xs text-slate-400">YPT-style premium room with same-size studicons, rich glow, and VIP unlocks.</p>
        <div class="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
          <span class="rounded-full border border-pink-300/15 bg-pink-500/10 px-3 py-1 text-pink-100">10 Girls</span>
          <span class="rounded-full border border-cyan-300/15 bg-cyan-500/10 px-3 py-1 text-cyan-100">8 Boys</span>
          <span class="rounded-full border border-amber-300/15 bg-amber-500/10 px-3 py-1 text-amber-100">VIP Premium</span>
        </div>
      </div>
      <button id="rh-ypt-refresh" type="button" class="rounded-2xl border border-amber-300/18 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100">Refresh</button>
    </div>
    <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded-2xl border border-white/6 bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Members</div><b id="rh-ypt-students" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl border border-white/6 bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Total focus</div><b id="rh-ypt-total" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl border border-white/6 bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Your rank</div><b id="rh-ypt-rank" class="mt-1 block text-lg text-white">—</b></div>
      <div class="rounded-2xl border border-white/6 bg-black/20 p-3"><div class="text-[9px] uppercase tracking-wider text-slate-500">Focus 3 days</div><b id="rh-ypt-3day-focus" class="mt-1 block text-lg text-white">—</b></div>
    </div>
    <div id="rh-ypt-current-avatar" class="mt-5 rounded-[28px] border border-amber-300/12 bg-[linear-gradient(135deg,rgba(251,191,36,.08),rgba(255,255,255,.02))] p-4">Avatar data load ho raha hai…</div>
    <div id="rh-ypt-board" class="mt-5 space-y-3"><div class="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">Leaderboard load ho raha hai…</div></div>
    <div class="mt-5 rounded-[28px] border border-amber-300/12 bg-[#151515] p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[10px] font-black uppercase tracking-[.28em] text-amber-200">VIP Studicon Store</div>
          <h4 class="mt-1 text-lg font-black text-white">Premium anime avatars • same size</h4>
          <p class="mt-1 text-xs text-slate-400">Store jaise premium tiles, fixed avatar size, better overlay, and richer glow.</p>
        </div>
        <div class="text-right">
          <div class="text-[9px] uppercase tracking-wider text-slate-500">Window</div>
          <b class="text-sm text-white">Last 3 days</b>
        </div>
      </div>
      <div id="rh-ypt-avatar-grid" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"></div>
    </div>`;
  parent.appendChild(card);
  $('rh-ypt-refresh').onclick = refreshAll;
  return card;
}

function subjectHtml(subjects){
  return (Array.isArray(subjects) ? subjects : []).slice(0, 4).map(s => `<span class="inline-flex items-center gap-1 rounded-full border border-amber-300/10 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100"><b>${esc(s.subject || 'Other')}</b><span class="text-amber-300">${fmtShort(s.seconds)}</span></span>`).join('') || '<span class="text-[10px] text-slate-500">Subject data nahi hai</span>';
}
function rankGlow(rank){
  if (rank === 1) return 'border-amber-300/42 bg-amber-500/10 shadow-[0_0_0_1px_rgba(251,191,36,.28),0_0_34px_rgba(251,191,36,.18)]';
  if (rank === 2) return 'border-slate-200/30 bg-slate-200/5 shadow-[0_0_0_1px_rgba(226,232,240,.20),0_0_28px_rgba(226,232,240,.10)]';
  if (rank === 3) return 'border-orange-300/35 bg-orange-500/8 shadow-[0_0_0_1px_rgba(251,146,60,.22),0_0_24px_rgba(251,146,60,.12)]';
  return 'border-white/8 bg-black/15';
}

function row(item){
  const mine = String(item.user_id) === uid();
  const rank = Number(item.rank || 0);
  const wrapper = mine ? 'border-amber-300/40 bg-amber-500/10 shadow-[0_0_0_1px_rgba(251,191,36,.24),0_0_30px_rgba(251,191,36,.10)]' : rankGlow(rank);
  const badge = rank <= 3 ? `<span class="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${rank===1?'text-amber-300':rank===2?'text-slate-200':'text-orange-300'}">Top ${rank}</span>` : '';
  return `<div class="rounded-[26px] border ${wrapper} p-3">
    <div class="flex items-start gap-3">
      <div class="grid h-8 min-w-8 place-items-center rounded-full ${mine ? 'bg-amber-400/20 text-amber-100' : 'bg-white/10 text-slate-200'} text-xs font-black">${esc(item.rank)}</div>
      <div class="relative flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01))]">${avatarHtml(item,'h-[78px] w-[78px]','')}<span class="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/82 px-2 py-0.5 text-[9px] font-black text-amber-300">${fmtShort(item.total_seconds)}</span></div>
      <div class="min-w-0 flex-1 pt-1">
        <div class="flex flex-wrap items-center gap-2"><b class="truncate text-sm text-white">${esc(item.name || 'Aspirant')}</b>${mine ? '<span class="rounded-full bg-amber-400/18 px-2 py-0.5 text-[9px] font-black text-amber-100">YOU</span>' : ''}${badge}</div>
        <div class="mt-2 flex flex-wrap gap-1">${subjectHtml(item.subjects)}</div>
      </div>
      <div class="text-right pt-1"><b class="block text-sm ${mine ? 'text-amber-100' : 'text-white'}">${fmt(item.total_seconds)}</b><span class="text-[9px] text-slate-500">${esc(item.session_count)} sessions</span></div>
    </div>
  </div>`;
}

function rewardCard(item){
  const unlocked = !!item.unlocked;
  const equipped = !!item.equipped;
  const locked = !unlocked;
  const remaining = Number(item.remaining_seconds || 0);
  const progress = Number(item.progress_percent || 0);
  const tag = premiumTag(item.item_id);
  const btn = equipped
    ? '<button type="button" disabled class="mt-3 w-full rounded-2xl border border-amber-300/20 bg-amber-500/15 px-3 py-2 text-[11px] font-black text-amber-100">Using now</button>'
    : unlocked
      ? `<button type="button" data-ypt-avatar-equip="${esc(item.item_id)}" class="mt-3 w-full rounded-2xl border border-amber-300/20 bg-amber-500/15 px-3 py-2 text-[11px] font-black text-amber-100">Choose studicon</button>`
      : `<div class="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-center text-[11px] font-black text-slate-300">${fmtShort(remaining)} left</div>`;
  return `<div class="rounded-[28px] border ${equipped ? 'border-amber-300/36 bg-[linear-gradient(180deg,rgba(251,191,36,.10),rgba(255,255,255,.02))] shadow-[0_0_0_1px_rgba(251,191,36,.18),0_0_34px_rgba(251,191,36,.12)]' : unlocked ? 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01))]' : 'border-white/8 bg-black/25'} p-4">
    <div class="flex items-center justify-between gap-2">
      <span class="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-[.24em] text-slate-200">${esc(tag)}</span>
      <span class="rounded-full ${equipped ? 'bg-amber-500/20 text-amber-100 border border-amber-300/14' : locked ? 'bg-black/40 text-slate-300 border border-white/8' : 'bg-emerald-500/18 text-emerald-100 border border-emerald-300/14'} px-2 py-1 text-[9px] font-black uppercase tracking-[.24em]">${equipped ? 'Active' : locked ? 'Locked' : 'Unlocked'}</span>
    </div>
    <div class="mt-3 flex justify-center">
      <div class="relative flex h-[128px] w-[128px] items-center justify-center overflow-hidden rounded-[30px] border ${equipped ? 'border-amber-300/24' : 'border-white/8'} bg-[linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.01))]">
        ${avatarHtml(item,'h-[120px] w-[120px]','drop-shadow-[0_12px_22px_rgba(0,0,0,.35)]')}
        ${locked ? '<div class="absolute inset-0 bg-black/48 backdrop-blur-[1px]"></div>' : ''}
      </div>
    </div>
    <div class="mt-4 text-center">
      <b class="block text-base text-white">${esc(item.name || 'Studicon')}</b>
      <div class="mt-1 text-[10px] font-black uppercase tracking-[.24em] text-amber-200">${esc(premiumTier(item.item_id, item.tier_label))}</div>
      <p class="mt-2 text-[11px] leading-4 text-slate-400">${esc(item.rule_text || '')}</p>
      <p class="mt-1 text-[10px] text-slate-500">${esc(item.description || 'Premium anime avatar')}</p>
    </div>
    <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-white/8"><div class="h-full rounded-full bg-[linear-gradient(90deg,#fb923c,#fbbf24,#fde68a)]" style="width:${pct(progress)}"></div></div>
    <div class="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span>${locked ? 'Progress to unlock' : 'Ready to use'}</span><span>${Math.round(progress)}%</span></div>
    <div class="mt-3 flex items-center justify-between text-[11px]"><span class="font-black ${locked ? 'text-slate-300' : 'text-amber-200'}">Target • ${Number(item.target_hours || 0)}h</span><span class="text-slate-400">${locked ? fmtShort(remaining) + ' left' : 'Unlocked'}</span></div>
    ${btn}
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
        toast('VIP studicon choose ho gaya ✅', true);
        await refreshAll();
      } catch (e) {
        toast(e.message || 'Studicon choose nahi hua');
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
    const [cycleRes, boardRes] = await Promise.all([client.rpc('get_ypt_focus_cycle'), client.rpc('get_ypt_focus_leaderboard', { p_limit: 100 })]);
    if (cycleRes.error) throw cycleRes.error;
    if (boardRes.error) throw boardRes.error;
    const cycle = Array.isArray(cycleRes.data) ? cycleRes.data[0] : cycleRes.data;
    const rows = Array.isArray(boardRes.data) ? boardRes.data : [];
    $('rh-ypt-cycle-label').textContent = cycle ? `Current cycle: ${date(cycle.cycle_start)} – ${date(cycle.cycle_end)} • premium leaderboard 30-day focus par` : '30-day cycle active';
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
    $('rh-ypt-current-avatar').innerHTML = '<div class="text-xs text-amber-100">Login ke baad premium avatar vault dikhega.</div>';
    $('rh-ypt-avatar-grid').innerHTML = '<div class="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">Login ke baad focus karke VIP studicons unlock kar sakte ho.</div>';
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
      ? `<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-4"><div class="flex h-[118px] w-[118px] items-center justify-center overflow-hidden rounded-[32px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(251,191,36,.10),rgba(255,255,255,.02))]">${avatarHtml(equipped,'h-[108px] w-[108px]','')}</div><div><div class="text-[10px] font-black uppercase tracking-[.24em] text-amber-200">Current VIP studicon</div><b class="mt-1 block text-xl text-white">${esc(equipped.name)}</b><p class="mt-2 text-[11px] text-slate-400">Unlocked by study. Same-size premium avatar ab focus room me dikh raha hoga.</p></div></div><div class="rounded-[24px] border border-white/8 bg-black/20 px-4 py-3 text-right"><div class="text-[10px] uppercase tracking-wider text-slate-500">Unlocked</div><b class="mt-1 block text-lg text-amber-100">${esc(status.unlocked_count || 0)} / ${avatars.length}</b><div class="mt-1 text-[10px] text-slate-400">VIP characters</div></div></div>`
      : `<div><div class="text-[10px] font-black uppercase tracking-[.24em] text-amber-200">First unlock target</div><b class="mt-1 block text-xl text-white">24 hours in 3 days</b><p class="mt-2 text-[11px] text-slate-400">Abhi ${fmtShort(Math.max(86400 - totalSeconds, 0))} aur focus chahiye pehla premium studicon unlock karne ke liye.</p></div>`;

    const nextBlock = next
      ? `<div class="mt-4 rounded-[24px] border border-white/8 bg-black/20 p-4"><div class="flex items-center justify-between gap-3"><div><div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Next VIP unlock</div><b class="mt-1 block text-sm text-white">${esc(next.name)} • ${Number(next.target_hours || 0)}h</b><p class="mt-1 text-[11px] text-slate-400">${esc(next.rule_text || '')}</p></div><div class="text-right"><b class="block text-sm text-amber-200">${fmtShort(Number(next.remaining_seconds || 0))}</b><span class="text-[10px] text-slate-500">remaining</span></div></div><div class="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8"><div class="h-full rounded-full bg-[linear-gradient(90deg,#fb923c,#fbbf24,#fde68a)]" style="width:${pct(next.progress_percent || 0)}"></div></div></div>`
      : `<div class="mt-4 rounded-[24px] border border-amber-300/15 bg-amber-500/10 p-4 text-xs text-amber-100">Sabhi premium studicons unlock ho gaye ✅</div>`;

    $('rh-ypt-current-avatar').innerHTML = summaryTop + nextBlock;
    $('rh-ypt-avatar-grid').innerHTML = avatars.length ? avatars.map(rewardCard).join('') : '<div class="rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">Avatar milestones abhi ready nahi hain.</div>';
    bindRewardButtons();
  } catch (e) {
    console.warn('YPT avatar rewards skipped', e);
    $('rh-ypt-current-avatar').innerHTML = '<div class="text-xs text-rose-100">Avatar vault load nahi hua.</div>';
    $('rh-ypt-avatar-grid').innerHTML = '<div class="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-xs text-rose-100">Premium avatar setup pending hai.</div>';
  }
}

async function refreshAll(){ await Promise.all([loadLeaderboard(), loadAvatarRewards()]); }
function boot(){ ensureCard(); setTimeout(refreshAll, 900); setInterval(() => { if (document.visibilityState !== 'hidden') refreshAll(); }, 60000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAll(); }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
