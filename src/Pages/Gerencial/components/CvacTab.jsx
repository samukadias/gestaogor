import React, { useMemo } from 'react';
import { Landmark, Calendar, CheckCircle2, Clock, AlertCircle, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fluxoApi } from '@/api/fluxoClient';

export default function CvacTab({ filters }) {
    const { data: attestations = [], isLoading: isLoadingAtt } = useQuery({
        queryKey: ['cvac-all-attestations'],
        queryFn: () => fluxoApi.entities.MonthlyAttestation.list()
    });

    const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
        queryKey: ['cvac-all-contracts'],
        queryFn: () => fluxoApi.entities.Contract.list()
    });

    // Current period is based on filters, not the system date
    const currentYearStr = filters?.year || String(new Date().getFullYear());
    // Get month number avoiding 0-index date issues
    const currentMonthNum = parseInt(filters?.month || (new Date().getMonth() + 1), 10);
    const currentMonthRef = `${currentYearStr}-${String(currentMonthNum).padStart(2, '0')}`;

    const metrics = useMemo(() => {
        // Create a Date object for the filtered month to get its name
        const filteredDate = new Date(parseInt(currentYearStr), currentMonthNum - 1, 1); // Month is 0-indexed for Date constructor

        const dateFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
        const monthName = dateFormatter.format(filteredDate);
        const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        // 1. Meta / Acumulado Anual baseada nos contratos globais estimados
        let anualGoal = contracts.reduce((sum, c) => {
            if (c.status === 'ATIVO' || c.status === 'VIGENTE') {
                return sum + parseFloat(c.valor_global_estimado || 0);
            }
            return sum;
        }, 0);

        // Se a meta estiver zerada, pegar de todos os contratos sem filtrar status só pra ter métrica
        if (anualGoal === 0 && contracts.length > 0) {
            anualGoal = contracts.reduce((sum, c) => sum + parseFloat(c.valor_global_estimado || 0), 0);
        }

        // 2. Mês Atual
        const currentMonthAttestations = attestations.filter(a => a.reference_month === currentMonthRef);
        const currentMonthMeasurement = currentMonthAttestations.reduce((sum, a) => sum + (parseFloat(a.measurement_value) || 0), 0);
        const currentMonthBilled = currentMonthAttestations.reduce((sum, a) => sum + (parseFloat(a.billed_amount) || 0), 0);
        const currentMonthProgress = currentMonthMeasurement > 0 ? (currentMonthBilled / currentMonthMeasurement) * 100 : 0;

        // 3. Acumulado do Ano
        const yearAttestations = attestations.filter(a => a.reference_month?.startsWith(currentYearStr));
        const yearBilled = yearAttestations.reduce((sum, a) => sum + (parseFloat(a.billed_amount) || 0), 0);
        const yearPaid = yearAttestations.reduce((sum, a) => sum + (parseFloat(a.paid_amount) || 0), 0);

        const yearProgressToGoal = anualGoal > 0 ? (yearBilled / anualGoal) * 100 : 0;
        const aReceber = Math.max(0, yearBilled - yearPaid);

        // 4. Principais Pendências (GAP = Apontado - Faturado)
        const pendencies = attestations
            .filter(a => {
                // Considerar apenas pendências do ano corrente
                return a.reference_month?.startsWith(currentYearStr);
            })
            .map(a => {
                const meas = parseFloat(a.measurement_value) || 0;
                const bill = parseFloat(a.billed_amount) || 0;
                return { ...a, gap: meas - bill };
            })
            .filter(a => a.gap > 0) // Só atestações que possuem GAP
            .sort((a, b) => b.gap - a.gap) // Maiores GAPs primeiro
            .slice(0, 3); // Top 3

        return {
            monthNameCapitalized,
            currentYearStr,
            currentMonthRef,
            anualGoal,
            currentMonthMeasurement,
            currentMonthBilled,
            currentMonthProgress,
            yearBilled,
            yearPaid,
            aReceber,
            yearProgressToGoal,
            pendencies
        };
    }, [attestations, contracts]);

    const formatShortCurrency = (val) => {
        if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
    };

    const formatCurrencyFull = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    if (isLoadingAtt || isLoadingContracts) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Carregando dados financeiros...
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="mb-2">
                <h2 className="text-lg font-bold text-slate-800">Previsão, Execução e Caixa</h2>
                <p className="text-sm text-slate-500">Visão financeira consolidada e comparativos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card Mês Atual */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider mb-5 flex justify-between items-center">
                        <span>{metrics.monthNameCapitalized} {metrics.currentYearStr} (Mês Atual)</span>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded uppercase tracking-wider border border-blue-100">Atualizado</span>
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 mb-1 font-medium">Total Apontado</p>
                            <p className="text-4xl font-extrabold text-slate-800 tracking-tight" title={formatCurrencyFull(metrics.currentMonthMeasurement)}>
                                {formatShortCurrency(metrics.currentMonthMeasurement)}
                            </p>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-slate-500 mb-1 font-medium">Faturamento</p>
                            <p className="text-2xl font-bold text-slate-700">
                                {formatShortCurrency(metrics.currentMonthBilled)}
                            </p>
                            <p className="text-xs text-slate-400 mt-2 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                                GAP (Apontado vs. Faturado)
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-slate-600">Progresso de Faturamento</span>
                            <span className="font-bold text-blue-600">{metrics.currentMonthProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, metrics.currentMonthProgress)}%` }} />
                        </div>
                    </div>
                </div>

                {/* Card Acumulado Ano */}
                <div className="rounded-2xl shadow-lg border-0 p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-700/50 rounded-full blur-3xl mix-blend-screen" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-6 text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Acumulado do Ano ({metrics.currentYearStr})
                    </h3>
                    <div className="flex mb-8 text-center divide-x divide-slate-700/50 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex-1 px-4">
                            <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Estimativa Global</p>
                            <p className="text-3xl font-black text-white" title={formatCurrencyFull(metrics.anualGoal)}>
                                {formatShortCurrency(metrics.anualGoal)}
                            </p>
                        </div>
                        <div className="flex-1 px-4">
                            <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Total Faturado</p>
                            <p className="text-3xl font-black text-emerald-400" title={formatCurrencyFull(metrics.yearBilled)}>
                                {formatShortCurrency(metrics.yearBilled)}
                            </p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <div className="flex justify-between text-sm mb-2 text-slate-300">
                            <span className="font-medium">Consumo dos Contratos Globais</span>
                            <span className="font-bold text-white bg-slate-700 px-2 py-0.5 rounded text-xs">{metrics.yearProgressToGoal.toFixed(1)}% alcançado</span>
                        </div>
                        <div className="w-full bg-slate-700/50 h-3 rounded-full overflow-hidden border border-slate-600/50">
                            <div className="bg-emerald-400 h-3 rounded-full relative transition-all duration-1000" style={{ width: `${Math.min(100, metrics.yearProgressToGoal)}%` }}>
                                <div className="absolute inset-0 bg-white/20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fluxo de Caixa + Pendências */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider mb-6 flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Fluxo de Caixa Recente (Ano Corrente)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-default">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Faturado</p>
                            <p className="text-2xl font-black text-slate-800" title={formatCurrencyFull(metrics.yearBilled)}>{formatShortCurrency(metrics.yearBilled)}</p>
                        </div>
                        <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors cursor-default">
                            <div className="text-emerald-500 mb-2 flex justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">Total Pago</p>
                            <p className="text-2xl font-black text-emerald-600" title={formatCurrencyFull(metrics.yearPaid)}>{formatShortCurrency(metrics.yearPaid)}</p>
                        </div>
                        <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100 hover:bg-amber-50 transition-colors cursor-default">
                            <div className="text-amber-500 mb-2 flex justify-center"><Clock className="w-6 h-6" /></div>
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">A Receber</p>
                            <p className="text-2xl font-black text-amber-600" title={formatCurrencyFull(metrics.aReceber)}>{formatShortCurrency(metrics.aReceber)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-rose-600 mr-2" />
                            <h3 className="font-semibold text-rose-700 text-sm">Maiores GAPs Identificados</h3>
                        </div>
                    </div>
                    <div className="p-5 flex-1 bg-slate-50/50">
                        {metrics.pendencies.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 py-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                                <p className="text-sm font-medium text-slate-600">Nenhum GAP expressivo</p>
                                <p className="text-xs text-slate-400 mt-1">Todos os apontamentos correspondem às faturas.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {metrics.pendencies.map(pend => (
                                    <li key={pend.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-rose-200 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-slate-800 text-sm truncate max-w-[150px]" title={pend.client_name}>{pend.client_name || pend.pd_number}</span>
                                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded uppercase tracking-wider">{pend.reference_month}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-slate-500 font-medium">GAP de NF-e</span>
                                            <span className="font-bold text-rose-600">{formatCurrencyFull(pend.gap)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
