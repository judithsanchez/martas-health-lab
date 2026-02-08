"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <aside
            className={`${isCollapsed ? 'w-20' : 'w-72'} flex flex-col sticky top-0 h-screen shadow-2xl z-20 bg-plum text-white transition-all duration-300 ease-in-out`}
        >
            <div className={`p-6 flex flex-col items-center ${isCollapsed ? 'justify-center' : ''}`}>
                <Link href="/" className="block text-center">
                    <div className="w-12 h-12 mx-auto rounded-full border-2 border-gold p-1 flex items-center justify-center transition-transform hover:rotate-12 mb-2">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                            🧘🏻‍♀️
                        </div>
                    </div>
                    {!isCollapsed && (
                        <>
                            <h1 className="text-lg font-bold tracking-tight text-white uppercase whitespace-nowrap overflow-hidden">Marta&apos;s Lab</h1>
                            <div className="h-0.5 w-8 mx-auto mt-2 rounded-full opacity-60 bg-gold"></div>
                        </>
                    )}
                </Link>
            </div>

            <nav className="flex-1 px-3 space-y-2 mt-4">
                <NavItem
                    href="/"
                    active={isActive("/")}
                    icon={<LayoutDashboard size={24} />}
                    label="Dashboard"
                    collapsed={isCollapsed}
                />
                <NavItem
                    href="/clients"
                    active={isActive("/clients")}
                    icon={<Users size={24} />}
                    label="Usuarios"
                    collapsed={isCollapsed}
                />
            </nav>

            <div className="p-4 border-t border-white/10 flex justify-center">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
        </aside>
    );
}

function NavItem({ active, icon, label, href, collapsed }: { active: boolean; icon: React.ReactNode; label: string; href: string; collapsed: boolean }) {
    return (
        <Link
            href={href}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all relative overflow-hidden ${active ? 'text-white' : 'text-white text-opacity-40 hover:text-opacity-100 hover:bg-white hover:bg-opacity-5'
                } ${collapsed ? 'justify-center' : ''}`}
        >
            {active && (
                <>
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gold"></div>
                    <div className="absolute inset-0 bg-white bg-opacity-10 shadow-inner"></div>
                </>
            )}
            <span className="relative z-10" style={{ color: active ? '#c2a05b' : 'inherit' }}>{icon}</span>
            {!collapsed && <span className="relative z-10 tracking-wide whitespace-nowrap">{label}</span>}
        </Link>
    );
}
