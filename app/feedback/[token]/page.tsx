"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/i18n/LocaleContext";

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [isHot, setIsHot] = useState<boolean | null>(null);
  const [isOnTime, setIsOnTime] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const ratingLabels = [
    "",
    ...(Array.isArray(t("feedback.ratingLabels")) ? [] : []),
    t("feedback.ratingLabels.0"),
    t("feedback.ratingLabels.1"),
    t("feedback.ratingLabels.2"),
    t("feedback.ratingLabels.3"),
    t("feedback.ratingLabels.4"),
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/feedback?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 410) setExpired(true);
          else if (res.status === 409) setAlreadySent(true);
          else setError(data.error || t("feedback.invalidLink"));
        } else {
          setOrderNumber(data.orderNumber);
          setOrderDate(data.orderDate || "");
          setGoogleUrl(data.googleUrl || "");
        }
      } catch {
        setError(t("feedback.connectionError"));
      }
      setLoading(false);
    })();
  }, [token, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment, isComplete, isHot, isOnTime }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.googleUrl) setGoogleUrl(data.googleUrl);
        setSubmitted(true);
      } else {
        setError(data.error || t("feedback.sendError"));
      }
    } catch {
      setError(t("feedback.connectionError"));
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <div className="feedback-spinner" />
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" className="feedback-logo-img" width={140} height={67} />
          <h1 className="feedback-title">{t("feedback.expired")}</h1>
          <p className="feedback-text">{t("feedback.expiredText")}</p>
          <p className="feedback-text">{t("feedback.expiredCall")}</p>
          <a href="tel:+3256342870" className="feedback-phone-link">056 34 28 70</a>
        </div>
      </div>
    );
  }

  if (alreadySent) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" className="feedback-logo-img" width={140} height={67} />
          <h1 className="feedback-title">{t("feedback.alreadySent")}</h1>
          <p className="feedback-text">{t("feedback.alreadySentText")}</p>
          <p className="feedback-text">
            {t("feedback.alreadySentCall")}{" "}
            <a href="tel:+3256342870" className="feedback-phone-inline">056 34 28 70</a>.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" className="feedback-logo-img" width={140} height={67} />
          <h1 className="feedback-title">{t("feedback.invalidLink")}</h1>
          <p className="feedback-text">{error}</p>
          <p className="feedback-text">
            {t("feedback.invalidCall")}{" "}
            <a href="tel:+3256342870" className="feedback-phone-inline">056 34 28 70</a>.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" className="feedback-logo-img" width={140} height={67} />
          <h1 className="feedback-title">{t("feedback.thankYou")}</h1>
          <p className="feedback-text">{t("feedback.thankYouText")}</p>
          <p className="feedback-text">
            {t("feedback.thankYouCall")}{" "}
            <a href="tel:+3256342870" className="feedback-phone-inline">056 34 28 70</a>.
          </p>
          {googleUrl && (
            <>
              <hr className="feedback-divider" />
              <p className="feedback-text feedback-google-text">{t("feedback.thankYouGoogle")}</p>
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="feedback-google-btn">
                {t("feedback.leaveGoogleReview")}
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <img src="/images/logo/grill-dufour-logo-noir.svg" alt="Le Grill Dufour" className="feedback-logo-img" width={140} height={67} />
        <h1 className="feedback-title">{t("feedback.howWasOrder")}</h1>
        <div className="feedback-order-info">
          <span>{t("feedback.orderLabel")} <strong>{orderNumber}</strong></span>
          {orderDate && <span className="feedback-order-date">{orderDate}</span>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="feedback-stars" role="radiogroup" aria-label={t("feedback.ratingAriaLabel")}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`feedback-star ${displayRating >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} ${t("feedback.starLabel")} — ${ratingLabels[star]}`}
                role="radio"
                aria-checked={rating === star}
              >
                ★
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="feedback-rating-label">{ratingLabels[rating]}</p>
          )}

          <div className="feedback-questions">
            <QuickQuestion label={t("feedback.orderComplete")} value={isComplete} onChange={setIsComplete} id="q-complete" yesLabel={t("feedback.yes")} noLabel={t("feedback.no")} />
            <QuickQuestion label={t("feedback.stillHot")} value={isHot} onChange={setIsHot} id="q-hot" yesLabel={t("feedback.yes")} noLabel={t("feedback.no")} />
            <QuickQuestion label={t("feedback.onTime")} value={isOnTime} onChange={setIsOnTime} id="q-time" yesLabel={t("feedback.yes")} noLabel={t("feedback.no")} />
          </div>

          <label htmlFor="feedback-comment" className="feedback-comment-label">
            {t("feedback.improvePlaceholder")}
          </label>
          <textarea
            id="feedback-comment"
            className="feedback-textarea"
            placeholder={t("feedback.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
          />

          <div className="feedback-privacy">{t("feedback.privacyNote")}</div>

          <button type="submit" className="feedback-submit" disabled={rating === 0 || submitting}>
            {submitting ? t("feedback.submitting") : t("feedback.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function QuickQuestion({
  label,
  value,
  onChange,
  id,
  yesLabel,
  noLabel,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  id: string;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <fieldset className="feedback-question" id={id}>
      <legend className="feedback-question-label">{label}</legend>
      <div className="feedback-question-btns">
        <button type="button" className={`feedback-yn-btn ${value === true ? "active-yes" : ""}`} onClick={() => onChange(true)} aria-pressed={value === true}>
          {yesLabel}
        </button>
        <button type="button" className={`feedback-yn-btn ${value === false ? "active-no" : ""}`} onClick={() => onChange(false)} aria-pressed={value === false}>
          {noLabel}
        </button>
      </div>
    </fieldset>
  );
}
