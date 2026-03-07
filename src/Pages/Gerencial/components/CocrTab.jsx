import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';

/**
 * CocrTab — conteúdo completo da aba COCR na Visão Executiva.
 */
export default function CocrTab({ metrics, loading, formatCurrency }) {
    return (
        <main className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="mb-2">
                <h2 className="text-lg font-bold text-slate-800">Visão Executiva (Em Tempo Real)</h2>
                <p className="text-sm text-slate-500">Dados baseados no portfólio de Contratos Ativos atualizados.</p>
            </div>

            {/* Cards Topo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total de Contratos (Ativos)</p>
                    <p className="text-3xl font-bold text-slate-800">{loading ? '...' : metrics.totalContracts}</p>
                </div>
                <div className="rounded-2xl shadow-sm border p-5 bg-gradient-to-br from-white to-blue-50 border-blue-100">
                    <p className="text-sm font-medium text-slate-500 mb-1">Valor Global (Ativos)</p>
                    <p className="text-2xl font-bold text-blue-700">{loading ? '...' : formatCurrency(metrics.globalValue)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <p className="text-sm font-medium text-slate-500 mb-1">Aguardando Assinatura</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-amber-500">{loading ? '...' : metrics.aguardandoAssinaturaCount}</p>
                        <p className="text-xs text-slate-400">contratos (Etapa 9)</p>
                    </div>
                </div>
                <div className="rounded-2xl shadow-sm border p-5 bg-amber-50 border-amber-100">
                    <p className="text-sm font-medium text-amber-700 mb-1">Valor Travado (Assinatura)</p>
                    <p className="text-2xl font-bold text-amber-600">{loading ? '...' : formatCurrency(metrics.aguardandoAssinaturaValue)}</p>
                </div>
            </div>

            {/* Painel Inferior: Vencimentos + Aditamentos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de vencimentos */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden flex flex-col h-[400px]">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-rose-500 mr-2" />
                            <h3 className="font-semibold text-slate-700 text-sm">Risco de Renovação / Vencimentos</h3>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Vencendo nos Próximos 90 Dias</p>
                                {loading ? (
                                    <p className="text-sm text-slate-500">Carregando vencimentos...</p>
                                ) : metrics.expiringContracts.length === 0 ? (
                                    <p className="text-sm text-slate-500">Sem contratos vencendo neste período! Tudo tranquilo.</p>
                                ) : (
                                    <ul className="text-sm text-slate-700 space-y-4 pt-1">
                                        {metrics.expiringContracts.map((exp, idx) => (
                                            <li key={idx} className="flex flex-col border-b border-slate-50 pb-3 gap-1">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-semibold text-slate-800 leading-tight pr-3 line-clamp-2" title={exp.name}>{exp.name}</span>
                                                    <span className={`text-[10px] shrink-0 px-2.5 py-1 rounded font-bold uppercase tracking-wider ${exp.statusStyle}`}>
                                                        {exp.statusLabel}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-slate-500">{exp.term || 'Contrato Base'}</span>
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {exp.daysLeft < 0 ? `${Math.abs(exp.daysLeft)}d atrasado` : `${exp.daysLeft}d restantes`}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aditamentos e Qualidade do Preço */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl shadow-sm border p-5 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
                        <div>
                            <p className="text-sm font-semibold uppercase text-indigo-800 tracking-wider mb-1">Volume de Aditamentos (Ativos)</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-indigo-600">{loading ? '...' : metrics.aditamentosMonthCount}</p>
                                <p className="text-sm font-medium text-indigo-400">contratos aditados</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Valor Adicionado</p>
                            <p className="text-2xl font-bold text-slate-800">{loading ? '...' : `+ ${formatCurrency(metrics.aditamentosMonthValue)}`}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50">
                            <h3 className="font-semibold text-slate-700 text-sm">Qualidade do Preço / Impacto Financeiro</h3>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="p-6 border-r border-slate-100 text-center flex flex-col items-center justify-center">
                                <div className="w-10 h-10 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-3">
                                    <TrendingDown className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tabela Defasada</p>
                                <p className="text-2xl font-bold text-slate-300 mb-1">0 contratos</p>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">- (Em Análise de Implementação)</p>
                            </div>
                            <div className="p-6 text-center flex flex-col items-center justify-center">
                                <div className="w-10 h-10 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <TrendingDown className="w-5 h-5 text-slate-500" />
                                </div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descontos Concedidos</p>
                                <p className="text-2xl font-bold text-slate-300 mb-2">0 contratos</p>
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">- (Em Análise de Implementação)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
