import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { PieChart, Layers, FileSignature, Landmark } from "lucide-react";
import { useCdpcMetricsQuery, useCocrMetricsQuery, useCyclesQuery } from '@/hooks/useQueries';
import CdpcTab from './components/CdpcTab';
import CocrTab from './components/CocrTab';
import CvacTab from './components/CvacTab';
import GlobalFilterBar from './components/GlobalFilterBar';

/**
 * GerencialDashboard — Visão Executiva.
 *
 * Responsabilidade: estado de filtros e roteamento de abas.
 * Dados são buscados pelos hooks do React Query (cache + refetch automáticos).
 */
export default function GerencialDashboard() {
    const user = JSON.parse(localStorage.getItem('fluxo_user') || '{}');

    // Determina a aba inicial com base no departamento do usuário
    const getInitialTab = () => {
        const dept = user?.department;
        if (dept === 'COCR') return 'cocr';
        if (dept === 'CVAC') return 'cvac';
        return 'cdpc'; // CDPC, GOR, admin → começa em CDPC
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);

    // --- Filtros Globais ---
    const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentYearStr = String(new Date().getFullYear());
    const [globalFilters, setGlobalFilters] = useState({
        month: currentMonthStr,
        year: currentYearStr,
        cycle_ids: [],
        artifact: '',
    });

    // --- React Query: busca dados com cache automático ---
    // Join array para strings para enviar no query param (e.g. cycle_ids: '1,2,3')
    const cdpcQueryParams = {
        ...globalFilters,
        cycle_ids: globalFilters.cycle_ids.length > 0 ? globalFilters.cycle_ids.join(',') : '',
    };

    const {
        data: cdpcMetrics = {
            backlog: 0, entriesThisMonth: 0, deliveredThisMonth: 0, highPriorityThisMonth: 0,
            deliveredThisYear: 0, valueThisMonth: 0, valueThisYear: 0, valuedDemandsCount: 0,
            emTratativa: 0, entriesThisYear: 0, slaThisMonth: 0, slaThisYear: 0,
            cancelledThisMonth: 0, cancelledThisYear: 0, topPrioritizedClientsThisMonth: [],
            topClients: [], currentlyReopened: [],
        },
        isFetching: cdpcLoading,
        dataUpdatedAt: cdpcUpdatedAt,
    } = useCdpcMetricsQuery(cdpcQueryParams);

    // O backend COCR deverá ignorar cycle_ids e artifact, e usar apenas month e year
    const cocrQueryParams = {
        month: globalFilters.month,
        year: globalFilters.year,
    };

    const { data: cocrMetrics = {
        totalContracts: 0, globalValue: 0, expiringContracts: [],
        aditamentosMonthCount: 0, aditamentosMonthValue: 0,
        aguardandoAssinaturaCount: 0, aguardandoAssinaturaValue: 0,
    } } = useCocrMetricsQuery(cocrQueryParams);

    const { data: cycles = [] } = useCyclesQuery();

    const lastUpdated = cdpcUpdatedAt
        ? new Date(cdpcUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'carregando...';

    // --- Helpers ---
    const formatCurrency = (val) =>
        (val || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: val >= 1000000 ? 'compact' : 'standard',
            maximumFractionDigits: val >= 1000000 ? 2 : 0,
        });

    const handleFilterChange = (key, value) => {
        setGlobalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleFilterReset = () => {
        setGlobalFilters({ month: currentMonthStr, year: currentYearStr, cycle_ids: [], artifact: '' });
    };

    // Filtra as abas conforme departamento — admin/GOR vê tudo
    const isAdmin = user?.role === 'admin' || user?.department === 'GOR';
    const allTabs = [
        { id: 'cdpc', label: 'CDPC (Demandas)', icon: <Layers className="w-4 h-4" />, depts: ['CDPC'] },
        { id: 'cocr', label: 'COCR (Contratos)', icon: <FileSignature className="w-4 h-4" />, depts: ['COCR'] },
        { id: 'cvac', label: 'CVAC (Faturamento)', icon: <Landmark className="w-4 h-4" />, depts: ['CVAC'] },
    ];
    const tabs = isAdmin ? allTabs : allTabs.filter(t => t.depts.includes(user?.department));

    return (
        <div className="min-h-screen flex flex-col pt-4 overflow-hidden bg-slate-50 relative">

            {/* Cabeçalho */}
            <header className="bg-white mx-6 rounded-2xl shadow-sm border border-slate-100 p-4 mb-3 flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-sm">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Visão Executiva</h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Dashboard Gerencial • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 hidden sm:flex">
                    <div className="text-right mr-2">
                        <p className="text-sm font-semibold text-slate-700">Olá, {user?.name || 'Gerente'}</p>
                        <p className="text-xs text-slate-500">Última atualização: {lastUpdated}</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-slate-600 font-bold uppercase">
                        {user?.name?.charAt(0) || 'G'}
                    </div>
                </div>
            </header>

            {/* Barra de Filtros Global */}
            <div className="mx-6 mb-4 shrink-0 z-20">
                <GlobalFilterBar
                    filters={globalFilters}
                    onFilterChange={handleFilterChange}
                    onReset={handleFilterReset}
                    cycles={cycles}
                    defaultMonthStr={currentMonthStr}
                    activeTab={activeTab}
                />
            </div>

            {/* Navegação de Abas */}
            <div className="px-8 border-b border-slate-200 mb-6 flex justify-center gap-8 shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "pb-3 text-sm font-semibold uppercase tracking-wider transition-colors flex items-center gap-2",
                            activeTab === tab.id
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-slate-500 hover:text-slate-800 border-b-2 border-transparent hover:border-slate-300"
                        )}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Área de Conteúdo */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 scrollbar-thumb-slate-300 scrollbar-track-transparent">

                {activeTab === 'cdpc' && (
                    <CdpcTab
                        metrics={cdpcMetrics}
                        loading={cdpcLoading}
                        filters={globalFilters}
                        formatCurrency={formatCurrency}
                    />
                )}

                {activeTab === 'cocr' && (
                    <CocrTab
                        metrics={cocrMetrics}
                        loading={cdpcLoading}
                        filters={globalFilters}
                        formatCurrency={formatCurrency}
                    />
                )}

                {activeTab === 'cvac' && (
                    <CvacTab
                        filters={globalFilters}
                    />
                )}

            </div>
        </div>
    );
}
