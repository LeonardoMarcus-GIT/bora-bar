import { formatCurrency } from "../utils/format.js";

export const categoryLabels = {
  cervejas: "Cervejas",
  drinks: "Drinks",
  porcoes: "Porções",
  combos: "Combos"
};

export function getCategoryLabel(name) {
  return categoryLabels[name] ?? name;
}

// id estável para os atalhos do cardápio (#menu-<categoria>).
export function getCategoryAnchor(name) {
  return `menu-${String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

export default function MenuCategory({ name, items }) {
  return (
    <section className="menu-category" id={getCategoryAnchor(name)}>
      <h3>{getCategoryLabel(name)}</h3>
      <div className="menu-items">
        {items.map((item) => (
          <div className={`menu-item ${item.imageUrl ? "has-photo" : ""}`} key={item.name}>
            <span>
              {item.name}
              {item.description && (
                <small className="menu-item-description">{item.description}</small>
              )}
            </span>
            <strong>{formatCurrency(item.price)}</strong>
            {item.imageUrl && (
              <img
                className="menu-item-photo"
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                width="72"
                height="72"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
