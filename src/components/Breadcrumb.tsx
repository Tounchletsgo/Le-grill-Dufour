"use client";

import { useTranslation } from "@/i18n/LocaleContext";
import { localizedHref } from "@/i18n/types";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { locale, t } = useTranslation();

  return (
    <nav className="breadcrumb" aria-label={t("breadcrumb.ariaLabel")}>
      <div className="container">
        <ol>
          <li>
            <a href={localizedHref("/", locale)}>{t("breadcrumb.home")}</a>
          </li>
          {items.map((item, i) => (
            <li key={i}>
              {item.href ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
