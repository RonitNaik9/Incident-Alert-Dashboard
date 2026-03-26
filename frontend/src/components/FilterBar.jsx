import { SERVICES } from "../utils/constants";

const btnStyle = (active) => ({
  fontSize: 12,
  padding: "4px 12px",
  borderRadius: 4,
  border: "1px solid",
  borderColor: active ? "#2563eb" : "#d1d5db",
  background: active ? "#eff6ff" : "#fff",
  color: active ? "#2563eb" : "#374151",
  cursor: "pointer",
  fontWeight: active ? 600 : 400,
});

export default function FilterBar({ filters, setFilters }) {
  const toggle = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6b7280", lineHeight: "28px" }}>Severity:</span>
        {["critical", "warning", "info"].map((s) => (
          <button key={s} style={btnStyle(filters.severity === s)} onClick={() => toggle("severity", s)}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6b7280", lineHeight: "28px" }}>Status:</span>
        {["open", "acknowledged", "resolved"].map((s) => (
          <button key={s} style={btnStyle(filters.status === s)} onClick={() => toggle("status", s)}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6b7280", lineHeight: "28px" }}>Service:</span>
        {SERVICES.map((s) => (
          <button key={s} style={btnStyle(filters.service === s)} onClick={() => toggle("service", s)}>
            {s.replace("-service", "")}
          </button>
        ))}
      </div>
    </div>
  );
}