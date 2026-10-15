import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RequestResetForm } from "@/components/auth/request-reset-form";
import { defaultLandingPath } from "@/data/roles";
import { captchaSettings } from "@/lib/captcha";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Lupa kata sandi",
  description:
    "Minta tautan untuk membuat kata sandi baru untuk akun Vidyagata-mu.",
};

export const instant = false;

export default async function LupaAksesPage() {
  const user = await getCurrentUser();
  if (user !== null) {
    redirect((await defaultLandingPath()) as Route);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Lupa kata sandi?
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Kami kirim tautan sekali pakai ke emailmu untuk membuat kata sandi
          baru.
        </p>
      </header>
      <RequestResetForm captchaSiteKey={captchaSettings().siteKey} />
      <p className="text-sm text-foreground-muted">
        Ingat kata sandimu?{" "}
        <Link
          href="/masuk"
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Kembali masuk
        </Link>
      </p>
    </div>
  );
}