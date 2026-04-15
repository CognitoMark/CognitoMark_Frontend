const MetricCard = ({ label, value, icon }) => (
  <div className="metric-card">
    {icon && <div style={{ fontSize: "1.5rem", marginBottom: 10 }}>{icon}</div>}
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
  </div>
);

export default MetricCard;
