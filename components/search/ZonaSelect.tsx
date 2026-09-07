"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  hideIcon?: boolean;
}

const GEOREF = "https://apis.datos.gob.ar/georef/api";

type Provincia = { id: string; nombre: string };

// Como registro (ArgentinaLocationSelect): Provincia + Municipio desde georef.
// La búsqueda filtra por contains, así que se devuelve solo el municipio.
export default function ZonaSelect({ value, onChange, id = "zona", className = "", placeholder = "Zona", hideIcon = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [provId, setProvId] = useState("06");
  const [zonas, setZonas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${GEOREF}/provincias?campos=id,nombre&max=30&orden=nombre`)
      .then((r) => r.json())
      .then((d) => setProvincias(d.provincias ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provId) return;
    setLoading(true);
    fetch(`${GEOREF}/municipios?provincia=${provId}&campos=nombre&max=600&orden=nombre`)
      .then((r) => r.json())
      .then((d) => setZonas((d.municipios ?? []).map((m: { nombre: string }) => m.nombre)))
      .catch(() => setZonas([]))
      .finally(() => setLoading(false));
  }, [provId]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const q = query.trim().toLowerCase();
  const filtered = q ? zonas.filter((z) => z.toLowerCase().includes(q)) : zonas;
  const extra = value && !zonas.includes(value) ? [value] : [];
  const list = [...extra, ...filtered];

  const isTransparent = className.includes("bg-transparent");
  const triggerBase = isTransparent
    ? "relative flex items-center w-full bg-transparent text-[#1A1A2E] text-sm outline-none cursor-pointer text-left"
    : "relative flex items-center w-full h-10 bg-white border border-gray-200 rounded-full text-sm text-brand-dark cursor-pointer outline-none focus-within:ring-2 focus-within:ring-brand-violet/30 transition-colors";

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        id={id}
        aria-label="Zona"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className={`${triggerBase} ${hideIcon ? "pl-0 pr-7" : "pl-8 pr-8"} ${className}`}
      >
        {!hideIcon && (
          <MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray shrink-0" />
        )}
        <span className="truncate flex-1">{value || placeholder}</span>
        <ChevronDown
          size={14}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 w-[280px] max-w-[80vw] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex flex-col gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zona..."
                className="w-full h-10 pl-8 pr-3 rounded-xl bg-[#F3F4F8] text-sm text-brand-dark placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-brand-violet/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-gray shrink-0 pl-1">Provincia</span>
              <select
                value={provId}
                onChange={(e) => {
                  setProvId(e.target.value);
                  setQuery("");
                  if (value) onChange("");
                }}
                className="flex-1 h-9 px-2 rounded-xl border border-gray-200 bg-white text-sm text-brand-dark outline-none focus:ring-2 focus:ring-brand-violet/30 cursor-pointer min-w-0"
              >
                {provincias.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ul role="listbox" className="max-h-[260px] overflow-y-auto p-1">
            <li>
              <button
                type="button"
                onClick={() => pick("")}
                className="w-full flex items-center min-h-[44px] lg:min-h-[36px] px-3 rounded-xl text-sm text-left text-brand-gray hover:bg-[#F3F4F8] hover:text-brand-dark transition-colors"
              >
                Todas las zonas
              </button>
            </li>
            {loading ? (
              <li className="px-3 py-4 text-sm text-brand-gray">Cargando...</li>
            ) : list.length === 0 ? (
              <li className="px-3 py-4 text-sm text-brand-gray">Sin resultados para “{query}”</li>
            ) : (
              list.map((z) => (
                <li key={z}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={z === value}
                    onClick={() => pick(z)}
                    className={`w-full flex items-center min-h-[44px] lg:min-h-[36px] px-3 rounded-xl text-sm text-left transition-colors ${
                      z === value
                        ? "bg-brand-violet/10 text-brand-dark font-medium"
                        : "text-brand-dark hover:bg-[#F3F4F8]"
                    }`}
                  >
                    <span className="truncate">{z}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
