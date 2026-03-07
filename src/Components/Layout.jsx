import React, { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, List, Settings, LogOut, Menu, DollarSign, CalendarClock, FileText, UserCog, BarChart3, GitBranch, Database, Search, Activity, ChevronLeft, ChevronRight, Server } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import ForcePasswordChangeModal from "./ForcePasswordChangeModal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from '../assets/logo.svg';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SidebarItem = ({ icon: Icon, label, to, onClick, end, isCollapsed }) => {
    const linkContent = (
        <NavLink
            to={to}
            onClick={onClick}
            end={end}
            className={({ isActive }) => cn(
                "group flex items-center gap-3 py-2.5 rounded-r-lg text-sm font-medium transition-all duration-300 relative border-l-2",
                isCollapsed ? "justify-center px-0 rounded-lg border-l-0 mx-2" : "px-3 pr-4 mr-3",
                isActive
                    ? "bg-gradient-to-r from-indigo-500/15 to-transparent text-indigo-400 border-indigo-500 shadow-[inset_1px_0_0_rgba(255,255,255,0.05)]"
                    : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
            )}
        >
            {({ isActive }) => (
                <>
                    <Icon className={cn(
                        "w-5 h-5 flex-shrink-0 transition-all duration-300",
                        isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-300",
                        !isCollapsed && "group-hover:translate-x-0.5"
                    )} />
                    {!isCollapsed && <span className="truncate transition-transform duration-300 group-hover:translate-x-0.5">{label}</span>}
                </>
            )}
        </NavLink>
    );

    if (isCollapsed) {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-800 text-slate-100 border-slate-700">
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return linkContent;
};

