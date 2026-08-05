import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return <AuthForm mode="login" />;
}
