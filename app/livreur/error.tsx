"use client";

export default function LivreurError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
      <h2 style={{ marginBottom: "1rem" }}>Erreur</h2>
      <p style={{ marginBottom: "1.5rem", color: "#666" }}>
        L&apos;interface livreur a rencontré un problème.
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
        }}
      >
        Réessayer
      </button>
    </div>
  );
}
