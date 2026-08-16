"use client";

import { useState, useEffect, useCallback } from "react";

interface Street {
  id: string;
  name: string;
  name_normalized: string;
  postal_code: string;
  municipality: string;
  active: boolean;
  source: string;
  created_at: string;
}

interface ManualAddress {
  id: string;
  order_number: string;
  delivery_address: string | null;
  delivery_postal: string | null;
  delivery_city: string | null;
  created_at: string;
}

export default function StreetsManager({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [streets, setStreets] = useState<Street[]>([]);
  const [manualAddresses, setManualAddresses] = useState<ManualAddress[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", postalCode: "7700", municipality: "Mouscron" });
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchStreets = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/streets?q=${encodeURIComponent(search)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStreets(data.streets || []);
    } catch {
      setStreets([]);
    } finally {
      setLoading(false);
    }
  }, [search, authHeaders]);

  const fetchManualAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/streets?view=manual-addresses", {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setManualAddresses(data.manualAddresses || []);
    } catch {
      setManualAddresses([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchStreets();
  }, [fetchStreets]);

  useEffect(() => {
    if (showManual) fetchManualAddresses();
  }, [showManual, fetchManualAddresses]);

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch("/api/staff/streets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id, active }),
      });
      setStreets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active } : s))
      );
    } catch {}
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAddLoading(true);
    setAddError(null);

    try {
      const res = await fetch("/api/staff/streets", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          name: addForm.name.trim(),
          postal_code: addForm.postalCode,
          municipality: addForm.municipality,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Erreur lors de l'ajout.");
        setAddLoading(false);
        return;
      }
      setAddForm({ name: "", postalCode: "7700", municipality: "Mouscron" });
      setShowAdd(false);
      fetchStreets();
    } catch {
      setAddError("Erreur réseau.");
    } finally {
      setAddLoading(false);
    }
  };

  const importStreets = async () => {
    if (importLoading) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/import-streets", {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult(`Erreur : ${data.error || "Échec de l'import"}`);
      } else {
        setImportResult(`${data.imported} rues importées avec succès !`);
        fetchStreets();
      }
    } catch {
      setImportResult("Erreur réseau. Réessayez.");
    } finally {
      setImportLoading(false);
    }
  };

  const activeCount = streets.filter((s) => s.active).length;

  return (
    <div>
      <div className="adm-streets-header">
        <input
          type="text"
          className="adm-streets-search"
          placeholder="Rechercher une rue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="adm-streets-actions">
          <button
            type="button"
            className="adm-btn adm-btn-sm"
            onClick={importStreets}
            disabled={importLoading}
          >
            {importLoading ? "Import..." : "Importer BeSt"}
          </button>
          <button
            type="button"
            className="adm-btn adm-btn-sm"
            onClick={() => setShowManual(!showManual)}
          >
            {showManual ? "Masquer manuelles" : "Adresses manuelles"}
          </button>
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? "Annuler" : "+ Ajouter une rue"}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`adm-streets-import-result ${importResult.startsWith("Erreur") ? "adm-streets-import-error" : ""}`}>
          {importResult}
          <button type="button" onClick={() => setImportResult(null)} style={{ marginLeft: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "1rem" }}>&times;</button>
        </div>
      )}

      {showAdd && (
        <form className="adm-streets-add-form" onSubmit={handleAdd}>
          <label>
            Nom de la rue
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Rue de la Gare"
              required
            />
          </label>
          <label>
            Code postal
            <select
              value={addForm.postalCode}
              onChange={(e) => {
                const pc = e.target.value;
                const muni = pc === "7700" ? "Mouscron" : pc === "7711" ? "Dottignies" : "Herseaux";
                setAddForm((p) => ({ ...p, postalCode: pc, municipality: muni }));
              }}
              className="adm-select-sm"
            >
              <option value="7700">7700 — Mouscron</option>
              <option value="7711">7711 — Dottignies</option>
              <option value="7712">7712 — Herseaux</option>
            </select>
          </label>
          <label>
            Commune
            <input
              type="text"
              value={addForm.municipality}
              onChange={(e) => setAddForm((p) => ({ ...p, municipality: e.target.value }))}
              required
            />
          </label>
          <button type="submit" className="adm-btn adm-btn-primary adm-btn-sm" disabled={addLoading}>
            {addLoading ? "..." : "Ajouter"}
          </button>
          {addError && <p className="adm-error" style={{ gridColumn: "1/-1" }}>{addError}</p>}
        </form>
      )}

      <p className="adm-streets-count">
        {activeCount} rue{activeCount > 1 ? "s" : ""} active{activeCount > 1 ? "s" : ""} sur {streets.length} au total
      </p>

      {loading ? (
        <p className="adm-streets-empty">Chargement...</p>
      ) : streets.length === 0 ? (
        <div className="adm-streets-empty">
          <p>Aucune rue enregistrée.</p>
          <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Cliquez sur le bouton ci-dessous pour importer toutes les rues de Mouscron, Dottignies et Herseaux.
          </p>
          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={importStreets}
            disabled={importLoading}
            style={{ marginTop: "0.75rem" }}
          >
            {importLoading ? "Import en cours... (peut prendre 1-2 min)" : "Importer les rues automatiquement"}
          </button>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-streets-table">
            <thead>
              <tr>
                <th>Rue</th>
                <th>Code postal</th>
                <th>Commune</th>
                <th>Source</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {streets.map((street) => (
                <tr key={street.id} className={street.active ? "" : "adm-streets-inactive"}>
                  <td>{street.name}</td>
                  <td>{street.postal_code}</td>
                  <td>{street.municipality}</td>
                  <td style={{ fontSize: "0.75rem" }}>{street.source === "best" ? "BeSt" : "Manuel"}</td>
                  <td>
                    <span className={`adm-streets-badge ${street.active ? "adm-streets-badge-active" : "adm-streets-badge-inactive"}`}>
                      {street.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="adm-btn adm-btn-sm"
                      onClick={() => toggleActive(street.id, !street.active)}
                    >
                      {street.active ? "Désactiver" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showManual && (
        <div className="adm-streets-manual-section">
          <h3>Adresses saisies manuellement</h3>
          {manualAddresses.length === 0 ? (
            <p className="adm-streets-empty">Aucune adresse manuelle enregistrée.</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-streets-table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Adresse</th>
                    <th>Code postal</th>
                    <th>Commune</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {manualAddresses.map((ma) => (
                    <tr key={ma.id}>
                      <td>{ma.order_number}</td>
                      <td>{ma.delivery_address || "—"}</td>
                      <td>{ma.delivery_postal || "—"}</td>
                      <td>{ma.delivery_city || "—"}</td>
                      <td style={{ fontSize: "0.75rem" }}>
                        {new Date(ma.created_at).toLocaleDateString("fr-BE")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
