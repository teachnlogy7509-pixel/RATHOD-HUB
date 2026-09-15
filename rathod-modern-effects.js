/* RATHOD HUB requested UI and coupon broadcast fix v12 */
(function(){
'use strict';
if(window.__RH_FIX_V12__)return;window.__RH_FIX_V12__=1;
var channel=null;
function $(id){return document.getElementById(id)}
function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]) )}
function globals(){try{if(typeof db!=='undefined')window.db=db}catch(e){}try{if(typeof profile!=='undefined')window.profile=profile}catch(e){}try{if(typeof user!=='undefined')window.user=user}catch(e){}}
function admin(){globals();return window.profile?.role==='admin'}
function note(text,ok){if(typeof window.toast==='function')window.toast(text,ok)}
function splash(){var e=$('rh-splash-screen');if(!e)return;e.style.opacity='0';e.style.pointerEvents='none';setTimeout(()=>e.remove(),250)}
window.triggerRhCelebration=window.triggerRhCelebration||function(){};
function requestedUI(){
 var ai=$('section-ai'),tutor=$('section-aitutor')||$('ai-tutor-embedded');
 if(ai&&tutor&&tutor.id!=='ai-tutor-embedded'){tutor.id='ai-tutor-embedded';tutor.classList.remove('hidden');tutor.removeAttribute('hidden');tutor.classList.add('mt-5');ai.appendChild(tutor)}
 var power=$('section-studypower');power?.querySelectorAll('h3').forEach(h=>{if((h.textContent||'').includes('Smart Daily Motivation'))h.parentElement?.remove()});
 $('btn-rathodnew')?.remove();$('section-rathodnew')?.remove();document.querySelectorAll('.rh-feature').forEach(c=>{if(/RATHOD\s+NEW/i.test(c.textContent||'')||/rathodnew/i.test(c.getAttribute('onclick')||''))c.remove()});
 $('btn-dailyformula')?.remove();$('section-dailyformula')?.remove();document.querySelectorAll('[onclick*="dailyformula"]').forEach(el=>el.remove());
}
function loadAddons(){[['rh-profile-card-script','profile-card-update.js?v=2'],['rh-admin-layout-script','rathod-admin-layout.js?v=1']].forEach(([id,src])=>{if($(id))return;var s=document.createElement('script');s.id=id;s.src=src;s.defer=true;document.head.appendChild(s)})}
function couponFrom(row){var m=row?.metadata||{},code=row?.code||m.coupon_code,exp=row?.coupon_expires_at||m.coupon_expires_at||m.expires_at||row?.expires_at;if(!code||(exp&&new Date(exp)<=new Date()))return null;return{code:String(code).toUpperCase(),expires_at:exp||null,access_days:Number(row?.access_days||m.access_days||5)}}
async function coupons(){globals();var out=[];if(!window.db)return out;try{var r=await db.rpc('get_active_hub_coupons');if(!r.error&&Array.isArray(r.data))out=r.data.map(couponFrom).filter(Boolean)}catch(e){}if(!out.length)try{var n=await db.from('hub_notifications').select('metadata,created_at,expires_at').eq('tag','announcement').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(30);if(!n.error)out=(n.data||[]).map(couponFrom).filter(Boolean)}catch(e){}var seen={};return out.filter(x=>seen[x.code]?false:(seen[x.code]=true))}
function card(){var vault=$('section-vault'),c=$('vault-coupon-display');if(!vault)return null;if(c)return c;c=document.createElement('div');c.id='vault-coupon-display';c.className='rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-slate-950 via-cyan-950/35 to-violet-950/35 p-5 sm:p-6 shadow-2xl';c.innerHTML='<div class="flex items-start justify-between gap-3"><div><div class="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300">AVAILABLE TO ALL USERS</div><h3 class="mt-1 text-xl font-black text-white">🎟️ Active Coupon Codes</h3><p class="mt-1 text-xs text-slate-400">Latest active coupon yahan dikhega. Admin ise delete kar sakta hai.</p></div><button id="vault-coupon-refresh" type="button" class="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black">Refresh</button></div><div id="vault-coupon-code" class="mt-4 grid gap-2"><div class="rounded-2xl bg-black/25 p-4 text-xs text-slate-500">Checking coupon…</div></div>';vault.insertBefore(c,vault.firstChild);$('vault-coupon-refresh').onclick=show;return c}
async function redeem(code){try{var r=await db.rpc('redeem_hub_coupon',{p_code:code});if(r.error)throw r.error;if(!r.data?.success)throw Error(r.data?.error||'Coupon invalid');await window.loadHubCouponAccess?.();note('✅ Premium access unlock ho gaya');show()}catch(e){note(e.message||'Coupon redeem failed',false)}}
async function copy(code){try{await navigator.clipboard.writeText(code);note('Coupon copied ✓')}catch(e){prompt('Copy coupon',code)}}
async function show(){card();var box=$('vault-coupon-code');if(!box||!window.db)return;box.innerHTML='<div class="rounded-2xl bg-black/25 p-4 text-xs text-slate-500">Checking coupon…</div>';var rows=(await coupons()).slice(0,1);box.innerHTML=rows.length?rows.map(x=>'<div class="flex flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 sm:flex-row sm:items-center"><div class="min-w-0 flex-1"><div class="text-[9px] font-black text-cyan-300">ACTIVE COUPON</div><code class="mt-1 block break-all text-lg font-black text-white">'+esc(x.code)+'</code><div class="mt-1 text-[10px] text-slate-500">'+(x.expires_at?'Redeem before '+esc(new Date(x.expires_at).toLocaleString())+' • ':'')+x.access_days+' days access</div></div><div class="flex gap-2"><button data-copy="'+esc(x.code)+'" class="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black">Copy</button><button data-redeem="'+esc(x.code)+'" class="rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-xs font-black">Redeem</button></div></div>').join(''):'<div class="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-500">Abhi koi active coupon available nahi hai.</div>';box.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy));box.querySelectorAll('[data-redeem]').forEach(b=>b.onclick=()=>redeem(b.dataset.redeem))}
window.showVaultCoupon=show;
function live(){globals();if(channel||!window.db)return;channel=db.channel('rathod-hub-coupon-global-v12',{config:{broadcast:{self:false}}});channel.on('broadcast',{event:'coupon'},({payload:p})=>{if(p?.sourceId&&String(p.sourceId)===String(window.user?.id))return;window.showHubNotification?.(p?.title||'🎟️ New Coupon',p?.body||'','announcement','vault',{id:p?.id,metadata:p?.metadata||{}});show()}).subscribe()}
async function notifyAll(code,exp,days=5){if(!code)return;var title='🎟️ New RATHOD HUB Coupon',body='Coupon code: '+code+' • My Vault mein jaakar redeem karein',metadata={coupon_code:code,coupon_expires_at:exp||null,access_days:Number(days||5),type:'coupon'},item=null;try{if(typeof window.sendHubNotification==='function')item=await window.sendHubNotification(title,body,'announcement','vault',metadata);else{var r=await db.rpc('publish_hub_notification',{p_title:title,p_body:body,p_tag:'announcement',p_action:'vault',p_metadata:metadata});item=Array.isArray(r.data)?r.data[0]:r.data}}catch(e){console.warn('Coupon persist failed',e)}live();try{await channel?.send({type:'broadcast',event:'coupon',payload:{id:item?.id||'coupon_'+Date.now(),title,body,metadata,sourceId:window.user?.id||null}})}catch(e){console.warn('Coupon broadcast failed',e)}show()}
function resultCode(data){if(data?.code)return String(data.code).toUpperCase();var text=$('admin-coupon-result')?.textContent||'',m=text.match(/RATHOD-[A-Z0-9_-]+/i)||text.match(/Coupon:\s*([A-Z0-9_-]+)/i);return m?m[0].replace(/^Coupon:\s*/i,'').toUpperCase():''}
function patch(){if(window.__RH_COUPON_PATCH_V12__||typeof window.createHubCoupon!=='function')return;var original=window.createHubCoupon;window.__RH_COUPON_PATCH_V12__=1;window.createHubCoupon=async function(){if(!admin())return original.apply(this,arguments);var since=Date.now(),result=await original.apply(this,arguments);setTimeout(async()=>{var code=resultCode(result),exp=null,days=5;try{var r=await db.from('hub_access_coupons').select('code,expires_at,access_days,created_at').eq('active',true).gte('created_at',new Date(since-10000).toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();if(r.data){code=r.data.code;exp=r.data.expires_at;days=r.data.access_days||5}}catch(e){}await notifyAll(String(code||'').toUpperCase(),exp,days);if(code)note('Coupon sabhi users ko notify kiya ✓')},500);return result}}
function manual(){var out=$('admin-coupon-result');if(!out||$('rh-send-coupon-notify-btn'))return;var b=document.createElement('button');b.id='rh-send-coupon-notify-btn';b.type='button';b.className='mt-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white';b.textContent='Send coupon notification to all';b.onclick=async()=>{var code=resultCode(),exp=null,days=5;try{var r=await db.from('hub_access_coupons').select('code,expires_at,access_days').eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle();if(r.data){code=r.data.code;exp=r.data.expires_at;days=r.data.access_days||5}}catch(e){}await notifyAll(String(code||'').toUpperCase(),exp,days);note(code?'Notification sent to all ✓':'Coupon code nahi mila',!!code)};out.appendChild(b)}
function tick(){globals();requestedUI();loadAddons();card();patch();manual();live()}
ready(()=>{setTimeout(splash,300);setTimeout(splash,1800);tick();setTimeout(()=>{window.initAITutorView?.();show()},700);setInterval(tick,2000)});
})();

