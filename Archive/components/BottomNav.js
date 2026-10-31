"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-zinc-800 bg-[#121212]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:bottom-5 md:max-w-xl md:rounded-2xl md:border md:shadow-[0_8px_30px_rgb(0,0,0,0.7)]">
      <ul className="flex items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="relative flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-red-600/15 border border-red-500/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={{
                    scale: active ? 1.1 : 1,
                    color: active ? "#FF0000" : "#71717A",
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </motion.div>
                <span
                  className={`relative z-10 text-[11px] font-medium tracking-wide transition-colors ${
                    active ? "text-red-500 font-semibold" : "text-zinc-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
