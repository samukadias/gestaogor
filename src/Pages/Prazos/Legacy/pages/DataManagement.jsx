import React, { useState, useEffect } from "react";
import { Contract } from "@/entities/Contract";
import { TermoConfirmacao } from "@/entities/TermoConfirmacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, AlertTriangle, RefreshCw, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DataManagement() {
  const [contracts, setContracts] = useState([]);
  const [tcs, setTcs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Transfer States
  const [analysts, setAnalysts] = useState([]);
  const [sourceAnalyst, setSourceAnalyst] = useState("");
  const [targetAnalyst, setTargetAnalyst] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Transfer Client States
  const [clients, setClients] = useState([]);
  const [sourceClient, setSourceClient] = useState("");
  const [targetAnalystForClient, setTargetAnalystForClient] = useState("");
  const [isTransferringClient, setIsTransferringClient] = useState(false);

  // Transfer Client Group States
  const [clientGroups, setClientGroups] = useState([]);
  const [sourceClientGroup, setSourceClientGroup] = useState("");
  const [targetAnalystForGroup, setTargetAnalystForGroup] = useState("");
  const [isTransferringGroup, setIsTransferringGroup] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const storedUser = localStorage.getItem('fluxo_user') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUserRole(userObj.role);
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const contractsData = await Contract.list();
      const tcsData = await TermoConfirmacao.list();
      setContracts(contractsData);
      setTcs(tcsData);

      // Extract unique analysts
      const uniqueAnalysts = [...new Set(contractsData.map(c => c.analista_responsavel).filter(Boolean))].sort();
      setAnalysts(uniqueAnalysts);

      // Extract unique clients
      const uniqueClients = [...new Set(contractsData.map(c => c.cliente).filter(Boolean))].sort();
      setClients(uniqueClients);

      // Extract unique client groups
      const uniqueClientGroups = [...new Set(contractsData.map(c => c.grupo_cliente).filter(Boolean))].sort();
      setClientGroups(uniqueClientGroups);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados.");
    }
    setIsLoading(false);
  };


  const handleMigrateFromLocalStorage = async () => {
    // Funcionalidade descontinuada
    toast.info("Esta funcionalidade foi descontinuada na versão atual do sistema.");
  };

  const handleTransferPortfolio = async () => {
    if (!sourceAnalyst || !targetAnalyst) {
      toast.error("Selecione os analistas de origem e destino.");
      return;
    }

    if (sourceAnalyst === targetAnalyst) {
      toast.error("Os analistas de origem e destino devem ser diferentes.");
      return;
    }

    setIsTransferring(true);
    try {
      // 1. Get contracts to count
      const contractsToTransfer = contracts.filter(c => c.analista_responsavel === sourceAnalyst);
      const count = contractsToTransfer.length;

      if (count === 0) {
        toast.warning(`O analista ${sourceAnalyst} não possui contratos.`);
        setIsTransferring(false);
        return;
      }

      // 2. Perform Update via API (Loop)
      const updatePromises = contractsToTransfer.map(c => {
        // Preserva todos os dados do contrato, alterando apenas o analista
        const updatedContract = { ...c, analista_responsavel: targetAnalyst };
        return Contract.update(c.id, updatedContract);
      });

      await Promise.all(updatePromises);

      toast.success(`${count} contratos transferidos de ${sourceAnalyst} para ${targetAnalyst}.`);

      // 3. Reset and Reload
      setSourceAnalyst("");
      setTargetAnalyst("");
      await loadData();

    } catch (error) {
      console.error("Erro na transferência:", error);
      toast.error("Erro ao transferir carteira.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferClientPortfolio = async () => {
    if (!sourceClient || !targetAnalystForClient) {
      toast.error("Selecione o cliente e o analista de destino.");
      return;
    }

    setIsTransferringClient(true);
    try {
      // 1. Get contracts to count
      const contractsToTransfer = contracts.filter(c => c.cliente === sourceClient);
      const count = contractsToTransfer.length;

      if (count === 0) {
        toast.warning(`O cliente ${sourceClient} não possui contratos.`);
        setIsTransferringClient(false);
        return;
      }

      // 2. Perform Update via API (Loop)
      const updatePromises = contractsToTransfer.map(c => {
        const updatedContract = { ...c, analista_responsavel: targetAnalystForClient };
        return Contract.update(c.id, updatedContract);
      });

      await Promise.all(updatePromises);

      toast.success(`${count} contratos do cliente ${sourceClient} transferidos para ${targetAnalystForClient}.`);

      // 3. Reset and Reload
      setSourceClient("");
      setTargetAnalystForClient("");
      await loadData();

    } catch (error) {
      console.error("Erro na transferência de cliente:", error);
      toast.error("Erro ao transferir contratos do cliente.");
    } finally {
      setIsTransferringClient(false);
    }
  };

  const handleTransferClientGroupPortfolio = async () => {
    if (!sourceClientGroup || !targetAnalystForGroup) {
      toast.error("Selecione o grupo de cliente e o analista de destino.");
      return;
    }

    setIsTransferringGroup(true);
    try {
      // 1. Get contracts to count
      const contractsToTransfer = contracts.filter(c => c.grupo_cliente === sourceClientGroup);
      const count = contractsToTransfer.length;

      if (count === 0) {
        toast.warning(`O grupo ${sourceClientGroup} não possui contratos.`);
        setIsTransferringGroup(false);
        return;
      }

      // 2. Perform Update via API (Loop)
      const updatePromises = contractsToTransfer.map(c => {
        const updatedContract = { ...c, analista_responsavel: targetAnalystForGroup };
        return Contract.update(c.id, updatedContract);
      });

      await Promise.all(updatePromises);

      toast.success(`${count} contratos do grupo ${sourceClientGroup} transferidos para ${targetAnalystForGroup}.`);

      // 3. Reset and Reload
      setSourceClientGroup("");
      setTargetAnalystForGroup("");
      await loadData();

    } catch (error) {
      console.error("Erro na transferência de grupo:", error);
      toast.error("Erro ao transferir contratos do grupo.");
    } finally {
      setIsTransferringGroup(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Dados</h1>
        <p className="text-gray-600 mt-1">Gerencie os dados do sistema</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Status dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Total de Contratos</p>
                    <p className="text-sm text-gray-600">Registros no sistema</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? "..." : contracts.length}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Total de TCs</p>
                    <p className="text-sm text-gray-600">Registros no sistema</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? "..." : tcs.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Dados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {userRole !== 'viewer' && (
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="portfolio">Por Carteira</TabsTrigger>
              <TabsTrigger value="client">Por Cliente</TabsTrigger>
              <TabsTrigger value="group">Por Grupo</TabsTrigger>
            </TabsList>

            {/* Transferência de Carteira */}
            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Transferência de Carteira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Transfira todos os contratos de um analista para outro. Útil em casos de férias, desligamento ou redistribuição.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Analista de Origem (Quem sai)</Label>
                      <Select value={sourceAnalyst} onValueChange={setSourceAnalyst}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o analista..." />
                        </SelectTrigger>
                        <SelectContent>
                          {analysts.map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-center pb-2 md:pb-0">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <Label>Analista de Destino (Quem assume)</Label>
                      <div className="flex gap-2">
                        <Select value={targetAnalyst} onValueChange={setTargetAnalyst}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione ou digite..." />
                          </SelectTrigger>
                          <SelectContent>
                            {analysts.filter(a => a !== sourceAnalyst).map(a => (
                              <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ou digite um novo nome para o destino:</Label>
                    <Input
                      placeholder="Nome do novo analista (opcional)"
                      value={targetAnalyst}
                      onChange={(e) => setTargetAnalyst(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Selecione na lista acima OU digite um novo nome.</p>
                  </div>


                  <div className="flex justify-end pt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={isTransferring || !sourceAnalyst || !targetAnalyst || sourceAnalyst === targetAnalyst}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {isTransferring ? "Transferindo..." : "Realizar Transferência"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Transferência</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você está prestes a transferir <strong>TODOS</strong> os contratos de <span className="font-bold text-purple-600">{sourceAnalyst}</span> para <span className="font-bold text-purple-600">{targetAnalyst}</span>.
                            <br /><br />
                            Contratos afetados: {contracts.filter(c => c.analista_responsavel === sourceAnalyst).length}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleTransferPortfolio} className="bg-purple-600 hover:bg-purple-700">
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>

              </Card>
            </TabsContent>

            {/* Transferência de Cliente para Analista */}
            <TabsContent value="client">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Transferência por Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Transfira todos os contratos de um determinado Cliente para um Analista específico.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Cliente (Origem)</Label>
                      <Select value={sourceClient} onValueChange={setSourceClient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-center pb-2 md:pb-0">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <Label>Analista de Destino</Label>
                      <Select value={targetAnalystForClient} onValueChange={setTargetAnalystForClient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o analista..." />
                        </SelectTrigger>
                        <SelectContent>
                          {analysts.map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="bg-indigo-600 hover:bg-indigo-700"
                          disabled={isTransferringClient || !sourceClient || !targetAnalystForClient}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {isTransferringClient ? "Transferindo..." : "Transf. Cliente -> Analista"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Transferência de Cliente</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você está prestes a transferir <strong>TODOS</strong> os contratos do cliente <span className="font-bold text-indigo-600">{sourceClient}</span> para o analista <span className="font-bold text-indigo-600">{targetAnalystForClient}</span>.
                            <br /><br />
                            Contratos afetados: {contracts.filter(c => c.nome_cliente === sourceClient).length}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleTransferClientPortfolio} className="bg-indigo-600 hover:bg-indigo-700">
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transferência de Grupo de Cliente para Analista */}
            <TabsContent value="group">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Transferência por Grupo de Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Transfira todos os contratos de um determinado <strong>Grupo Econômico</strong> para um Analista específico.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Grupo Cliente (Origem)</Label>
                      <Select value={sourceClientGroup} onValueChange={setSourceClientGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clientGroups.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-center pb-2 md:pb-0">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <Label>Analista de Destino</Label>
                      <Select value={targetAnalystForGroup} onValueChange={setTargetAnalystForGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o analista..." />
                        </SelectTrigger>
                        <SelectContent>
                          {analysts.map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="bg-orange-600 hover:bg-orange-700"
                          disabled={isTransferringGroup || !sourceClientGroup || !targetAnalystForGroup}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {isTransferringGroup ? "Transferindo..." : "Transf. Grupo -> Analista"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Transferência de Grupo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você está prestes a transferir <strong>TODOS</strong> os contratos do grupo <span className="font-bold text-orange-600">{sourceClientGroup}</span> para o analista <span className="font-bold text-orange-600">{targetAnalystForGroup}</span>.
                            <br /><br />
                            Contratos afetados: {contracts.filter(c => c.grupo_cliente === sourceClientGroup).length}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleTransferClientGroupPortfolio} className="bg-orange-600 hover:bg-orange-700">
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {userRole !== 'viewer' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-500" />
                Migração de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Se você tem dados salvos no navegador (localStorage) e quer transferi-los para a base oficial, utilize a ferramenta abaixo.
                  <br />
                  <strong>Nota:</strong> Esta ação é voltada para versões antigas do sistema.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={handleMigrateFromLocalStorage}
                  disabled={isMigrating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isMigrating ? "Migrando..." : "Migrar do Navegador"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
