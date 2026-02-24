"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/transcript", label: "Transcript" },
  { href: "/challenges", label: "Challenges" },
  { href: "/cheatsheet", label: "Cheat Sheet" },
  { href: "/prompts", label: "Prompts" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/challenges") return pathname === "/challenges" || pathname.startsWith("/challenge/");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/35 bg-[#f6f4ed]/80 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-neutral-900">
          AI Fluency Gym <span className="text-sm font-normal text-neutral-600">(4D)</span>
        </Link>
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 text-sm md:pb-0">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                isActive(l.href)
                  ? "bg-neutral-900 text-white shadow"
                  : "bg-white/60 text-neutral-700 hover:bg-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/help"
            className={`ml-1 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold transition ${
              isActive("/help")
                ? "bg-neutral-900 text-white shadow"
                : "btn-solid"
            }`}
          >
            Help
          </Link>
        </nav>
      </div>
    </header>
  );
}
