chrome.contextMenus.create({
  id: "speakText",
  title: "Speak Selected Text",
  contexts: ["selection"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "speakText") {
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "speak",
        text: info.selectionText,
        pitch: 1,
        rate: 1,
        volume: 1,
        voiceIndex: 0,
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
});
