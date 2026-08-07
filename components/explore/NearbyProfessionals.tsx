"use client";

import { useEffect, useState } from "react";
import { ProfCard, type ProfCardData } from "@/components/home/ProfCard";

const CITY_CACHE_KEY = "explore_city";

export function NearbyProfessionals() {
  const [pros, setPros] = useState<ProfCardData[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchNearby(city: string) {
      try {
        const res = await fetch(`/api/explore/nearby?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        if (!cancelled) setPros(data);
      } catch {
        if (!cancelled) setPros([]);
      }
    }

    async function resolveCity() {
      const cached = localStorage.getItem(CITY_CACHE_KEY);
      if (cached) return fetchNearby(cached);

      if (!navigator.geolocation) {
        setPros([]);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`
            );
            const geo = await res.json();
            const city = geo.city || geo.locality || geo.principalSubdivision;
            if (!city) {
              if (!cancelled) setPros([]);
              return;
            }
            localStorage.setItem(CITY_CACHE_KEY, city);
            if (!cancelled) fetchNearby(city);
          } catch {
            if (!cancelled) setPros([]);
          }
        },
        () => {
          if (!cancelled) setPros([]);
        },
        { timeout: 8000 }
      );
    }

    resolveCity();
    return () => {
      cancelled = true;
    };
  }, []);

  if (pros === null || pros.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-brand-dark mb-6">
        Profesionales cerca de tí
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {pros.map((pro) => (
          <div key={pro.slug} className="flex-none w-[calc(25%-18px)] min-w-[260px] snap-start">
            <ProfCard pro={pro} />
          </div>
        ))}
      </div>
    </section>
  );
}
