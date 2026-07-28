import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, CheckCircle, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, BookOpen, HelpCircle } from "lucide-react";
import { SCIENCE_DECK } from "@/lib/learningData";

export default function SciHealthDeck() {
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const card = SCIENCE_DECK[cardIdx];
  const isLast = cardIdx === SCIENCE_DECK.length - 1;

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (idx === card.correctAnswer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      setCardIdx(0); setScore(0);
    } else {
      setCardIdx(i => i + 1);
    }
    setFlipped(false); setSelectedAnswer(null); setAnswered(false);
  };

  const handlePrev = () => {
    if (cardIdx > 0) {
      setCardIdx(i => i - 1);
      setFlipped(false); setSelectedAnswer(null); setAnswered(false);
    }
  };

  const handleReset = () => {
    setCardIdx(0); setFlipped(false); setSelectedAnswer(null); setAnswered(false); setScore(0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1">
          <span className="bg-teal-50 text-teal-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Area 8 · Science</span>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-800 mt-0.5">Sci-Health Formula Deck</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading font-bold text-slate-800">{score}<span className="text-slate-400 text-sm">/{SCIENCE_DECK.length}</span></div>
          <div className="text-[10px] text-slate-400 uppercase">Score</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={handlePrev} disabled={cardIdx === 0}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
        <span className="text-xs text-slate-500 font-medium">Card {cardIdx + 1} of {SCIENCE_DECK.length}</span>
        <button onClick={handleNext} disabled={isLast && !answered}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
      </div>

      {/* Flashcard */}
      <div className="relative" style={{ perspective: 1000, minHeight: 380 }}>
        <AnimatePresence mode="wait">
          <motion.div key={cardIdx}
            initial={{ opacity: 0, rotateY: flipped ? -180 : 0 }}
            animate={{ opacity: 1, rotateY: flipped ? -180 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative">
            {/* Front face */}
            <div className={`rounded-2xl border border-slate-200 overflow-hidden ${flipped ? "invisible" : ""}`}>
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-white/80" />
                  <span className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">Scientific Principle</span>
                </div>
                <h3 className="text-white font-heading font-bold text-lg leading-tight">{card.title}</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Principle</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{card.principle}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Technology</p>
                  <p className="text-sm text-clinical-teal font-semibold">{card.clinicalTech}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">How It Works</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.explanation}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button onClick={() => setFlipped(true)}
                  className="w-full py-2.5 rounded-xl bg-teal-50 text-teal-700 text-sm font-heading font-semibold hover:bg-teal-100 transition-colors flex items-center justify-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Test Your Knowledge
                </button>
              </div>
            </div>

            {/* Back face (quiz) - shown when flipped */}
            {flipped && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="absolute inset-0 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-white/80" />
                    <span className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">Quiz Question</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed font-medium">{card.quizQuestion}</p>
                </div>
                <div className="p-4 space-y-2">
                  {card.quizOptions.map((option, idx) => {
                    const isCorrect = idx === card.correctAnswer;
                    const isSelected = selectedAnswer === idx;
                    let cls = "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50";
                    if (answered) {
                      if (isCorrect) cls = "border-clinical-green/50 bg-clinical-green/5";
                      else if (isSelected) cls = "border-clinical-red/50 bg-clinical-red/5";
                      else cls = "border-slate-200 bg-slate-50 opacity-60";
                    }
                    return (
                      <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                        className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${cls}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-700">{option}</span>
                          {answered && isCorrect && <CheckCircle className="w-4 h-4 text-clinical-green shrink-0" />}
                          {answered && isSelected && !isCorrect && <AlertTriangle className="w-4 h-4 text-clinical-red shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <div className="px-4 pb-4">
                    <div className={`p-3 rounded-xl mb-3 ${selectedAnswer === card.correctAnswer ? "bg-clinical-green/10 border border-clinical-green/30" : "bg-amber-50 border border-amber-200"}`}>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold">{selectedAnswer === card.correctAnswer ? "✓ Correct! " : "⚠️ "}</span>
                        {card.rationale}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleNext} className="flex-1 py-2.5 rounded-xl bg-clinical-teal text-white text-sm font-heading font-semibold hover:opacity-90 transition-opacity">
                        {isLast ? "Restart Deck" : "Next Card →"}
                      </button>
                      <button onClick={() => setFlipped(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-heading font-semibold hover:bg-slate-200 transition-colors">
                        ← Back
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {SCIENCE_DECK.map((_, i) => (
          <button key={i} onClick={() => { setCardIdx(i); setFlipped(false); setSelectedAnswer(null); setAnswered(false); }}
            className={`h-1.5 rounded-full transition-all ${i === cardIdx ? "w-6 bg-clinical-teal" : "w-1.5 bg-slate-300"}`} />
        ))}
      </div>
    </div>
  );
}