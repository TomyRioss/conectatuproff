export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Valida tipo y tamaño de una imagen subida. El `file.type` declarado por el
 * cliente es spoofable pero es la mejor señal disponible sin parsear magic
 * bytes; la extensión del filename nunca se usa (controlable por el cliente).
 * Devuelve null si es válida o un mensaje de error.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Formato no permitido. Usá JPG, PNG o WebP.";
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return "La imagen supera el máximo de 5MB.";
  }
  return null;
}

/** Extensión fija y segura derivada del MIME validado. */
export function extForImageType(type: string): string {
  return EXT_BY_TYPE[type] ?? "jpg";
}
