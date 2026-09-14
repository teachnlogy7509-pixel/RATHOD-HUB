/* RATHOD HUB - Student Collection Addon
   Add this file as: student-collection.js
   Then add before </body> in index.html:
   <script defer src="student-collection.js?v=1"></script>
*/
(function(){
  'use strict';
  const $ = (id)=>document.getElementById(id);
  const safe = (v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let collectionRows=[], collectionBadgeMap=new Map(), collectionCosmetics=new Map(), collectionRewards=new Map();

  const FALLBACK_BADGES = [
    ['q01','🌱','First Spark','Starter'],['q02','⚡','Quick Starter','Starter'],['q03','🎯','Half Century','Starter'],['q04','🚀','Momentum Maker','Starter'],['q05','🔍','Question Hunter','Starter'],
    ['q06','🧭','Concept Scout','Starter'],['q07','✈️','Practice Pilot','Pro'],['q08','📗','NCERT Ranger','Pro'],['q09','🧠','Accuracy Builder','Pro'],['q10','⚔️','Quiz Warrior','Pro'],
    ['q11','🔋','Brain Charger','Pro'],['q12','🛡️','Revision Knight','Pro'],['q13','💯','Thousand Solver','Elite'],['q14','🧑‍✈️','Concept Captain','Elite'],['q15','🏹','NEET Striker','Elite'],
    ['q16','🎓','Question Master','Elite'],['q17','📚','NCERT Guardian','Elite'],['q18','🌌','Exam Explorer','Elite'],['q19','🗿','Practice Titan','Elite'],['q20','🔥','Mega Solver','Elite'],
    ['q21','♠️','Knowledge Ace','Elite'],['q22','⭐','NEET Commander','Legend'],['q23','👑','Question Emperor','Legend'],['q24','💎','Grand Scholar','Legend'],['q25','🏆','Ten-K Legend','Legend'],
    ['x01','🍃','Bronze Leaf','Starter'],['x02','🔵','Blue Orbit','Starter'],['x03','🔥','Focus Flame','Starter'],['x04','🌿','Bio Bloom','Starter'],['x05','🧪','Chem Spark','Starter'],
    ['x06','⚛️','Physics Pulse','Starter'],['x07','✒️','NCERT Ink','Starter'],['x08','⭐','Streak Star','Pro'],['x09','🌟','Quiz Nova','Pro'],['x10','🥷','Study Samurai','Pro'],
    ['x11','🦊','Formula Fox','Pro'],['x12','🗡️','Doubt Slayer','Pro'],['x13','⏳','Time Traveller','Pro'],['x14','📘','Exemplar Elite','Pro'],['x15','🦁','Library Lion','Elite'],
    ['x16','🎮','Live Quiz Hero','Elite'],['x17','🏛️','Memory Architect','Elite'],['x18','🔐','Vault Keeper','Elite'],['x19','🎙️','Campus Mentor','Elite'],['x20','💎','League Diamond','Elite'],
    ['x21','🐦‍🔥','NEET Phoenix','Legend'],['x22','🌌','Cosmic Scholar','Legend'],['x23','🤴','Royal Aspirant','Legend'],['x24','👑','Elite Crown','Legend'],['x25','🏆','RATHOD Legend','Legend']
  ].map(([badge_id,icon,name,tier])=>({badge_id,icon,name,tier}));

  const SHOP_BADGES = [
    {item_id:'badge_rising',emoji:'✦',name:'Rising Scholar'},
    {item_id:'badge_ncert',emoji:'📚',name:'NCERT Master'},
    {item_id:'badge_focus',emoji:'⚡',name:'Focus Elite'},
    {item_id:'badge_neet',emoji:'💎',name:'NEET Pro'},
    {item_id:'badge_legend',emoji:'👑',name:'League Legend'}
  ];
  const SHOP_AVATARS = [
    {item_id:'avatar_doctor',emoji:'🩺',name:'Doctor'},
    {item_id:'avatar_fire',emoji:'🔥',name:'Fire'},
    {item_id:'avatar_trophy',emoji:'🏆',name:'Trophy'},
    {item_id:'avatar_brain',emoji:'🧠',name:'Brain'},
    {item_id:'avatar_atom',emoji:'⚛️',name:'Atom'}
  ];
  function shopItem(id){const list=(typeof shopItems!=='undefined'&&Array.isArray(shopItems)&&shopItems.length)?shopItems:(window.shopItems||[]); return list.find(x=>x.item_id===id) || SHOP_BADGES.concat(SHOP_AVATARS).find(x=>x.item_id===id) || null;}
  function catalog(){const c=(typeof badgeCatalog!=='undefined'&&badgeCatalog)?badgeCatalog:window.badgeCatalog; return Array.isArray(c)&&c.length?c:FALLBACK_BADGES;}
  function badgeById(id){return catalog().find(b=>String(b.badge_id)===String(id)) || FALLBACK_BADGES.find(b=>String(b.badge_id)===String(id)) || {badge_id:id,name:id,icon:'🏅',tier:'Badge'};}

  function ensureCollectionUI(){
    const section=$('section-rathodnew');
    if(!section || $('rh-student-collection-card')) return;
    const card=document.createElement('div');
    card.id='rh-student-collection-card';
    card.className='relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-slate-950 via-amber-950/15 to-violet-950/25 p-4 sm:p-5';
    card.innerHTML=`<div class="absolute -right-10 -top-12 text-8xl opacity-[.06]">🏆</div>
      <div class="relative flex flex-wrap items-start justify-between gap-3">
        <div><div class="text-[9px] font-black uppercase tracking-[.2em] text-amber-300">Public Collection</div><h3 class="mt-1 text-xl font-black">🏆 Student Badge Collection</h3><p class="mt-1 text-xs text-slate-400">Instagram-style public cards — XP, Level aur earned badges sabko dikhenge.</p></div>
        <button onclick="loadStudentCollection()" class="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black">Refresh</button>
      </div>
      <div id="rh-student-collection-grid" class="relative mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"><div class="col-span-full py-8 text-center text-xs text-slate-500">Collection load ho raha hai…</div></div>`;
    const anchor=$('study-war-card') || section.children[1];
    if(anchor) section.insertBefore(card, anchor); else section.appendChild(card);
  }

  function getRowBadges(row, onlyEquipped=false){
    const all=(collectionBadgeMap.get(String(row.id||row.user_id))||[]).map(x=>({...badgeById(x.badge_id),equipped:x.equipped,earned_at:x.earned_at}));
    return onlyEquipped?all.filter(x=>x.equipped):all;
  }

  function nameWithBadges(row){
    const id=String(row.id||row.user_id||'');
    const cos=collectionCosmetics.get(id)||{};
    const badge=shopItem(cos.equipped_badge);
    const avatar=shopItem(cos.equipped_avatar);
    const reward=collectionRewards.get(id);
    const showcase=getRowBadges({id},true).slice(0,5);
    return `${avatar?`<span title="${safe(avatar.name)}">${safe(avatar.emoji)}</span> `:''}<span>${safe(row.name||'Student')}</span>${badge?` <span class="rounded-full border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[8px] text-amber-300 whitespace-nowrap">${safe(badge.emoji)} ${safe(badge.name)}</span>`:''}${reward?` <span class="text-sky-400" title="${safe(reward.badge||'League badge')}">✓</span>`:''}${showcase.length?` <span class="ml-1 whitespace-nowrap" title="${safe(showcase.map(b=>b.name).join(', '))}">${showcase.map(b=>safe(b.icon)).join('')}</span>`:''}`;
  }
  window.rhNameWithBadges = nameWithBadges;

  function renderCollection(){
    const grid=$('rh-student-collection-grid'); if(!grid)return;
    if(!collectionRows.length){grid.innerHTML='<div class="col-span-full py-8 text-center text-xs text-slate-500">Abhi collection empty hai.</div>';return;}
    grid.innerHTML=collectionRows.map((row,i)=>{
      const badges=getRowBadges(row,false);
      const showcase=(badges.filter(b=>b.equipped).length?badges.filter(b=>b.equipped):badges).slice(0,5);
      const reward=collectionRewards.get(String(row.id));
      const xp=Number(row.season_xp||row.xp||0), level=Number(row.league_level||row.level||1);
      const img=row.pfp_url?`<img src="${safe(row.pfp_url)}" class="h-full w-full object-cover">`:'<div class="grid h-full place-items-center text-3xl">👤</div>';
      return `<article class="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-3 text-center shadow-xl">
        <div class="absolute left-3 top-3 rounded-full bg-black/30 px-2 py-1 text-[9px] font-black text-amber-300">#${i+1}</div>
        <div class="mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">${img}</div>
        <div class="mt-3 min-h-[34px] text-sm font-black leading-5">${nameWithBadges(row)}</div>
        <div class="mt-2 grid grid-cols-3 gap-1 text-center"><div class="rounded-xl bg-black/25 p-2"><b class="block text-amber-300 text-xs">${xp.toLocaleString()}</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/25 p-2"><b class="block text-cyan-300 text-xs">${level}</b><span class="text-[8px] text-slate-500">Level</span></div><div class="rounded-xl bg-black/25 p-2"><b class="block text-violet-300 text-xs">${badges.length}</b><span class="text-[8px] text-slate-500">Badges</span></div></div>
        <div class="mt-3 flex justify-center gap-1 text-xl" title="Showcase badges">${showcase.length?showcase.map(b=>`<span title="${safe(b.name)}">${safe(b.icon)}</span>`).join(''):'<span class="text-xs text-slate-500">No badges yet</span>'}</div>
        ${reward?`<div class="mt-2 rounded-full bg-sky-500/10 px-2 py-1 text-[9px] font-black text-sky-300">${safe(reward.badge||'League Badge')}</div>`:''}
        <button onclick="openStudentProfile('${safe(row.id)}')" class="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-600 to-violet-600 py-2.5 text-[10px] font-black">View Profile</button>
      </article>`;
    }).join('');
  }

  window.loadStudentCollection=async function(){
    ensureCollectionUI();
    const grid=$('rh-student-collection-grid');
    if(grid)grid.innerHTML='<div class="col-span-full py-8 text-center text-xs text-slate-500">Collection load ho raha hai…</div>';
    try{
      const _db=(typeof db!=='undefined'&&db)?db:(window.db||null);
      if(!_db)throw new Error('Database not ready');
      let profiles=[], members=[], badges=[], cosmetics=[], rewards=[];
      const now=new Date().toISOString();
      const a=await _db.from('profiles').select('id,name,pfp_url,role,xp,level').order('name',{ascending:true}).limit(250);
      if(a.error)throw a.error; profiles=a.data||[];
      const ids=profiles.map(x=>x.id).filter(Boolean);
      if(ids.length){
        const [m,b,c,r]=await Promise.all([
          _db.from('league_members').select('user_id,league_level,group_no,season_xp,season_number,updated_at').in('user_id',ids),
          _db.from('user_badges').select('user_id,badge_id,equipped,earned_at').in('user_id',ids),
          _db.from('profile_cosmetics').select('user_id,equipped_avatar,equipped_badge').in('user_id',ids),
          _db.from('league_rewards').select('user_id,council_role,badge,name_color,access_expires_at').in('user_id',ids).gt('access_expires_at',now).order('created_at',{ascending:false})
        ]);
        members=m.data||[]; badges=b.data||[]; cosmetics=c.data||[]; rewards=r.data||[];
      }
      const memberById=new Map();
      members.forEach(m=>{const k=String(m.user_id); if(!memberById.has(k) || Number(m.season_xp||0)>Number(memberById.get(k).season_xp||0))memberById.set(k,m)});
      collectionBadgeMap=new Map();
      badges.forEach(b=>{const k=String(b.user_id); const arr=collectionBadgeMap.get(k)||[]; arr.push(b); collectionBadgeMap.set(k,arr)});
      collectionCosmetics=new Map(cosmetics.map(c=>[String(c.user_id),c]));
      collectionRewards=new Map(); rewards.forEach(r=>{if(!collectionRewards.has(String(r.user_id)))collectionRewards.set(String(r.user_id),r)});
      collectionRows=profiles.map(p=>({...p,...(memberById.get(String(p.id))||{}),id:p.id})).sort((a,b)=>Number(b.season_xp||b.xp||0)-Number(a.season_xp||a.xp||0));
      renderCollection();
      enhanceLeaderboardNow();
    }catch(e){if(grid)grid.innerHTML=`<div class="col-span-full rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-xs text-amber-200">Collection load nahi ho saka: ${safe(e.message||e)}</div>`;}
  };

  window.openStudentProfile=function(id){
    const row=collectionRows.find(x=>String(x.id)===String(id)); if(!row)return;
    const badges=getRowBadges(row,false);
    let modal=$('rh-student-profile-modal');
    if(!modal){modal=document.createElement('div');modal.id='rh-student-profile-modal';modal.className='fixed inset-0 z-[9999] hidden bg-black/80 p-4 backdrop-blur-md flex items-center justify-center';document.body.appendChild(modal)}
    const xp=Number(row.season_xp||row.xp||0), level=Number(row.league_level||row.level||1);
    modal.innerHTML=`<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-400/25 bg-slate-950 p-5 shadow-2xl"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><div class="h-16 w-16 overflow-hidden rounded-full border-2 border-amber-400/40 bg-slate-800">${row.pfp_url?`<img src="${safe(row.pfp_url)}" class="h-full w-full object-cover">`:'<div class="grid h-full place-items-center text-2xl">👤</div>'}</div><div><div class="font-black text-lg">${nameWithBadges(row)}</div><div class="text-[10px] text-slate-500">Public RATHOD HUB profile</div></div></div><button onclick="document.getElementById('rh-student-profile-modal').classList.add('hidden')" class="rounded-xl bg-slate-800 px-3 py-2 text-xs">✕</button></div><div class="mt-4 grid grid-cols-3 gap-2 text-center"><div class="rounded-xl bg-black/30 p-3"><b class="block text-amber-300">${xp.toLocaleString()}</b><span class="text-[8px] text-slate-500">XP</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-cyan-300">Level ${level}</b><span class="text-[8px] text-slate-500">League</span></div><div class="rounded-xl bg-black/30 p-3"><b class="block text-violet-300">${badges.length}</b><span class="text-[8px] text-slate-500">Badges</span></div></div><h4 class="mt-5 text-sm font-black text-amber-300">🏅 Badges owned</h4><div class="mt-3 grid grid-cols-2 gap-2">${badges.length?badges.map(b=>`<div class="rounded-2xl border ${b.equipped?'border-amber-400/50':'border-slate-800'} bg-slate-900/80 p-3"><div class="text-2xl">${safe(b.icon)}</div><b class="mt-1 block text-xs">${safe(b.name)}</b><span class="text-[9px] text-slate-500">${safe(b.tier||'Badge')}${b.equipped?' • Showcased':''}</span></div>`).join(''):'<div class="col-span-2 rounded-2xl bg-slate-900 p-4 text-center text-xs text-slate-500">Abhi koi badge nahi.</div>'}</div></div>`;
    modal.classList.remove('hidden');
  };

  function enhanceLeaderboardNow(){
    try{
      const rows=(typeof leagueRows!=='undefined'&&leagueRows)?leagueRows:(window.leagueRows||[]);
      document.querySelectorAll('#leaderboard-list .min-w-0.flex-1 b').forEach((el,idx)=>{const row=rows[idx]; if(row)el.innerHTML=nameWithBadges(row);});
    }catch(e){}
  }

  function hookLeaderboard(){
    const original=window.renderLeaderboard;
    if(typeof original==='function' && !original._studentCollectionEnhanced){
      window.renderLeaderboard=function(){ original(); setTimeout(enhanceLeaderboardNow,80); };
      window.renderLeaderboard._studentCollectionEnhanced=true;
    }
  }

  function hookSwitchTab(){
    const original=window.switchTab;
    if(typeof original==='function' && !original._studentCollectionHooked){
      window.switchTab=function(tab){ original(tab); if(tab==='rathodnew')setTimeout(()=>window.loadStudentCollection?.(),250); if(tab==='leaderboard')setTimeout(enhanceLeaderboardNow,300); };
      window.switchTab._studentCollectionHooked=true;
    }
  }

  function init(){ensureCollectionUI();hookLeaderboard();hookSwitchTab(); if(!$('section-rathodnew') && document.body){setTimeout(init,800);} }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
