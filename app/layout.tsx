import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNav from '@/components/ui/GlobalNav'
import ConditionalFooter from '@/components/ui/ConditionalFooter'
import HealthCheckRunner from '@/components/HealthCheckRunner'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindMate - Cognitive Health Monitor",
  description: "Advanced cognitive health monitoring and brain visualization platform for medical professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 text-white`}
        suppressHydrationWarning
      >
        <HealthCheckRunner />
        <GlobalNav>
          {children}
        </GlobalNav>
        <ConditionalFooter />
      </body>
    </html>
  );
}
