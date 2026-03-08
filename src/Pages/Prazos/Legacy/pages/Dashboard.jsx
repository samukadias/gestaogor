import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Contract } from "@/Entities/Contract";
import { User } from "@/Entities/User";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl, formatCurrency, formatCompactCurrency } from "@/utils/legacy";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Plus,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays, format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import StatsCard from "../components/dashboard/StatsCard";
import ContractAlerts from "../components/dashboard/ContractAlerts";
import RecentContracts from "../components/dashboard/RecentContracts";
import FinancialOverview from "../components/dashboard/FinancialOverview";
import ContractsExpiringChart from "../components/dashboard/ContractsExpiringChart";
import DexAlert from "../components/dashboard/DexAlert";

import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [analystFilter, setAnalystFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const navigate = useNavigate();

  const { data: allContracts = [], isLoading } = useQuery({
    queryKey: ['cocr-contracts', user?.id, user?.role, user?.department],
    queryFn: async () => {
      let contractData = await Contract.list("-created_date");

      const department = user.department;
      const role = user.role;
      const userName = (user.name || user.full_name || "").trim().toLowerCase();
      const userEmail = (user.email || "").trim().toLowerCase();
      const canViewAll = department === 'GOR' || (department === 'COCR' && role === 'manager') || user.perfil === 'GESTOR';

      if (!canViewAll) {
        if (role === 'analyst' || user.perfil === 'ANALISTA') {
          contractData = contractData.filter(c => {
            const cAnalyst = (c.analista_responsavel || "").trim().toLowerCase();
            return cAnalyst === userName || cAnalyst === userEmail;
          });
        } else if (role === 'client') {
          contractData = contractData.filter(c => {
            const cClient = (c.cliente || "").trim().toLowerCase();
            return cClient === userName;
          });
        }
      }
      return contractData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min — compartilhado via React Query cache
  });

  // Alias para manter compatibilidade com o restante do componente
  const contracts = allContracts;

  // Extrai analistas únicos para o filtro de analista
  const activeAnalysts = useMemo(() => {
    const analysts = contracts
      .map(c => c.analista_responsavel)
      .filter(name => name && name.trim() !== "");
    return [...new Set(analysts)].sort();
  }, [contracts]);


  // Contratos filtrados pelo analista selecionado (afeta cards e gráfico)
  const filteredContracts = useMemo(() => {
    if (analystFilter === "all") return contracts;
    return contracts.filter(c => c.analista_responsavel === analystFilter);
  }, [contracts, analystFilter]);

  const getContractStats = () => {
    const today = new Date();
    const activeContracts = filteredContracts.filter(c => c.status === "Ativo");
    const expiredContracts = filteredContracts.filter(c => c.status === "Expirado");

    const expiringContracts = activeContracts.filter(contract => {
      if (!contract.data_fim_efetividade) return false;
      const daysUntilExpiry = differenceInDays(new Date(contract.data_fim_efetividade), today);
      return daysUntilExpiry <= 60 && daysUntilExpiry >= 0;
    });

    const totalValue = activeContracts.reduce((sum, contract) => sum + (contract.valor_contrato || 0), 0);
    const totalBilled = activeContracts.reduce((sum, contract) => sum + (contract.valor_faturado || 0), 0);

    return {
      total: filteredContracts.length,
      active: activeContracts.length,
      expired: expiredContracts.length,
      expiring: expiringContracts.length,
      totalValue,
      totalBilled
    };
  };

  const stats = getContractStats();
  const billingProgress = stats.totalValue > 0 ? (stats.totalBilled / stats.totalValue) * 100 : 0;

  const getDashboardTitle = () => {
    if (user?.role === "client") return "Meu Painel";
    if (user?.role === "analyst") return "Meus Contratos";
    return "Dashboard COCR";
  };

  const isManager = user?.department === 'GOR' || (user?.department === 'COCR' && user?.role === 'manager') || user?.perfil === 'GESTOR';

  const selectedMonthContracts = useMemo(() => {
    if (selectedMonth === null) return [];

    const currentYear = new Date().getFullYear();
    return filteredContracts.filter(contract => {
      if (!contract.data_fim_efetividade) return false;
      const date = parseISO(contract.data_fim_efetividade);
      return isValid(date) && date.getFullYear() === currentYear && date.getMonth() === selectedMonth;
    }).sort((a, b) => new Date(a.data_fim_efetividade) - new Date(b.data_fim_efetividade));
  }, [selectedMonth, filteredContracts]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
          <p className="text-gray-600 mt-1">
            {isManager ? "Visão Geral de Prazos e Contratos" : "Acompanhamento de Contratos"}
          </p>
        </div>
        {/* Apenas Gestores e Analistas podem criar contratos. Clientes não. */}
        {(isManager || user?.role === 'analyst') && (
          <div className="flex gap-3">
            <Link to={createPageUrl("NewContract")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Contrato
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Alerta DEX - Apenas para Gestores */}
      {isManager && (
        <DexAlert contracts={contracts} isLoading={isLoading} />
      )}


      {/* CARDS SIMPLE DASHBOARD (Visible to ALL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Contratos"
          value={stats.total}
          icon={FileText}
          color="blue"
          isLoading={isLoading}
          onClick={() => navigate(createPageUrl("Contracts"))}
        />
        <StatsCard
          title="Contratos Ativos"
          value={stats.active}
          icon={TrendingUp}
          color="green"
          isLoading={isLoading}
          onClick={() => navigate(createPageUrl("Contracts") + "?status=Ativo")}
        />
        <StatsCard
          title="Vencendo em 2 Meses"
          value={stats.expiring}
          icon={Calendar}
          color="orange"
          isLoading={isLoading}
          onClick={() => navigate(createPageUrl("Contracts") + "?vencimento=expiring")}
        />
        <StatsCard
          title="Valor Total dos Contratos"
          value={formatCompactCurrency(stats.totalValue)}
          fullValue={formatCurrency(stats.totalValue)}
          icon={DollarSign}
          color="purple"
          isLoading={isLoading}
          progress={billingProgress} // Only relevant if billing data exists
        />
      </div>

      {/* DETAILED VIEWS - ONLY FOR MANAGERS */}
      {isManager && (
        <>
          {/* Gráfico de Vencimentos */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Previsão de Vencimentos</h2>

              <div className="w-full sm:w-64">
                <Select value={analystFilter} onValueChange={setAnalystFilter}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Filtrar por analista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Analistas</SelectItem>
                    {activeAnalysts.map((analyst) => (
                      <SelectItem key={analyst} value={analyst}>
                        {analyst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ContractsExpiringChart
              contracts={filteredContracts}
              isLoading={isLoading}
              onMonthClick={(monthIndex) => setSelectedMonth(monthIndex === selectedMonth ? null : monthIndex)}
            />

            {selectedMonth !== null && (
              <div className="mt-4 bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex justify-between items-center">
                  <h3 className="font-semibold text-indigo-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Contratos vencendo em {format(new Date(new Date().getFullYear(), selectedMonth, 1), "MMMM 'de' yyyy", { locale: ptBR })}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {selectedMonthContracts.length} registro(s)
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(null)} className="h-7 text-xs text-indigo-400 hover:text-indigo-600">
                      Fechar
                    </Button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {selectedMonthContracts.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Contrato / Cliente</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Analista</th>
                          <th className="px-4 py-3 font-semibold">Vencimento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedMonthContracts.map((c) => (
                          <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{c.contrato}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{c.cliente}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                ${c.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                                  c.status === 'Expirado' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                                {c.status || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {c.analista_responsavel || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-slate-700">
                                {format(parseISO(c.data_fim_efetividade), "dd/MM/yyyy")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Nenhum contrato vencendo neste mês.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ContractAlerts contracts={filteredContracts} isLoading={isLoading} />
              <RecentContracts contracts={filteredContracts} isLoading={isLoading} />
            </div>
            <div>
              <FinancialOverview contracts={filteredContracts} isLoading={isLoading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
