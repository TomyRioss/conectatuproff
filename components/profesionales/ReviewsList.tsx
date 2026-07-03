import { Star } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  client: { firstName: string; lastName: string };
};

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-brand-gray">Todavía no tenés reseñas.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {reviews.map((review) => (
        <div key={review.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-brand-dark">
              {review.client.firstName} {review.client.lastName[0]}.
            </p>
            <div className="flex items-center gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < review.rating ? "text-brand-violet fill-brand-violet" : "text-gray-200 fill-gray-200"}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-brand-gray mt-1 leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
