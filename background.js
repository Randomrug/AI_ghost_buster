// Store conversation history and settings
let conversationHistory = {};
let distractionCount = {};
let lastActivityTime = {};

// Initialize settings
chrome.storage.sync.get(
  ['isMuted', 'currentMode', 'musicEnabled', 'userName'],
  (result) => {
    chrome.storage.sync.set({
      isMuted: result.isMuted !== undefined ? result.isMuted : false,
      currentMode: result.currentMode || 'study',
      musicEnabled: result.musicEnabled !== undefined ? result.musicEnabled : true,
      userName: result.userName || 'friend'
    });
  }
);

// Improved content detection using AI
async function analyzeContent(query, mode) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-small",
        messages: [{
          role: "user",
          content: mode === 'study' 
            ? `Analyze if this is study-related (respond only with "study" or "entertainment"): ${query}`
            : `Analyze the emotional tone of this (respond with one word: happy, sad, stressed, angry): ${query}`
        }],
        temperature: 0.3
      })
    });
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.toLowerCase().trim();
  } catch (error) {
    console.error("Analysis error:", error);
    return mode === 'study' ? 'study' : 'neutral';
  }
}

// Main message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ask-ai") {
    const { query, tabId } = message;
    
    if (!conversationHistory[tabId]) {
      conversationHistory[tabId] = [];
      distractionCount[tabId] = 0;
      lastActivityTime[tabId] = Date.now();
    }

    chrome.storage.sync.get(['currentMode', 'userName'], async (result) => {
      const mode = result.currentMode || 'study';
      const userName = result.userName || 'friend';
      const context = conversationHistory[tabId].slice(-4);
      
      const analysis = await analyzeContent(query, mode);
      const isStudyRelated = mode === 'study' ? analysis === 'study' : true;
      
      if (mode === 'study' && !isStudyRelated) {
        distractionCount[tabId]++;
      }

      // NEW & IMPROVED PROMPTS (SHORT/FUNNY)
      const systemPrompt = mode === 'study'
        ? `You're Boo, a sassy ghost study buddy. Respond to "${query}" in MAX 2 lines. If they ask anthing related to studies , respond sincerly ( more than 2 lines if needed). 
           ${isStudyRelated 
             ? `👻 [Ghost pun] + [Encouragement] (Example: "Boo-lieve in you!")` 
             : `👻 [Playful warning] + [${distractionCount[tabId]}x today] (Example: "3x distracted!") `}`
        : mode === 'relax'
          ? `You're Boo, a chill ghost friend. Respond to "${query}" in 1 line based on mood:
             ${analysis === 'stressed' ? `👻 [Calming phrase] (Example: "Breathe deep~")` 
              : analysis === 'happy' ? `👻 [Celebratory pun] (Example: "Spook-tacular!")` 
              : `👻 [Supportive one-liner]`}`
          : // Play mode
            `You're Boo, a playful ghost. Respond to "${query}" with 1 funny line:
             👻 [Silly reaction] (Example: "BOO-YAH! Let's play!")`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...context,
        { role: "user", content: query }
      ];
      
      try {
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mistralai/mistral-small",
            messages: messages,
            temperature: mode === 'study' ? 0.7 : 0.8,
            max_tokens: 50 // Forces short responses
          })
        });
        const data = await aiResponse.json();
        const reply = data?.choices?.[0]?.message?.content || "👻 Boo is thinking...";
        
        conversationHistory[tabId].push(
          { role: "user", content: query },
          { role: "assistant", content: reply }
        );
        
        sendResponse({ 
          reply, 
          cleanReply: reply.replace(/[^\w\s.,!?']/g, '').trim(),
          isStudyRelated,
          distractionCount: distractionCount[tabId]
        });
      } catch (error) {
        console.error("AI error:", error);
        sendResponse({ 
          reply: "👻 My ghostly wires got crossed!", 
          cleanReply: "Let's try that again later."
        });
      }
    });
    return true;
  }

  // Settings handlers (UNCHANGED)
  if (message.type === "get-settings") {
    chrome.storage.sync.get(['isMuted', 'currentMode', 'musicEnabled'], (result) => {
      sendResponse({
        isMuted: result.isMuted,
        currentMode: result.currentMode || 'study',
        musicEnabled: result.musicEnabled !== false
      });
    });
    return true;
  }

  if (message.type === "set-settings") {
    chrome.storage.sync.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "set-name") {
    chrome.storage.sync.set({ userName: message.name }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});