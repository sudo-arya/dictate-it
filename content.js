console.log("Content script loaded");

let currentUtterance = null; // To track the current speech utterance

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);

  if (request.action === "speak") {
    if (currentUtterance) {
      // Stop the current utterance if it's still speaking
      window.speechSynthesis.cancel();
    }
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

    // Set the current utterance to this new one
    currentUtterance = utterance;

    utterance.onend = () => {
      // Clear the reference when the utterance ends
      currentUtterance = null;
    };

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
