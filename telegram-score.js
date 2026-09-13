(()=>{let link=null,score=null,top15=[];const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inject(){if(document.getElementById('btn-telegramscore'))return;let b=document.createElement('button');b.id='btn-telegramscore';b.className='rh-nav-btn';b.onclick=openTelegramScore;b.innerHTML='<i class="fa-brands fa-telegram" style="color:#38bdf8"></i><span>Telegram Score</span>';(document.getElementById('btn-leaderboard')||document.querySelector('.rh-nav-btn:last-of-type'))?.before(b);

let s=document.createElement('section');s.id='section-telegramscore';s.className='hidden space-y-5';

// VIP leaderboard UI: modern, mobile-first, no extra CSS file needed.
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

(document.getElementById('section-leaderboard')||document.querySelector('main'))?.before(s)}

window.openTelegramScore=()=>{
  document.querySelectorAll('main section[id^="section-"]').forEach(x=>x.classList.add('hidden'));
  document.querySelectorAll('.rh-nav-btn').forEach(x=>x.classList.remove('active'));
  document.getElementById('section-telegramscore')?.classList.remove('hidden');
  document.getElementById('btn-telegramscore')?.classList.add('active');
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

    // Medal for top 3
    const medal=(rank===1||rank==='1')?'🥇':(rank===2||rank==='2')?'🥈':(rank===3||rank==='3')?'🥉':'';

    return `
      <div class="group rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/40 p-4 sm:p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-2xl bg-sky-500/15 px-2 text-xs font-black text-sky-300">#${rank}</span>
              ${medal?`<span class="text-lg">${medal}</span>`:''}
              <div class="min-w-0">
                <div class="truncate font-black text-slate-100">${E(name)}</div>
                <div class="truncate text-[11px] text-slate-500">${uname||`ID ${r.telegram_user_id||''}`}</div>
              </div>
            </div>
          </div>

          <div class="shrink-0 text-right">
            <div class="text-lg font-black text-sky-300">${xp} XP</div>
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
  // Stat cards (top row)
  const a=+score?.answer_count||0,c=+score?.correct_count||0;
  for(const [id,v] of [['tg-xp',+score?.total_xp||0],['tg-ok',c],['tg-bad',+score?.wrong_count||0],['tg-acc',(a?Math.round(c/a*100):0)+'%']]){
    const n=document.getElementById(id); if(n) n.textContent=v
  }

  const p=document.getElementById('tg-panel');
  if(!p) return;

  // Always show Top 15 first (VIP look)
  renderTop15(p);

  const box=document.getElementById('tg-link-box');
  if(!box) return;

  // If linked, show badge; otherwise show link flow CTA.
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
    // Load Top 15 first so the panel never looks empty.
    const res=await db.rpc('get_telegram_top15');
    if(res.error) throw res.error;
    top15=res.data||[];

    // Claim XP is optional; do not block UI.
    try{ if(user) await db.rpc('claim_telegram_quiz_xp') }catch(_e){}

    // Load current user's link + stats if logged in.
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

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',inject):inject();})();
