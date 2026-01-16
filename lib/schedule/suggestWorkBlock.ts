// lib/schedule/suggestWorkBlock.ts

export type SuggestedBlock = {
  start: string;
  end: string;
  minutes: number;
  reason: "deep_work" | "quiet_gap";
};

type DeepWorkWindow = {
  start: string;
  end: string;
  minutes: number;
};

type TimelineItem = {
  start: string;
  end: string;
};

type SuggestParams = {
  estimatedMinutes: number;
  deepWorkWindows: DeepWorkWindow[];
  dayTimeline: TimelineItem[];
  deadline?: string; // ISO date or datetime
  timezone?: string; // optional future-proofing
};

/**
 * Suggests a concrete block of time for focused work.
 * Returns null if nothing sensible exists.
 */
export function suggestWorkBlock({
  estimatedMinutes,
  deepWorkWindows,
  dayTimeline,
  deadline,
}: SuggestParams): SuggestedBlock | null {
  const now = new Date();
  const latestAllowedEnd = deadline
    ? new Date(deadline)
    : addBusinessDays(now, 3);

  /* ---------------------------------------------------------
     1. Prefer deep-work windows
  --------------------------------------------------------- */

  for (const w of deepWorkWindows) {
    const start = new Date(w.start);
    const end = new Date(w.end);

    if (
      end <= latestAllowedEnd &&
      w.minutes >= estimatedMinutes &&
      start > now
    ) {
      return {
        start: start.toISOString(),
        end: new Date(start.getTime() + estimatedMinutes * 60000).toISOString(),
        minutes: estimatedMinutes,
        reason: "deep_work",
      };
    }
  }

  /* ---------------------------------------------------------
     2. Derive quiet gaps between meetings
  --------------------------------------------------------- */

  const gaps = deriveFreeGaps(dayTimeline, latestAllowedEnd);

  const scored = gaps
    .filter((g) => g.minutes >= estimatedMinutes)
    .map((g) => ({
      ...g,
      score: scoreGap(g),
    }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const best = scored[0];

  return {
    start: best.start.toISOString(),
    end: new Date(
      best.start.getTime() + estimatedMinutes * 60000
    ).toISOString(),
    minutes: estimatedMinutes,
    reason: "quiet_gap",
  };
}

/* ---------------------------------------------------------
   GAP DERIVATION
--------------------------------------------------------- */

function deriveFreeGaps(
  timeline: TimelineItem[],
  latestAllowedEnd: Date
) {
  const dayStart = setTime(new Date(), 9, 0);
  const dayEnd = setTime(new Date(), 17, 30);

  const events = timeline
    .map((m) => ({
      start: new Date(m.start),
      end: new Date(m.end),
    }))
    .filter((e) => e.end > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: {
    start: Date;
    end: Date;
    minutes: number;
  }[] = [];

  let cursor = dayStart;

  for (const e of events) {
    if (cursor < e.start) {
      const gapEnd = minDate(e.start, dayEnd, latestAllowedEnd);
      const minutes = diffMinutes(cursor, gapEnd);

      if (minutes > 0) {
        gaps.push({ start: cursor, end: gapEnd, minutes });
      }
    }

    cursor = maxDate(cursor, e.end);
  }

  if (cursor < dayEnd && cursor < latestAllowedEnd) {
    const gapEnd = minDate(dayEnd, latestAllowedEnd);
    const minutes = diffMinutes(cursor, gapEnd);

    if (minutes > 0) {
      gaps.push({ start: cursor, end: gapEnd, minutes });
    }
  }

  return gaps;
}

/* ---------------------------------------------------------
   GAP SCORING (EXPLAINABLE, HUMAN)
--------------------------------------------------------- */

function scoreGap(gap: { start: Date; end: Date }) {
  const hour = gap.start.getHours();
  let score = 0;

  if (hour >= 13 && hour <= 16) score += 2; // afternoon sweet spot
  else if (hour >= 10 && hour <= 12) score += 1; // morning
  else if (hour >= 17) score -= 3; // late fatigue

  return score;
}

/* ---------------------------------------------------------
   UTIL
--------------------------------------------------------- */

function diffMinutes(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 60000);
}

function setTime(d: Date, h: number, m: number) {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
}

function minDate(...dates: Date[]) {
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

function maxDate(...dates: Date[]) {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

function addBusinessDays(d: Date, days: number) {
  const result = new Date(d);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }

  return result;
}
