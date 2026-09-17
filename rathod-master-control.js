(()=>{
'use strict';
if(window.__RH_MASTER_CONTROL__)return;
window.__RH_MASTER_CONTROL__=1;
const OWNER_EMAILS=new Set(['ashisharmy1982@gmail.com','teachnlogy7509@gmail.com']);
const $=id=>document.getElementById(id);
let state=null;
function ctx(){
  let d=window.db,u=window.user,p=window.profile;
  try{if(!d&&typeof db!=='undefined')d=db}catch(_e){}
  try{if(!u&&typeof user!=='undefined')u=user}catch(_e){}
  try{if(!p&&typeof profile!=='undefined')p=profile}catch(_e){}
  return{d,u,p};
}
async function load(){
  const {d,u,p}=ctx();
  if(!d)return;
  try{
    let r=await d.rpc('get_rathod_system_control');
    if(r.error)throw r.error;
    state=r.data;
    const email=String(u?.email||p?.email||'').trim().toLowerCase();
    if(!state?.can_control&&OWNER_EMAILS.has(email)){
      const boot=await d.rpc('bootstrap_rathod_owner');
      if(!boot.error){r=await d.rpc('get_rathod_system_control');state=r.data;}
    }
    apply();
    panel();
  }catch(e){console.info('Master control SQL pending',e?.message||e)}
}
function apply(){
  if(!state)return;
  const locked=state.master_enabled===false||state.hub_enabled===false;
  let lock=$('rh-master-lock');
  if(!locked){lock?.remove();return;}
  if(state.can_control){lock?.remove();return;}
  if(!lock){
    lock=document.createElement('div');
    lock.id='rh-master-lock';
    lock.style='position:fixed;inset:0;z-index:999999;background:#020617;color:white;display:grid;place-items:center;padding:24px;text-align:center';
    document.body.appendChild(lock);
  }
  lock.innerHTML=`<div><div style="font-size:64px">🔐</div><h1>RATHOD HUB Maintenance</h1><p>${String(state.maintenance_message||'System temporarily locked.')}</p></div>`;
}
function panel(){
  if(!state?.can_control||$('rh-master-panel'))return;
  const host=$('admin-controls-host')||$('section-admin')||document.body;
  const box=document.createElement('div');
  box.id='rh-master-panel';
  box.className='rounded-3xl border border-red-400/30 bg-slate-950 p-5 my-4';
  box.innerHTML=`<h3 class="text-xl font-black">🔐 Master System Controller</h3><p class="text-xs text-slate-400 mt-1">Owner/manager controlled central locker</p><div id="rh-master-buttons" class="grid grid-cols-2 gap-2 mt-4"></div><input id="rh-master-msg" class="mt-3 w-full rounded-xl bg-black/30 p-3" value="${String(state.maintenance_message||'').replaceAll('"','&quot;')}"><button id="rh-master-save" class="mt-3 rounded-xl bg-cyan-600 px-4 py-3 font-black">Save control</button>`;
  host.prepend(box);
  renderButtons();
  $('rh-master-save').onclick=save;
}
function renderButtons(){
  const box=$('rh-master-buttons');
  if(!box)return;
  const keys=[['master_enabled','MASTER'],['hub_enabled','HUB'],['quiz_bot_enabled','QUIZ BOT'],['sakhi_enabled','SAKHI'],['pdf_worker_enabled','PDF WORKER']];
  box.innerHTML=keys.map(([key,label])=>`<button data-key="${key}" class="rounded-xl p-3 font-black ${state[key]?'bg-emerald-700':'bg-red-700'}">${label}: ${state[key]?'ON':'OFF'}</button>`).join('');
  box.querySelectorAll('button').forEach(button=>button.onclick=()=>{state[button.dataset.key]=!state[button.dataset.key];renderButtons()});
}
async function save(){
  const {d}=ctx();
  if(!d)return;
  const result=await d.rpc('set_rathod_system_control',{p_master:state.master_enabled,p_hub:state.hub_enabled,p_quiz_bot:state.quiz_bot_enabled,p_sakhi:state.sakhi_enabled,p_pdf_worker:state.pdf_worker_enabled,p_message:$('rh-master-msg')?.value||''});
  if(result.error)return window.toast?.(result.error.message,false);
  state={...state,...result.data};
  window.toast?.('Master control saved ✓');
  apply();renderButtons();
}
function boot(){if(ctx().d)load();else setTimeout(boot,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setInterval(load,15000);
})();