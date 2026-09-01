"use client";

import { useEffect, useState, useRef } from "react";

interface ReviewConfig {
  average_rating: number;
  total_count: number;
  google_maps_url: string;
}

interface Review {
  id: string;
  author_name: string;
  rating: number;
  review_date: string;
  review_text: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="gr-stars" aria-label={`${rating} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" className={i <= rating ? "gr-star-filled" : "gr-star-empty"}>
          <path d="M12 17.3l6.2 3.7-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.6 7z" />
        </svg>
      ))}
    </span>
  );
}

function BigStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  return (
    <span className="gr-big-stars" aria-label={`${rating} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= full) {
          return (
            <svg key={i} viewBox="0 0 24 24" width="22" height="22" className="gr-star-filled">
              <path d="M12 17.3l6.2 3.7-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.6 7z" />
            </svg>
          );
        }
        if (i === full + 1 && half) {
          return (
            <svg key={i} viewBox="0 0 24 24" width="22" height="22" className="gr-star-half">
              <defs>
                <linearGradient id="gr-half">
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#D1D5DB" />
                </linearGradient>
              </defs>
              <path d="M12 17.3l6.2 3.7-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.6 7z" fill="url(#gr-half)" />
            </svg>
          );
        }
        return (
          <svg key={i} viewBox="0 0 24 24" width="22" height="22" className="gr-star-empty">
            <path d="M12 17.3l6.2 3.7-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.6 7z" />
          </svg>
        );
      })}
    </span>
  );
}

export default function GoogleReviews() {
  const [config, setConfig] = useState<ReviewConfig | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
        if (data.reviews?.length) setReviews(data.reviews);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || !config || reviews.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const TEXT_LIMIT = 180;

  return (
    <section className="section gr-section" id="avis">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Avis Clients</span>
          <h2 className="section-title">Ils sont venus chez nous</h2>
          <div className="divider-mark"></div>
        </div>

        <div className="gr-summary reveal">
          <div className="gr-rating-block">
            <span className="gr-rating-number">{config.average_rating.toString().replace(".", ",")}</span>
            <div className="gr-rating-detail">
              <BigStars rating={config.average_rating} />
              <span className="gr-rating-count">{config.total_count.toLocaleString("fr-BE")} avis</span>
            </div>
          </div>
          <div className="gr-google-badge">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-label="Google">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Avis Google</span>
          </div>
        </div>

        <div className="gr-carousel reveal">
          <div className="gr-track" ref={trackRef}>
            {reviews.map((review) => {
              const isLong = review.review_text.length > TEXT_LIMIT;
              const isExpanded = expanded.has(review.id);
              return (
                <div className="gr-card" key={review.id}>
                  <div className="gr-card-header">
                    <div className="gr-avatar">{review.author_name.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="gr-author">{review.author_name}</span>
                      <span className="gr-date">{review.review_date}</span>
                    </div>
                  </div>
                  <Stars rating={review.rating} />
                  {review.review_text && (
                    <p className="gr-text">
                      {isLong && !isExpanded
                        ? review.review_text.slice(0, TEXT_LIMIT) + "..."
                        : review.review_text}
                      {isLong && (
                        <button
                          type="button"
                          className="gr-read-more"
                          onClick={() => toggleExpand(review.id)}
                        >
                          {isExpanded ? "réduire" : "lire la suite"}
                        </button>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="gr-cta reveal">
          <a
            href={config.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline gr-leave-review"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 17.3l6.2 3.7-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.6 7z" />
            </svg>
            Laisser un avis
          </a>
        </div>
      </div>
    </section>
  );
}
