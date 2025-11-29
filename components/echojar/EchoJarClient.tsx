// components/echojar/EchoJarClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  EchoJarEntry,
  RawEchoJarRow,
  JarHero,
  JarPastDays,
  JarDayStory,
  JarSignals,
  JarTomorrowFocus,
  JarEchoComment,
} from './index';

type ApiResponse = {
  entries: RawEchoJarRow[];
};

function normaliseRow(row: RawEchoJarRow): EchoJarEntry {
  const recommendations = row.recommendations || {};
  const predictive = row.predictive_signals || {};

  const themes = row.emerging_themes ?? [];
  const tags = row.tags ?? [];

  const patterns = row.detected_patterns ?? [];

  const headlineSource = row.behavioural_summary || '';
  const headline =
    headlineSource.split('.')[0]?.trim() || 'Echo is still forming today’s story.';

  const dayStory = row.behavioural_summary || headline;

  const signals = {
    focusScore: row.focus_score,
    loadScore: row.strain_score, // for now, re-use until you wire a dedicated load metric
    emailDragScore: null,
    meetingNoiseScore: null,
  };

  return {
    id: row.id,
    date: row.date,
    headline,
    dayStory,
    wins: recommendations.wins ?? [],
    strains: recommendations.strains ?? [],
    themes,
    tags,
    patterns,
    signals,
    tomorrowFocus: predictive.focusOutlook || null,
    echoComment: (recommendations.adjustments && recommendations.adjustments[0]) || null,
    energyMap: predictive.energyMap || null,
    attentionRisks: predictive.attentionRisks ?? [],
  };
}

export function EchoJarClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RawEchoJarRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/echojar/all', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch EchoJar entries');
        const data: ApiResponse = await res.json();

        if (!cancelled) {
          const entries = data.entries ?? [];
          setRows(entries);
          setSelectedId(entries[0]?.id ?? null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setRows([]);
          setSelectedId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const entries: EchoJarEntry[] = useMemo(
    () => rows.map(normaliseRow),
    [rows]
  );

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries[0] ?? null,
    [entries, selectedId]
  );

  if (loading && !selected) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">
        Echo is quietly stitching your day together…
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="h-[60vh] flex flex-col items-start justify-center">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          EchoJar hasn&apos;t formed yet.
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          Once Echo has seen enough of your day (email, meetings, summaries), it will start forming a
          daily EchoJar entry with patterns, themes and signals. Check back after your AM and PM
          summaries have run.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <JarHero entry={selected} />
      <JarPastDays
        entries={entries}
        selectedId={selected.id}
        onSelect={setSelectedId}
      />
      <JarDayStory entry={selected} />
      <JarSignals entry={selected} timeSavedMinutes={null} />
      <JarTomorrowFocus entry={selected} />
      <JarEchoComment entry={selected} />
    </div>
  );
}
