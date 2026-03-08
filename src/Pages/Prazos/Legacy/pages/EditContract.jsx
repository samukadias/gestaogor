import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Contract } from "@/entities/Contract";
import { User } from "@/entities/User";
import { TermoConfirmacao } from "@/entities/TermoConfirmacao";
import { useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils/legacy";
import { ArrowLeft, Save, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ContractForm from "../components/contracts/ContractForm";

export default function EditContract() {
  const navigate = useNavigate();
  const { id: contractId } = useParams();

  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [executedValue, setExecutedValue] = useState(0);

  // Renewal State
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [newContractNumber, setNewContractNumber] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    const fetchContractAndUsers = async () => {
      setIsLoading(true);
      try {
        if (!contractId) {
          console.error('ID do contrato não fornecido');
          navigate(createPageUrl("Contracts"));
          return;
        }

        console.log('Buscando contrato com ID:', contractId);

        const [contractData, allUsers, loggedUser, allTCs] = await Promise.all([
          Contract.get(contractId),
          User.list(),
          User.me(),
          TermoConfirmacao.list()
        ]);
        if (!contractData) {
          console.error('Contrato não encontrado:', contractId);
          setContract(null);
          return;
        }

        console.log('Contrato encontrado:', contractData);

        // Format dates
        if (contractData.data_inicio_efetividade) contractData.data_inicio_efetividade = contractData.data_inicio_efetividade.split('T')[0];
        if (contractData.data_fim_efetividade) contractData.data_fim_efetividade = contractData.data_fim_efetividade.split('T')[0];
        if (contractData.data_limite_andamento) contractData.data_limite_andamento = contractData.data_limite_andamento.split('T')[0];

        // Calculate executed value from TCs for reference or default
        const contractTCs = allTCs.filter(tc =>
          String(tc.contrato_associado_pd).trim() === String(contractData.contrato).trim()
        );
        const totalTCsValue = contractTCs.reduce((sum, tc) => sum + (tc.valor_total || 0), 0);

        // Prioritize the value stored in the database if it exists (allows manual overrides)
        // Only use the calculated totalTCsValue if the DB value is 0 or null
        const finalExecutedValue = (contractData.valor_faturado && contractData.valor_faturado > 0)
          ? contractData.valor_faturado
          : totalTCsValue;

        setExecutedValue(finalExecutedValue);

        // Ensure contract data reflects the value we decided to use
        contractData.valor_faturado = finalExecutedValue;

        // Recalculate 'valor_a_faturar' based on the decided 'valor_faturado'
        contractData.valor_a_faturar = (contractData.valor_contrato || 0) - finalExecutedValue;

        setContract(contractData);

        if (loggedUser?.role === 'viewer') {
          toast.error("Acesso negado: Perfil de visualização");
          navigate(createPageUrl("Contracts"));
          return;
        }

        const filteredUsers = allUsers.filter(
          (user) => {
            const hasRole = user.role === 'analyst' || user.role === 'manager' || user.perfil === 'ANALISTA' || user.perfil === 'GESTOR';
            const validDepartment = user.department === 'COCR' || user.department === 'GOR';
            return hasRole && validDepartment;
          }
        );

        setUsers(filteredUsers);
        setCurrentUser(loggedUser);

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setContract(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractAndUsers();
  }, [contractId, navigate]);

  const handleSubmit = async (contractData) => {
    setIsSubmitting(true);
    try {
      await Contract.update(contract.id, contractData);
      toast.success("Contrato atualizado com sucesso!");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for toast
      navigate(createPageUrl("Contracts"));
    } catch (error) {
      console.error("Erro ao atualizar contrato:", error);
      toast.error("Erro ao atualizar contrato. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await Contract.delete(contract.id);
      navigate(createPageUrl("Contracts"));
    } catch (error) {
      console.error("Erro ao excluir contrato:", error);
      setIsDeleting(false);
    }
  };

  const handleRenewContract = async () => {
    console.log("Iniciando renovação do contrato...", contract);

    if (!newContractNumber.trim()) {
      toast.error("Informe o número do novo contrato.");
      return;
    }

    setIsRenewing(true);
    try {
      // 1. Prepare data for NEW contract (Clone existing but reset financials/status)
      const newContractData = {
        ...contract, // Copy all fields
      };

      // Explicitly remove ID and timestamps to ensure creation of a NEW record
      delete newContractData.id;
      delete newContractData.created_at;
      delete newContractData.updated_at;

      // Overwrite fields for renewal
      newContractData.contrato = newContractNumber.toUpperCase();
      newContractData.contrato_anterior = contract.contrato;
      newContractData.contrato_novo = null;
      newContractData.status = "Ativo";
      newContractData.status_vencimento = "Em dia";
      newContractData.valor_faturado = 0;
      newContractData.valor_cancelado = 0;
      newContractData.valor_a_faturar = contract.valor_contrato;

      console.log("Dados do novo contrato preparados para envio:", newContractData);

      // 2. Create the NEW contract
      const createdContract = await Contract.create(newContractData);
      console.log("Novo contrato criado com sucesso:", createdContract);

      if (!createdContract || !createdContract.id) {
        throw new Error("Falha Crítica: O backend não retornou o ID do novo contrato.");
      }

      // 3. Update the OLD contract
      console.log(`Atualizando status do contrato anterior (ID: ${contract.id})...`);
      await Contract.update(contract.id, {
        status: "Renovado",
        contrato_novo: newContractNumber.toUpperCase()
      });
      console.log("Contrato anterior atualizado com sucesso.");

      toast.success("Contrato renovado com sucesso!");
      setIsRenewDialogOpen(false);

      // 4. Redirect to the NEW contract's edit page
      console.log(`Redirecionando para o novo contrato: ${createdContract.id}`);
      navigate(`${createPageUrl("EditContract")}/${createdContract.id}`);

    } catch (error) {
      console.error("Erro FATAL ao renovar contrato:", error);
      const errorMessage = error.response?.data?.error || error.message || "Erro desconhecido";
      toast.error(`Erro ao renovar contrato: ${errorMessage}`);
    } finally {
      setIsRenewing(false);
    }
  };


  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Contracts"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Contrato</h1>
            <p className="text-gray-600 mt-1">Atualize os dados do contrato selecionado</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not loading and contract is null (e.g., ID not found or error)
  if (!contract) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Contracts"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Contrato</h1>
            <p className="text-gray-600 mt-1">Atualize os dados do contrato selecionado</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 text-center">Contrato não encontrado ou erro ao carregar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(createPageUrl("Contracts"))}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Editar Contrato</h1>
          <p className="text-gray-600 mt-1">Atualize os dados do contrato selecionado</p>
        </div>

        {/* Botão Renovar para Analistas/Gestores e contratos ativos */}

        {((["ANALISTA", "GESTOR", "MANAGER"].includes(currentUser?.perfil)) || (["analyst", "manager", "admin"].includes(currentUser?.role))) && contract.status === "Ativo" && (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setIsRenewDialogOpen(true)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Renovar Contrato
          </Button>
        )}

        {/* Botão Excluir apenas para Gestores */}
        {currentUser?.perfil === "GESTOR" && contract && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={isDeleting}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o contrato <strong>{contract.contrato}</strong>?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
                  {isDeleting ? "Excluindo..." : "Excluir Contrato"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Dados do Contrato
          </CardTitle>
          <CardDescription>Preencha os detalhes do contrato.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContractForm
            initialData={contract}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Atualizar Contrato"
            isEdit={true}
            users={users}
            currentUser={currentUser}
            executedValue={executedValue}
          />
        </CardContent>
      </Card>

      {/* Dialogo de Renovação */}
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Contrato</DialogTitle>
            <DialogDescription>
              Isso irá encerrar o contrato atual ({contract.contrato}) como "Renovado" e criar um novo contrato vinculado a ele.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número do Novo Contrato/PD</Label>
              <Input
                placeholder="Ex: PD-2025/001"
                value={newContractNumber}
                onChange={(e) => setNewContractNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleRenewContract}
              className="bg-green-600 hover:bg-green-700"
              disabled={isRenewing}
            >
              {isRenewing ? "Processando..." : "Confirmar Renovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
