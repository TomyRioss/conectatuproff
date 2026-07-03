"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (name: string) => void;
  error?: string;
}

export default function SpecialtyAutocomplete({ value, onChange, error }: Props) {
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
    setQuery(value);
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
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  function handleSelect(name: string) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  async function handleRequest() {
    setRequesting(true);
    try {
      const res = await fetch("/api/subcategorias/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al enviar solicitud");
      setRequested(true);
      toast.success("Solicitud enviada, la revisaremos pronto");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar solicitud");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 relative" ref={wrapperRef}>
      <label className="text-sm font-medium text-brand-dark">Rol</label>
      <input
        type="text"
        value={query}
        placeholder="Instructora de Pilates"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange("");
          setOpen(true);
          setRequested(false);
        }}
        onFocus={() => setOpen(true)}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 transition-colors ${
          error ? "border-red-400" : "border-gray-200 focus:border-brand-violet"
        }`}
      />
      {!open && error && <p className="text-xs text-red-500">{error}</p>}

      {open && query.trim() && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg z-10">
          {matches.length === 0 ? (
            <div className="px-3 py-2">
              <p className="text-sm text-brand-gray mb-1.5">Sin coincidencias</p>
              <button
                type="button"
                onClick={handleRequest}
                disabled={requesting || requested}
                className="text-sm text-brand-violet font-medium hover:underline disabled:opacity-60 disabled:no-underline"
              >
                {requested ? "Solicitud enviada" : requesting ? "Enviando..." : "Pedir que añadan esta profesión"}
              </button>
            </div>
          ) : (
            matches.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSelect(name)}
                className="w-full text-left px-3 py-2 text-sm text-brand-dark hover:bg-brand-bg transition-colors"
              >
                {name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
