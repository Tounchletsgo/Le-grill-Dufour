"use client";

import { useState, useEffect, useCallback } from "react";
import type { DailySpecial } from "@/types/database";

function formatPrice(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function todayLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}

interface SlotForm {
  name: string;
  description: string;
  price: string;
  cooking_group: "" | "boeuf" | "cuisson_imposee";
  is_available: boolean;
  existingId?: string;
}

const emptySlot: SlotForm = {
  name: "",
  description: "",
  price: "14.00",
  cooking_group: "",
  is_available: true,
};

export default function DailySpecialsManager({ pin }: { pin: string }) {
  const [date, setDate] = useState(todayLocal());
  const [slots, setSlots] = useState<[SlotForm, SlotForm]>([{ ...emptySlot }, { ...emptySlot }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<DailySpecial[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const headers = { "Content-Type": "application/json", "x-admin-pin": pin };

  const loadSpecials = useCallback(async (d: string) => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/daily-specials?date=${d}`);
      const data = await res.json();
      const specials: DailySpecial[] = data.specials || [];
      const newSlots: [SlotForm, SlotForm] = [{ ...emptySlot }, { ...emptySlot }];
      for (const s of specials) {
        const idx = s.slot === 1 ? 0 : 1;
        newSlots[idx] = {
          name: s.name,
          description: s.description || "",
          price: s.price.toFixed(2),
          cooking_group: s.cooking_group || "",
          is_available: s.is_available,
          existingId: s.id,
        };
      }
      setSlots(newSlots);
    } catch {
      setMsg("Erreur de chargement");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSpecials(date);
  }, [date, loadSpecials]);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/daily-specials?history=1");
      const data = await res.json();
      setHistory(data.specials || []);
      setShowHistory(true);
    } catch {
      setMsg("Erreur de chargement de l'historique");
    }
  };

  const saveSlot = async (slotIndex: number) => {
    const form = slots[slotIndex];
    if (!form.name.trim()) {
      setMsg(`Slot ${slotIndex + 1} : nom requis`);
      return;
    }
    setSaving(slotIndex);
    setMsg(null);
    try {
      const res = await fetch("/api/daily-specials", {
        method: "POST",
        headers,
        body: JSON.stringify({
          slot: slotIndex + 1,
          valid_date: date,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: parseFloat(form.price) || 14.0,
          cooking_group: form.cooking_group || null,
          is_available: form.is_available,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = [...slots] as [SlotForm, SlotForm];
      updated[slotIndex] = { ...form, existingId: data.special.id };
      setSlots(updated);
      setMsg(`Plat ${slotIndex + 1} enregistré`);
    } catch (e: any) {
      setMsg(`Erreur : ${e.message}`);
    }
    setSaving(null);
  };

  const deleteSlot = async (slotIndex: number) => {
    const form = slots[slotIndex];
    if (!form.existingId) return;
    if (!confirm(`Supprimer "${form.name}" ?`)) return;
    setSaving(slotIndex);
    try {
      await fetch(`/api/daily-specials?id=${form.existingId}`, {
        method: "DELETE",
        headers,
      });
      const updated = [...slots] as [SlotForm, SlotForm];
      updated[slotIndex] = { ...emptySlot };
      setSlots(updated);
      setMsg(`Plat ${slotIndex + 1} supprimé`);
    } catch {
      setMsg("Erreur de suppression");
    }
    setSaving(null);
  };

  const reuseSpecial = (special: DailySpecial) => {
    const idx = special.slot === 1 ? 0 : 1;
    const updated = [...slots] as [SlotForm, SlotForm];
    updated[idx] = {
      name: special.name,
      description: special.description || "",
      price: special.price.toFixed(2),
      cooking_group: special.cooking_group || "",
      is_available: true,
    };
    setSlots(updated);
    setShowHistory(false);
    setMsg(`"${special.name}" copié dans le slot ${special.slot} — pensez à enregistrer`);
  };

  const updateSlot = (idx: number, field: keyof SlotForm, value: any) => {
    const updated = [...slots] as [SlotForm, SlotForm];
    updated[idx] = { ...updated[idx], [field]: value };
    setSlots(updated);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Plats du jour</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: "0.4rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: "0.9rem" }}
        />
        <button
          type="button"
          onClick={() => setDate(todayLocal())}
          style={{ padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem" }}
        >
          Aujourd'hui
        </button>
        <button
          type="button"
          onClick={loadHistory}
          style={{ padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem" }}
        >
          Historique
        </button>
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
        Disponibles en livraison du lundi au samedi, service du midi uniquement (11h45–15h00).
        <br />Prix restaurant : 14,00 € → Prix livraison : 12,60 € (remise 10 % appliquée automatiquement).
      </p>

      {msg && (
        <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "color-mix(in srgb, var(--gold) 15%, transparent)", color: "var(--text)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[0, 1].map((idx) => (
            <div key={idx} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "0.75rem", background: "var(--bg-card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <strong style={{ fontSize: "0.95rem" }}>Plat {idx + 1}</strong>
                {slots[idx].existingId && (
                  <span style={{ fontSize: "0.75rem", color: slots[idx].is_available ? "#10b981" : "#ef4444" }}>
                    {slots[idx].is_available ? "Disponible" : "Indisponible"}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input
                  placeholder="Nom du plat"
                  value={slots[idx].name}
                  onChange={(e) => updateSlot(idx, "name", e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }}
                />
                <input
                  placeholder="Description (optionnel)"
                  value={slots[idx].description}
                  onChange={(e) => updateSlot(idx, "description", e.target.value)}
                  style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.85rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <div style={{ flex: "1", minWidth: "100px" }}>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Prix (€)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={slots[idx].price}
                      onChange={(e) => updateSlot(idx, "price", e.target.value)}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div style={{ flex: "1", minWidth: "140px" }}>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Cuisson</label>
                    <select
                      value={slots[idx].cooking_group}
                      onChange={(e) => updateSlot(idx, "cooking_group", e.target.value)}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.85rem" }}
                    >
                      <option value="">Pas de choix de cuisson</option>
                      <option value="boeuf">Boeuf (bleu → bien cuit)</option>
                      <option value="cuisson_imposee">Cuisson imposée</option>
                    </select>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={slots[idx].is_available}
                    onChange={(e) => updateSlot(idx, "is_available", e.target.checked)}
                  />
                  Disponible
                </label>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <button
                    type="button"
                    onClick={() => saveSlot(idx)}
                    disabled={saving === idx || !slots[idx].name.trim()}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      background: "var(--gold)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      opacity: saving === idx || !slots[idx].name.trim() ? 0.5 : 1,
                    }}
                  >
                    {saving === idx ? "..." : slots[idx].existingId ? "Mettre à jour" : "Enregistrer"}
                  </button>
                  {slots[idx].existingId && (
                    <button
                      type="button"
                      onClick={() => deleteSlot(idx)}
                      disabled={saving === idx}
                      style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showHistory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "var(--bg)", borderRadius: "1rem", padding: "1.5rem", maxWidth: 500, width: "100%", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Historique des plats du jour</h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                ×
              </button>
            </div>
            {history.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Aucun historique</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {history.map((s) => (
                  <div
                    key={s.id}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.5rem", gap: "0.5rem" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {s.name}
                        <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: "0.4rem" }}>
                          (slot {s.slot})
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {new Date(s.valid_date).toLocaleDateString("fr-BE")} — {formatPrice(s.price)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => reuseSpecial(s)}
                      style={{ padding: "0.35rem 0.6rem", borderRadius: "0.4rem", border: "1px solid var(--gold)", background: "transparent", color: "var(--gold)", cursor: "pointer", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                    >
                      Réutiliser
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
