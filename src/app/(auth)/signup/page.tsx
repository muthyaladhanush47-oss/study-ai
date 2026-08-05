import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignupPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return <AuthForm mode="signup" />;
}
