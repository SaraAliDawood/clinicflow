export default function Loading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 rounded-lg bg-white/10" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="mt-3 h-8 w-24 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="card h-72" />
    </div>
  );
}
