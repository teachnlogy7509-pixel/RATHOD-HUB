(()=>{
'use strict';
if(window.__RH_HOME_SEO_REFRESH__) return;
window.__RH_HOME_SEO_REFRESH__ = 1;
const TITLE='RATHOD HUB Learning | MCQ, PYQ, Live Quiz & Smart Support for PW Students';
const DESCRIPTION='RATHOD HUB Learning offers MCQ practice, PYQ revision, live quiz battles, study material, focus tools and smart learning support designed for PW students and dedicated learners.';
const KEYWORDS='RATHOD HUB, RATHOD HUB Learning, PW students, PW aspirants practice, MCQ practice, PYQ revision, live quiz, study material, focus timer, AI learning, Ashish Rathod learning hub, RATHOD HUB live quiz, RATHOD HUB study support, PW batch study support, smart learning support';
const CANONICAL='https://teachnlogy7509-pixel.github.io/RATHOD-HUB/';
function setMeta(attr,key,value){
  let el=document.head.querySelector(`meta[${attr}="${key}"]`);
  if(!el){el=document.createElement('meta');el.setAttribute(attr,key);document.head.appendChild(el);} 
  el.setAttribute('content',value);
}
function setCanonical(href){
  let el=document.head.querySelector('link[rel="canonical"]');
  if(!el){el=document.createElement('link');el.setAttribute('rel','canonical');document.head.appendChild(el);} 
  el.setAttribute('href',href);
}
function setJsonLd(){
  const payload={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'WebSite',
        name:'RATHOD HUB Learning',
        alternateName:['RATHOD HUB','RATHOD HUB Learning Platform'],
        url:CANONICAL,
        description:'RATHOD HUB Learning offers MCQ practice, PYQ revision, live quiz, study material and smart learning support for PW students and focused learners.'
      },
      {
        '@type':'Organization',
        name:'RATHOD HUB Learning',
        url:CANONICAL,
        description:'A learning, practice and quiz support platform for PW students and focused learners.'
      }
    ]
  };
  let script=document.getElementById('rh-home-seo-jsonld');
  if(!script){
    script=document.createElement('script');
    script.type='application/ld+json';
    script.id='rh-home-seo-jsonld';
    document.head.appendChild(script);
  }
  script.textContent=JSON.stringify(payload);
}
function apply(){
  document.title=TITLE;
  setMeta('name','description',DESCRIPTION);
  setMeta('name','keywords',KEYWORDS);
  setMeta('name','robots','index,follow,max-image-preview:large');
  setMeta('property','og:type','website');
  setMeta('property','og:title',TITLE);
  setMeta('property','og:description',DESCRIPTION);
  setMeta('property','og:url',CANONICAL);
  setMeta('property','og:site_name','RATHOD HUB Learning');
  setMeta('name','twitter:card','summary');
  setMeta('name','twitter:title',TITLE);
  setMeta('name','twitter:description','MCQ practice, PYQ revision, live quiz, study tools and smart support for PW students and focused learners.');
  setCanonical(CANONICAL);
  setJsonLd();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
apply();
})();
