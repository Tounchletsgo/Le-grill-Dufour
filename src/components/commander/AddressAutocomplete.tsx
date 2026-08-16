"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";

interface StreetResult {
  id: string;
  name: string;
  postal_code: string;
  municipality: string;
}

interface AddressData {
  streetName: string;
  houseNumber: string;
  box: string;
  postalCode: string;
  municipality: string;
  addressSource: "autocomplete" | "manual";
}

interface Props {
  value: AddressData;
  onChange: (data: AddressData) => void;
}

function highlightMatch(text: string, query: string): JSX.Element {
  if (!query || query.length < 2) return <>{text}</>;

  const norm = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  const textNorm = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  const words = norm.split(/\s+/).filter(Boolean);
  const ranges: [number, number][] = [];

  for (const w of words) {
    let idx = 0;
    while (idx < textNorm.length) {
      const pos = textNorm.indexOf(w, idx);
      if (pos === -1) break;
      ranges.push([pos, pos + w.length]);
      idx = pos + 1;
    }
  }

  if (ranges.length === 0) return <>{text}</>;

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) {
      last[1] = Math.max(last[1], r[1]);
    } else {
      merged.push([...r]);
    }
  }

  const parts: JSX.Element[] = [];
  let prev = 0;
  merged.forEach(([start, end], i) => {
    if (prev < start) parts.push(<span key={`t${i}`}>{text.slice(prev, start)}</span>);
    parts.push(<mark key={`m${i}`} className="cmd-ac-highlight">{text.slice(start, end)}</mark>);
    prev = end;
  });
  if (prev < text.length) parts.push(<span key="end">{text.slice(prev)}</span>);

  return <>{parts}</>;
}

const HOUSE_RE = /^\d{1,4}[a-zA-Z]?$/;

