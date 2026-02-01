"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Upload,

} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <aside className="w-72 flex flex-col sticky top-0 h-screen shadow-2xl z-20 bg-plum text-white">
            <div className="p-10 text-center">
                <Link href="/" className="block">
                    <div className="w-16 h-16 mx-auto rounded-full border-2 border-gold p-1 flex items-center justify-center transition-transform hover:rotate-12 mb-4">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl shadow-inner">
                            🧘🏻‍♀️
                        </div>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">Marta&apos;s Lab</h1>
                </Link>
                <div className="h-0.5 w-12 mx-auto mt-2 rounded-full opacity-60 bg-gold"></div>
            </div>

            <nav className="flex-1 px-6 space-y-2 mt-4">
                <NavItem
                    href="/"
                    active={isActive("/")}
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                />
                <NavItem
                    href="/clients"
                    active={isActive("/clients")}
                    icon={<Users size={20} />}
                    label="Usuarios"
                />
            </nav>


        </aside>
    );
}

function NavItem({ active, icon, label, href }: { active: boolean; icon: React.ReactNode; label: string; href: string }) {
    return (
        <Link
            href={href}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-medium transition-all relative overflow-hidden ${active ? 'text-white' : 'text-white text-opacity-40 hover:text-opacity-100 hover:bg-white hover:bg-opacity-5'
                }`}
        >
            {active && (
                <>
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gold"></div>
                    <div className="absolute inset-0 bg-white bg-opacity-10 shadow-inner"></div>
                </>
            )}
            <span className="relative z-10" style={{ color: active ? '#c2a05b' : 'inherit' }}>{icon}</span>
            <span className="relative z-10 tracking-wide">{label}</span>
        </Link>
    );
}
