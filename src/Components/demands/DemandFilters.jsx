import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X, ArrowUpDown } from "lucide-react";


const STATUS_LIST = [
    "PENDENTE TRIAGEM",
    "TRIAGEM NÃO ELEGÍVEL",
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
    "CONGELADA",
    "ENTREGUE",
    "CANCELADA"
];

export default function DemandFilters({
    filters,
    setFilters,
    analysts = [],
    clients = [],
    cycles = []
}) {
    const clearFilters = () => {
        setFilters({
            search: '',
            status: 'active',
            analyst_id: 'all',
            client_id: 'all',
            cycle_id: 'all',
            weight: 'all',
            sortBy: 'date_desc'
        });
    };

    const hasActiveFilters = filters.search ||
        filters.status !== 'all' ||
        filters.analyst_id !== 'all' ||
        filters.client_id !== 'all' ||
        filters.cycle_id !== 'all' ||
        filters.weight !== 'all' ||
        (filters.sortBy && filters.sortBy !== 'date_desc');


    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Filtros</h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-slate-500 hover:text-slate-700 h-8"
                    >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Limpar
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
                <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Busca</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nº ou produto..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="pl-9 h-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</Label>
                    <Select
                        value={filters.status}
                        onValueChange={(v) => setFilters({ ...filters, status: v })}
                    >
                        <SelectTrigger className="h-10 border-slate-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">EM ABERTO</SelectItem>
                            <SelectItem value="all">TODOS OS STATUS</SelectItem>
                            {STATUS_LIST.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responsável</Label>
                    <Select
                        value={filters.analyst_id}
                        onValueChange={(v) => setFilters({ ...filters, analyst_id: v })}
                    >
                        <SelectTrigger className="h-10 border-slate-200">
                            <SelectValue placeholder="Responsável" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Responsáveis</SelectItem>
                            {[...analysts].sort((a, b) => a.name.localeCompare(b.name)).map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</Label>
                    <Select
                        value={filters.client_id}
                        onValueChange={(v) => setFilters({ ...filters, client_id: v })}
                    >
                        <SelectTrigger className="h-10 border-slate-200">
                            <SelectValue placeholder="Cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Clientes</SelectItem>
                            {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ciclo</Label>
                    <Select
                        value={filters.cycle_id}
                        onValueChange={(v) => setFilters({ ...filters, cycle_id: v })}
                    >
                        <SelectTrigger className="h-10 border-slate-200">
                            <SelectValue placeholder="Ciclo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Ciclos</SelectItem>
                            {[...cycles].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridade</Label>
                    <Select
                        value={filters.weight}
                        onValueChange={(v) => setFilters({ ...filters, weight: v })}
                    >
                        <SelectTrigger className="h-10 border-slate-200">
                            <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="0">P0 - Estratégico</SelectItem>
                            <SelectItem value="1">P1 - Muito Alto</SelectItem>
                            <SelectItem value="2">P2 - Alto</SelectItem>
                            <SelectItem value="3">P3 - Padrão</SelectItem>
                            <SelectItem value="4">P4 - Baixo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3" />
                        Ordenar
                    </Label>
                    <Select
                        value={filters.sortBy || 'date_desc'}
                        onValueChange={(v) => setFilters({ ...filters, sortBy: v })}
                    >
                        <SelectTrigger className="h-10 border-slate-200">
                            <SelectValue placeholder="Ordenar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date_desc">↓ Mais recentes</SelectItem>
                            <SelectItem value="date_asc">↑ Mais antigas</SelectItem>
                            <SelectItem value="alpha_asc">A → Z (produto)</SelectItem>
                            <SelectItem value="alpha_desc">Z → A (produto)</SelectItem>
                            <SelectItem value="priority">Prioridade (maior → menor)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

        </div>
    );
}