/* Google OAuth sign-in button. Email/password auth remains unchanged. */
(function(){
'use strict';
function byId(id){return document.getElementById(id)}
function addGoogleAuth(){
  if(byId('rh-google-auth')||!byId('auth-form'))return true;
  var anchor=byId('forgot-wrap')||byId('auth-form').nextElementSibling;
  var wrap=document.createElement('div');wrap.id='rh-google-auth';wrap.className='mt-4';
  wrap.innerHTML='<div class="flex items-center gap-2 my-3"><div class="h-px flex-1 bg-white/10"></div><span class="text-[10px] text-slate-500 font-bold">OR</span><div class="h-px flex-1 bg-white/10"></div></div><button id="rh-google-btn" type="button" class="w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow hover:bg-slate-100"><i class="fa-brands fa-google mr-2 text-red-500"></i>Continue with Google</button><p class="mt-2 text-center text-[10px] text-slate-500">Google account se secure login</p>';
  if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(wrap,anchor);else byId('auth-form').appendChild(wrap);
  byId('rh-google-btn').onclick=async function(){
    try{
      if(!window.db)throw new Error('Supabase अभी load नहीं हुआ. Page refresh करें.');
      var redirect=window.location.origin+window.location.pathname;
      var r=await window.db.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect}});
      if(r.error)throw r.error;
    }catch(e){if(typeof window.toast==='function')window.toast(e.message||'Google login failed',false)}
  };
  return true;
}
function init(){if(addGoogleAuth())return;setTimeout(init,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
})();

