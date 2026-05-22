const toggleBtn = document.getElementById('chatbotToggleBtn');
const closeBtn = document.getElementById('chatbotCloseBtn');
const panel = document.getElementById('chatbotPanel');
const messagesContainer = document.getElementById('chatbotMessages');
const inputField = document.getElementById('chatbotInput');
const sendBtn = document.getElementById('chatbotSendBtn');

let conversationHistory = [];
let activeRecipeContext = "";

// Initialize history with system prompt (will be updated when recipe loads)
function resetConversation() {
  conversationHistory = [
    {
      role: "user",
      parts: [{ text: `You are a helpful Indian kitchen assistant. The user is currently making: ${activeRecipeContext || 'nothing specific yet'}. Answer their cooking questions practically, keeping an Indian home kitchen in mind. Be concise.` }]
    },
    {
      role: "model",
      parts: [{ text: "Understood. I am ready to help." }]
    }
  ];

  // Reset UI
  messagesContainer.innerHTML = `
    <div class="message assistant">
      <p>Hi! I'm your kitchen assistant. ${activeRecipeContext ? `Ask me anything about making ${activeRecipeContext}!` : 'Ask me anything about cooking!'}</p>
    </div>
  `;
}

// Global hook called from app.js when a new recipe is loaded
window.notifyChatbotNewRecipe = (recipeName) => {
  activeRecipeContext = recipeName;
  resetConversation();
};

// UI Toggles
toggleBtn.addEventListener('click', () => {
  panel.classList.remove('hidden');
  toggleBtn.style.transform = 'scale(0)';
});

closeBtn.addEventListener('click', () => {
  panel.classList.add('hidden');
  toggleBtn.style.transform = 'scale(1)';
});

// Sending Messages
sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const text = inputField.value.trim();
  if (!text) return;

  // 1. Add user message to UI and history
  appendMessage('user', text);
  inputField.value = '';

  conversationHistory.push({
    role: "user",
    parts: [{ text }]
  });

  // 2. Show typing indicator
  const typingId = showTypingIndicator();

  try {
    // 3. Call Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: conversationHistory
      })
    });

    if (!response.ok) throw new Error('Chat API failed');

    const data = await response.json();
    const replyText = data.candidates[0].content.parts[0].text;

    // 4. Remove typing indicator, add assistant message to UI and history
    removeTypingIndicator(typingId);
    appendMessage('assistant', replyText);

    conversationHistory.push({
      role: "model",
      parts: [{ text: replyText }]
    });

  } catch (error) {
    console.error("Chat Error:", error);
    removeTypingIndicator(typingId);
    appendMessage('assistant', "Sorry, I'm having trouble connecting right now. Please try again.");
    // Remove the failed user message from history so it doesn't corrupt context
    conversationHistory.pop();
  }
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  // Basic markdown parsing for bold text
  const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  div.innerHTML = `<p>${formattedText}</p>`;
  messagesContainer.appendChild(div);
  scrollToBottom();
}

function showTypingIndicator() {
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'typing-indicator';
  div.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  messagesContainer.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initial setup
resetConversation();
