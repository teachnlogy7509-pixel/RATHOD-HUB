/* Collection addon disabled to restore RATHOD NEW and app performance. */
(function(){
  try{
    ['btn-collection','mob-collection','section-collection','collection-mini','rh-student-collection-mini','rh-student-collection-card','student-profile-modal'].forEach(function(id){
      var el=document.getElementById(id);
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
  }catch(e){}
})();
