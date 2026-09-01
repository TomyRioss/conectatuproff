import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function DetailHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <Link
        href="/owner/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gray transition-colors hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Inicio
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-dark">
        {title}
      </h1>
      {subtitle ? <p className="mt-1 text-sm text-brand-gray">{subtitle}</p> : null}
    </div>
  );
}

export function MetricStrip({
  items,
}: {
  items: { label: string; value: string; accent?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-4 border-b border-gray-200 pb-6">
      {items.map((it) => (
        <div key={it.label}>
          <p className="text-sm font-medium text-brand-gray">{it.label}</p>
          <p
            className={`mt-1 font-display text-3xl font-semibold tabular-nums ${
              it.accent ? "text-brand-violet" : "text-brand-dark"
            }`}
          >
            {it.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-10 text-center text-sm text-brand-gray">{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200/70" />
      ))}
    </div>
  );
}
