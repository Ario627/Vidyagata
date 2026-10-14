"use client";

import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function FourEyesExplainer() {
  return (
    <DialogRoot>
      <DialogTrigger className="text-sm font-medium text-info underline-offset-4 transition-colors duration-150 ease-out hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Kenapa mesti dua petugas?
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>Pencairan butuh dua orang</DialogTitle>
          <DialogClose />
        </div>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
          <p>
            Dana hanya berpindah kalau dua petugas berbeda sepakat: satu
            mengajukan, satu memeriksa. Satu orang — termasuk operator — tidak
            bisa memindahkan uang sendirian.
          </p>
          <p>
            Aturan ini ditegakkan langsung oleh database, bukan sekadar tombol
            yang disembunyikan. Memanggil server secara langsung pun tetap
            ditolak.
          </p>
          <p>
            Setiap langkah terekam permanen: siapa mengajukan, siapa menyetujui,
            ke mana dana dikirim, dan nomor bukti transfernya.
          </p>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { FourEyesExplainer };