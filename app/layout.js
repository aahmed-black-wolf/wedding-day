import { Cairo, Aref_Ruqaa } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

const aref = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-aref",
  display: "swap",
});

export const metadata = {
  title: "نيمو & ديبو — حفل زفاف",
  description: "دعوة زفاف نيمو وديبو — ١٨ يوليو ٢٠٢٦",
};

export const viewport = {
  themeColor: "#7d2b3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${aref.variable}`}>
      <body className="font-body bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
