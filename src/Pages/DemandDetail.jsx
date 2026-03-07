import { useState, useEffect } from 'react';
import { fluxoApi } from '@/api/fluxoClient';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit2, Clock, Calendar, User, Building2, Layers, AlertTriangle, Trash2, Timer, RotateCcw, PackageCheck, RefreshCw, CheckCircle2 } from "lucide-react";
import StatusBadge from '@/Components/demands/StatusBadge';
import PriorityBadge from '@/Components/demands/PriorityBadge';
import StatusTimeline from '@/Components/demands/StatusTimeline';
import DemandProcessChart from '@/Components/demands/DemandProcessChart';
import { StageStepper } from '@/Components/demands/StageStepper';
import DemandForm from '@/Components/demands/DemandForm';
import ReopenDemandModal from '@/Components/demands/ReopenDemandModal';
import { calculateWorkDays, calculateSLA } from '@/Components/demands/EffortCalculator';
import { format, parseISO, isAfter, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
    "PENDÊNCIA SUPRIMENTOS",
    "PENDÊNCIA FORNECEDOR",
    "REABERTA",
    "ASSINADA"
];

const MANAGER_ROLES = ['manager', 'admin', 'gestor'];

export default function DemandDetailPage() {
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const demandId = urlParams.get('id');

    const { user } = useAuth();
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [showRedeliverDialog, setShowRedeliverDialog] = useState(false);
    const [showAssinadaDialog, setShowAssinadaDialog] = useState(false);
    const [showProcessMap, setShowProcessMap] = useState(false);

    const { data: demand, isLoading: loadingDemand } = useQuery({
        queryKey: ['demand', demandId],
        queryFn: () => fluxoApi.entities.Demand.get(demandId),
        enabled: !!demandId,
        staleTime: 2 * 60 * 1000, // 2 min
    });

    const { data: history = [] } = useQuery({
        queryKey: ['history', demandId],
        queryFn: () => fluxoApi.entities.StatusHistory.list({ demand_id: demandId, sort: 'changed_at' }),
        enabled: !!demandId,
        staleTime: 2 * 60 * 1000,
    });

    const { data: holidays = [] } = useQuery({
        queryKey: ['holidays'],
        queryFn: () => fluxoApi.entities.Holiday.list(),
        staleTime: 15 * 60 * 1000, // 15 min — feriados raramente mudam
    });

    const { data: stageHistory = [] } = useQuery({
        queryKey: ['stage-history', demandId],
        queryFn: () => fluxoApi.entities.StageHistory.list({ demand_id: demandId }),
        enabled: !!demandId,
        staleTime: 2 * 60 * 1000,
    });

    const { data: reopenings = [] } = useQuery({
        queryKey: ['reopenings', demandId],
        queryFn: () => fluxoApi.demands.reopenings(demandId).catch(() => []),
        enabled: !!demandId,
        staleTime: 2 * 60 * 1000,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => fluxoApi.entities.User.list(),
        staleTime: 15 * 60 * 1000,
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => fluxoApi.entities.Client.list(),
        staleTime: 15 * 60 * 1000,
    });

    const { data: cycles = [] } = useQuery({
        queryKey: ['cycles'],
        queryFn: () => fluxoApi.entities.Cycle.list(),
        staleTime: 15 * 60 * 1000,
    });

    // Filtros unificados com lógica de perservação do valor atual
    const analysts = users.filter(u =>
        (['analyst', 'manager', 'admin'].includes(u.role) &&
            (!u.department || u.department === 'CDPC')) ||
        (demand && String(u.id) === String(demand.analyst_id))
    );

    const requesters = users.filter(u =>
        (['requester', 'analyst', 'manager', 'admin'].includes(u.role) &&
            (!u.department || u.department === 'CDPC')) ||
        (demand && String(u.id) === String(demand.requester_id))
    );

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            // Notificações
            if (data.status) {
                const oldStatus = demand?.status;
                const newStatus = data.status;

                // Notificar requester se demanda foi entregue ou cancelada
                if (newStatus === 'ENTREGUE' || newStatus === 'CANCELADA') {
                    const requester = requesters.find(r => r.id === demand.requester_id);
                    if (requester?.email) {
                        try {
                            await fluxoApi.integrations.Core.SendEmail({
                                to: requester.email,
                                subject: `Demanda ${newStatus === 'ENTREGUE' ? 'entregue' : 'cancelada'}: ${demand.product}`,
                                body: `A demanda "${demand.product}" foi ${newStatus === 'ENTREGUE' ? 'entregue' : 'cancelada'}.\n\nAcesse o sistema para mais detalhes.`
                            });
                        } catch (e) {
                            console.error('Erro ao enviar notificação:', e);
                        }
                    }
                }
            }

            // Notificar analista se mudou
            if (data.analyst_id && data.analyst_id !== demand.analyst_id) {
                const analyst = analysts.find(a => a.id === data.analyst_id);
                if (analyst?.email) {
                    try {
                        await fluxoApi.integrations.Core.SendEmail({
                            to: analyst.email,
                            subject: `Nova demanda designada: ${demand.product}`,
                            body: `Você foi designado como responsável pela demanda "${demand.product}".\n\nAcesse o sistema para mais detalhes.`
                        });
                    } catch (e) {
                        console.log('Erro ao enviar notificação:', e);
                    }
                }
            }

            return fluxoApi.entities.Demand.update(demandId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['demand', demandId] });
            queryClient.invalidateQueries({ queryKey: ['history', demandId] });
            setShowEditForm(false);
            toast.success('Demanda atualizada!');
        },
        onError: (error) => {
            console.error('Erro ao atualizar demanda:', error);
            toast.error(error.message || 'Erro ao atualizar a demanda. Verifique os dados e tente novamente.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            // Deletar histórico primeiro
            for (const h of history) {
                await fluxoApi.entities.StatusHistory.delete(h.id);
            }
            return fluxoApi.entities.Demand.delete(demandId);
        },
        onSuccess: () => {
            toast.success('Demanda excluída!');
            window.location.href = createPageUrl('Demands');
        }
    });

    const redeliverMutation = useMutation({
        mutationFn: () => fluxoApi.demands.redeliver(demandId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['demand', demandId] });
            queryClient.invalidateQueries({ queryKey: ['history', demandId] });
            queryClient.invalidateQueries({ queryKey: ['reopenings', demandId] });
            queryClient.invalidateQueries({ queryKey: ['demands'] });
            setShowRedeliverDialog(false);
            toast.success('Demanda re-entregue com sucesso!');
        },
        onError: (err) => toast.error(err.message)
    });

    const markAssinadaMutation = useMutation({
        mutationFn: () => updateMutation.mutateAsync({ status: 'ASSINADA' }),
        onSuccess: () => {
            setShowAssinadaDialog(false);
            toast.success('Demanda marcada como ASSINADA!');
        }
    });

    const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

    const clearHistoryMutation = useMutation({
        mutationFn: () => fluxoApi.demands.clearHistory(demandId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history', demandId] });
            setShowClearHistoryDialog(false);
            toast.success('Histórico limpo com sucesso!');
        },
        onError: () => {
            toast.error('Erro ao limpar histórico');
        }
    });

    if (loadingDemand) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!demand) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-700">Demanda não encontrada</h2>
                    <Link to={createPageUrl('Demands')}>
                        <Button variant="link" className="mt-4">Voltar para lista</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const analyst = analysts.find(a => a.id === demand.analyst_id);
    const client = clients.find(c => c.id === demand.client_id);
    const cycle = cycles.find(c => c.id === demand.cycle_id);
    const requester = requesters.find(r => r.id === demand.requester_id);

    const endDate = demand.delivery_date || demand.expected_delivery_date || new Date().toISOString().split('T')[0];
    const effortDays = demand.qualification_date
        ? calculateWorkDays(demand.qualification_date, endDate, holidays) - Math.floor((demand.frozen_time_minutes || 0) / (60 * 24))
        : 0;
    const slaDays = demand.qualification_date
        ? calculateSLA(demand.qualification_date, endDate)
        : 0;

    const isOverdue = demand.expected_delivery_date &&
        ACTIVE_STATUSES.includes(demand.status) &&
        isAfter(new Date(), parseISO(demand.expected_delivery_date));

    // Calcular tempo total da demanda em dias
    const FINAL_STATUSES = ['ENTREGUE', 'CANCELADA', 'ASSINADA'];
    const sortedHistory = [...history].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
    let totalDemandDays = 0;
    if (demand.created_date) {
        const startDate = new Date(demand.created_date);
        if (FINAL_STATUSES.includes(demand.status) && sortedHistory.length > 0) {
            const lastChanged = new Date(sortedHistory[sortedHistory.length - 1].changed_at);
            totalDemandDays = Math.max(0, differenceInCalendarDays(lastChanged, startDate));
        } else {
            totalDemandDays = Math.max(0, differenceInCalendarDays(new Date(), startDate));
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <Link to={createPageUrl('Demands')}>
                        <Button variant="ghost" className="text-slate-600">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        {/* Botão Visualizar Processo: para admin */}
                        {user?.role === 'admin' && (
                            <Button
                                variant="outline"
                                onClick={() => setShowProcessMap(true)}
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                                <Layers className="w-4 h-4 mr-2" />
                                Mapa do Processo
                            </Button>
                        )}
                        {/* Botão Assinada: só para admin quando ENTREGUE */}
                        {user?.role === 'admin' && demand?.status === 'ENTREGUE' && (
                            <Button
                                variant="default"
                                onClick={() => setShowAssinadaDialog(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Marcar como Assinada
                            </Button>
                        )}
                        {/* Botão Reabrir: só para gestor+ quando ENTREGUE */}
                        {user && MANAGER_ROLES.includes(user.role) && demand?.status === 'ENTREGUE' && (
                            <Button
                                variant="outline"
                                onClick={() => setShowReopenModal(true)}
                                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reabrir
                            </Button>
                        )}
                        {/* Botão Re-entregar: analista+ quando REABERTA */}
                        {user && user.role !== 'requester' && user.role !== 'viewer' && demand?.status === 'REABERTA' && (
                            <Button
                                variant="outline"
                                onClick={() => setShowRedeliverDialog(true)}
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                                <PackageCheck className="w-4 h-4 mr-2" />
                                Re-entregar
                            </Button>
                        )}
                        {user && user.role !== 'requester' && (
                            <Button
                                variant="outline"
                                onClick={() => setShowEditForm(true)}
                                className="text-slate-600"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        )}
                        {user?.role === 'admin' && (
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </Button>
                        )}
                    </div>
                </div>
                <div className="mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Fluxo de Etapas (CDPC)</h3>
                        <StageStepper
                            currentStage={demand.stage || 'Triagem'}
                            stageHistory={stageHistory}
                            onStageClick={(newStage) => {
                                if (user?.role !== 'requester') {
                                    updateMutation.mutate({ stage: newStage });
                                }
                            }}
                            readOnly={user?.role === 'requester'}
                        />
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                            <div className={isOverdue ? "bg-red-50 border-b border-red-100 p-6" : "bg-gradient-to-r from-indigo-50 to-violet-50 p-6"}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-sm font-mono font-bold text-slate-600">
                                                #{demand.demand_number || demand.id?.slice(-6)}
                                            </span>
                                            {isOverdue && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    ATRASADA
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl font-bold text-slate-900">
                                            {demand.product}
                                        </h1>
                                    </div>
                                    <StatusBadge status={demand.status} />
                                </div>
                            </div>

                            <CardContent className="p-6 space-y-3">

                                {/* Linha 1 — Artefato | Prioridade | Valor */}
                                <div className="grid gap-3" style={{ gridTemplateColumns: '0.8fr 1fr 1.2fr' }}>
                                    <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Artefato</span>
                                        <span className="font-semibold text-slate-800 text-sm">{demand.artifact}</span>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Prioridade</span>
                                        <PriorityBadge weight={demand.weight} />
                                    </div>
                                    <div className={`rounded-xl p-3 flex flex-col gap-1 ${demand.value != null ? 'bg-emerald-50 border border-emerald-200 shadow-sm' : 'bg-slate-50'}`}>
                                        <span className={`text-[11px] font-medium uppercase tracking-wider ${demand.value != null ? 'text-emerald-600' : 'text-slate-400'}`}>Valor</span>
                                        <span className={`font-bold ${demand.value != null ? 'text-emerald-700 text-base' : 'text-slate-400 text-sm'}`}>
                                            {demand.value != null
                                                ? Number(demand.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                : 'Não informado'}
                                        </span>
                                    </div>
                                </div>

                                {/* Linha 2 — Esforço | SLA */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Esforço</span>
                                        <span className="font-semibold text-slate-800 text-sm">{effortDays} dias úteis</span>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">SLA</span>
                                        <span className="font-semibold text-slate-800 text-sm">{slaDays} dias corridos</span>
                                    </div>
                                </div>

                                {/* Linha 3 — Cliente (full width) */}
                                {client && (
                                    <div className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                                        <Building2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Cliente</p>
                                            <p className="font-semibold text-slate-800 text-sm leading-snug">{client.name}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Linha 4 — Responsável | Ciclo */}
                                {(analyst || cycle) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {analyst && (
                                            <div className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                                                <User className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Responsável</p>
                                                    <p className="font-semibold text-slate-800 text-sm leading-snug">{analyst.name}</p>
                                                </div>
                                            </div>
                                        )}
                                        {cycle && (
                                            <div className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                                                <Layers className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Ciclo</p>
                                                    <p className="font-semibold text-slate-800 text-sm leading-snug">{cycle.name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rodapé — Datas */}
                                {(demand.qualification_date || demand.expected_delivery_date || demand.delivery_date) && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {demand.qualification_date && (
                                            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                <span className="text-xs text-indigo-500 font-medium">Qualificação</span>
                                                <span className="text-xs font-bold text-indigo-700">
                                                    {format(parseISO(demand.qualification_date), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                        )}
                                        {demand.expected_delivery_date && (
                                            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-100'}`}>
                                                <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-400' : 'text-amber-400'}`} />
                                                <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>Previsão</span>
                                                <span className={`text-xs font-bold ${isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
                                                    {format(parseISO(demand.expected_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                                {isOverdue && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded ml-1">ATRASADA</span>}
                                            </div>
                                        )}
                                        {demand.delivery_date && (
                                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-xs text-emerald-600 font-medium">Data Fim</span>
                                                <span className="text-xs font-bold text-emerald-700">
                                                    {format(parseISO(demand.delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Observações */}
                                {demand.observation && (
                                    <div className="border-t border-slate-100 pt-4">
                                        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Observações</h3>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{demand.observation}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-0 shadow-lg rounded-2xl">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-600" />
                                    Linha do Tempo
                                    {totalDemandDays > 0 && (
                                        <span className="inline-flex items-center gap-1 ml-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm">
                                            <Timer className="w-3 h-3" />
                                            {totalDemandDays} {totalDemandDays === 1 ? 'dia' : 'dias'}
                                        </span>
                                    )}
                                </CardTitle>
                                {user?.role === 'admin' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setShowClearHistoryDialog(true)}
                                        title="Limpar Histórico"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <StatusTimeline history={history} currentStatus={demand.status} demandCreatedAt={demand.created_date} />
                            </CardContent>
                        </Card>

                        {/* Histórico de Reaberturas */}
                        {reopenings.length > 0 && (
                            <Card className="border-0 shadow-lg rounded-2xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 text-amber-600" />
                                        Reaberturas
                                        <span className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                            {reopenings.length}x
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {reopenings.map((r, idx) => (
                                        <div key={r.id} className="border border-slate-100 rounded-xl p-4 space-y-2 bg-amber-50/40">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                                    Reabertura #{idx + 1}
                                                </span>
                                                {r.redelivered_at ? (
                                                    <span className="text-xs text-emerald-600 font-medium">
                                                        ✅ Re-entregue em {format(new Date(r.redelivered_at), "dd/MM/yyyy", { locale: ptBR })}
                                                        {r.redelivered_by_name && ` por ${r.redelivered_by_name}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-amber-600 font-medium animate-pulse">⚡ Em aberto</span>
                                                )}
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-slate-500">Motivo: </span>
                                                <span className="font-medium text-slate-800">{r.reason_label}</span>
                                            </div>
                                            {r.detail && (
                                                <p className="text-sm text-slate-600 italic border-l-2 border-amber-300 pl-3">{r.detail}</p>
                                            )}
                                            <div className="text-xs text-slate-400">
                                                Reaberta em {format(new Date(r.reopened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                {r.reopened_by_name && ` por ${r.reopened_by_name}`}
                                                {r.redelivered_at && (
                                                    <> · SLA reabertura: {Math.ceil((new Date(r.redelivered_at) - new Date(r.reopened_at)) / 86400000)} dia(s)</>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Limpar Histórico?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso apagará todo o histórico de status desta demanda. Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => clearHistoryMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Limpar Tudo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Demanda</DialogTitle>
                    </DialogHeader>
                    <DemandForm
                        key={demand?.updated_at || 'form'}
                        demand={demand}
                        onSave={(data) => updateMutation.mutate(data)}
                        onCancel={() => setShowEditForm(false)}
                        isLoading={updateMutation.isPending}
                        analysts={analysts}
                        clients={clients}
                        cycles={cycles}
                        requesters={requesters}
                        userRole={user?.role}
                        userDepartment={user?.department}
                    />
                </DialogContent>
            </Dialog>

            {/* Modal Reabrir Demanda */}
            <ReopenDemandModal
                open={showReopenModal}
                onOpenChange={setShowReopenModal}
                demandId={demandId}
                demandName={demand?.product}
            />

            {/* Confirmação de Re-entrega */}
            <AlertDialog open={showRedeliverDialog} onOpenChange={setShowRedeliverDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Re-entregar demanda?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O status voltará para <strong>ENTREGUE</strong> e a data de entrega será atualizada para agora.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={redeliverMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => redeliverMutation.mutate()}
                            disabled={redeliverMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {redeliverMutation.isPending ? 'Salvando...' : 'Confirmar Re-entrega'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirmação de Assinada */}
            <AlertDialog open={showAssinadaDialog} onOpenChange={setShowAssinadaDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Marcar como Assinada?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso irá atualizar o status da demanda para <strong>ASSINADA</strong>, sinalizando o fim do ciclo do processo de Contrato.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={markAssinadaMutation.isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => markAssinadaMutation.mutate()}
                            disabled={markAssinadaMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600"
                        >
                            {markAssinadaMutation.isPending ? 'Salvando...' : 'Confirmar Assinatura'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir demanda?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A demanda e todo seu histórico serão permanentemente removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal do Mapa de Processo */}
            <Dialog open={showProcessMap} onOpenChange={setShowProcessMap}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none [&>button]:text-white [&>button]:opacity-70 hover:[&>button]:opacity-100 hover:[&>button]:bg-white/10 [&>button]:right-4 [&>button]:top-4 [&>button]:rounded-full [&>button]:p-1.5">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Mapa do Processo da Demanda</DialogTitle>
                    </DialogHeader>
                    {user?.role === 'admin' && (
                        <DemandProcessChart history={history} demandCreatedAt={demand.created_date} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
