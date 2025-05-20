const playNotification = () => {
  const message = `msg recieved`;
  const utterance = new SpeechSynthesisUtterance(message);

  // Optional: Customize voice, pitch, rate, etc.
  utterance.lang = "en-US";
  utterance.pitch = 10;
  utterance.rate = 1;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find(
    (voice) => voice.name.includes("Google") && voice.lang === "hi-IN"
  );

  window.speechSynthesis.speak(utterance);
};

export {playNotification};