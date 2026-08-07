import { Star, MessageSquareText } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  client: { firstName: string; lastName: string };
};

function timeAgo(date: Date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `Hace ${years} ${years === 1 ? "año" : "años"}`;
}

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? "text-brand-violet fill-brand-violet" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10 gap-2">
        <MessageSquareText className="text-gray-300" size={28} strokeWidth={1.5} />
        <p className="text-sm text-brand-gray">Sin reseñas todavía.</p>
      </div>
    );
  }

  const count = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-gray-100">
        <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-1 shrink-0">
          <p className="text-4xl font-bold text-brand-dark leading-none">{avg.toFixed(1)}</p>
          <div className="flex flex-col gap-1">
            <StarRow rating={Math.round(avg)} size={14} />
            <p className="text-xs text-brand-gray">
              {count} {count === 1 ? "reseña" : "reseñas"}
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {distribution.map(({ star, n }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-brand-gray w-3 text-right tabular-nums">{star}</span>
              <Star size={10} className="text-gray-300 fill-gray-300 shrink-0" />
              <div className="flex-1 h-1.5 rounded-full bg-brand-bg overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-violet"
                  style={{ width: count > 0 ? `${(n / count) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-xs text-brand-gray w-4 tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {reviews.map((review) => {
          const initials = `${review.client.firstName[0] ?? ""}${review.client.lastName[0] ?? ""}`.toUpperCase();
          return (
            <div key={review.id} className="py-4 first:pt-4 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-violet/10 text-brand-violet text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-brand-dark truncate">
                      {review.client.firstName} {review.client.lastName[0]}.
                    </p>
                    <span className="text-xs text-brand-gray shrink-0">{timeAgo(review.createdAt)}</span>
                  </div>
                  <StarRow rating={review.rating} />
                  {review.comment && (
                    <p className="text-sm text-brand-gray mt-1.5 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
