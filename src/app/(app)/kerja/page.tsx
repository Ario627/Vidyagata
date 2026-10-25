import { Briefcase, Search } from "lucide-react";
import type { Metadata, Route } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { PageShell } from "@/components/app/page-shell";
import { Mascot } from "@/components/brand/brand";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard } from "@/components/work/job-card";
import { getJobCatalog } from "@/data/jobs";
import { matchesJobQuery, tokenizeJobQuery } from "@/domain/work/search";

export const metadata: Metadata = {
  title: "Kerja",
  description:
    "Lowongan part-time dan project-based untuk mahasiswa, dikurasi tim Vidyagata.",
};

const QUERY_MAX_LENGTH = 60;

function normalizeQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().slice(0, QUERY_MAX_LENGTH);
}

function CatalogEmptyState() {
  return (
    <EmptyState
      icon={Briefcase}
      title="Katalog sedang dikurasi"
      description="Setiap lowongan diperiksa tim Vidyagata sebelum tayang. Lowongan batch pertama akan muncul di halaman ini."
      action={
        <Link
          href={"/cek-kelayakan" as Route}
          className={buttonVariants({ variant: "secondary" })}
        >
          Hitung estimasi cicilan
        </Link>
      }
    />
  );
}

function NoMatchesEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      illustration={
        <Mascot
          name="telusuri"
          sizes="128px"
          className="mascot-float h-28 w-auto"
        />
      }
      title={`Tidak ada lowongan untuk "${query}"`}
      description="Coba kata kunci lain, atau lihat seluruh katalog."
      action={
        <Link
          href={"/kerja" as Route}
          className={buttonVariants({ variant: "secondary" })}
        >
          Hapus pencarian
        </Link>
      }
    />
  );
}

function SearchField({ query }: { query: string }) {
  return (
    <Form action={"/kerja" as Route} className="relative">
      <label htmlFor="kerja-search" className="sr-only">
        Cari lowongan
      </label>
      <Search
        aria-hidden="true"
        strokeWidth={1.8}
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground-subtle"
      />
      <Input
        id="kerja-search"
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Cari posisi, keterampilan, atau kota"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 rounded-lg pr-4 pl-10 text-sm"
      />
    </Form>
  );
}

function FeedSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <Skeleton className="h-11 rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    </div>
  );
}

async function JobFeed({
  searchParams,
}: {
  searchParams: PageProps<"/kerja">["searchParams"];
}) {
  const params = await searchParams;
  const query = normalizeQuery(params.q);
  const catalog = await getJobCatalog();
  const tokens = tokenizeJobQuery(query);
  const matches = catalog.filter((posting) => matchesJobQuery(posting, tokens));

  return (
    <div className="flex flex-col gap-4">
      <SearchField query={query} />
      {catalog.length === 0 ? (
        <CatalogEmptyState />
      ) : matches.length === 0 ? (
        <NoMatchesEmptyState query={query} />
      ) : (
        <>
          <p className="text-2xs text-foreground-subtle">
            {query === ""
              ? `${matches.length} lowongan aktif`
              : `${matches.length} hasil untuk "${query}"`}
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {matches.map((posting) => (
              <li key={posting.id}>
                <JobCard posting={posting} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TipsCard() {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="pb-3">
        <CardTitle>Supaya lamaranmu dilirik</CardTitle>
      </CardContent>
      <CardContent>
        <ol className="flex flex-col divide-y divide-border text-xs leading-5 text-foreground-muted">
          <li className="py-2.5 first:pt-0">
            Siapkan CV satu halaman — cukup pengalaman, skill, dan jadwal
            kuliahmu.
          </li>
          <li className="py-2.5">
            Pilih lowongan yang jam kerjanya tidak bertabrakan dengan kelas.
          </li>
          <li className="py-2.5 last:pb-0">
            Cek status lamaran kapan saja di halaman Lamaran.
          </li>
        </ol>
      </CardContent>
      <CardContent className="border-border border-t pt-3">
        <Link
          href={"/kerja/lamaran" as Route}
          className="text-xs font-semibold text-primary hover:text-primary-hover"
        >
          Lihat lamaran saya
        </Link>
      </CardContent>
    </Card>
  );
}

export default function KerjaPage({ searchParams }: PageProps<"/kerja">) {
  return (
    <PageShell
      eyebrow="Earn2Study"
      title="Kerja"
      description="Lowongan part-time dan project-based untuk mahasiswa, diverifikasi sebelum tayang."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <section className="min-w-0">
          <Suspense fallback={<FeedSkeleton />}>
            <JobFeed searchParams={searchParams} />
          </Suspense>
        </section>
        <aside className="flex flex-col gap-4">
          <TipsCard />
        </aside>
      </div>
    </PageShell>
  );
}
