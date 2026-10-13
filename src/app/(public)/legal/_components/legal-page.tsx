import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type LegalSection = {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly items?: readonly string[];
  readonly closing?: string;
};

type LegalRelated = {
  readonly href: Route;
  readonly label: string;
};

type LegalPageProps = {
  readonly title: string;
  readonly intro: string;
  readonly version: string;
  readonly updatedAt: string;
  readonly summary: readonly string[];
  readonly sections: readonly LegalSection[];
  readonly related: readonly LegalRelated[];
};

function LegalNotice() {
  return (
    <div className="rounded-lg bg-warning-soft px-4 py-3">
      <p className="text-sm leading-6 text-warning">
        <span className="font-semibold">Naskah ini masih draf</span> dan
        menunggu review hukum sebelum berlaku penuh. Untuk saat ini, jangan
        jadikan dokumen ini satu-satunya dasar keputusan finansial.
      </p>
    </div>
  );
}

function LegalSummary({ items }: { items: readonly string[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
        Ringkasan singkat
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 text-sm leading-6 text-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalToc({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <nav aria-label="Isi dokumen">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="block whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-foreground lg:whitespace-normal lg:rounded-md lg:border-transparent lg:px-2.5 lg:py-1.5 lg:text-sm"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} className="scroll-mt-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {section.title}
      </h2>
      <div className="mt-3 flex flex-col gap-3">
        {section.paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className="text-sm leading-7 text-foreground-muted"
          >
            {paragraph}
          </p>
        ))}
      </div>
      {section.items === undefined ? null : (
        <ul className="mt-3 flex flex-col gap-2">
          {section.items.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 text-sm leading-6 text-foreground-muted"
            >
              <span
                aria-hidden="true"
                className="mt-2.5 size-1.5 shrink-0 rounded-full bg-border-strong"
              />
              {item}
            </li>
          ))}
        </ul>
      )}
      {section.closing === undefined ? null : (
        <p className="mt-3 text-sm leading-7 text-foreground-muted">
          {section.closing}
        </p>
      )}
    </section>
  );
}

function LegalPage({
  title,
  intro,
  version,
  updatedAt,
  summary,
  sections,
  related,
}: LegalPageProps) {
  return (
    <article className="mx-auto w-full max-w-5xl px-4 pt-10 pb-16 sm:px-6 lg:pt-16 lg:pb-24">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
            Legal
          </p>
          <Badge variant="warning">Menunggu review hukum</Badge>
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-balance text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-pretty text-foreground-muted">
          {intro}
        </p>
        <p className="mt-3 text-xs text-foreground-subtle">
          {version} · Diperbarui {updatedAt}
        </p>
      </header>
      <div className="mt-6 max-w-2xl">
        <LegalNotice />
      </div>
      <div className="mt-6 max-w-2xl">
        <LegalSummary items={summary} />
      </div>
      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,16rem)_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <LegalToc sections={sections} />
        </aside>
        <div className="mt-8 flex max-w-2xl flex-col gap-10 lg:mt-0">
          {sections.map((section) => (
            <LegalSectionBlock key={section.id} section={section} />
          ))}
        </div>
      </div>
      <footer className="mt-12 border-border border-t pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Dokumen lain
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {related.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}

export { LegalPage };
export type { LegalSection };