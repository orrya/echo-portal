// components/echojar/JarHero.tsx
import { EchoJarEntry } from './types';
import { JarTooltip } from './JarTooltip';

type Props = {
  entry: EchoJarEntry;
};

export function JarHero({ entry }: Props) {
  const date = new Date(entry.date);

  const dateLabel = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const focus = entry.signals.focusScore ?? 0;

  return (
    <section className="jar-card jar-gold-soft-bg p-6 md:p-8 lg:p-9">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="jar-section-label mb-1">EchoJar</div>
          <h1 className="text-2xl md:text-3xl lg:text-[32px] font-semibold tracking-tight">
            Your quiet timeline.
          </h1>
          <p className="mt-1 text-sm text-slate-400">{dateLabel}</p>
          <p className="mt-4 max-w-2xl text-sm md:text-[15px] leading-relaxed text-slate-200">
            {entry.dayStory}
          </p>
        </div>

        {/* Focus badge */}
        <div className="flex flex-col items-end gap-3">
          <div className="jar-section-label mb-1 text-right">FOCUS</div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-950/80 ring-1 ring-slate-700/80 shadow-2xl">
            <div className="absolute inset-1 rounded-full bg-gradient-to-b from-slate-900 to-slate-950 shadow-inner" />
            <div className="relative flex flex-col items-center justify-center">
              <span className="text-[10px] tracking-[0.18em] text-slate-500">SCORE</span>
              <span className="mt-1 text-2xl font-semibold text-amber-300">{focus}</span>
              <span className="text-[10px] text-slate-500">/10</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            Focus is a 0–10 signal for how protective today was of your best work.
            <JarTooltip
              label="Focus score"
              description="Roughly: 1–3 = fragmented day, 4–6 = mixed, 7–10 = well-protected deep work windows."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
