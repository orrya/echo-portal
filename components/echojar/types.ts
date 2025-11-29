// components/echojar/types.ts

export type RawEchoJarRow = {
  id: string;
  user_id: string;
  date: string;
  behavioural_summary: string | null;
  emerging_themes: string[] | null;
  detected_patterns: string[] | null;
  recommendations: {
    wins?: string[];
    strains?: string[];
    adjustments?: string[];
  } | null;
  predictive_signals: {
    focusOutlook?: string | null;
    attentionRisks?: string[] | null;
    energyMap?: Record<string, string> | null;
  } | null;
  tags: string[] | null;
  focus_score: number | null;
  strain_score: number | null;
  momentum_score: number | null;
  consistency_score: number | null;
  created_at: string;
};

export type EchoJarSignals = {
  focusScore: number | null;
  loadScore: number | null;
  emailDragScore: number | null;
  meetingNoiseScore: number | null;
};

export type EchoJarEntry = {
  id: string;
  date: string;
  headline: string;
  dayStory: string;
  wins: string[];
  strains: string[];
  themes: string[];
  tags: string[];
  patterns: string[];
  signals: EchoJarSignals;
  tomorrowFocus: string | null;
  echoComment: string | null;
  energyMap: Record<string, string> | null;
  attentionRisks: string[];
};
