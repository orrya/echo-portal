export function SignalTrend({ values }: { values: number[] }) {
  if (!values?.length) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min || 1)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-16">
      <polyline
        fill="none"
        stroke="url(#grad)"
        strokeWidth="4"
        points={points}
      />
      <defs>
        <linearGradient id="grad">
          <stop offset="0%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
    </svg>
  );
}
