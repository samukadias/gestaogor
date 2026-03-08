import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Clock,
    FileText,
    CheckSquare,
    Search,
    BarChart2,
    Plus,
    ListTodo,
    Users,
    Database,
    Building2,
    LogOut,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import logo from '@/assets/logo.svg';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', description: 'Visão geral', roles: ['GESTOR'] },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/analyst-dashboard', description: 'Visão geral', roles: ['ANALISTA'] },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/client-dashboard', description: 'Visão geral', roles: ['CLIENTE'] },
    { icon: Clock, label: 'Timeline 3 Meses', path: '/timeline', description: 'Contratos próximos', roles: ['GESTOR', 'ANALISTA'] },
    { icon: FileText, label: 'Contratos', path: '/contracts', description: 'Gerenciar contratos', roles: ['GESTOR', 'ANALISTA'] },
    { icon: CheckSquare, label: 'TC', path: '/confirmation', description: 'Termos de aceite', roles: ['GESTOR'] },
    { icon: Search, label: 'Pesquisar', path: '/search', description: 'Busca avançada', roles: ['GESTOR', 'ANALISTA'] },
    { icon: BarChart2, label: 'Análise', path: '/analysis', description: 'Saúde dos contratos', roles: ['GESTOR'] },
    { icon: Plus, label: 'Novo Contrato', path: '/contracts/new', description: 'Cadastrar contrato', roles: ['GESTOR', 'ANALISTA'] },
    { icon: ListTodo, label: 'Controle Etapas', path: '/stage-control', description: 'Gantt das etapas', roles: ['GESTOR'] },
    { icon: Users, label: 'Gerenciar Usuários', path: '/users', description: 'Usuários do sistema', roles: ['GESTOR'] },
    { icon: Database, label: 'Gerenciar Dados', path: '/data-management', description: 'Limpar dados', roles: ['GESTOR'] },
];

export function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const { user, logout } = useAuth();

    if (!user) return null;

    const filteredMenu = menuItems.filter(item => item.roles.includes(user.perfil));

    return (
        <>
            {/* Overlay para mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <div className={cn(
                "flex flex-col h-screen w-72 bg-slate-900 border-r border-slate-800 fixed left-0 top-0 transition-transform duration-300 ease-in-out z-50",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Header */}
                <div className="p-6 flex justify-between items-start border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <img src={logo} alt="GOR Logo" className="w-8 h-8 opacity-90" />
                            <div>
                                <h1 className="font-bold text-white text-lg leading-none tracking-tight">GOR</h1>
                                <span className="text-[10px] text-slate-500 font-medium">Gestão de Contratos</span>
                            </div>
                        </div>
                        <Badge variant="secondary" className="mt-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20">
                            {user.perfil}
                        </Badge>
                    </div>
                    {/* Botão Fechar (Mobile) */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6">
                    <div className="px-6 mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            Navegação
                        </span>
                    </div>
                    <nav className="space-y-1 px-3">
                        {filteredMenu.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => onClose && onClose()}
                                    className={cn(
                                        "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                        isActive
                                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 shadow-sm"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 mt-0.5", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{item.label}</span>
                                        <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400">{item.description}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                {user.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white truncate max-w-[120px]" title={user.full_name}>
                                    {user.full_name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]" title={user.email}>
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={logout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-semibold">Sair do Sistema</span>
                    </Button>
                </div>
            </div>
        </>
    );
}
