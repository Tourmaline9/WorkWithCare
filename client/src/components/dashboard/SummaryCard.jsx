export default function SummaryCard({ title, value, tone }) {
  return (
    <div className={`card summary-card ${tone || ''}`.trim()}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}
