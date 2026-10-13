import { Briefcase, SearchX } from "lucide-react";
import type { Metadata, Route } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
      icon={SearchX}
      title={`Tidak ada lowongan untuk "${query}"`}
      description="Coba kata kunci lain"
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
    <Form action={"/kerja" as Route}>
      <label htmlFor="kerja-search" className="sr-only">
        Cari lowongan
      </label>
      <Input
        id="kerja-search"
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Cari posisi atau keterampilan"
        autoComplete="off"
        enterKeyHint="search"
        className="rounded-full px-4 text-sm"
      />
    </Form>
  );
}

function FeedSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <Skeleton className="h-11 rounded-full" />
      <Skeleton className="h-44 rounded-xl" />
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

  return (
    <div className="mt-6 flex flex-col gap-4">
      <SearchField query={query} />
      {query === "" ? (
        <CatalogEmptyState />
      ) : (
        <NoMatchesEmptyState query={query} />
      )}
    </div>
  );
}

export default function KerjaPage({ searchParams }: PageProps<"/kerja">) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="Earn2Study"
        title="Kerja"
        description="Lowongan part-time dan project-based untuk mahasiswa, diverifikasi sebelum tayang."
      />
      <Suspense fallback={<FeedSkeleton />}>
        <JobFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
