"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight,
    Menu,
    X
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-plum text-white rounded-full shadow-lg hover:bg-plum/90 transition-colors"
                aria-label="Toggle Menu"
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 bg-plum text-white shadow-2xl transition-all duration-300 ease-in-out
                    flex flex-col
                    md:static md:h-screen md:sticky md:top-0
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                    w-72 md:${isCollapsed ? 'w-20' : 'w-72'}
                `}
            >
                {/* Logo Area */}
                <div className={`p-6 flex flex-col items-center ${isCollapsed ? 'md:justify-center' : ''}`}>
                    <Link href="/" className="block text-center" onClick={() => setIsMobileOpen(false)}>
                        <div className="w-12 h-12 mx-auto rounded-full border-2 border-gold p-1 flex items-center justify-center transition-transform hover:rotate-12 mb-2">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl shadow-inner">
                                🧘🏻‍♀️
                            </div>
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                            <div className={`md:${isCollapsed ? 'hidden' : 'block'}`}>
                                <h1 className="text-lg font-bold tracking-tight text-white uppercase whitespace-nowrap overflow-hidden">Marta&apos;s Lab</h1>
                                <div className="h-0.5 w-8 mx-auto mt-2 rounded-full opacity-60 bg-gold"></div>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-2 mt-4">
                    <NavItem
                        href="/"
                        active={isActive("/")}
                        icon={<LayoutDashboard size={24} />}
                        label="Inicio"
                        collapsed={isCollapsed}
                        isMobile={true} // Helper to force expand on mobile
                        onClick={() => setIsMobileOpen(false)}
                    />
                    <NavItem
                        href="/clients"
                        active={isActive("/clients")}
                        icon={<Users size={24} />}
                        label="Usuarios"
                        collapsed={isCollapsed}
                        isMobile={true}
                        onClick={() => setIsMobileOpen(false)}
                    />
                </nav>

                {/* Collapse Button (Desktop Only) */}
                <div className="hidden md:flex p-4 border-t border-white/10 justify-center">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
            </aside>
        </>
    );
}

function NavItem({ active, icon, label, href, collapsed, isMobile, onClick }: { active: boolean; icon: React.ReactNode; label: string; href: string; collapsed: boolean, isMobile?: boolean, onClick?: () => void }) {
    // Determine if label should be shown: 
    // Always show on mobile (drawer is wide).
    // On desktop, show if NOT collapsed.
    const showLabel = isMobile || !collapsed;

    return (
        <Link
            href={href}
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all relative overflow-hidden ${active ? 'text-white' : 'text-white text-opacity-40 hover:text-opacity-100 hover:bg-white hover:bg-opacity-5'
                } ${collapsed ? 'md:justify-center' : ''}`}
        >
            {active && (
                <>
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gold"></div>
                    <div className="absolute inset-0 bg-white bg-opacity-10 shadow-inner"></div>
                </>
            )}
            <span className="relative z-10" style={{ color: active ? '#c2a05b' : 'inherit' }}>{icon}</span>
            <span className={`relative z-10 tracking-wide whitespace-nowrap ${!showLabel ? 'md:hidden' : ''}`}>{label}</span>
        </Link>
    );
}
