/* Keep VIP Song Library inside the real content column on desktop. */
(()=>{
'use strict';
function normalizeApiUrl(){
  try{
    let value=String(localStorage.getItem('rh_song_api_url')||'').trim();
    if(value&&!/^https?:\\/\\//i.test(value)){
      value='https://'+value;
      localStorage.setItem('rh_song_api_url',value);
    }
    const input=document.querySelector('[data-rh-song-api]');
    if(input&&value)input.value=value;
  }catch(_e){}
}
function fix(){
  normalizeApiUrl();
  const section=document.getElementById('section-songlibrary');
  const content=document.querySelector('main .rh-content,.rh-content');
  if(section&&content&&section.parentElement!==content)content.appendChild(section);
  if(section){
    section.style.width='100%';
    section.style.maxWidth='100%';
    section.style.minWidth='0';
    section.style.flex='0 0 100%';
    section.style.boxSizing='border-box';
    section.style.overflow='visible';
    section.querySelectorAll('.truncate').forEach(el=>{
      el.classList.remove('truncate');
      el.style.whiteSpace='normal';
      el.style.overflow='visible';
      el.style.textOverflow='clip';
      el.style.overflowWrap='anywhere';
      el.style.wordBreak='break-word';
    });
    section.querySelectorAll('article').forEach(el=>{
      el.style.minWidth='0';
      el.style.maxWidth='100%';
      el.style.overflow='visible';
      el.style.boxSizing='border-box';
    });
    section.querySelectorAll('audio').forEach(el=>{
      el.style.display='block';
      el.style.width='100%';
      el.style.maxWidth='100%';
    });
  }
  const card=document.getElementById('rh-song-library-card');
  if(card){
    card.style.width='100%';
    card.style.maxWidth='100%';
    card.style.minWidth='0';
    card.style.boxSizing='border-box';
    card.style.overflow='visible';
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix,{once:true});else fix();
new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
setInterval(fix,1000);
})();
