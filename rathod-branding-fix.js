/* RATHOD HUB • reliable in-app branding + admin logo controls */
(function(){
'use strict';
if(window.__RH_BRANDING_FIX__)return;window.__RH_BRANDING_FIX__=1;
const FALLBACK='icon-192.png';
function safeLogo(){try{return window.siteSettings?.logo_url||FALLBACK}catch(e){return FALLBACK}}
function applyEverywhere(url){url=url||safeLogo();document.querySelectorAll('#hub-logo-img,#auth-logo-img,#admin-logo-preview,.rh-splash-logo-img').forEach(img=>{if(img.dataset.rhLogo!==url){img.dataset.rhLogo=url;img.src=url}img.onerror=()=>{img.onerror=null;img.src=FALLBACK}});let icon=document.querySelector('link[rel="icon"]');if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon)}icon.href=url}
function patchLogoFunction(){if(window.__rhLogoFnPatched||typeof window.applyAppLogoToPage!=='function')return;window.__rhLogoFnPatched=1;const original=window.applyAppLogoToPage;window.applyAppLogoToPage=function(settings){const result=original.apply(this,arguments);applyEverywhere(settings?.logo_url||FALLBACK);return result}}
function improveAdminPanel(){const panel=document.getElementById('admin-logo-panel');if(!panel||document.getElementById('rh-branding-admin-note'))return;const note=document.createElement('div');note.id='rh-branding-admin-note';note.className='mb-4 rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 p-4';note.innerHTML='<div class="text-[9px] font-black tracking-[.2em] text-cyan-300">GLOBAL APP BRANDING</div><b class="mt-1 block text-sm">🎨 Admin-controlled in-app logo</b><p class="mt-1 text-[10px] leading-5 text-slate-400">Upload या Image URL से logo बदलें। Apply Logo के बाद Header, Login, Splash और browser icon सभी users के लिए update होंगे। Android home-screen launcher icon security के कारण APK build में fixed रहता है।</p>';panel.prepend(note)}
function ensureVisibleLogo(){applyEverywhere(safeLogo());const marks=document.querySelectorAll('#hub-logo-mark,.rh-auth-logo-outer,.rh-splash-logo-wrap');marks.forEach(x=>{x.style.visibility='visible';x.style.opacity='1'})}
function run(){try{patchLogoFunction();ensureVisibleLogo();improveAdminPanel()}catch(e){console.warn('Branding fix',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();new MutationObserver(()=>{clearTimeout(window.__rhBrandTimer);window.__rhBrandTimer=setTimeout(run,100)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(run,1800);
})();
