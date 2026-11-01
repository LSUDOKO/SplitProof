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

export const viewport: Viewport = { themeColor: "#dde9da", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${font.variable} antialiased`}>
      <body className="min-h-dvh">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
