import { formatCurrency } from "../utils/format.js";

const categoryLabels = {
  cervejas: "Cervejas",
  drinks: "Drinks",
  porcoes: "Porções",
  combos: "Combos"
};

export default function MenuCategory({ name, items }) {
  return (
    <section className="menu-category">
      <h3>{categoryLabels[name] ?? name}</h3>
      <div className="menu-items">
        {items.map((item) => (
          <div className="menu-item" key={item.name}>
            <span>{item.name}</span>
            <strong>{formatCurrency(item.price)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
