"use client";

import { useState, useEffect, useCallback } from "react";
import RichTextEditor from "./RichTextEditor";
import ImageUploader from "./ImageUploader";

interface ContentBlock {
  id: string;
  page: string;
  block_key: string;
  block_label: string;
  content: Record<string, any>;
  draft: Record<string, any> | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
}

interface ContentVersion {
  id: string;
  content_id: string;
  content: Record<string, any>;
  created_at: string;
}

interface Props {
  authHeaders: () => Record<string, string>;
}

const PAGE_ORDER = [
  "accueil",
  "restaurant",
  "contact",
  "galerie",
  "footer",
  "mentions-legales",
  "confidentialite",
];

const PAGE_LABELS: Record<string, string> = {
  accueil: "Accueil",
  restaurant: "Le Restaurant",
  contact: "Contact",
  galerie: "Galerie",
  footer: "Pied de page",
  "mentions-legales": "Mentions légales",
  confidentialite: "Confidentialité",
};

const FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  subtitle: "Sous-titre",
  text: "Texte",
  description: "Description",
  image_url: "Image",
  image_alt: "Texte alternatif de l'image",
  button_label: "Libellé du bouton",
  button_link: "Lien du bouton",
  address: "Adresse",
  phone: "Téléphone",
  email: "E-mail",
  hours: "Horaires",
  map_url: "Lien Google Maps",
  facebook: "Facebook",
  instagram: "Instagram",
  tripadvisor: "TripAdvisor",
};

const FIELD_HINTS: Record<string, string> = {
  title: "Titre principal affiché en grand",
  subtitle: "Complète le titre, affiché en plus petit",
  text: "Corps du texte. Utilisez la barre d'outils pour le gras, l'italique et les liens.",
  description: "Texte de présentation",
  image_url: "Glissez une image ou cliquez pour choisir un fichier",
  button_label: "Texte affiché sur le bouton (ex : Réserver, Voir la carte)",
  button_link: "Adresse du lien (ex : /carte, https://…)",
  address: "Adresse complète du restaurant",
  phone: "Numéro de téléphone avec indicatif",
  email: "Adresse e-mail de contact",
  hours: "Horaires d'ouverture",
  map_url: "Lien vers Google Maps ou embed",
};

const RICH_TEXT_FIELDS = ["text", "description", "hours"];