export default function AddressAutocomplete({ value, onChange }: Props) {
  const uid = useId();
  const listboxId = `${uid}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const noResultTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [query, setQuery] = useState(value.streetName);
  const [results, setResults] = useState<StreetResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(value.addressSource === "manual");
  const [showNoResult, setShowNoResult] = useState(false);
  const [selected, setSelected] = useState(!!value.streetName && value.addressSource === "autocomplete");

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      setShowNoResult(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/streets/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.results || []);
      setIsOpen(true);
      setActiveIdx(-1);

      if ((data.results || []).length === 0) {
        noResultTimerRef.current = setTimeout(() => setShowNoResult(true), 2000);
      } else {
        setShowNoResult(false);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    setShowNoResult(false);

    if (noResultTimerRef.current) clearTimeout(noResultTimerRef.current);

    onChange({
      ...value,
      streetName: val,
      postalCode: "",
      municipality: "",
      addressSource: "manual",
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 200);
  };

  const selectStreet = (street: StreetResult) => {
    setQuery(street.name);
    setResults([]);
    setIsOpen(false);
    setSelected(true);
    setShowNoResult(false);
    setManualMode(false);

    onChange({
      ...value,
      streetName: street.name,
      postalCode: street.postal_code,
      municipality: street.municipality,
      addressSource: "autocomplete",
    });

    setTimeout(() => numberRef.current?.focus(), 50);
  };

  const switchToManual = () => {
    setManualMode(true);
    setIsOpen(false);
    setShowNoResult(false);
    onChange({ ...value, addressSource: "manual" });
  };

  const switchToAuto = () => {
    setManualMode(false);
    setQuery("");
    setSelected(false);
    onChange({
      streetName: "",
      houseNumber: value.houseNumber,
      box: value.box,
      postalCode: "",
      municipality: "",
      addressSource: "autocomplete",
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < results.length) {
        selectStreet(results[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIdx(-1);
    }
  };

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (noResultTimerRef.current) clearTimeout(noResultTimerRef.current);
    };
  }, []);

  const liveText =
    results.length > 0
      ? `${results.length} rue${results.length > 1 ? "s" : ""} trouvée${results.length > 1 ? "s" : ""}`
      : query.length >= 2 && !loading
        ? "Aucune rue trouvée"
        : "";

  return (
    <div className="cmd-address-block">
      {/* Street name */}
      <div className="cmd-form-group cmd-ac-wrapper">
        <label htmlFor={`${uid}-street`}>
          Rue *
          {manualMode && (
            <button type="button" className="cmd-ac-switch" onClick={switchToAuto}>
              Rechercher
            </button>
          )}
        </label>

        {manualMode ? (
          <input
            type="text"
            id={`${uid}-street`}
            value={value.streetName}
            onChange={(e) => onChange({ ...value, streetName: e.target.value })}
            placeholder="Nom de la rue"
            required
            autoComplete="street-address"
          />
        ) : (
          <>
            <div className="cmd-ac-input-wrap">
              <input
                ref={inputRef}
                type="text"
                id={`${uid}-street`}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={activeIdx >= 0 ? `${uid}-opt-${activeIdx}` : undefined}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (results.length > 0 && !selected) setIsOpen(true); }}
                placeholder="Tapez le nom de votre rue..."
                required
                autoComplete="off"
              />
              {loading && <span className="cmd-ac-spinner" aria-hidden="true" />}
            </div>

            <div aria-live="polite" className="sr-only">{liveText}</div>

            {isOpen && results.length > 0 && (
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                className="cmd-ac-listbox"
                aria-label="Rues correspondantes"
              >
                {results.map((street, i) => (
                  <li
                    key={street.id}
                    id={`${uid}-opt-${i}`}
                    role="option"
                    aria-selected={i === activeIdx}
                    className={`cmd-ac-option ${i === activeIdx ? "cmd-ac-active" : ""}`}
                    onMouseDown={(e) => { e.preventDefault(); selectStreet(street); }}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <span className="cmd-ac-street-name">
                      {highlightMatch(street.name, query)}
                    </span>
                    <span className="cmd-ac-street-meta">
                      {street.postal_code} {street.municipality}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {showNoResult && !isOpen && query.length >= 2 && !selected && (
              <div className="cmd-ac-no-result">
                Rue introuvable ?{" "}
                <button type="button" className="cmd-ac-manual-link" onClick={switchToManual}>
                  Saisissez-la manuellement.
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* House number + box */}
      <div className="cmd-form-row">
        <div className="cmd-form-group" style={{ flex: "0 0 120px" }}>
          <label htmlFor={`${uid}-number`}>N° *</label>
          <input
            ref={numberRef}
            type="text"
            id={`${uid}-number`}
            value={value.houseNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 6);
              onChange({ ...value, houseNumber: val });
            }}
            placeholder="12A"
            required
            autoComplete="off"
            inputMode="text"
            pattern="[0-9]{1,4}[a-zA-Z]?"
          />
        </div>
        <div className="cmd-form-group">
          <label htmlFor={`${uid}-box`}>Boîte / étage</label>
          <input
            type="text"
            id={`${uid}-box`}
            value={value.box}
            onChange={(e) => onChange({ ...value, box: e.target.value })}
            placeholder="Bte 2, 3e étage..."
            autoComplete="off"
          />
        </div>
      </div>

      {/* Postal code + municipality */}
      <div className="cmd-form-row">
        <div className="cmd-form-group">
          <label htmlFor={`${uid}-postal`}>
            Code postal {!manualMode && selected ? "" : "*"}
          </label>
          <input
            type="text"
            id={`${uid}-postal`}
            value={value.postalCode}
            onChange={(e) => {
              if (manualMode) onChange({ ...value, postalCode: e.target.value });
            }}
            readOnly={!manualMode && selected}
            required
            autoComplete="postal-code"
            placeholder="7700"
            className={!manualMode && selected ? "cmd-ac-readonly" : ""}
          />
        </div>
        <div className="cmd-form-group">
          <label htmlFor={`${uid}-city`}>
            Commune {!manualMode && selected ? "" : "*"}
            {!manualMode && selected && (
              <button
                type="button"
                className="cmd-ac-switch"
                onClick={() => {
                  setSelected(false);
                  setQuery("");
                  onChange({
                    ...value,
                    streetName: "",
                    postalCode: "",
                    municipality: "",
                    addressSource: "autocomplete",
                  });
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                modifier
              </button>
            )}
          </label>
          <input
            type="text"
            id={`${uid}-city`}
            value={value.municipality}
            onChange={(e) => {
              if (manualMode) onChange({ ...value, municipality: e.target.value });
            }}
            readOnly={!manualMode && selected}
            required
            autoComplete="address-level2"
            placeholder="Mouscron"
            className={!manualMode && selected ? "cmd-ac-readonly" : ""}
          />
        </div>
      </div>
    </div>
  );
}
