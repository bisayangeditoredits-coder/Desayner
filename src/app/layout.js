import {
  Montserrat,
  Raleway,
  Syne,
  Plus_Jakarta_Sans,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./messaging.css";
import "./App.css";
import PWAInstaller from "@/components/layout/PWAInstaller";
import FaviconLoader from "@/components/layout/FaviconLoader";
import Script from "next/script";
import { Suspense } from "react";
import NextTopLoader from 'nextjs-toploader';

// ── Existing fonts ────────────────────────────────────────────────────────────

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  // Only load weights actually used in the app
  weight: ["400", "500", "600", "700", "800"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

const monigue = localFont({
  src: "../../public/Fonts/Monigue.otf",
  variable: "--font-monigue",
  display: "swap",
});

// ── New curated fonts ─────────────────────────────────────────────────────────
// All use next/font — self-hosted, zero external DNS, HTTP/2 pushed.
// Only specific weights are downloaded so low-end devices aren't penalised.

/** Display / Hero text — bold, editorial, design-forward */
const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
});

/** Modern clean UI alternative to Montserrat — friendly and geometric */
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "700"],
});



export const metadata = {
  metadataBase: new URL("https://desayner.com"),
  title: "Desayner | The Premier Community for Creative Professionals",
  description: "Desayner is the ultimate platform to showcase your portfolio, discover world-class design inspiration, and connect with top creative talent worldwide.",
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Desayner | The Premier Community for Creative Professionals",
    description: "Desayner is the ultimate platform to showcase your portfolio, discover world-class design inspiration, and connect with top creative talent worldwide.",
    url: "https://desayner.com",
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
    title: "Desayner | The Premier Community for Creative Professionals",
    description: "Desayner is the ultimate platform to showcase your portfolio, discover world-class design inspiration, and connect with top creative talent worldwide.",
    images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"],
  },
  appleWebApp: {
    title: "Desayner",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2d43e8",
};

import CookieBanner from "@/components/layout/CookieBanner";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={[
        montserrat.variable,
        raleway.variable,
        monigue.variable,
        syne.variable,
        plusJakartaSans.variable,
      ].join(' ')}
    >
      <body>
        <NextTopLoader color="#2d43e8" height={3} showSpinner={false} shadow="0 0 10px #2d43e8,0 0 5px #2d43e8" />
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script id="clarity-script" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
            `}
          </Script>
        )}
        <PWAInstaller />
        <Suspense fallback={null}>
          <FaviconLoader />
        </Suspense>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
