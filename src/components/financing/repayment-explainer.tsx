"use client";

import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function RepaymentExplainer() {
  return (
    <DialogRoot>
      <DialogTrigger className="shrink-0 text-sm font-medium text-info underline-offset-4 transition-colors duration-150 ease-out hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Bagaimana cicilan dibayar?
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>Cicilan dibayar dari penghasilan kerja</DialogTitle>
          <DialogClose />
        </div>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
          <p>
            Setiap kali kamu menerima penghasilan dari kerja part-time lewat
            mitra usaha, sebagian otomatis dipotong sesuai persentase yang kamu
            pilih. Tidak perlu transfer manual.
          </p>
          <p>
            Sebelum pemotongan pertama, kamu menandatangani mandat pemotongan —
            dokumen terpisah dari perjanjian pembiayaan, dengan persetujuan
            eksplisit darimu.
          </p>
          <p>
            Kalau ada cicilan yang terlewat, masa tenggang dan dendanya
            mengikuti yang tertulis di perjanjian. Tidak ada biaya kejutan.
          </p>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { RepaymentExplainer };
