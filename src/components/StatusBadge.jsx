export default function StatusBadge({ isOpen }) {
  return (
    <span className={`status-badge ${isOpen ? "open" : "closed"}`}>
      {isOpen ? "Aberto" : "Fechado"}
    </span>
  );
}
