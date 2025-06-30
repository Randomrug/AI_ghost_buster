// Ghost Physics System
let ghostX = window.innerWidth - 120;
let ghostY = window.innerHeight - 120;
let velocityX = (Math.random() - 0.5) * 2;
let velocityY = (Math.random() - 0.5) * 2;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartTime = 0;
let currentMode = 'study';
let isRoaming = true;
let controlsVisible = false;
let speechBubbleVisible = false;
let lastBounceTime = 0;
let speechBubbleTimeout = null;

// Track last URL for search detection
let lastUrl = location.href; 

// Create Ghost Container
const ghostContainer = document.createElement('div');
ghostContainer.id = 'ghost-buddy-container';
ghostContainer.style.left = `${ghostX}px`;
ghostContainer.style.top = `${ghostY}px`;
document.body.appendChild(ghostContainer);

// Create Ghost Character
const ghostChar = document.createElement('div');
ghostChar.className = 'ghost-character';
ghostChar.textContent = '👻';
ghostContainer.appendChild(ghostChar);

// Create Ghost Face
const ghostFace = document.createElement('div');
ghostFace.className = 'ghost-face';
ghostFace.innerHTML = `
  <div class="eyes"></div>
  <div class="mouth"></div>
`;
ghostChar.appendChild(ghostFace);

// Create Speech Bubble
const speechBubble = document.createElement('div');
speechBubble.className = 'ghost-speech-bubble';
ghostContainer.appendChild(speechBubble);

// Speech Bubble Click Handler
speechBubble.addEventListener('click', (e) => {
  e.stopPropagation();
  hideSpeechBubble();
});

// Create Controls Panel
const controls = document.createElement('div');
controls.className = 'ghost-controls';
controls.innerHTML = `
  <div class="mode-selector">
    <div class="mode-option active" data-mode="study">📚 Study</div>
    <div class="mode-option" data-mode="relax">🧘‍♀️ Relax</div>
    <div class="mode-option" data-mode="play">🎮 Play</div>
  </div>
  <div class="play-mode-options">
    <div class="play-mode-option active" data-playmode="roam">Roam</div>
    <div class="play-mode-option" data-playmode="still">Still</div>
  </div>
  <div class="control-buttons">
    <button class="control-button" id="ghost-mic">🎤</button>
    <button class="control-button" id="ghost-voice">🔊</button>
    <button class="control-button" id="ghost-music">🎵</button>
  </div>
`;
document.body.appendChild(controls);

// Audio System
const audioElements = {
  study: new Audio(chrome.runtime.getURL('musics/study.mp3')),
  relax: new Audio(chrome.runtime.getURL('musics/relax.mp3')),
  play: new Audio(chrome.runtime.getURL('musics/play.mp3'))
};
let currentAudio = null;
let musicEnabled = true;

// Initialize from storage
chrome.runtime.sendMessage({type: 'get-settings'}, (settings) => {
  currentMode = settings.currentMode || 'study';
  musicEnabled = settings.musicEnabled !== false;
  
  // Set active mode
  document.querySelector(`.mode-option[data-mode="${currentMode}"]`).classList.add('active');
  
  // Update play mode options visibility
  document.querySelector('.play-mode-options').style.display = 
    currentMode === 'play' ? 'flex' : 'none';
  
  // Update control buttons
  document.getElementById('ghost-voice').textContent = 
    settings.isMuted ? '🔇' : '🔊';
  document.getElementById('ghost-music').textContent = 
    musicEnabled ? '🎵' : '🔇';
  
  updateMusic(currentMode);
  updateGhostBehavior();
});

// Ghost Click Handler
ghostChar.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleControls();
});

// Toggle Controls
function toggleControls() {
  controlsVisible = !controlsVisible;
  controls.classList.toggle('visible', controlsVisible);
}

