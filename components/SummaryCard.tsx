export interface Summary {
  id: string
  summary_date: string
  time_of_day: 'AM' | 'PM'
  content: string
  weekly_metrics?: any
}

export default function SummaryCard({ summaries }: { summaries: Summary[] }) {
  return (
    <div className="space-y-4">
      {summaries.map((summary) => (
        <details
          key={summary.id}
          className="bg-graphite-dark rounded-lg p-4 shadow-glass"
        >
          <summary className="cursor-pointer outline-none text-purple">
            {summary.summary_date} {summary.time_of_day}
          </summary>
          <p className="mt-2 whitespace-pre-line text-sm text-white">
            {summary.content}
          </p>
          {summary.weekly_metrics && (
            <pre className="mt-2 text-xs text-purple-light">
              {JSON.stringify(summary.weekly_metrics, null, 2)}
            </pre>
          )}
        </details>
      ))}
    </div>
  )
}