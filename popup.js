document.addEventListener("DOMContentLoaded", () => {
  const textArea = document.getElementById("text");
  const voiceSelect = document.getElementById("voice");
  const pitchInput = document.getElementById("pitch");
  const rateInput = document.getElementById("rate");
  const volumeInput = document.getElementById("volume");
  const pitchValue = document.getElementById("pitchValue");
  const rateValue = document.getElementById("rateValue");
  const volumeValue = document.getElementById("volumeValue");
  const speakButton = document.getElementById("speak");
  const pauseWordsInput = document.getElementById("pauseWords");
  const pauseDelayInput = document.getElementById("pauseDelay");

  function populateVoices() {
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";
    voices.forEach((voice, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = voice.name;
      voiceSelect.appendChild(option);
    });
  }

  populateVoices();
  speechSynthesis.onvoiceschanged = populateVoices;

//   chrome.storage.local.get("selectedText", (data) => {
//     textArea.value = data.selectedText || "";
//   });

chrome.storage.local.get(
  {
    selectedText: "",
    pitch: 1,
    rate: 1,
    volume: 1,
    voiceIndex: 0,
    pauseWords: 5,
    pauseDelay: 0,
  },
  (data) => {
    textArea.value = data.selectedText || "";
    pitchInput.value = data.pitch;
    rateInput.value = data.rate;
    volumeInput.value = data.volume;
    voiceSelect.value = data.voiceIndex;
    pauseWordsInput.value = data.pauseWords;
    pauseDelayInput.value = data.pauseDelay;
    updateValueDisplay();
  }
);

  function updateValueDisplay() {
    pitchValue.textContent = pitchInput.value;
    rateValue.textContent = rateInput.value;
    volumeValue.textContent = volumeInput.value;
  }

  pitchInput.addEventListener("input", updateValueDisplay);
  rateInput.addEventListener("input", updateValueDisplay);
  volumeInput.addEventListener("input", updateValueDisplay);

  speakButton.addEventListener("click", () => {
    const text = textArea.value;
    const pitch = parseFloat(pitchInput.value);
    const rate = parseFloat(rateInput.value);
    const volume = parseFloat(volumeInput.value);
    const voiceIndex = parseInt(voiceSelect.value);
    const pauseWords = parseInt(pauseWordsInput.value);
    const pauseDelay = parseInt(pauseDelayInput.value)*1000 || 0; // Default to 0 seconds if input is empty

    chrome.storage.local.set({
      pitch,
      rate,
      volume,
      voiceIndex,
      pauseWords,
      pauseDelay,
    });

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
            voiceIndex,
            pauseWords,
            pauseDelay,
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
        console.error("No active tab found.");
      }
    });
  });

  updateValueDisplay();
});
