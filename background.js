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
