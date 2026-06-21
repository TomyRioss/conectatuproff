"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface DniUploadProps {
  label: string;
  onChange: (file: File | null) => void;
  error?: string;
}

export default function DniUpload({ label, onChange, error }: DniUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFile(file: File | null) {
    setLocalError(null);
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLocalError("Solo se aceptan imágenes");
      return;
    }
    if (file.size > MAX_SIZE) {
      setLocalError("Máximo 5MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  }

  const displayError = localError ?? error;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-brand-dark">{label}</span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-brand-bg cursor-pointer",
          "hover:border-brand-violet transition-colors min-h-[120px] p-4",
          displayError && "border-red-400"
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="max-h-28 rounded-lg object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleFile(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="absolute top-2 right-2 rounded-full bg-white p-1 shadow text-brand-gray hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <Upload size={24} className="text-brand-gray" />
            <p className="text-xs text-brand-gray text-center">
              Arrastrá o hacé click para subir
              <br />
              <span className="text-[11px]">JPG, PNG, WEBP — máx 5MB</span>
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {displayError && <p className="text-xs text-red-500">{displayError}</p>}
    </div>
  );
}
