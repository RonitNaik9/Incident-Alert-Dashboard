import { SEVERITY_CONFIG } from "../utils/constants";

export default function StatsPanel({ incidents }) {
  const open = incidents.filter((i) => i.status === "open");
  const acknowledged = incidents.filter((i) => i.status === "acknowledged");
  const resolved = incidents.filter((i) => i.status === "resolved");

  const bySeverity = {
    critical: incidents.filter((i) => i.severity === "critical").length,
    warning: incidents.filter((i) => i.severity === "warning").length,
    info: incidents.filter((i) => i.severity === "info").length,
  };

  // mean time to acknowledge (for incidents that have been acknowledged)
  const ackTimes = incidents
    .filter((i) => i.acknowledgedAt)
    .map((i) => new Date(i.acknowledgedAt) - new Date(i.timestamp));
  const mtta = ackTimes.length > 0
    ? Math.round(ackTimes.reduce((a, b) => a + b, 0) / ackTimes.length / 1000)
    : null;

  const stats = [
    { label: "Open", value: open.length, color: "#dc2626" },
    { label: "Acknowledged", value: acknowledged.length, color: "#d97706" },
    { label: "Resolved", value: resolved.length, color: "#16a34a" },
  ];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {Object.entries(bySeverity).map(([sev, count]) => (
          <div
            key={sev}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              background: SEVERITY_CONFIG[sev].bg,
              border: `1px solid ${SEVERITY_CONFIG[sev].border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: SEVERITY_CONFIG[sev].color, fontWeight: 600 }}>
              {SEVERITY_CONFIG[sev].label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: SEVERITY_CONFIG[sev].color }}>
              {count}
            </div>
          </div>
        ))}
        {mtta !== null && (
          <div
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>MTTA</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{mtta}s</div>
          </div>
        )}
      </div>
    </div>
  );
}