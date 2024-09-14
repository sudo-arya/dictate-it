let currentUtterance = null;
let voices = [];
let pauseWords = 0;
let pauseDelay = 0;
let wordsCounter = 0;

function populateVoices() {
  voices = speechSynthesis.getVoices();
}

speechSynthesis.onvoiceschanged = populateVoices;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);

  if (request.action === "speak") {
    if (currentUtterance) {
      window.speechSynthesis.cancel(); // Cancel any ongoing utterance
    }

    // Set pauseWords and pauseDelay based on dictateMode
    const useDictateMode = request.dictateMode || false;
    pauseWords = useDictateMode ? request.pauseWords || 0 : 9999999;
    pauseDelay = useDictateMode ? request.pauseDelay || 0 : 0;

    const text = request.text;
    const words = text.split(/\s+/);

    if (voices.length === 0) {
      // Voices not loaded yet
      speechSynthesis.onvoiceschanged = () => {
        populateVoices();
        processSpeech(); // Retry once voices are loaded
      };
      return sendResponse({ status: "error", message: "Voices not loaded" });
    }

    const utterance = new SpeechSynthesisUtterance();

    if (
      request.voiceIndex !== undefined &&
      request.voiceIndex < voices.length
    ) {
      utterance.voice = voices[request.voiceIndex];
    } else {
      utterance.voice = voices[0];
    }

    utterance.pitch = request.pitch;
    utterance.rate = request.rate;
    utterance.volume = request.volume;

    // Speak text chunk by chunk
    function speakChunk(start) {
      if (start >= words.length) {
        // All chunks have been spoken
        sendResponse({ status: "success" });
        return;
      }

      const chunk = words.slice(start, start + pauseWords).join(" ");
      utterance.text = chunk;
      window.speechSynthesis.speak(utterance);

      utterance.onend = () => {
        if (start + pauseWords < words.length) {
          setTimeout(() => {
            speakChunk(start + pauseWords); // Proceed to the next chunk after pause
          }, pauseDelay);
        } else {
          // Finish speaking
          sendResponse({ status: "success" });
        }
      };
    }

    utterance.onstart = () => {
      wordsCounter = 0;
    };

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        wordsCounter++;
      }
    };

    currentUtterance = utterance;
    speakChunk(0); // Start speaking

    return true; // Keep the message channel open for asynchronous response
  } else if (request.action === "updateSettings") {
    // Handle TTS settings update
    if (currentUtterance) {
      window.speechSynthesis.cancel(); // Stop the current utterance
    }

    // Update the settings and restart speech
    chrome.storage.local.get(
      {
        pitch: 1,
        rate: 1,
        volume: 1,
        voiceIndex: 0,
        pauseWords: 99999,
        pauseDelay: 0,
        dictateMode: false,
      },
      (settings) => {
        const updatedUtterance = new SpeechSynthesisUtterance();
        updatedUtterance.voice = voices[settings.voiceIndex] || voices[0];
        updatedUtterance.pitch = settings.pitch;
        updatedUtterance.rate = settings.rate;
        updatedUtterance.volume = settings.volume;

        // Start speaking with updated settings
        const text = request.text || "";
        const words = text.split(/\s+/);
        speakChunk(0); // Reuse function to start speaking

        function speakChunk(start) {
          if (start >= words.length) {
            // All chunks have been spoken
            sendResponse({ status: "success" });
            return;
          }

          const chunk = words
            .slice(start, start + settings.pauseWords)
            .join(" ");
          updatedUtterance.text = chunk;
          window.speechSynthesis.speak(updatedUtterance);

          updatedUtterance.onend = () => {
            if (start + settings.pauseWords < words.length) {
              setTimeout(() => {
                speakChunk(start + settings.pauseWords); // Proceed to the next chunk after pause
              }, settings.pauseDelay);
            } else {
              // Finish speaking
              sendResponse({ status: "success" });
            }
          };
        }

        currentUtterance = updatedUtterance; // Update currentUtterance
      }
    );
    return true; // Keep the message channel open for asynchronous response
  } else if (request.action === "stopTTS") {
    if (currentUtterance) {
      window.speechSynthesis.cancel(); // Stop TTS if active
      currentUtterance = null; // Clear current utterance reference
    }
    sendResponse({ status: "success" });
  }
});

// Store selected text in Chrome's local storage for easy retrieval
document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    chrome.storage.local.set({ selectedText });
  }
});
