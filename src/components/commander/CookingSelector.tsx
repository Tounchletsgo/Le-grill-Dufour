"use client";

import { cookingLevels, getGroupLevels, isLockedGroup, type CookingLevel } from "@/data/cookingData";

interface CookingSelectorProps {
  groupKey: string;
  groupLabel: string;
  selectedKey: string;
  onSelect: (key: string, label: string) => void;
  isDelivery: boolean;
}

export default function CookingSelector({
  groupKey,
  groupLabel,
  selectedKey,
  onSelect,
  isDelivery,
}: CookingSelectorProps) {
  const levels = getGroupLevels(groupKey);
  const locked = isLockedGroup(groupKey);

  if (levels.length === 0) return null;

  const availableLevels = isDelivery
    ? levels.filter((l) => l.available_delivery)
    : levels;

  if (locked) {
    const level = availableLevels[0];
    if (!level) return null;
    return (
      <div className="cmd-cooking-section">
        <h4 className="cmd-cooking-title">Cuisson</h4>
        <div className="cmd-cooking-locked">
          <span className="cmd-cooking-dot" style={{ background: level.color }} />
          <span className="cmd-cooking-locked-label">{level.label}</span>
          <span className="cmd-cooking-locked-info">{level.description}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cmd-cooking-section">
      <h4 className="cmd-cooking-title">Cuisson — {groupLabel}</h4>
      <div className="cmd-cooking-list">
        {availableLevels.map((level) => (
          <label
            key={level.key}
            className={`cmd-cooking-option ${selectedKey === level.key ? "selected" : ""} ${level.is_recommended ? "recommended" : ""}`}
          >
            <input
              type="radio"
              name="cooking"
              checked={selectedKey === level.key}
              onChange={() => onSelect(level.key, level.label)}
            />
            <span className="cmd-cooking-dot" style={{ background: level.color }} />
            <span className="cmd-cooking-label">{level.label}</span>
            <span className="cmd-cooking-temp">{level.temperature}</span>
            {level.is_recommended && (
              <span className="cmd-cooking-badge">Recommandé</span>
            )}
          </label>
        ))}
      </div>
      {isDelivery && (
        <p className="cmd-cooking-delivery-note">
          Pour la livraison, la cuisine cuit un cran en dessous pour compenser le transport.
        </p>
      )}
    </div>
  );
}
