import React, { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * GlobalFilterBar — barra de filtros global da Visão Executiva.
 * Recebe a aba ativa para esconder filtros específicos de cada área.
 */
export default function GlobalFilterBar({ filters, onFilterChange, onReset, cycles, defaultMonthStr, activeTab }) {
    const isFiltered = filters.month !== defaultMonthStr || (filters.cycle_ids && filters.cycle_ids.length > 0) || filters.artifact !== '';
    const [openCycleSelect, setOpenCycleSelect] = useState(false);

    const handleChange = (key, value) => {
        onFilterChange(key, value);
    };

    const toggleCycle = (cycleId) => {
        const currentIds = filters.cycle_ids || [];
        const newIds = currentIds.includes(cycleId)
            ? currentIds.filter(id => id !== cycleId)
            : [...currentIds, cycleId];

        onFilterChange('cycle_ids', newIds);
    };

    // Helper text for selecting cycles
    const selectedCyclesText = filters.cycle_ids?.length > 0
        ? `${filters.cycle_ids.length} selecionado(s)`
        : "Todos os Ciclos";

    return (
        <div className="flex flex-wrap items-end justify-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 w-fit mx-auto">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Mês</label>
                <select
                    className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                    value={filters.month}
                    onChange={(e) => handleChange('month', e.target.value)}
                >
                    <option value="">Todos os Meses</option>
                    <option value="01">Janeiro</option>
                    <option value="02">Fevereiro</option>
                    <option value="03">Março</option>
                    <option value="04">Abril</option>
                    <option value="05">Maio</option>
                    <option value="06">Junho</option>
                    <option value="07">Julho</option>
                    <option value="08">Agosto</option>
                    <option value="09">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Ano</label>
                <select
                    className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 outline-none cursor-pointer w-24 hover:bg-slate-100 transition-colors"
                    value={filters.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                >
                    {[0, 1, 2, 3, 4].map(offset => {
                        const year = new Date().getFullYear() - offset;
                        return <option key={year} value={year}>{year}</option>;
                    })}
                </select>
            </div>

            {activeTab === 'cdpc' && (
                <>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Ciclo de Vendas</label>
                        <Popover open={openCycleSelect} onOpenChange={setOpenCycleSelect}>
                            <PopoverTrigger asChild>
                                <button
                                    role="combobox"
                                    aria-expanded={openCycleSelect}
                                    className="flex items-center justify-between w-40 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    <span className="truncate mr-2">{selectedCyclesText}</span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="max-h-[300px] overflow-y-auto p-1">
                                    <div
                                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900"
                                        onClick={() => onFilterChange('cycle_ids', [])}
                                    >
                                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            (!filters.cycle_ids || filters.cycle_ids.length === 0) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                        )}>
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span>Todos os Ciclos</span>
                                    </div>
                                    <div className="h-px bg-slate-200 my-1 mx-2" />
                                    {cycles.map(c => {
                                        const isSelected = filters.cycle_ids?.includes(c.id.toString());
                                        return (
                                            <div
                                                key={c.id}
                                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900"
                                                onClick={() => toggleCycle(c.id.toString())}
                                            >
                                                <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                )}>
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                <span className="truncate">{c.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Artefato</label>
                        <select
                            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 outline-none cursor-pointer w-32 hover:bg-slate-100 transition-colors"
                            value={filters.artifact}
                            onChange={(e) => handleChange('artifact', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="Orçamento">Orçamento</option>
                            <option value="Proposta">Proposta</option>
                        </select>
                    </div>
                </>
            )}

            {isFiltered && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 self-end text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                    title="Redefinir todos os filtros"
                >
                    <span>✕</span> Limpar
                </button>
            )}
        </div>
    );
}
