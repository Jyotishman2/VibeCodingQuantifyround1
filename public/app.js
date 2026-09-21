const conversation = document.querySelector('#conversation');
const history = document.querySelector('#history');
const form = document.querySelector('#composer');
const promptInput = document.querySelector('#prompt');
const sendButton = document.querySelector('#send');
const status = document.querySelector('#status');
const title = document.querySelector('#conversation-title');
const emptyState = document.querySelector('#empty-state');
let activeConversationId = null;
let selectedTone = 'professional';
let sending = false;

function setStatus(message = '') { status.textContent = message; }
function scrollToLatest() { conversation.scrollTop = conversation.scrollHeight; }
function formatTitle(value) { return value.length > 42 ? `${value.slice(0, 42)}…` : value; }

function addBubble(role, content = '', streaming = false) {
  emptyState?.remove();
  const bubble = document.createElement('article');
  bubble.className = `message ${role}`;
  bubble.innerHTML = `<div class="avatar">${role === 'user' ? 'You' : 'AI'}</div><div class="bubble"><p></p>${streaming ? '<span class="cursor" aria-label="Generating"></span>' : ''}</div>`;
  bubble.querySelector('p').textContent = content;
  conversation.append(bubble);
  scrollToLatest();
  return bubble;
}

function renderMessages(messages) {
  conversation.innerHTML = '';
  if (!messages?.length) {
    conversation.append(emptyState || document.createElement('div'));
    return;
  }
  messages.forEach((message) => addBubble(message.role === 'assistant' ? 'assistant' : 'user', message.content));
}

async function loadHistory() {
  try {
    const response = await fetch('/api/conversations');
    if (!response.ok) throw new Error();
    const items = await response.json();
    history.innerHTML = '';
    items.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `history-item ${item.id === activeConversationId ? 'selected' : ''}`;
      button.dataset.id = item.id;
      button.innerHTML = `<span class="history-dot"></span><span>${formatTitle(item.title)}</span>`;
      button.addEventListener('click', () => openConversation(item.id));
      history.append(button);
    });
  } catch {
    history.innerHTML = '<p class="history-error">History is temporarily unavailable.</p>';
  }
}

async function openConversation(id) {
  if (sending) return;
  try {
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) throw new Error();
    const item = await response.json();
    activeConversationId = item.id;
    title.textContent = formatTitle(item.messages.find((m) => m.role === 'user')?.content || 'Conversation');
    renderMessages(item.messages);
    loadHistory();
  } catch { setStatus('Could not open that conversation.'); }
}

document.querySelectorAll('.tone').forEach((button) => button.addEventListener('click', () => {
  selectedTone = button.dataset.tone;
  document.querySelectorAll('.tone').forEach((item) => item.classList.toggle('active', item === button));
}));

document.querySelector('#new-chat').addEventListener('click', () => {
  if (sending) return;
  activeConversationId = null;
  title.textContent = 'Start a conversation';
  conversation.innerHTML = '<div class="empty-state" id="empty-state"><div class="orb">✦</div><h2>How can I help?</h2><p>Select a tone, then ask anything. Your conversation will be saved here.</p></div>';
  loadHistory();
  promptInput.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt || sending) return;
  sending = true;
  sendButton.disabled = true;
  promptInput.value = '';
  addBubble('user', prompt);
  const assistantBubble = addBubble('assistant', '', true);
  const text = assistantBubble.querySelector('p');
  const cursor = assistantBubble.querySelector('.cursor');
  setStatus('Assistant is responding…');
  try {
    const response = await fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, tone: selectedTone, conversationId: activeConversationId }) });
    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Unable to send message.');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text.textContent += decoder.decode(value, { stream: true });
      scrollToLatest();
    }
    text.textContent += decoder.decode();
    activeConversationId = response.headers.get('X-Conversation-Id') || activeConversationId;
    title.textContent = formatTitle(prompt);
    cursor?.remove();
    await loadHistory();
    setStatus('');
  } catch (error) {
    assistantBubble.remove();
    setStatus(error.message || 'Something went wrong while streaming the reply.');
  } finally {
    sending = false;
    sendButton.disabled = false;
    promptInput.focus();
  }
});

promptInput.addEventListener('input', () => { promptInput.style.height = 'auto'; promptInput.style.height = `${Math.min(promptInput.scrollHeight, 140)}px`; });
loadHistory();
