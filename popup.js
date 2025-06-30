document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toggleControls').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'toggle-controls'});
      window.close();
    });
  });
  
  document.getElementById('resetPosition').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'reset-ghost'});
      window.close();
    });
  });
});