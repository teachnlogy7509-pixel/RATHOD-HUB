/* RATHOD HUB AI Doctor — persistent chat history */
(function () {
  'use strict';
  if (window.__RH_AI_DOCTOR_HISTORY_V1__) return;
  window.__RH_AI_DOCTOR_HISTORY_V1__ = true;

  let aiAgentChatId = null;
  let aiAgentChatTitle = '';
  let aiAgentChatList = [];
  let historyBusy = false;

  function shortTitle(value) {
    const title = String(value || 'New chat').replace(/\s+/g, ' ').trim();
    return title.length > 58 ? title.slice(0, 55) + '…' : (title || 'New chat');
  }

  function historyBox() {
    return document.getElementById('ai-agent-saved-chats');
  }

  function renderAIAgentChatList() {
    const box = historyBox();
    if (!box) return;
    if (!aiAgentChatList.length) {
      box.innerHTML = '<div class="rounded-xl border border-dashed border-white/10 px-3 py-3 text-[10px] text-slate-500">अभी कोई saved chat नहीं है। पहला doubt पूछते ही यहाँ save हो जाएगी।</div>';
      return;
    }
    box.innerHTML = aiAgentChatList.map(function (chat) {
      const active = String(chat.id) === String(aiAgentChatId);
      const modeLabel = chat.mode === 'app' ? '🧭 App Guide' : '🧠 Study Doubt';
      const date = chat.updated_at ? new Date(chat.updated_at).toLocaleDateString([], {day:'2-digit',month:'short'}) : '';
      return '<button type="button" onclick="openAIAgentChat(\'' + String(chat.id) + '\')" class="w-full min-w-0 rounded-xl border px-3 py-2.5 text-left transition ' +
        (active ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-slate-950/45 hover:border-cyan-400/25') + '">' +
        '<span class="flex items-center justify-between gap-2"><b class="min-w-0 truncate text-[11px] text-slate-200">' + esc(chat.title || 'New chat') + '</b>' +
        '<span class="shrink-0 text-[9px] text-slate-500">' + esc(date) + '</span></span>' +
        '<span class="mt-1 block text-[9px] text-slate-500">' + modeLabel + (active ? ' · OPEN' : '') + '</span></button>';
    }).join('');
  }

  async function loadAIAgentChats() {
    const box = historyBox();
    if (!box || !user || !user.id || historyBusy) return;
    historyBusy = true;
    try {
      const result = await db.from('ai_doctor_chats')
        .select('id,title,mode,updated_at')
        .eq('user_id', user.id)
        .order('updated_at', {ascending:false})
        .limit(5);
      if (result.error) throw result.error;
      aiAgentChatList = Array.isArray(result.data) ? result.data : [];
      renderAIAgentChatList();
    } catch (error) {
      console.warn('AI Doctor history load failed:', error && error.message ? error.message : error);
      box.innerHTML = '<div class="rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-3 text-[10px] text-amber-200">Chat history अभी load नहीं हो सकी। Refresh करके फिर कोशिश करें।</div>';
    } finally {
      historyBusy = false;
    }
  }

  async function ensureAIAgentChat(firstMessage, mode) {
    if (aiAgentChatId) return aiAgentChatId;
    if (!user || !user.id) throw new Error('Chat history के लिए पहले login करें।');
    const title = shortTitle(firstMessage);
    const result = await db.from('ai_doctor_chats')
      .insert({user_id:user.id, title:title, mode:mode === 'app' ? 'app' : 'doubt'})
      .select('id,title,mode,updated_at')
      .single();
    if (result.error) throw result.error;
    aiAgentChatId = result.data.id;
    aiAgentChatTitle = result.data.title || title;
    return aiAgentChatId;
  }

  async function saveAIAgentMessage(item) {
    if (!aiAgentChatId || !user || !user.id || !item || !item.text) return;
    const result = await db.from('ai_doctor_messages').insert({
      chat_id: aiAgentChatId,
      user_id: user.id,
      role: item.role === 'user' ? 'user' : 'assistant',
      content: String(item.text).slice(0, 30000),
      mode: item.mode === 'app' ? 'app' : 'doubt',
      has_image: !!item.hasImage
    });
    if (result.error) throw result.error;
    const updated = await db.from('ai_doctor_chats')
      .update({updated_at:new Date().toISOString(), mode:item.mode === 'app' ? 'app' : 'doubt'})
      .eq('id', aiAgentChatId).eq('user_id', user.id);
    if (updated.error) throw updated.error;
  }

  async function openAIAgentChat(id) {
    if (aiAgentBusy) {
      toast('पहले चल रही AI reply पूरी होने दें।', false);
      return;
    }
    if (!user || !user.id) return toast('Chat खोलने के लिए login करें।', false);
    try {
      const chatResult = await db.from('ai_doctor_chats')
        .select('id,title,mode,updated_at')
        .eq('id', id).eq('user_id', user.id).maybeSingle();
      if (chatResult.error) throw chatResult.error;
      if (!chatResult.data) throw new Error('यह chat नहीं मिली।');
      const messagesResult = await db.from('ai_doctor_messages')
        .select('id,role,content,mode,has_image,created_at')
        .eq('chat_id', id).eq('user_id', user.id)
        .order('created_at', {ascending:false}).limit(120);
      if (messagesResult.error) throw messagesResult.error;

      aiAgentChatId = chatResult.data.id;
      aiAgentChatTitle = chatResult.data.title || 'New chat';
      aiAgentHistory = (messagesResult.data || []).reverse().map(function (message) {
        return {
          role: message.role,
          text: String(message.content || '') + (message.has_image ? '\n📷 [इस पुराने message में image attach थी; image file save नहीं की गई थी।]' : ''),
          mode: message.mode || chatResult.data.mode || 'doubt',
          hasImage: !!message.has_image,
          at: new Date(message.created_at).getTime()
        };
      });
      if (typeof setAIAgentMode === 'function') setAIAgentMode(chatResult.data.mode || 'doubt');
      document.getElementById('ai-output')?.classList.remove('hidden');
      renderAIAgentHistory(false);
      renderAIAgentChatList();
      toast('पुरानी chat खुल गई ❤️');
    } catch (error) {
      toast((error && error.message) || 'Chat नहीं खुल सकी।', false);
    }
  }

  function startNewAIAgentChat() {
    if (aiAgentBusy) {
      toast('पहले चल रही AI reply पूरी होने दें।', false);
      return;
    }
    aiAgentChatId = null;
    aiAgentChatTitle = '';
    aiAgentHistory = [];
    if (typeof removeAIAgentImage === 'function') removeAIAgentImage();
    document.getElementById('ai-output')?.classList.remove('hidden');
    renderAIAgentHistory(false);
    renderAIAgentChatList();
    document.getElementById('ai-input')?.focus();
    toast('नई chat शुरू करें — पुरानी chats सुरक्षित हैं।');
  }

  function installHistoryPanel() {
    const welcome = document.getElementById('ai-agent-welcome');
    if (!welcome || document.getElementById('ai-agent-history-panel')) return;
    welcome.insertAdjacentHTML('afterend',
      '<div id="ai-agent-history-panel" class="relative mt-3 rounded-2xl border border-cyan-400/15 bg-slate-950/55 p-3">' +
      '<div class="mb-2 flex items-center justify-between gap-2"><div><b class="text-[11px] text-cyan-200">💬 Recent chats</b><span class="ml-2 text-[9px] text-slate-500">Last 5</span></div>' +
      '<button id="ai-agent-new-chat" type="button" onclick="startNewAIAgentChat()" class="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black text-cyan-200">＋ New chat</button></div>' +
      '<div id="ai-agent-saved-chats" class="grid gap-2 sm:grid-cols-2"></div>' +
      '<p class="mt-2 text-[9px] leading-4 text-slate-500">आपकी chats account में save रहेंगी। पुरानी chats अपने-आप delete नहीं होंगी।</p></div>'
    );
    const clearButton = document.querySelector('#ai-output button[onclick="clearAIAgentChat()"]');
    if (clearButton) {
      clearButton.textContent = '＋ New chat';
      clearButton.setAttribute('onclick', 'startNewAIAgentChat()');
    }
  }

  const originalAskAI = window.askAI;
  if (typeof originalAskAI === 'function' && !window.__RH_AI_DOCTOR_ASK_WRAPPED__) {
    window.__RH_AI_DOCTOR_ASK_WRAPPED__ = true;
    window.askAI = async function () {
      if (aiAgentBusy) return;
      const before = aiAgentHistory.length;
      const pending = originalAskAI.apply(this, arguments);
      const created = aiAgentHistory.slice(before);
      const userItem = created.find(function (item) { return item.role === 'user'; });
      if (userItem && user && user.id) {
        try {
          await ensureAIAgentChat(userItem.text, userItem.mode || aiAgentMode);
          await saveAIAgentMessage(userItem);
        } catch (error) {
          console.warn('AI Doctor user message was not saved:', error && error.message ? error.message : error);
          toast('AI reply चलेगी, लेकिन यह message history में save नहीं हो सकी।', false);
        }
      }
      await pending;
      const completed = aiAgentHistory.slice(before).filter(function (item) {
        return item.role === 'assistant' && !item.streaming && item.text;
      });
      for (const item of completed) {
        try { await saveAIAgentMessage(item); }
        catch (error) {
          console.warn('AI Doctor answer was not saved:', error && error.message ? error.message : error);
          toast('AI reply आई, लेकिन history save नहीं हो सकी।', false);
        }
      }
      if (userItem) await loadAIAgentChats();
    };
  }

  const originalSwitchTab = window.switchTab;
  if (typeof originalSwitchTab === 'function' && !window.__RH_AI_DOCTOR_TAB_WRAPPED__) {
    window.__RH_AI_DOCTOR_TAB_WRAPPED__ = true;
    window.switchTab = function (tab) {
      const result = originalSwitchTab.apply(this, arguments);
      if (tab === 'ai') setTimeout(function () { installHistoryPanel(); loadAIAgentChats(); }, 0);
      return result;
    };
  }

  window.startNewAIAgentChat = startNewAIAgentChat;
  window.openAIAgentChat = openAIAgentChat;
  window.loadAIAgentChats = loadAIAgentChats;
  window.clearAIAgentChat = startNewAIAgentChat;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      installHistoryPanel();
      if (document.getElementById('section-ai') && !document.getElementById('section-ai').classList.contains('hidden')) loadAIAgentChats();
    }, {once:true});
  } else {
    installHistoryPanel();
  }
})();