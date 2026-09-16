/* RATHOD HUB • secure referral access and 5,000 XP rewards */
(function(){
  'use strict';
  if(window.__RH_REFERRAL__) return;
  window.__RH_REFERRAL__=1;

  const PENDING_KEY='rh_pending_referral_code';
  let busy=false;
  let attempts=0;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const db=()=>window.db||null;
  const currentUser=()=>window.user||null;

  function rememberIncomingCode(){
    try{
      const code=(new URL(window.location.href).searchParams.get('ref')||'').trim().toUpperCase();
      if(code) localStorage.setItem(PENDING_KEY,code);
    }catch(_e){}
  }
  function pendingCode(){try{return (localStorage.getItem(PENDING_KEY)||'').trim().toUpperCase()}catch(_e){return ''}}
  function forgetPending(){try{localStorage.removeItem(PENDING_KEY)}catch(_e){}}
  function showToast(text,ok=true){try{if(typeof window.toast==='function') window.toast(text,ok)}catch(_e){}}
  function formatDate(value){if(!value)return '';try{return new Date(value).toLocaleDateString('hi-IN',{day:'numeric',month:'short',year:'numeric'})}catch(_e){return String(value)}}
  function referralLink(code){return window.location.origin+window.location.pathname+'?ref='+encodeURIComponent(code)}

  async function copyLink(url){
    try{await navigator.clipboard.writeText(url)}catch(_e){const area=document.createElement('textarea');area.value=url;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove()}
    showToast('Referral link copied ✓');
  }
  async function shareLink(url){
    if(navigator.share){try{await navigator.share({title:'RATHOD HUB Premium',text:'RATHOD HUB join karo — referral se 7 din premium access milega.',url});return}catch(_e){}}
    await copyLink(url);
  }

  function render(code,dashboard,access){
    const home=$('section-home')||document.querySelector('main');
    if(!home||!code)return;
    let card=$('rh-referral-card');
    if(!card){card=document.createElement('div');card.id='rh-referral-card';card.className='mb-4 rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-cyan-950/35 p-5 shadow-xl';home.prepend(card)}
    const url=referralLink(code),count=Number(dashboard?.successful_referrals||0),xp=Number(dashboard?.xp_earned||0),active=Boolean(access?.active),expiry=active?formatDate(access.expires_at):'';
    card.innerHTML=`
      <div class="flex flex-wrap items-start justify-between gap-3"><div><div class="text-[10px] font-black tracking-[.2em] text-emerald-300">REFER &amp; EARN</div><h3 class="mt-1 text-xl font-black text-slate-100">दोस्त लाओ, Premium पाओ</h3><p class="mt-2 max-w-2xl text-xs leading-5 text-slate-300">आपके referral link से नया user sign up करेगा तो उसे <b class="text-emerald-300">7 दिन Premium access</b> मिलेगा। हर successful referral पर आपको <b class="text-amber-300">5,000 XP</b> मिलेंगे।</p></div><div class="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-right text-[10px] font-black text-emerald-200">${active?`Premium active till ${esc(expiry)}`:'Referral ready'}</div></div>
      <div class="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input id="rh-referral-link" readonly value="${esc(url)}" class="min-w-0 rounded-2xl border border-slate-700 bg-black/30 px-3 py-3 text-[11px] text-slate-300" /><button id="rh-referral-copy" class="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white">Copy link</button><button id="rh-referral-share" class="rounded-2xl bg-cyan-600 px-4 py-3 text-xs font-black text-white">Share</button></div>
      <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"><div class="rounded-2xl bg-black/25 p-3"><b class="block text-lg text-emerald-300">${count}</b><span class="text-[10px] text-slate-500">Successful referrals</span></div><div class="rounded-2xl bg-black/25 p-3"><b class="block text-lg text-amber-300">${xp} XP</b><span class="text-[10px] text-slate-500">Referral XP earned</span></div><div class="rounded-2xl bg-black/25 p-3"><b class="block text-lg text-cyan-300">7 days</b><span class="text-[10px] text-slate-500">New-user Premium</span></div></div>`;
    $('rh-referral-copy').onclick=()=>copyLink(url);
    $('rh-referral-share').onclick=()=>shareLink(url);
  }

  async function claimPending(client){
    const code=pendingCode();if(!code)return false;
    try{
      const result=await client.rpc('claim_hub_referral',{p_code:code});
      if(result.error)return false;
      const data=result.data||{};
      if(data.success){
        forgetPending();
        if(data.already_claimed)showToast('Referral पहले से claimed है ✓');
        else{showToast('Referral accepted — 7 दिन Premium active ✓');setTimeout(()=>window.location.reload(),900);return true}
      }else if(data.error){forgetPending();showToast(data.error,false)}
    }catch(_e){}
    return false;
  }

  async function load(){
    rememberIncomingCode();
    const client=db();
    if(!client||!currentUser()){if(attempts++<40)setTimeout(load,750);return}
    if(busy)return;busy=true;
    try{
      if(await claimPending(client))return;
      const [codeResult,dashboardResult,accessResult]=await Promise.all([client.rpc('get_or_create_hub_referral_code'),client.rpc('get_hub_referral_dashboard'),client.rpc('get_hub_coupon_access')]);
      if(codeResult.error)throw codeResult.error;
      render((codeResult.data||{}).code,dashboardResult.error?{}:(dashboardResult.data||{}),accessResult.error?{}:(accessResult.data||{}));
    }catch(e){console.info('Referral setup pending',e?.message||e)}finally{busy=false}
  }
  function boot(){rememberIncomingCode();load();try{db()?.auth?.onAuthStateChange(()=>setTimeout(load,500))}catch(_e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
