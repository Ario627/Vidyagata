import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MASCOTS = {
  sapa: { src: "/brand/mascot-sapa.webp", width: 603, height: 731 },
  tanya: { src: "/brand/mascot-tanya.webp", width: 555, height: 708 },
  ceria: { src: "/brand/mascot-ceria.webp", width: 640, height: 731 },
  telusuri: { src: "/brand/mascot-telusuri.webp", width: 640, height: 700 },
} as const;

export type MascotName = keyof typeof MASCOTS;

type MascotProps = {
  readonly name: MascotName;
  readonly sizes: string;
  readonly className?: string | undefined;
  readonly eager?: boolean | undefined;
};

function Mascot({ name, sizes, className, eager = false }: MascotProps) {
  const mascot = MASCOTS[name];
  return (
    <Image
      src={mascot.src}
      alt=""
      width={mascot.width}
      height={mascot.height}
      sizes={sizes}
      quality={75}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      data-slot="mascot"
      className={cn("select-none", className)}
    />
  );
}

const LOGO = { src: "/brand/logo-vidyagata.webp", width: 512, height: 145 };

type BrandLogoProps = {
  readonly className?: string | undefined;
  readonly eager?: boolean | undefined;
};

function BrandLogo({ className, eager = false }: BrandLogoProps) {
  return (
    <Image
      src={LOGO.src}
      alt="Vidyagata"
      width={LOGO.width}
      height={LOGO.height}
      sizes="140px"
      quality={75}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      className={cn("w-auto select-none", className)}
    />
  );
}

function BrandMark({ className }: { readonly className?: string }) {
  return (
    <Link
      href={"/dashboard" as Route}
      data-brand-mark=""
      className={cn("flex items-center", className)}
    >
      <BrandLogo eager className="h-7" />
    </Link>
  );
}

export { BrandLogo, BrandMark, Mascot };
export type { BrandLogoProps, MascotProps };
