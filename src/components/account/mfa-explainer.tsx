"use client";

import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function MfaExplainer() {
  return (
    <DialogRoot>
      <DialogTrigger className="text-sm font-medium text-info underline-offset-4 transition-colors duration-150 ease-out hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Kenapa verifikasi dua langkah?
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>Kata sandi saja tidak cukup</DialogTitle>
          <DialogClose />
        </div>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
          <p>
            Kata sandi bisa bocor lewat situs palsu atau kebocoran data di
            layanan lain. Verifikasi dua langkah menambahkan kode 6 digit dari
            aplikasi autentikator, jadi pencuri tetap tidak bisa masuk walau
            tahu kata sandimu.
          </p>
          <p>
            Vidyagata menolak kode yang sudah pernah dipakai, membatasi
            percobaan berulang, dan mengunci sementara akunmu setelah kode salah
            berkali-kali.
          </p>
          <p>
            Saat pengaturan, kamu menerima kode pemulihan satu kali pakai.
            Simpan di tempat aman — itu satu-satunya jalan masuk kalau
            perangkatmu hilang.
          </p>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { MfaExplainer };
