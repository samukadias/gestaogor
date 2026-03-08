import React, { useState, useEffect } from "react";
import { Contract } from "@/entities/Contract";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/legacy";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import ContractForm from "../components/contracts/ContractForm";

export default function NewContract() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await User.list();
        const loggedUser = await User.me();

        if (loggedUser?.role === 'viewer') {
          toast.error("Acesso negado: Perfil de visualização");
          navigate(createPageUrl("Contracts"));
          return;
        }

        const filteredUsers = allUsers.filter(
          (user) => {
            // Aceita role (novo) ou perfil (antigo)
            const hasRole = user.role === 'analyst' || user.role === 'manager' || user.perfil === 'ANALISTA' || user.perfil === 'GESTOR';
            // Filtra por departamento COCR ou GOR (Gerência Geral)
            const validDepartment = user.department === 'COCR' || user.department === 'GOR';

            // Se não tiver departamento definido (legado), assume que é válido se tiver role, ou força COCR se quiser ser estrito
            // Por enquanto, vamos ser estritos com COCR/GOR para atender o pedido
            return hasRole && validDepartment;
          }
        );

        setUsers(filteredUsers);
        setCurrentUser(loggedUser);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    };
    loadUsers();
  }, []);

  const handleSubmit = async (contractData) => {
    console.log('=== INICIANDO CRIAÇÃO DE CONTRATO ===');
    console.log('Dados recebidos:', contractData);

    setIsSubmitting(true);
    try {
      console.log('Chamando Contract.create...');
      const result = await Contract.create(contractData);
      console.log('Contrato criado com sucesso:', result);

      toast.success('Contrato criado com sucesso!');
      navigate(createPageUrl("Contracts"));
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
      console.error("Detalhes do erro:", error.response?.data || error.message);
      toast.error(`Erro ao criar contrato: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Novo Contrato</h1>
          <p className="text-gray-600 mt-1">Cadastre um novo contrato no sistema</p>
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
          <ContractForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Criar Contrato"
            users={users}
            currentUser={currentUser}
          />
        </CardContent>
      </Card>
    </div>
  );
}