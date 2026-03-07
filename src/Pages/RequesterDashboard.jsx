import React, { useState, useEffect, useMemo } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { FileText, Clock, AlertTriangle, CheckCircle2, List } from "lucide-react";
import StatsCard from '@/Components/dashboard/StatsCard';
import { isAfter, parseISO, format } from 'date-fns';
import { Button } from "@/Components/ui/button";

const ACTIVE_STATUSES = [
    "PENDENTE TRIAGEM",
    "DESIGNADA",
    "EM QUALIFICAÇÃO",
    "EM ANDAMENTO",
    "CORREÇÃO",
    "PENDÊNCIA DDS",
    "PENDÊNCIA DOP",
    "PENDÊNCIA DOP E DDS",
    "PENDÊNCIA COMERCIAL",
    "PENDÊNCIA FORNECEDOR"
];

export default function RequesterDashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('fluxo_user') || localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const { data: demands = [], isLoading } = useQuery({
        queryKey: ['my-demands', user?.email],
        queryFn: async () => {
            // We fetch all and filter client-side for now, or use a specific endpoint if available.
            // Ideally: fluxoApi.entities.Demand.list({ requester: user.email })
            // For now, listing all and filtering is consistent with the current Dashboard.jsx approach
            return fluxoApi.entities.Demand.list();
        },
        enabled: !!user
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => fluxoApi.entities.User.list()
    });

    const myDemands = useMemo(() => {
        if (!user || user.role !== 'requester') return [];

        // Encontra o ID do usuário na lista de usuários pelo email
        const myRequesterProfile = users.find(u => u.email === user.email);

        if (!myRequesterProfile) {
            // Fallback: se não achar na lista de usuários, tenta filtrar por email direto na demanda
            // Mas o ideal é pelo ID se o backend vincula por ID
            return demands.filter(d => d.requester_email === user.email);
        }

        return demands.filter(d => d.requester_id === myRequesterProfile.id);
    }, [demands, user, users]);

    const stats = useMemo(() => {
        const total = myDemands.length;

        const open = myDemands.filter(d =>
            ACTIVE_STATUSES.includes(d.status) && d.status !== 'CONGELADA'
        ).length;

        const overdue = myDemands.filter(d =>
            d.expected_delivery_date &&
            ACTIVE_STATUSES.includes(d.status) &&
            isAfter(new Date(), parseISO(d.expected_delivery_date))
        ).length;

        const delivered = myDemands.filter(d => d.status === 'ENTREGUE').length;

        return { total, open, overdue, delivered };
    }, [myDemands]);

    const [filterStatus, setFilterStatus] = useState('open'); // default to open demands

    const filteredList = useMemo(() => {
        if (filterStatus === 'total') return myDemands;
        if (filterStatus === 'open') return myDemands.filter(d => ACTIVE_STATUSES.includes(d.status) && d.status !== 'CONGELADA');
        if (filterStatus === 'overdue') return myDemands.filter(d => d.expected_delivery_date && ACTIVE_STATUSES.includes(d.status) && isAfter(new Date(), parseISO(d.expected_delivery_date)));
        if (filterStatus === 'delivered') return myDemands.filter(d => d.status === 'ENTREGUE');
        return myDemands;
    }, [myDemands, filterStatus]);

    const getFilterTitle = () => {
        switch (filterStatus) {
            case 'total': return 'Todas as Minhas Solicitações';
            case 'open': return 'Solicitações em Aberto';
            case 'overdue': return 'Solicitações Atrasadas';
            case 'delivered': return 'Solicitações Entregues';
            default: return 'Solicitações';
        }
    };

    const usersMap = useMemo(() => {
        return users.reduce((acc, u) => {
            acc[u.id] = u.name;
            return acc;
        }, {});
    }, [users]);

    if (isLoading) return <div className="p-10 text-center">Carregando suas demandas...</div>;

    return (
        <div className="p-6 min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Painel do Solicitante CDPC
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Olá, <span className="font-semibold text-blue-600">{user?.name}</span>. Acompanhe aqui suas demandas.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                        title="Total de Solicitações"
                        value={stats.total}
                        icon={FileText}
                        type="default"
                        onClick={() => setFilterStatus('total')}
                    />
                    <StatsCard
                        title="Em Andamento"
                        value={stats.open}
                        icon={Clock}
                        type="warning"
                        onClick={() => setFilterStatus('open')}
                    />
                    <StatsCard
                        title="Atrasadas"
                        value={stats.overdue}
                        icon={AlertTriangle}
                        type="danger"
                        onClick={() => setFilterStatus('overdue')}
                    />
                    <StatsCard
                        title="Entregues"
                        value={stats.delivered}
                        icon={CheckCircle2}
                        type="success"
                        onClick={() => setFilterStatus('delivered')}
                    />
                </div>

                <Card className="border-slate-200 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
                        <div>
                            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                                <List className="w-5 h-5 text-blue-600" />
                                {getFilterTitle()}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3">Nº Demanda</th>
                                        <th className="px-6 py-3">Título / Produto</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Responsável Atual</th>
                                        <th className="px-6 py-3">Previsão</th>
                                        <th className="px-6 py-3">Última Atualização</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredList.length > 0 ? filteredList.map(d => (
                                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{d.demand_number || `#${d.id}`}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{d.title || d.product}</div>
                                                {d.product && d.title && <div className="text-xs text-slate-500">{d.product}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${d.status === 'ENTREGUE' ? 'bg-emerald-100 text-emerald-700' :
                                                        d.status === 'CANCELADA' ? 'bg-slate-100 text-slate-600' :
                                                            'bg-blue-100 text-blue-700'}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {/* Assuming we get analyst name, if not needs a map from users list */}
                                                {usersMap[d.analyst_id] || d.analyst_name || d.analyst_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {d.expected_delivery_date ? format(parseISO(d.expected_delivery_date), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {d.updated_at ? format(parseISO(d.updated_at), 'dd/MM/yyyy HH:mm') : '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                Nenhuma demanda encontrada nesta categoria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
