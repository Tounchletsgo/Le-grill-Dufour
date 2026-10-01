"use client";

import { useState, useEffect, useCallback } from "react";

interface DriverSession {
  id: string;
  name: string;
}

export default function DriverBoard() {
  const [driver, setDriver] = useState<DriverSession | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const verifySession = useCallback(async (driverId: string) => {
    try {
      const res = await fetch("/api/driver/auth", {
        headers: { "x-driver-id": driverId },
      });
      if (res.ok) {
        const data = await res.json();
        setDriver(data.driver);
      } else {
        localStorage.removeItem("gdf-driver-session");
      }
    } catch {
      // offline — keep local session
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gdf-driver-session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) {
          verifySession(parsed.id);
          return;
        }
      }
    } catch {}
    setLoading(false);
  }, [verifySession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/driver/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.driver) {
        localStorage.setItem("gdf-driver-session", JSON.stringify(data.driver));
        setDriver(data.driver);
        setPin("");
      } else {
        setError(data.error || "Erreur de connexion");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gdf-driver-session");
    setDriver(null);
    setPin("");
  };

  if (loading) {
    return (
      <div className="driver-page">
        <div className="drv-loading">Chargement…</div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="driver-page">
        <div className="drv-login">
          <div className="drv-login-logo">
            <img
              src="/images/logo/grill-dufour-logo-noir.svg"
              alt="Le Grill Dufour"
              width="100"
              height="48"
            />
          </div>
          <h1 className="drv-login-title">Espace Livreur</h1>
          <form onSubmit={handleLogin} className="drv-login-form">
            <label htmlFor="driver-pin" className="drv-label">
              Code PIN
            </label>
            <input
              id="driver-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Entrez votre PIN"
              className="drv-input"
              maxLength={8}
              autoFocus
            />
            {error && <p className="drv-error">{error}</p>}
            <button
              type="submit"
              className="drv-btn drv-btn-primary"
              disabled={!pin.trim() || submitting}
            >
              {submitting ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-page">
      <header className="drv-header">
        <div className="drv-header-left">
          <img
            src="/images/logo/grill-dufour-logo-noir.svg"
            alt="Le Grill Dufour"
            width="60"
            height="29"
          />
        </div>
        <div className="drv-header-center">
          <span className="drv-driver-name">{driver.name}</span>
        </div>
        <button onClick={handleLogout} className="drv-btn-logout">
          Déconnexion
        </button>
      </header>

      <main className="drv-main">
        <div className="drv-empty">
          <p>Aucune livraison pour le moment.</p>
          <p className="drv-empty-sub">
            Les commandes prêtes apparaîtront ici automatiquement.
          </p>
        </div>
      </main>
    </div>
  );
}
