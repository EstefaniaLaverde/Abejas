interface Props {
  log: string[];
}

export default function ActivityLog({ log }: Props) {
  const recent = log.slice(-30).reverse();
  return (
    <div className="activity-log">
      <h4>Actividad</h4>
      <ul>
        {recent.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
