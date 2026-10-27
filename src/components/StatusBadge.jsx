import { status as t } from "../texts/app.js";

export default function StatusBadge({ isOpen, isClosingSoon = false, detail }) {
  const stateClass = !isOpen ? "closed" : isClosingSoon ? "closing-soon" : "open";

  return (
    <span className={`status-badge ${stateClass}`} title={detail || undefined}>
      {isOpen ? t.open : t.closed}
      {detail && <small className="status-badge-detail"> · {detail}</small>}
    </span>
  );
}
