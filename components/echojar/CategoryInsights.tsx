export function CategoryInsights({ themes }: { themes: string[] }) {
  if (!themes?.length) return null;

  return (
    <div className="space-y-2">
      {themes.map((t, i) => (
        <div key={i} className="
          flex items-center justify-between
          bg-white/5 border border-white/10
          px-4 py-2 rounded-xl text-sm text-white/80
        ">
          <span className="capitalize">{t.replace("_"," ")}</span>
          <span className="text-white/50">●</span>
        </div>
      ))}
    </div>
  );
}
