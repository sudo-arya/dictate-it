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
  const dictateCheckbox = document.getElementById("dictate");

  let ttsActive = false; // Flag to track if TTS is active

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

  // Load settings from storage
  chrome.storage.local.get(
    {
      selectedText: "",
      pitch: 1,
      rate: 1,
      volume: 100, // Store volume as 100 for display, but map to 0-1 internally
      voiceIndex: 0,
      pauseWords: 5,
      pauseDelay: 0,
      dictateMode: false,
    },
    (data) => {
      textArea.value = data.selectedText || "";
      pitchInput.value = data.pitch;
      rateInput.value = data.rate;
      volumeInput.value = data.volume; // Keep it as 100 for the UI
      voiceSelect.value = data.voiceIndex;
      pauseWordsInput.value = data.pauseWords;
      pauseDelayInput.value = data.pauseDelay;
      dictateCheckbox.checked = data.dictateMode;

      updateValueDisplay();
      togglePauseSettings(data.dictateMode);
    }
  );

  function updateValueDisplay() {
    pitchValue.textContent = pitchInput.value;
    rateValue.textContent = rateInput.value;
    volumeValue.textContent = volumeInput.value; // Display volume as 0-100
  }

  function togglePauseSettings(enabled) {
    pauseWordsInput.disabled = !enabled;
    pauseDelayInput.disabled = !enabled;
  }

  function sendUpdatedSettings() {
    const pitch = parseFloat(pitchInput.value);
    const rate = parseFloat(rateInput.value);
    const volume = parseFloat(volumeInput.value) / 100; // Scale volume from 0-100 to 0-1
    const voiceIndex = parseInt(voiceSelect.value);
    const pauseWords = parseInt(pauseWordsInput.value);
    const pauseDelay = parseInt(pauseDelayInput.value) || 0; // Default to 0 seconds if input is empty
    const dictateMode = dictateCheckbox.checked;

    // Save the updated settings to local storage
    chrome.storage.local.set({
      pitch,
      rate,
      volume: volumeInput.value, // Save volume as 0-100 for UI
      voiceIndex,
      pauseWords,
      pauseDelay,
      dictateMode,
    });

    // Send the updated settings to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "updateSettings",
            pitch,
            rate,
            volume, // Send the scaled volume (0-1) to the TTS engine
            voiceIndex,
            pauseWords,
            pauseDelay,
            dictateMode,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error sending message:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("Settings updated successfully:", response);
              // Restart TTS with new settings
              restartTTS();
            }
          }
        );
      } else {
        console.error("No active tab found.");
      }
    });
  }

  function restartTTS() {
    const text = textArea.value;
    const pitch = parseFloat(pitchInput.value);
    const rate = parseFloat(rateInput.value);
    const volume = parseFloat(volumeInput.value) / 100; // Scale volume from 0-100 to 0-1
    const voiceIndex = parseInt(voiceSelect.value);
    const pauseWords = parseInt(pauseWordsInput.value);
    const pauseDelay = parseInt(pauseDelayInput.value) || 0; // Default to 0 seconds if input is empty
    const dictateMode = dictateCheckbox.checked;

    // Stop any ongoing TTS if it's active
    if (ttsActive) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "stop" }, // Send a stop action to the content script
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error stopping TTS:",
                  chrome.runtime.lastError.message
                );
              } else {
                console.log("TTS stopped successfully:", response);
                ttsActive = false; // Update flag
                // Start TTS with new settings
                startSpeaking();
              }
            }
          );
        } else {
          console.error("No active tab found.");
        }
      });
    } else {
      // Start TTS if it wasn't active
      startSpeaking();
    }
  }

  function startSpeaking() {
    const text = textArea.value;
    const pitch = parseFloat(pitchInput.value);
    const rate = parseFloat(rateInput.value);
    const volume = parseFloat(volumeInput.value) / 100; // Scale volume from 0-100 to 0-1
    const voiceIndex = parseInt(voiceSelect.value);
    const pauseWords = parseInt(pauseWordsInput.value);
    const pauseDelay = parseInt(pauseDelayInput.value) || 0; // Default to 0 seconds if input is empty
    const dictateMode = dictateCheckbox.checked;

    // Send a message specifically to start speaking the text
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "speak",
            text,
            pitch,
            rate,
            volume, // Send the scaled volume (0-1) to the TTS engine
            voiceIndex,
            pauseWords,
            pauseDelay,
            dictateMode,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error sending message:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("Speak action sent successfully:", response);
              ttsActive = true; // Update flag to indicate TTS is active
            }
          }
        );
      } else {
        console.error("No active tab found.");
      }
    });
  }

  // Add event listeners for inputs to automatically update settings
  textArea.addEventListener("input", sendUpdatedSettings);
  pitchInput.addEventListener("input", () => {
    updateValueDisplay();
    sendUpdatedSettings();
  });
  rateInput.addEventListener("input", () => {
    updateValueDisplay();
    sendUpdatedSettings();
  });
  volumeInput.addEventListener("input", () => {
    updateValueDisplay();
    sendUpdatedSettings();
  });
  voiceSelect.addEventListener("change", sendUpdatedSettings);
  pauseWordsInput.addEventListener("input", sendUpdatedSettings);
  pauseDelayInput.addEventListener("input", sendUpdatedSettings);
  dictateCheckbox.addEventListener("change", () => {
    togglePauseSettings(dictateCheckbox.checked);
    sendUpdatedSettings();
  });

  // Speak Button Click Event: Trigger speech
  speakButton.addEventListener("click", startSpeaking);

  updateValueDisplay();
});
