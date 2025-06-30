**AI Ghost Buster** is a Chrome extension that adds a floating ghost character named Boo to your browsing experience. Boo isn’t just decoration—it’s designed to gently support your focus, encourage mindful breaks, and make the online workspace feel less lonely.

**Boo can:**
Switch between Study, Relax, and Play modes, changing its behavior and background music
Detect what kind of content you’re engaging with (e.g. YouTube, search queries)
Use voice recognition so you can talk to Boo using your mic
Speak back to you using built-in text-to-speech
Use a lightweight AI system (via OpenRouter) to detect focus/distraction and respond
Run a Pomodoro timer that can be voice-activated (“start timer”)
Animate with drag-and-throw physics, bouncing off screen edges
Occasionally remind you to hydrate, stretch, or take a breath
Boo isn’t a coach. It isn’t a tracker. It’s just there when you need it—and quiet when you don’t.

Built GhostBuddy entirely in the frontend, as a Chrome Extension, using:
HTML, CSS, JavaScript

A content script that injects the ghost into every webpage
A custom physics engine (written from scratch) for motion and bouncing
The Web Speech API for speech recognition and text-to-speech
The OpenRouter API (using the mistralai/mistral-small model) for lightweight text analysis
Chrome Storage API to save settings like mute state and mode
A music player for ambient background sounds with crossfade transitions
A Pomodoro timer system written in vanilla JS
We intentionally avoided any backend to keep it privacy-friendly, lightweight, and easy to run completely client-side

**HOW TO USE???**
Download the zip and extract all the files.
Open the background.js file — you’ll find two spots (around line 25 and 95) where you need to paste your API key.
To get it, go to openrouter.ai, search for any free model (I used DeepSeek v3 base and Mistral), scroll down, click "Create API Key", name it, and copy it (you won’t see it again). Paste that key in both places.

Then open Chrome and go to chrome://extensions/, turn on Developer Mode (top-right), click Load unpacked, and select the folder you just extracted. That’s it! You’ll see Boo appear and start reacting to your browsing — study stuff gets cheers, distractions get ghost-roasts 👻💀


**imma afraid to open new tabs or scroll memes now… Boo’s watching me like “one more meme and I haunt your GPA” 😭👻**

your fearfully,
Randomrug. ♥ 👻 
