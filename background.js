// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "speakText",
    title: "Speak Selected Text",
    contexts: ["selection"],
  });
});

// Load settings from storage and use defaults if none exist
chrome.storage.local.get(
  {
    pitch: 1,
    rate: 1,
    volume: 1,
    voiceIndex: 0,
    pauseWords: 5,
    pauseDelay: 0,
    dictateMode: false,
  },
  (items) => {
    chrome.storage.local.set(items);
  }
);


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakText") {
    chrome.storage.local.get(
      {
        pitch: 1,
        rate: 1,
        volume: 1,
        voiceIndex: 0,
        pauseWords: 999999,
        pauseDelay: 0,
        dictateMode: false,
      },
      (settings) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tab) {
            chrome.tabs.sendMessage(
              tab.id,
              {
                action: "speak",
                text: info.selectionText,
                pitch: settings.pitch,
                rate: settings.rate,
                volume: settings.volume,
                voiceIndex: settings.voiceIndex,
                pauseWords: settings.dictateMode ? settings.pauseWords : 0,
                pauseDelay: settings.dictateMode ? settings.pauseDelay : 0,
                dictateMode: settings.dictateMode,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Error sending message:",
                    chrome.runtime.lastError.message
                  );
                } else {
                  console.log("Message sent successfully:", response);
                }
              }
            );
          } else {
            console.error("No active tab or tab is undefined.");
          }
        });
      }
    );
    return true; // Keeps the message channel open for async response
  }
});

