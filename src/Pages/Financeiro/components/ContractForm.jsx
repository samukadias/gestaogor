import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fluxoApi } from '@/api/fluxoClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Save, FileText, Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import EspManager from './EspManager';

export default function ContractForm({ contract, onSubmit, isLoading }) {
    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: () => fluxoApi.entities.Client.list('-created_at')
    });

    const { data: analysts = [] } = useQuery({
        queryKey: ['cvac-analysts'],
        queryFn: () => fluxoApi.entities.User.list({
            role: 'analyst',
            department: 'CVAC'
        })
    });

    // Buscar contratos de Prazos para obter PDs por cliente
    const { data: prazosContracts = [] } = useQuery({
        queryKey: ['deadline-contracts'],
        queryFn: () => fluxoApi.entities.Contract.list(),
        select: (data) => {
            // Filtrar apenas contratos que têm cliente e contrato (PD)
            return data.filter(c => c.cliente && c.contrato);
        }
    });

    const { user } = useAuth();

    const [formData, setFormData] = useState({
        client_name: '',
        pd_number: '',
        responsible_analyst: user?.name || user?.full_name || '',
        gestor_email: '',
        esps: [],
        // Campos preenchidos automaticamente do COCR ao selecionar o PD:
        cocr_contract_id: null,
        grupo_cliente: '',
        termo: '',
        objeto: '',
        data_inicio_efetividade: '',
        data_fim_efetividade: '',
        status_vigencia: '',
    });

    const [availablePDs, setAvailablePDs] = useState([]);
    const [openClientCombo, setOpenClientCombo] = useState(false);

    useEffect(() => {
        if (contract) {
            let parsedEsps = [];
            if (Array.isArray(contract.esps)) {
                parsedEsps = contract.esps;
            } else if (typeof contract.esps === 'string') {
                try {
                    parsedEsps = JSON.parse(contract.esps);
                } catch (e) {
                    parsedEsps = [];
                }
            }

            setFormData({
                client_name: contract.client_name || '',
                pd_number: contract.pd_number || '',
                responsible_analyst: contract.responsible_analyst || '',
                gestor_email: contract.gestor_email || '',
                esps: parsedEsps,
                cocr_contract_id: contract.cocr_contract_id || null,
                grupo_cliente: contract.grupo_cliente || '',
                termo: contract.termo || '',
                objeto: contract.objeto || '',
                data_inicio_efetividade: contract.data_inicio_efetividade || '',
                data_fim_efetividade: contract.data_fim_efetividade || '',
                status_vigencia: contract.status_vigencia || '',
            });
        } else if (user) {
            // Se for novo contrato (não tem contract prop), preenche com o usuário logado
            // Mas só se o campo ainda estiver vazio
            setFormData(prev => {
                if (!prev.responsible_analyst) {
                    return {
                        ...prev,
                        responsible_analyst: user.full_name || user.name || ''
                    };
                }
                return prev;
            });
        }
    }, [contract, user]);

    // Atualizar PDs disponíveis quando o cliente mudar
    useEffect(() => {
        if (formData.client_name && prazosContracts.length > 0) {
            const clientPDs = prazosContracts
                .filter(c => c.cliente === formData.client_name)
                .map(c => c.contrato)
                .filter(Boolean);

            const uniquePDs = [...new Set(clientPDs)];
            setAvailablePDs(uniquePDs);

            // Fetch the specific contract object to auto-fill ESPs from COCR
            const getSelectedContractEsps = (pd) => {
                const c = prazosContracts.find(c => c.cliente === formData.client_name && c.contrato === pd);
                if (!c || !c.esps) return [];

                if (Array.isArray(c.esps)) return c.esps;
                try {
                    return JSON.parse(c.esps);
                } catch {
                    return [];
                }
            };

            // Se houver apenas um PD, preencher automaticamente
            if (uniquePDs.length === 1 && !formData.pd_number) {
                setFormData(prev => ({
                    ...prev,
                    pd_number: uniquePDs[0],
                    esps: prev.esps.length === 0 ? getSelectedContractEsps(uniquePDs[0]) : prev.esps
                }));
            }
        } else {
            setAvailablePDs([]);
        }
    }, [formData.client_name, prazosContracts]);

    // Handle manual PD number change to load ESPs from COCR
    const handlePdNumberChange = (value) => {
        const selectedContract = prazosContracts.find(c => c.cliente === formData.client_name && c.contrato === value);
        let coCrEsps = [];

        if (selectedContract && selectedContract.esps) {
            let rawEsps = [];
            if (Array.isArray(selectedContract.esps)) {
                rawEsps = selectedContract.esps;
            } else {
                try { rawEsps = JSON.parse(selectedContract.esps); } catch { }
            }
            // Garantir que cada ESP tenha o campo esp_value (CVAC) que o COCR não tem
            coCrEsps = rawEsps.map(esp => ({
                esp_number: esp.esp_number || esp.number || '',
                object_description: esp.object_description || esp.description || '',
                esp_value: esp.esp_value || '',
            }));
        }

        setFormData(prev => ({
            ...prev,
            pd_number: value,
            esps: coCrEsps,
            // Carrega dados do COCR automaticamente
            cocr_contract_id: selectedContract?.id || null,
            grupo_cliente: selectedContract?.grupo_cliente || '',
            termo: selectedContract?.termo || '',
            objeto: selectedContract?.objeto_contrato || selectedContract?.objeto || '',
            data_inicio_efetividade: selectedContract?.data_inicio_efetividade || '',
            data_fim_efetividade: selectedContract?.data_fim_efetividade || '',
            status_vigencia: selectedContract?.status || '',
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare payload with stringified JSON for JSONB columns to avoid driver issues
        const payload = {
            ...formData,
            esps: JSON.stringify(formData.esps || [])
        };

        // Enviar apenas os campos que existem na tabela finance_contracts
        onSubmit(payload);
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Obter lista única de clientes dos contratos
    const availableClients = React.useMemo(() => {
        return [...new Set(prazosContracts.map(c => c.cliente).filter(Boolean))].sort();
    }, [prazosContracts]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Dados do Cliente
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="client_name" className="text-slate-700">
                                Cliente *
                            </Label>
                            <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openClientCombo}
                                        className="w-full justify-between h-10 font-normal px-3 mt-1"
                                    >
                                        <span className="truncate">
                                            {formData.client_name || "Selecione um cliente..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar cliente..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                {availableClients.map((clientName) => (
                                                    <CommandItem
                                                        key={clientName}
                                                        value={clientName}
                                                        onSelect={() => {
                                                            updateField('client_name', clientName);
                                                            setOpenClientCombo(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.client_name === clientName ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {clientName}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="pd_number" className="text-slate-700">
                                Número do PD *
                            </Label>
                            {availablePDs.length > 0 ? (
                                <Select
                                    value={formData.pd_number}
                                    onValueChange={(value) => handlePdNumberChange(value)}
                                    required
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione um PD cadastrado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availablePDs.map((pd) => (
                                            <SelectItem key={pd} value={pd}>
                                                {pd}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="pd_number"
                                    value={formData.pd_number}
                                    onChange={(e) => updateField('pd_number', e.target.value)}
                                    placeholder={formData.client_name ? "Nenhum PD cadastrado para este cliente" : "Selecione um cliente primeiro"}
                                    className="mt-1"
                                    required
                                    disabled={!formData.client_name}
                                />
                            )}
                        </div>
                        <div>
                            <Label htmlFor="responsible_analyst" className="text-slate-700">
                                Analista Responsável *
                            </Label>
                            <Select
                                value={formData.responsible_analyst}
                                onValueChange={(value) => updateField('responsible_analyst', value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Selecione um analista" />
                                </SelectTrigger>
                                <SelectContent>
                                    {user && (user.name || user.full_name) && !analysts.find(a => a.name === (user.name || user.full_name)) && (
                                        <SelectItem value={user.name || user.full_name}>
                                            {user.name || user.full_name}
                                        </SelectItem>
                                    )}
                                    {analysts.map((analyst) => (
                                        <SelectItem key={analyst.id} value={analyst.name}>
                                            {analyst.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Card COCR unificado — largura total, aparece ao selecionar o PD */}
                    {(() => {
                        const sc = prazosContracts.find(
                            c => c.cliente === formData.client_name && c.contrato === formData.pd_number
                        );
                        if (!sc) return null;

                        const startDate = sc.data_inicio_efetividade ? new Date(sc.data_inicio_efetividade) : null;
                        const endDate = sc.data_fim_efetividade ? new Date(sc.data_fim_efetividade) : null;
                        const months = startDate && endDate
                            ? (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
                            : null;
                        const isAtivo = sc.status === 'Ativo' || sc.status === 'ativo' || sc.status_vencimento === 'Dentro do prazo';

                        return (
                            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600/10 border-b border-blue-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Dados do COCR — Preenchidos Automaticamente</span>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${isAtivo
                                        ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                                        : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                                        }`}>
                                        {sc.status || sc.status_vencimento || 'N/A'}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {sc.objeto && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Objeto do Contrato</span>
                                            <p className="text-slate-800 text-sm font-medium leading-relaxed line-clamp-2">{sc.objeto}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 pt-2 border-t border-blue-100/70">
                                        {sc.grupo_cliente && (
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sigla / Grupo</span>
                                                <p className="font-bold text-blue-700 text-sm mt-0.5">{sc.grupo_cliente}</p>
                                            </div>
                                        )}
                                        {sc.termo && (
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Termo</span>
                                                <p className="font-semibold text-slate-700 text-sm mt-0.5">{sc.termo}</p>
                                            </div>
                                        )}
                                        {(startDate || endDate) && (
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vigência</span>
                                                <p className="font-semibold text-slate-700 text-sm mt-0.5">
                                                    {startDate ? startDate.toLocaleDateString('pt-BR') : '?'}
                                                    {' → '}
                                                    {endDate ? endDate.toLocaleDateString('pt-BR') : '?'}
                                                </p>
                                                {months !== null && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{months} {months === 1 ? 'mês' : 'meses'}</p>
                                                )}
                                            </div>
                                        )}
                                        {sc.valor_contrato && (
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Valor Global</span>
                                                <p className="font-bold text-slate-800 text-sm mt-0.5">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sc.valor_contrato)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {(sc.numero_processo_sei_nosso || sc.sei) && (
                                        <div className="pt-2 border-t border-blue-100/70">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Processo SEI (COCR)</span>
                                            <p className="font-mono text-xs text-slate-600 mt-0.5">{sc.numero_processo_sei_nosso || sc.sei}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* E-mail / SEI do Gestor */}
                    <div>
                        <Label htmlFor="gestor_email" className="text-slate-700">
                            Endereço SEI ou E-mail do Gestor
                        </Label>
                        <Input
                            id="gestor_email"
                            value={formData.gestor_email}
                            onChange={(e) => updateField('gestor_email', e.target.value)}
                            placeholder="Ex: sei@orgao.gov.br ou fulano@empresa.com.br"
                            className="mt-1"
                        />
                    </div>
                </CardContent>
            </Card>



            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-slate-800">ESPs do Contrato</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <EspManager
                        esps={formData.esps}
                        onChange={(esps) => updateField('esps', esps)}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl shadow-lg shadow-blue-600/20"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Contrato'}
                </Button>
            </div>
        </form >
    );
}
