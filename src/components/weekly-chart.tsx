"use client";

import type { DayCount } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function WeeklyChart({
  data,
  className,
}: {
  data: DayCount[];
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className={cn("flex h-40 items-end justify-between gap-2", className)}>
      {data.map((day) => (
        <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground">
            {day.count > 0 ? day.count : ""}
          </span>
          <div className="flex h-28 w-full items-end rounded-md">
            <div
              className={cn(
                "w-full rounded-md transition-all duration-500",
                day.count > 0
                  ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                  : "bg-muted",
              )}
              style={{
                height: `${Math.max((day.count / max) * 100, day.count > 0 ? 12 : 4)}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{day.label}</span>
        </div>
      ))}
    </div>
  );
}
