import React, { useState } from "react";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { addMonths, isBefore, startOfDay } from "date-fns";
import { useContracts } from "@/hooks/useContracts";
import ContractTable from "../components/contracts/ContractTable";
import ContractFilters from "../components/contracts/ContractFilters";
import ImportExportDialog from "../components/contracts/ImportExportDialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Users, LayoutGrid } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils/legacy";
import { useQueryClient } from "@tanstack/react-query";
import { contractKeys } from "@/hooks/useContracts";

import { useAuth } from "@/context/AuthContext";

export default function Contracts() {
  const { data: contracts = [], isLoading } = useContracts();
  // Obter usuário do localStorage para consistência com o resto do app
  const user = JSON.parse(localStorage.getItem('fluxo_user') || localStorage.getItem('user') || '{}');
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = usePersistedFilters("cocr_filters", {
    search: "",
    status: "all",
    analista: "all",
    cliente: "all",
    vencimento: "all"
  }, {
    // URL params têm prioridade máxima: ao navegar do Dashboard com ?vencimento=expiring,
    // o filtro é aplicado mesmo que o sessionStorage tenha um valor diferente salvo.
    status: searchParams.get("status") || undefined,
    vencimento: searchParams.get("vencimento") || undefined,
  });

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [clientView, setClientView] = useState('grupo'); // 'cliente' | 'grupo'

  // Calcula o status de vencimento dinamicamente a partir da data_fim_efetividade
  // pois o campo status_vencimento no banco está vazio na maioria dos registros
  const calcStatusVencimento = (contract) => {
    if (!contract.data_fim_efetividade) return 'Normal';
    // Contratos não-Ativos e não-Expirados não têm status de vencimento relevante
    if (contract.status && contract.status !== 'Ativo' && contract.status !== 'Expirado' && contract.status !== 'Vencido') return null;

    const today = startOfDay(new Date());
    const endDate = startOfDay(new Date(contract.data_fim_efetividade));

    if (isBefore(endDate, today)) return 'Vencido';

    const days60 = addMonths(today, 2);  // ~60 dias => Urgente
    const days120 = addMonths(today, 4); // ~120 dias => Atenção

    if (isBefore(endDate, days60)) return 'Urgente';
    if (isBefore(endDate, days120)) return 'Atenção';
    return 'Normal';
  };

  // Filter logic
  const filteredContracts = contracts.filter((contract) => {
    // 1. Filtro de permissão: Quem pode ver o quê?
    const role = user?.role;
    const department = user?.department;
    const userName = (user?.full_name || user?.name || "").trim().toLowerCase();
    const userEmail = (user?.email || "").trim().toLowerCase();

    // Gestores (GOR ou COCR) veem TUDO
    const isManager = department === 'GOR' || (department === 'COCR' && role === 'manager') || user?.perfil === 'GESTOR';

    // Analista (COCR) vê apenas os SEUS contratos
    const isAnalyst = !isManager && (role === 'analyst' || user?.perfil === 'ANALISTA');

    // Cliente vê apenas os SEUS contratos (baseado no nome do Cliente)
    const isClient = !isManager && (role === 'client' || user?.perfil === 'CLIENTE');

    if (isAnalyst) {
      const cAnalyst = (contract.analista_responsavel || "").trim().toLowerCase();
      // Verifica se o analista responsável bate com o nome ou email do usuário logado
      if (cAnalyst !== userName && cAnalyst !== userEmail) {
        return false;
      }
    }

    if (isClient) {
      const cClient = (contract.cliente || "").trim().toLowerCase();
      // Verifica se o cliente do contrato bate com o nome do usuário logado
      if (cClient !== userName) {
        return false;
      }
    }

    // Se não for nem manager, nem analyst, nem client validado acima, bloqueia (failsafe)
    // Mas permitiremos 'admin' ver tudo também
    if (!isManager && !isAnalyst && !isClient && role !== 'admin') {
      // Se não cair em nenhuma regra permissiva, pode ser um user de outro depto tentando ver contracts
      return false;
    }

    const matchesSearch = filters.search === "" || (() => {
      const searchLower = filters.search.toLowerCase();
      return (
        contract.contrato?.toLowerCase().includes(searchLower) ||
        contract.contrato_anterior?.toLowerCase().includes(searchLower) ||
        contract.cliente?.toLowerCase().includes(searchLower) ||
        contract.grupo_cliente?.toLowerCase().includes(searchLower) ||
        contract.analista_responsavel?.toLowerCase().includes(searchLower) ||
        contract.esp?.toLowerCase().includes(searchLower) ||         // secao_responsavel mapeado como "esp"
        contract.objeto_contrato?.toLowerCase().includes(searchLower) // "objeto" no banco mapeado como "objeto_contrato"
      );
    })();

    // Filtro de status: comparação case-insensitive para robustez
    const matchesStatus = filters.status === "all" ||
      (contract.status || "").toLowerCase() === filters.status.toLowerCase();

    const matchesAnalista = filters.analista === "all" || contract.analista_responsavel === filters.analista;
    const matchesCliente = filters.cliente === "all" || contract.cliente === filters.cliente;

    const matchesVencimento = filters.vencimento === "all" || (() => {
      // "expiring" é o filtro legado do dashboard (vencendo em 2 meses), mantido por compatibilidade
      if (filters.vencimento === "expiring") {
        if (!contract.data_fim_efetividade || contract.status !== "Ativo") return false;
        const today = startOfDay(new Date());
        const endDate = startOfDay(new Date(contract.data_fim_efetividade));
        const twoMonthsFromNow = addMonths(today, 2);
        return isBefore(endDate, twoMonthsFromNow) && endDate >= today;
      }
      // Para Normal/Atenção/Urgente/Vencido: calcula dinamicamente pois
      // o campo status_vencimento do banco está vazio na maioria dos registros
      const statusCalc = calcStatusVencimento(contract);
      return statusCalc === filters.vencimento;
    })();

    return matchesSearch && matchesStatus && matchesAnalista && matchesCliente && matchesVencimento;
  });

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
    setIsImportDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os contratos do sistema</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Toggle: visualizar por cliente ou grupo */}
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setClientView('cliente')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${clientView === 'cliente'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              Cliente
            </button>
            <button
              onClick={() => setClientView('grupo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors border-l border-gray-200 ${clientView === 'grupo'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grupo
            </button>
          </div>

          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar/Exportar
          </Button>
          <Link to={createPageUrl("NewContract")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <ContractFilters
        filters={filters}
        onFiltersChange={setFilters}
        contracts={contracts}
      />

      {/* Table */}
      <ContractTable
        contracts={filteredContracts}
        isLoading={isLoading}
        clientView={clientView}
      />

      {/* Import Dialog */}
      <ImportExportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        contracts={contracts}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}