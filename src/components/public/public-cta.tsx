import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

type PublicCtaProps = {
  readonly title: string;
  readonly body: string;
  readonly href: Route;
  readonly label: string;
};

function PublicCta({ title, body, href, label }: PublicCtaProps) {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="bg-header-gradient mx-auto flex w-full max-w-5xl flex-col items-start gap-6 rounded-2xl px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:py-12">
        <div className="max-w-lg">
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-primary-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-primary-foreground">
            {body}
          </p>
        </div>
        <Link
          href={href}
          className={buttonVariants({
            variant: "inverse",
            size: "lg",
            className: "w-full sm:w-auto",
          })}
        >
          {label}
        </Link>
      </div>
    </section>
  );
}

export { PublicCta };
export type { PublicCtaProps };
