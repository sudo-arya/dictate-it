chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "speak") {
    chrome.storage.local.get("selectedText", (data) => {
      if (data.selectedText) {
        const utterance = new SpeechSynthesisUtterance(data.selectedText);
        utterance.voice = request.voice;
        utterance.pitch = request.pitch;
        utterance.rate = request.rate;
        utterance.volume = request.volume;

        window.speechSynthesis.speak(utterance);
      }
    });
  }
});
// Create the context menu item
chrome.contextMenus.create({
  id: "speakText",
  title: "Speak Selected Text",
  contexts: ["selection"]
});

// Handle context menu item click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakText") {
    const selectedText = info.selectionText;

    chrome.tabs.sendMessage(tab.id, {
      action: "speak",
      text: selectedText,
      pitch: 1, // Set default values or get from storage
      rate: 1,
      volume: 1
    });
  }
});
