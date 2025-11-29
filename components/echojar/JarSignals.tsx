// components/echojar/JarSignals.tsx
import { EchoJarEntry } from './types';
import { JarTooltip } from './JarTooltip';

type Props = {
  entry: EchoJarEntry;
  // optional – once you compute time saved, you can pass it here
  timeSavedMinutes?: number | null;
};

function MeterRow({
  label,
  value,
  max = 10,
  tooltip,
}: {
  label: string;
  value: number | null;
  max?: number;
  tooltip: string;
}) {
  const safeValue = typeof value === 'number' ? Math.max(0, Math.min(max, value)) : null;
  const pct = safeValue === null ? 0 : (safeValue / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          {label}
          <JarTooltip label={label} description={tooltip} />
        </span>
        <span className="text-slate-300">
          {safeValue === null ? '–' : `${safeValue}/${max}`}
        </span>
      </div>
      <div className="jar-meter-track">
        <div className="jar-meter-fill" style={{ width: `${pct}%`, opacity: safeValue ? 1 : 0.18 }} />
      </div>
    </div>
  );
}

export function JarSignals({ entry, timeSavedMinutes }: Props) {
  const { signals } = entry;

  const timeLabel =
    typeof timeSavedMinutes === 'number'
      ? `${Math.floor(timeSavedMinutes / 60)}h ${timeSavedMinutes % 60}m`
      : null;

  return (
    <section className="jar-card mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.4fr)] p-5 md:p-6">
      <div className="space-y-4">
        <div className="jar-section-label">Signals</div>
        <div className="space-y-3">
          <MeterRow
            label="Focus"
            value={signals.focusScore}
            tooltip="Higher = more time in clean, uninterrupted blocks with low fragmentation."
          />
          <MeterRow
            label="Load"
            value={signals.loadScore}
            tooltip="Rough sense of how 'full' the day felt – meetings, tasks, and context switching."
          />
          <MeterRow
            label="Email drag"
            value={signals.emailDragScore}
            tooltip="How much your inbox pulled on your attention. Higher = more action/follow-up pressure."
          />
          <MeterRow
            label="Meeting noise"
            value={signals.meetingNoiseScore}
            tooltip="Higher = more meetings that were noisy, unnecessary, or poorly timed for focus."
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="jar-section-label mb-2">Energy Map</div>
          {entry.energyMap ? (
            <ul className="space-y-1.5 text-sm text-slate-300">
              {Object.entries(entry.energyMap).map(([slot, desc]) => (
                <li key={slot} className="flex justify-between gap-3">
                  <span className="jar-mono-label text-slate-500">{slot}</span>
                  <span className="text-right text-[13px] text-slate-200">{desc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              Echo will draw an energy map as it sees more of your days.
            </p>
          )}
        </div>

        <div>
          <div className="jar-section-label mb-2">Time saved</div>
          {timeLabel ? (
            <p className="text-sm text-slate-200">
              Echo estimates it protected around{' '}
              <span className="font-semibold text-amber-300">{timeLabel}</span> of your time today.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Once your rules are wired (emails resolved, noisey meetings, deep work), this will show
              a simple “time saved” estimate for each day.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
