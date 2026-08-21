import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, Play, Sparkles, Cloud, Cpu, Check } from "lucide-react";
import { VOICE_PROFILES } from "@/lib/voicePreferences";

export default function VoiceSettings({ open, onClose, onSaved, synth }) {
  const { updatePrefs, testVoice, voices, speaking } = synth;
  const [draft, setDraft] = useState(synth.prefs);

  useEffect(() => { if (open) setDraft(synth.prefs); }, [open, synth.prefs]);

  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));

  const applyAndTest = () => {
    updatePrefs(draft);
    setTimeout(() => testVoice(), 60);
  };

  const save = () => {
    updatePrefs(draft);
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-clinical-teal" /> Voice Settings
          </DialogTitle>
        </DialogHeader>

        {/* Engine selection */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">SPEECH ENGINE</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => set("engine")("browser")}
              className={`p-3 rounded-xl border text-left transition-all ${draft.engine === "browser" ? "border-clinical-teal bg-clinical-teal/5" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-slate-600" /> <span className="text-sm font-semibold">Browser</span></div>
              <p className="text-[10px] text-slate-500 mt-1">Web Speech API · no API key</p>
            </button>
            <button onClick={() => set("engine")("cloud")}
              className={`p-3 rounded-xl border text-left transition-all ${draft.engine === "cloud" ? "border-clinical-teal bg-clinical-teal/5" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="flex items-center gap-2"><Cloud className="w-4 h-4 text-slate-600" /> <span className="text-sm font-semibold">Cloud HD</span></div>
              <p className="text-[10px] text-slate-500 mt-1">Regional neural presets · higher quality</p>
            </button>
          </div>
        </div>

        {/* Voice model cards */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">VOICE MODEL</p>
          <div className="space-y-2">
            {VOICE_PROFILES.map((p) => (
              <button key={p.id} onClick={() => set("profileId")(p.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${draft.profileId === p.id ? "border-clinical-teal bg-clinical-teal/5" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-clinical-teal" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.desc}</p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-700">Voice preset · {p.cloudVoice}</p>
                  </div>
                </div>
                {draft.profileId === p.id && <Check className="w-4 h-4 text-clinical-teal" />}
              </button>
            ))}
          </div>
        </div>

        {/* System voice (browser engine only) */}
        {draft.engine === "browser" && voices.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">SYSTEM VOICE</p>
            <select
              value={draft.systemVoiceURI || ""}
              onChange={(e) => set("systemVoiceURI")(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Auto (en-GB)</option>
              {voices.filter((v) => /^en/i.test(v.lang)).map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-3">
          <SliderRow label="Pitch" value={draft.pitch} min={0.5} max={1.5} step={0.05} onChange={set("pitch")} format={(v) => `${v.toFixed(2)}x`} />
          <SliderRow label="Speed" value={draft.rate} min={0.8} max={1.5} step={0.05} onChange={set("rate")} format={(v) => `${v.toFixed(2)}x`} />
          {draft.engine === "cloud" && (
            <SliderRow label="Stability" value={draft.stability} min={0} max={1} step={0.05} onChange={set("stability")} format={(v) => `${Math.round(v * 100)}%`} />
          )}
          <SliderRow label="Volume" value={draft.volume} min={0} max={1} step={0.05} onChange={set("volume")} format={(v) => `${Math.round(v * 100)}%`} />
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          <Button variant="outline" onClick={applyAndTest} disabled={speaking} className="gap-1.5">
            <Play className="w-4 h-4" /> Test Voice
          </Button>
          <Button onClick={save} className="bg-clinical-teal hover:opacity-90 text-white">Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SliderRow({ label, value, min, max, step, onChange, format }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs text-slate-500">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}