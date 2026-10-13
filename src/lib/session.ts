import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { auth } from "@/lib/auth";

const PATHNAME_HEADER = "x-pathname";

export const getSession = cache(async () => {
  await connection();
  return auth.api.getSession({ headers: await headers() });
});

export const getCurrentUser = cache(
  async () => (await getSession())?.user ?? null,
);

export async function requireUser() {
  const user = await getCurrentUser();
  if (user !== null) return user;

  const pathname = (await headers()).get(PATHNAME_HEADER);
  if (pathname === null || pathname === "/") {
    redirect("/masuk" as never);
  }
  redirect(`/masuk?next=${encodeURIComponent(pathname)}` as never);
}
