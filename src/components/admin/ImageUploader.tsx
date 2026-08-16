"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import Cropper from "react-cropper";
import "react-cropper/node_modules/cropperjs/dist/cropper.css";

interface Props {
  currentUrl?: string;
  aspectRatio?: number;
  onUpload: (image: { url: string; alt_text: string; id?: string }) => void;
  authHeaders: () => Record<string, string>;
}

export default function ImageUploader({ currentUrl, aspectRatio, onUpload, authHeaders }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [cropping, setCropping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const cropperRef = useRef<Cropper>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 10 * 1024 * 1024;

  const handleFile = useCallback((f: File) => {
    setError(null);
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(f.type)) {
      setError("Format non supporté. Utilisez JPG, PNG, WebP ou GIF.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(`Image trop lourde (${(f.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 10 Mo.`);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setCropping(true);
    };
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleUpload() {
    if (!file) return;
    if (!altText.trim()) {
      setError("Le texte alternatif est obligatoire (accessibilité).");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", altText.trim());

      if (cropping && cropperRef.current) {
        const cropper = (cropperRef.current as any).cropper;
        if (cropper) {
          const data = cropper.getData(true);
          formData.append("crop", JSON.stringify({
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
          }));
        }
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur upload");

      onUpload({
        url: json.image.url,
        alt_text: altText.trim(),
        id: json.image.id,
      });

      setFile(null);
      setPreview(null);
      setCropping(false);
      setAltText("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function cancelCrop() {
    setFile(null);
    setPreview(null);
    setCropping(false);
    setAltText("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="adm-img-uploader">
      {currentUrl && !cropping && (
        <div className="adm-img-current">
          <img src={currentUrl} alt="Image actuelle" />
        </div>
      )}

      {!cropping ? (
        <div
          className={`adm-img-dropzone ${dragOver ? "dragover" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFileChange}
            hidden
          />
          <span className="adm-img-dropzone-icon">+</span>
          <span>Glissez une image ici ou cliquez pour choisir</span>
          <span className="adm-img-hint">JPG, PNG, WebP ou GIF — max 10 Mo</span>
        </div>
      ) : (
        <div className="adm-img-crop-area">
          <Cropper
            ref={cropperRef as any}
            src={preview || ""}
            style={{ height: 300, width: "100%" }}
            aspectRatio={aspectRatio}
            viewMode={1}
            guides
            responsive
          />

          <div className="adm-img-alt-row">
            <label htmlFor="img-alt">
              Texte alternatif <span className="adm-required">*</span>
            </label>
            <input
              id="img-alt"
              type="text"
              className="adm-input"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Décrivez l'image (ex : Vue du restaurant depuis la terrasse)"
            />
            <span className="adm-img-hint">
              Décrivez ce que montre l'image, pour les lecteurs d'écran et le référencement.
            </span>
          </div>

          <div className="adm-img-actions">
            <button
              type="button"
              className="adm-btn"
              onClick={cancelCrop}
              disabled={uploading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              onClick={handleUpload}
              disabled={uploading || !altText.trim()}
            >
              {uploading ? "Envoi…" : "Téléverser"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}
    </div>
  );
}
