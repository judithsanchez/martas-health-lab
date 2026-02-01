import "./globals.css";
import type { Metadata } from "next";

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
            <body className="bg-gray-50 min-h-screen text-slate-900">{children}</body>
        </html>
    );
}
