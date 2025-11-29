export function PersonaBadge({ persona }: { persona: string }) {
  const map: any = {
    "morning_person": "Morning Optimiser",
    "evening_focus": "Late Peak Performer",
    "resilience": "Resilient Operator",
    "steady": "Consistent Executor",
    "goals": "Goal-Driven",
    "routine": "Process-Oriented"
  };

  const label = map[persona] || "Balanced Operator";

  return (
    <div className="
      inline-flex items-center px-3 py-1 
      text-xs rounded-full 
      bg-white/5 border border-white/10
      text-white/90 tracking-wide
    ">
      {label}
    </div>
  );
}
