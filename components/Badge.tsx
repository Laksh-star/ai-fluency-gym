export function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/65 bg-white/70 px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur-sm">
      {label}
    </span>
  );
}
