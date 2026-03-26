
export const WS_URL = "wss://6982lrvnjb.execute-api.us-east-1.amazonaws.com/prod";

export const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  warning:  { label: "Warning",  color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  info:     { label: "Info",     color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
};

export const STATUS_CONFIG = {
  open:         { label: "Open",         color: "#dc2626" },
  acknowledged: { label: "Acknowledged", color: "#d97706" },
  resolved:     { label: "Resolved",     color: "#16a34a" },
};

export const SERVICES = [
  "payment-service",
  "auth-service",
  "order-service",
  "inventory-service",
  "notification-service",
  "search-service",
];