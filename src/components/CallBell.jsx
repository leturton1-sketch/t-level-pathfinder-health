import { useState } from "react";
import { Bell, Heart, X, AlertTriangle } from "lucide-react";

export default function CallBell() {
  const [callActive, setCallActive] = useState(false);
  const [arrestActive, setArrestActive] = useState(false);

  const toggleCallBell = () => {
    const newActive = !callActive;
    setCallActive(newActive);
    // Dispatch event for AI assistant to announce
    window.dispatchEvent(new CustomEvent("callbell-status", {
      detail: { bedDesignation: "Bed 3", active: newActive }
    }));
  };

  if (arrestActive) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-clinical-red/20 backdrop-blur-sm animate-fade-in">
        <div className="absolute inset-0 bg-clinical-red/10 animate-pulse" />
        <div className="relative bg-white border-2 border-clinical-red rounded-2xl p-8 max-w-md w-[90%] shadow-2xl">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-clinical-red/30 rounded-full animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-clinical-red/20 flex items-center justify-center">
                <Heart className="w-10 h-10 text-clinical-red animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-clinical-red">CARDIAC ARREST</h2>
              <p className="text-sm text-slate-500 mt-1">2222 — Call the cardiac arrest team immediately</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 w-full text-left text-xs space-y-1">
              <p className="font-semibold text-slate-700">Immediate Actions:</p>
              <p className="text-slate-500">1. Confirm cardiac arrest — check responsiveness and breathing</p>
              <p className="text-slate-500">2. Call 2222 — state location clearly</p>
              <p className="text-slate-500">3. Start CPR — 30:2 ratio (30 compressions : 2 rescue breaths)</p>
              <p className="text-slate-500">4. Attach defibrillator/AED as soon as available</p>
            </div>
            <button onClick={() => setArrestActive(false)}
              className="px-6 py-2.5 rounded-xl bg-clinical-red text-white font-heading font-semibold hover:opacity-90 transition-opacity">
              Acknowledge & Stand Down
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {callActive && (
        <div className="fixed bottom-20 left-4 z-50 animate-slide-up">
          <div className="flex items-center gap-3 rounded-xl border border-clinical-amber/40 bg-white/95 backdrop-blur-md px-4 py-3 shadow-lg">
            <Bell className="w-5 h-5 text-clinical-amber animate-pulse" />
            <div>
              <div className="text-sm font-heading font-semibold text-slate-800">Call Bell Active</div>
              <div className="text-xs text-slate-500">AI announcing — click to reset</div>
            </div>
            <button onClick={toggleCallBell} className="p-1 rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-20 left-4 z-40 flex flex-col gap-2">
        <button onClick={toggleCallBell}
          className={`group flex items-center gap-2 rounded-full border px-3 py-2 shadow-lg transition-all backdrop-blur-md ${
            callActive ? "border-clinical-amber/60 bg-clinical-amber/20" : "border-slate-200 bg-white/80 hover:border-clinical-amber/40"
          }`}
          title="Virtual call bell">
          <Bell className={`w-4 h-4 ${callActive ? "text-clinical-amber animate-pulse" : "text-slate-500"}`} />
          <span className="text-xs font-heading font-medium text-slate-700">Call Bell</span>
        </button>
        <button onClick={() => setArrestActive(true)}
          className="group flex items-center gap-2 rounded-full border border-clinical-red/40 bg-white/80 hover:bg-clinical-red/10 px-3 py-2 shadow-lg transition-all backdrop-blur-md"
          title="Cardiac arrest alarm">
          <AlertTriangle className="w-4 h-4 text-clinical-red" />
          <span className="text-xs font-heading font-medium text-clinical-red">Arrest Alarm</span>
        </button>
      </div>
    </>
  );
}