"use client";

import { useEffect, useState } from "react";

const GEOREF = "https://apis.datos.gob.ar/georef/api";

type Provincia = { id: string; nombre: string };
type Municipio = { id: string; nombre: string };

interface Props {
  provinciaValue: string;
  municipioValue: string;
  onProvinciaChange: (nombre: string) => void;
  onMunicipioChange: (nombre: string) => void;
  provinciaError?: string;
  municipioError?: string;
}

export default function ArgentinaLocationSelect({
  provinciaValue,
  municipioValue,
  onProvinciaChange,
  onMunicipioChange,
  provinciaError,
  municipioError,
}: Props) {
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loadingProv, setLoadingProv] = useState(true);
  const [loadingMun, setLoadingMun] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    fetch(`${GEOREF}/provincias?campos=id,nombre&max=30&orden=nombre`)
      .then((r) => r.json())
      .then((d) => setProvincias(d.provincias ?? []))
      .catch(() => {})
      .finally(() => setLoadingProv(false));
  }, []);

  function handleProvinciaChange(id: string) {
    setSelectedId(id);
    const prov = provincias.find((p) => p.id === id);
    onProvinciaChange(prov?.nombre ?? "");
    onMunicipioChange("");
  }

  useEffect(() => {
    if (!selectedId) {
      setMunicipios([]);
      return;
    }
    setLoadingMun(true);
    fetch(`${GEOREF}/municipios?provincia=${selectedId}&campos=id,nombre&max=600&orden=nombre`)
      .then((r) => r.json())
      .then((d) => setMunicipios(d.municipios ?? []))
      .catch(() => setMunicipios([]))
      .finally(() => setLoadingMun(false));
  }, [selectedId]);

  const selectClass = (hasError: boolean) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-violet/30 transition-colors appearance-none ${
      hasError ? "border-red-400" : "border-gray-200 focus:border-brand-violet"
    }`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-brand-dark">Provincia</label>
        <select
          value={selectedId}
          onChange={(e) => handleProvinciaChange(e.target.value)}
          disabled={loadingProv}
          className={selectClass(!!provinciaError)}
        >
          <option value="">{loadingProv ? "Cargando..." : "Seleccioná"}</option>
          {provincias.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        {provinciaError && <p className="text-xs text-red-500">{provinciaError}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-brand-dark">Municipio</label>
        <select
          value={municipioValue}
          onChange={(e) => onMunicipioChange(e.target.value)}
          disabled={!selectedId || loadingMun}
          className={selectClass(!!municipioError)}
        >
          <option value="">
            {loadingMun ? "Cargando..." : selectedId ? "Seleccioná" : "Primero elegí provincia"}
          </option>
          {municipios.map((m) => (
            <option key={m.id} value={m.nombre}>{m.nombre}</option>
          ))}
        </select>
        {municipioError && <p className="text-xs text-red-500">{municipioError}</p>}
      </div>
    </div>
  );
}
