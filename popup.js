document.addEventListener("DOMContentLoaded", () => {
  const textArea = document.getElementById("text");
  const pitchInput = document.getElementById("pitch");
  const rateInput = document.getElementById("rate");
  const volumeInput = document.getElementById("volume");
  const speakButton = document.getElementById("speak");

  chrome.storage.local.get("selectedText", (data) => {
    textArea.value = data.selectedText || "";
  });

  speakButton.addEventListener("click", () => {
    const text = textArea.value;
    const pitch = parseFloat(pitchInput.value);
    const rate = parseFloat(rateInput.value);
    const volume = parseFloat(volumeInput.value);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "speak",
            text,
            pitch,
            rate,
            volume,
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
      }
    });
  });
});
