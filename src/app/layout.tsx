import "./globals.css";
import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";

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
        <html lang="en">
            <body className="bg-cream min-h-screen text-slate-900">
                <NavBar />
                {children}
            </body>
        </html>
    );
}