/* Public-safe app events for the female-persona VIP Bridge Bot. */
(function(){
'use strict';
var emitted={};
function currentName(){try{return String(window.profile?.name||window.user?.user_metadata?.name||'RATHOD Aspirant').slice(0,60)}catch(e){return 'RATHOD Aspirant'}}
async function emit(type,payload,mode){try{if(!window.db||!window.user)return;var key=type+'|'+JSON.stringify(payload||{});if(emitted[key]&&Date.now()-emitted[key]<5000)return;emitted[key]=Date.now();var r=await window.db.from('rh_bridge_events').insert({event_type:String(type).slice(0,60),delivery_mode:mode||'digest',user_id:window.user.id,display_name:currentName(),payload:payload||{}});if(r.error)console.info('Bridge event SQL pending.',r.error.message)}catch(e){console.info('Bridge event skipped.',e?.message||e)}}
function wrap(name,after){var fn=window[name];if(typeof fn!=='function'||fn.__rhBridgeWrapped)return;if(fn.__rhBridgeOriginal)fn=fn.__rhBridgeOriginal;var wrapped=async function(){var args=arguments,result=await fn.apply(this,args);try{await after(args,result)}catch(e){}return result};wrapped.__rhBridgeWrapped=true;wrapped.__rhBridgeOriginal=fn;window[name]=wrapped}
function patch(){
 wrap('sendHubNotification',async(args)=>{await emit('app_notification',{title:String(args[0]||'RATHOD HUB Update'),body:String(args[1]||''),tag:String(args[2]||'event'),action:String(args[3]||''),metadata:args[4]||{}},'immediate')});
 wrap('awardQuizXP',async(args)=>{var ok=!!args[0];await emit('question_solved',{mode:'App Practice',is_correct:ok,xp_delta:ok?10:0},'digest')});
 wrap('qbAnswer',async()=>{await emit('question_solved',{mode:'Live Quiz'},'digest')});
 wrap('n720Answer',async()=>{await emit('question_solved',{mode:'NEET 720'},'digest')});
 wrap('qbFinishRoom',async()=>{await emit('quiz_completed',{mode:'Live Quiz'},'immediate')});
 wrap('n720FinishRoom',async()=>{await emit('quiz_completed',{mode:'NEET 720'},'immediate')});
 wrap('joinStudyRoom',async(args)=>{await emit('study_room_joined',{room:String(args[0]||'Study Room')},'immediate')});
 wrap('joinStudyBatch',async(args)=>{await emit('study_batch_joined',{batch_id:String(args[0]||'')},'immediate')});
}
function init(){patch();setInterval(patch,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,500);
})();