import React from 'react';
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, ArrowRight, Timer } from "lucide-react";

function formatDuration(minutes) {
    if (!minutes || minutes < 0) return '-';

    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = Math.floor(minutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

    return parts.join(' ');
}

const statusColors = {
    "PENDENTE TRIAGEM": "bg-amber-500",
    "TRIAGEM NÃO ELEGÍVEL": "bg-slate-400",
    "DESIGNADA": "bg-blue-500",
    "EM QUALIFICAÇÃO": "bg-violet-500",
    "EM ANDAMENTO": "bg-indigo-500",
    "PENDÊNCIA DDS": "bg-orange-500",
    "PENDÊNCIA DOP": "bg-orange-500",
    "PENDÊNCIA DOP E DDS": "bg-orange-500",
    "PENDÊNCIA COMERCIAL": "bg-rose-500",
    "PENDÊNCIA SUPRIMENTOS": "bg-teal-500",
    "PENDÊNCIA FORNECEDOR": "bg-red-500",
    "CONGELADA": "bg-cyan-500",
    "CORREÇÃO": "bg-yellow-500",
    "ENTREGUE": "bg-emerald-500",
    "CANCELADA": "bg-zinc-400"
};

/**
 * Calcula quantos dias ficou em cada status baseado no histórico de transições.
 * Retorna um Map com os dias por transição (índice) e o total de dias da demanda.
 */
function calculateDaysPerStatus(sortedHistory, demandCreatedAt, currentStatus) {
    const daysMap = new Map(); // index -> days in that status (the from_status)
    const now = new Date();
    const FINAL_STATUSES = ['ENTREGUE', 'CANCELADA'];

    for (let i = 0; i < sortedHistory.length; i++) {
        const item = sortedHistory[i];
        const changedAt = new Date(item.changed_at);

        // A data de referência anterior: se é o primeiro item, usa a data de criação da demanda
        let previousDate;
        if (i === 0) {
            previousDate = demandCreatedAt ? new Date(demandCreatedAt) : changedAt;
        } else {
            previousDate = new Date(sortedHistory[i - 1].changed_at);
        }

        const days = Math.max(0, differenceInCalendarDays(changedAt, previousDate));
        daysMap.set(i, days);
    }

    // Calcular dias no status ATUAL (último status)
    let currentStatusDays = 0;
    if (sortedHistory.length > 0) {
        const lastChanged = new Date(sortedHistory[sortedHistory.length - 1].changed_at);
        if (FINAL_STATUSES.includes(currentStatus)) {
            currentStatusDays = 0; // Já parou de contar
        } else {
            currentStatusDays = Math.max(0, differenceInCalendarDays(now, lastChanged));
        }
    }

    // Total de dias
    let totalDays = 0;
    if (demandCreatedAt) {
        const startDate = new Date(demandCreatedAt);
        if (FINAL_STATUSES.includes(currentStatus) && sortedHistory.length > 0) {
            // Se entregue/cancelada, conta até a última transição
            const lastChanged = new Date(sortedHistory[sortedHistory.length - 1].changed_at);
            totalDays = Math.max(0, differenceInCalendarDays(lastChanged, startDate));
        } else {
            totalDays = Math.max(0, differenceInCalendarDays(now, startDate));
        }
    }

    return { daysMap, currentStatusDays, totalDays };
}

export default function StatusTimeline({ history = [], currentStatus, demandCreatedAt }) {
    if (!history || history.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum histórico de movimentação</p>
            </div>
        );
    }

    const sortedHistory = [...history].sort((a, b) =>
        new Date(a.changed_at) - new Date(b.changed_at)
    );

    const { daysMap, currentStatusDays, totalDays } = calculateDaysPerStatus(
        sortedHistory, demandCreatedAt, currentStatus
    );

    return (
        <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-4">
                {sortedHistory.map((item, index) => {
                    const daysInStatus = daysMap.get(index);
                    return (
                        <div key={item.id || index} className="relative pl-10">
                            <div className={cn(
                                "absolute left-2.5 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                                statusColors[item.to_status] || "bg-slate-400"
                            )} />

                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                                    <span>{format(parseISO(item.changed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                                    {item.time_in_previous_status_minutes > 0 && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded text-slate-600 font-medium">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(item.time_in_previous_status_minutes)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm flex-wrap">
                                    {item.from_status && (
                                        <>
                                            <span className="text-slate-600">{item.from_status}</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                        </>
                                    )}
                                    <span className="font-medium text-slate-800">{item.to_status}</span>
                                </div>
                                {daysInStatus !== undefined && daysInStatus >= 0 && item.from_status && (
                                    <div className="mt-1.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            <Timer className="w-3 h-3" />
                                            {daysInStatus} {daysInStatus === 1 ? 'dia' : 'dias'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {currentStatus && (
                    <div className="relative pl-10">
                        <div className={cn(
                            "absolute left-2.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-4 ring-indigo-100",
                            statusColors[currentStatus] || "bg-slate-400"
                        )} />
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                            <div className="text-xs text-indigo-600 mb-1">Status Atual</div>
                            <div className="font-semibold text-indigo-800">{currentStatus}</div>
                            {currentStatusDays > 0 && (
                                <div className="mt-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                        <Timer className="w-3 h-3" />
                                        {currentStatusDays} {currentStatusDays === 1 ? 'dia' : 'dias'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Exportar função para uso externo (DemandDetail)
export { calculateDaysPerStatus };
