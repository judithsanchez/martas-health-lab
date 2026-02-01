"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Upload,
    Settings,
    Star
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
                <div className="w-16 h-16 mx-auto rounded-full border-2 border-gold p-1 flex items-center justify-center transition-transform hover:rotate-12 mb-4">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl shadow-inner">
                        🧪
                    </div>
                </div>
                <h1 className="text-xl font-serif font-bold tracking-tight text-white uppercase">Marta&apos;s Lab</h1>
                <div className="h-0.5 w-12 mx-auto mt-2 rounded-full opacity-60 bg-gold"></div>
            </div>

            <nav className="flex-1 px-6 space-y-2 mt-4">
                <NavItem
                    href="/"
                    active={isActive("/")}
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard Premium"
                />
                <NavItem
                    href="/clients"
                    active={isActive("/clients")}
                    icon={<Users size={20} />}
                    label="Mis Pacientes"
                />
                <NavItem
                    href="/upload"
                    active={isActive("/upload")}
                    icon={<Upload size={20} />}
                    label="Importar Tanita"
                />
                <NavItem
                    href="#"
                    active={isActive("/settings")}
                    icon={<Settings size={20} />}
                    label="Configuración"
                />
            </nav>

            <div className="p-6 mb-4">
                <div className="rounded-3xl p-6 text-center relative overflow-hidden group border border-white border-opacity-10 bg-[#5E3D5E]">
                    <p className="text-white text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-3">Tu Asistente</p>
                    <Star size={24} className="mx-auto mb-3 text-gold group-hover:scale-125 transition-transform" />
                    <button className="w-full py-2.5 rounded-xl text-xs font-bold shadow-lg bg-gold text-plum">
                        NUEVO PLAN
                    </button>
                </div>
            </div>
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
