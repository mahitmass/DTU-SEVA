"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Activity, Pill, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/analysis", label: "Analysis", icon: Activity },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/account", label: "Account", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)] pointer-events-none md:bottom-5">
      <div className="w-full max-w-md md:max-w-xl mx-auto px-2 pointer-events-auto">
        <ul className="flex items-center justify-around rounded-2xl border border-zinc-800 bg-[#121212]/95 px-3 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.8)] backdrop-blur-xl">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-all duration-200 ${
                    active
                      ? "bg-red-600/15 border border-red-500/40 text-red-500"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={`transition-transform duration-200 ${active ? "scale-110 text-red-500" : ""}`}
                  />
                  <span
                    className={`text-[11px] font-medium tracking-wide transition-colors ${
                      active ? "font-bold text-red-500" : "text-zinc-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
