"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui" }}>
        <h2 style={{ marginBottom: "1rem" }}>Une erreur inattendue est survenue</h2>
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
          Recharger la page
        </button>
      </body>
    </html>
  );
}
