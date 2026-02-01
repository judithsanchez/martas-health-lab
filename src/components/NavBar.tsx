"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="bg-plum text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-serif font-bold text-cream tracking-wide">
                            Marta&apos;s Lab
                        </Link>
                    </div>
                    <div className="hidden sm:flex sm:space-x-8">
                        <Link
                            href="/"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive("/")
                                    ? "border-gold text-gold"
                                    : "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
                                }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/clients"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive("/clients")
                                    ? "border-gold text-gold"
                                    : "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
                                }`}
                        >
                            Clients
                        </Link>
                        <Link
                            href="/upload"
                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive("/upload")
                                    ? "border-gold text-gold"
                                    : "border-transparent text-gray-300 hover:text-white hover:border-gray-300"
                                }`}
                        >
                            Upload Data
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
