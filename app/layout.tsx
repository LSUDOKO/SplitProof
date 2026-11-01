import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const font = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SplitSide — your face is the control group", template: "%s · SplitSide" },
  description: "At-home split-face skincare trials. Product on one side, the other side is the control, YouCam AI measures both in the same photo.",
  applicationName: "SplitSide",
  appleWebApp: { capable: true, title: "SplitSide", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f4f6f8", width: "device-width", initialScale: 1 };

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
