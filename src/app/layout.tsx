import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: "RecCheck - UCLA Recreation Occupancy Tracker",
  description: "Live occupancy tracking for UCLA Recreation facilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lato.variable}>
      <body className="antialiased font-lato">
        {children}
      </body>
    </html>
  );
}
