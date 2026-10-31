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
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-[#1A1A1A]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="grid grid-cols-5 px-1 pt-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className="relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium tracking-wide"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-2 top-1 h-8 rounded-full bg-red-600/20"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.08 : 1, color: active ? "#FF0000" : "#A1A1AA" }}
                  className="relative"
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                </motion.span>
                <span className={active ? "relative text-red-500" : "relative text-zinc-400"}>
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
