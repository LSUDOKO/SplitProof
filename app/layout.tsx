import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const font = Public_Sans({ variable: "--font-public", subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "SplitSide — your face is the control group", template: "%s · SplitSide" },
  description: "At-home split-face skincare trials. Product on one side, the other side is the control, YouCam AI measures both in the same photo.",
  applicationName: "SplitSide",
  appleWebApp: { capable: true, title: "SplitSide", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dde9da" },
    { media: "(prefers-color-scheme: dark)", color: "#131a15" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** Runs before first paint: applies the saved theme (no flash) and arms reveal animations. */
const BOOT = `(function(){var e=document.documentElement;try{var t=localStorage.getItem("splitside-theme");e.dataset.theme=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}catch(_){e.dataset.theme="light"}if(!matchMedia("(prefers-reduced-motion: reduce)").matches){e.classList.add("motion");setTimeout(function(){e.classList.remove("motion")},4000)}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${font.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
