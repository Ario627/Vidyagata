"use client";

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;
const PRESERVED_TYPES: readonly string[] = ["application/pdf"];

async function drawToBlob(
  source: ImageBitmap,
): Promise<{ blob: Blob | null; width: number; height: number }> {
  const scale = Math.min(
    1,
    MAX_EDGE_PX / Math.max(source.width, source.height),
  );
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) return { blob: null, width, height };
  context.drawImage(source, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
  return { blob, width, height };
}

export async function compressImageFile(file: File): Promise<File> {
  if (PRESERVED_TYPES.includes(file.type)) return file;
  if (!file.type.startsWith("image/")) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const { blob } = await drawToBlob(bitmap);
    if (blob === null) return file;
    if (blob.size >= file.size && file.type === "image/jpeg") return file;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
