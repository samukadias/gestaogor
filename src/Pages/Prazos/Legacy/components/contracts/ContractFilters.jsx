import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

export default function ContractFilters({ filters, onFiltersChange, contracts }) {
  const updateFilter = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // State local para o input de busca (debounce)
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Propaga para o filtro real apenas 300ms após parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter("search", searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sincroniza se o filtro for limpo externamente
  useEffect(() => {
    if (filters.search === "" && searchInput !== "") {
      setSearchInput("");
    }
  }, [filters.search]);


  // Extrair listas únicas de clientes e analistas
  const uniqueClients = useMemo(() => {
    if (!contracts) return [];
    const clients = new Set(contracts.map(c => c.cliente).filter(Boolean));
    return Array.from(clients).sort();
  }, [contracts]);

  const uniqueAnalysts = useMemo(() => {
    if (!contracts) return [];
    const analysts = new Set(contracts.map(c => c.analista_responsavel).filter(Boolean));
    return Array.from(analysts).sort();
  }, [contracts]);

  const hasActiveFilters =
    (filters.cliente && filters.cliente !== "all") ||
    (filters.analista && filters.analista !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.vencimento && filters.vencimento !== "all") ||
    (filters.search && filters.search !== "");

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      analista: "all",
      cliente: "all",
      vencimento: "all"
    });
    setSearchInput("");
  };

  return (
    <Card>
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={filters.cliente || "all"} onValueChange={(value) => updateFilter("cliente", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Analista Responsável</Label>
            <Select value={filters.analista || "all"} onValueChange={(value) => updateFilter("analista", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o analista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueAnalysts.map(analyst => (
                  <SelectItem key={analyst} value={analyst}>{analyst}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status do Contrato</Label>
            <Select value={filters.status || "all"} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Renovado">Renovado</SelectItem>
                <SelectItem value="Encerrado">Encerrado</SelectItem>
                <SelectItem value="Expirado">Expirado</SelectItem>
                <SelectItem value="Em Negociação">Em Negociação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status do Vencimento</Label>
            <Select value={filters.vencimento || "all"} onValueChange={(value) => updateFilter("vencimento", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o vencimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Atenção">Atenção</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
                <SelectItem value="Vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Busca Geral</Label>
            <Input
              placeholder="Buscar contrato..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}