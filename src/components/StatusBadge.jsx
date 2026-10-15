export default function StatusBadge({ isOpen, detail }) {
  return (
    <span
      className={`status-badge ${isOpen ? "open" : "closed"}`}
      title={detail || undefined}
    >
      {isOpen ? "Aberto" : "Fechado"}
      {detail && <small className="status-badge-detail"> · {detail}</small>}
    </span>
  );
}
