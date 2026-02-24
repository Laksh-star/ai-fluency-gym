import React from "react";

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
      {children}
    </div>
  );
}
