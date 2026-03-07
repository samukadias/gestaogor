import React, { useState, useEffect } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, DollarSign, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import PendencyCard from "./components/PendencyCard";
import PendencyTable from "./components/PendencyTable";
import PendencyCharts from "./components/PendencyCharts";
import DashboardFilters from "./components/DashboardFilters";
import AttestationDetailsDialog from "./components/AttestationDetailsDialog";

export default function Dashboard() {
    const navigate = useNavigate();
    // No fluxo, o user já vem autenticado pelo App/Layout.
    // Mas podemos pegar info extra aqui.
    // Vamos assumir que quem acessa /financeiro/dashboard tem permissão.

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');

    const [filters, setFilters] = useState({
        client: 'all',
        pd: 'all',
        esp: 'all',
        year: currentYear,
        month: currentMonth,
        analyst: 'all'
    });

    const [selectedAttestation, setSelectedAttestation] = useState(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    // Obter usuário do localStorage
    const user = JSON.parse(localStorage.getItem('fluxo_user') || localStorage.getItem('user') || '{}');

    const userRole = (user?.role || '').toLowerCase();
    const userProfile = (user?.profile_type || user?.perfil || '').toLowerCase();

    // Define explicit Manager/Admin roles
    const isManager =
        userRole === 'admin' ||
        userRole === 'gestor' ||
        userRole === 'manager' ||
        userRole === 'executive' ||
        userRole === 'general_manager' ||
        userProfile === 'admin' ||
        userProfile === 'gestor' ||
        userProfile === 'executive';

    // If NOT a manager, treat as restricted Analyst view by default
    const isAnalyst = !isManager;
    const analystName = user?.full_name || user?.name;

    console.log('Dashboard CVAC Filter:', { isManager, isAnalyst, analystName });

    const { data: attestations = [], isLoading, isError, error } = useQuery({
        queryKey: ['all-attestations', isAnalyst ? analystName : 'all'],
        queryFn: () => {
            // Merge sort and filter params
            const params = {
                sort: '-reference_month',
                ...(isAnalyst ? { responsible_analyst_like: analystName } : {})
            };
            return fluxoApi.entities.MonthlyAttestation.list(params);
        }
    });

    // Extrair opções de filtros (com proteção contra null/undefined)
    const clients = [...new Set((attestations || []).map(a => a?.client_name).filter(Boolean))];
    const pds = [...new Set((attestations || []).map(a => a?.pd_number).filter(Boolean))];
    const esps = [...new Set((attestations || []).map(a => a?.esp_number).filter(Boolean))];
    const analysts = [...new Set((attestations || []).map(a => a?.responsible_analyst).filter(Boolean))];
    const months = [...new Set((attestations || []).map(a => a?.reference_month).filter(Boolean))]
        .sort()
        .reverse()
        .map(m => {
            const [year, month] = m.split('-');
            return {
                value: m,
                label: new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            };
        });

    // Aplicar filtros
    const filteredAttestations = attestations.filter(att => {
        if (filters.client !== 'all' && att.client_name !== filters.client) return false;
        if (filters.pd !== 'all' && att.pd_number !== filters.pd) return false;
        if (filters.esp !== 'all' && att.esp_number !== filters.esp) return false;
        if (filters.analyst !== 'all' && att.responsible_analyst !== filters.analyst) return false;

        if (att.reference_month) {
            const [attYear, attMonth] = att.reference_month.split('-');
            if (filters.year !== 'all' && attYear !== filters.year) return false;
            // O value do mês que vem do Select agora é apenas os dois dígitos (ex: "02")
            if (filters.month !== 'all' && attMonth !== filters.month) return false;
        }

        return true;
    });

    // Calcular métricas com a nova regra de GAP (Apontado - Faturado)
    const totalBilled = filteredAttestations.reduce((sum, att) => sum + (parseFloat(att.billed_amount) || 0), 0);
    const totalMeasurement = filteredAttestations.reduce((sum, att) => sum + (parseFloat(att.measurement_value) || 0), 0);

    const totalPaid = filteredAttestations.reduce((sum, att) => sum + (parseFloat(att.paid_amount) || 0), 0);
    const totalGap = totalMeasurement - totalBilled;

    // Contagem de registros com GAP
    const pendencyCount = filteredAttestations.filter(att =>
        (parseFloat(att.measurement_value) || 0) - (parseFloat(att.billed_amount) || 0) > 0
    ).length;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard de Atestações</h1>
                    <p className="text-slate-600 mt-1">Acompanhe medição apontada, faturada e análise de GAP</p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <PendencyCard
                        title="Total Faturado"
                        value={formatCurrency(totalBilled)}
                        subtitle={`${filteredAttestations.length} registros no mês`}
                        type="default"
                        icon={DollarSign}
                    />
                    <PendencyCard
                        title="Total Apontado"
                        value={formatCurrency(totalMeasurement)}
                        subtitle="Métrica de medição base"
                        type="success"
                        icon={CheckCircle2}
                    />
                    <PendencyCard
                        title="Total GAP"
                        value={formatCurrency(totalGap)}
                        subtitle={totalGap > 0 ? 'Diferença: Apontado - Faturado' : 'Sem GAPs no período'}
                        type={totalGap > 0 ? 'danger' : 'success'}
                        icon={AlertTriangle}
                    />
                    <PendencyCard
                        title="Clientes com GAP"
                        value={pendencyCount}
                        subtitle="Registros apresentando GAP"
                        type={pendencyCount > 0 ? 'warning' : 'success'}
                        icon={Users}
                    />
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <DashboardFilters
                        filters={filters}
                        onFilterChange={setFilters}
                        clients={clients}
                        pds={pds}
                        esps={esps}
                        months={months}
                        analysts={analysts}
                    />
                </div>

                {/* Charts */}
                <div className="mb-8">
                    <PendencyCharts attestations={filteredAttestations} />
                </div>

                {/* Table */}
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">
                        Detalhamento de Pendências
                    </h2>
                    {isError && (
                        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
                            Erro ao carregar dados: {error?.message || 'Erro desconhecido'}
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <PendencyTable
                            attestations={filteredAttestations}
                            onViewDetails={(att) => {
                                setSelectedAttestation(att);
                                setDetailsDialogOpen(true);
                            }}
                        />
                    )}
                </div>
            </div>

            <AttestationDetailsDialog
                attestation={selectedAttestation}
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
            />
        </div>
    );
}
