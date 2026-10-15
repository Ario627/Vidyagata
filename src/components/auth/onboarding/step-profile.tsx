"use client";

import {
  type InstitutionOption,
  StudentProfileForm,
} from "@/components/account/student-profile-form";

type StepProfileProps = {
  readonly institutions: readonly InstitutionOption[];
  readonly onNext: () => void;
};

function StepProfile({ institutions, onNext }: StepProfileProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Data akademik & diri
        </p>
        <p className="text-sm leading-6 text-foreground-muted">
          Isi seakurat mungkin — data ini dipakai untuk menilai kelayakan,
          membuat surat pernyataan, dan mencocokkan lowongan kerja yang cocok
          untukmu.
        </p>
      </div>
      <StudentProfileForm institutions={institutions} onSaved={onNext} />
    </div>
  );
}

export { StepProfile };
