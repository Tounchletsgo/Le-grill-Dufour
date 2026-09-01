"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/feedback?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Lien invalide.");
        } else {
          setOrderNumber(data.orderNumber);
          setCustomerName(data.customerName);
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
        body: JSON.stringify({ token, rating, comment }),
      });
      const data = await res.json();
      if (res.ok) {
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
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <div className="feedback-logo">Grill Dufour</div>
          <p className="feedback-error">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="feedback-page">
        <div className="feedback-card">
          <div className="feedback-logo">Grill Dufour</div>
          <h1 className="feedback-title">Merci pour votre retour !</h1>
          <p className="feedback-text">
            Votre avis a bien été enregistré. Il nous aidera à nous améliorer.
          </p>
          <p className="feedback-text" style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#888" }}>
            Vous pouvez fermer cette page.
          </p>
        </div>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <div className="feedback-logo">Grill Dufour</div>
        <h1 className="feedback-title">Comment s&apos;est pass&eacute; votre repas ?</h1>
        <p className="feedback-text">
          Commande <strong>{orderNumber}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="feedback-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`feedback-star ${displayRating >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="feedback-rating-label">
              {rating === 5 ? "Excellent !" : rating === 4 ? "Très bien" : rating === 3 ? "Correct" : rating === 2 ? "Décevant" : "Très décevant"}
            </p>
          )}

          <textarea
            className="feedback-textarea"
            placeholder="Tout s'est-il bien passé ? Dites-nous ce que nous pourrions améliorer..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
          />

          <p className="feedback-privacy">
            Ce message n&apos;est lu que par le restaurant. Il ne sera publi&eacute; nulle part.
          </p>

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