export default function ContentEditor({ authHeaders }: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<string>("accueil");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showVersions, setShowVersions] = useState<string | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content", { headers: authHeaders() });
      const json = await res.json();
      if (json.blocks) setBlocks(json.blocks);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const pageBlocks = blocks.filter((b) => b.page === activePage);
  const pages = PAGE_ORDER.filter((p) => blocks.some((b) => b.page === p));

  function startEditing(block: ContentBlock) {
    setEditingBlock(block.id);
    setEditData({ ...(block.draft || block.content) });
    setSaveStatus(null);
  }

  function updateField(key: string, value: any) {
    setEditData((prev) => ({ ...prev, [key]: value }));
  }

  async function saveDraft() {
    if (!editingBlock) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingBlock, draft: editData }),
      });
      if (!res.ok) throw new Error("Erreur sauvegarde");
      setSaveStatus("Brouillon sauvegardé");
      fetchBlocks();
    } catch {
      setSaveStatus("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!editingBlock) return;
    setPublishing(true);
    setSaveStatus(null);
    try {
      await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingBlock, draft: editData }),
      });

      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", id: editingBlock }),
      });
      if (!res.ok) throw new Error("Erreur publication");

      setSaveStatus("Publié !");
      setEditingBlock(null);
      fetchBlocks();
    } catch {
      setSaveStatus("Erreur lors de la publication");
    } finally {
      setPublishing(false);
    }
  }

  async function loadVersions(contentId: string) {
    setShowVersions(contentId);
    try {
      const res = await fetch(`/api/admin/content/versions?contentId=${contentId}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      setVersions(json.versions || []);
    } catch {
      setVersions([]);
    }
  }

  async function restoreVersion(versionId: string) {
    try {
      const res = await fetch("/api/admin/content/versions", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", versionId }),
      });
      if (!res.ok) throw new Error();
      setShowVersions(null);
      fetchBlocks();
      setSaveStatus("Version restaurée dans le brouillon");
    } catch {
      setSaveStatus("Erreur lors de la restauration");
    }
  }

  function renderField(key: string, value: any) {
    const label = FIELD_LABELS[key] || key;
    const hint = FIELD_HINTS[key];

    if (key === "image_url") {
      return (
        <div key={key} className="adm-cms-field">
          <label>{label}</label>
          {hint && <span className="adm-cms-hint">{hint}</span>}
          <ImageUploader
            currentUrl={value}
            aspectRatio={undefined}
            onUpload={(img) => {
              updateField("image_url", img.url);
              if (!editData.image_alt) updateField("image_alt", img.alt_text);
            }}
            authHeaders={authHeaders}
          />
        </div>
      );
    }

    if (RICH_TEXT_FIELDS.includes(key)) {
      return (
        <div key={key} className="adm-cms-field">
          <label>{label}</label>
          {hint && <span className="adm-cms-hint">{hint}</span>}
          <RichTextEditor
            content={value || ""}
            onChange={(html) => updateField(key, html)}
          />
        </div>
      );
    }

    return (
      <div key={key} className="adm-cms-field">
        <label>{label}</label>
        {hint && <span className="adm-cms-hint">{hint}</span>}
        <input
          type="text"
          className="adm-input"
          value={value || ""}
          onChange={(e) => updateField(key, e.target.value)}
        />
      </div>
    );
  }

  function renderPreview(data: Record<string, any>) {
    return (
      <div className="adm-cms-preview">
        <h4 className="adm-cms-preview-title">Apercu</h4>
        <div className="adm-cms-preview-content">
          {data.image_url && (
            <img src={data.image_url} alt={data.image_alt || ""} className="adm-cms-preview-img" />
          )}
          {data.title && <h2>{data.title}</h2>}
          {data.subtitle && <h3>{data.subtitle}</h3>}
          {data.text && <div dangerouslySetInnerHTML={{ __html: data.text }} />}
          {data.description && <div dangerouslySetInnerHTML={{ __html: data.description }} />}
          {data.button_label && (
            <span className="adm-cms-preview-btn">{data.button_label}</span>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="adm-cms-loading">Chargement du contenu…</div>;
  }

  return (
    <div className="adm-cms">
      <div className="adm-cms-pages">
        {pages.map((p) => (
          <button
            key={p}
            className={`adm-cms-page-btn ${activePage === p ? "active" : ""}`}
            onClick={() => { setActivePage(p); setEditingBlock(null); }}
          >
            {PAGE_LABELS[p] || p}
          </button>
        ))}
      </div>

      <div className="adm-cms-blocks">
        {pageBlocks.map((block) => {
          const isEditing = editingBlock === block.id;
          const data = isEditing ? editData : (block.draft || block.content);
          const hasDraft = block.draft !== null;
          const fields = Object.keys(data);

          return (
            <div key={block.id} className={`adm-cms-block ${isEditing ? "editing" : ""}`}>
              <div className="adm-cms-block-header">
                <div>
                  <h3 className="adm-cms-block-title">{block.block_label}</h3>
                  <div className="adm-cms-block-meta">
                    {hasDraft && (
                      <span className="adm-tag adm-tag-warn">Brouillon non publié</span>
                    )}
                    {block.is_published && block.published_at && (
                      <span className="adm-tag adm-tag-ok">
                        Publié le {new Date(block.published_at).toLocaleDateString("fr-BE")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="adm-cms-block-actions">
                  {!isEditing ? (
                    <>
                      <button
                        className="adm-btn adm-btn-sm"
                        onClick={() => startEditing(block)}
                      >
                        Modifier
                      </button>
                      <button
                        className="adm-btn adm-btn-sm adm-btn-ghost"
                        onClick={() => loadVersions(block.id)}
                      >
                        Historique
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="adm-btn adm-btn-sm"
                        onClick={saveDraft}
                        disabled={saving}
                      >
                        {saving ? "…" : "Sauvegarder le brouillon"}
                      </button>
                      <button
                        className="adm-btn adm-btn-sm adm-btn-primary"
                        onClick={publish}
                        disabled={publishing}
                      >
                        {publishing ? "…" : "Publier"}
                      </button>
                      <button
                        className="adm-btn adm-btn-sm adm-btn-ghost"
                        onClick={() => setEditingBlock(null)}
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="adm-cms-block-body">
                  <div className="adm-cms-fields">
                    {fields.map((key) => renderField(key, data[key]))}
                  </div>
                  {renderPreview(editData)}
                </div>
              )}

              {!isEditing && (
                <div className="adm-cms-block-summary">
                  {data.title && <span>{data.title}</span>}
                  {data.image_url && <img src={data.image_url} alt="" className="adm-cms-thumb" />}
                </div>
              )}

              {saveStatus && isEditing && (
                <div className="adm-cms-status">{saveStatus}</div>
              )}
            </div>
          );
        })}
      </div>

      {showVersions && (
        <div className="adm-modal-overlay" onClick={() => setShowVersions(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Historique des versions</h3>
            {versions.length === 0 ? (
              <p className="adm-cms-hint">Aucune version précédente.</p>
            ) : (
              <ul className="adm-cms-versions">
                {versions.map((v) => (
                  <li key={v.id} className="adm-cms-version-item">
                    <span>
                      {new Date(v.created_at).toLocaleString("fr-BE", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <button
                      className="adm-btn adm-btn-sm"
                      onClick={() => restoreVersion(v.id)}
                    >
                      Restaurer
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="adm-btn adm-btn-ghost" onClick={() => setShowVersions(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