// Show/Hide Speech Bubble
function showSpeechBubble(text, state = 'default', duration = 0) {
  if (speechBubbleTimeout) {
    clearTimeout(speechBubbleTimeout);
    speechBubbleTimeout = null;
  }

  speechBubble.textContent = text;
  speechBubbleVisible = true;
  speechBubble.classList.add('visible');
  updateGhostState(state);
  
  if (duration > 0) {
    speechBubbleTimeout = setTimeout(() => {
      hideSpeechBubble();
    }, duration);
  }
}

function hideSpeechBubble() {
  speechBubbleVisible = false;
  speechBubble.classList.remove('visible');
}

// Update Ghost State
function updateGhostState(state) {
  ghostFace.className = 'ghost-face';
  if (state === 'happy' || state === 'warning') {
    ghostFace.classList.add(`ghost-state-${state}`);
  }
}

// Mode Selection
document.querySelectorAll('.mode-option').forEach(option => {
  option.addEventListener('click', () => {
    const newMode = option.dataset.mode;
    if (currentMode === newMode) return;
    
    currentMode = newMode;
    
    // Update UI
    document.querySelectorAll('.mode-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.mode === currentMode);
    });
    
    // Show/hide play mode options
    document.querySelector('.play-mode-options').style.display = 
      currentMode === 'play' ? 'flex' : 'none';
    
    // Save to storage
    chrome.runtime.sendMessage({
      type: 'set-settings',
      settings: { currentMode }
    });
    
    updateMusic(currentMode);
    showSpeechBubble(`Switched to ${currentMode} mode!`, 'happy', 3000);
  });
});

// Play Mode Selection
document.querySelectorAll('.play-mode-option').forEach(option => {
  option.addEventListener('click', () => {
    isRoaming = option.dataset.playmode === 'roam';
    
    // Update UI
    document.querySelectorAll('.play-mode-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.playmode === option.dataset.playmode);
    });
    
    // If switching to still, stop movement
    if (!isRoaming) {
      velocityX = 0;
      velocityY = 0;
    } else {
      // Give random velocity when switching to roam
      velocityX = (Math.random() - 0.5) * 2;
      velocityY = (Math.random() - 0.5) * 2;
    }
  });
});

// Enhanced Physics Update Loop
function updatePhysics() {
  if (!isDragging && (currentMode !== 'play' || isRoaming)) {
    // Apply friction
    velocityX *= 0.99;
    velocityY *= 0.99;
    
    // Update position
    ghostX += velocityX;
    ghostY += velocityY;
    
    // Boundary collision with more realistic bouncing
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;
    const bounceDampening = 0.8;
    
    let bounced = false;
    
    if (ghostX < 0) {
      ghostX = 0;
      velocityX = Math.abs(velocityX) * bounceDampening;
      bounced = true;
    } else if (ghostX > maxX) {
      ghostX = maxX;
      velocityX = -Math.abs(velocityX) * bounceDampening;
      bounced = true;
    }
    
    if (ghostY < 0) {
      ghostY = 0;
      velocityY = Math.abs(velocityY) * bounceDampening;
      bounced = true;
    } else if (ghostY > maxY) {
      ghostY = maxY;
      velocityY = -Math.abs(velocityY) * bounceDampening;
      bounced = true;
    }
    
    // Update position
    ghostContainer.style.left = `${ghostX}px`;
    ghostContainer.style.top = `${ghostY}px`;
    
    // Play bounce sound if significant impact
    if (bounced && (Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5)) {
      if (Date.now() - lastBounceTime > 500) {
        playBounceSound();
        lastBounceTime = Date.now();
      }
    }
  }
  
  requestAnimationFrame(updatePhysics);
}
updatePhysics();

// Enhanced Drag and Throw System
ghostChar.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartTime = Date.now();
  ghostChar.style.cursor = 'grabbing';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    // Move ghost with cursor
    ghostX = e.clientX - 40; // Center ghost on cursor
    ghostY = e.clientY - 40;
    
    ghostContainer.style.left = `${ghostX}px`;
    ghostContainer.style.top = `${ghostY}px`;
    
    // Reset velocity while dragging
    velocityX = 0;
    velocityY = 0;
  }
});

