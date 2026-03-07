import React from 'react';
import {
    Cuboid,
    ArrowDownToLine,
    CheckSquare,
    Flame,
    TrendingDown,
    CheckCircle2,
} from 'lucide-react';

/**
 * CdpcTab — conteúdo completo da aba CDPC na Visão Executiva.
 * Recebe métricas, filtros e ciclos como props.
 */
export default function CdpcTab({
    metrics,
    filters,
    loading,
    formatCurrency,
}) {
    return (
        <main className="max-w-7xl mx-auto space-y-6">
            {/* Header da seção + Filtros */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Volume &amp; Capacidade</h2>
                    <p className="text-sm text-slate-500">Métricas de fluxo e entrega de propostas</p>
                </div>
            </div>

            {/* Cards Superiores - Primeira Linha */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform"><Cuboid className="w-20 h-20" /></div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Backlog Total</p>
                    <p className="text-3xl font-bold text-slate-800">{loading ? '...' : metrics.backlog}</p>
                    <p className="text-[10px] text-blue-600 mt-2 font-bold bg-blue-50 w-fit px-2 py-1 rounded">demandas ativas</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1 col-span-1 border-l-4 border-l-amber-400">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-600 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-20 h-20" /></div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Em Tratativa</p>
                    <p className="text-3xl font-bold text-slate-800">{loading ? '...' : metrics.emTratativa}</p>
                    <p className="text-[10px] text-amber-600 mt-2 font-bold bg-amber-50 w-fit px-2 py-1 rounded">ativas, além da triagem</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 group-hover:scale-110 transition-transform"><ArrowDownToLine className="w-20 h-20" /></div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Entradas Mês</p>
                    <p className="text-3xl font-bold text-slate-800">{loading ? '...' : metrics.entriesThisMonth}</p>
                    <p className="text-[10px] text-indigo-600 mt-2 font-bold bg-indigo-50 w-fit px-2 py-1 rounded">{metrics.entriesThisYear} no ano</p>
                </div>

                <div className="rounded-2xl shadow-sm border p-4 relative overflow-hidden bg-gradient-to-br from-white to-emerald-50 border-emerald-100 group hover:shadow-md transition-all hover:-translate-y-1 col-span-1 md:col-span-2">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform"><CheckSquare className="w-20 h-20" /></div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Entregas do Período</p>
                    <div className="flex items-end gap-4 mt-1">
                        <p className="text-4xl font-black text-emerald-600">{loading ? '...' : metrics.deliveredThisMonth}</p>
                        <div className="pb-1">
                            <p className="text-sm font-bold text-slate-700">{formatCurrency(metrics.valueThisMonth)}</p>
                            <p className="text-xs text-slate-500">SLA Médio: {loading ? '...' : Number(metrics.slaThisMonth).toFixed(1)} dias</p>
                        </div>
                    </div>
                    {!loading && metrics.entriesThisMonth > 0 && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3">
                            <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, Math.round((metrics.deliveredThisMonth / metrics.entriesThisMonth) * 100))}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Linha do Meio (Priorização e Top Clientes Priorizados) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl shadow-sm border p-5 bg-gradient-to-br from-white to-rose-50 border-rose-100 flex flex-col justify-center text-center">
                    <p className="text-sm font-medium text-slate-500 mb-1">Priorizados no Mês (P0/P1)</p>
                    <p className="text-4xl font-black text-rose-600">{loading ? '...' : metrics.highPriorityThisMonth}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">demandas ativas e/ou criadas no período</p>
                </div>

                <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden flex flex-col h-48">
                    <div className="p-3 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
                        <h3 className="font-semibold text-rose-800 text-sm flex items-center gap-2">
                            <Flame className="w-4 h-4" /> Top Clientes Priorizados
                        </h3>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <p className="text-sm text-slate-400">Carregando...</p>
                        ) : metrics.topPrioritizedClientsThisMonth.length === 0 ? (
                            <p className="text-sm text-slate-400">Sem demandas priorizadas no momento.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {metrics.topPrioritizedClientsThisMonth.map((c) => (
                                    <div key={c.name} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                        <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate" title={c.name}>{c.name}</span>
                                        <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 text-[10px] font-black flex items-center justify-center">{c.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Acumulado Ano e Top Clientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Acumulado */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider mb-6">Acumulado {filters.year}</h3>
                    <div className="flex items-center justify-around mb-6">
                        <div className="text-center">
                            <p className="text-5xl font-black text-slate-800 mb-2">{loading ? '...' : metrics.deliveredThisYear}</p>
                            <p className="text-sm font-medium text-slate-500">Demandas Entregues</p>
                        </div>
                        <div className="h-16 w-px bg-slate-200" />
                        <div className="text-center">
                            {loading ? (
                                <p className="text-4xl font-black text-slate-400 mb-2">...</p>
                            ) : metrics.valueThisYear > 0 ? (
                                <p className="text-4xl font-black text-emerald-600 mb-2">{formatCurrency(metrics.valueThisYear)}</p>
                            ) : (
                                <p className="text-xl font-semibold text-slate-400 mb-2">Sem valor registrado</p>
                            )}
                            <p className="text-sm font-medium text-slate-500 mb-1">Valor Global Gerado</p>
                            {!loading && metrics.valueThisYear > 0 && (
                                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                    em {metrics.valuedDemandsCount} demanda{metrics.valuedDemandsCount !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Cancelamentos */}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-200 text-slate-500 p-2 rounded-lg">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cancelamentos</p>
                                <p className="text-sm font-medium text-slate-700">Mês selecionado: <span className="font-bold text-slate-900">{loading ? '...' : metrics.cancelledThisMonth}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Cancelado ({filters.year})</p>
                            <p className="text-xl font-black text-slate-700">{loading ? '...' : metrics.cancelledThisYear}</p>
                        </div>
                    </div>
                </div>

                {/* Top Clientes */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700 text-sm">Top Clientes (Backlog Ativo)</h3>
                    </div>
                    <div className="p-4 flex-1">
                        {loading ? (
                            <p className="text-sm text-slate-400">Carregando...</p>
                        ) : metrics.topClients.length === 0 ? (
                            <p className="text-sm text-slate-400">Nenhuma demanda ativa.</p>
                        ) : (
                            <ul className="space-y-4">
                                {metrics.topClients.map((c, i) => (
                                    <li key={c.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                                            <p className="text-sm font-medium text-slate-800">{c.name}</p>
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">{c.count} demanda{c.count !== 1 ? 's' : ''}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Demandas Reabertas */}
            {!loading && metrics.currentlyReopened?.length > 0 && (
                <div>
                    <div className="mb-3 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <h2 className="text-lg font-bold text-slate-800">Demandas Reabertas</h2>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                            {metrics.currentlyReopened.length} em aberto
                        </span>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {metrics.currentlyReopened.map((d) => {
                                const daysOpen = d.delivery_date
                                    ? Math.ceil((Date.now() - new Date(d.delivery_date).getTime()) / 86400000)
                                    : null;
                                return (
                                    <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/40 transition-colors">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{d.product}</p>
                                            {d.client_name && <p className="text-xs text-slate-400">{d.client_name}</p>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {daysOpen !== null && (
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${daysOpen > 5 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {daysOpen}d aberta
                                                </span>
                                            )}
                                            <a href={`/?page=DemandDetail&id=${d.id}`} className="text-xs text-indigo-600 hover:underline font-medium">
                                                Ver →
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
