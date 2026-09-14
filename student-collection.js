/* Collection removed: cleanup old cached UI only. */
(function(){
  function clean(){
    ['btn-collection','mob-collection','section-collection','collection-mini','rh-student-collection-mini','rh-student-collection-card','student-profile-modal','community-profile-modal'].forEach(function(id){
      var el=document.getElementById(id);
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', clean); else clean();
  setTimeout(clean, 800);
  setTimeout(clean, 2500);
})();
