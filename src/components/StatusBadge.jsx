export default function StatusBadge({ isOpen, isClosingSoon = false, detail }) {
  const stateClass = !isOpen ? "closed" : isClosingSoon ? "closing-soon" : "open";

  return (
    <span className={`status-badge ${stateClass}`} title={detail || undefined}>
      {isOpen ? "Aberto" : "Fechado"}
      {detail && <small className="status-badge-detail"> · {detail}</small>}
    </span>
  );
}
