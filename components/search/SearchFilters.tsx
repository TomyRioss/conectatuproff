"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import ZonaSelect from "@/components/search/ZonaSelect";

type Category = { id: string; name: string; slug: string };

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "recientes", label: "Más recientes" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
];

export function SearchFilters({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const sort = searchParams.get("sort") ?? "relevancia";
  const categoria = searchParams.get("categoria") ?? "";
  const barrio = searchParams.get("barrio") ?? "";
  const precioMin = searchParams.get("precioMin") ?? "";
  const precioMax = searchParams.get("precioMax") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={categoria}
            onChange={(e) => updateParam("categoria", e.target.value)}
            className="h-10 pl-3 pr-8 rounded-full border border-gray-200 bg-white text-sm text-brand-dark appearance-none focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark" />
        </div>

        <ZonaSelect
          value={barrio}
          onChange={(v) => updateParam("barrio", v)}
          className="max-w-[160px]"
        />

        <input
          type="number"
          placeholder="Precio mín."
          defaultValue={precioMin}
          onBlur={(e) => updateParam("precioMin", e.target.value)}
          className="h-10 w-28 px-3 rounded-full border border-gray-200 bg-white text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
        />
        <input
          type="number"
          placeholder="Precio máx."
          defaultValue={precioMax}
          onBlur={(e) => updateParam("precioMax", e.target.value)}
          className="h-10 w-28 px-3 rounded-full border border-gray-200 bg-white text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-brand-gray">Ordenar por:</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="h-10 pl-3 pr-8 rounded-full border border-gray-200 bg-white text-sm font-medium text-brand-dark appearance-none focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark" />
          </div>
        </div>
      </div>

      <p className="text-sm text-brand-gray">{resultCount} resultado{resultCount === 1 ? "" : "s"}</p>
    </div>
  );
}
