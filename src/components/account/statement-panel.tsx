"use client";

import { useEffect, useState } from "react";
import { StatementBody } from "@/components/account/statement-body";
import { StatementSignForm } from "@/components/account/statement-sign-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StatementState } from "@/data/documents";

type StatementPanelProps = {
  readonly onSigned: () => void;
};

type StatementSetters = {
  readonly setState: (state: StatementState | null) => void;
  readonly setLoading: (loading: boolean) => void;
};

async function fetchStatement(setters: StatementSetters): Promise<void> {
  try {
    const response = await fetch("/api/statement", {
      credentials: "same-origin",
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      statement?: StatementState | null;
    };
    setters.setState(payload.ok === true ? (payload.statement ?? null) : null);
  } catch {
    setters.setState(null);
  } finally {
    setters.setLoading(false);
  }
}

function useStatementState(): {
  loading: boolean;
  state: StatementState | null;
  reload: () => void;
} {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<StatementState | null>(null);
  useEffect(() => {
    let active = true;
    void fetchStatement({
      setState: (value) => {
        if (active) setState(value);
      },
      setLoading: (value) => {
        if (active) setLoading(value);
      },
    });
    return () => {
      active = false;
    };
  }, []);
  return {
    loading,
    state,
    reload: () => {
      setLoading(true);
      void fetchStatement({ setState, setLoading });
    },
  };
}

function StatementPanel({ onSigned }: StatementPanelProps) {
  const { loading, state, reload } = useStatementState();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-foreground-muted">Memuat surat...</p>
        </CardContent>
      </Card>
    );
  }

  if (state === null) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">
            Surat pernyataan
          </p>
          <p className="text-xs leading-5 text-foreground-muted">
            Lengkapi profil akademik dulu — surat pernyataan dibuat dari data
            profilmu.
          </p>
        </CardContent>
      </Card>
    );
  }

  const signed = state.signedAt !== null;

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            Surat pernyataan
          </p>
          <p className="text-xs leading-5 text-foreground-muted">
            {signed
              ? `Ditandatangani oleh ${state.signedName ?? ""}.`
              : "Baca suratnya, lalu gambar tanda tanganmu langsung di sini."}
          </p>
        </div>
        <Badge variant={signed ? "success" : "warning"}>
          {signed ? "Ditandatangani" : "Belum"}
        </Badge>
      </CardContent>
      <CardContent className="pt-0">
        <DialogRoot open={open} onOpenChange={setOpen}>
          <DialogTrigger className="h-11 w-full rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {signed ? "Lihat surat" : "Baca surat & tanda tangan"}
          </DialogTrigger>
          <DialogContent>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>Surat pernyataan</DialogTitle>
              <DialogClose />
            </div>
            <div className="mt-4 flex flex-col gap-5">
              <StatementBody state={state} />
              {signed ? null : (
                <StatementSignForm
                  onSigned={() => {
                    setOpen(false);
                    reload();
                    onSigned();
                  }}
                />
              )}
            </div>
          </DialogContent>
        </DialogRoot>
      </CardContent>
    </Card>
  );
}

export { StatementPanel };
