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

const siteTitle = "نيمو & ديبو — حفل زفاف";
const siteDescription = "دعوة زفاف نيمو وديبو — ١٨ يوليو ٢٠٢٦";

export const metadata = {
  metadataBase: new URL("https://nimo-and-dibo.example.com"),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    locale: "ar_AR",
    siteName: siteTitle,
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/icon.svg"],
  },
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
