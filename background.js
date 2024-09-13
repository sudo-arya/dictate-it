// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "speakText",
    title: "Speak Selected Text",
    contexts: ["selection"],
  });
});

// Load settings from storage and use defaults if none exist
chrome.storage.local.get({
  pitch: 1,
  rate: 1,
  volume: 1,
  voiceIndex: 0,
  pauseWords: 5,
pauseDelay: 0 // Default to 0 seconds
}, (items) => {
  chrome.storage.local.set(items);
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakText") {
    chrome.storage.local.get(
      {
        pitch: 1,
        rate: 1,
        volume: 1,
        voiceIndex: 0,
        pauseWords: 5,
        pauseDelay: 0,
      },
      (settings) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "speak",
            text: info.selectionText,
            pitch: settings.pitch,
            rate: settings.rate,
            volume: settings.volume,
            voiceIndex: settings.voiceIndex,
            pauseWords: settings.pauseWords,
            pauseDelay: settings.pauseDelay,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError);
            } else {
              console.log("Message sent successfully:", response);
            }
          }
        );
      }
    );
  }
});
