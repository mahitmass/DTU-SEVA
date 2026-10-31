import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import AuthGate from "@/components/AuthGate";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata = {
  title: "Feet Health — Smart Diabetic Insole",
  description: "Live plantar pressure monitoring, gait insights, and medicine reminders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrains.variable} bg-black font-sans`}>
        <Providers>
          <div className="mx-auto min-h-screen w-full max-w-md bg-black pb-32">
            <AuthGate>{children}</AuthGate>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
