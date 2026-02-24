import React from "react";

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_8px_24px_rgba(17,29,40,0.08)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(17,29,40,0.13)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      {title ? <h2 className="mb-3 text-lg font-semibold text-neutral-900">{title}</h2> : null}
      {children}
    </section>
  );
}
