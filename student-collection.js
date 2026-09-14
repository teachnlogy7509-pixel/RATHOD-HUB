/* Collection removed: force cleanup old cached UI only. */
(function(){
  function clean(){
    var ids=['btn-collection','mob-collection','section-collection','collection-mini','rh-student-collection-mini','rh-student-collection-card','student-profile-modal','community-profile-modal'];
    ids.forEach(function(id){var el=document.getElementById(id); if(el&&el.parentNode) el.parentNode.removeChild(el);});
    document.querySelectorAll('[id*="collection"],[class*="collection"]').forEach(function(el){
      var t=((el.id||'')+' '+(el.className||'')).toLowerCase();
      if(t.indexOf('collection')>-1) el.remove();
    });
    document.querySelectorAll('button,div,a').forEach(function(el){
      var txt=(el.textContent||'').trim().toLowerCase();
      if(txt==='collection' || txt.indexOf('student collection')>-1) el.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', clean); else clean();
  setTimeout(clean,300); setTimeout(clean,1000); setTimeout(clean,2500); setInterval(clean,1500);
})();
