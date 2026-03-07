import { useState, useEffect, useMemo } from 'react';
import { usePersistedFilters } from '@/hooks/usePersistedFilters';
import { fluxoApi } from '@/api/fluxoClient';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DemandFilters from '@/components/demands/DemandFilters';
import DemandCard from '@/components/demands/DemandCard';
import DemandForm from '@/components/demands/DemandForm';
import ReopeningReasonsManager from '@/Components/demands/ReopeningReasonsManager';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DemandsPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [duplicateData, setDuplicateData] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [showReasonsManager, setShowReasonsManager] = useState(false);
    const [demandToDelete, setDemandToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = viewMode === 'grid' ? 18 : 24;
    const [filters, setFilters] = usePersistedFilters('cdpc_filters', {
        search: '',
        status: 'active',
        analyst_id: 'all',
        client_id: 'all',
        cycle_id: 'all',
        weight: 'all',
        sortBy: 'date_desc'
    });

    // Reset to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const { data: demands = [], isLoading: loadingDemands } = useQuery({
        queryKey: ['demands'],
        queryFn: () => fluxoApi.entities.Demand.list('-created_date')
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => fluxoApi.entities.User.list()
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => fluxoApi.entities.Client.list()
    });

    const { data: cycles = [] } = useQuery({
        queryKey: ['cycles'],
        queryFn: () => fluxoApi.entities.Cycle.list()
    });

    // Filtra usuários para CDPC
    const { analysts, requesters } = useMemo(() => {
        const cdpcAnalysts = users.filter(u =>
            ['analyst', 'manager', 'admin'].includes(u.role) &&
            (!u.department || u.department === 'CDPC')
        );
        const cdpcRequesters = users.filter(u =>
            ['requester', 'analyst', 'manager', 'admin'].includes(u.role) &&
            (!u.department || u.department === 'CDPC')
        );
        return { analysts: cdpcAnalysts, requesters: cdpcRequesters };
    }, [users]);

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const demand = await fluxoApi.entities.Demand.create(data);
            await fluxoApi.entities.StatusHistory.create({
                demand_id: demand.id,
                from_status: null,
                to_status: data.status || 'PENDENTE TRIAGEM',
                changed_at: new Date().toISOString(),
                time_in_previous_status_minutes: 0,
                changed_by: user?.email
            });

            // Notificar analista se designado
            if (data.analyst_id) {
                const analyst = analysts.find(a => a.id === data.analyst_id);
                if (analyst?.email) {
                    try {
                        await fluxoApi.integrations.Core.SendEmail({
                            to: analyst.email,
                            subject: `Nova demanda designada: ${data.product}`,
                            body: `Você foi designado como responsável pela demanda "${data.product}".\n\nAcesse o sistema para mais detalhes.`
                        });
                    } catch (e) {
                        console.log('Erro ao enviar notificação:', e);
                    }
                }
            }
            return demand;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['demands'] });
            setShowForm(false);
            setDuplicateData(null);
            toast.success('Demanda criada com sucesso!');
        },
        onError: (error) => {
            toast.error('Erro ao criar demanda');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => fluxoApi.entities.Demand.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['demands'] });
            toast.success('Demanda excluída com sucesso!');
        },
        onError: () => toast.error('Erro ao excluir demanda')
    });

    const handleDelete = (id) => {
        setDemandToDelete(id);
    };

    const handleDuplicate = (demand) => {
        const { id, demand_number, created_date, qualification_date, expected_delivery_date, delivery_date, last_frozen_at, ...rest } = demand;
        setDuplicateData({ ...rest, status: 'PENDENTE TRIAGEM' });
        setShowForm(true);
    };

    const filteredDemands = useMemo(() => {
        const filtered = demands.filter(d => {
            // Role-based filtering
            if (user?.role === 'analyst') {
                const myAnalystProfile = analysts.find(a => a.email === user.email);
                if (myAnalystProfile && d.analyst_id !== myAnalystProfile.id) {
                    return false;
                }
            }
            if (user?.role === 'requester') {
                const myRequesterProfile = requesters.find(r => r.email === user.email);
                if (myRequesterProfile && d.requester_id !== myRequesterProfile.id) {
                    return false;
                }
            }

            // Client-side Filters
            if (filters.search) {
                const search = filters.search.toLowerCase();
                if (!d.product?.toLowerCase().includes(search) &&
                    !d.demand_number?.toLowerCase().includes(search)) {
                    return false;
                }
            }

            if (filters.status === 'active') {
                if (['ENTREGUE', 'CANCELADA'].includes(d.status)) return false;
            } else if (filters.status !== 'all' && d.status !== filters.status) {
                return false;
            }

            if (filters.analyst_id !== 'all' && d.analyst_id !== filters.analyst_id) return false;
            if (filters.client_id !== 'all' && d.client_id !== filters.client_id) return false;
            if (filters.cycle_id !== 'all' && d.cycle_id !== filters.cycle_id) return false;
            if (filters.weight !== 'all' && String(d.weight || 4) !== filters.weight) return false;

            return true;
        });

        // Ordenação
        const sortBy = filters.sortBy || 'date_desc';
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'date_asc': return new Date(a.created_date) - new Date(b.created_date);
                case 'date_desc': return new Date(b.created_date) - new Date(a.created_date);
                case 'alpha_asc': return (a.product || '').localeCompare(b.product || '', 'pt-BR');
                case 'alpha_desc': return (b.product || '').localeCompare(a.product || '', 'pt-BR');
                case 'priority': return (a.weight ?? 4) - (b.weight ?? 4);
                default: return 0;
            }
        });
    }, [demands, filters, user, analysts, requesters]);


    const analystsMap = useMemo(() => Object.fromEntries(analysts.map(a => [a.id, a])), [analysts]);
    const clientsMap = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients]);

    const totalPages = Math.ceil(filteredDemands.length / ITEMS_PER_PAGE);
    const paginatedDemands = filteredDemands.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            Demandas
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {filteredDemands.length} demanda(s) encontrada(s)
                            {totalPages > 1 && ` · Página ${currentPage} de ${totalPages}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="h-8 w-8 p-0"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="h-8 w-8 p-0"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                        {['manager', 'admin', 'gestor'].includes(user?.role) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowReasonsManager(true)}
                                className="text-slate-500 border-slate-200 hover:bg-slate-50"
                                title="Configurar motivos de reabertura"
                            >
                                <Settings className="w-4 h-4 mr-1.5" />
                                Motivos
                            </Button>
                        )}
                        {user?.role !== 'requester' && user?.role !== 'viewer' && (
                            <Button
                                onClick={() => setShowForm(true)}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Demanda
                            </Button>
                        )}
                    </div>
                </div>

                <DemandFilters
                    filters={filters}
                    setFilters={setFilters}
                    analysts={analysts}
                    clients={clients}
                    cycles={cycles}
                />

                <div className="mt-6">
                    {loadingDemands ? (
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            : "space-y-3"
                        }>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Skeleton key={i} className="h-40 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredDemands.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <List className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600 mb-1">
                                Nenhuma demanda encontrada
                            </h3>
                            <p className="text-sm text-slate-400">
                                Ajuste os filtros ou crie uma nova demanda
                            </p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            : "space-y-3"
                        }>
                            {paginatedDemands.map(demand => (
                                <DemandCard
                                    key={demand.id}
                                    demand={demand}
                                    analyst={analystsMap[demand.analyst_id]}
                                    client={clientsMap[demand.client_id]}
                                    onDelete={(user?.role === 'analyst' || user?.role === 'viewer') ? null : handleDelete}
                                    onDuplicate={handleDuplicate}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Anterior
                            </button>
                            <span className="px-4 py-2 text-sm text-slate-500">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Próxima →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={(open) => {
                setShowForm(open);
                if (!open) setDuplicateData(null);
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{duplicateData ? "Duplicar Demanda" : "Nova Demanda"}</DialogTitle>
                    </DialogHeader>
                    <DemandForm
                        demand={duplicateData}
                        onSave={(data) => createMutation.mutate(data)}
                        onCancel={() => { setShowForm(false); setDuplicateData(null); }}
                        isLoading={createMutation.isPending}
                        analysts={analysts}
                        clients={clients}
                        cycles={cycles}
                        requesters={requesters}
                        userRole={user?.role}
                        userDepartment={user?.department}
                        isNew={true}
                    />
                </DialogContent>
            </Dialog>

            {/* Gerenciador de Motivos de Reabertura */}
            <Dialog open={showReasonsManager} onOpenChange={setShowReasonsManager}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-500" />
                            Motivos de Reabertura
                        </DialogTitle>
                    </DialogHeader>
                    <ReopeningReasonsManager />
                </DialogContent>
            </Dialog>

            {/* Delete Alert Dialog */}
            <AlertDialog open={!!demandToDelete} onOpenChange={(open) => !open && setDemandToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Demanda?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita e todos os históricos associados serão perdidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                deleteMutation.mutate(demandToDelete);
                                setDemandToDelete(null);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
