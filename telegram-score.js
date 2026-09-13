(()=>{let link=null,score=null,top15=[];const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function _ensureMobileNavButton(){
  const bar=document.querySelector('.rh-mobile-bottom');
  if(!bar) return;
  if(document.getElementById('btn-telegramscore-mobile')) return;

  const btn=document.createElement('button');
  btn.id='btn-telegramscore-mobile';
  btn.type='button';
  btn.onclick=()=>openTelegramScore();
  btn.innerHTML='<i class="fa-brands fa-telegram" style="color:#38bdf8"></i><span>Telegram</span>';

  bar.appendChild(btn);
}

function _todayKey(){
  try{
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }catch(_e){
    return 'today';
  }
}

function _pickDailyShayari(){
  const shayari=[
    'मेहनत इतनी करो कि किस्मत भी बोले — ले भाई, अब तू ही जीत।',
    'आज का दर्द ही कल की ताकत बनेगा।',
    'सपने वही सच होते हैं, जिनके लिए आप सोते नहीं।',
    'कम बोलो, ज्यादा कर दिखाओ।',
    'हर दिन थोड़ा बेहतर — यही असली जीत है।',
    'पढ़ाई का एक दिन भी बेकार नहीं जाता।',
    'जीतने वाले अलग नहीं होते, बस हार मानना नहीं जानते।'
  ];

  const key='rh_daily_shayari_'+_todayKey();
  try{
    const saved=localStorage.getItem(key);
    if(saved) return saved;

    // stable-ish daily pick
    let seed=0; for(const ch of key) seed=(seed*31 + ch.charCodeAt(0))>>>0;
    const text=shayari[seed % shayari.length];
    localStorage.setItem(key,text);
    return text;
  }catch(_e){
    return shayari[Math.floor(Math.random()*shayari.length)];
  }
}

function _applyRequestedHomeCleanup(){
  // 1) Daily formula: upcoming + coupon-only
  const dailyBtn=document.getElementById('btn-dailyformula');
  if(dailyBtn){
    dailyBtn.onclick=()=>toast('⏳ Upcoming Version — Coupon required');
    const label=dailyBtn.querySelector('span');
    if(label) label.textContent='Upcoming Version';
    dailyBtn.classList.add('opacity-70');
  }

  const dailySection=document.getElementById('section-dailyformula');
  if(dailySection){
    dailySection.innerHTML=`
      <div class="rounded-3xl border border-amber-400/20 bg-amber-500/5 p-5 sm:p-7">
        <div class="text-[10px] font-black tracking-widest text-amber-300">DAILY FORMULA</div>
        <h2 class="mt-2 text-2xl font-black">Upcoming Version</h2>
        <p class="mt-2 text-xs text-slate-400">Ye feature next update me aayega. Access <b class="text-cyan-300">coupon</b> redeem ke baad enable hoga.</p>

        <div id="rh-upcoming-admin-coupon" class="mt-5 hidden rounded-3xl border border-cyan-400/25 bg-slate-950/70 p-4">
          <div class="flex items-center justify-between gap-2">
            <div>
              <div class="text-[10px] font-black tracking-widest text-cyan-300">ADMIN</div>
              <div class="text-sm font-black text-slate-100">Generate Coupon Code</div>
              <div class="text-[10px] text-slate-500 mt-1">Code ko users ko share karo (Redeem screen home se hide hai).</div>
            </div>
            <button id="rh-upcoming-gen" class="rounded-2xl bg-cyan-600 px-4 py-2 text-xs font-black">Generate</button>
          </div>
          <div id="rh-upcoming-code" class="mt-3 hidden rounded-2xl bg-black/30 p-3 text-xs text-cyan-200"></div>
        </div>
      </div>
    `;

    // show admin coupon generator if admin
    try{
      if(window.profile?.role==='admin'){
        const box=document.getElementById('rh-upcoming-admin-coupon');
        box?.classList.remove('hidden');
        const btn=document.getElementById('rh-upcoming-gen');
        if(btn && !btn.dataset.bound){
          btn.dataset.bound='1';
          btn.onclick=async()=>{
            try{
              btn.disabled=true; btn.textContent='Generating…';
              if(typeof window.createHubCoupon!=='function') throw new Error('createHubCoupon() not found');

              // createHubCoupon writes into #admin-coupon-result normally.
              // We call it and then mirror the result from that element.
              await window.createHubCoupon();
              const src=document.getElementById('admin-coupon-result');
              const out=document.getElementById('rh-upcoming-code');
              if(out){
                out.classList.remove('hidden');
                out.innerHTML = src?.innerHTML || (src?.textContent ? `<b>${E(src.textContent)}</b>` : '<b>Coupon generated.</b>');
              }
            }catch(e){
              toast(e.message||'Coupon generate failed',false);
            }finally{
              btn.disabled=false; btn.textContent='Generate';
            }
          };
        }
      }
    }catch(_e){}
  }

  // 2) Coupon redeem: remove from home screen (too crowded)
  const couponCard=document.getElementById('coupon-access-card');
  if(couponCard) couponCard.classList.add('hidden');

  // 3) Move AI Coach into Knowledge Card Battle
  _moveCoachToCardBattle();
}

function _moveCoachToCardBattle(){
  const coach=document.getElementById('rh-ai-coach-card');
  const target=document.getElementById('section-cardbattle');
  if(!coach || !target) return;

  // If it was hidden by older cleanup, unhide.
  coach.classList.remove('hidden');

  // If already moved, do nothing
  if(target.contains(coach)) return;

  // Put it at the top of Knowledge Card Battle page.
  try{
    target.prepend(coach);
  }catch(_e){}
}

function _renderHomeWidgets(){
  const home=document.getElementById('section-home');
  if(!home) return;
  if(document.getElementById('rh-home-telegram-widgets')) return;

  const box=document.createElement('div');
  box.id='rh-home-telegram-widgets';
  box.className='space-y-3';

  // Insert near the top of home
  home.prepend(box);

  box.innerHTML=`
    <div class="grid gap-3 sm:grid-cols-3">
      <div id="rh-home-tg-top1" class="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-950/25 via-slate-950 to-indigo-950/30 p-4 sm:p-5" style="box-shadow:0 10px 30px rgba(245,158,11,.10)">
        <div class="text-[10px] font-black tracking-widest text-amber-300">TOP 1 — TELEGRAM QUIZ</div>
        <div class="mt-2 text-sm text-slate-400">Loading…</div>
      </div>

      <div id="rh-home-9pm-topper" class="rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-950/20 via-slate-950 to-indigo-950/30 p-4 sm:p-5">
        <div class="text-[10px] font-black tracking-widest text-rose-300">TOPPER — DAILY 9 PM</div>
        <div class="mt-2 text-sm text-slate-400">Loading…</div>
      </div>

      <div class="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
        <div class="text-[10px] font-black tracking-widest text-sky-300">DAILY SHAYARI</div>
        <div id="rh-home-shayari" class="mt-2 text-sm font-black text-slate-100"></div>
        <div class="mt-2 text-[11px] text-slate-500">24 hrs same • Daily update</div>
      </div>
    </div>
  `;

  const s=document.getElementById('rh-home-shayari');
  if(s) s.textContent=_pickDailyShayari();

  _renderTelegramTop1Card();
  _renderDaily9pmTopperCard();
}

function _renderTelegramTop1Card(){
  const host=document.getElementById('rh-home-tg-top1');
  if(!host) return;

  const champion=Array.isArray(top15)&&top15.length?top15[0]:null;
  const champName=champion?.telegram_name||champion?.telegram_username||'Top player';
  const champXp=+champion?.total_xp||0;
  const champAcc=(champion?.accuracy ?? (champion?.answer_count?Math.round((+champion.correct_count||0)/(+champion.answer_count||1)*100):0));

  host.innerHTML=`
    <div class="text-[10px] font-black tracking-widest text-amber-300">TOP 1 — TELEGRAM QUIZ</div>
    <div class="mt-2 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="truncate text-lg font-black text-slate-100">👑 ${E(champName)}</div>
        <div class="mt-1 text-[11px] text-slate-500">Accuracy: <b class="text-violet-300">${champAcc}%</b></div>
      </div>
      <div class="shrink-0 text-right">
        <div class="text-xl font-black text-amber-300">${champXp} XP</div>
        <div class="text-[10px] text-slate-500">Telegram XP</div>
      </div>
    </div>
    <button class="mt-3 w-full rounded-2xl bg-amber-500/15 border border-amber-500/25 px-4 py-2.5 text-xs font-black text-amber-200" onclick="openTelegramScore()">Open Telegram Leaderboard</button>
  `;
}

function _renderDaily9pmTopperCard(){
  const host=document.getElementById('rh-home-9pm-topper');
  if(!host) return;

  // The app already renders Daily Quiz Top 5 into #rh-home-leaderboard.
  // We read its first row as the topper (best-effort).
  const box=document.getElementById('rh-home-leaderboard');
  const first=box?.querySelector('.rh-mini-row') || box?.querySelector('div');

  let name='',xp='';
  if(first){
    // Try common patterns
    const b=first.querySelector('b');
    if(b) name=b.textContent||'';
    const xpEl=first.querySelector('.rh-mini-xp');
    if(xpEl) xp=xpEl.textContent||'';
  }
  name=(name||'Topper will appear after 9 PM battle').trim();

  host.innerHTML=`
    <div class="text-[10px] font-black tracking-widest text-rose-300">TOPPER — DAILY 9 PM</div>
    <div class="mt-2 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="truncate text-lg font-black text-slate-100">🏆 ${E(name)}</div>
        <div class="mt-1 text-[11px] text-slate-500">Daily battle result (auto)</div>
      </div>
      <div class="shrink-0 text-right">
        <div class="text-xl font-black text-rose-300">${E(xp||'')}</div>
        <div class="text-[10px] text-slate-500">XP</div>
      </div>
    </div>
    <button class="mt-3 w-full rounded-2xl bg-rose-500/10 border border-rose-400/20 px-4 py-2.5 text-xs font-black text-rose-200" onclick="openDailyBattle();return false">Open Daily 9 PM</button>
  `;
}

async function _loadTop15ForHomeWidgets(){
  try{
    const res=await db.rpc('get_telegram_top15');
    if(res.error) throw res.error;
    top15=res.data||[];
    _renderHomeWidgets();
  }catch(_e){
    // ignore
  }
}

function _watchDaily9pmTopper(){
  // Re-render the topper card a few times after load, because #rh-home-leaderboard
  // may load async.
  let tries=0;
  const tick=()=>{
    tries++;
    _renderDaily9pmTopperCard();
    if(tries<10) setTimeout(tick, 1500);
  };
  setTimeout(tick, 800);
}

function inject(){
  if(!document.getElementById('btn-telegramscore')){
    let b=document.createElement('button');
    b.id='btn-telegramscore';
    b.className='rh-nav-btn';
    b.onclick=openTelegramScore;
    b.innerHTML='<i class="fa-brands fa-telegram" style="color:#38bdf8"></i><span>Telegram Score</span>';
    (document.getElementById('btn-leaderboard')||document.querySelector('.rh-nav-btn:last-of-type'))?.before(b);
  }

  _ensureMobileNavButton();
  _applyRequestedHomeCleanup();
  _loadTop15ForHomeWidgets();
  _watchDaily9pmTopper();

  if(document.getElementById('section-telegramscore')) return;

  let s=document.createElement('section');
  s.id='section-telegramscore';
  s.className='hidden space-y-5';

  s.innerHTML=`
    <div class="rounded-3xl border border-sky-400/30 bg-gradient-to-br from-slate-950 via-sky-950/60 to-indigo-950/40 p-5 sm:p-7">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[10px] font-black tracking-widest text-sky-300">TELEGRAM PYQ QUIZ</div>
          <h2 class="text-2xl font-black">Telegram Leaderboard</h2>
          <p class="mt-2 text-xs text-slate-400">सही उत्तर <b class="text-emerald-300">+20 XP</b> • गलत उत्तर <b class="text-rose-300">−10 XP</b> • <b class="text-sky-300">Top 15</b></p>
        </div>
        <button onclick="loadTelegramScore()" class="rh-icon-btn" aria-label="Refresh">
          <i class="fa-solid fa-rotate"></i>
        </button>
      </div>

      <div class="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div class="rounded-2xl bg-black/25 p-3"><b id="tg-xp" class="text-2xl text-sky-300">0</b><small class="block text-slate-500">XP</small></div>
        <div class="rounded-2xl bg-black/25 p-3"><b id="tg-ok" class="text-2xl text-emerald-300">0</b><small class="block text-slate-500">CORRECT</small></div>
        <div class="rounded-2xl bg-black/25 p-3"><b id="tg-bad" class="text-2xl text-rose-300">0</b><small class="block text-slate-500">WRONG</small></div>
        <div class="rounded-2xl bg-black/25 p-3"><b id="tg-acc" class="text-2xl text-violet-300">0%</b><small class="block text-slate-500">ACCURACY</small></div>
      </div>
    </div>

    <div id="tg-panel" class="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">Loading…</div>
  `;

  (document.getElementById('section-leaderboard')||document.querySelector('main'))?.before(s)
}

window.openTelegramScore=()=>{
  document.querySelectorAll('main section[id^="section-"]').forEach(x=>x.classList.add('hidden'));
  document.querySelectorAll('.rh-nav-btn').forEach(x=>x.classList.remove('active'));
  document.getElementById('section-telegramscore')?.classList.remove('hidden');
  document.getElementById('btn-telegramscore')?.classList.add('active');

  document.querySelectorAll('.rh-mobile-bottom button').forEach(x=>x.classList.remove('rh-active'));
  document.getElementById('btn-telegramscore-mobile')?.classList.add('rh-active');

  loadTelegramScore();
  clearInterval(window.__tgLbTimer);
  window.__tgLbTimer=setInterval(loadTelegramScore,10000)
};

function _calcAcc(row){
  const a=+row?.answer_count||0,c=+row?.correct_count||0;
  return a?Math.round(c/a*100):0
}

function renderTop15(container){
  const rows=top15||[];
  const list=rows.map(r=>{
    const name=r.telegram_name||r.telegram_username||'Telegram User';
    const uname=r.telegram_username?`@${E(r.telegram_username)}`:'';
    const acc=(r.accuracy??_calcAcc(r));
    const rank=r.rank||'';
    const xp=+r.total_xp||0;
    const correct=+r.correct_count||0;
    const wrong=+r.wrong_count||0;
    const answered=+r.answer_count||0;

    const isChampion = (rank===1 || rank==='1');

    const medal=isChampion?'🥇':(rank===2||rank==='2')?'🥈':(rank===3||rank==='3')?'🥉':'';

    const championBadge = isChampion
      ? `<span class="inline-flex items-center gap-1 rounded-2xl bg-amber-500/15 px-2 py-1 text-[10px] font-black tracking-widest text-amber-300 border border-amber-500/25">👑 CHAMPION</span>`
      : ``;

    const cardClass = isChampion
      ? `group rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/35 via-slate-950 to-indigo-950/40 p-4 sm:p-5`
      : `group rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/40 p-4 sm:p-5`;

    const glowStyle = isChampion
      ? `box-shadow: 0 0 0 1px rgba(245,158,11,.12), 0 10px 30px rgba(245,158,11,.18), 0 0 40px rgba(56,189,248,.08);`
      : ``;

    return `
      <div class="${cardClass}" style="${glowStyle}">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-2xl ${isChampion?'bg-amber-500/15 text-amber-300 border border-amber-500/25':'bg-sky-500/15 text-sky-300'} px-2 text-xs font-black">#${rank}</span>
              ${medal?`<span class="text-lg">${medal}</span>`:''}
              <div class="min-w-0">
                <div class="truncate font-black text-slate-100">${E(name)}</div>
                <div class="truncate text-[11px] text-slate-500">${uname||`ID ${r.telegram_user_id||''}`}</div>
              </div>
            </div>
            <div class="mt-2">${championBadge}</div>
          </div>

          <div class="shrink-0 text-right">
            <div class="text-lg font-black ${isChampion?'text-amber-300':'text-sky-300'}">${xp} XP</div>
            <div class="text-[11px] text-slate-500">Top 15</div>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-2xl bg-black/25 p-2">
            <div class="text-xs font-black text-emerald-300">✅ ${correct}</div>
            <div class="text-[10px] text-slate-500">Correct</div>
          </div>
          <div class="rounded-2xl bg-black/25 p-2">
            <div class="text-xs font-black text-rose-300">❌ ${wrong}</div>
            <div class="text-[10px] text-slate-500">Wrong</div>
          </div>
          <div class="rounded-2xl bg-black/25 p-2">
            <div class="text-xs font-black text-violet-300">🎯 ${acc}%</div>
            <div class="text-[10px] text-slate-500">Accuracy</div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>Answers: <b class="text-slate-300">${answered}</b></span>
          <span class="text-slate-500">Updated live</span>
        </div>
      </div>
    `
  }).join('');

  container.innerHTML=`
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-[10px] font-black tracking-widest text-sky-300">LEADERBOARD</div>
        <div class="text-xl font-black">Top 15 Telegram Users</div>
      </div>
      <div class="text-right text-[11px] text-slate-500">Auto refresh: 10s</div>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      ${list || '<div class="text-slate-500">No data yet.</div>'}
    </div>

    <div class="mt-5 rounded-3xl border border-slate-800 bg-black/20 p-4">
      <div class="text-sm font-black text-slate-100">Connect your Telegram</div>
      <div class="mt-1 text-xs text-slate-500">Apna score add karne ke liye app se code generate karke bot me /link CODE bhejo.</div>
      <div id="tg-link-box" class="mt-3"></div>
    </div>
  `;
}

function render(){
  const a=+score?.answer_count||0,c=+score?.correct_count||0;
  for(const [id,v] of [['tg-xp',+score?.total_xp||0],['tg-ok',c],['tg-bad',+score?.wrong_count||0],['tg-acc',(a?Math.round(c/a*100):0)+'%']]){
    const n=document.getElementById(id); if(n) n.textContent=v
  }

  const p=document.getElementById('tg-panel');
  if(!p) return;
  renderTop15(p);

  const box=document.getElementById('tg-link-box');
  if(!box) return;

  if(link?.telegram_user_id){
    box.innerHTML=`
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-emerald-300 font-black">✓ TELEGRAM CONNECTED</div>
          <div class="mt-1 text-sm font-black text-slate-100">${E(link.telegram_name||'Telegram User')}</div>
          <div class="text-[11px] text-slate-500">${link.telegram_username?('@'+E(link.telegram_username)):('ID '+link.telegram_user_id)}</div>
        </div>
        <div class="text-right">
          <div class="text-sky-300 font-black">${(+score?.total_xp||0)} XP</div>
          <div class="text-[11px] text-slate-500">Your Telegram XP</div>
        </div>
      </div>
    `;
    return;
  }

  const valid=link?.link_code && new Date(link.code_expires_at)>new Date();
  box.innerHTML = valid
    ? `<div class="text-xs text-slate-400">Send this to the bot:</div>
       <div class="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
         <code class="block rounded-2xl bg-black/30 px-3 py-2 text-slate-200">/link ${E(link.link_code)}</code>
         <button class="rounded-2xl bg-sky-600 px-4 py-2 font-black" onclick="navigator.clipboard.writeText('/link ${E(link.link_code)}');toast('Copied ✓')">Copy</button>
       </div>`
    : `<button class="rounded-2xl bg-sky-600 px-5 py-3 font-black" onclick="createTelegramLinkCode()">Generate Link Code</button>`;
}

window.createTelegramLinkCode=async()=>{try{let{data,error}=await db.rpc('create_telegram_link_code');if(error)throw error;link={...(link||{}),link_code:data.code,code_expires_at:data.expires_at};render();toast('Link code ready ✓')}catch(e){toast(e.message||'Code नहीं बना',false)}};

window.loadTelegramScore=async()=>{
  try{
    const res=await db.rpc('get_telegram_top15');
    if(res.error) throw res.error;
    top15=res.data||[];

    _renderTelegramTop1Card();

    try{ if(user) await db.rpc('claim_telegram_quiz_xp') }catch(_e){}

    if(user){
      const [a,b]=await Promise.all([
        db.from('telegram_account_links').select('*').eq('app_user_id',user.id).maybeSingle(),
        db.from('telegram_quiz_scores').select('*').eq('app_user_id',user.id).maybeSingle()
      ]);
      if(a.error) throw a.error;
      if(b.error) throw b.error;
      link=a.data;
      score=b.data;
    }

    render();
  }catch(e){
    const p=document.getElementById('tg-panel');
    if(p) p.innerHTML='<b class="text-amber-300">Supabase setup pending</b><p class="mt-2 text-xs text-slate-500">supabase-telegram-score.sql + get_telegram_top15() run करें</p>'
  }
};

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded',()=>{inject(); _ensureMobileNavButton();})
  : (inject(), _ensureMobileNavButton());
})();
