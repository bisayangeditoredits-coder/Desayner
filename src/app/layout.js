import { Montserrat, Raleway } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./messaging.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const monigue = localFont({
  src: "../../public/Fonts/Monigue.otf",
  variable: "--font-monigue",
});

export const metadata = {
  title: "Desayner | Content Creation & Branding Agency",
  description: "Desayner is a premium platform for modern creators. Elevate your brand with professional visual storytelling.",
  icons: {
    icon: [
      { url: "/android-chrome-192x192 rounded.png", type: "image/png" },
    ],
    apple: "/android-chrome-192x192 rounded.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Desayner | Content Creation & Branding Agency",
    description: "Desayner is a premium platform for modern creators. Elevate your brand with professional visual storytelling.",
    url: "https://draftly.com",
    siteName: "Desayner",
    images: [
      {
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Desayner Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Desayner | Content Creation & Branding Agency",
    description: "Desayner is a premium platform for modern creators. Elevate your brand with professional visual storytelling.",
    images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${raleway.variable} ${monigue.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
