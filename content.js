console.log("Content script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);

  if (request.action === "speak") {
    const utterance = new SpeechSynthesisUtterance(request.text);
    const voices = speechSynthesis.getVoices();

    // Check if voiceIndex is defined and valid
    if (
      request.voiceIndex !== undefined &&
      request.voiceIndex < voices.length
    ) {
      utterance.voice = voices[request.voiceIndex];
    } else {
      // Default to the first available voice if index is invalid
      utterance.voice = voices[0];
    }

    utterance.pitch = request.pitch;
    utterance.rate = request.rate;
    utterance.volume = request.volume;

    window.speechSynthesis.speak(utterance);
    sendResponse({ status: "success" });
  }
});

document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    chrome.storage.local.set({ selectedText });
  }
});
