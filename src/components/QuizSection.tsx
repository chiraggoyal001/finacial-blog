import React, { useState, useMemo, useEffect, useRef } from "react";
import { Brain, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trophy, Target, Zap, Award, RotateCcw, Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useSubmitQuiz, QuizSubmissionResult } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface QuizSectionProps {
  questions: QuizQuestion[];
  quizId?: string;
  variant?: "default" | "junior";
}

type AnswerValue = string | string[];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const QuizSection: React.FC<QuizSectionProps> = ({ questions, quizId, variant = "default" }) => {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submissionData, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  const submitQuiz = useSubmitQuiz();

  const isJunior = variant === "junior";

  useEffect(() => {
    if (!started || submitted) return;

    let lastTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const delta = Math.floor((now - lastTime) / 1000);
      if (delta > 0) {
        setElapsed(tt => tt + delta);
        lastTime = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastTime = Date.now();
      } else {
        tick();
      }
    };

    timerRef.current = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [started, submitted]);

  const isCorrectFn = React.useCallback((question: QuizQuestion): boolean => {
    const answer = answers[question.id];
    const type = question.type || "mcq";
    if (!answer) return false;
    if (type === "fill-blank") return (answer as string).trim().toLowerCase() === (question.correctAnswer || "").trim().toLowerCase();
    if (type === "multi-select") {
      const selected = answer as string[];
      const correctLabels = question.options.filter(o => o.isCorrect).map(o => o.label).sort();
      return JSON.stringify([...selected].sort()) === JSON.stringify(correctLabels);
    }
    return question.options.find(o => o.label === answer)?.isCorrect || false;
  }, [answers]);

  const score = useMemo(() => {
    if (!submitted || !questions || questions.length === 0) return 0;
    return questions.filter(isCorrectFn).length;
  }, [submitted, questions, isCorrectFn]);

  if (!questions || questions.length === 0) return null;

  const q = questions[currentIndex];
  const qType = q.type || "mcq";
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const scorePercent = Math.round((score / questions.length) * 100);

  const allAnswered = questions.every(qq => {
    const a = answers[qq.id];
    if (!a) return false;
    if (Array.isArray(a)) return a.length > 0;
    return (a as string).trim() !== "";
  });

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    setShowResults(true);

    if (isLoggedIn) {
      try {
        const result = await submitQuiz.mutateAsync({
          quizId: quizId || questions[0]?.id || 'unknown',
          score,
          total: questions.length
        });
        setSubmissionResult(result);
      } catch (err) {
        console.error("Failed to submit quiz result:", err);
        toast.error("Couldn't save your progress, but great job finishing!");
      }
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setCurrentIndex(0);
    setElapsed(0);
    setStarted(false);
  };

  if (!started) {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
          {isJunior ? t("quiz.juniorTitle") : t("quiz.title")}
        </h3>
        <div className="relative rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 space-y-3 blur-sm select-none pointer-events-none opacity-50">
            <p className="text-sm font-medium text-foreground">{questions[0].question}</p>
            {questions[0].options.slice(0, 3).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-muted/50" />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <div className={`inline-flex items-center justify-center h-14 w-14 rounded-full ${isJunior ? "bg-secondary/10" : "bg-primary/10"}`}>
                <Timer className={`h-7 w-7 ${isJunior ? "text-secondary" : "text-primary"}`} />
              </div>
              <p className="font-display font-bold text-foreground text-lg">{t("quiz.readyToBegin")}</p>
              <p className="text-sm text-muted-foreground">{questions.length} {t("quiz.questionsCount")} • {t("quiz.timedAttempt")}</p>
              <Button onClick={() => setStarted(true)} className={`gap-2 ${isJunior ? "bg-secondary hover:bg-secondary/90" : ""}`}>
                <Play className="h-4 w-4" /> {t("quiz.startAttempt")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && submitted) {
    const emoji = scorePercent === 100 ? "🏆" : scorePercent >= 75 ? "🔥" : scorePercent >= 50 ? "👏" : "💪";
    const message = scorePercent === 100 ? t("quiz.perfectScore") : scorePercent >= 75 ? t("quiz.excellent") : scorePercent >= 50 ? t("quiz.goodEffort") : t("quiz.keepLearning");
    const streakBars = questions.map((qq) => isCorrectFn(qq));

    return (
      <div className="space-y-5">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
          {isJunior ? t("quiz.juniorResults") : t("quiz.results")}
        </h3>
        <div className={`rounded-2xl border p-6 text-center space-y-4 ${scorePercent === 100 ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"}`}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">{emoji}</span>
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={scorePercent >= 75 ? "hsl(var(--primary))" : scorePercent >= 50 ? "hsl(40 100% 50%)" : "hsl(0 80% 60%)"}
                  strokeWidth="8" strokeLinecap="round" strokeDasharray={`${scorePercent * 2.64} 264`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-foreground">{score}/{questions.length}</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">{message}</p>
          </div>

          {/* Gamification Stats */}
          {submissionData && (
            <div className="py-2 px-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-600">
                    <Zap className="h-4 w-4 fill-current" />
                  </div>
                  <span className="text-sm font-bold text-foreground">XP Earned</span>
                </div>
                <span className="text-lg font-black text-amber-600">+{submissionData.xp_awarded}</span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Your Global Rank</span>
                  <span className="text-primary">Top {100 - submissionData.percentile}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out"
                    style={{ width: `${submissionData.percentile}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-left">
                  You are performing better than {submissionData.percentile}% of learners!
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>{t("quiz.time")} <strong className="text-foreground">{formatTime(elapsed)}</strong></span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">{t("quiz.breakdown")}</p>
            <div className="flex items-center justify-center gap-1">
              {streakBars.map((correct, i) => (
                <div key={i} className={`h-6 rounded-sm flex items-center justify-center text-[10px] font-bold text-white transition-all ${correct ? "bg-green-500" : "bg-red-400"}`}
                  style={{ width: `${Math.max(100 / questions.length, 20)}%`, maxWidth: "48px" }}>{correct ? "✓" : "✗"}</div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-green-600"><CheckCircle2 className="h-4 w-4" /><span className="font-medium">{score} {t("quiz.correct")}</span></div>
            <div className="flex items-center gap-1.5 text-red-500"><XCircle className="h-4 w-4" /><span className="font-medium">{questions.length - score} {t("quiz.wrong")}</span></div>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {scorePercent === 100 && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium border border-yellow-500/20"><Trophy className="h-3 w-3" /> {t("quiz.flawless")}</span>}
            {scorePercent >= 75 && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"><Target className="h-3 w-3" /> {t("quiz.sharpMind")}</span>}
            {allAnswered && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-500/20"><Zap className="h-3 w-3" /> {t("quiz.completed")}</span>}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> {t("quiz.retry")}</Button>
            <Button size="sm" onClick={() => setShowResults(false)} className={isJunior ? "bg-secondary hover:bg-secondary/90" : ""}>{t("quiz.reviewAnswers")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedAnswer = answers[q.id];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
          {isJunior ? t("quiz.juniorTitle") : t("quiz.title")}
        </h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono"><Timer className="h-3.5 w-3.5" /> {formatTime(elapsed)}</span>
          <span className="text-xs text-muted-foreground font-mono">{currentIndex + 1} / {questions.length}</span>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className={`p-5 rounded-xl border space-y-4 ${submitted ? isCorrectFn(q) ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5" : "border-border bg-card"}`}>
        <div className="flex items-start gap-2">
          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold flex-shrink-0 ${isJunior ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}`}>{currentIndex + 1}</span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{q.question}</p>
            <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              qType === "mcq" ? "bg-blue-500/10 text-blue-600" : qType === "true-false" ? "bg-purple-500/10 text-purple-600" : qType === "fill-blank" ? "bg-orange-500/10 text-orange-600" : "bg-teal-500/10 text-teal-600"
            }`}>
              {qType === "mcq" ? t("quiz.mcq") : qType === "true-false" ? t("quiz.trueFalse") : qType === "fill-blank" ? t("quiz.fillBlank") : t("quiz.multiSelect")}
            </span>
          </div>
        </div>

        {(qType === "mcq" || qType === "true-false") && (
          <RadioGroup value={(selectedAnswer as string) || ""} onValueChange={(val) => { if (!submitted) setAnswers(prev => ({ ...prev, [q.id]: val })); }} className="space-y-2">
            {q.options.map((opt, oi) => {
              const isSelected = selectedAnswer === opt.label;
              const showCorrect = submitted && opt.isCorrect;
              const showWrong = submitted && isSelected && !opt.isCorrect;
              return (
                <div key={oi} className={`flex items-center p-2 rounded-lg transition-colors ${submitted ? "" : isSelected ? "bg-primary/5" : "hover:bg-accent/50"}`}>
                  <Label htmlFor={`${q.id}-${oi}`} className={`flex items-center gap-3 cursor-pointer flex-1 ${showCorrect ? "text-green-600 font-medium" : showWrong ? "text-red-500 line-through" : "text-foreground"}`}>
                    <RadioGroupItem value={opt.label} id={`${q.id}-${oi}`} disabled={submitted} />
                    <span className="text-sm flex items-center gap-1.5">
                      {opt.label}
                      {showCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                      {showWrong && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    </span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {qType === "multi-select" && (
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = (selectedAnswer as string[]) || [];
              const isChecked = selected.includes(opt.label);
              const showCorrect = submitted && opt.isCorrect;
              const showWrong = submitted && isChecked && !opt.isCorrect;
              return (
                <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${submitted ? "" : isChecked ? "bg-primary/5" : "hover:bg-accent/50"}`}>
                  <Checkbox id={`${q.id}-${oi}`} checked={isChecked} disabled={submitted}
                    onCheckedChange={(checked) => {
                      if (submitted) return;
                      setAnswers(prev => {
                        const current = (prev[q.id] as string[]) || [];
                        return { ...prev, [q.id]: checked ? [...current, opt.label] : current.filter(l => l !== opt.label) };
                      });
                    }} />
                  <Label htmlFor={`${q.id}-${oi}`} className={`text-sm cursor-pointer flex items-center gap-1.5 ${showCorrect ? "text-green-600 font-medium" : showWrong ? "text-red-500 line-through" : "text-foreground"}`}>
                    {opt.label}
                    {showCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                    {showWrong && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                  </Label>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground">{t("quiz.selectAll")}</p>
          </div>
        )}

        {qType === "fill-blank" && (
          <div className="space-y-2">
            <Input placeholder={t("quiz.typeAnswer")} value={(selectedAnswer as string) || ""} disabled={submitted}
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              className={submitted ? isCorrectFn(q) ? "border-green-500 text-green-600" : "border-red-500 text-red-500" : ""} />
            {submitted && !isCorrectFn(q) && (
              <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t("quiz.correctAnswer")} {q.correctAnswer}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {currentIndex > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setCurrentIndex(i => i - 1)} className="gap-1"><ChevronLeft className="h-4 w-4" /> {t("quiz.previous")}</Button>
        ) : <div />}
        {currentIndex < questions.length - 1 ? (
          <Button size="sm" onClick={() => setCurrentIndex(i => i + 1)} className={`gap-1 ${isJunior ? "bg-secondary hover:bg-secondary/90" : ""}`}>{t("quiz.next")} <ChevronRight className="h-4 w-4" /></Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={!allAnswered || submitted} className={`gap-1 ${isJunior ? "bg-secondary hover:bg-secondary/90" : ""}`}><Award className="h-4 w-4" /> {t("quiz.submitQuiz")}</Button>
        )}
      </div>
    </div>
  );
};

export default QuizSection;
