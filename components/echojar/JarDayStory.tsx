// components/echojar/JarDayStory.tsx
import { EchoJarEntry } from './types';

type Props = {
  entry: EchoJarEntry;
};

export function JarDayStory({ entry }: Props) {
  return (
    <section className="jar-card mt-6 grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.7fr)] p-6 md:p-7">
      {/* Left: story / themes */}
      <div className="space-y-4">
        <div>
          <div className="jar-section-label mb-1">Entry</div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-100">{entry.headline}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{entry.dayStory}</p>
        </div>

        <div>
          <div className="jar-section-label mb-2">Themes</div>
          <div className="flex flex-wrap gap-2">
            {entry.themes.map((theme) => (
              <span key={theme} className="jar-chip">
                {theme}
              </span>
            ))}
            {!entry.themes.length && (
              <p className="text-xs text-slate-500">Echo is still learning your themes.</p>
            )}
          </div>
        </div>

        {entry.patterns.length > 0 && (
          <div>
            <div className="jar-section-label mb-2">Patterns</div>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {entry.patterns.map((p, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-[6px] h-[3px] w-[3px] rounded-full bg-slate-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right: wins / strains */}
      <div className="space-y-4">
        <div className="jar-subcard p-4">
          <div className="jar-section-label mb-2">Wins</div>
          {entry.wins.length ? (
            <ul className="space-y-1.5 text-sm text-slate-200">
              {entry.wins.map((win, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[6px] h-[3px] w-[3px] rounded-full bg-emerald-400/80" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Echo didn&apos;t detect specific wins today.</p>
          )}
        </div>

        <div className="jar-subcard p-4">
          <div className="jar-section-label mb-2">Strains</div>
          {entry.strains.length ? (
            <ul className="space-y-1.5 text-sm text-slate-200">
              {entry.strains.map((strain, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[6px] h-[3px] w-[3px] rounded-full bg-rose-400/80" />
                  <span>{strain}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              No obvious strain today – Echo will flag pressure when it appears.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
