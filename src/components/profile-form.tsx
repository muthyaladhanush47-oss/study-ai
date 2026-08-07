"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Save } from "lucide-react";
import type { LearningLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const levels: { value: LearningLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "Brand new to the topic" },
  { value: "intermediate", label: "Intermediate", hint: "Know the basics" },
  { value: "advanced", label: "Advanced", hint: "Deep mastery desired" },
];

export function ProfileForm() {
  const [displayName, setDisplayName] = useState("");
  const [level, setLevel] = useState<LearningLevel>("beginner");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        const p = data.profile;
        if (p) {
          setDisplayName(p.display_name ?? "");
          setLevel(p.learning_level ?? "beginner");
          setGoal(p.goal ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          learning_level: level,
          goal,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save.");
      }
      setMessage("Saved — your AI tutor will adapt to these settings.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="display-name" className="text-sm font-medium">
          Display name
        </label>
        <Input
          id="display-name"
          placeholder="e.g. Ananya"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          <GraduationCap className="h-4 w-4 text-primary" />
          Learning level
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {levels.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLevel(option.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                level === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-muted/50",
              )}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {option.hint}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="goal" className="text-sm font-medium">
          Study goal <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="goal"
          rows={3}
          placeholder="e.g. Pass my biology midterm with an A"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="nice-scroll w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          The AI tutor uses these to tailor explanations and practice questions.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={saving}>
          <Save className="h-4 w-4" />
          Save settings
        </Button>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
