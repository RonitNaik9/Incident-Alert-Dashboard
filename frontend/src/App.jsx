import { useState, useCallback } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import StatsPanel from "./components/StatsPanel";
import FilterBar from "./components/FilterBar";
import AlertFeed from "./components/AlertFeed";

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [filters, setFilters] = useState({ severity: null, status: null, service: null });

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case "NEW_INCIDENT":
        setIncidents((prev) => [data.incident, ...prev]);
        break;

      case "INCIDENT_ACKNOWLEDGED":
      case "INCIDENT_ESCALATED":
      case "INCIDENT_RESOLVED":
        setIncidents((prev) =>
          prev.map((i) =>
            i.incidentId === data.incident.incidentId ? data.incident : i
          )
        );
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }, []);

  const { connected, sendAction } = useWebSocket(handleMessage);

  const filtered = incidents.filter((i) => {
    if (filters.severity && i.severity !== filters.severity) return false;
    if (filters.status && i.status !== filters.status) return false;
    if (filters.service && i.service !== filters.service) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Incident Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "#16a34a" : "#dc2626",
            }}
          />
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      <StatsPanel incidents={incidents} />
      <FilterBar filters={filters} setFilters={setFilters} />
      <AlertFeed incidents={filtered} onAction={sendAction} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}