// Day/night lighting helpers for the ward simulation.
// Darkness is derived from the viewer's local time: full day mid-morning to
// late afternoon, ramping through dawn/dusk to full night.

// Returns a darkness level from 0 (full day) to 1 (full night).
export function computeDarkness(date = new Date()) {
  const h = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const dawnStart = 6.5;
  const fullDay = 8;
  const duskStart = 18;
  const fullNight = 19.5;
  if (h >= fullDay && h <= duskStart) return 0;
  if (h < dawnStart || h >= fullNight) return 1;
  if (h < fullDay) return 1 - (h - dawnStart) / (fullDay - dawnStart); // dawn ramp
  return (h - duskStart) / (fullNight - duskStart); // dusk ramp
}

// Lightweight Web Audio synthesis for fluorescent strip-light behaviour.
// No external assets — a switch click plus a low electrical hum while lit.
export function createLightingAudio() {
  let ctx = null;
  let hum = null;
  let humming = false;

  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };

  const click = (freq, dur) => {
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  };

  const startHum = () => {
    if (humming) return;
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sawtooth";
    o.frequency.value = 60;
    g.gain.value = 0.0001;
    o.connect(g).connect(c.destination);
    o.start();
    g.gain.linearRampToValueAtTime(0.012, c.currentTime + 0.3);
    hum = { osc: o, gain: g };
    humming = true;
  };

  const stopHum = () => {
    if (!humming) return;
    const c = ensure();
    const h = hum;
    if (c && h) {
      h.gain.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.25);
      setTimeout(() => { try { h.osc.stop(); } catch {} }, 350);
    }
    hum = null;
    humming = false;
  };

  return {
    turnOn() { click(180, 0.05); setTimeout(startHum, 80); },
    turnOff() { stopHum(); click(90, 0.05); },
    dispose() { stopHum(); try { ctx?.close(); } catch {} ctx = null; },
  };
}