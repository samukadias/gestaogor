import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardFilters({
    filters,
    onFilterChange,
    clients,
    pds,
    esps,
    months,
    analysts
}) {
    const handleClearFilters = () => {
        onFilterChange({
            client: 'all',
            pd: 'all',
            esp: 'all',
            month: 'all'
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== 'all');

    return (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-700">Filtros</span>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="ml-auto text-slate-500 hover:text-slate-700"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Limpar
                        </Button>
                    )}
                </div>
                <div className={`grid grid-cols-1 md:grid-cols-${analysts && analysts.length > 0 ? '6' : '5'} gap-4`}>
                    <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Cliente</Label>
                        <Select
                            value={filters.client}
                            onValueChange={(value) => onFilterChange({ ...filters, client: value })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {clients.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500 mb-1 block">PD</Label>
                        <Select
                            value={filters.pd}
                            onValueChange={(value) => onFilterChange({ ...filters, pd: value })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {pds.map(pd => (
                                    <SelectItem key={pd} value={pd}>{pd}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500 mb-1 block">ESP</Label>
                        <Select
                            value={filters.esp}
                            onValueChange={(value) => onFilterChange({ ...filters, esp: value })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {esps.map(esp => (
                                    <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Ano</Label>
                        <Select
                            value={filters.year}
                            onValueChange={(value) => onFilterChange({ ...filters, year: value })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {Array.from(new Set(months.map(m => m.value.split('-')[0]))).sort((a, b) => b.localeCompare(a)).map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Mês</Label>
                        <Select
                            value={filters.month}
                            onValueChange={(value) => onFilterChange({ ...filters, month: value })}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {/* Exibe apenas o número ou nome do mês curto, ou continua mantendo a label dependendo se tem ano selecionado, mas aqui pegamos um de cada */}
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                                    const monthStr = String(num).padStart(2, '0');
                                    const monthLabel = new Date(2000, num - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
                                    // Pega a primeira letra maiúscula do mês
                                    const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
                                    return (
                                        <SelectItem key={monthStr} value={monthStr}>
                                            {capitalizedLabel}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    {analysts && analysts.length > 0 && (
                        <div>
                            <Label className="text-xs text-slate-500 mb-1 block">Analista</Label>
                            <Select
                                value={filters.analyst}
                                onValueChange={(value) => onFilterChange({ ...filters, analyst: value })}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {analysts.map(a => (
                                        <SelectItem key={a} value={a}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
