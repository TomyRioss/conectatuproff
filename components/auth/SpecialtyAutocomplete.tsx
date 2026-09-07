"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (name: string) => void;
  error?: string;
}

export default function SpecialtyAutocomplete({ value = "", onChange, error }: Props) {
  const [options, setOptions] = useState<string[]>([]);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/subcategorias")
      .then((r) => r.json())
      .then((d) => setOptions((d as { name: string }[]).map((s) => s.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Sincronizar query con el value externo sin setState síncrono en el efecto.
    const t = setTimeout(() => setQuery(value), 0);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matches = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));
  const exactMatch = options.some((o) => o.toLowerCase() === query.trim().toLowerCase());
  const isCustom = query.trim().length >= 3 && !exactMatch;

  function handleSelect(name: string) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1 relative min-w-0 w-full" ref={wrapperRef}>
      <label className="text-sm font-medium text-brand-dark">Profesión</label>
      <input
        type="text"
        value={query}
        placeholder="Instructora de Pilates"
        onChange={(e) => {
          // Se acepta la profesión tipeada tal cual: sin fricción.
          // Si no está en el listado, el servidor registra la petición al guardar.
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={`w-full rounded-xl border px-3 py-3 lg:py-2.5 min-h-[44px] lg:min-h-0 text-base lg:text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 transition-colors ${
          error ? "border-red-400" : "border-gray-200 focus:border-brand-violet"
        }`}
      />
      {!open && error && <p className="text-xs text-red-500">{error}</p>}
      {!error && isCustom && (
        <p className="text-xs text-brand-gray break-words">
          Se usará esta profesión y la revisaremos para sumarla al listado.
        </p>
      )}

      {open && query.trim() && matches.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg z-10">
          {matches.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelect(name)}
              className="w-full text-left px-3 py-2 text-sm text-brand-dark hover:bg-brand-bg transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
