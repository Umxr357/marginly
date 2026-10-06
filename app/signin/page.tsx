import type { Metadata } from "next";
import { AuthForm } from "../components/auth-form";
import "../auth.css";

export const metadata: Metadata = {
  title: "Sign in — Marginly",
  description: "A home for your words and the stories you want to keep.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string | string[] }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      returnTo={typeof params.return_to === "string" ? params.return_to : "/"}
    />
  );
}
