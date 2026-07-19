/**
 * ElevenLabs Text-to-Speech utility
 * Calls the ElevenLabs API to generate speech audio from text.
 * The admin enters their API key and a Yorkshire voice ID in settings.
 */

let currentAudio = null;

export async function elevenLabsTTS(text, apiKey, voiceId, volume = 1) {
  if (!apiKey || !voiceId) return null;
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function playElevenLabs(text, apiKey, voiceId, volume, onEnd) {
  if (!apiKey || !voiceId) return false;
  stopSpeaking();
  const url = await elevenLabsTTS(text, apiKey, voiceId, volume);
  if (!url) return false;
  currentAudio = new Audio(url);
  currentAudio.volume = volume;
  currentAudio.onended = () => {
    currentAudio = null;
    URL.revokeObjectURL(url);
    onEnd?.();
  };
  currentAudio.onerror = () => {
    currentAudio = null;
    URL.revokeObjectURL(url);
  };
  await currentAudio.play();
  return true;
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking() {
  return currentAudio !== null || ("speechSynthesis" in window && window.speechSynthesis.speaking);
}