/* RATHOD HUB web AdSense verification loader. */
(()=>{
'use strict';
if(window.__RH_ADSENSE_VERIFY__)return;
window.__RH_ADSENSE_VERIFY__=1;
const client='ca-pub-7515533774374052';
function load(){
  if(document.querySelector('script[data-rh-adsense="1"]'))return;
  const s=document.createElement('script');
  s.async=true;
  s.dataset.rhAdsense='1';
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+client;
  s.crossOrigin='anonymous';
  (document.head||document.documentElement).appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