const SidebarContent = ({ isCollapsed, setIsCollapsed, user, setOpen, onLogout }) => (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/50 transition-all duration-300 shadow-xl">
        <div className={cn("p-6 border-b border-slate-800/50 flex items-center relative", isCollapsed ? "justify-center px-4" : "justify-between")}>
            <div className="flex items-center gap-3 overflow-hidden ml-1">
                <img src={logo} alt="GOR Logo" className="w-8 h-8 opacity-90 flex-shrink-0" />
                {!isCollapsed && <span className="text-lg font-bold text-white tracking-tight truncate">GOR</span>}
            </div>
            <Button
                variant="secondary"
                size="icon"
                className={cn(
                    "hidden md:flex transition-all z-20 absolute -right-3.5 top-6 h-7 w-7 rounded-full border shadow-sm",
                    "border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-600 hover:shadow-md",
                    !isCollapsed && "group-hover:opacity-100"
                )}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
        </div>

        <div className="flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pb-10 group">
            {/* Módulo CDPC (Antigo Fluxo/Demandas) */}
            {(user?.department === 'GOR' || user?.allowed_modules?.includes('flow') || user?.department === 'CDPC' || user?.permissions?.includes('view_all')) && (
                <>
                    <SidebarItem icon={LayoutDashboard} label="Dashboard CDPC" to="/dashboard" onClick={() => setOpen(false)} end isCollapsed={isCollapsed} />
                    <div className={cn("space-y-1 mt-1 border-l border-slate-800/40 relative", isCollapsed ? "pl-0 ml-0 border-none" : "pl-1 ml-6")}>
                        <SidebarItem icon={List} label="Demandas CDPC" to="/demands" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                    </div>
                </>
            )}

            {/* Módulo CVAC (Antigo Financeiro) */}
            {(user?.department === 'GOR' || user?.allowed_modules?.includes('finance') || user?.department === 'CVAC' || user?.permissions?.includes('view_all')) && (
                <>
                    {((user?.department === 'CVAC' && (user?.role === 'manager' || user?.role === 'analyst' || user?.profile_type === 'analista')) || user?.department === 'GOR' || user?.perfil === 'GESTOR' || user?.permissions?.includes('view_all')) && (
                        <SidebarItem icon={DollarSign} label="Dashboard CVAC" to="/financeiro" onClick={() => setOpen(false)} end isCollapsed={isCollapsed} />
                    )}

                    <div className={cn("space-y-1 mt-1 border-l border-slate-800/40 relative", isCollapsed ? "pl-0 ml-0 border-none" : "pl-1 ml-6")}>
                        <SidebarItem icon={FileText} label="Contratos CVAC" to="/financeiro/contratos" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                    </div>
                </>
            )}

            {/* Módulo COCR (Antigo Prazos) */}
            {(user?.department === 'GOR' || user?.allowed_modules?.includes('contracts') || user?.department === 'COCR' || user?.permissions?.includes('view_all')) && (
                <>
                    <SidebarItem icon={CalendarClock} label="Dashboard COCR" to="/prazos" onClick={() => setOpen(false)} end isCollapsed={isCollapsed} />

                    {user?.role !== 'client' && (
                        <div className={cn("space-y-1 mt-1 border-l border-slate-800/40 relative", isCollapsed ? "pl-0 ml-0 border-none" : "pl-1 ml-6")}>
                            <SidebarItem icon={FileText} label="Contratos" to="/prazos/contratos" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                            <SidebarItem icon={Search} label="Pesquisar" to="/prazos/pesquisa" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                            {!(user?.department === 'COCR' && user?.role === 'analyst') && (
                                <SidebarItem icon={BarChart3} label="Análise" to="/prazos/analise" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                            )}
                            {!(user?.department === 'COCR' && user?.role === 'analyst') && (
                                <SidebarItem icon={GitBranch} label="Controle de Etapas" to="/prazos/etapas" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                            )}
                            {!(user?.department === 'COCR' && user?.role === 'analyst') && (
                                <SidebarItem icon={Database} label="Gestão de Dados" to="/prazos/gestao-dados" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Administration */}
            {(user?.permissions?.includes('view_executive_dashboard') || user?.permissions?.includes('manage_settings')) && (
                <>
                    {user?.permissions?.includes('view_executive_dashboard') && (
                        <SidebarItem icon={BarChart3} label="Visão Executiva (Gerencial)" to="/gerencial" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                    )}
                    {user?.permissions?.includes('manage_settings') && (
                        <SidebarItem icon={Settings} label="Administração" to="/settings" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                    )}
                    {(user?.role === 'admin') && (
                        <SidebarItem icon={Server} label="Monitor do Sistema" to="/admin/monitor" onClick={() => setOpen(false)} isCollapsed={isCollapsed} />
                    )}
                </>
            )}
        </div>

        <div className={cn(
            "p-3 border-t border-slate-800/50 flex flex-col items-center bg-slate-950/80 backdrop-blur-sm z-10",
            isCollapsed ? "px-2" : "px-3"
        )}>
            {user && (
                <div className={cn(
                    "mb-2 w-full bg-slate-900 rounded-xl border border-slate-800/60 p-3 transition-all",
                    isCollapsed ? "bg-transparent border-transparent p-0 flex justify-center" : "shadow-sm hover:border-slate-700/80"
                )}>
                    {!isCollapsed ? (
                        <div className="flex flex-col">
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return 'Bom dia';
                                    if (hour < 18) return 'Boa tarde';
                                    return 'Boa noite';
                                })()}
                            </p>
                            <p className="text-sm font-bold text-slate-100 truncate">{user.name}</p>
                            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{user.email}</p>
                        </div>
                    ) : (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-slate-700/50 text-indigo-300 flex items-center justify-center font-bold uppercase cursor-pointer hover:bg-slate-800 transition-colors shadow-sm">
                                        {user.name?.charAt(0)}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-slate-800 text-slate-100 border-slate-700">
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-xs text-slate-400">{user.email}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            )}

            <div className={cn(
                "w-full flex flex-col pb-2 gap-1",
                isCollapsed ? "items-center" : "px-2"
            )}>
                {(user?.role === 'admin') && (
                    <div className="flex-1">
                        <NotificationCenter isCollapsed={isCollapsed} />
                    </div>
                )}
                {(user?.role === 'admin') && (
                    <SidebarItem
                        icon={Activity}
                        label="Histórico"
                        to="/atividades"
                        onClick={() => setOpen(false)}
                        isCollapsed={isCollapsed}
                    />
                )}
            </div>

            {isCollapsed ? (
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="mt-1 h-10 w-10 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
                                onClick={onLogout}
                            >
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-800 text-slate-100 border-slate-700">
                            Sair
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <Button
                    variant="ghost"
                    className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 mt-1 py-5 rounded-xl border border-transparent hover:border-rose-900/50 transition-colors gap-3 px-3"
                    onClick={onLogout}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold text-sm">Sair da Conta</span>
                </Button>
            )}

            {/* Footer / Version Info */}
            <div className={cn(
                "mt-4 mb-1 w-full flex flex-col items-center justify-center transition-opacity duration-300 opacity-50 hover:opacity-100 cursor-default",
                isCollapsed ? "hidden" : "flex"
            )}>
                <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">Gestão GOR <span className="text-indigo-400">v1.0</span></p>
                <p className="text-[9px] text-slate-500 mt-0.5">Desenvolvido por Samuel Dias</p>
            </div>
            {isCollapsed && (
                <div className="mt-3 mb-1 w-full flex justify-center opacity-40 cursor-default">
                    <p className="text-[9px] text-slate-500 font-mono font-bold tracking-tighter">v1.0</p>
                </div>
            )}

        </div>
    </div>
);

export default function Layout({ onLogout, user }) {
    const [open, setOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <div className={cn("hidden md:block fixed h-full z-30 transition-all duration-300", isCollapsed ? "w-20" : "w-[260px]")}>
                <SidebarContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} user={user} setOpen={setOpen} onLogout={onLogout} />
            </div>

            {/* Mobile Header & Sidebar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950 border-b border-slate-800 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="GOR Logo" className="w-8 h-8" />
                    <span className="font-bold text-white">GOR</span>
                </div>
                {user?.role === 'admin' && (
                    <div className="flex items-center gap-2">
                        <NotificationCenter />
                    </div>
                )}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6 text-slate-600" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <SidebarContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} user={user} setOpen={setOpen} onLogout={onLogout} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <main className={cn(
                "flex-1 pt-16 md:pt-0 min-h-screen transition-all duration-300 w-full overflow-x-hidden",
                isCollapsed ? "md:ml-20" : "md:ml-[260px]"
            )}>
                <Outlet />
            </main>

            {/* Modal for forcing password resets on default passwords */}
            <ForcePasswordChangeModal />
        </div>
    );
}
