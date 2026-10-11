"use client";

export default function CommanderError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
      <h2 style={{ marginBottom: "1rem" }}>Une erreur est survenue</h2>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>
        La page de commande a rencontré un problème. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.75rem 1.5rem",
          background: "#722F37",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "1rem",
          marginRight: "0.5rem",
        }}
      >
        Réessayer
      </button>
      <button
        onClick={() => window.location.href = "/"}
        style={{
          padding: "0.75rem 1.5rem",
          background: "#eee",
          color: "#333",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Retour à l&apos;accueil
      </button>
    </div>
  );
}
