import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder Command",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable:true,title:"Founder Command",statusBarStyle:"default"},
  description: "Your private command centre for companies, decisions and verified work.",
  icons: {
    icon: "/favicon.svg",
    apple: "/notification-icon.png",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
