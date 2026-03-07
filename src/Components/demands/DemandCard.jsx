import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Calendar, User, Building2, Clock, AlertTriangle, Trash2, Copy } from "lucide-react";
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { format, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    "PENDÊNCIA FORNECEDOR"
];

export default function DemandCard({ demand, analyst, client, onDelete, onDuplicate, viewMode = 'grid' }) {
    const isOverdue = demand.expected_delivery_date &&
        ACTIVE_STATUSES.includes(demand.status) &&
        isAfter(new Date(), parseISO(demand.expected_delivery_date));

    const isDelivered = demand.status === 'ENTREGUE';

    // ── MODO LISTA ──────────────────────────────────────────────────────────
    if (viewMode === 'list') {
        return (
            <Link to={createPageUrl(`demand-detail?id=${demand.id}`)} className="block">
                <div className={cn(
                    "bg-white rounded-xl border px-4 py-3 hover:shadow-md transition-all duration-200 cursor-pointer group",
                    isOverdue ? "border-red-300 bg-red-50/30" :
                        isDelivered ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300" :
                            "border-slate-200 hover:border-indigo-200"
                )}>
                    <div className="grid grid-cols-[2fr_1.4fr_2fr] gap-4 items-start">

                        {/* Coluna 1: número + título + badges */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-mono font-bold text-slate-600">
                                    #{demand.demand_number || demand.id?.slice(-6)}
                                </span>
                                {isOverdue && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                                        <AlertTriangle className="w-3 h-3" />
                                        ATRASADA
                                    </span>
                                )}
                                <StatusBadge status={demand.status} size="sm" />
                            </div>
                            <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors text-sm leading-snug">
                                {demand.product}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="inline-flex items-center text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                                    {demand.artifact}
                                </span>
                                <PriorityBadge weight={demand.weight} />
                            </div>
                        </div>

                        {/* Coluna 2: cliente, analista, data */}
                        <div className="flex flex-col gap-1.5 text-xs text-slate-500 justify-center self-center">
                            {client && (
                                <span className="inline-flex items-center gap-1.5 truncate">
                                    <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{client.name}</span>
                                </span>
                            )}
                            {analyst && (
                                <span className="inline-flex items-center gap-1.5 truncate">
                                    <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{analyst.name}</span>
                                </span>
                            )}
                            {demand.expected_delivery_date && (
                                <span className={cn(
                                    "inline-flex items-center gap-1.5",
                                    isOverdue && "text-red-600 font-medium"
                                )}>
                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                    {format(parseISO(demand.expected_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                            )}
                        </div>

                        {/* Coluna 3: observações + ações */}
                        <div className="flex items-start justify-between gap-2">
                            {demand.observation ? (
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
                                    {demand.observation}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-300 italic flex-1">Sem observações</p>
                            )}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onDuplicate && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate(demand); }}
                                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
                                        title="Duplicar demanda"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(demand.id); }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Excluir demanda"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </Link>
        );
    }

    // ── MODO GRID (original) ─────────────────────────────────────────────
    return (
        <Link to={createPageUrl(`demand-detail?id=${demand.id}`)} className="block h-full">
            <div className={cn(
                "bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col h-full",
                isOverdue ? "border-red-300 bg-red-50/30" :
                    isDelivered ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:shadow-emerald-100" :
                        "border-slate-200 hover:border-indigo-200"
            )}>
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-mono font-bold text-slate-600">
                                #{demand.demand_number || demand.id?.slice(-6)}
                            </span>
                            {isOverdue && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                                    <AlertTriangle className="w-3 h-3" />
                                    ATRASADA
                                </span>
                            )}
                            <StatusBadge status={demand.status} size="sm" />
                        </div>
                        <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {demand.product}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {onDuplicate && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDuplicate(demand);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="Duplicar demanda"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(demand.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="Excluir demanda"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded">
                        {demand.artifact}
                    </span>
                    <PriorityBadge weight={demand.weight} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-auto">
                    {client && (
                        <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {client.name}
                        </span>
                    )}
                    {analyst && (
                        <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {analyst.name}
                        </span>
                    )}
                    {demand.expected_delivery_date && (
                        <span className={cn(
                            "inline-flex items-center gap-1",
                            isOverdue && "text-red-600 font-medium"
                        )}>
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseISO(demand.expected_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
