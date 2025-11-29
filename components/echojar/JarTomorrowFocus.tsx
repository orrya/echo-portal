// components/echojar/JarTomorrowFocus.tsx
import { EchoJarEntry } from './types';

type Props = {
  entry: EchoJarEntry;
};

export function JarTomorrowFocus({ entry }: Props) {
  if (!entry.tomorrowFocus) return null;

  return (
    <section className="jar-card mt-6 p-5 md:p-6">
      <div className="jar-section-label mb-2">Tomorrow, Echo suggests…</div>
      <p className="text-sm leading-relaxed text-slate-200">{entry.tomorrowFocus}</p>
    </section>
  );
}
