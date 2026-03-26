import { SEVERITY_CONFIG, STATUS_CONFIG } from "../utils/constants";

export default function AlertCard({ incident, onAction }) {
  const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.info;
  const status = STATUS_CONFIG[incident.status] || STATUS_CONFIG.open;
  const time = new Date(incident.timestamp).toLocaleTimeString();

  return (
    <div
      style={{
        border: `1px solid ${sev.border}`,
        borderLeft: `4px solid ${sev.color}`,
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 8,
        background: sev.bg,
        animation: "fadeIn 0.3s ease-in",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "#fff",
              background: sev.color,
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            {sev.label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: status.color,
              textTransform: "uppercase",
            }}
          >
            {status.label}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{time}</span>
      </div>

      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
        {incident.service}
      </div>
      <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
        {incident.message}
      </div>

      {incident.status !== "resolved" && (
        <div style={{ display: "flex", gap: 6 }}>
          {incident.status === "open" && (
            <button
              onClick={() => onAction("acknowledge", incident.incidentId, incident.timestamp)}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Acknowledge
            </button>
          )}
          {incident.severity !== "critical" && (
            <button
              onClick={() => onAction("escalate", incident.incidentId, incident.timestamp)}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid #fca5a5",
                background: "#fff",
                color: "#dc2626",
                cursor: "pointer",
              }}
            >
              Escalate
            </button>
          )}
          <button
            onClick={() => onAction("resolve", incident.incidentId, incident.timestamp)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 4,
              border: "1px solid #86efac",
              background: "#f0fdf4",
              color: "#16a34a",
              cursor: "pointer",
            }}
          >
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}