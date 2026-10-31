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
      <body className={`${outfit.variable} ${jetbrains.variable} bg-black font-sans text-white`}>
        <Providers>
          <div className="mx-auto min-h-screen w-full max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-black px-4 sm:px-6 lg:px-8 pb-32">
            <AuthGate>{children}</AuthGate>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
