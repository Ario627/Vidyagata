"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type InstitutionOption = {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly province: string;
};

export type StudentProfileDefaults = {
  readonly fullName?: string;
  readonly academicStatus?: string;
  readonly institutionId?: string | null;
  readonly currentSemester?: number | null;
  readonly gpaHundredths?: number | null;
  readonly province?: string;
  readonly city?: string;
  readonly addressLine?: string | null;
  readonly hobby?: string | null;
  readonly bio?: string | null;
};

type StudentProfileFormProps = {
  readonly institutions: readonly InstitutionOption[];
  readonly defaults?: StudentProfileDefaults | undefined;
  readonly onSaved?: () => void;
  readonly afterSavePath?: Route;
  readonly submitLabel?: string;
};

type FieldErrors = Readonly<Record<string, string>>;

const STATUS_OPTIONS = [
  { value: "undergraduate", label: "Mahasiswa aktif" },
  { value: "high_school", label: "Siswa SMA/SMK" },
  { value: "graduated", label: "Sudah lulus" },
  { value: "dropout", label: "Berhenti studi" },
] as const;

function gpaText(hundredths: number | null | undefined): string {
  if (hundredths === null || hundredths === undefined) return "";
  return (hundredths / 100).toFixed(2).replace(".", ",");
}

function SelectLabel({ children }: { readonly children: string }) {
  return (
    <span className="text-sm font-medium text-foreground">{children}</span>
  );
}

function FieldErrorText({ message }: { readonly message: string | undefined }) {
  if (message === undefined) return null;
  return <span className="text-sm text-danger">{message}</span>;
}

function SectionTitle({ children }: { readonly children: string }) {
  return (
    <h2 className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
      {children}
    </h2>
  );
}

function StudentProfileForm({
  institutions,
  defaults,
  onSaved,
  afterSavePath,
  submitLabel = "Simpan & lanjut",
}: StudentProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaults?.fullName ?? "");
  const [academicStatus, setAcademicStatus] = useState(
    defaults?.academicStatus ?? "undergraduate",
  );
  const [institutionId, setInstitutionId] = useState(
    defaults?.institutionId ?? "",
  );
  const [semester, setSemester] = useState(
    defaults?.currentSemester === null ||
      defaults?.currentSemester === undefined
      ? ""
      : String(defaults.currentSemester),
  );
  const [gpa, setGpa] = useState(gpaText(defaults?.gpaHundredths));
  const [province, setProvince] = useState(defaults?.province ?? "");
  const [city, setCity] = useState(defaults?.city ?? "");
  const [addressLine, setAddressLine] = useState(defaults?.addressLine ?? "");
  const [hobby, setHobby] = useState(defaults?.hobby ?? "");
  const [bio, setBio] = useState(defaults?.bio ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormIssue(null);
    setPending(true);
    let result: { ok?: boolean; message?: string; errors?: FieldErrors } = {};
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          academicStatus,
          institutionId: institutionId === "" ? null : institutionId,
          currentSemester: semester === "" ? null : Number(semester),
          gpa: gpa.trim() === "" ? null : gpa.trim(),
          province,
          city,
          addressLine: addressLine.trim() === "" ? null : addressLine.trim(),
          hobby: hobby.trim() === "" ? null : hobby.trim(),
          bio: bio.trim() === "" ? null : bio.trim(),
        }),
      });
      result = (await response.json()) as typeof result;
    } catch {
      result = { ok: false, message: "Koneksi terputus. Coba lagi." };
    }
    setPending(false);
    if (result.ok !== true) {
      setErrors(result.errors ?? {});
      if (result.message !== undefined) setFormIssue(result.message);
      return;
    }
    setErrors({});
    if (onSaved !== undefined) {
      onSaved();
      return;
    }
    router.refresh();
    if (afterSavePath !== undefined) router.push(afterSavePath);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <SectionTitle>Data akademik</SectionTitle>
        <label className="flex flex-col gap-2">
          <SelectLabel>Status</SelectLabel>
          <select
            name="academicStatus"
            value={academicStatus}
            onChange={(event) => setAcademicStatus(event.target.value)}
            className={cn(inputClassName, "appearance-none pr-8")}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <SelectLabel>Kampus / sekolah</SelectLabel>
          <select
            name="institutionId"
            value={institutionId}
            onChange={(event) => setInstitutionId(event.target.value)}
            className={cn(inputClassName, "appearance-none pr-8")}
          >
            <option value="">Belum dipilih</option>
            {institutions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.city}
              </option>
            ))}
          </select>
          <FieldErrorText message={errors.institutionId} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Semester"
            name="currentSemester"
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            placeholder="5"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            error={errors.currentSemester}
          />
          <TextField
            label="IPK terakhir"
            name="gpa"
            inputMode="decimal"
            placeholder="3,45"
            value={gpa}
            onChange={(event) => setGpa(event.target.value)}
            error={errors.gpa}
          />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <SectionTitle>Tentang kamu</SectionTitle>
        <TextField
          label="Nama lengkap"
          name="fullName"
          autoComplete="name"
          placeholder="Nama sesuai KTP"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
          description="Dipakai di perjanjian dan surat pernyataan."
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Provinsi"
            name="province"
            autoComplete="address-level1"
            placeholder="Jawa Barat"
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            error={errors.province}
          />
          <TextField
            label="Kota"
            name="city"
            autoComplete="address-level2"
            placeholder="Depok"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            error={errors.city}
          />
        </div>
        <TextField
          label="Alamat"
          name="addressLine"
          autoComplete="street-address"
          placeholder="Jalan, nomor, RT/RW (opsional)"
          value={addressLine}
          onChange={(event) => setAddressLine(event.target.value)}
          error={errors.addressLine}
        />
        <TextField
          label="Hobi"
          name="hobby"
          placeholder="Fotografi, futsal, menulis (opsional)"
          value={hobby}
          onChange={(event) => setHobby(event.target.value)}
          error={errors.hobby}
        />
        <label className="flex flex-col gap-2">
          <SelectLabel>Cerita singkat</SelectLabel>
          <textarea
            name="bio"
            rows={3}
            maxLength={280}
            placeholder="Ceritakan sedikit tentang dirimu, cita-cita, atau hal yang kamu kejar (opsional)"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className={cn(inputClassName, "h-auto py-2.5 leading-6")}
          />
          <FieldErrorText message={errors.bio} />
        </label>
      </section>
      {formIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {formIssue}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  );
}

export { StudentProfileForm };