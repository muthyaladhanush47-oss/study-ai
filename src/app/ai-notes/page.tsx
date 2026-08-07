import { redirect } from "next/navigation";

export const metadata = {
  title: "AI Notes — StudyAI",
  description:
    "Generate beautiful, structured study notes from any PDF or handwritten notes. Free, ad-supported, no subscription.",
};

export default function AiNotesRedirect() {
  redirect("/notes");
}
