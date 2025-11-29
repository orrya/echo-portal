export function TimeSavedTooltip() {
  return (
    <div className="
      text-xs text-white/60 
      bg-black/50 border border-white/10 
      p-3 rounded-lg max-w-xs
    ">
      <strong className="text-white">How time saved is calculated:</strong><br/>
      Based on meeting reduction, fragmentation reduction,
      and deep-work window expansion compared to your 7-day baseline.
    </div>
  );
}
