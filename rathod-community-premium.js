/* RATHOD HUB • PW-style Community comments + resilient Stories uploads
   Additive UI layer. Keeps existing posts, reactions, feed tabs and story table. */
(function(){
'use strict';
if(window.__RH_COMMUNITY_PREMIUM_V1__)return;
window.__RH_COMMUNITY_PREMIUM_V1__=true;

var activePostId=null;
var replyTarget=null;
var editingComment=null;
var openCommentMenu=null;
var openPostMenu=null;
var commentDraft='';
var selectedCommentFile=null;
var collapsedReplies=new Set();

function el(id){return document.getElementById(id)}
function txt(value){return typeof window.esc==='function'?window.esc(value):String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function safe(value){return typeof window.safeUrl==='function'?window.safeUrl(value):txt(value)}
function getPost(id){try{return posts.find(function(p){return String(p.id)===String(id)})||null}catch(e){return null}}
function getComment(post,id){
 var items=Array.isArray(post&&post.comments)?post.comments:[];
 for(var i=0;i<items.length;i++){
  var c=items[i];
  if(String(c.comment_id)===String(id))return {comment:c,rootId:String(c.comment_id)};
  var replies=Array.isArray(c.replies)?c.replies:[];
  for(var j=0;j<replies.length;j++)if(String(replies[j].comment_id)===String(id))return {comment:replies[j],rootId:String(c.comment_id)};
 }
 return null;
}
function countComments(items){
 return (Array.isArray(items)?items:[]).reduce(function(n,c){return n+1+(Array.isArray(c.replies)?c.replies.length:0)},0);
}
function applyPost(raw){
 var row=Array.isArray(raw)?raw[0]:raw;
 if(!row||!row.id)return;
 var i=posts.findIndex(function(p){return String(p.id)===String(row.id)});
 if(i>=0)posts[i]=Object.assign({},posts[i],row);else posts.unshift(row);
 if(typeof window.renderPosts==='function')window.renderPosts();
}
function communityTime(value){
 if(typeof window.communityTime==='function')return window.communityTime(value);
 var d=new Date(value);return isNaN(d.getTime())?'':d.toLocaleString();
}
function uploadPath(file){
 var ext=(String(file.name||'file').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
 var salt=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
 return String(user.id)+'/'+salt+'.'+ext;
}
async function uploadCommunityImage(file){
 if(!file)return null;
 if(!/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type||''))throw new Error('Comment attachment must be JPG, PNG, WebP, GIF or AVIF.');
 if(file.size>15*1024*1024)throw new Error('Comment image must be 15 MB or smaller.');
 var path=uploadPath(file);
 var result=await db.storage.from('rathod-community-media').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
 if(result.error)throw new Error(result.error.message||'Image upload failed.');
 return db.storage.from('rathod-community-media').getPublicUrl(path).data.publicUrl;
}
function commentNode(comment,postId,rootId,isReply){
 var id=String(comment.comment_id||comment.date||'legacy');
 var owner=String(comment.user_id||'')===String(user&&user.id);
 var admin=!!(profile&&profile.role==='admin');
 var canManage=owner||admin;
 var likes=Array.isArray(comment.likes)?comment.likes.map(String):[];
 var liked=likes.includes(String(user&&user.id));
 var replies=!isReply&&Array.isArray(comment.replies)?comment.replies:[];
 var editing=editingComment&&editingComment.postId===String(postId)&&editingComment.commentId===id;
 var menu=openCommentMenu===id;
 var body=editing
  ? '<div class="mt-2 space-y-2"><textarea id="rh-premium-comment-edit" rows="3" maxlength="1000" class="w-full rounded-xl border border-indigo-400/30 bg-slate-950 px-3 py-2 text-sm text-white">'+txt(editingComment.text)+'</textarea><div class="flex gap-2"><button onclick="rhSaveCommunityCommentEdit()" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold">Save edit</button><button onclick="rhCancelCommunityCommentEdit()" class="rounded-lg bg-slate-800 px-3 py-1.5 text-xs">Cancel</button></div></div>'
  : '<p class="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">'+txt(comment.text||'')+'</p>';
 var image=comment.image_url?'<a href="'+safe(comment.image_url)+'" target="_blank" rel="noopener" class="mt-2 block"><img src="'+safe(comment.image_url)+'" class="max-h-48 rounded-xl border border-slate-700 object-contain" loading="lazy"></a>':'';
 var replyHtml='';
 if(replies.length&&!collapsedReplies.has(id)){
  replyHtml='<div class="ml-5 mt-3 space-y-3 border-l border-slate-800 pl-3">'+replies.map(function(r){return commentNode(r,postId,id,true)}).join('')+'</div>';
 }
 var options=canManage
  ? '<div class="relative shrink-0"><button onclick="rhToggleCommunityCommentMenu(\''+txt(id)+'\')" class="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-800" aria-label="Comment options"><i class="fa-solid fa-ellipsis"></i></button>'+
    (menu?'<div class="absolute right-0 top-8 z-30 min-w-28 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl"><button onclick="rhStartCommunityCommentEdit(\''+txt(postId)+'\',\''+txt(id)+'\')" class="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-800">✏️ Edit</button><button onclick="rhDeleteCommunityComment(\''+txt(postId)+'\',\''+txt(id)+'\')" class="block w-full rounded-lg px-3 py-2 text-left text-xs text-rose-300 hover:bg-slate-800">🗑 Delete</button></div>':'')+'</div>'
  : '';
 var replyButton='<button onclick="rhSetCommunityReplyTarget(\''+txt(postId)+'\',\''+txt(rootId||id)+'\')" class="text-slate-400 hover:text-white"><i class="fa-solid fa-reply mr-1"></i>Reply</button>';
 var repliesButton=replies.length?'<button onclick="rhToggleCommunityReplies(\''+txt(id)+'\')" class="text-indigo-300">'+(collapsedReplies.has(id)?'Show':'Hide')+' '+replies.length+' '+(replies.length===1?'reply':'replies')+'</button>':'';
 return '<div class="flex gap-2.5 '+(isReply?'py-1':'py-2')+'" data-rh-comment="'+txt(id)+'">'+
  '<div class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-700 bg-slate-800 text-sm font-black text-indigo-200">'+txt(String(comment.author||'M').trim().charAt(0).toUpperCase()||'M')+'</div>'+
  '<div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><b class="text-xs text-indigo-200">'+txt(comment.author||'Member')+'</b><span class="ml-2 text-[10px] text-slate-500">'+communityTime(comment.date)+(comment.edited_at?' · edited':'')+'</span></div>'+options+'</div>'+
  body+image+
  '<div class="mt-2 flex flex-wrap items-center gap-3 text-[11px]"><button onclick="rhToggleCommunityCommentLike(\''+txt(postId)+'\',\''+txt(id)+'\')" class="'+(liked?'text-indigo-300':'text-slate-500')+' hover:text-indigo-200"><i class="fa-solid fa-thumbs-up mr-1"></i>'+likes.length+' Like</button>'+replyButton+repliesButton+'</div>'+
  replyHtml+'</div></div>';
}
function ensureDrawer(){
 var host=el('rh-community-comment-drawer');
 if(!host){
  host=document.createElement('div');host.id='rh-community-comment-drawer';
  var section=el('section-community');if(section)section.appendChild(host);
 }
 return host;
}
function renderDrawer(){
 var host=ensureDrawer(),post=getPost(activePostId);
 if(!host)return;
 if(!post){host.innerHTML='';return}
 var comments=Array.isArray(post.comments)?post.comments:[];
 var preview='<div class="border-b border-slate-800 px-4 py-3"><div class="flex items-center gap-2"><div class="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs">📝</div><div class="min-w-0"><b class="block truncate text-xs text-white">'+txt(post.author||'Member')+'</b><p class="mt-0.5 line-clamp-2 text-xs text-slate-400">'+txt(post.title||post.desc||'Community post')+'</p></div></div></div>';
 var rows=comments.length?comments.map(function(c){return commentNode(c,String(post.id),String(c.comment_id||''),false)}).join(''):'<div class="py-12 text-center text-sm text-slate-500"><div class="mb-2 text-3xl">💬</div>No comments yet. Start the discussion.</div>';
 var replyInfo=replyTarget?'<div class="mb-2 flex items-center justify-between rounded-lg bg-indigo-500/10 px-3 py-2 text-[11px] text-indigo-200">Replying to '+txt(replyTarget.author||'comment')+'<button onclick="rhCancelCommunityReply()" class="font-bold">Cancel ×</button></div>':'';
 host.innerHTML='<div class="fixed inset-0 z-[1300] flex justify-end bg-black/65 backdrop-blur-[2px]" onclick="rhCloseCommunityComments()">'+
  '<aside class="flex h-full w-full max-w-[470px] flex-col border-l border-slate-700 bg-[#0b1220] shadow-2xl" onclick="event.stopPropagation()">'+
   '<header class="flex items-center justify-between border-b border-slate-800 px-4 py-4"><div><div class="text-[9px] font-black uppercase tracking-[.2em] text-indigo-300">Community discussion</div><h3 class="mt-1 text-lg font-black text-white">Comments ('+countComments(comments)+')</h3></div><button onclick="rhCloseCommunityComments()" class="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700" aria-label="Close comments"><i class="fa-solid fa-xmark"></i></button></header>'+
   preview+
   '<div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3" id="rh-community-comment-list">'+rows+'</div>'+
   '<form class="border-t border-slate-800 bg-slate-950/90 p-3" onsubmit="event.preventDefault();rhSendCommunityComment(\''+txt(post.id)+'\')">'+replyInfo+
    '<textarea id="rh-community-comment-input" rows="2" maxlength="1000" oninput="rhUpdateCommunityDraft(this.value)" placeholder="'+(replyTarget?'Write a reply…':'Write a comment…')+'" class="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"></textarea>'+
    '<div class="mt-2 flex items-center justify-between gap-2"><label class="flex cursor-pointer items-center gap-2 text-xs text-slate-400 hover:text-white"><i class="fa-regular fa-image text-lg"></i> Attach image<input id="rh-community-comment-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="hidden" onchange="rhSetCommunityCommentFile(this)"></label><span id="rh-community-comment-file-name" class="min-w-0 flex-1 truncate text-[10px] text-slate-500">'+txt(selectedCommentFile?selectedCommentFile.name:'')+'</span><button class="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-black text-white"><i class="fa-solid fa-paper-plane mr-1"></i>'+(replyTarget?'Reply':'Comment')+'</button></div>'+
   '</form></aside></div>';
 var input=el('rh-community-comment-input');if(input&&commentDraft)input.value=commentDraft;
 var list=el('rh-community-comment-list');if(list)list.scrollTop=list.scrollHeight;
}
function openComments(id){activePostId=String(id);replyTarget=null;editingComment=null;commentDraft='';selectedCommentFile=null;window.rhCommunitySelectedCommentFile=null;openCommentMenu=null;renderDrawer()}
function closeComments(){activePostId=null;replyTarget=null;editingComment=null;commentDraft='';selectedCommentFile=null;window.rhCommunitySelectedCommentFile=null;openCommentMenu=null;var host=el('rh-community-comment-drawer');if(host)host.innerHTML=''}
function postMenuToggle(id){openPostMenu=openPostMenu===String(id)?null:String(id);window.renderPosts()}
function commentMenuToggle(id){openCommentMenu=openCommentMenu===String(id)?null:String(id);renderDrawer()}
function replySet(postId,rootCommentId){var found=getComment(getPost(postId),rootCommentId);replyTarget={commentId:String(rootCommentId),author:found&&found.comment?found.comment.author:'comment'};editingComment=null;renderDrawer();el('rh-community-comment-input')&&el('rh-community-comment-input').focus()}
function replyCancel(){replyTarget=null;renderDrawer()}
function editStart(postId,commentId){var found=getComment(getPost(postId),commentId);if(!found)return;editingComment={postId:String(postId),commentId:String(commentId),text:String(found.comment.text||'')};openCommentMenu=null;renderDrawer();el('rh-premium-comment-edit')&&el('rh-premium-comment-edit').focus()}
function editCancel(){editingComment=null;renderDrawer()}
function applyPost(raw){var row=Array.isArray(raw)?raw[0]:raw;if(!row||!row.id)return;var i=posts.findIndex(function(p){return String(p.id)===String(row.id)});if(i>=0)posts[i]=Object.assign({},posts[i],row);else posts.unshift(row);window.renderPosts()}
async function sendComment(postId){
 var input=el('rh-community-comment-input'),text=input?input.value.trim():'',file=window.rhCommunitySelectedCommentFile||selectedCommentFile;
 if(!text&&!file)return;
 if(!user)return toast('Please login to comment.',false);
 var post=getPost(postId);if(!post)return toast('Post not found.',false);
 try{
  var imageUrl=null;
  if(file){
   if(!/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type||''))throw new Error('Choose a JPG, PNG, WebP, GIF or AVIF image.');
   if(file.size>15*1024*1024)throw new Error('Comment image must be 15 MB or smaller.');
   var path=uploadPath(file);
   var uploaded=await db.storage.from('rathod-community-media').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
   if(uploaded.error)throw new Error(uploaded.error.message||'Image upload failed.');
   imageUrl=db.storage.from('rathod-community-media').getPublicUrl(path).data.publicUrl;
  }
  var rpc=replyTarget?'reply_community_post_comment':'add_community_post_comment';
  var args=replyTarget
   ? {p_post_id:Number(post.id),p_parent_comment_id:replyTarget.commentId,p_text:text,p_image_url:imageUrl}
   : {p_post_id:Number(post.id),p_text:text,p_image_url:imageUrl};
  var result=await db.rpc(rpc,args);if(result.error)throw result.error;
  commentDraft='';selectedCommentFile=null;window.rhCommunitySelectedCommentFile=null;replyTarget=null;applyPost(result.data);
  if(String(post.author_id)!==String(user.id))await sendPersonalHubNotification(post.author_id,(profile&&profile.name||'Someone')+' commented on your post',text||'Shared an image','community','community',{post_id:post.id,actor_id:user.id});
  toast('Comment posted ✓');
 }catch(e){console.error(e);toast(e.message||'Comment could not be sent.',false)}
}
async function editSave(){
 if(!editingComment)return;var input=el('rh-premium-comment-edit'),text=input?input.value.trim():'';
 if(!text)return toast('Comment cannot be empty.',false);
 try{
  var result=await db.rpc('edit_community_post_comment',{p_post_id:Number(editingComment.postId),p_comment_id:editingComment.commentId,p_text:text});
  if(result.error)throw result.error;editingComment=null;applyPost(result.data);renderDrawer();toast('Comment updated ✓');
 }catch(e){toast(e.message||'Comment update failed.',false)}
}
async function commentDelete(postId,commentId){
 if(!confirm('Delete this comment?'))return;
 try{
  var result=await db.rpc('delete_community_post_comment',{p_post_id:Number(postId),p_comment_id:String(commentId)});
  if(result.error)throw result.error;openCommentMenu=null;editingComment=null;applyPost(result.data);renderDrawer();toast('Comment deleted ✓');
 }catch(e){toast(e.message||'Could not delete comment.',false)}
}
async function commentLike(postId,commentId){
 try{var result=await db.rpc('toggle_community_comment_like',{p_post_id:Number(postId),p_comment_id:String(commentId)});if(result.error)throw result.error;applyPost(result.data)}
 catch(e){toast(e.message||'Like could not be updated.',false)}
}
function commentRepliesToggle(id){collapsedReplies.has(String(id))?collapsedReplies.delete(String(id)):collapsedReplies.add(String(id));renderDrawer()}
function postEdit(id){
 var post=getPost(id);if(!post)return;
 var title=prompt('Edit post title',post.title||'');if(title===null)return;
 var desc=prompt('Edit post content',post.desc||'');if(desc===null)return;
 db.from('posts').update({title:title.trim(),desc:desc.trim()}).eq('id',id).eq('author_id',user.id).then(function(r){
  if(r.error)return toast(r.error.message||'Post update failed.',false);
  post.title=title.trim();post.desc=desc.trim();openPostMenu=null;window.renderPosts();toast('Post updated ✓')
 }).catch(function(e){toast(e.message||'Post update failed.',false)});
}
function newRenderPosts(){
 if(communityFeedMode==='people')return;
 var visible=communityFeedMode==='mine'?posts.filter(function(p){return String(p.author_id)===String(user&&user.id)}):posts;
 var count=el('post-count');if(count)count.textContent=visible.length+' posts';
 var box=el('posts-box');if(!box)return;
 box.innerHTML=visible.length?visible.map(function(p){
  var state=communityReactionState(p.likes),comments=Array.isArray(p.comments)?p.comments:[],council=communityCouncilMap.get(String(p.author_id));
  var total=countComments(comments);
  var summary=[...COMMUNITY_REACTIONS,...COUNCIL_REACTIONS].filter(function(x){return state.counts[x]}).map(function(x){return '<span class="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[11px]">'+x+' '+state.counts[x]+'</span>'}).join('');
  var picker=communityReactionPickers.has(String(p.id))?'<div class="flex items-center gap-2 border-t border-slate-800 px-4 py-3">'+availableCommunityReactions().map(function(x){return '<button onclick="toggleReaction(\''+p.id+'\',\''+x+'\')" class="grid h-10 w-10 place-items-center rounded-full border '+(state.mine===x?'border-indigo-400 bg-indigo-500/30':'border-slate-700 bg-slate-800 hover:bg-slate-700')+' text-xl">'+x+'</button>'}).join('')+'</div>':'';
  var own=String(p.author_id)===String(user&&user.id),canDelete=own||(profile&&profile.role==='admin'),menu=openPostMenu===String(p.id);
  var menuHtml=canDelete?'<div class="relative shrink-0"><button onclick="rhCommunityPostMenuToggle(\''+p.id+'\')" class="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-800" title="Post options"><i class="fa-solid fa-ellipsis-vertical"></i></button>'+(menu?'<div class="absolute right-0 top-9 z-20 min-w-32 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl">'+(own?'<button onclick="rhEditCommunityPost(\''+p.id+'\')" class="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-800">✏️ Edit post</button>':'')+'<button onclick="deletePost(\''+p.id+'\')" class="block w-full rounded-lg px-3 py-2 text-left text-xs text-rose-300 hover:bg-slate-800">🗑 Delete post</button></div>':'')+'</div>':'';
  return '<article id="community-post-'+p.id+'" class="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/95 shadow-xl"><div class="p-4">'+
   '<div class="flex items-start justify-between gap-3"><div class="flex min-w-0 gap-3"><div class="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 bg-slate-800" style="border-color:'+(council&&council.name_color||'#334155')+'">'+(p.pfp_url?'<img src="'+safe(p.pfp_url)+'" class="h-full w-full object-cover">':'<div class="grid h-full place-items-center">👤</div>')+'</div><div class="min-w-0"><b class="block truncate text-sm" style="color:'+(council&&council.name_color||'#fff')+'">'+(council?leagueRoleIcon(council.council_role)+' ':'')+txt(p.author||'Member')+(council?' <span class="text-sky-400">✓</span>':'')+'</b><span class="text-[10px] text-slate-500">'+(council?txt(council.badge)+' • ':'')+communityTime(p.created_at)+'</span></div></div>'+menuHtml+'</div>'+
   (p.title?'<h4 class="mt-4 font-black text-white">'+txt(p.title)+'</h4>':'')+'<p class="mt-2 whitespace-pre-wrap text-sm text-slate-300">'+txt(p.desc||'')+'</p>'+
   (p.file_url?(p.file_type&&p.file_type.startsWith('image/')?'<img onclick="window.open(\''+safe(p.file_url)+'\',\'_blank\')" src="'+safe(drivePreviewUrl(p.file_url))+'" onerror="this.onerror=null;this.src=\''+safe(p.file_url)+'\'" class="mt-3 max-h-[420px] w-full cursor-pointer rounded-xl bg-black object-contain" loading="lazy">':'<a target="_blank" href="'+safe(p.file_url)+'" class="mt-3 block rounded-xl bg-slate-800 p-3 text-sm">📎 '+txt(p.file_name||'Attached file')+'</a>'):'')+
   (p.voice_url?'<audio controls src="'+safe(p.voice_url)+'" class="mt-3 w-full"></audio>':'')+
   '<div class="mt-4 flex min-h-7 items-center justify-between gap-3"><div class="flex flex-wrap gap-1">'+summary+'</div><button onclick="toggleCommunityComments(\''+p.id+'\')" class="text-[11px] text-slate-400 hover:text-indigo-300">'+total+' comments</button></div></div>'+
   '<div class="grid grid-cols-3 border-t border-slate-800"><button onclick="toggleCommunityReactions(\''+p.id+'\')" class="py-3 text-xs font-bold '+(state.mine?'text-indigo-300':'text-slate-400')+' hover:bg-slate-900"><i class="fa-regular fa-face-smile mr-2"></i>React</button><button onclick="toggleCommunityComments(\''+p.id+'\')" class="py-3 text-xs font-bold text-slate-400 hover:bg-slate-900"><i class="fa-regular fa-comment mr-2"></i>Comment</button><button onclick="shareCommunityPost(\''+p.id+'\')" class="py-3 text-xs font-bold text-slate-400 hover:bg-slate-900"><i class="fa-regular fa-paper-plane mr-2"></i>Share</button></div>'+picker+'</article>';
 }).join(''):'<div class="rounded-2xl border border-slate-800 bg-slate-950/90 py-12 text-center text-slate-500">No posts yet.</div>';
 if(activePostId!==null)renderDrawer();
}
function communityMenuBind(){window.renderPosts=newRenderPosts;window.toggleCommunityComments=openComments;window.closeCommunityComments=closeComments;
 window.toggleCommunityPostMenu=postMenuToggle;window.toggleCommunityCommentMenu=commentMenuToggle;
 window.setCommunityReplyTarget=replySet;window.cancelCommunityReply=replyCancel;
 window.startCommunityCommentEdit=editStart;window.cancelCommunityCommentEdit=editCancel;
 window.saveCommunityCommentEdit=editSave;window.deleteCommunityComment=commentDelete;
 window.toggleCommunityCommentLike=commentLike;window.toggleCommunityReplies=commentRepliesToggle;
 window.sendCommunityComment=sendComment;window.addComment=function(id){return sendComment(id)};
 window.editCommunityPost=postEdit;
 // Also keep a short compatibility set for this add-on's own inline callbacks.
 window.rhCloseCommunityComments=closeComments;window.rhCommunityPostMenuToggle=postMenuToggle;
 window.rhToggleCommunityCommentMenu=commentMenuToggle;window.rhSetCommunityReplyTarget=replySet;
 window.rhCancelCommunityReply=replyCancel;window.rhStartCommunityCommentEdit=editStart;
 window.rhCancelCommunityCommentEdit=editCancel;window.rhSaveCommunityCommentEdit=editSave;
 window.rhDeleteCommunityComment=commentDelete;window.rhToggleCommunityCommentLike=commentLike;
 window.rhToggleCommunityReplies=commentRepliesToggle;window.rhSendCommunityComment=sendComment;
 window.rhEditCommunityPost=postEdit;
 window.rhSetCommunityCommentFile=function(input){selectedCommentFile=input&&input.files&&input.files[0]||null;window.rhCommunitySelectedCommentFile=selectedCommentFile;var label=el('rh-community-comment-file-name');if(label)label.textContent=selectedCommentFile?selectedCommentFile.name:''};
 window.rhUpdateCommunityDraft=function(value){commentDraft=String(value||'')};
}
communityMenuBind();

/* Dedicated Supabase Storage uploader for Stories: Google Drive OAuth is kept
   for other existing modules, but no longer gates Story uploads. */
document.addEventListener('submit',function(event){
 if(!event.target||event.target.id!=='story-form')return;
 event.preventDefault();event.stopImmediatePropagation();
 var form=event.target,file=el('story-file')&&el('story-file').files[0],button=form.querySelector('button');
 if(!file)return toast('पहले photo या video चुनें.',false);
 if(!user)return toast('पहले login करें.',false);
 button.disabled=true;button.innerHTML='<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Saving story...';
 var path=null;
 (async function(){
  try{
   var mime=file.type||'';
   if(!/^(image|video)\//i.test(mime))throw new Error('केवल image/video story allowed.');
   if(file.size>80*1024*1024)throw new Error('Story maximum 80 MB रखें.');
   path=uploadPath(file);
   var result=await db.storage.from('rathod-stories').upload(path,file,{cacheControl:'3600',upsert:false,contentType:mime});
   if(result.error)throw new Error(result.error.message||'Story upload failed.');
   var url=db.storage.from('rathod-stories').getPublicUrl(path).data.publicUrl;
   var saved=await db.from('stories').insert({user_id:user.id,name:profile&&profile.name||user.email,media_url:url,media_type:mime,caption:(el('story-text')&&el('story-text').value||'').trim(),expires_at:new Date(Date.now()+86400000).toISOString()});
   if(saved.error)throw saved.error;
   form.reset();if(el('story-selected-file'))el('story-selected-file').classList.add('hidden');
   toast('Story live है—24 घंटे बाद expire होगी');await loadStories();
  }catch(error){
   if(path){try{await db.storage.from('rathod-stories').remove([path])}catch(cleanupError){console.warn('Story cleanup failed',cleanupError)}}
   console.error('Story upload failed:',error);toast(error.message||'Story failed',false);
  }finally{button.disabled=false;button.innerHTML='<i class="fa-solid fa-paper-plane mr-2"></i>Share Story'}
 })();
},true);

/* Render Storage-hosted videos as direct media; old Google Drive stories keep
   their existing streaming/preview path. */
window.renderStoryViewer=function(){
 cancelAnimationFrame(storyProgressFrame);
 var group=storyGroups[storyGroupIndex],item=group&&group.items&&group.items[storyItemIndex];
 if(!item)return closeStoryViewer();
 markStoryViewed(item.id);el('story-viewer')&&el('story-viewer').classList.remove('hidden');document.body.style.overflow='hidden';
 el('story-progress').innerHTML=group.items.map(function(_,i){return '<div class="h-1 flex-1 rounded-full bg-white/25 overflow-hidden"><div data-story-progress="'+i+'" class="h-full bg-white" style="width:'+(i<storyItemIndex?100:0)+'%"></div></div>'}).join('');
 el('story-viewer-header').innerHTML='<div class="flex items-center gap-2 text-left"><div class="h-9 w-9 overflow-hidden rounded-full border border-white/60 bg-slate-800">'+(group.pfp?driveImgHtml(group.pfp,'w-full h-full object-cover'):'<div class="grid h-full place-items-center">👤</div>')+'</div><div><b class="text-xs text-white drop-shadow">'+txt(group.name)+'</b><span class="block text-[9px] text-white/70">'+storyAgo(item.created_at)+' • '+(storyItemIndex+1)+'/'+group.items.length+'</span></div></div>';
 el('story-viewer-caption').innerHTML=item.caption?'<div class="inline-block max-w-full rounded-2xl bg-black/45 px-4 py-3 text-left text-sm text-white shadow-xl backdrop-blur-md">'+txt(item.caption)+'</div>':'';
 var content=el('story-viewer-content');
 if(item.media_type&&item.media_type.indexOf('video/')===0){
  content.innerHTML='<video id="active-story-video" autoplay playsinline controls class="h-full w-full bg-black object-contain"></video><div id="story-video-loader" class="absolute inset-0 grid place-items-center bg-black/80 text-center"><div><i class="fa-solid fa-circle-notch fa-spin text-2xl text-pink-400"></i><p class="mt-2 text-xs text-slate-400">Video loading…</p></div></div><div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50"></div>';
  var video=el('active-story-video');
  if(extractDriveFileId(item.media_url))prepareStoryVideo(video,item);
  else{
   video.src=item.media_url;
   video.onloadedmetadata=function(){el('story-video-loader')&&el('story-video-loader').remove();var ms=Number.isFinite(video.duration)&&video.duration>0?video.duration*1000:15000;startStoryProgress(ms);video.play().catch(function(){})};
   video.onended=storyNext;
   video.onerror=function(){el('story-video-loader')&&el('story-video-loader').remove();toast('Video story could not be played. Check its format.',false)};
   video.load();
  }
 }else{
  content.innerHTML='<img class="h-full w-full bg-black object-contain" src="'+safe(item.media_url)+'"><div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50"></div>';
  startStoryProgress(6000);
 }
 renderStories();
};
if(activePostId!==null)renderDrawer();
console.info('RATHOD Community premium interactions + Storage Stories ready.');
})();