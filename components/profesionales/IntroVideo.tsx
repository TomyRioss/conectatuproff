import { IntroVideoUploader } from "./IntroVideoUploader";
import { IntroVideoDeleteButton } from "./IntroVideoDeleteButton";

export function IntroVideo({
  name,
  videoUrl,
  isOwner,
}: {
  name: string;
  videoUrl?: string | null;
  isOwner?: boolean;
}) {
  if (!videoUrl && !isOwner) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
        Presentación
      </h2>
      <h3 className="text-xl font-bold text-brand-dark mb-3">
        Conocé a {name} en 1 minuto
      </h3>

      {videoUrl ? (
        <div className="relative w-full">
          <video
            controls
            className="w-full aspect-video rounded-2xl overflow-hidden bg-brand-dark"
            src={`/api/avatar?key=${encodeURIComponent(videoUrl)}`}
          />
          {isOwner && <IntroVideoDeleteButton />}
        </div>
      ) : (
        <IntroVideoUploader />
      )}
    </section>
  );
}
