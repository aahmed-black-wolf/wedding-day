import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import Story from "@/components/Story";
import AnimeScroll from "@/components/AnimeScroll";
import BrideGroom from "@/components/BrideGroom";
import HeartCrack from "@/components/HeartCrack";
import Location from "@/components/Location";
import Guests from "@/components/Guests";
import Experience from "@/components/Experience";

export default function Home() {
  return (
    <main className="relative w-full">
      <Experience />
      <Hero />
      <Countdown />
      <Story />
      <AnimeScroll />
      <HeartCrack />
      <BrideGroom />
      <Location />
      <Guests />

      <footer className="section pt-0 text-center">
        <div className="mx-auto h-px max-w-xs bg-gold/40" />
        <p className="mt-8 font-display text-2xl text-wine">عبد الرحمن &amp; نرمين</p>
        <p className="mt-2 text-ink/60">١٨ يوليو ٢٠٢٦ — بانتظاركم 💐</p>
      </footer>
    </main>
  );
}
