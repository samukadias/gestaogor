import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Contract } from '@/Entities/Contract';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { FileText, TrendingUp, Calendar, DollarSign, List, FilterX } from "lucide-react";
import StatsCard from '@/Components/dashboard/StatsCard'; // Reusing existing component if compatible, or I'll inline a simple one. 
// Checking StatsCard usage in Legacy: it accepts title, value, icon, color, onClick.
import { formatCurrency, formatCompactCurrency } from "@/utils/legacy";
import { differenceInDays, parseISO, format } from "date-fns";
import { Button } from "@/Components/ui/button";

export default function ClientDashboard() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedView, setSelectedView] = useState(null); // 'total', 'active', 'expiring', 'value'

    useEffect(() => {
        if (user) {
            loadContracts();
        }
    }, [user]);

    const loadContracts = async () => {
        setIsLoading(true);
        try {
            const allContracts = await Contract.list("-created_date");

            // Fallback to full_name if name is empty, and trim
            const userName = (user.name || user.full_name || "").trim();

            if (!userName) {
                setContracts([]);
                setIsLoading(false);
                return;
            }

            const normalizedUserName = userName.toUpperCase();

            const myContracts = allContracts.filter(c => {
                if (!c.cliente) return false;
                const normalizedClientName = c.cliente.trim().toUpperCase();

                // Strict equality as requested by user
                return normalizedClientName === normalizedUserName;
            });

            setContracts(myContracts);
        } catch (error) {
            console.error("Erro ao carregar contratos:", error);
        }
        setIsLoading(false);
    };

    const stats = useMemo(() => {
        const today = new Date();
        const active = contracts.filter(c => c.status === "Ativo");
        const expiring = active.filter(contract => {
            if (!contract.data_fim_efetividade) return false;
            const endDate = new Date(contract.data_fim_efetividade);
            const daysUntil = differenceInDays(endDate, today);
            return daysUntil <= 60 && daysUntil >= 0;
        });

        const totalValue = active.reduce((sum, c) => sum + (c.valor_contrato || 0), 0);

        return {
            total: contracts.length,
            active: active.length,
            expiring: expiring.length,
            totalValue
        };
    }, [contracts]);

    const displayedContracts = useMemo(() => {
        if (!selectedView) return [];
        const today = new Date();

        switch (selectedView) {
            case 'total':
                return contracts;
            case 'value':
            case 'active':
                return contracts.filter(c => c.status === "Ativo");
            case 'expiring':
                return contracts.filter(c => c.status === "Ativo" && c.data_fim_efetividade && differenceInDays(new Date(c.data_fim_efetividade), today) <= 60 && differenceInDays(new Date(c.data_fim_efetividade), today) >= 0);
            default:
                return [];
        }
    }, [contracts, selectedView]);

    const getViewTitle = () => {
        switch (selectedView) {
            case 'total': return 'Todos os Meus Contratos';
            case 'active': return 'Meus Contratos Ativos';
            case 'expiring': return 'Contratos Vencendo em Breve (2 meses)';
            case 'value': return 'Visão Geral Financeira (Contratos Ativos)';
            default: return '';
        }
    };

    return (
        <div className="p-6 min-h-screen bg-slate-50 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Meu Painel de Contratos</h1>
                <p className="text-slate-500 mt-1">Bem-vindo, {user?.name || user?.full_name}.</p>
            </div>

            {/* Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card Wrapper style to match existing look roughly */}
                <div onClick={() => setSelectedView('total')} className={`cursor-pointer transition-all hover:scale-105 ${selectedView === 'total' ? 'ring-2 ring-blue-500' : ''}`}>
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total de Contratos</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div onClick={() => setSelectedView('active')} className={`cursor-pointer transition-all hover:scale-105 ${selectedView === 'active' ? 'ring-2 ring-green-500' : ''}`}>
                    <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Contratos Ativos</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.active}</h3>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div onClick={() => setSelectedView('expiring')} className={`cursor-pointer transition-all hover:scale-105 ${selectedView === 'expiring' ? 'ring-2 ring-orange-500' : ''}`}>
                    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Vencendo em 2 meses</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.expiring}</h3>
                                </div>
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div onClick={() => setSelectedView('value')} className={`cursor-pointer transition-all hover:scale-105 ${selectedView === 'value' ? 'ring-2 ring-purple-500' : ''}`}>
                    <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Valor Total</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCompactCurrency(stats.totalValue)}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{formatCurrency(stats.totalValue)}</p>
                                </div>
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* List Section */}
            {selectedView && (
                <Card className="border-slate-200 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                            <List className="w-5 h-5 text-indigo-600" />
                            {getViewTitle()}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedView(null)} className="text-slate-400 hover:text-slate-600">
                            <FilterX className="w-4 h-4 mr-2" />
                            Fechar Lista
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3">Contrato</th>
                                        <th className="px-6 py-3">Objeto</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Vigência</th>
                                        <th className="px-6 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {displayedContracts.length > 0 ? displayedContracts.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {c.contrato}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-md truncate" title={c.objeto_contrato}>
                                                {c.objeto_contrato || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${c.status === 'Ativo' ? 'bg-green-100 text-green-700' :
                                                        c.status === 'Encerrado' ? 'bg-slate-100 text-slate-600' :
                                                            'bg-yellow-100 text-yellow-700'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {c.data_fim_efetividade ? format(parseISO(c.data_fim_efetividade), 'dd/MM/yyyy') : '-'}
                                                {c.data_fim_efetividade && differenceInDays(parseISO(c.data_fim_efetividade), new Date()) <= 60 && c.status === 'Ativo' && (
                                                    <span className="ml-2 text-xs text-orange-600 font-bold">(Vence em breve)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 text-right font-medium">
                                                {formatCurrency(c.valor_contrato)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                Nenhum contrato encontrado nesta categoria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
