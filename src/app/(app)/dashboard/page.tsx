import { BookOpen, FileText, Layers, Sparkles } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { UploadDialog } from "@/components/upload-dialog";
import { DocumentsGrid } from "@/components/documents-grid";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();

  const firstName =
    (user?.user_metadata?.full_name as string)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back,{" "}
            <span className="text-gradient capitalize">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Upload your notes and turn them into study tools.
          </p>
        </div>
        <UploadDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Your study hub</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Every document below can be turned into a chapter summary,
                flashcard deck, practice quiz, or live chat in one click.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">AI generated</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Content is grounded in your uploaded notes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Member since</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {user?.created_at
                  ? formatDate(user.created_at)
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Layers className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Your documents
          </h2>
        </div>
        {user && <DocumentsGrid userId={user.id} />}
      </div>
    </div>
  );
}
