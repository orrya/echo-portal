// components/echojar/JarPastDays.tsx
'use client';

import { EchoJarEntry } from './types';

type Props = {
  entries: EchoJarEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function JarPastDays({ entries, selectedId, onSelect }: Props) {
  if (!entries.length) return null;

  return (
    <section className="jar-card mt-6 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="jar-section-label">Timeline</div>
        <p className="text-[11px] text-slate-500">Last {entries.length} EchoJar days</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map((entry) => {
          const d = new Date(entry.date);
          const label = d.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          });

          const active = entry.id === selectedId;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelect(entry.id)}
              className={`jar-pill transition ${
                active ? 'jar-pill-active' : 'hover:border-slate-500/80 hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
