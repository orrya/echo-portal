// components/echojar/JarEchoComment.tsx
import { EchoJarEntry } from './types';

type Props = {
  entry: EchoJarEntry;
};

export function JarEchoComment({ entry }: Props) {
  if (!entry.echoComment) return null;

  return (
    <section className="jar-card mt-6 p-5 md:p-6">
      <div className="jar-section-label mb-2">Echo&apos;s one-line take</div>
      <p className="text-sm leading-relaxed text-slate-200">{entry.echoComment}</p>
    </section>
  );
}
