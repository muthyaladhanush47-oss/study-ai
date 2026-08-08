import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-ink-700 dark:text-ink-300"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full rounded-xl border border-ink-200 bg-card px-3 py-2.5 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-ink-700 dark:bg-card dark:text-ink-100 dark:placeholder:text-ink-500",
          className,
        )}
        {...props}
      />
    </div>
  );
}
