import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import { defaultLandingPath } from "@/data/roles";
import { safeNextPath } from "@/lib/next-path";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke Vidyagata dengan email dan kata sandi yang kamu pakai saat mendaftar.",
};

export const instant = false;

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const user = await getCurrentUser();
  if (user !== null) {
    redirect((nextPath ?? (await defaultLandingPath())) as Route);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Masuk ke Vidyagata
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Masuk dengan email dan kata sandi yang kamu pakai saat mendaftar.
        </p>
      </header>
      <EmailSignIn nextPath={nextPath} />
      <p className="text-sm text-foreground-muted">
        Belum punya akun?{" "}
        <Link
          href={{ pathname: "/daftar" }}
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Daftar akun baru
        </Link>
      </p>
    </div>
  );
}
