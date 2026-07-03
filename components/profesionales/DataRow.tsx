export function DataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="text-brand-gray shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-brand-gray">{label}</p>
        <p className="text-sm font-medium truncate text-brand-dark">{value ?? "—"}</p>
      </div>
    </div>
  );
}
