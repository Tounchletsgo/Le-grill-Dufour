interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumb" aria-label="Fil d'Ariane">
      <div className="container">
        <ol>
          <li>
            <a href="/">Accueil</a>
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
