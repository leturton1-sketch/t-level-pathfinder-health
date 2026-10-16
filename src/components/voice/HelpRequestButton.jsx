import React, { useState } from "react";
import { LifeBuoy, X, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

export default function HelpRequestButton() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendHelpRequest", { message: text });
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Help request sent",
        description: "Your message has been sent to the System Architect. You will receive a reply by email.",
      });
      setMessage("");
      setOpen(false);
    } catch (err) {
      toast({
        title: "Could not send help request",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="educator-settings"
        onClick={() => setOpen(true)}
        aria-label="Send a help request to the System Architect"
        title="Send a help request"
      >
        <LifeBuoy size={18} aria-hidden="true" /> Help request
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-request-title"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="help-request-title" className="text-lg font-heading font-bold text-slate-900">
                  Send a help request
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Your message goes directly to the T-SIM Health System Architect. They will reply to you by email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close help request"
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you need help with…"
              rows={5}
              maxLength={5000}
              disabled={sending}
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-clinical-teal focus:outline-none focus:ring-2 focus:ring-clinical-teal/20 disabled:opacity-60"
              aria-label="Your help request message"
            />
            <p className="mt-1 text-right text-xs text-slate-400">{message.length} / 5000</p>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={sending || !message.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-clinical-teal px-4 py-2 text-sm font-semibold text-white hover:bg-clinical-teal/90 disabled:opacity-60"
              >
                <Send size={16} />
                {sending ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}