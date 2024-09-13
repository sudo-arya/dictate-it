// content.js
console.log("Content script loaded");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === "speak") {
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.voice = request.voice;
    utterance.pitch = request.pitch;
    utterance.rate = request.rate;
    utterance.volume = request.volume;

    window.speechSynthesis.speak(utterance);
    sendResponse({ status: "success" });
  }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "speak") {
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.voice = request.voice;
    utterance.pitch = request.pitch;
    utterance.rate = request.rate;
    utterance.volume = request.volume;

    window.speechSynthesis.speak(utterance);
    sendResponse({ status: "success" }); // Ensure this line is included
  }
});

document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    chrome.storage.local.set({ selectedText });
  }
});
