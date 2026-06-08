import BarCard from "./BarCard.jsx";

export default function BarList({ bars, onSelectBar }) {
  if (!bars.length) {
    return (
      <section className="empty-state">
        <h2>Nenhum bar encontrado</h2>
        <p>Tente outro bairro, cidade ou remova algum filtro.</p>
      </section>
    );
  }

  return (
    <section className="bar-grid" aria-label="Lista de bares">
      {bars.map((bar) => (
        <BarCard bar={bar} key={bar.id} onSelect={onSelectBar} />
      ))}
    </section>
  );
}
