import React, { useState, useEffect } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2, DollarSign, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import PendencyCard from "./components/PendencyCard";
import PendencyTable from "./components/PendencyTable";
import DashboardFilters from "./components/DashboardFilters";
import AttestationDetailsDialog from "./components/AttestationDetailsDialog";

export default function AnalystDashboard() {
    const user = JSON.parse(localStorage.getItem('fluxo_user') || localStorage.getItem('user') || '{}');
    const analystName = user?.name;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');

    const [filters, setFilters] = useState({
        client: 'all',
        pd: 'all',
        esp: 'all',
        year: currentYear,
        month: currentMonth,
        analyst: analystName // Fixed to the analyst
    });

    const [selectedAttestation, setSelectedAttestation] = useState(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const { data: attestations = [], isLoading, isError, error } = useQuery({
        queryKey: ['analyst-attestations', analystName],
        queryFn: () => fluxoApi.entities.MonthlyAttestation.list({
            sort: '-reference_month',
            responsible_analyst_like: analystName
        })
    });

    const clients = [...new Set((attestations || []).map(a => a?.client_name).filter(Boolean))];
    const pds = [...new Set((attestations || []).map(a => a?.pd_number).filter(Boolean))];
    const esps = [...new Set((attestations || []).map(a => a?.esp_number).filter(Boolean))];
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

    const filteredAttestations = attestations.filter(att => {
        if (filters.client !== 'all' && att.client_name !== filters.client) return false;
        if (filters.pd !== 'all' && att.pd_number !== filters.pd) return false;
        if (filters.esp !== 'all' && att.esp_number !== filters.esp) return false;

        if (att.reference_month) {
            const [attYear, attMonth] = att.reference_month.split('-');
            if (filters.year !== 'all' && attYear !== filters.year) return false;
            if (filters.month !== 'all' && attMonth !== filters.month) return false;
        }

        return true;
    });

    const totalBilled = filteredAttestations.reduce((sum, att) => sum + (parseFloat(att.billed_amount) || 0), 0);
    const totalMeasurement = filteredAttestations.reduce((sum, att) => sum + (parseFloat(att.measurement_value) || 0), 0);

    const totalPaid = filteredAttestations.reduce((sum, att) => sum + (parseFloat(att.paid_amount) || 0), 0);
    const totalGap = totalMeasurement - totalBilled;

    // Contagem de registros únicos de clientes com pendência (GAP > 0)
    const clientsWithPendency = new Set(
        filteredAttestations
            .filter(att => (parseFloat(att.measurement_value) || 0) - (parseFloat(att.billed_amount) || 0) > 0)
            .map(att => att.client_name)
    ).size;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Meu Painel de Atestações</h1>
                    <p className="text-slate-600 mt-1 pb-1 border-b">Acompanhe suas medições apontadas, valores faturados e análise de GAP</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <PendencyCard
                        title="Total Faturado"
                        value={formatCurrency(totalBilled)}
                        subtitle={`${filteredAttestations.length} registros`}
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
                        value={clientsWithPendency}
                        subtitle="Clientes únicos apresentando GAP"
                        type={clientsWithPendency > 0 ? 'warning' : 'success'}
                        icon={Users}
                    />
                </div>

                <div className="mb-6">
                    <DashboardFilters
                        filters={filters}
                        onFilterChange={setFilters}
                        clients={clients}
                        pds={pds}
                        esps={esps}
                        months={months}
                        analysts={[]} // Empty so it hide analyst filter (if DashboardFilters handles it)
                    />
                </div>

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
