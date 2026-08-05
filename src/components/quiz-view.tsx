"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import type { QuizQuestion } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function QuizView({ documentId }: { documentId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setFinished(false);
    setScore(0);
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, count: 10 }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to generate quiz.");
      setQuestions(body.questions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function answer(optionIndex: number) {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    if (optionIndex === questions[index].correctIndex) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  if (finished) {
    const percent = Math.round((score / Math.max(questions.length, 1)) * 100);
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full text-white",
            percent >= 70
              ? "bg-emerald-500"
              : percent >= 40
                ? "bg-amber-500"
                : "bg-red-500",
          )}
        >
          <span className="text-xl font-bold">{percent}%</span>
        </div>
        <h2 className="text-xl font-bold">
          You scored {score} / {questions.length}
        </h2>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          {percent >= 70
            ? "Great work! Review the explanations you missed and try again to lock it in."
            : percent >= 40
              ? "Not bad — go back over the summaries and take the quiz again."
              : "Keep studying. Regenerate the quiz after reviewing your notes."}
        </p>
        <Button onClick={generate} loading={loading}>
          <RotateCcw className="h-4 w-4" />
          Retake quiz
        </Button>
      </Card>
    );
  }

  if (questions.length > 0) {
    const q = questions[index];
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Question {index + 1} of {questions.length}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${((index + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {Math.round(((index + 1) / questions.length) * 100)}%
            </span>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold leading-relaxed">{q.question}</h2>
          <div className="mt-5 space-y-2.5">
            {q.options.map((option, i) => {
              const isCorrect = i === q.correctIndex;
              const isSelected = i === selected;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={answered}
                  onClick={() => answer(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    !answered &&
                      "border-zinc-200 hover:border-brand-400 hover:bg-brand-50 dark:border-zinc-700 dark:hover:border-brand-600 dark:hover:bg-brand-950",
                    answered &&
                      isCorrect &&
                      "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
                    answered &&
                      isSelected &&
                      !isCorrect &&
                      "border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/50 dark:text-red-300",
                    answered &&
                      !isCorrect &&
                      !isSelected &&
                      "border-zinc-200 opacity-60 dark:border-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs",
                      answered && isCorrect
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : answered && isSelected && !isCorrect
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-zinc-300 dark:border-zinc-600",
                    )}
                  >
                    {answered && isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : answered && isSelected && !isCorrect ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          {answered && q.explanation && (
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-zinc-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-zinc-300">
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                Explanation:{" "}
              </span>
              {q.explanation}
            </div>
          )}

          {answered && (
            <div className="mt-5 flex justify-end">
              <Button onClick={next}>
                {index + 1 >= questions.length ? "See results" : "Next question"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-lg">
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <ListChecks className="h-7 w-7" />
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold">Generate a practice quiz</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Test yourself with 10 multiple-choice questions created from your
          notes, complete with instant feedback and explanations.
        </p>
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}
      <Button onClick={generate} loading={loading}>
        {loading ? "Generating…" : "Generate quiz"}
      </Button>
    </Card>
  );
}
