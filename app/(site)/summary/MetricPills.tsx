"use client";

type Metrics = {
  emailsReceived?: number | null;
  emailsSent?: number | null;
  actionEmailsResolved?: number | null;
  meetings?: number | null;
  [key: string]: any;
};

interface Props {
  metrics: Metrics;
}

export default function MetricPills({ metrics }: Props) {
  const m = metrics || {};

  const items: { label: string; value: number | null | undefined }[] = [
    { label: "Emails", value: m.emailsReceived },
    { label: "Sent", value: m.emailsSent },
    { label: "Action", value: m.actionEmailsResolved },
    { label: "Meetings", value: m.meetings },
  ];

  const chips = items.filter((i) => i.value != null);

  if (chips.length === 0) {
    return (
      <p className="text-[11px] text-slate-400/85">
        Metrics will appear here once Echo has processed your day.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="
            inline-flex items-center gap-1.5
            rounded-full border border-slate-600/80
            bg-slate-950/80 px-3 py-1
            text-[11px] text-slate-100
          "
        >
          <span className="opacity-70 uppercase tracking-[0.16em]">
            {chip.label}
          </span>
          <span className="font-semibold text-slate-50">
            {chip.value}
          </span>
        </div>
      ))}
    </div>
  );
}
