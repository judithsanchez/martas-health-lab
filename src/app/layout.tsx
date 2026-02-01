import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { Outfit, Playfair_Display } from "next/font/google";

const outfit = Outfit({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-outfit",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-playfair",
});

export const metadata: Metadata = {
    title: "Marta's Lab",
    description: "Advanced Trainer Dashboard",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
            <body className="bg-cream min-h-screen text-slate-900 font-sans flex">
                <Sidebar />
                <main className="flex-1 overflow-y-auto h-screen">
                    {children}
                </main>
            </body>
        </html>
    );
}
