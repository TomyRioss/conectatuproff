export function AboutSection({ bio }: { bio: string | null }) {
  if (!bio) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
        Sobre mí
      </h2>
      <p className="text-brand-dark leading-relaxed whitespace-pre-line">{bio}</p>
    </section>
  );
}
