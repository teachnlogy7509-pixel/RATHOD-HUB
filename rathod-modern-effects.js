/* RATHOD HUB COUPON NOTIFICATION FIX v8
   Main requested fix: whenever admin generates a coupon, send it to all users via notifications.
   Keeps app startup safe and does not delete any feature. */
(function () {
  'use strict';
  if (window.__RH_COUPON_NOTIFY_FIX_V8__) return;
  window.__RH_COUPON_NOTIFY_FIX_V8__ = true;

  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
  function isAdmin(){ return !!(window.profile && window.profile.role === 'admin'); }
  function removeSplash(){ var s=$('rh-splash-screen'); if(!s)return; s.style.opacity='0'; s.style.pointerEvents='none'; setTimeout(function(){ if(s&&s.parentNode)s.parentNode.removeChild(s); },250); }
  window.triggerRhCelebration = window.triggerRhCelebration || function(){};

  function extractCodeFromResult(data){
    if(data && data.code) return String(data.code).trim();
    var out=$('admin-coupon-result');
    var txt=out ? String(out.textContent||'') : '';
    var m=txt.match(/RATHOD-[A-Z0-9_-]+/i) || txt.match(/Coupon:\s*([A-Z0-9_-]+)/i);
    return m ? String(m[0]).replace(/^Coupon:\s*/i,'').trim().toUpperCase() : '';
  }

  async function notifyCouponToAll(code, expiresAt){
    if(!code) return;
    var title='🎟️ New RATHOD HUB Coupon';
    var body='New coupon code: '+code+(expiresAt?' • Redeem before '+new Date(expiresAt).toLocaleString():'');
    var meta={coupon_code:code,expires_at:expiresAt||null,type:'coupon'};
    try{
      if(typeof window.sendHubNotification === 'function'){
        await window.sendHubNotification(title, body, 'coupon', 'vault', meta);
        return;
      }
    }catch(e){ console.warn('sendHubNotification coupon failed', e&&e.message?e.message:e); }
    try{
      if(window.db){
        await db.rpc('publish_hub_notification',{p_title:title,p_body:body,p_tag:'coupon',p_action:'vault',p_metadata:meta});
      }
    }catch(e2){ console.warn('coupon rpc notification failed', e2&&e2.message?e2.message:e2); }
  }

  function patchCreateCoupon(){
    if(window.__RH_CREATE_COUPON_NOTIFY_PATCHED__) return true;
    if(typeof window.createHubCoupon !== 'function') return false;
    var original=window.createHubCoupon;
    window.__RH_CREATE_COUPON_NOTIFY_PATCHED__=true;
    window.createHubCoupon=async function(){
      if(!isAdmin()) return original.apply(this, arguments);
      var before=Date.now();
      var result=await original.apply(this, arguments);
      setTimeout(async function(){
        try{
          var code='', expiresAt=null;
          // Best source: latest active coupon in Supabase after generation.
          if(window.db){
            try{
              var r=await db.from('hub_access_coupons').select('code,expires_at,created_at,active').eq('active',true).gte('created_at',new Date(before-10000).toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();
              if(r && r.data){ code=r.data.code; expiresAt=r.data.expires_at; }
            }catch(_e){}
          }
          if(!code) code=extractCodeFromResult(result);
          await notifyCouponToAll(code, expiresAt);
          if(code && typeof window.toast==='function') window.toast('Coupon notification sabko bhej diya ✓');
        }catch(e){ console.warn('coupon notify wrapper failed', e&&e.message?e.message:e); }
      },500);
      return result;
    };
    return true;
  }

  function addManualNotifyButton(){
    var out=$('admin-coupon-result');
    if(!out || $('rh-send-coupon-notify-btn')) return;
    var btn=document.createElement('button');
    btn.id='rh-send-coupon-notify-btn';
    btn.type='button';
    btn.className='mt-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white';
    btn.textContent='Send coupon notification to all';
    btn.onclick=async function(){
      var code=extractCodeFromResult();
      if(!code && window.db){
        try{ var r=await db.from('hub_access_coupons').select('code,expires_at,created_at,active').eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle(); if(r&&r.data) code=r.data.code; }catch(e){}
      }
      await notifyCouponToAll(code,null);
      if(typeof window.toast==='function') window.toast(code?'Notification sent ✓':'Coupon code nahi mila', !!code);
    };
    out.appendChild(btn);
  }

  function showVaultCoupon(){
    var vault=$('section-vault'); if(!vault||!window.db)return;
    var card=$('vault-coupon-display');
    if(!card){
      card=document.createElement('div'); card.id='vault-coupon-display'; card.className='rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4 mb-4';
      card.innerHTML='<div class="flex items-center justify-between gap-3"><div><b class="text-cyan-200">🎟️ Latest Coupon Code</b><p class="mt-1 text-xs text-slate-400">Admin generate karega to notification aur vault me code dikhega.</p></div><button type="button" id="vault-coupon-refresh" class="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black">Refresh</button></div><div id="vault-coupon-code" class="mt-3 rounded-xl bg-slate-950 p-3 text-sm font-black text-cyan-300">Loading...</div>';
      vault.insertBefore(card,vault.firstChild); var ref=$('vault-coupon-refresh'); if(ref) ref.onclick=showVaultCoupon;
    }
    var out=$('vault-coupon-code'); if(!out)return;
    db.from('hub_access_coupons').select('code,expires_at,created_at,active').eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle().then(function(r){
      if(r&&r.data&&r.data.code) out.innerHTML='<span class="select-all">'+esc(r.data.code)+'</span><div class="mt-1 text-[10px] text-slate-500">Expires: '+esc(new Date(r.data.expires_at).toLocaleString())+'</div>';
      else out.textContent='Abhi koi coupon generate nahi hua / Supabase RLS read policy check required';
    }).catch(function(){ out.textContent='Coupon RLS policy required'; });
  }

  function tick(){
    patchCreateCoupon();
    addManualNotifyButton();
    showVaultCoupon();
  }

  ready(function(){
    setTimeout(removeSplash,300); setTimeout(removeSplash,1800);
    tick(); setInterval(tick,1500);
  });
})();
