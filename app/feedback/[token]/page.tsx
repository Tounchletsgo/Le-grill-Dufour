"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const RATING_LABELS = ["", "Très décevant", "Décevant", "Correct", "Très bien", "Excellent !"];

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/feedback?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 410) setExpired(true);
          else if (res.status === 409) setAlreadySent(true);
          else setError(data.error || "Lien invalide.");
        } else {
          setOrderNumber(data.orderNumber);
          setOrderDate(data.orderDate || "");
          setGoogleUrl(data.googleUrl || "");
        }
      } catch {
        setError("Erreur de connexion.");
      }
      setLoading(false);
    })();
  }, [token]);

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
        setError(data.error || "Erreur lors de l'envoi.");
      }
    } catch {
      setError("Erreur de connexion.");
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
          <h1 className="feedback-title">Ce lien a expiré</h1>
          <p className="feedback-text">
            Le délai pour donner votre avis sur cette commande est dépassé (30 jours).
          </p>
          <p className="feedback-text">
            Si vous souhaitez tout de même nous faire part de votre retour, appelez-nous directement :
          </p>
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
          <h1 className="feedback-title">Avis déjà envoyé</h1>
          <p className="feedback-text">
            Vous avez déjà donné votre avis pour cette commande. Merci !
          </p>
          <p className="feedback-text">
            Pour toute autre remarque, appelez-nous au{" "}
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
          <h1 className="feedback-title">Lien invalide</h1>
          <p className="feedback-text">{error}</p>
          <p className="feedback-text">
            Besoin d&apos;aide ? Appelez-nous au{" "}
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
          <h1 className="feedback-title">Merci pour votre retour !</h1>
          <p className="feedback-text">
            Votre avis a bien été enregistré. Il nous aidera à nous améliorer.
          </p>
          <p className="feedback-text">
            Pour en dire plus de vive voix, appelez-nous au{" "}
            <a href="tel:+3256342870" className="feedback-phone-inline">056 34 28 70</a>.
          </p>
          {googleUrl && (
            <>
              <hr className="feedback-divider" />
              <p className="feedback-text feedback-google-text">
                Si vous le souhaitez, vous pouvez aussi partager votre expérience sur Google.
              </p>
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="feedback-google-btn">
                Laisser un avis Google
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
        <h1 className="feedback-title">Comment s&apos;est passée votre commande ?</h1>
        <div className="feedback-order-info">
          <span>Commande <strong>{orderNumber}</strong></span>
          {orderDate && <span className="feedback-order-date">{orderDate}</span>}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star rating */}
          <div className="feedback-stars" role="radiogroup" aria-label="Note de 1 à 5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`feedback-star ${displayRating >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} étoile${star > 1 ? "s" : ""} — ${RATING_LABELS[star]}`}
                role="radio"
                aria-checked={rating === star}
              >
                ★
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="feedback-rating-label">{RATING_LABELS[rating]}</p>
          )}

          {/* Quick questions */}
          <div className="feedback-questions">
            <QuickQuestion
              label="La commande était-elle complète ?"
              value={isComplete}
              onChange={setIsComplete}
              id="q-complete"
            />
            <QuickQuestion
              label="Les plats étaient-ils encore chauds ?"
              value={isHot}
              onChange={setIsHot}
              id="q-hot"
            />
            <QuickQuestion
              label="Le délai vous a-t-il paru correct ?"
              value={isOnTime}
              onChange={setIsOnTime}
              id="q-time"
            />
          </div>

          {/* Comment */}
          <label htmlFor="feedback-comment" className="feedback-comment-label">
            Dites-nous ce que nous pourrions améliorer.
          </label>
          <textarea
            id="feedback-comment"
            className="feedback-textarea"
            placeholder="Votre message (facultatif)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
          />

          {/* Privacy notice */}
          <div className="feedback-privacy">
            Ce message n&apos;est lu que par le restaurant. Il n&apos;est publié nulle part.
          </div>

          <button
            type="submit"
            className="feedback-submit"
            disabled={rating === 0 || submitting}
          >
            {submitting ? "Envoi en cours..." : "Envoyer mon avis"}
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
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <fieldset className="feedback-question" id={id}>
      <legend className="feedback-question-label">{label}</legend>
      <div className="feedback-question-btns">
        <button
          type="button"
          className={`feedback-yn-btn ${value === true ? "active-yes" : ""}`}
          onClick={() => onChange(true)}
          aria-pressed={value === true}
        >
          Oui
        </button>
        <button
          type="button"
          className={`feedback-yn-btn ${value === false ? "active-no" : ""}`}
          onClick={() => onChange(false)}
          aria-pressed={value === false}
        >
          Non
        </button>
      </div>
    </fieldset>
  );
}
