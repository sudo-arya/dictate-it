// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "speakText",
    title: "Speak Selected Text",
    contexts: ["selection"],
  });

  // Initialize default settings if not already set
  chrome.storage.local.get(
    {
      pitch: 1,
      rate: 1,
      volume: 1,
      voiceIndex: 0,
      pauseWords: 99999,
      pauseDelay: 0,
      dictateMode: false,
      ttsActive: false, // Track TTS state
    },
    (items) => {
      chrome.storage.local.set(items);
    }
  );
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakText") {
    chrome.storage.local.get(
      {
        pitch: 1,
        rate: 1,
        volume: 1,
        voiceIndex: 0,
        pauseWords: 99999,
        pauseDelay: 0,
        dictateMode: false,
        ttsActive: false, // Track TTS state
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

// Listener for updated settings
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateSettings") {
    chrome.storage.local.set({
      pitch: message.pitch,
      rate: message.rate,
      volume: message.volume,
      voiceIndex: message.voiceIndex,
      pauseWords: message.pauseWords,
      pauseDelay: message.pauseDelay,
      dictateMode: message.dictateMode,
    });

    // Check if TTS is currently active and restart if necessary
    chrome.storage.local.get("ttsActive", (result) => {
      if (result.ttsActive) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0 && tabs[0].id) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "stop" },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Error stopping TTS:",
                    chrome.runtime.lastError.message
                  );
                } else {
                  console.log("TTS stopped successfully:", response);
                  // Restart TTS with updated settings
                  chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                      action: "speak",
                      text: "", // Provide current text if necessary
                      pitch: message.pitch,
                      rate: message.rate,
                      volume: message.volume,
                      voiceIndex: message.voiceIndex,
                      pauseWords: message.pauseWords,
                      pauseDelay: message.pauseDelay,
                      dictateMode: message.dictateMode,
                    },
                    (response) => {
                      if (chrome.runtime.lastError) {
                        console.error(
                          "Error sending message:",
                          chrome.runtime.lastError.message
                        );
                      } else {
                        console.log("TTS restarted successfully:", response);
                        // Update TTS active flag
                        chrome.storage.local.set({ ttsActive: true });
                      }
                    }
                  );
                }
              }
            );
          }
        });
      }
    });
  } else if (message.action === "stopTTS") {
    // Set TTS active flag to false
    chrome.storage.local.set({ ttsActive: false });
  }

  sendResponse({ status: "success" });
});
