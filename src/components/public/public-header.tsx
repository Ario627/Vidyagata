import Link from "next/link";
import { Route } from "next";

function PublicHeader() {
  return (
    <header data-slot="public-header" className="border-border border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Vidyagata
        </Link>
        <Link
          href={"/masuk" as Route }
          className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Masuk
        </Link>
      </div>
    </header>
  );
}

export { PublicHeader };