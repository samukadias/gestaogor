import React, { useState, useEffect } from 'react';
import { Activity, Filter, ChevronLeft, ChevronRight, User, Clock, FileText, Trash2, Edit, PlusCircle } from 'lucide-react';
import { fluxoApi } from '@/api/fluxoClient';
import ExportButton from '@/Components/ExportButton';

const ACTION_ICONS = {
    CREATE: <PlusCircle className="w-4 h-4 text-emerald-400" />,
    UPDATE: <Edit className="w-4 h-4 text-amber-400" />,
    DELETE: <Trash2 className="w-4 h-4 text-red-400" />,
};

const ACTION_COLORS = {
    CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UPDATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ENTITY_LABELS = {
    users: 'Usuário',
    demands: 'Demanda',
    finance_contracts: 'Contrato Financeiro',
    deadline_contracts: 'Contrato Prazos',
    clients: 'Cliente',
    analysts: 'Analista',
    attestations: 'Atestação',
    contracts: 'Contrato',
    notifications: 'Notificação',
};

const ActivityLog = () => {
    const [activities, setActivities] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [filters, setFilters] = useState({ entity: '', action: '' });

    useEffect(() => {
        fetchActivities();
    }, [page, filters]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const params = { page, limit };
            if (filters.entity) params.entity = filters.entity;
            if (filters.action) params.action = filters.action;

            const result = await fluxoApi.activity.list(params);
            setActivities(result.data || []);
            setTotal(result.total || 0);
        } catch (err) {
            console.error('Failed to load activity log:', err);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatChanges = (changes) => {
        if (!changes) return null;
        try {
            const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes;
            const keys = Object.keys(parsed).slice(0, 4);
            return keys.map(k => `${k}: ${String(parsed[k] || '').substring(0, 30)}`).join(', ');
        } catch {
            return null;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-500" />
                        Histórico de Atividades
                    </h1>
                    <p className="text-slate-500 mt-1">Registro de todas as operações realizadas no sistema</p>
                </div>
                <ExportButton
                    data={activities}
                    filename="historico_atividades"
                    sheetName="Atividades"
                    columnMap={{
                        user_name: 'Usuário',
                        action: 'Ação',
                        entity: 'Entidade',
                        entity_id: 'ID',
                        created_at: 'Data/Hora',
                    }}
                    label="Exportar Excel"
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filters.entity}
                        onChange={(e) => { setFilters(f => ({ ...f, entity: e.target.value })); setPage(1); }}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">Todas as entidades</option>
                        {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={filters.action}
                        onChange={(e) => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1); }}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">Todas as ações</option>
                        <option value="CREATE">Criação</option>
                        <option value="UPDATE">Atualização</option>
                        <option value="DELETE">Exclusão</option>
                    </select>
                </div>
                <span className="text-sm text-slate-400">{total} registros</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Data/Hora</th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Usuário</th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Ação</th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Entidade</th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">ID</th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400">
                                    <div className="animate-pulse">Carregando...</div>
                                </td>
                            </tr>
                        ) : activities.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400">
                                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    Nenhuma atividade registrada
                                </td>
                            </tr>
                        ) : (
                            activities.map((activity) => (
                                <tr key={activity.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDate(activity.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-700 font-medium">{activity.user_name || 'Sistema'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${ACTION_COLORS[activity.action] || 'bg-slate-100 text-slate-500'}`}>
                                            {ACTION_ICONS[activity.action]}
                                            {activity.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {ENTITY_LABELS[activity.entity] || activity.entity}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                                        #{activity.entity_id}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                                        {formatChanges(activity.changes)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-slate-500">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;