document.addEventListener('mouseup', (e) => {
  if (isDragging) {
    isDragging = false;
    ghostChar.style.cursor = 'grab';
    
    // Calculate throw velocity based on drag speed and direction
    const dragDuration = Date.now() - dragStartTime;
    const dragDistanceX = e.clientX - dragStartX;
    const dragDistanceY = e.clientY - dragStartY;
    
    // Only apply throw in play mode with roam enabled
    if (currentMode === 'play' && isRoaming) {
      // Calculate velocity based on drag speed (distance over time)
      const minDuration = 50; // Minimum drag time for max velocity
      const speedFactor = Math.min(1, minDuration / dragDuration);
      
      velocityX = (dragDistanceX / 10) * speedFactor;
      velocityY = (dragDistanceY / 10) * speedFactor;
      
      // Limit maximum velocity
      const maxVelocity = 15;
      const currentSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      if (currentSpeed > maxVelocity) {
        velocityX = (velocityX / currentSpeed) * maxVelocity;
        velocityY = (velocityY / currentSpeed) * maxVelocity;
      }
    }
  }
});

// Bounce Sound - Changed to more playful voice
function playBounceSound() {
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance('Woah there!');
    utterance.volume = 0.7;
    utterance.rate = 1.5; // Faster, more playful
    utterance.pitch = 1.8; // Higher pitch
    window.speechSynthesis.speak(utterance);
  }
}

// Music System

function updateMusic(mode) {
  if (!musicEnabled) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    return;
  }

  const newAudio = audioElements[mode];
  
  // If already playing the correct track, do nothing
  if (currentAudio === newAudio && !currentAudio.paused) {
    return;
  }

  // Stop any ongoing fade intervals
  if (window.currentFadeInterval) {
    clearInterval(window.currentFadeInterval);
  }
  if (window.newFadeInterval) {
    clearInterval(window.newFadeInterval);
  }

  // Crossfade between tracks
  if (currentAudio) {
    // Fade out current audio
    window.currentFadeInterval = setInterval(() => {
      if (currentAudio.volume > 0.05) {
        currentAudio.volume = Math.max(0, currentAudio.volume - 0.05);
      } else {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        clearInterval(window.currentFadeInterval);
      }
    }, 50);
  }

  if (newAudio) {
    // Prepare new audio
    newAudio.currentTime = 0;
    newAudio.volume = 0;
    newAudio.loop = true;
    
    // Play new audio (with error handling)
    newAudio.play().catch(e => {
      console.log('Audio play prevented:', e);
      // If play fails, stop the fade out if it's still happening
      if (window.currentFadeInterval) {
        clearInterval(window.currentFadeInterval);
      }
    });

    // Fade in new audio
    window.newFadeInterval = setInterval(() => {
      if (newAudio.volume < 0.5) {
        newAudio.volume = Math.min(0.5, newAudio.volume + 0.05);
      } else {
        clearInterval(window.newFadeInterval);
      }
    }, 50);

    currentAudio = newAudio;
  }
}

// Music Toggle
document.getElementById('ghost-music').addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  
  chrome.runtime.sendMessage({
    type: 'set-settings',
    settings: { musicEnabled }
  });
  
  document.getElementById('ghost-music').textContent = 
    musicEnabled ? '🎵' : '🔇';
  
  updateMusic(currentMode);
});

// Voice Toggle
document.getElementById('ghost-voice').addEventListener('click', () => {
  chrome.runtime.sendMessage({type: 'get-settings'}, (settings) => {
    const newMutedState = !settings.isMuted;
    
    chrome.runtime.sendMessage({
      type: 'set-settings',
      settings: { isMuted: newMutedState }
    });
    
    document.getElementById('ghost-voice').textContent = 
      newMutedState ? '🔇' : '🔊';
    
    showSpeechBubble(newMutedState ? 'Voice muted' : 'Voice on', 'happy', 2000);
  });
});

// Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    handleUserInput(transcript);
  };
  
  recognition.onerror = (e) => {
    showSpeechBubble("Oopsie! Couldn't hear you properly!", 'warning', 2000);
  };
}

// Microphone Toggle
document.getElementById('ghost-mic').addEventListener('click', () => {
  if (!recognition) {
    showSpeechBubble("Voice input not supported here", 'warning', 2000);
    return;
  }
  
  if (isListening) {
    recognition.stop();
    isListening = false;
    document.getElementById('ghost-mic').style.backgroundColor = '';
  } else {
    recognition.start();
    isListening = true;
    document.getElementById('ghost-mic').style.backgroundColor = '#ffcccc';
    showSpeechBubble("Listening...", 'default');
  }
});

// Handle User Input - Guaranteed voice activation
function handleUserInput(query) {
  if (!query.trim()) return;
  
  showSpeechBubble("Thinking...", 'default');
  
  chrome.runtime.sendMessage(
    { type: 'ask-ai', query, tabId: 'current' },
    (response) => {
      if (!response) {
        showSpeechBubble("Can't connect right now", 'warning', 3000);
        return;
      }
      
      showSpeechBubble(response.reply, response.isStudyRelated ? 'happy' : 'warning', 5000);
      
      // Always speak the response (unless muted)
      chrome.runtime.sendMessage({type: 'get-settings'}, (settings) => {
        if (!settings.isMuted) {
          speakResponse(response.cleanReply);
        }
      });
    }
  );
}

// New dedicated function for speaking responses
function speakResponse(text) {
  if (!window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set voice characteristics based on mode
  if (currentMode === 'study') {
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 0.9;
  } else if (currentMode === 'relax') {
    utterance.rate = 1.1;
    utterance.pitch = 1.3;
    utterance.volume = 0.8;
  } else { // play mode
    utterance.rate = 1.3;
    utterance.pitch = 1.6;
    utterance.volume = 1.0;
  }
  
  // Load voices and speak
  const speakWithVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Child') || 
      v.name.includes('Young') || 
      v.lang.includes('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  };
  
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speakWithVoice;
  } else {
    speakWithVoice();
  }
}

// Initialize voice synthesis on load
function initializeVoice() {
  if (window.speechSynthesis) {
    // Preload voices
    window.speechSynthesis.getVoices();
  }
}

// Call initialization on load
window.addEventListener('load', initializeVoice);

// Search Query Detection
function checkForSearchQuery() {
  const url = new URL(window.location.href);
  const query = 
    url.searchParams.get("q") || // Google
    url.searchParams.get("p") || // Yahoo
    url.searchParams.get("query") || // Other engines
    url.searchParams.get("search"); // Bing/etc.

  if (query) {
    handleUserInput(query);
  }
}

// URL Change Monitor
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(checkForSearchQuery, 300); // Delay for page load
  }
}, 1000);

// Initial Greeting + Search Check
setTimeout(() => {
  showSpeechBubble("Hello there! 👻", 'happy', 3000);
  checkForSearchQuery(); // Check on initial load
  
  // Speak greeting if not muted
}, 1000);

// Click outside to hide controls/speech bubble
document.addEventListener('click', (e) => {
  if (!ghostContainer.contains(e.target) && !controls.contains(e.target)) {
    if (controlsVisible) {
      controlsVisible = false;
      controls.classList.remove('visible');
    }
    
    if (speechBubbleVisible) {
      hideSpeechBubble();
    }
  }
});

// Window resize handler
window.addEventListener('resize', () => {
  // Keep ghost within bounds
  const maxX = window.innerWidth - 80;
  const maxY = window.innerHeight - 80;
  
  if (ghostX > maxX) ghostX = maxX;
  if (ghostY > maxY) ghostY = maxY;
  
  ghostContainer.style.left = `${ghostX}px`;
  ghostContainer.style.top = `${ghostY}px`;
});