import AlertCard from "./AlertCard";

export default function AlertFeed({ incidents, onAction }) {
  if (incidents.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
        No incidents yet. Waiting for alerts...
      </div>
    );
  }

  return (
    <div>
      {incidents.map((incident) => (
        <AlertCard
          key={incident.incidentId}
          incident={incident}
          onAction={onAction}
        />
      ))}
    </div>
  );
}